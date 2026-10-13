/**
 * 两位主角在咖啡馆的静态合照。人物直接使用 kid.ts，背景和杯子使用 cafe.ts。
 * 600×800 设计坐标，以 cover 方式填入任意矩形；所有细节保持定格。
 */
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, Pt, beginFrame, blob, filtered, glow, hash, inkLine, litFigure, loadFonts, oval, paint, poly, vgrad } from "./draw";
import { drawHand, drawKid, type KidPose } from "./kid";
import { cafeBack, coffee } from "./cafe";

export const cafePhotoOptions = z.object({
  kiss: z.boolean().default(false).describe("第二张：男主靠近亲她的脸颊"),
});
export type CafePhotoOptions = z.input<typeof cafePhotoOptions>;

function backdrop(c: Ctx) {
  // Real café joinery, pendant, rain window and shelves, kept just softer than the faces.
  filtered(c, "blur(1.4px)", (b) => {
    b.save(); b.scale(600 / 1080, 600 / 1080);
    cafeBack(b, 1.6, 1);
    b.restore();
  }, "cafe-photo-back");
  glow(c, 424, 216, 350, "rgba(250,183,104,0.18)");
  // A string of actual small bulbs supplies the warm bokeh above the couple.
  const wire: Pt[] = [];
  for (let i = 0; i <= 15; i++) wire.push([-30 + i * 45, 78 + Math.sin(i / 15 * Math.PI) * 36]);
  inkLine(c, wire, 86000, 1.8, "#483b37", 0.3);
  for (let i = 0; i < 8; i++) {
    const x = 15 + i * 82, y = 84 + Math.sin((x + 30) / 675 * Math.PI) * 36;
    inkLine(c, [[x,y],[x,y+11]], 86010+i, 1.8, "#423632", 0.2);
    glow(c, x, y+16, 31, "rgba(255,221,160,0.45)");
    oval(c, x, y+16, 3.5, 5, 86020+i, 0.2); paint(c, "#ffe7bd", "#bd9962", 1);
  }
  // Upholstered booth: a clear plane behind the shoulders and a contact shadow.
  blob(c, [[18,510],[574,507],[602,545],[609,750],[-8,755],[-8,550]], 86040, 0.7);
  paint(c, vgrad(c,510,750,[[0,"#94634f"],[1,"#704435"]]), "#3c302e", 4);
  for (let x = 50; x < 600; x += 75) inkLine(c, [[x,521],[x+2,742]], 86050+x, 1.6, "rgba(224,166,123,0.2)", 0.3);
  inkLine(c, [[17,524],[568,522]], 86061, 2.8, "rgba(244,193,146,0.32)", 0.4);
  oval(c, 312, 694, 218, 54, 86062, 0.6); paint(c, "rgba(38,26,28,0.35)", null);
}

function table(c: Ctx) {
  // Front of the table naturally crops the two busts; no floating cut-off torsos.
  poly(c,[[-30,727],[630,716],[654,810],[-38,814]],86200,0.7);
  paint(c,vgrad(c,716,815,[[0,"#b98a62"],[1,"#8c6148"]]),"#48372f",4);
  inkLine(c,[[-15,737],[611,727]],86201,2.4,"rgba(240,194,142,0.5)",0.4);
  for(let i=0;i<4;i++)inkLine(c,[[-20,753+i*18],[208,749+i*18],[628,741+i*18]],86210+i,1.2,"rgba(70,43,29,0.24)",0.5);
  // Paper napkin with a folded corner and two different ceramic cups.
  poly(c,[[313,748],[420,741],[429,791],[319,795]],86220,0.4);paint(c,"#d9c9ab","#8a7159",1.5);
  inkLine(c,[[322,757],[411,749],[419,784]],86221,1.1,"rgba(255,245,222,0.6)",0.3);
  coffee(c,158,738,0.62,1.6,false,"#ede0c7");
  coffee(c,421,742,0.6,1.6,false,"#9fbab0");
  // Fixed milk foam, a quiet highlight and spoon beside the second saucer.
  oval(c,158,723,15,6,86230,0.1);paint(c,"#d0aa81",null);
  inkLine(c,[[149,722],[158,725],[165,721]],86231,1.8,"#f5e5bc",0.15);
  inkLine(c,[[479,750],[507,766]],86232,3.2,"#bcbbb1",0.15);
  oval(c,510,768,7,4,86233,0.2,0.45);paint(c,"#dfd5c1","#8e887e",1.4);
}

