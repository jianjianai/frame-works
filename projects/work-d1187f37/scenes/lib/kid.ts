import { C, Ctx, Pt, addBlob, blob, curve, hash, ik2, inkLine, lerp2, oval, paint, poly, shaded, tubePts } from "./draw";

/** The protagonist, after the cover art: big messy brown mop, sleepy heavy-lidded eyes, blue hoodie.
 *  Drawn front-on (or from behind) with jointed arms/legs. (x, y) = head centre; s = 1 → face ≈ 236px wide. */
export type HandShape = "relax" | "fist" | "open" | "hold" | "flat" | "hidden";
export interface KidPose {
  eyes?: "sleepy" | "open" | "wide" | "sad" | "tired" | "teary" | "shut" | "happy" | "angry";
  look?: Pt; // pupils, -1..1
  brows?: "flat" | "sad" | "worried" | "angry" | "up";
  mouth?: "frown" | "flat" | "smile" | "grin" | "laugh" | "o" | "open" | "wobble" | "shout" | "bite" | "blow";
  tilt?: number; // head rotation (rad)
  headY?: number;
  headX?: number;
  turn?: number; // -1..1, head turned toward screen left/right
  blush?: number;
  tears?: number; // 0..1 streams down the cheeks
  wet?: number; // 0..1 soaked by rain
  /** which character: the boy from the cover (default) or the girl */
  who?: "boy" | "girl";
  outfit?: "hoodie" | "rider" | "pajamas" | "cardigan";
  /** girl: sunflower hair clip (default on) */
  clip?: boolean;
  /** girl: freckles (default on) */
  freckles?: boolean;
  helmet?: boolean;
  bandaids?: boolean;
  /** party hat (birthday) */
  hat?: boolean;
  /** hood pulled up over the head */
  hood?: boolean;
  /** white earbuds with wires down to the chest */
  earbuds?: boolean;
  /** 0..1 cream smeared on the face (cake fight) */
  cake?: number;
  view?: "front" | "back";
  body?: "head" | "bust" | "full";
  arms?: "down" | "phone" | "pockets" | "carry" | "reach" | "face" | "table" | "swing" | "up" | "custom";
  /** wrist targets (head units) for arms: "custom" — or to override a preset */
  handL?: Pt;
  handR?: Pt;
  shapeL?: HandShape;
  shapeR?: HandShape;
  /** which way the elbow bends: by default the left elbow goes out to the left/up, the right to the right.
   *  Flip it (e.g. bendL: 1) for an elbow that hangs down — a "V" arm holding something out. */
  bendL?: number;
  bendR?: number;
  legs?: "stand" | "walk" | "run" | "sit" | "sitFloor" | "kneel";
  walk?: number; // gait phase (rad)
  /** drawn after the torso, before the arms (things held against the body) */
  holding?: (ctx: Ctx) => void;
  /** drawn after the arms but before the hands (things gripped by the hands) */
  grip?: (ctx: Ctx) => void;
  seed?: number;
}

// ---------------------------------------------------------------- palette
const K = {
  skin: C.skin,
  skinSh: "#e4c592",
  skinDeep: "#cfa873",
  hair: C.hair,
  hairDk: C.hairDark,
  hairHi: "#a07a45",
  hood: C.hoodie,
  hoodDk: C.hoodieDark,
  hoodHi: "#3d84ad",
  tee: C.tee,
  pants: "#3a3940",
  pantsDk: "#28272d",
  shoe: "#1f1d1f",
  sole: "#ebe6da",
  rider: "#f3b30c",
  riderDk: "#c98c00",
  riderCollar: "#3b3a40",
  reflect: "#e3e7ea",
  eyeWhite: "#f7f3ea",
  iris: "#3a2a1f",
  irisHi: "#7a5839",
};

// ---------------------------------------------------------------- head geometry (head units)
const FACE: Pt[] = [
  [-60, -106], [-104, -74], [-118, -20], [-116, 34], [-104, 78], [-80, 106], [-42, 124], [0, 130],
  [42, 122], [80, 104], [104, 76], [116, 32], [118, -20], [104, -74], [60, -106], [0, -114],
];
/** Outer silhouette of the mop, left temple → over the top → right temple. Like the cover: a soft dome
 *  with small irregular jags all round, longer pointed locks drooping on the right. */
function mopPts(): Pt[] {
  const pts: Pt[] = [[-122, 8]];
  const N = 46;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const a = Math.PI * (0.92 + u * 1.18);
    const right = Math.cos(a) > 0;
    const rx = right ? 166 : 154,
      ry = 140;
    const outer = i % 2 === 0;
    let jag = outer ? 0.035 + hash(i * 3.7 + 2) * 0.05 : -0.012 - hash(i * 5.3 + 1) * 0.022;
    // a few bigger clumps, and longer locks drooping on the right
    if (outer && (i === 4 || i === 10 || i === 18 || i === 30 || i === 36 || i === 40 || i === 44)) jag += 0.06;
    let x = 6 + Math.cos(a) * rx * (1 + jag),
      y = -50 + Math.sin(a) * ry * (1 + jag);
    if (right && Math.sin(a) > -0.55) {
      const k = (Math.sin(a) + 0.55) / 0.9;
      y += (outer ? 26 : 12) * k;
      x -= (outer ? 2 : 6) * k;
    }
    pts.push([x, y]);
  }
  pts.push([150, 36], [132, 20], [122, 6]);
  return pts;
}
const MOP: Pt[] = mopPts();
/** jagged fringe edge, right → left; irregular tips sweeping toward screen-left */
const FRINGE: Pt[] = [
  [122, 6], [112, -30], [98, -4], [90, -38], [72, -10], [64, -42], [42, -2], [34, -42], [14, -12], [6, -46],
  [-18, 2], [-28, -40], [-50, -8], [-60, -38], [-82, -14], [-92, -36], [-110, -6], [-122, 8],
];
const HAIR_CAP: Pt[] = [...MOP, ...FRINGE.slice(1, -1)];
// dark dashes all over the hair, like the cover's texture
const DASHES: [number, number, number][] = Array.from({ length: 34 }, (_, i) => [
  -150 + hash(i * 3.17 + 1) * 310,
  -196 + hash(i * 5.31 + 2) * 170,
  -0.4 + hash(i * 7.77 + 3) * 0.8 + (hash(i * 9.1) > 0.5 ? Math.PI / 2 : 0),
]);

function inHairCap(x: number, y: number) {
  // rough ellipse test so texture stays inside the cap
  return ((x - 6) / 150) ** 2 + ((y + 70) / 128) ** 2 < 1 && y < -46;
}

// ---------------------------------------------------------------- eyes / brows / mouth
const EYE_OPEN: Record<string, [number, number]> = {
  // [openness, slant(+ = inner corner raised = sad)]
  sleepy: [0.3, 0],
  open: [0.78, 0],
  wide: [1.08, 0],
  sad: [0.55, 1],
  tired: [0.16, 0.4],
  teary: [0.66, 1],
  angry: [0.45, -0.7],
};

