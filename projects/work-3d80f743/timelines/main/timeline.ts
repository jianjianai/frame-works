import type { Timeline } from "@frame/engine/types";

const timeline: Timeline = {
  name: "竖屏",
  composition: {"width":1080,"height":1920},
  duration: 152,
  fps: 30,
  tempo: {"bpm":119.99,"firstBeat":0.013,"beatsPerBar":4},
  beats: [{"at":0,"title":"前奏","detail":""},{"at":15.93,"title":"反乌托邦中的争夺","detail":"主歌1"},{"at":17.88,"title":"把愿望敲碎成粉末","detail":""},{"at":19.8,"title":"心灵也被挂上门锁","detail":""},{"at":21.9,"title":"看不清灯火","detail":""},{"at":23.55,"title":"但我还想做些什么","detail":"导歌1"},{"at":25.83,"title":"其实还想要说很多","detail":""},{"at":27.84,"title":"请你等等我","detail":""},{"at":29.79,"title":"请你等等我","detail":""},{"at":32.16,"title":"两块五的签字笔","detail":""},{"at":33.96,"title":"东拼西凑的词句","detail":""},{"at":35.91,"title":"妄想用它拯救你","detail":""},{"at":37.86,"title":"顺便拯救我自己","detail":""},{"at":39.39,"title":"只因为","detail":"副歌1"},{"at":40.74,"title":"你那渴望自由的心脏","detail":""},{"at":41.94,"title":"困在一张没空隙的网","detail":""},{"at":43.92,"title":"我们的周围并非没光亮","detail":""},{"at":45.93,"title":"只是太耀眼将我们灼伤","detail":""},{"at":47.94,"title":"在这个世界难免会迷茫","detail":""},{"at":49.98,"title":"但别再把小刀带在身上","detail":""},{"at":51.93,"title":"至少我还在为你而歌唱","detail":""},{"at":53.94,"title":"在黑暗漫长的反乌托邦","detail":""},{"at":55.98,"title":"即便我们都在这黑暗漫长的反乌托邦","detail":"副歌后尾句"},{"at":64,"title":"间奏","detail":"前奏前半的旋律再现"},{"at":72.06,"title":"忍着想要挣脱的生活","detail":"主歌2"},{"at":73.89,"title":"做出不想做的承诺","detail":""},{"at":75.93,"title":"列车上坐错站的乘客","detail":""},{"at":77.94,"title":"困惑着沉默","detail":""},{"at":79.56,"title":"但我还想做些什么","detail":"导歌2（歌词和导歌1一样）"},{"at":81.87,"title":"其实还想要说很多","detail":""},{"at":83.85,"title":"请你等等我","detail":""},{"at":85.8,"title":"请你等等我","detail":""},{"at":88.02,"title":"发着光的半平米","detail":""},{"at":89.88,"title":"胡乱哼唱的旋律","detail":""},{"at":91.95,"title":"但是还想拯救你","detail":""},{"at":93.93,"title":"同时拯救我自己","detail":""},{"at":95.4,"title":"就请你","detail":"副歌2"},{"at":96.75,"title":"放心大胆更妄为肆意","detail":""},{"at":97.95,"title":"迈步向前别害怕失去","detail":""},{"at":99.93,"title":"没有犯下任何错的你","detail":""},{"at":102,"title":"在我心里只用做自己","detail":""},{"at":103.92,"title":"这段胡乱拼凑的词语","detail":""},{"at":106.23,"title":"如果伤到你也请你忘记","detail":""},{"at":107.94,"title":"但若你又找不到意义","detail":""},{"at":110.34,"title":"希望这首歌能被记起","detail":""},{"at":112,"title":"静音停顿","detail":"112.0–113.5"},{"at":113.88,"title":"活下去","detail":"整个乐队炸开，全曲最响一段"},{"at":117.9,"title":"活下去","detail":""},{"at":121.86,"title":"活下去","detail":""},{"at":125.91,"title":"活下去","detail":""},{"at":129.93,"title":"在这反乌托邦里","detail":"132.2 唱完"},{"at":132,"title":"尾奏","detail":"前奏旋律弹两遍"},{"at":148,"title":"原曲结束","detail":"最后一下收尾，余音到 151"}],
  subtitles: [],
  loadVisual: () => import("./visual.json"),
  loadAudioDocument: () => import("./audio.json"),
};
export default timeline;
