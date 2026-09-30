import type { AnimationProject } from '../../src/engine/types';
const project: AnimationProject = { ...{
  "id": "work-0560feb5",
  "title": "超越对话｜从聊天机器人到 Agent",
  "subtitle": "",
  "description": "新建工程；文件和脚本说明见 projects/work-0560feb5/README.md。",
  "renderer": "three",
  "engineProtocol": 1,
  "composition": {
    "width": 1920,
    "height": 1080
  },
  "duration": 216,
  "fps": 60,
  "audioTracks": [
    {
      "id": "melody",
      "name": "旋律",
      "kind": "generated",
      "gain": 0.6
    }
  ],
  "accent": "#c5d7b1",
  "poster": "films/work-0560feb5/poster.svg",
  "tags": [
    "制作中"
  ],
  "status": "draft",
  "beats": [],
  "subtitles": [],
  "credits": [
    "工程资源索引：projects/work-0560feb5/README.md"
  ]
}, load: () => import('./scene'), loadAudio: () => import('./audio') };
export default project;
