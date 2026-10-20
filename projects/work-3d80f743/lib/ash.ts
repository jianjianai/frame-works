// 副歌一⑥「在黑暗漫长的反乌托邦」（53.94–55.98；在 53.94 黑 54.18 暗 54.39 漫 54.45 长 54.66 的 54.84 反 55.14 乌 55.38 托 55.44 邦 55.68；
// 小节线 54.018、56.019）。接着⑤（同一个镜头，停在整座城上）：54.018 妈妈伸向白的手碰到白——和片头光里的女人一样，她从头顶开始
// 散成淡彩的光点，一圈彩色的光炸开、整个画面一亮，镜头一惊；光点散开以后变成灰，像雪一样往城里落。镜头顺着落下来的灰慢慢往下，
// 落到街上：沉沉紧紧抱着小石头，他埋在她怀里哭，灰落在他们身上。

import { seeded } from "@frame/engine/math";
import { beatAt } from "@frame/engine/tempo";
import { type Cam, E, aim, camLerp, kick, ph } from "./cam";
import { moteSprite } from "./world";
import { SING_T, singAt } from "./sing";

type V2 = [number, number];

export const ASH_T = {
  start: SING_T.end,
  /** 碰到白（小节线） */
  touch: beatAt(108),
  /** 从头顶到脚散成光点要多久 */
  burn: 0.4,
  /** 镜头顺着灰往下 */
  down0: 54.45,
  down1: 55.9,
  end: 55.98,
};

/** 她散开的那一刻：头顶、脚、胸口（世界坐标） */
const at = () => {
  const m = singAt(ASH_T.touch);
  return { chest: m.chest, top: m.root[1] - 640, feet: m.root[1] + 10, x: m.root[0] };
};
let BITS: { x: number; y: number; t0: number; vx: number; vy: number; s: number; hue: number; ph: number }[] | null = null;
/** 她化成的光点：从头顶开始一截一截散开（先是肥皂泡那几种淡彩，散开以后变成淡紫灰的灰） */
function bits() {
  if (BITS) return BITS;
  const a = at();
  const r = seeded(54);
  BITS = Array.from({ length: 240 }, () => {
    const y = a.top + r() * (a.feet - a.top);
    const k = (y - a.top) / (a.feet - a.top);
    const spread = 60 + 170 * Math.sin(Math.PI * Math.min(1, k * 1.25));
    const ang = r() * Math.PI * 2;
    const hue = [330, 25, 50, 150, 200, 265][Math.floor(r() * 6)] + (r() - 0.5) * 20;
    return { x: a.x + (r() - 0.5) * 2 * spread, y, t0: ASH_T.touch + k * ASH_T.burn, vx: Math.cos(ang) * (160 + r() * 360), vy: Math.sin(ang) * (120 + r() * 260) - 160, s: 9 + r() * 15, hue, ph: r() * 6 };
  });
  return BITS;
}

/** 她还画多少：碰到白以后从头顶往下一截一截没了（返回裁掉的那条线，null = 整个画） */
export function burnLine(t: number): number | null {
  if (t <= ASH_T.touch) return null;
  const a = at();
  return a.top - 30 + (a.feet + 60 - a.top) * E.in2(Math.min(1, (t - ASH_T.touch) / ASH_T.burn));
}
export const burnedOut = (t: number) => t > ASH_T.touch + ASH_T.burn + 0.05;

/** 画她化成的光点和灰（人这一层，世界坐标）；z 是镜头倍数（远的时候光点不小于 2 个像素） */
export function drawBits(g: CanvasRenderingContext2D, t: number, z: number) {
  if (t < ASH_T.touch - 0.01) return;
  g.save();
  for (const p of bits()) {
    const a = t - p.t0;
    if (a < 0) continue;
    const k = 1 - Math.exp(-a / 0.4);
    const x = p.x + p.vx * 0.4 * k + 30 * Math.sin(a * 2 + p.hue);
    const y = p.y + p.vy * 0.4 * k + 70 * a * a;
    const r = Math.max(2.4 / z, p.s * 0.36 * (1 - 0.35 * Math.min(1, a)));
    const tw = 0.7 + 0.3 * Math.sin(a * 7 + p.ph);
    const alpha = Math.max(0, Math.min(1, 1.5 - a * 0.45)) * tw;
    const toAsh = Math.min(1, Math.max(0, (a - 0.15) / 0.5));
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    if (toAsh < 1) {
      g.globalAlpha = alpha * (1 - toAsh);
      g.fillStyle = `hsl(${p.hue}, 72%, 78%)`;
      g.fill();
    }
    if (toAsh > 0) {
      g.globalAlpha = alpha * toAsh * 0.85;
      g.fillStyle = "#cdb6c6";
      g.fill();
    }
  }
  g.restore();
}

