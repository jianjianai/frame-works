// 重做那一段（lib/fin_t.ts）里的老钟和他家（第一幕、副歌一同一条街，lib/dawn.ts 的 ZHONG_HOUSE）：
// 静（112.0）里端着茶杯在一楼窗后等她的脚步声，等不到，茶杯低下去；「咚」（114.013）——是她的脚步声。之后（推开窗、扑出去抓住他）
// 的动作在 act9 那一段接着写进 zhongMove。窗上两扇玻璃窗：推开以前关着（玻璃上一道反光）。

import { CAST, lookOf } from "@materials/剪纸角色/code/cast";
import { type MoveKey, type PoseIn } from "@materials/剪纸角色/code/chengtuo";
import { type Cam, E, ph, viewOf } from "./cam";
import { INK, drawTinted, part, rectPath } from "./world";
import { ARMS, live } from "./motion";
import { armL, legL, legR, armR } from "./poses";
import { pose } from "./dawn";
import { ZHONG_HOUSE } from "./dawn";
import { drawPerson } from "./people";
import { cupHold, drawHouse, drawHouseWindowFront } from "./props";
import { T8, T9 } from "./fin_t";

type V2 = [number, number];
export const OLD = CAST.老钟;
const WN = ZHONG_HOUSE.win;

/** 端着茶杯在窗后等：朝左望着她平常走过来的那边，担心 */
const Z_WAIT = pose(4, { face: -0.6, ...legR(6, -6), ...legL(-4, -2), neck: -4, expression: "担心", sad: 0.6, lookX: -0.7, lookY: 0.2 }, (l) => ({
  ...armL(10, 90, -10, "grip", l),
  ...armR(4, 20, 0, "relax", l),
}));
/** 茶杯低下去一点，低头（等不到） */
const Z_LOW = { ...Z_WAIT, neck: -16, expression: "难过" as const, sad: 0.8, lookX: -0.4, lookY: 0.8, ...armL(4, 40, 0, "grip", 4) };

/** 「咚」：是她的脚步声——一惊，茶杯一晃 */
const Z_JOLT = { ...Z_LOW, neck: 6, expression: "吓一跳" as const, sad: 0, lookX: -0.8, lookY: 0.1, ...armL(10, 80, -10, "grip", 4) };
/** 朝声音那边望（放下茶杯） */
const Z_TURN = pose(10, { face: -0.6, ...legR(6, -6), ...legL(-4, -2), neck: 10, expression: "吓一跳", lookX: -0.9, lookY: -0.2 }, (l) => ({
  ...armL(4, 30, 0, "relax", l),
  ...armR(4, 20, 0, "relax", l),
}));
/** 两只手推开窗 */
const Z_PUSH = pose(16, { face: -0.6, ...legR(6, -6), ...legL(-4, -2), neck: 14, expression: "吓一跳", lookX: -0.8, lookY: -0.5 }, (l) => ({
  ...armL(84, 20, 0, "open", l),
  ...armR(78, 24, 0, "open", l),
}));
/** 扑出窗口：身子往左探出去，远处那只手伸上去够他的脚踝，近处那只扳着窗框 */
const Z_LUNGE = pose(56, { face: -0.6, ...legR(10, -8), ...legL(-14, -6), neck: 34, expression: "使劲", teeth: 0.4, lookX: -0.3, lookY: -1 }, (l) => ({
  ...armL(60, 40, 0, "grip", l),
  ...armR(150, 10, 0, "grip", l),
}));
/** 死死攥着，被他往上拽：身子绷直，咬着牙 */
const Z_STRAIN = { ...Z_LUNGE, lean: 64, neck: 30, expression: "使劲" as const, teeth: 0.8 };
export const ZHONG_KEYS: MoveKey[] = [
  { t: 110, x: 0, p: Z_WAIT },
  { t: T8.silent + 0.25, p: Z_WAIT },
  { t: T8.edge + 0.25, ease: "inOut", p: Z_LOW },
  { t: T9.stomp, p: Z_LOW },
  { t: T9.stomp + 0.1, ease: "out", p: Z_JOLT },
  { t: T9.zhongTurn - 0.1, p: Z_JOLT },
  { t: T9.zhongTurn + 0.15, ease: "inOut", p: Z_TURN },
  { t: T9.zhongOpen, ease: "inOut", p: Z_PUSH },
  { t: T9.zhongOpen + 0.18, p: Z_PUSH },
  { t: T9.zhongGrab, ease: "out", p: Z_LUNGE },
  { t: T9.zhongGrab + 0.3, ease: "inOut", p: Z_STRAIN },
  { t: T9.zhongOut, p: Z_STRAIN },
] as MoveKey[];
export const ZHONG_OPTS = { look: lookOf(OLD), base: { wind: 0 }, idle: true, seed: 881, springs: ARMS, follow: 0 };
let MOVE: ReturnType<typeof live> | null = null;
/** act9 把后面的关键帧接上来（原样抄这里的再往后接，弹簧不跳） */
export function setZhongKeys(more: MoveKey[]) {
  MOVE = live([...ZHONG_KEYS, ...more], ZHONG_OPTS);
}
const move = () => (MOVE ??= live([...ZHONG_KEYS, { t: 160, p: Z_STRAIN }] as MoveKey[], ZHONG_OPTS));

