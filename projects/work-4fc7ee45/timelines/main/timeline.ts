import type { Timeline } from "@frame/engine/types";

const timeline: Timeline = {
  name: "竖屏",
  composition: {"width":1080,"height":1920},
  duration: 21,
  fps: 30,
  beats: [{"at":0,"title":"让灵感动起来","detail":"笑脸贴纸开场；Canvas 文字和背景","id":"hello"},{"at":5.65,"title":"喜欢，就点个赞","detail":"红心错相循环；点赞计数组件","id":"react"},{"at":11.65,"title":"好点子正在加载","detail":"加速循环 Lottie 与加载进度卡","id":"make"},{"at":16.15,"title":"心动已收到","detail":"勾选、收藏提示及完整结尾","id":"again"}],
  subtitles: [],
  loadVisual: () => import("./visual.json"),
};
export default timeline;
