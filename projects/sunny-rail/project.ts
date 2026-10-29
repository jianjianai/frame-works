import type { Project } from "@frame/engine/types";

const project: Project = {
  id: "sunny-rail",
  title: "日光快线",
  subtitle: "把一座小岛，装进一段旅程。",
  description: "橙色列车伴着轻爵士驶过微缩岛屿。摄影机沿轨道外侧跟随，车轮、车厢、汽笛与轨缝节奏共同讲述一次从出发到归站的小旅行。",
  renderer: "three",
  accent: "#b9cfa4",
  poster: "films/sunny-rail/poster.webp",
  posterTime: 10.5,
  tags: ["3D 微缩场景","轨道摄影机","光照与阴影"],
  credits: ["微缩场景、列车模型与动作：本项目原创","原创轻爵士配乐：钢琴、尼龙吉他、低音提琴、颤音琴、单簧管与刷鼓；GeneralUser GS 乐器采样","Three.js；弧长车距、可见轮辐、外侧跟拍与真实距离驱动的轨缝音效"],
  timelines: ["main"],
  load: () => import("./scene"),
  loadAudio: () => import("./audio"),
};
export default project;
