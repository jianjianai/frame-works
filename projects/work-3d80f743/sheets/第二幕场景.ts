// 第二幕场景检查页（不在时间轴上）：0 哑铃店门面；1 千斤家门口（窗、门、铁桩、红线）；2 道具放大；3 高空（两栋楼、白、巷子）。

import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { type Cam, H, W, aim, applyCam } from "../lib/cam";
import { TOWER, Y_WHITE, drawBlock, drawBlockGlow, drawCity, drawGrade, drawMotes, drawSky, drawStreet, drawSunbeams, drawWhite, makeGrain, prepareCity } from "../lib/world";
import { TOWER_ROOF, drawRoof } from "../lib/props";
import { loadHandFont } from "../lib/note";
import {
  HOME,
  NEIGHBOR,
  NEIGHBOR_ROOF,
  STAND_DUMBBELL,
  drawChain,
  drawDumbbell,
  drawHomeFacade,
  drawHomeInterior,
  drawHomeTable,
  drawPadlock,
  drawShopFacade,
  drawShopInterior,
  drawStake,
  drawThread,
  stakeRing,
} from "../lib/act2set";

export const sample: Sample = { duration: 4 };

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  await loadHandFont();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  const base = new DOMMatrix([width / W, 0, 0, height / H, 0, 0]);
  const grain = makeGrain();
  prepareCity();
  const world = (cam: Cam, t: number, extra: () => void) => {
    g.setTransform(1, 0, 0, 1, 0, 0);
    drawSky(g, base, cam);
    drawCity(g, base, cam, t, undefined, [0, 0], { light: 1, haze: 0 });
    applyCam(g, base, cam, 1);
    drawBlock(g, TOWER, cam, 1, 2, 3.2, t);
    drawBlockGlow(g, TOWER, cam, 1);
    drawBlock(g, NEIGHBOR, cam, 1, 2, 3.2, t);
    drawBlockGlow(g, NEIGHBOR, cam, 1);
    drawRoof(g, t);
    drawStreet(g, cam);
    extra();
    drawMotes(g, cam, t, 1, 1, 0.85);
    drawSunbeams(g, base, cam, t, 1);
    drawGrade(g, base, grain, 0.95, 0.12);
    drawWhite(g, base, cam, t, 0);
  };
  return {
    canvas,
    render(t) {
      const page = Math.floor(t);
      if (page === 0) {
        const cam = aim(1150, -420, 540, 980, 1.15);
        world(cam, t, () => {
          applyCam(g, base, cam, 1);
          drawShopInterior(g, t);
          drawShopFacade(g, t);
          drawDumbbell(g, STAND_DUMBBELL[0], STAND_DUMBBELL[1], 0, 1);
        });
      } else if (page === 1) {
        const cam = aim(2560, -700, 540, 1100, 0.95);
        world(cam, t, () => {
          applyCam(g, base, cam, 1);
          drawHomeInterior(g, t);
          drawHomeTable(g);
          drawHomeFacade(g, t, t % 1 < 0.5 ? 1 : 0);
          drawStake(g, HOME.stake);
          drawThread(g, stakeRing(HOME.stake), [HOME.stake - 60, -760], 30);
          drawDumbbell(g, HOME.stake - 170, -95, 0, 0.55);
          drawChain(g, [[HOME.stake - 120, -40], [HOME.stake - 60, -20], [HOME.stake, -60], [HOME.stake + 40, -120]]);
          drawPadlock(g, HOME.stake + 60, -150, 0.2, t % 1 < 0.5 ? 0 : 1);
        });
      } else if (page === 2) {
        g.setTransform(base);
        g.fillStyle = "#f3e7df";
        g.fillRect(0, 0, W, H);
        drawDumbbell(g, 540, 300, 0, 1.4);
        drawDumbbell(g, 300, 640, 0.3, 0.6);
        drawDumbbell(g, 780, 640, -0.2, 0.35);
        drawChain(g, [[120, 900], [400, 980], [700, 940], [960, 1060]], 34, 4);
        drawPadlock(g, 360, 1250, 0, 0, 3);
        drawPadlock(g, 720, 1250, 0, 1, 3);
        g.translate(540, 1750);
        drawStake(g, 0, 4);
        drawThread(g, stakeRing(0), [260, -500], 40, 4);
      } else {
        const cam = aim(1800, -8300, 540, 1150, 0.8);
        world(cam, t, () => {
          applyCam(g, base, cam, 1);
          g.fillStyle = "rgba(0,0,0,0)";
        });
        g.setTransform(base);
        g.fillStyle = "#2b2630";
        g.font = "28px sans-serif";
        g.fillText(`塔楼顶 ${Math.round(TOWER_ROOF)}  隔壁楼顶 ${Math.round(NEIGHBOR_ROOF)}  白 ${Y_WHITE}`, 30, 1880);
      }
    },
    dispose() {
      canvas.width = canvas.height = 1;
    },
  };
}
