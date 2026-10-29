// 小孩（drawKid）在「调整画面」和资源预览里怎么拖（drawKid 用 editable 登记，只在那两处加载这个文件）：
// 拖手腕挪手（写 handL / handR，手肘照常按 IK 弯），拖手肘定手肘的位置（elbowL / elbowR，跳过 IK），
// 拖头上方的圆点歪头（tilt），拖头中间的方块挪头（headX / headY）。坐标都是头部单位（drawKid 的 x、y、s 之后）。

import { rotateBy, type Drag, type EditorExtension, type V2 } from "@frame/engine/editable";
import { ik2 } from "./draw";
import { armSpecs, type KidPose } from "./kid";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** 画出来的两只手臂：肩、肘、手腕 */
function arms(p: KidPose) {
  const girl = p.who === "girl";
  const sx = girl ? 92 : 100;
  const [L, R] = armSpecs(p);
  return ([[L, -1, "L"], [R, 1, "R"]] as const).map(([spec, side, name]) => {
    const shoulder: V2 = [side * sx, 192];
    const [elbow, wrist] = spec.elbow ? [spec.elbow, spec.wrist] : ik2(shoulder, spec.wrist, girl ? 134 : 142, girl ? 128 : 134, spec.bend);
    return { name, shoulder, elbow: elbow as V2, wrist: wrist as V2 };
  });
}
function head(p: KidPose) {
  const center: V2 = [p.headX ?? 0, p.headY ?? 0];
  const tilt = p.tilt ?? 0;
  const top: V2 = [center[0] + Math.sin(tilt) * 160, center[1] - Math.cos(tilt) * 160];
  return { center, top };
}

const extension: EditorExtension<KidPose> = {
  hint: "拖手腕挪手（手肘自动弯），拖手肘定手肘的位置；拖头上方的圆点歪头，拖头中间的方块挪头",
  draw(o, object) {
    const p = object.values;
    const h = head(p);
    o.line([h.center, h.top], { dashed: true });
    o.handle(h.top);
    o.handle(h.center, { kind: "move" });
    if ((p.body ?? "bust") === "head") return;
    for (const arm of arms(p)) {
      o.line([arm.shoulder, arm.elbow, arm.wrist]);
      o.handle(arm.shoulder, { kind: "pivot" });
      o.handle(arm.elbow);
      o.handle(arm.wrist, { kind: "end" });
    }
  },
  press(at, object, o): Drag | undefined {
    const p = object.values;
    const shift = (from: V2, to: V2): V2 => [Math.round(from[0] + to[0] - at[0]), Math.round(from[1] + to[1] - at[1])];
    if ((p.body ?? "bust") !== "head")
      for (const arm of arms(p)) {
        if (o.near(at, arm.wrist)) return { move: (to) => ({ [`hand${arm.name}`]: shift(arm.wrist, to) }) };
        if (o.near(at, arm.elbow)) return { move: (to) => ({ [`elbow${arm.name}`]: shift(arm.elbow, to) }) };
      }
    const h = head(p);
    if (o.near(at, h.top)) {
      const tilt = p.tilt ?? 0;
      return { move: (to) => ({ tilt: clamp(tilt + (rotateBy(h.center, h.top, to) * Math.PI) / 180, -0.6, 0.6) }) };
    }
    if (o.near(at, h.center, 14)) {
      const [x, y] = h.center;
      return { move: (to) => ({ headX: clamp(Math.round(x + to[0] - at[0]), -80, 80), headY: clamp(Math.round(y + to[1] - at[1]), -80, 80) }) };
    }
    return undefined;
  },
};
export default extension;
