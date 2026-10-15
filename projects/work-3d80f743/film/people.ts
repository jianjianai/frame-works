// 人物：侧面的简单木偶（草稿用），手和脚用两节反向运动学找到目标点。
import { add, clamp, dir, dist, lerp, lerpAngle, lerpV, mul, sub, type V2 } from "./kit";

export interface Pose {
  hip: V2;
  /** 髋到颈的方向（弧度，y 向下：向上是 -π/2，向右是 0） */
  torso: number;
  /** 头相对躯干的倾斜 */
  neck: number;
  /** 脸朝哪一边：+1 是头轴顺时针 90°，-1 是逆时针；转身时从 +1 过渡到 -1 */
  face: number;
  hn: V2;
  hf: V2;
  fn: V2;
  ff: V2;
  /** 肘、膝的弯曲方向提示（世界坐标的点，关节会弯向它） */
  en?: V2;
  ef?: V2;
  kn?: V2;
  kf?: V2;
  eye: number;
  mouth: number;
  smile: number;
  brow: number;
  tear: number;
  hood: number;
  hum: number;
  s: number;
}

export const DEF = { eye: 1, mouth: 0, smile: 0, brow: 0, tear: 0, hood: 0, hum: 0, s: 1 };
export type PoseIn = Omit<Pose, keyof typeof DEF> & Partial<typeof DEF>;
export const P = (p: PoseIn): Pose => ({ ...DEF, ...p });

const mixHint = (a: V2 | undefined, b: V2 | undefined, p: number) => (a && b ? lerpV(a, b, p) : p < 0.5 ? a ?? b : b ?? a);
export function mixPose(a: Pose, b: Pose, p: number): Pose {
  return {
    hip: lerpV(a.hip, b.hip, p),
    torso: lerpAngle(a.torso, b.torso, p),
    neck: lerp(a.neck, b.neck, p),
    face: lerp(a.face, b.face, p),
    hn: lerpV(a.hn, b.hn, p),
    hf: lerpV(a.hf, b.hf, p),
    fn: lerpV(a.fn, b.fn, p),
    ff: lerpV(a.ff, b.ff, p),
    en: mixHint(a.en, b.en, p),
    ef: mixHint(a.ef, b.ef, p),
    kn: mixHint(a.kn, b.kn, p),
    kf: mixHint(a.kf, b.kf, p),
    eye: lerp(a.eye, b.eye, p),
    mouth: lerp(a.mouth, b.mouth, p),
    smile: lerp(a.smile, b.smile, p),
    brow: lerp(a.brow, b.brow, p),
    tear: lerp(a.tear, b.tear, p),
    hood: lerp(a.hood, b.hood, p),
    hum: lerp(a.hum, b.hum, p),
    s: lerp(a.s, b.s, p),
  };
}

export const L = { torso: 50, neck: 7, head: 11, ua: 29, fa: 26, th: 42, sh: 40 };

/** 两节 IK：从 root 伸向 target，关节弯向 hint。 */
function ik(root: V2, target: V2, a: number, b: number, hint: V2): [V2, V2] {
  let d = dist(root, target);
  let tgt = target;
  const maxR = a + b - 0.05;
  const minR = Math.abs(a - b) + 0.5;
  if (d < 0.001) {
    tgt = add(root, { x: minR, y: 0 });
    d = minR;
  } else if (d > maxR) {
    tgt = add(root, mul(sub(target, root), maxR / d));
    d = maxR;
  } else if (d < minR) {
    tgt = add(root, mul(sub(target, root), minR / d));
    d = minR;
  }
  const base = Math.atan2(tgt.y - root.y, tgt.x - root.x);
  const A = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const e1 = add(root, mul(dir(base + A), a));
  const e2 = add(root, mul(dir(base - A), a));
  return [dist(e1, hint) <= dist(e2, hint) ? e1 : e2, tgt];
}

export interface Skel {
  hip: V2;
  neck: V2;
  shoulder: V2;
  head: V2;
  hd: V2;
  fd: V2;
  headR: number;
  en: V2;
  hn: V2;
  ef: V2;
  hf: V2;
  kn: V2;
  fn: V2;
  kf: V2;
  ff: V2;
  mouth: V2;
  eye: V2;
  side: number;
}

