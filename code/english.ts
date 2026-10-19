/**
 * 英文版（海外版 / YouTube 版）：把素材库自己画的中文字换成英文。draw.ts 的 text() / measure() 按整句查 LOCALE 表，
 * useEnglish() 把下面的译文放进去，并把手写体和标题字体（F.cn、F.pen）换成英文手写体 Gochi Hand 打头（中文字体留在后面兜底）。
 * 作品在画第一帧之前调用一次：例如每一幕和歌词层都先导入的 acts/locale.ts 里写 `useEnglish({ 作品自己的字: "…" })`。
 * 聊天、帖子、通知、主页用 dm.ts（Instagram 私信样式），歌词层用 cn: false。人名、班级、招牌这些故事里的字由作品决定，
 * 传进 extra；这里只有素材库通用的道具、招牌、场景和手机界面上的字（女主默认的名字 林夏 → Summer）。
 * 第一次用在《unhappy》YouTube 版（frame-works/b1e36583）。
 */
import { F, LOCALE } from "./draw";

/** what the library writes, in English (exact strings, as text() is given them) */
export const EN: Record<string, string> = {
  // school
  物理: "PHYSICS",
  "高二 · 上册": "GRADE 11",
  第3题: "Q3",
  "高二(3)班": "CLASS 11B",
  // home and rooms
  草莓牛奶: "MILK",
  "10月": "OCT",
  "12月": "DEC",
  早点睡: "sleep early!",
  哈哈哈: "HAHA",
  // shops and streets
  "24H 便利店": "24H STORE",
  转角: "corner",
  "转 角 咖 啡": "CORNER CAFE",
  萌宠小屋: "PET SHOP",
  领养代替购买: "ADOPT, DON'T SHOP",
  宠物医院: "PET HOSPITAL",
  "宠物医院 · 24小时": "PET HOSPITAL · 24H",
  手术中: "IN SURGERY",
  住院: "IN CARE",
  犬心脏病: "HEART DISEASE",
  爱心: "LOVE",
  // the guard booth (blocked/)
  值班记录: "DUTY LOG",
  门卫室: "SECURITY",
  一月: "JAN",
  "夜 班": "NIGHT SHIFT",
  "巡 查 记 录": "PATROL LOG",
  "01 大门": "01 GATE",
  "02 仓库": "02 STORAGE",
  "03 走廊": "03 HALL",
  "04 装卸": "04 LOADING",
  // the phone (chat.ts, phone.ts, mirrors/phoneui.ts)
  林夏: "Summer",
  夏天快乐: "happy summer",
  发消息: "Message",
  "今天好开心～": "best day ever~",
  "5分钟前": "5 minutes ago",
  "对方正在输入...": "typing...",
  发送: "Send",
  取消: "Cancel",
  完成: "Done",
  滑动来关机: "slide to power off",
  现在: "now",
  "10月5日 星期一": "Monday, October 5",
  朋友动态: "Feed",
  "0 条新消息": "0 new messages",
  已拒绝: "Declined",
  接听: "Accept",
  挂断: "Decline",
  "发送给：": "Send to:",
  邀请你视频通话: "wants to video chat",
  周二: "TUE",
  日历: "Calendar",
  照片: "Photos",
  相机: "Camera",
  天气: "Weather",
  时钟: "Clock",
  备忘录: "Notes",
  音乐: "Music",
  邮件: "Mail",
  设置: "Settings",
  微信: "Instagram",
  浏览器: "Safari",
  信息: "Messages",
  // status bars the library draws itself, in 24-hour time
  "23:31": "11:31",
  "23:20": "11:20",
};

/** Switch the library's own words to English, and the hand lettering to an English hand first. Call once, before the
 *  first frame (again is harmless); `extra` is the work's own words (names and signs of its story). */
export function useEnglish(extra: Record<string, string> = {}) {
  Object.assign(LOCALE, EN, extra);
  if (!F.cn.startsWith("'Gochi Hand'")) F.cn = `'Gochi Hand', ${F.cn}`;
  if (!F.pen.startsWith("'Gochi Hand'")) F.pen = `'Gochi Hand', ${F.pen}`;
}
