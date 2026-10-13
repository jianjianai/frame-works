// Dark social-app controls in the same 600×1280 coordinates as phone.ts.
// Copy and drawing data belong to the calling film; these controls have no animation clock.
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { Ctx, F, loadFonts, measure, rr, text } from "./draw";

export const socialIconNames = ["back", "chevron", "more", "search", "close", "plus", "check", "lock", "globe", "pin", "image", "share", "bookmark", "at", "smile", "filter", "music", "shield"] as const;
export type SocialIconName = typeof socialIconNames[number];

/** Centre-anchored, font-independent UI icons. */
export function socialIcon(c: Ctx, kind: SocialIconName, x: number, y: number, size = 28, color = "#b1b2bc") {
  c.save();
  c.translate(x, y);
  c.scale(size / 32, size / 32);
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 2.2;
  c.lineCap = "round";
  c.lineJoin = "round";
  const line = (pts: number[][]) => {
    c.beginPath();
    pts.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py));
    c.stroke();
  };
  const circle = (px: number, py: number, r: number, fill = false) => {
    c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2); fill ? c.fill() : c.stroke();
  };
  switch (kind) {
    case "back": line([[5,-12],[-7,0],[5,12]]); break;
    case "chevron": line([[-4,-9],[5,0],[-4,9]]); break;
    case "more": [-10,0,10].forEach(px => circle(px,0,1.8,true)); break;
    case "close": line([[-8,-8],[8,8]]); line([[8,-8],[-8,8]]); break;
    case "plus": line([[-10,0],[10,0]]); line([[0,-10],[0,10]]); break;
    case "check": line([[-10,0],[-3,7],[11,-8]]); break;
    case "search": circle(-3,-3,9); line([[4,4],[12,12]]); break;
    case "lock":
      rr(c,-10,-1,20,16,3); c.stroke();
      c.beginPath(); c.arc(0,-2,7,Math.PI,Math.PI*2); c.stroke();
      line([[0,5],[0,9]]); break;
    case "globe":
      circle(0,0,13);
      c.beginPath(); c.ellipse(0,0,6,13,0,0,Math.PI*2); c.stroke();
      line([[-12,-4],[12,-4]]); line([[-12,4],[12,4]]); break;
    case "pin":
      c.beginPath(); c.moveTo(0,15);
      c.bezierCurveTo(-4,9,-12,2,-12,-4);
      c.arc(0,-4,12,Math.PI,0); c.bezierCurveTo(12,2,4,9,0,15); c.stroke();
      circle(0,-4,4); break;
    case "image":
      rr(c,-14,-12,28,24,4); c.stroke(); circle(-6,-4,2.2);
      line([[-12,8],[-3,-1],[3,5],[7,1],[13,8]]); break;
    case "share":
      line([[-12,10],[-12,3]]);
      c.beginPath(); c.moveTo(-12,3); c.quadraticCurveTo(-9,-7,6,-7); c.stroke();
      line([[2,-12],[12,-5],[2,2]]); line([[12,5],[12,12],[-12,12]]); break;
    case "bookmark": line([[-9,-13],[9,-13],[9,13],[0,7],[-9,13],[-9,-13]]); break;
    case "at":
      circle(0,0,5);
      c.beginPath(); c.arc(0,0,13,0.3,Math.PI*2-0.4); c.stroke();
      line([[5,-6],[5,6],[9,6],[12,2]]); break;
    case "smile":
      circle(0,0,13); circle(-4,-3,1.2,true); circle(4,-3,1.2,true);
      c.beginPath(); c.arc(0,0,7,0.25,Math.PI-0.25); c.stroke(); break;
    case "filter":
      line([[-12,-7],[12,-7]]); line([[-9,1],[9,1]]); line([[-5,9],[5,9]]); break;
    case "music":
      line([[-5,8],[-5,-10],[10,-13],[10,5]]); line([[-4,-5],[9,-8]]);
      c.beginPath(); c.ellipse(-9,9,5,3.5,-0.3,0,Math.PI*2); c.fill();
      c.beginPath(); c.ellipse(6,6,5,3.5,-0.3,0,Math.PI*2); c.fill(); break;
    case "shield":
      c.beginPath(); c.moveTo(0,-14); c.lineTo(12,-9); c.lineTo(11,3);
      c.quadraticCurveTo(8,12,0,16); c.quadraticCurveTo(-8,12,-11,3);
      c.lineTo(-12,-9); c.closePath(); c.stroke();
      line([[-5,0],[-1,5],[6,-4]]); break;
  }
  c.restore();
}

