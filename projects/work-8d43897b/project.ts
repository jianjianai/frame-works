import type { Project } from "@frame/engine/types";

const project: Project = {
  id: "work-8d43897b",
  title: "刷了一晚上，为什么还是没休息够？",
  subtitle: "你以为在休息，其实还在追下一条。",
  description: "90秒原创竖屏知识动画：跟随点点从无限内容流水线走回自己的房间。连续角色动画、原创电子配乐、中文旁白和字幕。研究来源与许可见本作品 production 目录中的 sources.md。",
  renderer: "canvas",
  engineProtocol: 1,
  accent: "#ffc969",
  poster: "films/work-8d43897b/poster.svg",
  posterTime: 36,
  tags: ["知识动画","休息","短视频","注意力","原创"],
  status: "abandoned",
  credits: ["视觉、动画、音乐与音效：本工程原创","中文旁白：Kokoro zm_yunxi（Apache-2.0）","研究：Tam & Inzlicht, 2024, DOI 10.1037/xge0001639","研究边界与原始来源：本作品 production 目录中的 sources.md"],
  timelines: ["main"],
  load: () => import("./scene"),
  loadAudio: () => import("./audio"),
};
export default project;
