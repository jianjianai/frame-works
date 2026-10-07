import { beatAt } from "./draw";

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
  scrollUp: 4.25,
  scrollDown: 5.6,
  moments: BAR(3),
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
  typingA: [21.2, 21.9] as const,
  typingB: [22.6, 23.4] as const,
  powerOff: 25.85,
  blanket: 26.2,
  muffle: [26.65, 29.82] as const,
  twist: 29.82,
  del2: [30.8, 31.8] as const,
  // act 3 — her side
  rewind: 32.55,
  ding2: 33.05,
  type3: [33.6, 34.3] as const,
  friendNote: 34.4,
  del3: [34.85, 35.3] as const,
  send2: 35.55, // the 「嗯」 she sends — the chat holds on it until umHold
  umHold: 36.45,
  turn2: 36.9,
  hide2: 37.3,
  now: 39.43, // back to 00:52
  type4: [40.2, 42.35] as const,
  send3: 43.008, // the whole paragraph, finally (on "misery")
  asleep: 44.6,
  dawn: BAR(22), // 07:10, his room
  boot: 46.585,
  um2: BAR(23), // her message lands on his lock screen
  read: 48.2,
  // act 4 — the outro (one loop, then the song fades out)
  joy: BAR(24),
  reply: 50.0,
  type6: [50.1, 50.45] as const, // 「我也是」
  send5: 50.674,
  type7: [50.85, 51.5] as const, // 「那周末一起去图书馆？」
  send6: 51.696,
  typingC: [51.85, 52.6] as const,
  um3: 52.719, // 「嗯！！」
  heart: 52.97,
  split: BAR(26),
};
