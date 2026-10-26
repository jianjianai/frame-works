// 终章（lib/end_t.ts）的镜头。每一段都是「把世界里的一点放到画面某处」（aim），下一段从上一段在交接时刻的值出发（camLerp），
// 一个镜头里不跳。镜头快慢按剧情：冲、扑、抓、跺快而干脆；笑、慢放、静、回报慢、停得住。

import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { TE, type V2, breath, herm, lerp, mix } from "./end_t";
import { X_K, ZW } from "./end_map";
import { HB_REST, X_LAND, herAt, herBrickAt, herChest, kidAt, kidRoot } from "./end_pair";
import { X_JOIN, chainH } from "./end_rise";
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
  const h = herAt(t).head;
  // 甩上来：起先镜头比她快（她从画面上面落进来），追上以后和她一样快；最后她仰起脸，镜头慢一点（她往画面上面走）
  const sy = 860 - 520 * (1 - E.out(ph(t, TE.smile, TE.smile + 0.4))) - 140 * E.io(ph(t, TE.faceUp0, TE.stompCut));
  // 她在画面右边一点，左边是她家那栋楼的右墙（窗一排排往下刷，看得出升得快）
  return withBreath(aim(h[0] - 170, h[1] + 160, 540, sy, 1.3), t, 2.5, E.io(ph(t, TE.smile + 0.3, TE.smile + 0.8)));
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
/** 第一声的镜头；第二声前 0.35 秒起不切、一路退成「整条人链」（见 streetChain） */
export const zhongCam = (t: number): Cam => withBreath(camLerp(zhongRaw(t), fitChain(t), fitW(t)), t, 2);
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

// ——————————————— 人链：街上一个抓住一个 → 跟着他往上 → 退到整幅，整条人链在空中摆 ———————————————
/**
 * 第二声：接着上一个镜头不切（用户 2026-10-26：「这里和上一个镜头保持同一个位置，整个镜头调度，随着人链变长镜头后拉，取消这个硬切」），
 * 退到画面里装下 5 个人就停住、改成跟着他往上（见 FIT_STOP）；
 * 从对准他的那个取景（zhongRaw）0.9 秒里（第二声前 0.35 秒起）过渡到「他的胸口在画面正中、往后退」的取景，人链越长退得越远。
 * 人链多高按前后 0.3 秒的平均算（一个个接上去是一级一级的，平均了镜头才是匀着往后退）
 */
const chainHAvg = (t: number, w = 0.3) => {
  let h = 0;
  for (let i = 0; i <= 8; i++) h += chainH(t - w + (2 * w * i) / 8) / 9;
  return h;
};
/** 他的胸口离地多高（按平均的人链高度，镜头才不一抽一抽） */
const chestH = (t: number) => chainHAvg(t) + 232;
/** 镜头竖着跟的高度：只平均前后 0.12 秒（越接越快时平均久了会落后，他会偏到画面上面） */
const chestFollowH = (t: number) => chainHAvg(t, 0.12) + 232;
/** 他的胸口在画面上 1/3（640；用户 2026-10-26（2:00.23）：「镜头低一点，让小石头在屏幕上面1/3的位置」，原来在正中）。
 * 地面在画面下面（1740）时的倍数：人链越长退得越远 */
const KID_Y = 640;
const fitZ = (t: number) => Math.min(1.5, (1740 - KID_Y) / chestH(t));
/** 用户 2026-10-26（1:59.45）：「这个镜头到这里就不要继续拉远了，改成跟随小石头向上」；（1:59.61）「这里镜头拉得太远了，镜头放5个人就行」；
 * （1:58.67）「镜头对准小石头」「上下也对准小石头」——他的胸口一直在画面正中；退到画面里装下 4–5 个人（他和下面三个多人，倍数 0.58；地面装不下就让它出画）
 * 就柔和地停住，倍数不再变，之后跟着他往上（背景往下沉、街面出画） */
