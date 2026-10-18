import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-3d80f743",
  title: "[v2.4]反乌托邦 - 乌托邦P",
  subtitle: "",
  description: "重写中。剧情见 故事.md。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 152,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  beats: [],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  experiences: ["情绪运镜","剧情音乐短片","骨架剪纸动画","逐字歌词"],
  materials: ["剪纸角色"],
  loadAudioDocument: () => import("./audio.json"),
  tempo: {"bpm":119.99,"firstBeat":0.013,"beatsPerBar":4},
};
export default project;