function eye(ctx: Ctx, cx: number, cy: number, side: number, p: KidPose, seed: number) {
  const st = p.eyes ?? "sleepy";
  const lw = 5;
  if (st === "shut" || st === "happy") {
    if (st === "shut") {
      // closed, drooping (asleep / sad): a soft ∪ with lashes at the outer corner
      inkLine(ctx, [[cx - 28, cy + 2], [cx - 6, cy + 10], [cx + 18, cy + 8], [cx + 30, cy + 2]].map(([x, y]) => [cx + (x - cx) * side, y]) as Pt[], seed, lw);
      inkLine(ctx, [[cx + 22 * side, cy + 6], [cx + 32 * side, cy + 14]], seed + 1, 3);
      inkLine(ctx, [[cx + 12 * side, cy + 9], [cx + 18 * side, cy + 18]], seed + 2, 3);
    } else {
      inkLine(ctx, [[cx - 28, cy + 10], [cx, cy - 8], [cx + 28, cy + 10]], seed, lw);
    }
    inkLine(ctx, [[cx - 20, cy + 30], [cx, cy + 34], [cx + 18, cy + 29]], seed + 3, 2.2, "#b39a84");
    return;
  }
  const girl = p.who === "girl";
  const [open, slant0] = (girl ? EYE_OPEN_G : EYE_OPEN)[st] ?? EYE_OPEN.sleepy;
  const slant = slant0 * 7; // inner corner up
  const look = p.look ?? [0, 0];
  const w = 31;
  const inner = cx - w * side, // inner corner (toward the nose)
    outer = cx + w * side;
  const upTop = cy - 22 * open;
  // eye opening: lower lid curve + upper lid curve (inner corner raised when sad)
  const lower: Pt[] = [[outer, cy + 4], [cx + 14 * side, cy + 14], [cx - 12 * side, cy + 15], [inner, cy + 4]];
  const upper: Pt[] = [[inner, cy + 3 - slant * 0.3], [cx - 14 * side, upTop - slant * 0.9], [cx + 12 * side, upTop + slant * 0.4], [outer, cy + 3]];
  const region = () => blob(ctx, [...lower, ...upper], seed, 0.7);
  ctx.save();
  region();
  ctx.fillStyle = K.eyeWhite;
  ctx.fill();
  ctx.clip();
  // iris + pupil + catchlights
  const ir = girl ? 17.5 : st === "wide" ? 15 : 16;
  const ix = cx + look[0] * 10,
    iy = cy + 4 + look[1] * 5 + (st === "wide" ? -3 : 0);
  ctx.fillStyle = K.iris;
  ctx.beginPath();
  ctx.arc(ix, iy, ir, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = K.irisHi;
  ctx.beginPath();
  ctx.arc(ix, iy + 4, ir * 0.72, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(ix, iy, ir * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(ix - 5, iy - 6, st === "teary" ? 6 : 4.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ix + 5, iy + 5, st === "teary" ? 3.2 : 2, 0, Math.PI * 2);
  ctx.fill();
  if (st === "teary") {
    // pooled tears along the lower lid
    ctx.fillStyle = "rgba(170,220,255,0.55)";
    ctx.fillRect(cx - 40, cy + 8, 80, 12);
  }
  // shadow cast by the upper lid
  ctx.fillStyle = "rgba(120,96,70,0.22)";
  curve(ctx, upper.map(([x, y]) => [x, y + 7]) as Pt[], seed + 4, 0.6);
  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(120,96,70,0.22)";
  ctx.stroke();
  ctx.restore();
  // lids: heavy upper line (a short lash at the outer corner), thin lower line, crease above
  curve(ctx, upper, seed + 1, 0.7);
  paint(ctx, null, C.ink, lw + 0.8);
  inkLine(ctx, [[outer - 1 * side, cy + 3], [outer + 8 * side, cy + 6]], seed + 2, 3.4);
  inkLine(ctx, [lerp2(lower[0], lower[1], 0.1), lower[1], lower[2]], seed + 3, 2.4);
  // heavy lid fold above (his sleepy look) — always there, higher when the eye opens
  inkLine(ctx, [[cx - 22 * side, Math.min(cy - 10, upTop - 6) - slant * 0.9], [cx + 2 * side, Math.min(cy - 13, upTop - 9) - slant * 0.4], [cx + 26 * side, cy - 6]], seed + 5, 2.4, "#b08a5e");
  if (girl) {
    // lashes flicking out from the outer corner
    for (let k = 0; k < 2; k++) {
      const q = lerp2(upper[2], upper[3], 0.55 + k * 0.4);
      inkLine(ctx, [q, [q[0] + (7 + k * 3) * side, q[1] - 8 + k * 3]], seed + 7 + k, 3.2);
    }
    return;
  }
  // eye bags (his trademark)
  inkLine(ctx, [[cx - 20 * side, cy + 26], [cx - 2 * side, cy + 31], [cx + 18 * side, cy + 26]], seed + 6, 2.2, "#b39a84");
}

function brow(ctx: Ctx, cx: number, cy: number, side: number, p: KidPose, seed: number) {
  const st = p.brows ?? (p.eyes === "sad" || p.eyes === "teary" ? "sad" : p.eyes === "wide" ? "up" : p.eyes === "angry" ? "angry" : "flat");
  // inner end / outer end heights
  const [yi, yo] =
    st === "sad" ? [-10, 6] : st === "worried" ? [-6, 2] : st === "angry" ? [8, -8] : st === "up" ? [-12, -10] : [0, -2];
  const inner: Pt = [cx - 22 * side, cy + yi],
    outer: Pt = [cx + 22 * side, cy + yo];
  curve(ctx, [inner, [cx, (inner[1] + outer[1]) / 2 - 4], outer], seed, 0.8);
  ctx.lineCap = "round";
  ctx.strokeStyle = p.who === "girl" ? G.brow : K.hairDk;
  ctx.lineWidth = p.who === "girl" ? 5 : 7;
  ctx.stroke();
}

function mouth(ctx: Ctx, p: KidPose, seed: number, mx: number) {
  const m = p.mouth ?? "frown";
  const x = mx,
    y = 100;
  switch (m) {
    case "frown":
      inkLine(ctx, [[x - 15, y + 5], [x, y - 2], [x + 15, y + 5]], seed, 4);
      break;
    case "flat":
      inkLine(ctx, [[x - 13, y + 1], [x + 13, y]], seed, 4);
      break;
    case "wobble":
      inkLine(ctx, [[x - 20, y + 4], [x - 10, y - 2], [x, y + 3], [x + 10, y - 2], [x + 20, y + 4]], seed, 3.6);
      break;
    case "bite":
      inkLine(ctx, [[x - 16, y + 2], [x, y - 1], [x + 16, y + 2]], seed, 4);
      inkLine(ctx, [[x - 8, y + 6], [x, y + 9], [x + 8, y + 6]], seed + 1, 2.4, "#a47a5c");
      break;
    case "smile":
      inkLine(ctx, [[x - 22, y - 4], [x - 8, y + 6], [x + 8, y + 6], [x + 22, y - 4]], seed, 4.4);
      inkLine(ctx, [[x - 25, y - 7], [x - 21, y - 1]], seed + 1, 2.4);
      inkLine(ctx, [[x + 25, y - 7], [x + 21, y - 1]], seed + 2, 2.4);
      break;
    case "o":
      oval(ctx, x, y + 2, 9, 12, seed, 0.6);
      paint(ctx, "#6b2c2c", C.ink, 3.6);
      break;
    case "blow":
      // pursed lips + puffed cheeks (blowing out candles)
      oval(ctx, x, y + 2, 7, 8, seed, 0.5);
      paint(ctx, "#6b2c2c", C.ink, 3.4);
      for (const side of [-1, 1]) {
        oval(ctx, x + side * 56, y - 16, 22, 16, seed + 2 + side, 0.8);
        paint(ctx, "rgba(240,150,140,0.35)", null);
      }
      break;
    case "grin":
    case "laugh":
    case "open":
    case "shout": {
      const big = m === "laugh" || m === "shout";
      const pts: Pt[] =
        m === "open"
          ? [[x - 18, y + 2], [x - 6, y - 4], [x + 8, y - 4], [x + 18, y + 2], [x + 12, y + 18], [x - 12, y + 18]]
          : m === "shout"
            ? [[x - 22, y - 8], [x, y - 12], [x + 22, y - 8], [x + 20, y + 22], [x, y + 34], [x - 20, y + 22]]
            : [[x - 28, y - 6], [x, y - 2], [x + 28, y - 6], [x + 20, y + (big ? 26 : 14)], [x, y + (big ? 32 : 20)], [x - 20, y + (big ? 26 : 14)]];
      blob(ctx, pts, seed, 0.9);
      paint(ctx, "#5e2228", null);
      ctx.save();
      blob(ctx, pts, seed, 0.9);
      ctx.clip();
      oval(ctx, x, y + (big ? 32 : 20), 16, 10, seed + 5, 0.6);
      paint(ctx, "#e46d6d", null);
      if (m === "grin" || m === "laugh") {
        ctx.fillStyle = "#fffaf0";
        ctx.fillRect(x - 30, y - 14, 60, 11);
      }
      ctx.restore();
      blob(ctx, pts, seed, 0.9);
      paint(ctx, null, C.ink, 4);
      break;
    }
  }
}

// ---------------------------------------------------------------- head
function hairTexture(ctx: Ctx, seed: number, wet: number) {
  // short lock separations rising from the fringe valleys
  for (let i = 1; i < FRINGE.length - 1; i += 2) {
    const [vx, vy] = FRINGE[i];
    inkLine(ctx, [[vx - 2, vy + 2], [vx + 4, vy - 26], [vx + 14, vy - 50]], seed + i, 2.6, K.hairDk);
  }
  // locks on the sides of the dome follow the hair flow outward
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * (i < 4 ? 1.02 + i * 0.1 : 1.6 + (i - 4) * 0.11);
    const r0 = 104,
      r1 = 146;
    inkLine(ctx, [[6 + Math.cos(a) * r0, -52 + Math.sin(a) * r0], [6 + Math.cos(a + 0.05) * (r0 + r1) / 2, -52 + Math.sin(a + 0.05) * (r0 + r1) / 2], [6 + Math.cos(a + 0.12) * r1, -52 + Math.sin(a + 0.12) * r1]], seed + 20 + i, 2.4, K.hairDk);
  }
  // highlight band on the lit (left) side of the dome
  ctx.save();
  ctx.globalAlpha *= 0.85 - wet * 0.3;
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (1.18 + i * 0.07);
    const r = 112 + (i % 2) * 10;
    const x = 6 + Math.cos(a) * r,
      y = -52 + Math.sin(a) * r;
    inkLine(ctx, [[x - 6, y + 10], [x, y], [x + 10, y - 6]], seed + 40 + i, 4, K.hairHi);
  }
  ctx.restore();
  ctx.lineCap = "round";
  ctx.strokeStyle = K.hairDk;
  ctx.lineWidth = 3.2;
  for (const [x, y, a] of DASHES) {
    if (!inHairCap(x, y)) continue;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 5);
    ctx.stroke();
  }
}

