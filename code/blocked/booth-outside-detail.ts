/** Snow-night exterior refinement. Window coordinates remain 430..750 × 830..1080.
 * The original factory gate is reused, then dressed; an interior background is reused from the reverse angle.
 * The shot supplies its actor, keeping story timing out of the material.
 */
import { Ctx, F, H, Pt, W, blob, fillBg, filtered, glow, groundShadow, hash, inkLine, lightShaft, oval, paint, poly, rbox, text, vgrad } from "../draw";
import { snow } from "./snow";
import { detailedBoothFront } from "./booth-front-detail";
export interface OutsideDetailOptions { sign?:string; name?:string; led?:string; }
export interface OutsideProps { gate:(c:Ctx,t:number,ox:number,o:{name?:string;led?:string})=>void; }

function pool(c:Ctx,x:number,y:number,rx:number,ry:number,rgb:string,a:number) {
  c.save();c.translate(x,y);c.scale(rx,ry);
  const g=c.createRadialGradient(0,0,0,0,0,1);
  g.addColorStop(0,"rgba("+rgb+","+a+")");g.addColorStop(.46,"rgba("+rgb+","+(a*.55)+")");g.addColorStop(1,"rgba("+rgb+",0)");
  c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
}
function gateFittings(c:Ctx,t:number) {
  c.save();c.translate(60,0);
  // Roof edges, vents and a few window bars locate the small booth in a much larger sleeping factory.
  for(const [x,y,w] of [[-230,600,480],[250,680,350],[626,562,530]] as [number,number,number][]){
    inkLine(c,[[x,y],[x+w,y-1]],94001+x,2.5,"#394958",.3);
    for(let k=0;k<Math.floor(w/78);k++){
      const xx=x+19+k*78;
      inkLine(c,[[xx,y+9],[xx,y+322]],94003+x+k,1.1,"rgba(124,151,170,.12)",.2);
      rbox(c,xx+9,y+42,23,10,2,94011+x+k,.2);paint(c,"#1d2f3e","#344654",.6);
    }
  }
  for(let i=0;i<14;i++){
    const x=-200+i%7*70,y=660+Math.floor(i/7)*70;
    inkLine(c,[[x+18,y],[x+18,y+30]],94030+i,1.1,"#24384b",.15);
    inkLine(c,[[x-2,y+32],[x+40,y+32]],94050+i,1.7,"#52606a",.15);
  }
  // Brick pillars: mortar, alternating joints, chips, right-hand lamp-facing facets.
  for(const px of [150,830]){
    const g=c.createLinearGradient(px,0,px+112,0);
    g.addColorStop(0,"#354958");g.addColorStop(.73,px>500?"#776951":"#58616a");g.addColorStop(1,"#30434f");
    rbox(c,px,767,110,379,4,94070+px,.5);paint(c,g,"#203544",3);
    c.save();rbox(c,px,767,110,379,4,94070+px,.5);c.clip();
    for(let r=0;r<10;r++){
      const yy=779+r*38;
      inkLine(c,[[px+1,yy],[px+111,yy]],94075+px+r,1.3,"rgba(26,44,57,.8)",.2);
      inkLine(c,[[px+1,yy+2],[px+111,yy+2]],94090+px+r,.8,"rgba(160,165,152,.25)",.1);
      for(let j=0;j<3;j++){
        const xx=px+(r%2?11:35)+j*52;
        inkLine(c,[[xx,yy+3],[xx,yy+36]],94105+px+r+j,1.1,"rgba(29,46,59,.65)",.15);
      }
      for(let j=0;j<5;j++){
        const xx=px+hash(r*2.7+j)*105;
        inkLine(c,[[xx,yy+11+hash(j*4.3+r)*16],[xx+6,yy+10+hash(j*4.3+r)*16]],94130+px+r+j,.8,"rgba(168,158,130,.17)",.2);
      }
    }
    c.restore();
    poly(c,[[px-11,765],[px+34,748],[px+70,746],[px+119,765],[px+116,775],[px-6,774]],94170+px,.6);paint(c,px>500?"#bbc3ba":"#a6b8c8","#354957",2);
    inkLine(c,[[px-1,768],[px+57,754],[px+111,768]],94171+px,1.8,"rgba(228,234,225,.66)",.3);
  }
  // Snow on the sign is blue in moonlight, with an amber tip nearest the lamp.
  blob(c,[[220,702],[335,693],[516,684],[661,689],[860,702],[851,711],[228,712]],94180,.6);paint(c,"#aebfcd",null);
  inkLine(c,[[234,704],[524,689],[844,704]],94181,2,"rgba(221,230,231,.67)",.3);
  // The retractable gate has upper and lower tracks, crossed struts, rivets and wheels.
  for(let i=0;i<18;i++){
    const x=260+i*32;
    inkLine(c,[[x,1059],[x+32,1130]],94190+i,3.6,"#4e697a",.25);
    inkLine(c,[[x,1130],[x+32,1059]],94210+i,3.6,"#6f8490",.25);
    oval(c,x+16,1094,2,2,94230+i,.15);paint(c,"#bec0ad","#344e62",.6);
    if(i%3===0){oval(c,x+15,1132,5,7,94250+i,.3);paint(c,"#263d4c","#647e8d",1.2);}
  }
  inkLine(c,[[259,1059],[837,1059]],94270,4,"#a6b6bd",.3);
  inkLine(c,[[259,1134],[837,1134]],94271,4,"#314d60",.3);
  inkLine(c,[[268,1055],[817,1055]],94272,2.2,"#d0d7d3",.25);
  // A subtle outside light cone; the opaque ground is drawn next.
  lightShaft(c,[[882,499],[919,499],[1114,1144],[715,1144]],900,500,930,1160,"241,184,107",.09,18,"booth_exterior_street_beam");
  c.restore();
  void t;
}
function snowGround(c:Ctx) {
  const edge:Pt[]=[[-80,1130],[148,1133],[287,1127],[455,1138],[648,1132],[823,1126],[1140,1138],[1140,2000],[-80,2000]];
  poly(c,edge,94300,.6);paint(c,vgrad(c,1120,1980,[[0,"#899da9"],[.28,"#738ca4"],[1,"#3e5a75"]]),null);
  // Broad variations follow snowdrifts rather than a uniform white sheet.
  pool(c,77,1236,330,190,"185,205,216",.21);
  pool(c,958,1230,395,310,"238,187,122",.27);
  pool(c,181,1740,570,400,"42,70,101",.28);
  for(let i=0;i<22;i++){
    const x=-130+hash(94302+i*7.3)*1380,y=1160+hash(94303+i*4.1)*780,len=45+hash(i*3.7)*200;
    inkLine(c,[[x,y+3],[x+len*.4,y-5],[x+len,y]],94310+i,1.4,i%3?"rgba(155,182,204,.15)":"rgba(37,68,98,.16)",.35);
  }
  // Wheel ruts gradually widen towards the camera; their edges catch a little sky light.
  for(const side of [-1,1]){
    const p:Pt[]=[[430+side*40,2010],[484+side*35,1720],[551+side*28,1456],[618+side*20,1166]];
    inkLine(c,p,94340+side,10,"rgba(42,64,89,.34)",.4);
    inkLine(c,p.map(([x,y])=>[x-4,y] as Pt),94343+side,2.5,"rgba(174,194,207,.38)",.25);
    for(let i=0;i<28;i++){
      const u=i/28,y=1940-u*714,x=448+u*152+side*(39-u*18);
      inkLine(c,[[x-4,y],[x+3,y+2]],94347+i+side*50,1.4,"rgba(45,69,96,.18)",.2);
    }
  }
  // Footsteps turn towards the right-hand entrance, with pressed heels and displaced snow.
  for(let i=0;i<10;i++){
    const u=i/9,x=798-254*u+(i%2?12:-12),y=1340+u*556,s=.62+u*.67;
    c.save();c.translate(x,y);c.rotate(.32);
    oval(c,0,0,7*s,14*s,94420+i,.35);paint(c,"#4c687f",null);
    oval(c,-1,9*s,5*s,4*s,94431+i,.3);paint(c,"#395970",null);
    inkLine(c,[[-6*s,-12*s],[-10*s,0],[-5*s,14*s]],94442+i,1.3,"rgba(175,198,211,.4)",.3);
    c.restore();
  }
  // The building's cold shadow and the warm spill emerging from the low window.
  filtered(c,"blur(12px)",q=>{
    poly(q,[[390,1296],[796,1307],[665,1660],[249,1529]],94460,.5);paint(q,"rgba(22,47,71,.29)",null);
  },"booth_exterior_shadow");
  const spill=c.createLinearGradient(0,1308,0,1755);
  spill.addColorStop(0,"rgba(239,186,112,.32)");spill.addColorStop(.35,"rgba(239,185,107,.18)");spill.addColorStop(1,"rgba(237,186,110,0)");
  poly(c,[[429,1312],[746,1312],[957,1755],[225,1755]],94461,.6);paint(c,spill,null);
  // The window's cross bar makes two subdued lanes in the light on the snow.
  inkLine(c,[[676,1320],[772,1664]],94462,5,"rgba(48,64,78,.10)",.3);
  for(let i=0;i<180;i++){
    const x=hash(94470+i*1.4)*W,y=1140+hash(94471+i*3.6)*800;
    c.fillStyle=i%4?"rgba(204,218,222,.17)":"rgba(32,57,83,.17)";
    c.fillRect(x,y,.6+hash(i*2.8)*1.3,.55+hash(i*4.7));
  }
}
function boothBody(c:Ctx,sign:string) {
  // A narrow right wall and door make the cabin a real volume; front footprint stays unchanged.
  poly(c,[[800,763],[853,794],[853,1298],[799,1320]],94500,.5);paint(c,vgrad(c,765,1330,[[0,"#778477"],[1,"#455c62"]]),"#263c4c",3);
  poly(c,[[813,844],[844,858],[844,1273],[813,1287]],94501,.4);paint(c,"#3b555c","#273f4a",2.2);
  poly(c,[[817,865],[839,875],[839,1029],[817,1028]],94502,.3);paint(c,"#53675f","#213b47",1.8);
  inkLine(c,[[820,869],[820,1020]],94503,1.3,"#a8aa8d",.2);
  rbox(c,831,1061,6,28,2,94504,.3);paint(c,"#b3ae89","#2e474c",1.2);
  for(const y of [898,1189]){rbox(c,813,y,4,16,1,94505+y,.2);paint(c,"#9aa995","#314c50",.8);}
  // Step and worn concrete plinth, mostly buried in fresh snow.
  poly(c,[[383,1299],[802,1299],[814,1333],[374,1334]],94510,.5);paint(c,"#485c68","#273f50",2.5);
  poly(c,[[802,1298],[853,1280],[878,1316],[813,1335]],94511,.6);paint(c,"#7c8c87","#354d58",2);
  inkLine(c,[[816,1314],[857,1300]],94512,1.5,"#c3c5ab",.2);
  const front=c.createLinearGradient(378,0,805,0);
  front.addColorStop(0,"#7b919e");front.addColorStop(.34,"#aebbb9");front.addColorStop(.72,"#a0afa8");front.addColorStop(1,"#778d8d");
  rbox(c,380,762,420,558,6,94520,.65);paint(c,front,"#263f4e",4);
  c.save();rbox(c,380,762,420,558,6,94520,.65);c.clip();
  for(const x of [402,777]){
    c.fillStyle="rgba(30,59,71,.22)";c.fillRect(x,784,3,529);
    inkLine(c,[[x+4,787],[x+4,1308]],94521+x,1,"rgba(213,218,197,.37)",.15);
  }
  c.fillStyle="#315f78";c.fillRect(381,1113,419,42);
  inkLine(c,[[383,1112],[797,1112]],94527,2,"#708e96",.2);
  inkLine(c,[[383,1156],[797,1156]],94528,1.5,"#254b64",.2);
  for(let i=0;i<99;i++){
    const x=385+hash(94600+i*4.3)*410,y=771+hash(94601+i*5.1)*544;
    inkLine(c,[[x,y],[x+4+hash(i)*10,y+.6]],94605+i,.5,"rgba(47,78,85,.12)",.13);
  }
  for(let i=0;i<10;i++){
    const x=393+hash(i*7.2)*398;
    inkLine(c,[[x,1265+hash(i)*45],[x-3,1313]],94710+i,2+hash(i*2.6)*4,"rgba(50,74,75,.17)",.3);
  }
  // A vent and utility box give scale without adding new story clues.
  rbox(c,633,1225,105,41,3,94725,.3);paint(c,"#657f83","#3d5f6a",1.5);
  for(let i=0;i<6;i++)inkLine(c,[[641,1231+i*5],[730,1231+i*5]],94726+i,1.2,"#385966",.15);
  rbox(c,417,1195,47,72,3,94733,.3);paint(c,"#7c9798","#42656d",1.5);
  rbox(c,426,1204,29,18,2,94734,.3);paint(c,"#345865","#688886",1);
  oval(c,450,1252,2,2,94735,.1);paint(c,"#7f8e7c",null);
  inkLine(c,[[439,1267],[439,1295],[419,1295]],94736,2,"#526e71",.3);
  // Under the eave and at the foot the white panel is in real shadow.
  c.fillStyle=vgrad(c,777,849,[[0,"rgba(23,44,63,.47)"],[1,"rgba(23,44,63,0)"]]);c.fillRect(381,777,419,73);
  c.fillStyle=vgrad(c,1235,1320,[[0,"rgba(32,63,79,0)"],[1,"rgba(32,63,79,.33)"]]);c.fillRect(381,1235,419,85);
  for(const x of [390,790])for(const y of [807,1180,1299]){oval(c,x,y,2,2,94745+x+y,.1);paint(c,"#456772","#a5b6af",.7);}
  c.restore();
  text(c,sign,590,1134,{size:28,font:F.ui,weight:700,fill:"#cbd8cf"});
}
function warmWindow(c:Ctx,t:number,inside:(c:Ctx)=>void) {
  rbox(c,417,818,346,276,4,94800,.6);paint(c,"#50615d","#213d4a",3);
  c.save();c.beginPath();c.rect(430,830,320,250);c.clip();
  // The same chair, clock, calendar and side window as the previous reverse shot, at the same actor scale.
  c.save();c.translate(438,756);c.scale(.28169,.28169);detailedBoothFront(c,t,{clock:2.9});c.restore();
  pool(c,677,858,245,246,"246,181,98",.30);
  // A small interior ceiling light warms the wall; the actor is lit separately by the shot.
  rbox(c,451,838,64,5,2,94804,.2);paint(c,"#cfb67f","#706e53",.6);
  glow(c,483,841,61,"rgba(245,205,134,.15)");
  inside(c);
  // Thin side reflections and frost stay away from his eyes and hands.
  poly(c,[[432,831],[448,831],[482,1079],[463,1079]],94805,.25);paint(c,"rgba(173,203,212,.065)",null);
  poly(c,[[718,831],[726,831],[748,994],[748,1056]],94806,.25);paint(c,"rgba(236,207,147,.10)",null);
  for(const [x,y,side] of [[434,835,1],[746,835,-1],[435,1076,1],[746,1076,-1]] as [number,number,number][]){
    pool(c,x,y,42,55,"188,213,218",.18);
    for(let i=0;i<8;i++){
      const fy=y+(y<900?1:-1)*(6+i*4),fx=x+side*(3+hash(i*6.3)*11);
      inkLine(c,[[fx-side*3,fy-3],[fx,fy],[fx+side*(4+hash(i)*7),fy-5]],94810+x+i,.8,"rgba(199,221,217,.44)",.25);
    }
  }
  for(const x of [442,705,739]){
    inkLine(c,[[x,1017],[x+2,1048],[x,1071]],94834+x,.7,"rgba(201,215,208,.23)",.25);
    oval(c,x,1049,1.6,2.5,94835+x,.2);paint(c,"rgba(204,219,207,.23)",null);
  }
  c.restore();
  // Gaskets, inset aluminium channel and an offset sliding bar: no rail through Dad's face.
  rbox(c,428,828,324,254,2,94842,.3);paint(c,null,"#2b454c",5);
  rbox(c,424,824,332,262,3,94843,.3);paint(c,null,"#93a49a",6);
  inkLine(c,[[426,828],[426,1083]],94844,1.7,"#c0c5a8",.15);
  inkLine(c,[[752,830],[752,1081]],94845,1.5,"#d1bb87",.15);
  rbox(c,674,830,8,250,1.5,94846,.3);paint(c,"#9b9f86","#3a5659",1.4);
  inkLine(c,[[677,833],[677,1077]],94847,1.4,"#ddc795",.15);
  rbox(c,665,955,6,28,2,94848,.2);paint(c,"#bcb699","#425d5a",1);
  for(const x of [431,749])for(const y of [829,1082]){oval(c,x,y,1.4,1.4,94849+x+y,.1);paint(c,"#536b66",null);}
  // Deep sill with a warm inner lip and snow sitting only on its outside edge.
  poly(c,[[414,1083],[765,1082],[778,1100],[405,1103]],94856,.4);paint(c,"#9aaca5","#395966",2.5);
  poly(c,[[405,1103],[778,1100],[777,1111],[407,1113]],94857,.4);paint(c,"#546f7b","#34525f",1.5);
  inkLine(c,[[423,1089],[753,1088]],94858,2.2,"#d6bb87",.2);
  blob(c,[[407,1099],[454,1095],[509,1100],[563,1095],[649,1098],[721,1095],[777,1098],[774,1104],[408,1106]],94859,.5);paint(c,"#b7c5c7",null);
  pool(c,590,1100,214,137,"241,185,106",.16);
}
function roof(c:Ctx) {
  poly(c,[[351,771],[823,769],[838,786],[838,802],[350,802]],94900,.55);paint(c,"#405c6e","#203a4d",3);
  inkLine(c,[[358,790],[830,788]],94901,3,"#8cabae",.3);
  inkLine(c,[[364,797],[828,796]],94902,1,"#bdc7b6",.2);
  const p:Pt[]=[[354,776],[361,756],[379,747],[384,731],[433,720],[505,716],[540,710],[603,715],[638,711],[712,718],[748,726],[791,725],[816,739],[819,756],[833,770],[814,785],[758,786],[680,782],[588,786],[516,782],[425,789],[376,784]];
  poly(c,p,94903,.7);paint(c,vgrad(c,710,792,[[0,"#ced6d7"],[.44,"#b6c8d4"],[1,"#819eb4"]]),"#354e60",2.5);
  c.save();poly(c,p,94903,.7);c.clip();
  blob(c,[[369,750],[433,733],[551,721],[657,726],[778,737],[808,751],[752,748],[664,739],[571,734],[478,740],[400,757]],94904,.65);paint(c,"rgba(230,237,228,.31)",null);
  inkLine(c,[[378,772],[446,765],[521,768],[616,761],[721,765],[808,763]],94905,1.8,"rgba(74,111,140,.26)",.5);
  inkLine(c,[[397,741],[498,726],[581,725]],94906,1.6,"rgba(243,243,227,.51)",.3);
  pool(c,808,797,132,60,"239,201,142",.25);
  for(let i=0;i<62;i++){
    const x=360+hash(i*4.4)*465,y=714+hash(i*8.1)*78;
    inkLine(c,[[x,y],[x+1.5+hash(i)*3.5,y-.3]],94910+i,.7,"rgba(233,240,237,.29)",.15);
  }
  c.restore();
  for(let i=0;i<11;i++){
    const x=384+i*39,len=10+hash(i*2.3)*29,w=3+hash(i*3.1)*3;
    poly(c,[[x-w,796],[x+w,796],[x+1,796+len]],94980+i,.25);paint(c,vgrad(c,795,836,[[0,"#b0c3cf"],[1,"#728fa7"]]),"#4c6a7f",.8);
    inkLine(c,[[x-1,798],[x+1,790+len]],94995+i,.75,"#e0e4d2",.15);
  }
}
function doorLamp(c:Ctx,t:number) {
  inkLine(c,[[783,798],[781,814],[786,818]],95020,3,"#3d5863",.3);
  oval(c,786,821,15,7,95021,.3);paint(c,"#445b5d","#263f4c",1.4);
  blob(c,[[774,825],[774,836],[781,843],[791,842],[799,834],[796,825]],95022,.3);paint(c,"#f0d69e","#677760",1.2);
  inkLine(c,[[782,829],[784,836],[790,829]],95023,1,"#fff1be",.1);
  for(const x of [777,791])inkLine(c,[[x,821],[x+2,841]],95024+x,1.1,"rgba(126,124,83,.67)",.2);
  glow(c,786,836,100,"rgba(255,205,129,.26)");
  pool(c,785,907,108,168,"247,198,116",.17);
  lightShaft(c,[[774,843],[799,842],[883,1315],[714,1315]],786,841,800,1316,"245,197,118",.08,15,"booth_door_beam");
  void t;
}
function bicycle(c:Ctx) {
  // Wheels, spoke nipples and valve stems stay fine enough for a distant shot.
  for(const x of [230,370]){
    oval(c,x,1250,58,58,95100+x,.4);paint(c,"rgba(33,57,77,.065)","#172e42",5);
    oval(c,x,1250,53,53,95101+x,.35);paint(c,null,"#90a6b1",1.6);
    oval(c,x,1250,50,50,95102+x,.3);paint(c,null,"#486b84",.7);
    for(let i=0;i<14;i++){
      const a=i*Math.PI/7;
      inkLine(c,[[x+Math.cos(a)*4,1250+Math.sin(a)*4],[x+Math.cos(a+.08)*51,1250+Math.sin(a+.08)*51]],95105+x+i,.65,"rgba(159,181,192,.75)",.12);
    }
    oval(c,x,1250,4,4,95124+x,.15);paint(c,"#b4c0b9","#294b64",1.2);
    inkLine(c,[[x-5,1194],[x+3,1195],[x+14,1198]],95125+x,1.2,"#dce0d6",.2);
    inkLine(c,[[x+38,1214],[x+33,1220]],95126+x,1.1,"#c4c9b9",.15);
  }
  // Mudguards and their stays.
  for(const x of [230,370]){
    c.beginPath();c.arc(x,1250,61,-2.96,-.2);c.strokeStyle="#52758c";c.lineWidth=3;c.stroke();
    c.beginPath();c.arc(x,1250,62,-2.56,-.75);c.strokeStyle="#9fafb4";c.lineWidth=1.1;c.stroke();
    inkLine(c,[[x,1250],[x-55,1225]],95130+x,1.2,"#7d949f",.2);
  }
  const tubes:Pt[][]=[[[230,1250],[281,1182],[296,1251],[230,1250]],[[281,1182],[340,1192],[296,1251]],[[340,1192],[370,1250]],[[340,1192],[351,1156],[374,1156]]];
  for(let i=0;i<tubes.length;i++){
    inkLine(c,tubes[i],95140+i,5.4,"#284d69",.3);
    inkLine(c,tubes[i].map(([x,y])=>[x-1,y-1] as Pt),95145+i,1.3,"#87a6b3",.15);
  }
  // Chain stay, chain ring, crank and the opposing pedals.
  c.beginPath();c.ellipse(265,1251,37,9,0,0,Math.PI*2);c.strokeStyle="#243e51";c.lineWidth=2;c.stroke();
  oval(c,296,1251,12,12,95150,.2);paint(c,"#758b96","#2e5068",1.7);
  oval(c,296,1251,7,7,95151,.15);paint(c,"#325470","#96aaa9",.6);
  inkLine(c,[[285,1239],[296,1251],[310,1264]],95152,2.6,"#bec6bb",.15);
  for(const [x,y] of [[283,1239],[313,1264]]){rbox(c,x-7,y-2,14,5,1,95153+x,.15);paint(c,"#203d53","#7a98a7",.8);}
  // The rack, seat, leather grips, bell, brake cable and a red rear reflector.
  inkLine(c,[[218,1188],[267,1188],[269,1194],[216,1194]],95160,3,"#54758b",.2);
  inkLine(c,[[220,1195],[230,1250],[266,1194]],95161,1.6,"#7c94a1",.2);
  inkLine(c,[[281,1184],[280,1169]],95162,3.5,"#b0b9b2",.2);
  blob(c,[[262,1166],[288,1165],[298,1171],[293,1176],[268,1176],[257,1172]],95163,.3);paint(c,"#27394a","#142c40",1.8);
  blob(c,[[258,1165],[271,1161],[286,1163],[297,1169],[270,1170]],95164,.35);paint(c,"#b6c7d3","#566f86",.9);
  blob(c,[[216,1186],[231,1182],[260,1184],[267,1188],[222,1190]],95165,.35);paint(c,"#a6bdcc","#4c718a",.8);
  inkLine(c,[[352,1155],[370,1155]],95166,4,"#99acae",.2);
  inkLine(c,[[368,1155],[379,1157]],95167,5,"#263e52",.2);
  oval(c,355,1150,5,3,95168,.2);paint(c,"#c1c5af","#436375",.7);
  c.beginPath();c.moveTo(369,1160);c.bezierCurveTo(377,1195,334,1204,343,1212);c.strokeStyle="#30485b";c.lineWidth=1.1;c.stroke();
  rbox(c,211,1194,5,11,2,95169,.2);paint(c,"#a95544","#384e5d",.8);
  inkLine(c,[[298,1260],[320,1308]],95170,2.3,"#385971",.2);
}
function snowBank(c:Ctx) {
  // Banks gather against the foundation, not as a perfectly oval white sticker.
  const p:Pt[]=[[332,1329],[354,1311],[405,1315],[440,1304],[481,1318],[519,1312],[567,1320],[603,1309],[660,1317],[711,1305],[760,1313],[802,1303],[847,1319],[874,1345],[837,1354],[796,1349],[747,1358],[687,1351],[634,1361],[571,1357],[511,1366],[453,1356],[395,1360],[352,1350]];
  poly(c,p,95200,.65);paint(c,vgrad(c,1304,1371,[[0,"#b6c6cd"],[1,"#7b98b0"]]),null);
  inkLine(c,[[351,1324],[405,1328],[448,1319],[495,1326]],95201,1.5,"rgba(223,229,220,.54)",.4);
  inkLine(c,[[633,1330],[716,1323],[788,1323],[838,1335]],95202,1.5,"rgba(225,219,195,.55)",.4);
  inkLine(c,[[360,1353],[453,1360],[509,1369]],95203,1.3,"rgba(53,84,110,.27)",.4);
  pool(c,617,1332,225,62,"247,203,132",.20);
  for(const x of [230,370]){
    blob(c,[[x-30,1307],[x-14,1301],[x+9,1307],[x+32,1306],[x+39,1315],[x-32,1316]],95210+x,.4);paint(c,"#a0b6c8",null);
    inkLine(c,[[x-18,1310],[x+23,1313]],95211+x,1.2,"#c8d3d7",.2);
  }
}

