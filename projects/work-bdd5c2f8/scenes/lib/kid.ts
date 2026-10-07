import { C, Ctx, Pt, addBlob, blob, curve, hash, inkLine, jit, oval, paint, poly } from "./draw";

/** The protagonist, drawn after the cover art: spiky brown hair, sleepy eyes, blue hoodie, earbuds. */
export interface KidPose {
  eyes?: "sleepy" | "wide" | "shut" | "happy" | "angry" | "sad";
  look?: Pt; // pupil offset, -1..1
  mouth?: "frown" | "flat" | "smile" | "laugh" | "o" | "blow" | "wobble";
  tilt?: number; // head rotation (rad)
  headY?: number; // head bob offset
  hat?: boolean;
  hood?: boolean;
  earbuds?: boolean;
  tears?: number; // 0..1
  blush?: number; // 0..1
  cake?: number; // 0..1 cream on face
  body?: "head" | "bust" | "full";
  arms?: "down" | "phone" | "swing" | "reach" | "up" | "table";
  reach?: number; // 0..1 for "reach"
  legs?: "stand" | "walk" | "sit";
  walk?: number; // walk cycle phase (radians)
  /** Called between the arms and the hands, e.g. to draw a phone the hands hold. */
  holding?: (ctx: Ctx) => void;
  seed?: number;
}

const HAIR_FRINGE: Pt[] = [
  [124, 18], [104, -16], [92, 2], [74, -28], [56, -4], [34, -32], [14, -8], [-8, -34], [-28, -10],
  [-50, -36], [-70, -12], [-90, -34], [-108, -6], [-126, 16],
];
function hairShape(): Pt[] {
  const pts: Pt[] = [...HAIR_FRINGE];
  pts.push([-146, -4], [-176, -30], [-150, -48], [-170, -84], [-142, -84]);
  const n = 13;
  for (let i = 0; i <= n * 2; i++) {
    const a = ((196 + (i / (n * 2)) * 148) * Math.PI) / 180;
    const r = i % 2 === 0 ? 142 : 184 + hash(i * 7.7) * 30;
    pts.push([Math.cos(a) * r * 1.02, Math.sin(a) * r * 0.92 - 18]);
  }
  pts.push([142, -84], [172, -86], [150, -50], [178, -28], [144, -6]);
  return pts;
}
const HAIR = hairShape();

function headPts(): Pt[] {
  const out: Pt[] = [];
  const n = 22;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a),
      s = Math.sin(a);
    const k = Math.pow(Math.pow(Math.abs(c), 2.5) + Math.pow(Math.abs(s), 2.5), -1 / 2.5);
    out.push([c * 122 * k, 8 + s * 116 * k * (s > 0 ? 1.0 : 1.02)]);
  }
  return out;
}
const HEAD = headPts();

