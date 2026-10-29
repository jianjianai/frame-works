import type { Project } from "@frame/engine/types";

const project: Project = {
  id: "work-8fafa74c",
  title: "回家（AI 实测）",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  status: "abandoned",
  timelines: ["main"],
};
export default project;
