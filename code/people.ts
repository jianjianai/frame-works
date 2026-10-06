import { C, Ctx, Pt, blob, curve, hash, inkLine, oval, paint, poly } from "./draw";

/** Everyone else. Until the twist they wear the cover's crossed-out "X" face. */
export interface Person {
  hair?: "short" | "long" | "bob" | "pony" | "buzz" | "cap" | "bun" | "curly";
  hairColor?: string;
  top?: string;
  bottom?: string;
  shoes?: string;
  skin?: string;
  x?: number; // 0..1, how much of the X mark is visible
  face?: "smile" | "laugh" | "neutral" | "o";
  arms?: "down" | "laugh" | "behind" | "up" | "phone" | "handL" | "handR" | "point" | "hold" | "waveL";
  wave?: number; // 0..1 hand raised for "waveL"
  legs?: "stand" | "walk" | "sit";
  walk?: number;
  body?: "bust" | "full";
  turn?: number; // -1..1 head turn
  tilt?: number;
  glasses?: boolean;
  seed?: number;
  /** drawn between arms and hands */
  holding?: (ctx: Ctx) => void;
}

export const CAST: Record<string, Person> = {
  jie: { hair: "short", hairColor: "#1f1a17", top: "#ef8a3a", bottom: "#3b4a63", shoes: "#f2f2f2", seed: 301 },
  yu: { hair: "curly", hairColor: "#2a1d18", top: C.maroon, bottom: "#3a4440", shoes: "#f3c6cf", skin: "#d9a77c", seed: 302 },
  monitor: { hair: "pony", hairColor: "#3a2414", top: "#f2c94c", bottom: "#2f3b4f", glasses: true, seed: 303 },
  a: { hair: "buzz", hairColor: "#222", top: "#5aa36b", bottom: "#2d2d3a", seed: 304 },
  b: { hair: "long", hairColor: "#5a3a22", top: "#e9e4dc", bottom: "#6b7fa8", seed: 305 },
  c: { hair: "cap", hairColor: "#222", top: "#7d63b8", bottom: "#333", seed: 306 },
  d: { hair: "bun", hairColor: "#191515", top: "#e46f78", bottom: "#41506b", seed: 307 },
  e: { hair: "bob", hairColor: "#6b4a2a", top: "#4f8fbf", bottom: "#2e2e2e", seed: 308 },
};

/** The crossed-out face from the cover art. */
export function xMark(ctx: Ctx, cx: number, cy: number, r: number, seed: number, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineCap = "round";
  for (const [a, b] of [
    [[-r, -r * 0.8], [r, r * 0.85]],
    [[r * 0.95, -r * 0.85], [-r * 0.9, r * 0.8]],
  ] as [Pt, Pt][]) {
    curve(ctx, [[cx + a[0], cy + a[1]], [cx + (a[0] + b[0]) / 2, cy + (a[1] + b[1]) / 2], [cx + b[0], cy + b[1]]], seed++, 2);
    ctx.strokeStyle = C.xBlue;
    ctx.lineWidth = r * 0.42;
    ctx.stroke();
    ctx.strokeStyle = C.xWhite;
    ctx.lineWidth = r * 0.24;
    ctx.stroke();
  }
  ctx.restore();
}

