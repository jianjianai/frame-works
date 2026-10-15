import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-3d80f743",
  title: "[第2版]反乌托邦 - 乌托邦P",
  subtitle: "",
  description: "第二版《引力》：目前只有剧情稿（故事.md），分镜和草稿待重做。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 152,
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
  tempo: {"bpm":119.99,"firstBeat":0.013,"beatsPerBar":4},
};
export default project;
