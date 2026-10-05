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
  fix?: Fix;
}

const CHORUS = [
  "今天我才发现 我一个朋友都没有 好孤单",
  "我像被全世界隔离 从来没人给我发消息",
  "每个人都好虚伪 我只想躲起来",
  "因为没人在乎我 他们只会当着我的面笑",
];
const BRIDGE = ["看着一对对情侣 从我身边走过", "手牵着手 握得那么紧", "不知为何 我开始恨他们 我好嫉妒", "为什么 不能是我"];
const CN = [...CHORUS, ...CHORUS, ...BRIDGE, ...CHORUS, ...CHORUS];

const FIXES: Record<number, Fix> = {
  16: { en: [6], cn: "我一个朋友都没有 好孤单", note: "原来 是我开着飞行模式", at: 69.15 },
  17: { en: [4, 5, 6], cn: "从来没人给我发消息", note: "99+ 条未读消息", at: 73.35 },
  18: { en: [2, 3], cn: "每个人都好虚伪", note: "是我把自己藏起来了", at: 76.75 },
  19: { en: [1, 2], cn: "没人在乎我", note: "（还把蛋糕糊了我一脸）", at: 80.2 },
};

export const LINES: Line[] = LYRIC_WORDS.map((words, i) => {
  const last = words[words.length - 1];
  return { words, start: words[0][0], end: last[0] + last[1], cn: CN[i], fix: FIXES[i] };
});
