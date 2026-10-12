import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { gsap, splitText, drawGlyphs, strokePath, morphPath, CustomEase } from "@frame/engine/gsap";

export const FONT = '"Noto Sans CJK SC", "Microsoft YaHei", "PingFang SC", sans-serif';
export async function prepareTypography() {
  await document.fonts.load('700 96px ' + FONT, '观察建模验证');
  await document.fonts.ready;
}
/** Recommended scale for direct drawing in SceneOptions pixels (short edge = 540 design units). */
export function motionScale(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError("motionScale: width and height must be finite and greater than 0");
  }
  return Math.min(width, height) / 540;
}
function scaleLocal(ctx: CanvasRenderingContext2D, scale: number) {
  // Avoid even an identity transform on legacy calls.
  if (scale !== 1) ctx.scale(scale, scale);
}
type Entry = { tl: ReturnType<typeof gsap.timeline>; [key: string]: any };
const caches = new WeakMap<CanvasRenderingContext2D, Map<string, Entry>>();
function cached(ctx: CanvasRenderingContext2D, key: string, make: () => Entry): Entry {
  let m = caches.get(ctx);
  if (!m) { m = new Map(); caches.set(ctx, m); }
  let e = m.get(key);
  if (!e) {
    e = make(); m.set(key, e);
    if (m.size > 100) { const k = m.keys().next().value!; m.get(k)!.tl.kill(); m.delete(k); }
  }
  return e;
}
export function disposeResources(ctx: CanvasRenderingContext2D) {
  caches.get(ctx)?.forEach(e => e.tl.kill()); caches.delete(ctx);
}
const clamp = (n: number) => Math.max(0, Math.min(1, n));
function ease() { return CustomEase.create("frameEditorial", "M0,0 C0.16,0.9 0.28,1 1,1"); }
function text(ctx: CanvasRenderingContext2D, str: string, x: number, y: number, size: number, color: string, weight = 500) {
  ctx.font = weight + " " + size + "px " + FONT; ctx.fillStyle = color; ctx.fillText(str, x, y);
}
function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, r = 20) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill();
}
export const titleOptions = z.object({
  scale: z.number().positive().finite().default(1).describe("整体等比缩放（有限正数，默认1）；缩放尺寸、字体、线宽和位移，不缩放x/y与时间"),
  text: z.string().default("让知识动起来").describe("标题文字，支持换行"),
  color: z.string().default("#F2EFE4").describe("标题颜色"),
  size: z.number().min(24).max(200).default(96).describe("字号（设计像素）"),
  duration: z.number().min(0.3).max(5).default(1.2).describe("整句入场时长（秒）"),
  maxWidth: z.number().min(200).max(1800).default(1200).describe("自动换行宽度（缩放前设计单位；可用像素宽度/scale）"),
  lineHeight: z.number().min(0.8).max(3).optional().describe("换行行高：字体高度的倍数，默认1.25；紧凑中文标题可用0.9–1.1"),
});
export function kineticTitle(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, options: z.input<typeof titleOptions> = {}) {
  const p = titleOptions.parse(options); ctx.save(); ctx.translate(x,y);scaleLocal(ctx,p.scale);
  ctx.font = "700 " + p.size + "px " + FONT; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  const e = cached(ctx, "title" + JSON.stringify(p), () => {
    const glyphs = splitText(ctx,p.text,{x:0,y:0,maxWidth:p.maxWidth,lineHeight:p.lineHeight ?? 1.25,letterSpacing:1});
    const tl = gsap.timeline({paused:true}).from(glyphs,{y:"+=" + p.size*0.52,alpha:0,scale:0.78,duration:p.duration*0.65,stagger:glyphs.length > 1 ? p.duration*0.35/(glyphs.length-1) : 0,ease:"back.out(1.25)"},0);
    return {tl,glyphs};
  });
  e.tl.seek(Math.max(0,t),true); ctx.fillStyle=p.color; drawGlyphs(ctx,e.glyphs); ctx.restore();
}
export const lineOptions = z.object({
  scale: z.number().positive().finite().default(1).describe("整体等比缩放（有限正数，默认1）；缩放尺寸、字体、线宽和位移，不缩放x/y与时间"),
  text:z.string().default("看见关键线索").describe("标注内容"),
  color:z.string().default("#FF805F").describe("引线与圆点颜色"),
  textColor:z.string().default("#F2EFE4").describe("文字颜色"),
  duration:z.number().min(0.3).max(5).default(1.2).describe("描边生长时长"),
  width:z.number().min(180).max(800).default(460).describe("引线宽度（缩放前设计单位）"),
});
export function callout(ctx: CanvasRenderingContext2D,x:number,y:number,t:number,options:z.input<typeof lineOptions>={}) {
 const p=lineOptions.parse(options);
 const e=cached(ctx,"line"+JSON.stringify(p),()=>{const s={v:0,a:0};const tl=gsap.timeline({paused:true}).to(s,{v:1,duration:p.duration,ease:"power2.inOut"},0).to(s,{a:1,duration:0.3},p.duration*0.6);return {tl,s};});
 e.tl.seek(Math.max(0,t),true);ctx.save();ctx.translate(x,y);scaleLocal(ctx,p.scale);ctx.strokeStyle=p.color;ctx.lineWidth=3;ctx.lineCap="round";
 strokePath(ctx,"M0,90 L80,0 L"+p.width+",0",e.s.v);
 ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,90,6*e.s.v,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha*=e.s.a;text(ctx,p.text,90,-24,27,p.textColor);ctx.restore();
}
export const morphOptions=z.object({
  scale: z.number().positive().finite().default(1).describe("整体等比缩放（有限正数，默认1）；缩放尺寸、字体、线宽和位移，不缩放x/y与时间"),
 text:z.string().default("从线索到结构").describe("图标下的说明"),
 color:z.string().default("#FF805F").describe("图标填充色"),
 textColor:z.string().default("#F2EFE4").describe("说明文字颜色"),
 duration:z.number().min(0.4).max(6).default(2).describe("形状变形时长"),
 size:z.number().min(60).max(500).default(240).describe("图标直径（缩放前设计单位）"),
});
const CIRCLE="M100,0 C155,0 200,45 200,100 C200,155 155,200 100,200 C45,200 0,155 0,100 C0,45 45,0 100,0 Z";
const DIAMOND="M100,0 L200,100 L100,200 L0,100 Z";
export function morphIcon(ctx:CanvasRenderingContext2D,x:number,y:number,t:number,options:z.input<typeof morphOptions>={}) {
 const p=morphOptions.parse(options);
 const e=cached(ctx,"morph"+JSON.stringify(p),()=>{const s={v:0,rotation:-0.15};const morph=morphPath(CIRCLE,DIAMOND);const tl=gsap.timeline({paused:true}).to(s,{v:1,rotation:Math.PI/2,duration:p.duration,ease:ease()},0);return {tl,s,morph};});
 e.tl.seek(Math.max(0,t),true);ctx.save();ctx.translate(x,y);scaleLocal(ctx,p.scale);ctx.save();ctx.rotate(e.s.rotation);ctx.scale(p.size/200,p.size/200);ctx.translate(-100,-100);ctx.fillStyle=p.color;ctx.fill(new Path2D(e.morph(e.s.v)));ctx.restore();
 ctx.strokeStyle=p.textColor;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-24,0);ctx.lineTo(24,0);ctx.moveTo(0,-24);ctx.lineTo(0,24);ctx.stroke();
 ctx.textAlign="center";text(ctx,p.text,0,p.size/2+62,26,p.textColor);ctx.restore();
}
export const numberOptions=z.object({
  scale: z.number().positive().finite().default(1).describe("整体等比缩放（有限正数，默认1）；缩放尺寸、字体、线宽和位移，不缩放x/y与时间"),
 text:z.string().default("核心步骤").describe("卡片标题"),
 value:z.number().min(0).max(9999).default(3).describe("目标数字"),
 suffix:z.string().default("步").describe("数字单位"),
 color:z.string().default("#FF805F").describe("数字强调色"),
 background:z.string().default("#F2EFE4").describe("卡片背景色"),
 duration:z.number().min(0.3).max(5).default(1.4).describe("数字滚动时长"),
});
export function numberCard(ctx:CanvasRenderingContext2D,x:number,y:number,t:number,options:z.input<typeof numberOptions>={}) {
 const p=numberOptions.parse(options);
 const e=cached(ctx,"number"+JSON.stringify(p),()=>{const s={v:0,open:0};const tl=gsap.timeline({paused:true}).to(s,{v:p.value,duration:p.duration,ease:"power2.out"},0).to(s,{open:1,duration:0.6,ease:ease()},0);return {tl,s};});
 e.tl.seek(Math.max(0,t),true);ctx.save();ctx.translate(x,y+25*(1-e.s.open)*p.scale);scaleLocal(ctx,p.scale);ctx.globalAlpha*=e.s.open;
 box(ctx,0,0,420,310,p.background,24);text(ctx,p.text,34,56,25,"#173B35");
 ctx.save();ctx.beginPath();ctx.rect(25,76,370,150);ctx.clip();
 const value=Math.floor(e.s.v+0.00001),fraction=e.s.v-value;ctx.font="700 124px "+FONT;ctx.fillStyle=p.color;
 const fontSize = Math.min(124, 420 / Math.max(1,String(Math.round(p.value)).length)); ctx.font="700 "+fontSize+"px "+FONT;
 ctx.fillText(String(value),30,206-fraction*145);if(fraction>0.001)ctx.fillText(String(value+1),30,351-fraction*145);
 ctx.restore();text(ctx,p.suffix,318,210,32,"#173B35");
 ctx.fillStyle="#D8DCD2";ctx.fillRect(35,261,350,4);ctx.fillStyle=p.color;ctx.fillRect(35,261,350*(p.value?e.s.v/p.value:1),4);ctx.restore();
}
export const arrowOptions=z.object({
  scale: z.number().positive().finite().default(1).describe("整体等比缩放（有限正数，默认1）；缩放尺寸、字体、线宽和位移，不缩放x/y与时间"),
 text:z.string().default("向下一个问题出发").describe("路径说明"),
 color:z.string().default("#FF805F").describe("箭头与轨迹颜色"),
 duration:z.number().min(0.4).max(6).default(2).describe("沿路径移动的时长"),
 width:z.number().min(200).max(900).default(560).describe("路径宽度（缩放前设计单位）"),
});
export function pathArrow(ctx:CanvasRenderingContext2D,x:number,y:number,t:number,options:z.input<typeof arrowOptions>={}) {
 const p=arrowOptions.parse(options);
 if(t<0)return;
 const e=cached(ctx,"arrow"+JSON.stringify(p),()=>{const point={x:0,y:100,rotation:0};const s={v:0};const path="M0,100 C"+p.width*0.35+",100 "+p.width*0.35+",0 "+p.width*0.62+",0 S"+p.width*0.8+",70 "+p.width+",30";const tl=gsap.timeline({paused:true}).to(point,{motionPath:{path,autoRotate:true},duration:p.duration,ease:"power1.inOut"},0).to(s,{v:1,duration:p.duration,ease:"power1.inOut"},0);return {tl,point,s,path};});
 e.tl.seek(Math.max(0,t),true);ctx.save();ctx.translate(x,y);scaleLocal(ctx,p.scale);ctx.strokeStyle=p.color;ctx.lineWidth=3;ctx.globalAlpha*=0.2;strokePath(ctx,e.path,1);ctx.globalAlpha/=0.2;strokePath(ctx,e.path,e.s.v);
 ctx.translate(e.point.x,e.point.y);ctx.rotate(e.point.rotation*Math.PI/180);ctx.fillStyle=p.color;ctx.beginPath();ctx.moveTo(19,0);ctx.lineTo(-12,-11);ctx.lineTo(-6,0);ctx.lineTo(-12,11);ctx.closePath();ctx.fill();ctx.restore();
 ctx.save();
 if(p.scale===1) text(ctx,p.text,x,y+168,25,p.color);
 else {ctx.translate(x,y);scaleLocal(ctx,p.scale);text(ctx,p.text,0,168,25,p.color);}
 ctx.restore();
}
export const lowerOptions=z.object({
  scale: z.number().positive().finite().default(1).describe("整体等比缩放（有限正数，默认1）；缩放尺寸、字体、线宽和位移，不缩放x/y与时间"),
 text:z.string().default("观察 · 从一个好问题开始").describe("主字幕"),
 detail:z.string().default("KNOWLEDGE NOTES / 01").describe("次级信息"),
 color:z.string().default("#FF805F").describe("竖线强调色"),
 background:z.string().default("#21483F").describe("字幕条背景"),
 duration:z.number().min(0.3).max(5).default(0.9).describe("字幕入场时长"),
 width:z.number().min(440).max(1600).default(900).describe("字幕条宽度（缩放前设计单位；可用像素宽度/scale）"),
 wrap:z.boolean().default(false).describe("主副字幕按宽度换行并自动增高；默认false保留旧版单行裁切"),
});
// Opt-in wrapping keeps readable font sizes, including long words and emoji graphemes.
const textSegments = new Intl.Segmenter(undefined, { granularity: "grapheme" });
function wrappedLines(ctx: CanvasRenderingContext2D, value: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of value.replace(/\r\n?/g, "\n").split("\n")) {
    let line = "";
    for (const { segment } of textSegments.segment(paragraph)) {
      if (line && ctx.measureText(line + segment).width > width) {
        lines.push(line); line = segment.trimStart();
      } else line += segment;
    }
    lines.push(line);
  }
  return lines;
}
function lowerLayout(ctx: CanvasRenderingContext2D, p: z.output<typeof lowerOptions>) {
  ctx.save();
  try {
    ctx.font = "500 18px " + FONT;
    const detailLines = wrappedLines(ctx, p.detail, p.width - 64);
    const first = 92 + (detailLines.length - 1) * 26;
    ctx.font = "600 32px " + FONT;
    const mainLines = wrappedLines(ctx, p.text, p.width - 64);
    return { detailLines, mainLines, first, height: first + (mainLines.length - 1) * 44 + 40 };
  } finally { ctx.restore(); }
}
export function lowerThird(ctx:CanvasRenderingContext2D,x:number,y:number,t:number,options:z.input<typeof lowerOptions>={}) {
 const p=lowerOptions.parse(options);
 const e=cached(ctx,"lower"+JSON.stringify(p),()=>{const s={v:0,a:0};const tl=gsap.timeline({paused:true}).to(s,{v:1,duration:p.duration,ease:ease()},0).to(s,{a:1,duration:p.duration*0.5},p.duration*0.35);return {tl,s,layout:p.wrap?lowerLayout(ctx,p):null};});
 e.tl.seek(Math.max(0,t),true);ctx.save();ctx.translate(x,y);scaleLocal(ctx,p.scale);
 const layout=e.layout, height=layout?layout.height:132;
 ctx.beginPath();ctx.rect(0,0,p.width*e.s.v,height);ctx.clip();box(ctx,0,0,p.width,height,p.background,8);ctx.fillStyle=p.color;ctx.fillRect(0,0,6,height);
 ctx.globalAlpha*=e.s.a;
 if(layout) {
   ctx.textAlign="left";ctx.textBaseline="alphabetic";
   layout.detailLines.forEach((line:string,i:number)=>text(ctx,line,32,39+i*26,18,"#ABC1B4"));
   layout.mainLines.forEach((line:string,i:number)=>text(ctx,line,32,layout.first+i*44,32,"#F2EFE4",600));
 } else {
   text(ctx,p.detail,32,39,18,"#ABC1B4");text(ctx,p.text,32,92,32,"#F2EFE4",600);
 }
 ctx.restore();
}
export const quoteOptions=z.object({
  scale: z.number().positive().finite().default(1).describe("整体等比缩放（有限正数，默认1）；缩放尺寸、字体、线宽和位移，不缩放x/y与时间"),
 text:z.string().default("好奇心是最好的老师").describe("引言内容，支持换行"),
 author:z.string().default("— 爱因斯坦").describe("作者署名"),
 color:z.string().default("#F2EFE4").describe("引言文字颜色"),
 accent:z.string().default("#FF805F").describe("引号与竖线强调色"),
 size:z.number().min(24).max(160).default(64).describe("引言字号（设计像素）"),
 duration:z.number().min(0.4).max(8).default(2).describe("引言逐字出现总时长（秒）"),
 maxWidth:z.number().min(240).max(1800).default(760).describe("引言自动换行宽度（缩放前设计单位）"),
});
/** 引用卡片：x/y 为引言区域左上角；逐字出现后署名淡入。时间是局部秒数。 */
export function quoteCard(ctx:CanvasRenderingContext2D,x:number,y:number,t:number,options:z.input<typeof quoteOptions>={}) {
 const p=quoteOptions.parse(options);
 ctx.save();ctx.translate(x,y);scaleLocal(ctx,p.scale);ctx.textAlign="left";ctx.textBaseline="alphabetic";
 const lh=p.size*1.35,first=p.size*1.1;
 ctx.font="700 "+p.size+"px "+FONT;
 const e=cached(ctx,"quote"+JSON.stringify(p),()=>{
  const glyphs=splitText(ctx,p.text,{x:0,y:first,maxWidth:p.maxWidth,lineHeight:1.35,letterSpacing:1});
  const bottom=glyphs.reduce((m:number,g:any)=>Math.max(m,g.y),first);
  const s={a:0,bar:0};
  const tl=gsap.timeline({paused:true}).to(s,{bar:1,duration:0.4,ease:"power2.out"},0)
   .from(glyphs,{y:"+="+p.size*0.3,alpha:0,duration:p.duration*0.3,stagger:glyphs.length>1?p.duration*0.7/(glyphs.length-1):0,ease:"power2.out"},0.2)
   .to(s,{a:1,duration:0.6,ease:"power1.out"},0.2+p.duration+0.1);
  return {tl,glyphs,s,bottom};
 });
 e.tl.seek(Math.max(0,t),true);
 ctx.fillStyle=p.accent;ctx.fillRect(-36,0,6,(e.bottom+p.size*0.4)*e.s.bar);
 ctx.globalAlpha*=e.s.bar;text(ctx,"“",-4,-p.size*0.1,p.size*1.6,p.accent,700);ctx.globalAlpha/=Math.max(e.s.bar,0.0001);
 ctx.font="700 "+p.size+"px "+FONT;ctx.fillStyle=p.color;drawGlyphs(ctx,e.glyphs);
 ctx.globalAlpha*=e.s.a;text(ctx,p.author,0,e.bottom+p.size*1.05,Math.round(p.size*0.45),p.accent,500);
 ctx.restore();
}
export const resources=defineResources({
 kineticTitle:resource({kind:"text",title:"逐字弹出大标题",description:"字体加载后 splitText，GSAP 逐字弹出。坐标是第一行左侧基线。",tags:["文字","标题","gsap","canvas"],usage:"await prepareTypography(); kineticTitle(ctx,x,y,localTime,{text,color,size,duration,maxWidth,scale,lineHeight}); disposeResources(ctx) 释放缓存。 scale默认1；x/y为调用方坐标，尺寸为缩放前设计单位；直接画布绘制用scale:motionScale(width,height)，不要再叠加全局缩放。 多行标题的行距用lineHeight（字体高度的倍数，默认1.25）。",params:titleOptions,presets:{"知识开场":{text:"让知识动起来",color:"#F2EFE4",size:96,duration:1.2},"珊瑚强调":{text:"先问为什么",color:"#FF805F",size:100,duration:1}},preview:{engine:"canvas",width:960,height:540,duration:2,time:1.5,background:"#12372F",prepare:prepareTypography,draw:(c,t,p)=>kineticTitle(c,100,290,t,p)}}),
 callout:resource({kind:"effect",title:"生长引线与标注",description:"strokePath 按长度描边，标注跟随线段出现。",tags:["引线","标注","描边","gsap"],usage:"callout(ctx,x,y,localTime,{text,color,textColor,width,duration,scale})；原点是折线顶端的高度。 scale默认1；x/y为调用方坐标，尺寸为缩放前设计单位；直接画布绘制用scale:motionScale(width,height)，不要再叠加全局缩放。",params:lineOptions,presets:{"知识标注":{text:"看见关键线索",width:460},"浅色画面":{text:"记录真实现象",textColor:"#173B35",color:"#DF593E"}},preview:{engine:"canvas",width:960,height:540,duration:2,time:1.5,background:"#12372F",prepare:prepareTypography,draw:(c,t,p)=>callout(c,200,280,t,p)}}),
 morphIcon:resource({kind:"prop",title:"圆形到菱形的结构图标",description:"morphPath 与 CustomEase 让有机形态收束为几何结构。",tags:["图标","形变","gsap"],usage:"morphIcon(ctx,centerX,centerY,localTime,{text,color,textColor,size,duration,scale}) scale默认1；x/y为调用方坐标，尺寸为缩放前设计单位；直接画布绘制用scale:motionScale(width,height)，不要再叠加全局缩放。",params:morphOptions,presets:{"珊瑚结构":{color:"#FF805F",text:"从线索到结构"},"青柠结构":{color:"#D8ED99",text:"形成新的解释"}},preview:{engine:"canvas",width:960,height:540,duration:3,time:2.4,background:"#12372F",prepare:prepareTypography,draw:(c,t,p)=>morphIcon(c,480,235,t,p)}}),
 numberCard:resource({kind:"ui",title:"滚动数字数据卡",description:"数字纵向滚动并收束到目标值；数据由调用方提供。",tags:["数字","数据","卡片","gsap"],usage:"numberCard(ctx,x,y,localTime,{text,value,suffix,color,background,duration,scale})；卡片设计尺寸 420×310。 scale默认1；x/y为调用方坐标，尺寸为缩放前设计单位；直接画布绘制用scale:motionScale(width,height)，不要再叠加全局缩放。",params:numberOptions,presets:{"三个步骤":{text:"核心步骤",value:3,suffix:"步"},"示意数据":{text:"示意进度",value:100,suffix:"%"}},preview:{engine:"canvas",width:960,height:540,duration:2,time:1.8,background:"#12372F",prepare:prepareTypography,draw:(c,t,p)=>numberCard(c,270,115,t,p)}}),
 pathArrow:resource({kind:"effect",title:"沿路径运动的箭头",description:"MotionPath 驱动箭头的位置与朝向，strokePath 同步生长轨迹。",tags:["箭头","路径","gsap"],usage:"pathArrow(ctx,x,y,localTime,{text,color,width,duration,scale}) scale默认1；x/y为调用方坐标，尺寸为缩放前设计单位；直接画布绘制用scale:motionScale(width,height)，不要再叠加全局缩放。",params:arrowOptions,presets:{"探索路径":{text:"向下一个问题出发",width:560},"证据路径":{text:"让证据带路",color:"#D8ED99",width:560}},preview:{engine:"canvas",width:960,height:540,duration:3,time:2.3,background:"#12372F",prepare:prepareTypography,draw:(c,t,p)=>pathArrow(c,190,200,t,p)}}),
 quoteCard:resource({kind:"text",title:"引用卡片",description:"引言逐字出现，竖线生长，署名随后淡入。坐标是引言区域左上角。",tags:["引言","引用","文字","gsap"],usage:"await prepareTypography(); quoteCard(ctx,x,y,localTime,{text,author,color,accent,size,duration,maxWidth,scale}); disposeResources(ctx) 释放缓存。 scale默认1；x/y为调用方坐标，尺寸为缩放前设计单位；直接画布绘制用scale:motionScale(width,height)，不要再叠加全局缩放。",params:quoteOptions,presets:{"深色引言":{text:"好奇心是最好的老师",author:"— 爱因斯坦",color:"#F2EFE4",accent:"#FF805F"},"青柠大字":{text:"提出一个好问题，\n胜过十个答案",author:"— 知识笔记",color:"#D8ED99",accent:"#F2EFE4",size:56,duration:2.6}},preview:{engine:"canvas",width:960,height:540,duration:4,time:3.5,background:"#12372F",prepare:prepareTypography,draw:(c,t,p)=>quoteCard(c,140,150,t,p)}}),
 lowerThird:resource({kind:"text",title:"知识讲解下三分之一字幕条",description:"CustomEase 展开条带，主副标题分层出现。",tags:["字幕","lower third","gsap"],usage:"lowerThird(ctx,x,y,localTime,{text,detail,color,background,width,duration,scale,wrap})；坐标为左上角。 scale默认1；x/y为调用方坐标，尺寸为缩放前设计单位；直接画布绘制用scale:motionScale(width,height)，不要再叠加全局缩放。 长文启用wrap:true，width=(画布宽-左右边距)/scale，自动增高。",params:lowerOptions,presets:{"观察":{text:"观察 · 从一个好问题开始",detail:"KNOWLEDGE NOTES / 01",width:820},"收束":{text:"观察 → 建模 → 验证",detail:"KEEP ASKING / 保持好奇",width:820}},preview:{engine:"canvas",width:960,height:540,duration:2,time:1.3,background:"#12372F",prepare:prepareTypography,draw:(c,t,p)=>lowerThird(c,40,330,t,{...p,width:Math.min(p.width,880)})}}),
});
