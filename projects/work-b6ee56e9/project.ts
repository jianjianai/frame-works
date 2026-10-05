import type {AnimationProject} from '../../src/engine/types';
const project:AnimationProject={
 id:'work-b6ee56e9',title:'折叠｜THE IMPOSSIBLE FOLD',subtitle:'把折痕，折成翅膀。',
 description:'一张红纸，在秩序、挤压和无尽折叠中寻找自己的形状。原创三维视听短片，128 BPM 四轨电子配乐。建议戴耳机、全屏观看。',
 renderer:'three',engineProtocol:1,composition:{width:1920,height:1080},duration:120,fps:30,
 accent:'#b91224',poster:'films/work-b6ee56e9/poster.svg',posterTime:89,
 tags:["原创短片","空间折叠","电影感电子","无对白","原创视听短片"],status:'film',
 beats:[
  {id:'sheet',at:0,title:'一张纸',detail:'微距触感；第一次折痕带动镜头撤离'},
  {id:'order',at:7.5,title:'秩序',detail:'节拍进入，机械门框逐排升起'},
  {id:'tunnel',at:16.875,title:'无尽长廊',detail:'贴纸穿行，空间的方向开始扭转'},
  {id:'loop',at:30,title:'困在循环',detail:'长纸带围合为环，镜头进入中心'},
  {id:'pressure',at:43.125,title:'压力上升',detail:'螺旋增高，建筑与和声逐渐收紧'},
  {id:'breath',at:60,title:'屏息',detail:'画面和音乐同时收住；留下折纸摩擦'},
  {id:'release',at:63.75,title:'挣脱',detail:'重拍落下，牢笼打开为波动地形'},
  {id:'impossible',at:75,title:'不可能的曲面',detail:'纸带舒展，化为莫比乌斯曲面'},
  {id:'decision',at:97.5,title:'重新选择',detail:'所有运动回到一张纸；三次折叠形成纸飞机'},
  {id:'flight',at:103.125,title:'起飞',detail:'沿镜头前方掠过，越过曾经的机械空间'},
  {id:'afterglow',at:112.5,title:'余韵',detail:'整座机械装置变为六十四架纸飞机，与红纸一起起飞'}
 ],
 subtitles:[
  {start:.9,end:4.5,text:'一张纸，能被折成多少种命运？'},
  {start:10,end:13.6,text:'先学会，按他们的形状生长。'},
  {start:24,end:28,text:'然后，连方向都不再属于自己。'},
  {start:45.4,end:49,text:'越折，越紧。'},
  {start:59.4,end:63.4,text:'可折痕，也能成为——'},
  {start:65.2,end:68.9,text:'起飞的方向。'},
  {start:98.6,end:102.5,text:'你不必，长成标准答案。'},
  {start:112.5,end:117.5,text:'把折痕，折成翅膀。'}
 ],
 credits:['原创场景、乐谱、合成器与拟音：本工程自有源码','画面使用 Three.js；音乐为代码合成，成片采用 AAC 多轨；无外部视听素材'],
 load:()=>import('./scene'),
  loadAudioDocument: () => import("./audio.json"),
};
export default project;
