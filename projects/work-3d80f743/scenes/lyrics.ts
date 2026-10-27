// 逐字歌词（用户 2026-10-27：「添加逐字歌词，歌词的构图要和动画要和画面对应或者互动，要带有情绪」；
// 同一天又改：「不要一个字一个字的出来，改成每次一句，正在被唱的字高亮，没被唱的字和被唱过的字用不同的显示方式。
// 画面变化的时候，歌词为了构图实时可以移动位置，或者改变排列，不用固定」）。
// 时间在 lib/lyrics_t.ts（酷狗 KRC，坏的 16 处用分离出来的人声逐字核对改过），字形在 lib/lyric_fx.ts。
// 图层 lyrics 盖在所有画面上，图层时间 = 作品时间。
//
// 一句整句一起出来（唱第一个字前一点），卡拉 OK：没唱的字淡，正在唱的字换成亮的暖橙、放大一点、后面一团暖光，唱过的字实。
// 每句放在那一镜的空处（不压脸和要看的东西，抖音安全区：上 ≥ 250、下 ≤ 1460、下半截右 ≤ 900）；
// 画面变了（切镜、镜头拉开、人走到字那里）就用 re 换排列：字一个接一个飞到新的位置，可以横排变竖排、换字号、拆成两行。
// 字跟着画面里的事动——
//   飘：绝望、想走的句子，唱过的字往上飘，最后化成灰；
//   沉：被拽住、穿上铁靴、砖落地的句子，整句落下来一沉，跟着拽的那几下往下顿；
//   光：砖亮起来、灯下，字跟着发暖光；灯灭（看不清灯火）字的光也灭、糊掉；
//   线：红绳拴住（困在一张没空隙的网、系绳子）字被红线连住、勒紧；
//   刀割断红绳（带）字被一刀劈开，上半截跟着妈妈飞走；跺地（意义）字跟着裂开；
//   倒过来的屋子里字跟着她被拽歪、再跟着镜头转回来；四声「活下去」是她的手写，唱到一个字就像笔写出来一样扫亮，
//   人链每接上一个人，字上往外扩的暖光就密一层，第四声在全片最强的光里亮起来。

import type { Scene, SceneOptions } from "@frame/engine/types";
import { nextTask } from "@frame/engine/scheduling";
import { LYRICS, type LyricTiming } from "../lib/lyrics_t";
import { NET_T, netCam, netShake } from "../lib/net";
import { shake } from "../lib/cam";
import {
  type Key,
  type Key2,
  type Mote,
  type Pal,
  type Shard,
  E,
  bump,
  clamp01,
  impulse,
  loadLyricFonts,
  motes,
  rnd,
  sampleKey,
  sampleKey2,
  shakeAt,
  shards,
  sprite,
} from "../lib/lyric_fx";

type Enter = "rise" | "drop" | "fall" | "streak" | "pop" | "fade" | "gather";
type Exit = "fade" | "up" | "ash" | "light" | "sink" | "dust" | "left" | "yank" | "yankR" | "scatter";
type Fx =
  /** 一下冲击（像素），idx 不给就是整句 */
  | { k: "jolt"; t: number; dx?: number; dy?: number; decay?: number; idx?: number[] }
  /** 抖；t1 给了就一直抖到 t1 */
  | { k: "shake"; t: number; amp: number; decay?: number; t1?: number }
  /** 这几个字在这几个时刻鼓一下、亮一下（心跳） */
  | { k: "pulse"; ts: number[]; idx: number[]; amp?: number }
  /** 暖光：t0–t1 亮起来，到 t2 开始退，t3 退完（不给就一直亮到句末）；光在字后面，burn 时字本身也烧亮 */
  | { k: "glow"; t0: number; t1: number; t2?: number; t3?: number; peak?: number; idx?: number[]; burn?: boolean }
  /** 糊掉、暗下去（看不清） */
  | { k: "blur"; t0: number; t1: number; px: number; alpha?: number; idx?: number[] }
  /** 像要灭的灯那样闪 */
  | { k: "flicker"; t0: number; t1: number; idx: number[] }
  /** 字距随时间变（勒紧、抱住） */
  | { k: "gap"; keys: Key[] }
  /** 哼歌一样一字一字上下起伏 */
  | { k: "wave"; amp: number; f: number }
  /** 迷茫：字各自慢慢晃开、有点糊 */
  | { k: "wander"; t0: number; amp: number; blur?: number }
  /** 天上炸开彩光时，字上掠过一道彩色的光 */
  | { k: "rainbow"; t: number; dur?: number }
  /** 每个字后面一扇亮着的窗，到点一扇扇关上 */
  | { k: "windows"; ts: number[] }
  /** 红绳绕着字走，tight 时勒紧拉直 */
  | { k: "thread"; t0: number; t1: number; tight: number }
  /** 红绳网：字被四面八方的红绳拴住（现在没用） */
  | { k: "net"; t0: number }
  /** 被拴住：唱到的字往下一坠、猛地被拽停（弹两下），之后像拴在天上的人一样吊着轻轻荡 */
  | { k: "hang"; drop?: number; sway?: number }
  /** 一刀劈开：at 之前的字被劈下来、往上飞走 */
  | { k: "cut"; t: number; at: number; angle?: number }
  /** 字裂开 */
  | { k: "crack"; t: number; ox?: number; oy?: number }
  /** 回响：字一圈圈往外扩散的暖光（v 越大越密：说的人越多），converge 时收拢进字里 */
  | { k: "echo"; keys: Key[]; converge?: number }
  /** 从 at 劈成两截，前一截往 dy1、后一截往 dy2 */
  | { k: "split"; t0: number; t1: number; at: number; dy1: number; dy2: number }
  /** 一个字慢慢滑开 */
  | { k: "slip"; t0: number; t1: number; idx: number; dx: number; dy: number; r?: number }
  /** 碎成粉末往下掉 */
  | { k: "crumble"; t: number; idx: number[]; dur?: number }
  /** 只淡到 v（没说出口） */
  | { k: "fadeTo"; t0: number; t1: number; v: number; idx: number[] }
  /** 四周像雪一样落着灰 */
  | { k: "snow"; t0: number; t1: number };

/** 一种排列：中心（x, y）、横排 h / 竖排 v、字号、字距、拆成几行（竖排是几列，从右往左读） */
interface Arr {
  x: number;
  y: number;
  dir?: "h" | "v";
  size?: number;
  gap?: number;
  rows?: number;
}
/** 到 t 换成新的排列（没写的项沿用上一种），dur 秒里字一个接一个飞过去；路上会压到人时用 via: "fade"（原地淡出、新位置淡入） */
interface Re extends Partial<Arr> {
  t: number;
  dur?: number;
  via?: "fly" | "fade";
}

interface Look extends Arr {
  text: string;
  re?: Re[];
  font?: "serif" | "hand";
  pal?: Pal;
  /** 从 day 渐变到 night（0–1） */
  night?: Key[];
  accent?: string[];
  enter?: Enter;
  dIn?: number;
  /** 整句提前多少秒出来（不给：和上一句叠在一起就 0.18，不叠就 0.4） */
  lead?: number;
  /** 唱到的字怎么亮：pop 换成亮字、放大一点；wipe 像笔写出来一样从左往右扫亮 */
  kara?: "pop" | "wipe";
  /** 飘：唱过的字每秒往上多少 */
  floatV?: number;
  exit?: Exit;
  /** 退场开始（不给：唱完一点；和下一句叠在一起时下一句出来前退完） */
  out?: number;
  dOut?: number;
  move?: Key2[];
  rot?: Key[];
  fx?: Fx[];
  alpha?: number;
  /** 退场时一个字比前一个晚多少秒（默认 0.03） */
  stagger?: number;
  /** drop：从多高落下来 */
  dropH?: number;
  /** 到 t 时正在唱的字的亮色换成 color（0.25 秒换过去） */
  hlTo?: { t: number; color: string };
  /** 跟着画面转：整句（位置和字）绕画面中心 (540, 960) 转这个角度（弧度），和镜头一起转 */
  spin?: (t: number) => number;
  /** 跟着画面抖（像素） */
  quake?: (t: number) => number;
}

