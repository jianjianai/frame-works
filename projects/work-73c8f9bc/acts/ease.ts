// 动作曲线。原则是「该快的快、该停的停」：一个动作就是一下——起步快、落地稳，落点卡在拍子上，落定以后就停住，
// 不靠拉长时间、一直漂着来显得顺。冲击用 snap（带一点回弹）配 jolt（抖一下马上衰减）；只有情绪特写用 slow 慢推。
// emph   镜头重新取景、页面推入、手和身体的动作（静止 → 静止）：一帧起步就冲出去，22% 处最快，长而软的落地。
//        （Material 3 的 emphasized (0.2, 0, 0, 1) 在 0.3 秒的短动作里前两帧就走完一半多，看起来是跳，不是推）
// enter  出现、响应点击（页面推入、通知落下）：一开始就在动，轻轻停住
// exit   离开、甩出：越走越快
// snap   急推、弹出：0.15 秒左右冲到位，略过一点再回来
// slow   情绪特写的慢推（正弦，起止都缓）
// fade   只用于透明度和亮度
// bump / decay  一下一下的按压、抽泣；震动和余光的衰减
import { clamp } from "@frame/engine/math";

/** a CSS-style cubic-bezier(x1, y1, x2, y2) easing */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1,
    bx = 3 * (x2 - x1) - cx,
    ax = 1 - cx - bx;
  const cy = 3 * y1,
    by = 3 * (y2 - y1) - cy,
    ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  return (u: number) => {
    const x = clamp(u);
    if (x <= 0 || x >= 1) return x;
    // x(t) is monotonic on [0, 1]: bisection is exact enough and never goes astray
    let lo = 0,
      hi = 1,
      t = x;
    for (let i = 0; i < 24; i++) {
      if (sx(t) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

/** a move from one rest to another: quick off the mark (a one-frame ramp, fastest at 22%), a long soft landing */
export const emph = bezier(0.3, 0, 0.15, 1);
/** appearing, popping in, answering a tap: moving at once, settling */
export const enter = bezier(0, 0, 0.2, 1);
/** leaving the frame, whipping away: picks up speed as it goes */
export const exit = bezier(0.4, 0, 1, 1);
/** a snap to a new place: there in a flash, a touch past it, back */
export const snap = (t: number) => {
  const v = clamp(t);
  const c = 1.6;
  return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2);
};
/** the slow push of an emotional close-up: eases in and out */
export const slow = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t));
/** opacity / light only: smoothstep */
export const fade = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
/** a 0 → 1 → 0 bump centred on t with half-width w (a finger press, a sob) */
export const bump = (abs: number, t: number, w: number) => {
  const d = Math.abs(abs - t) / w;
  return d >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * d);
};
/** decays from 1 at t to 0 over len, quickly at first (a vibration dying away, a bulb's afterglow) */
export const decay = (abs: number, t: number, len: number) => (abs < t ? 0 : Math.pow(1 - clamp((abs - t) / len), 2));
