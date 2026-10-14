/**
 * Fine dressing for the guard's overhead desk. The phone stays at (540, 880), scale .92, rotation .06.
 * Photos and the birthday note are below the glass; the duty book, pen, cup and keys rest above it.
 * All texture seeds are fixed; only the steam depends on absolute time.
 */
import { Ctx, F, H, Pt, W, blob, fillBg, glow, hash, inkLine, lightShaft, measure, oval, paint, poly, rbox, text, vgrad } from "../draw";
import { drawKid } from "../kid";

export interface DetailedDeskOptions {
  note?: string;
  note2?: string;
  logTitle?: string;
  log?: string[];
  photos?: boolean;
  phoneLight?: number;
  phoneResting?: boolean;
  /** The last log entry being written (0..1): its time is down already, the words after it appear left to right.
   *  Leave it out for a finished page. The pen's tip is at logPen(c, o). */
  logWrite?: number;
  /** false: the pen isn't lying on the desk (it's in his hand — draw it with heldPen). */
  pen?: boolean;
  /** the lonely grade: cold blue, moonlight from the window on the left, no keys; only her photos stay warm */
  lonely?: boolean;
}

function wood(c: Ctx, lonely = false) {
  fillBg(c, vgrad(c, -100, 2000, [[0,"#6b523b"],[.32,"#604834"],[.7,"#4b3c31"],[1,"#333c37"]]));
  // Broad veneer ribbons, with fine broken grain rather than a stack of floorboards.
  for (let i=0;i<12;i++) {
    const y=-70+i*182;
    blob(c,[[-80,y],[280,y+14],[650,y-22],[1160,y+8],[1160,y+94],[690,y+61],[290,y+116],[-80,y+91]],89100+i,.6);
    paint(c,i%3===0?"rgba(193,133,73,.045)":"rgba(33,23,17,.055)",null);
  }
  for (let i=0;i<145;i++) {
    const y=hash(i*7.37+4)*2070-60, x=hash(i*3.19+8)*1260-100;
    const len=48+hash(i+22)*425;
    inkLine(c,[[x,y],[x+len*.34,y-4-hash(i+3)*7],[x+len*.72,y+3],[x+len,y+2]],89200+i,.7+hash(i+7),i%4===0?"rgba(206,159,108,.085)":"rgba(29,25,19,.14)",.2);
  }
  for (const [x,y,rx] of [[124,1739,51],[828,822,28],[330,112,36]]) {
    for(let j=0;j<5;j++) {
      oval(c,x,y,rx+j*16,7+j*3,89400+x+j,.45,-.018);
      paint(c,null,j<2?"rgba(29,24,18,.16)":"rgba(169,119,77,.07)",1.3);
    }
  }
  // A joined edge and a few tiny varnish scratches.
  inkLine(c,[[-60,1686],[410,1691],[1140,1685]],89460,2.3,"rgba(18,24,24,.25)",.3);
  inkLine(c,[[-60,1689],[410,1694],[1140,1688]],89461,1.3,"rgba(213,172,119,.10)",.3);
  for(let i=0;i<24;i++) {
    const x=hash(i*8.3+1)*W,y=hash(i*5.8+6)*H;
    inkLine(c,[[x,y],[x+9+hash(i)*25,y-2]],89470+i,1,"rgba(223,190,139,.10)",.1);
  }
  if(lonely){glow(c,60,60,1150,"rgba(140,165,225,.12)");return;}
  // Warm sodium light through the window, cool monitor fill at the left.
  glow(c,1000,110,1130,"rgba(250,188,107,.17)");
  glow(c,-100,520,790,"rgba(134,177,193,.09)");
  const light=c.createLinearGradient(1050,-200,100,1560);
  light.addColorStop(0,"rgba(255,206,136,.16)");
  light.addColorStop(.38,"rgba(255,195,115,.065)");
  light.addColorStop(.7,"rgba(247,180,95,0)");
  c.fillStyle=light;c.fillRect(-60,-60,1200,2040);
}

