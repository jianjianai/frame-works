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
  /** the camera rushes down from the heart to her caption (用户：看简介的镜头放到两秒之内开始) */
  get rush() {
    return beatAt(2);
  },
  /** 2 配文 — the rush lands on the caption (on "socials") and the thumb taps 「…展开」 */
  get s2() {
    return beatAt(2.5);
  },
  get tapMore() {
    return beatAt(2.5);
  },
  /** the highlighter sweeps under 「如果他点赞，我就去表白。」 (on "my eyes") */
  get hl() {
    return beatAt(3.5);
  },
  /** the whip up toward his face starts half a beat before the cut */
  get whip() {
    return beatAt(5.5);
  },
  /** 3 他的脸 — the cut lands on "numb" */
  get s3() {
    return beatAt(6);
  },
  /** the whip settles on his face */
  get s3land() {
    return beatAt(6.5);
  },
  /** it sinks in: 「!!」, the head jerks back */
  get s3hit() {
    return beatAt(7);
  },
  /** a bead of sweat runs down */
  get s3sweat() {
    return beatAt(7.5);
  },
  /** his eyes drop to the phone and the camera whips down after them */
  get whip2() {
    return beatAt(8.25);
  },
  /** 4 取消赞 — on "even know" */
  get s4() {
    return beatAt(8.75);
  },
  get s4land() {
    return beatAt(9.25);
  },
  /** three frantic taps on the like button, eighth notes apart: unlike, like again (oops), unlike */
  get tapA() {
    return beatAt(9.5);
  },
  get tapB() {
    return beatAt(10);
  },
  get tapC() {
    return beatAt(10.5);
  },
  /** 4b his face: phew… */
  get s4face() {
    return beatAt(11);
  },
  /** …then his eyes drift back to the phone, worried (on "need") */
  get s4dread() {
    return beatAt(12);
  },
  /** 4c the caption again, the camera pushing in toward the memory (on "your heart") */
  get s4cap() {
    return beatAt(13);
  },
  /** the old-screen cut into the memory (centred on the bar line) */
  get cut5a() {
    return beatAt(15.5);
  },
  /** 5 回忆 · 毕业那天 */
  get s5() {
    return barAt(4);
  },
  get cut5b() {
    return beatAt(16.5);
  },
  /** he double-taps her post as the pull-back settles, the second tap on the first heartbeat (heartFast at 8.60):
   *  three years ago he did like it */
  get likeThen1() {
    return 8.46;
  },
  get likeThen2() {
    return 8.6;
  },
  /** the pull-back from the caption to his eyes' view of the classroom ends */
  get s5pull() {
    return beatAt(18.5);
  },
  /** 5b his face, three years younger */
  get s5b() {
    return beatAt(19);
  },
  /** two heartbeats (lub-dub) */
  get hb1() {
    return beatAt(19.5);
  },
  get hb2() {
    return beatAt(19.5) + 0.14;
  },
  /** he bites his lip */
  get bite() {
    return beatAt(19.75) + 0.1;
  },
  /** his eyes go up, to the corridor */
  get s5look() {
    return beatAt(20.5);
  },
  /** the camera whips after his look */
  get whip5() {
    return beatAt(21.5);
  },
  /** 6 回忆 · 走廊 — on "Because I cannot date you" */
  get s6() {
    return beatAt(22.5);
  },
  get s6land() {
    return beatAt(23);
  },
  /** her phone pings (his like), she squeals and shows the basketball player, who laughs and pats her head — from
   *  where he sits it looks like the two of them laughing at him */
  get herPing() {
    return beatAt(23.5);
  },
  get herSqueal() {
    return beatAt(24);
  },
  get herShow() {
    return beatAt(24.5);
  },
  get guyPat() {
    return beatAt(25);
  },
  /** his eyes drop to the phone: the corridor goes soft (and that is when she looks back at the door) */
  get s6down() {
    return beatAt(26.5);
  },
  get s6glance() {
    return beatAt(27);
  },
  /** he takes the like back — the moment she turns round to look for him */
  get unlikeThen() {
    return beatAt(27);
  },
  /** back out of her post */
  get s6back() {
    return beatAt(27.5);
  },
  /** he types 「算了。」 */
  get s6type() {
    return beatAt(28.125);
  },
  /** 发布 */
  get s6post() {
    return beatAt(29);
  },
  /** the phone goes face down into the desk */
  get s6drawer() {
    return beatAt(30);
  },
  /** black, on the hit before the stop */
  get s6black() {
    return beatAt(31);
  },
  /** 7 现在 — the screen glows up again on the verse's first downbeat */
  get s7() {
    return beatAt(32);
  },
  /** back out to her profile */
  get s7back() {
    return beatAt(33);
  },
  /** the flick up through three years */
  get s7flick() {
    return beatAt(34);
  },
  get s7stop() {
    return beatAt(36.5);
  },
  /** he taps the newest */
  get s7tap() {
    return beatAt(37);
  },
  /** it opens on "Kissing someone else" */
  get s7open() {
    return 18.279;
  },
  /** 8 a message notification drops in: 小满 is writing to him */
  get s8() {
    return beatAt(41);
  },
  /** he taps it: their chat, last touched three years ago */
  get s8tap() {
    return beatAt(42);
  },
  /** 「对方正在输入…」 and her three dots */
  get s8typing() {
    return beatAt(43);
  },
  /** 8b his face */
  get s8face() {
    return beatAt(45);
  },
  /** …a thought: his eyes narrow and drop back to the phone */
  get s8think() {
    return beatAt(47);
  },
  /** 9 反转 — the picture turns over like a mirror (on "To look into the mirror"): her, awake too */
  get s9() {
    return barAt(12);
  },
  get s9her() {
    return beatAt(48.5);
  },
  /** her screen: 「我等过你」 typed to him, one character a sixteenth (on "mirror") */
  get s9screen() {
    return beatAt(51);
  },
  /** her thumb comes to rest over 发送 — and doesn't press */
  get s9hover() {
    return beatAt(53);
  },
  /** she deletes it, a character every half beat, the last on "reflective" */
  get s9del() {
    return beatAt(56);
  },
  /** 10 she locks the phone: her lock screen (her and her boyfriend, his like still on it) */
  get s10() {
    return beatAt(58.75);
  },
  /** the screen goes dark: her face in the black glass */
  get s10dark() {
    return beatAt(61);
  },
  /** the old-screen cut into her memory, ending as the last chorus comes in */
  get cut11a() {
    return beatAt(62);
  },
  /** 11 她的回忆 · 走廊 (act 3): her face at seventeen where her reflection was, then the camera pulls back */
  get s11() {
    return CUT2;
  },
  get s11pull() {
    return barAt(16);
  },
  /** her phone: 「阿屿 赞了你的作品」 drops in (on "socials") */
  get s11ping() {
    return beatAt(64.5);
  },
  /** she squeals */
  get s11squeal() {
    return beatAt(66);
  },
  /** she shows her friend, who laughs 「快去！」 and pats her head */
  get s11show() {
    return beatAt(66.5);
  },
  /** she turns to look for him at the classroom door, smiling */
  get s11look() {
    return beatAt(67.5);
  },
  /** back to her phone: the like is gone */
  get s11gone() {
    return beatAt(68.5);
  },
  /** her smile goes */
  get s11fade() {
    return beatAt(69.5);
  },
  /** 12 她的回忆 · 那一晚: 「你看到了吗？」 sent (on "You don't even know") */
  get s12() {
    return beatAt(70.75);
  },
  /** his new post drops in: 「算了。」 */
  get s12post() {
    return beatAt(72.5);
  },
  /** she opens it */
  get s12open() {
    return beatAt(73.25);
  },
  /** her face at seventeen, at night */
  get s12face() {
    return beatAt(74.5);
  },
  /** the night goes by: the window turns blue, she is still holding the phone */
  get s12dawn() {
    return beatAt(76.25);
  },
  /** 13 现在: her, tonight, picks the phone up again (on "I'll see all your reposts") */
  get s13() {
    return beatAt(78.75);
  },
  /** her own post on her screen; she taps 「…」 */
  get s13post() {
    return beatAt(80);
  },
  get s13more() {
    return beatAt(80.75);
  },
  /** her thumb rests on 删除… */
  get s13delete() {
    return beatAt(81.75);
  },
  /** …and slides down to 设为仅自己可见 */
  get s13slide() {
    return beatAt(83.5);
  },
  get s13private() {
    return beatAt(84.5);
  },
  /** 14 his side: her post goes private (on "Because I cannot date you") */
  get s14() {
    return beatAt(86.25);
  },
  get s14gone() {
    return beatAt(87.25);
  },
  get s14face() {
    return beatAt(88.75);
  },
  /** 15 「小满 赞了你的作品」 */
  get s15() {
    return beatAt(92.25);
  },
  /** he taps it: his 「算了。」 from three years ago, liked */
  get s15open() {
    return beatAt(93.25);
  },
  /** the end card */
  get s15card() {
    return beatAt(94.75);
  },
};