/** 老钟在屋里站着时的根（窗台以下被墙挡住） */
export const ZHONG_IN: V2 = [WN.x + 10, -10];
export interface ZhongNow {
  pose: PoseIn;
  root: V2;
  /** 端不端着茶杯 */
  cup: boolean;
  /** 还在屋里（裁在窗里画）/ 探出窗外（窗台以上画在窗框前面）/ 出了窗 */
  where: "in" | "lean" | "out";
  /** 两扇玻璃窗推开了多少（0 关着、1 推开贴在两边） */
  open: number;
}
let ZHONG_AT: ((t: number) => ZhongNow) | null = null;
/** act9 换成它自己的（推开窗、扑出去、吊着……） */
export function setZhongAt(fn: (t: number) => ZhongNow) {
  ZHONG_AT = fn;
}
export function zhongNow(t: number): ZhongNow {
  if (ZHONG_AT) return ZHONG_AT(t);
  const p: PoseIn = { ...move()(t).pose };
  const open = E.out(ph(t, T9.zhongOpen + 0.02, T9.zhongOpen + 0.26));
  const cup = t < T9.zhongTurn + 0.15;
  let where: ZhongNow["where"] = t < T9.zhongGrab - 0.18 ? "in" : "lean";
  const root: V2 = [ZHONG_IN[0] - 30 * E.io(ph(t, T9.zhongGrab - 0.2, T9.zhongGrab)), ZHONG_IN[1]];
  const sc = OLD.scale;
  const loc = (q: V2): V2 => [(q[0] - root[0]) / sc, (q[1] - root[1]) / sc];
  if (t >= T9.zhongGrab - 0.15 && KID_ANKLE) {
    // 远处那只手攥住他的脚踝，近处那只扳着窗框左边
    const a = KID_ANKLE(t);
    const w = E.io(ph(t, T9.zhongGrab - 0.15, T9.zhongGrab));
    p.armR = { ...(p.armR as object), to: loc([a[0] + 6, a[1] + 6]), ik: w } as PoseIn["armR"];
    const jamb: V2 = [WN.x - WN.w / 2 - 6, -430 + 3 * Math.sin(t * 40) * E.io(ph(t, T9.zhongGrab + 0.3, T9.zhongOut))];
    p.armL = { ...(p.armL as object), to: loc(jamb), ik: w } as PoseIn["armL"];
  }
  if (t >= T9.zhongOut) where = "out";
  return { pose: p, root, cup, where, open };
}
/** 他远处那只脚踝（act9 设进来：老钟攥的地方） */
let KID_ANKLE: ((t: number) => V2) | null = null;
export function setKidAnkle(fn: (t: number) => V2) {
  KID_ANKLE = fn;
}
export const zhongMoveAt = (t: number) => move()(t);

