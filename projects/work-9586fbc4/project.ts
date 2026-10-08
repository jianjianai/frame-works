import type { AnimationProject } from "../../src/engine/types";

const project: AnimationProject = {
  id: "work-9586fbc4",
  title: "mirrors demo - s0rrow",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1920,"height":1080},
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
};
export default project;
