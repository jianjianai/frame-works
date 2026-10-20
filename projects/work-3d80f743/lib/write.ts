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
 * ⑩ 的镜头（33.9 起，接着 writeCam）：顺着桌子往下，落到地上那排砖上（拉开一点：5.4 → 2.8），贴着砖往左滑——
 * 别怕 34.14、会好的 34.55、有我在 34.95 正好滑到画面中间（起步慢慢加速，不一下子动起来）；35.0 往后一退、抬起来（2.8 → 1）：
 * 左边开着的门、码满砖的地、捧着砖站在桌边的她；她冲出门，镜头跟着往左挪一点；门「嘭」地一关，轻轻一震。一路往左、一路拉开，不往回推
 */
export function tenCam(t: number): Cam {
  const T = TEN_T;
  let c = writeCam(t);
  const d = Math.max(0, t - 34.05);
  const xs = 330 - 320 * (d - 0.12 * (1 - Math.exp(-d / 0.12)));
  c = camLerp(c, aimRoom([xs, 1598], 540, 1280, 2.8), E.io(ph(t, T.start + 0.05, 34.18)));
  c = camLerp(c, aimRoom([30, 1010], 540, 960, 1), E.io(ph(t, 34.98, 35.34)));
  c = camLerp(c, aimRoom([-70, 1010], 540, 960, 1), E.io(ph(t, 35.25, 35.8)));
  // 心跳一样的底鼓（34.016、35.017）、门一关
  const k = 0.01 * (kick(t, 34.016, 0.14) + kick(t, 35.017, 0.14)) + 0.018 * kick(t, T.slam1, 0.09);
  return { ...c, z: c.z * (1 + k) };
}

/**
 * ⑫ 的镜头（37.79 起，切过来）：中景，椅子上的她和脚边的地（靴子掉在这里），脱靴子时慢慢凑近一点，两只靴子落地各一震；
 * 她飘起来，镜头跟上去（中心挪到她身上，一边往后退）；躺进床里、脚绳绷直那一下一顿，最后落在整间屋子上：
 * 天花板上床里睡着的她、一根绷直的脚绳斜着拉到椅子后腿、地上两只空铁靴
 */
export function twelveCam(t: number): Cam {
  const W = TWELVE_T;
  let c = aimRoom([560, 1440], 540, 1180, 1.5 * (1 + 0.04 * E.io(ph(t, W.start, W.rise0 + 0.1))));
  const ch = roomChen(t);
  const j = jointsOf(ch.pose);
  const hip: V2 = [ch.root[0] + j.hip[0] * ROOM.s, ch.root[1] + j.hip[1] * ROOM.s];
  const zf = 1.56 * Math.pow(1.12 / 1.56, E.io(ph(t, W.rise0, W.bed)));
  c = camLerp(c, aimRoom([hip[0] - 30, hip[1] + 60], 540, 960, zf), E.io(ph(t, W.rise0 + 0.04, W.rise0 + 0.34)));
  c = camLerp(c, aimRoom([800, 960], 540, 960, 1), E.settle(ph(t, W.bed - 0.26, W.end)));
  const k = 0.022 * kick(t, W.boot1, 0.1) + 0.016 * kick(t, W.boot2, 0.1) + 0.012 * kick(t, W.bed, 0.12);
  return { ...c, z: c.z * (1 + k) };
}

export type { V2 };
