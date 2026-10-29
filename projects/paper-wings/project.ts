import type { Project } from "@frame/engine/types";

const project: Project = {
  id: "paper-wings",
  title: "风的邮差",
  subtitle: "一封信，越过山海。",
  description: "纸飞机离开山间小镇，穿过树林与海湾，在灯塔下折回信封、落入信箱。钢琴与木管展开旅程，海风、投递与亮灯共同完成结尾。",
  renderer: "pixi",
  accent: "#edaa7e",
  poster: "films/paper-wings/poster.webp",
  posterTime: 25,
  tags: ["2D 分层插画","视差镜头","路径运动"],
  credits: ["插画与动作：本项目原创","原创室内乐配乐：钢琴、竖琴、长笛、弦乐与大提琴；GeneralUser GS 乐器采样","PixiJS + 连续摄影机；风、海浪与投递动作音效同轴混音"],
  timelines: ["main"],
  load: () => import("./scene"),
  loadAudio: () => import("./audio"),
};
export default project;
