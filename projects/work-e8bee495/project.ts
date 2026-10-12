import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-e8bee495",
  title: "claude stalk ur socials",
  subtitle: "空着的位置 · 中英双语剧情 MV",
  description: "47秒手绘剧情短片：他在前任的新照片里看见自己的外套，赶到咖啡店后才发现，对面的椅子一直空着。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 47.203,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [{"at":0,"title":"她的新照片","detail":"","id":"opening"},{"at":1.935318,"title":"那件外套","detail":"","id":"patch"},{"at":3.861637,"title":"认出补丁","detail":"","id":"reaction"},{"at":5.787955,"title":"熟悉的咖啡馆","detail":"","id":"location"},{"at":7.714273,"title":"我来拿外套","detail":"","id":"message"},{"at":11.56691,"title":"赶去转角","detail":"","id":"street"},{"at":15.419547,"title":"窗外","detail":"","id":"arrival"},{"at":19.272183,"title":"隔着玻璃","detail":"","id":"glass"},{"at":23.12482,"title":"看清对面","detail":"","id":"revealMove"},{"at":26.977457,"title":"空着的位置","detail":"","id":"empty"},{"at":30.830093,"title":"她的视角","detail":"","id":"her"},{"at":34.68273,"title":"门铃","detail":"","id":"enter"},{"at":36.609048,"title":"取回外套","detail":"","id":"take"},{"at":38.535366,"title":"他没有离开","detail":"","id":"choice"},{"at":40.461685,"title":"坐下","detail":"","id":"sit"},{"at":42.388003,"title":"把手机放下","detail":"","id":"ending"}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  loadAudioDocument: () => import("./audio.json"),
  materials: ["s0rrow"],
  tempo: {"bpm":124.59,"firstBeat":0.009,"beatsPerBar":4},
  posterTime: 0.6,
};
export default project;
