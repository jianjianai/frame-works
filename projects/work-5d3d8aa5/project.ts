import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-5d3d8aa5",
  title: "示例：知识讲解开场",
  subtitle: "观察 · 建模 · 验证",
  description: "官方示例：Canvas 2D + GSAP 动态文字与图形编排。原创动态文字素材库六个参数化资源，24 秒讲解“把复杂问题拆成三步”：观察、建模、验证。深墨绿与奶油白编辑设计，珊瑚橙强调。所有时间线暂停并按绝对时间 seek。禁止修改其他作品及素材库。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1920,"height":1080},
  duration: 24,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  beats: [{"at":0,"title":"开场","detail":"逐字标题与三步数字卡"},{"at":4.8,"title":"观察","detail":"引线从现象中标出关键线索"},{"at":9.6,"title":"建模","detail":"圆形变菱形，连接成解释结构"},{"at":14.4,"title":"验证","detail":"滚动计数与路径箭头形成求证循环"},{"at":19.2,"title":"保持好奇","detail":"三要点归纳与结尾定格"}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  materials: ["动态文字"],
  posterTime: 2.8,
  status: "abandoned",
};
export default project;
