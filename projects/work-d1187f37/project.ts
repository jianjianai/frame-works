import type { AnimationProject } from "../../src/engine/types";

const project: AnimationProject = {
  id: "work-d1187f37",
  title: "【youtube版】unhappy - s0rrow",
  subtitle: "Same chat, two sides",
  description: "《unhappy》重置版的 YouTube Shorts 英文本地化版（57 秒竖屏，剧情、镜头、音乐和时间点不变）：画面文字全部英文，歌词只留英文逐词卡拉 OK；钩子用第三人称「He sent a whole paragraph. / She just replied “k”」；「嗯」= “k”，最后的「嗯！！」= “ok!!”；微信换成 Instagram 私信样式（朋友圈 → 她的帖子「best day ever~ · 5 minutes ago」，「对方正在输入...」→ 她头像旁三个点的正在输入气泡）；林夏 → Summer、周屿 → Leo、小美 → Mia；12 小时制、英文日期；结尾引导「Like this and your crush will text you back instantly」+「Rewatch the first second: how many times did she start typing? Answer in the comments」。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 57,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  beats: [{"at":0,"title":"钩子：He sent a whole paragraph. / She just replied “k”","detail":"她的「正在输入」三个点闪了两次（彩蛋），“k” 落在同一个位置"},{"at":4.163,"title":"三个月的聊天越来越短","detail":"往上翻到 7 月满屏长消息（Jul 12）→ 点她的头像进她的帖子：5 minutes ago「best day ever~」"},{"at":8.252,"title":"上课对视，她躲到书后面","detail":"回忆（老式屏幕竖线）；PHYSICS 课本挡脸；下课他拿草莓牛奶过去，她拉着朋友跑了"},{"at":12.341,"title":"I won’t bother you anymore.","detail":"打了一段（Summer, did I do something to upset you?…）又删掉，最后只发这一句；关灯"},{"at":16.43,"title":"她那么好看，我那么丑","detail":"他按拍翻她的相册（草莓牛奶、合照、窗边），停在向日葵头像上直到 pretty 唱完 → 黑屏里自己的脸，唱到 ugly 时低下头"},{"at":21.541,"title":"正在输入…又停了","detail":"一个不切的运镜：他流泪 → 镜头穿过他的眼睛 → 22.56 手机：聚光在 “k” 上，她的正在输入气泡在他最后一条消息下面闪两次（黄圈，气泡不被压暗）→ 23.59 镜头钻进 “k” 直到占满画面"},{"at":24.608,"title":"关机，蒙进被子","detail":"一下划掉 slide to power off（24.86 黑屏）→ 25.12 蒙进被子；音乐只在被子里变闷（25.28–26.60）"},{"at":26.396,"title":"12:52 AM 镜头退出他的窗户，灯灭","detail":"从他房间拉出窗外 → 27.16 他的灯灭 → 甩过街，推进唯一亮着的窗：她的"},{"at":28.1,"title":"反转：她也在哭","detail":"穿过窗户进她房间（标签翻成 Her side），镜头一路慢慢推近她的哭脸"},{"at":29.719,"title":"那段话，她不敢发","detail":"手机近景看清整段话（That’s not true!! … The truth is I…）；31.25 拇指按住发送键一直没松手 → 32.02 划回主页（草莓牛奶壁纸）→ 切进她的回忆"},{"at":32.786,"title":"她的视角：那个 “k”","detail":"收到他的消息尖叫、打了一大段 → 34.57 点开 Mia 的消息，荧光笔划出 just say “k” → 返回、全删 → 36.36 发出 “k”"},{"at":37.386,"title":"那天上课，她的视角","detail":"书后面她脸红到冒烟 → 38.41 After school 她偷偷拿走他留下的草莓牛奶"},{"at":39.43,"title":"这一次她全都发出去了","detail":"从主页点开 Instagram，把没发的那段又改又加：The truth is, I like you. For a long, long time.（I like you 打了、删了、又打上，荧光笔）；他已经关机"},{"at":43.6,"title":"没有回音","detail":"时钟跳到 1:30 AM、3:00 AM，她又发 are you asleep? 和 goodnight.，屏幕熄掉"},{"at":44.796,"title":"那条街：她的灯也灭了，天亮了","detail":"45.05 她的灯灭（和 Next morning 同一拍），夜色延时到早晨 → 45.82 推进他的窗：7:10 AM"},{"at":46.33,"title":"他开机","detail":"46.59 开机，锁屏掉下她的三条消息（6h / 5h / 4h ago）→ 47.61 点开 → 荧光笔划出 The truth is, I like you."},{"at":49.141,"title":"尾奏：他笑开","detail":"暖光一闪、镜头弹一下"},{"at":49.908,"title":"一个镜头收和发","detail":"他发 me too（50.67）、再问 so… library this weekend?（52.21）→ 她的正在输入气泡（黄圈）→ 53.23 ok!! 落在同一个位置（黄色脉冲）→ 爱心"},{"at":54.763,"title":"早晨的那条街","detail":"两扇窗都照着太阳，爱心飘到街中间；镜头后拉；54.89 双击点赞 + Like this and your crush will text you back instantly，评论卡 Rewatch the first second: how many times did she start typing? Answer in the comments"}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  experiences: ["剧情音乐短片","s0rrow","情绪运镜"],
  materials: ["s0rrow"],
  loadAudioDocument: () => import("./audio.json"),
  loadAudio: () => import("./audio"),
  posterTime: 1.7,
  tempo: {"bpm":117.39,"firstBeat":0.0737,"beatsPerBar":4},
  publishedAt: "2026-10-20T02:45:08.376Z",
};
export default project;
