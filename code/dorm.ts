/**
 * 宿舍夜晚：双侧上床下桌、雪夜窗、夹式阅读灯、串灯与学习桌。
 * 背景在人物之前调用，桌面在人物之后调用；不含剧情角色、台词或回忆滤镜。
 */
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { C, Ctx, F, H, Pt, W, beginFrame, blob, fillBg, filtered, glow, hash, inkLine, lightShaft, loadFonts, motes, oval, paint, poly, rbox, text, vgrad } from "./draw";
import { desk, paneLight } from "./sets";
import { snow } from "./blocked/snow";

export interface DormOptions { lamp?: number; lights?: number; winter?: boolean; month?: string; circledDay?: number; }
export interface DormDeskOptions { y?: number; lamp?: number; notebookTitle?: string; noodleLabel?: string; }

/** Small, restrained pools of reflected light, never a frame-wide warm filter. */
function pool(c:Ctx,x:number,y:number,rx:number,ry:number,rgb:string,a:number) {
  c.save();c.translate(x,y);c.scale(rx,ry);
  const g=c.createRadialGradient(0,0,0,0,0,1);
  g.addColorStop(0,"rgba("+rgb+","+a+")");g.addColorStop(.5,"rgba("+rgb+","+(a*.52)+")");g.addColorStop(1,"rgba("+rgb+",0)");
  c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
}
function wall(c:Ctx) {
  fillBg(c,vgrad(c,0,1340,[[0,"#a7a28c"],[.44,"#beb396"],[1,"#849384"]]));
  // Shadows inside the bed alcoves give the window and the faces breathing room.
  const side=c.createLinearGradient(0,0,W,0);
  side.addColorStop(0,"rgba(30,42,49,.30)");side.addColorStop(.31,"rgba(30,42,49,.02)");
  side.addColorStop(.6,"rgba(30,42,49,0)");side.addColorStop(1,"rgba(26,43,58,.33)");
  c.fillStyle=side;c.fillRect(-60,0,W+120,1380);
  poly(c,[[-60,-60],[1140,-60],[1140,88],[-60,96]],92000,.5);paint(c,"#c0bda6","#62695e",3);
  inkLine(c,[[-40,93],[540,87],[1120,91]],92001,3,"rgba(231,222,186,.5)",.3);
  for(let i=0;i<92;i++){
    const x=hash(92005+i*6.2)*W,y=104+hash(92004+i*2.7)*1170;
    inkLine(c,[[x,y],[x+7+hash(i*7.8)*32,y-1]],92010+i,.7,i%3?"rgba(65,79,79,.10)":"rgba(227,223,188,.17)",.15);
  }
  // The cool neutral ceiling tube remains an ambient source, with end caps and its mounting shadow.
  rbox(c,332,40,416,40,8,92101,.4);paint(c,"rgba(38,47,49,.28)",null);
  rbox(c,338,36,404,32,6,92102,.3);paint(c,"#bdc0b5","#525c5a",2.5);
  rbox(c,357,40,365,22,4,92103,.2);paint(c,"#e9ead4","#87978e",1);
  c.fillStyle="#8f998e";c.fillRect(342,39,12,25);c.fillRect(725,38,11,25);
  pool(c,540,67,390,130,"235,239,218",.19);
  for(const x of [349,731]){oval(c,x,49,2,2,92104+x,.1);paint(c,"#5f6b67",null);}
}
function winterWindow(c:Ctx,t:number,winter:boolean) {
  // Recess, inner frame and the projecting sill.
  rbox(c,350,144,380,447,9,92200,.7);paint(c,"#666f6b","#424d4e",4);
  rbox(c,362,153,356,425,6,92201,.4);paint(c,"#ced0b9","#7b8d85",2);
  c.save();rbox(c,374,168,332,397,3,92202,.4);c.clip();
  fillBg(c,vgrad(c,168,575,[[0,"#1a304c"],[.6,"#344665"],[1,"#4a565c"]]));
  glow(c,681,205,185,"rgba(145,184,224,.12)");
  for(let i=0;i<7;i++){
    const bx=342+i*64,by=302+hash(i*8.2)*42;
    c.fillStyle=i%2?"#213247":"#283950";c.fillRect(bx,by,63,320);
    inkLine(c,[[bx,by],[bx+61,by]],92210+i,3,"#49576a",.2);
    for(let row=0;row<4;row++)for(let col=0;col<2;col++){
      const x=bx+10+col*26,y=by+24+row*55,lit=hash(i*2.2+row*3.7+col)> .49;
      c.fillStyle=lit?"#a99567":"#182c40";c.fillRect(x,y,15,23);
      if(lit){c.fillStyle="rgba(247,208,129,.57)";c.fillRect(x+1,y+1,13,13);glow(c,x+7,y+12,19,"rgba(222,173,98,.09)");}
      inkLine(c,[[x-2,y+24],[x+18,y+24]],92230+i+row*10+col,1.3,"#495b69",.1);
    }
  }
  if(winter)snow(c,t,{x:363,y:152,w:358,h:430,n:38,seed:88,speed:40,size:2.7,alpha:.66,drift:10});
  // The reflected ceiling strip and a few small frost crystals sit on the glass, not outside.
  poly(c,[[387,171],[419,170],[564,565],[531,565]],92280,.2);paint(c,"rgba(188,211,219,.055)",null);
  for(let i=0;i<28;i++){
    const x=379+hash(i*6.1)*323,y=548+hash(i*3.7)*19;
    inkLine(c,[[x-3,y+6],[x,y],[x+4,y+5]],92290+i,.8,"rgba(211,226,218,.3)",.2);
  }
  c.restore();
  for(const x of [370,535,703]){
    rbox(c,x,158,9,420,2,92330+x,.3);paint(c,"#a6b7aa","#4d6669",1.5);
    inkLine(c,[[x+2,165],[x+2,567]],92331+x,1.6,"rgba(228,230,205,.55)",.15);
  }
  rbox(c,545,387,7,33,3,92340,.3);paint(c,"#d2c6a1","#4a6060",1.5);
  oval(c,548,397,1.8,1.8,92341,.1);paint(c,"#4e6767",null);
  poly(c,[[351,574],[725,574],[749,598],[332,602]],92342,.4);paint(c,"#b0bba5","#485e60",3);
  poly(c,[[332,601],[749,598],[744,612],[336,615]],92343,.4);paint(c,"#607571","#485e60",2);
  inkLine(c,[[347,600],[733,597]],92344,2.5,"#d0d3b8",.2);
  pool(c,546,615,305,290,"127,177,218",.17);
}
function curtains(c:Ctx) {
  for(const right of [false,true]){
    c.save();if(right){c.translate(W,0);c.scale(-1,1);}
    const p:Pt[]=[[318,135],[402,136],[376,293],[361,368],[374,485],[401,612],[309,616],[320,390]];
    poly(c,p,92400,.8);paint(c,"#78977c","#394e49",3.5);
    c.save();poly(c,p,92400,.8);c.clip();
    poly(c,[[322,139],[341,139],[341,372],[328,616],[310,616]],92401,.5);paint(c,"#567762",null);
    poly(c,[[350,137],[368,137],[349,362],[371,618],[354,618],[339,371]],92402,.6);paint(c,"rgba(195,207,147,.31)",null);
    poly(c,[[381,137],[399,137],[370,368],[399,611],[381,612],[355,367]],92403,.5);paint(c,"#587c65",null);
    for(let i=0;i<6;i++)inkLine(c,[[325+i*12,150],[335+i*4,369],[315+i*15,603]],92410+i,1.4,i%2?"rgba(201,214,165,.26)":"rgba(35,68,53,.26)",.4);
    for(let j=0;j<19;j++)inkLine(c,[[307,159+j*23],[400,158+j*23]],92420+j,.6,"rgba(215,221,172,.12)",.1);
    c.restore();
    poly(c,[[325,365],[363,363],[365,381],[325,384]],92445,.4);paint(c,"#b8ac7d","#55634e",2);
    inkLine(c,[[363,374],[382,400],[370,421]],92446,2.2,"#c5b185",.4);
    inkLine(c,[[315,607],[389,604]],92447,1.4,"#b5c79a",.3);
    for(let i=0;i<5;i++){oval(c,324+i*17,138,5,8,92450+i,.2);paint(c,null,"#b0b49a",2);}
    c.restore();
  }
  inkLine(c,[[307,133],[772,132]],92460,5,"#6d7366",.3);
  inkLine(c,[[307,130],[772,129]],92461,1.6,"#c3c2a3",.2);
  // Clothes hanging on the same rail: stitched towel, hoodie seams and the actual hanger.
  inkLine(c,[[460,130],[468,116],[476,130]],92462,2.3,"#c5b9a1",.3);
  poly(c,[[443,134],[500,135],[501,263],[441,265]],92463,.7);paint(c,"#bd8f98","#6f6764",2.5);
  poly(c,[[442,135],[457,135],[456,264],[442,264]],92464,.4);paint(c,"rgba(75,77,89,.18)",null);
  for(const y of [145,248,254])inkLine(c,[[446,y],[494,y]],92465+y,1.5,"#e0b7b5",.3);
  for(let i=0;i<10;i++)inkLine(c,[[449+i*5,144],[447+i*5,243]],92470+i,.55,"rgba(232,202,188,.2)",.2);
  inkLine(c,[[610,130],[615,112],[622,111],[625,119],[620,132]],92484,2,"#b6baa9",.3);
  poly(c,[[596,135],[642,134],[676,185],[653,203],[640,183],[641,268],[595,268],[594,183],[580,203],[557,184]],92485,.7);paint(c,"#507a97","#354b60",3);
  blob(c,[[599,139],[604,124],[631,125],[639,138],[630,153],[610,153]],92486,.5);paint(c,"#7196aa","#3f5c6d",2);
  inkLine(c,[[616,150],[615,174]],92487,1.6,"#c1c8b8",.2);
  inkLine(c,[[625,152],[627,174]],92488,1.6,"#c1c8b8",.2);
  poly(c,[[605,219],[632,219],[638,242],[600,242]],92489,.5);paint(c,"#527d97","#40677e",1.5);
  inkLine(c,[[598,263],[639,263]],92490,2,"#7b9faf",.2);
}
function bed(c:Ctx,right:boolean) {
  c.save();if(right){c.translate(W,0);c.scale(-1,1);}
  // Mattress volume and a pillow distinguish a bed from a flat shelf.
  poly(c,[[-60,273],[350,273],[354,315],[-60,316]],92500,.6);paint(c,right?"#8b97a9":"#b49a98","#465760",3);
  inkLine(c,[[-30,301],[345,300]],92501,2,right?"#c2c6c4":"#d4b9b3",.3);
  blob(c,[[96,243],[108,203],[162,194],[195,199],[219,241]],92502,.8);paint(c,right?"#c6cbbb":"#dac0b3","#657571",2.5);
  inkLine(c,[[111,224],[126,207],[177,205],[198,219]],92503,1.8,"rgba(244,229,204,.7)",.4);
  inkLine(c,[[189,207],[183,231]],92504,1.3,"rgba(84,99,106,.3)",.4);
  blob(c,[[-60,246],[86,241],[161,247],[222,217],[292,225],[345,253],[348,282],[-60,285]],92505,.8);paint(c,right?"#7e91af":"#be8fa5","#59616b",3);
  c.save();blob(c,[[-60,246],[86,241],[161,247],[222,217],[292,225],[345,253],[348,282],[-60,285]],92505,.8);c.clip();
  for(let i=0;i<10;i++)inkLine(c,[[i*42-40,229],[i*42-21,285]],92510+i,1.3,"rgba(226,213,211,.3)",.3);
  for(const y of [252,268])inkLine(c,[[-40,y],[134,y-2],[245,y-14],[350,y]],92521+y,1.1,"rgba(226,215,207,.35)",.4);
  poly(c,[[170,255],[225,227],[239,229],[213,268],[350,276],[350,287],[165,287]],92524,.5);paint(c,"rgba(39,56,73,.20)",null);
  c.restore();
  // Rail tubing has a lit edge, underside, fastenings and a shadow on the wall.
  pool(c,155,357,240,56,"24,43,50",.25);
  for(const y of [286,334]){
    rbox(c,-60,y,420,17,4,92530+y,.5);paint(c,"#9dafa8","#3d555b",3);
    inkLine(c,[[-35,y+4],[350,y+3]],92531+y,2.4,"#d6d6bd",.3);
    inkLine(c,[[-35,y+14],[350,y+14]],92532+y,2,"#60767b",.2);
  }
  for(let i=0;i<6;i++){
    const x=25+i*64;
    inkLine(c,[[x,299],[x,335]],92540+i,5,"#526c74",.3);
    inkLine(c,[[x-1,300],[x-1,334]],92546+i,1.7,"#b1c1b5",.15);
    oval(c,x,342,3,3,92552+i,.15);paint(c,"#425f65","#acb5a4",1);
  }
  // Gathered outer curtain, slightly translucent only along the lit fold edges.
  const pp:Pt[]=[[-60,99],[83,99],[87,271],[74,337],[90,366],[46,362],[30,371],[11,360],[-10,366],[-60,364]];
  poly(c,pp,92560,.6);paint(c,right?"#617c99":"#b67f95","#414f5a",3.5);
  c.save();poly(c,pp,92560,.6);c.clip();
  for(let i=0;i<7;i++){
    const x=-49+i*23;
    poly(c,[[x,103],[x+10,103],[x+15,370],[x+2,370]],92561+i,.5);paint(c,i%2?"rgba(228,198,186,.18)":"rgba(28,46,65,.19)",null);
    inkLine(c,[[x+13,105],[x+12,231],[x+16,354]],92570+i,1.2,"rgba(27,45,59,.24)",.3);
  }
  for(let j=0;j<22;j++)inkLine(c,[[-55,108+j*12],[85,108+j*12]],92580+j,.55,"rgba(237,218,193,.14)",.1);
  c.restore();
  inkLine(c,[[-30,355],[11,352],[33,363],[53,354],[85,358]],92604,1.6,right?"#a3b6c1":"#d5a9b4",.4);
  // Ladder shadow and metal rungs stay behind the seated figures.
  for(const x of [309,353]){
    inkLine(c,[[x+9,354],[x+17,1263]],92610+x,13,"rgba(28,49,53,.17)",.4);
    inkLine(c,[[x,342],[x,1280]],92611+x,9,"#476871",.35);
    inkLine(c,[[x-2,347],[x-2,1277]],92612+x,3.5,"#bac5b0",.3);
  }
  for(let y=423;y<1240;y+=111){
    inkLine(c,[[310,y+3],[351,y+3]],92620+y,9,"#516f76",.2);
    inkLine(c,[[309,y],[351,y]],92621+y,3.5,"#c0c8b4",.2);
    for(const x of [312,350]){oval(c,x,y,2.3,2.3,92622+y+x,.1);paint(c,"#647d7b",null);}
  }
  c.restore();
}
function shelves(c:Ctx,right:boolean) {
  c.save();if(right){c.translate(W,0);c.scale(-1,1);}
  rbox(c,-30,513,324,23,3,92700,.4);paint(c,"#897856","#3a5352",3);
  inkLine(c,[[-20,516],[288,516]],92701,2,"#c0b895",.2);
  poly(c,[[-20,537],[284,537],[280,550],[-20,550]],92702,.3);paint(c,"rgba(26,46,51,.25)",null);
  for(const x of [43,257]){poly(c,[[x,537],[x+29,537],[x+3,573]],92703+x,.3);paint(c,"#677c73","#486260",1.7);}
  const cols=right?["#a69b64","#996f79","#b3918b","#788c86"]:["#7397a8","#c0a05c","#899c80","#a47893","#ba8e80"];
  let x=-8;
  for(let i=0;i<cols.length;i++){
    const bw=25+i%2*9,bh=79+hash(12+i*3.3)*37;
    c.save();c.translate(x,513);if(i===4)c.rotate(.09);
    rbox(c,0,-bh,bw,bh,2,92710+i,.4);paint(c,cols[i],"#3d5656",2.1);
    c.fillStyle="rgba(25,49,60,.14)";c.fillRect(bw-6,-bh+2,5,bh-3);
    inkLine(c,[[3,-bh+7],[bw-4,-bh+7]],92720+i,1.5,"rgba(232,221,182,.55)",.2);
    inkLine(c,[[4,-13],[bw-4,-13]],92730+i,1.3,"rgba(238,219,171,.5)",.2);
    for(let j=0;j<3;j++)inkLine(c,[[8,-bh+26+j*10],[bw-8,-bh+26+j*10]],92740+i+j,.9,"rgba(49,76,77,.65)",.15);
    c.restore();x+=bw+3;
  }
  if(right){
    // small succulent and a ceramic catch-all, both sitting on the shelf surface
    oval(c,234,510,30,6,92760,.3);paint(c,"rgba(25,48,52,.28)",null);
    poly(c,[[213,477],[254,477],[248,511],[219,511]],92761,.4);paint(c,"#b18a6a","#466057",2);
    oval(c,233,478,20,5,92762,.3);paint(c,"#566951","#c1a580",1.5);
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3;
      oval(c,233+Math.cos(a)*11,460+Math.sin(a)*11,7,21,92763+i,.5,a);paint(c,i%2?"#75926b":"#91a078","#506c58",1.4);
    }
    oval(c,234,461,6,11,92770,.4);paint(c,"#a8b083","#5f795f",1.2);
  }else{
    rbox(c,202,484,67,27,3,92775,.5);paint(c,"#a39d88","#4c635d",2);
    inkLine(c,[[209,490],[260,490]],92776,2,"#d2c8a6",.2);
    rbox(c,224,491,21,9,2,92777,.2);paint(c,"#d7c6a0","#717b63",1);
  }
  c.restore();
}
function wallPaper(c:Ctx,o:DormOptions) {
  // Calendar layers and binding; the original circled ninth is preserved.
  rbox(c,51,604,156,174,3,92800,.5);paint(c,"rgba(23,42,48,.23)",null);
  for(let i=2;i>=0;i--){poly(c,[[56,594+i*3],[205,597+i*3],[203,768+i*3],[60,767+i*3]],92801+i,.5);paint(c,i?"#b9b4a0":"#d5d0b8","#6b7568",1.5);}
  c.fillStyle="#9a7270";c.fillRect(58,596,145,26);
  text(c,o.month??"12月",129,609,{size:18,font:F.ui,fill:"#ece0bb",weight:600});
  for(let d=1;d<=28;d++){
    const x=73+(d-1)%7*19,y=642+Math.floor((d-1)/7)*29;
    text(c,String(d),x,y,{size:12,font:F.ui,fill:d%7===0?"#aa6560":"#667c77"});
    if(d===(o.circledDay??9)){oval(c,x,y,12,10,92810+d,.7);paint(c,null,"#ba635e",1.7);}
  }
  for(const x of [73,188]){inkLine(c,[[x,590],[x,603]],92842+x,3,"#5e736b",.2);}
  // Pinned travel postcards have image content and layered paper, instead of blank rectangles.
  for(const [x,y,w,h,rot] of [[803,600,128,179,.025],[967,624,137,169,-.045]] as [number,number,number,number,number][]){
    c.save();c.translate(x,y);c.rotate(rot);
    rbox(c,5,7,w,h,2,92850+x,.4);paint(c,"rgba(23,43,53,.23)",null);
    poly(c,[[0,0],[w,1],[w-2,h],[2,h-2]],92851+x,.5);paint(c,"#bdc0a7","#657b73",1.8);
    c.save();c.beginPath();c.rect(8,9,w-16,h-37);c.clip();
    c.fillStyle=x<900?"#6e9da8":"#b7958e";c.fillRect(8,9,w-16,h-37);
    oval(c,w*.71,43,19,19,92852+x,.3);paint(c,"#d8cda7",null);
    poly(c,[[7,103],[39,67],[66,100],[91,59],[w,110],[w,h-26],[7,h-26]],92853+x,.5);paint(c,x<900?"#627e83":"#7d7b83",null);
    poly(c,[[5,h-58],[w,h-70],[w,h-24],[5,h-24]],92854+x,.5);paint(c,x<900?"#3f727b":"#a49d87",null);
    for(let i=0;i<4;i++)inkLine(c,[[22,h-51+i*6],[85,h-57+i*6]],92855+x+i,.9,"rgba(204,220,187,.45)",.2);
    c.restore();
    text(c,x<900?"WINTER":"WEEKEND",w/2,h-15,{font:F.ui,size:11,fill:"#576e69"});
    poly(c,[[w/2-20,-7],[w/2+25,-5],[w/2+23,12],[w/2-21,11]],92862+x,.3);paint(c,"rgba(190,173,121,.75)",null);
    c.restore();
  }
}
function readingLamp(c:Ctx,intensity:number) {
  // A visible clamp fixes the old unsupported floating lamp.
  inkLine(c,[[310,536],[315,594],[278,619],[293,681]],92900,2.2,"#455c56",.4);
  rbox(c,295,514,34,28,4,92901,.4);paint(c,"#687f79","#344e50",2.5);
  inkLine(c,[[317,535],[300,551],[243,553],[220,578]],92902,12,"#435e63",.4);
  inkLine(c,[[315,533],[299,548],[243,550],[218,576]],92903,5,"#c2c8ad",.3);
  for(const [x,y] of [[300,549],[243,551]]){oval(c,x,y,8,8,92904+x,.3);paint(c,"#859687","#405b5b",2);oval(c,x,y,2,2,92905+x,.1);paint(c,"#ced0af",null);}
  blob(c,[[190,572],[216,562],[239,575],[249,606],[182,613]],92906,.6);paint(c,"#b8bfa9","#3c565b",3);
  poly(c,[[194,578],[214,570],[222,575],[206,606],[186,609]],92907,.4);paint(c,"rgba(246,237,187,.38)",null);
  oval(c,216,609,35,9,92908,.4,-.08);paint(c,"#706e55","#455755",2);
  oval(c,217,610,27,5,92909,.3,-.08);paint(c,intensity>.05?"#fbe9af":"#b5b29b",null);
  if(intensity>.005){
    lightShaft(c,[[189,615],[244,610],[745,1350],[35,1350]],216,612,382,1370,"248,208,141",.29*intensity,25,"dorm_reading_light");
    pool(c,241,661,170,190,"253,221,152",.40*intensity);
    pool(c,344,848,410,470,"247,207,139",.22*intensity);
    glow(c,218,609,63,"rgba(255,229,162,.44)",intensity);
  }
}
function fairy(c:Ctx,t:number,a:number) {
  const wire:Pt[]=[];
  for(let i=0;i<=40;i++){const u=i/40;wire.push([118+u*845,127+Math.sin(u*Math.PI)*41+Math.sin(u*Math.PI*2)*15]);}
  inkLine(c,wire,92920,2,"#4b6057",.1);
  for(const x of [122,542,962]){rbox(c,x-8,120,15,12,2,92921+x,.2);paint(c,"rgba(198,193,149,.63)",null);}
  for(let i=0;i<13;i++){
    const u=(i+.5)/13,x=118+u*845,y=127+Math.sin(u*Math.PI)*41+Math.sin(u*Math.PI*2)*15;
    const pink=i%3===0,rgb=pink?"242,175,184":"253,224,150";
    inkLine(c,[[x,y],[x,y+8]],92925+i,2.4,"#485d55",.2);
    glow(c,x,y+17,47,"rgba("+rgb+",.43)",a*(.94+.06*Math.sin(t*1.4+i)));
    oval(c,x,y+16,6,10,92940+i,.3);paint(c,pink?"#e9b5bd":"#f4dfa1","#786e56",1.3);
    inkLine(c,[[x-1,y+12],[x-1,y+19]],92955+i,1.1,"#fff5d3",.1);
  }
}

