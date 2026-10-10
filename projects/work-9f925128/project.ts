import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-9f925128",
  title: "stalk ur socials - s0rrow",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 60,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  experiences: ["s0rrow","剧情音乐短片"],
  materials: ["s0rrow"],
};
export default project;
