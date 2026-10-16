import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-b80f18ef",
  title: "[v2.2]反乌托邦 - 乌托邦P",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 15,
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