function wetMop(pts: Pt[], wet: number): Pt[] {
  if (!wet) return pts;
  // soaked hair: spikes collapse downward and inward
  return pts.map(([x, y]) => {
    const r = Math.hypot(x, y + 40);
    const pull = Math.max(0, r - 130) * 0.45 * wet;
    const a = Math.atan2(y + 40, x);
    return [x - Math.cos(a) * pull, y - Math.sin(a) * pull + 18 * wet * (y < -60 ? 1 : 0.4)] as Pt;
  });
}

function headFront(ctx: Ctx, p: KidPose, seed: number) {
  if (p.who === "girl") {
    ctx.save();
    ctx.translate(p.headX ?? 0, p.headY ?? 0);
    ctx.rotate(p.tilt ?? 0);
    girlHeadFront(ctx, p, seed);
    ctx.restore();
    return;
  }
  const wet = p.wet ?? 0;
  const turn = p.turn ?? 0;
  const fx = turn * 20; // features shift
  ctx.save();
  ctx.translate(p.headX ?? 0, p.headY ?? 0);
  ctx.rotate(p.tilt ?? 0);
  const mop = wetMop(MOP, wet);
  const cap = wetMop(HAIR_CAP, wet);
  if (p.hood) hoodBehind(ctx, seed + 130);
  // back of the mop
  else {
    poly(ctx, mop, seed + 70, 1.4);
    paint(ctx, K.hairDk, C.ink, 6);
  }
  // ears (the far one hides a little when turned)
  for (const side of [-1, 1]) {
    const ex = side * (116 - (side * turn > 0 ? 8 : 0)) + fx * 0.2;
    oval(ctx, ex, 34, 17, 26, seed + side * 2, 0.9);
    paint(ctx, K.skin, C.ink, 4.5);
    inkLine(ctx, [[ex - side * 2, 22], [ex + side * 6, 32], [ex - side * 1, 46]], seed + side * 3, 2.4, K.skinDeep);
  }
  // face + shading
  shaded(
    ctx,
    () => blob(ctx, FACE, seed + 5, 1.1),
    K.skin,
    () => {
      // jaw shade on the far-from-light side
      blob(ctx, [[60, 130], [104, 80], [124, 20], [140, 90], [80, 150]], seed + 6, 1);
      paint(ctx, "rgba(214,170,110,0.35)", null);
      // fringe shadow on the forehead (a zigzag strip just under the fringe)
      poly(ctx, [...(FRINGE.map(([x, y]) => [x + 5, y + 14]) as Pt[]), [-200, -200], [200, -200]], seed + 7, 1);
      ctx.fillStyle = "rgba(196,150,96,0.38)";
      ctx.fill();
    },
    C.ink,
    5.5,
  );
  if (p.blush) {
    ctx.save();
    ctx.globalAlpha *= p.blush;
    for (const side of [-1, 1]) {
      oval(ctx, side * 70 + fx, 76, 22, 12, seed + 8 + side, 0.8);
      paint(ctx, "rgba(240,120,120,0.45)", null);
      for (let k = 0; k < 3; k++) inkLine(ctx, [[side * 70 + fx - 12 + k * 9, 72], [side * 70 + fx - 16 + k * 9, 82]], seed + 9 + k, 2, "rgba(220,90,90,0.7)");
    }
    ctx.restore();
  }
  brow(ctx, -50 + fx, 6, -1, p, seed + 12);
  brow(ctx, 50 + fx, 6, 1, p, seed + 13);
  eye(ctx, -50 + fx, 36, -1, p, seed + 10);
  eye(ctx, 50 + fx, 36, 1, p, seed + 20);
  // nose: a soft hook + shadow
  oval(ctx, 14 + fx * 1.2, 70, 9, 6, seed + 29, 0.5);
  paint(ctx, "rgba(205,160,105,0.45)", null);
  inkLine(ctx, [[4 + fx * 1.2, 52], [14 + fx * 1.2, 66], [5 + fx * 1.2, 72]], seed + 30, 3.4);
  mouth(ctx, p, seed + 31, 6 + fx * 1.1);
  if (p.tears) {
    ctx.save();
    ctx.globalAlpha *= Math.min(1, p.tears * 1.6);
    for (const side of [-1, 1]) {
      const len = 24 + p.tears * 64;
      const x0 = side * 46 + fx;
      curve(ctx, [[x0, 50], [x0 + side * 4, 50 + len * 0.5], [x0 - side * 1, 50 + len]], seed + side * 5, 0.8);
      paint(ctx, null, "#9fd8ff", 7);
      oval(ctx, x0, 54 + len, 5, 7, seed + side * 6, 0.4);
      paint(ctx, "#bfe6ff", null);
    }
    ctx.restore();
  }
  if (p.cake) cakeCream(ctx, p.cake, p, seed + 140);
  // front of the hair (cap + fringe); with the hood up only the fringe peeks out of the rim
  if (p.hood) {
    ctx.save();
    blob(ctx, HOOD_HOLE, seed + 131, 1.4);
    ctx.clip();
    shaded(ctx, () => poly(ctx, cap, seed + 71, 1.4), K.hair, () => hairTexture(ctx, seed + 72, wet), C.ink, 5.5);
    ctx.restore();
    hoodRim(ctx, seed + 130);
  } else shaded(ctx, () => poly(ctx, cap, seed + 71, 1.4), K.hair, () => hairTexture(ctx, seed + 72, wet), C.ink, 5.5);
  if (wet > 0) {
    // drips off the fringe
    for (let i = 0; i < 4; i++) {
      const [tx, ty] = FRINGE[2 + i * 3] ?? [0, 0];
      const k = (hash(seed + i) + (p.walk ?? 0) * 0.05) % 1;
      oval(ctx, tx, ty + 10 + k * 30, 4, 6, seed + 90 + i, 0.4);
      paint(ctx, "rgba(190,225,255,0.9)", null);
    }
  }
  if (p.helmet) helmet(ctx, seed + 100);
  if (p.earbuds) {
    for (const side of [-1, 1]) {
      oval(ctx, side * 118, 44, 11, 11, seed + 110 + side, 0.5);
      paint(ctx, "#fafafa", C.ink, 3);
    }
  }
  if (p.hat) partyHat(ctx, seed + 120);
  ctx.restore();
}

function partyHat(ctx: Ctx, seed: number) {
  ctx.save();
  ctx.translate(-34, -176);
  ctx.rotate(-0.26);
  const cone: Pt[] = [[-66, 34], [0, -160], [66, 34]];
  shaded(ctx, () => poly(ctx, cone, seed, 1.1), "#ff6fa2", () => {
    ctx.strokeStyle = "#ffe05a";
    ctx.lineWidth = 16;
    for (let i = -3; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(-90, -150 + i * 44);
      ctx.lineTo(90, -108 + i * 44);
      ctx.stroke();
    }
  }, C.ink, 5);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    oval(ctx, Math.cos(a) * 12, -162 + Math.sin(a) * 12, 12, 12, seed + i, 0.8);
    paint(ctx, "#fff7c2", C.ink, 2.5);
  }
  ctx.restore();
  inkLine(ctx, [[-96, -120], [-126, -20], [-112, 60], [-62, 122]], seed + 9, 1.6, "#555");
}

/** hood pulled up: back of the hood behind the head, then the rim around the face */
const HOOD_BACK: Pt[] = [[-184, 70], [-198, -90], [-132, -222], [0, -256], [132, -222], [198, -90], [184, 70], [160, 190], [-160, 190]];
const HOOD_HOLE: Pt[] = [[-126, 70], [-134, -36], [-96, -126], [0, -150], [96, -126], [134, -36], [126, 70], [108, 146], [0, 166], [-108, 146]];
function hoodBehind(ctx: Ctx, seed: number) {
  blob(ctx, HOOD_BACK, seed, 1.8);
  paint(ctx, K.hoodDk, C.ink, 5.5);
}
function hoodRim(ctx: Ctx, seed: number) {
  ctx.beginPath();
  addBlob(ctx, HOOD_BACK, seed, 1.8);
  addBlob(ctx, HOOD_HOLE, seed + 1, 1.4);
  ctx.fillStyle = K.hood;
  ctx.fill("evenodd");
  ctx.lineWidth = 5.5;
  ctx.strokeStyle = C.ink;
  ctx.lineJoin = "round";
  ctx.stroke();
  inkLine(ctx, [[-150, 50], [-164, -80], [-110, -186]], seed + 3, 3, K.hoodDk);
  inkLine(ctx, [[150, 60], [162, -70], [118, -180]], seed + 4, 3, K.hoodDk);
}

