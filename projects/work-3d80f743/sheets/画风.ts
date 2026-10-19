// 画风样张（不在时间轴上）：暖光电影感——真实的老城区（六层居民楼、防盗窗、空调外机、晾衣杆、电线、梧桐），
// 傍晚的暖光从左上斜着照进来，空气里飘着发亮的浮尘（灰），天顶是发光的「白」。好看、有生活感，不压抑也不幼稚。
// 人物用素材库「剪纸角色」（深色描边、平涂、右下一道阴影）；近处的东西同样描边，远处的楼只留剪影，被暖色的空气冲淡。

import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { seeded } from "@frame/engine/math";
import { CAST, castJoints, drawCast, lookOf, passerby } from "@materials/剪纸角色/code/cast";
import { POSES, chengtuo, figurePose, legL, legR } from "@materials/剪纸角色/code/chengtuo";

export const sample: Sample = { duration: 4 };

const W = 1080;
const H = 1920;
const INK = "#2b2630";
const GROUND = 1600;

type P = [number, number];

/** 平涂 + 右下一道阴影 + 描边（和人物同一种画法）；lw = 0 不描边 */
function part(g: CanvasRenderingContext2D, path: Path2D, fill: string, shade: string | null, lw = 3.2, off: P = [8, 6]) {
  g.fillStyle = fill;
  g.fill(path);
  if (shade) {
    g.save();
    g.clip(path);
    g.fillStyle = shade;
    g.fill(path);
    g.translate(-off[0], -off[1]);
    g.fillStyle = fill;
    g.fill(path);
    g.restore();
  }
  if (lw > 0) {
    g.strokeStyle = INK;
    g.lineWidth = lw;
    g.lineJoin = "round";
    g.lineCap = "round";
    g.stroke(path);
  }
}

const rect = (x: number, y: number, w: number, h: number) => {
  const p = new Path2D();
  p.rect(x, y, w, h);
  return p;
};

interface Block {
  x: number;
  w: number;
  floors: number;
  wall: string;
  wallShade: string;
  seed: number;
}

/**
 * 一栋老居民楼：每层两户，窗外是凸出来的防盗窗（片子里叫防飘栏），有的挂空调外机、伸出晾衣杆晾着衣服、摆着花盆。
 * detail 0 只画剪影（远处），lw 描边粗细（远处 0）。
 */
