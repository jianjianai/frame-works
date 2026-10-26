// 终章（lib/end_t.ts）的镜头。每一段都是「把世界里的一点放到画面某处」（aim），下一段从上一段在交接时刻的值出发（camLerp），
// 一个镜头里不跳。镜头快慢按剧情：冲、扑、抓、跺快而干脆；笑、慢放、静、回报慢、停得住。

import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { TE, type V2, breath, herm, lerp, mix } from "./end_t";
import { X_K, ZW } from "./end_map";
import { HB_REST, X_LAND, herAt, herBrickAt, herChest, kidAt, kidRoot } from "./end_pair";
import { MEMBERS, X_JOIN, chainH } from "./end_rise";
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
  // 她往画面上面走（2026-10-26 用户确认的优化；原来一直是 1.3 倍的全身）。
  // 推到半身就停（用户 2026-10-26，1:47.25：「这个镜头拉太近了」；原来推到 3.6 倍只剩脸和肩）：脸、围巾和张开的手都在画面里
  const close = aim(h[0] + 6, h[1] + 120, 540, 860 - 260 * up, 2.5);
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
 * 整幅：画面是正的，地面贴着画面下边，人链从街上一直伸进头顶的白里，倒挂的她在左上楼顶上，街坊仰着头站在街上
 * （用户 2026-10-26：倾斜的两版都不对，「把倾斜的这个想法撤销」；2:04.65「感觉这里拉得太远了」：0.15 → 0.195，正好装下整条人链）
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
/**
 * 第三声（用户 2026-10-26，2:13.10：「把所有人从上到下全部逐个扫一遍」）：镜头像他的目光，从他身上往下，把人链上的人一张脸一张脸看过去
 * （每个人都仰着头往上看他：使劲、哭着笑、咬着牙），一直看到街上最后那个人（两腿蹬开站在街上攥着），在街上停住；第四声从这里往后拉开。
 * 她救过、认得出的那几张脸（老钟、周磊、千斤、千斤的妈妈、阿满、老太太、年轻人、戴眼镜的大叔、扎马尾的女学生）走得慢一点，
 * 后面的路人快一点，到街上越走越慢地停住。经过每张脸的时刻按单调三次插值连成一条平滑的速度曲线（中间不顿、不刹）；
 * 横着按「他—街上最后那个人」这条线走（不跟着每个人左右的错落晃）。
 * 原来（2:03.60 那版）只扫到上 1/3，在阿满脸上流连，再退到整条人链。
 */