export function skeleton(p: Pose): Skel {
  const s = p.s;
  const td = dir(p.torso);
  const neck = add(p.hip, mul(td, L.torso * s));
  const shoulder = add(p.hip, mul(td, (L.torso - 4) * s));
  const ha = p.torso + p.neck;
  const hd = dir(ha);
  const head = add(neck, mul(hd, (L.neck + L.head) * s));
  const side = p.face >= 0 ? 1 : -1;
  const fd = dir(ha + (side * Math.PI) / 2);
  const down = { x: 0, y: 30 * s };
  const [en, hn] = ik(shoulder, p.hn, L.ua * s, L.fa * s, p.en ?? add(shoulder, down));
  const [ef, hf] = ik(shoulder, p.hf, L.ua * s, L.fa * s, p.ef ?? add(shoulder, down));
  const kneeDefault = (f: V2) => add(lerpV(p.hip, f, 0.5), mul(fd, 25 * s));
  const [kn, fn] = ik(p.hip, p.fn, L.th * s, L.sh * s, p.kn ?? kneeDefault(p.fn));
  const [kf, ff] = ik(p.hip, p.ff, L.th * s, L.sh * s, p.kf ?? kneeDefault(p.ff));
  const mouth = add(head, add(mul(fd, 7.8 * s), mul(hd, -4.4 * s)));
  const eye = add(head, add(mul(fd, 5.6 * s), mul(hd, 1.8 * s)));
  return { hip: p.hip, neck, shoulder, head, hd, fd, headR: L.head * s, en, hn, ef, hf, kn, fn, kf, ff, mouth, eye, side };
}

export interface Look {
  skin: string;
  cloth: string;
  pants: string;
  hair?: string;
  hood?: string;
  long?: boolean;
  white?: boolean;
  bun?: boolean;
}

export const LOOK_HER: Look = { skin: "#c3c6cc", cloth: "#9196a0", pants: "#5d626b", hair: "#2c2f35", long: true };
export const LOOK_HIM: Look = { skin: "#bdc0c6", cloth: "#5e646e", pants: "#474b53", hood: "#555b65" };
export const LOOK_MOM: Look = { skin: "#bfc2c8", cloth: "#7c818a", pants: "#53575f", hair: "#34373d", bun: true };
export const LOOK_OLD: Look = { skin: "#b6b9bf", cloth: "#6c7179", pants: "#4b4f56", hair: "#a7abb2", white: true };
export const LOOK_GIRL: Look = { skin: "#c6c9cf", cloth: "#a3a8b1", pants: "#6a6f78", hair: "#2c2f35", long: true };
export const LOOK_BOY: Look = { skin: "#c0c3c9", cloth: "#6b717b", pants: "#50545c" };
const NPC_CLOTH = ["#6a6f78", "#5f646d", "#737881", "#585c64", "#7a7f88", "#646973"];
export const lookNpc = (k: number): Look => ({
  skin: "#b3b6bc",
  cloth: NPC_CLOTH[k % NPC_CLOTH.length],
  pants: "#4c5058",
  hair: k % 3 === 0 ? "#34373d" : undefined,
  long: k % 3 === 0,
  white: k % 7 === 3,
});

const dark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const f = 0.72;
  return `rgb(${Math.round(((n >> 16) & 255) * f)},${Math.round(((n >> 8) & 255) * f)},${Math.round((n & 255) * f)})`;
};

