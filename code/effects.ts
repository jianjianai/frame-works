import { Container, Graphics, Sprite, Texture, Text, BlurFilter, ColorMatrixFilter, DisplacementFilter } from "pixi.js";
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { seeded } from "@frame/engine/math";
import { pulse, beatLength } from "@frame/engine/tempo";

/** All resources are seekable; no tickers, shared clocks or incremental simulation. */
const sizes = {
  width: z.number().min(160).max(3840).default(1600).describe("输出宽度"),
  height: z.number().min(90).max(2160).default(900).describe("输出高度"),
};
const seed = z.number().int().min(1).max(99999).default(73).describe("固定随机种子");
const cyan = "#79f5ed";
const pink = "#ff69c9";
const TAU = Math.PI * 2;
const mod = (x: number, n: number) => ((x % n) + n) % n;
const sat = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { x = sat(x); return x*x*(3-2*x); };
function lightTexture() {
  const c = document.createElement("canvas"); c.width=c.height=96;
  const g=c.getContext("2d")!;
  const grad=g.createRadialGradient(48,48,0,48,48,48);
  grad.addColorStop(0,"rgba(255,255,255,1)");
  grad.addColorStop(.12,"rgba(255,255,255,.92)");
  grad.addColorStop(.35,"rgba(255,255,255,.25)");
  grad.addColorStop(1,"rgba(255,255,255,0)");
  g.fillStyle=grad; g.fillRect(0,0,96,96);
  return Texture.from(c);
}
function own(view: Container, texture: Texture) { view.on("destroyed", () => texture.destroy(true)); }
function releaseFilters(view: Container, filters: {destroy(): void}[]) {
  view.on("destroyed", () => filters.forEach(f=>f.destroy()));
}
function label(text: string, size: number, color: string, weight: "400"|"600"|"800" = "600") {
  return new Text({text,style:{fontFamily:"Arial, sans-serif",fontSize:size,fontWeight:weight,fill:color,letterSpacing:2}});
}

