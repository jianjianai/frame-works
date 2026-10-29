import type { Timeline } from "@frame/engine/types";

const timeline: Timeline = {
  name: "横屏",
  composition: {"width":1920,"height":1080},
  duration: 36,
  fps: 30,
  beats: [{"at":0,"title":"落入土壤","detail":"种子随风下落，镜头保留土壤横截面。"},{"at":6,"title":"雨水与根系","detail":"降雨后根系逐渐向下延伸。"},{"at":14,"title":"舒展与开花","detail":"茎叶生长，花瓣沿同一主时间轴展开。"},{"at":26,"title":"授粉与新生","detail":"蜜蜂靠近花朵，新的种子继续随风启程。"}],
  subtitles: [{"start":1,"end":5,"text":"看起来微不足道的起点，藏着一整个春天。"},{"start":7,"end":12,"text":"先向下扎根，才有向上生长的力量。"},{"start":16,"end":23,"text":"叶子接住阳光，花朵回应世界。"},{"start":28,"end":36,"text":"一段生命的绽放，也是下一段故事的开始。"}],
  loadAudioDocument: () => import("./audio.json"),
};
export default timeline;
