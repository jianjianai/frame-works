import { beatAt } from "./draw";

/** Bar n starts at beat 4n (work time = song time − 16.332). Song sections:
 *  verse 1 = bars 0–7, chorus 1 = 8–15, verse 2 = 16–23, chorus 2 = 24–31, outro = 32– (to 80.2). */
export const BAR = (n: number) => beatAt(n * 4);
export const END = 73.3;

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
  type3: [33.6, 34.5] as const,
  friendNote: 34.6,
  del3: [35.2, 35.75] as const,
  send2: 35.9, // the 「嗯」 she sends
  turn2: 36.9,
  hide2: 37.3,
  shutter: 39.95,
  type4: [41.7, 44.2] as const,
  send3: 45.563, // the whole paragraph, finally
  // act 4 — the next morning
  wakeHer: 49.3,
  mirror: BAR(25),
  powerOn: 53.4,
  um2: 54.5, // her message lands on his lock screen
  run: 57.4,
  shop: 59.5,
  pay: 60.1,
  door: 61.9,
  milk: 63.5, // strawberry milk + 「我也是」, on "piercing"
  eyes: 65.35,
  // outro (one loop of the accompaniment, then the song fades out)
  type5: [68.1, 68.6] as const,
  send4: 68.75,
  typingC: [68.9, 69.5] as const,
  um3: 69.6, // 「嗯！！」 — lands on the outro joint
};
