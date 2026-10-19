// YouTube 版（英文本地化）：素材库里画死的中文字换成英文（素材库 draw.ts 的 LOCALE，text() / measure() 按整句查表），
// 手写体和标题字体换成英文手写体打头（中文字体留在后面兜底）。每一幕和歌词层都先导入这个文件，在画第一帧之前生效。
import { F, LOCALE } from "@materials/s0rrow/code/draw";

Object.assign(LOCALE, {
  // the classroom, her school things, the milk he buys her
  物理: "PHYSICS",
  "高二 · 上册": "GRADE 11",
  第3题: "Q3",
  "高二(3)班": "CLASS 11B",
  草莓牛奶: "MILK",
  // rooms and the street
  "10月": "OCT",
  早点睡: "sleep early!",
  "24H 便利店": "24H STORE",
  转角: "corner",
  "转 角 咖 啡": "CORNER CAFE",
  // her profile page (素材库 profileScreen)
  林夏: "Summer",
  夏天快乐: "happy summer",
  发消息: "Message",
  "23:31": "11:31",
  // the phone
  滑动来关机: "slide to power off",
  取消: "Cancel",
  现在: "now",
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
});

/** English hand lettering first (Gochi Hand), the Chinese fonts kept behind it for anything left over (once, even when
 *  the module is loaded again) */
if (!F.cn.startsWith("'Gochi Hand'")) F.cn = `'Gochi Hand', ${F.cn}`;
if (!F.pen.startsWith("'Gochi Hand'")) F.pen = `'Gochi Hand', ${F.pen}`;

/** the film's English display font for big words (the hook, the end card) */
export const EN = F.en;
export const MARKER = F.marker;
