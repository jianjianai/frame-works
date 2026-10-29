import type { Timeline } from "@frame/engine/types";

const timeline: Timeline = {
  name: "竖屏",
  composition: {"width":1080,"height":1920},
  duration: 90,
  fps: 30,
  beats: [{"id":"opening","at":0,"title":"十分钟变成一晚上","detail":"疲惫小人倒进沙发，手机亮起，时钟跳走"},{"id":"attractions","at":7,"title":"不停变化的内容","detail":"笑、争吵、逆袭化作同一条通道中的真实事件"},{"id":"conveyor","at":18,"title":"时间在流水线上滑走","detail":"内容与情绪不断切换，钟表从身边流走"},{"id":"chase","at":32,"title":"下一条会更好","detail":"小人追逐越来越远的光门"},{"id":"reveal","at":43,"title":"察觉循环","detail":"拉远揭示环带，角色缩回手，光点失去落点"},{"id":"choose","at":52,"title":"自己给休息一个结尾","detail":"拨计时器，终点线落下，手机移到够不着的位置"},{"id":"window","at":66,"title":"没有新内容的几分钟","detail":"喝水、走路、窗边暖光，动作继续"},{"id":"ending","at":79,"title":"今天就到这里","detail":"再一次邀请出现，角色主动关闭并舒展身体"}],
  subtitles: [],
  loadAudioDocument: () => import("./audio.json"),
};
export default timeline;
