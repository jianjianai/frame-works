import type { Timeline } from "@frame/engine/types";

const timeline: Timeline = {
  name: "横屏",
  composition: {"width":1920,"height":1080},
  duration: 15,
  fps: 30,
  beats: [],
  subtitles: [],
  loadVisual: () => import("./visual.json"),
};
export default timeline;
