/** Detailed dressing for boothBack. Reuses the existing gate, thermos and enamel mug through a small drawing bridge. */
import { C, Ctx, F, H, Pt, W, blob, fillBg, glow, hash, inkLine, lightShaft, motes, oval, paint, poly, rbox, text, vgrad } from "../draw";
type GateOptions={name?:string;led?:string;quiet?:boolean};
export interface DetailedBoothOptions extends GateOptions { cctv?:string; lonely?:boolean; }
interface BoothProps {
  gate:(c:Ctx,t:number,ox:number,o:GateOptions)=>void;
  thermos:(c:Ctx,x:number,y:number,s:number,seed:number)=>void;
  mug:(c:Ctx,x:number,y:number,s:number,t:number,seed:number)=>void;
}

function heater(c:Ctx) {
  glow(c,963,1532,350,"rgba(237,120,54,0.17)");
  oval(c,950,1659,127,24,87000,.5);paint(c,"rgba(5,10,17,0.5)",null);
  poly(c,[[913,1580],[982,1580],[1006,1661],[883,1661]],87001,.6);paint(c,"#302e2d",C.ink,4);
  oval(c,945,1489,102,130,87002,.8);paint(c,"#5b5145",C.ink,5);
  oval(c,945,1489,88,116,87003,.6);paint(c,vgrad(c,1370,1610,[[0,"#62574c"],[.5,"#974f33"],[1,"#433f37"]]),"#b89868",2.5);
  c.save();oval(c,945,1489,87,115,87003,.2);c.clip();
  for(let y=1416;y<1569;y+=28){
    inkLine(c,[[879,y+4],[945,y],[1009,y+4]],87010+y,9,"rgba(245,130,63,.17)",.2);
    inkLine(c,[[883,y+4],[945,y],[1006,y+4]],87011+y,2.5,"#e49658",.2);
  }
  for(let i=-4;i<=4;i++)inkLine(c,[[945+i*17,1365],[945+i*22,1490],[945+i*17,1610]],87040+i,2.8,"#292c30",.3);
  for(const y of [1410,1472,1534,1579])inkLine(c,[[851,y],[945,y+10],[1040,y]],87050+y,2.2,"#353335",.3);
  c.restore();
  oval(c,945,1489,92,121,87004,.6);paint(c,null,"#898779",3);
  rbox(c,922,1617,46,16,4,87005,.3);paint(c,"#403b38",C.ink,2);
  oval(c,947,1625,3,3,87006,.1);paint(c,"#d69a52",null);
  inkLine(c,[[1000,1650],[1066,1695],[1085,1560],[1030,1450]],87007,3,"#151e23",.4);
}

