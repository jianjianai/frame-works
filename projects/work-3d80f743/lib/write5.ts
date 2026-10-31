// 三⑦「没有犯下任何错的你」（99.96–101.97；99.96 起约每字 0.2 秒，「你」约 101.56；100.02、101.02 重拍）：夜里，她的屋子。街上两个人牵着的手溶成夜里台灯下的两只手（溶的时候两双手在画面上同一个地方、一样大）：
// 她坐在桌前的椅子上，把小石头抱在腿上（他坐在她近处那条大腿靠膝盖那头，脚垂在她膝盖前面），两个人都用右手写字（用户 2026-10-30）：
// 他右手（远处那只）攥笔、左手搭在桌上，她右手从他身后伸过去搭在他手上、左手搂着他的肚子，
// 带着他在砖上一笔一笔写「活下去」（活 100.42、下 100.9、去 101.37）；「你」她的眼睛从砖上挪到他脸上；写完他抿着嘴笑了。
// 镜头溶完一路慢慢推近（柔和起步、一路减速），落在砖、两只手和两张脸上。
// 三⑧ 接着同一个镜头（GIFT_T）：她松开手、拍一下他攥着笔的拳头，把笔给了他；溶过去、时间往后跳一点，他一个人在新砖上写「妈妈，明天见」。
// 三⑨ 还是这个镜头（FULL_T）：又往后跳一点，他靠在她怀里睡着了；她右手写完自己那块「活下去」、放下笔，左手拿起来往近处那只铁靴里插——
// 塞满了，插不进去。
// 坐标是屋子坐标（lib/room.ts），屋子按 setRoomAway 画：灯亮着，桌上那支放下的笔不画（在两个人手里），人、砖、笔从 sleeper 画进去。
// 摆法（试了几版）：砖立着、字写在朝镜头那面，握笔的手比在纸上写字高得多——她站在椅子后面弯腰握他的手，胳膊一定横过他的脸；
// 抱在腿上、他坐直、手放低、肘往下垂（bend −1），她再往后坐一点（近处的肩膀不在他头后面），两张脸才都露得出来。

import { type MoveKey, type PoseIn, CHENGTUO, COLORS as CHEN_COLORS, bootMap, drawBoot, drawChengtuo, jointsOf, rigOf } from "@materials/剪纸角色/code/chengtuo";
import { BOOT } from "@materials/剪纸角色/code/chengtuo-costume";
import { REST, cubicPath, toLocal } from "@materials/剪纸角色/code/figure";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type Cam, E, camLerp, ph, toScreenV } from "./cam";
import { part } from "./world";
import { ARMS, live } from "./motion";
import { armL, armR, legL, legR } from "./poses";
import { pose } from "./dawn";
import { drawPerson } from "./people";
import { HAND_FONT } from "./note";
import { ROOM, type RoomAway, drawPen } from "./room";
import { WRITE7_T } from "./t7";
import { aimRoom, roomZ } from "./write";
import { streetClasp } from "./street3";
import { walkCam } from "./street4";

type V2 = [number, number];
const mix = (a: V2, b: V2, u: number): V2 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

export const LESSON_T = {
  start: 99.96,
  /** 街上牵着的手溶成台灯下的两只手 */
  mix0: 99.96,
  mix1: 100.3,
  /** 推近笔尖 */
  push1: 100.95,
  /** 三个字：活、下、去 */
  chars: [
    [100.42, 100.84],
    [100.9, 101.3],
    [101.37, 101.8],
  ] as [number, number][],
  end: 101.97,
};
const L = LESSON_T;
/** 夜里的屋子盖上来多少（街上 → 屋里） */
export const lessonMix = (t: number) => E.soft(ph(t, L.mix0, L.mix1));

/**
 * ⑧「在我心里只用做自己」（101.97–103.98；在 101.91 我 102.13 心 102.35 里 102.57 只 102.79 用 103.01 做 103.23 自 103.45 己 103.67，
 * 约每字 0.22 秒；102.02、103.02 重拍）：「在我」她的手从他手上抬起来、张开，在他攥着笔的拳头上轻轻拍一下（笔给你了）；
 * 「心里」他把笔举起来一点看（笔杆上「2.5元」的价签），再抬头看她，她点一下头，手收回去环着他的肚子；
 * 「只用」溶过去，时间往后跳一点：桌上换了一块新砖，「妈妈，」已经写好了，他一个人攥着笔接着写「明、天、见」，
 * 她两只手环着他、下巴搁在他头上看着；写完他笑了。
 */
export const GIFT_T = {
  start: 101.97,
  /** 她的手抬起来、张开 → 拍一下 → 收回去环着他 */
  lift0: 102.1,
  lift1: 102.22,
  pat: 102.32,
  away0: 102.46,
  away1: 102.7,
  /** 他把笔举起来看 → 抬头看她；她点头 */
  look0: 102.36,
  look1: 102.52,
  up0: 102.52,
  up1: 102.66,
  nod: 102.6,
  /** 两个人又低下头看他手里的笔（头摆成跳过去以后写字时的样子，溶的时候脸不叠出两个） */
  down0: 102.72,
  down1: 102.86,
  /** 时间往后跳一点（溶） */
  mix0: 102.8,
  mix1: 103.05,
  /** 他自己写的三个字：明、天、见（「妈妈，」跳过去的那段时间里写好了） */
  chars: [
    [102.96, 103.22],
    [103.28, 103.53],
    [103.59, 103.84],
  ] as [number, number][],
  end: 103.98,
};
const G = GIFT_T;
/** 往后跳的那一刻盖上来多少 */
export const giftMix = (t: number) => E.soft(ph(t, G.mix0, G.mix1));

/**
 * ⑨「这段胡乱拼凑的词语」（103.98–105.99；这 103.92 段 104.14 胡 104.36 乱 104.58 拼 104.8 凑 105.02 的 105.24 词 105.46 语 105.68，
 * 约每字 0.22 秒；104.02、105.02 重拍）：又往后跳了一点：他靠在她怀里睡着了，她拿着那支笔写完自己那块「活下去」的最后一笔，
 * 放下笔、拿起砖竖过来，往近处那只铁靴的靴筒里插——靴筒里早就塞满了写着字的砖，插不进去（105.0「咯」一下卡住）；
 * 又往下推一下，还是不行；停住，拿起来一点看着它。镜头跟着她的手往下，落到塞满砖的铁靴上（不往回拉）。
 */