/** The plan, for the storyboard placeholders of shots not built yet (work time). */
export const SHOTS: { n: number; at: number; title: string; detail: string }[] = [
  { n: 1, at: 0, title: "手滑点赞", detail: "她三年前的照片，双击，爱心炸开" },
  { n: 2, at: 1.21, title: "配文", detail: "「如果他点赞，我就去表白。」" },
  { n: 3, at: 2.9, title: "他的脸", detail: "惊讶：瞪大眼睛、「!!」、冷汗" },
  { n: 4, at: 4.22, title: "取消赞", detail: "疯狂点掉，1 → 赞；松口气，再看配文" },
  { n: 5, at: 7.7, title: "回忆 · 毕业那天", detail: "他点了赞，抬头看她" },
  { n: 6, at: 10.84, title: "回忆 · 走廊", detail: "她和篮球队的男生笑成一团；他取消了赞，发了「算了。」" },
  { n: 7, at: 15.2, title: "她现在", detail: "往上划过三年：她和男朋友" },
  { n: 8, at: 19.75, title: "对方正在输入…", detail: "停在 2023 年的聊天跳到最上面" },
  { n: 9, at: 23.13, title: "她也醒着", detail: "打了「我等过你」又删掉" },
  { n: 10, at: 28.3, title: "锁屏", detail: "她和男朋友；黑屏里她的脸" },
  { n: 11, at: 30.34, title: "她的回忆 · 走廊", detail: "他的赞来了又没了" },
  { n: 12, at: 34.08, title: "她的那一晚", detail: "「你看到了吗？」；「算了。」；天亮" },
  { n: 13, at: 37.93, title: "仅自己可见", detail: "拇指停在删除，移到仅自己可见" },
  { n: 14, at: 41.55, title: "作品已设为私密", detail: "他那边，照片没了" },
  { n: 15, at: 44.44, title: "算了。", detail: "她赞了他三年前的「算了。」；结尾引导" },
];
/** the song stops dead at ≈46.2; the end card holds a moment longer so it can be read */
export const END = 46.9;
