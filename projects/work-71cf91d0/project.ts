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
  "beats": [
    { "id": "calm", "at": 0, "title": "平静引入", "detail": "暗海面、星光渐显，缓慢波动" },
    { "id": "swell", "at": 4, "title": "潮水涨落", "detail": "波峰涌起，海面光带增强" },
    { "id": "moon", "at": 12, "title": "月升", "detail": "月亮升起，海面出现月光倒影" },
    { "id": "settle", "at": 18, "title": "回落平息", "detail": "潮水回落，画面渐暗收尾" }
  ],
  "subtitles": [],
  "posterTime": 15,
  "credits": [
    "工程资源索引：projects/work-71cf91d0/README.md"
  ]
}, load: () => import('./scene'), loadVisual: () => import('./visual.json'), loadAudio: () => import('./audio'), loadAudioDocument: () => import('./audio.json') };
export default project;
