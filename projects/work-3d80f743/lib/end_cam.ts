// 终章（lib/end_t.ts）的镜头。每一段都是「把世界里的一点放到画面某处」（aim），下一段从上一段在交接时刻的值出发（camLerp），
// 一个镜头里不跳。镜头快慢按剧情：冲、扑、抓、跺快而干脆；笑、慢放、静、回报慢、停得住。

import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { TE, type V2, breath, herm, lerp, mix } from "./end_t";
import { X_K, ZW } from "./end_map";
import { HB_REST, X_LAND, herAt, herBrickAt, herChest, kidAt, kidRoot } from "./end_pair";
import { MEMBERS, PIVOT, X_JOIN } from "./end_rise";
import { memberHead } from "./end_chain";

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
/**
 * 又飘起来、交靴：跟着两个人慢慢往上；交靴时柔和起步、越推越慢推到两个人身上；
 * 他攥住围巾摇头、她摸他的头：推到两张脸上（和副歌一他妈妈割绳那一镜同样的构图：她的脸在上面，他的头和她的手在中间，2 倍多），停住看他松手
 */
function holdCam(t: number): Cam {
  const h = herChest(t);
  const close = E.settle(ph(t, TE.boot2[1], TE.patUp));
  const z = 1.3 * (1 + 0.12 * E.out(ph(t, TE.stop - 0.05, TE.stop + 0.25))) * Math.pow(1.6 / 1.456, E.settle(ph(t, TE.decide, TE.clutch))) * Math.pow(2.25 / 1.6, close) * (1 + 0.025 * ph(t, TE.patUp, TE.release));
  const fy = lerp(h[1] + 120, h[1] - 50, close);
  return aim(h[0] + 50 + 14 * close, fy, 540, 940, z);
}
/** 松手：跟着他往下（她从画面上面冲出去），落地一震 */
function dropCam(t: number): Cam {
  const a = holdCam(TE.release);
  const k = kidChest(t);
  const b = aim(k[0] + 20, k[1] - 40, 540, 1060, 1.35);
  return camLerp(a, b, E.io(ph(t, TE.release, TE.land - 0.05)));
}
/**
 * 他落地以后：顺着他仰起来的脸往上抬（天上掉东西下来），接住从上面掉进画面的砖，跟着砖往下落（砖在画面中间偏上，背景往上冲），
 * 「咚」砸在靴尖前面一顶；之后推到砖上（砖在画面中间、靴尖在旁边），接第一视角低头看它——
 * 用户 2026-10-26：「这里掉下落得砖需要运镜一下……让观众注意到这块砖，这样切换到第一视角捡起这块砖才不疑惑」（原来镜头一直对着他，砖小小地落在左边，0.28 秒就切走）
 */
function landCam(t: number): Cam {
  let c = dropCam(t);
  const k = kidChest(TE.land);
  c = camLerp(c, aim(k[0] + 20, k[1] - 260, 540, 1060, 1.35), E.out(ph(t, TE.land + 0.06, TE.land + 0.26)));
  // 跟着砖落：对准砖（晚 0.03 秒），砖在画面上 820
  const b = herBrickAt(Math.min(t - 0.03, TE.brickHit));
  if (b) c = camLerp(c, aim(b.c[0] + 40, b.c[1], 540, 820, 1.5), E.io(ph(t, TE.land + 0.14, TE.brickHit - 0.06)));
  // 砸地以后推到砖上
  const z = 1.5 * Math.pow(2.9 / 1.5, E.out(ph(t, TE.brickHit + 0.03, TE.pov)));
  return camLerp(c, aim(HB_REST[0] + 30, HB_REST[1] - 20, 540, 900, z), E.out(ph(t, TE.brickHit - 0.02, TE.brickHit + 0.2)));
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
  const her = herAt(t);
  const h = her.head;
  // 甩上来：起先镜头比她快（她从画面上面落进来），追上以后和她一样快；最后她仰起脸，镜头慢一点（她往画面上面走）
  const up = E.io(ph(t, TE.faceUp0, TE.stompCut));
  const sy = 860 - 520 * (1 - E.out(ph(t, TE.smile, TE.smile + 0.4))) - 140 * up;
  // 横着对准她（用户 2026-10-26，1:46.50：「这里镜头对准主角」；原来她在画面右边、左边留给她家那栋楼的右墙）
  const wide = aim(her.chest[0], h[1] + 160, 540, sy, 1.3);
  // 追上她以后一路慢慢推到她的脸上（全片最后一次看清她的脸：低头冲他笑，眼泪一颗颗往上飘）；她仰起脸朝着白时不再推，
  // 她往画面上面走（2026-10-26 用户确认的优化；原来一直是 1.3 倍的全身）
  const close = aim(h[0] + 6, h[1] + 30, 540, 860 - 260 * up, 3.6);
  const c = camLerp(wide, close, E.settle(ph(t, TE.smile + 0.24, TE.faceUp0 + 0.15)));
  return withBreath(c, t, 2.5, E.io(ph(t, TE.smile + 0.3, TE.smile + 0.8)));
}

