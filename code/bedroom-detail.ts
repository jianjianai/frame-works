// Detailed furnishing and practical lighting for places.herRoom. 1080×1920, absolute time.
import { C, Ctx, F, H, Pt, W, blob, fillBg, glow, hash, inkLine, lightShaft, motes, oval, paint, poly, rbox, rr, text, vgrad } from "./draw";
import { paneLight } from "./sets";
import { coffee } from "./cafe";
import { snow } from "./blocked/snow";

export interface BedroomDetailOptions {
  dawn?: number;
  lights?: number;
  lamp?: number;
  lampAt?: Pt;
  winter?: boolean;
  /** Personal pictures belong to the calling film; draw into the supplied photo rectangle. */
  photos?: ((c: Ctx, x: number, y: number, w: number, h: number) => void)[];
}

function bear(c: Ctx, x: number, y: number) {
  c.save(); c.translate(x, y);
  oval(c, 5, 54, 53, 14, 81000, 0.5); paint(c, "rgba(25,18,38,0.36)", null);
  for (const side of [-1, 1]) {
    oval(c, side * 26, 42, 20, 17, 81001 + side, 0.8); paint(c, "#b37d61", C.ink, 3.5);
    oval(c, side * 27, 41, 10, 8, 81004 + side, 0.4); paint(c, "#d6ab85", null);
  }
  oval(c, 0, 6, 35, 43, 81006, 0.8); paint(c, "#c69470", C.ink, 4);
  oval(c, -3, 13, 22, 29, 81007, 0.7); paint(c, "#dfb996", null);
  for (const side of [-1, 1]) {
    oval(c, side * 33, 5, 12, 25, 81009 + side, 0.6, side * -0.3); paint(c, "#bf8a67", C.ink, 3);
    oval(c, side * 25, -63, 12, 13, 81013 + side, 0.5); paint(c, "#bd8765", C.ink, 3);
    oval(c, side * 25, -63, 6, 7, 81017 + side, 0.4); paint(c, "#e6b798", null);
  }
  oval(c, 0, -41, 34, 31, 81020, 0.8); paint(c, "#d4a27c", C.ink, 3.5);
  oval(c, 1, -29, 17, 12, 81021, 0.4); paint(c, "#edd0a8", null);
  for (const side of [-1, 1]) {
    oval(c, side * 12, -43, 3.2, 4, 81024 + side, 0.15); paint(c, C.ink, null);
    oval(c, side * 12 - 0.8, -44, 0.9, 1, 81028 + side, 0); paint(c, "#efdfc9", null);
  }
  oval(c, 1, -32, 5, 3.5, 81030, 0.2); paint(c, "#714837", null);
  inkLine(c, [[1, -29], [1, -23], [7, -23]], 81031, 1.8, "#714837", 0.2);
  inkLine(c, [[0, 7], [0, 31]], 81032, 1.2, "#ad7f60", 0.2);
  for (let y = 10; y < 31; y += 6) inkLine(c, [[-3, y], [3, y + 1]], 81034 + y, 1, "#a47456", 0.1);
  c.restore();
}

function scenicPhoto(c: Ctx, x: number, y: number, w: number, h: number, n: number) {
  c.fillStyle = ["#6b94b0", "#cd9b9e", "#71749f"][n % 3]; c.fillRect(x, y, w, h);
  c.fillStyle = "#edd8ad"; c.beginPath(); c.arc(x + w * 0.73, y + h * 0.22, w * 0.1, 0, Math.PI * 2); c.fill();
  poly(c, [[x,y+h],[x,y+h*.7],[x+w*.3,y+h*.35],[x+w*.56,y+h*.68],[x+w*.8,y+h*.46],[x+w,y+h*.7],[x+w,y+h]], 81070+n, 0.3);
  paint(c, "#3b5268", null);
}

function photos(c: Ctx, images: BedroomDetailOptions["photos"]) {
  const frames: [number, number, number][] = [[150,360,-0.12],[290,330,0.08],[420,370,-0.05]];
  frames.forEach(([x,y,rot], i) => {
    c.save(); c.translate(x,y); c.rotate(rot);
    poly(c,[[-52,-61],[63,-61],[65,77],[-49,77]],81100+i,0.5); paint(c,"rgba(7,8,25,0.32)",null);
    poly(c,[[-56,-66],[56,-66],[56,70],[-56,70]],81110+i,0.7); paint(c,"#dfd6cb",C.ink,3);
    c.save(); c.beginPath(); c.rect(-45,-55,90,96); c.clip();
    // Use a stable large photo coordinate system so miniature strokes scale with it.
    c.translate(-45,-55); c.scale(90/600,96/640);
    if (images?.[i]) images[i](c,0,0,600,640);
    else scenicPhoto(c,0,0,600,640,i);
    c.restore();
    inkLine(c,[[-39,52],[16,53]],81120+i,1.7,"rgba(113,91,94,0.45)",0.4);
    poly(c,[[-18,-76],[14,-78],[20,-58],[-17,-57]],81130+i,0.6); paint(c,"rgba(227,206,165,0.58)",null);
    inkLine(c,[[-10,-74],[-8,-60]],81140+i,1,"rgba(255,244,216,0.35)",0.2);
    c.restore();
  });
}

