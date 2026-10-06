import type { AnimationProject } from "../../src/engine/types";

const project: AnimationProject = {
  id: "work-bdd5c2f8",
  title: "i have no friends",
  subtitle: "17岁生日，0条新消息",
  description: "抖音竖屏剧情 MV：生日这天他以为没人在乎他，直到他发现手机一直开着飞行模式。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 99.1,
  fps: 30,
  accent: "#7aa2f7",
  poster: "films/work-bdd5c2f8/poster.svg",
  tags: [],
  status: "draft",
  beats: [{"at":0,"title":"冷开场 · 17岁生日","detail":"钩子：今天是我17岁生日 / 手机 0 条新消息"},{"at":4.44,"title":"0 条新消息","detail":"彩蛋：状态栏右上角 ✈"},{"at":8.61,"title":"闪回 · 藏横幅","detail":"同学把横幅和礼物藏到身后"},{"at":12.79,"title":"被嘲笑","detail":"彩蛋：惊喜策划群（不含寿星）"},{"at":16.96,"title":"Drop · I HAVE NO FRIENDS","detail":""},{"at":21.13,"title":"第37次查看","detail":""},{"at":25.31,"title":"朋友动态 · 躲起来","detail":""},{"at":29.48,"title":"全世界都在笑","detail":""},{"at":33.39,"title":"秋千 · 情侣走过","detail":"小雨在另一架秋千上偷看他"},{"at":37.6,"title":"牵手","detail":""},{"at":41.75,"title":"小雨挥手 他没看见","detail":""},{"at":44.55,"title":"嫉妒","detail":""},{"at":47.75,"title":"为什么不能是我","detail":"空秋千还在晃"},{"at":50.48,"title":"回家路上","detail":""},{"at":54.53,"title":"发送失败 ❗","detail":"其实…今天是我生日"},{"at":58.7,"title":"删除 · 点蜡烛","detail":""},{"at":62.87,"title":"许愿 · 吹灭","detail":"音乐变闷"},{"at":67.05,"title":"反转 · 飞行模式","detail":""},{"at":71.22,"title":"99+ 条消息","detail":""},{"at":75.4,"title":"窗外 · 他们一直都在","detail":"X 脸消失"},{"at":79.57,"title":"蛋糕糊脸","detail":""},{"at":83.74,"title":"尾声 · 分你一只耳机","detail":""},{"at":90.2,"title":"发送成功","detail":""},{"at":95.3,"title":"P.S. 回到第5秒","detail":""}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  loadAudioDocument: () => import("./audio.json"),
  loadAudio: () => import("./audio"),
  experience: "剧情音乐短片",
  publishedAt: "2026-10-06T20:27:29.969Z",
};
export default project;
