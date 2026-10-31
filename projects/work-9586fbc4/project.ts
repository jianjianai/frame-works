import type { Project } from "../../src/engine/types";

const project: Project = {
  id: "work-9586fbc4",
  title: "mirrors demo - s0rrow",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  experiences: ["剧情音乐短片","s0rrow"],
  materials: ["s0rrow"],
  loadAudio: () => import("./audio"),
  timelines: ["main"],
};
export default project;