// ——— 每一句（和 lib/lyrics_t.ts 一一对应） ———
const LOOK: Look[] = [
  // 16.0 镜头顺着楼扎进哑铃店：整句跟着往下扎、落定在卷帘门前；「争」男人往回拽、「夺」她一把夺到怀里
  { text: "反乌托邦中的争夺", x: 560, y: 700, enter: "fall", dIn: 0.42, lead: 0.3, accent: ["争夺"],
    fx: [{ k: "jolt", t: 17.16, dx: 26, decay: 0.2 }, { k: "jolt", t: 17.34, dx: -34, decay: 0.24 }, { k: "shake", t: 17.34, amp: 5, decay: 0.3 }],
    out: 17.74, dOut: 0.22, stagger: 0.01 },
  // 18.51 哑铃「咚」放在铁桩旁，字一沉；「粉末」碎成粉往下掉，镜头顺着红线往上找她，字留在下面
  { text: "把愿望敲碎成粉末", x: 540, y: 340, accent: ["粉末"], lead: 0.12, dIn: 0.25,
    move: [{ t: 19.05, y: 0, e: "io" }, { t: 19.85, y: 120 }],
    fx: [{ k: "jolt", t: 18.51, dy: 18, decay: 0.22 }, { k: "shake", t: 18.51, amp: 3, decay: 0.2 }, { k: "crumble", t: 19.62, idx: [6, 7], dur: 0.9 }],
    exit: "dust", out: 19.62, dOut: 0.6 },
  // 三把拽红线（20.01 / 20.51 / 21.01）字一顿一顿往下沉；21.53「锁」哔哒扣上（竖在左边，她在画面中间往下被拽）
  { text: "心灵也被挂上门锁", x: 172, y: 575, dir: "v", size: 60, enter: "drop", dropH: 48, accent: ["门锁"],
    move: [{ t: 20.0, y: 0, e: "out" }, { t: 20.14, y: 16 }, { t: 20.5, y: 16, e: "out" }, { t: 20.64, y: 32 }, { t: 21.0, y: 32, e: "out" }, { t: 21.14, y: 48 }],
    fx: [{ k: "pulse", ts: [21.54], idx: [7], amp: 0.5 }, { k: "shake", t: 21.54, amp: 4, decay: 0.18 }], out: 21.8, dOut: 0.1 },
  // 挂在门灯上面，「灯火」先暖暖地亮着，22.80 门灯一灭字也灭、糊掉（看不清）；她飘走，镜头往上，字留在门口
  { text: "看不清灯火", x: 330, y: 760, enter: "fade", lead: 0, dIn: 0.14, accent: ["灯火"],
    move: [{ t: 22.92, y: 0, e: "in2" }, { t: 23.6, y: 300 }],
    fx: [{ k: "glow", t0: 21.7, t1: 21.95, t2: 22.8, t3: 22.86, peak: 0.85, idx: [3, 4] }, { k: "flicker", t0: 22.8, t1: 22.98, idx: [3, 4] },
      { k: "blur", t0: 22.8, t1: 23.15, px: 2.4, alpha: 0.62 }],
    out: 23.45, dOut: 0.35 },
  // 红线断了，她吊着哑铃慢慢往上飘、低头望着家门：唱过的字一个个往上飘
  { text: "但我还想做些什么", x: 360, y: 340, size: 58, floatV: 16, exit: "up" },
  // 高空：字竖着挂在左边空着的天上；镜头推近她开锁（她占满左边和中间），字让到右下角拆成两行；
  // 27.01「咔」锁开了、哑铃掉下去，字松开、越飘越快，化成灰
  { text: "其实还想要说很多", x: 170, y: 760, dir: "v", size: 60,
    re: [{ t: 26.36, x: 720, y: 1250, dir: "h", size: 58, rows: 2, dur: 0.4, via: "fade" }],
    move: [{ t: 27.01, y: 0, e: "in2" }, { t: 28.0, y: -330 }], exit: "ash", out: 27.62, dOut: 0.6 },
  // 沉沉扑出去，28.46「等」抱住：字一下抱紧（字距收拢）
  { text: "请你等等我", x: 540, y: 420, gap: 0.12, enter: "pop",
    fx: [{ k: "gap", keys: [{ t: 28.4, v: 0.12, e: "out" }, { t: 28.62, v: 0.02, e: "io" }, { t: 29.3, v: 0.02, e: "io" }, { t: 29.6, v: 0.12 }] },
      { k: "jolt", t: 28.46, dy: 14, decay: 0.22 }], exit: "fade", dOut: 0.2 },
  // 抱着慢慢落到楼顶上（30.01 坐下），天黑下来：字也慢慢落下来、坐定，跟着天色变成夜里的字
  // 第二遍在同一个位置重唱（字先暗回去、再一个个亮）；落到楼顶那一下（30.01）一沉
  { text: "请你等等我", x: 540, y: 420, gap: 0.12, enter: "fade", dIn: 0.2, night: [{ t: 30.8, v: 0 }, { t: 31.6, v: 1 }],
    fx: [{ k: "jolt", t: 30.01, dy: 8, decay: 0.25 }], out: 31.72, dOut: 0.22 },
  // 笔尖写「活、下、去」：唱到的字像笔写出来一样扫亮（和笔同步）
  { text: "两块五的签字笔", x: 440, y: 470, enter: "fade", kara: "wipe", accent: ["两块五"], lead: 0.18, dIn: 0.18, out: 33.5, dOut: 0.2 },
  // 东一块西一块拼起来：字从四处飞来拼成一句；「句」她抱着砖冲出门，字跟着往左冲走
  { text: "东拼西凑的词句", x: 400, y: 480, enter: "gather", dIn: 0.4, lead: 0.3, exit: "left", out: 35.3, dOut: 0.42 },
  // 夜里的楼顶：她跳下来（36.016 落地），整句跟着落下来；36.81 砖一沉；砖暖暖地亮起来，「拯救你」也亮
  { text: "妄想用它拯救你", x: 540, y: 400, pal: "night", enter: "drop", dIn: 0.3, accent: ["拯救你"],
    fx: [{ k: "jolt", t: 36.016, dy: 12, decay: 0.2 }, { k: "jolt", t: 36.81, dy: 16, decay: 0.3, idx: [4, 5, 6] },
      { k: "glow", t0: 37.0, t1: 37.45, peak: 0.85, idx: [4, 5, 6] }] },
  // 脱铁靴（38.016、38.43 两只「咚」），没了铁靴她飘起来，字也飘；39.016 脚绳绷直把她拉住，字被拽一下
  { text: "顺便拯救我自己", x: 540, y: 330,
    move: [{ t: 38.55, y: 0, e: "io" }, { t: 39.0, y: -70, e: "lin" }, { t: 39.016, y: -62, e: "out" }, { t: 39.2, y: -52 }],
    fx: [{ k: "jolt", t: 38.016, dy: 12, decay: 0.18 }, { k: "jolt", t: 38.43, dy: 12, decay: 0.18 }],
    out: 39.27, dOut: 0.15, stagger: 0 },
  // 甩进夜里的城（画面转着），字也跟着转正，40.0 鼓进来时停稳
  { text: "只因为", x: 540, y: 430, size: 62, pal: "night", enter: "fade", dIn: 0.16,
    rot: [{ t: 39.2, v: -1.0, e: "out" }, { t: 39.98, v: 0 }], out: 39.95, dOut: 0.16, stagger: 0 },
  // 一个人张着手往白里飞：整句从下面冲上来、竖着跟他往上走；「心」「脏」胸口的光跳两下，字也跳；「困」被拽住，字跟着被拽下去
  { text: "你那渴望自由的心脏", x: 190, y: 800, dir: "v", size: 64, pal: "night", enter: "streak", dIn: 0.3, accent: ["心脏"],
    move: [{ t: 40.2, y: 0, e: "lin" }, { t: 42.0, y: -110 }],
    fx: [{ k: "pulse", ts: [41.36, 41.72], idx: [7, 8], amp: 0.42 }, { k: "glow", t0: 41.36, t1: 41.42, peak: 0.8, idx: [7, 8] }],
    exit: "yank", out: 41.98, dOut: 0.3, stagger: 0.015 },
  // 「困」红绳一下把他拽住：先横在他举着的手上面；镜头退到整座城、白压在上面时，整句落到白的下沿，被四面八方的红绳拴住
  // 用户 2026-10-27：「把红线去掉，换成另外一个效果，然后也跟着画面旋转更好」——
  // 整句和镜头一起转（netCam 的 r，拉开时转到约 15°，绕画面中心）、一起震；唱到的字往下一坠、猛地被拽停，
  // 之后像天上被拴住的人一样吊着轻轻荡；三拍有人冲进白里化成灰（ASH_BEATS），字跟着一亮一跳
  { text: "困在一张没空隙的网", x: 540, y: 560, enter: "drop", dIn: 0.2, lead: 0.02, night: [{ t: 42.15, v: 1 }, { t: 42.6, v: 0 }],
    spin: (t) => netCam(Math.min(t, NET_T.end)).r, quake: (t) => netShake(t) * 0.6,
    fx: [{ k: "hang", drop: 22, sway: 0.07 }, { k: "pulse", ts: [42.516, 43.016, 43.516], idx: [0, 1, 2, 3, 4, 5, 6, 7, 8], amp: 0.08 }],
    out: 43.8, dOut: 0.12, stagger: 0 },
  // 天亮的街上：妈妈一把一把往下拽（44.52 / 45.06 / 45.45），字跟着一顿；「光亮」亮起来
  { text: "我们的周围并非没光亮", x: 540, y: 1370, accent: ["光亮"], lead: 0.0, dIn: 0.2,
    fx: [{ k: "jolt", t: 44.52, dy: 12 }, { k: "jolt", t: 45.06, dy: 12 }, { k: "jolt", t: 45.45, dy: 12 },
      { k: "glow", t0: 45.45, t1: 45.6, t2: 45.8, t3: 46.1, peak: 0.8, idx: [8, 9] }] },
  // 抱着、一道光照下来：「太耀眼」白得发烫，「灼」把他推开那一下，「灼伤」烫一下
  { text: "只是太耀眼将我们灼伤", x: 172, y: 800, dir: "v", size: 60, accent: ["灼伤"],
    fx: [{ k: "glow", t0: 46.35, t1: 46.5, t2: 46.75, t3: 47.2, peak: 0.75, idx: [2, 3, 4], burn: true },
      { k: "glow", t0: 47.46, t1: 47.5, t2: 47.6, t3: 47.95, peak: 0.9, idx: [8, 9] }, { k: "jolt", t: 47.46, dy: 10, idx: [8, 9] }] },
  // 沉沉冲过来跳起来抓住他：「迷茫」字各自晃开
  { text: "在这个世界难免会迷茫", x: 172, y: 800, dir: "v", size: 60, enter: "fade",
    fx: [{ k: "wander", t0: 49.3, amp: 8, blur: 1.4 }] },
  // 「带」51.06 妈妈割断红绳：字一刀劈开，上半截跟着她飞上去；「带在身上」跟着掉下去的两个人落地（51.43「咚」）
  { text: "但别再把小刀带在身上", x: 172, y: 800, dir: "v", size: 60, accent: ["小刀"],
    fx: [{ k: "cut", t: 51.06, at: 6, angle: -0.55 }, { k: "jolt", t: 51.43, dy: 20, decay: 0.24, idx: [6, 7, 8, 9] }, { k: "shake", t: 51.43, amp: 4, decay: 0.2 }] },
  // 跪在街上抱着他；52.517 天上炸开彩色的光（她碰到了白），字上掠过一道彩光，之后灰像雪一样落
  { text: "至少我还在为你而歌唱", x: 540, y: 470, enter: "fade", fx: [{ k: "rainbow", t: 52.52, dur: 1.0 }, { k: "snow", t0: 52.7, t1: 56.0 }] },
  // 54.518 小刀从天上掉下来「叮」砸在铁靴跟前
  { text: "在黑暗漫长的反乌托邦", x: 540, y: 470, enter: "fade", fx: [{ k: "shake", t: 54.52, amp: 3, decay: 0.2 }, { k: "snow", t0: 53.9, t1: 56.0 }] },
  // 回忆（旧照片的颜色）：「即便」「我们」「都在」三声隔着很远，一声一声排到上面；
  // 妈妈写下「活下去」丢下来，「这黑暗漫长的反乌托邦」跟着木牌落下来（62.018「咚」），整句最后化成灰
  { text: "即便", x: 300, y: 305, pal: "memory", enter: "fade", dIn: 0.45, exit: "ash", out: 63.9, dOut: 0.7, stagger: 0.02 },
  { text: "我们", x: 540, y: 305, pal: "memory", enter: "fade", dIn: 0.45, exit: "ash", out: 63.9, dOut: 0.7, stagger: 0.02 },
  { text: "都在", x: 780, y: 305, pal: "memory", enter: "fade", dIn: 0.45, exit: "ash", out: 63.9, dOut: 0.7, stagger: 0.02 },
  { text: "这黑暗漫长的反乌托邦", x: 540, y: 445, pal: "memory", enter: "drop", dropH: 70, dIn: 0.34, lead: 0.32,
    fx: [{ k: "jolt", t: 62.018, dy: 14, decay: 0.22 }, { k: "shake", t: 62.018, amp: 3, decay: 0.2 }], exit: "ash", out: 63.9, dOut: 0.7, stagger: 0.02 },
  // 倒着的屋子（她的世界）：刀压在脚绳上，「挣脱」字跟着手发抖，「生活」闭上眼；「做」脚绳一拽，字被拽歪拖走
  { text: "忍着想要挣脱的生活", x: 540, y: 520, size: 60, pal: "night", enter: "fade", lead: 0.04, dIn: 0.3,
    fx: [{ k: "shake", t: 72.45, amp: 2.2, decay: 0.15, t1: 72.96 }], exit: "yankR", out: 73.89, dOut: 0.26, stagger: 0 },
  // 被拽得横过来，字跟着歪；「诺」第二下，镜头转回正，字也晃回来
  { text: "做出不想做的承诺", x: 540, y: 430, size: 60, pal: "night", enter: "pop", lead: 0.02, dIn: 0.2,
    rot: [{ t: 73.89, v: -0.3, e: "out" }, { t: 74.25, v: -0.2, e: "io" }, { t: 75.3, v: -0.2, e: "back" }, { t: 75.8, v: 0 }],
    fx: [{ k: "jolt", t: 75.3, dy: 16, decay: 0.25 }] },
  // 他一把一把拽（76.01、76.51），抱住她的腿，77.51 她踩进铁靴「咚」：字一顿一顿、最后落地
  { text: "列车上坐错站的乘客", x: 860, y: 620, dir: "v", size: 58, pal: "night",
    fx: [{ k: "jolt", t: 76.01, dy: 14 }, { k: "jolt", t: 76.51, dy: 14 }, { k: "jolt", t: 77.51, dy: 24, decay: 0.3 }, { k: "shake", t: 77.51, amp: 4, decay: 0.2 }] },
  // 两个人都不说话：字小、隔得开、慢慢浮出来又慢慢没了
  { text: "困惑着沉默", x: 860, y: 560, dir: "v", size: 52, gap: 0.55, pal: "night", enter: "fade", dIn: 0.6, alpha: 0.9, out: 79.3, dOut: 0.6 },
  // 他把自己的红绳一圈圈绕在她的脚绳上，「么」一拉勒紧：红绳从字底下绕过去，勒紧时字挤到一起
  { text: "但我还想做些什么", x: 540, y: 330,
    fx: [{ k: "thread", t0: 80.0, t1: 81.0, tight: 81.18 }, { k: "gap", keys: [{ t: 81.12, v: 0.1, e: "out" }, { t: 81.32, v: -0.02 }] }] },
  // 早上：镜头从天花板往下摇到门口，字从下面跟着摇上来；「说很多」没说出口，淡淡的
  { text: "其实还想要说很多", x: 540, y: 400, move: [{ t: 81.5, y: 170, e: "out" }, { t: 82.6, y: 0 }],
    fx: [{ k: "fadeTo", t0: 83.0, t1: 83.55, v: 0.42, idx: [5, 6, 7] }], out: 83.66, dOut: 0.14 },
  // 阿满往上飘，她跳起来 84.45「等」攥住脚踝：字一拽，跟着两个人往上升
  { text: "请你等等我", x: 860, y: 560, dir: "v", size: 64, enter: "pop",
    move: [{ t: 84.5, y: 0, e: "io" }, { t: 85.75, y: -70 }], fx: [{ k: "jolt", t: 84.45, dy: 18, decay: 0.2 }] },
  // 小石头抱住她的腿往下拽，87.18「咚」三个人落回街面：字被拽下来、落地
  { text: "请你等等我", x: 860, y: 500, dir: "v", size: 64,
    move: [{ t: 85.8, y: -20, e: "in2" }, { t: 87.18, y: 60 }], fx: [{ k: "jolt", t: 87.18, dy: 22, decay: 0.26 }, { k: "shake", t: 87.18, amp: 4, decay: 0.2 }] },
  // 灯下：字被台灯照着，暖暖地亮
  { text: "发着光的半平米", x: 540, y: 420, enter: "fade", accent: ["发着光"], lead: 0.06, dIn: 0.3,
    fx: [{ k: "glow", t0: 87.9, t1: 88.6, peak: 0.45 }, { k: "glow", t0: 87.9, t1: 88.5, peak: 0.4, idx: [0, 1, 2] }] },
  // 他靠在她怀里睡着了：字像哼的歌一样一起一伏（镜头往下推到铁靴，她的脸到了上面，字竖在左边墙上）
  { text: "胡乱哼唱的旋律", x: 165, y: 560, dir: "v", size: 60, fx: [{ k: "wave", amp: 7, f: 1.1 }] },
  // 天快亮，他把手从她手里抽出来：最后那个「你」慢慢滑开
  { text: "但是还想拯救你", x: 540, y: 1400, pal: "night", enter: "fade", lead: 0.05, dIn: 0.3,
    fx: [{ k: "slip", t0: 93.5, t1: 94.0, idx: 6, dx: 56, dy: 26, r: 0.22 }], out: 93.86, dOut: 0.16 },
  // 天快亮的街上：94.6 外套「咚」掉在地上，字一沉；举起砖、脚跟离地，字也飘起来
  { text: "同时拯救我自己", x: 600, y: 360, move: [{ t: 94.9, y: 0, e: "in2" }, { t: 95.45, y: -50 }],
    fx: [{ k: "jolt", t: 94.6, dy: 16, decay: 0.22 }], out: 95.34, dOut: 0.16, stagger: 0 },
  // 她的手在床缝里攥了个空，95.58 睁眼：字一惊
  { text: "就请你", x: 760, y: 640, size: 60, pal: "night", enter: "fade", dIn: 0.15, lead: 0.04,
    fx: [{ k: "shake", t: 95.58, amp: 6, decay: 0.15 }], out: 95.94, dOut: 0.15, stagger: 0 },
  // 副歌二一镜到底：急，字大、一下砸出来；96.62 画外她跺进铁靴、97.62「哐」防飘栏被撞开
  { text: "放心大胆更妄为肆意", x: 540, y: 360, size: 66, enter: "pop", accent: ["肆意"], lead: 0.04, dIn: 0.2, out: 97.7, dOut: 0.14, stagger: 0,
    fx: [{ k: "shake", t: 96.62, amp: 4, decay: 0.2 }, { k: "shake", t: 97.62, amp: 11, decay: 0.3 }, { k: "jolt", t: 97.62, dy: -14, decay: 0.2 }] },
  // 她从楼顶头朝下扑下去：字竖着往下扎，99.02 抱住他猛地一顿，惯性再往下坠到 100.27 停住
  { text: "迈步向前别害怕失去", x: 720, y: 560, dir: "v", size: 60, enter: "fall", dIn: 0.3, lead: 0.1,
    move: [{ t: 97.95, y: -60, e: "in2" }, { t: 99.02, y: 150, e: "out" }, { t: 99.12, y: 136, e: "io" }, { t: 100.27, y: 210 }],
    fx: [{ k: "jolt", t: 99.02, dy: -22, decay: 0.14 }] },
  // 旁边窗里的人一扇接一扇关上窗（100.77 起每半拍一扇）：字后面的窗光一盏盏灭
  { text: "没有犯下任何错的你", x: 540, y: 1360,
    fx: [{ k: "windows", ts: [100.77, 101.02, 101.27, 101.52, 101.77, 102.02, 102.27, 102.52, 102.77] }] },
  // 把铁靴给他，手指一根根掰开，103.45 松手：字从中间分开，上一截往上、下一截往下
  { text: "在我心里只用做自己", x: 880, y: 590, dir: "v", size: 58, enter: "fade",
    fx: [{ k: "split", t0: 103.45, t1: 103.95, at: 6, dy1: -36, dy2: 30 }] },
  // 104.02「咚」他穿着铁靴落地，104.52 砖砸在他靴尖前「咚」：整句砸下来，跟着两下「咚」顿两下
  { text: "这段胡乱拼凑的词语", x: 540, y: 400, enter: "drop",
    fx: [{ k: "jolt", t: 104.02, dy: 14, decay: 0.2 }, { k: "jolt", t: 104.52, dy: 14, decay: 0.2 }] },
  // 她光着脚越升越快，低头冲他笑：唱过的字往上飘，最后化成灰
  { text: "如果伤到你也请你忘记", x: 172, y: 1010, dir: "v", size: 58, floatV: 22, exit: "ash", out: 107.86, dOut: 0.9 },
  // 全片最重的一下：109.02 跺下去，字一沉、裂开
  { text: "但若你又找不到意义", x: 540, y: 430, enter: "drop", accent: ["意义"], lead: -0.05, dIn: 0.22,
    fx: [{ k: "jolt", t: 109.02, dy: 30, decay: 0.32 }, { k: "shake", t: 109.02, amp: 14, decay: 0.35 }, { k: "crack", t: 109.02, ox: 30, oy: 40 }],
    out: 109.72, dOut: 0.14, stagger: 0 },
  // 慢放：她飘到白的边上，闭上眼张开手，发梢化成光：字最后也化成光飘进白里
  { text: "希望这首歌能被记起", x: 540, y: 330, size: 60, enter: "fade", lead: 0.02, dIn: 0.3, exit: "light", out: 111.95, dOut: 1.0 },
  // 四声「活下去」：她的手写，唱到哪个字，那个字像笔写出来一样扫亮。每一声是人链的下一步——
  // 字上往外扩的暖光一层层密起来（一个人说、几个人说、一群人说），第四声 128.02 她接过砖，全片最强的光，光收拢进字里
  { text: "活下去", x: 540, y: 430, font: "hand", size: 138, gap: 0.02, enter: "fade", kara: "wipe", lead: 0.05, dIn: 0.3,
    fx: [{ k: "glow", t0: 114.93, t1: 116.2, t2: 117.3, t3: 117.9, peak: 0.45, idx: [2] }] },
  { text: "活下去", x: 540, y: 430, font: "hand", size: 148, gap: 0.02, enter: "fade", kara: "wipe",
    fx: [{ k: "echo", keys: [{ t: 118.0, v: 0, e: "lin" }, { t: 121.8, v: 5 }] }, { k: "glow", t0: 118.89, t1: 120.2, t2: 121.4, t3: 121.9, peak: 0.5, idx: [2] }],
  },
  // 第三声「下」溶进那一夜的回忆（他拽她的脚绳 → 落进铁靴 → 系绳）：字淡到左边竖着，躲开两个人；回到两张床那一镜再横回上面
  { text: "活下去", x: 540, y: 430, font: "hand", size: 158, gap: 0.02, enter: "fade", kara: "wipe",
    re: [{ t: 122.34, x: 172, y: 560, dir: "v", dur: 0.36, via: "fade" }, { t: 124.42, x: 540, y: 450, dir: "h", dur: 0.36, via: "fade" },
      // 拍上切回现在（她倒挂着攥住栏杆的近景，身子在画面中间）：字让到右边竖着
      { t: 125.44, x: 880, y: 560, dir: "v", size: 156, dur: 0.2, via: "fade" }],
    fx: [{ k: "echo", keys: [{ t: 121.9, v: 5, e: "lin" }, { t: 125.8, v: 11 }] }, { k: "glow", t0: 122.58, t1: 124.2, t2: 125.4, t3: 125.95, peak: 0.55, idx: [2] }],
    out: 125.8, dOut: 0.08, stagger: 0,
  },
  // 第四声：镜头从街上往后拉开到整条人链。字不压人链：竖着挂在人链右边空着的天上，和人链并排（人链就是这三个字）；
  // 人链荡到右边（128.0）、再一口气荡向她，字跟着轻轻摆；「去」128.02 她接过砖、全片最强的光：
  // 回响收拢进字里，字后面的光一下涨满，正在唱的「去」从橙色换成暖金（光里亮，但不冲白），句子唱完化成光
  { text: "活下去", x: 880, y: 560, dir: "v", font: "hand", size: 156, gap: 0.02, enter: "fade", kara: "wipe", lead: 0.02, dIn: 0.2,
    hlTo: { t: 128.02, color: "#f7b23b" },
    move: [{ t: 127.7, x: 0, e: "io" }, { t: 128.0, x: 22, e: "io" }, { t: 128.7, x: -26, e: "io" }, { t: 129.4, x: -10 }],
    fx: [{ k: "echo", keys: [{ t: 125.95, v: 11, e: "lin" }, { t: 127.95, v: 16 }], converge: 128.02 },
      { k: "glow", t0: 128.0, t1: 128.1, t2: 128.3, t3: 129.0, peak: 1 }, { k: "glow", t0: 128.0, t1: 128.4, peak: 0.6 },
      { k: "glow", t0: 128.0, t1: 128.04, t2: 128.06, t3: 128.45, peak: 0.45, burn: true },
      { k: "pulse", ts: [128.02], idx: [0, 1, 2], amp: 0.12 }],
    exit: "light", out: 129.35, dOut: 0.5, stagger: 0.04 },
  // 最后一句唱得轻、慢、字和字隔开；132.02 鼓回来、砖亮起来，字化成暖光
  { text: "在这反乌托邦里", x: 540, y: 380, size: 56, gap: 0.34, enter: "fade", dIn: 0.4, lead: 0.12, exit: "light", out: 132.02, dOut: 1.6 },
];

