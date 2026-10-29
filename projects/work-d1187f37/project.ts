import type { Project } from "../../src/engine/types";

const project: Project = {
  id: "work-d1187f37",
  title: "【youtube版】unhappy - s0rrow",
  subtitle: "Same chat, two sides",
  description: "《unhappy》重置版的 YouTube Shorts 英文本地化版（57 秒竖屏，剧情、镜头、音乐和时间点不变）：画面文字全部英文，歌词只留英文逐词卡拉 OK；钩子用第三人称「He sent a whole paragraph. / She just replied “k”」；「嗯」= “k”，最后的「嗯！！」= “ok!!”；微信换成 Instagram 私信样式（朋友圈 → 她的帖子「best day ever~ · 5 minutes ago」，「对方正在输入...」→ 她头像旁三个点的正在输入气泡）；林夏 → Summer、周屿 → Leo、小美 → Mia；12 小时制、英文日期；结尾引导「Like this and your crush will text you back instantly」+「Rewatch the first second: how many times did she start typing? Answer in the comments」。",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  experiences: ["剧情音乐短片","s0rrow","情绪运镜"],
  materials: ["s0rrow"],
  loadAudio: () => import("./audio"),
  posterTime: 1.7,
  publishedAt: "2026-10-20T02:45:08.376Z",
  timelines: ["main"],
};
export default project;