/** 两扇玻璃窗：关着时盖住窗洞（玻璃上一道斜的反光），推开时往两边甩、窄成一条 */
function panes(g: CanvasRenderingContext2D, open: number, lw: number) {
  const x0 = WN.x - WN.w / 2;
  const x1 = WN.x + WN.w / 2;
  const top = WN.top;
  const sill = WN.sill;
  const half = WN.w / 2;
  for (const side of [-1, 1]) {
    const hinge = side < 0 ? x0 : x1;
    const w = half * (1 - 0.86 * open);
    const xa = side < 0 ? hinge : hinge - w;
    const p = rectPath(xa, top, w, sill - top);
    if (open < 0.05) {
      g.fillStyle = "rgba(196,214,226,0.22)";
      g.fill(p);
      g.save();
      g.clip(p);
      g.fillStyle = "rgba(255,255,255,0.28)";
      g.beginPath();
      g.moveTo(xa + w * 0.2, sill);
      g.lineTo(xa + w * 0.55, top);
      g.lineTo(xa + w * 0.78, top);
      g.lineTo(xa + w * 0.43, sill);
      g.closePath();
      g.fill();
      g.restore();
    } else {
      g.fillStyle = `rgba(196,214,226,${0.22 + 0.25 * open})`;
      g.fill(p);
    }
    g.strokeStyle = "#8f6f58";
    g.lineWidth = 9 * lw;
    g.strokeRect(xa, top, w, sill - top);
    g.strokeStyle = INK;
    g.lineWidth = 2.2 * lw;
    g.strokeRect(xa - 4.5 * lw, top - 4.5 * lw, w + 9 * lw, sill - top + 9 * lw);
  }
}

/** 老钟家（人这一层，世界坐标）：墙、门、二楼的窗，一楼窗里亮着灯、老钟站在窗后，玻璃窗、窗框压在他前面；探出窗外时窗台以上的身子压在窗框前面 */
export function drawZhongHouse(g: CanvasRenderingContext2D, t: number, cam: Cam) {
  const H = ZHONG_HOUSE;
  const v = viewOf(cam, 1);
  if (H.x0 > v.x1 + 200 || H.x1 < v.x0 - 200 || v.y1 < H.top - 300 || v.y0 > 200) return;
  const z = zhongNow(t);
  const lw = 1 / Math.sqrt(Math.max(0.3, cam.z));
  const hold = z.cup ? { hold: { L: cupHold } } : {};
  drawTinted(g, [H.x0 - 120, H.top - 260, H.x1 + 160, 60], (gg) => {
    drawHouse(gg, H, t);
    if (z.where !== "out") {
      gg.save();
      gg.beginPath();
      gg.rect(WN.x - WN.w / 2, WN.top, WN.w, WN.sill - WN.top);
      gg.clip();
      drawPerson(gg, OLD, z.pose, z.root[0], z.root[1], cam.z, hold);
      gg.restore();
    }
    panes(gg, z.open, lw);
    drawHouseWindowFront(gg, H);
    if (z.where === "lean") {
      // 探出窗外：窗台以上的身子、手压在窗框、玻璃窗前面（窗台以下还被墙挡着）
      gg.save();
      gg.beginPath();
      gg.rect(H.x0 - 1200, H.top - 2000, H.x1 - H.x0 + 2400, WN.sill - (H.top - 2000));
      gg.clip();
      drawPerson(gg, OLD, z.pose, z.root[0], z.root[1], cam.z, hold);
      gg.restore();
    }
  });
}
void E;
void ph;
void part;
