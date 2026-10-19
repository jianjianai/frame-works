import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-4fc7ee45",
  title: "示例：Lottie 动效贴纸",
  subtitle: "让每一帧，都有表情。",
  description: "官方示例：原创 CC0 Lottie 动效贴纸，叠加 Canvas 文字与背景，演示 offset/rate/loop、绝对时间播放和可参数化 Canvas Lottie 组件。只修改本新建作品及新建的 Lottie动效 素材库。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 21,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  beats: [{"at":0,"title":"让灵感动起来","detail":"笑脸贴纸开场；Canvas 文字和背景","id":"hello"},{"at":5.65,"title":"喜欢，就点个赞","detail":"红心错相循环；点赞计数组件","id":"react"},{"at":11.65,"title":"好点子正在加载","detail":"加速循环 Lottie 与加载进度卡","id":"make"},{"at":16.15,"title":"心动已收到","detail":"勾选、收藏提示及完整结尾","id":"again"}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  materials: ["Lottie动效"],
  posterTime: 2.4,
  status: "abandoned",
};
export default project;
