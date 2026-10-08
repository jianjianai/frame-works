import type { AnimationProject } from "../../src/engine/types";

const project: AnimationProject = {
  id: "work-a85681f0",
  title: "i have no friends（youtube版）",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 56.613,
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