/** 1080×1920 room backdrop, designed to be drawn before characters. */
export function dormRoom(c:Ctx,t:number,o:DormOptions={}) {
  const lamp=o.lamp??1;
  wall(c);winterWindow(c,t,o.winter??true);curtains(c);bed(c,false);bed(c,true);
  shelves(c,false);shelves(c,true);wallPaper(c,o);
  readingLamp(c,lamp);fairy(c,t,o.lights??1);
  // The backrests support the seated roommates without competing with their faces.
  for(const x of [215,865]){
    rbox(c,x-83,985,167,268,31,92980+x,.8);paint(c,"#64786e","#385754",3);
    rbox(c,x-71,998,143,199,24,92981+x,.5);paint(c,"#869180","#4d6a61",2);
    for(let i=0;i<4;i++)inkLine(c,[[x-56+i*38,1007],[x-56+i*38,1184]],92982+x+i,1.4,"rgba(217,214,171,.14)",.25);
  }
  motes(c,t,312,756,129,160,10,93000,"246,222,159",.15*lamp,1.4);
}

function notebook(c:Ctx,title:string) {
  c.save();c.translate(250,1640);c.rotate(-.105);
  poly(c,[[-177,-121],[165,-127],[175,143],[-173,147]],93100,.4);paint(c,"#3f655f","#263d40",3);
  for(let j=3;j>=0;j--){
    poly(c,[[-170,-126+j*2],[165,-127+j*2],[169,137+j*2],[-170,141+j*2]],93101+j,.35);paint(c,j%2?"#b0b7a3":"#d0cdb3","#71867d",.7);
  }
  poly(c,[[-169,-126],[-7,-128],[-4,132],[-169,138]],93107,.4);paint(c,"#e6dec1","#76887a",1.5);
  poly(c,[[-7,-128],[160,-125],[169,130],[-4,133]],93108,.4);paint(c,"#d4d1b6","#76887a",1.5);
  const fold=c.createLinearGradient(-26,0,19,0);
  fold.addColorStop(0,"rgba(63,78,68,0)");fold.addColorStop(.6,"rgba(57,73,65,.17)");fold.addColorStop(1,"rgba(232,226,197,0)");
  c.fillStyle=fold;c.fillRect(-26,-126,45,260);
  inkLine(c,[[-7,-125],[-3,131]],93109,1.5,"#819285",.25);
  for(let i=0;i<8;i++)for(const x of [-152,17]){
    inkLine(c,[[x,-83+i*27],[x+129,-83+i*27]],93110+i+x,.9,"rgba(80,130,153,.37)",.15);
  }
  text(c,title,-86,-101,{size:20,font:F.pen,fill:"#416b77"});
  text(c,"Unit 6",-95,-69,{size:16,font:F.pen,fill:"#536f7d"});
  const lines=["After class","have a good day","on the way","take a picture"];
  lines.forEach((s,i)=>text(c,s,-86,-43+i*27,{size:13,font:F.pen,fill:"#61767c"}));
  ["Monday","Tuesday","Wednesday","Thursday"].forEach((s,i)=>text(c,s,78,-68+i*27,{size:14,font:F.pen,fill:"#4d7485"}));
  inkLine(c,[[-146,82],[-116,82]],93131,1.4,"#b77669",.1);
  text(c,"review",69,87,{size:15,font:F.pen,fill:"#a57368"});
  poly(c,[[139,131],[166,105],[169,131]],93134,.3);paint(c,"#ece1bd","#9da48c",1);
  c.restore();
  // Fountain pen, slim highlight, metal clip and nib.
  c.save();c.translate(405,1780);c.rotate(.89);
  rbox(c,-6,-87,13,148,5,93140,.3);paint(c,"#416b90","#2b4a64",2);
  inkLine(c,[[-3,-70],[-3,52]],93141,1.4,"#a0c2cc",.2);
  rbox(c,-7,-95,15,44,3,93142,.2);paint(c,"#2b4e6b","#203d52",1.5);
  inkLine(c,[[5,-87],[7,-57]],93143,1.7,"#c9c6a7",.1);
  poly(c,[[-5,62],[5,62],[0,85]],93144,.2);paint(c,"#b6baa9","#3d5e63",1.2);
  inkLine(c,[[0,74],[0,84]],93145,1.5,"#314b57",.1);c.restore();
}
function noodles(c:Ctx,t:number,label:string) {
  // The paper cup is shaded cylindrically; its open rim shows noodles and garnishes.
  const body:Pt[]=[[790,1560],[950,1560],[931,1750],[809,1750]];
  const g=c.createLinearGradient(790,0,953,0);
  g.addColorStop(0,"#d9cd9f");g.addColorStop(.25,"#f0dcb1");g.addColorStop(.63,"#cebd91");g.addColorStop(1,"#93a28d");
  poly(c,body,93200,.5);paint(c,g,"#3d5656",3.4);
  c.save();poly(c,body,93200,.5);c.clip();
  c.fillStyle="#a35d57";c.fillRect(787,1618,170,62);
  poly(c,[[789,1659],[833,1650],[875,1666],[910,1652],[950,1662],[950,1681],[789,1681]],93201,.4);paint(c,"#d69c79",null);
  for(let i=0;i<17;i++)inkLine(c,[[800+i*9,1698],[806+i*8,1748]],93202+i,.7,"rgba(89,114,97,.16)",.1);
  text(c,label,870,1641,{size:24,font:F.cn,fill:"#ebd8ad"});
  text(c,"NOODLES",870,1700,{size:10,font:F.ui,weight:600,fill:"#617e72"});
  inkLine(c,[[816,1738],[925,1738]],93222,1.5,"#eece99",.2);
  c.restore();
  oval(c,870,1560,81,25,93224,.4);paint(c,"#e4d4a4","#4b6560",2.8);
  oval(c,870,1560,70,17,93225,.4);paint(c,"#8b773e","#a99355",1.4);
  c.save();oval(c,870,1560,70,17,93225,.4);c.clip();
  for(let i=0;i<12;i++){
    const x=807+hash(i*3.9)*119,y=1549+hash(i*2.8)*24;
    inkLine(c,[[x-15,y],[x-3,y-4],[x+12,y+3],[x+24,y-3]],93230+i,2.5,"#d7bd72",.6);
  }
  for(let i=0;i<9;i++){
    const x=818+hash(i*4.1)*109,y=1552+hash(i*7.8)*18;
    poly(c,[[x-3,y-2],[x+3,y-4],[x+5,y+2],[x-1,y+4]],93245+i,.4);paint(c,i%3?"#72915b":"#b86b43",null);
  }
  c.restore();
  inkLine(c,[[795,1557],[826,1542],[872,1539],[918,1545]],93260,1.8,"#f3e4b2",.3);
  // Partly peeled foil lid, folded away from the opening.
  blob(c,[[827,1542],[823,1522],[848,1496],[876,1484],[911,1498],[914,1520],[905,1541]],93261,.6);paint(c,"#a8baaa","#5b766f",2);
  inkLine(c,[[844,1532],[861,1510],[881,1496]],93262,1.5,"#d7dbbf",.4);
  inkLine(c,[[879,1537],[892,1516],[902,1506]],93263,1.2,"#748f83",.4);
  // Chopsticks rest on the lip with both tips above the cup's far side.
  for(let i=0;i<2;i++){
    inkLine(c,[[843+i*15,1560],[982+i*13,1497+i*4]],93265+i,5.5,"#564d3a",.2);
    inkLine(c,[[844+i*15,1557],[982+i*13,1494+i*4]],93268+i,2.8,"#ccb57b",.2);
  }
  // Slow continuous steam, never a new random shape when seeking.
  for(let i=0;i<3;i++){
    const x=825+i*29,shift=Math.sin(t*1.2+i*1.7)*7;
    c.beginPath();c.moveTo(x,1536);c.bezierCurveTo(x+19+shift,1498,x-20+shift,1465,x+4,1429);
    c.strokeStyle="rgba(227,230,197,"+(.22+.05*Math.sin(t*1.8+i))+")";c.lineWidth=2.5;c.stroke();
  }
}
function compact(c:Ctx) {
  oval(c,615,1741,69,31,93300,.5,-.10);paint(c,"#ac7c86","#394f57",2.8);
  oval(c,614,1736,62,25,93301,.4,-.10);paint(c,"#cea3a3","#725f67",1.8);
  inkLine(c,[[560,1736],[606,1757],[657,1740]],93302,1.6,"#e1beb0",.3);
  // Lid is hinged on its rear edge, with a small window reflection in the glass.
  oval(c,619,1680,67,57,93303,.5,-.10);paint(c,"#c1909c","#475763",3);
  oval(c,619,1680,55,45,93304,.4,-.10);paint(c,vgrad(c,1635,1725,[[0,"#a6c5c6"],[1,"#566f7c"]]),"#745e70",2);
  c.save();oval(c,619,1680,55,45,93304,.4,-.10);c.clip();
  poly(c,[[578,1641],[611,1635],[650,1720],[619,1726]],93305,.3);paint(c,"rgba(217,233,213,.27)",null);
  inkLine(c,[[616,1638],[621,1723]],93306,2.2,"rgba(61,99,112,.4)",.2);
  inkLine(c,[[570,1684],[670,1680]],93307,2.5,"rgba(61,99,112,.3)",.2);
  inkLine(c,[[581,1653],[606,1646]],93308,2,"#dedfc6",.3);
  c.restore();
  for(const x of [600,631]){rbox(c,x,1727,12,8,2,93310+x,.2);paint(c,"#c9b598","#74666a",1);}
}