function oldPhoto(c:Ctx,x:number,y:number,rot:number,s:number,index:number) {
  c.save();c.translate(x,y);c.rotate(rot);c.scale(s,s);
  // Pressed flat beneath the glass: a narrow paper edge, not a floating Polaroid.
  poly(c,[[-75,-96],[74,-94],[75,102],[-75,104]],89500+index,.35);
  paint(c,"rgba(18,25,23,.35)",null);
  poly(c,[[-74,-97],[73,-95],[73,100],[-74,102]],89504+index,.4);
  paint(c,vgrad(c,-96,103,[[0,"#e3d5b7"],[1,"#bdb79f"]]),"#4b493c",1.8);
  c.save();c.beginPath();c.rect(-62,-84,124,155);c.clip();
  c.fillStyle=["#bd938f","#8fabad","#a6b098"][index];c.fillRect(-62,-84,124,155);
  if(index===0) {
    for(let j=0;j<4;j++){oval(c,-53+j*39,-63,24,38,89512+j,.4);paint(c,"rgba(244,215,165,.18)",null);}
    drawKid(c,0,-9,.3,{who:"girl",outfit:"pajamas",body:"bust",eyes:"shut",mouth:"smile",blush:.5});
  } else if(index===1) {
    c.fillStyle="#738e79";c.fillRect(-62,42,124,30);
    drawKid(c,0,-9,.325,{who:"girl",outfit:"cardigan",body:"bust",eyes:"happy",mouth:"grin",blush:.4});
  } else {
    inkLine(c,[[-62,-48],[62,-48]],89518,16,"rgba(219,220,192,.2)",.2);
    drawKid(c,0,-7,.33,{who:"girl",outfit:"uniform",body:"bust",eyes:"open",mouth:"smile"});
  }
  const wash=c.createLinearGradient(-62,-84,62,72);
  wash.addColorStop(0,"rgba(241,222,183,.13)");wash.addColorStop(.6,"rgba(114,100,65,.035)");wash.addColorStop(1,"rgba(33,48,46,.14)");
  c.fillStyle=wash;c.fillRect(-62,-84,124,155);
  for(let j=0;j<26;j++) {
    c.fillStyle=j%3?"rgba(32,39,30,.07)":"rgba(249,226,191,.18)";
    c.fillRect(-62+hash(j*4.7+index)*124,-84+hash(j*6.3+index)*155,.8,1.3);
  }
  c.restore();
  inkLine(c,[[-62,-84],[62,-84],[62,71]],89530+index,1.2,"rgba(25,39,35,.5)",.15);
  inkLine(c,[[-69,87],[27,87]],89534+index,.7,"rgba(62,62,49,.18)",.1);
  // A worn corner and a small yellowing strip left on the oldest print.
  poly(c,[[58,101],[73,84],[73,100]],89538+index,.15);paint(c,"#e7dac1","#a69e84",.6);
  if(index===0) {
    poly(c,[[-57,-108],[-8,-105],[-6,-81],[-55,-83]],89542,.5);
    paint(c,"rgba(210,184,126,.32)",null);
    inkLine(c,[[-51,-106],[-50,-84]],89543,.6,"rgba(255,232,170,.24)",.1);
  }
  c.restore();
}

/** her three old photos pressed under the glass */
function herPhotos(c:Ctx) {
  oldPhoto(c,173,1264,-.115,1.18,0);
  oldPhoto(c,910,1324,.095,1.18,1);
  oldPhoto(c,866,226,.145,1.10,2);
}
function keepsakes(c:Ctx,o:DetailedDeskOptions) {
  if(o.photos??true) herPhotos(c);
  note(c,o,263,1574,-.05);
}
/** the birthday note under the glass, at (x, y) turned `rot` */
function note(c:Ctx,o:DetailedDeskOptions,x:number,y:number,rot:number) {
  c.save();c.translate(x,y);c.rotate(rot);
  const edge:Pt[]=[[-165,-66],[-96,-68],[-37,-65],[24,-68],[96,-66],[165,-67],[163,68],[95,67],[22,70],[-40,67],[-104,69],[-166,67]];
  poly(c,edge.map(([x,y])=>[x+1,y+3] as Pt),89560,.3);paint(c,"rgba(20,27,25,.36)",null);
  poly(c,edge,89561,.3);paint(c,vgrad(c,-68,70,[[0,"#eadbb3"],[1,"#c8c1a4"]]),"#7c7a63",1.2);
  for(const y of [-26,19,56])inkLine(c,[[-150,y],[152,y]],89565+y,.8,"rgba(96,132,139,.22)",.1);
  inkLine(c,[[-132,-61],[-133,65]],89568,1,"rgba(175,104,91,.24)",.1);
  text(c,o.note??"囡囡生日 6月18日",0,-16,{size:38,font:F.pen,fill:"#283f56"});
  text(c,o.note2??"别忘了打电话",0,31,{size:30,font:F.pen,fill:"#3c4d5b"});
  // A fold and frayed edge are very faint so the two lines stay legible.
  inkLine(c,[[72,-65],[69,-21],[74,65]],89569,.8,"rgba(93,81,53,.12)",.1);
  poly(c,[[143,-66],[164,-66],[164,-44]],89570,.2);paint(c,"#b8b396",null);
  inkLine(c,[[143,-66],[164,-44]],89571,1,"rgba(244,236,200,.7)",.1);
  c.restore();
}

