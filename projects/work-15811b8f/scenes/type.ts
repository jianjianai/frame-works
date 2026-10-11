import type { SceneOptions } from "@frame/engine/types";
import { createPixiScene } from "@frame/engine/scene-adapters";
import { Container, Graphics, Text } from "pixi.js";
import { neonType } from "@materials/Pixi特效/code/effects";
import { beatAt, pulse } from "@frame/engine/tempo";
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x);};
function text(value:string,size:number,color:string,spacing=0,weight:"400"|"600"|"800"="400"){
 return new Text({text:value,style:{fontFamily:"Arial, Noto Sans CJK SC, sans-serif",fontSize:size,fill:color,fontWeight:weight,letterSpacing:spacing}});
}
export function createScene(options:SceneOptions){return createPixiScene(options,app=>{
 const root=new Container();root.scale.set(options.width/1600,options.height/900);app.stage.addChild(root);
 const chrome=new Container(),frame=new Graphics();root.addChild(chrome);
 const brand=text("FRAME",23,"#eef5f5",4,"800");brand.position.set(86,60);
 const studio=text("STUDIO  /  MOTION COLLECTION",11,"#9caabd",2);studio.position.set(220,70);
 const edition=text("NIGHT STUDIES     —     VOL. 01",11,"#b7c5d5",2);edition.position.set(1180,70);
 const topLine=new Graphics().moveTo(86,109).lineTo(1514,109).stroke({color:0xa3bcda,alpha:.24,width:1});
 const dot=new Graphics().circle(1510,76,3).fill("#79f5ed");chrome.addChild(brand,studio,edition,topLine,dot);
 const footer=text("霓虹夜景特效  /  AFTER HOURS",14,"#b4c1d5",2);footer.position.set(86,824);
 const footright=text("LIGHT FINDS A WAY.",12,"#90b4bd",2);footright.position.set(1322,826);chrome.addChild(footer,footright);
 const rule=new Graphics().moveTo(86,804).lineTo(1514,804).stroke({color:0xa3bcda,alpha:.2,width:1});chrome.addChild(rule);
 const sections=[
  {start:0,end:6,top:"01    /    WHEN THE CITY WAKES",big:"AFTER\nHOURS",sub:"夜色有回响",note:"Follow the light into the night.",color:"#79f5ed" as const,size:170},
  {start:6,end:14,top:"02    /    A RHYTHM IN THE RAIN",big:"FEEL THE\nCURRENT",sub:"听见雨中的脉冲",note:"Every drop. Every beat. Alive.",color:"#79f5ed" as const,size:139},
  {start:14,end:20,top:"03    /    LET THE NIGHT BLOOM",big:"LIGHT\nIT UP.",sub:"让此刻，盛放",note:"A thousand sparks. One shared sky.",color:"#ff69c9" as const,size:170},
  {start:20,end:24,top:"04    /    TAKE THE GLOW WITH YOU",big:"KEEP\nGLOWING.",sub:"微光不息",note:"A FRAME Studio motion study.",color:"#79f5ed" as const,size:152},
 ];
 const cards=sections.map(s=>{
  const c=new Container();root.addChild(c);
  const tag=text(s.top,12,"#96c7cb",2);tag.position.set(91,190);
  const fx=neonType({width:1600,height:900,text:s.big,fontSize:s.size,color:s.color,glow:18,beatAmount:.26});fx.view.position.set(82,242);
  const sub=text(s.sub,28,"#edf9f8",7,"600");sub.position.set(89,608);
  const note=text(s.note,15,"#859cb7",1);note.position.set(91,665);
  const dash=new Graphics().rect(90,727,39,3).fill(s.color);const small=text("NOCTURNE  /  "+String(s.start/2+1).padStart(2,"0"),11,"#698496",2);small.position.set(149,722);
  c.addChild(tag,fx.view,sub,note,dash,small);
  return {c,fx,...s};
 });
 const orbitLabel=text("AFTER\nDARK",15,"#bfccdf",6);orbitLabel.position.set(1141,284);root.addChild(orbitLabel);
 const orbitMark=new Graphics().moveTo(1190,210).lineTo(1190,226).moveTo(1182,218).lineTo(1198,218).stroke({color:"#79f5ed",alpha:.6,width:1});root.addChild(orbitMark);
 const timeline=new Graphics();chrome.addChild(timeline);
 const meters=Array.from({length:18},(_,i)=>{const g=new Graphics().rect(0,0,2,18).fill("#79f5ed");g.position.set(1458+i*3.3,742);root.addChild(g);return g;});
 return t=>{
  const end=1-smooth((t-23.4)/.6);root.alpha=end;
  chrome.alpha=.55+.45*smooth(t/.7);
  for(const s of cards){const start=beatAt(s.start*2),endAt=beatAt(s.end*2);const local=t-start;
   s.c.visible=t>=start&&t<endAt;
   const intro=smooth(local/.65);s.c.alpha=intro;s.c.y=(1-intro)*18;s.fx.update(t);
  }
  orbitLabel.alpha=t>=14&&t<20?0:.55;orbitMark.alpha=orbitLabel.alpha;
  timeline.clear().rect(86,803,1428*clamp(t/24),1.4).fill({color:"#79f5ed",alpha:.64});
  meters.forEach((g,i)=>{g.scale.y=.2+.8*Math.abs(Math.sin(t*2.3+i*.52))*(.55+.45*pulse(t,5));g.alpha=.22+.3*pulse(t,6);});
 };
});}
