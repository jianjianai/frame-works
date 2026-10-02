import type { AnimationProject } from '../../src/engine/types';
const project: AnimationProject = { ...{
  "id": "work-b6ee56e9",
  "title": "折叠｜THE IMPOSSIBLE FOLD",
  "subtitle": "",
  "description": "新建工程；文件和脚本说明见 projects/work-b6ee56e9/README.md。",
  "renderer": "three",
  "engineProtocol": 1,
  "composition": {
    "width": 1920,
    "height": 1080
  },
  "duration": 120,
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
  "poster": "films/work-b6ee56e9/poster.svg",
  "tags": [
    "制作中"
  ],
  "status": "draft",
  "beats": [],
  "subtitles": [],
  "credits": [
    "工程资源索引：projects/work-b6ee56e9/README.md"
  ]
}, load: () => import('./scene'), loadAudio: () => import('./audio') };
export default project;
