// ⑩ 抱在胸前的那块「活下去」在「调整画面」里的手柄（lib/room.ts 的 BRICK_HOLD）：中间的方块挪砖，右边的圆点转砖。
// 值是「抱在胸前时」的位置和转角，捧起来的路上按捧起来了多少（u）渐变过去：画面上挪 d，值要挪 d / (u × 她的大小)。

import { type EditorExtension, type V2, rotateBy } from "@frame/engine/editable";
import type { BrickHold, BrickEditData } from "./room";

const RAD = Math.PI / 180;

/** 现在的值画出来砖在哪（中心）、转了多少（弧度） */
function placed(v: BrickHold, o: BrickHold, d: BrickEditData): { c: V2; a: number } {
  return { c: [d.c0[0] + (v.x - o.x) * d.k, d.c0[1] + (v.y - o.y) * d.k], a: v.rot * d.u * RAD };
}
const knob = (p: { c: V2; a: number }, r: number): V2 => [p.c[0] + Math.cos(p.a) * r, p.c[1] + Math.sin(p.a) * r];

const extension: EditorExtension<BrickHold> = {
  hint: "拖中间的方块挪砖（两只手跟着），拖右边的圆点转砖",
  draw(o, object) {
    const d = object.data as BrickEditData;
    const p = placed(object.values, object.original, d);
    const end = knob(p, d.r);
    o.line([p.c, end], { dashed: true });
    o.handle(p.c, { kind: "move" });
    o.handle(end, { kind: "pivot" });
  },
  press(at, object, o) {
    const d = object.data as BrickEditData;
    const start = object.values;
    const p = placed(start, object.original, d);
    const end = knob(p, d.r);
    if (o.near(at, end))
      return { move: (to) => ({ rot: Math.round((start.rot + rotateBy(p.c, end, to) / d.u) * 10) / 10 }) };
    if (o.near(at, p.c, 40))
      return {
        move: (to) => ({
          x: Math.round((start.x + (to[0] - at[0]) / d.k) * 10) / 10,
          y: Math.round((start.y + (to[1] - at[1]) / d.k) * 10) / 10,
        }),
      };
  },
  describe(before, after) {
    return `抱在胸前时砖底边中点相对两肩中点（她的坐标，往右、往下为正）(${before.x}, ${before.y}) → (${after.x}, ${after.y})，转角 ${before.rot}° → ${after.rot}°（lib/room.ts 的 BRICK_HOLD，keys.json 场景 act2）`;
  },
};
export default extension;
