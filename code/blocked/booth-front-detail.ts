/** Detailed reverse angle of the same night guard booth, plus a separately composited foreground desk. */
import { Ctx, F, H, Pt, W, blob, fillBg, glow, hash, inkLine, lightShaft, oval, paint, poly, rbox, text, vgrad } from "../draw";
import { snow } from "./snow";
export interface FrontDetailOptions { clock?:number;month?:string;day?:string;drawing?:string;lonely?:boolean; }
export interface FrontDeskOptions { y?:number;phoneLight?:number;lonely?:boolean; }

/** the lonely booth's grade (same as booth-detail.ts lonelyLight): cold blue, colour drained */
function lonelyGrade(c:Ctx) {
  c.save();
  c.globalCompositeOperation="multiply";
  c.fillStyle="rgb(150,166,206)";c.fillRect(-60,-60,W+120,H+120);
  c.globalCompositeOperation="color";
  c.globalAlpha=.3;c.fillStyle="#32466e";c.fillRect(-60,-60,W+120,H+120);
  c.restore();
}
export interface FrontProps { mug:(c:Ctx,x:number,y:number,s:number,t:number,seed:number)=>void; }

function clock(c:Ctx,hours:number) {
  const x=219,y=333;
  oval(c,x-3,y+8,85,85,91001,.5);paint(c,"rgba(6,13,19,.42)",null);
  oval(c,x,y,83,83,91002,.6);paint(c,"#3d4548","#121f27",4);
  oval(c,x,y,75,75,91003,.4);paint(c,"#b4b9a9","#687976",2);
  oval(c,x,y,69,69,91004,.3);paint(c,"#b9beaf",null);
  for(let i=0;i<60;i++) {
    const a=i/60*Math.PI*2,outer=65,inner=i%5===0?56:61;
    inkLine(c,[[x+Math.sin(a)*inner,y-Math.cos(a)*inner],[x+Math.sin(a)*outer,y-Math.cos(a)*outer]],91010+i,i%5===0?2.3:.7,"#3e4b4a",.1);
  }
  for(const [s,dx,dy] of [["12",0,-42],["3",43,0],["6",0,45],["9",-44,0]] as [string,number,number][])text(c,s,x+dx,y+dy,{size:17,font:F.ui,fill:"#374645"});
  const ma=(hours%1)*Math.PI*2,ha=(hours%12)/12*Math.PI*2;
  inkLine(c,[[x,y],[x+Math.sin(ha)*35,y-Math.cos(ha)*35]],91075,4.5,"#25383d",.2);
  inkLine(c,[[x,y],[x+Math.sin(ma)*51,y-Math.cos(ma)*51]],91076,2.8,"#25383d",.2);
  oval(c,x,y,4.3,4.3,91077,.1);paint(c,"#a99260","#2b3b3d",1);
  c.beginPath();c.arc(x,y,72,3.8,5.35);c.strokeStyle="rgba(212,216,189,.28)";c.lineWidth=2;c.stroke();
}
function calendar(c:Ctx,o:FrontDetailOptions) {
  rbox(c,335,300,198,246,4,91100,.4);paint(c,"rgba(8,18,23,.3)",null);
  rbox(c,339,291,194,244,4,91101,.4);paint(c,"#8c988c","#2d4142",2);
  for(let i=3;i>=0;i--){poly(c,[[341,295+i*2],[530,295+i*2],[530,525+i*3],[344,529+i*3]],91102+i,.4);paint(c,i%2?"#aab4a1":"#a1aa99","#697f77",.6);}
  poly(c,[[341,296],[530,296],[530,524],[344,526]],91108,.4);paint(c,"#b7bda8","#465c55",1.5);
  c.fillStyle="#813e34";c.fillRect(343,297,185,48);
  text(c,o.month??"一月",435,321,{size:27,font:F.ui,weight:700,fill:"#dbd0b3"});
  text(c,o.day??"14",436,417,{size:78,font:F.ui,weight:700,fill:"#46534b"});
  for(let i=0;i<7;i++)for(let j=0;j<2;j++)text(c,String(15+i+j*7),361+i*24,477+j*19,{size:11,font:F.ui,fill:i===6?"#9a6650":"#647b6c"});
  for(const x of [363,508]){oval(c,x,297,4,5,91120+x,.1);paint(c,"#253c3b","#9aa493",1);}
  poly(c,[[505,526],[530,502],[530,524]],91124,.2);paint(c,"#c7c9b1","#839788",1);
}
function drawing(c:Ctx,label:string) {
  c.save();c.translate(178,621);c.rotate(-.06);
  rbox(c,-117,-98,238,194,4,91200,.5);paint(c,"#4f5140","#172d31",3);
  poly(c,[[-110,-94],[112,-92],[111,89],[-109,90]],91201,.4);paint(c,"#c6bfa0","#7d8974",1);
  for(let i=0;i<10;i++)inkLine(c,[[-102,67+i*.5],[101,65+i*.7]],91203+i,1,"rgba(146,166,95,.22)",.2);
  for(const [x,y,s,col] of [[-40,-42,1,"#496d94"],[30,-6,.7,"#b55e6e"]] as [number,number,number,string][]) {
    oval(c,x,y,18*s,18*s,91220+x,.5);paint(c,null,col,4);
    inkLine(c,[[x,y+20*s],[x,y+80*s]],91221+x,5,col,.7);
    inkLine(c,[[x,y+79*s],[x-15*s,y+103*s]],91222+x,4,col,.6);
    inkLine(c,[[x,y+79*s],[x+16*s,y+103*s]],91223+x,4,col,.6);
  }
  inkLine(c,[[-40,0],[-4,27],[30,23]],91260,5,"#c4924f",.7);
  oval(c,72,-64,12,12,91261,.5);paint(c,"#c6a951",null);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;inkLine(c,[[72+Math.cos(a)*18,-64+Math.sin(a)*18],[72+Math.cos(a)*25,-64+Math.sin(a)*25]],91262+i,1.8,"#c6a951",.2);}
  text(c,label,-5,74,{size:24,font:F.pen,fill:"#a36c68"});
  for(const x of [-99,101]){oval(c,x,-83,4,4,91275+x,.15);paint(c,"#aaa377","#596b5d",1);}
  c.restore();
}
function window(c:Ctx,t:number,lonely=false) {
  rbox(c,685,243,330,455,7,91300,.5);paint(c,"#101e2a","#142631",3);
  c.save();c.beginPath();c.rect(710,268,280,401);c.clip();
  fillBg(c,vgrad(c,260,680,[[0,"#182536"],[1,"#0e1f2b"]]));
  if(lonely) {
    // the moon over the factory roofs (the same moon as the back view's window)
    glow(c,785,335,190,"rgba(190,210,250,.24)");
    oval(c,785,335,25,25,91318,.3);paint(c,"#e3e9f4",null);
    oval(c,779,330,7,6,91319,.3);paint(c,"rgba(160,175,200,.35)",null);
  }
  for(let i=0;i<5;i++) {
    const x=695+i*78,y=464+hash(i*5.7)*72;
    c.fillStyle=i%2?"#172b35":"#13232f";c.fillRect(x,y,60,240);
    for(let j=0;j<2;j++){c.fillStyle="rgba(155,148,97,.16)";c.fillRect(x+12+j*20,y+21,7,11);}
  }
  // the lamp by the gate (lonely: a cold white one)
  glow(c,936,354,lonely?140:180,lonely?"rgba(205,218,240,.16)":"rgba(224,155,83,.3)");
  inkLine(c,[[941,327],[941,666]],91315,3,"#344342",.2);
  oval(c,936,341,16,4,91316,.3);paint(c,lonely?"#c9d3e2":"#d6ab69",null);
  lightShaft(c,[[926,345],[946,345],[1020,670],[825,670]],936,345,925,680,lonely?"205,218,240":"237,177,105",lonely?.07:.13,9,"booth_front_outside");
  snow(c,t,{x:700,y:250,w:310,h:440,n:27,seed:71,speed:80,size:2.7,alpha:.5,drift:16});
  glow(c,716,663,138,"rgba(157,187,189,.13)");glow(c,985,666,145,"rgba(167,187,179,.12)");
  for(let i=0;i<16;i++){const x=718+hash(i*8.2)*267,y=552+hash(i*3.8)*108;inkLine(c,[[x,y],[x+1,y+12+hash(i)*26]],91330+i,.8,"rgba(167,193,190,.18)",.1);}
  c.restore();
  for(const [x,w] of [[695,10],[845,11],[995,10]]) {
    c.fillStyle="#4a606a";c.fillRect(x,253,w,430);
    inkLine(c,[[x+2,256],[x+2,680]],91360+x,1.6,"#879994",.15);
    inkLine(c,[[x+w,256],[x+w,680]],91361+x,2.5,"#152d37",.15);
  }
  for(const y of [252,674]){
    poly(c,[[697,y],[1005,y],[1005,y+13],[697,y+13]],91370+y,.2);paint(c,"#516770","#172e36",1.5);
    inkLine(c,[[701,y+3],[1001,y+3]],91371+y,1.6,"#91a295",.1);
  }
  rbox(c,839,475,28,62,6,91380,.2);paint(c,"#344b56","#172a36",2);
  inkLine(c,[[852,486],[850,521]],91381,3,"#879b9d",.15);
  poly(c,[[683,685],[1017,685],[1031,705],[671,705]],91382,.35);paint(c,"#4e6668","#19323b",2.5);
  for(const [x,y] of [[706,262],[998,262],[706,682],[998,682]]){oval(c,x,y,2.4,2.4,91383+x+y,.1);paint(c,"#a5ac98",null);}
}
function scarf(c:Ctx) {
  inkLine(c,[[986,817],[986,845],[978,853]],91400,5,"#243f43",.3);
  rbox(c,966,800,39,29,5,91401,.4);paint(c,"#6e7769","#284344",2);
  blob(c,[[968,849],[1001,844],[1020,1040],[994,1146],[967,1108],[957,973]],91402,.6);paint(c,"#75404a","#25343c",3);
  blob(c,[[986,844],[1007,857],[990,1113],[968,1123],[978,972]],91403,.5);paint(c,"#653742","#25363b",2.5);
  for(let i=0;i<19;i++)inkLine(c,[[966,876+i*12],[1004,867+i*12]],91410+i,1.3,"rgba(173,121,113,.20)",.2);
  for(let i=0;i<6;i++)inkLine(c,[[969+i*5,1114],[967+i*5,1134+hash(i)*13]],91440+i,1.9,"#97615e",.3);
}
function heater(c:Ctx,on=true) {
  if(on)glow(c,125,1420,390,"rgba(223,133,62,.16)");
  rbox(c,56,1321,172,202,23,91500,.5);paint(c,"#44463a","#162c2c",3);
  rbox(c,68,1334,148,170,15,91501,.4);paint(c,on?"#563f30":"#3a3a36",on?"#837253":"#5d6058",2);
  for(let i=0;i<5;i++){
    if(on)inkLine(c,[[82,1356+i*28],[203,1356+i*28]],91510+i,5,"rgba(206,113,51,.32)",.2);
    inkLine(c,[[85,1356+i*28],[200,1356+i*28]],91520+i,1.7,on?"#c98d59":"#6b6c62",.2);
  }
  for(let i=0;i<6;i++)inkLine(c,[[82+i*23,1344],[82+i*23,1494]],91530+i,2.8,"#293a35",.2);
}
export function detailedBoothFront(c:Ctx,t:number,o:FrontDetailOptions={}) {
  fillBg(c,vgrad(c,0,H,[[0,"#232e3b"],[.6,"#2d363d"],[.601,"#263a36"],[1,"#162c2b"]]));
  for(let i=0;i<85;i++){
    const x=hash(i*3.71)*W,y=hash(i*6.81)*1170;
    inkLine(c,[[x,y],[x+5+hash(i)*13,y+1]],91600+i,.8,"rgba(166,174,164,.065)",.2);
  }
  inkLine(c,[[-60,1153],[1140,1153]],91690,8,"#384d43",.3);
  inkLine(c,[[-60,1160],[1140,1160]],91691,2,"#102d2e",.2);
  // Quiet pipework and a small wall socket give the real room a scale.
  inkLine(c,[[48,-60],[48,840],[62,863],[62,1120]],91692,6,"#172e35",.4);
  inkLine(c,[[51,-60],[51,840],[65,863],[65,1120]],91693,1.5,"#566866",.3);
  rbox(c,39,1120,48,66,6,91694,.3);paint(c,"#556358","#213c3b",2);
  for(const x of [54,74])inkLine(c,[[x,1141],[x,1153]],91695+x,2,"#243b3c",.1);
  clock(c,o.clock??2.8833);calendar(c,o);drawing(c,o.drawing??"爸爸");window(c,t,o.lonely);scarf(c);
  // A wooden chair behind the coat anchors the seated silhouette.
  for(const x of [186,892]){inkLine(c,[[x,1030],[x,1600]],91700+x,25,"#28332c",.4);inkLine(c,[[x+3,1030],[x+3,1580]],91701+x,4,"#586048",.3);}
  rbox(c,193,926,693,253,52,91710,.6);paint(c,"#303c33","#142b2b",4);
  inkLine(c,[[229,969],[540,953],[851,969]],91711,4,"#63674b",.4);
  for(const x of [264,822])inkLine(c,[[x,972],[x,1136]],91712+x,10,"#4b5240",.3);
  heater(c,!o.lonely);
  if(o.lonely){lonelyFront(c,o);return;}
  lightShaft(c,[[918,349],[1000,393],[788,1170],[123,927]],963,362,408,1033,"231,171,100",.09,30,"booth_front_room");
  glow(c,990,415,465,"rgba(219,153,91,.10)");
  glow(c,44,976,470,"rgba(133,169,183,.07)");
  const vignette=c.createRadialGradient(560,781,341,540,840,1170);
  vignette.addColorStop(0,"rgba(7,20,30,0)");vignette.addColorStop(1,"rgba(6,18,27,.32)");
  c.fillStyle=vignette;c.fillRect(-60,-60,1200,2040);
}