function block(g: CanvasRenderingContext2D, b: Block, ground: number, detail: number, lw: number) {
  const fh = 128;
  const top = ground - b.floors * fh - 60;
  const body = rect(b.x, top, b.w, ground - top + 400);
  if (detail > 0) {
    g.save();
    g.translate(10, 8);
    g.fillStyle = "rgba(70,40,40,0.16)";
    g.fill(body);
    g.restore();
  }
  part(g, body, b.wall, b.wallShade, lw, [14, 10]);
  // 楼顶：女儿墙、水箱
  const r = seeded(b.seed);
  const tank = rect(b.x + b.w * (0.2 + r() * 0.5), top - 70, 90, 70);
  part(g, tank, b.wallShade, null, lw);
  if (detail === 0) {
    // 远处：只有一格格窗的影子
    g.fillStyle = "rgba(120,90,100,0.18)";
    for (let f = 0; f < b.floors; f++) for (let x = b.x + 24; x < b.x + b.w - 40; x += 70) g.fillRect(x, top + 60 + f * fh, 36, 50);
    return;
  }
  const units = Math.max(2, Math.round(b.w / 150));
  const uw = (b.w - 40) / units;
  for (let f = 0; f < b.floors; f++) {
    const y = top + 70 + f * fh;
    // 楼层之间一道线
    g.strokeStyle = "rgba(43,38,48,0.25)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(b.x, y - 14);
    g.lineTo(b.x + b.w, y - 14);
    g.stroke();
    for (let i = 0; i < units; i++) {
      const wx = b.x + 20 + uw * i + uw * 0.18;
      const ww = uw * 0.64;
      const wh = 74;
      const kind = r();
      // 窗（傍晚有几扇亮着暖灯）
      const lit = r() < 0.18;
      part(g, rect(wx, y, ww, wh), lit ? "#ffd99a" : "#7f8796", lit ? "#f4c27a" : "#6c7382", lw * 0.8, [5, 5]);
      // 防盗窗：凸出来的铁笼
      if (kind < 0.7) {
        const cage = rect(wx - 8, y - 8, ww + 16, wh + 22);
        g.strokeStyle = INK;
        g.lineWidth = lw * 0.9;
        g.stroke(cage);
        g.lineWidth = lw * 0.55;
        g.beginPath();
        for (let k = 1; k < 6; k++) {
          const bx = wx - 8 + ((ww + 16) * k) / 6;
          g.moveTo(bx, y - 8);
          g.lineTo(bx, y + wh + 14);
        }
        g.stroke();
        part(g, rect(wx - 12, y + wh + 12, ww + 24, 10), "#a39a96", null, lw * 0.7);
        // 花盆
        if (r() < 0.45) {
          const pot = new Path2D();
          pot.moveTo(wx + 6, y + wh + 12);
          pot.lineTo(wx + 34, y + wh + 12);
          pot.lineTo(wx + 30, y + wh - 12);
          pot.lineTo(wx + 10, y + wh - 12);
          pot.closePath();
          part(g, pot, "#c77b5a", null, lw * 0.6);
          const leaf = new Path2D();
          leaf.ellipse(wx + 20, y + wh - 26, 22, 16, 0, 0, Math.PI * 2);
          part(g, leaf, "#7e9b62", "#6a8652", lw * 0.6, [4, 3]);
        }
      }
      // 空调外机
      if (kind > 0.55 && i === units - 1) {
        const ac = rect(wx + ww + 14, y + 26, 58, 44);
        part(g, ac, "#e9e4dc", "#d6cfc4", lw * 0.8, [4, 4]);
        g.strokeStyle = INK;
        g.lineWidth = lw * 0.5;
        g.beginPath();
        g.arc(wx + ww + 43, y + 48, 14, 0, Math.PI * 2);
        g.stroke();
      }
      // 晾衣杆：伸出来，挂着几件衣服
      if (kind > 0.78) {
        const py = y - 2;
        g.strokeStyle = INK;
        g.lineWidth = lw * 0.7;
        g.beginPath();
        g.moveTo(wx + ww, py);
        g.lineTo(wx + ww + 120, py - 6);
        g.stroke();
        const colors = ["#e8eef3", "#d77f6a", "#8fb2c9", "#f2d38a"];
        for (let k = 0; k < 3; k++) {
          const cx = wx + ww + 18 + k * 34;
          const cloth = new Path2D();
          cloth.moveTo(cx, py - 2);
          cloth.lineTo(cx + 26, py - 3);
          cloth.lineTo(cx + 24, py + 40 + (k % 2) * 10);
          cloth.lineTo(cx + 2, py + 42);
          cloth.closePath();
          part(g, cloth, colors[(k + b.seed) % 4], null, lw * 0.6);
        }
      }
    }
  }
}