function roomShell(c:Ctx,lonely=false) {
  fillBg(c,vgrad(c,0,H,lonely?[[0,"#232a37"],[.57,"#1c2330"],[1,"#121a1e"]]:[[0,"#303644"],[.57,"#262e38"],[1,"#172525"]]));
  c.fillStyle=vgrad(c,1060,1590,lonely?[[0,"#2a3540"],[1,"#172126"]]:[[0,"#34443e"],[1,"#1d2c2c"]]);c.fillRect(-60,1060,1200,560);
  inkLine(c,[[-60,1102],[1140,1102]],87100,9,"#4e5d50",.3);
  for(let i=0;i<64;i++){
    const x=hash(i*6.7)*W,y=hash(i*2.9)*1550;
    inkLine(c,[[x,y],[x+5+hash(i+12)*13,y+2]],87110+i,1.2,"rgba(172,173,150,.075)",.2);
  }
  // Exposed conduit, old paint chips and a low electrical socket (the lonely room is kept bare).
  if(!lonely){
  inkLine(c,[[1038,-40],[1038,151],[1054,177],[1054,1360]],87190,6,"#1b2530",.5);
  inkLine(c,[[1036,-40],[1036,151],[1052,177],[1052,1360]],87191,2,"#657073",.3);
  rbox(c,1018,1360,62,80,7,87192,.5);paint(c,"#63675e","#1a242a",3);
  for(const y of [1383,1417])for(const x of [1037,1058])inkLine(c,[[x,y-4],[x,y+4]],87193+x+y,2.5,"#242b2a",.2);
  }
  for(let i=0;i<16;i++){const y=630+i*45;poly(c,[[18,y],[38,y-4],[34,y+6],[23,y+9]],87200+i,.4);paint(c,"rgba(98,111,107,.13)",null);}
  // A small old fluorescent fitting supplies a weak cool fill.
  oval(c,413,157,300,22,87220,.4);paint(c,"rgba(4,8,15,.25)",null);
  rbox(c,144,128,550,33,5,87221,.4);paint(c,"#4c555c","#141d28",3);
  rbox(c,169,140,496,12,5,87222,.2);paint(c,lonely?"#3b4652":"#a4b6bd",null);
  for(const x of [156,680])inkLine(c,[[x,133],[x,151]],87223+x,2,"#969a99",.2);
  if(!lonely)glow(c,420,158,420,"rgba(149,183,207,.09)");
  // Tile floor, under-desk cabinet, and an actual seat under the heavy coat.
  poly(c,[[-60,1565],[1140,1546],[1140,2000],[-60,2000]],87230,.6);paint(c,"#293236","#111e25",4);
  for(let i=-4;i<8;i++)inkLine(c,[[540+i*90,1555],[540+i*270,2000]],87240+i,2,"rgba(9,17,24,.46)",.4);
  for(const y of [1640,1770,1945])inkLine(c,[[-60,y],[1140,y-15]],87250+y,2,"rgba(103,116,115,.18)",.3);
  for(let i=0;i<4;i++){oval(c,94+i*47,1763+i*42,16,32,87260+i,.4,-.3);paint(c,"rgba(14,23,27,.3)",null);}
  poly(c,[[6,1280],[271,1280],[252,1590],[6,1590]],87270,.7);paint(c,"#38413b",C.ink,4);
  for(let i=0;i<2;i++){
    rbox(c,28,1318+i*117,212,94,4,87271+i,.5);paint(c,"#444b40","#222d2b",3);
    inkLine(c,[[109,1353+i*117],[163,1353+i*117]],87274+i,5,"#9b9178",.4);
  }
  for(const x of [38,234,1072])inkLine(c,[[x,1572],[x-5,1685]],87280+x,13,"#1a2526",.5);
  oval(c,511,1885,321,69,87290,.7);paint(c,"rgba(2,9,17,.34)",null);
  for(const x of [273,770]){
    inkLine(c,[[x,1590],[x,1850],[x+(x<500?-23:23),1990]],87291+x,13,"#1c242b",.5);
    inkLine(c,[[x+3,1590],[x+3,1850]],87292+x,3,"#657071",.3);
  }
  rbox(c,251,1720,539,155,27,87295,.8);paint(c,"#514535",C.ink,5);
  inkLine(c,[[267,1740],[775,1740]],87296,3,"#8e7452",.5);
  heater(c);
}