// ——— 运行时 ———
interface Line {
  i: number;
  tm: LyricTiming;
  L: Look;
  chars: string[];
  hot: boolean[];
  /** 字形按这句最大的字号画，小的时候缩着贴 */
  sprSize: number;
  font: "serif" | "hand";
  tIn: number;
  dIn: number;
  out: number;
  dOut: number;
  stagger: number;
  until: number;
  /** 排列：第一种是一开始的，后面每种到 t 换过去 */
  arrs: (Required<Omit<Arr, "rows">> & { rows: number; t: number; dur: number; via: "fly" | "fade" })[];
  rr: { ox: number; oy: number; or: number; a: number; b: number }[];
  shards: Shard[][];
  motes: Mote[][];
  snow: Mote[];
  crack: [number, number][][];
  ripples: number[];
}
/** 没唱的字有多淡 */
const UP_A = 0.44;

/** 一种排列下每个字的中心（设计坐标） */
function slots(a: { x: number; y: number; dir: "h" | "v"; size: number; gap: number; rows: number }, n: number): [number, number][] {
  const adv = a.size * (1 + a.gap);
  const per = Math.ceil(n / a.rows);
  return Array.from({ length: n }, (_, j) => {
    const r = Math.floor(j / per);
    const inRow = Math.min(per, n - r * per);
    const o = (j - r * per - (inRow - 1) / 2) * adv;
    const across = (r - (a.rows - 1) / 2) * a.size * 1.32;
    // 竖排几列时从右往左读
    return a.dir === "v" ? [a.x - across, a.y + o] : [a.x + o, a.y + across];
  });
}
function boxOf(a: Line["arrs"][number], n: number) {
  const ps = slots(a, n);
  const h = a.size * 0.62;
  return { x0: Math.min(...ps.map((p) => p[0])) - h, x1: Math.max(...ps.map((p) => p[0])) + h, y0: Math.min(...ps.map((p) => p[1])) - h, y1: Math.max(...ps.map((p) => p[1])) + h };
}
const overlaps = (a: ReturnType<typeof boxOf>, b: ReturnType<typeof boxOf>) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

