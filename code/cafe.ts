/**
 * 雨夜咖啡馆与双人桌道具。1080×1920 设计坐标，绝对时间寻址。
 * 背景、桌子和人物分开绘制；道具用局部坐标，可用于照片/空椅子/重逢镜头。
 */
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { Ctx, Pt, F, beginFrame, loadFonts, fillBg, vgrad, rbox, oval, blob, poly, paint, inkLine, glow, text, hash, motes } from "./draw";

export function starPatch(ctx: Ctx, x: number, y: number, scale = 1, angle = -0.12) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle); ctx.scale(scale,scale);
  const pts: Pt[] = Array.from({length:10}, (_,i) => { const a=-Math.PI/2+i*Math.PI/5, r=i%2?13:29; return [Math.cos(a)*r,Math.sin(a)*r] as Pt; });
  poly(ctx,pts,7701,0.4); paint(ctx,"#eab65c","#98633a",2.4);
  ctx.setLineDash([3,4]); ctx.strokeStyle="#fff0bc"; ctx.lineWidth=1.5; ctx.stroke(); ctx.setLineDash([]);
  inkLine(ctx,[[-15,-4],[14,11]],7721,1.6,"#a96944",0.3);
  ctx.restore();
}

export function cafeChair(ctx: Ctx, x: number, y: number, scale = 1, angle = 0) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle); ctx.scale(scale,scale);
  oval(ctx,0,398,154,31,7050,0.4); paint(ctx,"rgba(7,10,15,0.3)",null);
  for (const dir of [-1,1]) {
    inkLine(ctx,[[dir*101,136],[dir*96,260],[dir*122,389]],7051+dir,18,"#342c2b");
    inkLine(ctx,[[dir*101,136],[dir*96,260],[dir*122,389]],7055+dir,8,"#a07752");
  }
  rbox(ctx,-130,-200,260,380,100,7060,0.8); paint(ctx,"#523c35","#1d2028",7);
  rbox(ctx,-104,-174,208,290,80,7062,0.6); paint(ctx,"#8c6148","#bf8a60",3);
  for(let i=0;i<5;i++) inkLine(ctx,[[-74+i*38,-144],[-78+i*38,-32],[-74+i*38,90]],7065+i,2,"rgba(51,31,30,.35)",0.5);
  oval(ctx,0,162,153,51,7073,0.8); paint(ctx,"#bc8559","#27212a",6);
  inkLine(ctx,[[-133,160],[-24,190],[130,159]],7074,3,"#e4b17a",0.4);
  ctx.restore();
}

export function drapedCoat(ctx: Ctx, x: number, y: number, scale = 1, lift = 0) {
  ctx.save(); ctx.translate(x,y-lift); ctx.scale(scale,scale);
  // Empty hood and shoulders: the neck opening is visible only when the photograph pulls wider.
  blob(ctx,[[-89,40],[-103,3],[-71,-39],[-17,-57],[41,-48],[88,-13],[84,32],[41,72],[-21,77]],7100,1);
  paint(ctx,"#275974","#151e2b",5);
  oval(ctx,-2,13,55,32,7101,0.5,-.08); paint(ctx,"#142d42","#4c88a4",3);
  blob(ctx,[[-79,23],[-126,55],[-153,134],[-190,256],[-175,339],[-116,348],[-88,262],[-67,177],[-57,333],[78,334],[101,201],[116,263],[163,331],[204,304],[173,199],[144,78],[83,30],[33,63],[-11,70]],7102,1.1);
  paint(ctx,"#2e6f96","#16232f",6);
  blob(ctx,[[42,71],[84,30],[108,103],[103,231],[77,333],[26,331],[48,194]],7103,0.8); paint(ctx,"#23546e",null);
  blob(ctx,[[-148,133],[-173,275],[-170,321],[-137,325],[-116,247],[-97,157]],7104,.7); paint(ctx,"#3a819f",null);
  for(const p of [[[-98,99],[-69,137],[-73,183]],[[119,112],[141,159],[146,211]],[[-65,293],[-18,304],[55,290]]]) inkLine(ctx,p as Pt[],7110,2.6,"#173f59",.7);
  rbox(ctx,-62,220,125,65,12,7112,.6); paint(ctx,"#2b6586","#1c4c65",2.5);
  inkLine(ctx,[[-28,66],[-34,151]],7113,3,"#b5cad1");
  inkLine(ctx,[[22,63],[17,143]],7114,3,"#b5cad1");
  starPatch(ctx,-70,144,1.15);
  rbox(ctx,-181,324,60,24,7,7115,.4); paint(ctx,"#235573","#152e42",3);
  ctx.restore();
}

