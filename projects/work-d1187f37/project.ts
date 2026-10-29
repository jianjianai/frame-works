import type { Project } from "../../src/engine/types";

const project: Project = {
  id: "work-d1187f37",
  title: "【重置版】unhappy - s0rrow",
  subtitle: "同一段聊天，两个视角",
  description: "《unhappy》剧情 MV（57 秒）：他发了一大段，她只回了一个「嗯」。聊天越来越短、她在朋友圈说今天好开心、上课对视她躲到书后，他发出「以后不打扰你了」，关机蒙进被子。反转（29.8 秒）：她在被窝里哭着把一整段话删掉——她的每个「嗯」后面都删掉了一整段话（朋友教她「回个嗯就行」，对视时她在书后面脸红到冒烟）。她终于把整段发出去；第二天早上他开机看到，回了「我也是」，再问一次周末去图书馆——这一次她回「嗯！！」。",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  experiences: ["剧情音乐短片","s0rrow","情绪运镜"],
  materials: ["s0rrow"],
  loadAudio: () => import("./audio"),
  posterTime: 1,
  publishedAt: "2026-10-19T10:21:33.757Z",
  timelines: ["main"],
};
export default project;