function windowFrame(c:Ctx,abs:number,o:DetailedBoothOptions,p:BoothProps) {
  // Recess keeps the window a hole in a thick wall, rather than a bright outline.
  rbox(c,69,213,945,840,10,87300,.8);paint(c,"#171f2c","#3b4149",5);
  rbox(c,86,237,911,786,6,87301,.4);paint(c,"#777d80","#101823",5);
  c.save();c.beginPath();c.rect(100,250,880,760);c.clip();
  p.gate(c,abs,-40,{...o,quiet:o.quiet??o.lonely});
  // Glass depth and the indoor tube's faint reflection.
  c.fillStyle="rgba(115,157,179,.035)";c.fillRect(100,250,880,760);
  poly(c,[[210,250],[246,250],[722,1009],[677,1009]],87302,.2);paint(c,"rgba(168,202,228,.025)",null);
  inkLine(c,[[168,322],[459,322]],87303,5,"rgba(185,208,217,.055)",.1);
  for(let k=0;k<7;k++){
    const x=120+hash(k*5.3)*836,y=754+hash(k*4.9)*142;
    inkLine(c,[[x,y],[x-2,y+43],[x+1,y+110]],87310+k,1.5,"rgba(178,209,225,.19)",.2);
    oval(c,x,y+110,2,4,87320+k,.1);paint(c,"rgba(202,220,225,.26)",null);
  }
  for(const side of [-1,1]){
    const fx=side<0?108:974;
    glow(c,fx,985,153,"rgba(184,214,231,.15)");
    for(let i=0;i<13;i++){
      const y=992-i*10,x=fx-side*hash(i+8)*22,len=12+hash(i*3.3)*20;
      inkLine(c,[[x,y],[x-side*len,y-20]],87340+i+side*20,1.4,"rgba(189,218,235,.32)",.25);
      inkLine(c,[[x-side*len*.4,y-8],[x-side*len*.4,y-18]],87370+i+side*20,1,"rgba(189,218,235,.24)",.2);
    }
  }
  c.restore();
  for(const x of [95,534,982]){
    inkLine(c,[[x,246],[x,1015]],87400+x,16,"#262f3a",.25);
    inkLine(c,[[x+3,248],[x+3,1012]],87401+x,6,"#929da5",.2);
    inkLine(c,[[x+7,250],[x+7,1010]],87402+x,1.8,"#c0c7c7",.15);
  }
  for(const y of [244,1006]){
    inkLine(c,[[86,y],[993,y]],87410+y,15,"#242f38",.3);
    inkLine(c,[[91,y+3],[991,y+3]],87411+y,5,"#a6aead",.2);
  }
  for(const x of [106,970])for(const y of [258,994]){
    oval(c,x,y,3.5,3.5,87420+x+y,.1);paint(c,"#555f67",null);
    inkLine(c,[[x-2,y],[x+2,y]],87421+x+y,1.2,"#abb6b9",.1);
  }
  rbox(c,547,605,19,62,4,87430,.3);paint(c,"#6d767c","#1d2733",2);
  inkLine(c,[[557,618],[579,628],[579,653]],87431,7,"#a7b0b0",.25);
  poly(c,[[83,1008],[996,1008],[1030,1053],[48,1053]],87432,.5);paint(c,"#6b6d63","#222b31",3);
  inkLine(c,[[76,1038],[1008,1038]],87433,2,"rgba(195,196,166,.3)",.3);
  // Narrow key rack retains its original wall position (not in the bare, lonely room).
  if(o.lonely)return;
  rbox(c,-39,445,115,248,6,87440,.6);paint(c,"#605244",C.ink,3);
  for(let i=0;i<6;i++){
    const x=-21+(i%3)*32,y=468+Math.floor(i/3)*105;
    oval(c,x,y,4,4,87441+i,.2);paint(c,"#a9a495",null);
    oval(c,x,y+20,8,11,87451+i,.25);paint(c,null,"#b8b5a2",2.4);
    inkLine(c,[[x,y+30],[x-3,y+54],[x+4,y+54]],87461+i,3,"#b4a783",.2);
    rbox(c,x-9,y+55,18,24,3,87471+i,.2);paint(c,["#9f6659","#748e9b","#a69862"][i%3],null);
    text(c,String(i+1),x,y+68,{size:10,font:F.ui,fill:"#ddd3b9"});
  }
}