function cakeCream(ctx: Ctx, k: number, p: KidPose, seed: number) {
  ctx.save();
  ctx.globalAlpha *= Math.min(1, k * 1.4);
  blob(ctx, [[-110, 40], [-70, 0 - 10 * k], [-20, 20], [20, 50], [70, 30], [112, 70], [90, 126], [30, 132], [-40, 116], [-100, 106]], seed, 3);
  paint(ctx, "#fff8f0", "#e7d6c8", 3);
  for (let i = 0; i < 6; i++) {
    oval(ctx, -70 + i * 28, 50 + (i % 2) * 40, 9, 9, seed + 10 + i, 1);
    paint(ctx, i % 2 ? "#ff7aa8" : "#ffd84a", null);
  }
  ctx.restore();
  // keep the (laughing) face readable through the cream
  eye(ctx, -50, 36, -1, { ...p, eyes: "happy" }, seed + 20);
  eye(ctx, 50, 36, 1, { ...p, eyes: "happy" }, seed + 21);
  mouth(ctx, { ...p, mouth: "laugh" }, seed + 22, 6);
}

function headBack(ctx: Ctx, p: KidPose, seed: number) {
  if (p.who === "girl") {
    ctx.save();
    ctx.translate(p.headX ?? 0, p.headY ?? 0);
    ctx.rotate(p.tilt ?? 0);
    girlBackHead(ctx, p, seed);
    ctx.restore();
    return;
  }
  const wet = p.wet ?? 0;
  ctx.save();
  ctx.translate(p.headX ?? 0, p.headY ?? 0);
  ctx.rotate(p.tilt ?? 0);
  for (const side of [-1, 1]) {
    oval(ctx, side * 114, 36, 17, 26, seed + side * 2, 0.9);
    paint(ctx, K.skin, C.ink, 4.5);
  }
  // nape of the neck under the hair
  blob(ctx, [[-60, 60], [60, 60], [56, 140], [-56, 140]], seed + 4, 1);
  paint(ctx, K.skinSh, C.ink, 5);
  const mop = wetMop(MOP, wet);
  // from behind the mop is one big mass with spikes at the nape
  const back: Pt[] = [...mop.slice(0, -2), [126, 40], [100, 70], [76, 60], [52, 92], [24, 70], [0, 100], [-26, 72], [-52, 96], [-80, 62], [-106, 72]];
  shaded(ctx, () => poly(ctx, back, seed + 70, 1.4), K.hair, () => {
    for (let i = 0; i < 7; i++) {
      const x = -120 + i * 40;
      inkLine(ctx, [[x * 0.3, -170], [x * 0.75, -60], [x, 50]], seed + 80 + i, 2.6, K.hairDk);
    }
    ctx.strokeStyle = K.hairDk;
    ctx.lineWidth = 3.2;
    for (const [x, y, a] of DASHES) {
      ctx.beginPath();
      ctx.moveTo(x, y + 80);
      ctx.lineTo(x + Math.cos(a) * 9, y + 80 + Math.sin(a) * 5);
      ctx.stroke();
    }
  }, C.ink, 5.5);
  if (p.helmet) helmet(ctx, seed + 100);
  ctx.restore();
}

/** Yellow delivery-rider helmet (half shell). Head units, head centre at (0,0). */
export function helmet(ctx: Ctx, seed: number) {
  const shell: Pt[] = [[-150, -40], [-150, -110], [-100, -186], [0, -214], [100, -186], [150, -110], [150, -40], [100, -54], [0, -60], [-100, -54]];
  shaded(ctx, () => blob(ctx, shell, seed, 1.2), K.rider, () => {
    blob(ctx, [[40, -200], [150, -120], [150, -40], [90, -50], [110, -130]], seed + 1, 1);
    paint(ctx, K.riderDk, null);
    // vents
    for (const vx of [-50, 0, 50]) {
      blob(ctx, [[vx - 10, -196], [vx + 10, -196], [vx + 8, -150], [vx - 8, -150]], seed + 2 + vx, 0.6);
      paint(ctx, "#3a3a40", null);
    }
  }, C.ink, 6);
  // brim
  blob(ctx, [[-160, -52], [0, -70], [160, -52], [160, -28], [0, -44], [-160, -28]], seed + 6, 1);
  paint(ctx, K.riderCollar, C.ink, 5);
  // chin straps
  inkLine(ctx, [[-148, -30], [-128, 60], [-96, 120]], seed + 7, 4, "#2a2a30");
  inkLine(ctx, [[148, -30], [128, 60], [96, 120]], seed + 8, 4, "#2a2a30");
}

/** The helmet held by its strap (for props: drawn at x,y with scale s). */
export function helmetProp(ctx: Ctx, x: number, y: number, s: number, rot: number, seed = 1500) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.translate(0, 130);
  helmet(ctx, seed);
  ctx.restore();
}

