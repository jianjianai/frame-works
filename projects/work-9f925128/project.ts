import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-9f925128",
  title: "迟到三年的赞 · stalk ur socials",
  subtitle: "s0rrow",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 46.5,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [{"at":0,"title":"1 手滑点赞","detail":"她三年前的照片，双击，爱心炸开"},{"at":1.94,"title":"2 他的脸","detail":"甩镜到他：屏幕光、瞪大眼睛、红绳"},{"at":3.24,"title":"3 取消赞","detail":"1 → 赞"},{"at":5.8,"title":"4 配文","detail":"如果他点赞，我就去表白。"},{"at":7.7,"title":"5 回忆·毕业那天","detail":"他在课桌下刷到这条"},{"at":10.8,"title":"6 回忆·走廊","detail":"她和篮球队的男生；他发了「算了。」"},{"at":14.92,"title":"7 她现在","detail":"往上划过三年：她和男朋友"},{"at":19.9,"title":"8 对方正在输入","detail":"停在 2023 年的聊天跳到最上面"},{"at":23.4,"title":"9 放大倒影","detail":"红绳 → 窗玻璃里 17 岁的他"},{"at":27.5,"title":"10 黑屏","detail":"黑屏里现在的他和倒影重叠"},{"at":30.34,"title":"11 她的那一晚","detail":"一遍遍刷新他的主页"},{"at":34.1,"title":"12 天亮","detail":"赞一直是 0"},{"at":38,"title":"13 我等过你","detail":"打了又删"},{"at":41.6,"title":"14 仅自己可见","detail":"照片从他屏幕上消失"},{"at":44.5,"title":"15 算了","detail":"她赞了他三年前的「算了。」；结尾引导"}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  experiences: ["s0rrow","剧情音乐短片"],
  materials: ["s0rrow"],
  loadAudioDocument: () => import("./audio.json"),
  tempo: {"bpm":124.59,"firstBeat":0.009,"beatsPerBar":4},
};
export default project;