export function coffee(ctx: Ctx, x: number, y: number, scale: number, t: number, hot = true, color = "#e3dcc1") {
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
  oval(ctx,4,57,94,27,7200,.5); paint(ctx,"rgba(9,17,20,.24)",null);
  oval(ctx,0,37,87,29,7201,.7); paint(ctx,"#d2c8ac","#594536",3);
  oval(ctx,3,38,65,17,7202,.4); paint(ctx,null,"#eee6cf",2);
  oval(ctx,65,-6,27,30,7203,.5); paint(ctx,color,"#5a4b3d",4);
  oval(ctx,65,-6,13,18,7204,.4); paint(ctx,"#8f6245","#a9967a",2);
  blob(ctx,[[-56,-30],[-52,18],[-33,46],[13,51],[48,30],[56,-29]],7205,.6); paint(ctx,color,"#4b443c",4);
  oval(ctx,0,-29,56,21,7206,.5); paint(ctx,"#675042","#f4e6c4",5);
  oval(ctx,0,-29,45,14,7207,.3); paint(ctx,"#382b29",null);
  inkLine(ctx,[[-27,-25],[-8,-19],[22,-29]],7208,2,"#b7885c",.4);
  inkLine(ctx,[[-42,-4],[-39,20],[-19,36]],7209,3,"#fff4d4",.5);
  if(hot) {
    ctx.save(); ctx.globalAlpha=.2;
    for(let i=0;i<3;i++) {
      const sway=Math.sin(t*1.1+i*1.9)*10;
      inkLine(ctx,[[-23+i*23,-56],[-31+i*23+sway,-93],[-13+i*23-sway,-132],[-18+i*23+sway,-163]],7210+i,3,"#ffecd0",.5);
    } ctx.restore();
  }
  ctx.restore();
}

export function cafeBack(ctx: Ctx, t: number, warm = 1) {
  fillBg(ctx,vgrad(ctx,0,1920,[[0,"#172e35"],[.52,"#2b4441"],[1,"#111f28"]]));
  ctx.fillStyle="#213e40"; ctx.fillRect(0,90,1080,840);
  // Joinery and a deep rain-streaked window.
  rbox(ctx,52,168,564,689,90,7300,.7); paint(ctx,"#12252f","#102128",18);
  ctx.save(); rbox(ctx,67,181,534,660,80,7301,.2);ctx.clip();
  ctx.fillStyle=vgrad(ctx,180,840,[[0,"#162736"],[.58,"#385465"],[1,"#222e39"]]);ctx.fillRect(65,178,540,665);
  for(let i=0;i<10;i++){
    const x=70+i*60,h=160+hash(i+20)*250;
    ctx.fillStyle=i%2?"#253644":"#202e40";ctx.fillRect(x,780-h,54,h);
    for(let j=0;j<4;j++) if(hash(i*9+j)>.35){ctx.fillStyle="rgba(255,204,136,.45)";ctx.fillRect(x+11,800-h+j*41,8,18);}
  }
  glow(ctx,144,495,170,"rgba(227,178,108,.22)");
  for(let i=0;i<50;i++){
    const x=78+hash(i+80)*510, y=190+((hash(i+6)*610+t*(8+hash(i)*14))%610);
    inkLine(ctx,[[x,y],[x-3,y+16+hash(i+4)*28]],7400+i,1.4,"rgba(169,208,223,.22)",.2);
  }
  ctx.fillStyle="rgba(217,173,101,.08)";ctx.fillRect(410,181,75,660);
  ctx.restore();
  inkLine(ctx,[[332,181],[332,838]],7330,12,"#1a3038",.4);
  inkLine(ctx,[[65,548],[602,548]],7331,10,"#1a3038",.4);
  inkLine(ctx,[[44,859],[629,859]],7332,20,"#bb9364",.6);
  // Warm plaster, inset art, shelves and plants.
  ctx.fillStyle="#805848";ctx.fillRect(685,80,355,840);
  rbox(ctx,750,208,209,290,9,7333,.5);paint(ctx,"#d3c096","#2b393a",12);
  text(ctx,"转角",854,301,{size:59,font:F.pen,fill:"#4f6556"});
  text(ctx,"COFFEE",854,374,{size:24,font:F.en,fill:"#765641"});
  inkLine(ctx,[[731,579],[998,579]],7334,15,"#352f2c");
  for(let i=0;i<5;i++){rbox(ctx,749+i*40,520-i%2*23,28,55+i%2*23,7,7350+i,.4);paint(ctx,["#537970","#c1a887","#c78565","#9c9990","#716844"][i],"#303a34",2);}
  // Wall panels and floor perspective.
  ctx.fillStyle="#24453f";ctx.fillRect(0,916,1080,1004);
  inkLine(ctx,[[0,918],[1080,918]],7335,17,"#aa7953");
  for(let i=0;i<9;i++) inkLine(ctx,[[i*150-80,930],[i*150-140,1300]],7360+i,4,"#193a38",.4);
  ctx.fillStyle=vgrad(ctx,1250,1920,[[0,"#34483e"],[1,"#15212a"]]);ctx.fillRect(0,1250,1080,670);
  for(let i=-4;i<8;i++)inkLine(ctx,[[540+i*96,1250],[540+i*300,1960]],7370+i,2,"rgba(187,149,100,.16)",.2);
  for(let i=0;i<6;i++)inkLine(ctx,[[0,1300+i*i*22],[1080,1300+i*i*22]],7380+i,2,"rgba(187,149,100,.12)",.2);
  // Brass pendant is the motivated key light.
  inkLine(ctx,[[782,-30],[782,303]],7336,4,"#24272c",.4);
  blob(ctx,[[686,348],[722,303],[840,303],[879,348],[866,377],[695,377]],7337,.8);paint(ctx,"#c3965b","#3b352c",5);
  oval(ctx,781,371,91,18,7338,.4);paint(ctx,"#ffdfa1",null);
  glow(ctx,780,399,290,"rgba(255,205,125,.23)",warm);
  glow(ctx,637,807,500,"rgba(248,179,96,.12)",warm);
  motes(ctx,t,742,585,170,236,17,7730,"255,218,162",.45,1.7);
}

