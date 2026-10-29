import type { Project } from "../../src/engine/types";

const project: Project = {
  id: "work-d1187f37",
  title: "unhappy - s0rrow（副本）",
  subtitle: "小狗视角",
  description: "小狗视角剧情 MV（55 秒）：老狗豆豆以为主人不爱它了——他每天很晚回家、不陪它玩、总盯着手机里一只“漂亮小狗”。雨夜它叼着兔子玩偶离家出走，心脏病发作倒下。反转：他在送外卖攒心脏手术费；医生说术前别让它激动；手机里的小狗是捡到它那天的照片；他每天凌晨都在它睡着后摸它的头。结尾回到封面的树下。",
  renderer: "composition",
  engineProtocol: 1,
  accent: "#7aa2f7",
  tags: [],
  credits: [],
  load: () => import("./scene"),
  experiences: ["剧情音乐短片","s0rrow"],
  materials: ["s0rrow"],
  loadAudio: () => import("./audio"),
  posterTime: 0.6,
  status: "abandoned",
  timelines: ["main"],
};
export default project;
