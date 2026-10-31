// B 站封面「海报」几版（stills/B站封面-千线.ts 等，4:3 1440×1080）共用的画法；这里不导出 createScene（不是静帧本身）。
// 2026-10-31 用户看了五版截成片的封面：「都不太行……要求具有美感和神秘感，点击率最高」，文案定为「城里人都说，她是最沉的人」。
// 这几版不截成片，按海报自己构图：人物用和成片同一套骨架（秤砣、路人），往上飘的人、红绳、光晕照成片的画法（lib/world.ts、
// lib/net.ts），天、强光、打光、字在这里画。规格同 B站封面画法.ts：手机首页 4:3 整张，别处多数居中裁成 16:9（y 135–945），
// 字和主角的脸放在 16:9 那一条里，左下角盖播放数和弹幕数、右下角盖时长。
import { type CastSpec, castJoints, drawCast, lookOf } from "@materials/剪纸角色/code/cast";
import { type ChengtuoOptions, chengtuoPose, drawChengtuo, figurePose, jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { assetUrl } from "@frame/engine/types";
import { rope } from "../lib/net";
import { INK, drawGlow, drawSilhouette } from "../lib/world";

export type V2 = [number, number];
type FigureOptions = NonNullable<Parameters<typeof figurePose>[0]>;
type PoseIn = ReturnType<typeof figurePose>;

// ———————————————————————— 字 ————————————————————————
/** 封面的字：思源宋体粗体，只截了「城里人都说，她是最沉的人」这几个字也够用的子集（成片设定字那个文件，不加字） */
const FONT = { family: "PosterSerif", file: "films/work-3d80f743/fonts/NotoSerifSC-Bold-subset.woff2" };
let fontLoad: Promise<void> | null = null;
export const loadPosterFont = () =>
  (fontLoad ??= new FontFace(FONT.family, `url(${assetUrl(FONT.file)})`, { weight: "700" }).load().then((face) => void document.fonts.add(face)));

export type Line = {
  text: string;
  /** 关键词（换色） */
  accent?: string;
  x: number;
  y: number;
  size: number;
  /** 字距（字高的几分之几） */
  tracking?: number;
  /** 对齐：中心在 x（默认）、从 x 起往右 */
  align?: "center" | "left";
  color?: string;
  accentColor?: string;
  /** 字后面的晕：颜色、浓淡（0 不要） */
  halo?: string;
  haloAlpha?: number;
};

/** 一行字。k：封面 1 像素是画布的几像素（晕按它放大） */
export function posterLine(g: CanvasRenderingContext2D, k: number, l: Line) {
  const { text, accent = "", x, y, size, tracking = 0.06, align = "center", color = "#fff3e2", accentColor = "#f5ae45", halo = "20,10,30", haloAlpha = 0.85 } = l;
  g.save();
  g.font = `700 ${size}px ${FONT.family}, "Noto Serif SC", serif`;
  g.textBaseline = "middle";
  g.textAlign = "left";
  const spacing = size * tracking;
  const chars = [...text];
  const widths = chars.map((ch) => g.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  const hot0 = accent ? text.indexOf(accent) : -1;
  let px = align === "center" ? x - total / 2 : x;
  const glyphs = chars.map((ch, i) => {
    const glyph = { ch, x: px, hot: hot0 >= 0 && i >= hot0 && i < hot0 + accent.length };
    px += widths[i] + spacing;
    return glyph;
  });
  if (haloAlpha > 0) {
    g.shadowColor = `rgba(${halo},${haloAlpha})`;
    for (const blur of [size * 0.55, size * 0.18]) {
      g.shadowBlur = blur * k;
      for (const { ch, x: gx, hot } of glyphs) {
        g.fillStyle = hot ? accentColor : color;
        g.fillText(ch, gx, y);
      }
    }
    g.shadowBlur = 0;
  }
  for (const { ch, x: gx, hot } of glyphs) {
    g.fillStyle = hot ? accentColor : color;
    g.fillText(ch, gx, y);
  }
  g.restore();
  return total;
}

// ———————————————————————— 天和光 ————————————————————————
/** 竖着的渐变铺满 rect：stops 是 [0..1, 颜色] */
export function vertical(g: CanvasRenderingContext2D, rect: [number, number, number, number], stops: [number, string][]) {
  const gr = g.createLinearGradient(0, rect[1], 0, rect[1] + rect[3]);
  for (const [k, c] of stops) gr.addColorStop(k, c);
  g.fillStyle = gr;
  g.fillRect(...rect);
}

/** 一团径向的光（screen 叠）：中心 (x, y)，半径 r，stops 是 [0..1, 颜色]；sy 压扁 */
export function radial(g: CanvasRenderingContext2D, x: number, y: number, r: number, stops: [number, string][], op: GlobalCompositeOperation = "screen", sy = 1) {
  g.save();
  g.globalCompositeOperation = op;
  g.translate(x, y);
  g.scale(1, sy);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
  for (const [k, c] of stops) gr.addColorStop(k, c);
  g.fillStyle = gr;
  g.fillRect(-r, -r, 2 * r, 2 * r);
  g.restore();
}

/** 天上的强光：一团白、一圈很淡的彩虹（成片里白下面那一圈眩光），往下打几道斜光 */
export function whiteLight(g: CanvasRenderingContext2D, x: number, y: number, r: number, a = 1) {
  radial(g, x, y, r * 1.9, [
    [0, `rgba(235,228,255,${0.5 * a})`],
    [0.4, `rgba(170,160,230,${0.22 * a})`],
    [1, "rgba(120,110,200,0)"],
  ]);
  radial(g, x, y, r, [
    [0, `rgba(255,255,252,${a})`],
    [0.35, `rgba(255,252,246,${0.95 * a})`],
    [0.6, `rgba(240,232,255,${0.55 * a})`],
    [1, "rgba(220,210,255,0)"],
  ]);
  // 彩虹圈：只是一层很淡的色，贴着白的边
  g.save();
  g.globalCompositeOperation = "screen";
  const ring = r * 0.98;
  const cols = ["255,120,120", "255,200,120", "250,250,150", "140,230,170", "130,180,255", "190,140,255"];
  cols.forEach((c, i) => {
    g.beginPath();
    g.arc(x, y, ring + i * r * 0.035, 0, Math.PI * 2);
    g.strokeStyle = `rgba(${c},${0.045 * a})`;
    g.lineWidth = r * 0.03;
    g.stroke();
  });
  g.restore();
}

/** 天上的白（成片 drawWhite 的样子，按封面坐标）：下沿 y0 上下起伏的一条，以上是发光的白；下沿一层肥皂泡一样的彩光，
 *  往下一片柔和的眩光和几根斜的光柱。amp 起伏多大，glare 眩光往下多远，cols 光柱 [x, 宽]；fillOnly 只铺白（暗角以后再铺一遍），
 *  w 封面的设计宽 */
export function whiteCeiling(g: CanvasRenderingContext2D, y0: number, glare: number, amp = 1, cols: [number, number][] = [], fillOnly = false, w = 1440) {
  const edge = (x: number) => y0 + amp * (16 * Math.sin(x / 260 + 0.6) + 9 * Math.sin(x / 95 - 0.9));
  const path = new Path2D();
  path.moveTo(-20, -200);
  for (let x = -20; x <= w + 20; x += 8) path.lineTo(x, edge(x));
  path.lineTo(w + 20, -200);
  path.closePath();
  if (fillOnly) {
    g.fillStyle = "#fffefb";
    g.fill(path);
    return edge;
  }
  g.save();
  g.globalCompositeOperation = "screen";
  const gr = g.createLinearGradient(0, y0, 0, y0 + glare);
  gr.addColorStop(0, "rgba(255,252,246,0.75)");
  gr.addColorStop(0.12, "rgba(250,244,255,0.34)");
  gr.addColorStop(0.45, "rgba(230,224,255,0.09)");
  gr.addColorStop(1, "rgba(230,224,255,0)");
  g.fillStyle = gr;
  g.fillRect(-10, y0 - 40, w + 20, glare + 40);
  for (const [x, w] of cols) {
    const ray = g.createLinearGradient(0, y0, 0, y0 + glare * 0.85);
    ray.addColorStop(0, "rgba(255,250,240,0.13)");
    ray.addColorStop(1, "rgba(255,250,240,0)");
    g.fillStyle = ray;
    g.beginPath();
    g.moveTo(x, y0);
    g.lineTo(x + w, y0);
    g.lineTo(x + w * 2.2 + 140, y0 + glare * 0.85);
    g.lineTo(x + 140, y0 + glare * 0.85);
    g.closePath();
    g.fill();
  }
  g.restore();
  // 下沿的彩光：一道道细的叠在一起，模糊成一片
  g.save();
  g.lineJoin = "round";
  const band = 16;
  [330, 30, 55, 150, 195, 255].forEach((hue, i) => {
    g.save();
    g.translate(0, band * (0.3 + 0.6 * i));
    for (const [kw, ka] of [[2.4, 0.45], [1.5, 0.75], [0.8, 1]] as const) {
      g.strokeStyle = `hsla(${hue}, 82%, 84%, ${0.12 * ka})`;
      g.lineWidth = band * kw;
      g.stroke(path);
    }
    g.restore();
  });
  g.restore();
  g.fillStyle = "#fffefb";
  g.fill(path);
  // 白里面几团很淡的虹彩（成片里离白近时也是这样，像肥皂泡）
  g.save();
  g.clip(path);
  const r = seeded(5);
  for (let i = 0; i < 8; i++) {
    const x = r() * w;
    const y = y0 - 30 - r() * 160;
    const rad = 140 + r() * 220;
    const hue = Math.floor(r() * 360);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `hsla(${hue}, 85%, 88%, 0.35)`);
    gr.addColorStop(1, `hsla(${hue}, 85%, 92%, 0)`);
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.restore();
  return edge;
}

/** 从 (x, y) 往下打的几道光：angles 是相对竖直往下的角度（度），每道宽 w 度 */
export function rays(g: CanvasRenderingContext2D, x: number, y: number, len: number, beams: [number, number, number][], tint = "235,228,255") {
  g.save();
  g.globalCompositeOperation = "screen";
  for (const [deg, w, a] of beams) {
    const t0 = ((90 + deg - w / 2) * Math.PI) / 180;
    const t1 = ((90 + deg + w / 2) * Math.PI) / 180;
    const gr = g.createRadialGradient(x, y, 0, x, y, len);
    gr.addColorStop(0, `rgba(${tint},${a})`);
    gr.addColorStop(0.6, `rgba(${tint},${a * 0.35})`);
    gr.addColorStop(1, `rgba(${tint},0)`);
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(x, y);
    g.arc(x, y, len, t0, t1);
    g.closePath();
    g.fill();
  }
  g.restore();
}

/** 远处往上飘的人（逆光的小剪影，成片的 drawSilhouette）加一点头上的光 */
export function silhouette(g: CanvasRenderingContext2D, x: number, y: number, h: number, ph: number, alpha: number, col: string, glow = 0.5) {
  drawSilhouette(g, x, y, h, 0.6, ph, alpha, col);
  drawGlow(g, x, y - h * 0.26, h * 0.45, glow * alpha);
}

/** 一串伪随机数（同一个 seed 每次一样） */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ———————————————————————— 人 ————————————————————————
/** 画在一张单独画布上的人，好整体打光：tint 整个人蒙一层夜色（远近、背光），shade 从 top 到 bottom 越往下越暗（脚下没有光），
 *  rim 迎光那一侧一道细的亮边（人的形状减去往背光方向 dir 挪一点的自己），aura 背后一圈虚的光（逆光的晕：颜色、浓淡、虚多少） */
export type Light = { tint?: [string, number]; shade?: [string, number]; top?: number; bottom?: number; rim?: [string, number]; dir?: V2; aura?: [string, number, number] };

export function litFigure(g: CanvasRenderingContext2D, k: number, paint: (h: CanvasRenderingContext2D) => void, light: Light) {
  const cw = g.canvas.width;
  const ch = g.canvas.height;
  const layer = () => {
    const c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    return [c, c.getContext("2d")!] as const;
  };
  const [fig, f] = layer();
  f.setTransform(k, 0, 0, k, 0, 0);
  paint(f);
  f.setTransform(1, 0, 0, 1, 0, 0);
  // 人的形状（不透明的地方），后面几层都按它来
  const [mask, m] = layer();
  m.drawImage(fig, 0, 0);
  m.globalCompositeOperation = "source-in";
  m.fillStyle = "#fff";
  m.fillRect(0, 0, cw, ch);
  if (light.tint) {
    f.globalCompositeOperation = "source-atop";
    f.globalAlpha = light.tint[1];
    f.fillStyle = light.tint[0];
    f.fillRect(0, 0, cw, ch);
    f.globalAlpha = 1;
  }
  if (light.shade) {
    const [sh, s] = layer();
    const gr = s.createLinearGradient(0, (light.top ?? 0) * k, 0, (light.bottom ?? 1080) * k);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(1, light.shade[0]);
    s.fillStyle = gr;
    s.fillRect(0, 0, cw, ch);
    s.globalCompositeOperation = "destination-in";
    s.drawImage(mask, 0, 0);
    f.globalCompositeOperation = "multiply";
    f.globalAlpha = light.shade[1];
    f.drawImage(sh, 0, 0);
    f.globalAlpha = 1;
    // multiply 会把人外面也乘上白（不变），再按形状裁一次保险
    f.globalCompositeOperation = "destination-in";
    f.drawImage(mask, 0, 0);
  }
  f.globalCompositeOperation = "source-over";
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (light.aura) {
    const [col, a, blur] = light.aura;
    const [au, u] = layer();
    u.drawImage(mask, 0, 0);
    u.globalCompositeOperation = "source-in";
    u.fillStyle = col;
    u.fillRect(0, 0, cw, ch);
    g.globalCompositeOperation = "screen";
    g.globalAlpha = a;
    g.filter = `blur(${Math.max(1, Math.round(blur * k))}px)`;
    g.drawImage(au, 0, 0);
    g.filter = "none";
    g.globalAlpha = 1;
    g.globalCompositeOperation = "source-over";
  }
  g.drawImage(fig, 0, 0);
  if (light.rim) {
    const [dx, dy] = light.dir ?? [0, 2];
    const [rim, r] = layer();
    r.drawImage(mask, 0, 0);
    r.globalCompositeOperation = "destination-out";
    r.drawImage(mask, dx * k, dy * k);
    r.globalCompositeOperation = "source-in";
    r.fillStyle = light.rim[0];
    r.fillRect(0, 0, cw, ch);
    g.globalCompositeOperation = "screen";
    g.globalAlpha = light.rim[1];
    g.filter = `blur(${Math.max(1, Math.round(0.8 * k))}px)`;
    g.drawImage(rim, 0, 0);
    g.filter = "none";
  }
  g.restore();
}

/** 光里的浮尘：n 颗小光点，集中在 (x, y) 附近 r 以内（越靠近越密） */
export function motes(g: CanvasRenderingContext2D, x: number, y: number, r: number, n: number, seed: number, a = 0.8) {
  const rnd = seeded(seed);
  g.save();
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) {
    const ang = rnd() * Math.PI * 2;
    const d = Math.pow(rnd(), 0.6) * r;
    const px = x + Math.cos(ang) * d;
    const py = y + Math.sin(ang) * d * 0.8;
    const s = 1 + rnd() * 2.6;
    const al = a * (0.25 + 0.75 * rnd()) * (1 - d / r);
    const gr = g.createRadialGradient(px, py, 0, px, py, s * 3);
    gr.addColorStop(0, `rgba(255,248,236,${al})`);
    gr.addColorStop(1, "rgba(255,240,220,0)");
    g.fillStyle = gr;
    g.fillRect(px - s * 3, py - s * 3, s * 6, s * 6);
  }
  g.restore();
}

/** 碰到白、正在化成灰的人：一小团往四下散的光点和一圈很淡的彩光（成片 drawBurst 的意思），中心 (x, y)，大小 r */
export function dissolve(g: CanvasRenderingContext2D, x: number, y: number, r: number, seed: number) {
  radial(g, x, y, r * 1.6, [
    [0, "rgba(255,250,240,0.55)"],
    [0.4, "rgba(240,220,255,0.18)"],
    [1, "rgba(240,220,255,0)"],
  ]);
  g.save();
  g.globalCompositeOperation = "screen";
  ["255,150,170", "255,220,150", "150,230,200", "160,190,255"].forEach((c, i) => {
    g.beginPath();
    g.arc(x, y, r * (0.75 + i * 0.09), 0, Math.PI * 2);
    g.strokeStyle = `rgba(${c},0.16)`;
    g.lineWidth = r * 0.07;
    g.stroke();
  });
  g.restore();
  motes(g, x, y + r * 0.2, r * 1.3, 26, seed, 0.95);
}

/** 暗角：四周压暗（multiply），中心 (x, y)，inner 以内不压、outer 以外压到 col；sy 压扁，W 封面的设计宽 */
export function vignette(g: CanvasRenderingContext2D, x: number, y: number, inner: number, outer: number, col: string, a: number, sy = 0.8, W = 1440) {
  const c = document.createElement("canvas");
  c.width = g.canvas.width;
  c.height = g.canvas.height;
  const h = c.getContext("2d")!;
  const k = c.width / W;
  h.setTransform(k, 0, 0, k, 0, 0);
  h.fillStyle = col;
  h.fillRect(-10, -10, c.width / k + 20, c.height / k + 20);
  h.globalCompositeOperation = "destination-out";
  h.translate(x, y);
  h.scale(1, sy);
  const gr = h.createRadialGradient(0, 0, inner, 0, 0, outer);
  gr.addColorStop(0, "rgba(0,0,0,1)");
  gr.addColorStop(1, "rgba(0,0,0,0)");
  h.fillStyle = gr;
  h.fillRect(-3000, -3000, 6000, 6000);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "multiply";
  g.globalAlpha = a;
  g.drawImage(c, 0, 0);
  g.restore();
}

/** 夜里远处的城：几层楼的剪影，一层比一层近、一层比一层暗，层和层之间一层雾；楼顶上有水箱、天线，零星亮着暖色的窗。
 *  layers：[地平线 y、最矮、最高、颜色、亮窗的多少、上面那层雾的颜色（没有就 null）]；width 封面的设计宽，bottom 楼画到多低 */
export function skyline(g: CanvasRenderingContext2D, seed: number, layers: [number, number, number, string, number, string | null][], width = 1440, bottom = 1200) {
  const r = seeded(seed);
  for (const [base, hMin, hMax, col, win, haze] of layers) {
    let x = -30 - r() * 40;
    while (x < width + 30) {
      const w = 50 + r() * 130;
      const h = hMin + r() * (hMax - hMin);
      const top = base - h;
      g.fillStyle = col;
      g.fillRect(x, top, w + 1, bottom - top);
      // 楼顶：水箱或天线
      const roof = r();
      if (roof < 0.3) {
        const tw = 16 + r() * 18;
        const tx = x + 8 + r() * (w - tw - 16);
        g.fillRect(tx, top - 22, tw, 16);
        g.fillRect(tx + 3, top - 8, 3, 8);
        g.fillRect(tx + tw - 6, top - 8, 3, 8);
      } else if (roof < 0.5) {
        const ax = x + 10 + r() * (w - 20);
        g.fillRect(ax, top - 34 - r() * 20, 2, 60);
        g.fillRect(ax - 8, top - 24, 18, 2);
      }
      // 窗
      for (let y = top + 14; y < base + 40; y += 22) {
        for (let wx = x + 9; wx < x + w - 12; wx += 17) {
          if (r() < win) {
            const warm = 180 + Math.floor(r() * 50);
            g.fillStyle = `rgba(255,${warm},${110 + Math.floor(r() * 60)},${0.45 + r() * 0.4})`;
            g.fillRect(wx, y, 7, 9);
            g.fillStyle = col;
          }
        }
      }
      x += w + r() * 6;
    }
    if (haze) vertical(g, [0, base - 260, width, 300], [
      [0, "rgba(0,0,0,0)"],
      [1, haze],
    ]);
  }
}

/** 胶片颗粒：一张小的噪点图平铺，overlay 叠一层很淡的（缩成小图看不见，大图上把平涂的色块揉在一起） */
let NOISE: HTMLCanvasElement | null = null;
export function grain(g: CanvasRenderingContext2D, a = 0.06) {
  if (!NOISE) {
    NOISE = document.createElement("canvas");
    NOISE.width = NOISE.height = 256;
    const n = NOISE.getContext("2d")!;
    const img = n.createImageData(256, 256);
    const rnd = seeded(99);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.floor(rnd() * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    n.putImageData(img, 0, 0);
  }
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "overlay";
  g.globalAlpha = a;
  g.fillStyle = g.createPattern(NOISE, "repeat")!;
  g.fillRect(0, 0, g.canvas.width, g.canvas.height);
  g.restore();
}

/** 主角：(x, y) 两脚之间的地面，s = 1 时全身约 590 高。返回她的姿势和关节在封面上的位置 */
export function heroine(options: ChengtuoOptions, t = 0.3) {
  const pose = chengtuoPose(options, t);
  const j = jointsOf(pose);
  return {
    pose,
    at: (x: number, y: number, s: number, name: keyof typeof j): V2 => [x + j[name][0] * s, y + j[name][1] * s],
    draw: (h: CanvasRenderingContext2D, x: number, y: number, s: number) => {
      h.save();
      h.translate(x, y);
      h.scale(s, s);
      drawChengtuo(h, pose, { line: 1 / Math.sqrt(Math.max(0.35, s)) });
      h.restore();
    },
  };
}

/** 配角 / 路人（往上飘的人）：同上，s 是在封面上的倍数（再乘这个人自己的身高） */
export function person(spec: CastSpec, options: FigureOptions, t = 0.3) {
  const pose: PoseIn = figurePose(options, t, lookOf(spec));
  const j = castJoints(spec, pose);
  return {
    pose,
    at: (x: number, y: number, s: number, name: keyof typeof j): V2 => [x + j[name][0] * s, y + j[name][1] * s],
    draw: (h: CanvasRenderingContext2D, x: number, y: number, s: number) => {
      h.save();
      h.translate(x, y);
      h.scale(s, s);
      drawCast(h, spec, pose, { line: 1 / Math.sqrt(Math.max(0.3, s)) });
      h.restore();
    },
  };
}

/** 往上飘的人的姿势（成片里的样子：仰着脸、两只手往上张开、腿软软地垂着、脚尖朝下，头发漂起来）；face 朝向，sway 左右不一样 */
export function floatPose(face: number, sway: number, expression: FigureOptions["expression"] = "闭眼"): FigureOptions {
  return {
    face,
    ground: false,
    float: 0.7,
    neck: 22,
    lean: -4,
    expression,
    sad: 0.6,
    shoulderL: 150 + 12 * sway,
    elbowL: 18,
    wristL: 10,
    handL: "open",
    shoulderR: 162 - 10 * sway,
    elbowR: 12,
    wristR: 6,
    handR: "open",
    hipL: -6 + 4 * sway,
    kneeL: -18,
    ankleL: -44,
    hipR: 10 - 4 * sway,
    kneeR: -26,
    ankleR: -40,
  };
}

/** 一根红绳（成片 rope 的样子：外面一圈淡淡的红光、深色描边、红芯，但可以更细），from → to 中间稍微垂一点（sag 往下垂多少） */
export function thread(g: CanvasRenderingContext2D, from: V2, to: V2, px: number, sag = 0, ink = true, glow = 1) {
  const path = new Path2D();
  path.moveTo(...from);
  path.quadraticCurveTo((from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + sag, ...to);
  g.save();
  g.lineCap = "round";
  if (glow > 0) {
    g.globalCompositeOperation = "lighter";
    g.strokeStyle = `rgba(255,70,60,${0.16 * glow})`;
    g.lineWidth = px * 4;
    g.stroke(path);
    g.globalCompositeOperation = "source-over";
  }
  if (ink) {
    g.strokeStyle = INK;
    g.lineWidth = px + Math.max(1.4, px * 0.7);
    g.stroke(path);
  }
  g.strokeStyle = "#e0443a";
  g.lineWidth = px;
  g.stroke(path);
  g.restore();
}

/** 成片的红绳（粗的那种，近处用） */
export const thickThread = (g: CanvasRenderingContext2D, pts: V2[], px: number) => rope(g, pts, 1, px, true, 1);
