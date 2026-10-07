import type { AnimationProject } from "../../src/engine/types";

const project: AnimationProject = {
  id: "work-d1187f37",
  title: "unhappy - s0rrow",
  subtitle: "同一段聊天，两个视角",
  description: "《unhappy》剧情 MV（57 秒）：他发了一大段，她只回了一个「嗯」。聊天越来越短、她在朋友圈说今天好开心、上课对视她躲到书后，他发出「以后不打扰你了」，关机蒙进被子。反转（29.8 秒）：她在被窝里哭着把一整段话删掉——她的每个「嗯」后面都删掉了一整段话（朋友教她「回个嗯就行」，对视时她在书后面脸红到冒烟）。她终于把整段发出去；第二天早上他开机看到，回了「我也是」，再问一次周末去图书馆——这一次她回「嗯！！」。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 57,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [{"at":0,"title":"钩子：我发了一大段，她只回了一个「嗯」","detail":"「对方正在输入…」闪了两次（彩蛋）"},{"at":4.163,"title":"三个月的聊天越来越短","detail":"往上翻到 7 月满屏长消息 → 快速划回 10 月「嗯」「哦」→ 点头像进朋友圈：5 分钟前「今天好开心～」"},{"at":8.252,"title":"上课对视，她躲到书后面","detail":"下课他拿草莓牛奶过去，她拉着朋友跑了"},{"at":12.341,"title":"以后不打扰你了","detail":"打了一段又删掉，最后只发这一句；关灯"},{"at":16.43,"title":"她那么好看，我那么丑","detail":"她的头像 → 黑屏里自己的脸，唱到 ugly 时低下头"},{"at":21.541,"title":"对方正在输入…又停了","detail":"倒影留到唱完 ugly，切在乐句尾的拍点上"},{"at":23.955,"title":"00:47 躺在床上","detail":"唱回声 Love me 时切入"},{"at":24.608,"title":"关机，蒙进被子","detail":"音乐轻微变闷（26.5–29.82）"},{"at":27.674,"title":"凌晨 00:52，只有一扇窗还亮着","detail":"缩在被子里的他 → 推出窗外，楼群里只有她的窗亮着（串灯），接反转"},{"at":29.82,"title":"反转：她也在哭","detail":"把一整段话一个字一个字删掉；她打了一大段，最后只发出一个「嗯」"},{"at":32.786,"title":"她的视角：那个「嗯」","detail":"收到他的消息尖叫、打了一大段 → 朋友说回个嗯就行 → 全删 → 停在发出的「嗯」"},{"at":36.875,"title":"书后面她脸红到冒烟","detail":"唱 You never ever pay attention to me"},{"at":39.43,"title":"这一次她全都发出去了","detail":"「其实，我喜欢你，很久很久了。」他已经关机，她等到睡着"},{"at":45.052,"title":"第二天早上，他开机","detail":"锁屏弹出她的整段话"},{"at":49.141,"title":"尾奏：「我也是」","detail":"他再问周末去图书馆 →「对方正在输入…」→「嗯！！」"},{"at":53.23,"title":"这一次的「嗯」，后面什么都没删","detail":"两人各自看着手机笑；彩蛋：回看第 1 秒"}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  experiences: ["剧情音乐短片","s0rrow"],
  materials: ["s0rrow"],
  loadAudioDocument: () => import("./audio.json"),
  loadAudio: () => import("./audio"),
  posterTime: 1,
};
export default project;