// ---------------------------------------------------------------- hands
/** A hand at the wrist `w`, pointing along `ang`. `mirror` flips the thumb side (left hand). */
function hand(ctx: Ctx, w: Pt, ang: number, shape: HandShape, mirror: boolean, seed: number, bandaid = false, skinCol: string = K.skin) {
  if (shape === "hidden") return;
  ctx.save();
  ctx.translate(w[0], w[1]);
  ctx.rotate(ang);
  if (mirror) ctx.scale(1, -1);
  const skin = skinCol;
  const draw = (pts: Pt[], sd: number) => {
    blob(ctx, pts, sd, 0.8);
  };
  if (shape === "open" || shape === "flat") {
    // palm with fingers (flat = fingers together, for stroking)
    const spread = shape === "open" ? 1 : 0.25;
    const fingers: Pt[][] = [0, 1, 2, 3].map((i) => {
      const a = (i - 1.5) * 0.2 * spread;
      const len = [44, 50, 48, 38][i];
      const bx = 50,
        by = -18 + i * 12;
      return [[bx, by - 6], [bx + Math.cos(a) * len, by - 6 + Math.sin(a) * len], [bx + Math.cos(a) * (len + 6), by + Math.sin(a) * (len + 6)], [bx + Math.cos(a) * len, by + 6 + Math.sin(a) * len], [bx, by + 6]] as Pt[];
    });
    const palm: Pt[] = [[-6, -24], [30, -28], [56, -22], [60, 26], [30, 30], [-6, 22]];
    const thumb: Pt[] = [[10, -20], [30, -44], [48, -56], [56, -48], [40, -26], [26, -12]];
    ctx.lineJoin = "round";
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 9;
    for (const f of [...fingers, palm, thumb]) {
      draw(f, seed++);
      ctx.stroke();
    }
    ctx.fillStyle = skin;
    seed -= 6;
    for (const f of [...fingers, palm, thumb]) {
      draw(f, seed++);
      ctx.fill();
    }
    inkLine(ctx, [[48, -14], [54, 0], [50, 16]], seed + 9, 2, K.skinDeep);
  } else {
    // relaxed / fist / hold: compact back-of-hand with curled fingers
    const curl = shape === "relax" ? 0.4 : 1;
    const palm: Pt[] = [[-6, -24], [26, -30], [50, -26], [62 - 6 * curl, -10], [64 - 6 * curl, 14], [48, 30], [20, 30], [-6, 22]];
    const thumb: Pt[] = shape === "hold" ? [[16, -22], [40, -40], [58, -38], [54, -24], [34, -14]] : [[14, -22], [36, -34], [54, -28], [48, -16], [30, -10]];
    ctx.lineJoin = "round";
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 9;
    draw(palm, seed);
    ctx.stroke();
    draw(thumb, seed + 1);
    ctx.stroke();
    ctx.fillStyle = skin;
    draw(palm, seed);
    ctx.fill();
    draw(thumb, seed + 1);
    ctx.fill();
    // knuckle bumps / finger separations
    for (let i = 0; i < 3; i++) {
      const y = -10 + i * 13;
      inkLine(ctx, [[46 - 4 * curl, y], [60 - 6 * curl, y + 2]], seed + 3 + i, 2.4, "#a8865c");
    }
    inkLine(ctx, [[30, -12], [42, -18]], seed + 7, 2, "#a8865c");
  }
  if (bandaid) {
    ctx.save();
    ctx.translate(36, 6);
    ctx.rotate(0.5);
    blob(ctx, [[-14, -6], [14, -6], [14, 6], [-14, 6]], seed + 20, 0.5);
    paint(ctx, "#f2d2a4", "#b8946a", 2);
    ctx.fillStyle = "#d9b38a";
    for (const dx of [-4, 0, 4]) ctx.fillRect(dx - 1, -2, 2, 2);
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- limbs
function sub(pts: Pt[]): Pt[] {
  // add midpoints so tubes curve smoothly through the joints
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) out.push(pts[i], lerp2(pts[i], pts[i + 1], 0.5));
  out.push(pts[pts.length - 1]);
  return out;
}

interface ArmSpec {
  wrist: Pt;
  bend: number;
  shape: HandShape;
}
function armSpecs(p: KidPose): [ArmSpec, ArmSpec] {
  const a = p.arms ?? "down";
  let L: ArmSpec = { wrist: [-120, 432], bend: -1, shape: "relax" },
    R: ArmSpec = { wrist: [120, 432], bend: 1, shape: "relax" };
  if (a === "phone") {
    L = { wrist: [-58, 330], bend: -1, shape: "hold" };
    R = { wrist: [58, 330], bend: 1, shape: "hold" };
  } else if (a === "pockets") {
    L = { wrist: [-66, 372], bend: -1, shape: "hidden" };
    R = { wrist: [66, 372], bend: 1, shape: "hidden" };
  } else if (a === "carry") {
    L = { wrist: [-40, 318], bend: -1, shape: "flat" };
    R = { wrist: [70, 300], bend: 1, shape: "flat" };
  } else if (a === "reach") {
    R = { wrist: [260, 360], bend: 1, shape: "flat" };
  } else if (a === "face") {
    L = { wrist: [-44, 160], bend: -1, shape: "flat" };
    R = { wrist: [44, 160], bend: 1, shape: "flat" };
  } else if (a === "table") {
    L = { wrist: [-92, 396], bend: -1, shape: "flat" };
    R = { wrist: [92, 396], bend: 1, shape: "flat" };
  } else if (a === "swing") {
    L = { wrist: [-150, 110], bend: -1, shape: "hold" };
    R = { wrist: [150, 110], bend: 1, shape: "hold" };
  } else if (a === "up") {
    L = { wrist: [-196, -150], bend: 1, shape: "open" };
    R = { wrist: [196, -150], bend: -1, shape: "open" };
  }
  if (p.handL) L = { ...L, wrist: p.handL };
  if (p.handR) R = { ...R, wrist: p.handR };
  if (p.shapeL) L = { ...L, shape: p.shapeL };
  if (p.shapeR) R = { ...R, shape: p.shapeR };
  if (p.bendL) L = { ...L, bend: p.bendL };
  if (p.bendR) R = { ...R, bend: p.bendR };
  return [L, R];
}

function sleeveArm(ctx: Ctx, shoulder: Pt, spec: ArmSpec, side: number, p: KidPose, seed: number) {
  const rider = p.outfit === "rider";
  const girl = p.who === "girl";
  const [gc, gd, gcuff] = girlSleeve(p);
  const col = girl ? gc : rider ? K.rider : K.hood,
    dk = girl ? gd : rider ? K.riderDk : K.hoodDk;
  const [elbow, wrist] = ik2(shoulder, spec.wrist, girl ? 134 : 142, girl ? 128 : 134, spec.bend);
  // sleeve tube ends a little before the wrist, then the cuff
  const cuffStart = lerp2(elbow, wrist, 0.86);
  const spine = sub([shoulder, elbow, cuffStart]);
  const widths = girl ? [54, 50, 46, 43, 40] : [60, 56, 52, 48, 45];
  shaded(ctx, () => blob(ctx, tubePts(spine, widths, true, false), seed, 1.1), col, () => {
    // shade along the outer edge
    const off = tubePts(spine.map(([x, y]) => [x + 16 * side, y + 4]) as Pt[], widths.map((w) => w * 0.7), true, false);
    blob(ctx, off, seed + 1, 1);
    paint(ctx, dk, null);
    if (rider) {
      // reflective band on the upper arm
      const a = lerp2(shoulder, elbow, 0.55),
        b = lerp2(shoulder, elbow, 0.75);
      const band = tubePts([a, b], [90, 90], false, false);
      poly(ctx, band, seed + 2, 0.6);
      paint(ctx, K.reflect, null);
    }
  }, C.ink, 5.5);
  // elbow folds
  inkLine(ctx, [lerp2(elbow, shoulder, 0.12).map((v, i) => v + (i ? -6 : 4 * side)) as Pt, [elbow[0] - 4 * side, elbow[1]], lerp2(elbow, cuffStart, 0.14)], seed + 3, 2.6, dk);
  // ribbed cuff
  const cuff = tubePts([cuffStart, wrist], [48, 44], false, false);
  shaded(ctx, () => poly(ctx, cuff, seed + 4, 0.8), girl ? gcuff : rider ? K.riderCollar : dk, () => {
    for (let k = 1; k < 5; k++) {
      const q = lerp2(cuffStart, wrist, 0.5);
      const ang = Math.atan2(wrist[1] - cuffStart[1], wrist[0] - cuffStart[0]) + Math.PI / 2;
      const d = (k - 2.5) * 10;
      inkLine(ctx, [[q[0] + Math.cos(ang) * d - 8 * Math.cos(ang - Math.PI / 2), q[1] + Math.sin(ang) * d - 8 * Math.sin(ang - Math.PI / 2)], [q[0] + Math.cos(ang) * d + 8 * Math.cos(ang - Math.PI / 2), q[1] + Math.sin(ang) * d + 8 * Math.sin(ang - Math.PI / 2)]], seed + 5 + k, 1.6, "rgba(0,0,0,0.35)");
    }
  }, C.ink, 4.5);
  return { wrist, ang: Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]) };
}

function legSpecs(p: KidPose): [Pt, Pt, number] {
  const mode = p.legs ?? "stand";
  const ph = p.walk ?? 0;
  let L: Pt = [-62, 780],
    R: Pt = [62, 780];
  let bend = 1;
  if (mode === "walk" || mode === "run") {
    // front view: the forward foot comes down closer to the camera, the other lifts
    const run = mode === "run";
    const lift = run ? 120 : 46;
    L = [-52 - Math.sin(ph) * (run ? 14 : 6), 780 + Math.sin(ph) * (run ? 26 : 14) - Math.max(0, -Math.cos(ph)) * lift];
    R = [52 - Math.sin(ph) * (run ? 14 : 6), 780 - Math.sin(ph) * (run ? 26 : 14) - Math.max(0, Math.cos(ph)) * lift];
  } else if (mode === "sit") {
    L = [-80, 690];
    R = [80, 690];
  } else if (mode === "sitFloor") {
    L = [-72, 566];
    R = [72, 566];
    bend = -1;
  } else if (mode === "kneel") {
    L = [-70, 650];
    R = [70, 650];
  }
  return [L, R, bend];
}

function pantsLeg(ctx: Ctx, hip: Pt, ankle: Pt, side: number, p: KidPose, seed: number) {
  const mode = p.legs ?? "stand";
  let knee: Pt;
  if (mode === "sit") knee = [hip[0] + side * 30, hip[1] + 120];
  else if (mode === "sitFloor") knee = [hip[0] + side * 44, hip[1] - 70];
  else if (mode === "kneel") knee = [hip[0] + side * 16, ankle[1] - 10];
  else [knee] = ik2(hip, ankle, 172, 168, side);
  const spine = sub([hip, knee, ankle]);
  const widths = [86, 80, 72, 66, 62];
  shaded(ctx, () => blob(ctx, tubePts(spine, widths, true, true), seed, 1.2), K.pants, () => {
    const off = tubePts(spine.map(([x, y]) => [x + 18 * side, y]) as Pt[], widths.map((w) => w * 0.6), true, true);
    blob(ctx, off, seed + 1, 1);
    paint(ctx, K.pantsDk, null);
  }, C.ink, 5.5);
  // knee crease
  inkLine(ctx, [[knee[0] - 16, knee[1] - 4], [knee[0], knee[1] + 4], [knee[0] + 14, knee[1] - 2]], seed + 2, 2.4, K.pantsDk);
  if (mode === "kneel") return;
  // sneaker (front view)
  ctx.save();
  ctx.translate(ankle[0] + side * 6, ankle[1] + 22);
  const shoe: Pt[] = [[-40, -18], [0, -26], [40, -18], [50, 10], [30, 24], [-30, 24], [-50, 10]];
  shaded(ctx, () => blob(ctx, shoe, seed + 3, 1), K.shoe, () => {
    ctx.fillStyle = K.sole;
    ctx.fillRect(-60, 12, 120, 20);
  }, C.ink, 5);
  inkLine(ctx, [[-12, -14], [12, -14]], seed + 4, 2.4, "#bdb8ad");
  inkLine(ctx, [[-10, -4], [10, -4]], seed + 5, 2.4, "#bdb8ad");
  ctx.restore();
}

// ---------------------------------------------------------------- torso
const TORSO: Pt[] = [
  [-64, 150], [-104, 168], [-122, 214], [-122, 320], [-118, 432], [-56, 440], [0, 442], [56, 440],
  [118, 432], [122, 320], [122, 214], [104, 168], [64, 150], [0, 158],
];