function monitor(c:Ctx,abs:number,time:string) {
  oval(c,277,1051,159,21,87500,.5);paint(c,"rgba(7,13,21,.44)",null);
  poly(c,[[265,973],[294,973],[303,1031],[338,1044],[221,1044],[258,1031]],87501,.4);paint(c,"#222a30",C.ink,3);
  rbox(c,122,751,317,250,12,87502,.7);paint(c,"#242c34","#101822",5);
  inkLine(c,[[136,761],[422,761]],87503,2.4,"#65717a",.3);
  c.save();c.beginPath();c.rect(143,774,275,196);c.clip();
  for(let i=0;i<4;i++){
    const x=143+(i%2)*138,y=774+Math.floor(i/2)*98;
    c.save();c.beginPath();c.rect(x,y,134,94);c.clip();c.translate(x,y);
    c.fillStyle=["#35494f","#3c4c4b","#36434b","#374c50"][i];c.fillRect(0,0,134,94);
    if(i===0){
      c.fillStyle="#1e3039";c.fillRect(5,22,48,50);c.fillRect(90,34,48,43);
      inkLine(c,[[0,74],[134,69]],87510+i,10,"#6e7e7b",.1);
      for(let j=0;j<6;j++)inkLine(c,[[30+j*15,51],[37+j*15,71],[45+j*15,51]],87520+j,1.2,"#93a2a0",.1);
    }else if(i===1){
      poly(c,[[9,45],[65,20],[124,43],[124,86],[9,86]],87531,.15);paint(c,"#647471",null);
      for(let j=0;j<4;j++)rbox(c,20+j*25,50,16,34,1,87532+j,.1),paint(c,"#263b42",null);
    }else if(i===2){
      poly(c,[[0,15],[57,41],[57,91],[0,95]],87540,.1);paint(c,"#65766f",null);
      poly(c,[[134,15],[79,41],[79,91],[134,95]],87541,.1);paint(c,"#4c5c5c",null);
      inkLine(c,[[68,10],[68,80]],87542,3,"#a1b6ac",.1);
      for(let j=0;j<3;j++)c.fillStyle="#a4b7ae",c.fillRect(60+j*3,22+j*17,18-j*6,3);
    }else{
      for(let j=0;j<4;j++)rbox(c,12+j*27,43+(j%2)*15,24,29,1,87550+j,.1),paint(c,"#7b8980","#30454a",1.2);
      inkLine(c,[[0,85],[134,79]],87560,3,"#99a69e",.1);
    }
    text(c,["01 大门","02 仓库","03 走廊","04 装卸"][i],5,10,{size:10,font:F.ui,fill:"#c3d0c7",align:"left"});
    c.restore();
  }
  for(let y=776;y<970;y+=5){c.fillStyle="rgba(14,33,41,.12)";c.fillRect(143,y,275,1);}
  for(let i=0;i<18;i++){const f=Math.floor(abs*8);c.fillStyle="rgba(225,239,230,.12)";c.fillRect(145+hash(f+i)*266,779+hash(f+i*7.1)*182,1.2,1.2);}
  text(c,time,409,963,{size:11,font:F.ui,fill:"#c5d7d5",align:"right"});
  c.restore();
  for(let i=0;i<4;i++){oval(c,333+i*14,985,2.8,2.8,87570+i,.1);paint(c,"#727e7e",null);}
  oval(c,404,985,3,3,87575,.1);paint(c,"#8fbd8c",null);
  inkLine(c,[[173,1000],[161,1081],[71,1070],[-12,1046]],87580,4,"#15212a",.4);
}

