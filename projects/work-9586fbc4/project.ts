import type { AnimationProject } from "../../src/engine/types";

const project: AnimationProject = {
  id: "work-9586fbc4",
  title: "mirrors demo - s0rrow",
  subtitle: "",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 57.5,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [{"at":0.342,"title":"A 段：挂满镜子","detail":"歌曲 0:00 起，人声 0.34s 进；前两句伴奏稀疏，4.1s 鼓进。讲清处境（约 16 秒）"},{"at":16.514,"title":"B 段：自我怀疑","detail":"Ooh I like the feeling of my doubts / couch / oh well ×3"},{"at":24.959,"title":"C 段：我样样都行","detail":"I know what you want from me … wedding ring"},{"at":32.555,"title":"桥段：I have a question（反转）","detail":"音乐换段，反转放这里（约 32.5 秒）"},{"at":44.892,"title":"you make me like my face so much","detail":"兑现：最适合放面部特写"},{"at":53.247,"title":"A 段回来：首尾呼应","detail":"伴奏回到稀疏；56.9s 鼓重新进入，57.2s 收尾"}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  experiences: ["剧情音乐短片","s0rrow"],
  materials: ["s0rrow"],
  loadAudioDocument: () => import("./audio.json"),
  loadAudio: () => import("./audio"),
  publishedAt: "2026-10-08T20:26:45.403Z",
};
export default project;
