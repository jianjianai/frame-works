import type { Project } from "@frame/engine/types";

const project: Project = {
  id: "work-3d80f743",
  title: "[v2.4]反乌托邦 - 乌托邦P",
  subtitle: "",
  description: "重写中。剧情见 故事.md。",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  experiences: ["情绪运镜","剧情音乐短片","骨架剪纸动画","逐字歌词"],
  materials: ["剪纸角色"],
  loadAudio: () => import("./audio"),
  timelines: ["main"],
};
export default project;
