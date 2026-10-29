import type { Project } from "../../src/engine/types";

const project: Project = {
  id: "work-a603fe8d",
  title: "可是妈妈",
  subtitle: "",
  description: "《可是，妈妈》6moon9 副歌片段歌词 MV（竖屏 9:16，抖音）",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  loadAudio: () => import("./audio"),
  publishedAt: "2026-10-09T16:18:07.188Z",
  timelines: ["main"],
};
export default project;
