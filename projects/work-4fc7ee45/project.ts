import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-4fc7ee45",
  title: "示例：Lottie 动效贴纸",
  subtitle: "",
  description: "官方示例：原创 CC0 Lottie 动效贴纸，叠加 Canvas 文字与背景，演示 offset/rate/loop、绝对时间播放和可参数化 Canvas Lottie 组件。只修改本新建作品及新建的 Lottie动效 素材库。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 21,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
};
export default project;
