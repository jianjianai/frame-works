import type { AnimationProject } from "../../src/engine/types";

const project: AnimationProject = {
  id: "work-bdd5c2f8",
  title: "i have no friends（重置版）",
  subtitle: "17岁生日，0条新消息",
  description: "《i have no friends》按首发复盘重置的 56.6 秒版：第一遍副歌讲清处境（钩子、0 条消息、闪回里同学藏横幅，唱到 hide away 时他自己打开飞行模式），接第三遍副歌（发送失败 ❗、自己点蜡烛许愿、吹灭），33.7 秒反转（控制中心里飞行模式是橙色的 → 99+ 消息 → 楼下的同学 → 蛋糕糊脸），最后 6 秒「谢谢你们。」发送成功 + 点赞和评论引导。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 56.613,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [{"at":0,"title":"冷开场 · 17岁生日","detail":"钩子：今天是我17岁生日 / 手机 0 条新消息"},{"at":4.44,"title":"0 条新消息","detail":"彩蛋：状态栏右上角 ✈"},{"at":8.61,"title":"闪回 · 藏横幅","detail":"今天上午 10:12：同学把横幅和礼物藏到身后"},{"at":11.743,"title":"躲起来：他自己开了飞行模式","detail":"唱到 away（12.00）左手拇指按下飞行模式（新增，交代动机）"},{"at":12.787,"title":"被嘲笑","detail":"彩蛋：惊喜策划群（不含寿星）"},{"at":17.084,"title":"回家路上","detail":"21:52，低头看着班群走回家（第二遍副歌和秋千段已删）"},{"at":21.135,"title":"发送失败 ❗","detail":"其实…今天是我生日：23.22 发送 → 24.00 ❗"},{"at":25.309,"title":"删除 · 点蜡烛","detail":"27.92 划火柴"},{"at":29.482,"title":"许愿 · 吹灭","detail":"希望…有人记得我；31.86 吹灭，音乐变闷"},{"at":33.656,"title":"反转 · 飞行模式","detail":"手电筒 → 控制中心里飞行模式是橙色的 → 37.31 关掉"},{"at":37.83,"title":"99+ 条消息","detail":"小雨：上课大家是在笑阿杰差点说漏嘴…不是笑你啦"},{"at":42.004,"title":"窗外 · 他们一直都在","detail":"X 脸消失"},{"at":46.178,"title":"蛋糕糊脸","detail":"46.70 糊脸 → 49.05 HAPPY BIRTHDAY"},{"at":50.352,"title":"谢谢你们。发送成功 ✓","detail":"和 ❗ 首尾呼应；51.92 / 52.44 / 52.96 三条回复"},{"at":53.482,"title":"点赞 + 评论引导","detail":"双击点赞「点赞的人，生日那天消息 99+」；「回看：他在第几秒开的飞行模式？答案打在评论区」"}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  loadAudioDocument: () => import("./audio.json"),
  loadAudio: () => import("./audio"),
  experiences: ["剧情音乐短片","s0rrow"],
  materials: ["s0rrow"],
  posterTime: 1.5,
};
export default project;