function lamp(c: Ctx, x: number, y: number, on: number) {
  // Cable and a real push switch are kept at the original hand target, x / y+40.
  inkLine(c,[[x+10,y+110],[x+127,y+126],[x+168,y+193],[x+163,y+330]],81200,2.7,"#302338",0.7);
  oval(c,x+4,y+114,40,11,81201,0.5); paint(c,"rgba(17,13,28,0.5)",null);
  oval(c,x,y+108,35,10,81202,0.5); paint(c,"#8c735c",C.ink,3);
  oval(c,x,y+105,28,6,81203,0.4); paint(c,"#b69a6d",null);
  inkLine(c,[[x,y+15],[x,y+100]],81204,7,"#806c58",0.3);
  inkLine(c,[[x+2,y+20],[x+2,y+99]],81205,1.8,"#ceb991",0.2);
  oval(c,x,y+40,4.4,5.2,81206,0.2); paint(c,"#695042",C.ink,1);
  const shade: Pt[] = [[x-47,y+18],[x+47,y+18],[x+28,y-44],[x-28,y-44]];
  poly(c,shade,81207,0.8); paint(c,on ? "#cfb88c" : "#7a7180",C.ink,4);
  c.save(); poly(c,shade,81207,0.8); c.clip();
  c.fillStyle = vgrad(c,y-44,y+20,[[0,on?"#bfa17a":"#655e73"],[1,on?"#f9d9a0":"#908797"]]);
  c.fillRect(x-50,y-50,100,74);
  for(let i=-2;i<=2;i++) inkLine(c,[[x+i*10,y-39],[x+i*16,y+13]],81210+i,1.4,on?"rgba(156,118,73,0.38)":"rgba(31,29,48,0.25)",0.2);
  c.restore();
  inkLine(c,[[x-44,y+17],[x+44,y+17]],81220,3,on?"#ffe5ae":"#908396",0.3);
  if(on>0) glow(c,x,y+17,59,"rgba(255,220,150,0.65)",on);
}

