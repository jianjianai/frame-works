import type { Timeline } from "@frame/engine/types";

const timeline: Timeline = {
  name: "横屏",
  composition: {"width":1920,"height":1080},
  duration: 120,
  fps: 30,
  beats: [{"id":"sheet","at":0,"title":"一张纸","detail":"微距触感；第一次折痕带动镜头撤离"},{"id":"order","at":7.5,"title":"秩序","detail":"节拍进入，机械门框逐排升起"},{"id":"tunnel","at":16.875,"title":"无尽长廊","detail":"贴纸穿行，空间的方向开始扭转"},{"id":"loop","at":30,"title":"困在循环","detail":"长纸带围合为环，镜头进入中心"},{"id":"pressure","at":43.125,"title":"压力上升","detail":"螺旋增高，建筑与和声逐渐收紧"},{"id":"breath","at":60,"title":"屏息","detail":"画面和音乐同时收住；留下折纸摩擦"},{"id":"release","at":63.75,"title":"挣脱","detail":"重拍落下，牢笼打开为波动地形"},{"id":"impossible","at":75,"title":"不可能的曲面","detail":"纸带舒展，化为莫比乌斯曲面"},{"id":"decision","at":97.5,"title":"重新选择","detail":"所有运动回到一张纸；三次折叠形成纸飞机"},{"id":"flight","at":103.125,"title":"起飞","detail":"沿镜头前方掠过，越过曾经的机械空间"},{"id":"afterglow","at":112.5,"title":"余韵","detail":"整座机械装置变为六十四架纸飞机，与红纸一起起飞"}],
  subtitles: [{"start":0.9,"end":4.5,"text":"一张纸，能被折成多少种命运？"},{"start":10,"end":13.6,"text":"先学会，按他们的形状生长。"},{"start":24,"end":28,"text":"然后，连方向都不再属于自己。"},{"start":45.4,"end":49,"text":"越折，越紧。"},{"start":59.4,"end":63.4,"text":"可折痕，也能成为——"},{"start":65.2,"end":68.9,"text":"起飞的方向。"},{"start":98.6,"end":102.5,"text":"你不必，长成标准答案。"},{"start":112.5,"end":117.5,"text":"把折痕，折成翅膀。"}],
  loadAudioDocument: () => import("./audio.json"),
};
export default timeline;
