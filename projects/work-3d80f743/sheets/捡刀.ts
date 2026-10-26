// 捡刀检查页（不在时间轴上）：主歌二④ 小石头就地蹲下捡脚边的刀，几种蹲法并排（近处那只手 IK 到刀上，红点是手心），看哪种稳稳在地上、不像摔倒。
// 每格画在和 lib/nightwin.ts 一样的大小（根在 HUG_SPOT，刀在 KNIFE_REST，刀被他的腿挡住），横线是地面。
// 2026-10-26 用的是「跪 前倾 26」（远处那只手改成垂在膝盖边）；「现在」那格是原来的（前倾 46°、后脚翘起来，像侧身摔倒）。

import type { Sample, Scene, SceneOptions } from "@frame/engine/types";
import { CAST, castJoints, lookOf } from "@materials/剪纸角色/code/cast";
import { type Angles, type PoseIn, figurePose } from "@materials/剪纸角色/code/chengtuo";
import { armL, armR, legL, legR } from "../lib/poses";
import { pose } from "../lib/dawn";
import { drawPerson } from "../lib/people";
import { drawKnife } from "../lib/knife";
import { ROOM } from "../lib/room";

const STONE = CAST.小石头穿妈妈的外套;
const LOOK = lookOf(STONE);
/** nightwin：根 (70, 1772)，刀 (152, 1686)；地上离镜头越近越大 */
const K = ROOM.s * (1 + 0.6 * Math.min(1, (1772 - 1640) / 280));
const KNIFE: [number, number] = [82, -86];

const face = { face: 0.6, expression: "忍着哭", tears: 1, lookX: 0.3, lookY: 0.9 } as const;
const V: [string, Angles][] = [
  ["现在 蹲（跪）", pose(46, { ...face, ...legR(96, -98), ...legL(-6, -134, -140), thighR: 0.65, neck: 8 }, (l) => ({ ...armL(60, 10, 0, "grip", l), ...armR(10, 60, 0, "relax", l) }))],
  ["跪 前倾 26", pose(26, { ...face, ...legR(92, -96), ...legL(-4, -92, -96), thighR: 0.65, neck: -6 }, (l) => ({ ...armL(40, 10, 0, "grip", l), ...armR(20, 50, 0, "relax", l) }))],
  ["跪 前倾 32", pose(32, { ...face, ...legR(96, -100), ...legL(-2, -96, -150), thighR: 0.65, neck: -4 }, (l) => ({ ...armL(40, 10, 0, "grip", l), ...armR(20, 50, 0, "relax", l) }))],
  ["蹲 前倾 30", pose(30, { ...face, ...legR(112, -140, -10), ...legL(100, -132, -20), thighR: 0.75, thighL: 0.85, neck: -6 }, (l) => ({ ...armL(40, 10, 0, "grip", l), ...armR(30, 60, 0, "relax", l) }))],
  ["蹲 前倾 40", pose(40, { ...face, ...legR(108, -136, -10), ...legL(96, -128, -20), thighR: 0.75, thighL: 0.85, neck: -8 }, (l) => ({ ...armL(40, 10, 0, "grip", l), ...armR(30, 60, 0, "relax", l) }))],
  ["蹲 前倾 22", pose(22, { ...face, ...legR(116, -146, -10), ...legL(104, -138, -20), thighR: 0.75, thighL: 0.85, neck: -4 }, (l) => ({ ...armL(40, 10, 0, "grip", l), ...armR(30, 60, 0, "relax", l) }))],
];

export const sample: Sample = { duration: 1 };

const W = 1080;
const H = 1920;

export function createScene({ width, height }: SceneOptions): Scene {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d")!;
  return {
    canvas,
    render() {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = "#e9d6c8";
      g.fillRect(0, 0, width, height);
      const cols = 2;
      const cw = W / cols;
      const rh = H / 3;
      V.forEach(([name, a], i) => {
        const x0 = (i % cols) * cw;
        const y0 = Math.floor(i / cols) * rh;
        g.setTransform(width / W, 0, 0, height / H, 0, 0);
        g.fillStyle = "#2b2630";
        g.font = "26px sans-serif";
        g.fillText(name, x0 + 14, y0 + 34);
        const S = 0.52;
        const gx = x0 + cw * 0.38;
        const gy = y0 + rh - 40;
        g.fillStyle = "rgba(90,70,110,0.35)";
        g.fillRect(x0 + 10, gy, cw - 20, 2);
        // 刀在墙根那边（画面上比脚高一截）
        g.save();
        g.translate(gx + KNIFE[0] * S, gy + KNIFE[1] * S);
        g.scale(K * 0.9 * S, K * 0.9 * S);
        drawKnife(g, 0, 0, 1.2);
        g.restore();
        const p: PoseIn = figurePose(a, 0, LOOK);
        const sc = K * STONE.scale;
        p.armL = { ...(p.armL as object), to: [-(KNIFE[0] - 6) / sc, (KNIFE[1] - 12) / sc], ik: 1 } as PoseIn["armL"];
        g.save();
        g.translate(gx, gy);
        g.scale(K * S, K * S);
        drawPerson(g, STONE, p, 0, 0, K * S);
        g.restore();
        const j = castJoints(STONE, p);
        g.fillStyle = "rgba(200,40,40,0.8)";
        g.beginPath();
        g.arc(gx + j.palmL[0] * K * S, gy + j.palmL[1] * K * S, 5, 0, 7);
        g.fill();
      });
    },
    dispose() {
      canvas.width = 0;
    },
  };
}