/** Opt-in detail layer used by boothOutside; the public resource and its stable framing remain in booth.ts. */
export function detailedBoothOutside(c:Ctx,t:number,inside:(c:Ctx)=>void,o:OutsideDetailOptions,props:OutsideProps) {
  props.gate(c,t,60,o);
  gateFittings(c,t);
  snowGround(c);
  boothBody(c,o.sign??"门卫室");
  warmWindow(c,t,inside);roof(c);doorLamp(c,t);
  groundShadow(c,bicycle,[300,1308],166,[170,1420],.30,5,1,"#223d55");
  bicycle(c);snowBank(c);
  // Only a few near flakes pass in front of the glass. The gate's distant snow remains behind the cabin.
  snow(c,t,{n:53,seed:141,speed:92,size:2.1,alpha:.52,drift:25,color:"#cbdbe6"});
  c.save();c.beginPath();c.ellipse(627,978,226,252,0,0,Math.PI*2);c.clip();
  snow(c,t,{n:53,seed:141,speed:92,size:2.1,alpha:.70,drift:25,color:"#e7d4ae"});c.restore();
  filtered(c,"blur(3px)",q=>snow(q,t,{n:14,seed:149,speed:153,size:6.2,alpha:.24,drift:37,color:"#d1e0e9"}),"booth_outside_near_snow");
}
