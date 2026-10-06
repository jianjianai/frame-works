import type { AnimationProject } from "../../src/engine/types";

const project: AnimationProject = {
  id: "work-a603fe8d",
  title: "可是妈妈",
  subtitle: "",
  description: "《可是，妈妈》6moon9 副歌片段歌词 MV（竖屏 9:16，抖音）",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 40,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [{"at":0,"title":"来电·第3次没接","detail":""},{"at":2.9,"title":"手机·打字又删掉","detail":""},{"at":5.85,"title":"微信提示音·亮屏","detail":""},{"at":6.16,"title":"妈妈的语音","detail":""},{"at":9.12,"title":"眼泪落在屏幕上","detail":""},{"at":9.2,"title":"副歌·牵手长大","detail":""},{"at":13.94,"title":"分屏·疼了不说","detail":""},{"at":17.01,"title":"生日蛋糕","detail":""},{"at":20.65,"title":"折护身符","detail":""},{"at":23.7,"title":"离家·春节","detail":""},{"at":27.39,"title":"电话·挺好的","detail":""},{"at":30.69,"title":"病房·心电图","detail":""},{"at":34.27,"title":"倒带","detail":""},{"at":37.61,"title":"结尾·光里的妈妈","detail":""}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  loadAudioDocument: () => import("./mix.json"),
  loadAudio: () => import("./audio"),
};
export default project;