/** Rounded action button; the label always fits its available width. */
export function socialButton(c: Ctx, x: number, y: number, w: number, h: number, label: string, o: { fill?: string; color?: string; size?: number; radius?: number; icon?: SocialIconName; border?: string } = {}) {
  c.save();
  c.fillStyle = o.fill ?? "#292a34";
  rr(c,x,y,w,h,o.radius ?? 12); c.fill();
  if(o.border) { c.strokeStyle=o.border; c.lineWidth=1; c.stroke(); }
  const fs = o.size ?? 26;
  const available = w - 24 - (o.icon ? 30 : 0);
  const fitted = Math.min(fs, fs * available / Math.max(1, measure(c,label,fs,F.ui,500)));
  const tw=measure(c,label,fitted,F.ui,500);
  const total=tw+(o.icon ? 34 : 0);
  if(o.icon) socialIcon(c,o.icon,x+(w-total)/2+12,y+h/2,23,o.color??"#eeeef3");
  text(c,label,x+w/2+(o.icon?17:0),y+h/2,{size:fitted,font:F.ui,weight:500,fill:o.color??"#eeeef3"});
  c.restore();
}

/** Home gesture indicator, with optional safe-area background. */
export function socialHomeBar(c: Ctx, o: { color?: string; background?: string } = {}) {
  c.save();
  if(o.background) { c.fillStyle=o.background; c.fillRect(0,1226,600,54); }
  c.fillStyle=o.color??"rgba(255,255,255,0.75)";
  rr(c,206,1252,188,6,3); c.fill();
  c.restore();
}

const iconOptions = z.object({
  kind:z.enum(socialIconNames).default("image").describe("图标"),
  color:z.string().default("#c9cad3").describe("颜色"),
  size:z.number().min(16).max(160).default(96).describe("尺寸"),
});
export const resources = defineResources({
  socialIcon: resource({
    kind:"ui",title:"深色社交界面图标",description:"返回、更多、搜索、图片、权限、转发等手绘手机用的线性控件。图形绘制，不依赖字体符号。",tags:["手机","图标","导航","深色"],
    usage:'socialIcon(ctx, "search", x, y, size, color)',params:iconOptions,
    preview:{width:240,height:200,background:"#14151d",draw(c,_t,p){socialIcon(c,p.kind,120,100,p.size,p.color);}},
  }),
  socialButton: resource({
    kind:"ui",title:"社交界面操作按钮",description:"支持图标、背景、描边和文字自动适宽的按钮。",tags:["手机","按钮","发布","关注"],
    usage:'socialButton(ctx, x, y, w, h, label, { fill, icon, size })',
    params:z.object({label:z.string().default("关注").describe("文字"),accent:z.string().default("#fe2c55").describe("底色")}),
    preview:{width:360,height:140,background:"#14151d",prepare:loadFonts,draw(c,_t,p){socialButton(c,32,30,296,80,p.label,{fill:p.accent,icon:"plus",size:30});}},
  }),
  socialHomeBar: resource({
    kind:"ui",title:"手机底部手势条",description:"600×1280 屏幕底部安全区和手势条。",tags:["手机","导航","手势"],
    usage:"socialHomeBar(ctx, { background, color })",params:z.object({color:z.string().default("#eeeef3").describe("颜色")}),
    preview:{width:600,height:100,background:"#14151d",draw(c,_t,p){c.save();c.translate(0,-1190);socialHomeBar(c,{color:p.color});c.restore();}},
  }),
});
