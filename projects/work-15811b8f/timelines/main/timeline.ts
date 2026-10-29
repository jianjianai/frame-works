import type { Timeline } from "@frame/engine/types";

const timeline: Timeline = {
  name: "横屏",
  composition: {"width":1920,"height":1080},
  duration: 24,
  fps: 30,
  tempo: {"bpm":120,"firstBeat":0,"beatsPerBar":4},
  beats: [{"at":0,"title":"01 · 入夜","detail":"光斑与城市点亮，主标题显现"},{"at":6,"title":"02 · 雨中脉冲","detail":"波纹置换转场，雨幕随拍提速"},{"at":14,"title":"03 · 夜空盛放","detail":"每小节烟花和火花"},{"at":20,"title":"04 · 留住微光","detail":"回到夜城，品牌落版与余音"}],
  subtitles: [],
  loadVisual: () => import("./visual.json"),
  loadAudioDocument: () => import("./audio.json"),
};
export default timeline;
