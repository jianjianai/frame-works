import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-5b227852",
  title: "[v2.3]反乌托邦 - 乌托邦P",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 15,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  beats: [],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  experiences: ["骨架剪纸动画","情绪运镜","剧情音乐短片"],
  materials: ["剪纸角色"],
  status: "abandoned",
};
export default project;
