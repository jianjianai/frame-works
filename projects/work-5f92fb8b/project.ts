import type { Project } from "@frame/engine/types";

const project: Project = {
  id: "work-5f92fb8b",
  title: "奇葩小短剧",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  experiences: ["AI生视频现实题材温情短片"],
  timelines: ["main"],
};
export default project;
