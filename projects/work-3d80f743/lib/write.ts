// 第二幕⑨「两块五的签字笔」（31.97–33.9）：从楼顶上抱着的两个人硬切进她的屋子（窗正好铺满画面的取景），柔和起步一路推到桌上——
// 「两块五的」推到她握笔的手上（笔杆上「2.5元」的价签、空白的砖，她低着的脸露在右上角），笔悬着想一想；
// 「签、字、笔」一个字写一个：活、下、去，镜头跟着笔尖轻轻往右挪、再凑近一点；底鼓每秒一下（像心跳），镜头跟着轻轻一凑。
// 镜头还是世界里的镜头（屋子用 roomMatrix 画在那扇窗里），这里按屋子坐标给取景。

import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { cameraInside, roomMatrix } from "./night";
import { ROOM, TEN_T, TWELVE_T, WRITE_T, roomChen } from "./room";
import { jointsOf } from "@materials/剪纸角色/code/chengtuo";

type V2 = [number, number];

/** 屋子坐标 → 世界坐标的缩放 */
const roomK = () => roomMatrix().a;
const toWorld = ([x, y]: V2): V2 => {
  const m = roomMatrix();
  return [m.a * x + m.e, m.d * y + m.f];
};
/** 把屋子里的一点放到画面上的 (sx, sy)，倍数按屋子坐标给（1 = ⑧ 铺满那一帧的屋子） */
export function aimRoom(p: V2, sx: number, sy: number, z: number): Cam {
  const [x, y] = toWorld(p);
  return aim(x, y, sx, sy, z / roomK());
}
/** 镜头按屋子坐标算的倍数 */
export const roomZ = (c: Cam) => c.z * roomK();

/** ⑨ 的镜头（31.97 起，接着 cameraInside） */
export function writeCam(t: number): Cam {
  const W = WRITE_T;
  let c = cameraInside(t);
  // 「两块五的」：推到桌上——空白的砖、悬着的笔和笔杆上的价签、从右上方伸过来的手（这一句的主角是那支笔），32.68 推到
  const A = aimRoom([350, 1312], 540, 1060, 4.6);
  c = camLerp(c, A, E.io(ph(t, W.start + 0.02, 32.68)));
  // 「签字笔」：一边写一边再凑近一点、跟着笔尖往右挪一点（写完那一下停住）
  const w = E.io(ph(t, W.chars[0][0], W.chars[2][1] + 0.1));
  if (t > W.chars[0][0]) c = camLerp(c, aimRoom([350 + 10 * w, 1314], 540, 1060, 4.6 * (1 + 0.08 * w)), E.io(ph(t, W.chars[0][0], W.chars[0][0] + 0.25)));
  // 底鼓每秒一下（像心跳）：轻轻一凑
  const k = kick(t, 32.016, 0.14) + kick(t, 33.016, 0.14);
  return { ...c, z: c.z * (1 + 0.01 * k) };
}

/**
 * ⑩ 的镜头（33.9 起，接着 writeCam）。情绪：暖、期待（「东拼西凑」的心意 → 抱着它，想去救她）。
 * 「东」从写完的笔尖那里往后、往左下舒一口气（越来越慢），落到桌前码成墙的砖上（2.4 倍，桌面、台灯的光在上面，不贴地）；
 * 「拼、西、凑、的、词」一个字一块地往右滑、一路微微往上（砖越码越高），向她滑过去；
 * 「词」她捧起砖时镜头抬起来转到她身上，「句」抱进怀里、闭上眼笑——越推越快地推近她和怀里的砖（期待），推着切回楼顶。
 * （第一版贴着地从暗处滑、最后退开把她放小，用户：「感觉有点压抑」）
 */
const TEN_STEPS = [34.14, 34.38, 34.62, 34.83, 34.95];
/** 码成墙的砖：第 i 个字时滑到哪（屋子 x） */
const TEN_XS = [70, 150, 230, 310, 380, 430];
export function tenCam(t: number): Cam {
  const T = TEN_T;
  let c = writeCam(t);
  let x = TEN_XS[0];
  for (let i = 0; i < TEN_STEPS.length; i++) {
    const a = i === 0 ? 34.0 : TEN_STEPS[i - 1];
    const u = ph(t, a, TEN_STEPS[i]);
    x += (TEN_XS[i + 1] - TEN_XS[i]) * (0.65 * u + 0.35 * E.io(u));
  }
  const up = ph(t, 34.0, 35.0);
  const glide = aimRoom([x, 1440 - 40 * up], 540, 1000, 2.4 * (1 + 0.06 * up));
  c = camLerp(c, glide, E.out(ph(t, T.start + 0.02, 34.3)));
  // 「词」抬起来转到她身上（她和怀里的砖），「句」以后越推越快地推近
  // （推近要按她和砖这一点为中心算：直接乘 z 会往右下漂）
  const push = Math.pow(ph(t, 35.25, T.end), 2.2);
  const her = aimRoom([590, 1310], 540, 980, 2.0 * (1 + 0.32 * push));
  c = camLerp(c, her, E.io(ph(t, 34.9, 35.4)));
  // 心跳一样的底鼓（34.016、35.017）
  const k = 0.01 * (kick(t, 34.016, 0.14) + kick(t, 35.017, 0.14));
  return { ...c, z: c.z * (1 + k) };
}

