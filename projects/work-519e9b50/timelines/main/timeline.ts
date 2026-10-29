import type { Timeline } from "@frame/engine/types";

const timeline: Timeline = {
  name: "横屏",
  composition: {"width":1920,"height":1080},
  duration: 24,
  fps: 30,
  beats: [{"at":0,"title":"形体","detail":"Avocado 直接模型层，旋转与 HDR 环境照明","id":"form"},{"at":6,"title":"光影","detail":"three 场景调用产品转台资源","id":"light"},{"at":13,"title":"生机","detail":"Fox Walk 骨骼动画与缓慢转动","id":"motion"},{"at":19,"title":"让灵感，有形","detail":"立体取景框标志与收尾标题","id":"closing"}],
  subtitles: [],
  loadVisual: () => import("./visual.json"),
};
export default timeline;