export const cityOptions = z.object({
  ...sizes, seed,
  accent: z.enum(["#79f5ed","#ff69c9","#ffc888"]).default("#79f5ed").describe("建筑与地平线高光"),
  hue: z.number().min(-90).max(90).default(0).describe("颜色矩阵色相偏移"),
  skyline: z.number().min(.5).max(1.4).default(1).describe("建筑高度倍率"),
});
/** Full-bleed vector skyline, glowing orbital moon and wet-floor reflections. */
export function nightCity(options: z.input<typeof cityOptions> = {}) {
  const p=cityOptions.parse(options), view=new Container(), world=new Container();
  view.addChild(world); world.scale.set(p.width/1600,p.height/900);
  const sky=new Graphics().rect(0,0,1600,900).fill("#080d23");
  world.addChild(sky);
  const tex=lightTexture(); own(view,tex);
  for(const [x,y,w,h,color,alpha] of [[1210,280,1200,900,pink,.20],[1090,650,1500,500,cyan,.16],[350,340,1200,1000,"#5733b0",.13]] as const){
    const s=new Sprite(tex); s.anchor.set(.5); s.position.set(x,y); s.width=w; s.height=h;s.tint=color;s.alpha=alpha;world.addChild(s);
  }
  const moon=new Container(); moon.position.set(1190,310);
  const orbitGlow=new Graphics().circle(0,0,170).stroke({color:p.accent,width:7,alpha:.38});
  const blur=new BlurFilter({strength:14,quality:4});orbitGlow.filters=[blur];releaseFilters(view,[blur]);
  const orbit=new Graphics().circle(0,0,170).stroke({color:p.accent,width:1.7,alpha:.65})
    .circle(0,0,154).stroke({color:pink,width:1,alpha:.30});
  moon.addChild(orbitGlow,orbit);world.addChild(moon);
  const disk=new Graphics().circle(0,0,145).fill({color:0xb98afd,alpha:.035});
  moon.addChild(disk);
  const random=seeded(p.seed), stars=new Graphics();
  for(let i=0;i<110;i++){const x=random()*1600,y=90+random()*535;
    stars.circle(x,y,.4+random()*.95).fill({color:0xd3e6ff,alpha:.12+random()*.43});}
  world.addChild(stars);
  const buildings=new Container();world.addChild(buildings);
  const windows: Sprite[]=[];
  for(let i=0;i<38;i++){
    const x=i*47-20, bw=29+random()*49;
    const ht=(40+random()*160+(x>850?random()*140:0))*p.skyline;
    const y=661-ht;
    const b=new Graphics().rect(x,y,bw,ht).fill(x>850?"#0a1430":"#0b1229")
      .moveTo(x,y).lineTo(x+bw,y).lineTo(x+bw,661).stroke({color:p.accent,width:1,alpha:.26});
    if(i%4===0)b.moveTo(x+bw*.5,y).lineTo(x+bw*.5,y-20-random()*30).stroke({color:p.accent,width:1,alpha:.4});
    buildings.addChild(b);
    for(let row=0;row<Math.floor(ht/16)-1;row++)for(let col=0;col<Math.floor(bw/10)-1;col++){
      if(random()>.47)continue;
      const s=new Sprite(Texture.WHITE);s.position.set(x+6+col*10,y+10+row*16);s.width=3;s.height=4;
      s.tint=random()>.28?p.accent:pink; s.alpha=.16+random()*.52;buildings.addChild(s);windows.push(s);
    }
  }
  const ground=new Graphics().rect(0,662,1600,238).fill("#080d1b")
    .moveTo(0,662).lineTo(1600,662).stroke({color:p.accent,alpha:.45,width:1.5});
  for(let i=0;i<19;i++){
    const x=i*100-100;ground.moveTo(800,662).lineTo(x*2-800,900).stroke({color:p.accent,width:.6,alpha:.075});
  }
  for(let i=0;i<9;i++){const y=662+Math.pow(i/8,2)*238;
    ground.moveTo(0,y).lineTo(1600,y).stroke({color:p.accent,width:.7,alpha:.08});}
  world.addChild(ground);
  const reflections=new Container();world.addChild(reflections);
  const refs=Array.from({length:100},()=>{
    const x=random()*1600,y=675+Math.pow(random(),1.8)*200, w=3+random()*50;
    const s=new Sprite(Texture.WHITE);s.tint=random()>.45?p.accent:pink;s.position.set(x,y);s.width=w;s.height=.6+random()*2.2;s.alpha=random()*.2;reflections.addChild(s);
    return {s,x,y,w,phase:random()*TAU};
  });
  const grade=new ColorMatrixFilter();buildings.filters=[grade]; releaseFilters(view,[grade]);
  return {view,update(t:number){
    grade.reset();grade.hue(p.hue+Math.sin(t*.23)*4,false);
    moon.scale.set(1+Math.sin(t*.3)*.015);
    orbitGlow.alpha=.65+.35*pulse(t,5);
    for(let i=0;i<refs.length;i++){const r=refs[i];r.s.x=r.x+Math.sin(t*1.3+r.phase)*9;r.s.width=r.w*(.7+.3*Math.sin(t*.7+r.phase));}
    windows.forEach((w,i)=>{w.alpha=(.22+.36*(.5+.5*Math.sin(i*14.23+t*.33)))*(1+.17*pulse(t,7));});
  }};
}

