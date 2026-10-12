import type { SceneOptions } from "@frame/engine/types";
import { phase, smooth, clamp } from "@frame/engine/math";
import {
  Ctx, F, designScene, text, fillBg, vgrad, glow, camera, handheld,
  filtered, inkLine, rbox, oval, paint, figureMask, onFigure, rimLight, bloom
} from "@materials/s0rrow/code/draw";
import { drawKid, type KidPose } from "@materials/s0rrow/code/kid";
import { bedroom, fairyGlow, street } from "@materials/s0rrow/code/sets";
import { phone, phoneBack } from "@materials/s0rrow/code/phone";
import { momentsScreen, chatScreen2 } from "@materials/s0rrow/code/chat";
import {
  cafeBack, cafeFront, cafeChair, drapedCoat, cafeTable, starPatch
} from "@materials/s0rrow/code/cafe";
import { at, END } from "./timeline";

const ease=(t:number,a:number,b:number)=>smooth(phase(t,a,b));
const mix=(a:number,b:number,k:number)=>a+(b-a)*k;

function litKid(c:Ctx,x:number,y:number,s:number,p:KidPose,warm=false) {
  const draw=(g:Ctx)=>drawKid(g,x,y,s,p);
  draw(c);
  const m=figureMask(c,draw,"actor");
  onFigure(c,m,g=>{
    const grad=g.createLinearGradient(x-180*s,y,x+200*s,y+240*s);
    grad.addColorStop(0,warm?"rgba(255,190,104,.30)":"rgba(108,167,228,.24)");
    grad.addColorStop(.5,"rgba(19,28,44,.04)");
    grad.addColorStop(1,"rgba(8,19,35,.40)");
    g.fillStyle=grad;g.fillRect(x-500*s,y-300*s,1000*s,1300*s);
  });
  rimLight(c,m,warm?1:-1,-.4,4*s,warm?"#ffe0a3":"#add4ef",.2,"screen",6);
}

function bedroomBlur(c:Ctx,t:number) {
  filtered(c,"blur(9px)",g=>{bedroom(g,t,1,0);fairyGlow(g,t);},"home");
  c.fillStyle="rgba(8,15,29,.32)";c.fillRect(0,0,1080,1920);
  glow(c,135,680,410,"rgba(255,177,88,.13)");
  glow(c,915,850,420,"rgba(90,156,224,.16)");
}
function tag(c:Ctx,s:string,sub="") {
  text(c,s,90,161,{size:35,font:F.ui,fill:"#e6dcc6",align:"left",shadow:7});
  if(sub)text(c,sub,90,210,{size:22,font:F.en,fill:"#aaa99f",align:"left"});
}
function bottomShade(c:Ctx) {
  const g=c.createLinearGradient(0,1150,0,1775);
  g.addColorStop(0,"rgba(8,16,25,0)");g.addColorStop(.4,"rgba(8,16,25,.66)");g.addColorStop(1,"rgba(8,16,25,.88)");
  c.fillStyle=g;c.fillRect(0,1150,1080,770);
}
function hook(c:Ctx,t:number) {
  if(t>=at(12))return;
  c.save();c.globalAlpha=1-ease(t,at(11),at(12));
  const g=c.createLinearGradient(0,75,0,350);g.addColorStop(0,"rgba(9,15,26,.92)");g.addColorStop(1,"rgba(9,15,26,0)");
  c.fillStyle=g;c.fillRect(0,0,1080,375);
  text(c,"她的新男友，",540,169,{size:82,font:F.cn,fill:"#fff4d7",stroke:"#111c2b",lw:11});
  text(c,"穿着我的外套。",540,269,{size:86,font:F.cn,fill:"#ffd16e",stroke:"#111c2b",lw:11});
  inkLine(c,[[264,323],[538,327],[826,314]],8820,4,"#d9a45d",.8);
  c.restore();
}

