import type { AnimationProject } from '../../src/engine/types';
const project: AnimationProject = { ...{
  "id": "work-8d43897b",
  "title": "刷了一晚上，为什么还是没休息够？",
  "subtitle": "",
  "description": "新建工程；文件和脚本说明见 projects/work-8d43897b/README.md。",
  "renderer": "canvas",
  "engineProtocol": 1,
  "composition": {
    "width": 1080,
    "height": 1920
  },
  "duration": 90,
  "fps": 30,
  "audioTracks": [
    {
      "id": "melody",
      "name": "旋律",
      "kind": "generated",
      "gain": 0.6
    }
  ],
  "accent": "#c5d7b1",
  "poster": "films/work-8d43897b/poster.svg",
  "tags": [
    "制作中"
  ],
  "status": "draft",
  "beats": [],
  "subtitles": [],
  "credits": [
    "工程资源索引：projects/work-8d43897b/README.md"
  ]
}, load: () => import('./scene'), loadAudio: () => import('./audio') };
export default project;
