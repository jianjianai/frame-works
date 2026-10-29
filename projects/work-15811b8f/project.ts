import type { Project } from "@frame/engine/types";

const project: Project = {
  id: "work-15811b8f",
  title: "示例：霓虹夜景特效",
  subtitle: "AFTER HOURS · 夜色有回响",
  description: "官方 PixiJS 特效示例：原创 Pixi特效 素材库、固定种子粒子、霓虹辉光、雨幕、光斑和波动转场；24秒横屏霓虹夜景，多个 Pixi scene 图层合成，120 BPM。仅修改本新作品与新素材库。",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  materials: ["Pixi特效"],
  posterTime: 3.5,
  status: "abandoned",
  timelines: ["main"],
};
export default project;
