// 四④（111.95–113.88，没有歌词的过门；112.02、113.02 重拍，113.88 第一声「活下去」）：抱住以后她的身子甩过来，两个人紧紧抱在一起——
// 连她的铁靴也拽不住两个人，还是慢慢往上飘（lib/coatoff.ts 的 liftAt：抱住以后速度一下子衰减，之后每秒 150）。
// 镜头跟着往上、慢慢退开一点，露出她家那栋楼一扇扇亮着的窗：窗里有人看着他们，伸手拉上窗帘——「啪」，一扇接一扇
// （112.52、112.77、113.02、113.27），灯也灭了。她抬头看一眼越来越近的白（113.05–113.3），再低头看着怀里的他（113.48–113.76）。
// 坐标是世界坐标；窗按 lib/world.ts 画楼的同一套算法找到她家那栋楼（TOWER）第几层第几扇。

import { type Cam, E, aim, camLerp, ph } from "./cam";
import { TOWER } from "./world";
import { DIVE_T, diveCam, diveHer } from "./dive";
import { stoneC4 } from "./coatoff";

type V2 = [number, number];

export const HUG4_T = {
  start: DIVE_T.end,
  /** 镜头慢慢退开（跟着两个人） */
  pull0: 112.0,
  pull1: 113.0,
  end: 113.88,
};
const T = HUG4_T;

/** 她家那栋楼第 f 层（0 是最上面一层）第 i 扇窗的玻璃（世界坐标）：和 world.ts 的 geomOf 同一套算法 */
function towerWindow(f: number, i: number) {
  const b = TOWER;
  const u = b.fh / 128;
  const w = b.w / u;
  const units = Math.max(2, Math.round(w / 150));
  const uw = (w - 40) / units;
  const top = -b.floors * 128 - 60;
  const x = 20 + uw * i + uw * 0.18;
  const y = top + 70 + f * 128;
  return { x: b.x + x * u, y: y * u, w: uw * 0.64 * u, h: 74 * u, cage: { x: b.x + (x - 8) * u, y: (y - 8) * u, w: (uw * 0.64 + 16) * u, h: 96 * u } };
}

/** 看着他们、又拉上窗帘的那几扇窗：第几层第几扇、拉上的时刻、窗帘的颜色、人站在窗的哪边（-1 左、1 右）、有没有防飘栏 */
const WINDOWS: { f: number; i: number; at: number; curtain: string; side: number; cage: boolean }[] = [
  { f: 19, i: 2, at: 112.52, curtain: "#9b5a52", side: -1, cage: true },
  { f: 21, i: 2, at: 112.77, curtain: "#5d6d86", side: 1, cage: true },
  { f: 16, i: 0, at: 113.02, curtain: "#8a7a52", side: 1, cage: true },
  { f: 23, i: 1, at: 113.27, curtain: "#6f5a7a", side: -1, cage: true },
];

/**
 * 那几扇窗：先亮着，窗里一个人影看着外面（头和肩膀）；到点前 0.15 秒人影往窗边一挪伸手，窗帘「啪」地从一边拉过来（0.1 秒），
 * 再过一下灯灭了（窗帘后面暗下去）。防飘栏的竖条画回去压在上面
 */
