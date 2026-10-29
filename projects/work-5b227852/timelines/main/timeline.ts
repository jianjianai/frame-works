import type { Timeline } from "@frame/engine/types";

const timeline: Timeline = {
  name: "竖屏",
  composition: {"width":1080,"height":1920},
  duration: 15,
  fps: 30,
  beats: [],
  subtitles: [],
  loadVisual: () => import("./visual.json"),
};
export default timeline;