// distressed white specks like the cover's scratchy texture
const SPECKS: [number, number, number, number][] = Array.from({ length: 70 }, (_, i) => [
  hash(i * 3.3) * 2 - 1,
  hash(i * 5.1 + 1),
  2 + hash(i * 7.9) * 7,
  hash(i * 2.2 + 4) * Math.PI,
]);
function specks(ctx: Ctx, x: number, y: number, w: number, h: number, alpha = 0.55, count = 40) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = "#f2efe6";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const [u, v, len, a] = SPECKS[i % SPECKS.length];
    const px = x + w / 2 + (u * w) / 2,
      py = y + v * h;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function eye(ctx: Ctx, cx: number, cy: number, side: number, p: KidPose, seed: number) {
  const style = p.eyes ?? "sleepy";
  const look = p.look ?? [0, 0];
  if (style === "shut" || style === "happy") {
    const up = style === "happy" ? -1 : 1;
    inkLine(ctx, [[cx - 26, cy], [cx, cy + 10 * up * -1 + (up > 0 ? 6 : -4)], [cx + 26, cy]], seed, 5);
    if (style === "shut") inkLine(ctx, [[cx - 18, cy + 18], [cx, cy + 22], [cx + 18, cy + 18]], seed + 3, 2.5, "#8a6a4a");
    return;
  }
  const rx = 33,
    ry = style === "wide" ? 26 : 21;
  ctx.save();
  oval(ctx, cx, cy, rx, ry, seed, 1.0);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = style === "wide" ? "#f4f6fb" : C.eye;
  ctx.fillRect(cx - 40, cy - 40, 80, 80);
  // pupil
  const pr = style === "wide" ? 7 : 6.5;
  const px = cx + look[0] * 12,
    py = cy + (style === "wide" ? 2 : 7) + look[1] * 6;
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.fill();
  if (style === "wide") {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(px + 2.5, py - 2.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // heavy lid
  let cover = style === "wide" ? 0.05 : style === "angry" || style === "sad" ? 0.5 : 0.52;
  const slant = style === "angry" ? 14 * side : style === "sad" ? -12 * side : 0;
  if (cover > 0.06) {
    const ly = cy - ry + ry * 2 * cover;
    ctx.fillStyle = C.skinShade;
    ctx.beginPath();
    ctx.moveTo(cx - 40, cy - 40);
    ctx.lineTo(cx + 40, cy - 40);
    ctx.lineTo(cx + 40, ly - slant);
    ctx.lineTo(cx - 40, ly + slant);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    oval(ctx, cx, cy, rx, ry, seed, 1.0);
    paint(ctx, null, C.ink, 3.5);
    inkLine(ctx, [[cx - rx - 2, ly + slant * 1.05 + 1], [cx, ly + 1], [cx + rx + 2, ly - slant * 1.05 + 1]], seed + 1, 4.5);
  } else {
    ctx.restore();
    oval(ctx, cx, cy, rx, ry, seed, 1.0);
    paint(ctx, null, C.ink, 3.5);
  }
  ctx.restore();
  // eye bags
  inkLine(ctx, [[cx - 20, cy + ry + 8], [cx, cy + ry + 12], [cx + 18, cy + ry + 7]], seed + 2, 2.2, "#9b8466");
  if (style === "angry")
    inkLine(ctx, [[cx - 30 * side * -1, cy - 44 - 10], [cx + 26 * side, cy - 30]], seed + 4, 6);
  if (style === "sad") inkLine(ctx, [[cx - 26 * side, cy - 36], [cx + 26 * side, cy - 48]], seed + 4, 5);
}

function mouth(ctx: Ctx, p: KidPose, seed: number) {
  const m = p.mouth ?? "frown";
  const x = 12,
    y = 94;
  switch (m) {
    case "frown":
      inkLine(ctx, [[x - 16, y + 6], [x, y - 2], [x + 16, y + 6]], seed, 4);
      break;
    case "flat":
      inkLine(ctx, [[x - 14, y + 2], [x + 14, y + 1]], seed, 4);
      break;
    case "wobble":
      inkLine(ctx, [[x - 20, y + 4], [x - 10, y - 2], [x, y + 4], [x + 10, y - 2], [x + 20, y + 4]], seed, 3.5);
      break;
    case "smile":
      inkLine(ctx, [[x - 22, y - 4], [x, y + 8], [x + 22, y - 4]], seed, 4.5);
      break;
    case "o":
      oval(ctx, x, y + 2, 9, 12, seed, 0.8);
      paint(ctx, "#5a2a2a", C.ink, 3.5);
      break;
    case "blow":
      oval(ctx, x, y + 2, 7, 8, seed, 0.6);
      paint(ctx, "#5a2a2a", C.ink, 3.5);
      oval(ctx, x - 52, y - 14, 20, 15, seed + 2, 1);
      paint(ctx, "rgba(240,150,140,0.35)", null);
      oval(ctx, x + 56, y - 14, 20, 15, seed + 3, 1);
      paint(ctx, "rgba(240,150,140,0.35)", null);
      break;
    case "laugh": {
      blob(ctx, [[x - 34, y - 8], [x, y - 4], [x + 34, y - 8], [x + 22, y + 26], [x, y + 34], [x - 22, y + 26]], seed, 1.2);
      paint(ctx, "#6b2730", C.ink, 4);
      ctx.save();
      ctx.clip();
      oval(ctx, x, y + 32, 18, 12, seed + 5, 1);
      paint(ctx, "#e46a6a", null);
      ctx.fillStyle = "#fff";
      ctx.fillRect(x - 30, y - 12, 60, 10);
      ctx.restore();
      break;
    }
  }
}

function partyHat(ctx: Ctx, seed: number) {
  ctx.save();
  ctx.translate(-30, -150);
  ctx.rotate(-0.28);
  poly(ctx, [[-60, 30], [0, -150], [60, 30]], seed, 1.2);
  paint(ctx, "#ff6fa2", C.ink, 5);
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = "#ffe05a";
  ctx.lineWidth = 16;
  for (let i = -3; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-80, -140 + i * 42);
    ctx.lineTo(80, -100 + i * 42);
    ctx.stroke();
  }
  ctx.restore();
  poly(ctx, [[-60, 30], [0, -150], [60, 30]], seed, 1.2);
  paint(ctx, null, C.ink, 5);
  // pompom
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    oval(ctx, Math.cos(a) * 12, -152 + Math.sin(a) * 12, 12, 12, seed + i, 1);
    paint(ctx, "#fff7c2", C.ink, 2.5);
  }
  ctx.restore();
  // elastic band
  inkLine(ctx, [[-90, -110], [-120, -20], [-108, 60], [-60, 118]], seed + 9, 1.6, "#555");
}

