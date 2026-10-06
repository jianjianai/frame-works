import { LYRIC_WORDS } from "./krc";

export interface Fix {
  /** English word indices to strike through */
  en: number[];
  /** Chinese substring to strike through */
  cn: string;
  /** Red-pen correction written under the line */
  note: string;
  /** absolute time the strike starts */
  at: number;
}
export interface Line {
  words: [number, number, string][];
  start: number;
  end: number;
  cn: string;
  /** per character of `cn`: [start, duration, word id] (start -1 for spaces) */
  cnTimes: [number, number, number][];
  fix?: Fix;
}

/** One Chinese word per English word, in the same order: Chinese word i lights up exactly while
 *  English word i is sung. A trailing space adds a gap after the word. (The translation is phrased
 *  to follow the English word order.) */
const CHORUS: string[][] = [
  // Today / I / realized / that / I / have / no / friends / and / I'm / so / alone
  ["今天", "我", "才懂 ", "原来", "我", "身边", "没有", "朋友 ", "只剩", "我", "好", "孤单"],
  // I / feel / so / isolated / no / one's / ever / texting / my / phone
  ["我", "仿佛", "被", "世界隔离 ", "从来", "没人", "会", "点亮", "我的", "手机"],
  // Everyone / is / so / fake / I / wanna / hide / away
  ["每个人", "都", "那么", "虚伪 ", "我", "只想", "躲得", "远远的"],
  // 'Cause / no / one / cares / about / me / all / they / do / is / laugh / in / my / face
  ["因为", "没有", "人", "真正", "在乎", "我 ", "他们", "只", "会", "把", "笑声", "砸在", "我", "脸上"],
];
const BRIDGE: string[][] = [
  // Seeing / couples / walk / right / past / me
  ["看着", "一对对恋人 ", "与", "我", "擦肩", "而过"],
  // Holding / hands / so / very / tightly
  ["十指", "相扣 ", "握得", "那么", "紧"],
  // Something / about / it / makes / me / hate / them / makes / me / jealous
  ["说不清", "为什么 ", "这一幕", "让", "我", "恨透", "他们 ", "让", "我", "嫉妒"],
  // Why / can't / it / be / me
  ["为什么 ", "不可以", "换作", "是", "我"],
];
const CN = [...CHORUS, ...CHORUS, ...BRIDGE, ...CHORUS, ...CHORUS];

const FIXES: Record<number, Fix> = {
  16: { en: [6], cn: "原来我身边没有朋友", note: "其实是我开着飞行模式", at: 69.15 },
  17: { en: [4, 5, 6], cn: "从来没人会点亮我的手机", note: "99+ 条未读消息", at: 73.35 },
  18: { en: [2, 3], cn: "每个人都那么虚伪", note: "是我把自己藏起来了", at: 76.75 },
  19: { en: [1, 2], cn: "没有人真正在乎我", note: "（还把蛋糕砸在了我脸上）", at: 80.2 },
};

/** Per character: [start, duration, word index] — the timing of the English word it stands for. */
function charTimes(words: [number, number, string][], tokens: string[]): [number, number, number][] {
  if (tokens.length !== words.length) throw new Error(`中英词数不一致：${tokens.join("")}`);
  const out: [number, number, number][] = [];
  tokens.forEach((tok, i) => {
    for (const ch of Array.from(tok)) out.push(ch === " " ? [-1, 0, -1] : [words[i][0], words[i][1], i]);
  });
  return out;
}

export const LINES: Line[] = LYRIC_WORDS.map((words, i) => {
  const last = words[words.length - 1];
  return {
    words,
    start: words[0][0],
    end: last[0] + last[1],
    cn: CN[i].join(""),
    cnTimes: charTimes(words, CN[i]),
    fix: FIXES[i],
  };
});