function glass(c:Ctx) {
  c.save();rbox(c,57,63,1057,1850,14,89600,.3);c.clip();
  c.fillStyle="rgba(83,118,111,.075)";c.fillRect(40,50,1090,1880);
  // Window reflections cross the wood and the prints, below objects standing on the glass.
  const g=c.createLinearGradient(60,1780,1120,200);
  for(const [s,col] of [[0,"rgba(143,179,192,0)"],[.12,"rgba(166,201,210,.01)"],[.155,"rgba(178,208,216,.09)"],[.181,"rgba(165,198,209,.012)"],[.42,"rgba(159,190,208,0)"],[.72,"rgba(226,218,181,0)"],[.752,"rgba(243,227,177,.085)"],[.77,"rgba(239,222,172,.015)"],[1,"rgba(235,217,169,0)"]] as [number,string][])g.addColorStop(s,col);
  c.fillStyle=g;c.fillRect(40,50,1090,1880);
  for(let i=0;i<27;i++){
    const x=hash(i*9.4+5)*1050+60,y=hash(i*7.1+12)*1770+80;
    inkLine(c,[[x,y],[x+7+hash(i*3)*23,y-13]],89610+i,.7,"rgba(210,230,216,.11)",.05);
  }
  // An old cup mark, with gaps, mostly visible to the right of the phone.
  for(const [a,b] of [[.15,.87],[1.02,1.6],[2.1,3.0],[3.7,5.15]]) {
    c.beginPath();c.ellipse(914,699,112,111,0,a,b);c.strokeStyle="rgba(28,35,27,.13)";c.lineWidth=3;c.stroke();
  }
  c.restore();
  inkLine(c,[[53,77],[53,1910]],89650,9,"rgba(13,47,43,.45)",.3);
  inkLine(c,[[59,78],[59,1907]],89651,3,"rgba(138,188,167,.45)",.2);
  inkLine(c,[[61,66],[1110,66]],89652,3,"rgba(201,214,172,.26)",.2);
  inkLine(c,[[62,1913],[1110,1913]],89653,6,"rgba(8,31,29,.36)",.2);
  inkLine(c,[[64,1908],[1110,1908]],89654,1.8,"rgba(178,204,181,.23)",.2);
}

