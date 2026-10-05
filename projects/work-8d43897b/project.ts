import type { AnimationProject } from '../../src/engine/types';
const project: AnimationProject = {
  ...{
  "id": "work-8d43897b",
  "title": "刷了一晚上，为什么还是没休息够？",
  "subtitle": "你以为在休息，其实还在追下一条。",
  "description": "90秒原创竖屏知识动画：跟随点点从无限内容流水线走回自己的房间。连续角色动画、原创电子配乐、中文旁白和字幕。研究来源与许可见本作品 production 目录中的 sources.md。",
  "renderer": "canvas",
  "engineProtocol": 1,
  "composition": {
    "width": 1080,
    "height": 1920
  },
  "duration": 90,
  "fps": 30,
  "accent": "#ffc969",
  "poster": "films/work-8d43897b/poster.svg",
  "posterTime": 36,
  "tags": [
    "知识动画",
    "休息",
    "短视频",
    "注意力",
    "原创"
  ],
  "status": "film",
  "beats": [
    {
      "id": "opening",
      "at": 0,
      "title": "十分钟变成一晚上",
      "detail": "疲惫小人倒进沙发，手机亮起，时钟跳走"
    },
    {
      "id": "attractions",
      "at": 7,
      "title": "不停变化的内容",
      "detail": "笑、争吵、逆袭化作同一条通道中的真实事件"
    },
    {
      "id": "conveyor",
      "at": 18,
      "title": "时间在流水线上滑走",
      "detail": "内容与情绪不断切换，钟表从身边流走"
    },
    {
      "id": "chase",
      "at": 32,
      "title": "下一条会更好",
      "detail": "小人追逐越来越远的光门"
    },
    {
      "id": "reveal",
      "at": 43,
      "title": "察觉循环",
      "detail": "拉远揭示环带，角色缩回手，光点失去落点"
    },
    {
      "id": "choose",
      "at": 52,
      "title": "自己给休息一个结尾",
      "detail": "拨计时器，终点线落下，手机移到够不着的位置"
    },
    {
      "id": "window",
      "at": 66,
      "title": "没有新内容的几分钟",
      "detail": "喝水、走路、窗边暖光，动作继续"
    },
    {
      "id": "ending",
      "at": 79,
      "title": "今天就到这里",
      "detail": "再一次邀请出现，角色主动关闭并舒展身体"
    }
  ],
  "subtitles": [],
  "credits": [
    "视觉、动画、音乐与音效：本工程原创",
    "中文旁白：Kokoro zm_yunxi（Apache-2.0）",
    "研究：Tam & Inzlicht, 2024, DOI 10.1037/xge0001639",
    "研究边界与原始来源：本作品 production 目录中的 sources.md"
  ]
},
  load: () => import('./scene'),
  loadAudio: () => import('./audio'),
  loadAudioDocument: () => import('./audio.json'),
};
export default project;
