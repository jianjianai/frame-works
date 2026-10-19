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
  beats: [{"at":0,"title":"光里的女人","detail":"屏息：她飘向白，头顶碰到白散成灰（0.51）"},{"at":1.513,"title":"周磊往上飘","detail":"绝望：拎着公文包飘在路人头顶，手指松开"},{"at":2.513,"title":"她跑来","detail":"急：贴地的铁靴，跟着跑抬起来露出整个人"},{"at":3.613,"title":"险","detail":"刹住；镜头跟着公文包坠下去，4.01 砸在靴尖跟前"},{"at":4.133,"title":"跃起拽人","detail":"退到她身上→蹲→蹬地；5.01 攥住脚踝，5.51 拽回地面"},{"at":5.6,"title":"掏砖","detail":"心疼：跪着，镜头很慢地凑近；6.36 抽砖、6.76 递"},{"at":7.013,"title":"砖亮起来","detail":"暖：一下推上去；8.01 鼓进来，他哭着笑"},{"at":8.1,"title":"往前走","detail":"轻快：一步一拍，她在画面右边三分之一"},{"at":9.6,"title":"老钟","detail":"镜头顺着视线挤到两个人中间，10.01 举杯、挥手"},{"at":10.264,"title":"小石头","detail":"跑过来，她边走边摸头"},{"at":12.514,"title":"整座城","detail":"余韵→震撼：升起来，14.01 停在城上，一拍一个被白吸进去"},{"at":16.013,"title":"扎进哑铃店","detail":"人声进来：顺着最高那栋楼扎下去，16.51 落在楼脚的哑铃店"},{"at":16.513,"title":"争夺","detail":"压抑：千斤的妈妈抱起最大的那只，一争一夺"},{"at":18.013,"title":"拴着的千斤","detail":"窒息：哑铃溶到她家门口，顺着红线抬上去"},{"at":19.71,"title":"挂上门锁","detail":"孤：拽三把，21.51 锁扣上"},{"at":21.84,"title":"看不清灯火","detail":"心酸：门关上，窗里的妈妈捂着脸；23.01 她抱着哑铃又飘起来"},{"at":24.013,"title":"开锁","detail":"决绝：高空，拔发卡开锁，扔掉哑铃，张开手"},{"at":26.013,"title":"楼顶的她","detail":"惊→急：看见、退两步、冲、27.51 扑出去"},{"at":28.013,"title":"请你等等我","detail":"在白的边上抱住；千斤挣、够白，29.01 手腕被拉下来"},{"at":29.79,"title":"请你等等我","detail":"千斤搂住她，两个人像叶子一样落到楼顶（31.01）"},{"at":32.013,"title":"两块五的签字笔","detail":"夜里，灯下写「活下去」；一排排砖；塞进靴筒"},{"at":36.013,"title":"妄想用它拯救你","detail":"靴筒对上切回楼顶，砖放进千斤手里，36.81 一坠"},{"at":38.013,"title":"顺便拯救我自己","detail":"「咚、咚」脱下铁靴，飘到天花板上的床，镜头转 180°"}],
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
