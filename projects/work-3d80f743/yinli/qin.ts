// 秤砣换成素材库「剪纸角色」的角色（第一幕先试）：旧代码照样算她的 Fig（位置、关节角度、手要够到的点、时间都不变），
// 这里把它换算成秤砣骨架的姿势再画——镜头、别人、道具都还按旧 Fig 算，运镜和节奏不动；手里的砖跟着秤砣的手走（qinJoints）。
// 对应关系：旧人偶后面那只手 / 腿（L）= 秤砣 3/4 远侧的（R），前面那只（R）= 近侧的（L）。
import { type C, env, W, clamp } from "./core";
import { pose as oldPose, type Fig, type Joints, type Pt } from "./figure";
import { drawChengtuo, jointsOf, groundHip, EXPRESSIONS, NEUTRAL, CHENGTUO, type PoseIn, type HandShape, type Expr, type HoldFn } from "@materials/剪纸角色/code/chengtuo";
import { breathAt, blinkAt } from "@materials/剪纸角色/code/rig";

/** 秤砣 s = 1 全身约 590 高；0.35 时胯高、肩高、手举过头够到的高度都和旧人偶差不多（头大一些） */
export const QS = 0.35;

/** 每个时刻可以在旧 Fig 上另加的（写在 Fig.ct 里） */
export interface QinStyle {
  /** 表情名（素材库的 20 种），不写按旧的 eyes 换算 */
  expression?: string;
  /** 在表情上细调 */
  expr?: Partial<Expr>;
  /** 近侧的手（旧人偶前面那只 R）、远侧的手（旧 L）的手形；不写：伸向目标点时 grip，否则 relax */
  handNear?: HandShape;
  handFar?: HandShape;
  holdNear?: HoldFn;
  holdFar?: HoldFn;
  /** 靴筒里插着几块砖（默认 2） */
  bricks?: number;
  /** 朝向：-1 3/4 朝画面左 … 1 朝右（默认按旧的 facing） */
  face?: number;
  headTurn?: number;
  wind?: number;
  /** 头发、围巾跟着身子甩的程度（默认 1） */
  drag?: number;
  /** 手臂画在身子前面还是后面（默认 3/4 时远侧的在后） */
  layerNear?: "front" | "back";
  layerFar?: "front" | "back";
  /** 腿换成素材库的姿势（度：胯、膝、脚，和资源面板一样），w 是混合的程度：旧人偶的腿换到大铁靴上不对劲时用（跪） */
  legs?: { near?: [number, number, number]; far?: [number, number, number]; w: number };
  /** 手臂换成素材库的姿势（度：肩、肘、手腕），w 是混合的程度；混进来时不再伸向旧的目标点（挥手） */
  arms?: { near?: [number, number, number]; far?: [number, number, number]; w: number };
}

/** 单膝跪（素材库「单膝跪·掏砖」的腿）：近侧的腿跪在地上，远侧的立着。旧人偶平放的小腿换到大铁靴上，靴子会悬在半空 */
export const kneelLegs = (w: number): QinStyle["legs"] => ({ near: [-12, -98, 55], far: [78, -84, 6], w });

const angleOf = (v: Pt) => Math.atan2(-v[0], v[1]);
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const EYES: Record<string, string> = { open: "平常", smile: "微笑", wide: "坚定", closed: "闭眼" };
const clampAbs = (v: number, m: number) => Math.max(-m, Math.min(m, v));
/** 角度差收到 −π..π */
const wrap = (a: number) => a - Math.PI * 2 * Math.round(a / (Math.PI * 2));

interface Placed {
  pose: PoseIn;
  /** 局部原点（世界坐标）、缩放、镜像 */
  ox: number;
  oy: number;
  s: number;
  hold: { L?: HoldFn; R?: HoldFn };
}

