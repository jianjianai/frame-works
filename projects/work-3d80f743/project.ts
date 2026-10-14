import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-3d80f743",
  title: "反乌托邦 - 乌托邦P",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 228.367,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  loadAudioDocument: () => import("./audio.json"),
  experiences: ["情绪运镜","剧情音乐短片"],
};
export default project;