function hairBack(ctx: Ctx, p: Person, seed: number) {
  const hc = p.hairColor ?? "#2a2220";
  if (p.hair === "long") {
    blob(ctx, [[-100, -40], [-112, 80], [-104, 200], [-60, 230], [60, 230], [104, 200], [112, 80], [100, -40], [0, -110]], seed, 2);
    paint(ctx, hc, C.ink, 5);
  } else if (p.hair === "pony") {
    blob(ctx, [[60, -80], [150, -60], [170, 30], [140, 120], [118, 40], [80, -20]], seed, 2);
    paint(ctx, hc, C.ink, 5);
  } else if (p.hair === "bun") {
    oval(ctx, 0, -110, 46, 40, seed, 1.5);
    paint(ctx, hc, C.ink, 5);
  } else if (p.hair === "curly") {
    const pts: Pt[] = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = i % 2 ? 118 : 104;
      pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.95 - 4]);
    }
    blob(ctx, pts, seed, 2);
    paint(ctx, hc, C.ink, 5);
  } else if (p.hair === "bob") {
    blob(ctx, [[-104, -20], [-110, 70], [-90, 110], [90, 110], [110, 70], [104, -20], [0, -112]], seed, 2);
    paint(ctx, hc, C.ink, 5);
  }
}
function hairFront(ctx: Ctx, p: Person, seed: number) {
  const hc = p.hairColor ?? "#2a2220";
  switch (p.hair ?? "short") {
    case "short":
      poly(ctx, [[-96, 4], [-104, -50], [-70, -96], [-20, -112], [40, -108], [90, -80], [104, -30], [96, 6], [70, -30], [40, -14], [10, -40], [-20, -16], [-50, -40], [-74, -10]], seed, 1.5);
      paint(ctx, hc, C.ink, 5);
      break;
    case "buzz":
      blob(ctx, [[-92, -20], [-80, -80], [0, -102], [80, -80], [92, -20], [40, -50], [-40, -50]], seed, 1.2);
      paint(ctx, hc, C.ink, 4);
      break;
    case "cap":
      blob(ctx, [[-98, -16], [-88, -86], [0, -110], [88, -86], [98, -16]], seed, 1.2);
      paint(ctx, p.top ?? "#c33", C.ink, 5);
      blob(ctx, [[-110, -18], [60, -30], [150, -8], [60, 0], [-100, 2]], seed + 1, 1.2);
      paint(ctx, p.top ?? "#c33", C.ink, 5);
      break;
    case "curly": {
      const pts: Pt[] = [];
      for (let i = 0; i <= 12; i++) {
        const a = Math.PI + (i / 12) * Math.PI;
        const r = i % 2 ? 116 : 98;
        pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.95 - 4]);
      }
      pts.push([90, -10], [50, -40], [10, -18], [-40, -44], [-90, -8]);
      blob(ctx, pts, seed, 2);
      paint(ctx, hc, C.ink, 5);
      break;
    }
    default:
      blob(ctx, [[-100, 10], [-100, -60], [-50, -104], [20, -110], [86, -84], [104, -20], [100, 10], [70, -40], [10, -30], [-50, -46]], seed, 1.5);
      paint(ctx, hc, C.ink, 5);
  }
}

function face(ctx: Ctx, p: Person, seed: number) {
  const f = p.face ?? "smile";
  const tx = (p.turn ?? 0) * 30;
  if (f === "laugh" || f === "smile") {
    inkLine(ctx, [[tx - 50, 10], [tx - 36, 0], [tx - 22, 10]], seed, 4.5);
    inkLine(ctx, [[tx + 22, 10], [tx + 36, 0], [tx + 50, 10]], seed + 1, 4.5);
  } else {
    for (const sx of [-36, 36]) {
      oval(ctx, tx + sx, 6, 7, 9, seed + sx, 0.6);
      paint(ctx, C.ink, null);
    }
  }
  if (f === "laugh") {
    blob(ctx, [[tx - 30, 38], [tx + 30, 38], [tx + 18, 66], [tx - 18, 66]], seed + 3, 1);
    paint(ctx, "#6b2730", C.ink, 4);
  } else if (f === "o") {
    oval(ctx, tx, 50, 10, 13, seed + 3, 0.6);
    paint(ctx, "#6b2730", C.ink, 3.5);
  } else if (f === "smile") {
    inkLine(ctx, [[tx - 22, 40], [tx, 54], [tx + 22, 40]], seed + 3, 4);
  } else inkLine(ctx, [[tx - 14, 46], [tx + 14, 46]], seed + 3, 4);
  oval(ctx, tx - 56, 34, 16, 9, seed + 4, 0.8);
  paint(ctx, "rgba(240,120,120,0.45)", null);
  oval(ctx, tx + 56, 34, 16, 9, seed + 5, 0.8);
  paint(ctx, "rgba(240,120,120,0.45)", null);
  if (p.glasses) {
    for (const sx of [-36, 36]) {
      oval(ctx, tx + sx, 6, 26, 22, seed + 8 + sx, 0.8);
      paint(ctx, null, C.ink, 4);
    }
    inkLine(ctx, [[tx - 10, 4], [tx + 10, 4]], seed + 9, 4);
  }
}

