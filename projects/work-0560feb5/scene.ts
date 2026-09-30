import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import type {Scene,SceneOptions} from '../../src/engine/types';
import * as K from './visual-kit';
import * as A from './visual-acts';
const cuts=[0,16,36,62,92,116,142,180,207,216];
const headings=['超越对话','先有规则，后有学习','错误，变成训练信号','上下文，连接起来','从续写，到有用','从直觉，到推演','从回答，到完成','此刻，能力仍在扩展','不止回答。开始创造。'];
const eyebrow=['BEYOND THE CHAT','01  /  RULES → LEARNING','02  /  LEARN FROM ERROR','03  /  TRANSFORMER · 2017','04  /  PRETRAIN → POST-TRAIN','05  /  REASONING + MULTIMODAL','06  /  THE AGENT LOOP','THE FRONTIER','HUMAN INTENT × MACHINE CAPABILITY'];
const font='"Noto Sans CJK SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';
export async function createScene({width,height}:SceneOptions):Promise<Scene>{
 await document.fonts.ready;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d')!;
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});renderer.setPixelRatio(1);renderer.setSize(width,height);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
 const world=new T.Scene();world.background=new T.Color(K.C.ink);world.fog=new T.FogExp2(K.C.ink,.017);
 const camera=new T.PerspectiveCamera(40,width/height,.1,120);camera.position.set(0,1.7,17.8);
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);world.environment=env.texture;room.dispose();pmrem.dispose();
 world.add(new T.HemisphereLight(0xbedee8,0x05101a,1.4));const key=new T.DirectionalLight(0xd5f5ff,3.2);key.position.set(-4,7,6);world.add(key);const warm=new T.DirectionalLight(0xffb96c,3);warm.position.set(5,2,-4);world.add(warm);const rim=new T.PointLight(0x50dbe9,22,35,2);rim.position.set(-5,3,3);world.add(rim);
 const floor=new T.Mesh(new T.PlaneGeometry(180,180),new T.MeshBasicMaterial({color:0x061019}));floor.rotation.x=-Math.PI/2;floor.position.y=-4.8;world.add(floor);
 const grid=new T.GridHelper(100,45,0x102935,0x0b1c27);grid.position.y=-4.78;(grid.material as T.Material).transparent=true;(grid.material as T.Material).opacity=.16;world.add(grid);
 const dust=K.particles(240);world.add(dust);
 const builders=[A.opening,A.rules,A.learning,A.attention,A.training,A.reasoning,A.agent,A.frontier,A.ending];const actors=builders.map(f=>f());actors.forEach(a=>{world.add(a.root);a.root.visible=false;});
 const continuity=K.ball(.12,K.C.gold),continuityHalo=K.halo(K.C.gold,2.4,.8);continuity.add(continuityHalo);world.add(continuity);
 const glowCanvas=document.createElement('canvas');glowCanvas.width=960;glowCanvas.height=540;const bg=glowCanvas.getContext('2d')!,g=bg.createRadialGradient(520,260,20,520,260,500);g.addColorStop(0,'rgba(31,94,107,.08)');g.addColorStop(.6,'rgba(6,16,25,0)');g.addColorStop(1,'rgba(0,0,0,.48)');bg.fillStyle=g;bg.fillRect(0,0,960,540);
 function text(s:string,x:number,y:number,size:number,color='#e8f3f6',weight=500,alpha=1){ctx.globalAlpha=alpha;ctx.font=`${weight} ${size}px ${font}`;ctx.fillStyle=color;ctx.fillText(s,x,y);ctx.globalAlpha=1;}
 function line(x1:number,y1:number,x2:number,y2:number,color='#65e5ed',alpha=.7){ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.globalAlpha=1;}
 const draw=(time:number)=>{
  const t=Math.min(215.999,Math.max(0,time));let index=0;while(index<8&&t>=cuts[index+1])index++;const local=t-cuts[index],len=cuts[index+1]-cuts[index],p=K.clamp(local/len);
  actors.forEach((a,i)=>{a.root.visible=i===index;});const active=actors[index];active.update(local);
  const incoming=index===0?0:1-K.ease(local/.95),outgoing=index===8?0:K.ease((local-len+.8)/.8);active.root.position.x+=(incoming-outgoing)*15;active.root.position.z=-incoming*3-outgoing*1.4;
  if(index!==8)active.root.position.x=(incoming-outgoing)*15;
  const camZ=[17.5,16.9,17.8,16.4,16.2,16.9,17.7,14.3,17.2][index];const travel=index===7?.65:1.35;camera.position.set(Math.sin(t*.13)*.62,1.45+Math.sin(t*.16)*.19,camZ-travel*K.ease(p));camera.lookAt(index===0?.45:index===8?.65:0,-.55,0);camera.updateMatrixWorld();
  dust.rotation.y=t*.012;dust.rotation.z=Math.sin(t*.03)*.015;
  continuity.visible=index!==0&&(local<1.2||local>len-1.2);const q=local<1.2?local/1.2:(local-len+1.2)/1.2;continuity.position.set(K.mix(-9,9,K.ease(q)),.6-Math.sin(q*Math.PI)*.7,3.2);
  renderer.render(world,camera);ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(renderer.domElement,0,0,width,height);ctx.drawImage(glowCanvas,0,0,width,height);ctx.scale(width/1920,height/1080);
  const headerOpacity=K.out(local/.7)*(1-K.ease((local-len+.6)/.6));
  if(index===0){const enter=K.out(local/1.3);text('BEYOND THE CHAT',112,156,23,'#82a7b9',500,enter);line(112,184,180,184,'#ffc278',enter);text('超越',108,420,132,'#f2f5f5',600,enter);text('对话',108,568,132,'#f2f5f5',600,enter);text('从聊天机器人到 Agent',117,640,32,'#8fb0bf',400,enter);text('语言，开始变成行动',118,697,23,'#ffc278',500,enter);}
  else if(index===8){text(eyebrow[index],112,161,21,'#86a9b9',500,headerOpacity);line(112,192,180,192,'#ffc278',headerOpacity);text('不止回答。',108,420,92,'#f1f6f6',600,headerOpacity);text('开始创造。',108,540,92,'#f1f6f6',600,headerOpacity);text('下一次，你准备创造什么？',116,615,29,'#a9c4ce',400,headerOpacity);}
  else if(index===7){let fi=Math.min(11,Math.max(0,Math.floor((local-1.5)/2.1))),fl=Math.max(0,local-1.5-fi*2.1);const e=K.out(fl/.26);text('THE FRONTIER  /  '+String(fi+1).padStart(2,'0'),110,120,22,'#82a9b9',500,headerOpacity);text(local<1.5?'此刻，能力仍在扩展':A.frontierNames[fi],108,208,66,'#f0f5f6',600,headerOpacity*(.65+.35*e));line(111,243,180+e*55,243,'#ffc278',headerOpacity);text(A.frontierSources[fi],112,294,21,'#7997a7',400,headerOpacity);text('不同系统的公开能力示意 · 并非单一模型包办',111,854,21,'#819fab',400,headerOpacity);}
  else {text(eyebrow[index],110,116,21,'#789eaf',500,headerOpacity);const size=K.mix(61,45,K.ease((local-2.6)/1.3));text(headings[index],108,194,size,'#edf5f6',600,headerOpacity);line(111,226,184,226,'#ffc278',headerOpacity);
   if(index===2){text('FORWARD → PREDICT',111,295,18,'#688f9f',500,headerOpacity);text(local>5&&local<18?'← BACKPROPAGATE':'WEIGHTS / UPDATED',111,327,18,'#d7a975',500,headerOpacity);}
   if(index===3){text(local<18?'词元 → 向量 → 关联':'上下文 → 概率 → 采样 → 新上下文',111,291,23,'#91b4c2',400,headerOpacity);text('动画为机制示意，不是对模型内部的实拍',111,854,18,'#567884',400,headerOpacity);}
   if(index===4&&local>17)text('训练更新参数；普通对话不等于重新训练',111,849,22,'#8aaab8',400,headerOpacity);
   if(index===5)text(local<12?'多步尝试 / 回退 / 检查':'视觉 + 声音 + 语言',111,291,23,'#91b4c2',400,headerOpacity);
   if(index===6){text('目标：把一个想法做成网站',111,285,24,'#91b4c2',400,headerOpacity);const state=local<6?'理解目标':local<15?'读取 → 编辑':local<24?'测试失败 → 读取错误 → 修复':local<31?'重新运行 → 检查通过':'权限 · 预算 · 停止条件';text(state,110,840,26,local>=15&&local<24?'#ff8d84':'#ffc278',500,headerOpacity);}
  }
  text('FRAME ORIGINAL  /  2026',1575,115,16,'#4c727f',500,.7);
  const fade=1-K.ease(t/1.1)+K.ease((t-215.3)/.7);if(fade>0){ctx.fillStyle=`rgba(0,0,0,${Math.min(1,fade)})`;ctx.fillRect(0,0,1920,1080);}ctx.setTransform(1,0,0,1,0,0);
 };
 return{canvas,render:draw,dispose(){K.disposeTree(world);env.dispose();renderer.dispose();renderer.forceContextLoss();canvas.width=canvas.height=1;}};
}