/** ⑫ 她身子的中间（胯和两肩中间的中点，屋子坐标）：转成横着时也在身子正中 */
function torsoAt(t: number): V2 {
  const ch = roomChen(t);
  const j = jointsOf(ch.pose);
  const x = (j.hip[0] + (j.shoulderL[0] + j.shoulderR[0]) / 2) / 2;
  const y = (j.hip[1] + (j.shoulderL[1] + j.shoulderR[1]) / 2) / 2;
  return [ch.root[0] + x * ROOM.s, ch.root[1] + y * ROOM.s];
}
/**
 * ⑫ 的镜头（37.79 起，切过来）。情绪（情绪运镜）：卸下 → 失重 → 被拉住。
 * 「顺便拯」卸下：贴近她和那双铁靴（2 倍），像压着分量一样线性地慢慢凑近；两只靴子落地，镜头各往下一沉。
 * 「救我」失重：她飘起来时镜头先屏住一下，再跟上她（对准她身子的中间、放在画面正中，晚 0.05 秒），一路跟到床上；
 * 画面跟着她转 180°（用户 2026-10-21：「改成跟随主角旋转一下」→「是180度旋转，跟随主角到床上」）：整间屋子绕着她顺时针转半圈，
 * 她在画面里只顺着转 90° 躺下——天花板转到了脚下，倒钉的床成了一张正着的床，她睡在里面；桌子、椅子、铁靴倒挂在上面。
 * 「自己」被拉住：39.016 脚绳一绷，镜头一顿；之后越来越慢地往后让开，露出整条线：床里的她、往上拉到倒挂着的椅子的脚绳、铁靴。
 * 转场（2026-10-21 用户：「这里出去后直接切换场景用一个过度即可，到新的场景保持镜头的旋转趋势直到回正」）：最后 0.17 秒又顺时针转起来、
 * 越转越快，一甩切到副歌一，那边接着同一个方向转、越转越慢，副歌鼓进来时转正。
 */
export const TWELVE_TURN = Math.PI;
/** 转场切到副歌一时画面还倒着多少（⑫ 转过了 180° 又往前转了一截，副歌一接着转完剩下的；负的 = 还差多少转正） */
export const NET_SPIN0 = -0.78 * Math.PI;
/** 转场前又转起来的那一段多长 */
const TWELVE_SPIN_T = 0.17;
/** ⑫ 她自己转成横着转了多少（0 竖着 → 1 躺平；按 rot 自己的单位归一） */
let rotBed = 0;
function turnAt(t: number) {
  rotBed ||= (roomChen(TWELVE_T.bed + 0.05).pose.rot as number | undefined) ?? 1;
  const r = (roomChen(t).pose.rot as number | undefined) ?? 0;
  return Math.max(0, Math.min(1, r / rotBed));
}
export function twelveCam(t: number): Cam {
  const W = TWELVE_T;
  // 卸下：她和靴子，线性慢推 6%
  const heavy = ph(t, W.start, W.rise0 + 0.1);
  let c = aimRoom([560, 1420], 540, 1060, 2.0 * (1 + 0.06 * heavy));
  // 失重：屏住一下以后跟上她（她在画面正中，画面绕着她转），一路跟到床上，转 180°
  if (t > W.rise0) {
    const p = torsoAt(t - 0.05);
    const zf = 2.06 * Math.pow(1.6 / 2.06, E.out(ph(t, W.rise0 + 0.08, W.bed)));
    // 画面转多少 = 她在画面里该转的（平平地从竖着转到躺下，0 → 90°）+ 她自己在屋里转的（逆时针 0 → 90°）：
    // 这样她在画面里一路顺着转、不会转过头；最后一共转 180°
    const seen = (TWELVE_TURN / 2) * E.io(ph(t, W.rise0 + 0.06, W.bed + 0.06));
    const follow = { ...aimRoom(p, 540, 960, zf), r: seen + (TWELVE_TURN / 2) * turnAt(t) };
    c = camLerp(c, follow, E.io(ph(t, W.rise0 + 0.06, W.rise0 + 0.26)));
  }
  // 被拉住以后：越来越慢地往后让开，露出整条线（画面倒着：床在下面，椅子、铁靴倒挂在上面）
  const all = aimRoom([360, 860], 540, 960, 1.18);
  c = camLerp(c, { ...all, r: c.r }, E.settle(ph(t, W.bed + 0.08, W.end + 0.1)));
  // 转场：最后 0.17 秒又顺时针转起来、越转越快（转过 180° 再往前 0.22π），副歌一接着这股转劲转完剩下的（lib/net.ts 的 NET_SPIN0）
  const spin = ph(t, W.end - TWELVE_SPIN_T, W.end);
  c = { ...c, r: c.r + (TWELVE_TURN + NET_SPIN0) * spin * spin };
  // 两只靴子落地一沉；脚绳一绷一顿
  const kb1 = kick(t, W.boot1, 0.1);
  const kb2 = kick(t, W.boot2, 0.1);
  const kb = kick(t, W.bed, 0.14);
  return { ...c, z: c.z * (1 + 0.02 * kb1 + 0.016 * kb2 + 0.02 * kb), y: c.y - (18 * (kb1 + kb2) + 26 * kb) / c.z };
}

export type { V2 };
