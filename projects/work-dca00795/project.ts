import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-dca00795",
  title: "[v2.1拉完了]反乌托邦 - 乌托邦P",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 22,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  experiences: ["情绪运镜","剧情音乐短片"],
  loadAudioDocument: () => import("./audio.json"),
  tempo: {"bpm":119.99,"firstBeat":0.013,"beatsPerBar":4},
  publishedAt: "2026-10-16T14:48:13.626Z",
};
export default project;