export const bokehOptions=z.object({...sizes,seed,
  count:z.number().int().min(10).max(400).default(90).describe("光斑数量"),
  radius:z.number().min(4).max(140).default(35).describe("光斑半径（1600宽参考画布）"),
  softness:z.number().min(0).max(16).default(3).describe("模糊滤镜强度"),
  intensity:z.number().min(.05).max(1).default(.4).describe("亮度"),
  palette:z.enum(["electric","warm"]).default("electric").describe("电光双色或暖色"),
});
export function bokeh(options:z.input<typeof bokehOptions>={}){
  const p=bokehOptions.parse(options),view=new Container(),dots=new Container();view.addChild(dots);
  const tex=lightTexture();own(view,tex);const random=seeded(p.seed);
  const colors=p.palette==="electric"?[cyan,pink,"#858bff"]:["#ffc888","#f7a989","#ffe5c1"];
  const items=Array.from({length:p.count},()=>{
    const s=new Sprite(tex);s.anchor.set(.5);s.tint=colors[Math.floor(random()*3)];s.blendMode="add";dots.addChild(s);
    return {s,x:random(),y:random(),r:(.3+random())*p.radius,phase:random()*TAU,speed:.008+random()*.018};
  });
  const filter=new BlurFilter({strength:p.softness,quality:3});dots.filters=[filter];releaseFilters(view,[filter]);
  return {view,update(t:number){
    for(const d of items){
      d.s.position.set(mod(d.x+t*d.speed*.12,1)*p.width,mod(d.y-t*d.speed,1)*p.height);
      const r=d.r*(1+.15*Math.sin(t*.5+d.phase))*p.width/1600;d.s.width=d.s.height=r*4;
      d.s.alpha=p.intensity*(.35+.35*Math.sin(t*.65+d.phase)**2+.3*pulse(t,6));
    }
  }};
}

export const rainOptions=z.object({...sizes,seed,
  count:z.number().int().min(100).max(2400).default(720).describe("雨丝精灵数量"),
  speed:z.number().min(.2).max(3).default(1).describe("落雨速度倍率"),
  wind:z.number().min(-.7).max(.7).default(-.2).describe("风向倾斜"),
  opacity:z.number().min(.05).max(1).default(.38).describe("雨丝透明度"),
  color:z.enum(["#79f5ed","#c9dcff","#ff69c9"]).default("#c9dcff").describe("雨丝颜色"),
});
export function rain(options:z.input<typeof rainOptions>={}){
  const p=rainOptions.parse(options),view=new Container(),far=new Container(),near=new Container();view.addChild(far,near);
  const random=seeded(p.seed);
  const items=Array.from({length:p.count},(_,i)=>{
    const s=new Sprite(Texture.WHITE),depth=.3+random()*.7;s.tint=p.color;s.anchor.set(.5);(i%3?far:near).addChild(s);
    return {s,x:random(),y:random(),depth,phase:random()*TAU};
  });
  const filter=new BlurFilter({strength:.5*p.width/1600,quality:2});far.filters=[filter];releaseFilters(view,[filter]);
  const splashes=Array.from({length:48},()=>{
    const g=new Graphics().ellipse(0,0,8,2).stroke({color:p.color,width:1,alpha:.6});view.addChild(g);
    return {g,x:random(),y:.745+random()*.21,phase:random()*2};
  });
  return {view,update(t:number){
    const beat=beatLength();
    for(const d of items){
      const travel=t*p.speed*(.26+d.depth*.34);
      d.s.position.set(mod(d.x+travel*p.wind,1.1)*p.width-.05*p.width,mod(d.y+travel,1.12)*p.height-.06*p.height);
      d.s.width=(.6+d.depth*.85)*p.width/1600;d.s.height=(9+d.depth*26)*p.height/900;
      d.s.rotation=-p.wind;d.s.alpha=p.opacity*(.35+d.depth*.65)*(1+.15*pulse(t,8));
    }
    for(const d of splashes){const q=mod(t+d.phase,beat*2)/(beat*2);d.g.position.set(d.x*p.width,d.y*p.height);d.g.scale.set((.3+q*2.3)*p.width/1600);d.g.alpha=(1-q)*p.opacity;}
  }};
}

