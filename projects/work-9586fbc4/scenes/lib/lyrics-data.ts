// 歌词数据（来自素材库 s0rrow/templates/lyrics-data.template.ts）。逐字时间在 ./krc.ts（酷狗 KRC）。
// 音乐是歌曲 0:00–57.2 连续一段，作品时间 = 歌曲时间。
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

/** 每句中文拆成和英文单词数相同的词，第 i 个中文词用第 i 个英文单词的时间点亮；词尾加空格表示词组之间留半个字的空隙；
 *  "" 表示这个英文词不对应中文（不亮）。先写通顺的中文歌词，再按英文词序切开；词序对不上用倒装（「挂满镜子 在我的家」）。
 *  每句不超过约 14 个字（1080 宽、中文 64px）。 */
const CN: string[][] = [
  // Put up all the mirrors in my house
  ["挂", "满", "", "", "镜子 ", "在", "我的", "家"],
  // I love my nose eyes and my mouth
  ["我", "爱", "我的", "鼻子 ", "眼睛 ", "和", "", "嘴巴"],
  // I love the jokes I laugh about
  ["我", "爱", "那些", "笑话 ", "我", "笑得", "开怀"],
  // I love the girls I'm glad about
  ["我", "爱", "那些", "女孩 ", "想起", "就", "开心"],
  // She calls up my phone
  ["她", "打", "", "我", "电话"],
  // Ringing ringing ringing ringing baby don't leave me alone
  ["铃", "铃", "铃", "铃 ", "宝贝", "别", "留", "我", "一个人"],
  // She saw zero flaws
  ["她眼里 ", "我", "零", "瑕疵"],
  // Baby can you tell me if I should start doing wrong
  ["宝贝", "", "", "告诉", "我 ", "", "我", "是不是该", "", "", "学坏"],
  // Ooh I like the feeling of my doubts
  ["噢 ", "我", "喜欢", "这种", "感觉 ", "", "自我", "怀疑"],
  // I want to live on top of my couch
  ["我", "想", "", "住", "在", "", "", "", "沙发上"],
  // Oh well oh well oh well
  ["算", "了 ", "算", "了 ", "算", "了"],
  // I know what you want from me
  ["我", "知道 ", "", "你", "想要", "", "什么"],
  // I'm really really good at everything
  ["我", "真的", "真的 ", "", "", "样样都行"],
  // I know why you talk to me
  ["我", "知道 ", "为什么", "你", "找我", "", "聊天"],
  // I'll probably even buy you a wedding ring
  ["我", "说不定", "还会 ", "买给", "你", "一枚", "婚", "戒"],
  // Ooh I have a question
  ["噢 ", "我", "有", "个", "问题"],
  // I'm like "Ooh I have a question"
  ["我", "心想 ", "「噢 ", "我", "有", "个", "问题」"],
  // Ooh I have a question
  ["噢 ", "我", "有", "个", "问题"],
  // I'm like "Ooh I have a question for you baby"
  ["", "", "「噢 ", "我", "有", "个", "问题 ", "要问", "你 ", "宝贝」"],
  // I know I really really matter to you
  ["我", "知道 ", "我", "真的", "真的 ", "", "对你", "很重要"],
  // 'Cause you never ever talk to other dudes
  ["因为", "你", "从来", "不", "理", "", "别的", "男生"],
  // Oh-oh-oh you make me like my face so much
  ["噢噢噢 ", "你", "让", "我", "好喜欢", "我的", "脸", "", ""],
  // When will you be on my level?
  ["什么时候 ", "", "你", "才能", "", "追上", "我？"],
  // Put up all the mirrors in my house
  ["挂", "满", "", "", "镜子 ", "在", "我的", "家"],
  // I love my nose eyes and my mouth
  ["我", "爱", "我的", "鼻子 ", "眼睛 ", "和", "", "嘴巴"],
];

/** 红笔改写：按句下标（剧情定了再加）。 */
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
    cn: CN[i].join(""),
    cnTimes: charTimes(words, CN[i]),
    fix: FIXES[i],
  };
});