// ——————————————— 跺地 ———————————————
export function stompCam(t: number): Cam {
  // 抬靴时越憋越紧地慢慢逼近（线性）；跺下去一震、往里一顶，被推开（坑、裂缝、老钟家的窗都在画面里）
  // 用户 2026-10-26（1:48.90）：「这里也对准小石头」——横着对准他（原来他在画面左边），竖着他的胸口在画面正中偏下一点（脚下留一截街面给坑）
  const near = aim(X_K - 15, -170, 540, 1110, 1.25 * (1 + 0.14 * ph(t, TE.stompCut, TE.stomp)));
  const far = aim(X_K - 15, -110, 540, 1150, 0.92);
  const c = camLerp(near, far, E.out(ph(t, TE.stomp + 0.02, TE.stomp + 0.72)));
  const kk = kick(t, TE.stomp, 0.12);
  const sh = 26 * kk;
  return { ...c, z: c.z * (1 + 0.06 * kick(t, TE.stomp, 0.1)), x: c.x + (sh * Math.sin(t * 73)) / c.z, y: c.y + (sh * Math.sin(t * 59 + 1)) / c.z };
}

// ——————————————— 慢放：白的边上 ———————————————
export function slowCam(t: number): Cam {
  const h = herAt(t).head;
  // 极慢地推向她的脸（1.3 → 2.1；原来到 1.55）：发梢化成光的时候看得清她闭着眼的样子，张开的两只手还在画面里
  const z = 1.3 * Math.pow(2.1 / 1.3, E.settle(ph(t, TE.slow, TE.silent)));
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
/** 第一声的镜头；老钟被拽出窗的时候不切、退到街上（见 streetHold） */
export const zhongCam = (t: number): Cam => withBreath(camLerp(zhongRaw(t), streetHold(t), streetW(t)), t, 2);
function zhongRaw(t: number): Cam {
  // 窗外拍，一开始贴近他（用户 2026-10-26，1:54.47：「镜头一开始离小石头近一点，不要把爷爷放进去，小石头被爷爷抓住的时候镜头才拉远，
  // 把他们两放进去」）：对准他的胸口（横着正中稍右一点，竖着晚 0.15 秒跟上：看得出往上飘），近到老钟（在他右边约 230）在画面外
  const k = kidChest(t);
  const lag = kidChest(t - 0.15);
  let c = aim(k[0], lerp(k[1], lag[1], 0.6), 580, 900, 2.5);
  // 老钟攥住的那一下才退开，把两个人都放进来；之后横着对准他，竖着不跟、只线性慢推（和前奏「一个人正在往上飘」一样：画面不动、人在动），
  // 他从画面中间一点点被拽上去，老钟被从下面拖进画面
  const onKid = aim(X_K + 14, -702, 540, 1180, 1.3 * (1 + 0.07 * ph(t, TE.zGrab, TE.chainCut)));
  c = camLerp(c, onKid, E.io(ph(t, TE.zGrab - 0.05, TE.zGrab + 0.75)));
  const kk = kick(t, TE.zGrab, 0.1);
  const sh = 10 * kk;
  return { ...c, z: c.z * (1 + 0.04 * kk), x: c.x + (sh * Math.sin(t * 71)) / c.z, y: c.y + (sh * Math.sin(t * 57)) / c.z };
}

// ——————————————— 人链（2026-10-26 第九次改，用户：「非常完美，就这样改」）：四声各讲一件事 ———————————————
// 第一声老钟 → 大家来了（镜头钉在街上）→ 一路往上爬过每个人、爬到他 → 顺着他的视线摇到白的边上的她：睁眼、看见、认出来、翻身攥住栏杆 →
// 第四声从她的脸往后拉开到整条人链（她看见的），人链先往右荡开、再往左 → 「在这反乌托邦里」推到他（handCam）。
// 镜头只往一个方向走：街上 → 往上 → 到她 → 拉开看全部（原来是往上跟、往下扫、往后拉、往前推，来回四次）。一镜到底，不切。

/** 镜头从对准他和老钟退到街上：老钟滑过窗台、被拽出窗的时候，露出跑来的人 */
const streetW = (t: number) => E.io(ph(t, TE.streetIn0, TE.streetIn1));
/**
 * 大家来了：镜头钉在街上——地面在画面下面，老钟家窗户底下（一个接一个跳起来攥住的地方）在画面中间偏右一点，不跟着他往上：
 * 他和老钟被拽出画面上沿；她救过的人从街两边、铺子里、楼门里跑来，一个接一个跳起来攥住，被拽上去；五层楼关上的窗一扇扇推开。
 * 极慢地凑近一点；每接上一个人轻轻一震，最后一个人蹲低钉住那一下镜头跟着一沉
 */
const STREET_X = X_JOIN - 90;
const STREET_Y = 1700;
const STREET_Z = 0.62;
function streetHold(t: number): Cam {
  let jl = -10;
  for (const j of TE.joins) if (t >= j) jl = j;
  const last = TE.joins[TE.joins.length - 1];
  const k = kick(t, jl, 0.1);
  const sink = kick(t, last, 0.14);
  const z = STREET_Z * (1 + 0.035 * E.io(ph(t, TE.streetIn1, TE.climb0 + 0.3)));
  const c = aim(STREET_X, 0, 540, STREET_Y, z * (1 + 0.012 * k + 0.02 * sink));
  return { ...c, y: c.y - (14 * sink * Math.cos((t - last) * 30)) / c.z };
}

/** 单调三次插值（Fritsch–Carlson，两头速度为 0）：过每个点、不冲过头 */
function monoCubic(xs: number[], ys: number[], x: number): number {
  const n = xs.length;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m: number[] = [0];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m.push(0);
    else {
      const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
      const w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1]);
      m.push((w1 + w2) / (w1 / d[i - 1] + w2 / d[i]));
    }
  }
  m.push(0);
  let i = 0;
  while (x > xs[i + 1]) i++;
  return herm(ys[i], m[i], ys[i + 1], m[i + 1], xs[i + 1] - xs[i], (x - xs[i]) / (xs[i + 1] - xs[i]));
}
/** 最温和的缓入缓出（两头速度为 0，中段只比平均快一半） */
const ss = (x: number) => x * x * (3 - 2 * x);

