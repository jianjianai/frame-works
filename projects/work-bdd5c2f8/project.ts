import type { Project } from "../../src/engine/types";

const project: Project = {
  id: "work-bdd5c2f8",
  title: "i have no friends（重置版）",
  subtitle: "17岁生日，0条新消息",
  description: "《i have no friends》按首发复盘重置的 56.6 秒版：第一遍副歌讲清处境（钩子、0 条消息、闪回里同学藏横幅、他唱到 hide away 时拉起帽子），接第三遍副歌（发送失败 ❗、自己点蜡烛许愿、吹灭），33.7 秒反转（控制中心里飞行模式是橙色的 → 99+ 消息 → 楼下的同学 → 蛋糕糊脸），最后 6 秒「谢谢你们。」发送成功 + 点赞和评论引导。",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  loadAudio: () => import("./audio"),
  experiences: ["剧情音乐短片","s0rrow"],
  materials: ["s0rrow"],
  posterTime: 1.5,
  publishedAt: "2026-10-08T03:37:14.327Z",
  timelines: ["main"],
};
export default project;
