import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-1768e4c8",
  title: "龙族",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1920,"height":1080},
  duration: 120,
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
