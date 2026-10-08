import { LYRIC_WORDS } from "./krc";

/** YouTube 版：English only — no Chinese translation row. The red-pen corrections strike English words and write an
 *  English note under the line. */
export interface Fix {
  /** English word indices to strike through */
  en: number[];
  /** Red-pen correction written under the line */
  note: string;
  /** absolute (song) time the strike starts */
  at: number;
}
export interface Line {
  words: [number, number, string][];
  start: number;
  end: number;
  fix?: Fix;
}

/** The last chorus (the twist): the lyric's claims crossed out one by one.
 *  16 Today I realized that I have [no friends] and I'm so alone
 *  17 I feel so isolated [no one's ever] texting my phone
 *  18 Everyone is [so fake] I wanna hide away
 *  19 'Cause no one cares about me all they do is [laugh] in my face → "smash cake" (on the cake-in-the-face shot) */
const FIXES: Record<number, Fix> = {
  16: { en: [6, 7], note: "airplane mode was ON", at: 69.15 },
  17: { en: [4, 5, 6], note: "99+ unread messages", at: 73.35 },
  18: { en: [2, 3], note: "I was the one hiding", at: 76.75 },
  19: { en: [10], note: "smash cake", at: 80.6 },
};

export const LINES: Line[] = LYRIC_WORDS.map((words, i) => {
  const last = words[words.length - 1];
  return {
    words,
    start: words[0][0],
    end: last[0] + last[1],
    fix: FIXES[i],
  };
});
