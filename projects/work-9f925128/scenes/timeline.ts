// 小节和事件时间（作品时间，秒）：画面和 audio.json 的音效 start 都照它对齐。
// 歌剪过两刀，都是整 8 小节，节拍网格不变（project.ts 的 tempo 一个就够）：
//   作品 0–15.20 = 歌曲 0–15.20（第一遍副歌）；15.20–30.34 = 歌曲 − 15.41（主歌）；30.34– = 歌曲 − 30.82（最后一遍副歌）。
import { barAt, beatAt } from "@frame/engine/tempo";

/** where the music jumps (work time) and by how much (song time − work time after it) */
export const CUT1 = 15.2;
export const CUT2 = 30.3395;
export const JUMP1 = 15.4105;
export const JUMP2 = 30.821;
/** song time at work time t (lyrics follow the song) */
export const songTime = (t: number) => (t < CUT1 ? t : t < CUT2 ? t + JUMP1 : t + JUMP2);

/** Story events, work time in seconds. Read while drawing (the tempo comes from project.ts). */
export const EV = {
  /** 1 手机特写：钩子字首帧完整出现 */
  get s1() {
    return 0;
  },
  /** the double tap: two taps a sixteenth-ish apart (the sound's taps are 0.14 s apart), the heart on beat 1 */
  get tap1() {
    return beatAt(1) - 0.14;
  },
  get tap2() {
    return beatAt(1);
  },
  /** the whip up toward his face starts half a beat before the cut */
  get whip() {
    return beatAt(3.5);
  },
  /** 2 他的脸 — the cut lands on "eyes" */
  get s2() {
    return barAt(1);
  },
};

/** The plan, for the storyboard placeholders of shots not built yet (work time). */
export const SHOTS: { n: number; at: number; title: string; detail: string }[] = [
  { n: 1, at: 0, title: "手滑点赞", detail: "她三年前的照片，双击，爱心炸开" },
  { n: 2, at: 1.94, title: "他的脸", detail: "甩镜到他：屏幕光、瞪大眼睛、手腕上的红绳" },
  { n: 3, at: 3.24, title: "取消赞", detail: "疯狂点掉，1 → 赞" },
  { n: 4, at: 5.8, title: "配文展开", detail: "「如果他点赞，我就去表白。」" },
  { n: 5, at: 7.7, title: "回忆 · 毕业那天", detail: "他在课桌下刷到这条，0 赞，抬头" },
  { n: 6, at: 10.8, title: "回忆 · 走廊", detail: "她和篮球队的男生；他发了一条「算了。」" },
  { n: 7, at: 14.92, title: "她现在", detail: "往上划过三年：她和男朋友" },
  { n: 8, at: 19.9, title: "对方正在输入…", detail: "停在 2023 年的聊天跳到最上面" },
  { n: 9, at: 23.4, title: "放大倒影", detail: "红绳 → 窗玻璃里 17 岁的他" },
  { n: 10, at: 27.5, title: "黑屏", detail: "黑屏里现在的他和倒影重叠" },
  { n: 11, at: 30.34, title: "她的那一晚", detail: "一遍遍刷新他的主页" },
  { n: 12, at: 34.1, title: "天亮", detail: "赞一直是 0" },
  { n: 13, at: 38.0, title: "我等过你", detail: "打了又删" },
  { n: 14, at: 41.6, title: "仅自己可见", detail: "照片从他的屏幕上消失" },
  { n: 15, at: 44.5, title: "算了。", detail: "她赞了他三年前的「算了。」；结尾引导" },
];
export const END = 46.5;
