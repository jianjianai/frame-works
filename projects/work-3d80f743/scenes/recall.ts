// 终章第三声的回忆（图层 recall，offset = start：模块时间就是作品时间；时刻在 lib/end_t.ts 的 mem0…flip0）。
// 用户 2026-10-27 选的方案一「那一夜，是他把她拉回来的」：他朝她喊完，「下」就溶进主歌二那一夜（画 act4 的画面，蒙回忆的颜色），一直到 2:05.52：
//   ① 他喊着的脸溶成那一夜他咬着牙一把把拽她脚绳的脸（同一个位置、同样大小，再松开到那一夜的取景）——那一夜她也想走，是他把她拽回来的
//   ②「去」她被拽下来、落进铁靴「咚」，伸手摸摸他的头
//   ③ 他跪在地上哭着，把自己的红绳和她的脚绳一圈圈系在一起，一拉勒紧
//   ④ 天花板上两张床，系在一起的两根绳垂下去，她的手伸在他的床里牵着他
//   拍上切回现在：同一只手攥住栏杆（finale.ts 的近景）。他又来拉她了；这一次换她不松手。
// （之前几版：她在白的边上睁眼、七岁的她喊妈妈、妈妈飘走、「活下去」的木牌掉下来；用户：「这个回忆的内容我感觉不太行」）

import type { Scene, SceneOptions } from "@frame/engine/types";
import { E, ph, toScreen } from "../lib/cam";
import { memoryGrade } from "../lib/memory";
import { nwCam, nwHisHead } from "../lib/nightwin";
import { TE } from "../lib/end_t";
import { chainCam } from "../lib/end_cam";
import { kidAt } from "../lib/end_pair";
import { createScene as createNight } from "./act4";

/** 每一镜放 act4 的哪一段（act4 模块时间 = tau0 + rate ×（作品时间 − 这一镜开始）） */
const SHOTS = [
  /** ① 他拽她的脚绳（第二把 76.52 在 122.89） */
  { t0: TE.mem0, tau0: 76.05, rate: 1 },
  /** ② 落进铁靴「咚」（77.51 在 123.2），摸他的头（78.0） */
  { t0: TE.memBoots, tau0: 77.35, rate: 0.93 },
  /** ③ 系绳，「么」一拉勒紧（80.79 在 124.42） */
  { t0: TE.memKnot, tau0: 80.1, rate: 1.07 },
  /** ④ 两张床，牵着手（她去够灯绳 85.12 以前） */
  { t0: TE.memBeds, tau0: 84.62, rate: 0.5 },
];
/** 两镜之间叠化多久（以交界为中心） */
const DISSOLVE = 0.16;
const tauOf = (i: number, t: number) => SHOTS[i].tau0 + SHOTS[i].rate * (t - SHOTS[i].t0);

export async function createScene(options: SceneOptions): Promise<Scene> {
  const { width, height } = options;
  const night = await createNight(options);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const buf = document.createElement("canvas");
  buf.width = width;
  buf.height = height;
  const bctx = buf.getContext("2d")!;
  const base = new DOMMatrix([width / 1080, 0, 0, height / 1920, 0, 0]);
  const px = width / 1080;

  /**
   * ① 开头对上他的脸：他喊着的脸在画面上哪、多大，那一夜他的脸就在哪、多大（把那一夜的画面放大、挪过去），
   * 0.6 秒里柔和地松开到那一夜原来的取景（她在上面被他拽着）。放大最多 2.4 倍；看到的范围不出那一夜的画面
   */
  let MATCH: { s0: number; c0: [number, number] } | null = null;
  const matchOf = () => {
    if (MATCH) return MATCH;
    const t = TE.mem0;
    const n = chainCam(t);
    const b = kidAt(t).head;
    const sp = toScreen(n, b[0], b[1]);
    const tau = tauOf(0, t);
    const h = nwHisHead(tau);
    const c = nwCam(tau);
    const sa = toScreen(c, h.head[0], h.head[1]);
    const s0 = Math.min(2.4, Math.max(1, n.z / (c.z * h.k)));
    // 看到的那一块（act4 画面里，设计坐标）的中心：让 sa 落在 sp
    MATCH = { s0, c0: [sa[0] + (540 - sp[0]) / s0, sa[1] + (960 - sp[1]) / s0] };
    return MATCH;
  };
  /** 这一刻看 act4 画面的哪一块：中心、放大多少（设计坐标） */
  const viewAt = (i: number, t: number): { s: number; c: [number, number] } => {
    const sh = SHOTS[i];
    if (i === 0) {
      const m = matchOf();
      const e = E.io(ph(t, TE.mem0 + 0.12, TE.mem0 + 0.72));
      return { s: m.s0 * Math.pow(1 / m.s0, e), c: [m.c0[0] + (540 - m.c0[0]) * e, m.c0[1] + (960 - m.c0[1]) * e] };
    }
    // 其余几镜：极慢地推近一点（像想起来的时候往里看）
    return { s: 1 + 0.035 * ph(t, sh.t0 - DISSOLVE, sh.t0 + 1.0), c: [540, 960] };
  };
  /** 画一镜：act4 画这一刻，按看的那一块放大贴上来（不出 act4 画面的边） */
  const drawShot = (i: number, t: number, alpha: number) => {
    if (alpha <= 0.002) return;
    night.render(tauOf(i, t));
    const v = viewAt(i, t);
    const half = [540 / v.s, 960 / v.s];
    const cx = Math.min(1080 - half[0], Math.max(half[0], v.c[0]));
    const cy = Math.min(1920 - half[1], Math.max(half[1], v.c[1]));
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.translate(540 * px, 960 * px);
    ctx.scale(v.s, v.s);
    ctx.translate(-cx * px, -cy * px);
    ctx.drawImage(night.canvas, 0, 0);
    ctx.restore();
  };
  /** 像隔着一层水汽：糊一点的一层叠上去（screen），亮处发柔 */
  const soften = () => {
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, width, height);
    bctx.drawImage(canvas, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = `blur(${Math.max(1, Math.round((7 * width) / 1080))}px)`;
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.24;
    ctx.drawImage(buf, 0, 0);
    ctx.restore();
  };

  return {
    canvas,
    render(t) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#1c1820";
      ctx.fillRect(0, 0, width, height);
      // 这一镜；两镜交界前后各 DISSOLVE/2 叠化（先画出去的那一镜，再按分量盖上进来的那一镜）
      let i = 0;
      for (let k = 1; k < SHOTS.length; k++) if (t >= SHOTS[k].t0) i = k;
      let out = -1;
      let into = i;
      let w = 1;
      if (i > 0 && t < SHOTS[i].t0 + DISSOLVE / 2) {
        out = i - 1;
        w = E.soft(ph(t, SHOTS[i].t0 - DISSOLVE / 2, SHOTS[i].t0 + DISSOLVE / 2));
      } else if (i + 1 < SHOTS.length && t > SHOTS[i + 1].t0 - DISSOLVE / 2) {
        out = i;
        into = i + 1;
        w = E.soft(ph(t, SHOTS[i + 1].t0 - DISSOLVE / 2, SHOTS[i + 1].t0 + DISSOLVE / 2));
      }
      if (out >= 0) drawShot(out, t, 1);
      drawShot(into, t, out >= 0 ? w : 1);
      // 回忆的颜色：比十二年前那段淡一点（这是几天前的事）
      memoryGrade(ctx, base, 0.6);
      soften();
    },
    dispose() {
      night.dispose?.();
      canvas.width = canvas.height = 1;
      buf.width = buf.height = 1;
    },
  };
}