/**
 * 一路往上：从街上最后那个人攥着的手起，顺着人链往上爬，一张脸一张脸经过（每个人都仰着头看他：使劲、哭着笑、咬着牙）。
 * 经过每张脸的时刻（从下往上：攥着的手、街上那个人的头、路人……认得出的人……老钟、他的胸口）：起步柔，路人越爬越快（一闪而过，竖向拖影），
 * 到她救过、认得出的人慢下来（第三声「活」上正好爬到周磊），越来越慢地爬到他。按单调三次插值连成一条平滑的速度曲线（不顿、不刹）
 */
const CLIMB_AT: number[] = (() => {
  const gaps = [0.26, 0.16, 0.12, 0.1, 0.09, 0.09, 0.09, 0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.2, 0.28];
  const out = [TE.climb0];
  for (const g of gaps) out.push(out[out.length - 1] + g);
  const k = (TE.climbTop - out[0]) / (out[out.length - 1] - out[0]);
  return out.map((v) => out[0] + (v - out[0]) * k);
})();
/** 认得出的人（扎马尾的女学生）在 CLIMB_AT 里从第几个起 */
const CLIMB_KNOWN = 1 + (MEMBERS.length - 1 - 8);
function climbCam(t: number): Cam {
  // 这一刻每张脸在哪（人链只有风往左吹的一点弯）
  const ys = [PIVOT[1]];
  for (let i = MEMBERS.length - 1; i >= 0; i--) ys.push(memberHead(t, i)[1] + 30);
  ys.push(kidChest(t)[1]);
  const y = monoCubic(CLIMB_AT, ys, t);
  // 横着：沿「街上那一点—他」这条线走，加上风吹的那一点弯（不跟着每个人左右错落晃）
  const kx = kidChest(t)[0];
  const f = Math.max(0, Math.min(1, (y - ys[0]) / (ys[ys.length - 1] - ys[0])));
  const lineX = PIVOT[0] + (kx - PIVOT[0]) * f - 60 * 4 * f * (1 - f);
  // 倍数：路人那一段 0.66，到认得出的人慢慢推近，爬到他 0.95。
  // 看着的那张脸：起步时在街上那个取景里攥着的手的地方（画面下面），爬起来以后挪到画面中间偏下（上面留出要来的人），到他时回到中间。
  // 挪多少按已经爬了多高算（不按时间）：起步时人链还没动，画面先往上挪的话镜头会先往下一沉
  const z = 0.66 * Math.pow(0.95 / 0.66, E.io(ph(t, CLIMB_AT[CLIMB_KNOWN - 1], TE.climbTop)));
  const sy0 = STREET_Y + PIVOT[1] * STREET_Z;
  const sy = sy0 + (1180 - sy0) * ss(Math.min(1, f / 0.3)) - 180 * ss(ph(t, CLIMB_AT[CLIMB_AT.length - 3], TE.climbTop));
  return aim(lineX, y, 540, sy, z);
}
/**
 * 她：镜头顺着他的视线往左摇到白的边上的她（停着、张着手、闭着眼，头发一点点化成光）；对准她的脸（脸在画面上 1/3 往下一点，张开的手还有一点在画面里）。
 * 她睁开眼、往下看见他和他底下所有人、认出来捂住嘴；翻身时跟着她往下，倒挂以后框住她的脸和攥着栏杆的两只手（栏杆在画面上面）
 */
