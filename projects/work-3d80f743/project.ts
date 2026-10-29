import type { Project } from "@frame/engine/types";

const project: Project = {
  id: "work-3d80f743",
  title: "【被否】反乌托邦 - 乌托邦P 1",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  loadAudio: () => import("./audio"),
  experiences: ["情绪运镜","剧情音乐短片"],
  status: "abandoned",
  timelines: ["main"],
};
export default project;
