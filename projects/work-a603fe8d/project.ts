import type { AnimationProject } from "../../src/engine/types";

const project: AnimationProject = {
  id: "work-a603fe8d",
  title: "可是妈妈",
  subtitle: "",
  description: "《可是，妈妈》6moon9 副歌片段歌词 MV（竖屏 9:16，抖音）",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 39,
  fps: 30,
  accent: "#7aa2f7",
  poster: "films/work-a603fe8d/poster.svg",
  tags: [],
  status: "draft",
  beats: [{"at":0,"title":"前奏·妈","detail":""},{"at":6.16,"title":"俺滴亲娘","detail":""},{"at":9.2,"title":"副歌爆发","detail":""},{"at":13.94,"title":"咽成哑巴","detail":""},{"at":20.65,"title":"皱纹·护身符","detail":""},{"at":34.27,"title":"何时才能赎罪","detail":""},{"at":37.61,"title":"妈妈（结尾）","detail":""}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  loadAudioDocument: () => import("./audio.json"),
};
export default project;
