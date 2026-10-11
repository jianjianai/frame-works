import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-519e9b50",
  title: "示例：三维产品展示",
  subtitle: "",
  description: "官方 Three.js 示例。新建独立「三维示例」素材库，演示 GLB 模型图层、骨骼动画、HDR 环境照明、参数化 three 资源、Canvas 2D 标题卖点。24 秒完整开场、主体和结尾。所有动画按绝对时间。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1920,"height":1080},
  duration: 24,
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