/** 旧 Fig → 秤砣的姿势。prev：上一刻的 Fig（算头发、围巾的惯性） */
function convert(f: Fig, t: number, prev?: Fig, dt = 1 / 30): Placed {
  const st = f.ct ?? {};
  const fa = f.facing ?? 1;
  const face = st.face ?? fa;
  const m = face > 0 ? -1 : 1; // 朝右时秤砣整套镜像：局部 x 取反
  const s = QS * (f.s ?? 1);
  const j = oldPose(f);
  const grounded = f.grounded !== false;
  const ox = j.hip[0];
  const oy = f.y; // 着地时是脚底，否则是胯
  const loc = (p: Pt): Pt => [((p[0] - ox) / s) * m, (p[1] - oy) / s];
  const ang = (v: Pt) => angleOf([v[0] * m, v[1]]);

  // 上身：旧的躯干方向 → 胯转（rot）+ 弯腰（lean）；小角度全是弯腰，躺下时多出来的给整个人转
  const A = ang(sub(j.hip, j.neck));
  const leanPart = clamp(A, -0.6, 0.6);
  const rot = A - leanPart;
  const lean = -leanPart;
  const neck = -(f.head ?? 0) * fa * m * 0.5;

  // 手臂：给了目标点就用 IK（手掌落在那一点，肘往旧人偶肘的那一侧拱），否则照旧的两节角度
  const PALM = 17;
  const RAD = Math.PI / 180;
  const arm = (sh: Pt, el: Pt, hand: Pt, target: Pt | undefined, shape: HandShape | undefined, wrist: number, layer: "front" | "back" | undefined, alt: [number, number, number] | undefined) => {
    const a1 = ang(sub(el, sh));
    const a2 = ang(sub(hand, el));
    const out: Record<string, unknown> = { a: wrap(a1 - A), b: Math.abs(wrap(a2 - a1)), h: wrist, shape: shape ?? (target ? "grip" : "relax"), to: undefined, layer };
    const w = alt ? clamp(st.arms!.w) : 0;
    if (alt && w > 0) {
      out.a = (out.a as number) + (alt[0] * RAD - (out.a as number)) * w;
      out.b = (out.b as number) + (alt[1] * RAD - (out.b as number)) * w;
      out.h = wrist + (alt[2] * RAD - wrist) * w;
    } else if (target) {
      const tl = loc(target);
      const sl = loc(sh);
      const d = sub(tl, sl);
      const n = Math.hypot(d[0], d[1]) || 1;
      out.to = [tl[0] - (d[0] / n) * PALM, tl[1] - (d[1] / n) * PALM];
      const e = sub(loc(el), sl);
      out.bend = d[0] * e[1] - d[1] * e[0] >= 0 ? 1 : -1;
      out.h = 0;
    }
    return out;
  };
  const armL = arm(j.shR, j.elR, j.handR, f.hR, st.handNear, 0.14, st.layerNear, st.arms?.near);
  const armR = arm(j.shL, j.elL, j.handL, f.hL, st.handFar, -0.07, st.layerFar, st.arms?.far);

  // 腿：两节角度照旧；脚放平，飘起来时脚尖朝下（和旧人偶一样）
  const boots = !f.barefoot && f.boots !== false;
  const toeA = clamp(f.float ?? 0) * 1.1;
  const foot = Math.atan2(-0.9 * Math.sin(toeA), Math.cos(toeA));
  // 旧人偶两条腿的胯关节在胯两边（不分朝向，L 总在 −x 那边）：从各自的胯关节量方向，不然朝右时两条腿交叉
  const lx = Math.cos(f.lean ?? 0) * 6 * (f.s ?? 1);
  const ly = Math.sin(f.lean ?? 0) * 6 * (f.s ?? 1);
  const leg = (hp: Pt, kn: Pt, an: Pt, alt: [number, number, number] | undefined) => {
    const a1 = ang(sub(kn, hp));
    const a2 = a1 + wrap(ang(sub(an, kn)) - a1);
    const o = { a: wrap(a1 - rot), b: a2 - a1, f: foot - a2 };
    const w = alt ? clamp(st.legs!.w) : 0;
    if (alt && w > 0) {
      o.a += (alt[0] * RAD - o.a) * w;
      o.b += (alt[1] * RAD - o.b) * w;
      o.f += (alt[2] * RAD - o.f) * w;
    }
    return { ...o, thighK: 1, to: undefined, boot: boots };
  };
  const legL = leg([j.hip[0] + lx, j.hip[1] + ly], j.knR, j.anR, st.legs?.near);
  const legR = leg([j.hip[0] - lx, j.hip[1] - ly], j.knL, j.anL, st.legs?.far);

  // 表情
  const name = st.expression ?? EYES[f.eyes ?? "open"] ?? "平常";
  const expr: Expr = { ...NEUTRAL, ...EXPRESSIONS[name], ...st.expr };
  if (f.tears) expr.tears = Math.max(expr.tears, f.tears);
  if (!st.expr?.look) expr.look = [expr.look[0], clamp(expr.look[1] - (f.head ?? 0) * 0.7, -1, 1)];
  if (name !== "闭眼" && name !== "哼歌") expr.blink = Math.max(expr.blink, blinkAt(t, 3));

  // 头发、围巾的惯性
  let drag: [number, number] = [0, 0];
  if (prev) {
    const jp = oldPose(prev);
    const k = 0.0012 * (st.drag ?? 1);
    const vx = ((j.hip[0] - jp.hip[0]) / dt / s) * m;
    const vy = (j.hip[1] - jp.hip[1]) / dt / s;
    drag = [-clampAbs(vx * k, 0.9), -clampAbs(vy * k, 0.9)]; // 1.2 时往下坠头发甩成一对翅膀
  }
  const wind = st.wind ?? 0;
  const fl = clamp(f.float ?? 0);

  const pose: PoseIn = {
    face,
    headTurn: st.headTurn ?? 0,
    rot,
    lean,
    neck,
    breath: breathAt(t, 3),
    t,
    armL: armL as PoseIn["armL"],
    armR: armR as PoseIn["armR"],
    legL,
    legR,
    expr,
    float: fl,
    gravity: [0, 1 - 2 * fl],
    drag: [drag[0] + (face > 0 ? -wind : wind), drag[1]],
    items: { scarf: true, gloves: true, coat: true, band: true, boots, bricks: boots ? (st.bricks ?? 2) : 0 },
  };
  pose.hip = [0, grounded ? groundHip({ ...pose, hip: [0, 0] }, CHENGTUO) : 0];
  return { pose, ox, oy, s, hold: { L: st.holdNear, R: st.holdFar } };
}