const HOOD_BACK: Pt[] = [[-182, 60], [-196, -90], [-128, -214], [0, -246], [128, -214], [196, -90], [182, 60], [160, 180], [-160, 180]];
const HOOD_HOLE: Pt[] = [[-128, 60], [-136, -40], [-96, -128], [0, -152], [96, -128], [136, -40], [128, 60], [110, 140], [0, 160], [-110, 140]];
function hoodUp(ctx: Ctx, seed: number, front: boolean) {
  if (!front) {
    blob(ctx, HOOD_BACK, seed, 2);
    paint(ctx, C.hoodie, C.ink, 5);
    return;
  }
  // rim of the hood around the face
  ctx.beginPath();
  addBlob(ctx, HOOD_BACK, seed, 2);
  addBlob(ctx, HOOD_HOLE, seed + 1, 1.5);
  ctx.fillStyle = C.hoodie;
  ctx.fill("evenodd");
  ctx.lineWidth = 5.5;
  ctx.strokeStyle = C.ink;
  ctx.lineJoin = "round";
  ctx.stroke();
  inkLine(ctx, [[-150, 40], [-162, -80], [-110, -180]], seed + 3, 3, C.hoodieDark);
}

function head(ctx: Ctx, p: KidPose, seed: number) {
  ctx.save();
  ctx.translate(0, p.headY ?? 0);
  ctx.rotate(p.tilt ?? 0);
  ctx.scale(1.14, 1.14);
  if (p.hood) hoodUp(ctx, seed + 40, false);
  // ears
  for (const side of [-1, 1]) {
    oval(ctx, side * 122, 36, 18, 26, seed + side * 2, 1);
    paint(ctx, C.skin, C.ink, 4);
  }
  // face
  blob(ctx, HEAD, seed + 5, 1.3);
  paint(ctx, C.skin, C.ink, 5.5);
  ctx.save();
  blob(ctx, HEAD, seed + 5, 1.3);
  ctx.clip();
  ctx.fillStyle = "rgba(200,150,90,0.12)";
  ctx.fillRect(-130, 70, 260, 80);
  ctx.restore();
  if (p.blush) {
    ctx.save();
    ctx.globalAlpha *= p.blush;
    oval(ctx, -70, 70, 24, 13, seed + 6, 1);
    paint(ctx, "rgba(240,120,120,0.55)", null);
    oval(ctx, 76, 70, 24, 13, seed + 7, 1);
    paint(ctx, "rgba(240,120,120,0.55)", null);
    ctx.restore();
  }
  eye(ctx, -48, 24, -1, p, seed + 10);
  eye(ctx, 46, 24, 1, p, seed + 20);
  // nose
  inkLine(ctx, [[4, 48], [14, 62], [4, 70]], seed + 30, 3.5);
  mouth(ctx, p, seed + 31);
  if (p.tears) {
    ctx.save();
    ctx.globalAlpha *= Math.min(1, p.tears * 1.5);
    for (const side of [-1, 1]) {
      const len = 30 + p.tears * 70;
      curve(ctx, [[side * 47, 46], [side * 50, 46 + len * 0.5], [side * 46, 46 + len]], seed + side * 5, 1);
      paint(ctx, null, "#8fd3ff", 7);
    }
    ctx.restore();
  }
  if (p.cake) {
    ctx.save();
    ctx.globalAlpha *= Math.min(1, p.cake * 1.4);
    const k = p.cake;
    blob(ctx, [[-110, 30], [-70, -10 - 10 * k], [-20, 10], [20, 40], [70, 20], [112, 60], [90, 120], [30, 128], [-40, 110], [-100, 100]], seed + 50, 3);
    paint(ctx, "#fff8f0", "#e7d6c8", 3);
    for (let i = 0; i < 6; i++) {
      oval(ctx, -70 + i * 28, 40 + (i % 2) * 40, 9, 9, seed + 60 + i, 1);
      paint(ctx, i % 2 ? "#ff7aa8" : "#ffd84a", null);
    }
    // keep the eyes visible through the cream
    ctx.globalAlpha = 1;
    eye(ctx, -48, 24, -1, { ...p, eyes: "happy" }, seed + 10);
    eye(ctx, 46, 24, 1, { ...p, eyes: "happy" }, seed + 20);
    mouth(ctx, { ...p, mouth: "laugh" }, seed + 31);
    ctx.restore();
  }
  // hair
  if (!p.hood) {
    poly(ctx, HAIR, seed + 70, 1.6);
    paint(ctx, C.hair, C.ink, 5);
    ctx.save();
    poly(ctx, HAIR, seed + 70, 1.6);
    ctx.clip();
    for (let i = 0; i < 9; i++) {
      const a = (210 + i * 15) * (Math.PI / 180);
      inkLine(ctx, [[Math.cos(a) * 60, Math.sin(a) * 60 - 30], [Math.cos(a) * 120, Math.sin(a) * 110 - 30]], seed + 80 + i, 2.6, C.hairDark);
    }
    specks(ctx, -150, -180, 300, 170, 0.6, 30);
    ctx.restore();
  } else {
    // fringe peeking out of the hood
    ctx.save();
    blob(ctx, HOOD_HOLE, seed + 41, 1.5);
    ctx.clip();
    poly(ctx, HAIR, seed + 70, 1.6);
    paint(ctx, C.hair, C.ink, 5);
    ctx.restore();
    hoodUp(ctx, seed + 40, true);
  }
  if (p.earbuds !== false) {
    for (const side of [-1, 1]) {
      oval(ctx, side * 124, 42, 11, 11, seed + 90 + side, 0.6);
      paint(ctx, "#fafafa", C.ink, 3);
    }
  }
  if (p.hat) partyHat(ctx, seed + 100);
  ctx.restore();
}

