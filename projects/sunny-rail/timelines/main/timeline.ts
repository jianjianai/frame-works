import type { Timeline } from "@frame/engine/types";

const timeline: Timeline = {
  name: "横屏",
  composition: {"width":1920,"height":1080},
  duration: 36,
  fps: 30,
  beats: [{"at":0,"title":"发车","detail":"完整岛屿建立空间关系，列车从车站起步。"},{"at":8,"title":"进入山林","detail":"镜头靠近运动主体，车轮与车厢同步前进。"},{"at":18,"title":"绕过风车","detail":"镜头连续绕岛，远近物体形成视差。"},{"at":28,"title":"回到站台","detail":"镜头拉回全景，列车减速归站。"}],
  subtitles: [{"start":1,"end":6,"text":"小小的车站，装得下很大的出发。"},{"start":10,"end":16,"text":"穿过山林，时间有了风的形状。"},{"start":20,"end":26,"text":"每一次转弯，都能遇见新的风景。"},{"start":30,"end":36,"text":"旅程回到原点，眼中的世界却已不同。"}],
  loadAudioDocument: () => import("./audio.json"),
};
export default timeline;
