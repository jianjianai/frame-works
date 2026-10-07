import type { AnimationProject } from "../../src/engine/types";

const project: AnimationProject = {
  id: "work-d1187f37",
  title: "unhappy - s0rrow（副本）",
  subtitle: "小狗视角",
  description: "小狗视角剧情 MV（55 秒）：老狗豆豆以为主人不爱它了——他每天很晚回家、不陪它玩、总盯着手机里一只“漂亮小狗”。雨夜它叼着兔子玩偶离家出走，心脏病发作倒下。反转：他在送外卖攒心脏手术费；医生说术前别让它激动；手机里的小狗是捡到它那天的照片；他每天凌晨都在它睡着后摸它的头。结尾回到封面的树下。",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 55.3,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [{"at":0,"title":"钩子：他已经7天没摸过我的头了","detail":"他回家径直走过豆豆，手里提着黄色头盔（彩蛋）"},{"at":4.163,"title":"他只盯着手机里的“漂亮小狗”","detail":"球被推回来；手机里的小狗其实是小时候的豆豆"},{"at":8.252,"title":"早上他走了，门在豆豆面前关上","detail":"叼着牵引绳等散步；在门口等了一整天，咳嗽"},{"at":12.341,"title":"豆豆叼起兔子离家出走","detail":"路过存钱罐、心脏病传单、头盔，从门缝溜出去"},{"at":16.43,"title":"雨夜 · 宠物店橱窗","detail":"漂亮的小狗们 vs 玻璃上又湿又丑的自己"},{"at":20.519,"title":"公交站 · 回忆捡到它那天","detail":"2016年，他打着伞把纸箱里的小狗抱回家"},{"at":24.608,"title":"心脏病发作 · 手电筒 · 豆豆——！","detail":"音乐变闷→他喊出名字时恢复；他穿着外卖骑手服"},{"at":28.697,"title":"反转：送外卖攒手术费","detail":"抱着它冲进宠物医院；心脏X光；拍下“豆豆的手术费”"},{"at":32.786,"title":"他的视角：同一个夜晚","detail":"32单、创可贴、医生说术前别让它激动；凌晨1:12摸它的头"},{"at":36.875,"title":"手机：那只小狗就是豆豆","detail":"捡到你的那天；存钱目标；再接一单→够了"},{"at":40.963,"title":"手术中","detail":"长凳上抱着兔子等到天亮；手术成功"},{"at":45.052,"title":"住院14天 · 醒来","detail":"它舔他的手，这一次他在它醒着时摸了它的头"},{"at":49.141,"title":"尾声 · 封面的树下","detail":"其实他每天都摸了，在你睡着以后；回看第2秒"}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  experiences: ["剧情音乐短片","s0rrow"],
  materials: ["s0rrow"],
  loadAudioDocument: () => import("./audio.json"),
  loadAudio: () => import("./audio"),
  posterTime: 0.6,
};
export default project;