/** 一棵梧桐：几团叶子叠在一起，朝光的一边亮 */
function planeTree(g: CanvasRenderingContext2D, x: number, ground: number, s: number, t: number) {
  const trunk = new Path2D();
  trunk.moveTo(x - 16 * s, ground);
  trunk.lineTo(x - 10 * s, ground - 300 * s);
  trunk.lineTo(x - 50 * s, ground - 420 * s);
  trunk.lineTo(x - 34 * s, ground - 430 * s);
  trunk.lineTo(x + 2 * s, ground - 330 * s);
  trunk.lineTo(x + 40 * s, ground - 440 * s);
  trunk.lineTo(x + 54 * s, ground - 430 * s);
  trunk.lineTo(x + 14 * s, ground - 300 * s);
  trunk.lineTo(x + 18 * s, ground);
  trunk.closePath();
  part(g, trunk, "#b9a58d", "#9f8a72", 3.2, [6, 4]);
  const blobs: [number, number, number][] = [[-130, -520, 120], [10, -600, 140], [140, -510, 115], [-40, -450, 110], [80, -440, 100]];
  const sway = 4 * Math.sin(t * 0.7 + x);
  for (const [bx, by, r] of blobs) {
    const p = new Path2D();
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * s * (0.9 + 0.12 * Math.sin(i * 2.7 + bx));
      const px = x + bx * s + sway + Math.cos(a) * rr;
      const py = ground + by * s + Math.sin(a) * rr * 0.82;
      if (i === 0) p.moveTo(px, py);
      else p.quadraticCurveTo(x + bx * s + sway + Math.cos(a - Math.PI / n) * rr * 1.15, ground + by * s + Math.sin(a - Math.PI / n) * rr * 0.95, px, py);
    }
    p.closePath();
    part(g, p, "#93ac6a", "#7a9457", 3.2, [16, 12]);
    // 朝光（左上）的一侧暖亮
    g.save();
    g.clip(p);
    g.fillStyle = "rgba(255,228,150,0.45)";
    g.beginPath();
    g.arc(x + bx * s + sway - r * s * 0.45, ground + by * s - r * s * 0.4, r * s * 0.6, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}

/** 电线杆和两根电线（垂下来的弧） */
function wires(g: CanvasRenderingContext2D, x: number, ground: number, top: number) {
  part(g, rect(x - 9, top, 18, ground - top), "#8d8580", "#77706b", 3);
  part(g, rect(x - 60, top + 30, 120, 12), "#8d8580", null, 3);
  g.strokeStyle = INK;
  g.lineWidth = 2.4;
  for (const [dy, sag] of [[30, 120], [36, 170], [60, 90]] as const) {
    g.beginPath();
    g.moveTo(-40, top + dy + 60);
    g.quadraticCurveTo((x - 40) / 2, top + dy + sag, x - 50, top + dy);
    g.moveTo(x + 50, top + dy);
    g.quadraticCurveTo((x + W + 40) / 2, top + dy + sag, W + 40, top + dy - 40);
    g.stroke();
  }
}

/** 天顶的「白」：一片发光的白，边上一层很淡的彩光，往下是暖色的空气 */
function sky(g: CanvasRenderingContext2D, t: number) {
  const s = g.createLinearGradient(0, 0, 0, GROUND);
  s.addColorStop(0, "#ffffff");
  s.addColorStop(0.06, "#fffcf6");
  s.addColorStop(0.14, "#f7efe8");
  s.addColorStop(0.32, "#e9e3e2");
  s.addColorStop(0.62, "#f1d6c1");
  s.addColorStop(1, "#efc3a3");
  g.fillStyle = s;
  g.fillRect(0, 0, W, H);
  // 白的下沿：很淡的彩虹色，像肥皂泡的边
  const hues = [330, 35, 160, 200, 265];
  for (let i = 0; i < hues.length; i++) {
    g.strokeStyle = `hsla(${hues[i] + 12 * Math.sin(t * 0.8 + i)}, 75%, 82%, 0.36)`;
    g.lineWidth = 26;
    g.beginPath();
    for (let x = -20; x <= W + 20; x += 24) {
      const y = 96 + i * 18 + 12 * Math.sin(x / 210 + t * 0.5 + i * 0.5);
      if (x === -20) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
}

/** 远处往上飘的人：逆光的小剪影 */
function silhouette(g: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, ph: number) {
  g.save();
  g.translate(x, y);
  g.rotate(0.14 * Math.sin(t * 0.8 + ph));
  g.scale(s, s);
  g.fillStyle = "rgba(120,92,104,0.55)";
  g.strokeStyle = "rgba(120,92,104,0.55)";
  g.lineCap = "round";
  g.lineWidth = 12;
  g.beginPath();
  g.moveTo(-8, 40);
  g.lineTo(-14, 92);
  g.moveTo(8, 40);
  g.lineTo(12, 94);
  g.moveTo(-16, -6);
  g.lineTo(-48, -46);
  g.moveTo(16, -6);
  g.lineTo(48, -46);
  g.stroke();
  g.beginPath();
  g.roundRect(-20, -16, 40, 60, 12);
  g.fill();
  g.beginPath();
  g.ellipse(0, -46, 22, 30, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** 斜照进来的几道光 */
function sunbeams(g: CanvasRenderingContext2D, t: number) {
  g.save();
  g.globalCompositeOperation = "screen";
  const beams: [number, number, number][] = [[-500, 420, 0.13], [-60, 300, 0.09], [300, 260, 0.07]];
  for (const [x0, w, a] of beams) {
    const k = a * (0.85 + 0.15 * Math.sin(t * 0.6 + x0));
    const p = new Path2D();
    p.moveTo(x0, -100);
    p.lineTo(x0 + w, -100);
    p.lineTo(x0 + w + 1500, H);
    p.lineTo(x0 + 1500, H);
    p.closePath();
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, `rgba(255,236,200,${k})`);
    gr.addColorStop(1, "rgba(255,236,200,0)");
    g.fillStyle = gr;
    g.fill(p);
  }
  g.restore();
}

/** 光里的浮尘（灰）：小小的亮点，慢慢往下落，闪一闪 */
function motes(g: CanvasRenderingContext2D, t: number) {
  const r = seeded(17);
  g.save();
  g.globalCompositeOperation = "screen";
  for (let i = 0; i < 70; i++) {
    const x0 = r() * W;
    const y0 = r() * H;
    const v = 18 + r() * 36;
    const s = 1.6 + r() * 3.4;
    const y = (y0 + t * v) % H;
    const x = x0 + 20 * Math.sin(t * 0.6 + i);
    const tw = 0.4 + 0.6 * Math.max(0, Math.sin(t * 2.2 + i * 1.9));
    const gr = g.createRadialGradient(x, y, 0, x, y, s * 3);
    gr.addColorStop(0, `rgba(255,246,225,${0.9 * tw})`);
    gr.addColorStop(1, "rgba(255,246,225,0)");
    g.fillStyle = gr;
    g.fillRect(x - s * 3, y - s * 3, s * 6, s * 6);
  }
  g.restore();
}

function barbell(g: CanvasRenderingContext2D, x: number, y: number, rot: number) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  const bar = new Path2D();
  bar.roundRect(-200, -6, 400, 12, 6);
  part(g, bar, "#b9bdc4", null, 3);
  for (const s of [-1, 1]) {
    for (let k = 0; k < 2; k++) {
      const p = new Path2D();
      p.ellipse(s * (168 - k * 24), 0, 15, 54 - k * 10, 0, 0, Math.PI * 2);
      part(g, p, "#4d535f", "#3e434d", 3, [4, 4]);
    }
  }
  g.restore();
}

/** 纸纹：很淡的一层颗粒 */
function makeGrain() {
  const cv = document.createElement("canvas");
  cv.width = 540;
  cv.height = 960;
  const g = cv.getContext("2d")!;
  const img = g.createImageData(cv.width, cv.height);
  const r = seeded(3);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 128 + (r() - 0.5) * 34;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return cv;
}

export function createScene({ width, height }: SceneOptions): Scene {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  const grain = makeGrain();

  const far: Block[] = [];
  const mid: Block[] = [];
  {
    const r = seeded(9);
    for (let x = -80; x < W + 60; ) {
      const w = 180 + r() * 160;
      far.push({ x, w, floors: 3 + Math.floor(r() * 5), wall: "#ddc8c4", wallShade: "#d3bdb9", seed: Math.floor(r() * 99) });
      x += w + 20 + r() * 40;
    }
    for (let x = -120; x < W + 60; ) {
      const w = 260 + r() * 140;
      mid.push({ x, w, floors: 4 + Math.floor(r() * 3), wall: "#cfb9ae", wallShade: "#c3aca1", seed: Math.floor(r() * 99) });
      x += w + 40 + r() * 80;
    }
  }
  const near: Block[] = [
    { x: -60, w: 360, floors: 7, wall: "#e9d6bd", wallShade: "#dcc5a8", seed: 3 },
    { x: 770, w: 400, floors: 8, wall: "#d99f86", wallShade: "#c98b72", seed: 6 },
  ];

  return {
    canvas,
    render(t) {
      g.setTransform(width / W, 0, 0, height / H, 0, 0);
      sky(g, t);
      // 远处往上飘的人
      const fr = seeded(23);
      for (let i = 0; i < 6; i++) silhouette(g, 60 + fr() * 960, 200 + fr() * 260 - t * 14, 0.3 + fr() * 0.22, t, fr() * 6);
      // 远处的楼：剪影，被暖色的空气冲淡
      for (const b of far) block(g, b, GROUND - 260, 0, 0);
      g.fillStyle = "rgba(242,214,196,0.5)";
      g.fillRect(0, 0, W, GROUND);
      for (const b of mid) block(g, b, GROUND - 150, 0, 2.2);
      g.fillStyle = "rgba(242,214,196,0.32)";
      g.fillRect(0, 0, W, GROUND);
      // 近处的楼：防盗窗、空调、晾的衣服
      for (const b of near) block(g, b, GROUND, 1, 3.2);
      wires(g, 250, GROUND, 900);
      planeTree(g, 560, GROUND, 1.05, t);
      // 街
      {
        const st = rect(-20, GROUND, W + 40, H - GROUND + 20);
        part(g, st, "#c9bcb0", "#b8aa9d", 3.2, [0, -10]);
        g.fillStyle = "#b3a598";
        g.fillRect(-20, GROUND, W + 40, 22);
        g.strokeStyle = INK;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(-20, GROUND + 22);
        g.lineTo(W + 20, GROUND + 22);
        g.stroke();
        // 斜长的影子（太阳在左边）
        g.fillStyle = "rgba(90,60,70,0.16)";
        g.beginPath();
        g.ellipse(840, GROUND + 140, 260, 26, 0, 0, Math.PI * 2);
        g.fill();
      }
      // 低着头走过的路人
      for (const [i, x, face] of [[3, 140, 0.8], [6, 960, -0.8]] as const) {
        const spec = passerby(i);
        const pose = figurePose({ face, expression: "低头看", neck: -22, lean: 6, lookY: 1, ...legL(14, -6), ...legR(-10, -12), shoulderL: -8, shoulderR: 8 }, t, lookOf(spec));
        g.save();
        g.translate(x, GROUND + 60);
        g.scale(0.95, 0.95);
        drawCast(g, spec, pose);
        g.restore();
      }
      // 飘起来的周磊，手里还拎着杠铃
      {
        const pose = figurePose(
          { face: -0.75, float: 0.8, ground: false, lean: 8, neck: -18, rot: -4, ...legL(10, -30, -40), ...legR(-6, -16, -50), shoulderL: 22, elbowL: 26, handL: "grip", shoulderR: 26, elbowR: 22, handR: "grip", expression: "忍着哭", lookY: 0.8 },
          t,
          lookOf(CAST.周磊),
        );
        const j = castJoints(CAST.周磊, pose);
        g.save();
        g.translate(360, 900 + 8 * Math.sin(t * 1.2));
        g.scale(0.95, 0.95);
        barbell(g, (j.palmL[0] + j.palmR[0]) / 2, (j.palmL[1] + j.palmR[1]) / 2 + 6, -0.06);
        drawCast(g, CAST.周磊, pose);
        g.restore();
      }
      // 她：仰着头
      chengtuo(g, 730, GROUND + 140, 1.12, { ...POSES.仰头, idle: true }, t);
      sunbeams(g, t);
      motes(g, t);
      // 暖光：只把亮处提暖（soft-light），不把人染色
      g.save();
      g.globalCompositeOperation = "soft-light";
      const sun = g.createRadialGradient(60, 300, 0, 60, 300, 1700);
      sun.addColorStop(0, "rgba(255,200,130,0.8)");
      sun.addColorStop(1, "rgba(255,200,130,0)");
      g.fillStyle = sun;
      g.fillRect(0, 0, W, H);
      // 纸的颗粒
      g.globalAlpha = 0.3;
      g.drawImage(grain, 0, 0, W, H);
      g.restore();
      // 很轻的暗角
      const v = g.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1250);
      v.addColorStop(0, "rgba(60,30,40,0)");
      v.addColorStop(1, "rgba(60,30,40,0.18)");
      g.fillStyle = v;
      g.fillRect(0, 0, W, H);
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
