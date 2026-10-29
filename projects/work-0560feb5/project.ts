import type { Project } from "@frame/engine/types";

const project: Project = {
  id: "work-0560feb5",
  title: "超越对话｜从聊天机器人到 Agent",
  subtitle: "语言，开始变成行动",
  description: "原创科技知识短片。用连续三维动画解释规则、学习、注意力、后训练、推理与智能体闭环；以不同顶尖系统的公开能力示意收束。包含逐句实测中文旁白、可关闭字幕和原创五轨混音。参考资料及能力边界见 production/sources.md。",
  renderer: "three",
  engineProtocol: 1,
  accent: "#65e5ed",
  poster: "films/work-0560feb5/poster.png",
  posterTime: 5,
  tags: ["知识科普","AI","Agent","原创音乐","3D","中文旁白","科技 · AI 原理"],
  status: "abandoned",
  credits: ["导演脚本、三维动画、音乐与声音设计：本作品原创","旁白：Kokoro 中文 zm_yunyang（Apache-2.0），逐句实测对齐","图形为机制及能力示意，不是模型内部实拍或产品录屏","资料核实日期：2026-10-01；完整来源索引见本作品的制作资料目录","不同系统能力与条件不同，不表示单一模型无所不能"],
  timelines: ["main"],
  load: () => import("./scene"),
};
export default project;
