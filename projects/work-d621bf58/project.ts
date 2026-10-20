import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-d621bf58",
  title: "一分半",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1920,"height":1080},
  duration: 90,
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
