import type { Project } from "@frame/engine/types";

const project: Project = {
  id: "work-1768e4c8",
  title: "龙族",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  timelines: ["main"],
};
export default project;