/** The lonely reverse angle (the same booth as boothBack lonely, seen from the other side): heater off, the moon in
 *  the side window laying a pale pane of light across the back wall toward the lower left, everything graded cold;
 *  only her crayon drawing of the two of them keeps its warmth. */
function lonelyFront(c:Ctx,o:FrontDetailOptions) {
  lightShaft(c,[[918,349],[1000,393],[788,1170],[123,927]],963,362,408,1033,"185,205,250",.17,30,"booth_front_moon");
  glow(c,900,420,470,"rgba(150,175,230,.08)");
  lonelyGrade(c);
  c.save();c.globalAlpha=.78;drawing(c,o.drawing??"爸爸");c.restore();
  c.save();c.globalCompositeOperation="screen";
  // the moon stays bright through the grade, and the window frame's edge facing it catches a little of it
  glow(c,785,335,110,"rgba(205,222,255,.3)");
  inkLine(c,[[697,262],[697,676]],91390,2,"rgba(190,210,250,.35)",.15);
  c.restore();
  const v=c.createRadialGradient(560,760,300,540,840,1150);
  v.addColorStop(0,"rgba(4,8,18,0)");v.addColorStop(.6,"rgba(4,8,18,.12)");v.addColorStop(1,"rgba(4,8,18,.5)");
  c.fillStyle=v;c.fillRect(-60,-60,1200,2040);
}

