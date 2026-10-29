import type { Project } from "@frame/engine/types";

const project: Project = {
  id: "work-5b227852",
  title: "[v2.3]反乌托邦 - 乌托邦P",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  experiences: ["骨架剪纸动画","情绪运镜","剧情音乐短片"],
  materials: ["剪纸角色"],
  status: "abandoned",
  timelines: ["main"],
};
export default project;
