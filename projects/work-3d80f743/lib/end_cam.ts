// 终章（lib/end_t.ts）的镜头。每一段都是「把世界里的一点放到画面某处」（aim），下一段从上一段在交接时刻的值出发（camLerp），
// 一个镜头里不跳。镜头快慢按剧情：冲、扑、抓、跺快而干脆；笑、慢放、静、回报慢、停得住。

import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { TE, type V2, breath, lerp, mix } from "./end_t";
import { X_K, ZW } from "./end_map";
import { HB_REST, X_LAND, herAt, herChest, kidAt, kidRoot } from "./end_pair";
import { X_JOIN } from "./end_rise";

const KID_CHEST: V2 = [4, -232];
const kidChest = (t: number): V2 => {
  const r = kidRoot(t);
  return [r[0] + KID_CHEST[0], r[1] + KID_CHEST[1]];
};
const withBreath = (c: Cam, t: number, px = 3, k = 1): Cam => {
  const [bx, by] = breath(t, px * k);
  return { ...c, x: c.x + bx / c.z, y: c.y + by / c.z };
};

// ——————————————— 街：远景推到他身上（四②那一镜，他挪到老钟窗边） ———————————————
export function streetCam(t: number): Cam {
  const wide = aim(X_K + 40, 0, 540, 1380, 0.14);
  const close = aim(X_K + 40, -180, 540, 1210, 0.95);
  let c = camLerp(wide, close, E.io(ph(t, TE.push0, TE.push1)));
  // 脚跟离地以后跟着他往上抬一点
  const lift = -kidRoot(t)[1];
  const up = aim(X_K + 40, -180 - lift, 540, 1210 - 180 * E.io(ph(t, TE.lift0, TE.ceil + 0.2)), 0.97);
  c = camLerp(c, up, E.io(ph(t, TE.lift0 - 0.05, TE.lift0 + 0.2)));
  const kk = kick(t, TE.thud, 0.1);
  return { ...c, z: c.z * (1 + 0.04 * kk), y: c.y + (6 * kk * Math.sin((t - TE.thud) * 55)) / c.z };
}

// ——————————————— 天花板：她醒来（接四①最后的取景：她睡着的脸和空着的手） ———————————————
export function ceilCam(t: number): Cam {
  const [bx, by] = breath(t, 2.5);
  // 睁眼那一下急推一震；扭头时顺着她的视线往他那张空床挪一点
  const z0 = 2.4 * (1 + 0.035 * E.out(ph(t, TE.wake, TE.wake + 0.12)) + 0.04 * kick(t, TE.wake, 0.08));
  const look = E.io(ph(t, TE.look, TE.look + 0.22));
  const x = lerp(-40, -14, look);
  const y = lerp(-250, -258, look);
  return { x: x + bx / z0, y: y + by / z0, z: z0, r: 0 };
}

