import type {Project} from '../../src/engine/types';
const project:Project={
 id:'work-b6ee56e9',title:'折叠｜THE IMPOSSIBLE FOLD',subtitle:'把折痕，折成翅膀。',
 description:'一张红纸，在秩序、挤压和无尽折叠中寻找自己的形状。原创三维视听短片，128 BPM 四轨电子配乐。建议戴耳机、全屏观看。',
 renderer:'three',engineProtocol:1,
 accent:'#b91224',poster:'films/work-b6ee56e9/poster.svg',posterTime:89,
 tags:["原创短片","空间折叠","电影感电子","无对白","原创视听短片"],
 credits:['原创场景、乐谱、合成器与拟音：本工程自有源码','画面使用 Three.js；音乐为代码合成，成片采用 AAC 多轨；无外部视听素材'],
 load:()=>import('./scene'),
  status: "abandoned",
  timelines: ["main"],
};
export default project;
