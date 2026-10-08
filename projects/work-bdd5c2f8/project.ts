import type { AnimationProject } from "../../src/engine/types";

const project: AnimationProject = {
  id: "work-bdd5c2f8",
  title: "i have no friends（重置版）",
  subtitle: "17岁生日，0条新消息",
  description: "《i have no friends》按首发复盘重置的 56.6 秒版：第一遍副歌讲清处境（钩子、0 条消息、闪回里同学藏横幅、他唱到 hide away 时拉起帽子），接第三遍副歌（发送失败 ❗、自己点蜡烛许愿、吹灭），33.7 秒反转（控制中心里飞行模式是橙色的 → 99+ 消息 → 楼下的同学 → 蛋糕糊脸），最后 6 秒「谢谢你们。」发送成功 + 点赞和评论引导。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 56.613,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [{"at":0,"title":"冷开场 · 17岁生日","detail":"钩子：今天是我17岁生日 / 手机 0 条新消息"},{"at":4.44,"title":"0 条新消息","detail":"彩蛋：状态栏右上角 ✈；班群里「阿杰 撤回了一条消息」6.06 黄色脉冲"},{"at":8.61,"title":"闪回 · 藏横幅","detail":"8.35 倒影匹配剪辑进回忆；今天上午 10:12：同学看到他，把横幅和礼物藏到身后"},{"at":10.7,"title":"拉起帽子","detail":"唱到 hide away 他拉起帽子；11.74 上课铃响，同学回教室，他戴着帽子跟着走进去"},{"at":12.787,"title":"说漏嘴 · 被嘲笑","detail":"阿杰站起来差点说漏（气泡里是蛋糕）、捂住嘴，全班笑的是阿杰；14.87 在他的感受里笑声逼近"},{"at":17.084,"title":"回家路上","detail":"21:52 蛋糕店橱窗；19.05 朝镜头走来，一盏盏路灯从身边经过"},{"at":21.135,"title":"发送失败 ❗","detail":"其实…今天是我生日：23.22 发送 → 24.00 ❗"},{"at":25.309,"title":"删除 · 点蜡烛","detail":"27.92 划火柴"},{"at":29.482,"title":"许愿 · 吹灭","detail":"希望…有人记得我；31.86 吹灭，音乐变闷"},{"at":33.656,"title":"反转 · 飞行模式","detail":"34.70 打开手电筒 → 35.22 发现飞行模式是橙色的 → 37.31 关掉"},{"at":37.83,"title":"99+ 条消息","detail":"通知砸进来 → 38.87 班长那条 + 走廊重放 → 39.92 小雨那条 + 教室重放 → 40.96 妈妈那条，窗外手电光"},{"at":42.004,"title":"窗外 · 他们一直都在","detail":"越过他肩膀推向窗户 → 43.04 往下看，X 脸每半拍掉一个 → 45.13 仰拍他的窗户：哭→笑→跑去下楼"},{"at":46.178,"title":"蛋糕糊脸","detail":"冲出单元门 → 46.70 糊脸特写 → 47.75 大笑 → 48.27 大家围着他唱歌 → 49.83 一起吹灭 17"},{"at":50.352,"title":"谢谢你们。发送成功 ✓","detail":"和 ❗ 首尾呼应；51.92 / 52.44 / 52.96 三条回复"},{"at":53.482,"title":"点赞 + 评论引导","detail":"双击点赞「点赞的人，生日那天消息 99+」；「回看：第几秒就能看出他开着飞行模式？答案打在评论区」"}],
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