function sleeve(ctx: Ctx, pts: Pt[], seed: number, color: string, w = 44) {
  curve(ctx, pts, seed, 1.2);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = w + 10;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
}
function hand(ctx: Ctx, x: number, y: number, seed: number, skin: string) {
  oval(ctx, x, y, 26, 24, seed, 1);
  paint(ctx, skin, C.ink, 4);
}

/** Draw a person with head centre at (x, y). */
export function drawPerson(ctx: Ctx, x: number, y: number, s: number, p: Person) {
  const seed = p.seed ?? 500;
  const skin = p.skin ?? C.skin;
  const top = p.top ?? "#888";
  const xa = p.x ?? 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const body = p.body ?? "full";
  // legs
  if (body === "full") {
    const ph = p.walk ?? 0;
    for (const side of [-1, 1]) {
      const sw = p.legs === "walk" ? Math.sin(ph) * side : 0;
      const fx = side * 40 + sw * 90,
        fy = p.legs === "sit" ? 520 : 640 - (p.legs === "walk" ? Math.max(0, Math.cos(ph) * side) * 24 : 0);
      poly(ctx, [[side * 44 - 46, 340], [side * 44 + 46, 340], [fx + 46, fy - 8], [fx - 46, fy - 8]], seed + side, 1.4);
      paint(ctx, p.bottom ?? "#334", C.ink, 5);
      oval(ctx, fx + side * 6, fy + 4, 46, 20, seed + 3 + side, 1.1);
      paint(ctx, p.shoes ?? "#1d1b1c", C.ink, 4);
    }
  }
  const arms = p.arms ?? "down";
  if (arms === "behind") {
    // arms hidden behind the back: elbows poke out
    sleeve(ctx, [[-84, 150], [-112, 250], [-80, 320]], seed + 20, top);
    sleeve(ctx, [[84, 150], [112, 250], [80, 320]], seed + 21, top);
  }
  // torso
  const torso: Pt[] = [[-84, 130], [0, 116], [84, 130], [104, 220], [100, 350], [0, 358], [-100, 350], [-104, 220]];
  blob(ctx, torso, seed + 10, 1.5);
  paint(ctx, top, C.ink, 5);
  let hl: Pt | null = [-108, 340],
    hr: Pt | null = [108, 340];
  switch (arms) {
    case "down":
      sleeve(ctx, [[-86, 150], [-108, 240], [-108, 320]], seed + 20, top);
      sleeve(ctx, [[86, 150], [108, 240], [108, 320]], seed + 21, top);
      break;
    case "laugh":
      hl = [-40, 250];
      hr = [96, 120];
      sleeve(ctx, [[-86, 150], [-110, 250], [-56, 260]], seed + 20, top);
      sleeve(ctx, [[86, 150], [130, 200], [100, 140]], seed + 21, top);
      break;
    case "point":
      hl = [-40, 250];
      hr = [200, 120];
      sleeve(ctx, [[-86, 150], [-110, 250], [-56, 260]], seed + 20, top);
      sleeve(ctx, [[86, 150], [150, 150], [184, 126]], seed + 21, top);
      break;
    case "up":
      hl = [-150, -110];
      hr = [150, -110];
      sleeve(ctx, [[-86, 150], [-130, 30], [-146, -80]], seed + 20, top);
      sleeve(ctx, [[86, 150], [130, 30], [146, -80]], seed + 21, top);
      break;
    case "hold":
      hl = [-150, 60];
      hr = [150, 60];
      sleeve(ctx, [[-86, 150], [-140, 160], [-150, 80]], seed + 20, top);
      sleeve(ctx, [[86, 150], [140, 160], [150, 80]], seed + 21, top);
      break;
    case "phone":
      hl = [-30, 250];
      hr = [30, 250];
      sleeve(ctx, [[-86, 150], [-110, 260], [-50, 262]], seed + 20, top);
      sleeve(ctx, [[86, 150], [110, 260], [50, 262]], seed + 21, top);
      break;
    case "handL":
      // reaching out to the left (holding hands with someone)
      hl = [-170, 300];
      sleeve(ctx, [[-86, 150], [-120, 250], [-150, 296]], seed + 20, top);
      sleeve(ctx, [[86, 150], [108, 240], [108, 320]], seed + 21, top);
      break;
    case "handR":
      hr = [170, 300];
      sleeve(ctx, [[-86, 150], [-108, 240], [-108, 320]], seed + 20, top);
      sleeve(ctx, [[86, 150], [120, 250], [150, 296]], seed + 21, top);
      break;
    case "behind":
      hl = hr = null;
      break;
    case "waveL": {
      const w = p.wave ?? 1;
      hl = [-150 - 40 * w + Math.sin((p.walk ?? 0) * 3) * 18 * w, 60 - 190 * w];
      hr = [150, 60];
      sleeve(ctx, [[-86, 150], [-150 - 20 * w, 140 - 60 * w], [hl[0], hl[1] + 30]], seed + 20, top);
      sleeve(ctx, [[86, 150], [140, 160], [150, 80]], seed + 21, top);
      break;
    }
  }
  p.holding?.(ctx);
  if (hl) hand(ctx, hl[0], hl[1], seed + 30, skin);
  if (hr) hand(ctx, hr[0], hr[1], seed + 31, skin);
  // head
  ctx.save();
  ctx.rotate(p.tilt ?? 0);
  hairBack(ctx, p, seed + 40);
  oval(ctx, 0, 0, 96, 100, seed + 50, 1.4);
  paint(ctx, skin, C.ink, 5);
  if (xa < 1) {
    ctx.save();
    ctx.globalAlpha *= 1 - xa;
    face(ctx, p, seed + 60);
    ctx.restore();
  }
  hairFront(ctx, p, seed + 70);
  xMark(ctx, (p.turn ?? 0) * 26, 16, 66, seed + 80, xa);
  ctx.restore();
  ctx.restore();
}