interface Tableau {
  happy?:boolean; boy?:boolean; boyY?:number; coat?:boolean;
  gaze?:number; phone?:boolean; dropPhones?:number; push?:number;
}
function tableau(c:Ctx,t:number,o:Tableau={}) {
  cafeBack(c,t);
  cafeChair(c,350,918,.84);
  cafeChair(c,755,918,.84);
  if(o.coat!==false&&!o.boy)drapedCoat(c,755,741,.93);
  const happy=!!o.happy;
  const phoneHeld=o.phone??false;
  litKid(c,346,631,.91,{
    who:"girl",outfit:"cardigan",body:"full",legs:"sit",
    eyes:happy?"open":"sad",mouth:happy?"smile":"flat",look:[o.gaze??.35,.12],
    turn:.15,tilt:happy?.018:-.028,seed:75,
    arms:phoneHeld?"phone":"custom",
    handL:phoneHeld?undefined:[-93,354],handR:phoneHeld?undefined:[141,360],
    grip:phoneHeld?(g)=>phoneBack(g,5,286,77,132,-.035):undefined,
  },true);
  if(o.boy)litKid(c,750,o.boyY??648,.91,{
    outfit:"hoodie",body:"full",legs:"sit",arms:"custom",handL:[-94,365],handR:[109,360],
    eyes:"open",mouth:"smile",look:[-.65,.05],turn:-.23,seed:11,
    holding:g=>starPatch(g,-70,300,.8),
  },true);
  cafeTable(c,t,true,false,o.push??0);
  if(o.dropPhones!==undefined&&o.dropPhones>0){
    const p=o.dropPhones;
    c.save();c.translate(mix(410,450,p),mix(978,1152,p));c.scale(1,mix(1,.46,p));
    phoneBack(c,0,0,66,125,mix(-.15,.78,p));c.restore();
    c.save();c.translate(mix(712,633,p),mix(991,1165,p));c.scale(1,mix(1,.46,p));
    phoneBack(c,0,0,66,125,mix(.15,-.62,p));c.restore();
  }
}