// ——————————————— 一镜到底：他冲上去 → 退开看见整栋楼和她的窗 → 她扑下来 → 越近推得越近 → 抱住 → 惯性下坠 → 停住 → 又飘起来 → 交靴 → 他坠下去 ———————————————
/** 贴着他往上冲：他在画面里不动，墙和窗往下刷 */
const riseCam = (t: number): Cam => aim(kidChest(t)[0] + 60, kidChest(t)[1], 540, 1010, 1.05);
/** 退开：整栋楼进画，她的窗在画面上面、他在下面 */
const WIN_TOP: V2 = [-2915, -8290];
function revealCam(t: number): Cam {
  const k = kidChest(t);
  const top = WIN_TOP;
  const z = (1450 - 300) / (k[1] - top[1]);
  return aim((k[0] + top[0]) / 2, (k[1] + top[1]) / 2, 540, (1450 + 300) / 2, z);
}
/** 两个人越近推得越近：倍数按两个人的竖着的距离，中心在两人中间 */
function convergeCam(t: number): Cam {
  const h = herChest(t);
  const k = kidChest(t);
  const span = Math.abs(k[1] - h[1]) + 180;
  const z = Math.min(2.0, Math.max(0.2, 1350 / span));
  return aim((h[0] + k[0]) / 2, (h[1] + k[1]) / 2 + 20, 540, 960, z);
}
/** 抱住以后跟着两个人（她的胸口）往下坠：晚一点到，街面从画面下面冲上来；停住时靴底和石板在画面下面 */
const PAIR_OFF: V2 = [30, 40];
function fallCam(t: number): Cam {
  const h = herChest(t);
  const zf = lerp(2.0, 1.3, E.out(ph(t, TE.catch, TE.catch + 0.5)));
  const lag = 0.04;
  const hl = herChest(t - lag);
  return aim(lerp(h[0], hl[0], 0.5) + PAIR_OFF[0], lerp(h[1], hl[1], 0.6) + PAIR_OFF[1], 540, 900, zf);
}
/** 又飘起来、交靴：跟着两个人慢慢往上；交靴时柔和起步、越推越慢推到两张脸和手上；掰手指时再凑近到围巾上那两只手 */
function holdCam(t: number): Cam {
  const h = herChest(t);
  const z = 1.3 * (1 + 0.12 * E.out(ph(t, TE.stop - 0.05, TE.stop + 0.25))) * Math.pow(1.6 / 1.456, E.settle(ph(t, TE.decide, TE.clutch))) * Math.pow(2.1 / 1.6, E.settle(ph(t, TE.clutch - 0.1, TE.release)));
  const fy = lerp(h[1] + 120, h[1] - 40, E.settle(ph(t, TE.clutch - 0.1, TE.release)));
  return aim(h[0] + 50, fy, 540, 940, z);
}
/** 松手：跟着他往下（她从画面上面冲出去），落地一震 */
function dropCam(t: number): Cam {
  const a = holdCam(TE.release);
  const k = kidChest(t);
  const b = aim(k[0] + 20, k[1] - 40, 540, 1060, 1.35);
  return camLerp(a, b, E.io(ph(t, TE.release, TE.land - 0.05)));
}
/** 他落地以后：顺着他仰起来的脸往上抬一点（天上掉东西下来），跟着砖落到靴尖前面，「咚」一顶；停在铁靴和砖上（接第一视角低头看） */
function landCam(t: number): Cam {
  let c = dropCam(t);
  const k = kidChest(TE.land);
  c = camLerp(c, aim(k[0] + 20, k[1] - 210, 540, 1060, 1.35), E.out(ph(t, TE.land + 0.08, TE.land + 0.3)));
  return camLerp(c, aim(HB_REST[0] + 90, -190, 540, 1150, 1.55), E.io(ph(t, TE.brickHit - 0.24, TE.brickHit + 0.14)));
}
export function oneTakeCam(t: number): Cam {
  let c: Cam;
  if (t < 96.75) c = riseCam(t);
  else if (t < TE.jump) c = camLerp(riseCam(t), revealCam(t), E.out(ph(t, 96.75, 97.65)));
  else if (t < TE.catch) c = camLerp(revealCam(t), convergeCam(t), E.io(ph(t, TE.jump, TE.jump + 0.3)));
  else if (t < TE.stop + 0.6) c = camLerp(convergeCam(Math.min(t, TE.catch)), fallCam(t), E.out(ph(t, TE.catch, TE.catch + 0.25)));
  else c = holdCam(t);
  if (t > TE.stop - 0.2 && t < TE.stop + 0.6) c = camLerp(c, holdCam(t), E.io(ph(t, TE.stop - 0.2, TE.stop + 0.6)));
  if (t >= TE.release) c = t < TE.land ? dropCam(t) : landCam(t);
  // 抱住：一震、往里一顶；他落地：一沉一震；砖砸下来：轻轻一顶
  const kc = kick(t, TE.catch, 0.1);
  const kl = kick(t, TE.land, 0.1);
  const kb = kick(t, TE.brickHit, 0.08);
  c = { ...c, z: c.z * (1 + 0.05 * kc + 0.06 * kl + 0.03 * kb) };
  const sh = 12 * kc + 20 * kl + 7 * kb;
  return { ...c, x: c.x + (sh * Math.sin(t * 71)) / c.z, y: c.y + (sh * Math.sin(t * 57 + 1)) / c.z };
}

// ——————————————— 她越升越快，低头冲他笑（接第一视角抬头：镜头往上甩，追上她） ———————————————
export function smileCam(t: number): Cam {
  const h = herAt(t).head;
  // 甩上来：起先镜头比她快（她从画面上面落进来），追上以后和她一样快；最后她仰起脸，镜头慢一点（她往画面上面走）
  const sy = 860 - 520 * (1 - E.out(ph(t, TE.smile, TE.smile + 0.4))) - 140 * E.io(ph(t, TE.faceUp0, TE.stompCut));
  // 她在画面右边一点，左边是她家那栋楼的右墙（窗一排排往下刷，看得出升得快）
  return withBreath(aim(h[0] - 170, h[1] + 160, 540, sy, 1.3), t, 2.5, E.io(ph(t, TE.smile + 0.3, TE.smile + 0.8)));
}