function windowScene(c: Ctx, abs: number, winter: boolean) {
  const x=650,y=250,w=360,h=450;
  rbox(c,x-20,y-20,w+40,h+50,7,81300,0.8); paint(c,"#111526",C.ink,5);
  rbox(c,x-9,y-8,w+18,h+18,4,81301,0.5); paint(c,"#657087","#19162a",4);
  c.save(); c.beginPath(); c.rect(x,y,w,h); c.clip();
  c.fillStyle=vgrad(c,y,y+h,[[0,"#141b3b"],[.66,"#313b62"],[1,"#4d4a66"]]); c.fillRect(x,y,w,h);
  for(let i=0;i<14;i++){
    const sx=x+hash(i*2.3+12)*w,sy=y+hash(i*3.7+6)*h*.61;
    c.fillStyle="rgba(204,221,254,"+(0.3+0.22*Math.sin(abs*.3+i)).toFixed(3)+")";
    c.beginPath(); c.arc(sx,sy,1+hash(i+14),0,Math.PI*2); c.fill();
  }
  glow(c,900,356,106,"rgba(197,211,251,0.2)");
  oval(c,900,356,39,39,81305,0.5); paint(c,"#e7e4c7",null);
  oval(c,913,345,34,34,81306,0.5); paint(c,"#1b2343",null);
  // Distant cloud and buildings, seen through the closed glass.
  c.fillStyle="rgba(104,114,153,0.1)";
  c.beginPath(); c.ellipse(816+Math.sin(abs*.05)*18,370,177,13,-.08,0,Math.PI*2); c.fill();
  for(let i=0;i<6;i++){
    const bx=630+i*75,bh=90+hash(i*7.1)*140,by=717-bh;
    c.fillStyle=i%2?"#1b243c":"#222b43"; c.fillRect(bx,by,66,bh);
    c.fillStyle="#586279"; c.fillRect(bx-2,by-3,70,4);
    for(let k=0;k<10;k++) if(hash(i*13+k*7.9)>.66){
      c.fillStyle="rgba(242,188,109,"+(0.2+hash(k*3+i)*.4).toFixed(2)+")";
      c.fillRect(bx+9+(k%3)*18,by+18+Math.floor(k/3)*30,7,13);
    }
  }
  if(winter) snow(c,abs,{x:640,y:240,w:380,h:470,n:60,seed:11,speed:70,size:3.4,alpha:.8,drift:14});
  // Slanted glass reflection and a trace of frost along the lower edge.
  poly(c,[[970,250],[1002,250],[753,700],[718,700]],81310,.2); paint(c,"rgba(174,202,239,0.07)",null);
  if(winter) for(let i=0;i<25;i++){
    const fx=650+i*15,fh=2+hash(i*1.9)*13;
    inkLine(c,[[fx,701],[fx+2,701-fh]],81320+i,1.6,"rgba(185,209,229,0.29)",.2);
  }
  c.restore();
  // Recessed mullions, catches and sill.
  for(const mx of [650,830,1010]) {
    inkLine(c,[[mx,248],[mx,702]],81360+mx,7,"#343849",.4);
    inkLine(c,[[mx+3,251],[mx+3,699]],81370+mx,1.6,"#8c97ad",.2);
  }
  inkLine(c,[[650,453],[1010,453]],81380,8,"#343849",.4);
  inkLine(c,[[653,456],[1007,456]],81381,1.4,"#8993a9",.2);
  rbox(c,824,522,13,42,4,81382,.3); paint(c,"#9593a0","#25293c",2);
  inkLine(c,[[831,531],[842,544]],81383,4,"#b2afad",.2);
  poly(c,[[635,699],[1024,699],[1044,729],[629,729]],81384,.7); paint(c,"#817789",C.ink,4);
  poly(c,[[629,729],[1044,729],[1043,741],[632,741]],81385,.5); paint(c,"#42384f",C.ink,3);
  inkLine(c,[[639,714],[1017,714]],81386,2,"rgba(201,211,235,0.5)",.4);
  // A gathered sheer curtain with folds and a stitched hem.
  inkLine(c,[[631,216],[1057,216]],81390,6,"#44334b",.5);
  const curtain:Pt[]=[[981,225],[1073,225],[1041,467],[1088,735],[994,750],[1006,492],[966,458]];
  poly(c,curtain,81391,1); paint(c,"#9692ab",C.ink,4);
  c.save(); poly(c,curtain,81391,1);c.clip();
  for(let i=0;i<5;i++) {
    const px=976+i*23;
    inkLine(c,[[px,229],[px-10,455],[px+24,736]],81393+i,9,"rgba(45,48,78,0.18)",.7);
    inkLine(c,[[px+5,229],[px-6,452],[px+29,733]],81400+i,2,"rgba(209,216,231,0.35)",.4);
  }
  inkLine(c,[[993,727],[1085,717]],81408,2,"rgba(213,214,228,0.5)",.5);
  c.restore();
  poly(c,[[966,458],[1030,451],[1035,465],[973,476]],81409,.5);paint(c,"#81719b",C.ink,2.5);
  for(let i=0;i<5;i++) {oval(c,984+i*19,223,5,9,81412+i,.2);paint(c,null,"#b3a3aa",2);}
}

