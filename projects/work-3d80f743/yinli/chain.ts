// 人链（用户 2026-10-15 改）：最上面是小石头——他从她的铁靴里走出来，光着脚往上飞去找她；老钟从窗里扑出来抓住他的脚踝；
// 之后一个接一个抓上来的，都是她救过的人（用户：「第一个爷爷后面陆续抓在后面的人也换成她救过的人」）：
// 周磊、千斤、阿满、她的砖救下的老太太和年轻人、十二年里她在街上拽下来的人……每个人胸前挂着她送的那块砖。
// 每个人站在地上抓住上面那个人的脚踝，等下一个人跑过来抓住自己，再被拽离地面（鞋留在街上）。
// 整条链一节一节往上长，126.0 小石头够到她的脚下。
import { type C, E, ph, clamp, mix, seeded } from "./core";
import { figure, pose, glowDot, walk, type Fig, type Kind, type Pt } from "./figure";
import { crowdLook, type Look } from "./palette";

export const CX = 218; // 人链在的地方（她那栋楼脚下的街心，副歌二小石头落地的地方）
export const BX = CX + 110; // 她那双铁靴：小石头从里面走出来，靴子一直立在街上
export const SPACING = 188;
export const BOTTOM_HIP = -222;
export const QIN_HIP = -8560; // 她停在白边上时胯部的高度

export const T_JOIN = 119.35; // 周磊抓住老钟的脚踝；从这里起一个接一个从下面接上
const N0 = 2.2; // 小石头、老钟，和站在地上的周磊
const N_END = 44.25; // 126.0 小石头正好够到她脚下；最后接上的那个人还站在地上拽着
/** 链上有几个人（可以是小数：最下面那个人正在接上来） */
export function chainCount(t: number) {
  if (t < T_JOIN) return 0;
  const p = clamp((t - T_JOIN) / (126.0 - T_JOIN));
  return N0 + (N_END - N0) * p * p;
}
/** 第 k 个人跑到链底下、伸手的时刻（chainCount 正好等于 k） */
export const joinTime = (k: number) => T_JOIN + Math.sqrt(Math.max(0, k - N0) / (N_END - N0)) * (126.0 - T_JOIN);

const rnd = seeded(2026);
const KINDS: Kind[] = ["plain", "woman", "plain", "woman", "man"];
interface Member {
  kind: Kind;
  name?: string;
  tone: number;
  hair?: Fig["hair"];
  tie?: boolean;
  bell?: boolean;
  look?: Partial<Look>;
}
/** 链上的人，从上往下。小石头、老钟之后，全是她救过的人（看得出来的排在前面，在街上一个个跑来抓住） */
const NAMED: Member[] = [
  { kind: "kid", name: "小石头", tone: 0, bell: true },
  { kind: "old", name: "老钟", tone: 0.05 },
  { kind: "man", name: "周磊（开场她在半空抓住的人）", tone: 0, tie: true },
  { kind: "girl", name: "千斤（她从楼顶跳下去抱住的女孩）", tone: 0 },
  { kind: "worker", name: "阿满（她从电车顶上拽下来的人）", tone: 0.05 },
  { kind: "woman", name: "窗口的老太太（千斤拿她的砖救下的）", tone: 0.05, look: { hair: "#eee6df", top: "#b7a3cf", bottom: "#8f7fae", legs: "#6f6283" } },
  { kind: "plain", name: "周磊拽下来的年轻人", tone: 0.08, look: crowdLook(77) },
  { kind: "man", name: "十二年里她在街上拽下来的人", tone: 0.08, tie: false, look: crowdLook(61) },
  { kind: "woman", name: "十二年里她在街上拽下来的人", tone: 0.08, look: crowdLook(66) },
];
export const MEMBERS: Member[] = Array.from({ length: 48 }, (_, k) => {
  if (k < NAMED.length) return NAMED[k];
  // 其余的：这些年她白天送过砖、拽下来过的人（衣服各不相同，不和上面认得出的人撞色）
  const kind = KINDS[Math.floor(rnd() * KINDS.length)];
  return { kind, tie: kind === "man" ? false : undefined, tone: 0.08 + rnd() * 0.2, look: crowdLook(100 + k * 7) };
});

export interface ChainState {
  n: number; // 人数
  drop: number; // 整条链往下沉了多少（尾声）
  qinAnkle?: Pt; // 她的脚踝（最上面的人去抓）
  grab?: number; // 0..1 小石头抓住她的脚踝
  topHand?: Pt; // 小石头的右手松开她的脚踝，和她的手握在一起的地方
  pull?: number; // 0..1 她握住他的手，把他往上拉了一点
  landedSpread?: number;
}
/** 第 k 个人（0 = 最上面的周磊）的胯部位置 */
export function memberHip(k: number, s: ChainState, t: number): Pt {
  // 他抓住她的脚踝、她握住他的手把他往上拉：整条链跟着往上一提（最下面那个人的脚也离了地）
  const g = s.grab ?? 0;
  const pl = s.pull ?? 0;
  const base = BOTTOM_HIP - (s.n - 1 - k) * SPACING - 45 * g - 95 * pl; // 他往上一够抓住她的脚踝；她把他往上一拉
  const y0 = base + s.drop;
  const y = Math.min(y0, -89);
  const sway = Math.sin(base * 0.0009 + t * 0.7) * 70 * clamp(-base / 3000);
  // 抓住她的脚踝以后，最上面几个人不再晃：他正在她脚下；被拉上去时挨着她的腿
  let x = mix(CX + sway, CX - 50 + 35 * pl, g * Math.max(0, 1 - k / 6));
  if (y0 >= -89 && s.drop > 0) {
    // 落地的人往两边站开
    const side = k % 2 ? 1 : -1;
    const spot = CX + side * (150 + (k % 14) * 52 + Math.floor(k / 14) * 20);
    x = mix(x, spot, clamp((y0 + 89) / 600));
  }
  return [x, y];
}