/** 像雪一样往城里落的灰：散在她那一竖条的天上，从上往下一层层显出来（灰落下来的样子），慢慢飘落 */
const FLAKES = (() => {
  const r = seeded(55);
  const out: { x: number; y: number; v: number; s: number; ph: number; glow: boolean }[] = [];
  for (let i = 0; i < 280; i++) out.push({ x: -2330 + (r() - 0.5) * 3400, y: -9000 + r() * 9200, v: 70 + r() * 90, s: 5 + r() * 10, ph: r() * 6.28, glow: r() < 0.25 });
  // 街上那一块多一些（镜头最后落在这里）
  for (let i = 0; i < 70; i++) out.push({ x: -2390 + (r() - 0.5) * 1300, y: -1700 + r() * 1700, v: 60 + r() * 70, s: 6 + r() * 9, ph: r() * 6.28, glow: r() < 0.25 });
  return out;
})();
export function drawSnow(g: CanvasRenderingContext2D, t: number, z: number) {
  const d = t - ASH_T.touch;
  if (d < 0.15) return;
  const spr = moteSprite();
  g.save();
  for (const f of FLAKES) {
    // 从上往下一层层显出来
    const delay = 0.15 + ((f.y + 9000) / 9200) * 0.9;
    const a = Math.min(1, Math.max(0, (d - delay) / 0.5));
    if (a <= 0) continue;
    const x = f.x + 26 * Math.sin(t * 1.3 + f.ph) + 12 * Math.sin(t * 2.9 + f.ph * 2);
    const y = f.y + f.v * (d - delay);
    const r = Math.max(1.8 / z, f.s * 0.62);
    const tw = 0.7 + 0.3 * Math.sin(t * 4 + f.ph * 3);
    g.globalAlpha = a * tw * 0.92;
    // 灰：淡紫灰（在粉色的墙前面也看得出来），有的发着一点光
    g.fillStyle = f.glow ? "#f3e2d0" : "#b49eb2";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    if (f.glow) {
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = a * tw * 0.45;
      g.drawImage(spr, x - r * 4, y - r * 4, r * 8, r * 8);
      g.globalCompositeOperation = "source-over";
    }
  }
  g.restore();
}

/** 碰到白那一下整个画面亮一下 */
export const ashFlash = (t: number) => (t < ASH_T.touch ? 0 : 0.55 * Math.exp(-(t - ASH_T.touch) / 0.18));
/** 炸开的那一圈彩色光在哪（她的胸口） */
export const burstAt = (): V2 => at().chest;

/**
 * ⑥的镜头：⑤退到整座城上停住；碰到白那一下一惊（+3%）；之后顺着落下来的灰慢慢往下，落到街上抱在一起的两个人身上
 * （柔和起步、一路减速，1.4 秒；两个人在画面下半截，上面是飘下来的灰）
 */
export function ashCam(t: number, base: (t: number) => Cam): Cam {
  const T = ASH_T;
  if (t <= T.start) return base(t);
  let c = base(T.start);
  c = { ...c, z: c.z * (1 + 0.03 * kick(t, T.touch, 0.12)) };
  const u = E.settle(ph(t, T.down0, T.down1));
  if (u > 0) c = camLerp(c, aim(-2380, -330, 540, 1260, 1.15), u);
  return c;
}
export const ashShake = (t: number) => 8 * kick(t, ASH_T.touch, 0.08);
