import type { Project } from "@frame/engine/types";

const project: Project = {
  id: "work-3d80f743",
  title: "[v2草稿定稿]反乌托邦 - 乌托邦P",
  subtitle: "",
  description: "《引力》：这里的人一绝望就会飘起来，飘进天上的白光就烧成灰。全城都说扫天的秤砣是最沉的人，她把飘走的人一个个拽回地面，每晚却在石子上写「秤砣，明天见」塞进自己的靴子——没人知道她飘得最高。剧情稿见 故事.md；整首 152 秒的草稿（剧情、运镜、节奏、合成音效）已完成，画面待精细化。",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  loadAudio: () => import("./audio"),
  experiences: ["情绪运镜","剧情音乐短片"],
  status: "draft",
  timelines: ["main"],
};
export default project;