function desktop(c:Ctx,abs:number,o:DetailedBoothOptions,p:BoothProps) {
  poly(c,[[-60,1040],[1140,1040],[1140,1323],[-60,1323]],87600,.7);paint(c,"#362f2a",C.ink,5);
  poly(c,[[-60,1010],[1140,1010],[1140,1281],[-60,1281]],87601,.7);paint(c,vgrad(c,1010,1290,[[0,"#6e5844"],[1,"#514336"]]),C.ink,5);
  for(let i=0;i<11;i++){
    const y=1025+i*22;
    inkLine(c,[[-50,y],[240,y+4],[562,y-4],[1138,y+3]],87610+i,1.6,"rgba(32,24,19,.24)",.6);
  }
  for(let i=0;i<4;i++){oval(c,62+i*268,1094+(i%2)*84,37,6,87630+i,.4);paint(c,null,"rgba(34,25,18,.19)",1.4);}
  // Glass on the wood, with green edges, scratches and soft reflected light.
  poly(c,[[3,1023],[1071,1023],[1121,1259],[4,1277]],87640,.4);paint(c,"rgba(127,172,165,.065)","rgba(121,163,147,.32)",2);
  poly(c,[[138,1024],[247,1024],[590,1270],[488,1272]],87641,.3);paint(c,"rgba(187,212,204,.045)",null);
  inkLine(c,[[-40,1281],[1130,1281]],87642,6,"#1d2a29",.3);
  inkLine(c,[[-40,1284],[1130,1284]],87643,2,"#799082",.3);
  for(let i=0;i<13;i++){const x=hash(i+55)*1060,y=1090+hash(i+22)*160;inkLine(c,[[x,y],[x+9,y-2]],87645+i,1,"rgba(193,191,159,.12)",.2);}
  // Open duty book. Neutral work details keep the identity reveal for the later shot.
  poly(c,[[43,1100],[280,1081],[337,1197],[91,1225]],87665,.4);paint(c,"#302e2b",C.ink,2.5);
  poly(c,[[46,1097],[159,1084],[206,1200],[91,1219]],87666,.4);paint(c,"#c3bda5","#574d3e",2);
  poly(c,[[159,1084],[279,1079],[328,1192],[206,1200]],87667,.4);paint(c,"#d1c5a9","#574d3e",2);
  inkLine(c,[[159,1084],[206,1200]],87668,2.5,"#8b7d64",.3);
  text(c,"值班记录",127,1111,{size:20,font:F.ui,weight:700,fill:"#454e4a"});
  for(let i=0;i<5;i++){
    inkLine(c,[[76+i*7,1132+i*15],[162+i*6,1122+i*15]],87670+i,1,"rgba(78,91,90,.48)",.2);
    inkLine(c,[[182+i*6,1110+i*15],[277+i*6,1106+i*15]],87680+i,1,"rgba(78,91,90,.48)",.2);
  }
  inkLine(c,[[263,1122],[305,1216]],87690,8,"#213344",.2);
  inkLine(c,[[303,1212],[308,1223]],87691,3,"#b8b7a2",.1);
  // Monitor and objects have their own contact shadows.
  if(!o.lonely)monitor(c,abs,o.cctv??"02:49");
  oval(c,931,997,58,11,87700,.4);paint(c,"rgba(7,14,22,.46)",null);
  poly(c,[[917,976],[953,984],[863,1087],[802,1075]],87701,.4);paint(c,"rgba(7,14,22,.13)",null);
  // Retain the shared thermos, adding the handle, rim wear and printed petals.
  blob(c,[[966,808],[1000,812],[1008,909],[971,925]],87702,.6);paint(c,null,"#352e28",8);
  p.thermos(c,930,900,.95,6140);
  inkLine(c,[[910,771],[950,771]],87703,2,"#c3856a",.2);
  for(let i=0;i<3;i++){
    const x=920+(i%2)*19,y=843+i*47;
    for(let j=0;j<5;j++){const a=j*Math.PI*.4;oval(c,x+Math.cos(a)*11,y+Math.sin(a)*11,7,4,87710+i*5+j,.2,a);paint(c,"#cba16a",null);}
    oval(c,x,y,4,4,87730+i,.1);paint(c,"#7c553b",null);
    inkLine(c,[[x,y+13],[x+6,y+23]],87735+i,1.7,"#7f8c5e",.2);
  }
  for(const y of [853,914,977])inkLine(c,[[951,y],[955,y+6]],87740+y,1.5,"#c58c72",.2);
  oval(c,879,1162,63,15,87750,.5);paint(c,"rgba(6,16,23,.34)",null);
  p.mug(c,880,1105,.78,abs,6150);
  oval(c,880,1061,37,8,87751,.2);paint(c,"#593d27","#a45342",2.5);
  oval(c,880,1062,29,5,87752,.15);paint(c,"#72603d",null);
  inkLine(c,[[853,1060],[873,1057],[901,1060]],87753,1.6,"#dad2b3",.1);
  inkLine(c,[[850,1092],[851,1128]],87754,2,"rgba(243,220,176,.4)",.2);
  // Radio speaker holes, dial, antenna and a worn edge.
  rbox(c,493,940,157,77,9,87760,.5);paint(c,"#737568","#252d30",3.5);
  for(let x=506;x<564;x+=7)for(let y=955;y<1006;y+=7){c.fillStyle="#384343";c.fillRect(x,y,2,2);}
  rbox(c,574,953,60,17,2,87761,.2);paint(c,"#39423c","#adb099",1.2);
  inkLine(c,[[580,963],[627,963]],87762,1,"#a4ae90",.15);
  inkLine(c,[[612,955],[612,968]],87763,1.5,"#ca8a62",.15);
  oval(c,607,992,13,13,87764,.25);paint(c,"#3d4948","#9d9e88",2);
  inkLine(c,[[638,941],[681,860]],87765,2.3,"#b2b5ad",.2);
  // A key ring near the edge.
  if(o.lonely)return;
  oval(c,1007,1162,19,10,87770,.3);paint(c,null,"#b6b5a0",3);
  for(let i=0;i<3;i++){
    inkLine(c,[[1004+i*6,1166],[988+i*16,1217],[997+i*16,1217]],87771+i,5,["#ae9a64","#929c9d","#ae9a64"][i],.2);
  }
}