export const FULL_T = {
  start: 103.98,
  /** 又往后跳一点（溶） */
  mix0: 103.98,
  mix1: 104.2,
  /** 「去」写的时间：跳过去时写到一半多，最后一行 104.22–104.36 */
  qu: [103.94, 104.36] as [number, number],
  /** 放下笔：笔尖落到砖前面的桌面上，松手 */
  pen0: 104.36,
  pen1: 104.48,
  /** 手挪到砖上、捏住 */
  grab0: 104.48,
  grab1: 104.62,
  /** 拿起来、竖过来、往靴口送（越送越快）：105.0 碰到靴筒里的砖，卡住 */
  carry1: 105.0,
  /** 又往下推一下：还是卡住 */
  push0: 105.12,
  push1: 105.28,
  /** 停住，拿起来一点看着它 */
  look0: 105.4,
  look1: 105.74,
  end: 105.99,
};
const F = FULL_T;
export const fullMix = (t: number) => E.soft(ph(t, F.mix0, F.mix1));

// ——— 砖和字 ———
/** 桌上那块砖（立着，正面朝镜头）：底边中点 */
const BRICK = { x: 428, y: ROOM.desk.top - 6, w: 116, h: 40 };
/**
 * 砖上的一个字：字的中心、字号、歪多少、写的时间（null：已经写好了）、来回划几行、一行一行露出来的那个框 [x, y, 宽, 高]、
 * 写的时候笔尖怎么走（u 0–1）
 */
interface Glyph {
  ch: string;
  c: V2;
  size: number;
  rot: number;
  at: [number, number] | null;
  rows: number;
  box: [number, number, number, number];
  stroke: (u: number) => V2;
}
/** ⑦「活下去」（她握着他的手写，龙藏体 29 号）：每个字三行来回划 */
const charC = (i: number): V2 => [BRICK.x - 34 + i * 34, BRICK.y - 22];
function charStroke(i: number, u: number): V2 {
  const [cx, cy] = charC(i);
  const k = Math.min(3 - 1e-6, Math.max(0, u) * 3);
  const r = Math.floor(k);
  const v = k - r;
  const dir = r % 2 === 0 ? 1 : -1;
  return [cx + dir * (-12 + 24 * v), cy - 9 + r * 9 + 2 * Math.sin(v * Math.PI * 4 + i * 1.7 + r)];
}
const LESSON_WORDS: Glyph[] = [..."活下去"].map((ch, i) => ({
  ch,
  c: [charC(i)[0], charC(i)[1] + [1, -1, 1][i]] as V2,
  size: 29,
  rot: [-0.06, 0.05, -0.03][i],
  at: L.chars[i],
  rows: 3,
  box: [charC(i)[0] - 16, charC(i)[1] - 15, 32, 30],
  stroke: (u: number) => charStroke(i, u),
}));
/** ⑧ 他自己写的「妈妈，明天见」：一行挤在砖上，小一号、歪歪扭扭（小孩的字） */
const GIFT_WORDS: Glyph[] = (() => {
  const chs = [..."妈妈，明天见"];
  const adv = [19, 19, 11, 19, 19, 19];
  const total = adv.reduce((a, b) => a + b, 0);
  let x = BRICK.x - total / 2;
  return chs.map((ch, i) => {
    const cx = x + adv[i] / 2;
    x += adv[i];
    const c: V2 = [cx, BRICK.y - 20 + [1, -1, 3, 0, 2, -1][i]];
    const size = [20, 19, 20, 20, 21, 20][i];
    const w = size * 1.1;
    // 两行来回划：第一行往右、第二行往左
    const stroke = (u: number): V2 => {
      const k = Math.min(2 - 1e-6, Math.max(0, u) * 2);
      const r = Math.floor(k);
      const v = k - r;
      const dir = r % 2 === 0 ? 1 : -1;
      return [cx + dir * size * 0.42 * (2 * v - 1), c[1] - size * 0.16 + r * size * 0.32 + 1.5 * Math.sin(v * Math.PI * 4 + i * 1.3 + r)];
    };
    return { ch, c, size, rot: [-0.07, 0.05, 0, -0.04, 0.06, -0.05][i], at: i < 3 ? null : G.chars[i - 3], rows: 2, box: [cx - w / 2, c[1] - w / 2, w, w], stroke };
  });
})();
/**
 * 笔尖在哪：先悬在第一个要写的字的起笔上方，一个字一个字写，字与字之间抬笔挪过去；写完抬起一点停住（手不抬到他脸前），
 * 或者挪到 away（让开写好的字）
 */