/** 画整条链（只画镜头里看得见的人）。vy0/vy1 是可见的世界 y 范围 */
export function drawChain(c: C, t: number, s: ChainState, vy0: number, vy1: number, o: { warm?: number; detail?: boolean; glow?: number; top?: Fig; skip?: number[] } = {}) {
  const count = Math.ceil(s.n);
  if (count <= 0) return;
  const warm = o.warm ?? 0.8;
  let above: Pt | null = null;
  const poses: { f: Fig; landed: boolean }[] = [];
  for (let k = 0; k < count; k++) {
    const m = MEMBERS[k % MEMBERS.length];
    const [x, y] = memberHip(k, s, t);
    const landed = y >= -89.5;
    let hands: { hL?: Pt; hR?: Pt; aL?: number; aR?: number } = {};
    const holding = landed && k === count - 1 && above && s.drop === 0; // 站在地上的最后一个人：攥着上面那个人的脚踝
    if (holding && above) hands = s.n - k < 0.2 ? { aL: Math.PI - 0.5, aR: Math.PI + 0.4 } : { hR: [above[0] + 2, above[1] + 4], hL: [above[0] - 3, above[1] + 26] };
    else if (landed) hands = { aL: -0.3, aR: 0.3 };
    else if (k === 0) {
      if (s.qinAnkle && (s.grab ?? 0) > 0) {
        const g = s.grab ?? 0;
        const free: Pt = [x + 10, y - 125];
        hands = { hR: [mix(free[0], s.qinAnkle[0], g), mix(free[1], s.qinAnkle[1] + 4, g)], hL: [mix(free[0] - 14, s.qinAnkle[0] - 4, g), mix(free[1] + 6, s.qinAnkle[1] + 28, g)] };
        if (s.topHand) hands.hR = s.topHand;
      } else hands = { aL: Math.PI - 0.25 + Math.sin(t * 2) * 0.08, aR: Math.PI + 0.2 };
    } else if (above) hands = { hR: [above[0] + 2, above[1] + 4], hL: [above[0] - 3, above[1] + 26] };
    const f: Fig = k === 0 && o.top ? o.top : {
      x,
      y: landed ? 0 : y,
      grounded: landed,
      kind: m.kind,
      facing: k >= 3 ? (k % 2 ? -1 : 1) : k % 2 ? 1 : -1, // 跑过来的人保持跑来的朝向
      float: landed ? 0 : 0.55,
      barefoot: true,
      boots: false,
      tie: m.tie,
      bell: m.bell,
      look: m.look,
      head: landed ? 0.9 : 0.85,
      legL: landed ? undefined : -0.12,
      legR: landed ? undefined : 0.18,
      kneeL: landed ? undefined : 0.35,
      kneeR: landed ? undefined : 0.25,
      tone: m.tone,
      rim: 0.7,
      stone: warm,
      ...hands,
    };
    const j = pose(f);
    above = j.anR;
    if (!o.skip?.includes(k)) poses.push({ f, landed });
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
    if (f.hR) glowDot(c, f.hR[0], f.hR[1], 3.5, warm * 0.9);
    void j;
  }
}

/** 还没抓上来的人：从街两边跑过来，正好在轮到自己的时刻跑到链底下、举起手（接着由 drawChain 画） */
export function drawRunners(c: C, t: number, n: number, kMax = 12, runFor = 0.85) {
  for (let k = Math.max(3, Math.ceil(n)); k < kMax; k++) {
    const tj = joinTime(k);
    if (t < tj - runFor || t >= tj) continue;
    const m = MEMBERS[k];
    const side = k % 2 ? 1 : -1;
    const u = ph(t, tj - runFor, tj);
    const x = CX + side * 620 * (1 - E.out(u));
    const w = walk((t - tj) * 2.6 + k * 0.37, u < 0.85 ? 0.75 : 0);
    const reach = E.io(ph(t, tj - 0.25, tj));
    figure(c, { x, y: 0, grounded: true, kind: m.kind, tie: m.tie, look: m.look, facing: side > 0 ? -1 : 1, tone: m.tone, rim: 0.7, stone: 1, lean: -side * 0.22 * (1 - reach), legL: w.legL * (1 - reach), legR: w.legR * (1 - reach), kneeL: w.kneeL * (1 - reach), kneeR: w.kneeR * (1 - reach), head: mix(0.4, 0.9, reach), aL: mix(w.aL ?? -0.4, Math.PI - 0.5, reach), aR: mix(w.aR ?? 0.4, Math.PI + 0.4, reach), eyes: "wide" }, t);
  }
}

/** 街上一地脱下来的鞋（越来越多）：人链底下，每个被拽离地面的人留下一双 */
export function shoesOnStreet(c: C, n: number) {
  const r = seeded(31);
  const cols = ["#c95d50", "#5b7fc1", "#e0a53e", "#8a5a42", "#6f9f7a", "#a46fb0", "#3e3149"];
  for (let k = 2; k < Math.floor(n) - 1 && k < 48; k++) {
    const x = CX + (((k * 53) % 240) - 120);
    c.fillStyle = cols[k % cols.length];
    for (const dx of [-9, 9]) {
      c.save();
      c.translate(x + dx, -5);
      c.rotate(((k * 0.37 + dx * 0.05) % 1) - 0.5);
      c.beginPath();
      c.ellipse(0, 0, 11, 6, 0, 0, Math.PI * 2);
      c.fill();
      c.fillRect(-11, -11, 9, 10);
      c.restore();
    }
  }
  for (let i = 0; i < Math.floor(n * 1.2); i++) {
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
