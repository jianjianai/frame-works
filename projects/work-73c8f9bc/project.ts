import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-73c8f9bc",
  title: "stalk ur socials",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 160,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  materials: ["s0rrow"],
  experiences: ["剧情音乐短片","s0rrow"],
};
export default project;