/** Foreground desk; draw AFTER people so seated bodies disappear behind its back edge. */
export function dormDesk(c:Ctx,t:number,o:DormDeskOptions={}) {
  const y=o.y??1250,lamp=o.lamp??1;
  desk(c,y,{props:false,wood:"#886c4e",detailed:true});
  c.save();poly(c,[[-40,y],[1120,y-10],[1120,1960],[-40,1960]],21,2);c.clip();
  // Low-angle warm reading light and a cool reflection from the night window.
  pool(c,327,1425,760,550,"244,197,123",.36*lamp);
  paneLight(c,[[581,y+1],[749,y],[1043,1790],[671,1810]],"127,178,205",.14,6,"dorm_desk_window");
  pool(c,795,1860,550,270,"23,44,54",.19);
  for(const [x,cy,rx,ry,a] of [[185,y+6,129,38,.16],[545,y+14,164,55,.25],[877,y-2,135,43,.21]] as [number,number,number,number,number][]){
    pool(c,x,cy,rx,ry,"20,39,47",a);
  }
  // Each contact shadow has a tight core plus a broader tail away from the reading lamp.
  filtered(c,"blur(8px)",q=>{
    poly(q,[[90,1548],[412,1519],[464,1790],[133,1825]],93340,.4);paint(q,"rgba(25,42,45,.32)",null);
    oval(q,644,1751,80,35,93341,.5,-.08);paint(q,"rgba(20,40,48,.3)",null);
    blob(q,[[812,1736],[928,1728],[1009,1811],[911,1824]],93342,.6);paint(q,"rgba(24,40,41,.31)",null);
    inkLine(q,[[345,1840],[487,1716]],93343,14,"rgba(18,40,49,.26)",.4);
  },"dorm_prop_shadows");
  oval(c,870,1751,65,14,93344,.4);paint(c,"rgba(24,43,44,.28)",null);
  notebook(c,o.notebookTitle??"英语笔记");noodles(c,t,o.noodleLabel??"鲜蔬面");compact(c);
  // A couple of subdued wood knots, fine scratches and the desk's solid front lip.
  for(const [x,yy] of [[516,1589],[119,1862]])for(let i=0;i<3;i++){oval(c,x,yy,18+i*13,3+i*2,93350+x+i,.3,.01);paint(c,null,"rgba(55,65,48,.18)",.7);}
  c.restore();
  inkLine(c,[[-40,y+3],[1120,y-7]],93360,3,"rgba(237,207,153,.6)",.3);
  poly(c,[[-40,1869],[1120,1859],[1120,1980],[-40,1980]],93361,.5);paint(c,"#605548","#384b4b",3);
  inkLine(c,[[-40,1869],[1120,1859]],93362,3,"#a88e62",.25);
  inkLine(c,[[-40,1880],[1120,1871]],93363,2,"rgba(36,53,53,.55)",.25);
}