function logBook(c:Ctx,o:DetailedDeskOptions) {
  c.save();c.translate(185,509);c.rotate(-.15);
  // Soft shadow falls away from the upper-right window, with a crisp contact edge.
  for(let j=5;j>=0;j--) {
    rbox(c,-218-j*2,-251+j,424+j*4,514+j*2,6,89700,.2);
    paint(c,"rgba(7,18,20,.038)",null);
  }
  poly(c,[[-213,-253],[210,-250],[211,263],[-211,270]],89702,.6);paint(c,"#37473f","#192925",3);
  for(let j=4;j>=0;j--) {
    const d=j*2;
    poly(c,[[-206,-249+d],[205,-247+d],[207,249+d],[-207,257+d]],89704+j,.35);
    paint(c,j%2?"#ada58c":"#c1b69b","#7a7763",.9);
  }
  poly(c,[[-207,-254],[-111,-260],[-1,-248],[-1,252],[-99,243],[-207,252]],89711,.5);
  paint(c,vgrad(c,-254,255,[[0,"#ddd1b6"],[.4,"#d4c7aa"],[1,"#b9b39c"]]),"#4d5246",1.3);
  poly(c,[[0,-248],[110,-261],[208,-252],[210,250],[113,244],[0,252]],89712,.5);
  paint(c,vgrad(c,-255,255,[[0,"#e5d9bc"],[.55,"#ccc2a6"],[1,"#b9b29b"]]),"#4d5246",1.2);
  const fold=c.createLinearGradient(-31,0,35,0);
  fold.addColorStop(0,"rgba(54,51,36,0)");fold.addColorStop(.5,"rgba(45,45,33,.26)");fold.addColorStop(.59,"rgba(245,233,196,.15)");fold.addColorStop(1,"rgba(54,51,36,0)");
  c.fillStyle=fold;c.fillRect(-31,-249,66,500);
  inkLine(c,[[0,-245],[-3,-1],[1,250]],89714,1.2,"rgba(48,57,44,.5)",.2);
  text(c,o.logTitle??"值班记录",-110,-214,{size:31,font:F.ui,weight:700,fill:"#3c453d"});
  text(c,"巡 查 记 录",107,-214,{size:19,font:F.pen,fill:"#5d675b"});
  text(c,"夜 班",-105,-174,{size:16,font:F.pen,fill:"#657366"});
  for(let i=0;i<8;i++) {
    const y=-130+i*44;
    inkLine(c,[[-185,y],[-103,y-2],[-25,y+1]],89720+i,1,"rgba(91,121,116,.37)",.2);
    inkLine(c,[[25,y+1],[108,y-2],[188,y]],89730+i,1,"rgba(91,121,116,.32)",.2);
  }
  const entries=logEntries(o);
  entries.forEach((entry,i)=>{
    // the last entry, still being written: clipped to where the pen has got to
    const write=i===entries.length-1&&o.logWrite!==undefined&&o.logWrite<1;
    if(write){
      const [,from,to]=logSpan(c,entry);
      c.save();c.beginPath();c.rect(-210,-176+i*44,from+(to-from)*Math.max(0,o.logWrite!)+210,60);c.clip();
    }
    text(c,entry,-108,-146+i*44,{size:21,font:F.pen,fill:"#435d74"});
    if(write)c.restore();
  });
  text(c,"08",-108,226,{size:13,font:F.pen,fill:"#687164"});
  text(c,"09",108,226,{size:13,font:F.pen,fill:"#687164"});
  poly(c,[[-207,227],[-182,253],[-207,253]],89745,.2);paint(c,"#e6dbc0","#8c927a",1);
  c.restore();
}

const LOG=["22:00 巡逻一次","23:30 正常","00:40 正常","01:50 下雪","02:40"];
const logEntries=(o:DetailedDeskOptions)=>(o.log??LOG).slice(0,8);
/** An entry's left edge, where its words start (after the time and a space) and its right edge, in book units. */
function logSpan(c:Ctx,entry:string):[number,number,number] {
  const w=measure(c,entry,21,F.pen),left=-108-w/2,sp=entry.indexOf(" ");
  return [left,sp<0?left:left+measure(c,entry.slice(0,sp+1),21,F.pen),left+w];
}
/** Where the pen's tip is while the last log entry is written (o.logWrite), in desk coordinates: it bobs up and
 *  down a little inside each character, the way a hand writes. */
export function logPen(c:Ctx,o:DetailedDeskOptions):Pt {
  const entries=logEntries(o),i=entries.length-1,entry=entries[i]??"";
  const [,from,to]=logSpan(c,entry);
  const k=Math.max(0,Math.min(1,o.logWrite??1));
  const n=Math.max(1,Array.from(entry.slice(entry.indexOf(" ")+1)).length);
  const x=from+(to-from)*k,y=-140+i*44-7*Math.abs(Math.sin(k*n*Math.PI*1.5));
  // the book lies at (185, 509), turned -0.15
  const ca=Math.cos(-.15),sa=Math.sin(-.15);
  return [185+x*ca-y*sa,509+x*sa+y*ca];
}

/** The pen in its own units: the cap end at y -114, the nib's tip at (-2, 120). */
function penBody(c:Ctx) {
  rbox(c,-9,-113,15,202,5,89801,.2);paint(c,"#1d3546","#13242c",2);
  inkLine(c,[[-5,-108],[-5,79]],89802,2,"#7e9697",.1);
  rbox(c,-12,-114,22,71,5,89803,.2);paint(c,"#334d58","#142932",1.7);
  inkLine(c,[[7,-105],[10,-59],[6,-49]],89804,3,"#bec4b5",.1);
  inkLine(c,[[-11,-41],[9,-41]],89805,3,"#aaa992",.1);
  poly(c,[[-8,87],[6,87],[-1,116]],89806,.1);paint(c,"#b8b6a3","#273c40",1.2);
  inkLine(c,[[-1,110],[-2,120]],89807,2,"#122b3a",.1);
}
function pen(c:Ctx) {
  c.save();c.translate(163,955);c.rotate(.13);
  rbox(c,-14,-108,20,223,7,89800,.2);paint(c,"rgba(12,23,27,.32)",null);
  penBody(c);
  c.restore();
}
/** The desk's pen in his hand (deskTop with pen: false): the nib's tip at `tip`, the cap end pointing along `ang`
 *  (radians), in desk units. */
