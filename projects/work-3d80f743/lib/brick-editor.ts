// 终章两块砖在「调整画面」里怎么拖（end_pair.ts 的 editBricks 登记，只在编辑器里加载这个文件）：
// 拖砖心的方块挪整块砖，拖右头的圆点绕砖心转。坐标是世界坐标（街面 y = 0，往上为负），角度正 = 顺时针。

import { rotateBy, type EditorExtension, type V2 } from "@frame/engine/editable";

export interface BrickValues {
  x: number;
  y: number;
  /** 度 */
  rot: number;
}
export interface BrickEditData {
  /** 砖心到右头的距离 */
  half: number;
}

const wrap = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;
const tipOf = (v: BrickValues, half: number): V2 => {
  const a = (v.rot * Math.PI) / 180;
  return [v.x + Math.cos(a) * half, v.y + Math.sin(a) * half];
};

const extension: EditorExtension<BrickValues> = {
  hint: "拖中间的方块挪砖，拖右头的圆点转砖",
  draw(o, object) {
    const v = object.values;
    const tip = tipOf(v, (object.data as BrickEditData).half);
    o.line([[v.x, v.y], tip], { dashed: true });
    o.handle([v.x, v.y], { kind: "move" });
    o.handle(tip, { kind: "joint" });
  },
  press(at, object, o) {
    const start = object.values;
    const tip = tipOf(start, (object.data as BrickEditData).half);
    const c: V2 = [start.x, start.y];
    if (o.near(at, tip)) return { move: (to) => ({ rot: wrap(start.rot + rotateBy(c, tip, to)) }) };
    if (o.near(at, c, 24) || (Math.abs(at[0] - c[0]) < (object.data as BrickEditData).half && Math.abs(at[1] - c[1]) < 20))
      return { move: (to) => ({ x: start.x + to[0] - at[0], y: start.y + to[1] - at[1] }) };
  },
  describe(before, after) {
    const lines: string[] = [];
    if (after.x !== before.x || after.y !== before.y) lines.push(`砖心挪了 (${Math.round(after.x - before.x)}, ${Math.round(after.y - before.y)})（世界坐标）`);
    if (after.rot !== before.rot) lines.push(`转了 ${Math.round((after.rot - before.rot) * 10) / 10}°（顺时针为正）`);
    return lines.join("；") || undefined;
  },
};
export default extension;