export function cafeTable(ctx: Ctx, t: number, cups = true, rightHot = false, push = 0) {
  // Leg and broad ellipse separate near and far actors.
  blob(ctx,[[495,1090],[570,1090],[585,1510],[546,1590],[514,1549]],7460,.7);paint(ctx,"#273932","#17292b",5);
  oval(ctx,543,1581,200,35,7461,.7);paint(ctx,"#293b33","#17292b",5);
  oval(ctx,540,1104,439,164,7462,1);paint(ctx,"#674936","#1d2b29",7);
  oval(ctx,540,1083,441,164,7463,.8);paint(ctx,vgrad(ctx,930,1237,[[0,"#bc9160"],[.46,"#a3794e"],[1,"#78583b"]]),"#252e2a",5);
  for(let i=0;i<7;i++){const y=995+i*27;inkLine(ctx,[[238,y],[497,y+16],[837,y+8]],7480+i,1.7,"rgba(64,45,31,.2)",.4);}
  inkLine(ctx,[[197,1163],[518,1235],[899,1166]],7470,3,"#d0a675",.6);
  glow(ctx,661,1025,240,"rgba(255,206,124,.15)");
  if(cups){coffee(ctx,350,1019,.8,t,true);coffee(ctx,716+push*31,1101-push*110,.8,t,rightHot,"#b0c4b5");}
}

export function cafeFront(ctx: Ctx, t: number, door = 0) {
  fillBg(ctx,vgrad(ctx,0,1920,[[0,"#172636"],[1,"#14212c"]]));
  ctx.fillStyle="#294046";ctx.fillRect(34,100,1015,1330);
  for(let r=0;r<16;r++)for(let c=0;c<8;c++){ctx.strokeStyle="rgba(143,144,125,.12)";ctx.lineWidth=2;ctx.strokeRect(c*162-(r%2)*81,160+r*77,162,77);}
  rbox(ctx,120,291,840,152,13,7500,.6);paint(ctx,"#2d4441","#bd9663",5);
  text(ctx,"转 角 咖 啡",540,360,{size:67,font:F.pen,fill:"#ffe0a4",shadow:14});
  text(ctx,"a place to stay",540,408,{size:23,font:F.en,fill:"#c0b295"});
  ctx.save();ctx.beginPath();ctx.rect(134,501,516,790);ctx.clip();
  ctx.translate(129,463);ctx.scale(.54,.54);cafeBack(ctx,t);
  ctx.restore();
  rbox(ctx,131,494,525,810,18,7502,.4);paint(ctx,"rgba(22,53,67,.26)","#112a31",18);
  ctx.save();ctx.translate(679,500);ctx.scale(1-door*.52,1);
  rbox(ctx,0,0,260,810,9,7510,.5);paint(ctx,"#c49563","#182a30",13);
  rbox(ctx,21,25,219,604,6,7511,.5);paint(ctx,"#374f51","#6c654d",4);
  inkLine(ctx,[[209,370],[209,447]],7512,10,"#e0bb77",.3);
  text(ctx,"OPEN",129,311,{size:44,font:F.en,fill:"#e9d3a1"});
  ctx.restore();
  ctx.fillStyle="#384746";ctx.fillRect(0,1317,1080,98);
  inkLine(ctx,[[0,1420],[1080,1420]],7520,10,"#172a32");
  for(let i=0;i<23;i++){
    const x=hash(81+i)*1080,y=1450+hash(i+921)*430;
    inkLine(ctx,[[x,y],[x+70+hash(i)*100,y]],7525+i,2+hash(i+2)*3,"rgba(231,191,125,.14)",.3);
  }
  glow(ctx,532,820,580,"rgba(240,168,79,.07)");
}