function herCam(t: number): Cam {
  const h = herAt(t);
  // 摇过来时（倍数和爬到他时差不多）框住她大半个人；摇到了、她睁开眼，才柔和起步、越推越慢地推到她的脸上（认出来时推稳），之后极慢地再凑一点
  const z = 1.15 * Math.pow(1.85 / 1.15, E.settle(ph(t, TE.toHer1 - 0.1, TE.know + 0.4))) * (1 + 0.04 * ph(t, TE.know + 0.4, TE.flip0));
  const hover = aim(h.head[0] + 30, h.head[1] + 150, 540, 800, z);
  const hang = aim(h.head[0] + 10, h.head[1] - 130, 540, 1040, 1.55);
  return camLerp(hover, hang, E.io(ph(t, TE.flip0 + 0.1, TE.hang + 0.25)));
}

/**
 * 整幅：画面是正的，地面贴着画面下边，人链从街上一直伸进头顶的白里，倒挂的她在左上楼顶上，街坊仰着头站在街上
 * （用户 2026-10-26：倾斜的两版都不对，「把倾斜的这个想法撤销」；2:04.65「感觉这里拉得太远了」：0.15 → 0.195，正好装下整条人链）。
 * 光退下去以后（后奏一）同一个机位再看一次：这一次人链连上了她（endCam）
 */