function build(): Line[] {
  if (LOOK.length !== LYRICS.length) throw new Error(`歌词设计 ${LOOK.length} 句，时间 ${LYRICS.length} 句，对不上`);
  const base = LYRICS.map((tm, i) => {
    const L = LOOK[i];
    if (L.text !== tm.text) throw new Error(`第 ${i + 1} 句对不上：${L.text} / ${tm.text}`);
    const first = { x: L.x, y: L.y, dir: L.dir ?? "h", size: L.size ?? 62, gap: L.gap ?? 0.1, rows: L.rows ?? 1, t: -1, dur: 0, via: "fly" as "fly" | "fade" };
    const arrs = [first];
    for (const r of [...(L.re ?? [])].sort((a, b) => a.t - b.t)) {
      const prev = arrs[arrs.length - 1];
      arrs.push({ x: r.x ?? prev.x, y: r.y ?? prev.y, dir: r.dir ?? prev.dir, size: r.size ?? prev.size, gap: r.gap ?? prev.gap, rows: r.rows ?? prev.rows, t: r.t, dur: r.dur ?? 0.5, via: r.via ?? "fly" });
    }
    return { tm, L, arrs };
  });
  return base.map(({ tm, L, arrs }, i) => {
    const chars = [...tm.text];
    const n = chars.length;
    const hot = chars.map(() => false);
    for (const a of L.accent ?? []) {
      const j = tm.text.indexOf(a);
      if (j >= 0) for (let q = j; q < j + a.length; q++) hot[q] = true;
    }
    // 和上一句、下一句叠不叠在一起：叠就上一句先让开、这一句晚一点出来；不叠就早一点出来，两句可以同时在
    const prev = base[i - 1];
    const next = base[i + 1];
    const startBox = boxOf(arrs[0], n);
    const endBox = boxOf(arrs[arrs.length - 1], n);
    const withPrev = !!prev && overlaps(boxOf(prev.arrs[prev.arrs.length - 1], [...prev.tm.text].length), startBox);
    const withNext = !!next && overlaps(endBox, boxOf(next.arrs[0], [...next.tm.text].length));
    // 叠在一起时一先一后、不重叠：上一句在下一句开唱前 0.27 秒开始退（0.12 秒退完），这一句开唱前 0.14 秒才出来
    const lead = L.lead ?? (withPrev ? 0.14 : 0.4);
    const tIn = tm.t[0] - lead;
    const dIn = L.dIn ?? (withPrev ? 0.12 : Math.min(lead, 0.3));
    const nextT0 = next?.tm.t[0] ?? 999;
    const out = L.out ?? (withNext ? Math.max(tm.t[n - 1] + 0.1, nextT0 - 0.27) : Math.min(tm.end + 0.25, nextT0 + 0.2));
    const dOut = L.dOut ?? (withNext ? 0.12 : 0.35);
    const stagger = L.stagger ?? (withNext ? 0 : 0.03);
    const r = rnd(1000 + i * 37);
    const rr = chars.map(() => ({ ox: (r() - 0.5) * 460, oy: (r() - 0.5) * 300, or: (r() - 0.5) * 1.4, a: r(), b: r() }));
    const exit = L.exit ?? "fade";
    const particles = exit === "ash" || exit === "light" || exit === "dust";
    return {
      i, tm, L, chars, hot,
      sprSize: Math.max(...arrs.map((a) => a.size)),
      font: L.font ?? "serif",
      tIn, dIn, out, dOut, stagger,
      until: out + dOut + n * stagger + (particles ? 1.6 : 0.05),
      arrs,
      rr,
      shards: chars.map((_, j) => shards(500 + i * 31 + j)),
      motes: chars.map((_, j) => motes(900 + i * 41 + j, exit === "dust" ? 10 : 12, exit !== "dust")),
      snow: (L.fx ?? []).some((f) => f.k === "snow") ? motes(77 + i, 46, false) : [],
      crack: (L.fx ?? []).some((f) => f.k === "crack") ? crackPaths(i) : [],
      ripples: rippleTimes(L, tm),
    };
  });
}