/** Pink rolled/unrolled banner "生日快乐". `open` 0 = rolled, 1 = fully open. */
export function banner(ctx: Ctx, x: number, y: number, w: number, open: number, label: string, seed: number, fontFamily: string) {
  const h = 150;
  const ww = Math.max(40, w * open);
  ctx.save();
  poly(ctx, [[x - ww / 2, y - h / 2], [x + ww / 2, y - h / 2 + 6], [x + ww / 2, y + h / 2], [x - ww / 2, y + h / 2 - 6]], seed, 2);
  paint(ctx, "#ff7fb0", C.ink, 5);
  if (open > 0.6) {
    ctx.globalAlpha *= (open - 0.6) / 0.4;
    ctx.font = `400 96px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 10;
    ctx.strokeStyle = C.ink;
    ctx.strokeText(label, x, y + 6);
    ctx.fillStyle = "#fff6c9";
    ctx.fillText(label, x, y + 6);
  }
  ctx.restore();
  for (const side of [-1, 1]) {
    oval(ctx, x + (side * ww) / 2, y, 22, h / 2 + 8, seed + side, 1);
    paint(ctx, "#ff9cc3", C.ink, 5);
  }
}

/** Little "哈哈哈" laugh scribbles around a point. */
export function hahas(ctx: Ctx, cx: number, cy: number, r: number, t: number, seed: number, fontFamily: string, count = 6) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < count; i++) {
    const a = hash(seed + i) * Math.PI * 2;
    const rr = r * (0.6 + hash(seed + i * 3) * 0.5);
    const born = hash(seed + i * 7) * 0.8;
    const k = Math.max(0, Math.min(1, (t - born) * 4));
    if (k <= 0) continue;
    const sz = 44 + hash(seed + i * 5) * 30;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    ctx.rotate((hash(seed + i * 9) - 0.5) * 0.7);
    ctx.scale(k, k);
    ctx.font = `400 ${sz}px ${fontFamily}`;
    ctx.lineWidth = 8;
    ctx.strokeStyle = C.ink;
    ctx.strokeText("哈哈哈", 0, 0);
    ctx.fillStyle = i % 2 ? "#ffe45c" : "#fff";
    ctx.fillText("哈哈哈", 0, 0);
    ctx.restore();
  }
  ctx.restore();
}
