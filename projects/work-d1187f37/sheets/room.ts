// 设定图：他的房间（开灯 / 关灯 / 早上），坐在床上的他。只用来看，不在时间轴上。
import type { SceneOptions } from "@frame/engine/types";
import { designScene } from "@materials/s0rrow/code/draw";
import { hisDuvet, hisInBed, hisPhoneBack, hisRoom, SIT } from "../acts/world";

export const sample = { duration: 3 };
export function createScene(options: SceneOptions) {
  return designScene(options, 0, (ctx, abs) => {
    const mode = abs < 1 ? 0 : abs < 2 ? 1 : 2;
    const lamp = mode === 0 ? 1 : 0;
    const dawn = mode === 2 ? 1 : 0;
    hisRoom(ctx, abs, { lamp, dawn });
    hisInBed(ctx, {
      arms: "phone",
      eyes: "open",
      look: [0, 0.6],
      grip: (c) => hisPhoneBack(c, 0, 330, 80, 150, 0),
    }, { lamp, phone: dawn ? 0 : 1, dawn });
    hisDuvet(ctx, 1 - lamp, dawn);
    void SIT;
  });
}