function torsoFront(ctx: Ctx, p: KidPose, seed: number) {
  const rider = p.outfit === "rider";
  const col = rider ? K.rider : K.hood,
    dk = rider ? K.riderDk : K.hoodDk;
  if (!rider && !p.hood) {
    // the hood lying behind the neck
    blob(ctx, [[-110, 168], [-96, 126], [-50, 108], [0, 112], [50, 108], [96, 126], [110, 168], [0, 196]], seed, 1.3);
    paint(ctx, dk, C.ink, 5.5);
  }
  shaded(ctx, () => blob(ctx, TORSO, seed + 1, 1.3), col, () => {
    // cel shadow on the right side + under the chest
    blob(ctx, [[60, 150], [140, 170], [150, 460], [70, 460], [90, 330], [70, 220]], seed + 2, 1.5);
    paint(ctx, dk, null);
    // hem band
    poly(ctx, [[-150, 410], [150, 410], [150, 470], [-150, 470]], seed + 3, 1);
    paint(ctx, rider ? K.riderDk : dk, null);
    inkLine(ctx, [[-134, 412], [0, 418], [134, 412]], seed + 4, 3.5);
    for (let i = -6; i <= 6; i++) inkLine(ctx, [[i * 20, 418], [i * 20, 438]], seed + 5 + i, 1.6, "rgba(0,0,0,0.3)");
    if (rider) {
      // reflective chest band + zipper
      poly(ctx, [[-150, 286], [150, 280], [150, 312], [-150, 318]], seed + 20, 0.8);
      paint(ctx, K.reflect, C.ink, 3.5);
      inkLine(ctx, [[0, 170], [2, 300], [0, 418]], seed + 21, 3.2, "#5a4a1a");
      for (let y = 182; y < 410; y += 14) inkLine(ctx, [[-4, y], [4, y]], seed + 22 + y, 1.6, "#5a4a1a");
      // chest pocket flap
      poly(ctx, [[-106, 210], [-40, 206], [-40, 236], [-106, 240]], seed + 23, 0.8);
      paint(ctx, null, "#8a6400", 3);
    } else {
      // kangaroo pocket + folds
      const pocket: Pt[] = [[-78, 324], [78, 324], [96, 412], [-96, 412]];
      poly(ctx, pocket, seed + 6, 1);
      paint(ctx, null, C.ink, 3.6);
      inkLine(ctx, [[-78, 326], [-98, 362], [-96, 410]], seed + 7, 3, dk);
      inkLine(ctx, [[78, 326], [98, 362], [96, 410]], seed + 8, 3, dk);
      inkLine(ctx, [[-120, 220], [-96, 246], [-90, 280]], seed + 9, 2.4, dk);
      inkLine(ctx, [[-40, 300], [-10, 308], [20, 302]], seed + 10, 2.2, dk);
    }
  }, C.ink, 6);
  if (rider) {
    // stand-up collar
    blob(ctx, [[-76, 144], [0, 160], [76, 144], [80, 176], [0, 192], [-80, 176]], seed + 11, 1);
    paint(ctx, K.riderCollar, C.ink, 5);
  } else {
    // tee collar + drawstrings
    blob(ctx, [[-44, 150], [0, 162], [44, 150], [30, 176], [0, 184], [-30, 176]], seed + 12, 1);
    paint(ctx, K.tee, C.ink, 4);
    for (const side of [-1, 1]) {
      const sway = Math.sin((p.walk ?? 0) + side) * 4;
      inkLine(ctx, [[side * 30, 178], [side * 32 + sway, 230], [side * 30 + sway * 1.5, 262]], seed + 13 + side, 4.4, "#f2efe6");
      inkLine(ctx, [[side * 30, 178], [side * 32 + sway, 230], [side * 30 + sway * 1.5, 262]], seed + 13 + side, 1.4, "rgba(0,0,0,0.25)");
      blob(ctx, [[side * 30 + sway * 1.5 - 4, 260], [side * 30 + sway * 1.5 + 4, 260], [side * 30 + sway * 1.5 + 4, 276], [side * 30 + sway * 1.5 - 4, 276]], seed + 16 + side, 0.4);
      paint(ctx, "#cfd3d6", C.ink, 2.2);
    }
  }
}

function torsoBack(ctx: Ctx, p: KidPose, seed: number) {
  const rider = p.outfit === "rider";
  const col = rider ? K.rider : K.hood,
    dk = rider ? K.riderDk : K.hoodDk;
  shaded(ctx, () => blob(ctx, TORSO, seed + 1, 1.3), col, () => {
    blob(ctx, [[60, 150], [140, 170], [150, 460], [80, 460], [96, 300]], seed + 2, 1.5);
    paint(ctx, dk, null);
    poly(ctx, [[-150, 410], [150, 410], [150, 470], [-150, 470]], seed + 3, 1);
    paint(ctx, dk, null);
    inkLine(ctx, [[-134, 412], [0, 418], [134, 412]], seed + 4, 3.5);
    if (rider) {
      poly(ctx, [[-150, 286], [150, 280], [150, 312], [-150, 318]], seed + 20, 0.8);
      paint(ctx, K.reflect, C.ink, 3.5);
    }
  }, C.ink, 6);
  if (!rider) {
    // hood flat on the upper back
    shaded(ctx, () => blob(ctx, [[-96, 150], [-60, 132], [0, 128], [60, 132], [96, 150], [86, 250], [0, 290], [-86, 250]], seed + 5, 1.3), K.hood, () => {
      blob(ctx, [[-70, 160], [0, 150], [70, 160], [60, 236], [0, 266], [-60, 236]], seed + 6, 1);
      paint(ctx, dk, null);
    }, C.ink, 5.5);
  }
}

// ---------------------------------------------------------------- the girl (who: "girl")
const G = {
  skin: "#f6e1c3",
  skinSh: "#ecc9a0",
  skinDeep: "#d6a87a",
  hair: "#3e2a22",
  hairDk: "#2a1b15",
  hairHi: "#7a5646",
  pj: "#f3b6c4",
  pjDk: "#d98ca0",
  pjTrim: "#fff4f6",
  cardi: "#efdcb8",
  cardiDk: "#d2b98c",
  blouse: "#fbfaf6",
  skirt: "#2f3d5c",
  skirtDk: "#222c44",
  sock: "#f4f2ec",
  loafer: "#5a3a28",
  brow: "#4a3226",
};
const FACE_G: Pt[] = FACE.map(([x, y]) => [x * 0.95, y < 60 ? y : y - (y - 60) * 0.06] as Pt);
/** the bob from the crown to the jaw, ends flipping out a little */
const BOB_BACK: Pt[] = [
  [0, -152], [94, -134], [136, -80], [150, -12], [148, 56], [142, 100], [156, 128], [118, 128], [94, 112],
  [56, 122], [0, 128], [-56, 122], [-94, 112], [-118, 128], [-156, 128], [-142, 100], [-148, 56], [-150, -12],
  [-136, -80], [-94, -134],
];
/** fringe edge (right → left), gentle scallops just above the brows */
const BANGS_EDGE: Pt[] = [
  [130, -28], [112, -10], [92, -16], [70, -4], [48, -12], [24, -2], [0, -10], [-24, -2], [-48, -12], [-72, -4], [-96, -14], [-116, -12], [-132, -30],
];
const BANGS: Pt[] = [[-132, -30], [-140, -86], [-98, -136], [0, -156], [98, -136], [140, -86], [130, -28], ...BANGS_EDGE.slice(1, -1)];
const LOCK_L: Pt[] = [[-128, -48], [-150, 20], [-146, 92], [-136, 124], [-112, 104], [-104, 40], [-108, -16]];
const EYE_OPEN_G: Record<string, [number, number]> = {
  sleepy: [0.5, 0],
  open: [0.92, 0],
  wide: [1.15, 0],
  sad: [0.7, 1],
  tired: [0.4, 0.4],
  teary: [0.8, 1],
  angry: [0.6, -0.7],
};

export function sunflowerClip(ctx: Ctx, x: number, y: number, s: number, seed: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);
    blob(ctx, [[0, -10], [9, -26], [0, -38], [-9, -26]], seed + i, 0.6);
    paint(ctx, "#ffcf33", C.ink, 3);
    ctx.restore();
  }
  oval(ctx, 0, 0, 13, 13, seed + 9, 0.6);
  paint(ctx, "#7a4a24", C.ink, 3);
  for (let i = 0; i < 4; i++) {
    oval(ctx, -4 + (i % 2) * 8, -4 + Math.floor(i / 2) * 8, 1.8, 1.8, seed + 10 + i, 0.2);
    paint(ctx, "#3a2414", null);
  }
  ctx.restore();
}

function girlHairBack(ctx: Ctx, seed: number) {
  shaded(ctx, () => blob(ctx, BOB_BACK, seed, 1.3), G.hairDk, () => {
    for (const side of [-1, 1]) inkLine(ctx, [[side * 120, 0], [side * 136, 70], [side * 140, 118]], seed + 2 + side, 2.4, "rgba(0,0,0,0.35)");
  }, C.ink, 5.5);
}