function pair(c: Ctx, kiss: boolean) {
  const gx=kiss?226:216, gy=kiss?384:376, gs=0.82;
  const bx=kiss?377:403, by=kiss?339:336, bs=0.9;
  const wrist: Pt = [132,531];
  const boy: KidPose = {
    who:"boy", outfit:"hoodie", hair:"mop", body:"bust",
    eyes:kiss?"shut":"happy", mouth:kiss?"blow":"smile", blush:0.3,
    turn:kiss?-0.85:-0.16, tilt:kiss?0.42:-0.05,
    headX:kiss?-35:0, headY:kiss?4:0,
    arms:"custom",
    // Left arm goes behind her shoulders. Its hand is drawn in front of her cardigan below.
    handL:[(wrist[0]-bx)/bs,(wrist[1]-by)/bs],
    elbowL:[-198,160], shapeL:"hidden",
    handR:[116,407], elbowR:[132,298], shapeR:"relax", seed:86100,
  };
  drawKid(c,bx,by,bs,boy);
  drawKid(c,gx,gy,gs,{
    who:"girl",outfit:"cardigan",body:"bust",
    eyes:kiss?"shut":"happy",mouth:kiss?"smile":"laugh",
    tilt:kiss?-0.06:0.09,blush:kiss?0.74:0.48,
    arms:"custom",handL:[-98,405],elbowL:[-124,300],
    handR:[97,398],elbowR:[117,304],
    shapeL:"relax",shapeR:"relax",seed:86120,
  });
  // The relaxed hand rests on the far shoulder; the blue ribbed cuff remains connected behind her.
  drawHand(c,wrist[0],wrist[1],0.58,1.18,"relax",true,false,86140);
  // Tiny shoulder creases and cardigan knit follow the fabric rather than outlining the person.
  inkLine(c,[[142,549],[161,557],[174,553]],86141,1.8,"rgba(112,83,59,0.36)",0.25);
  for(let i=0;i<14;i++){
    const x=gx-42+hash(i*5.3)*83,y=gy+192+hash(i*7.1)*112;
    inkLine(c,[[x-1,y],[x+1,y+3]],86150+i,0.8,"rgba(159,127,90,0.17)",0.1);
  }
}

/** Frozen café photo. Default girl face is at (0.36w, 0.47h) in a 3:4 frame for face-tracked zooms. */
export function cafeCouplePhoto(c: Ctx, x: number, y: number, w: number, h: number, o: CafePhotoOptions = {}) {
  c.save(); c.beginPath(); c.rect(x,y,w,h); c.clip();
  const scale=Math.max(w/600,h/800);
  c.translate(x+(w-600*scale)/2,y+(h-800*scale)/2); c.scale(scale,scale);
  backdrop(c);
  litFigure(c,(p)=>pair(p,o.kiss??false),{
    shade:0.09,shadeCol:"rgb(61,39,34)",
    lights:[{x:433,y:212,r:510,rgb:"255,213,156",a:0.2},{x:76,y:288,r:280,rgb:"151,190,209",a:0.06}],
    rim:{ux:0.6,uy:-1,rgb:"255,210,147",a:0.25,width:4},
  });
  table(c);
  const shade=c.createRadialGradient(305,390,165,305,410,520);
  shade.addColorStop(0,"rgba(54,28,16,0)");shade.addColorStop(1,"rgba(30,21,25,0.28)");
  c.fillStyle=shade;c.fillRect(0,0,600,800);
  c.restore();
}

export const resources=defineResources({
  cafeCouplePhoto:resource({
    kind:"prop",title:"主角双人咖啡馆合照",
    description:"素材库主角（棕色蓬发、蓝帽衫）与女主（向日葵发卡、奶油开衫）的静态照片。暖吊灯、雨窗、软包座位、木桌和两杯咖啡。kiss 切到靠近脸颊的第二张；不同宽高比使用同一张 600×800 构图裁切，人物与手不会变形。",
    tags:["照片","合照","主角","咖啡馆","情侣","手机"],
    usage:"cafeCouplePhoto(ctx, x, y, w, h, { kiss: false })",
    params:cafePhotoOptions,
    presets:{依偎合照:{kiss:false},亲脸颊:{kiss:true}},
    preview:{width:600,height:800,prepare:loadFonts,draw(c,t,p){beginFrame(c,t);cafeCouplePhoto(c,0,0,600,800,p);}},
  }),
});
