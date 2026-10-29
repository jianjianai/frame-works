import type { Project } from "../../src/engine/types";

const project: Project = {
  id: "work-bdd5c2f8",
  title: "i have no friends（youtube版）",
  subtitle: "His 17th birthday. 0 new messages.",
  description: "《i have no friends》重置版的 YouTube Shorts 英文本地化版（56.6 秒竖屏）：画面文字全部英文，去掉中文歌词翻译，聊天改成 iMessage 样式，12 小时制，人名和班级本地化（Jay、Lily、Emma、Mom、Class 11B），红笔批注和结尾引导改成英文。剧情、镜头、音乐与重置版相同。",
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
  publishedAt: "2026-10-08T05:21:24.831Z",
  timelines: ["main"],
};
export default project;
