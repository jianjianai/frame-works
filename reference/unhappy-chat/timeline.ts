import { beatAt } from "@materials/s0rrow/code/draw";

/** Bar n starts at beat 4n (work time = song time − 16.332). Song as cut for this work:
 *  verse 1 = bars 0–7, chorus 1 = 8–15, verse 2 = 16–23, then (CUT) the last loop of the outro, which keeps
 *  the same grid: work bars 24–27 = song bars 36–39 (the song fades out by END). Chorus 2 is skipped. */
export const BAR = (n: number) => beatAt(n * 4);
/** where verse 2 jumps to the outro (work time; 11 ms before the bar-24 downbeat) */
export const CUT = 49.123;
export const END = 57.0;

/** Story events shared by the pictures and the sound effects (work time, seconds).
 *  《unhappy》· 同一段聊天两个视角：他以为她只回「嗯」是不喜欢他，其实她每个「嗯」后面都删掉了一整段话。 */
export const EV = {
  // act 1 — his side
  typing1: [0.25, 0.85] as const,
  typing2: [1.25, 1.65] as const,
  um1: 1.85, // her 37th 「嗯」 arrives
  scrollUp: [4.25, 4.85] as const, // back up to July…
  scrollDown: [5.6, 5.9] as const, // …held there, then one quick flick down to now
  tapAvatar: 6.2, // he taps her avatar…
  pagePush: [6.3, 6.65] as const, // …and her 朋友圈 slides in
  turn1: 9.0, // she turns round in class…
  hide1: 9.35, // …and hides behind her book
  bell: BAR(5),
  milkOffer: 10.6,
  flee: 11.2,
  type1: [12.4, 13.4] as const,
  del1: [13.4, 13.9] as const,
  type2: [13.9, 14.4] as const,
  send1: 15.25, // 「以后不打扰你了」
  lampOff: 16.15,
  // act 2
  timeout: 18.6,
  // cuts sit on phrase ends that are also beats: the reflection holds through "ugly", then the chat — his eyes on
  // her 「嗯」 — runs on to the power-off at BAR(12)
  uglyEnd: 21.541,
  typingA: [22.66, 22.98] as const, // both on the phone, before the camera sinks into her 「嗯」 (23.45)
  typingB: [23.1, 23.42] as const,
  powerOff: 25.06, // one quick swipe, the screen goes black
  blanket: 25.25, // the duvet goes up over his head
  muffle: [25.7, 26.45] as const, // under the duvet with him (the music is muffled only here)
  leaveRoom: 26.45, // his room — the camera backs out through his window
  hisLightOff: beatAt(53), // 27.16 "…without me": his light goes out
  herWindow: [27.42, 28.1] as const, // across the street and in through the only window still lit
  twist: 28.1, // her room: she is crying too ("unhappy")
  hesitate: beatAt(58), // 29.72 her phone: the paragraph is typed out — time to read it
  pressSend: beatAt(61), // 31.25 her thumb comes down on 发送 and stays there (never lets go, so nothing is sent)…
  toHome: 32.02, // …then she swipes the app away to the home screen — into her memory
  // act 3 — her side
  rewind: 32.55,
  ding2: 33.05,
  type3: [33.6, 34.2] as const, // her long, happy reply
  friendNote: 34.25, // 小美’s message drops in…
  openNote: 34.55, // …she taps it and reads 小美’s chat: 「回个嗯就行」
  backToHim: 35.6, // back to his chat, her reply still in the box…
  del3: [35.9, 36.22] as const, // …all of it deleted
  send2: beatAt(71), // 36.36 the 「嗯」 she sends — the chat holds on it until umHold
  umHold: beatAt(73), // 37.39 that class (his smile and her pillow were cut to make room for 小美)
  hide2: beatAt(73), // 37.39 up goes the book
  afterClass: beatAt(75), // 38.41 she comes back for the strawberry milk
  now: 39.43, // back to 00:52
  phoneAgain: 39.9, // her home screen…
  openApp: 40.08, // …she taps 微信 and it opens on the paragraph she left
  type4: [40.45, 42.35] as const,
  send3: 43.008, // the whole paragraph, finally (on "misery")
  late1: 43.85, // 01:30 「你睡了吗？」
  late2: 44.25, // 03:00 「晚安。」 — then the screen goes to sleep
  nightFalls: 44.75, // outside: the two windows across the street…
  herLightOff: 44.95, // …her light goes out too; the night turns into morning
  intoHis: [45.7, 46.3] as const, // in through his window: 07:10
  dawn: BAR(22), // 07:10, his room
  boot: 46.585,
  um2: BAR(23), // her three messages land on his lock screen
  tapNote: 47.55, // he taps the first one: the chat opens on her paragraph
  read: 48.6, // his face
  // act 4 — the outro (one loop, then the song fades out)
  joy: BAR(24),
  // one continuous shot on his phone, sending and receiving — no cutaways (the split screen that followed was cut too;
  // the street is the last shot)
  reply: 50.0,
  type6: [50.15, 50.55] as const, // 「我也是」
  send5: beatAt(99), // 50.67
  type7: [50.95, 51.95] as const, // 「那周末一起去图书馆？」
  send6: beatAt(102), // 52.21
  typingC: [52.35, beatAt(104)] as const, // 「对方正在输入...」 — this time it ends in an answer…
  um3: beatAt(104), // 53.23 …「嗯！！」
  heart: 53.48,
  outside: beatAt(107), // 54.76 the street again, in the morning sun — to the end
};
