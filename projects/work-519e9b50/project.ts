import type { Project } from "@frame/engine/types";

const project: Project = {
  id: "work-519e9b50",
  title: "示例：三维产品展示",
  subtitle: "形体 · 光影 · 生机",
  description: "官方 Three.js 示例。新建独立「三维示例」素材库，演示 GLB 模型图层、骨骼动画、HDR 环境照明、参数化 three 资源、Canvas 2D 标题卖点。24 秒完整开场、主体和结尾。所有动画按绝对时间。",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  materials: ["三维示例"],
  posterTime: 9.5,
  status: "abandoned",
  timelines: ["main"],
};
export default project;