function tipAlong(words: Glyph[], t: number, away?: V2): V2 {
  const todo = words.filter((w) => w.at) as (Glyph & { at: [number, number] })[];
  const first = todo[0].stroke(0);
  if (t < todo[0].at[0]) return mix([first[0] + 6, first[1] - 12], first, E.in2(ph(t, todo[0].at[0] - 0.12, todo[0].at[0])));
  for (let i = 0; i < todo.length; i++) {
    const [a, b] = todo[i].at;
    if (t <= b) return todo[i].stroke(ph(t, a, b));
    const last = i === todo.length - 1;
    const next = last ? b + 0.2 : todo[i + 1].at[0];
    if (t < next) {
      const from = todo[i].stroke(1);
      const to: V2 = last ? away ?? [from[0] + 2, from[1] - 9] : todo[i + 1].stroke(0);
      const u = E.io(ph(t, b, next));
      const p = mix(from, to, u);
      return [p[0], p[1] - (last ? 0 : 10 * Math.sin(Math.PI * u))];
    }
  }
  const end = todo[todo.length - 1].stroke(1);
  return away ?? [end[0] + 2, end[1] - 9];
}
const penTip = (t: number) => tipAlong(LESSON_WORDS, t);
/** 砖和砖上的字：笔尖划过一行，那一行就出来（来回划，所以第二行从右往左出来） */
function drawBrickAndWords(g: CanvasRenderingContext2D, t: number, words: Glyph[]) {
  const B = BRICK;
  const p = new Path2D();
  p.roundRect(B.x - B.w / 2, B.y - B.h, B.w, B.h, 5);
  part(g, p, "#cbc6bd", "#b2ada4", 3.5, [4, 4]);
  drawGlyphs(g, t, words);
}
/** 砖上的字：笔尖划过一行，那一行就出来 */
function drawGlyphs(g: CanvasRenderingContext2D, t: number, words: Glyph[]) {
  for (const gl of words) {
    if (gl.at && t <= gl.at[0]) continue;
    const [cx, cy] = gl.c;
    const u = gl.at ? ph(t, gl.at[0], gl.at[1]) : 1;
    g.save();
    if (u < 1) {
      const clip = new Path2D();
      const k = u * gl.rows;
      const r = Math.floor(k);
      const v = k - r;
      const [bx, top, bw, bh] = gl.box;
      const rowH = bh / gl.rows;
      if (r > 0) clip.rect(bx, top, bw, rowH * r);
      const w = bw * v;
      clip.rect(r % 2 === 0 ? bx : bx + bw - w, top + rowH * r, w, rowH);
      g.clip(clip);
    }
    g.translate(cx, cy);
    g.rotate(gl.rot);
    g.fillStyle = "#3f3140";
    g.font = `${gl.size}px ${HAND_FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(gl.ch, 0, 0);
    g.restore();
  }
}

// ——— 两个人 ———
/**
 * 她坐在椅子上（和第二幕⑨写砖时一样，胯在椅面上），身子直一点，低头从他头顶上看砖：右手（远处那只）从他身后伸过去，搭在他攥笔的
 * 右手上带着他写；左手（近处那只）从他身侧绕过来，手掌搭在他肚子上（压在他身上）（用户 2026-10-30 在「调整画面」1:28.17 摆的）
 */
const HER_P = {
  教: pose(0, { face: -1, ground: false, ...legR(86, -86), ...legL(80, -82), neck: -16, expression: "微笑", smile: 0.45, lookX: -0.3, lookY: 0.95 }, (l) => ({
    ...armL(30, 70, 0, "flat", l),
    ...armR(20, 80, 0, "relax", l),
  })),
};
/** 「你」以后：眼睛看着他 */
const HER_LOOK = { ...HER_P.教, neck: -22, smile: 0.65, lookX: -0.12, lookY: 0.8 };
/** ⑧ 又低下头看着他（身子往前一点）：跳过去以后就这样看着他写 */
const HER_B_HEAD = { ...HER_LOOK, lean: 6, neck: -30, smile: 0.6, lookX: -0.25, lookY: 0.95 };
const HER_KEYS = [
    { t: 99.8, x: 0, items: { bricks: 0, gloves: false }, p: HER_P.教 },
    // 「你」101.56：眼睛从砖上挪到他脸上，头往他那边低一点，笑得深一点
    { t: 101.42, p: HER_P.教 },
    { t: 101.68, ease: "inOut", p: HER_LOOK },
    // ⑧ 右手抬起来张开、拍他的手；「心里」点一下头，右手收回去时放松
    { t: G.lift0, p: HER_LOOK },
    { t: G.lift1, ease: "out", p: { ...HER_LOOK, handR: "flat" } },
    { t: G.nod - 0.12, p: { ...HER_LOOK, handR: "flat" } },
    { t: G.nod, ease: "inOut", p: { ...HER_LOOK, handR: "flat", neck: -30, smile: 0.8 } },
    { t: G.down0, ease: "inOut", p: { ...HER_LOOK, handL: "relax", smile: 0.8 } },
    { t: G.down1, ease: "inOut", p: { ...HER_B_HEAD, handL: "relax" } },
] as MoveKey[];
const HER_OPTS = { look: CHENGTUO, base: { chestL: "under" as const, chestR: "under" as const }, idle: true, seed: 123, springs: ARMS, follow: 0 };
const herMove = live([...HER_KEYS, { t: 104, p: { ...HER_B_HEAD, handL: "relax" } }] as MoveKey[], HER_OPTS);
const HER_HIP: V2 = [ROOM.chair.x + 40, ROOM.chair.seat - 22];
const S = ROOM.s;
type Mover = (t: number) => { pose: PoseIn };
function herBase(t: number, move: Mover = herMove) {
  const p: PoseIn = { ...move(t).pose };
  const j0 = jointsOf(p);
  const root: V2 = [HER_HIP[0] - j0.hip[0] * S, HER_HIP[1] - j0.hip[1] * S];
  const at = (q: number[]): V2 => [root[0] + q[0] * S, root[1] + q[1] * S];
  return { p, root, knee: at(j0.kneeL) };
}
/**
 * 他坐在她腿上（朝左，脚垂在她膝盖前面），右手（远处那只）攥着笔，左手（近处那只）搭在砖右边的桌面上；低头认真看着砖
 * （用户 2026-10-30：「改成用右手写字」，在「调整画面」1:28.17 摆的）
 */
const STONE = CAST.小石头穿妈妈的外套;
const KID_P = {
  写: pose(0, { face: -0.6, ground: false, ...legR(80, -70, 0), ...legL(76, -64, 0), neck: -26, expression: "平常", lookX: -0.3, lookY: 0.9 }, (l) => ({
    ...armL(50, 60, 0, "relax", l),
    ...armR(60, 50, 0, "grip", l),
  })),
};
/** 写完「去」：抿着嘴笑了 */
const KID_DONE = { ...KID_P.写, expression: "微笑", smile: 0.6, lookY: 0.8 };
/** ⑧ 又低下头看手里的笔（跳过去以后就这样低着头写） */
const KID_DOWN = { ...KID_DONE, neck: -24, smile: 0.4, lookX: -0.3, lookY: 0.95 };
const KID_KEYS = [
  { t: 99.8, x: 0, p: KID_P.写 },
  { t: L.chars[2][1], p: KID_P.写 },
  { t: L.chars[2][1] + 0.16, ease: "out", p: KID_DONE },
  // ⑧ 把笔举起来看（价签）→ 抬起头看她，笑开了 → 又低下头
  { t: G.look0, p: KID_DONE },
  { t: G.look1, ease: "inOut", p: { ...KID_DONE, neck: -22, smile: 0.35, lookX: -0.45, lookY: 0.65 } },
  { t: G.up1, ease: "inOut", p: { ...KID_DONE, neck: -10, smile: 0.85, lookX: 0.55, lookY: -0.7 } },
  { t: G.down0, p: { ...KID_DONE, neck: -10, smile: 0.85, lookX: 0.55, lookY: -0.7 } },
  { t: G.down1, ease: "inOut", p: KID_DOWN },
] as MoveKey[];
const KID_OPTS = { look: lookOf(STONE), base: { wind: 0 }, idle: true, seed: 121, springs: ARMS, follow: 0 };
const kidMove = live([...KID_KEYS, { t: 104, p: KID_DOWN }] as MoveKey[], KID_OPTS);
/**
 * ⑧ 跳过去以后的他：头、身子和跳过去之前一模一样（同一套关键帧、同一个随机种子，溶的时候脸不叠出两个），
 * 只是手在新砖上写字；写完「见」看着自己写的字笑了
 */
const kidMoveB = live(
  [
    ...KID_KEYS,
    { t: G.chars[2][1] + 0.02, p: KID_DOWN },
    { t: G.chars[2][1] + 0.2, ease: "out", p: { ...KID_DOWN, smile: 0.75, lookY: 0.8 } },
    { t: 106, p: { ...KID_DOWN, smile: 0.75, lookY: 0.8 } },
  ] as MoveKey[],
  KID_OPTS,
);
const KID_K = ROOM.s;
/** 他坐的地方：胯落在她近处那条大腿上（靠膝盖那头），坐在大腿上面 */
const SEAT_K = 0.84;
const SEAT_UP = 28;
function kidSeat(herMv: Mover): (t: number) => V2 {
  return (t) => {
    // 小石头照参考图改成头大腿短（用户 2026-10-28）：上身连头高出约 36、头大了，原来的位置头挡住她半张脸——往她膝盖那头挪、坐低一点
    const hip = mix(HER_HIP, herBase(t, herMv).knee, SEAT_K);
    return [hip[0], hip[1] - SEAT_UP];
  };
}
/** ⑦⑧ 写字时他往她胯那头挪 37（用户 2026-10-30 在「调整画面」1:28.17 摆的：右手攥笔，她两只手环着他）；⑨ 睡着了还坐在原处 */
const WRITE_DX = 37;
/** 攥笔的手（右手）：手腕在笔尖右上（笔斜着握） */
const GRIP_OFF: V2 = [42, -16];
/** 左手（近处那只）搭在砖右边的桌面上 */
const REST_L: V2 = [BRICK.x + BRICK.w / 2 + 56, BRICK.y];
/**
 * 他：姿势按 IK 放好攥笔的右手（远处那只，手腕 grip，笔尖 tip；朝镜头伸着，上臂压短到 0.66）和搭在桌上的左手（近处那只），
 * 两只肘都往下垂
 */
function kidPose(t: number, move: Mover, KID_HIP: V2, grip: V2, tip: V2) {
  const p: PoseIn = { ...move(t).pose };
  const j0 = castJoints(STONE, p);
  const root: V2 = [KID_HIP[0] - j0.hip[0] * KID_K, KID_HIP[1] - j0.hip[1] * KID_K];
  const sc = KID_K * STONE.scale;
  const loc = (q: V2): V2 => [(q[0] - root[0]) / sc, (q[1] - root[1]) / sc];
  p.armR = { ...(p.armR as object), to: loc(grip), ik: 1, bend: -1, upperK: 0.66 } as PoseIn["armR"];
  p.armL = { ...(p.armL as object), to: loc(REST_L), ik: 1, bend: -1 } as PoseIn["armL"];
  const j = castJoints(STONE, p);
  const at = (q: number[]): V2 => [root[0] + q[0] * KID_K, root[1] + q[1] * KID_K];
  return { pose: p, root, palm: at(j.palmR), tip, grip, hip: KID_HIP };
}
type Kid = ReturnType<typeof kidPose>;
const seatA = kidSeat(herMove);
const seatW = (t: number): V2 => {
  const h = seatA(t);
  return [h[0] + WRITE_DX, h[1]];
};
function kidAt(t: number): Kid {
  const tip0 = penTip(t);
  let grip: V2 = [tip0[0] + GRIP_OFF[0], tip0[1] + GRIP_OFF[1]];
  let tip = tip0;
  // ⑧ 把笔举起来一点、转平了看（价签朝着镜头）
  const u = E.io(ph(t, G.look0, G.look1));
  if (u > 0) {
    grip = mix(grip, [grip[0] + 2, grip[1] - 10], u);
    const off = mix([-GRIP_OFF[0], -GRIP_OFF[1]], [-50, -2], u);
    tip = [grip[0] + off[0], grip[1] + off[1]];
  }
  return kidPose(t, kidMove, seatW(t), grip, tip);
}
/** 她近处那只手（左手）搭在他肚子上的地方（相对他的胯，照用户 1:28.17 摆的）；远处那只（右手）收回去环着他时在他身后 */
const HUG_L: V2 = [8, -60];
const HUG_R: V2 = [-30, -56];
function herAt(t: number, kid: Kid) {
  const { p, root } = herBase(t);
  const loc = (q: V2): V2 => [(q[0] - root[0]) / S, (q[1] - root[1]) / S];
  // 右手搭在他攥笔的手上（她的手在他的手后面）；⑧ 抬起来张开 → 拍一下他攥着笔的拳头 → 收回去环着他。左手一直搭在他肚子上
  const onHand: V2 = [kid.grip[0] + 4, kid.grip[1] + 8];
  const up: V2 = [onHand[0] + 12, onHand[1] - 11];
  const pat: V2 = [onHand[0] - 2, onHand[1] - 1];
  const back: V2 = [kid.hip[0] + HUG_R[0], kid.hip[1] + HUG_R[1]];
  let hand = onHand;
  if (t > G.lift0) hand = mix(onHand, up, E.out(ph(t, G.lift0, G.lift1)));
  if (t > G.lift1) hand = mix(up, pat, E.in2(ph(t, G.lift1, G.pat)));
  if (t > G.away0) hand = mix(pat, back, E.io(ph(t, G.away0, G.away1)));
  p.armL = { ...(p.armL as object), to: loc([kid.hip[0] + HUG_L[0], kid.hip[1] + HUG_L[1]]), ik: 1, bend: -1, chest: "over" } as PoseIn["armL"];
  p.armR = { ...(p.armR as object), to: loc(hand), ik: 1, bend: -1 } as PoseIn["armR"];
  return { pose: p, root };
}
type Her = ReturnType<typeof herAt>;
/** 两双手在哪（溶的时候对上街上那两只牵着的手） */
const handsAt = (t: number): V2 => kidAt(t).grip;

// ——— ⑧ 时间往后跳了一点：他自己在新砖上写，她两只手环着他、低头看着（她和跳过去之前一模一样） ———
function kidB(t: number): Kid {
  // 写完把笔挪到砖的右头外面，让开写好的字
  const tip = tipAlong(GIFT_WORDS, t, [BRICK.x + BRICK.w / 2 + 8, BRICK.y - 22]);
  return kidPose(t, kidMoveB, seatW(t), [tip[0] + GRIP_OFF[0], tip[1] + GRIP_OFF[1]], tip);
}

/** 屋里这一刻要画的：桌上的东西（人前面那层之前）、他、她、夹在他和她近处那只手臂之间的（笔、她手里的砖）、她之后的 */
interface Scene {
  desk: (g: CanvasRenderingContext2D) => void;
  kid: { pose: PoseIn; root: V2 };
  her: Her;
  /** 她的身子之后、他之前（在他后面的东西） */
  beforeKid?: (g: CanvasRenderingContext2D, line: number) => void;
  hook: (g: CanvasRenderingContext2D) => void;
  after?: (g: CanvasRenderingContext2D, line: number) => void;
}
/**
 * 屋里的样子：夜里，台灯亮着；砖和字、她、坐在她腿上的他、笔。他画在她的身子和近处那只手臂之间（beforeFrontArms：
 * 那只手臂从他身侧绕过来，压在他身上）。描边按镜头 1/√倍数调细（和屋子一样）
 */
function awayOf(t: number, sc: Scene): RoomAway {
  const line = Math.max(0.45, Math.min(1, 1 / Math.sqrt(roomZ(lessonCam(t)))));
  const { kid, her } = sc;
  return {
    lamp: 1,
    day: 0,
    boots: false,
    quilt: 0,
    pen: false,
    sleeper: (g) => {
      sc.desk(g);
      const roomM = g.getTransform();
      g.save();
      g.translate(her.root[0], her.root[1]);
      g.scale(S, S);
      drawChengtuo(g, her.pose, {
        line,
        beforeFrontArms: (cc) => {
          cc.save();
          cc.setTransform(roomM);
          sc.beforeKid?.(cc, line);
          cc.save();
          cc.translate(kid.root[0], kid.root[1]);
          cc.scale(KID_K, KID_K);
          drawPerson(cc, STONE, kid.pose, 0, 0, 1 / (line * line));
          cc.restore();
          sc.hook(cc);
          cc.restore();
        },
      });
      g.restore();
      sc.after?.(g, line);
    },
  };
}
const sceneOf = (t: number, kid: Kid, her: Her, words: Glyph[]): Scene => ({
  desk: (g) => drawBrickAndWords(g, t, words),
  kid,
  her,
  hook: (g) => drawPen(g, kid.palm, kid.tip),
});
/** ⑦ 和 ⑧ 跳过去之前：她握着他的手写「活下去」、把笔给他 */
export function lessonAway(t: number): RoomAway {
  const kid = kidAt(t);
  return awayOf(t, sceneOf(t, kid, herAt(t, kid), LESSON_WORDS));
}
/** ⑧ 跳过去以后：他自己写「妈妈，明天见」 */
export function giftAway(t: number): RoomAway {
  const kid = kidB(t);
  return awayOf(t, sceneOf(t, kid, herAt(t, kid), GIFT_WORDS));
}

// ——— ⑨ 又往后跳了一点：他靠在她怀里睡着了；她写完自己那块、往靴筒里插，插不进去 ———
/** 她自己那块「活下去」（她的字）：跳过去时「活、下」写好了，「去」写到一半多 */
const HER_WORDS: Glyph[] = [..."活下去"].map((ch, i) => ({
  ch,
  c: [charC(i)[0], charC(i)[1] + [0, 1, -1][i]] as V2,
  size: 29,
  rot: [-0.03, 0.04, -0.05][i],
  at: i < 2 ? null : F.qu,
  rows: 3,
  box: [charC(i)[0] - 16, charC(i)[1] - 15, 32, 30],
  stroke: (u: number) => charStroke(i, u),
}));
/** 砖的中心（BRICK 那块躺在桌上时） */
const BRICK_C: V2 = [BRICK.x, BRICK.y - BRICK.h / 2];
/**
 * 一块挪动过的砖（中心 c、转 rot；字按砖上原来的位置跟着转）：他那块挪到桌子左边，她手里那块竖过来；
 * size 缩放（塞在靴筒里的那几块窄一点）
 */
function drawBrickMoved(g: CanvasRenderingContext2D, t: number, words: Glyph[], c: V2, rot: number, size = 1) {
  g.save();
  g.translate(c[0], c[1]);
  g.rotate(rot);
  g.scale(size, size);
  g.translate(-BRICK_C[0], -BRICK_C[1]);
  drawBrickAndWords(g, t, words);
  g.restore();
}
/** 靴筒里塞着的砖（她写过的话）：竖着插、挤在一起、高低不一，字跟着转过去（只露出上半截）；近处那只、远处那只 */
type Stuffed = { dx: number; up: number; tilt: number; words: Glyph[] }[];
const stuffed = (list: [string, number, number, number][]): Stuffed =>
  list.map(([w, dx, up, tilt]) => ({
  dx: dx as number,
  up: up as number,
  tilt: tilt as number,
  words: [...(w as string)].map((ch, i, all) => {
    const n = all.length;
    const cx = BRICK.x + (i - (n - 1) / 2) * 30;
    return { ch, c: [cx, BRICK.y - 20] as V2, size: 26, rot: 0, at: null, rows: 3, box: [cx - 15, BRICK.y - 35, 30, 30], stroke: () => [cx, BRICK.y - 20] as V2 };
  }),
}));
const STUFF = stuffed([
  ["我等你", -6, 40, 0.05],
  ["别怕", -30, 52, -0.1],
  ["会好的", 22, 48, 0.13],
  ["有我在", 2, 62, 0.02],
]);
const STUFF_FAR = stuffed([
  ["抱抱你", -24, 44, -0.12],
  ["吃饱饭", 2, 56, 0.04],
  ["慢慢来", 26, 40, 0.14],
]);
/** 铁靴的靴口（靴子的局部坐标，画面左边那只的线稿）：翻边上沿的中点、翻边、翻边下沿 */
const RIM_L = toLocal(BOOT.rim, REST.ankleR, 0);
const MOUTH_L: V2 = [RIM_L.reduce((a, q) => a + q[0], 0) / RIM_L.length, Math.min(...RIM_L.map((q) => q[1])) + 6];
const RIVETS_L = BOOT.rivets.map((d) => ({ c: toLocal([d.c], REST.ankleR, 0)[0], r: d.r }));
/** 她的铁靴（L 近处那只、R 远处那只）在屋里：把靴子局部坐标的点放到屋子坐标 */
function bootOf(her: Her, side: "L" | "R" = "L") {
  const rig = rigOf(her.pose);
  const m = bootMap(rig, side);
  const sx = rig.mir ? -1 : 1;
  const toRoom = (q: V2): V2 => {
    const f = m(q);
    return [her.root[0] + sx * f[0] * S, her.root[1] + f[1] * S];
  };
  return { m, sx, mouth: toRoom(MOUTH_L), toRoom };
}

/** 他睡着了：靠在她怀里，头耷拉着，两条腿蜷在她腿上（不垂到她的铁靴前面），手松松地搭在腿上 */
const KID_SLEEP = pose(-4, { face: -0.6, ground: false, ...legR(106, -126, 0), ...legL(102, -122, 0), neck: -32, expression: "闭眼", lookY: 0.4 }, (l) => ({
  ...armL(6, 40, 0, "relax", l),
  ...armR(6, 40, 0, "relax", l),
}));
const kidMoveC = live(
  [
    { t: F.mix0 - 0.3, x: 0, p: KID_SLEEP },
    // 她往前探身时他跟着往前歪一点
    { t: F.grab1, p: KID_SLEEP },
    { t: F.carry1, ease: "inOut", p: { ...KID_SLEEP, lean: 2, neck: -36 } },
    { t: 108, p: { ...KID_SLEEP, lean: 2, neck: -36 } },
  ] as MoveKey[],
  { ...KID_OPTS, seed: 141 },
);
function kidC(t: number) {
  const p: PoseIn = { ...kidMoveC(t).pose };
  // 跳过去时还坐在⑧写字的地方（溶的时候身子不叠出两个）；她往前探身拿砖时被她带着往她膝盖那头挪回去（不挪的话她低下头脸被他的头挡住）
  const a = seatA(t);
  const hip: V2 = [a[0] + WRITE_DX * (1 - E.io(ph(t, F.pen0, F.carry1))), a[1]];
  const j0 = castJoints(STONE, p);
  const root: V2 = [hip[0] - j0.hip[0] * KID_K, hip[1] - j0.hip[1] * KID_K];
  return { pose: p, root, hip };
}
/** 她：头和跳过去之前一模一样（同一套关键帧、同一个随机种子，溶的时候脸不叠出两个），之后写完、放笔、拿砖、往靴子里插、看着砖 */
const HER_C_DOWN = { ...HER_B_HEAD, handL: "grip", lean: 12, neck: -38, smile: 0.15, lookX: 0, lookY: 1 };
const herMoveC = live(
  [
    ...HER_KEYS,
    { t: F.mix0 - 0.01, p: { ...HER_B_HEAD, handL: "relax" } },
    { t: F.mix0, p: { ...HER_B_HEAD, handL: "relax", handR: "grip" } },
    // 跳过去以后：睁着眼看着自己写的字（笑得浅一点，眼睛不眯成线）
    { t: F.mix1 + 0.12, ease: "inOut", p: { ...HER_B_HEAD, handL: "relax", handR: "grip", smile: 0.2, lookY: 0.85 } },
    { t: F.pen1, p: { ...HER_B_HEAD, handL: "relax", handR: "grip", smile: 0.2, lookY: 0.85 } },
    { t: F.grab0 + 0.06, ease: "inOut", p: { ...HER_B_HEAD, handL: "relax", neck: -33, smile: 0.2, lookY: 0.85 } },
    { t: F.grab1, ease: "inOut", p: { ...HER_B_HEAD, handL: "grip", neck: -33, smile: 0.2, lookY: 0.85 } },
    { t: F.carry1, ease: "inOut", p: HER_C_DOWN },
    { t: F.look0, p: HER_C_DOWN },
    { t: F.look1, ease: "inOut", p: { ...HER_C_DOWN, lean: 10, neck: -32, expression: "心疼", smile: 0.25, lookX: -0.15, lookY: 0.9 } },
    { t: 108, p: { ...HER_C_DOWN, lean: 10, neck: -32, expression: "心疼", smile: 0.25, lookX: -0.15, lookY: 0.9 } },
  ] as MoveKey[],
  HER_OPTS,
);
/** 她写「去」最后一行时的笔尖；放笔时笔尖落到砖前面的桌面上 */
const PEN_REST: V2 = [BRICK.x + 24, BRICK.y - 4];
function herPenTip(t: number): V2 {
  const done = HER_WORDS[2].stroke(1);
  if (t < F.qu[1]) return HER_WORDS[2].stroke(ph(t, F.qu[0], F.qu[1]));
  const u = E.io(ph(t, F.pen0, F.pen1));
  const p = mix(done, PEN_REST, u);
  return [p[0], p[1] - 14 * Math.sin(Math.PI * u)];
}
/**
 * 她手里那块砖：中心、转角。拿起来、一边送一边斜过来（靠上那头朝桌子那边，不从他身前竖着过去），下头那端插到靴口卡住、
 * 又顺着砖往下推一下、拿起来一点看着它
 */
const JAM_ROT = Math.PI / 2 - 0.75;
function heldBrick(t: number, mouth: V2): { c: V2; rot: number } {
  const stuckTop = mouth[1] - Math.max(...STUFF.map((b) => b.up));
  const half = BRICK.w / 2;
  const axis: V2 = [Math.cos(JAM_ROT), Math.sin(JAM_ROT)];
  const stuck: V2 = [mouth[0] + 6 - half * axis[0], stuckTop - half * axis[1]];
  const lifted: V2 = [BRICK_C[0] + 40, BRICK_C[1] - 40];
  const u = ph(t, F.grab1, F.carry1);
  // 越送越快（u²），碰上去一下停住
  const e = u * u;
  const q1 = mix(BRICK_C, lifted, e);
  const q2 = mix(lifted, stuck, e);
  let c = mix(q1, q2, e);
  let rot = JAM_ROT * E.io(ph(t, F.grab1 + 0.04, F.carry1 - 0.06));
  // 卡住时往回弹一下；又顺着砖往下推一下（压下去一点又被顶住，歪一下）；拿起来一点看着它
  const d1 = t - F.carry1;
  const bounce = d1 > 0 ? -4 * Math.exp(-d1 / 0.05) * Math.sin(Math.min(Math.PI, d1 * 40)) : 0;
  const push = 5 * Math.sin(Math.PI * ph(t, F.push0, F.push1));
  c = [c[0] + (bounce + push) * axis[0], c[1] + (bounce + push) * axis[1]];
  rot += -0.06 * Math.sin(Math.PI * ph(t, F.push0, F.push1));
  const lu = E.io(ph(t, F.look0, F.look1));
  c = [c[0] - 4 * lu, c[1] - 16 * lu];
  rot -= 0.1 * lu;
  return { c, rot };
}
/** 捏着砖的地方（砖自己的坐标：躺着时捏在上沿靠右，斜过来以后捏着靠上那一端） */
function gripOf(b: { c: V2; rot: number }): V2 {
  const s = Math.min(1, Math.max(0, b.rot / JAM_ROT));
  const lx = 30 + (-46 - 30) * s;
  const ly = -BRICK.h / 2 - 2;
  return [b.c[0] + lx * Math.cos(b.rot) - ly * Math.sin(b.rot), b.c[1] + lx * Math.sin(b.rot) + ly * Math.cos(b.rot)];
}
function herC(t: number, kid: { hip: V2 }) {
  const { p, root } = herBase(t, herMoveC);
  const her0: Her = { pose: p, root };
  const boot = bootOf(her0);
  const loc = (q: V2): V2 => [(q[0] - root[0]) / S, (q[1] - root[1]) / S];
  // 右手（远处那只，从他身后绕到砖上）写、放笔，放下以后收回去环着他；左手（近处那只）先搭在他肚子上，放笔时挪到砖上捏住、拿起来
  const tip = herPenTip(t);
  const penHand: V2 = [tip[0] + 40 + 4 * ph(t, F.pen0, F.pen1), tip[1] - 22 + 10 * ph(t, F.pen0, F.pen1)];
  const back: V2 = [kid.hip[0] + HUG_R[0], kid.hip[1] + HUG_R[1]];
  const handR = mix(penHand, back, E.io(ph(t, F.pen1, F.pen1 + 0.3)));
  const b = heldBrick(t, boot.mouth);
  const hug: V2 = [kid.hip[0] + HUG_L[0], kid.hip[1] + HUG_L[1]];
  const handL = t >= F.grab1 ? gripOf(b) : mix(hug, gripOf(b), E.io(ph(t, F.pen0, F.grab1)));
  p.armL = { ...(p.armL as object), to: loc(handL), ik: 1, bend: -1, chest: "over" } as PoseIn["armL"];
  p.armR = { ...(p.armR as object), to: loc(handR), ik: 1, bend: -1 } as PoseIn["armR"];
  const j = jointsOf(p);
  const palm: V2 = [root[0] + j.palmR[0] * S, root[1] + j.palmR[1] * S];
  return { pose: p, root, tip, brick: b, palm, boot: bootOf({ pose: p, root }) };
}
/** 靴筒里塞满的砖（翻边下沿以下藏在靴筒里），再把翻边和一圈铆钉画回去压在砖上 */
function stuffBoot(g: CanvasRenderingContext2D, t: number, her: Her, boot: ReturnType<typeof bootOf>, list: Stuffed, line: number) {
  const K = CHEN_COLORS;
  const { m, sx, mouth, toRoom } = boot;
  const below = [6, 7, 8, 9].map((i) => toRoom(RIM_L[i]));
  g.save();
  const clip = new Path2D();
  clip.moveTo(below[0][0], below[0][1]);
  for (const q of below.slice(1)) clip.lineTo(q[0], q[1]);
  clip.lineTo(below[3][0], below[3][1] - 400);
  clip.lineTo(below[0][0], below[0][1] - 400);
  clip.closePath();
  g.clip(clip);
  for (const b of list) {
    const c: V2 = [mouth[0] + b.dx, mouth[1] - b.up + (BRICK.w * 0.86) / 2];
    drawBrickMoved(g, t, b.words, c, Math.PI / 2 + b.tilt, 0.86);
  }
  g.restore();
  g.save();
  g.translate(her.root[0], her.root[1]);
  g.scale(S, S);
  if (sx < 0) g.scale(-1, 1);
  part(g, cubicPath(RIM_L, m), K.bootRim, K.bootShade, 2.4 * line, [2, 2]);
  g.fillStyle = K.rivet;
  for (const d of RIVETS_L) {
    const q = m(d.c);
    g.beginPath();
    g.arc(q[0], q[1], d.r, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}
/** ⑨ 跳过去以后：他睡着了，她写完、放笔、拿砖往靴子里插 */
export function fullAway(t: number): RoomAway {
  const kid = kidC(t);
  const her = herC(t, kid);
  const K = CHEN_COLORS;
  return awayOf(t, {
    desk: (g) => {
      // 他那块「妈妈，明天见」挪到桌子左边；她那块拿起来以前躺在桌上；放下的笔
      drawBrickMoved(g, t, GIFT_WORDS, [BRICK_C[0] - 128, BRICK_C[1]], 0);
      if (t < F.grab1) drawBrickAndWords(g, t, HER_WORDS);
      if (t >= F.pen1) drawPen(g, [PEN_REST[0] + 50, PEN_REST[1]], PEN_REST);
    },
    kid,
    her,
    // 远处那只铁靴也塞满了（在他的鞋后面）
    beforeKid: (g, line) => stuffBoot(g, t, her, bootOf(her, "R"), STUFF_FAR, line),
    hook: (g) => {
      if (t < F.pen1) drawPen(g, her.palm, her.tip);
      if (t >= F.grab1) drawBrickMoved(g, t, HER_WORDS, her.brick.c, her.brick.rot);
    },
    after: (g, line) => {
      const { sx } = her.boot;
      // 他坐在她远处那条腿上：他垂下来的外套下摆在她近处那只铁靴后面——近处那只铁靴整只再画一遍压在他的外套上
      const rig = rigOf(her.pose);
      g.save();
      g.translate(her.root[0], her.root[1]);
      g.scale(S, S);
      if (sx < 0) g.scale(-1, 1);
      drawBoot(g, rig, "L", { line: K.line, lw: 3 * line, shade: [sx < 0 ? -4 : 4, 4] });
      g.restore();
      stuffBoot(g, t, her, her.boot, STUFF, line);
    },
  });
}

/** 他那块「妈妈，明天见」（四 街上他举着它）：中心 c、转 rot、缩放 size（街上的人按 1 倍画：屋里的 1/1.22） */
export function drawGiftBrick(g: CanvasRenderingContext2D, t: number, c: V2, rot: number, size: number) {
  drawBrickMoved(g, t, GIFT_WORDS, c, rot, size);
}
/**
 * 四⑦ 他在她那块砖的背面写的「沉沉，明天见」：和三⑧「妈妈，明天见」同一个人写的（一样大、一样歪），六个字都在四⑦写，
 * 两行来回划
 */
const SHEN_WORDS: Glyph[] = (() => {
  const chs = [..."沉沉，明天见"];
  const adv = [19, 19, 11, 19, 19, 19];
  const total = adv.reduce((a, b) => a + b, 0);
  let x = BRICK.x - total / 2;
  return chs.map((ch, i) => {
    const cx = x + adv[i] / 2;
    x += adv[i];
    const c: V2 = [cx, BRICK.y - 20 + [0, 2, 3, -1, 1, -2][i]];
    const size = [21, 20, 20, 20, 20, 21][i];
    const w = size * 1.1;
    const stroke = (u: number): V2 => {
      const k = Math.min(2 - 1e-6, Math.max(0, u) * 2);
      const r = Math.floor(k);
      const v = k - r;
      const dir = r % 2 === 0 ? 1 : -1;
      return [cx + dir * size * 0.42 * (2 * v - 1), c[1] - size * 0.16 + r * size * 0.32 + 1.5 * Math.sin(v * Math.PI * 4 + i * 1.7 + r)];
    };
    return { ch, c, size, rot: [0.05, -0.06, 0, 0.04, -0.05, 0.06][i], at: WRITE7_T.chars[i], rows: 2, box: [cx - w / 2, c[1] - w / 2, w, w], stroke };
  });
})();
/** 四⑦ 笔尖在砖上的哪（相对砖的中心，屋子单位）：写完挪到砖的右头外面，让开写好的字 */
export function shenTip(t: number): V2 {
  const p = tipAlong(SHEN_WORDS, t, [BRICK.x + BRICK.w / 2 + 8, BRICK.y - 30]);
  return [p[0] - BRICK_C[0], p[1] - BRICK_C[1]];
}
/** 砖的背面（没有字，几个小坑；颜色比正面暗一点，翻过来时分得出正反） */
function drawBrickBack(g: CanvasRenderingContext2D) {
  const B = BRICK;
  const p = new Path2D();
  p.roundRect(B.x - B.w / 2, B.y - B.h, B.w, B.h, 5);
  part(g, p, "#c2bdb3", "#aaa59b", 3.5, [4, 4]);
  g.fillStyle = "rgba(118,108,102,0.38)";
  for (const [dx, dy, r] of [
    [-30, -26, 2.4],
    [12, -14, 1.9],
    [38, -29, 1.6],
    [-9, -9, 1.5],
  ]) {
    g.beginPath();
    g.arc(B.x + dx, B.y + dy, r, 0, Math.PI * 2);
    g.fill();
  }
}
/**
 * 她那块「活下去」（四⑤ 从铁靴里震出来、四⑥ 他捡起来翻过来）：中心 c、转 rot、缩放 size；
 * flipY 竖着的倍数（剪纸绕长边一翻：正数看见背面，负数翻过来看见正面的字）
 */
export function drawHerBrick(g: CanvasRenderingContext2D, t: number, c: V2, rot: number, size: number, flipY = -1) {
  g.save();
  g.translate(c[0], c[1]);
  g.rotate(rot);
  g.scale(size, size * Math.max(0.04, Math.abs(flipY)));
  g.translate(-BRICK_C[0], -BRICK_C[1]);
  if (flipY > 0) {
    drawBrickBack(g);
    // 四⑦ 背面写上的「沉沉，明天见」（没写到的字不画）
    drawGlyphs(g, t, SHEN_WORDS);
  } else drawBrickAndWords(g, t, HER_WORDS);
  g.restore();
}
/** 砖的长、高（屋子坐标） */
export const BRICK_SIZE: V2 = [BRICK.w, BRICK.h];

/** 写到第几个字了（0–2，连续的）：镜头跟着它往右挪，不跟笔尖来回划的那几下 */
const writeProgress = (t: number) => 2 * E.io(ph(t, L.chars[0][0], L.chars[2][1]));
const writeProgressB = (t: number) => 2 * E.io(ph(t, G.chars[0][0], G.chars[2][1]));
/** 手持呼吸：画面上约 3 像素 */
const breath = (t: number): V2 => [
  3 * (0.6 * Math.sin(t * 0.83) + 0.4 * Math.sin(t * 1.37 + 1.1)),
  3 * (0.6 * Math.sin(t * 0.71 + 2) + 0.4 * Math.sin(t * 1.19)),
];

/**
 * ⑦的镜头（屋子坐标的取景）：溶的时候两双手在画面上的位置和大小跟着街上那两只牵着的手（街上的镜头在 t 时刻的位置、倍数；
 * 屋里的人按 1.22 倍画，所以屋里的倍数 = 街上的倍数 ÷ 1.22）；溶完一路推近（柔和起步、一路减速，到最后一个字还在很慢地凑），
 * 落在砖、两只手和两张脸上，跟着写到的字往右挪一点；叠一点手持呼吸
 */
function cam7(t: number): Cam {
  const tm = Math.min(t, L.mix1);
  const sc = walkCam(tm);
  const s = toScreenV(sc, ...streetClasp(tm));
  const match = aimRoom(handsAt(tm), s[0], s[1], sc.z / ROOM.s);
  const z = 2.8;
  const h = ph(t, L.mix1, L.mix1 + 0.5);
  const [bx, by] = breath(t);
  const cx = charC(0)[0] + 34 * writeProgress(t) + 90;
  const close = aimRoom([cx + (h * bx) / z, 1214 + (h * by) / z], 540, 1000, z);
  return camLerp(match, close, E.settle(ph(t, L.mix1 - 0.1, L.end + 0.25)));
}
/**
 * 屋里的镜头：⑦ 见 cam7；⑧ 接着⑦很慢地凑着，「心里」起再往里推（E.io，跳过去那几帧最快），落到他自己写字的手、砖和低着头的脸上
 * （3.2 倍，她搁在他头上的脸还在画面里），跟着写到的字往右挪一点
 */
export function lessonCam(t: number): Cam {
  const c7 = cam7(t);
  if (t < G.start) return c7;
  const z = 3.2;
  const [bx, by] = breath(t);
  const cx = GIFT_WORDS[3].c[0] + 19 * writeProgressB(t) + 44;
  const close = aimRoom([cx + bx / z, 1236 + by / z], 540, 1040, z);
  const c8 = camLerp(c7, close, E.io(ph(t, 102.3, 103.85)));
  if (t < F.start) return c8;
  // ⑨ 跟着她拿砖的手往下，落到塞满砖的铁靴上（靴口在画面 1340，她低着的脸、睡着的他还在上半截），往里凑一点，不往回拉
  const zf = 3.3;
  const [mx, my] = mouthRoom();
  const down = aimRoom([mx + 10 + bx / zf, my + by / zf], 520, 1340, zf);
  return camLerp(c8, down, E.io(ph(t, 104.5, 105.35)));
}
/** ⑨ 她近处那只铁靴的靴口在屋里哪（坐着时腿不动，算一次） */
let MOUTH_ROOM: V2 | null = null;
function mouthRoom(): V2 {
  if (!MOUTH_ROOM) {
    const b = herBase(F.carry1, herMoveC);
    MOUTH_ROOM = bootOf({ pose: b.p, root: b.root }).mouth;
  }
  return MOUTH_ROOM;
}
