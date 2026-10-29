// 剪纸角色在「调整画面」和资源预览里怎么拖（drawFigure 用 editable 登记，只在那两处加载这个文件）：
// 拖肘、膝转上一节骨头；拖手腕、脚踝整条胳膊 / 腿跟着（IK；工具栏选「单个关节」或按住 Alt 时只转肘、膝）；
// 拖手掌、脚尖转手腕、脚；拖头转脖子，拖脖子根弯腰；拖胯部的方块挪整个人。
// 角度都在角色自己的坐标里算（朝右时整套镜像回来），和 figureOptions 的写法一样：正 = 顺时针。

import { reach, rotateBy, type Drag, type EditorExtension, type V2 } from "@frame/engine/editable";
import { figureRig, withValues, type FigureEditData, type FigureValues, type Rig } from "./figure";

type Side = "L" | "R";
const SIDES: Side[] = ["L", "R"];
const wrap = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;

/** 这组数画出来的骨架，和骨架坐标 ↔ 登记时的坐标（画它的地方：算上挪动、体型宽窄、压扁、朝右镜像） */
function view(values: FigureValues, data: FigureEditData) {
  const rig = figureRig(withValues(data.pose, data.values, values, data.look), data.look);
  const sx = data.width * (1 + rig.pose.squash * 0.6) * (rig.mir ? -1 : 1);
  const sy = 1 - rig.pose.squash;
  return {
    rig,
    out: (p: V2): V2 => [values.x + p[0] * sx, values.y + p[1] * sy],
    into: (p: V2): V2 => [(p[0] - values.x) / sx, (p[1] - values.y) / sy],
  };
}

interface Grip {
  id: string;
  at: V2;
  kind: "joint" | "end" | "move";
}
/** 能抓的点（骨架坐标） */
function grips(rig: Rig): Grip[] {
  const list: Grip[] = [];
  for (const side of SIDES) {
    const arm = rig.arms[side];
    list.push({ id: `palm${side}`, at: arm.tip.p(0, 17), kind: "joint" }, { id: `wrist${side}`, at: arm.end, kind: "end" }, { id: `elbow${side}`, at: arm.mid, kind: "joint" });
    const leg = rig.legs[side];
    // 光脚着地点的脚尖朝向（同 contactsOf）
    const fx = side === "R" || rig.u >= 0.25 ? 1 : -1;
    list.push({ id: `toe${side}`, at: leg.tip.p(-30 * fx, 56), kind: "joint" }, { id: `ankle${side}`, at: leg.end, kind: "end" }, { id: `knee${side}`, at: leg.mid, kind: "joint" });
  }
  list.push({ id: "head", at: rig.head.o, kind: "joint" }, { id: "chest", at: rig.neck, kind: "joint" }, { id: "hip", at: rig.pelvis.o, kind: "move" });
  return list;
}

const extension: EditorExtension<FigureValues> = {
  hint: "拖肘、膝转动；拖手腕、脚踝整条胳膊、腿跟着；拖手掌、脚尖转手腕、脚；拖头转脖子，拖脖子根弯腰；拖胯部的方块挪整个人",
  draw(o, object) {
    const { rig, out } = view(object.values, object.data as FigureEditData);
    for (const side of SIDES) {
      const arm = rig.arms[side];
      const leg = rig.legs[side];
      o.line([out(arm.root), out(arm.mid), out(arm.end), out(arm.tip.p(0, 17))]);
      o.line([out(leg.root), out(leg.mid), out(leg.end)]);
      o.handle(out(arm.root), { kind: "pivot" });
      o.handle(out(leg.root), { kind: "pivot" });
    }
    o.line([out(rig.pelvis.o), out(rig.neck), out(rig.head.o)], { dashed: true });
    for (const grip of grips(rig)) o.handle(out(grip.at), { kind: grip.kind });
  },
  press(at, object, o) {
    const data = object.data as FigureEditData;
    const start = object.values;
    const { rig, out, into } = view(start, data);
    let best: { grip: Grip; d: number } | null = null;
    for (const grip of grips(rig)) {
      const p = out(grip.at);
      if (!o.near(at, p)) continue;
      const d = Math.hypot(p[0] - at[0], p[1] - at[1]);
      if (!best || d < best.d) best = { grip, d };
    }
    if (!best) return;
    const { id } = best.grip;
    const side = id.slice(-1) as Side;
    /** 绕 pivot 转 key（sign：参数的正方向是逆时针时 -1） */
    const turn = (pivot: V2, from: V2, key: keyof FigureValues, sign = 1): Drag => ({
      move: (to) => ({ [key]: wrap((start[key] as number) + sign * rotateBy(pivot, from, into(to))) }),
    });
    /** 拖一节肢体的末端：整条跟着（IK），或者只转第二节 */
    const limb = (root: V2, mid: V2, end: V2, first: keyof FigureValues, second: keyof FigureValues): Drag => ({
      move: (to, event) => {
        if (event.mode === "joint") return { [second]: wrap((start[second] as number) + rotateBy(mid, end, into(to))) };
        const t = reach(root, mid, end, into(to));
        return { [first]: wrap((start[first] as number) + t.first), [second]: wrap((start[second] as number) + t.second) };
      },
    });
    const arm = rig.arms[side];
    const leg = rig.legs[side];
    if (id.startsWith("palm")) return turn(arm.end, arm.tip.p(0, 17), `wrist${side}`);
    if (id.startsWith("wrist")) return limb(arm.root, arm.mid, arm.end, `shoulder${side}`, `elbow${side}`);
    if (id.startsWith("elbow")) return turn(arm.root, arm.mid, `shoulder${side}`);
    if (id.startsWith("toe")) return turn(leg.end, best.grip.at, `ankle${side}`);
    if (id.startsWith("ankle")) return limb(leg.root, leg.mid, leg.end, `hip${side}`, `knee${side}`);
    if (id.startsWith("knee")) return turn(leg.root, leg.mid, `hip${side}`);
    if (id === "head") return turn(rig.neck, rig.head.o, "neck");
    // 弯腰：lean 的正方向是往前弯（逆时针）
    if (id === "chest") return turn(rig.pelvis.o, rig.neck, "lean", -1);
    return { move: (to) => ({ x: start.x + to[0] - at[0], y: start.y + to[1] - at[1] }) };
  },
  describe(before, after, object) {
    const data = object.data as FigureEditData;
    const a = view(before, data).rig;
    const b = view(after, data).rig;
    const point = (p: V2) => `(${Math.round(p[0])}, ${Math.round(p[1])})`;
    const moved: string[] = [];
    const parts: [string, V2, V2][] = [];
    for (const side of SIDES) {
      parts.push([`${side} 手腕`, a.arms[side].end, b.arms[side].end], [`${side} 脚踝`, a.legs[side].end, b.legs[side].end]);
    }
    parts.push(["头", a.head.o, b.head.o]);
    for (const [name, p, q] of parts) if (Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.5) moved.push(`${name} ${point(p)} → ${point(q)}`);
    const lines: string[] = [];
    if (moved.length) lines.push(`关节在角色自己的坐标里（朝左的写法，原点在两脚之间的地面，往上为负；IK 的 to 用这个坐标）：${moved.join("；")}`);
    if (after.x !== before.x || after.y !== before.y) lines.push(`整个人挪了 (${Math.round(after.x - before.x)}, ${Math.round(after.y - before.y)})（画它的地方的坐标）`);
    return lines.join("\n  ") || undefined;
  },
};
export default extension;