// ——————————————— 跺地 ———————————————
export function stompCam(t: number): Cam {
  // 抬靴时越憋越紧地慢慢逼近（线性）；跺下去一震、往里一顶，被推开（坑、裂缝、老钟家的窗都在画面里）
  const near = aim(X_K + 70, -300, 540, 1000, 1.25 * (1 + 0.14 * ph(t, TE.stompCut, TE.stomp)));
  const far = aim(X_K + 120, -470, 540, 1000, 0.92);
  const c = camLerp(near, far, E.out(ph(t, TE.stomp + 0.02, TE.stomp + 0.72)));
  const kk = kick(t, TE.stomp, 0.12);
  const sh = 26 * kk;
  return { ...c, z: c.z * (1 + 0.06 * kick(t, TE.stomp, 0.1)), x: c.x + (sh * Math.sin(t * 73)) / c.z, y: c.y + (sh * Math.sin(t * 59 + 1)) / c.z };
}

// ——————————————— 慢放：白的边上 ———————————————
export function slowCam(t: number): Cam {
  const h = herAt(t).head;
  const z = 1.3 * Math.pow(1.55 / 1.3, E.settle(ph(t, TE.slow, TE.silent)));
  return withBreath(aim(h[0] + 20, h[1] + 90, 540, 900, z), t, 1.5);
}

// ——————————————— 静：老钟的特写（隔着裂了的窗：他的脸和墙上的钟） ———————————————
/** 窗洞里：老钟的脸在左边一点，右上是墙上的钟；线性慢推（越来越紧），钟每跳一下镜头轻轻一顿 */
export function zhongCloseCam(t: number): Cam {
  const z = 3.15 + 0.3 * ph(t, TE.silent, TE.zWide);
  const k = kick(t, TE.tick[0], 0.08) + kick(t, TE.tick[1], 0.08);
  const c = aim(ZW.x + 34, -515, 540, 930, z * (1 + 0.012 * k));
  return withBreath(c, t, 1.2);
}
// ——————————————— 第一声「活下去」：他从靴子里出来往上飘 → 老钟攥住他 → 被拽出窗 ———————————————
export function zhongCam(t: number): Cam {
  // 窗外拍：前景左边是穿着铁靴的他，右边窗后是老钟
  let c = aim(X_K + 190, -420, 540, 1010, 1.28);
  // 他从靴子里出来往上飘：镜头跟着抬起来，老钟的窗留在画面下面
  const up = aim(X_K + 190, -840, 540, 900, 1.25);
  c = camLerp(c, up, E.io(ph(t, TE.out2, TE.zGrab + 0.1)));
  // 老钟攥住以后镜头对准他（用户 2026-10-25：「这里镜头对准小石头」）：横着对准他，竖着不跟、只线性慢推（和前奏「一个人正在往上飘」
  // 一样：画面不动、人在动），他从画面中间一点点被拽上去，老钟被从下面拖进画面
  const onKid = aim(X_K + 20, -702, 540, 1180, 1.45 * (1 + 0.07 * ph(t, TE.zGrab, TE.chainCut)));
  c = camLerp(c, onKid, E.io(ph(t, TE.zGrab - 0.1, TE.zGrab + 0.6)));
  const kk = kick(t, TE.zGrab, 0.1);
  const sh = 10 * kk;
  return withBreath({ ...c, z: c.z * (1 + 0.04 * kk), x: c.x + (sh * Math.sin(t * 71)) / c.z, y: c.y + (sh * Math.sin(t * 57)) / c.z }, t, 2);
}

