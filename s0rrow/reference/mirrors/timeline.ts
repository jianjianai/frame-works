import { beatAt } from "@materials/s0rrow/code/draw";

/** Bar n starts at beat 4n. The cut is the song from 0:00 (work time = song time): A 段 bars 0–7, B 8–11, C 12–15,
 *  桥段 16–25 (the twist on its downbeat, 32.54), A 段 again 26–27; the drums come back on bar 28 (56.93) and the
 *  music stops at 57.2. */
export const BAR = (n: number) => beatAt(n * 4);
export const END = 57.5;

/** Story events shared by the pictures and (later) the sound effects, work time in seconds. 《瑕疵：0》
 *  Cuts sit on beats at the end of a sung phrase; moments that follow a sung word use the word's time. */
export const EV = {
  // shot 1 — the last uncovered strip of mirror in the house
  paperIn: 0.16, // his hand brings the last sheet of newspaper across the strip…
  eyesShut: 0.8, // …he can't look any more…
  slap: beatAt(2), // 1.051 "mirrors": …slapped flat over his reflection
  whip: beatAt(2.5), // 1.305 the camera whips right (from 1.13) — into the hallway
  // shot 2 — the hallway at night: the last mirror, the tall one; he throws a bedsheet over it
  sheetUp: beatAt(3), // 1.559 the sheet flies up from below the frame…
  sheetMid: beatAt(3.5), // 1.813 …open in the air, in the lamplight…
  sheetLand: beatAt(4), // 2.067 …and settles over the mirror; the camera pushes into it (white)
  // shot 3 — "I love my nose, eyes and…" (his face, in front of the covered mirror)
  face: beatAt(5), // 2.575
  nose: 3.16,
  eyes: 3.43,
  flaw: beatAt(8), // 4.099 the drums come in: crash into the birthmark, the red pen rings it — 「瑕疵」 (shot 4)
  // shot 3 — the jokes he laughs about
  classroom: beatAt(10), // 5.115, on "jokes"
  jokes: 5.1, // they are already laughing at him…
  laughAlong: beatAt(11), // 5.622 "laugh": …and he laughs along
  herLook: beatAt(12), // 6.130 by the window, she looks up from her sketchbook at him
  next: beatAt(13), // 6.638 cut to night (his phone)
  // shots 4–8 — night, his phone (night.ts)
  herMsg: beatAt(14), // 7.146 "girls": 白猫 「今天也辛苦啦」
  sticker: beatAt(15), // 7.654 her white-cat sticker
  call: beatAt(16), // 8.162 "She calls up my phone": 白猫 邀请你视频通话 — the front camera shows his own face
  backOff: beatAt(19.5), // 9.940 the camera backs off to the buttons
  declines: [beatAt(20), beatAt(20.5), beatAt(21), beatAt(21.5)] as const, // the four "ringing": hang up ×4
  dontLeave: beatAt(22), // 11.210 "baby don't leave me alone": 「别不理我嘛」
  askPhoto: beatAt(23), // 11.718 「那发张照片嘛」
  app: beatAt(25), // 12.734 "saw": the beauty app, 祛斑 slider
  zero: beatAt(26), // 13.242 "zero": 「瑕疵：1」 → 「瑕疵：0」
  face4: beatAt(28), // 14.258 "Baby can you tell me": his face, lit by the phone
  dialog: beatAt(30), // 15.274 "should I start doing wrong": 「发送给：白猫」, his thumb held on 发送
  send: beatAt(31.5), // 16.036 he lets go
  sent: beatAt(31.5) + 0.1, // the photo lands in the chat
  actEnd: BAR(8), // 16.29
  // act 2 (16.29 – 24.417, B 段) — act2.ts
  /** 「对方正在输入...」 on, off, on again ("Ooh I like the feeling of my doubts") */
  typing: [[beatAt(32.5), beatAt(33.5)], [beatAt(34), beatAt(34.5)]] as const,
  reply: beatAt(34.5), // 17.560 「明天放学，天台见？」 — she knows his school?
  couch: beatAt(36.5), // 18.576 cut (before "I want to live"): the living room, he stares at his phone
  dive: beatAt(38), // 19.338 "live": under the blanket, kicking
  night2: beatAt(39), // 19.846 "of my couch": the night goes by (window, clock), his eyes open
  alarm: beatAt(40), // 20.354 the alarm clock goes off
  sitUp: beatAt(40.5), // 20.608 he sits up: no sleep
  mirror: beatAt(41), // 20.861 cut: the bathroom mirror strip from the first frame
  /** the three "oh WELL": the paper peeled off the mirror strip — concealer, a mask, cap + mask + sunglasses */
  peeks: [beatAt(42), beatAt(44), beatAt(46)] as const,
  act2End: BAR(12), // 24.417
  // act 3 (24.417 – 32.544, C 段) — act3.ts
  roof: BAR(12), // 24.417 第二天 放学后: the roof at golden hour; she's at the railing, back to us; he steps out
  pushIn: [beatAt(49), beatAt(50.5)] as const, // "I know what you want from me": the camera finds the white-cat keychain on her bag
  turn: beatAt(52), // 26.449 "really": she turns round — the girl from the back row
  recog: beatAt(54), // 27.465 "good": his face; the sunglasses slip down (beatAt(54.5))
  run: beatAt(56), // 28.481 he spins and runs for the door ("I know why you talk to me")
  freeze: beatAt(60), // 30.513 「黑猫！」 — he freezes mid-stride
  holdUp: beatAt(62), // 31.529 she holds up her sketchbook
  twist: BAR(16), // 32.544 "I have a question": she opens it
  // act 4 (32.544 – 52.863, 桥段) — act4.ts
  /** her sketchbook: page 1 (3月) opens on the twist, then a page a beat — 4月 … 9月 */
  pages: [BAR(16), beatAt(66), beatAt(67), beatAt(68), beatAt(69), beatAt(70), beatAt(71)] as const,
  photoPage: beatAt(72), // 36.609 the last page: the photo he sent, the birthmark edited out
  leafOnPhoto: beatAt(73), // 37.117 her red pen draws it back, as a maple leaf
  why: beatAt(74), // 37.625 「为什么要 P 掉它？」
  tears: beatAt(76), // 38.641 his face over the slipped sunglasses: eyes filling
  unmask: [beatAt(80), beatAt(81), beatAt(82)] as const, // 40.672 sunglasses, mask, cap ("I know I really really matter to you")
  lock: beatAt(84), // 42.704 her phone: her lock screen is her drawing of him ("you never ever talk to other dudes")
  herLeaf: beatAt(88), // 44.736 "Oh-oh-oh": she draws a little red leaf on her own cheek
  laugh: beatAt(92), // 46.768 he laughs; on "you" (47.07) he calms down and looks at her
  /** 47.784 cut to the opening's 「瑕疵」 close-up, warm now: her fingertip goes round the mark where the red pen did —
   *  a ring of light that closes on "face" (48.29); on "so much" her palm cups his cheek; 49.31 pull back to the two of them */
  touch: beatAt(94),
  pull: beatAt(97), // 49.308
  level: beatAt(100), // 50.831 "When will you be on my level?": on tiptoe, cheek by cheek — 「这下一样了」 (beatAt(102))
  act4End: BAR(26), // 52.863
  // act 5 (52.863 – 57.5, A 段回来) — act5.ts
  grab: beatAt(105), // 53.371 his hands on the paper over the bathroom mirror
  rip: beatAt(106), // 53.879 "mirrors": he tears it all off — his face in the glass
  drawing: beatAt(107), // 54.387 he tapes her drawing (the white cat and the black cat) to the mirror
  close: beatAt(108), // 54.895 in close on his reflection: "I love my nose, eyes and my mouth" — hearts, this time on the mark too
  hearts: [55.939, 56.18, 56.445] as const, // nose, eyes, …and the mark (sung word times)
  like: 55.4, // the end prompts: 「点赞的人，在喜欢的人眼里都是零瑕疵」…
  ask: 55.9, // …「回看：她第一次出现在第几秒？」…
  tap: 56.62, // …and a double tap (after the hearts on his face, off to the side so it doesn't cover them)
};
