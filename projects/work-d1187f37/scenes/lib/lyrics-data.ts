// 中英歌词数据：英文逐词时间来自 krc.ts（酷狗 KRC，已平移到作品时间）；中文按英文词数拆分，第 i 个中文词用第 i 个英文词的时间点亮。
import { LYRIC_WORDS } from "./krc";

export interface Fix {
  /** 要划掉的英文单词下标 */
  en: number[];
  /** 要划掉的中文子串 */
  cn: string;
  /** 红笔在下面写的改写 */
  note: string;
  /** 开始划线的绝对时间（秒） */
  at: number;
}
export interface Line {
  words: [number, number, string][];
  start: number;
  end: number;
  cn: string;
  /** 每个中文字符：[开始, 时长, 词序号]（空格是 -1） */
  cnTimes: [number, number, number][];
  fix?: Fix;
}

/** 每句中文拆成和英文单词数相同的词，第 i 个中文词用第 i 个英文单词的时间点亮；词尾加空格表示词组之间留半个字的空隙。
 *  中文按英文语序改写；整句字数尽量等于英文音节数，意思和情绪优先。 */
const CN: string[][] = [
  // Every day we talk a little less
  ["每", "天", "我们 ", "聊得", "越", "来越", "少"],
  // It looks like you are losing interest
  ["看", "起来 ", "你", "对我", "渐渐", "没了", "兴趣"],
  // These feelings I have for you
  ["这份", "心意 ", "我", "只", "给", "你"],
  // But you don't feel the same
  ["可", "你", "却", "不", "这么", "想"],
  // So I'll pack all my things
  ["所以", "我会 ", "收拾", "好", "我的", "行李"],
  // And go run far away
  ["然后", "逃", "得", "远", "远的"],
  // You are, you are very pretty
  ["你", "是 ", "你", "是", "那么", "漂亮"],
  // I'm so very ugly
  ["我", "却", "那么", "丑"],
  // Will you even love me, anymore
  ["你", "还", "会", "爱", "我", "吗"],
  // (love me)
  ["爱", "我"],
  // You can, you can live without me
  ["你", "可以 ", "你", "可以 ", "没有", "我", "也能活"],
  // That makes me unhappy
  ["这", "让", "我", "不开心"],
  // I should get a piercing through my heart
  ["我", "该", "让", "针 ", "刺", "穿", "我的", "心"],
  // What do you even want me to be
  ["你", "到底", "想", "要 ", "我", "变成", "什么", "样"],
  // You never ever pay attention to me
  ["你", "从来", "都", "不", "在意", "过", "我"],
  // So I'll close my blinds in misery
  ["所以", "我", "拉上", "了", "窗帘 ", "独自", "难过"],
  // And I'll wait for you for a couple of weeks
  ["然后", "我", "会", "等", "你 ", "等", "上", "几", "个", "星期"],
];

/** 红笔改写：按句下标。 */
const FIXES: Record<number, Fix> = {};

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
    cn: CN[i].join("").trim(),
    cnTimes: charTimes(words, CN[i]),
    fix: FIXES[i],
  };
});