// ——————————————— 人链：街上一个抓住一个 → 切到高处的他 → 退到整幅 ———————————————
/** 第二声：街上的远景（两边的人跑过来，老钟家窗下一个接一个跳起来抓住；人链下半截先往右、再往左摆），慢慢往上抬一点 */
const streetChain = (t: number): Cam => {
  const k = kick(t, TE.joins.find((j) => t >= j && t < j + 0.4) ?? -10, 0.1);
  const c = aim(X_JOIN - 330, -1250 - 500 * E.io(ph(t, TE.chainCut, TE.highCut)), 540, 1000, 0.46);
  return { ...c, z: c.z * (1 + 0.012 * k) };
};
/** 第三声：高处的他（横着只跟一半：看得出随风摆；竖着晚一点跟上：看得出往上飘），脚下的人链往下伸出画面 */
const highAt = (t: number): Cam => {
  const k = kidChest(t);
  const lag = kidChest(t - 0.18);
  const x = -1650 + 0.35 * (k[0] + 1650);
  return aim(x, lerp(k[1], lag[1], 0.55) + 120, 540, 760, 0.9);
};
/** 第四声：整幅（人链从街上一直挂到白的边上，她在左上角） */
const WIDE: Cam = aim(-2120, -4520, 540, 960, 0.2);
export function chainCam(t: number): Cam {
  let c: Cam;
  if (t < TE.highCut) c = streetChain(t);
  else if (t < TE.pull0) c = highAt(t);
  else {
    const w: Cam = { ...WIDE, z: WIDE.z * (1 + 0.03 * E.io(ph(t, TE.pull1, TE.corner))) };
    c = camLerp(highAt(TE.pull0), w, E.out(ph(t, TE.pull0, TE.pull1)));
  }
  return withBreath(c, t, 2.5);
}

// ——————————————— 在这反乌托邦里：推到两个人（柔和起步、一路减速推到她的脸、他举着的砖上） ———————————————
export function handCam(t: number): Cam {
  const h = herAt(t);
  const k = kidChest(t);
  // 倒挂着的她（脸在下面）和他举着的砖：框住两张脸
  const p: V2 = [(h.head[0] + k[0]) / 2 + 10, (h.head[1] + k[1]) / 2 - 30];
  const z = 1.2 * Math.pow(2.0 / 1.2, E.settle(ph(t, TE.corner, TE.look1)));
  return withBreath(aim(p[0], p[1], 540, 900, z), t, 1.5);
}

// ——————————————— 尾奏：退到整幅（人链连着她和地面）→ 慢慢推进、跟着落下来 → 推到两个人落地 → 外套 → 低到她的光脚，「嘭」 ———————————————
export function endCam(t: number): Cam {
  const h = t < TE.herLand ? herChest(t) : herAt(t).chest;
  // 后奏一：从两个人的近景柔和起步、一路退到整幅：人链从她一直连到街上（她那里一团很强的光）
  const close = handCam(TE.descend);
  const wide = aim(-2080, -4560, 540, 960, 0.19);
  let c = camLerp(close, wide, E.settle(ph(t, TE.descend, TE.let0 - 0.2)));
  // 后奏二：人链散开，一个个慢慢落下来；镜头跟着她（抱着他）往下，慢慢推进
  const zf = 0.19 * Math.pow(0.62 / 0.19, E.io(ph(t, TE.let0 - 0.2, TE.herLand - 1.2)));
  const follow = aim(h[0] + 60, h[1] + 120, 540, 760 + 200 * E.io(ph(t, TE.let0, TE.herLand - 1)), zf);
  c = camLerp(c, follow, E.io(ph(t, TE.let0 - 0.4, TE.let0 + 0.8)));
  // 后奏三：推到两个人，落地
  const land = aim(X_LAND + 90, -330, 540, 1040, 1.3);
  c = camLerp(c, land, E.settle(ph(t, TE.herLand - 1.4, TE.herLand + 0.3)));
  // 后奏四：去捡外套、回来给他披上（框住她、他和地上的外套），很慢地凑近
  const coat = aim(X_LAND - 30, -300, 540, 1080, 1.36 * (1 + 0.06 * E.io(ph(t, TE.coatOn0, TE.stand))));
  c = camLerp(c, coat, E.io(ph(t, TE.putDown, TE.coat0 + 0.4)));
  // 结尾：低下来贴地拍她的光脚（和开场拍铁靴一样）；「嘭」一震，坑张开，再慢慢抬起来看两个人
  const feet = aim(X_LAND - 60, -120, 540, 1200, 2.1);
  c = camLerp(c, feet, E.settle(ph(t, TE.back + 0.1, TE.stomp2 - 0.45)));
  const after = aim(X_LAND - 10, -330, 540, 1080, 1.05);
  c = camLerp(c, after, E.settle(ph(t, TE.stomp2 + 0.5, TE.fade0 + 0.4)));
  const kk = kick(t, TE.stomp2, 0.12);
  const sh = 22 * kk;
  return withBreath({ ...c, z: c.z * (1 + 0.06 * kk), x: c.x + (sh * Math.sin(t * 73)) / c.z, y: c.y + (sh * Math.sin(t * 59 + 1)) / c.z }, t, 2);
}
export { kidAt, mix, withBreath };