/** 回响的每一圈什么时候发出来：密度跟着 echo 的 v 走（积分，v 变了以前的圈不跳） */
function rippleTimes(L: Look, tm: LyricTiming): number[] {
  const f = L.fx?.find((x) => x.k === "echo") as Extract<Fx, { k: "echo" }> | undefined;
  if (!f) return [];
  const out: number[] = [];
  let ph = 0.6;
  const t1 = (L.out ?? tm.end) + 0.2;
  for (let t = tm.t[0]; t < t1; t += 0.005) {
    const n = sampleKey(f.keys, t);
    ph += 0.005 * (n > 0.01 ? 0.8 + n * 0.42 : 0);
    if (ph >= 1) {
      ph -= 1;
      out.push(t);
    }
  }
  return out;
}

/** 裂纹：从一点往四周折着裂开的几条线（设计坐标，相对整句的中心） */
function crackPaths(seed: number): [number, number][][] {
  const r = rnd(4242 + seed);
  const out: [number, number][][] = [];
  const n = 9;
  for (let q = 0; q < n; q++) {
    let a = (q / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
    let x = 0;
    let y = 0;
    const pts: [number, number][] = [[0, 0]];
    const len = 140 + r() * 260;
    let d = 0;
    while (d < len) {
      const step = 18 + r() * 26;
      a += (r() - 0.5) * 0.7;
      x += Math.cos(a) * step;
      y += Math.sin(a) * step * 0.55;
      d += step;
      pts.push([x, y]);
    }
    out.push(pts);
  }
  return out;
}

interface CS {
  x: number;
  y: number;
  r: number;
  sx: number;
  sy: number;
  a: number;
  blur: number;
  glow: number;
  burn: number;
  rainbow: number;
  shard: number;
  broken: number;
  /** 卡拉 OK：唱到了没有（0–1）、正在唱的亮（0–1）、笔扫到哪（wipe，0–1） */
  sung: number;
  hl: number;
  wipe: number;
  /** 亮色换到 hlTo 的多少（0–1） */
  hlMix: number;
}

export function createScene({ width, height }: SceneOptions): Scene | Promise<Scene> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const buf = document.createElement("canvas");
  buf.width = width;
  buf.height = height;
  const bctx = buf.getContext("2d")!;
  const k = width / 1080;
  const base = new DOMMatrix([width / 1080, 0, 0, height / 1920, 0, 0]);
  const lines = build();

  const styleOf = (ln: Line): Pal => ln.L.pal ?? "day";

  /** 这一刻每个字在哪、多大（换排列时一个接一个飞过去，路上带一点弧） */
  function arrange(ln: Line, t: number) {
    const n = ln.chars.length;
    const gapFx = ln.L.fx?.find((f) => f.k === "gap") as Extract<Fx, { k: "gap" }> | undefined;
    const withGap = (a: Line["arrs"][number]) => (gapFx ? { ...a, gap: sampleKey(gapFx.keys, t, a.gap) } : a);
    let pos = slots(withGap(ln.arrs[0]), n);
    let size = pos.map(() => ln.arrs[0].size);
    let dir = ln.arrs[0].dir;
    const vis = pos.map(() => 1);
    for (let q = 1; q < ln.arrs.length; q++) {
      const a = ln.arrs[q];
      if (t < a.t) break;
      const tgt = slots(withGap(a), n);
      if (a.via === "fade") {
        // 原地淡出，一半时间到了换到新位置淡入
        pos = pos.map((p, j) => {
          const u = clamp01((t - a.t - j * 0.02) / a.dur);
          vis[j] *= u < 0.5 ? 1 - E.soft(u * 2) : E.soft(u * 2 - 1);
          return u < 0.5 ? p : tgt[j];
        });
        size = size.map((s, j) => (clamp01((t - a.t - j * 0.02) / a.dur) < 0.5 ? s : a.size));
      } else {
        pos = pos.map((p, j) => {
          const u = E.io(clamp01((t - a.t - j * 0.03) / a.dur));
          const dx = tgt[j][0] - p[0];
          const dy = tgt[j][1] - p[1];
          const len = Math.hypot(dx, dy) || 1;
          const arc = Math.sin(Math.PI * u) * Math.min(60, len * 0.15);
          return [p[0] + dx * u - (dy / len) * arc, p[1] + dy * u + (dx / len) * arc];
        });
        size = size.map((s, j) => s + (a.size - s) * E.io(clamp01((t - a.t - j * 0.03) / a.dur)));
      }
      dir = a.dir;
    }
    return { pos, size, dir, vis };
  }

  function charState(ln: Line, j: number, t: number, dir: "h" | "v"): CS | null {
    const L = ln.L;
    const n = ln.chars.length;
    const enter = L.enter ?? "rise";
    const sIn = enter === "drop" || enter === "gather" ? 0.035 : 0.02;
    const a = (t - (ln.tIn + j * sIn)) / ln.dIn;
    if (a < 0) return null;
    const s: CS = { x: 0, y: 0, r: 0, sx: 1, sy: 1, a: 1, blur: 0, glow: 0, burn: 0, rainbow: 0, shard: 0, broken: 0, sung: 0, hl: 0, wipe: 0, hlMix: L.hlTo ? clamp01((t - L.hlTo.t) / 0.25) : 0 };
    const u = clamp01(a);
    const rr = ln.rr[j];
    const size = ln.sprSize;
    switch (enter) {
      case "rise": {
        const e = E.out(u);
        s.y += 24 * (1 - e);
        s.a = clamp01(u * 1.7);
        s.sx = s.sy = 0.92 + 0.08 * e;
        break;
      }
      case "drop": {
        if (u < 0.7) {
          const v = u / 0.7;
          s.y -= (L.dropH ?? 90) * (1 - v * v);
          s.a = clamp01(v * 3);
          s.sy = 1 + 0.12 * (1 - v);
        } else {
          const w = (u - 0.7) / 0.3;
          s.sy = 1 - 0.14 * Math.sin(Math.PI * w);
          s.sx = 1 + 0.09 * Math.sin(Math.PI * w);
        }
        break;
      }
      case "fall": {
        const e = E.out(u);
        s.y -= 460 * (1 - e);
        s.sy = 1 + 1.1 * (1 - e) * (1 - e);
        s.sx = 1 - 0.15 * (1 - e);
        s.a = clamp01(u * 2.5);
        break;
      }
      case "streak": {
        const e = E.out(u);
        s.y += 360 * (1 - e);
        s.sy = 1 + 0.9 * (1 - e) * (1 - e);
        s.sx = 1 - 0.12 * (1 - e);
        s.a = clamp01(u * 2.5);
        break;
      }
      case "pop": {
        const c = 1.70158;
        const back = u >= 1 ? 1 : 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
        s.sx = s.sy = 1.4 - 0.4 * back;
        s.a = clamp01(u * 4);
        break;
      }
      case "fade":
        s.a = E.soft(u);
        s.y += 6 * (1 - E.out(u));
        break;
      case "gather": {
        const c = 1.4;
        const e = u >= 1 ? 1 : 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
        s.x += rr.ox * (1 - e);
        s.y += rr.oy * (1 - e);
        s.r += rr.or * (1 - e);
        s.a = clamp01(u * 2.2);
        break;
      }
    }
    // 卡拉 OK：这个字什么时候开始唱、唱到什么时候（最后一个字唱到声音落下去）
    const ti = ln.tm.t[j];
    const te = j + 1 < n ? ln.tm.t[j + 1] : ln.tm.end;
    s.sung = clamp01((t - ti) / 0.12);
    s.hl = clamp01((t - (ti - 0.03)) / 0.06) * (1 - clamp01((t - te) / 0.12));
    if ((L.kara ?? "pop") === "wipe") {
      s.wipe = clamp01((t - ti + 0.02) / Math.min(0.55, Math.max(0.2, te - ti)));
      const pop = 1 + 0.06 * s.hl;
      s.sx *= pop;
      s.sy *= pop;
    } else {
      // 正在唱的字放大一点、抬一点，刚唱到那一下多弹一下
      const pop = 1 + 0.13 * s.hl + 0.08 * bump(t - ti, 0.12);
      s.sx *= pop;
      s.sy *= pop;
      if (dir === "h") s.y -= size * 0.05 * s.hl;
      else s.x -= size * 0.04 * s.hl;
    }
    // 唱过的字往上飘
    if (L.floatV && t > ti) {
      const age = t - ti;
      s.y -= L.floatV * age;
      s.x += 4 * Math.sin(age * 1.4 + j * 1.7) * Math.min(1, age);
    }
    // 效果
    for (const f of L.fx ?? []) {
      switch (f.k) {
        case "jolt":
          if (!f.idx || f.idx.includes(j)) {
            const m = impulse(t - f.t, f.decay ?? 0.18);
            s.x += (f.dx ?? 0) * m;
            s.y += (f.dy ?? 0) * m;
          }
          break;
        case "pulse":
          if (f.idx.includes(j))
            for (const p of f.ts) {
              const b = bump(t - p, 0.16);
              s.sx *= 1 + (f.amp ?? 0.35) * b;
              s.sy *= 1 + (f.amp ?? 0.35) * b;
              s.glow = Math.max(s.glow, b);
            }
          break;
        case "glow":
          if (!f.idx || f.idx.includes(j)) {
            const up = clamp01((t - f.t0) / Math.max(0.01, f.t1 - f.t0));
            const down = f.t2 !== undefined && f.t3 !== undefined ? 1 - clamp01((t - f.t2) / Math.max(0.01, f.t3 - f.t2)) : 1;
            const v = (f.peak ?? 0.8) * E.soft(up) * down;
            if (f.burn) s.burn = Math.max(s.burn, v);
            else s.glow = Math.max(s.glow, v);
          }
          break;
        case "blur":
          if (!f.idx || f.idx.includes(j)) {
            const v = E.soft(clamp01((t - f.t0) / (f.t1 - f.t0)));
            s.blur += f.px * v;
            s.a *= 1 - (1 - (f.alpha ?? 0.55)) * v;
          }
          break;
        case "flicker":
          if (f.idx.includes(j) && t >= f.t0 && t <= f.t1) s.a *= 0.55 + 0.45 * Math.abs(Math.sin(t * 61 + j));
          break;
        case "wave":
          // 横排上下起伏，竖排左右摆
          if (dir === "v") s.x += f.amp * Math.sin(2 * Math.PI * f.f * t + j * 0.85);
          else s.y += f.amp * Math.sin(2 * Math.PI * f.f * t + j * 0.85);
          break;
        case "wander":
          if (t > f.t0) {
            const v = E.soft(clamp01((t - f.t0) / 0.6));
            s.x += f.amp * v * Math.sin(t * 1.9 + j * 2.1);
            s.y += f.amp * 0.8 * v * Math.sin(t * 1.4 + j * 3.3);
            s.r += 0.06 * v * Math.sin(t * 1.2 + j);
            s.blur += (f.blur ?? 0) * v;
          }
          break;
        case "rainbow": {
          const v = clamp01((t - f.t) / (f.dur ?? 1));
          if (t >= f.t && v < 1) s.rainbow = Math.sin(Math.PI * v) * (0.6 + 0.4 * Math.sin(v * 9 - j * 0.6));
          break;
        }
        case "cut":
          if (j < f.at && t >= f.t) {
            // 劈下来的上半截先往上一弹，再越飞越快（跟着妈妈飞走，镜头往下甩）
            const v = clamp01((t - f.t) / 0.55);
            const w = Math.pow(v, 1.6);
            s.y -= 1100 * w;
            s.x -= 70 * w;
            s.r -= 0.3 * w;
            s.a *= 1 - clamp01((v - 0.55) / 0.45);
          }
          break;
        case "split":
          if (t >= f.t0) {
            const v = E.io(clamp01((t - f.t0) / (f.t1 - f.t0)));
            s.y += (j < f.at ? f.dy1 : f.dy2) * v;
          }
          break;
        case "slip":
          if (j === f.idx && t >= f.t0) {
            const v = E.io(clamp01((t - f.t0) / (f.t1 - f.t0)));
            s.x += f.dx * v;
            s.y += f.dy * v;
            s.r += (f.r ?? 0) * v;
            s.a *= 1 - 0.35 * v;
          }
          break;
        case "crumble":
          if (f.idx.includes(j) && t >= f.t) s.shard = clamp01((t - f.t) / (f.dur ?? 0.9));
          break;
        case "crack":
          if (t >= f.t) s.broken = E.out(clamp01((t - f.t) / 0.12));
          break;
        case "hang": {
          const u = t - ln.tm.t[j];
          if (u > 0) {
            // 往下一坠、猛地被拽住弹一下，再收回到只低一点点（整句还是一条线）
            s.y += (f.drop ?? 20) * (1 - Math.exp(-u / 0.05)) * (0.25 + 0.75 * Math.exp(-u / 0.16) * Math.cos(u * 18));
            // 吊着荡：绕字的顶上转（中心跟着往旁边挪）
            const th = (f.sway ?? 0.06) * Math.sin(t * 2.3 + j * 0.8) * Math.min(1, u * 2.5);
            s.r += th;
            s.x -= Math.sin(th) * ln.sprSize * 0.5;
          }
          break;
        }
        case "fadeTo":
          if (f.idx.includes(j)) s.a *= 1 - (1 - f.v) * E.soft(clamp01((t - f.t0) / (f.t1 - f.t0)));
          break;
      }
    }
    // 退场
    const o = (t - (ln.out + j * ln.stagger)) / ln.dOut;
    if (o > 0) {
      const v = clamp01(o);
      switch (L.exit ?? "fade") {
        case "fade":
          s.a *= 1 - E.soft(v);
          s.y -= 18 * v;
          break;
        case "up":
          s.y -= 60 * E.in2(v);
          s.a *= 1 - v;
          break;
        case "ash":
        case "light":
          s.y -= (50 + 50 * rr.a) * E.in2(v) + 16 * v;
          s.x += 12 * Math.sin(v * 5 + j) * v;
          s.a *= 1 - E.soft(v);
          if (L.exit === "light") s.burn = Math.max(s.burn, 0.9 * Math.sin(Math.PI * Math.min(1, v * 1.4)));
          break;
        case "sink":
          s.y += 50 * E.in2(v);
          s.a *= 1 - v;
          break;
        case "dust":
          s.shard = Math.max(s.shard, v);
          break;
        case "left":
          s.x -= 520 * E.in2(v);
          s.sx *= 1 + 0.5 * v;
          s.a *= 1 - E.in2(v);
          break;
        case "yank":
          s.y += 220 * E.in2(v);
          s.sy *= 1 + 0.5 * v;
          s.a *= 1 - v;
          break;
        case "yankR":
          s.x += 340 * E.in2(v);
          s.r += 0.5 * v;
          s.a *= 1 - v;
          break;
        case "scatter":
          s.x += rr.ox * 0.7 * E.out(v);
          s.y += rr.oy * 0.7 * E.out(v);
          s.r += rr.or * v;
          s.a *= 1 - v;
          break;
      }
      if (o > 1 && (L.exit ?? "fade") !== "dust") s.a = 0;
    }
    s.a *= L.alpha ?? 1;
    return s;
  }

  /** 从左往右露出来（前沿一段渐隐，不切出硬边） */
  function drawRevealed(g: CanvasRenderingContext2D, img: HTMLCanvasElement, w: number, h: number, size: number, reveal: number) {
    if (reveal >= 1) {
      g.drawImage(img, -w / 2, -h / 2, w, h);
      return;
    }
    if (reveal <= 0) return;
    const x0 = -w / 2;
    const fw = size * 0.36;
    const edge = -size * 0.62 - fw + reveal * (size * 1.24 + fw * 2);
    const strips = 6;
    const a0 = g.globalAlpha;
    for (let q = -1; q < strips; q++) {
      const xa = q < 0 ? x0 : edge + (q / strips) * fw;
      const xb = edge + ((q + 1) / strips) * fw;
      if (xb <= xa) continue;
      g.save();
      g.beginPath();
      g.rect(xa, -h / 2, xb - xa, h);
      g.clip();
      g.globalAlpha = a0 * (q < 0 ? 1 : 1 - (q + 0.5) / strips);
      g.drawImage(img, -w / 2, -h / 2, w, h);
      g.restore();
    }
    g.globalAlpha = a0;
  }

  // 一个字贴上去（g 已经设成设计坐标）：没唱的淡、正在唱的亮、唱过的实
  function drawChar(g: CanvasRenderingContext2D, ln: Line, j: number, s: CS, px: number, py: number, rot: number, night: number, scale: number) {
    const ch = ln.chars[j];
    const pal = styleOf(ln);
    if (s.a <= 0.004) return;
    const size = ln.sprSize;
    g.save();
    g.translate(px, py);
    g.rotate(rot + s.r);
    g.scale(s.sx * scale, s.sy * scale);
    const glowSprite = () => sprite(ch, ln.font, size, "glow", false, k);
    // 暖光在字后面（正在唱的字也有一团）
    const glowA = Math.max(s.glow, s.hl * 0.5);
    if (glowA > 0.01 && s.shard <= 0) {
      const gl = glowSprite();
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = Math.min(1, glowA) * Math.min(1, s.a * 1.2) * 0.9;
      g.drawImage(gl.img, -gl.w / 2, -gl.h / 2, gl.w, gl.h);
      g.globalCompositeOperation = "source-over";
    }
    if (s.blur > 0.05) g.filter = `blur(${(s.blur * k).toFixed(2)}px)`;
    const layers: [Pal, number][] = pal === "day" && night > 0 ? [["day", 1 - night], ["night", night]] : [[pal, 1]];
    const wipe = (ln.L.kara ?? "pop") === "wipe";
    for (const [p, w] of layers) {
      if (w <= 0.004) continue;
      const sp = sprite(ch, ln.font, size, p, ln.hot[j], k);
      const A = s.a * w;
      if (s.shard > 0) {
        g.globalAlpha = A;
        drawShards(g, ln.shards[j], sp.img, sp.w, sp.h, size, s.shard);
        continue;
      }
      const hl = s.hl > 0.003 ? sprite(ch, ln.font, size, p, ln.hot[j], k, true) : null;
      const hl2 = s.hl > 0.003 && s.hlMix > 0 && ln.L.hlTo ? sprite(ch, ln.font, size, p, ln.hot[j], k, ln.L.hlTo.color) : null;
      const paint = (img: HTMLCanvasElement, alpha: number, reveal = 1) => {
        if (alpha <= 0.003) return;
        g.globalAlpha = alpha;
        if (s.broken > 0) drawBroken(g, ln.shards[j], img, sp.w, sp.h, size, s.broken);
        else drawRevealed(g, img, sp.w, sp.h, size, reveal);
      };
      if (wipe) {
        // 底下是淡的字，唱到时像笔写出来一样从左往右扫亮，唱完变实
        paint(sp.img, A * UP_A * (1 - s.wipe * 0.999));
        if (hl) paint(hl.img, A * s.hl * (1 - s.hlMix), s.wipe);
        if (hl2) paint(hl2.img, A * s.hl * s.hlMix, s.wipe);
        paint(sp.img, A * (1 - s.hl), s.wipe);
      } else {
        paint(sp.img, A * UP_A * (1 - s.sung));
        paint(sp.img, A * s.sung * (1 - s.hl));
        if (hl) paint(hl.img, A * s.hl * (1 - s.hlMix));
        if (hl2) paint(hl2.img, A * s.hl * s.hlMix);
      }
    }
    g.filter = "none";
    // 烧亮：字本身也被光吃掉（化成光、全片最强的光）
    if (s.burn > 0.01 && s.shard <= 0) {
      const gl = glowSprite();
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = Math.min(1, s.burn) * Math.min(1, s.a * 1.2) * 0.85;
      g.drawImage(gl.img, -gl.w / 2, -gl.h / 2, gl.w, gl.h);
      g.globalCompositeOperation = "source-over";
    }
    if (s.rainbow > 0.01) {
      const gl = glowSprite();
      g.globalCompositeOperation = "lighter";
      g.filter = `hue-rotate(${Math.round((px * 0.6 + py * 0.3) % 360)}deg) saturate(3)`;
      g.globalAlpha = s.rainbow * s.a * 0.6;
      g.drawImage(gl.img, -gl.w / 2, -gl.h / 2, gl.w, gl.h);
      g.filter = "none";
      g.globalCompositeOperation = "source-over";
    }
    g.restore();
  }

  /** 裂开的字：碎块各自错开一点、歪一点，留在原地 */
  function drawBroken(g: CanvasRenderingContext2D, sh: Shard[], img: HTMLCanvasElement, w: number, h: number, size: number, u: number) {
    const S = size * 1.5;
    for (const p of sh) {
      g.save();
      g.translate(p.cx * S + p.vx * size * 0.035 * u, p.cy * S + (p.vy * 0.03 + 0.02) * size * u);
      g.rotate(p.vr * 0.012 * u);
      g.translate(-p.cx * S, -p.cy * S);
      g.beginPath();
      g.moveTo(p.pts[0][0] * S, p.pts[0][1] * S);
      g.lineTo(p.pts[1][0] * S, p.pts[1][1] * S);
      g.lineTo(p.pts[2][0] * S, p.pts[2][1] * S);
      g.closePath();
      g.clip();
      g.drawImage(img, -w / 2, -h / 2, w, h);
      g.restore();
    }
  }

  function drawShards(g: CanvasRenderingContext2D, sh: Shard[], img: HTMLCanvasElement, w: number, h: number, size: number, u: number) {
    const a0 = g.globalAlpha;
    const S = size * 1.5;
    for (const p of sh) {
      g.save();
      g.translate(p.cx * S + p.vx * size * u, p.cy * S + p.vy * size * u + 170 * u * u);
      g.rotate(p.vr * u);
      g.translate(-p.cx * S, -p.cy * S);
      g.beginPath();
      g.moveTo(p.pts[0][0] * S, p.pts[0][1] * S);
      g.lineTo(p.pts[1][0] * S, p.pts[1][1] * S);
      g.lineTo(p.pts[2][0] * S, p.pts[2][1] * S);
      g.closePath();
      g.clip();
      g.globalAlpha = a0 * Math.pow(1 - u, 1.6);
      g.drawImage(img, -w / 2, -h / 2, w, h);
      g.restore();
    }
    g.globalAlpha = a0;
  }

  function drawLine(g: CanvasRenderingContext2D, ln: Line, t: number) {
    const L = ln.L;
    const [mx, my] = sampleKey2(L.move, t);
    let ox = mx;
    let oy = my;
    for (const f of L.fx ?? []) {
      if (f.k === "shake") {
        const [sx, sy] = shakeAt(t, f.t, f.amp, f.decay ?? 0.25, f.t1);
        ox += sx;
        oy += sy;
      }
    }
    if (L.quake) {
      const [qx, qy] = shake(t, L.quake(t));
      ox += qx;
      oy += qy;
    }
    const spin = L.spin ? L.spin(t) : 0;
    const rot = sampleKey(L.rot, t) + spin;
    const night = sampleKey(L.night, t);
    const { pos: slot, size, dir, vis } = arrange(ln, t);
    // 整句的中心（转的时候绕它转）
    const cx = slot.reduce((a, p) => a + p[0], 0) / slot.length + ox;
    const cy = slot.reduce((a, p) => a + p[1], 0) / slot.length + oy;
    const states = ln.chars.map((_, j) => {
      const s = charState(ln, j, t, dir);
      if (s) s.a *= vis[j];
      return s;
    });
    // 先绕整句中心转（rot 里不跟画面转的那部分），再整个绕画面中心转 spin（跟着镜头）
    const own = rot - spin;
    const oc = Math.cos(own);
    const os = Math.sin(own);
    const pc = Math.cos(spin);
    const ps = Math.sin(spin);
    const place = (x: number, y: number): [number, number] => {
      const lx = cx + (x - cx) * oc - (y - cy) * os;
      const ly = cy + (x - cx) * os + (y - cy) * oc;
      return spin ? [540 + (lx - 540) * pc - (ly - 960) * ps, 960 + (lx - 540) * ps + (ly - 960) * pc] : [lx, ly];
    };
    const lay = slot.map(([x, y]) => place(x + ox, y + oy));
    const pos = slot.map(([x, y], j): [number, number] => {
      const s = states[j];
      return place(x + ox + (s?.x ?? 0), y + oy + (s?.y ?? 0));
    });
    const crack = L.fx?.find((f) => f.k === "crack") as Extract<Fx, { k: "crack" }> | undefined;
    const cracked = crack && t >= crack.t;
    // 裂开的句子先画进暂存画布，裂纹只画在字上
    const tg = cracked ? bctx : g;
    if (cracked) {
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.clearRect(0, 0, width, height);
      bctx.setTransform(base);
    }
    // 后面的东西：回响、窗光
    for (const f of L.fx ?? []) {
      if (f.k === "echo") drawEcho(tg, ln, f, t, states, pos, cx, cy, size);
      if (f.k === "windows") drawWindows(tg, ln, f, t, states, pos);
    }
    for (let j = 0; j < ln.chars.length; j++) {
      const s = states[j];
      if (s) drawChar(tg, ln, j, s, pos[j][0], pos[j][1], rot, night, size[j] / ln.sprSize);
    }
    if (cracked) {
      drawCracks(bctx, ln, crack!, t, cx, cy);
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(buf, 0, 0);
      g.restore();
      g.setTransform(base);
    }
    // 前面的东西：红绳、网、刀光、灰
    for (const f of L.fx ?? []) {
      if (f.k === "thread") drawThread(g, ln, f, t, pos, size);
      if (f.k === "net") drawNet(g, ln, f, t, states, pos, size);
      if (f.k === "cut") drawCut(g, f, t, lay);
      if (f.k === "snow") drawSnow(g, ln, f, t, cx, cy);
    }
    drawExitMotes(g, ln, t, lay, size);
  }

  function drawEcho(g: CanvasRenderingContext2D, ln: Line, f: Extract<Fx, { k: "echo" }>, t: number, states: (CS | null)[], pos: [number, number][], ox: number, oy: number, size: number[]) {
    const conv = f.converge !== undefined ? E.io(clamp01((t - f.converge + 0.3) / 0.3)) : 0;
    const LIFE = 1.7;
    g.save();
    for (const t0 of ln.ripples) {
      const age = t - t0;
      if (age < 0 || age > LIFE) continue;
      const v = age / LIFE;
      // 一圈暖光的字从字上往外扩开、淡掉；收拢时倒回字里
      const sc = 1 + 0.5 * E.out(v) * (1 - conv);
      const a = 0.3 * Math.pow(1 - v, 1.6) * Math.min(1, age * 10) * (1 - conv * 0.7);
      if (a <= 0.004) continue;
      for (let j = 0; j < ln.chars.length; j++) {
        const s = states[j];
        if (!s || s.a <= 0.01) continue;
        const gl = sprite(ln.chars[j], ln.font, ln.sprSize, "glow", false, k);
        const z = (size[j] / ln.sprSize) * sc;
        g.save();
        g.translate(ox + (pos[j][0] - ox) * sc, oy + (pos[j][1] - oy) * sc - 10 * v);
        g.scale(s.sx * z, s.sy * z);
        // 回响只跟着唱到的字
        g.globalAlpha = a * Math.min(1, s.a) * Math.max(s.sung, s.wipe) ** 2;
        g.drawImage(gl.img, -gl.w / 2, -gl.h / 2, gl.w, gl.h);
        g.restore();
      }
    }
    g.restore();
  }

  function drawWindows(g: CanvasRenderingContext2D, ln: Line, f: Extract<Fx, { k: "windows" }>, t: number, states: (CS | null)[], pos: [number, number][]) {
    const order = [4, 1, 7, 2, 6, 0, 8, 3, 5];
    for (let j = 0; j < ln.chars.length; j++) {
      const s = states[j];
      if (!s) continue;
      const off = f.ts[order.indexOf(j)] ?? 999;
      const on = 1 - clamp01((t - off) / 0.08);
      if (on <= 0) continue;
      const [x, y] = pos[j];
      const w = ln.sprSize * 0.95;
      const gr = g.createRadialGradient(x, y, 2, x, y, w);
      gr.addColorStop(0, `rgba(255,214,140,${0.55 * on * s.a})`);
      gr.addColorStop(1, "rgba(255,214,140,0)");
      g.fillStyle = gr;
      g.fillRect(x - w, y - w, w * 2, w * 2);
    }
  }

  function drawThread(g: CanvasRenderingContext2D, ln: Line, f: Extract<Fx, { k: "thread" }>, t: number, pos: [number, number][], size: number[]) {
    if (t < f.t0) return;
    // 红绳从字底下绕过去（一圈一圈的弯），「么」一拉勒紧：弯拉直，右头打个结
    const p = clamp01((t - f.t0) / (f.t1 - f.t0));
    const tight = E.io(clamp01((t - f.tight) / 0.16));
    const n = pos.length;
    const sz = size[0];
    const y0 = sz * 0.62;
    const x0 = pos[0][0] - sz * 0.7;
    const x1 = pos[n - 1][0] + sz * 0.7;
    const xEnd = x0 + (x1 - x0) * p;
    const [sx, sy] = shakeAt(t, f.tight, 2.5, 0.2);
    const yAt = (x: number) => {
      const u = (x - x0) / (x1 - x0);
      const yl = pos[0][1] + (pos[n - 1][1] - pos[0][1]) * u;
      return yl + y0 + Math.sin(u * Math.PI * n) * sz * 0.2 * (1 - tight) + Math.sin(u * Math.PI) * sz * 0.12 * (1 - tight);
    };
    const a = 1 - clamp01((t - ln.out) / ln.dOut);
    g.save();
    g.globalAlpha = a;
    g.lineCap = "round";
    g.lineJoin = "round";
    for (const [w, c] of [[6.5, "rgba(90,20,22,0.5)"], [3.6, "#cf3b30"]] as [number, string][]) {
      g.lineWidth = w;
      g.strokeStyle = c;
      g.beginPath();
      for (let x = x0; x <= xEnd; x += 6) {
        if (x === x0) g.moveTo(x + sx, yAt(x) + sy);
        else g.lineTo(x + sx, yAt(x) + sy);
      }
      g.stroke();
    }
    if (tight > 0.5) {
      // 结
      const kx = x1 + sx;
      const ky = yAt(x1) + sy;
      g.fillStyle = "#cf3b30";
      g.strokeStyle = "rgba(90,20,22,0.6)";
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(kx, ky, 9, 7, 0.3, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.beginPath();
      g.moveTo(kx + 4, ky + 3);
      g.quadraticCurveTo(kx + 16, ky + 14, kx + 12, ky + 26);
      g.moveTo(kx + 2, ky + 5);
      g.quadraticCurveTo(kx + 4, ky + 18, kx - 4, ky + 28);
      g.lineWidth = 3.4;
      g.strokeStyle = "#cf3b30";
      g.stroke();
    }
    g.restore();
  }

  function drawNet(g: CanvasRenderingContext2D, ln: Line, f: Extract<Fx, { k: "net" }>, t: number, states: (CS | null)[], pos: [number, number][], size: number[]) {
    if (t < f.t0) return;
    const a = 1 - clamp01((t - ln.out) / ln.dOut);
    g.save();
    g.lineCap = "round";
    for (let j = 0; j < pos.length; j++) {
      if (!states[j]) continue;
      const r = rnd(808 + ln.i * 64 + j);
      const age = t - f.t0 - j * 0.04;
      if (age < 0) continue;
      const p = E.out(clamp01(age / 0.45));
      const [x, y] = pos[j];
      // 每个字上下各一根红绳，拴向画面外面（和画面里天上那张红绳网连成一片）
      for (let q = 0; q < 2; q++) {
        const ax = x + (r() - 0.5) * 900;
        const ay = y + (q ? 1 : -1) * (500 + r() * 700);
        const tx = x + (ax - x) * p;
        const ty = y + (ay - y) * p;
        const vib = Math.sin(t * 40 + j + q) * 1.2 * Math.exp(-age * 2);
        g.strokeStyle = `rgba(196,40,36,${0.75 * a})`;
        g.lineWidth = 2.2;
        g.beginPath();
        g.moveTo(x, y + (q ? 1 : -1) * size[j] * 0.66);
        g.lineTo(tx + vib, ty);
        g.stroke();
      }
    }
    g.restore();
  }

  function drawCut(g: CanvasRenderingContext2D, f: Extract<Fx, { k: "cut" }>, t: number, lay: [number, number][]) {
    const u = t - f.t;
    if (u < 0 || u > 0.5) return;
    const cx = (lay[f.at - 1][0] + lay[f.at][0]) / 2;
    const cy = (lay[f.at - 1][1] + lay[f.at][1]) / 2;
    const ang = f.angle ?? -0.5;
    const len = 300;
    const p = clamp01(u / 0.07);
    const a = 1 - clamp01((u - 0.08) / 0.4);
    g.save();
    g.translate(cx, cy);
    g.rotate(ang);
    g.globalCompositeOperation = "lighter";
    g.strokeStyle = `rgba(255,236,200,${a})`;
    g.shadowColor = "rgba(255,200,140,0.9)";
    g.shadowBlur = 18 * k;
    g.lineWidth = 5;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(-len / 2, 0);
    g.lineTo(-len / 2 + len * p, 0);
    g.stroke();
    g.restore();
  }

  function drawCracks(g: CanvasRenderingContext2D, ln: Line, f: Extract<Fx, { k: "crack" }>, t: number, cx: number, cy: number) {
    const p = E.out(clamp01((t - f.t) / 0.14));
    g.save();
    g.globalCompositeOperation = "source-atop";
    g.translate(cx + (f.ox ?? 0), cy + (f.oy ?? 0));
    g.lineJoin = "round";
    for (const [w, c, dy] of [[5.5, "rgba(26,14,18,0.95)", 0], [2, "rgba(255,240,220,0.8)", 2.6]] as [number, string, number][]) {
      g.strokeStyle = c;
      g.lineWidth = w;
      for (const path of ln.crack) {
        const m = Math.max(2, Math.ceil(path.length * p));
        g.beginPath();
        path.slice(0, m).forEach(([x, y], q) => (q ? g.lineTo(x, y + dy) : g.moveTo(x, y + dy)));
        g.stroke();
      }
    }
    g.restore();
  }

  function drawSnow(g: CanvasRenderingContext2D, ln: Line, f: Extract<Fx, { k: "snow" }>, t: number, cx: number, cy: number) {
    if (t < f.t0 || t > f.t1) return;
    const fade = clamp01((t - f.t0) / 0.6) * clamp01((f.t1 - t) / 0.6);
    g.save();
    for (const m of ln.snow) {
      const life = 3.2 + m.life * 2;
      const age = (t - f.t0 + m.ph) % life;
      const x = cx + m.ox * 1100 + Math.sin(age * 1.3 + m.ph) * 18;
      const y = cy - 420 + m.oy * 300 + age * (40 + m.vy * 0.5);
      const a = Math.sin(Math.PI * (age / life)) * fade * 0.75;
      g.fillStyle = `rgba(222,212,226,${a})`;
      g.beginPath();
      g.arc(x, y, m.r * 0.9, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  function drawExitMotes(g: CanvasRenderingContext2D, ln: Line, t: number, lay: [number, number][], size: number[]) {
    const exit = ln.L.exit ?? "fade";
    const crumble = ln.L.fx?.find((f) => f.k === "crumble") as Extract<Fx, { k: "crumble" }> | undefined;
    if (exit !== "ash" && exit !== "light" && exit !== "dust" && !crumble) return;
    g.save();
    if (exit === "light") g.globalCompositeOperation = "lighter";
    for (let j = 0; j < ln.chars.length; j++) {
      const t0 = crumble && crumble.idx.includes(j) ? crumble.t : exit === "ash" || exit === "light" || exit === "dust" ? ln.out + j * ln.stagger : 999;
      const age = t - t0;
      if (age < 0) continue;
      const [x0, y0] = lay[j];
      const dust = exit === "dust" || (crumble && crumble.idx.includes(j));
      for (const m of ln.motes[j]) {
        if (age > m.life) continue;
        const v = age / m.life;
        const x = x0 + m.ox * size[j] + m.vx * age + Math.sin(age * 3 + m.ph) * 6;
        const y = y0 + m.oy * size[j] + (dust ? Math.abs(m.vy) * age * 0.7 + 120 * age * age : m.vy * age);
        const a = (1 - v) * Math.min(1, age * 8);
        g.fillStyle = exit === "light" ? `rgba(255,232,190,${a * 0.9})` : dust ? `rgba(74,52,50,${a * 0.8})` : `rgba(214,204,220,${a * 0.85})`;
        g.beginPath();
        g.arc(x, y, m.r * (exit === "light" ? 1.3 : 1), 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
  }

  return (async () => {
    await loadLyricFonts();
    // 把要用的字先画好（分几次，不占住页面）
    let n = 0;
    for (const ln of lines) {
      const pal = styleOf(ln);
      for (let j = 0; j < ln.chars.length; j++) {
        for (const hl of [false, true]) {
          sprite(ln.chars[j], ln.font, ln.sprSize, pal, ln.hot[j], k, hl);
          if (ln.L.night) sprite(ln.chars[j], ln.font, ln.sprSize, "night", ln.hot[j], k, hl);
          if (hl && ln.L.hlTo) sprite(ln.chars[j], ln.font, ln.sprSize, pal, ln.hot[j], k, ln.L.hlTo.color);
          if (++n % 8 === 0) await nextTask();
        }
      }
    }
    return {
      canvas,
      render(t: number) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.setTransform(base);
        for (const ln of lines) {
          if (t < ln.tIn - 0.02 || t > ln.until) continue;
          drawLine(ctx, ln, t);
          ctx.setTransform(base);
        }
      },
      dispose() {
        canvas.width = canvas.height = 1;
        buf.width = buf.height = 1;
      },
    } satisfies Scene;
  })();
}