export const neonOptions=z.object({...sizes,
  text:z.string().default("AFTER HOURS").describe("霓虹文字内容；支持换行"),
  fontSize:z.number().min(20).max(280).default(120).describe("字高（900高参考画布）"),
  color:z.enum(["#79f5ed","#ff69c9","#ffc888"]).default("#79f5ed").describe("灯管颜色"),
  glow:z.number().min(1).max(40).default(16).describe("辉光模糊强度"),
  beatAmount:z.number().min(0).max(1).default(.24).describe("随节拍辉光强度"),
});
export function neonType(options:z.input<typeof neonOptions>={}){
  const p=neonOptions.parse(options),view=new Container(),group=new Container();view.addChild(group);
  const style={fontFamily:"Arial, sans-serif",fontSize:p.fontSize*p.height/900,fontWeight:"800" as const,letterSpacing:-2*p.width/1600,lineHeight:p.fontSize*p.height/900*.94};
  const halo=new Text({text:p.text,style:{...style,fill:p.color}});
  const edge=new Text({text:p.text,style:{...style,fill:"#0d1731",stroke:{color:p.color,width:1.6*p.height/900}}});
  const front=new Text({text:p.text,style:{...style,fill:"#ecfffc"}});
  const blur=new BlurFilter({strength:p.glow*p.height/900,quality:5});halo.filters=[blur];halo.alpha=.8;releaseFilters(view,[blur]);
  front.alpha=.88;group.addChild(halo,edge,front);
  const maxWidth=p.width*.91;if(group.width>maxWidth)group.scale.set(maxWidth/group.width);
  return {view,update(t:number){
    const k=pulse(t,7);halo.alpha=.55+p.beatAmount*k;
    front.alpha=.85+.1*k;blur.strength=(p.glow*(.8+.25*k))*p.height/900;
  }};
}

export const burstOptions=z.object({...sizes,seed,
  count:z.number().int().min(100).max(2200).default(1000).describe("烟花粒子数量"),
  radius:z.number().min(40).max(650).default(310).describe("爆发半径（900高参考画布）"),
  color:z.enum(["#79f5ed","#ff69c9","#ffc888"]).default("#ff69c9").describe("主颜色"),
  intervalBeats:z.number().int().min(2).max(16).default(4).describe("每次爆发间隔拍数"),
  originX:z.number().min(0).max(1).default(.5).describe("爆发中心横向比例"),
  originY:z.number().min(0).max(1).default(.42).describe("爆发中心纵向比例"),
});
export function fireworks(options:z.input<typeof burstOptions>={}){
  const p=burstOptions.parse(options),view=new Container(),tex=lightTexture();own(view,tex);const random=seeded(p.seed);
  const items=Array.from({length:p.count},(_,i)=>{
    const s=new Sprite(tex);s.anchor.set(.5);s.blendMode="add";s.tint=i%7===0?"#fff1d5":i%3===0?cyan:p.color;view.addChild(s);
    return {s,a:random()*TAU,v:.3+random()*.7,delay:random()*.055,r:1+random()*2.1,z:random(),phase:random()*TAU};
  });
  return {view,update(t:number){
    const period=p.intervalBeats*beatLength(),age=mod(t,period),life=Math.min(period,2.1),cycle=Math.floor(t/period);
    for(const d of items){
      const a=Math.max(0,age-d.delay),q=sat(a/life),ease=1-Math.exp(-q*4);
      const angle=d.a+cycle*.47,dist=p.radius*d.v*ease*p.height/900;
      const x=p.width*p.originX+Math.cos(angle)*dist,y=p.height*p.originY+Math.sin(angle)*dist+q*q*95*p.height/900;
      d.s.position.set(x,y);d.s.width=(d.r*(2.5-q*1.5))*p.height/900;d.s.height=d.s.width*(1+q*3);
      d.s.rotation=angle+Math.PI/2;d.s.alpha=(age>d.delay?1:0)*Math.pow(1-q,1.25)*(.5+.5*Math.sin(a*12+d.phase)**2);
    }
  }};
}

