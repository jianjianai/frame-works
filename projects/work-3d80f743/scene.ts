import type { SceneOptions } from "@frame/engine/types";
import { assetUrl } from "@frame/engine/types";
import { createCompositionScene } from "@frame/engine/compositor";
import { CAST, lookOf } from "@materials/剪纸角色/code/cast";
import { drawFigure, figurePose } from "@materials/剪纸角色/code/chengtuo";
import visual from "./visual.json";

async function inspectZhouLei() {
  const im = new Image();
  im.src = assetUrl("films/work-3d80f743/ref/比例参考-男人.png");
  await im.decode();

  const rc = document.createElement("canvas");
  rc.width = im.width;
  rc.height = im.height;
  const rg = rc.getContext("2d")!;
  rg.drawImage(im, 0, 0);
  const rd = rg.getImageData(0, 0, rc.width, rc.height).data;

  const look = lookOf(CAST.周磊);
  const spec = CAST.周磊;
  const hc = document.createElement("canvas");
  hc.width = 400;
  hc.height = 900;
  const hg = hc.getContext("2d")!;
  hg.translate(200, 850);
  hg.scale(spec.scale, spec.scale);
  drawFigure(hg, figurePose({ face: 0 }, 0.3, look), look);
  const hd = hg.getImageData(0, 0, 400, 900).data;
  let hVal = 590;
  outer: for (let y = 0; y < 900; y++) {
    for (let x = 0; x < 400; x++) {
      if (hd[(y * 400 + x) * 4 + 3] > 40) {
        hVal = 850 - y;
        break outer;
      }
    }
  }

  const oc = document.createElement("canvas");
  oc.width = im.width;
  oc.height = im.height;
  const og = oc.getContext("2d")!;
  og.fillStyle = "#f3e7df";
  og.fillRect(0, 0, oc.width, oc.height);
  const k = (886 - 158) / hVal;
  const cx = [138, 372];
  [{ face: 0 }, { face: -1 }].forEach((o, v) => {
    og.save();
    og.translate(cx[v], 886);
    og.scale(k * spec.scale, k * spec.scale);
    drawFigure(og, figurePose(o, 0.3, look), look);
    og.restore();
  });
  const od = og.getImageData(0, 0, oc.width, oc.height).data;

  // Let's sample exact RGB values along x=138 (Front center) and x=115 (Front left eye/brow) from y=160..600
  const sampleCol = (x: number, y0: number, y1: number, step: number) => {
    const out: string[] = [];
    for (let y = y0; y <= y1; y += step) {
      const i = (y * rc.width + x) * 4;
      out.push(`${y}:(${rd[i]},${rd[i + 1]},${rd[i + 2]})`);
    }
    return out.join(" ");
  };
  console.warn("COL_138_TOP:", sampleCol(138, 160, 360, 10));
  console.warn("COL_138_MID:", sampleCol(138, 370, 590, 10));
  console.warn("COL_116_FACE:", sampleCol(116, 200, 310, 5));
  console.warn("COL_160_FACE:", sampleCol(160, 200, 310, 5));

  // High-res Face scan (y = 210..306, stepY = 6 -> 16 lines, stepX = 2.5)
  // Front x = 83..193 (45 chars), 3/4 x = 317..427 (45 chars)
  function clsFace(d: Uint8ClampedArray, w: number, x: number, y: number, isRef: boolean): string {
    const i = (y * w + x) * 4;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    if (isRef) {
      const bi = (y * w + 8) * 4;
      if (Math.abs(r - d[bi]) + Math.abs(g - d[bi + 1]) + Math.abs(b - d[bi + 2]) < 26) return ".";
    } else {
      if (r === 243 && g === 231 && b === 223) return ".";
    }
    const br = (r + g + b) / 3;
    if (br < 52) return "#"; // black outline / pupil
    if (br < 95) return "H"; // hair / brow
    if (r > 235 && g > 235 && b > 230) return "W"; // eye white / highlight
    if (r > 215 && g > 175 && b > 145 && r - b > 25) return "s"; // skin
    if (r > 180 && g > 115 && b > 95 && r - b > 30) return "m"; // skin shade / blush / mouth / nose
    return "+";
  }

  for (let i = 0; i < 16; i++) {
    const y = 212 + i * 6;
    let rf = "", of_ = "", rs = "", os = "";
    for (let x = 83; x <= 193; x += 2.5) {
      const xi = Math.round(x);
      rf += clsFace(rd, rc.width, xi, y, true);
      of_ += clsFace(od, oc.width, xi, y, false);
    }
    for (let x = 317; x <= 427; x += 2.5) {
      const xi = Math.round(x);
      rs += clsFace(rd, rc.width, xi, y, true);
      os += clsFace(od, oc.width, xi, y, false);
    }
    console.warn(`F${String(y).padStart(3, "0")}:${rf}|${of_}||${rs}|${os}`);
  }
}

export async function createScene(options: SceneOptions) {
  await inspectZhouLei();
  return createCompositionScene(options, visual, {
    act1: () => import("./scenes/act1"),
    act2: () => import("./scenes/act2"),
    act3: () => import("./scenes/act3"),
    act4: () => import("./scenes/act4"),
    act5: () => import("./scenes/act5"),
    act6: () => import("./scenes/act6"),
    finale: () => import("./scenes/finale"),
    recall: () => import("./scenes/recall"),
    lyrics: () => import("./scenes/lyrics"),
  });
}