/** 经过每张脸的时刻：他（胸口），再是人链上从上往下第 0…16 个人 */
const SWEEP_AT: number[] = (() => {
  const gaps = [0.32, 0.26, 0.26, 0.26, 0.25, 0.25, 0.24, 0.24, 0.23, 0.21, 0.2, 0.2, 0.19, 0.19, 0.19, 0.2, 0.24];
  const out = [TE.look0 + 0.05];
  for (const g of gaps) out.push(out[out.length - 1] + g);
  // 最后一个正好是 TE.sweepEnd
  const k = (TE.sweepEnd - out[0]) / (out[out.length - 1] - out[0]);
  return out.map((v) => out[0] + (v - out[0]) * k);
})();
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
/** 扫的时候的倍数：从跟着他往上的那个取景（约 0.95）松到 0.8（画面里同时看得见两三个人，脸经过得不那么急） */
const Z_SWEEP = 0.8;
/** 停在街上时：最后那个人的头在画面上 1364，地面在画面 1650（第四声从这里往后拉开，地面一直在画面下面） */
const SWEEP_END_Y = 1364;
function sweepCam(t: number): Cam {
  // 这一刻每张脸在哪（人链在轻轻动，按这一刻的位置）：他用胸口（和上一个取景对准的一样），其他人用头
  const ys = [-chestFollowH(t)];
  for (let i = 0; i < MEMBERS.length; i++) ys.push(memberHead(t, i)[1] + 30);
  const y = monoCubic(SWEEP_AT, ys, t);
  // 横着：沿「他—最后那个人」这条线（起头只跟三成，和上一个取景一样，慢慢变成整个跟上）
  const kx = kidChest(t)[0];
  const ax = memberHead(t, MEMBERS.length - 1)[0];
  const f = Math.max(0, Math.min(1, (y - ys[0]) / (ys[ys.length - 1] - ys[0])));
  const lineX = kx + (ax - kx) * f;
  const follow = 0.3 + 0.7 * ss(ph(t, TE.look0, TE.look0 + 1.2));
  const z = Z_FOLLOW * 1.64 * Math.pow(Z_SWEEP / (Z_FOLLOW * 1.64), ss(ph(t, TE.look0, TE.look0 + 0.9)));
  // 画面上：看着的那张脸一直在画面上 1/3（640，和上一个取景他的胸口一样；下面留出要来的人），到街上越走越慢时落到 SWEEP_END_Y
  //（起头往画面中间挪的话，镜头还没走起来他先往下一滑，像先抬一下再往下）
  const sy = 640 + (SWEEP_END_Y - 640) * ss(ph(t, TE.sweepEnd - 0.8, TE.sweepEnd + 0.1));
  return aim(X_JOIN + follow * (lineX - X_JOIN), y, 540, sy, z);
}
/** 最温和的缓入缓出（两头速度为 0，中段只比平均快一半） */
const ss = (x: number) => x * x * (3 - 2 * x);
/** 退开：起步极轻（前 45% 里从 0 慢慢加上来），之后越退越慢（二次方减速，比三次方柔） */
const pullCurve = (u: number) => (1 - (1 - u) * (1 - u)) * ss(Math.min(1, u / 0.45));
/**
 * 第四声（用户：「镜头从下面开始拉远，展示整个人链，先向右摇，之后向左摇」）：从街上那个人往后拉开，地面一直钉在画面下面，
 * 整条人链从下往上一节节露出来（街坊仰着头站在街上），拉到整幅时人链正往右荡到最远，接着往左荡
 */
function pullCam(t: number): Cam {
  const a = sweepCam(TE.pull0);
  const b = wideAt(t);
  const e = pullCurve(ph(t, TE.pull0, TE.wide1));
  const z = a.z * Math.pow(b.z / a.z, e);
  // 地面（y = 0）在画面上的高度：从停在街上的那个取景到整幅的
  const gA = 960 - a.y * a.z;
  const gB = 960 - b.y * b.z;
  const g = gA + (gB - gA) * e;
  return { x: a.x + (b.x - a.x) * e, y: -(g - 960) / z, z, r: 0 };
}
/**
 * 第三声从他往下一张脸一张脸看到街上 → 第四声从街上往后拉开到整条人链（人链先往右、再往左荡）→ 停在整幅上，他往左荡时跟着往左；
 * 「在这反乌托邦里」推向他（handCam）
 */
export function chainCam(t: number): Cam {
  if (t < TE.look0) return withBreath(streetChain(t), t, 2);
  let c = t < TE.pull0 ? sweepCam(t) : pullCam(t);
  // 从跟着他往上的那个取景接过来（0.25 秒，起步时本来就慢）
  if (t < TE.look0 + 0.25) c = camLerp(streetChain(t), c, ss(ph(t, TE.look0, TE.look0 + 0.25)));
  return withBreath(c, t, 2);
}

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
  // 从两个人的近景退开，砖（她的光）一直在画面正中，不往下摇去看人链
  // 「在这反乌托邦里」后半句（TE.dim0）就开始退，句子唱完退稳，光一炸开镜头被推得一顶
  const close = handCam(TE.dim0 - 1e-3);
  const b = herBrickAt(Math.min(t, TE.let0))!.c;
  // 从她脸上（约 4 倍）退开：2 秒，光炸开的时候退到一半多，剩下的在白里退完（原来从两个人的 1.75 倍退，1.4 秒）
  let c = camLerp(close, aim(b[0], b[1], 540, 960, 0.34), E.settle(ph(t, TE.dim0, TE.dim0 + 2.0)));
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
