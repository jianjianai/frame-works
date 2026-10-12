import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-9f925128",
  title: "迟到三年的赞 · stalk ur socials",
  subtitle: "s0rrow",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 46.9,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [{"at":0,"title":"1 手滑点赞","detail":"她三年前的照片，双击，爱心炸开"},{"at":1.21,"title":"2 配文","detail":"镜头冲向简介：如果他点赞，我就去表白。"},{"at":2.9,"title":"3 他的脸","detail":"惊讶：瞪大眼睛、「!!」、冷汗"},{"at":4.22,"title":"4 取消赞","detail":"1 → 赞；松口气，再看一眼配文"},{"at":7.7,"title":"5 回忆·毕业那天","detail":"他点了赞，抬头看她"},{"at":10.84,"title":"6 回忆·走廊","detail":"她和朋友笑成一团（他以为在笑他）；他取消赞，发「算了。」"},{"at":15.42,"title":"7 她现在","detail":"往上划过三年：她和男朋友"},{"at":19.75,"title":"8 对方正在输入","detail":"停在 2023 年的聊天跳到最上面"},{"at":23.13,"title":"9 她也醒着","detail":"镜子一样翻过去；打了「我等过你」又删掉"},{"at":28.3,"title":"10 锁屏","detail":"她和男朋友；黑屏里她的脸"},{"at":30.34,"title":"11 她的回忆·走廊","detail":"他的赞来了又没了"},{"at":34.08,"title":"12 她的那一晚","detail":"「你看到了吗？」；「算了。」；天亮"},{"at":37.93,"title":"13 仅自己可见","detail":"拇指停在删除，移到仅自己可见"},{"at":41.55,"title":"14 作品已设为私密","detail":"他那边，照片没了"},{"at":44.43,"title":"15 算了。","detail":"她赞了他三年前的「算了。」；结尾引导"}],
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