const WIDE: Cam = aim(-1800, 0, 540, 1880, 0.195);
/**
 * 拉到以后不停：继续极慢地往后漂（屏着一口气看着整条人链，越漂越慢），一直漂到推向他；
 * 他往左荡向她时镜头也跟着往左（用户 2026-10-26，2:05.12：「这里小石头向左，镜头也跟着向左」），只跟他横着走的三成
 * （原来七成；2:13.10 用户要「展示整个人链，先向右摇，之后向左摇」，跟得多了画面里看不出人链在往左荡），0.8 秒柔和地跟上
 */
let KX_WIDE = NaN;
function wideAt(t: number): Cam {
  if (Number.isNaN(KX_WIDE)) KX_WIDE = kidChest(TE.wide1)[0];
  const pan = t > TE.wide1 ? 0.3 * (kidChest(t)[0] - KX_WIDE) * E.io(ph(t, TE.wide1, TE.wide1 + 0.8)) : 0;
  return { ...WIDE, x: WIDE.x + pan, z: WIDE.z * (1 - 0.035 * E.out(ph(t, TE.wide1 - 0.3, TE.corner))) };
}
/** 退开：起步极轻（前 45% 里从 0 慢慢加上来），之后越退越慢（二次方减速，比三次方柔） */
const pullCurve = (u: number) => (1 - (1 - u) * (1 - u)) * ss(Math.min(1, u / 0.45));
/** 大家来了 → 一路往上 → 摇到她 → 第四声从她的脸往后拉开到整条人链（她看见的）→ 停在整幅上，他往左荡时跟着往左；「在这反乌托邦里」推向他（handCam） */
export function chainCam(t: number): Cam {
  let c: Cam;
  if (t < TE.climb0) c = streetHold(t);
  else if (t < TE.toHer0) c = camLerp(streetHold(t), climbCam(t), ss(ph(t, TE.climb0, TE.climb0 + 0.35)));
  else if (t < TE.pull0) c = camLerp(climbCam(t), herCam(t), E.io(ph(t, TE.toHer0, TE.toHer1)));
  else c = camLerp(herCam(t), wideAt(t), pullCurve(ph(t, TE.pull0, TE.wide1)));
  return withBreath(c, t, 2);
}
/** 一路往上爬的时候镜头在画面上竖着走了多少（拖影用） */
export const climbing = (t: number) => t > TE.climb0 && t < TE.climbTop;

// ——————————————— 在这反乌托邦里：推到他，荡过去把砖递给她 → 一接过来就亮 → 立即松开栏杆抱住他、转正 ———————————————
/**
 * 用户 2026-10-26：「下一个镜头拉近到小石头，跟着小石头向左摇，把砖递给主角」（之前：「砖递给主角之后立即发光，不要等」）。
 * 从整幅推过来（不切）：对准他的胸口跟着往左（他在画面右边一点，左边留出他要去的地方，倒挂着的她从左边进来）；递到她手里那 0.65 秒过渡到框住两个人（她的脸和他）；她松开栏杆抱住他时柔和起步、越推越慢地推近一点
 */
