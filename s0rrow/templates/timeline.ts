// 作品的 scenes/timeline.ts（模板）：一首歌的小节和事件时间写在一处，画面和 audio.json 的音效 start 都照它对齐。
// 节拍来自 project.ts 的 tempo（preview_audio 的 beats 分析后用 work_update 写入）：barAt(n) 第 n 小节第一拍，beatAt(k) 第 k 拍，
// beatAt(k + 0.5) 反拍。硬切和带音效的动作放在八分音符网格上；跟唱词走的时刻用歌词里那个词的时间。
import { barAt, beatAt } from "@frame/engine/tempo";

/** Story events, work time in seconds. */
export const EV = {
  hook: 0, // 钩子文字首帧完整出现
  setup: barAt(4), // 铺垫
  twist: barAt(16), // 反转（30 秒前后）
  payoff: barAt(24), // 兑现
  end: barAt(28), // 兑现后 5 秒内结束
  drop: beatAt(2.5), // 例：第 2 拍后的反拍
};