export function heldPen(c:Ctx,tip:Pt,ang:number) {
  const t=Math.PI/2+ang,ct=Math.cos(t),st=Math.sin(t);
  c.save();
  c.translate(tip[0]+2*ct+120*st,tip[1]+2*st-120*ct);
  c.rotate(t);
  penBody(c);
  c.restore();
}

function cup(c:Ctx,abs:number,moonLeft=false) {
  const x=956,y=554;
  c.save();c.translate(x,y);
  // Mug height gives it a longer, softer shadow than the book or the keys (away from the window's light).
  const sx=moonLeft?-1:1;
  for(let j=6;j>=0;j--) {
    oval(c,sx*(-22-j*3),34+j*3,110+j*4,112+j*3,89900,.3);
    paint(c,"rgba(9,21,22,.026)",null);
  }
  oval(c,0,6,127,126,89901,.45);paint(c,"#5c5140","#383b30",2);
  oval(c,0,6,120,119,89902,.35);paint(c,"#78674c",null);
  for(let j=0;j<50;j++) {
    const a=hash(j*8.5)*6.28,r=107+hash(j*4.3)*11;
    inkLine(c,[[Math.cos(a)*r,6+Math.sin(a)*r],[Math.cos(a)*(r+4),6+Math.sin(a)*(r+4)]],89905+j,.9,"rgba(202,164,113,.16)",.1);
  }
  // Red enamel handle with a real hollow, preserving the glass beneath.
  c.save();c.translate(119,2);c.rotate(-.08);
  rbox(c,-11,-43,57,86,24,89960,.5);paint(c,null,"#293432",15);
  rbox(c,-11,-45,57,86,24,89961,.4);paint(c,null,"#a3543c",10);
  inkLine(c,[[30,-37],[42,-20],[41,16]],89962,2.5,"#d6b99a",.3);c.restore();
  oval(c,-1,4,113,114,89963,.55);paint(c,"#746b56","#1b2b2d",3.5);
  oval(c,0,0,114,112,89964,.5);paint(c,vgrad(c,-112,112,[[0,"#e1d6bb"],[.6,"#c6c6ad"],[1,"#9eab9d"]]),"#273732",2.5);
  oval(c,0,0,101,99,89965,.4);paint(c,"#a04632","#cfad86",1.4);
  oval(c,0,0,94,92,89966,.35);paint(c,"#6b5940","#e0cdb0",3);
  c.save();oval(c,0,0,89,87,89967,.2);c.clip();
  const tea=c.createRadialGradient(39,-44,7,-9,7,118);
  tea.addColorStop(0,"#c19853");tea.addColorStop(.5,"#8d7139");tea.addColorStop(1,"#353e2d");
  c.fillStyle=tea;c.fillRect(-100,-100,200,200);
  // The meniscus, submerged leaves, and a small reflected window.
  c.beginPath();c.arc(-1,0,84,.6,3.4);c.lineWidth=3;c.strokeStyle="rgba(224,194,126,.3)";c.stroke();
  for(let j=0;j<7;j++) {
    const lx=-29+hash(j*3.8)*53,ly=7+hash(j*9.3)*38,a=hash(j+8)*4;
    oval(c,lx,ly,10+hash(j)*5,3,89970+j,.2,a);paint(c,j%2?"#4d5b2a":"#606c35",null);
    inkLine(c,[[lx-2,ly-2],[lx+5,ly+2]],89980+j,.65,"rgba(149,157,72,.38)",.1);
  }
  poly(c,[[22,-66],[49,-76],[55,-51],[28,-45]],89990,.15);paint(c,"rgba(252,223,163,.32)",null);
  inkLine(c,[[13,-62],[16,-47]],89991,2,"rgba(255,233,180,.22)",.1);
  c.restore();
  c.beginPath();c.arc(0,0,107,3.55,5.72);c.lineWidth=3;c.strokeStyle="rgba(255,235,198,.65)";c.stroke();
  // A few chips in the red rim; wear has a dark core and a pale edge.
  for(const a of [.62,2.4,4.8]) {
    const px=Math.cos(a)*103,py=Math.sin(a)*101;
    oval(c,px,py,4,2,90000+a,.2,a);paint(c,"#4a5349","#d0c5a7",.7);
  }
  // Soft steam, drifting in absolute time, kept thin enough to reveal the tea.
  for(let j=0;j<3;j++) {
    const u=(abs*.14+j*.32)%1,dx=Math.sin(abs*.8+j)*7;
    c.save();c.globalAlpha=.075*Math.sin(u*Math.PI);
    inkLine(c,[[15+j*13,-42-u*17],[5+j*16+dx,-74-u*35],[25+j*8-dx,-108-u*55],[12+j*10+dx,-142-u*63]],90010+j,6,"#d9e0d2",.3);
    c.restore();
  }
  c.restore();
}