/** The lonely grade (lonely: true): the tube light off; cold light off the snow coming in through the glass; the whole
 *  room pulled down into a quiet, desaturated blue — and the one lamp out in the snow kept warm, the only warm thing. */
function lonelyLight(c:Ctx,abs:number) {
  lightShaft(c,[[110,1010],[970,1010],[1130,1300],[-50,1300]],540,1010,540,1300,"150,182,232",.07,26,"booth-snowlight");
  lightShaft(c,[[810,695],[972,708],[1130,1300],[340,1300]],875,720,720,1320,"255,181,109",.05,24,"booth-window-shaft");
  glow(c,979,1530,260,"rgba(240,126,56,.06)");
  motes(c,abs,870,927,93,119,8,87900,"200,205,225",.1,1.6);
  c.save();
  c.globalCompositeOperation="multiply";
  c.fillStyle="rgb(150,166,206)";c.fillRect(-60,-60,W+120,H+120);
  c.globalCompositeOperation="color";
  c.globalAlpha=.3;c.fillStyle="#32466e";c.fillRect(-60,-60,W+120,H+120);
  c.restore();
  // the lamp out in the snow stays warm
  c.save();
  c.beginPath();c.rect(100,250,880,760);c.clip();
  c.globalCompositeOperation="screen";
  glow(c,862,492,150,"rgba(255,186,110,.6)");
  const cone=c.createLinearGradient(0,498,0,1010);
  cone.addColorStop(0,"rgba(255,176,96,.22)");cone.addColorStop(1,"rgba(255,176,96,0)");
  c.fillStyle=cone;c.beginPath();c.moveTo(846,498);c.lineTo(878,498);c.lineTo(1010,1010);c.lineTo(700,1010);c.closePath();c.fill();
  c.restore();
  const v=c.createRadialGradient(560,980,380,560,980,1250);
  v.addColorStop(0,"rgba(3,8,18,0)");v.addColorStop(1,"rgba(3,8,18,.48)");
  c.fillStyle=v;c.fillRect(-60,-60,W+120,H+120);
}

export function detailedBoothBack(c:Ctx,abs:number,o:DetailedBoothOptions,p:BoothProps) {
  roomShell(c,!!o.lonely);
  windowFrame(c,abs,o,p);
  desktop(c,abs,o,p);
  if(o.lonely){lonelyLight(c,abs);return;}
  // Warm outside light grazes the desk; blue monitor light stays local.
  lightShaft(c,[[810,695],[972,708],[1130,1300],[340,1300]],875,720,720,1320,"255,181,109",.08,24,"booth-window-shaft");
  glow(c,888,1053,385,"rgba(255,175,100,.14)");
  lightShaft(c,[[151,961],[417,961],[498,1245],[64,1258]],280,960,280,1260,"135,197,215",.09,14,"booth-monitor-pool");
  glow(c,280,918,253,"rgba(131,185,215,.12)");
  glow(c,979,1530,330,"rgba(240,126,56,.13)");
  motes(c,abs,870,927,93,119,8,87900,"217,193,151",.13,1.6);
  const v=c.createRadialGradient(572,974,430,572,974,1250);
  v.addColorStop(0,"rgba(3,9,18,0)");v.addColorStop(1,"rgba(3,9,18,.31)");
  c.fillStyle=v;c.fillRect(-60,-60,W+120,H+120);
}