export function handCam(t: number): Cam {
  // 「在这反乌托邦里」（用户 2026-10-26：「镜头拉近到小石头，继续向左摇，结束时小石头成功把砖递给主角」）：
  // 从整幅（还在跟着他往左）柔和起步地推到他身上，推到了就对准他跟着往左荡；他荡到她跟前时过渡到框住两个人
  const c = handRaw(t);
  const e = E.io(ph(t, TE.corner, TE.closeIn));
  return withBreath(e < 1 ? camLerp(wideAt(t), c, e) : c, t, 1.5 + 0.5 * (1 - e));
}
function handRaw(t: number): Cam {
  const k = kidChest(t);
  const lag = kidChest(t - 0.1);
  const follow = aim(lerp(k[0], lag[0], 0.5), lerp(k[1], lag[1], 0.5) - 40, 660, 900, 1.7);
  const h = herAt(t);
  const p: V2 = [(h.head[0] + k[0]) / 2 + 10, (h.head[1] + k[1]) / 2 - 30];
  const z = 1.55 * Math.pow(1.75 / 1.55, E.settle(ph(t, TE.hug, TE.hug + 1.4)));
  const pair = aim(p[0], p[1], 540, 900, z);
  const c = camLerp(follow, pair, E.io(ph(t, TE.hand - 0.3, TE.hand + 0.35)));
  // 转正以后推到她的脸上停住（她睁开眼看着砖、一滴眼泪往下掉在砖上）：她的脸在画面上面一点，砖在画面中间偏下，他的脸挨在她下巴旁边；
  // 停住以后只极慢地再凑一点，拉远（TE.dim0）从这里起
  const face = aim(h.head[0] + 40, h.head[1] + 110, 540, 820, 3.9 * (1 + 0.03 * ph(t, TE.faceIn + 0.8, TE.dim0)));
  return camLerp(c, face, E.io(ph(t, TE.faceIn, TE.faceIn + 0.8)));
}

// ——————————————— 「在这反乌托邦里」后半句起：拉远、整个画面暗下去，光在正中照亮整个画面 → 人链散开、慢慢推向两个人 → 落地 → 外套 → 低到她的光脚，「嘭」 ———————————————
export function endCam(t: number): Cam {
  const h = t < TE.herLand ? herChest(t) : herAt(t).chest;
  // 后奏一（用户：「镜头拉远，让天上的白变暗，这个全部画面都变暗，让主角的光在屏幕中间……点亮全部屏幕」）：
  // 从两个人的近景退开，砖（她的光）一直在画面正中，不往下摇去看人链；光退下去的时候才接着退到整条人链（第二次整幅，见下）
  // 「在这反乌托邦里」后半句（TE.dim0）就开始退，句子唱完退稳，光一炸开镜头被推得一顶
  const close = handCam(TE.dim0 - 1e-3);
  const b = herBrickAt(Math.min(t, TE.let0))!.c;
  // 从她脸上（约 4 倍）退开：2 秒，光炸开的时候退到一半多，剩下的在白里退完（原来从两个人的 1.75 倍退，1.4 秒）
  let c = camLerp(close, aim(b[0], b[1], 540, 960, 0.34), E.settle(ph(t, TE.dim0, TE.dim0 + 2.0)));
  c = { ...c, z: c.z * (1 + 0.04 * kick(t, TE.descend, 0.16)) };
  // 第二次整幅（2026-10-26 第九次改）：光退下去的时候接着往后退，退到和第四声同一个机位——第一次人链差一截、被风吹开；
  // 这一次连上了：人链从街上一直连到抱在一起的两个人，她的光在人链顶上（光退下去时两个人先露出来，人链跟着一节节露出来）
  c = camLerp(c, WIDE, E.io(ph(t, TE.rev0 - 0.3, TE.let0 - 0.3)));
  // 后奏二（用户：「人链散开，镜头慢慢向主角和小石头推」）：在整幅上看着人链从上往下一个个松手、飘下来，再跟着她（抱着他）往下，慢慢推近
  const zf = WIDE.z * Math.pow(0.62 / WIDE.z, E.io(ph(t, TE.let0 + 0.4, TE.herLand - 1.2)));
  const follow = aim(h[0] + 60, h[1] + 120, 540, 760 + 200 * E.io(ph(t, TE.let0, TE.herLand - 1)), zf);
  c = camLerp(c, follow, E.io(ph(t, TE.let0 + 0.2, TE.let0 + 1.8)));
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
