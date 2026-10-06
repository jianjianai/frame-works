import type { AnimationProject } from "../../src/engine/types";

const project: AnimationProject = {
  id: "work-d1187f37",
  title: "unhappy - s0rrow",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 15,
  fps: 30,
  accent: "#7aa2f7",
  poster: "films/work-d1187f37/poster.svg",
  tags: [],
  status: "draft",
  beats: [],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
};
export default project;