function keys(c:Ctx) {
  c.save();c.translate(956,1038);c.rotate(-.13);
  const key=(a:number,len:number,gold:boolean,seed:number)=>{
    c.save();c.rotate(a);
    const outline:Pt[]=[[-12,29],[12,29],[12,45],[6,49],[6,len-26],[16,len-26],[16,len-15],[9,len-15],[9,len-5],[-7,len-5],[-7,49],[-12,45]];
    c.save();c.translate(-5,7);poly(c,outline,seed,.25);paint(c,"rgba(9,22,25,.35)",null);c.restore();
    poly(c,outline,seed,.25);paint(c,gold?"#a39563":"#8eaaa9","#334847",1.8);
    oval(c,0,32,8,10,seed+1,.2);paint(c,null,gold?"#d3c38a":"#c4d2c7",2);
    inkLine(c,[[-3,51],[-3,len-12]],seed+2,1.5,gold?"#d4c183":"#d1dacb",.1);
    inkLine(c,[[3,55],[3,len-35]],seed+3,.8,"#4e645c",.1);
    c.restore();
  };
  // A worn leather tag lies under the ring and the three toothed keys.
  c.save();c.translate(-28,57);c.rotate(.4);
  rbox(c,-17,-26,34,72,10,90100,.4);paint(c,"#425d62","#243d41",2);
  inkLine(c,[[-12,-14],[-12,33],[11,33],[11,-14]],90101,1,"rgba(189,198,178,.34)",.2);
  text(c,"01",0,12,{size:18,font:F.pen,fill:"#c0c9ac"});
  oval(c,0,-18,4,4,90102,.1);paint(c,"#172f33","#b7be9e",1);
  c.restore();
  key(-.5,136,true,90110);key(.04,147,false,90120);key(.56,122,true,90130);
  oval(c,-3,5,29,30,90141,.2);paint(c,null,"rgba(9,25,29,.36)",5);
  oval(c,0,0,29,30,90142,.3);paint(c,null,"#344f53",6);
  oval(c,1,-1,28,29,90143,.3);paint(c,null,"#a3b9b2",3);
  c.beginPath();c.ellipse(1,-1,28,29,0,3.1,5.5);c.strokeStyle="#e2dabe";c.lineWidth=1.8;c.stroke();
  c.restore();
}

function phoneContact(c:Ctx,lit:number,resting:boolean,warm=false) {
  if(lit>0) {
    c.save();c.globalCompositeOperation="screen";
    // The vertical phone edge spills a small amount onto the glass, never a large blue wash (warm: her photo's light).
    c.save();c.translate(540,897);c.rotate(.06);c.scale(1,1.8);
    glow(c,0,0,362,warm?"rgba(255,186,120,.16)":"rgba(136,173,196,.085)",lit);c.restore();
    glow(c,225,943,194,warm?"rgba(255,190,130,.14)":"rgba(143,176,193,.10)",lit);
    glow(c,846,994,176,warm?"rgba(255,190,130,.12)":"rgba(157,184,192,.09)",lit);
    c.restore();
  }
  if(resting) {
    c.save();c.translate(540,880);c.rotate(.06);c.scale(.92,.92);
    for(let i=7;i>=0;i--) {
      rbox(c,-329-i*2.4,-667+i,652+i*4.8,1332+i*2,90+i*2,90200,.35);
      paint(c,"rgba(5,15,20,.032)",null);
    }
    rbox(c,-329,-661,652,1332,92,90201,.3);paint(c,"rgba(5,13,17,.31)",null);
    c.restore();
  }
}