function sleeve(ctx: Ctx, pts: Pt[], seed: number, w: number) {
  curve(ctx, pts, seed, 1.2);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = w + 10;
  ctx.stroke();
  ctx.strokeStyle = C.hoodie;
  ctx.lineWidth = w;
  ctx.stroke();
}
function hand(ctx: Ctx, x: number, y: number, seed: number, r = 30, rot = 0) {
  blob(ctx, [[x - r, y - r * 0.6], [x + r * 0.2, y - r], [x + r, y - r * 0.4], [x + r * 0.9, y + r * 0.7], [x, y + r], [x - r * 0.9, y + r * 0.6]].map(([px, py]) => {
    const dx = px - x,
      dy = py - y;
    return [x + dx * Math.cos(rot) - dy * Math.sin(rot), y + dx * Math.sin(rot) + dy * Math.cos(rot)] as Pt;
  }), seed, 1.2);
  paint(ctx, C.skin, C.ink, 4);
}

function legs(ctx: Ctx, p: KidPose, seed: number) {
  const mode = p.legs ?? "stand";
  const ph = p.walk ?? 0;
  for (const side of [-1, 1]) {
    let hipX = side * 52,
      footX = side * 70,
      footY = 760,
      kneeX = side * 62,
      kneeY = 600;
    if (mode === "walk") {
      const sw = Math.sin(ph) * side;
      footX = side * 40 + sw * 120;
      footY = 760 - Math.max(0, Math.cos(ph) * side) * 30;
      kneeX = side * 46 + sw * 60;
    }
    if (mode === "sit") {
      footY = 690;
      kneeY = 560;
      footX = side * 74;
      kneeX = side * 80;
    }
    poly(ctx, [[hipX - 58, 420], [hipX + 58, 420], [kneeX + 54, kneeY], [footX + 64, footY - 10], [footX - 64, footY - 10], [kneeX - 54, kneeY]], seed + side, 1.4);
    paint(ctx, C.pants, C.ink, 5);
    ctx.save();
    poly(ctx, [[hipX - 58, 420], [hipX + 58, 420], [kneeX + 54, kneeY], [footX + 64, footY - 10], [footX - 64, footY - 10], [kneeX - 54, kneeY]], seed + side, 1.4);
    ctx.clip();
    specks(ctx, hipX - 70, 420, 140, footY - 420, 0.7, 26);
    ctx.restore();
    oval(ctx, footX + side * 8, footY + 6, 58, 24, seed + 10 + side, 1.2);
    paint(ctx, C.shoe, C.ink, 4);
  }
}