/** 秤砣的关节（世界坐标），按旧人偶的名字（旧 L = 秤砣远侧 R，旧 R = 近侧 L）：手里的砖、脚上的绳子接在这里 */
function jointsWorld(p: Placed): Joints {
  const q = jointsOf(p.pose);
  const w = (v: [number, number]): Pt => [p.ox + v[0] * p.s, p.oy + v[1] * p.s];
  const head = w(q.head);
  const hr = 60 * p.s;
  return {
    hip: w(q.hip),
    neck: w(q.neck),
    head,
    headR: hr,
    shL: w(q.shoulderR),
    shR: w(q.shoulderL),
    elL: w(q.elbowR),
    elR: w(q.elbowL),
    handL: w(q.palmR),
    handR: w(q.palmL),
    knL: w(q.kneeR),
    knR: w(q.kneeL),
    anL: w(q.ankleR),
    anR: w(q.ankleL),
    toeL: w(q.ankleR),
    toeR: w(q.ankleL),
    top: head[1] - hr,
  };
}

export function qinJoints(f: Fig, t = 0): Joints {
  return jointsWorld(convert(f, t));
}

/**
 * 画秤砣。fig：按时间给出旧 Fig 的函数（画的时候顺便取上一刻算惯性），或者一个固定的 Fig。
 * 描边按她在画面上的大小定粗细：远了不糊成一团，推近了不显得笨重（经验：描边粗细跟着镜头走会变样）。
 */
export function qin(c: C, fig: Fig | ((t: number) => Fig), t: number): Joints {
  const f = typeof fig === "function" ? fig(t) : fig;
  const prev = typeof fig === "function" ? fig(t - 1 / 30) : undefined;
  const p = convert(f, t, prev);
  const alpha = f.alpha ?? 1;
  const j = jointsWorld(p);
  if (alpha <= 0.003) return j;
  const mt = c.getTransform();
  const px = (Math.hypot(mt.a, mt.b) / (env.width / W)) * p.s; // 设计像素 / 秤砣的一个单位
  const line = clamp((2.4 * Math.sqrt(px / 0.7)) / (3 * Math.max(px, 1e-3)), 0.6, 2.2);
  c.save();
  c.globalAlpha *= alpha;
  c.translate(p.ox, p.oy);
  c.scale(p.s, p.s);
  drawChengtuo(c, p.pose, { line, hold: p.hold });
  c.restore();
  return j;
}
