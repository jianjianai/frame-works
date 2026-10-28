// 临时：左右转身对照（不在时间轴上）。小石头的妈妈从朝左 3/4 经过正面转到朝右 3/4（0–1 秒一排九个角度）；
// 1–2 秒：正面两侧各差一点点（face -0.001 / +0.001）放大并排，看过正面跳不跳。
// 3–4 秒：主角（外套、袖标、围巾、靴子）同样四个角度。
// 4–8 秒：老钟、千斤的妈妈、周磊、小石头各一页九个角度的头（分层头发：我照参考图画的，2026-10-28）。
// 2–3 秒：其他配角各一行：-0.001、+0.001、朝左 3/4、朝右 3/4（左右镜像改了共用的代码，看别人有没有画坏）。
import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { CAST, lookOf } from "@materials/剪纸角色/code/cast";
import { drawChengtuo, drawFigure, figurePose } from "@materials/剪纸角色/code/chengtuo";

export const sample: Sample = { duration: 8 };
/** 4–8 秒每页的人 */
const TURN_PAGES = ["老钟", "千斤的妈妈", "周磊", "小石头"] as const;
const OTHERS = ["周磊", "小石头", "老钟", "千斤的妈妈", "小时候的秤砣"] as const;
const SPEC = CAST.小石头的妈妈;
const FACES = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  const look = lookOf(SPEC);
  const draw = (face: number, x: number, y: number, s: number, lk = look) => {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    drawFigure(g, figurePose({ face }, 0.3, lk), lk);
    g.restore();
  };
  return {
    canvas,
    render(t) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = "#f3e7df";
      g.fillRect(0, 0, width, height);
      const r = width / 1080;
      g.setTransform(r, 0, 0, r, 0, 0);
      if (t >= 4) {
        // 3×3 的头（放大）：朝左 3/4 → 正面 → 朝右 3/4
        const name = TURN_PAGES[Math.min(TURN_PAGES.length - 1, Math.floor(t - 4))];
        const spec = CAST[name];
        const lk = lookOf(spec);
        const sc = 2.1 / spec.scale;
        FACES.forEach((f, i) => {
          const cx = (i % 3) * 360;
          const cy = Math.floor(i / 3) * 640;
          g.save();
          g.beginPath();
          g.rect(cx, cy, 360, 640);
          g.clip();
          // 头顶放在格子上面一点：身高 ~590 × scale
          g.translate(cx + 180, cy + 90 + 590 * spec.scale * sc * (spec.headScale ? 0.93 : 1));
          g.scale(sc * spec.scale, sc * spec.scale);
          drawFigure(g, figurePose({ face: f }, 0.3, lk), lk);
          g.restore();
          g.fillStyle = "#2b2630";
          g.font = "22px sans-serif";
          g.fillText(`${name} face ${f}`, cx + 10, cy + 28);
        });
        return;
      }
      if (t < 1) {
        // 3×3：朝左 3/4 → 正面 → 朝右 3/4，每格画头到大腿
        FACES.forEach((f, i) => {
          const cx = (i % 3) * 360;
          const cy = Math.floor(i / 3) * 640;
          g.save();
          g.beginPath();
          g.rect(cx, cy, 360, 640);
          g.clip();
          draw(f, cx + 180, cy + 760, 1.05);
          g.restore();
          g.fillStyle = "#2b2630";
          g.font = "22px sans-serif";
          g.fillText(`face ${f}`, cx + 10, cy + 28);
        });
        return;
      }
      if (t >= 3) {
        const items = { scarf: true, gloves: true, coat: true, band: true, boots: true, bricks: 0 };
        [-0.001, 0.001, -1, 1].forEach((f, i) => {
          g.save();
          g.beginPath();
          g.rect((i % 2) * 540, Math.floor(i / 2) * 960, 540, 960);
          g.clip();
          g.translate((i % 2) * 540 + 270, Math.floor(i / 2) * 960 + 930);
          g.scale(1.45, 1.45);
          drawChengtuo(g, figurePose({ face: f }, 0.3, undefined, items));
          g.restore();
        });
        return;
      }
      if (t >= 2) {
        OTHERS.forEach((name, row) => {
          const lk = lookOf(CAST[name]);
          [-0.001, 0.001, -1, 1].forEach((f, i) => {
            g.save();
            g.beginPath();
            g.rect(i * 270, row * 384, 270, 384);
            g.clip();
            g.translate(i * 270 + 135, row * 384 + 560);
            g.scale(0.85, 0.85);
            drawFigure(g, figurePose({ face: f }, 0.3, lk), lk);
            g.restore();
          });
          g.fillStyle = "#2b2630";
          g.font = "20px sans-serif";
          g.fillText(name, 8, row * 384 + 24);
        });
        return;
      }
      [-0.001, 0.001].forEach((f, i) => {
        g.save();
        g.beginPath();
        g.rect(i * 540, 0, 540, 1920);
        g.clip();
        draw(f, i * 540 + 270, 1900, 2.9);
        g.restore();
      });
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