export const rippleOptions=z.object({...sizes,
  duration:z.number().min(.4).max(3).default(1).describe("转场总长（秒），中点完全遮挡"),
  strength:z.number().min(0).max(160).default(70).describe("置换滤镜强度"),
  color:z.enum(["#79f5ed","#ff69c9","#ffc888"]).default("#79f5ed").describe("波纹边缘颜色"),
});
/** Opaque traveling curtain: cut underlying scenes at duration/2. Both endpoints transparent. */
export function rippleWipe(options:z.input<typeof rippleOptions>={}){
  const p=rippleOptions.parse(options),view=new Container(),curtain=new Container();view.addChild(curtain);
  const cover=new Graphics().rect(-p.width*.4,-p.height*.3,p.width*1.8,p.height*1.6).fill("#101a34");
  const rings=new Graphics();
  for(let i=0;i<30;i++){const x=i*p.width/25;
    rings.moveTo(x,-p.height*.2).bezierCurveTo(x+p.width*.22,p.height*.15,x-p.width*.22,p.height*.8,x,p.height*1.2)
      .stroke({color:i%3===0?pink:p.color,width:i%3===0?2.5:1,alpha:.16+(i%4)*.12});}
  const edge=new Graphics().rect(-p.width*.006,-p.height*.3,p.width*.008,p.height*1.6).fill(p.color);
  curtain.addChild(cover,rings,edge);
  const c=document.createElement("canvas");c.width=c.height=128;const ctx=c.getContext("2d")!,data=ctx.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;
    data.data[i]=128+110*Math.sin(x*.08+y*.1);data.data[i+1]=128+80*Math.cos(y*.09-x*.045);data.data[i+2]=128;data.data[i+3]=255;}
  ctx.putImageData(data,0,0);const texture=Texture.from(c);own(view,texture);const map=new Sprite(texture);map.width=p.width*2;map.height=p.height*2;view.addChild(map);
  const filter=new DisplacementFilter({sprite:map,scale:{x:p.strength*p.width/1600,y:p.strength*p.height/900*.25}});curtain.filters=[filter];releaseFilters(view,[filter]);
  return {view,update(t:number){
    const q=sat(t/p.duration);view.visible=t>0&&t<p.duration;
    const travel=q<.5?smooth(q*2):smooth((q-.5)*2);
    curtain.x=q<.5?p.width*1.6*(1-travel):-p.width*1.8*travel;
    rings.x=Math.sin(q*TAU)*p.width*.08;map.x=-q*p.width*.3;map.y=-q*p.height*.1;
    filter.scale.x=p.strength*p.width/1600*Math.sin(q*Math.PI);
  }};
}