export function detailedBedroom(c: Ctx, abs: number, o: BedroomDetailOptions = {}) {
  const on=Math.max(0,Math.min(1,o.lamp??1)), fairy=Math.max(0,Math.min(1,o.lights??.6));
  const [lx,ly]=o.lampAt??[830,690];
  fillBg(c,vgrad(c,0,H,[[0,"#29253e"],[.56,"#29273e"],[1,"#171d31"]]));
  // Painted plaster, cornice and very subtle wallpaper grain.
  poly(c,[[-60,0],[1140,0],[1140,90],[-60,102]],81430,.7);paint(c,"#343048",null);
  inkLine(c,[[-60,101],[1140,89]],81431,3,"rgba(158,147,174,0.15)",.5);
  for(let i=0;i<60;i++){
    const x=hash(i*5.7+9)*W,y=110+hash(i*8.3+11)*1100;
    inkLine(c,[[x,y],[x+8+hash(i+9)*18,y+2]],81440+i,1,"rgba(177,154,171,0.055)",.2);
  }
  // The floor and rug give the foreground depth instead of an empty flat rectangle.
  poly(c,[[-60,1240],[1140,1230],[1140,2000],[-60,2000]],81510,1);paint(c,"#342d40",C.ink,4);
  for(let i=-5;i<10;i++) {
    const end=-250+i*205,near=650+(end-650)*.3;
    inkLine(c,[[near,1240],[end,2000]],81520+i,2,"rgba(9,10,27,0.48)",.5);
    inkLine(c,[[near+3,1240],[end+3,2000]],81540+i,1,"rgba(151,121,137,0.15)",.3);
  }
  for(const y of [1310,1420,1570,1770,1990]) inkLine(c,[[-60,y],[1140,y-11]],81560+y,1.8,"rgba(14,12,29,0.36)",.4);
  oval(c,548,1450,530,175,81570,1);paint(c,"#65526b","#28213b",4);
  oval(c,548,1447,500,152,81571,.8);paint(c,null,"rgba(179,141,161,0.4)",2);
  c.save();oval(c,548,1450,518,168,81570,0);c.clip();
  for(let y=1293;y<1620;y+=11)inkLine(c,[[10,y],[1080,y+3]],81580+y,1,"rgba(195,160,177,0.1)",.4);
  c.restore();
  // Two soft slippers at the bed, angled independently.
  for(const [x,y,r] of [[606,1350,-.22],[706,1370,.1]]) {
    c.save();c.translate(x,y);c.rotate(r);
    oval(c,5,10,40,68,81600+x,.5);paint(c,"rgba(9,9,23,.34)",null);
    oval(c,0,0,34,62,81610+x,.6);paint(c,"#967e8c","#3d304b",3);
    oval(c,0,-11,26,41,81620+x,.5);paint(c,"#4b3c56",null);
    blob(c,[[-32,-9],[-28,-46],[0,-62],[28,-46],[32,-9],[12,2],[-12,2]],81630+x,.5);paint(c,"#b18a9b","#5f4762",2.5);
    inkLine(c,[[-22,-15],[0,-9],[23,-15]],81640+x,2,"rgba(234,204,210,.4)",.4);
    c.restore();
  }
  // A grounded bedside cabinet, with books in its open lower shelf.
  poly(c,[[653,820],[1031,820],[1024,1144],[658,1151]],81700,1);paint(c,"#594556",C.ink,5);
  poly(c,[[1031,820],[1054,800],[1045,1112],[1024,1144]],81701,.6);paint(c,"#3c344a",C.ink,4);
  poly(c,[[673,886],[1008,886],[1005,1109],[676,1112]],81702,.5);paint(c,"#211d32","#2b2238",4);
  poly(c,[[675,844],[1010,844],[1008,903],[676,904]],81703,.6);paint(c,"#796072","#362a43",3);
  inkLine(c,[[815,869],[865,869]],81704,5,"#ad9095",.5);
  for(let i=0;i<5;i++){
    const x=722+i*42,h=106+(i%3)*18;
    poly(c,[[x,1105-h],[x+31,1105-h],[x+34,1106],[x,1107]],81710+i,.6);paint(c,["#857e93","#ad858c","#738788","#b4a18c","#676a81"][i],C.ink,2.5);
    inkLine(c,[[x+8,1118-h],[x+25,1118-h]],81720+i,1.5,"rgba(223,213,208,.45)",.2);
  }
  for(const x of [684,994])poly(c,[[x,1142],[x+17,1142],[x+14,1200],[x-1,1200]],81730+x,.5),paint(c,"#3b3044",C.ink,3);
  poly(c,[[641,787],[1027,781],[1056,806],[653,824]],81740,.7);paint(c,"#8a6e72",C.ink,4);
  poly(c,[[653,824],[1056,806],[1056,820],[654,837]],81741,.5);paint(c,"#584351",C.ink,3);
  inkLine(c,[[662,808],[1033,794]],81742,2,"rgba(237,198,160,0.4)",.6);
  // A notebook with paper edges, then the existing ceramic cup resource.
  poly(c,[[904,789],[999,786],[1001,800],[904,804]],81750,.5);paint(c,"#d2b78d",C.ink,2.5);
  inkLine(c,[[910,794],[993,790]],81751,2,"#ede0bc",.3);
  poly(c,[[901,784],[998,781],[1001,787],[904,792]],81752,.5);paint(c,"#897d9e",C.ink,2);
  coffee(c,951,760,.36,abs,false,"#c4b5bd");
  bear(c,720,744);
  windowScene(c,abs,o.winter??false);
  photos(c,o.photos);
  // Bed structure, upholstery channels and two pillows stay at the approved pose coordinates.
  oval(c,328,1251,440,77,81800,.5);paint(c,"rgba(5,7,20,0.45)",null);
  poly(c,[[-60,690],[600,700],[607,1010],[-60,1000]],81801,1);paint(c,"#63516f",C.ink,5);
  inkLine(c,[[-60,700],[590,711]],81802,5,"rgba(185,147,167,.35)",.6);
  for(let x=70;x<590;x+=115)inkLine(c,[[x,711],[x+2,953]],81803+x,2,"rgba(33,28,52,.32)",.5);
  poly(c,[[-80,940],[660,960],[680,1160],[-80,1150]],81810,1);paint(c,"#b7a3b9",C.ink,5);
  blob(c,[[48,749],[441,763],[461,868],[24,857]],81812,1.2);paint(c,"#d0bccb",C.ink,4);
  inkLine(c,[[50,763],[424,776],[440,850]],81813,2,"rgba(241,220,228,.56)",.7);
  for(let i=0;i<13;i++)inkLine(c,[[54+i*28,852],[58+i*28,852]],81815+i,1,"#8b708a",.2);
  inkLine(c,[[70,775],[94,805],[76,840]],81830,2,"rgba(104,78,109,.24)",.5);
  poly(c,[[-80,1140],[676,1150],[672,1270],[-80,1260]],81840,1);paint(c,"#776079",C.ink,5);
  inkLine(c,[[-80,1153],[668,1164]],81841,3,"rgba(214,178,190,.45)",.6);
  inkLine(c,[[-60,1240],[655,1250]],81842,2,"#463649",.5);
  for(let x=30;x<650;x+=150)inkLine(c,[[x,1169],[x,1232]],81850+x,1.4,"rgba(28,22,40,.24)",.4);
  // The lamp is a physical object at the same place as the switch gesture.
  lamp(c,lx,ly,on);
  // Darken the room materials before adding the motivated light. Keep the self-lit window clear.
  c.save();c.beginPath();c.rect(-60,-60,W+120,H+120);c.rect(650,250,360,450);c.clip("evenodd");
  c.fillStyle="rgba(7,12,31,"+(.17+.29*(1-on)).toFixed(3)+")";c.fillRect(-60,-60,W+120,H+120);c.restore();
  // Moonlight falls through the panes onto the floor and across the bedding.
  paneLight(c,[[827,1242],[1083,1259],[879,1810],[234,1690]],"124,153,218",.14+.1*(1-on),11,"bedroom-floor-panes");
  lightShaft(c,[[818,469],[994,538],[520,1435],[170,1227]],907,480,300,1400,"128,158,232",.055,28,"bedroom-air");
  c.save(); c.beginPath();c.rect(-80,690,790,590);c.clip();
  paneLight(c,[[455,722],[620,748],[341,1240],[59,1165]],"159,181,236",.08+.08*(1-on),8,"bedroom-bed-panes");
  c.restore();
  if(on>0) {
    glow(c,lx,ly-10,490,"rgba(255,185,109,0.22)",on);
    lightShaft(c,[[lx-45,ly+17],[lx+45,ly+17],[lx+155,ly+170],[lx-154,ly+170]],lx,ly+17,lx,ly+210,"255,196,125",.17*on,12,"bedroom-lamp-down");
    c.save();c.globalCompositeOperation="lighter";
    glow(c,lx,ly+18,58,"rgba(255,219,163,0.34)",on);c.restore();
    motes(c,abs,lx-24,ly+50,164,153,10,81930,"241,209,170",.2,1.5);
  }
  // Fairy bulbs and wire, drawn last so the room's ambient shade cannot extinguish them.
  const wire:Pt[]=[];
  for(let i=0;i<=40;i++){const u=i/40;wire.push([-20+u*1120,170+Math.sin(u*Math.PI*3)*30+u*20]);}
  inkLine(c,wire,81940,2.3,"#181729",.4);
  for(let i=0;i<15;i++){
    const u=(i+.5)/15,x=-20+u*1120,y=170+Math.sin(u*Math.PI*3)*30+u*20+16;
    const k=fairy*(.9+.1*Math.sin(abs*1.2+i));
    inkLine(c,[[x,y-16],[x,y-6]],81950+i,2,"#343344",.2);
    glow(c,x,y,67,i%3?"rgba(255,204,142,0.34)":"rgba(243,168,195,0.27)",k);
    oval(c,x,y,6.5,10,81970+i,.3);paint(c,i%3?"#d8ba87":"#c897ab",C.ink,1.7);
    oval(c,x-1,y-2,2.6,5,81990+i,.1);paint(c,i%3?"#ffe5b0":"#efbdcf",null);
  }
}