/** Exact crop of the same world used by the reveal: the crop excludes both necklines. */
function postedPhoto(c:Ctx,t:number,x:number,y:number,w:number,h:number) {
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  c.translate(x,y);c.scale(w/800,h/800);c.translate(-140,-837);
  tableau(c,t,{happy:true,phone:false});
  c.restore();
}
function postPhone(c:Ctx,t:number,location=false) {
  const drift=Math.sin(t*.8)*.005;
  phone(c,520,458,1.6,-.016+drift,g=>{
    momentsScreen(g,t,{
      dark:true,author:"林夏",caption:"今天，有人陪。",
      location:"转角咖啡 · 刚刚",
      photo:(h,x,y,w,z)=>postedPhoto(h,t,x,y,w,z),
    });
    // Tight framing starts at the single post; the cover image is outside this shot.
  });
  if(location){
    const k=ease(t,at(12)+.28,at(13));
    c.save();c.globalAlpha=k;
    inkLine(c,[[216,1146],[526,1153],[845,1141]],8861,5,"#ffd27a");
    c.restore();
  }
}
function opening(c:Ctx,t:number) {
  bedroomBlur(c,t);
  const u=ease(t,0,at(2));
  c.save();camera(c,540,800,mix(.91,1,u),mix(-.015,0,u));
  postPhone(c,t);c.restore();
}
function patchShot(c:Ctx,t:number) {
  bedroomBlur(c,t);
  c.save();rbox(c,98,390,884,740,30,8871,.6);c.clip();
  const z=mix(2.85,3.1,ease(t,at(4),at(8)));
  c.translate(530,759);c.scale(z,z);c.translate(-692,-949);
  tableau(c,t,{happy:true});
  c.restore();
  // The little hand-sewn star is the visual clue; no new object is substituted.
  text(c,"那颗补丁，他认得。",540,1154,{size:42,font:F.cn,fill:"#eacb97",shadow:7});
}
function reaction(c:Ctx,t:number) {
  bedroomBlur(c,t);
  const k=ease(t,at(8),at(12));
  litKid(c,546,710,1.74+k*.09,{
    outfit:"rider",body:"bust",eyes:"wide",mouth:"flat",brows:"worried",look:[0,.7],
    arms:"phone",grip:g=>phoneBack(g,4,281,81,142,-.04),tilt:-.035,
  });
  glow(c,560,1040,250,"rgba(147,197,236,.07)");
}
function locationShot(c:Ctx,t:number){
  bedroomBlur(c,t);
  c.save();camera(c,540,950,1.04,0,0,-70);postPhone(c,t,true);c.restore();
  tag(c,"刚刚","A FAMILIAR PLACE");
}
function messageShot(c:Ctx,t:number){
  bedroomBlur(c,t);
  const send=at(20);
  phone(c,540,657,1.16,-.025,g=>chatScreen2(g,t,{
    title:"林夏",time:"20:17",me:"boy",them:"girl",dark:true,big:true,keyboard:true,
    draft:t<send?"外套，我来拿。":"",
    items:t>=send?[{t:"msg",me:true,text:"外套，我来拿。",pop:ease(t,send,send+.22)}]:[],
    caret:t<send,
  }));
  tag(c,"他只想取回外套。","20:17");
}
function streetShot(c:Ctx,t:number){
  const local=t-at(24);
  street(c,t,local*250);
  c.fillStyle="rgba(11,26,42,.15)";c.fillRect(0,0,1080,1920);
  litKid(c,570+Math.sin(local*.7)*25,837+Math.abs(Math.sin(local*6))*8,.99,{
    outfit:"rider",body:"full",eyes:"sad",brows:"worried",mouth:"flat",
    legs:"walk",arms:"swing",walk:local*8,turn:.27,look:[.8,0],wet:.1,
  });
  // Wet pavement keeps the amber street lights in the frame.
  glow(c,809,1070,330,"rgba(240,179,97,.05)");
  tag(c,"转角，还亮着灯。","20:21");
}
function arrival(c:Ctx,t:number){
  cafeFront(c,t,0);
  const k=ease(t,at(32),at(39));
  litKid(c,mix(155,345,k),868,.84,{
    outfit:"rider",body:"full",view:"back",legs:k<.98?"walk":"stand",
    walk:(t-at(32))*7,arms:"down",seed:11,
  });
  // A warm window gives a partial glimpse without showing the opposite seat.
  c.save();c.beginPath();c.rect(137,510,510,780);c.clip();
  c.translate(-58,194);c.scale(.63,.63);
  tableau(c,t,{phone:true,coat:true});
  c.fillStyle="rgba(104,155,182,.13)";c.fillRect(200,420,850,1380);
  c.restore();
  inkLine(c,[[477,499],[477,1299]],8880,34,"#142c35",.3);
  tag(c,"那张照片里的店。","20:22");
}
function glass(c:Ctx,t:number,reveal:boolean) {
  const p=reveal?ease(t,at(48),at(56)):0;
  c.save();
  const z=mix(1.28,1,p);
  camera(c,470,765,z,0,mix(115,0,p),mix(12,0,p));
  tableau(c,t,{phone:true,coat:true});
  c.restore();
  c.fillStyle="rgba(32,70,91,.12)";c.fillRect(0,0,1080,1920);
  // The observer and the real window frame move out of the way, exposing the empty neck.
  const x=mix(730,1230,p);
  c.fillStyle="#152b35";c.fillRect(x,0,83,1920);
  c.fillStyle="rgba(154,189,195,.2)";c.fillRect(x+7,0,5,1920);
  if(p<.94) {
    c.save();c.globalAlpha=1-p;
    litKid(c,1070+p*220,940,1.72,{outfit:"rider",body:"full",view:"back",arms:"down"});
    c.restore();
  }
  c.save();c.globalAlpha=(1-p)*.14;
  inkLine(c,[[40,474],[556,996]],8891,54,"#a6c4c4",0);
  inkLine(c,[[50,103],[450,503]],8892,14,"#c8e1d3",0);c.restore();
}
function emptyShot(c:Ctx,t:number) {
  const u=ease(t,at(56),at(64));
  c.save();camera(c,630,850,1+u*.035,0);
  tableau(c,t,{phone:false,coat:true});
  c.restore();
  // The cup opposite her has no steam, unlike her own.
}
function herPhone(c:Ctx,t:number) {
  filtered(c,"blur(8px)",g=>cafeBack(g,t),"cafeBlur");
  phone(c,540,671,1.23,.019,g=>{
    momentsScreen(g,t,{
      dark:true,caption:"今天，有人陪。",location:"转角咖啡 · 刚刚",
      photo:(h,x,y,w,z)=>postedPhoto(h,t,x,y,w,z)
    });
    rbox(g,36,987,528,175,22,8901,.5);paint(g,"#283b3d","#516764",2);
    text(g,"谁可以看",73,1029,{size:26,font:F.ui,fill:"#b5c6c1",align:"left"});
    text(g,"仅他可见",300,1094,{size:46,font:F.cn,fill:"#ffdda0"});
    inkLine(g,[[490,1084],[503,1096],[532,1066]],8912,5,"#94c0a5",.1);
  });
  tag(c,"她的手机","THE OTHER SIDE");
}
function enterShot(c:Ctx,t:number){
  filtered(c,"blur(6px)",g=>cafeBack(g,t),"herClose");
  const surprise=t>=at(73);
  litKid(c,520,661,1.63,{
    who:"girl",outfit:"cardigan",eyes:surprise?"wide":"sad",mouth:surprise?"o":"flat",
    look:[surprise?.85:0,.05],turn:surprise?.22:0,arms:"down",body:"bust",seed:75
  },true);
  glow(c,1039,877,690,"rgba(255,202,122,.16)",ease(t,at(72),at(73)));
}
function takeShot(c:Ctx,t:number) {
  const p=ease(t,at(76)+.12,at(79));
  c.save();camera(c,676,866,1.17);
  cafeBack(c,t);cafeChair(c,350,918,.84);cafeChair(c,755,918,.84);
  litKid(c,346,631,.91,{who:"girl",outfit:"cardigan",body:"full",legs:"sit",arms:"down",eyes:"sad",mouth:"flat",look:[.8,.1],turn:.2,seed:75},true);
  litKid(c,922,535,1.12,{
    outfit:"rider",body:"full",eyes:"open",mouth:"flat",look:[-.7,.3],turn:-.2,
    arms:"custom",handL:[-147,184-p*160],elbowL:[-170,206-p*80],shapeL:"hold",handR:[117,357],seed:11,
  },true);
  drapedCoat(c,755,741,.93,p*178);
  cafeTable(c,t);
  c.restore();
}
function choiceShot(c:Ctx,t:number) {
  filtered(c,"blur(6px)",g=>cafeBack(g,t),"hisClose");
  const k=ease(t,at(81),at(83));
  litKid(c,560,648,1.65,{
    outfit:"hoodie",body:"bust",eyes:"open",mouth:k>.4?"smile":"flat",look:[-.8,.1],turn:-.2,
    arms:"custom",handL:[-133,351],handR:[121,346],seed:11,
    holding:g=>starPatch(g,-70,300,.8),
  },true);
}
function sitShot(c:Ctx,t:number){
  const p=ease(t,at(84),at(87));
  c.save();camera(c,540,850,1.02);
  tableau(c,t,{happy:p>.35,boy:true,boyY:mix(561,648,p),coat:false,push:0});
  c.restore();
}
function ending(c:Ctx,t:number){
  const p=ease(t,at(89),at(91));
  const z=1+ease(t,at(88),END)*.025;
  c.save();camera(c,546,871,z);
  tableau(c,t,{happy:true,boy:true,coat:false,dropPhones:p,push:p});
  c.restore();
}