/** Draw the kid at (x, y) = head centre, with `s` scale (1 ≈ head 240px wide). */
export function drawKid(ctx: Ctx, x: number, y: number, s: number, p: KidPose = {}) {
  const seed = p.seed ?? 11;
  const body = p.body ?? "bust";
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (body !== "head") {
    if (body === "full") legs(ctx, p, seed + 200);
    // hood bunched behind the neck
    if (!p.hood) {
      blob(ctx, [[-118, 150], [-80, 98], [0, 88], [80, 98], [118, 150], [0, 190]], seed + 210, 1.5);
      paint(ctx, C.hoodieDark, C.ink, 5);
    }
    // torso
    const torso: Pt[] = [[-102, 140], [-40, 128], [40, 128], [102, 140], [128, 220], [124, 440], [0, 448], [-124, 440], [-128, 220]];
    blob(ctx, torso, seed + 220, 1.5);
    paint(ctx, C.hoodie, C.ink, 5.5);
    ctx.save();
    blob(ctx, torso, seed + 220, 1.5);
    ctx.clip();
    specks(ctx, -130, 140, 260, 300, 0.55, 46);
    ctx.restore();
    // t-shirt V
    poly(ctx, [[-38, 130], [38, 130], [10, 250], [0, 262], [-10, 250]], seed + 230, 1.2);
    paint(ctx, C.tee, C.ink, 4);
    inkLine(ctx, [[-36, 132], [0, 262], [36, 132]], seed + 231, 4.5);
    // arms
    const arms = p.arms ?? "down";
    let handL: Pt = [-128, 430],
      handR: Pt = [128, 430];
    let rotL = 0,
      rotR = 0;
    if (arms === "down") {
      sleeve(ctx, [[-104, 160], [-128, 290], [-130, 404]], seed + 240, 50);
      sleeve(ctx, [[104, 160], [128, 290], [130, 404]], seed + 241, 50);
    } else if (arms === "phone") {
      handL = [-58, 300];
      handR = [58, 300];
      sleeve(ctx, [[-104, 160], [-140, 300], [-82, 318]], seed + 240, 50);
      sleeve(ctx, [[104, 160], [140, 300], [82, 318]], seed + 241, 50);
    } else if (arms === "table") {
      handL = [-90, 400];
      handR = [90, 400];
      sleeve(ctx, [[-104, 160], [-138, 320], [-104, 384]], seed + 240, 50);
      sleeve(ctx, [[104, 160], [138, 320], [104, 384]], seed + 241, 50);
    } else if (arms === "swing") {
      handL = [-150, 120];
      handR = [150, 120];
      sleeve(ctx, [[-104, 160], [-150, 230], [-152, 150]], seed + 240, 46);
      sleeve(ctx, [[104, 160], [150, 230], [152, 150]], seed + 241, 46);
    } else if (arms === "up") {
      handL = [-200, -150];
      handR = [200, -150];
      sleeve(ctx, [[-104, 160], [-170, 40], [-196, -110]], seed + 240, 46);
      sleeve(ctx, [[104, 160], [170, 40], [196, -110]], seed + 241, 46);
    } else if (arms === "reach") {
      const k = p.reach ?? 1;
      sleeve(ctx, [[-104, 160], [-128, 290], [-130, 404]], seed + 240, 50);
      handR = [130 + 180 * k, 404 - 150 * k];
      rotR = -0.6 * k;
      sleeve(ctx, [[104, 160], [130 + 60 * k, 290 - 30 * k], [handR[0] - 30 * k, handR[1] + 10]], seed + 241, 48);
    }
    // earbud wires + ipod
    if (p.earbuds !== false) {
      const hy = p.headY ?? 0;
      inkLine(ctx, [[-124, 54 + hy], [-112, 170], [-40, 300], [0, 336]], seed + 250, 2.4, "#111");
      inkLine(ctx, [[124, 54 + hy], [110, 170], [40, 300], [0, 336]], seed + 251, 2.4, "#111");
      poly(ctx, [[-14, 336], [14, 336], [14, 380], [-14, 380]], seed + 252, 0.8);
      paint(ctx, "#f2f2f2", C.ink, 3);
      oval(ctx, 0, 366, 6, 6, seed + 253, 0.4);
      paint(ctx, null, C.ink, 2);
    }
    p.holding?.(ctx);
    if (arms !== "table" || true) {
      hand(ctx, handL[0], handL[1], seed + 260, 30, rotL);
      hand(ctx, handR[0], handR[1], seed + 261, 30, rotR);
    }
  }
  head(ctx, p, seed);
  ctx.restore();
}

/** Small helper so acts can bob the head on the beat. */
export const bob = (abs: number, amp = 4, speed = 2) => Math.sin(abs * Math.PI * speed) * amp + jit(abs, 0);