const FRAME={width:1080,height:1920,duration:3,prepare:loadFonts};
export const resources=defineResources({
  dormRoom:resource({
    kind:"set",title:"学生宿舍·夜晚（精细）",
    description:"双侧上床下桌、床帘与织物、雪夜窗、楼灯、书架、日历、明信片、夹式阅读灯和串灯。明确的暖阅读光与冷窗光；背景画在人物前，dormDesk 画在人物后，不含滤镜、角色和剧情文案。",
    tags:["宿舍","回忆","夜晚","上床下桌","床帘","冷暖光","精细"],usage:"dormRoom(ctx, abs, { lamp: 1, lights: 1, winter: true, month: '12月', circledDay: 9 }); // 再画人物和 dormDesk",
    params:z.object({lamp:z.number().min(0).max(1).default(1),lights:z.number().min(0).max(1).default(1),winter:z.boolean().default(true),month:z.string().default("12月"),circledDay:z.number().int().min(1).max(28).default(9)}),
    preview:{...FRAME,draw(c,t,p){beginFrame(c,t);dormRoom(c,t,p);dormDesk(c,t,{lamp:p.lamp});}}
  }),
  dormDesk:resource({
    kind:"set",title:"宿舍学习桌·前景（精细）",
    description:"复用 sets.desk 木桌，细化页边与书写的笔记本、钢笔、泡面与揭开的封口、筷子和热气、折叠小镜子。暖光、窗格反光和物体投影；在坐着的人物之后绘制。",
    tags:["宿舍","桌面","笔记本","泡面","镜子","前景"],usage:"dormDesk(ctx, abs, { y: 1250, lamp: 1, notebookTitle: '英语笔记', noodleLabel: '鲜蔬面' });",
    params:z.object({y:z.number().min(1000).max(1420).default(1250),lamp:z.number().min(0).max(1).default(1),notebookTitle:z.string().default("英语笔记"),noodleLabel:z.string().default("鲜蔬面")}),
    preview:{...FRAME,draw(c,t,p){beginFrame(c,t);fillBg(c,"#435958");dormDesk(c,t,p);}}
  })
});