export const resources=defineResources({
  nightCity:resource({
    kind:"set",title:"霓虹夜城",description:"程序化天际线、轨道月环与湿地倒影；ColorMatrixFilter 调色。",tags:["Pixi","夜景","城市","颜色矩阵"],
    usage:"const fx=nightCity({width,height,accent,hue}); app.stage.addChild(fx.view); 每帧 fx.update(t);",
    params:cityOptions,presets:{青蓝夜色:{accent:"#79f5ed",hue:0,seed:73},粉紫午夜:{accent:"#ff69c9",hue:18,seed:19}},
    preview:{engine:"pixi",width:960,height:540,duration:6,background:"#080d23",build({app,params,width,height}){const fx=nightCity({...params,width,height});app.stage.addChild(fx.view);return fx.update;}}
  }),
  bokeh:resource({
    kind:"effect",title:"漂浮散景",description:"大量加色精灵叠加柔焦光斑；模糊滤镜和节拍包络。透明叠加。",tags:["Pixi","精灵","散景","模糊","节拍"],
    usage:"const fx=bokeh({width,height,count:90}); app.stage.addChild(fx.view); 每帧 fx.update(t);",
    params:bokehOptions,presets:{电光:{palette:"electric",count:90,radius:35,intensity:.4},暖夜:{palette:"warm",count:55,radius:60,intensity:.32}},
    preview:{engine:"pixi",width:960,height:540,duration:6,background:"#080d23",build({app,params,width,height}){const fx=bokeh({...params,width,height});app.stage.addChild(fx.view);return fx.update;}}
  }),
  rain:resource({
    kind:"effect",title:"双层霓虹雨幕",description:"近远两层雨丝精灵、地面涟漪；解析运动支持任意跳转。",tags:["Pixi","下雨","天气","精灵","粒子"],
    usage:"const fx=rain({width,height,count:720,wind:-.2}); app.stage.addChild(fx.view); 每帧 fx.update(t);",
    params:rainOptions,presets:{细雨:{count:520,speed:.7,opacity:.32,wind:-.12},疾雨:{count:1600,speed:1.7,opacity:.55,wind:-.3}},
    preview:{engine:"pixi",width:960,height:540,duration:4,background:"#080d23",build({app,params,width,height}){const city=nightCity({width,height});const fx=rain({...params,width,height});app.stage.addChild(city.view,fx.view);return t=>{city.update(t);fx.update(t);};}}
  }),
  neonType:resource({
    kind:"text",title:"脉冲霓虹字",description:"灯管轮廓、亮芯和模糊辉光三层文字；辉光跟随 project.tempo。",tags:["Pixi","文字","霓虹","辉光","节拍"],
    usage:"const fx=neonType({width,height,text:'AFTER HOURS',fontSize:120}); fx.view.position.set(x,y); app.stage.addChild(fx.view); 每帧 fx.update(t);",
    params:neonOptions,presets:{青色招牌:{text:"AFTER HOURS",color:"#79f5ed",fontSize:120},粉色双行:{text:"KEEP\nGLOWING",color:"#ff69c9",fontSize:150}},
    preview:{engine:"pixi",width:960,height:540,duration:4,background:"#080d23",build({app,params,width,height}){const fx=neonType({...params,width,height});fx.view.position.set(width*.06,height*.32);app.stage.addChild(fx.view);return fx.update;}}
  }),
  fireworks:resource({
    kind:"effect",title:"千点烟花",description:"100–2200 个加色粒子解析爆发；每 N 拍循环、无帧间积累。",tags:["Pixi","粒子","烟花","爆发","节拍"],
    usage:"const fx=fireworks({width,height,count:1000,intervalBeats:4}); app.stage.addChild(fx.view); 每帧 fx.update(t);",
    params:burstOptions,presets:{粉蓝烟火:{color:"#ff69c9",count:1000,radius:310},香槟火花:{color:"#ffc888",count:1500,radius:360,intervalBeats:8}},
    preview:{engine:"pixi",width:960,height:540,duration:2,time:.5,background:"#080d23",build({app,params,width,height}){const fx=fireworks({...params,width,height});app.stage.addChild(fx.view);return fx.update;}}
  }),
  rippleWipe:resource({
    kind:"transition",title:"液态波纹转场",description:"原创正弦位移纹理驱动 DisplacementFilter；中点全遮挡，可隐藏场景切换。",tags:["Pixi","置换","波纹","转场"],
    usage:"const fx=rippleWipe({width,height,duration:1}); app.stage.addChild(fx.view); fx.update(localTime); 在 duration/2 切换下层镜头。",
    params:rippleOptions,presets:{青色涟漪:{color:"#79f5ed",strength:70,duration:1},粉色热浪:{color:"#ff69c9",strength:120,duration:1.2}},
    preview:{engine:"pixi",width:960,height:540,duration:1,time:.38,background:"#080d23",build({app,params,width,height}){
      const a=nightCity({width,height,accent:"#79f5ed"}),b=nightCity({width,height,accent:"#ff69c9",hue:20,seed:19}),fx=rippleWipe({...params,width,height});
      app.stage.addChild(a.view,b.view,fx.view);return t=>{a.update(t);b.update(t);a.view.visible=t<params.duration/2;b.view.visible=t>=params.duration/2;fx.update(t);};
    }}
  }),
});
