import type { Scene,SceneOptions } from "@frame/engine/types";
export function createScene({width,height}:SceneOptions):Scene{
 const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
 const c=canvas.getContext("2d")!;
 return {canvas,render(t){
 c.setTransform(width/1920,0,0,height/1080,0,0);
 c.fillStyle="#10251f";c.fillRect(0,0,1920,1080);
 const grad=c.createRadialGradient(1380,500,20,1350,520,820);grad.addColorStop(0,"#304b34");grad.addColorStop(0.55,"#192f25");grad.addColorStop(1,"#10251f");c.fillStyle=grad;c.fillRect(0,0,1920,1080);
 c.strokeStyle="rgba(230,241,206,0.055)";c.lineWidth=1;
 for(let x=1020;x<1900;x+=120){c.beginPath();c.moveTo(x,165);c.lineTo(x,908);c.stroke();}
 for(let y=188;y<920;y+=120){c.beginPath();c.moveTo(970,y);c.lineTo(1816,y);c.stroke();}
 c.save();c.translate(1370,535);c.rotate(-0.11+t*0.016);
 c.strokeStyle="rgba(217,255,101,0.13)";c.lineWidth=2;c.beginPath();c.ellipse(0,0,340,355,0,0,Math.PI*2);c.stroke();
 c.strokeStyle="rgba(217,255,101,0.045)";c.beginPath();c.ellipse(0,0,385,402,0,0,Math.PI*2);c.stroke();c.restore();
 c.fillStyle="rgba(235,244,220,0.035)";c.font="700 270px sans-serif";c.fillText(t<6?"01":t<13?"02":t<19?"03":"04",90,884);
 c.strokeStyle="rgba(238,244,218,0.19)";c.beginPath();c.moveTo(104,130);c.lineTo(1816,130);c.moveTo(104,958);c.lineTo(1816,958);c.stroke();
 },dispose(){canvas.width=canvas.height=1;}};
}