/** The lonely desk (用户：周围全是冷色，只有女儿的照片是暖色；物品摆放、光影、月光；桌面也很乱): the same desk in the
 *  cold blue of the lonely booth with only a few things on it — her oldest photo under the glass at the lower left
 *  with the birthday note tucked against it, the tea mug at the upper right, the phone in the middle, wide empty
 *  glass around it. The moon from the window on the left lays two pale panes of light across it with the window
 *  bar's shadow between them. Her photo under the glass and the light off her photo on the phone are the only warm
 *  things. */
const L_PHOTO:[number,number,number]=[178,1598,-.12],L_NOTE:[number,number,number]=[330,1762,.05];
function lonelyDeskTop(c:Ctx,abs:number,o:DetailedDeskOptions) {
  wood(c,true);
  if(o.photos??true)oldPhoto(c,L_PHOTO[0],L_PHOTO[1],L_PHOTO[2],1.18,0);
  note(c,o,L_NOTE[0],L_NOTE[1],L_NOTE[2]);
  glass(c);
  cup(c,abs,true);
  c.save();
  c.globalCompositeOperation="multiply";
  c.fillStyle="rgb(150,166,206)";c.fillRect(-60,-60,W+120,H+120);
  c.globalCompositeOperation="color";
  c.globalAlpha=.3;c.fillStyle="#32466e";c.fillRect(-60,-60,W+120,H+120);
  c.restore();
  // her photo keeps its warmth, and so does the light off her photo on the phone
  if(o.photos??true){c.save();c.globalAlpha=.82;oldPhoto(c,L_PHOTO[0],L_PHOTO[1],L_PHOTO[2],1.18,0);c.restore();}
  phoneContact(c,Math.max(0,Math.min(1,o.phoneLight??0)),o.phoneResting??false,true);
  // two panes of moonlight from the upper left, the window bar's shadow between them
  lightShaft(c,[[383,-80],[200,-80],[911,1890],[1204,1740]],251,-80,955,1840,"170,195,245",.22,20,"desk_moon_left");
  lightShaft(c,[[138,-80],[-140,-80],[289,1900],[771,1900]],35,-80,563,1900,"170,195,245",.27,24,"desk_moon_right");
  c.save();
  c.globalCompositeOperation="screen";
  // the edge that faces the moon
  c.beginPath();c.arc(956,554,108,3.25,4.75);c.lineWidth=4;c.strokeStyle="rgba(205,222,255,.55)";c.stroke();
  c.restore();
  const v=c.createRadialGradient(584,825,290,540,925,1210);
  v.addColorStop(0,"rgba(4,8,18,0)");v.addColorStop(.66,"rgba(4,8,18,.08)");v.addColorStop(1,"rgba(4,8,18,.42)");
  c.fillStyle=v;c.fillRect(-60,-60,1200,2040);
}

export function detailedDeskTop(c:Ctx,abs:number,o:DetailedDeskOptions={}) {
  if(o.lonely){lonelyDeskTop(c,abs,o);return;}
  wood(c);
  keepsakes(c,o);
  glass(c);
  // Two panes of the same warm window, separated by a soft mullion shadow.
  // The shallow glow crosses the glass and keepsakes; raised objects are drawn over it.
  lightShaft(c,[[697,-80],[880,-80],[169,1890],[-124,1740]],829,-80,125,1840,"253,195,119",.105,20,"desk_window_left");
  lightShaft(c,[[942,-80],[1220,-80],[791,1900],[309,1900]],1045,-80,517,1900,"253,195,119",.135,24,"desk_window_right");
  logBook(c,o);
  if(o.pen??true)pen(c);
  cup(c,abs);
  keys(c);
  phoneContact(c,Math.max(0,Math.min(1,o.phoneLight??0)),o.phoneResting??false);
  // Quiet dark corners, while the note and all three photographs remain readable.
  const v=c.createRadialGradient(584,825,290,540,925,1210);
  v.addColorStop(0,"rgba(8,22,28,0)");v.addColorStop(.66,"rgba(8,22,28,.035)");v.addColorStop(1,"rgba(7,23,28,.31)");
  c.fillStyle=v;c.fillRect(-60,-60,1200,2040);
}