const roomParams=z.object({warm:z.number().min(0).max(1).default(1).describe("灯光暖度")});
const propParams=z.object({scale:z.number().min(.4).max(2).default(1).describe("尺寸")});
export const resources=defineResources({
  cafeBack:resource({kind:"set",title:"转角咖啡馆（雨夜）",description:"有雨窗、黄铜吊灯、书架和木墙的咖啡馆；人物、椅子和桌子单独画，适合双人/空座镜头。",tags:["咖啡馆","雨夜","室内","重逢"],usage:"cafeBack(ctx,t,warm); cafeChair(...); drawKid(...); cafeTable(ctx,t)",params:roomParams,preview:{width:1080,height:1920,duration:3,prepare:loadFonts,draw:(c,t,p)=>{beginFrame(c,t);cafeBack(c,t,p.warm);cafeChair(c,350,930,.8);cafeChair(c,748,930,.8);cafeTable(c,t);}}}),
  cafeFront:resource({kind:"set",title:"咖啡馆门口（雨夜）",description:"暖色店招、玻璃门与湿地倒影；门可打开。",tags:["咖啡馆","门口","夜景"],usage:"cafeFront(ctx,t,door)",params:z.object({door:z.number().min(0).max(1).default(0).describe("门打开")}),preview:{width:1080,height:1920,duration:3,prepare:loadFonts,draw:(c,t,p)=>{beginFrame(c,t);cafeFront(c,t,p.door);}}}),
  chair:resource({kind:"prop",title:"弯木咖啡椅",description:"独立的椅背、座面和腿，可在上面搭外套。锚点是椅背下半部。",tags:["椅子","咖啡馆","空位"],usage:"cafeChair(ctx,x,y,scale,angle)",params:propParams,preview:{width:700,height:900,background:"#c4b293",draw:(c,t,p)=>{beginFrame(c,t);cafeChair(c,350,330,p.scale);}}}),
  coat:resource({kind:"prop",title:"搭在椅背的蓝外套",description:"有星星补丁的蓝帽衫，空的领口、自然下垂的袖子；lift 抬起外套。",tags:["外套","帽衫","椅子","补丁"],usage:"drapedCoat(ctx,x,y,scale,lift); starPatch(ctx,x,y,scale)",params:propParams,preview:{width:700,height:900,background:"#bdac92",draw:(c,t,p)=>{beginFrame(c,t);cafeChair(c,350,320,1);drapedCoat(c,350,130,p.scale);}}}),
  coffee:resource({kind:"prop",title:"咖啡杯与杯碟",description:"手绘陶瓷杯、碟和咖啡，hot 控制热气（按绝对时间移动）。",tags:["咖啡杯","杯子","热气"],usage:"coffee(ctx,x,y,scale,t,hot,color)",params:z.object({hot:z.boolean().default(true).describe("是否有热气")}),preview:{width:700,height:600,background:"#987348",duration:3,draw:(c,t,p)=>{beginFrame(c,t);coffee(c,350,360,2.2,t,p.hot);}}}),
  table:resource({kind:"prop",title:"双人咖啡桌",description:"木质圆桌、两杯咖啡；右杯 push 0..1 推向对面的人。",tags:["桌子","咖啡馆","咖啡"],usage:"cafeTable(ctx,t,cups,rightHot,push)",params:z.object({push:z.number().min(0).max(1).default(0).describe("右杯推向对面")}),preview:{width:1080,height:1920,background:"#32413c",duration:3,draw:(c,t,p)=>{beginFrame(c,t);cafeTable(c,t,true,false,p.push);}}})
});
