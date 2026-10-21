// 第二幕和副歌一共用的「舞台」：天、远处的城、人这一层的楼（最高那栋楼带着沉沉家那扇窗）、浮尘和光；
// 进了她的屋子以后（窗的玻璃盖住整个画面）只画屋里。两幕从同一套函数画，跨图层接过去的那一帧一样。

import { type Cam, H, W, applyCam, clamp01, toScreen, viewOf } from "./cam";
import {
  type Block,
  QJ_HOME,
  STREET,
  TOWER,
  TOWER_HOME,
  drawBlock,
  drawBlockGlow,
  drawCity,
  drawGrade,
  drawMotes,
  drawSky,
  drawSunbeams,
  drawTinted,
  drawWhite,
  setDusk,
} from "./world";
import { TOWER_ROOF, drawRoof } from "./props";
import { SKY_T, skyLook } from "./sky";
import { drawHomeWindow, duskAt, homeWindow, lampAt, roomMatrix } from "./night";
import { drawRoom } from "./room";
import { roomZ } from "./write";

/** 人这一层街边的楼（最高那栋楼单独画：它的楼顶） */
export const BLOCKS: Block[] = [...STREET, QJ_HOME];

/** extra：这一幕人这一层还要画的楼（副歌一：第一幕老钟家左右那两栋） */
export function makeStage(base: DOMMatrix, grain: HTMLCanvasElement, extra: Block[] = []) {
  const blocks = [...BLOCKS, ...extra];
  /** 一帧的底：天、远处的城、人这一层的楼（walkers：画在各层空气后面的东西，按层的远近 D 回调） */
  const drawWorld = (g: CanvasRenderingContext2D, cam: Cam, t: number, sh: [number, number], walkers?: (D: number) => void, wide = 0) => {
    g.setTransform(1, 0, 0, 1, 0, 0);
    drawSky(g, base, cam);
    drawCity(g, base, cam, t, walkers, sh, { light: 1, haze: 0, wide });
    applyCam(g, base, cam, 1, sh);
    const view = viewOf(cam, 1);
    if (TOWER.x < view.x1 && TOWER.x + TOWER.w > view.x0) {
      // 第二幕的最高那栋楼：沉沉家那扇窗的防飘栏开着（TOWER_HOME）
      drawBlock(g, TOWER_HOME, cam, 1, 2, 3.2, t);
      drawBlockGlow(g, TOWER_HOME, cam, 1);
      // 高空那几镜里床单由 lib/roof.ts 画（沉沉收床单）；黄昏、夜里楼顶的东西也蒙上那层色
      if (view.y1 > TOWER_ROOF - 600 && view.y0 < TOWER_ROOF + 200)
        drawTinted(g, [TOWER.x - 120, TOWER_ROOF - 520, TOWER.x + TOWER.w + 120, TOWER_ROOF + 40], (gg) => drawRoof(gg, t, t < SKY_T.cut));
      if (view.y1 > TOWER_ROOF && view.y0 < TOWER_ROOF + 700) drawHomeWindow(g, t, cam.z);
    }
    for (const b of blocks) {
      if (b.x > view.x1 + 50 || b.x + b.w < view.x0 - 50) continue;
      drawBlock(g, b, cam, 1, 2, 3.2, t);
      drawBlockGlow(g, b, cam, 1);
    }
  };
  /**
   * 一帧的光：浮尘、斜照的暖光、暖光和暗角、白。inside：⑧ 推进窗里时外面的空气（浮尘、光柱、白）跟着收掉，
   * 铺满画面时只剩暖光、暗角和纸的颗粒——和进了屋以后（drawInside）一模一样
   */
  const drawAir = (g: CanvasRenderingContext2D, cam: Cam, t: number, sh: [number, number], look: { vig: number; warm: number }, inside = 0, flash = 0) => {
    if (inside < 1) {
      drawMotes(g, cam, t, 1, 1, 0.85 * (1 - inside));
      applyCam(g, base, cam, 0.7, sh);
      drawMotes(g, cam, t + 3.1, 0.7, 1.8, 0.5 * (1 - inside));
      drawSunbeams(g, base, cam, t, clamp01(1 - (-cam.y - 3000) / 4000) * (1 - inside));
    }
    drawGrade(g, base, grain, look.warm, look.vig);
    if (inside < 1) {
      g.save();
      g.globalAlpha = 1 - inside;
      drawWhite(g, base, cam, t, flash);
      g.restore();
    }
  };
  /** 她家那扇窗的玻璃是不是已经盖住了整个画面（盖住了就只画屋里） */
  const windowCovers = (cam: Cam) => {
    const w = homeWindow();
    if (!cam.r) {
      const [x0, y0] = toScreen(cam, w.x, w.y);
      const [x1, y1] = toScreen(cam, w.x + w.w, w.y + w.h);
      return x0 <= -2 && y0 <= -2 && x1 >= W + 2 && y1 >= H + 2;
    }
    // 画面转着：画面四个角（倒着转回世界里）都落在窗里才算盖住
    const c = Math.cos(-cam.r);
    const sn = Math.sin(-cam.r);
    for (const [sx, sy] of [
      [-2, -2],
      [W + 2, -2],
      [-2, H + 2],
      [W + 2, H + 2],
    ]) {
      const dx = sx - W / 2;
      const dy = sy - H / 2;
      const x = cam.x + (dx * c - dy * sn) / cam.z;
      const y = cam.y + (dx * sn + dy * c) / cam.z;
      if (x < w.x || x > w.x + w.w || y < w.y || y > w.y + w.h) return false;
    }
    return true;
  };
  /** 只画她的屋子（窗盖住整个画面以后），镜头还是世界里的镜头 */
  const drawInside = (g: CanvasRenderingContext2D, t: number, cam: Cam) => {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#1c1820";
    g.fillRect(0, 0, g.canvas.width, g.canvas.height);
    applyCam(g, base, cam, 1);
    g.transform(...(() => {
      const m = roomMatrix();
      return [m.a, m.b, m.c, m.d, m.e, m.f] as [number, number, number, number, number, number];
    })());
    // 推近时描边按 1/√倍数变细（⑧ 铺满那一帧倍数是 1，粗细不变）
    drawRoom(g, t, lampAt(t), Math.max(0.45, Math.min(1, 1 / Math.sqrt(roomZ(cam)))));
    setDusk(...duskAt(t));
    try {
      drawAir(g, cam, t, [0, 0], skyLook(t), 1);
    } finally {
      setDusk(0);
    }
  };
  return { drawWorld, drawAir, windowCovers, drawInside };
}
