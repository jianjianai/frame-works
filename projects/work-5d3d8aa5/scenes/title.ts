import type { Scene, SceneOptions } from "@frame/engine/types";
import { gsap, CustomEase, strokePath } from "@frame/engine/gsap";
import { FONT, prepareTypography, disposeResources, kineticTitle, callout, morphIcon, numberCard, pathArrow, lowerThird } from "@materials/动态文字/code/motion";

const C={ink:"#12372F",paper:"#F2EFE4",orange:"#FF805F",lime:"#D8ED99",muted:"#ABC1B4",green:"#21483F"};
export async function createScene({width,height}:SceneOptions):Promise<Scene> {
 await prepareTypography();
 const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext("2d")!;
 CustomEase.create("knowledgeEnter","M0,0 C0.16,0.9 0.28,1 1,1");
 const states=Array.from({length:5},()=>({enter:0,detail:0,draw:0}));
 const tl=gsap.timeline({paused:true});
 states.forEach((s,i)=>{const start=i*4.8;tl.to(s,{enter:1,duration:0.9,ease:"knowledgeEnter"},start).to(s,{detail:1,duration:0.7,ease:"power2.out"},start+0.6).to(s,{draw:1,duration:1.8,ease:"power2.inOut"},start+0.4);});
 const words=["引子","观察","建模","验证","结语"];
 function label(s:string,x:number,y:number,size=26,color=C.paper,weight=500) {
   ctx.font=weight+" "+size+"px "+FONT;ctx.fillStyle=color;ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillText(s,x,y);
 }
 function rect(x:number,y:number,w:number,h:number,color:string,r=24) {ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
 function line(x1:number,y1:number,x2:number,y2:number,color:string,w=2) {ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
 function circle(x:number,y:number,r:number,color:string,fill=true) {ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=color;ctx.fill();}else{ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();}}
 function scoped(a:number,draw:()=>void) {ctx.save();ctx.globalAlpha*=Math.max(0,Math.min(1,a));draw();ctx.restore();}
 function heading(n:string,en:string,title:string,subtitle:string,u:number,light:boolean) {
   const fg=light?C.ink:C.paper;
   label(n+" / "+en,120,260,25,light?"#647B6F":C.muted,600);
   kineticTitle(ctx,112,460,u-0.08,{text:title,size:160,color:fg,duration:0.9,maxWidth:850});
   scoped(Math.min(1,Math.max(0,(u-0.5)/0.5)),()=>label(subtitle,120,565,43,fg,600));
 }
 function frame(t:number,idx:number,light:boolean) {
   const fg=light?C.ink:C.paper,muted=light?"#61796E":C.muted;
   label("FRAME",112,89,29,fg,800);line(242,64,242,91,muted,1.5);label("知 识 手 记",266,87,22,fg,500);
   ctx.textAlign="right";ctx.font="500 21px "+FONT;ctx.fillStyle=muted;ctx.fillText("VOL. 01   /   思考的方法",1808,87);ctx.textAlign="left";
   line(112,124,1808,124,light?"#D6DBCE":"#386054",1);
   for(let i=0;i<5;i++){
     const x=112+i*346;ctx.fillStyle=light?"#D6DBCE":"#315649";ctx.fillRect(x,976,312,3);
     ctx.fillStyle=C.orange;ctx.fillRect(x,976,312*Math.max(0,Math.min(1,(t-i*4.8)/4.8)),3);
     label("0"+(i+1),x,1022,16,muted,500);label(words[i],x+36,1022,19,i===idx?fg:muted,i===idx?700:400);
   }
 }
 function intro(u:number,s:typeof states[0]) {
   label("A FIELD GUIDE TO BETTER QUESTIONS",120,239,22,C.muted,500);
   kineticTitle(ctx,112,414,u-0.12,{text:"把复杂问题",size:136,duration:1.0,maxWidth:1000});
   kineticTitle(ctx,112,592,u-0.38,{text:"拆成三步。",size:136,color:C.orange,duration:1.0,maxWidth:1000});
   scoped(s.detail,()=>{label("从一个好问题，走向一个更好的解释。",120,699,31,C.muted);label("THINK CLEARLY / KEEP ASKING",1238,274,20,C.muted);});
   ctx.save();ctx.translate(1460,498);ctx.rotate(-0.28+0.28*s.enter);ctx.strokeStyle="#3B6154";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,335,225,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(0,0,260,302,0,0,Math.PI*2);ctx.stroke();ctx.restore();
   circle(1745,368,13,C.orange);circle(1223,683,8,C.lime);
   numberCard(ctx,1248,346,u-0.6,{text:"把思考变清楚",value:3,suffix:"步",duration:1.5,color:"#D9573D"});
   scoped(s.detail,()=>{label("观察",1250,748,27,C.paper,600);label("建模",1410,748,27,C.paper,600);label("验证",1570,748,27,C.paper,600);line(1320,737,1375,737,C.orange);line(1480,737,1535,737,C.orange);});
   lowerThird(ctx,120,808,u-1.2,{text:"今天，从「为什么」开始。",detail:"KNOWLEDGE NOTES / 思考的方法",width:925,duration:0.9});
 }
 function observe(u:number,s:typeof states[0]) {
   heading("01","OBSERVE","观察","先看见，再解释。",u,true);
   scoped(s.detail,()=>{label("放慢判断的速度，",120,665,31,"#5D776B");label("记录那些值得追问的细节。",120,713,31,"#5D776B");});
   rect(1004,204,804,568,C.ink,28);label("FIELD NOTES",1040,254,20,C.muted);label("现象 / 线索",1573,254,19,C.muted);
   for(let row=0;row<4;row++)for(let col=0;col<6;col++) {
     const x=1100+col*116,y=349+row*95;circle(x,y,4,C.green);
   }
   const cx=1311,cy=525;
   circle(cx,cy,162,"#527569",false);circle(cx,cy,118,"#315D4D",false);line(cx-187,cy,cx+187,cy,"#315D4D",1);line(cx,cy-187,cx,cy+187,"#315D4D",1);
   const dots=[[1190,452],[1307,463],[1385,552],[1230,613],[1355,631],[1480,429],[1570,613],[1120,563]];
   dots.forEach(([x,y],i)=>{circle(x,y,(i===2?15:8)*(0.35+0.65*s.enter),i===2?C.orange:"#A2BEA5");});
   ctx.save();ctx.translate(1385,552);ctx.strokeStyle=C.orange;ctx.lineWidth=3;strokePath(ctx,"M-35,-48 L-48,-48 L-48,-35 M35,-48 L48,-48 L48,-35 M48,35 L48,48 L35,48 M-35,48 L-48,48 L-48,35",s.draw);ctx.restore();
   callout(ctx,1385,462,u-0.8,{text:"关键线索",width:330,textColor:C.paper,color:C.orange,duration:1.2});
   lowerThird(ctx,120,816,u-0.85,{text:"先把事实记下来，再提出你的解释。",detail:"01 / 观察现象",width:1330,background:C.ink,duration:0.9});
 }
 function model(u:number,s:typeof states[0]) {
   heading("02","MODEL","建模","把线索，连成结构。",u,false);
   scoped(s.detail,()=>{label("找到关系，留下关键变量。",120,665,31,C.muted);label("用一个简单模型，解释复杂现象。",120,713,31,C.muted);});
   rect(1004,204,804,568,"#1B4439",28);label("BUILD A CONNECTION",1040,254,20,C.muted);
   const cx=1407,cy=468;
   ctx.save();ctx.strokeStyle="#64896B";ctx.lineWidth=2;
   strokePath(ctx,"M1140,352 L1407,468 L1674,352 M1140,643 L1407,468 L1674,643",s.draw);ctx.restore();
   const pts=[[1140,352,"线索 A"],[1674,352,"线索 B"],[1140,643,"变量"],[1674,643,"关系"]];
   pts.forEach(v=>{const x=v[0] as number,y=v[1] as number;circle(x,y,10,C.lime);label(v[2] as string,x-37,y+(y<400?-26:50),24,C.muted);});
   morphIcon(ctx,cx,cy,u-0.25,{text:"一个可解释的模型",size:264,color:C.orange,duration:2,textColor:C.paper});
   lowerThird(ctx,120,816,u-0.85,{text:"模型是帮助理解的工具，也允许被修正。",detail:"02 / 建立解释",width:1330,duration:0.9});
 }
 function verify(u:number,s:typeof states[0]) {
   heading("03","VERIFY","验证","让证据，修正想法。",u,true);
   scoped(s.detail,()=>{label("主动寻找反例，",120,665,31,"#5D776B");label("让下一次解释，比这一次更接近答案。",120,713,31,"#5D776B");});
   rect(1004,204,804,568,"#E2E5D7",28);label("TEST / LEARN / REPEAT",1040,254,20,"#61796E",600);
   numberCard(ctx,1040,337,u-0.45,{text:"验证循环（示意）",value:3,suffix:"轮",duration:1.8,color:"#C75037",background:"#FBF9F1"});
   scoped(s.detail,()=>{label("假设",1510,359,28,C.ink,600);label("证据",1668,530,28,C.ink,600);label("更新解释",1510,664,25,C.ink,500);});
   pathArrow(ctx,1510,386,u-0.65,{text:"继续求证",width:230,duration:2,color:"#BA573E"});
   label("演示计数 · 非实验数据",1040,731,20,"#61796E");
   lowerThird(ctx,120,816,u-0.85,{text:"不急于证明自己正确，先检查证据是否充分。",detail:"03 / 对照证据",width:1460,background:C.ink,duration:0.9});
 }
 function ending(u:number,s:typeof states[0]) {
   label("EVERY ANSWER STARTS WITH A QUESTION",120,238,22,C.muted);
   kineticTitle(ctx,112,417,u-0.15,{text:"保持好奇。",size:144,color:C.paper,duration:1.1,maxWidth:1350});
   scoped(s.detail,()=>{label("让每个问题，都有下一步。",120,496,34,C.muted);label("NEXT QUESTION",1465,290,22,C.muted);});
   pathArrow(ctx,1447,343,u-0.3,{text:"",width:288,duration:1.8,color:C.orange});
   const titles=["观察","建模","验证"],sub=["看见现象","形成解释","对照证据"];
   for(let i=0;i<3;i++) {
      const x=120+i*568;scoped(Math.min(1,Math.max(0,(u-0.45-i*0.16)/0.5)),()=>{
        rect(x,568,536,176,i===2?C.orange:C.green,20);
        label("0"+(i+1),x+30,615,21,i===2?C.ink:C.muted,600);
        label(titles[i],x+106,642,49,i===2?C.ink:C.paper,700);
        label(sub[i],x+108,695,24,i===2?C.ink:C.muted);
      });
   }
   lowerThird(ctx,120,811,u-1.25,{text:"观察 → 建模 → 验证",detail:"KEEP ASKING / 保持好奇，继续求证",width:1110,duration:0.9});
   scoped(s.detail,()=>{label("FRAME / 知识手记",1450,901,24,C.muted);});
 }
 return {canvas,render(t) {
   t=Math.max(0,Math.min(24,t));tl.seek(t,true);
   const idx=Math.min(4,Math.floor(t/4.8)),u=t-idx*4.8,light=idx===1||idx===3;
   ctx.setTransform(width/1920,0,0,height/1080,0,0);ctx.globalAlpha=1;ctx.fillStyle=light?C.paper:C.ink;ctx.fillRect(0,0,1920,1080);
   [intro,observe,model,verify,ending][idx](u,states[idx]);frame(t,idx,light);
   // A brief shared wipe closes each chapter and opens the next one.
   const d=0.20;
   if(idx<4&&u>4.8-d) { const p=(u-(4.8-d))/d;ctx.fillStyle=C.orange;ctx.fillRect(1920*(1-p),124,1920*p,824); }
   else if(idx>0&&u<d) {const p=u/d;ctx.fillStyle=C.orange;ctx.fillRect(0,124,1920*(1-p),824);}
 },dispose(){tl.kill();disposeResources(ctx);canvas.width=canvas.height=1;}};
}
