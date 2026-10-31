// B 站封面 4:3「凝视」（海报几版之一，共用画法见 B站海报画法.ts）。
// 夜里的近景：她占了右半边，仰着头望向左上方画面外的那片白（只看得见它照下来的光），眼里含着一点泪；举起的拳头里攥着几根
// 红绳，绳子斜着伸出画面，那一头是虚掉的、往光里飘的人影。字「城里人都说，她是 / 最沉的人」在左边的暗处。
// 和另外两版拉开：千线、独沉都是全身、讲世界；这张只给一张脸和几根绳——脸大（信息流里最先抓眼的是脸），情绪和神秘感都在
// 「她在看什么、绳子那头是谁」上。
import type { Scene, SceneOptions, Still } from "@frame/engine/types";
import { coverScene } from "./B站封面画法";
import { bloom } from "./小红书封面画法";
import { type V2, grain, heroine, litFigure, loadPosterFont, motes, posterLine, radial, rays, seeded, silhouette, thread, vertical, vignette } from "./B站海报画法";

export const still: Still = { width: 1440, height: 1080 };

/** 她：两脚之间的地面（在画面下面很远）、倍数——头顶在封面 240 左右，拳头在 165 */
const HER: V2 = [1030, 1760];
const HER_S = 2.6;
/** 画面外那片白照进来的方向（左上角外面） */
const LIGHT: V2 = [-120, -260];

function sky(g: CanvasRenderingContext2D) {
  vertical(g, [0, 0, 1440, 1080], [
    [0, "#3a3572"],
    [0.4, "#24214d"],
    [0.75, "#191636"],
    [1, "#1d1430"],
  ]);
  // 暗角只压天，光后画
  vignette(g, 820, 600, 380, 1000, "rgb(22,14,36)", 0.7);
  radial(g, ...LIGHT, 1150, [
    [0, "rgba(255,252,246,1)"],
    [0.3, "rgba(240,234,255,0.8)"],
    [0.55, "rgba(180,170,236,0.3)"],
    [1, "rgba(140,130,210,0)"],
  ]);
  rays(g, ...LIGHT, 1900, [
    [-38, 3, 0.07],
    [-46, 5, 0.05],
    [-55, 2.5, 0.08],
    [-63, 6, 0.045],
    [-72, 3, 0.06],
  ]);
}

/** 远处虚掉的往上飘的人（焦外：糊成一团团带光的影子），返回拴绳那几个的脚 */
function bokehCrowd(g: CanvasRenderingContext2D, k: number): V2[] {
  const r = seeded(41);
  const far = document.createElement("canvas");
  far.width = g.canvas.width;
  far.height = g.canvas.height;
  const f = far.getContext("2d")!;
  f.setTransform(k, 0, 0, k, 0, 0);
  for (let i = 0; i < 46; i++) {
    const x = r() * 900;
    const y = 30 + r() * 520;
    if (x + y > 1050) continue;
    silhouette(f, x, y, 18 + r() * 40, r() * 6, 0.6 + 0.35 * r(), "36,28,74", 1);
  }
  // 拴着红绳的几个（离得近一点，大一点）
  const tied: [number, number, number][] = [
    [170, 120, 96],
    [430, 70, 80],
    [300, 330, 110],
    [610, 190, 84],
  ];
  const feet: V2[] = [];
  for (const [x, y, h] of tied) {
    silhouette(f, x, y, h, x * 0.02, 0.95, "30,22,64", 1.1);
    const s = h / 140;
    feet.push([x - 9 * s, y + 86 * s]);
  }
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.filter = `blur(${Math.round(3.5 * k)}px)`;
  g.drawImage(far, 0, 0);
  g.restore();
  return feet;
}

export async function createScene(options: SceneOptions): Promise<Scene> {
  return coverScene(options, async (g, k) => {
    await loadPosterFont();
    sky(g);
    motes(g, 260, 200, 640, 120, 33, 0.75);
    const feet = bokehCrowd(g, k);
    const her = heroine({
      face: -0.7,
      expression: "仰望",
      sad: 0.25,
      neck: 30,
      lean: -4,
      lookX: -0.55,
      lookY: -1,
      shoulderR: 156,
      elbowR: 14,
      wristR: 0,
      handR: "grip",
      shoulderL: -10,
      elbowL: 20,
      handL: "fist",
      wind: 1.2,
      float: 0.2,
    });
    const fist = her.at(...HER, HER_S, "palmR");
    // 红绳：从拳头斜着伸进左上的光里，那头虚掉（线本身也一段段淡出去）
    feet.forEach((f, i) => {
      const d = Math.hypot(f[0] - fist[0], f[1] - fist[1]);
      g.save();
      const fade = g.createLinearGradient(...fist, ...f);
      fade.addColorStop(0, "rgba(0,0,0,1)");
      fade.addColorStop(0.75, "rgba(0,0,0,0.75)");
      fade.addColorStop(1, "rgba(0,0,0,0.2)");
      // 先画在单独的层上，再按渐变淡出去
      const lay = document.createElement("canvas");
      lay.width = g.canvas.width;
      lay.height = g.canvas.height;
      const l = lay.getContext("2d")!;
      l.setTransform(k, 0, 0, k, 0, 0);
      thread(l, fist, f, 3.4 - i * 0.35, d * 0.04, true, 1);
      l.globalCompositeOperation = "destination-in";
      l.fillStyle = fade;
      l.fillRect(0, 0, 1440, 1080);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(lay, 0, 0);
      g.restore();
    });
    litFigure(g, k, (h) => her.draw(h, ...HER, HER_S), {
      tint: ["#2e2860", 0.14],
      shade: ["#1a1030", 0.75],
      top: 420,
      bottom: 1080,
      rim: ["#f4f0ff", 0.85],
      dir: [3, 3.6],
      aura: ["#b8aeff", 0.3, 22],
    });
    // 脸迎着光
    radial(g, fist[0] - 10, fist[1] + 250, 300, [
      [0, "rgba(232,226,255,0.2)"],
      [1, "rgba(232,226,255,0)"],
    ]);
    radial(g, ...fist, 80, [
      [0, "rgba(255,120,100,0.3)"],
      [1, "rgba(255,120,100,0)"],
    ]);
    // 下面再压一点，她的身子沉进暗里
    vertical(g, [0, 760, 1440, 320], [
      [0, "rgba(16,10,28,0)"],
      [1, "rgba(16,10,28,0.55)"],
    ]);
    bloom(g, k);
    posterLine(g, k, { text: "城里人都说，她是", x: 375, y: 640, size: 60, tracking: 0.14 });
    posterLine(g, k, { text: "最沉的人", accent: "最沉", x: 375, y: 772, size: 148, tracking: 0.08 });
    grain(g, 0.05);
  });
}
