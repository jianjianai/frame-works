// 歌词数据模板（不含任何歌词）。复制为 scenes/lib/lyrics-data.ts，并在 scenes/lib/krc.ts 里放逐字时间。
// krc.ts 格式：export const LYRIC_WORDS: [startSec, durSec, "word"][][] = [ [[12.3, 0.4, "Today"], ...], ... ];
// 用 tools/fetch-krc.mjs 生成。
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

/** 每句中文拆成和英文单词数相同的词，第 i 个中文词用第 i 个英文单词的时间点亮；词尾加空格表示词组之间留半个字的空隙
 *  （只在词组之间加，每个词后都加会很碎）；空字符串 "" 表示这个英文词不对应中文（不亮）。
 *  先写一句通顺、像中文歌词的话，再按英文词序切开；词序对不上时用倒装（「他们只会嘲笑我 当着我的面」）或让某个词不亮，
 *  不要硬按英文词序凑出不通的中文（用户评「翻译得很差」的例子：「点亮我的手机」「把笑声砸在我脸上」）。
 *  字数尽量接近英文音节数，意思和情绪优先。重复的段落可以先定义一次再拼接（重置版：CN = [...CHORUS, ...CHORUS, ...BRIDGE, ...]）。 */
const CN: string[][] = [
  // 英文原句（逐词）
  // ["中文词", "中文词 ", ...],
];

/** 红笔改写：按句下标。 */
const FIXES: Record<number, Fix> = {
  // 16: { en: [6], cn: "要划掉的中文", note: "红笔改写", at: 69.15 },
};

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
