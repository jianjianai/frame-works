import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-3d80f743",
  title: "[v2.4]反乌托邦 - 乌托邦P",
  subtitle: "",
  description: "重写中。剧情见 故事.md。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 152,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  beats: [{"at":0,"title":"光里的女人","detail":"屏息：她飘向白，头顶碰到白散成灰（0.51）"},{"at":1.513,"title":"周磊往上飘","detail":"绝望：拎着公文包飘在路人头顶，手指松开"},{"at":2.513,"title":"她跑来","detail":"急：贴地的铁靴，跟着跑抬起来露出整个人"},{"at":3.613,"title":"险","detail":"刹住；镜头跟着公文包坠下去，4.01 砸在靴尖跟前"},{"at":4.133,"title":"跃起拽人","detail":"退到她身上→蹲→蹬地；5.01 攥住脚踝，5.51 拽回地面"},{"at":5.6,"title":"掏砖","detail":"心疼：跪着，镜头很慢地凑近；6.36 抽砖、6.76 递"},{"at":7.013,"title":"砖亮起来","detail":"暖：一下推上去；8.01 鼓进来，他哭着笑"},{"at":8.1,"title":"往前走","detail":"轻快：一步一拍，她在画面右边三分之一"},{"at":9.6,"title":"老钟","detail":"镜头顺着视线挤到两个人中间，10.01 举杯、挥手"},{"at":10.264,"title":"小石头","detail":"跑过来，她边走边摸头"},{"at":12.514,"title":"整座城","detail":"余韵→震撼：升起来，14.01 停在城上，一拍一个被白吸进去"}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  experiences: ["情绪运镜","剧情音乐短片","骨架剪纸动画","逐字歌词"],
  materials: ["剪纸角色"],
  loadAudioDocument: () => import("./audio.json"),
  loadAudio: () => import("./audio"),
  tempo: {"bpm":119.99,"firstBeat":0.013,"beatsPerBar":4},
};
export default project;
