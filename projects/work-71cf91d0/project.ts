import type { AnimationProject } from '../../src/engine/types';
const project: AnimationProject = { ...{
  "id": "work-71cf91d0",
  "title": "试试水",
  "subtitle": "",
  "description": "新建工程；文件和脚本说明见 projects/work-71cf91d0/README.md。",
  "renderer": "composition",
  "engineProtocol": 1,
  "duration": 24,
  "fps": 30,
  "accent": "#c5d7b1",
  "poster": "films/work-71cf91d0/poster.svg",
  "tags": [
    "制作中"
  ],
  "status": "draft",
  "beats": [],
  "subtitles": [],
  "credits": [
    "工程资源索引：projects/work-71cf91d0/README.md"
  ]
}, load: () => import('./scene'), loadVisual: () => import('./visual.json') };
export default project;