function limb(ctx: CanvasRenderingContext2D, a: V2, b: V2, c: V2, w1: number, w2: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w1;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.lineWidth = w2;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.stroke();
}
function dot(ctx: CanvasRenderingContext2D, p: V2, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 画一个人。zoom 是每单位多少像素，用来决定画不画五官。
 */
export function drawPerson(ctx: CanvasRenderingContext2D, p: Pose, look: Look, zoom: number, t: number) {
  const k = skeleton(p);
  const s = p.s;
  const px = zoom * s;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // 远侧的腿和手臂（暗一点）
  limb(ctx, k.hip, k.kf, k.ff, 12 * s, 10 * s, dark(look.pants));
  limb(ctx, k.shoulder, k.ef, k.hf, 8.5 * s, 7.5 * s, dark(look.cloth));
  dot(ctx, k.hf, 4.6 * s, dark(look.skin));
  // 帽子垂在背后
  const back = mul(k.fd, -1);
  if (look.hood && p.hood < 0.5) {
    ctx.fillStyle = look.hood;
    ctx.beginPath();
    const c = add(k.neck, add(mul(back, 6 * s), mul(k.hd, -2 * s)));
    ctx.ellipse(c.x, c.y, 9 * s, 6 * s, Math.atan2(k.hd.y, k.hd.x), 0, Math.PI * 2);
    ctx.fill();
  }
  // 躯干
  ctx.strokeStyle = look.cloth;
  ctx.lineWidth = 23 * s;
  ctx.beginPath();
  ctx.moveTo(k.hip.x, k.hip.y);
  ctx.lineTo(k.shoulder.x, k.shoulder.y);
  ctx.stroke();
  // 近侧的腿
  limb(ctx, k.hip, k.kn, k.fn, 12 * s, 10 * s, look.pants);
  // 脖子
  ctx.strokeStyle = look.skin;
  ctx.lineWidth = 8 * s;
  ctx.beginPath();
  ctx.moveTo(k.shoulder.x, k.shoulder.y);
  ctx.lineTo(k.neck.x + k.hd.x * 4 * s, k.neck.y + k.hd.y * 4 * s);
  ctx.stroke();
  const fa = Math.atan2(k.fd.y, k.fd.x);
  // 帽子戴起来：先画在头后面
  if (look.hood && p.hood >= 0.5) {
    ctx.fillStyle = look.hood;
    const c = add(k.head, mul(back, 2.6 * s));
    dot(ctx, c, 14.5 * s, look.hood);
    void c;
  }
  // 长发：后脑的一片和垂下来的一缕
  if (look.hair && look.long) {
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.arc(k.head.x, k.head.y, 12.3 * s, fa + Math.PI * 0.42, fa + Math.PI * 1.62);
    ctx.closePath();
    ctx.fill();
    const nape = add(k.head, add(mul(back, 7 * s), mul(k.hd, -7 * s)));
    const g = { x: -k.hd.x * 0.35, y: 1 };
    const gl = Math.hypot(g.x, g.y);
    ctx.strokeStyle = look.hair;
    ctx.lineWidth = 8 * s;
    ctx.beginPath();
    ctx.moveTo(nape.x, nape.y);
    ctx.lineTo(nape.x + (g.x / gl) * 15 * s, nape.y + (g.y / gl) * 15 * s);
    ctx.stroke();
  }
  // 头
  dot(ctx, k.head, k.headR, look.skin);
  // 短发 / 白发 / 发髻
  if (look.hair && !look.long) {
    ctx.fillStyle = look.hair;
    ctx.beginPath();
    ctx.arc(k.head.x, k.head.y, 11.8 * s, fa + Math.PI * 0.55, fa + Math.PI * 1.45);
    ctx.closePath();
    ctx.fill();
  }
  if (look.bun && look.hair) dot(ctx, add(k.head, add(mul(back, 11 * s), mul(k.hd, 4 * s))), 4.5 * s, look.hair);
  if (look.white) {
    ctx.strokeStyle = "#b9bdc3";
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.arc(k.head.x, k.head.y, 11.5 * s, fa + Math.PI * 0.6, fa + Math.PI * 1.35);
    ctx.stroke();
  }
  if (!look.hair && !look.hood && !look.white) {
    // 小男孩的短发
    ctx.fillStyle = "#33363c";
    ctx.beginPath();
    ctx.arc(k.head.x, k.head.y, 11.6 * s, fa + Math.PI * 0.5, fa + Math.PI * 1.5);
    ctx.closePath();
    ctx.fill();
  }
  // 帽沿盖住头顶和后脑
  if (look.hood && p.hood >= 0.5) {
    ctx.strokeStyle = look.hood;
    ctx.lineWidth = 5 * s;
    ctx.beginPath();
    ctx.arc(k.head.x, k.head.y, 12.5 * s, fa + Math.PI * 0.32, fa + Math.PI * 1.68);
    ctx.stroke();
  }
  // 五官（转身中途不画）
  if (px > 2 && Math.abs(p.face) > 0.35) drawFace(ctx, p, k, t);
  // 近侧的手臂
  limb(ctx, k.shoulder, k.en, k.hn, 8.5 * s, 7.5 * s, look.cloth);
  dot(ctx, k.hn, 4.6 * s, look.skin);
  ctx.restore();
}

function drawFace(ctx: CanvasRenderingContext2D, p: Pose, k: Skel, t: number) {
  const s = p.s;
  const { fd, hd, head } = k;
  const pt = (f: number, h: number) => ({ x: head.x + fd.x * f * s + hd.x * h * s, y: head.y + fd.y * f * s + hd.y * h * s });
  // 鼻子
  ctx.fillStyle = "#c3c6cc";
  const n1 = pt(10.4, 1.8);
  const n2 = pt(12.7, -0.6);
  const n3 = pt(10.4, -1.8);
  ctx.beginPath();
  ctx.moveTo(n1.x, n1.y);
  ctx.lineTo(n2.x, n2.y);
  ctx.lineTo(n3.x, n3.y);
  ctx.closePath();
  ctx.fill();
  // 眼睛
  const e = k.eye;
  ctx.strokeStyle = "#1c1d21";
  ctx.fillStyle = "#1c1d21";
  if (p.eye < 0.25) {
    const a = pt(4.2, 1.6);
    const b = pt(7.0, 1.6);
    const c = pt(5.6, 0.7);
    ctx.lineWidth = 0.9 * s;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
    ctx.stroke();
  } else {
    const r = (p.eye > 1.05 ? 1.55 : 1.2) * s * clamp(0.55 + p.eye * 0.45, 0.5, 1.2);
    dot(ctx, e, r, "#1c1d21");
    if (p.eye > 1.05) {
      ctx.lineWidth = 0.5 * s;
      ctx.beginPath();
      ctx.arc(e.x, e.y, r + 0.9 * s, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // 眉毛（难过时前端抬起）
  const b1 = pt(4.0, 4.6);
  const b2 = pt(7.4, 4.6 + p.brow * 1.6);
  ctx.lineWidth = 0.9 * s;
  ctx.beginPath();
  ctx.moveTo(b1.x, b1.y);
  ctx.lineTo(b2.x, b2.y);
  ctx.stroke();
  // 嘴
  const m = k.mouth;
  if (p.mouth > 0.06) {
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(Math.atan2(hd.y, hd.x));
    ctx.fillStyle = "#17181b";
    ctx.beginPath();
    ctx.ellipse(0, 0, (0.6 + 2.6 * p.mouth) * s, 1.9 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    const a = pt(6.6, -4.4 + p.smile * 0.9);
    const b = pt(9.0, -4.4);
    const c = pt(7.6, -4.4 - p.smile * 0.7);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
    ctx.stroke();
  }
  // 眼泪：沿着脸往下流
  if (p.tear > 0.02) {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.55 + i / 3) % 1;
      const y = e.y + ph * 10 * s;
      ctx.fillStyle = `rgba(214,224,236,${(0.85 * (1 - ph) * p.tear).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(e.x + fd.x * 0.8 * s, y + 1.5 * s, 0.9 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // 哼歌：喉咙边上的一圈圈波纹（有声音，没有光）
  if (p.hum > 0.02) {
    const c = add(k.neck, add(mul(fd, 5.5 * s), mul(hd, 3 * s)));
    const fa = Math.atan2(fd.y, fd.x);
    ctx.lineWidth = 0.7 * s;
    for (let i = 0; i < 3; i++) {
      const ph = (t * 1.6 + i / 3) % 1;
      ctx.strokeStyle = `rgba(178,188,202,${(0.75 * (1 - ph) * p.hum).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, (3 + ph * 9) * s, fa - 0.7, fa + 0.7);
      ctx.stroke();
    }
  }
}

/** 远景里的人：只画躯干和头（很小的时候用） */
export function drawTiny(ctx: CanvasRenderingContext2D, p: Pose, look: Look) {
  const k = skeleton(p);
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = look.cloth;
  ctx.lineWidth = 24 * p.s;
  ctx.beginPath();
  ctx.moveTo(k.hip.x, k.hip.y);
  ctx.lineTo(k.shoulder.x, k.shoulder.y);
  ctx.stroke();
  ctx.lineWidth = 12 * p.s;
  ctx.strokeStyle = look.pants;
  ctx.beginPath();
  ctx.moveTo(k.hip.x, k.hip.y);
  ctx.lineTo(k.kn.x, k.kn.y);
  ctx.lineTo(k.fn.x, k.fn.y);
  ctx.stroke();
  dot(ctx, k.head, 12 * p.s, look.skin);
  ctx.restore();
}

/** 婴儿：一个襁褓 */
export function drawBaby(ctx: CanvasRenderingContext2D, at: V2, angle: number, s = 1) {
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.rotate(angle);
  ctx.fillStyle = "#8d929b";
  ctx.beginPath();
  ctx.ellipse(0, 0, 13 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c7cad0";
  ctx.beginPath();
  ctx.arc(10 * s, -1 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
