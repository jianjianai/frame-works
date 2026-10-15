// 人链：小石头穿着她的靴子站在地上，双手抓着最下面那个人的脚踝；每个人双手抓着上面那个人的脚踝；
// 最上面是周磊。新加入的人从下面接上，整条链往上长。
import { type C, clamp, mix, seeded } from "./core";
import { figure, pose, glowDot, type Fig, type Kind, type Pt } from "./figure";

export const CX = -3200 + 40; // 小石头站的位置
export const SPACING = 188;
export const BOTTOM_HIP = -222;
export const QIN_HIP = -8560; // 她停在白边上时胯部的高度

/** 链上有几个人（可以是小数：最下面那个人正在接上来） */
export function chainCount(t: number) {
  if (t < 118.8) return 0;
  if (t < 119.4) return clamp((t - 118.8) / 0.6);
  const p = clamp((t - 119.4) / (126.2 - 119.4));
  return 1 + 43.1 * p * p;
}

const rnd = seeded(2026);
const KINDS: Kind[] = ["plain", "woman", "worker", "man", "old", "girl", "plain", "woman"];
interface Member {
  kind: Kind;
  name?: string;
  tone: number;
  hair?: Fig["hair"];
  tie?: boolean;
}
export const MEMBERS: Member[] = Array.from({ length: 48 }, (_, k) => {
  if (k === 0) return { kind: "man", name: "周磊", tone: 0, tie: true };
  if (k === 3) return { kind: "worker", name: "阿满", tone: 0.05 };
  if (k === 5) return { kind: "weigher", name: "称重员", tone: 0.05 };
  if (k === 8) return { kind: "girl", name: "千斤", tone: 0 };
  if (k === 12) return { kind: "old", name: "老钟", tone: 0.05 };
  return { kind: KINDS[Math.floor(rnd() * KINDS.length)], tone: 0.08 + rnd() * 0.2 };
});

export interface ChainState {
  n: number; // 人数
  drop: number; // 整条链往下沉了多少（尾声）
  qinAnkle?: Pt; // 她的脚踝（最上面的人去抓）
  grab?: number; // 0..1 周磊抓住她的脚踝
  landedSpread?: number;
}
/** 第 k 个人（0 = 最上面的周磊）的胯部位置 */
export function memberHip(k: number, s: ChainState, t: number): Pt {
  const base = BOTTOM_HIP - (s.n - 1 - k) * SPACING;
  const y0 = base + s.drop;
  const y = Math.min(y0, -89);
  const sway = Math.sin(base * 0.0009 + t * 0.7) * 70 * clamp(-base / 3000);
  let x = CX + sway;
  if (y0 >= -89) {
    // 落地的人往两边站开
    const side = k % 2 ? 1 : -1;
    const spot = CX + side * (150 + (k % 14) * 52 + Math.floor(k / 14) * 20);
    x = mix(x, spot, clamp((y0 + 89) / 600));
  }
  return [x, y];
}

/** 画整条链（只画镜头里看得见的人）。vy0/vy1 是可见的世界 y 范围 */
export function drawChain(c: C, t: number, s: ChainState, vy0: number, vy1: number, o: { warm?: number; detail?: boolean; glow?: number } = {}) {
  const count = Math.ceil(s.n);
  if (count <= 0) return;
  const warm = o.warm ?? 0.8;
  let above: Pt | null = null;
  const poses: { f: Fig; landed: boolean }[] = [];
  for (let k = 0; k < count; k++) {
    const m = MEMBERS[k % MEMBERS.length];
    const [x, y] = memberHip(k, s, t);
    const landed = y >= -89.5;
    const fade = k === count - 1 ? clamp(s.n - k) : 1;
    let hands: { hL?: Pt; hR?: Pt; aL?: number; aR?: number } = {};
    if (landed) hands = { aL: -0.3, aR: 0.3 };
    else if (k === 0) {
      if (s.qinAnkle && (s.grab ?? 0) > 0) {
        const g = s.grab ?? 0;
        const free: Pt = [x + 10, y - 125];
        hands = { hR: [mix(free[0], s.qinAnkle[0], g), mix(free[1], s.qinAnkle[1] + 4, g)], hL: [mix(free[0] - 14, s.qinAnkle[0] - 4, g), mix(free[1] + 6, s.qinAnkle[1] + 28, g)] };
      } else hands = { aL: Math.PI - 0.25 + Math.sin(t * 2) * 0.08, aR: Math.PI + 0.2 };
    } else if (above) hands = { hR: [above[0] + 2, above[1] + 4], hL: [above[0] - 3, above[1] + 26] };
    const f: Fig = {
      x,
      y: landed ? 0 : y,
      grounded: landed,
      kind: m.kind,
      facing: k % 2 ? 1 : -1,
      float: landed ? 0 : 0.55,
      barefoot: true,
      boots: false,
      tie: m.tie,
      head: landed ? 0.9 : 0.85,
      legL: landed ? undefined : -0.12,
      legR: landed ? undefined : 0.18,
      kneeL: landed ? undefined : 0.35,
      kneeR: landed ? undefined : 0.25,
      tone: m.tone,
      rim: 0.7,
      alpha: fade,
      stone: warm,
      ...hands,
    };
    const j = pose(f);
    above = j.anR;
    poses.push({ f, landed });
  }
  // 远景：每个人胸前一团暖光，连起来是一串灯
  if (o.glow) {
    for (const { f, landed } of poses) {
      if (landed) continue;
      const j = pose(f);
      const g = c.createRadialGradient(j.neck[0], j.neck[1] + 20, 0, j.neck[0], j.neck[1] + 20, o.glow);
      g.addColorStop(0, `rgba(255,186,96,${0.8 * (f.alpha ?? 1)})`);
      g.addColorStop(0.45, `rgba(255,170,80,${0.35 * (f.alpha ?? 1)})`);
      g.addColorStop(1, "rgba(255,160,70,0)");
      c.fillStyle = g;
      c.fillRect(j.neck[0] - o.glow, j.neck[1] + 20 - o.glow, o.glow * 2, o.glow * 2);
    }
  }
  for (const { f } of poses) {
    const top = (f.y ?? 0) - 260;
    const bottom = (f.y ?? 0) + 160;
    if (bottom < vy0 || top > vy1) continue;
    const j = figure(c, f, t);
    // 握着的地方是暖的
    if (f.hR && !f.grounded) glowDot(c, f.hR[0], f.hR[1], 3.5, warm * 0.9);
    void j;
  }
}

/** 街上一地脱下来的鞋（越来越多） */
export function shoesOnStreet(c: C, n: number) {
  const r = seeded(31);
  const cols = ["#c95d50", "#5b7fc1", "#e0a53e", "#8a5a42", "#6f9f7a", "#a46fb0", "#3e3149"];
  for (let i = 0; i < Math.floor(n * 2.2); i++) {
    c.fillStyle = cols[i % cols.length];
    const x = CX + (r() - 0.5) * 1700;
    const rot = (r() - 0.5) * 1.6;
    c.save();
    c.translate(x, -5);
    c.rotate(rot);
    c.beginPath();
    c.ellipse(0, 0, 11, 6, 0, 0, Math.PI * 2);
    c.fill();
    c.fillRect(-11, -11, 9, 10);
    c.restore();
  }
}
