import * as T from 'three';
import * as K from './visual-kit';
const {C,v,box,ball,ring,curve,label,core,flow,hash,fract,ease,out,spring,mix}=K;
export function opening():K.Actor{
 const root=new T.Group(),c=core(.85),bubble=K.chat(),orbit=new T.Group();root.add(c,bubble,orbit);bubble.position.set(-3.1,.25,0);bubble.scale.setScalar(.75);
 const tools=[K.codeScreen(),K.documentStack(),K.chip()];tools.forEach((a,i)=>{a.scale.setScalar(.32);orbit.add(a);const r=ring(2.8+i*.1,i%2?C.gold:C.cyan,.012);r.rotation.x=1.2+i*.4;orbit.add(r);});
 const trail=flow(64,(i,t)=>{const p=fract(i/64+t*.13),a=p*Math.PI*8;return v(mix(-4,3,p),Math.sin(a)*.35,Math.cos(a)*.5);},C.cyan);root.add(trail.mesh);
 return{root,update(t){const a=ease((t-3)/4);c.position.set(mix(-1.4,2.4,a),.2,0);c.rotation.set(t*.17,t*.28,t*.04);c.scale.setScalar(.95+.035*Math.sin(t*2));bubble.rotation.set(.05,-.2+Math.sin(t*.3)*.05,0);bubble.scale.setScalar(.75*(1-ease((t-7)/3)));orbit.position.copy(c.position);orbit.scale.setScalar(.15+.85*out((t-3)/6));tools.forEach((o,i)=>{let a=t*.48+i*Math.PI*2/3;o.position.set(Math.cos(a)*3.2,Math.sin(a)*1.8,Math.sin(a*.7)*1.2);o.rotation.y=-.25+Math.sin(a)*.2;});trail.update(t);root.rotation.y=-.12+Math.sin(t*.19)*.05;}};
}
export function rules():K.Actor{
 const root=new T.Group(),gate=new T.Group(),dots:T.Mesh[]=[],switches:T.Group[]=[];root.add(gate);
 const nodes=[v(-6,0),v(-3,0),v(0,1.5),v(0,-1.5),v(3,1.5),v(3,-1.5),v(6,1.5),v(6,-1.5)];
 const paths=[[0,1],[1,2],[1,3],[2,4],[3,5],[4,6],[5,7]];
 for(const [a,b]of paths){const p=curve([nodes[a],nodes[a].clone().lerp(nodes[b],.5).add(v(0,0,.25)),nodes[b]],0x386172,.026);root.add(p);}
 nodes.forEach((p,i)=>{const hub=ball(.2,i===7?C.red:C.gold);hub.position.copy(p);dots.push(hub);root.add(hub);const r=ring(.34,i===7?C.red:C.cyan,.015);r.position.copy(p);root.add(r);});
 for(let i=0;i<14;i++){const o=new T.Group(),q=box(.12,1.25,.18,C.slate);o.add(q);q.rotation.z=i%2?.38:-.38;o.position.set(-4.6+i*.64,(i%2?1:-1)*2.3,-.8);root.add(o);switches.push(o);}
 const a=label('关键词', '#65e5ed',.46,512);a.position.set(-3,1,0);root.add(a);const b=label('匹配 → 回答', '#e8f3f6',.52,768);b.position.set(3,2.5,0);root.add(b);const x=label('未匹配', '#ff676c',.48,512);x.position.set(4.8,-2.45,0);root.add(x);
 for(let i=0;i<7;i++)gate.add(box(.12,1.5,.2,C.red,(i-3)*.21,0,0));gate.position.set(5,-1.5,0);
 const p=flow(12,(i,t)=>{const q=fract(t*.23+i/12);const y=t<7?1.5:-1.5;return v(mix(-6,t<7?6:4.8,q),q<.3?0:ease((q-.3)/.2)*y,.2);});root.add(p.mesh);
 return{root,update(t){p.update(t);const collapse=ease((t-15)/4);switches.forEach((a,i)=>{a.rotation.z=collapse*(hash(i)*4-2)+Math.sin(t*1.2+i)*.04;a.position.z=-.8+collapse*(hash(i+30)*6-3);});dots.forEach((o,i)=>o.scale.setScalar(1+.16*Math.exp(-Math.pow(fract(t*.6-i*.15)-.1,2)*100)));gate.scale.y=.95+.04*Math.sin(t*10);root.rotation.y=-.18+.09*Math.sin(t*.21);root.scale.setScalar(1-collapse*.12);}};
}
export function learning():K.Actor{
 const root=new T.Group(),layers=5,count=7,nodes:T.Vector3[]=[],spheres:T.Mesh[]=[];
 for(let l=0;l<layers;l++)for(let i=0;i<count;i++){const p=v((l-2)*2.65,(i-3)*.69,Math.sin(i*1.7+l)*.23);nodes.push(p);const b=ball(l===2?.17:.13,l===0?C.gold:C.slate);b.position.copy(p);root.add(b);spheres.push(b);}
 const pos:number[]=[],colors:number[]=[];
 for(let l=0;l<layers-1;l++)for(let i=0;i<count;i++)for(let j=0;j<count;j++){pos.push(...nodes[l*count+i].toArray(),...nodes[(l+1)*count+j].toArray());const h=hash(l*49+i*7+j)*.25+.15;colors.push(.1*h,.65*h,.75*h,.1*h,.65*h,.75*h);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));root.add(new T.LineSegments(geo,new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.8})));
 const f=flow(85,(i,t)=>{const q=fract(t*.2+i*.019),a=Math.min(3,Math.floor(q*4)),s=q*4-a;const u=(i*3+a)%7,w=(i*5+a+1)%7;return nodes[a*7+u].clone().lerp(nodes[(a+1)*7+w],ease(s));},C.cyan,.073);root.add(f.mesh);
 const back=flow(28,(i,t)=>{let q=1-fract(t*.26+i/28),a=Math.min(3,Math.floor(q*4));return nodes[a*7+(i%7)].clone().lerp(nodes[(a+1)*7+((i*3)%7)],q*4-a);},C.gold,.065);root.add(back.mesh);
 const input=label('输入', '#ffc278',.42,384),output=label('预测', '#65e5ed',.42,384);input.position.set(-5.3,3,0);output.position.set(5.3,3,0);root.add(input,output);
 const target=ring(.7,C.gold,.025);target.position.set(6.5,0,0);root.add(target);const marker=ball(.16,C.cyan,6.5,1.5,0);root.add(marker);
 const loss=[];for(let i=0;i<80;i++){const u=i/79;loss.push(v(-4+u*8,-3.8+1.1*Math.exp(-u*4)+.11*Math.sin(u*40)*(1-u),0));}const lossLine=curve(loss,C.gold,.024);root.add(lossLine);const lossLabel=label('误差下降 · 权重更新','#ffc278',.38,768);lossLabel.position.set(0,-4.3,0);root.add(lossLabel);
 return{root,update(t){f.update(t);back.mesh.visible=t>5&&t<18;back.update(t);spheres.forEach((b,i)=>{const p=Math.exp(-Math.pow(fract(t*.4-i*.071)-.25,2)*90);b.scale.setScalar(1+p*.8);(b.material as T.MeshStandardMaterial).color.setHex(p>.4?C.cyan:C.slate);});marker.position.y=1.5*Math.exp(-t*.13)*Math.sin(t*1.5);lossLine.scale.x=out(t/17);root.rotation.y=-.12+Math.sin(t*.13)*.17;root.rotation.z=Math.sin(t*.12)*.025;}};
}
export function attention():K.Actor{
 const root=new T.Group(),tokens=['小猫','追着','光点','跑','它','很','兴奋'],tiles:T.Group[]=[],beams:T.Mesh[]=[];
 const positions=tokens.map((_,i)=>v((i-3)*1.68,-.35,Math.sin(i*.7)*.18));
 tokens.forEach((s,i)=>{const a=new T.Group();a.position.copy(positions[i]);a.add(box(1.39,1.1,.16,i===4?0x896345:C.slate));const l=label(s,i===4?'#ffc278':'#e8f3f6',.52,384);l.position.set(0,0,.16);a.add(l);const o=K.outline(1.43,1.14,i===4?C.gold:C.cyan);o.position.z=.12;a.add(o);tiles.push(a);root.add(a);for(let j=0;j<8;j++){const n=box(.065,.15+hash(i*9+j)*.44,.055,i===4?C.gold:C.cyan,(i-3)*1.68-.47+j*.13,-1.85,.05);root.add(n);}});
 for(let i=0;i<7;i++){const a=positions[4].clone().add(v(0,.65,0)),b=positions[i].clone().add(v(0,.65,0));const m=curve([a,a.clone().lerp(b,.5).add(v(0,.75+Math.abs(i-4)*.38,.15)),b],i===0?C.gold:0x1c5462,i===0?.052:.017);root.add(m);beams.push(m);}
 const f=flow(32,(i,t)=>{const j=i%7,s=fract(t*.6+i*.13),a=positions[4].clone().add(v(0,.6,0)),b=positions[j].clone().add(v(0,.6,0));return a.lerp(b,s).add(v(0,Math.sin(s*Math.PI)*(.75+Math.abs(j-4)*.38),.18));},C.gold,.056);root.add(f.mesh);
 const candidates=new T.Group(),cand:T.Mesh[]=[];['兴奋','睡觉','消失'].forEach((s,i)=>{const b=box(1.1,1,.55,i===0?C.gold:C.slate,(i-1)*2.6,-1.4,0);cand.push(b);candidates.add(b);const tx=label(s,i===0?'#ffc278':'#94acb8',.43,512);tx.position.set((i-1)*2.6,-2.1,0);candidates.add(tx);const n=label(['0.76','0.14','0.10'][i],i===0?'#ffc278':'#7894a2',.35,384);n.position.set((i-1)*2.6,i===0?2.1:-.25,0);candidates.add(n);});root.add(candidates);
 const cap=label('下一词元 · 概率示意','#8ba5b2',.38,1024);cap.position.set(0,-2.8,0);candidates.add(cap);
 return{root,update(t){const stage=ease((t-18)/2);tiles.forEach((a,i)=>{a.position.copy(positions[i]);a.position.y+=stage*3.4;a.scale.setScalar(1-stage*.35);a.rotation.y=Math.sin(t*.5+i)*.04;});beams.forEach((b,i)=>{b.visible=t<20;b.scale.y=.95+.05*Math.sin(t*1.8+i);});f.mesh.visible=t<20;f.update(t);candidates.visible=t>17;candidates.scale.setScalar(Math.max(.001,spring((t-18)/2)));cand.forEach((b,i)=>{b.scale.y=([3.1,.57,.41][i])*(.97+.03*Math.sin(t*3+i));b.position.y=-1.4+b.scale.y*.5;});tiles[6].visible=t<19.4||t>26;root.rotation.y=.05*Math.sin(t*.14);}};
}
export function training():K.Actor{
 const root=new T.Group(),brain=core(1.15),plates:T.Mesh[]=[];brain.position.set(1.1,.1,0);root.add(brain);
 for(let i=0;i<11;i++){const a=box(2.4,.065,2.4,i%4===0?C.gold:C.slate,1.1,-1.6+i*.31,0);plates.push(a);root.add(a);}
 const names=['预训练','指令示范','反馈优化'];const ends=[v(-5,1.9,0),v(-5,0,0),v(-5,-1.9,0)];ends.forEach((p,i)=>{const a=label(names[i],i===2?'#ffc278':'#e8f3f6',.52,768);a.position.copy(p).add(v(0,.7,0));root.add(a);root.add(curve([p,v(-2,p.y,1),v(1.1,0,0)],i===2?C.gold:C.cyan,.023));});
 const f=flow(72,(i,t)=>{let q=fract(t*.17+i/72),a=ends[i%3];return a.clone().lerp(v(1.1,0,0),q).add(v(0,Math.sin(q*Math.PI)*.4,Math.sin(q*Math.PI)*1));});root.add(f.mesh);
 const correct=ring(.58,C.gold,.055);correct.position.set(5,0,0);root.add(correct);root.add(curve([v(2.2,0,0),v(3.6,.4,0),v(5,0,0)],C.gold,.026));
 const tick=new T.Group();tick.add(K.segment(v(-.3,0),v(-.08,-.24),C.gold,.06),K.segment(v(-.08,-.24),v(.38,.34),C.gold,.06));tick.position.set(5,0,.1);root.add(tick);
 const outLabel=label('更有用 ≠ 永远正确','#ffc278',.43,1024);outLabel.position.set(4.3,-1.3,0);root.add(outLabel);
 return{root,update(t){brain.rotation.y=t*.19;brain.rotation.z=.1*Math.sin(t*.3);plates.forEach((p,i)=>{const spread=ease((t-2)/5)*(1-ease((t-16)/4));p.position.y=-1.6+i*.31+spread*(i-5)*.19;p.rotation.y=t*.12+i*.02;});f.update(t);tick.scale.setScalar(.86+.14*spring(fract(t*.25)));root.rotation.y=-.15+.06*Math.sin(t*.21);}};
}
export function reasoning():K.Actor{
 const root=new T.Group(),tree=new T.Group(),multi=new T.Group();root.add(tree,multi);
 const paths=[ [v(-5,-1.7),v(-2,-1.7),v(0,0),v(2,1.6),v(5,1.6)], [v(-2,-1.7),v(0,-2.7),v(2,-2.7)], [v(0,0),v(2,-.25),v(5,-.25)] ];
 paths.forEach((p,j)=>{tree.add(curve(p,j===1?C.red:C.cyan,j===0?.048:.025));p.forEach((a,i)=>{const n=ball(.16,j===1?C.red:i===p.length-1?C.gold:C.slate);n.position.copy(a);tree.add(n);});});
 const f=flow(22,(i,t)=>{const a=paths[t<7&&i%3===0?1:0],q=fract(t*.2+i/22)*(a.length-1),k=Math.min(a.length-2,Math.floor(q));return a[k].clone().lerp(a[k+1],ease(q-k));},C.gold);tree.add(f.mesh);
 const rejected=label('回退','#ff676c',.4,384);rejected.position.set(2,-3.4,0);tree.add(rejected);const verified=label('检查 → 继续','#ffc278',.45,768);verified.position.set(4.8,2.5,0);tree.add(verified);
 const nucleus=core(.86);multi.add(nucleus);const image=K.outline(2,1.5),txt=label('语言','#e8f3f6',.6,512),wave=K.bars(18);image.position.set(-4,1.4,0);txt.position.set(-4,-1.7,0);wave.position.set(4,0,0);wave.scale.setScalar(.5);multi.add(image,txt,wave);
 image.add(curve([v(-.8,-.5),v(-.2,.2),v(.15,-.13),v(.5,.45),v(.85,-.5)],C.gold,.033));const sun=ball(.12,C.gold,.5,.43,0);image.add(sun);
 for(const p of [v(-3,1.4),v(-3,-1.7),v(3,0)])multi.add(curve([p,p.clone().multiplyScalar(.5).add(v(0,0,1)),v(0,0,0)],C.cyan,.025));
 const mf=flow(36,(i,t)=>{const p=[v(-3,1.4),v(-3,-1.7),v(3,0)][i%3],a=fract(i/36+t*.4);return p.clone().multiplyScalar(1-a).add(v(0,0,Math.sin(a*Math.PI)));});multi.add(mf.mesh);
 return{root,update(t){let phase=ease((t-12)/1.8);tree.position.x=-phase*18;multi.position.x=(1-phase)*18;tree.visible=phase<.999;multi.visible=phase>.001;f.update(t);mf.update(t);nucleus.rotation.set(t*.13,t*.25,0);wave.userData.wave(t);root.rotation.y=.06*Math.sin(t*.2);}};
}
export function agent():K.Actor{
 const root=new T.Group(),hub=core(.82);root.add(hub);const artifacts=[K.documentStack(),K.codeScreen(),K.codeScreen(),K.chip()];const p=[v(-4.4,1.3),v(3.8,1.3),v(3.8,-2.2),v(-4.4,-2.2)];
 artifacts.forEach((a,i)=>{a.position.copy(p[i]);a.scale.setScalar(i===3?.55:.49);root.add(a);const n=label(['读取资料','编辑文件','运行测试','验证结果'][i],i===3?'#ffc278':'#e8f3f6',.39,768);n.position.copy(p[i]).add(v(0,i<2?1.4:-1.2,0));root.add(n);const next=p[(i+1)%4];root.add(curve([p[i],p[i].clone().lerp(next,.5).add(v(0,0,-.8)),next],C.cyan,.018));});
 const status=ring(.57,C.red,.07);status.position.copy(p[2]).add(v(1.8,.1,.2));root.add(status);const fail=new T.Group();fail.position.copy(status.position);fail.add(K.segment(v(-.23,-.23),v(.23,.23),C.red,.05),K.segment(v(-.23,.23),v(.23,-.23),C.red,.05));root.add(fail);
 const pass=new T.Group();pass.position.copy(status.position);pass.add(K.segment(v(-.28,0),v(-.04,-.22),C.gold,.06),K.segment(v(-.04,-.22),v(.36,.3),C.gold,.06));root.add(pass);
 const f=flow(32,(i,t)=>{let q=fract(t*.13+i/32)*4,k=Math.floor(q);return p[k].clone().lerp(p[(k+1)%4],ease(q-k)).add(v(0,0,.25));},C.cyan,.07);root.add(f.mesh);
 const feedback=curve([p[2],v(5.7,-.3,1.1),p[1]],C.red,.055);root.add(feedback);
 const pointer=ball(.16,C.gold),shine=K.halo(C.gold,1.8,.7);pointer.add(shine);root.add(pointer);
 return{root,update(t){hub.rotation.set(t*.17,t*.26,0);f.update(t);const test=t>15&&t<24,done=t>=24;status.visible=t>15;fail.visible=test;pass.visible=done;feedback.visible=test;(status.material as T.MeshBasicMaterial).color.setHex(done?C.gold:C.red);const a=fract(Math.max(0,t-3)/14)*4,k=Math.floor(a);pointer.position.copy(p[k]).lerp(p[(k+1)%4],ease(a-k));artifacts.forEach((o,i)=>{o.rotation.y=Math.sin(t*.3+i)*.065;o.scale.setScalar((i===3?.55:.49)*(1+.05*Math.exp(-Math.pow(fract(t*.3-i*.25)-.1,2)*40)));});root.rotation.y=.08*Math.sin(t*.16);}};
}
export function frontierCue(t:number):{index:number;local:number;sequence:number}{const times=[0,4.45,5.18,5.94,7.30,8.38,10.00,11.15,12.85,14.04,15.80,17.44,19.20,23.05,23.50,23.95,24.40,24.85,25.30,25.75,26.20,26.60],ids=[11,0,1,2,3,4,5,6,7,8,9,10,11,0,3,7,8,9,5,6,4,11];let k=0;while(k<times.length-1&&t>=times[k+1])k++;return{index:ids[k],local:t-times[k],sequence:k};}
export const frontierNames=['编写软件','检索研究','分析数据','生成影像','声音与音乐','数学探索','优化算法','生命结构','全球天气','机器人行动','数字工具','能力的连接'];
export const frontierSources=['Codex / coding agents','Deep research / retrieval','Code execution / analysis','Veo / image generation','Lyria / speech systems','AlphaEvolve / research','AlphaEvolve / evaluators','AlphaFold / structure prediction','WeatherNext / forecasting','Gemini Robotics / demonstrations','Agents / tool environments','Different systems. Shared frontier.'];
export function frontier():K.Actor{
 const root=new T.Group(),objects:T.Group[]=[];
 objects.push(K.codeScreen(),K.documentStack());
 const chart=new T.Group();for(let i=0;i<17;i++){const b=box(.32,1,.5,i%5===0?C.gold:C.cyan,(i-8)*.41,-1.5,0);chart.add(b);}chart.userData.update=(t:number)=>chart.children.forEach((o,i)=>{o.scale.y=.25+2.4*(.2+.8*hash(i))*out(fract(t*.2+i*.03));o.position.y=-1.6+o.scale.y*.5;});objects.push(chart);
 const film=new T.Group();for(let i=0;i<9;i++){const frame=K.outline(1.6,1,C.cyan);frame.position.set((i-4)*1.78,Math.sin(i*.4)*.6,0);frame.rotation.y=(i-4)*.12;film.add(frame);const h=meshLandscape(i);h.scale.setScalar(.35);h.position.copy(frame.position);h.position.y-=.08;film.add(h);}film.userData.update=(t:number)=>{film.position.x=-fract(t*.32)*1.78;film.rotation.y=-.3;};objects.push(film);
 const audio=new T.Group(),wave=K.bars(34);audio.add(wave);const ar=ring(2.8,C.gold,.016);ar.rotation.x=1.05;audio.add(ar);audio.userData.update=(t:number)=>{wave.userData.wave(t);ar.rotation.z=t*.3;};objects.push(audio);
 const math=new T.Group();for(let k=0;k<5;k++){const pts=[];for(let i=0;i<180;i++){const a=i/179*Math.PI*2;pts.push(v(Math.sin(a*3+k*.1)*2.7,Math.sin(a*2)*1.8,Math.cos(a*5)*.6+k*.12));}math.add(curve(pts,k===0?C.gold:0x327083,.015));}math.userData.update=(t:number)=>{math.rotation.y=t*.25;};objects.push(math);
 const circuit=K.chip();circuit.scale.setScalar(1.4);circuit.rotation.x=.6;circuit.userData.update=(t:number)=>{circuit.rotation.y=t*.5;};objects.push(circuit);
 const bio=K.protein();bio.userData.update=(t:number)=>{bio.rotation.y=t*.3;bio.rotation.z=-.45+Math.sin(t*.6)*.08;};objects.push(bio);
 const earth=K.globe();earth.userData.update=(t:number)=>{earth.rotation.y=t*.35;earth.rotation.z=.18;};objects.push(earth);
 const robot=K.robot();robot.position.y=.3;robot.rotation.y=-.3;const cube=box(.45,.45,.45,C.gold,2,-1.6,.1);robot.add(cube);robot.userData.update=(t:number)=>{robot.userData.pose(t);cube.position.set(1.3+Math.sin(t*1.9)*.7,-1.6+Math.max(0,Math.sin(t*1.9))*.9,0);};objects.push(robot);
 const tools=new T.Group();const a=K.codeScreen(),b=K.documentStack();a.scale.setScalar(.65);a.position.set(-1.8,.2,0);b.scale.setScalar(.62);b.position.set(2,.2,-.5);tools.add(a,b,core(.5));tools.userData.update=(t:number)=>{tools.rotation.y=Math.sin(t*.6)*.1;};objects.push(tools);
 const all=new T.Group();for(let i=0;i<10;i++){let o=[K.chip,K.documentStack,K.protein,K.globe,K.codeScreen][i%5]();o.scale.setScalar(i%5===0?.3:.18);const a=i/10*Math.PI*2;o.position.set(Math.cos(a)*4.1,Math.sin(a)*2.2,Math.sin(a)*.7);all.add(o);}all.add(core(.9));all.userData.update=(t:number)=>{all.rotation.z=Math.sin(t*.18)*.04;all.children.forEach((a,i)=>{a.rotation.y=t*.4+i;});};objects.push(all);
 objects.forEach(o=>root.add(o));
 return{root,update(t){const {index,local}=frontierCue(t);objects.forEach((o,i)=>{o.visible=i===index;if(i!==index)return;let punch=1+.12*Math.exp(-local*5);o.scale.setScalar((i===6?1.4:1)*punch);if(o.userData.update)o.userData.update(local+index*.7);if(i<2)o.rotation.y=-.2+local*.12;o.position.z=-.2+local*.1;});root.rotation.y=0;}};
}
function meshLandscape(seed:number){const g=new T.Group();for(let i=0;i<7;i++){const a=new T.Mesh(new T.ConeGeometry(.52,.8+hash(i+seed)*.8,4),K.metal(i%2?C.slate:C.cyan));a.position.set((i-3)*.5,-.2,hash(i)*.4);g.add(a);}return g;}
export function ending():K.Actor{
 const root=new T.Group(),c=core(.85),rings:T.Mesh[]=[],burst=flow(120,(i,t)=>{const a=hash(i)*Math.PI*2,r=1+Math.pow(K.clamp(t/9),2)*18*hash(i+200);return v(Math.cos(a)*r,Math.sin(a)*r*.65,(hash(i+100)-.5)*r);},C.gold,.05);root.add(c,burst.mesh);
 for(let i=0;i<5;i++){const r=ring(1.3+i*.37,i%2?C.cyan:C.gold,.018);r.rotation.set(i*.4,i*.6,0);rings.push(r);root.add(r);}
 return{root,update(t){c.rotation.set(t*.15,t*.23,0);rings.forEach((r,i)=>{r.rotation.y=t*.15+i*.6;r.rotation.z=t*.1+i;});root.position.set(3.8,-.05,0);root.scale.setScalar(1-ease((t-7)/2)*.45);burst.update(t);}};
}
