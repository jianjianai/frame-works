import { beatAt } from "./draw";

/** Bar n starts at beat 4n (work time = song time − 16.332). Song as cut for this work:
 *  verse 1 = bars 0–7, chorus 1 = 8–15, verse 2 = 16–23, then (CUT) the last loop of the outro, which keeps
 *  the same grid: work bars 24–27 = song bars 36–39 (the song fades out by END). Chorus 2 is skipped. */
export const BAR = (n: number) => beatAt(n * 4);
/** where verse 2 jumps to the outro (work time; 11 ms before the bar-24 downbeat) */
export const CUT = 49.123;
export const END = 57.0;

/** Story events shared by the pictures and the sound effects (work time, seconds).
 *  《unhappy》· 同一段聊天两个视角：他以为她只回「嗯」是不喜欢他，其实她每个「嗯」后面都删掉了一整段话。
 *
 *  卡点 (rhythm pass): every hard cut and every moment that makes a sound sits on the eighth-note grid —
 *  beatAt(k) on the beat, beatAt(k + 0.5) on the "and" (one eighth = 0.256 s). The sound effects in audio.json start
 *  exactly at these times. Left off the grid on purpose: moments tied to a sung word (19.33 end of "pretty", the
 *  avert on "ugly"), the window pass-through into her room (twist, a continuous move) and slow camera/fade ramps. */
export const EV = {
  // act 1 — his side
  typing1: [beatAt(0.5), beatAt(1.5)] as const, // 0.33–0.84 「对方正在输入...」 #1
  typing2: [beatAt(2), beatAt(3)] as const, // 1.10–1.61 #2
  um1: beatAt(3.5), // 1.86 her 37th 「嗯」 arrives
  hisFace: beatAt(5.5), // 2.88 cut to his face
  scrollUp: [beatAt(8.5), beatAt(9.5)] as const, // 4.42–4.93 back up to July…
  scrollDown: [beatAt(11), beatAt(11.5)] as const, // 5.70–5.95 …held there, then one quick flick down to now
  tapAvatar: beatAt(12), // 6.21 he taps her avatar…
  pagePush: [6.3, 6.65] as const, // …and her 朋友圈 slides in
  turn1: beatAt(17), // 8.76 she turns round in class…
  hide1: beatAt(18), // 9.27 …and hides behind her book
  classFace: beatAt(19), // 9.79 his face, looking down at the milk
  bell: BAR(5),
  milkOffer: beatAt(20.5), // 10.55
  flee: beatAt(21.5), // 11.06 she grabs her friend and runs
  milkLeft: beatAt(23), // 11.83 the milk left on her empty desk
  type1: [BAR(6), beatAt(26)] as const, // 12.34–13.36
  del1: [beatAt(26), beatAt(27)] as const, // 13.36–13.87
  type2: [beatAt(27), beatAt(28)] as const, // 13.87–14.39
  send1: beatAt(29.5), // 15.15 「以后不打扰你了」
  room: beatAt(30), // 15.41 his room, the phone face down
  lampOff: beatAt(31.5), // 16.17
  // act 2
  timeout: 18.6,
  // cuts sit on phrase ends that are also beats: the reflection holds through "ugly", then the chat — his eyes on
  // her 「嗯」 — runs on to the power-off at BAR(12)
  uglyEnd: beatAt(42), // 21.54
  typingA: [beatAt(44.5), beatAt(45)] as const, // 22.82–23.07 both on the phone, before the camera sinks into her 「嗯」
  typingB: [beatAt(45.5), beatAt(46)] as const, // 23.33–23.59
  powerOff: beatAt(48.5), // 24.86 one quick swipe lands, the screen goes black
  blanket: beatAt(49), // 25.12 the duvet goes up over his head
  muffle: [beatAt(50), beatAt(51.5)] as const, // 25.63–26.40 under the duvet with him (the music is muffled only here)
  leaveRoom: beatAt(51.5), // 26.40 his room — the camera backs out through his window
  hisLightOff: beatAt(53), // 27.16 "…without me": his light goes out
  herWindow: [beatAt(53.5), 28.1] as const, // across the street and in through the only window still lit
  twist: 28.1, // her room: she is crying too ("unhappy")
  hesitate: beatAt(58), // 29.72 her phone: the paragraph is typed out — time to read it
  pressSend: beatAt(61), // 31.25 her thumb comes down on 发送 and stays there (never lets go, so nothing is sent)…
  toHome: beatAt(62.5), // 32.02 …then she swipes the app away to the home screen — into her memory
  // act 3 — her side
  rewind: 32.55,
  ding2: beatAt(64.5), // 33.04
  type3: [beatAt(65.5), beatAt(66.5)] as const, // 33.55–34.06 cut to her phone: her long, happy reply
  friendNote: beatAt(66.5), // 34.06 小美’s message drops in…
  openNote: beatAt(67.5), // 34.57 …she taps it and reads 小美’s chat: 「回个嗯就行」
  backToHim: beatAt(69.5), // 35.60 back to his chat, her reply still in the box…
  del3: [beatAt(70), beatAt(70.5)] as const, // 35.85–36.11 …all of it deleted
  send2: beatAt(71), // 36.36 the 「嗯」 she sends — the chat holds on it until umHold
  umHold: beatAt(73), // 37.39 that class (his smile and her pillow were cut to make room for 小美)
  hide2: beatAt(73), // 37.39 up goes the book
  peek: beatAt(74), // 37.90 her eyes go to him over the book
  afterClass: beatAt(75), // 38.41 she comes back for the strawberry milk
  now: beatAt(77), // 39.43 back to 00:52
  wiped: beatAt(77.5), // 39.69 tears wiped
  phoneAgain: beatAt(78), // 39.94 her home screen…
  openApp: beatAt(78.5), // 40.20 …she taps 微信 and it opens on the paragraph she left
  type4: [beatAt(79), 42.35] as const,
  send3: beatAt(84), // 43.01 the whole paragraph, finally (on "misery")
  late1: beatAt(85.5), // 43.77 01:30 「你睡了吗？」
  late2: beatAt(86.5), // 44.29 03:00 「晚安。」 — then the screen goes to sleep
  nightFalls: beatAt(87.5), // 44.80 outside: the two windows across the street…
  herLightOff: BAR(22), // 45.05 …her light goes out too (with 「第二天」); the night turns into morning
  intoHis: [beatAt(89.5), beatAt(90.5)] as const, // 45.82–46.33 in through his window: 07:10
  dawn: BAR(22), // 07:10, his room
  boot: beatAt(91), // 46.59
  um2: BAR(23), // 47.10 her three messages land on his lock screen (a sixteenth apart)
  tapNote: beatAt(93), // 47.61 he taps the first one: the chat opens on her paragraph
  read: beatAt(95), // 48.63 his face
  // act 4 — the outro (one loop, then the song fades out)
  joy: BAR(24),
  // one continuous shot on his phone, sending and receiving — no cutaways (the split screen that followed was cut too;
  // the street is the last shot)
  reply: beatAt(97.5), // 49.91
  type6: [beatAt(98), 50.55] as const, // 「我也是」
  send5: beatAt(99), // 50.67
  type7: [beatAt(99.5), beatAt(101.5)] as const, // 50.93–51.95 「那周末一起去图书馆？」
  send6: beatAt(102), // 52.21
  typingC: [beatAt(102.5), beatAt(104)] as const, // 52.46 「对方正在输入...」 — this time it ends in an answer…
  um3: beatAt(104), // 53.23 …「嗯！！」
  heart: beatAt(104.5), // 53.49
  outside: beatAt(107), // 54.76 the street again, in the morning sun — to the end
};
