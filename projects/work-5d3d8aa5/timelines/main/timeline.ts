import type { Timeline } from "@frame/engine/types";

const timeline: Timeline = {
  name: "横屏",
  composition: {"width":1920,"height":1080},
  duration: 24,
  fps: 30,
  beats: [{"at":0,"title":"开场","detail":"逐字标题与三步数字卡"},{"at":4.8,"title":"观察","detail":"引线从现象中标出关键线索"},{"at":9.6,"title":"建模","detail":"圆形变菱形，连接成解释结构"},{"at":14.4,"title":"验证","detail":"滚动计数与路径箭头形成求证循环"},{"at":19.2,"title":"保持好奇","detail":"三要点归纳与结尾定格"}],
  subtitles: [],
  loadVisual: () => import("./visual.json"),
};
export default timeline;
