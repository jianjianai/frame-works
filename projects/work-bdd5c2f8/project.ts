import type { Project } from "../../src/engine/types";

const project: Project = {
  id: "work-bdd5c2f8",
  title: "i have no friends",
  subtitle: "17岁生日，0条新消息",
  description: "抖音竖屏剧情 MV：生日这天他以为没人在乎他，直到他发现手机一直开着飞行模式。",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  loadAudio: () => import("./audio"),
  experiences: ["剧情音乐短片","s0rrow"],
  materials: ["s0rrow"],
  posterTime: 47.402,
  publishedAt: "2026-10-06T22:10:32.610Z",
  timelines: ["main"],
};
export default project;
