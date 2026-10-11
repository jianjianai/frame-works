import type { Scene,SceneOptions } from "@frame/engine/types";
const ease=(x:number)=>{x=Math.max(0,Math.min(1,x));return 1-Math.pow(1-x,3);};
const font='"Noto Sans CJK SC","Microsoft YaHei",sans-serif';
export function createScene({width,height}:SceneOptions):Scene{
 const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;const c=canvas.getContext("2d")!;
 const text=(str:string,x:number,y:number,size:number,color="#f3f1df",weight=500)=>{c.fillStyle=color;c.font=weight+" "+size+"px "+font;c.fillText(str,x,y);};
 function label(str:string,x:number,y:number){text(str,x,y,24,"#b1bd9f",500);}
 function chip(str:string,x:number,y:number,w:number){c.strokeStyle="#637443";c.lineWidth=1.5;c.strokeRect(x,y,w,50);text(str,x+20,y+34,22,"#d9ff65",500);}
 return{canvas,render(t){
 c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,width,height);c.setTransform(width/1920,0,0,height/1080,0,0);
 c.globalAlpha=1;c.fillStyle="#d9ff65";c.fillRect(104,65,14,14);text("FRAME  /  STUDIO",137,84,29,"#f3f1df",700);
 c.textAlign="right";text("OBJECT STUDIES     /     VOL. 01",1816,83,23,"#b1bd9f",500);c.textAlign="left";
 const s=t<6?0:t<13?1:t<19?2:3, start=[0,6,13,19][s],local=t-start;
 const p=ease(local/0.85);c.save();c.globalAlpha=p;c.translate(0,28*(1-p));
 if(s===0){
 label("01   /   FORM & FEEL",104,230);text("ORIGIN",100,312,50,"#d9ff65",500);
 text("每个角度",98,458,110,"#f3f1df",700);text("都值得看见。",98,592,110,"#f3f1df",700);
 text("把自然的形态，",104,684,31,"#b1bd9f");text("变成触手可及的立体印象。",104,732,31,"#b1bd9f");
 chip("形体之美",104,812,156);chip("环绕展示",278,812,156);
 label("AVOCADO  /  001",1290,886);
 }else if(s===1){
 label("02   /   LIGHT & TEXTURE",104,230);text("看见质感",100,322,48,"#d9ff65",500);
 text("把细节",98,470,112,"#f3f1df",700);text("放到光里。",98,607,112,"#f3f1df",700);
 text("柔和反射，细腻纹理。",104,703,32,"#b1bd9f");text("一束光，让形体更有分量。",104,753,32,"#b1bd9f");
 chip("立体展台",104,832,156);chip("环境光照",278,832,156);
 label("STUDIO EDITION  /  002",1250,886);
 }else if(s===2){
 label("03   /   MOTION & CHARACTER",104,230);text("鲜活呈现",100,322,48,"#d9ff65");
 text("不止形体",98,470,112,"#f3f1df",700);text("还有生命力。",98,607,112,"#f3f1df",700);
 text("让动作带出角色，",104,703,32,"#b1bd9f");text("让故事走进画面。",104,753,32,"#b1bd9f");
 chip("自然步态",104,832,156);chip("多维视角",278,832,156);
 label("FOX  /  WALK CYCLE",1270,886);
 }else{
 label("THE THREE-DIMENSIONAL COLLECTION",104,253);
 text("让灵感，有形。",98,458,103,"#f3f1df",700);
 text("FRAME STUDIO",104,563,55,"#d9ff65",700);
 text("三维示例  /  从素材到作品",104,651,32,"#b1bd9f");
 chip("探索每一种可能",104,756,257);
 }
 c.restore();
 c.fillStyle="#667052";c.fillRect(104,995,1712,2);c.fillStyle="#d9ff65";c.fillRect(104,995,1712*Math.min(1,t/23.5),2);
 label("THREE DIMENSIONS.  ONE FRAME.",104,1039);
 c.textAlign="right";text(String(s+1).padStart(2,"0")+"  /  04",1816,1039,24,"#b1bd9f");c.textAlign="left";
 if(t>=19){text("Fox: PixelMannen · tomkranis · AsoboStudio & scurest  /  CC0 + CC BY 4.0",104,926,19,"#9fac90");}
 },dispose(){canvas.width=canvas.height=1;}};
}