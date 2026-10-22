import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-5f92fb8b",
  title: "奇葩小短剧",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1920,"height":1080},
  duration: 15,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  beats: [],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
};
export default project;
