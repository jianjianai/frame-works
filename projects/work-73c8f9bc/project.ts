import type { AnimationProject } from "@frame/engine/types";

const project: AnimationProject = {
  id: "work-73c8f9bc",
  title: "屏蔽 stalk-ur-socials-s0rrow",
  subtitle: "stalk ur socials · s0rrow",
  description: "",
  renderer: "composition",
  engineProtocol: 1,
  composition: {"width":1080,"height":1920},
  duration: 46.6,
  fps: 30,
  accent: "#7aa2f7",
  tags: [],
  status: "draft",
  beats: [{"at":0,"title":"1 发动态 · 评论区秒评","detail":"0.73 评论区出现，0.97 通知，镜头推到评论"},{"at":1.935,"title":"2 消息列表全是他","detail":"三年"},{"at":3.862,"title":"3 表情特写","detail":""},{"at":4.825,"title":"4 只关注了她","detail":""},{"at":7.233,"title":"5 拉黑","detail":""},{"at":9.4,"title":"6 关灯","detail":""},{"at":10.845,"title":"7 又亮了","detail":""},{"at":12.289,"title":"8 新消息：那个男生配不上你","detail":"镜头撞上那句话"},{"at":13.975,"title":"9 转场：拉出窗户 → 地图飞到另一座城 → 爸爸的小屋","detail":"她的表情特写删掉；14.32 溶成地图，15.66 冲进小屋"},{"at":15.877,"title":"10 另一部手机","detail":"同一时刻；Seeing you so happy 一开始就切过来"},{"at":19.272,"title":"11 岗亭背影","detail":""},{"at":23.125,"title":"12 熄屏倒影","detail":"反转：老人 → 爸爸"},{"at":27.7,"title":"13 解锁","detail":""},{"at":28.182,"title":"14 资料页 → 朋友圈一条横线","detail":"29.87 高音"},{"at":30.83,"title":"15 一根手指打字","detail":""},{"at":32.275,"title":"16 多穿点","detail":""},{"at":33.479,"title":"17 回忆：三年前","detail":"不让他看"},{"at":38.054,"title":"18 她哭了，拿起手机","detail":"坐在床上（和第 6 镜同一机位），伸手从枕头上拿起手机，低头看；39.35 顺着视线甩镜"},{"at":39.499,"title":"19 关掉不让他看","detail":"39.98 关掉"},{"at":40.462,"title":"20 返回聊天：爸，这么晚还不睡？","detail":""},{"at":41.425,"title":"21 他收到","detail":""},{"at":44.314,"title":"22 雪夜岗亭","detail":"结尾引导"}],
  subtitles: [],
  credits: [],
  load: () => import("./scene"),
  loadVisual: () => import("./visual.json"),
  materials: ["s0rrow"],
  experiences: ["剧情音乐短片","s0rrow","情绪运镜"],
  loadAudioDocument: () => import("./audio.json"),
  tempo: {"bpm":124.59,"firstBeat":0.009,"beatsPerBar":4},
};
export default project;
