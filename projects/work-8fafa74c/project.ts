import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-8fafa74c",
  title: "回家（AI 实测）",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 8,
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
