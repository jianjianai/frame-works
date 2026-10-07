import type { AnimationProject } from "../../src/engine/types";

const project: AnimationProject = {
  id: "work-6f68224f",
  title: "i have no friends（重置版）",
  subtitle: "",
  description: "《i have no friends》按复盘重置的版本：从 work-bdd5c2f8 复制，剪成约 55 秒（第一遍副歌 → 第三遍副歌 → 第四遍副歌反转 → 5 秒内收尾），反转放到 34 秒左右，每个镜头都推进剧情。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 55.5,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
};
export default project;