const Z_FOLLOW = 0.58;
let fitStop = 0;
/** 退到 Z_FOLLOW 的那一刻 */
const FIT_STOP = () => {
  if (!fitStop) {
    fitStop = TE.highCut;
    for (let t = TE.chainCut; t < TE.highCut; t += 0.01)
      if (fitZ(t) <= Z_FOLLOW) {
        fitStop = t;
        break;
      }
  }
  return fitStop;
};
const fitChain = (t: number): Cam => {
  const z0 = fitZ(t);
  const ts = FIT_STOP();
  // 跟着他往上的时候偷偷推近（0.58 → 0.95，两秒多，看不出在推），第三声好从他的脸往下扫
  const z = z0 * Math.pow(fitZ(ts) / z0, E.io(ph(t, ts - 0.3, ts + 0.3))) * (1 + 0.64 * E.io(ph(t, 119.8, TE.sweep0)));
  // 横着对准他的胸口；人链轻轻摆的那一段（119.6 他回到人链在街上那一点的正上方以后）还原成镜头横着只跟三成
  // （用户 2026-10-26：「中间摇摆那段还原，对准小石头摇摆就体现不出来了」），他在画面里左右晃、人链跟着斜
  const kx = kidChest(t)[0];
  const follow = 1 - 0.7 * E.io(ph(t, 119.3, 119.8));
  return aim(X_JOIN + follow * (kx - X_JOIN), -chestFollowH(t), 540, KID_Y, z);
};
/** 从对准他过渡到整条人链：他被拽上去快出画面上边时就开始退 */
const fitW = (t: number) => E.io(ph(t, TE.chainCut - 0.35, TE.chainCut + 0.55));
const streetChain = (t: number): Cam => {
  let jl = -10;
  for (const j of TE.joins) if (t >= j) jl = j;
  const k = kick(t, jl, 0.1);
  const c = camLerp(zhongRaw(t), fitChain(t), fitW(t));
  return { ...c, z: c.z * (1 + 0.012 * k) };
};
/**
 * 整幅（用户 2026-10-26：倾斜的两版都不对——「感觉还是不对，你想一个新的震撼方案吧，把倾斜的这个想法撤销」）：
 * 画面是正的，退到整座城：地面在画面下面（1760），人链成了一根细线从街上一直伸进头顶的白里，倒挂的她在左上楼顶上（倍数 0.15）。
 * 镜头从他往下扫过几个人、边扫边退，一路退到这里（chainCam），之后极慢地往后漂，
 * 和一道细细的暖光沿人链从街上描到天上（scenes/finale.ts 的 chainGlow），带着眼睛把人链有多长走一遍
 */
// （2:04.65）「感觉这里拉得太远了，你适当调整一下」：0.15 → 0.195，正好装下整条人链（地面贴着画面下边，他的头离画面上边一百多，上面一条白）
const WIDE: Cam = aim(-1800, 0, 540, 1880, 0.195);
/**
 * 退到以后不停：继续极慢地往后漂（屏着一口气看着整条人链，越漂越慢），一直漂到推向他；
 * 他往左荡向她时镜头也跟着往左（用户 2026-10-26，2:05.12：「这里小石头向左，镜头也跟着向左」）：跟他横着走的七成，0.8 秒柔和地跟上
 */
let KX_WIDE = NaN;
const wideAt = (t: number): Cam => {
  if (Number.isNaN(KX_WIDE)) KX_WIDE = kidChest(TE.wide1)[0];
  const pan = t > TE.wide1 ? 0.7 * (kidChest(t)[0] - KX_WIDE) * E.io(ph(t, TE.wide1, TE.wide1 + 0.8)) : 0;
  return { ...WIDE, x: WIDE.x + pan, z: WIDE.z * (1 - 0.035 * E.out(ph(t, TE.wide1 - 0.3, TE.corner))) };
};
/**
 * 第三声：镜头像目光一样从他身上往下走，在阿满（绿帽子，她在前面救过他）脸上流连，再越退越慢地退到整条人链。
 * 用户 2026-10-26 先后要过：边扫边退 → 不要边扫边退、扫到人链中间 → 扫到上 1/3 → 对准绿帽子慢慢放大 →「太弹性了，把感动的情绪搞没了」
 * →「放大不太行，改成停一下」→「不要完全停住……你用最好的情绪运镜方法设计一下」。现在的做法：
 *  - 他开始低头（TE.look0）镜头就跟着往下走，「活」上已经在动；一路一个平稳的速度，脸一张张经过；镜头悄悄松 8%（画面上走得慢一点）。
 *  - 到阿满不刹车：越走越慢，慢到每秒 150 一直往下漂，他的脸从画面中间缓缓滑过（目光在他身上多停了一会儿），不停、不推。
 *  - 退开从这份漂里接上：起步极轻，之后越退越慢（余韵），退到整条人链。
 */