/** Draw after the figure, under the lyrics. The original mug is reused, from the reverse camera side. */
export function detailedFrontDesk(c:Ctx,t:number,o:FrontDeskOptions,props:FrontProps) {
  const y=o.y??1495;
  c.save();
  poly(c,[[-80,y+5],[1130,y-4],[1190,2010],[-120,2010]],91800,.5);
  paint(c,vgrad(c,y,2000,[[0,"#51483b"],[.65,"#3d3c32"],[1,"#233433"]]),"#172c2c",4);
  c.save();poly(c,[[-80,y+5],[1130,y-4],[1190,2010],[-120,2010]],91800,.5);c.clip();
  for(let i=0;i<47;i++) {
    const yy=y+hash(i*7.3)*510,x=hash(i*4.3)*1300-110,len=80+hash(i)*300;
    inkLine(c,[[x,yy],[x+len*.4,yy-3],[x+len,yy+1]],91810+i,.8,"rgba(171,137,85,.12)",.2);
  }
  glow(c,290,y-3,383,"rgba(10,22,27,.3)");
  glow(c,975,y+109,420,"rgba(224,162,96,.10)");
  glow(c,531,y+30,302,"rgba(136,182,197,.09)",o.phoneLight??1);
  const reflection=c.createLinearGradient(0,y+80,0,1890);
  reflection.addColorStop(0,"rgba(180,173,133,.055)");reflection.addColorStop(.35,"rgba(158,182,174,.035)");reflection.addColorStop(1,"rgba(136,169,158,0)");
  poly(c,[[792,y+47],[967,y+40],[666,1960],[349,1960]],91859,.2);paint(c,reflection,null);
  const glare=c.createLinearGradient(0,y,1000,y+430);
  glare.addColorStop(0,"rgba(185,208,197,0)");glare.addColorStop(.6,"rgba(174,202,196,.06)");glare.addColorStop(.67,"rgba(184,204,188,.015)");glare.addColorStop(1,"rgba(185,208,197,0)");
  c.fillStyle=glare;c.fillRect(-80,y,1280,550);
  c.restore();
  inkLine(c,[[-70,y+10],[1135,y+2]],91861,4,"rgba(139,166,144,.31)",.3);
  inkLine(c,[[-70,1873],[1140,1864]],91862,5,"#183c35",.3);
  inkLine(c,[[-70,1868],[1140,1859]],91863,2,"rgba(154,185,150,.24)",.2);
  // The tea is now on the left, the duty book on the right, matching the reverse view.
  oval(c,123,y+196,95,23,91870,.4);paint(c,"rgba(9,23,23,.3)",null);
  props.mug(c,120,y+135,1.05,t,91872);
  c.save();rbox(c,67,y+71,107,128,14,91873,.5);c.clip();
  c.fillStyle="rgba(27,51,50,.28)";c.fillRect(65,y+70,112,130);
  glow(c,160,y+87,140,"rgba(215,177,113,.13)");c.restore();
  oval(c,120,y+72,50,10,91874,.3);paint(c,"#786747","#a9ae91",2);
  inkLine(c,[[87,y+68],[125,y+64],[156,y+68]],91875,2,"#ccb891",.2);
  // The near corner of a log book, without new story text competing with the face.
  c.save();c.translate(990,y+259);c.rotate(-.12);
  poly(c,[[-176,-86],[186,-91],[195,101],[-186,99]],91900,.4);paint(c,"#253a32","#162e2d",3);
  for(let i=2;i>=0;i--){poly(c,[[-169,-88+i*2],[181,-87+i*2],[187,94+i*2],[-177,93+i*2]],91901+i,.3);paint(c,i%2?"#899783":"#a9ad95","#5e7769",.7);}
  inkLine(c,[[4,-88],[6,92]],91906,2,"#546b5f",.2);
  for(let j=0;j<5;j++)for(const x of [-151,22])inkLine(c,[[x,-54+j*30],[x+123,-54+j*30]],91910+x+j,.8,"rgba(53,103,110,.35)",.1);
  text(c,"值班记录",-86,-69,{size:18,font:F.ui,fill:"#3b554d"});
  ["22:00 巡逻一次","23:30 正常","00:40 正常","01:50 下雪"].forEach((entry,i)=>text(c,entry,-87,-35+i*29,{size:14,font:F.pen,fill:"#3f5b66"}));
  inkLine(c,[[-148,84],[-32,85]],91921,.7,"rgba(51,85,89,.25)",.1);
  c.restore();
  if(o.lonely) {
    // the desk in the same cold blue; the only warm thing on it is the phone's light on the glass (she's on the screen)
    c.save();
    poly(c,[[-80,y+5],[1130,y-4],[1190,2010],[-120,2010]],91800,.5);c.clip();
    lonelyGrade(c);
    c.globalCompositeOperation="screen";
    c.save();c.translate(531,y+40);c.scale(1.6,1);glow(c,0,0,260,"rgba(255,172,104,.2)",o.phoneLight??1);c.restore();
    c.restore();
    // the moon from the side window on the desk's back edge and the mug's rim
    c.save();c.globalCompositeOperation="screen";
    inkLine(c,[[560,y+5],[1135,y+1]],91864,3,"rgba(185,205,250,.35)",.3);
    c.restore();
    const v=c.createLinearGradient(0,y,0,2000);
    v.addColorStop(0,"rgba(4,8,18,0)");v.addColorStop(1,"rgba(4,8,18,.4)");
    c.fillStyle=v;c.fillRect(-60,y-10,1200,2040-y);
  }
}