export function drawNeighbors(g: CanvasRenderingContext2D, t: number) {
  for (const W of WINDOWS) {
    const w = towerWindow(W.f, W.i);
    const d = t - W.at;
    const reach = E.io(ph(d, -0.15, 0));
    const close = E.out(ph(d, 0, 0.1));
    const off = E.io(ph(d, 0.12, 0.3));
    g.save();
    const glass = new Path2D();
    glass.rect(w.x, w.y, w.w, w.h);
    g.clip(glass);
    // 屋里亮着的暖光（窗下面暖一点）
    const lg = g.createLinearGradient(0, w.y, 0, w.y + w.h);
    lg.addColorStop(0, "rgb(255,214,150)");
    lg.addColorStop(1, "rgb(242,176,112)");
    g.fillStyle = lg;
    g.fillRect(w.x, w.y, w.w, w.h);
    // 人影：头和肩膀，站在窗边看着外面；拉窗帘时往窗帘那边挪、举起一只手
    const cx = w.x + w.w * (0.5 + 0.12 * W.side * reach);
    const sil = "rgba(64,44,48,0.92)";
    g.fillStyle = sil;
    g.beginPath();
    g.arc(cx, w.y + w.h * 0.42, w.h * 0.14, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(cx, w.y + w.h * 0.98, w.w * 0.3, w.h * 0.36, 0, Math.PI, 0);
    g.fill();
    if (reach > 0) {
      g.lineCap = "round";
      g.strokeStyle = sil;
      g.lineWidth = w.h * 0.09;
      g.beginPath();
      g.moveTo(cx + W.side * w.w * 0.18, w.y + w.h * 0.72);
      g.lineTo(cx + W.side * w.w * (0.18 + 0.16 * reach), w.y + w.h * (0.72 - 0.34 * reach));
      g.stroke();
    }
    // 窗帘从人那一边拉过来盖住整扇窗，褶子几道竖线；灯灭了以后窗帘后面暗下去
    if (close > 0) {
      const cw = w.w * close;
      const x0 = W.side < 0 ? w.x : w.x + w.w - cw;
      g.fillStyle = W.curtain;
      g.fillRect(x0, w.y, cw, w.h);
      g.strokeStyle = "rgba(0,0,0,0.18)";
      g.lineWidth = 3;
      for (let k = 1; k < 5; k++) {
        const x = x0 + (cw * k) / 5;
        g.beginPath();
        g.moveTo(x, w.y);
        g.lineTo(x, w.y + w.h);
        g.stroke();
      }
      // 透过窗帘的灯光（亮着时窗帘透一点暖）
      g.fillStyle = `rgba(255,200,130,${0.32 * (1 - off)})`;
      g.fillRect(x0, w.y, cw, w.h);
      g.fillStyle = `rgba(30,26,40,${0.45 * off})`;
      g.fillRect(x0, w.y, cw, w.h);
    }
    g.restore();
    // 防飘栏：竖条和中间一道横条压回去（和 world.ts 画铁笼一样）
    if (W.cage) {
      const c = w.cage;
      g.save();
      g.strokeStyle = "#3d2f33";
      g.lineWidth = 6;
      g.beginPath();
      for (let k = 1; k < 6; k++) {
        const bx = c.x + (c.w * k) / 6;
        g.moveTo(bx, c.y);
        g.lineTo(bx, c.y + c.h - 2 * (c.h / 96) * 8);
      }
      g.moveTo(c.x, c.y + (8 + 74 * 0.45) * (c.h / 96));
      g.lineTo(c.x + c.w, c.y + (8 + 74 * 0.45) * (c.h / 96));
      g.stroke();
      g.restore();
    }
  }
}

/** 两个人的中间（他的胸口和她的胸口中间） */
function pairCenter(t: number): V2 {
  const h = diveHer(t);
  const s = stoneC4(t);
  return [(h.chest[0] + s.root[0]) / 2, (h.chest[1] + s.root[1] - 240) / 2];
}
/** 手持呼吸：画面上约 3 像素 */
const breath = (t: number): V2 => [
  3 * (0.6 * Math.sin(t * 0.83) + 0.4 * Math.sin(t * 1.37 + 1.1)),
  3 * (0.6 * Math.sin(t * 0.71 + 2) + 0.4 * Math.sin(t * 1.19)),
];
/**
 * 四④的镜头：接着四③抱住那一下（跟着她的那个取景），E.io 慢慢退开到 0.62 倍（112.0–113.0），两个人在画面左中（470, 900），
 * 一直跟着他们慢慢往上飘；露出她家那栋楼右边那一列和上下几层亮着的窗；叠手持呼吸，不往回推
 */
export function hug4Cam(t: number): Cam {
  const c3 = diveCam(t);
  if (t < T.pull0) return c3;
  const [px, py] = pairCenter(t);
  const z = 0.62;
  const [bx, by] = breath(t);
  const wide = aim(px + bx / z, py + by / z, 470, 900, z);
  return camLerp(c3, wide, E.io(ph(t, T.pull0, T.pull1)));
}