const AMAN = 4;
const V_LINGER = 150;
function sweepCam(t: number): Cam {
  const top = -chestFollowH(t);
  const kid: V2 = [kidChest(t)[0], top];
  const am0 = memberHead(t, AMAN);
  const am: V2 = [am0[0], am0[1] + 40];
  const D = Math.hypot(am[0] - kid[0], am[1] - kid[1]);
  // 走到阿满脸上以前 0.3 秒的漂移量处换成匀速漂：他的脸在 sweep1 以后 0.3 秒正好过画面中间
  const S1 = D - V_LINGER * 0.3;
  const dt = TE.sweep1 - TE.look0;
  let s = 0;
  if (t >= TE.sweep1) s = S1 + V_LINGER * (t - TE.sweep1);
  else if (t > TE.look0) s = herm(0, 0, S1, V_LINGER, dt, (t - TE.look0) / dt);
  const e = s / D;
  const p: V2 = [kid[0] + (am[0] - kid[0]) * e, kid[1] + (am[1] - kid[1]) * e];
  const f = Math.min(1, e);
  const follow = 0.3 + 0.7 * f;
  const z = Z_FOLLOW * 1.64 * (1 - 0.08 * ss(ph(t, TE.look0, TE.sweep1)));
  return aim(X_JOIN + follow * (p[0] - X_JOIN), p[1], 540, KID_Y + (880 - KID_Y) * ss(f), z);
}
/** 最温和的缓入缓出（两头速度为 0，中段只比平均快一半） */
const ss = (x: number) => x * x * (3 - 2 * x);
/** 退开：起步极轻（前 45% 里从 0 慢慢加上来），之后越退越慢（二次方减速，比三次方柔） */
const pullCurve = (u: number) => (1 - (1 - u) * (1 - u)) * ss(Math.min(1, u / 0.45));
/**
 * 退到整条人链（TE.out0 → wide1）；「去」的长音里停在整条人链上（极慢地往后漂，他往左荡时跟着往左），一道淡光从街上描到他；
 * 之后推向他
 */
export function chainCam(t: number): Cam {
  if (t < TE.look0) return withBreath(streetChain(t), t, 2);
  const c = camLerp(sweepCam(t), wideAt(t), pullCurve(ph(t, TE.out0, TE.wide1)));
  return withBreath(c, t, 2);
}

// ——————————————— 推到他：荡过去把砖递给她 → 一接过来就亮 → 在这反乌托邦里：松开栏杆抱住他 ———————————————
/**
 * 用户 2026-10-26：「下一个镜头拉近到小石头，跟着小石头向左摇，把砖递给主角」（之前：「砖递给主角之后立即发光，不要等」）。
 * 从整幅推过来（不切）：对准他的胸口跟着往左（他在画面右边一点，左边留出他要去的地方，倒挂着的她从左边进来）；递到她手里那 0.65 秒过渡到框住两个人（她的脸和他）；她松开栏杆抱住他时柔和起步、越推越慢地推近一点
 */
export function handCam(t: number): Cam {
  // 第四声（用户：「下一个镜头拉近到小石头，跟着小石头向左摇，把砖递给主角」）：从整幅柔和起步地推到他身上（他正荡到右边最远），
  // 推到了就对准他跟着往左荡
  const c = handRaw(t);
  return withBreath(t < TE.closeIn ? camLerp(wideAt(TE.corner), c, E.io(ph(t, TE.corner, TE.closeIn))) : c, t, 1.5 + 0.5 * (1 - ph(t, TE.corner, TE.closeIn)));
}
function handRaw(t: number): Cam {
  const k = kidChest(t);
  const lag = kidChest(t - 0.1);
  const follow = aim(lerp(k[0], lag[0], 0.5), lerp(k[1], lag[1], 0.5) - 40, 660, 900, 1.7);
  const h = herAt(t);
  const p: V2 = [(h.head[0] + k[0]) / 2 + 10, (h.head[1] + k[1]) / 2 - 30];
  const z = 1.55 * Math.pow(1.75 / 1.55, E.settle(ph(t, TE.hug, TE.hug + 1.4))) * (1 + 0.03 * ph(t, TE.hug + 1.4, TE.dim0));
  const pair = aim(p[0], p[1], 540, 900, z);
  return camLerp(follow, pair, E.io(ph(t, TE.hand - 0.3, TE.hand + 0.35)));
}

// ——————————————— 「在这反乌托邦里」后半句起：拉远、整个画面暗下去，光在正中照亮整个画面 → 人链散开、慢慢推向两个人 → 落地 → 外套 → 低到她的光脚，「嘭」 ———————————————
export function endCam(t: number): Cam {
  const h = t < TE.herLand ? herChest(t) : herAt(t).chest;
  // 后奏一（用户：「镜头拉远，让天上的白变暗，这个全部画面都变暗，让主角的光在屏幕中间……点亮全部屏幕」）：
  // 从两个人的近景退开，砖（她的光）一直在画面正中，不往下摇去看人链
  // 「在这反乌托邦里」后半句（TE.dim0）就开始退，句子唱完退稳，光一炸开镜头被推得一顶
  const close = handCam(TE.dim0 - 1e-3);
  const b = herBrickAt(Math.min(t, TE.let0))!.c;
  let c = camLerp(close, aim(b[0], b[1], 540, 960, 0.34), E.settle(ph(t, TE.dim0, TE.dim0 + 1.4)));
  c = { ...c, z: c.z * (1 + 0.04 * kick(t, TE.descend, 0.16)) };
  // 后奏二（用户：「人链散开，镜头慢慢向主角和小石头推」）：跟着她（抱着他）往下，慢慢推近
  const zf = 0.34 * Math.pow(0.62 / 0.34, E.io(ph(t, TE.let0 - 0.2, TE.herLand - 1.2)));
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
