import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-5d3d8aa5",
  title: "示例：知识讲解开场",
  subtitle: "",
  description: "官方示例：Canvas 2D + GSAP 动态文字与图形编排。原创动态文字素材库六个参数化资源，24 秒讲解“把复杂问题拆成三步”：观察、建模、验证。深墨绿与奶油白编辑设计，珊瑚橙强调。所有时间线暂停并按绝对时间 seek。禁止修改其他作品及素材库。",
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
