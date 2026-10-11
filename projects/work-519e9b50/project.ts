import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-519e9b50",
  title: "示例：三维产品展示",
  subtitle: "形体 · 光影 · 生机",
  description: "官方 Three.js 示例。新建独立「三维示例」素材库，演示 GLB 模型图层、骨骼动画、HDR 环境照明、参数化 three 资源、Canvas 2D 标题卖点。24 秒完整开场、主体和结尾。所有动画按绝对时间。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1920,"height":1080},
  duration: 24,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [{"at":0,"title":"形体","detail":"Avocado 直接模型层，旋转与 HDR 环境照明","id":"form"},{"at":6,"title":"光影","detail":"three 场景调用产品转台资源","id":"light"},{"at":13,"title":"生机","detail":"Fox Walk 骨骼动画与缓慢转动","id":"motion"},{"at":19,"title":"让灵感，有形","detail":"立体取景框标志与收尾标题","id":"closing"}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  materials: ["三维示例"],
  posterTime: 9.5,
};
export default project;