function girlHairFront(ctx: Ctx, p: KidPose, seed: number) {
  // side locks framing the cheeks
  for (const side of [-1, 1]) {
    const pts = LOCK_L.map(([x, y]) => [x * side, y] as Pt);
    shaded(ctx, () => blob(ctx, pts, seed + 10 + side, 1), G.hair, () => {
      inkLine(ctx, [[side * 124, -20], [side * 134, 50], [side * 128, 110]], seed + 12 + side, 2.2, G.hairDk);
    }, C.ink, 5);
  }
  // crown + bangs
  shaded(ctx, () => blob(ctx, BANGS, seed + 20, 1.0), G.hair, () => {
    // a few strand separations from the crown into the bangs (soft, not to the edge)
    for (let i = 0; i < 5; i++) {
      const x = -84 + i * 42;
      inkLine(ctx, [[x * 0.25, -148], [x * 0.75, -84], [x + 4, -22]], seed + 21 + i, 2, G.hairDk);
    }
    // glossy crescent on the crown with little notches
    ctx.save();
    ctx.globalAlpha *= 0.8;
    const outer: Pt[] = [],
      inner: Pt[] = [];
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI * (1.2 + i * 0.05);
      outer.push([Math.cos(a) * 118, -46 + Math.sin(a) * 104]);
      inner.push([Math.cos(a) * (i % 3 === 1 ? 94 : 104), -46 + Math.sin(a) * (i % 3 === 1 ? 84 : 92)]);
    }
    blob(ctx, [...outer, ...inner.reverse()], seed + 30, 0.6);
    paint(ctx, G.hairHi, null);
    ctx.restore();
  }, C.ink, 5.5);
  if (p.clip !== false) sunflowerClip(ctx, -98, -66, 0.92, seed + 40);
}

function girlBackHead(ctx: Ctx, p: KidPose, seed: number) {
  blob(ctx, [[-50, 60], [50, 60], [46, 140], [-46, 140]], seed + 4, 1);
  paint(ctx, G.skinSh, C.ink, 5);
  const back: Pt[] = [...BOB_BACK.slice(0, 8), [100, 132], [60, 140], [20, 134], [-20, 140], [-60, 134], [-100, 140], ...BOB_BACK.slice(13)];
  shaded(ctx, () => blob(ctx, back, seed + 5, 1.3), G.hair, () => {
    for (let i = 0; i < 7; i++) {
      const x = -120 + i * 40;
      inkLine(ctx, [[x * 0.2, -150], [x * 0.8, -40], [x, 120]], seed + 6 + i, 2.2, G.hairDk);
    }
    ctx.save();
    ctx.globalAlpha *= 0.8;
    inkLine(ctx, [[-90, -100], [-40, -124], [10, -128], [60, -118]], seed + 20, 7, G.hairHi);
    ctx.restore();
  }, C.ink, 5.5);
  if (p.clip !== false) sunflowerClip(ctx, 110, -60, 0.92, seed + 40);
}

function girlHeadFront(ctx: Ctx, p: KidPose, seed: number) {
  const turn = p.turn ?? 0;
  const fx = turn * 20;
  girlHairBack(ctx, seed + 70);
  shaded(ctx, () => blob(ctx, FACE_G, seed + 5, 1.1), G.skin, () => {
    blob(ctx, [[56, 130], [100, 80], [118, 20], [134, 90], [76, 150]], seed + 6, 1);
    paint(ctx, "rgba(214,160,110,0.28)", null);
    poly(ctx, [...(BANGS_EDGE.map(([x, y]) => [x + 4, y + 13]) as Pt[]), [-200, -200], [200, -200]], seed + 7, 1);
    ctx.fillStyle = "rgba(190,140,100,0.32)";
    ctx.fill();
  }, C.ink, 5.5);
  const blush = Math.max(0.35, p.blush ?? 0);
  ctx.save();
  ctx.globalAlpha *= Math.min(1, blush);
  for (const side of [-1, 1]) {
    oval(ctx, side * 66 + fx, 80, 22, 12, seed + 8 + side, 0.8);
    paint(ctx, "rgba(245,120,135,0.5)", null);
    if (blush > 0.6) for (let k = 0; k < 3; k++) inkLine(ctx, [[side * 66 + fx - 12 + k * 9, 75], [side * 66 + fx - 16 + k * 9, 85]], seed + 9 + k, 2, "rgba(225,85,100,0.75)");
  }
  ctx.restore();
  if (p.freckles !== false) {
    for (const side of [-1, 1])
      for (let k = 0; k < 3; k++) {
        oval(ctx, side * (44 + k * 9) + fx, 64 + (k % 2) * 6, 2.2, 2.2, seed + 50 + k + side, 0.2);
        paint(ctx, "rgba(160,100,60,0.55)", null);
      }
  }
  brow(ctx, -48 + fx, 10, -1, p, seed + 12);
  brow(ctx, 48 + fx, 10, 1, p, seed + 13);
  eye(ctx, -48 + fx, 38, -1, p, seed + 10);
  eye(ctx, 48 + fx, 38, 1, p, seed + 20);
  inkLine(ctx, [[8 + fx * 1.2, 62], [13 + fx * 1.2, 70], [7 + fx * 1.2, 73]], seed + 30, 3);
  mouth(ctx, p, seed + 31, 4 + fx * 1.1);
  if (p.tears) {
    ctx.save();
    ctx.globalAlpha *= Math.min(1, p.tears * 1.6);
    for (const side of [-1, 1]) {
      const len = 24 + p.tears * 64;
      const x0 = side * 44 + fx;
      curve(ctx, [[x0, 54], [x0 + side * 4, 54 + len * 0.5], [x0 - side * 1, 54 + len]], seed + side * 5, 0.8);
      paint(ctx, null, "#9fd8ff", 7);
      oval(ctx, x0, 58 + len, 5, 7, seed + side * 6, 0.4);
      paint(ctx, "#bfe6ff", null);
    }
    ctx.restore();
  }
  girlHairFront(ctx, p, seed + 80);
  if ((p.blush ?? 0) > 0.85) {
    // flustered steam puffs
    ctx.save();
    ctx.globalAlpha *= (p.blush ?? 0) - 0.85 > 0 ? Math.min(1, ((p.blush ?? 0) - 0.85) * 6) : 0;
    for (const side of [-1, 1]) {
      inkLine(ctx, [[side * 150, -110], [side * 168, -134], [side * 156, -156], [side * 174, -180]], seed + 60 + side, 4, "rgba(255,255,255,0.9)");
    }
    ctx.restore();
  }
}

function girlTorsoFront(ctx: Ctx, p: KidPose, seed: number) {
  const pj = p.outfit !== "cardigan";
  const col = pj ? G.pj : G.cardi,
    dk = pj ? G.pjDk : G.cardiDk;
  const torso: Pt[] = TORSO.map(([x, y]) => [x * 0.9, y] as Pt);
  if (!pj) {
    // blouse under the cardigan
    blob(ctx, [[-60, 150], [60, 150], [70, 300], [-70, 300]], seed, 1);
    paint(ctx, G.blouse, C.ink, 4.5);
  }
  shaded(ctx, () => blob(ctx, torso, seed + 1, 1.3), col, () => {
    blob(ctx, [[54, 150], [130, 170], [140, 460], [66, 460], [82, 330], [64, 220]], seed + 2, 1.5);
    paint(ctx, dk, null);
    if (pj) {
      // tiny hearts all over the pajamas
      for (let i = 0; i < 14; i++) {
        const hx = -90 + (i % 5) * 45 + (Math.floor(i / 5) % 2) * 22,
          hy = 220 + Math.floor(i / 5) * 70;
        blob(ctx, [[hx, hy + 3], [hx - 6, hy - 3], [hx - 9, hy + 1], [hx, hy + 10], [hx + 9, hy + 1], [hx + 6, hy - 3]], seed + 10 + i, 0.3);
        paint(ctx, "rgba(255,255,255,0.75)", null);
      }
      inkLine(ctx, [[0, 172], [2, 300], [0, 430]], seed + 30, 2.4, dk);
    } else {
      // open front, ribbed hem, buttons
      poly(ctx, [[-28, 150], [28, 150], [10, 300], [-10, 300]], seed + 31, 0.8);
      paint(ctx, G.blouse, null);
      inkLine(ctx, [[-28, 150], [-8, 300], [-6, 430]], seed + 32, 3.5);
      inkLine(ctx, [[28, 150], [8, 300], [6, 430]], seed + 33, 3.5);
      poly(ctx, [[-150, 410], [150, 410], [150, 470], [-150, 470]], seed + 34, 1);
      paint(ctx, dk, null);
      inkLine(ctx, [[-124, 412], [0, 418], [124, 412]], seed + 35, 3.2);
    }
  }, C.ink, 6);
  if (pj) {
    // notched collar with piping
    for (const side of [-1, 1]) {
      poly(ctx, [[side * 8, 158], [side * 60, 146], [side * 78, 176], [side * 30, 212]], seed + 40 + side, 0.8);
      paint(ctx, G.pjTrim, C.ink, 4);
    }
    for (let k = 0; k < 3; k++) {
      oval(ctx, 6, 250 + k * 60, 6, 6, seed + 44 + k, 0.3);
      paint(ctx, G.pjTrim, C.ink, 2.4);
    }
  } else {
    // round blouse collar + cardigan buttons
    for (const side of [-1, 1]) {
      blob(ctx, [[side * 4, 150], [side * 50, 146], [side * 56, 176], [side * 20, 186]], seed + 40 + side, 0.8);
      paint(ctx, G.blouse, C.ink, 4);
    }
    for (let k = 0; k < 3; k++) {
      oval(ctx, -14, 330 + k * 34, 5, 5, seed + 44 + k, 0.3);
      paint(ctx, "#8a6a44", C.ink, 2.2);
    }
  }
}