function draw(c:Ctx,t:number) {
  const cuts=[at(4),at(8),at(12),at(16),at(24),at(32),at(40),at(48),at(56),at(64),at(72),at(76),at(80),at(84),at(88)];
  if(t<cuts[0])opening(c,t);
  else if(t<cuts[1])patchShot(c,t);
  else if(t<cuts[2])reaction(c,t);
  else if(t<cuts[3])locationShot(c,t);
  else if(t<cuts[4])messageShot(c,t);
  else if(t<cuts[5])streetShot(c,t);
  else if(t<cuts[6])arrival(c,t);
  else if(t<cuts[7])glass(c,t,false);
  else if(t<cuts[8])glass(c,t,true);
  else if(t<cuts[9])emptyShot(c,t);
  else if(t<cuts[10])herPhone(c,t);
  else if(t<cuts[11])enterShot(c,t);
  else if(t<cuts[12])takeShot(c,t);
  else if(t<cuts[13])choiceShot(c,t);
  else if(t<cuts[14])sitShot(c,t);
  else ending(c,t);
  bloom(c,.10,22,2.6);
  bottomShade(c);
  hook(c,t);
  if(t>=at(56)&&t<at(64)){
    // Give the visual answer room. A short title only, below the scene.
    text(c,"空着的位置",540,165,{size:53,font:F.pen,fill:"#f7d5a1",shadow:8});
  }
  if(t>=at(91)){
    const p=ease(t,at(91),at(92));
    text(c,"你会坐下，还是拿走外套？",540,1568,{size:39,font:F.cn,fill:"#dfceae",alpha:p,shadow:5});
    text(c,"回看开头：照片里从没有第二个人。",540,1635,{size:27,font:F.ui,fill:"#9da8a7",alpha:p});
  }
  text(c,"STALK UR SOCIALS",540,1767,{size:25,font:F.en,fill:"rgba(214,208,190,.44)"});
  text(c,"s0rrow",540,1811,{size:20,font:F.en,fill:"rgba(214,208,190,.37)"});
}
export function createScene(options:SceneOptions) {
  return designScene(options,0,(c,t)=>draw(c,t));
}

