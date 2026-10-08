import type { AnimationProject } from "../../src/engine/types";

const project: AnimationProject = {
  id: "work-bdd5c2f8",
  title: "i have no friends（youtube版）",
  subtitle: "His 17th birthday. 0 new messages.",
  description: "《i have no friends》重置版的 YouTube Shorts 英文本地化版（56.6 秒竖屏）：画面文字全部英文，去掉中文歌词翻译，聊天改成 iMessage 样式，12 小时制，人名和班级本地化（Jay、Lily、Emma、Mom、Class 11B），红笔批注和结尾引导改成英文。剧情、镜头、音乐与重置版相同。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 56.613,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [{"at":0,"title":"在家过生日","detail":"钩子字：今天是我17岁生日 / 手机 0 条新消息；他一个人戴着派对帽对着一根蜡烛，0.30 自己吹响派对喇叭，纸卷软软垂下去；眼睛移向手机，镜头往下甩"},{"at":1.83,"title":"俯拍桌面","detail":"暖光圈里的纸杯蛋糕、6 顶装只剩 5 顶的派对帽、没拉过的礼花筒、点蜡烛的火柴、窗格月光；2.61 点亮屏幕 → 推进手机"},{"at":3.4,"title":"手机 0 条新消息","detail":"手机平躺在桌上：下拉刷新还是 0；4.44 凑近「0 条新消息」；5.48 23:58→23:59；6.79 息屏，黑屏里映出他；彩蛋：状态栏右上角 ✈"},{"at":8.61,"title":"闪回 · 藏横幅","detail":"8.35 倒影匹配剪辑进回忆；今天上午 10:12：同学看到他，把横幅和礼物藏到身后"},{"at":10.7,"title":"拉起帽子","detail":"唱到 hide away 他拉起帽子；11.74 上课铃响，同学回教室，他戴着帽子跟着走进去"},{"at":12.787,"title":"说漏嘴 · 被嘲笑","detail":"阿杰站起来差点说漏（气泡里是蛋糕）、捂住嘴，全班笑的是阿杰；14.87 在他的感受里笑声逼近"},{"at":17.084,"title":"回家路上","detail":"21:52 蛋糕店橱窗；19.05 朝镜头走来，一盏盏路灯从身边经过"},{"at":21.135,"title":"发送失败 ❗","detail":"其实…今天是我生日：23.22 发送 → 24.00 ❗"},{"at":25.309,"title":"删除 · 点蜡烛","detail":"27.92 划火柴"},{"at":29.482,"title":"许愿 · 吹灭","detail":"希望…有人记得我；31.86 吹灭，音乐变闷"},{"at":33.656,"title":"反转 · 飞行模式","detail":"34.70 打开手电筒 → 35.22 发现飞行模式是橙色的 → 37.31 关掉"},{"at":37.83,"title":"99+ 条消息","detail":"通知砸进来 → 38.87 班长那条 + 走廊重放 → 39.92 小雨那条 + 教室重放 → 40.96 妈妈那条，窗外手电光"},{"at":42.004,"title":"窗外 · 他们一直都在","detail":"越过他肩膀推向窗户 → 43.04 往下看，X 脸每半拍掉一个 → 45.13 仰拍他的窗户：哭→笑→跑去下楼"},{"at":46.178,"title":"蛋糕糊脸","detail":"冲出单元门 → 46.70 糊脸特写 → 47.75 大笑 → 48.27 大家围着他唱歌 → 49.83 一起吹灭 17"},{"at":50.352,"title":"谢谢你们。发送成功 ✓","detail":"和 ❗ 首尾呼应；51.92 / 52.44 / 52.96 三条回复"},{"at":53.482,"title":"点赞 + 评论引导","detail":"双击点赞「点赞的人，生日那天消息 99+」；「回看：第几秒就能看出他开着飞行模式？答案打在评论区」"}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  loadAudioDocument: () => import("./audio.json"),
  loadAudio: () => import("./audio"),
  experiences: ["剧情音乐短片","s0rrow"],
  materials: ["s0rrow"],
  posterTime: 1.5,
};
export default project;