function girlTorsoBack(ctx: Ctx, p: KidPose, seed: number) {
  const pj = p.outfit !== "cardigan";
  const col = pj ? G.pj : G.cardi,
    dk = pj ? G.pjDk : G.cardiDk;
  const torso: Pt[] = TORSO.map(([x, y]) => [x * 0.9, y] as Pt);
  shaded(ctx, () => blob(ctx, torso, seed + 1, 1.3), col, () => {
    blob(ctx, [[54, 150], [130, 170], [140, 460], [70, 460], [86, 300]], seed + 2, 1.5);
    paint(ctx, dk, null);
    if (!pj) {
      poly(ctx, [[-150, 410], [150, 410], [150, 470], [-150, 470]], seed + 3, 1);
      paint(ctx, dk, null);
    }
  }, C.ink, 6);
}

function girlSleeve(p: KidPose): [string, string, string] {
  return p.outfit === "cardigan" ? [G.cardi, G.cardiDk, G.cardiDk] : [G.pj, G.pjDk, G.pjTrim];
}

function girlLeg(ctx: Ctx, hip: Pt, ankle: Pt, side: number, p: KidPose, seed: number) {
  const mode = p.legs ?? "stand";
  const skirt = p.outfit === "cardigan";
  let knee: Pt;
  if (mode === "sit") knee = [hip[0] + side * 26, hip[1] + 120];
  else if (mode === "sitFloor") knee = [hip[0] + side * 40, hip[1] - 70];
  else if (mode === "kneel") knee = [hip[0] + side * 14, ankle[1] - 10];
  else [knee] = ik2(hip, ankle, 172, 168, side);
  const spine = sub([hip, knee, ankle]);
  if (!skirt) {
    const widths = [80, 72, 64, 58, 56];
    shaded(ctx, () => blob(ctx, tubePts(spine, widths, true, true), seed, 1.2), G.pj, () => {
      blob(ctx, tubePts(spine.map(([x, y]) => [x + 16 * side, y]) as Pt[], widths.map((w) => w * 0.55), true, true), seed + 1, 1);
      paint(ctx, G.pjDk, null);
    }, C.ink, 5.5);
    // socks
    oval(ctx, ankle[0] + side * 4, ankle[1] + 18, 34, 22, seed + 3, 0.8);
    paint(ctx, "#f7e4ea", C.ink, 4.5);
    return;
  }
  // skirt legs: bare shin, white knee socks, loafers
  const widths = [64, 58, 52, 48, 44];
  shaded(ctx, () => blob(ctx, tubePts(spine, widths, true, true), seed, 1.2), G.skin, () => {
    blob(ctx, tubePts(spine.map(([x, y]) => [x + 12 * side, y]) as Pt[], widths.map((w) => w * 0.5), true, true), seed + 1, 1);
    paint(ctx, "rgba(214,160,110,0.3)", null);
  }, C.ink, 5);
  const sockTop = lerp2(knee, ankle, 0.25);
  blob(ctx, tubePts([sockTop, ankle], [50, 46], true, true), seed + 2, 1);
  paint(ctx, G.sock, C.ink, 4.5);
  if (mode === "kneel") return;
  ctx.save();
  ctx.translate(ankle[0] + side * 4, ankle[1] + 20);
  blob(ctx, [[-34, -14], [0, -22], [34, -14], [42, 8], [26, 20], [-26, 20], [-42, 8]], seed + 4, 0.9);
  paint(ctx, G.loafer, C.ink, 4.5);
  ctx.restore();
}

function girlSkirt(ctx: Ctx, p: KidPose, seed: number) {
  if (p.outfit !== "cardigan") return;
  const sitting = p.legs === "sit" || p.legs === "sitFloor";
  const hem = sitting ? 520 : 560;
  const flare = sitting ? 150 : 140;
  const pts: Pt[] = [[-112, 420], [112, 420], [flare, hem], [0, hem + 8], [-flare, hem]];
  shaded(ctx, () => poly(ctx, pts, seed, 1.2), G.skirt, () => {
    blob(ctx, [[40, 420], [130, 420], [160, hem + 20], [60, hem + 20]], seed + 1, 1);
    paint(ctx, G.skirtDk, null);
    for (let i = -3; i <= 3; i++) inkLine(ctx, [[i * 26, 432], [i * (flare / 3.4), hem]], seed + 2 + i, 2.2, "rgba(0,0,0,0.35)");
  }, C.ink, 5.5);
}

// ---------------------------------------------------------------- public
/** A single hand in design space (for close-ups): wrist at (x, y), pointing along ang. */
export function drawHand(ctx: Ctx, x: number, y: number, s: number, ang: number, shape: HandShape, mirror = false, bandaid = false, seed = 1900, girl = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  hand(ctx, [0, 0], ang, shape, mirror, seed, bandaid, girl ? G.skin : K.skin);
  ctx.restore();
}


export function drawKid(ctx: Ctx, x: number, y: number, s: number, p: KidPose = {}) {
  const seed = p.seed ?? 11;
  const body = p.body ?? "bust";
  const back = p.view === "back";
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (body !== "head") {
    const legsInFront = p.legs === "sitFloor";
    const girl = p.who === "girl";
    const drawLegs = () => {
      if (body !== "full") return;
      const [la, ra] = legSpecs(p);
      if (girl) {
        girlLeg(ctx, [-50, 430], la, -1, p, seed + 200);
        girlLeg(ctx, [50, 430], ra, 1, p, seed + 210);
      } else {
        pantsLeg(ctx, [-54, 430], la, -1, p, seed + 200);
        pantsLeg(ctx, [54, 430], ra, 1, p, seed + 210);
      }
    };
    if (!legsInFront) drawLegs();
    // neck
    blob(ctx, girl ? [[-30, 96], [30, 96], [34, 168], [-34, 168]] : [[-36, 96], [36, 96], [40, 168], [-40, 168]], seed + 220, 1);
    paint(ctx, girl ? G.skinSh : K.skinSh, C.ink, 5);
    if (girl) {
      if (body === "full" && !legsInFront) girlSkirt(ctx, p, seed + 225);
      if (back) girlTorsoBack(ctx, p, seed + 230);
      else girlTorsoFront(ctx, p, seed + 230);
    } else if (back) torsoBack(ctx, p, seed + 230);
    else torsoFront(ctx, p, seed + 230);
    if (legsInFront) drawLegs();
    if (girl && body === "full" && legsInFront) girlSkirt(ctx, p, seed + 225);
    if (p.earbuds && !back) {
      const hy = p.headY ?? 0;
      inkLine(ctx, [[-118, 56 + hy], [-104, 170], [-40, 300], [0, 336]], seed + 250, 2.4, "#111");
      inkLine(ctx, [[118, 56 + hy], [104, 170], [40, 300], [0, 336]], seed + 251, 2.4, "#111");
      blob(ctx, [[-14, 336], [14, 336], [14, 380], [-14, 380]], seed + 252, 0.6);
      paint(ctx, "#f2f2f2", C.ink, 3);
    }
    p.holding?.(ctx);
    const [L, R] = armSpecs(p);
    const sx = girl ? 92 : 100;
    const al = sleeveArm(ctx, [-sx, 192], L, -1, p, seed + 260);
    const ar = sleeveArm(ctx, [sx, 192], R, 1, p, seed + 270);
    p.grip?.(ctx);
    const sk = girl ? G.skin : K.skin;
    if (!back) {
      hand(ctx, al.wrist, al.ang, L.shape, true, seed + 280, false, sk);
      hand(ctx, ar.wrist, ar.ang, R.shape, false, seed + 290, !!p.bandaids, sk);
    } else {
      hand(ctx, al.wrist, al.ang, L.shape === "hidden" ? "hidden" : "relax", false, seed + 280, false, sk);
      hand(ctx, ar.wrist, ar.ang, R.shape === "hidden" ? "hidden" : "relax", true, seed + 290, false, sk);
    }
  }
  if (back) headBack(ctx, p, seed);
  else headFront(ctx, p, seed);
  ctx.restore();
}

/** Small helper so acts can bob the head on the beat. */
export const bob = (abs: number, amp = 4, speed = 2) => Math.sin(abs * Math.PI * speed) * amp;
