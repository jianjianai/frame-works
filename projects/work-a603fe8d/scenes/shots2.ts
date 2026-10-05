import {
  DW, DH, RED, INK, PAPER, SERIF, SANS, COVER, clamp, mix, phase, smooth, easeInOut, easeOut, easeIn, seeded, hash, wobble,
  vgrad, glow, text, rain, drift, roundRect, drawPerson, drawHand, camera, offscreen, loadImage, bubble, lightShaft, focusTrack,
  type ShotFactory, type Shot, type Env,
} from "./lib";
import { city, phone, grow, mute, cake } from "./shots1";

// ============ G 皱纹的手，把红纸折成护身符（20.65 – 23.7） ============
export const fold: ShotFactory = () => ({
  draw(ctx, t) {
    ctx.fillStyle = "#0e0d0c";
    ctx.fillRect(0, 0, DW, DH);
    glow(ctx, 540, 1000, 1000, "rgba(214,207,192,1)", 0.75, "source-over");
    lightShaft(ctx, t, { x1: 540, y1: -50, w1: 260, x2: 540, y2: 1500, w2: 1100, alpha: 0.14, seed: 21, dust: 24 });
    // 木纹
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 300 + i * 55);
      ctx.bezierCurveTo(360, 320 + i * 55 + Math.sin(i) * 20, 720, 280 + i * 55, DW, 300 + i * 55 + Math.cos(i) * 15);
      ctx.stroke();
    }
    ctx.save();
    camera(ctx, mix(1.0, 1.16, easeInOut(clamp(t / 3))), 540, 960, 540 + wobble(t, 2) * 5, 960, wobble(t, 5) * 0.01);
    const C = { x: 540, y: 1000 }, R = 300; // 菱形半对角线
    const s1 = easeInOut(phase(t, 0.3, 0.8));
    const s2 = easeInOut(phase(t, 0.95, 1.4));
    const s3 = easeInOut(phase(t, 1.5, 1.95));
    const lift = easeInOut(phase(t, 2.05, 2.55));
    const front = "#d61f2c", back = "#9e101b";
    ctx.save();
    ctx.translate(0, -lift * 300);
    if (s3 < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - s3;
      ctx.translate(C.x, C.y);
      ctx.scale(1 - s3 * 0.5, 1 - s3 * 0.5);
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 14;
      // 下半（右半 + 左半，左半第二步翻折）
      const tri = (pts: number[][], col: string) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
        ctx.closePath();
        ctx.fill();
      };
      tri([[0, 0], [R, 0], [0, R]], front);
      ctx.shadowBlur = 0;
      if (s2 < 0.5) tri([[0, 0], [-R, 0], [0, R]], front);
      // 第一步：上半向下翻
      const sy = Math.cos(s1 * Math.PI);
      const showTop = s1 < 1;
      if (showTop) {
        ctx.save();
        ctx.scale(1, sy);
        tri([[-R, 0], [R, 0], [0, -R]], sy >= 0 ? front : back);
        ctx.restore();
      }
      // 第二步：左角翻向右
      if (s1 >= 1) {
        const sx = Math.cos(s2 * Math.PI);
        ctx.save();
        ctx.scale(sx, 1);
        tri([[0, 0], [-R, 0], [0, R]], sx >= 0 ? back : front);
        ctx.restore();
      }
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-R * (1 - s2), 0);
      ctx.lineTo(R, 0);
      ctx.stroke();
      ctx.restore();
    }
    if (s3 > 0) {
      // 护身符
      ctx.save();
      ctx.translate(C.x, C.y);
      ctx.rotate(mix(0.5, -0.06, easeOut(s3)));
      const sc = mix(0.5, 1, easeOut(s3));
      ctx.scale(sc, sc);
      ctx.globalAlpha = s3;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 30;
      ctx.fillStyle = front;
      ctx.fillRect(-110, -190, 220, 380);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#f3e2b3";
      ctx.lineWidth = 5;
      ctx.strokeRect(-92, -172, 184, 344);
      ctx.lineWidth = 2;
      ctx.strokeRect(-80, -160, 160, 320);
      text(ctx, "平", 0, -62, 110, { weight: 900, color: "#f6e7bd" });
      text(ctx, "安", 0, 70, 110, { weight: 900, color: "#f6e7bd" });
      ctx.restore();
      glow(ctx, C.x, C.y, 260, "rgba(255,80,80,1)", 0.25 * s3);
    }
    // 两只苍老的手
    const lx = s3 > 0 ? mix(mix(C.x - R + 40, C.x + R * 0.1, s2), C.x - 170, s3) : mix(C.x - R + 40, C.x + R * 0.1, s2);
    const ly = C.y + 40 - Math.sin(s2 * Math.PI) * 80 - Math.sin(s1 * Math.PI) * 40;
    const rx = s3 > 0 ? mix(C.x + R - 30, C.x + 170, s3) : C.x + R - 30;
    drawHand(ctx, lx, ly + 150, mix(0.9, 0.45, s3), 1.0, { wrinkle: 1, color: "#1a1714", rim: "rgba(255,240,215,0.75)" });
    drawHand(ctx, rx, C.y + 190, mix(-0.85, -0.45, s3), 1.0, { wrinkle: 1, mirror: true, color: "#1a1714", rim: "rgba(255,240,215,0.75)" });
    ctx.restore();
    // 一只小手从上方伸来接住
    const kid = easeOut(phase(t, 2.0, 2.5));
    if (kid > 0) {
      const curl = smooth(phase(t, 2.6, 2.85));
      ctx.save();
      ctx.translate(C.x + 10, mix(-300, 470, kid));
      ctx.rotate(Math.PI);
      drawHand(ctx, 0, 0, 0, 0.62, { curl, color: "#0c0c0c", rim: "rgba(255,240,215,0.75)" });
      ctx.restore();
    }
    ctx.restore();
    // 交代时间：这是回忆
    const cap = smooth(phase(t, 0.1, 0.4)) * (1 - smooth(phase(t, 1.7, 2.0)));
    if (cap > 0) text(ctx, "他第一次离家上学那年", DW / 2, 560, 46, { weight: 700, color: PAPER, alpha: cap, shadow: "rgba(0,0,0,0.9)", blur: 16 });
  },
  // 视线跟着那张红纸走：折 → 变成护身符 → 被举起交到小手里
  focus: (t) => {
    const lift = easeInOut(phase(t, 2.05, 2.55));
    return { x: 540, y: mix(1000, 720, lift), r: mix(420, 380, lift), a: 0.45 };
  },
});

// ============ H 每年春节回家（23.7 – 27.39）：2016/2019/2022/2026 四次回家，每次妈妈老一点、他大一点 ============
export const door: ShotFactory = () => {
  const STEP = 0.92;
  const steps = [
    { year: "2016", stoop: 0.05, hair: 40, mom: 48 },
    { year: "2019", stoop: 0.14, hair: 70, mom: 51 },
    { year: "2022", stoop: 0.24, hair: 100, mom: 54 },
    { year: "2026", stoop: 0.34, hair: 130, mom: 58 },
  ];
  // 他：20 岁背书包 → 23 → 26 → 30 岁，个子更高、背更沉
  const sons = [
    { age: 20, h: 0.92, child: 0.12, stoop: 0, head: -0.05, bag: "pack" },
    { age: 23, h: 0.97, child: 0.04, stoop: 0.03, head: 0, bag: "case" },
    { age: 26, h: 1.0, child: 0, stoop: 0.1, head: 0.1, bag: "case" },
    { age: 30, h: 1.02, child: 0, stoop: 0.18, head: 0.2, bag: "case" },
  ] as const;
  return {
    draw(ctx, t) {
      const k = Math.min(3, Math.floor(t / STEP));
      const tk = t - k * STEP;
      const s = steps[k];
      ctx.save();
      camera(ctx, mix(1.18, 1.0, easeOut(t / 3.7)), 540, 1150, 540, 1050);
      vgrad(ctx, -200, -200, DW + 400, DH + 400, [[0, "#050506"], [1, "#101113"]]);
      const G = 1250;
      // 墙与门
      ctx.fillStyle = "#121315";
      ctx.fillRect(140, 520, 800, G - 520);
      ctx.fillStyle = "#0a0a0b";
      ctx.beginPath();
      ctx.moveTo(100, 540);
      ctx.lineTo(540, 330);
      ctx.lineTo(980, 540);
      ctx.fill();
      const flick = 1 - 0.5 * Math.exp(-tk / 0.05) * (k > 0 ? 1 : 0);
      vgrad(ctx, 430, 780, 220, G - 780, [[0, `rgba(240,235,222,${flick})`], [1, `rgba(210,204,190,${flick})`]]);
      glow(ctx, 540, 1000, 600, "rgba(240,232,215,1)", 0.35 * flick);
      // 门口洒下的光
      ctx.fillStyle = `rgba(230,224,210,${0.22 * flick})`;
      ctx.beginPath();
      ctx.moveTo(430, G);
      ctx.lineTo(650, G);
      ctx.lineTo(860, DH + 300);
      ctx.lineTo(120, DH + 300);
      ctx.fill();
      // 春联与灯笼
      ctx.fillStyle = "#b5121d";
      ctx.fillRect(372, 800, 44, 400);
      ctx.fillRect(664, 800, 44, 400);
      ctx.fillRect(445, 735, 190, 36);
      for (const [lx, ph] of [[300, 0], [780, 1.3]] as const) {
        ctx.save();
        ctx.translate(lx, 640);
        ctx.rotate(Math.sin(t * 2.2 + ph) * 0.07);
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(0, 30);
        ctx.stroke();
        glow(ctx, 0, 100, 200, "rgba(255,60,50,1)", 0.5);
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.ellipse(0, 100, 62, 72, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#7a0c12";
        ctx.fillRect(-30, 26, 60, 12);
        ctx.fillRect(-30, 164, 60, 12);
        ctx.strokeStyle = "#ff6b5a";
        ctx.beginPath();
        ctx.moveTo(0, 176);
        ctx.lineTo(0, 230);
        ctx.stroke();
        ctx.restore();
      }
      // 雪地 + 门口洒出的光
      ctx.fillStyle = "#0b0b0d";
      ctx.fillRect(-300, G, DW + 600, DH);
      ctx.fillStyle = "rgba(225,222,215,0.08)";
      ctx.fillRect(-300, G, DW + 600, 30);
      ctx.fillStyle = `rgba(230,224,210,${0.38 * flick})`;
      ctx.beginPath();
      ctx.moveTo(430, G);
      ctx.lineTo(650, G);
      ctx.lineTo(860, DH + 300);
      ctx.lineTo(120, DH + 300);
      ctx.fill();
      // 每一年：他从远处走回家，门口的妈妈迎上来（妈妈老一点，他也大一点）
      const son = sons[k];
      const q = easeOut(clamp(tk / 0.68));
      const sc = mix(1.55, 0.86, q) * son.h;
      const sx = mix(300, 470, q), sy = mix(1880, G + 30, q);
      const sh = 560 * sc;
      // 雪地上这一趟的脚印
      ctx.fillStyle = "rgba(10,10,12,0.55)";
      for (let u = 0.04; u < q - 0.04; u += 0.07) {
        const fx2 = mix(300, 470, u), fy2 = mix(1880, G + 30, u), sc2 = mix(1.55, 0.86, u) * son.h;
        const side = Math.round(u / 0.07) % 2 ? 1 : -1;
        ctx.beginPath();
        ctx.ellipse(fx2 + side * 10 * sc2, fy2 - 4, 16 * sc2, 6 * sc2, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      const arrived = q > 0.96;
      const hug = smooth(phase(tk, 0.62, 0.8));
      // 妈妈：先挥手，等他走近就伸手去接
      const wave = Math.sin(t * 7) * mix(46, 18, k / 3);
      const mom = drawPerson(ctx, {
        x: 560, y: G, h: mix(420, 405, k / 3), mom: true, dir: -1, stoop: s.stoop + hug * 0.08, hair: `rgb(${s.hair},${s.hair},${s.hair})`,
        handF: hug > 0 ? { x: mix(560 - 70 + wave, sx + 30, hug), y: mix(G - mix(470, 380, k / 3), G - sh * 0.62, hug) } : { x: 560 - 70 + wave, y: G - mix(470, 380, k / 3) },
        handB: hug > 0.3 ? { x: sx + 50, y: G - sh * 0.55 } : null,
      });
      // 他的行李：大学时背着书包，后来拖着行李箱
      const caseX = sx - sh * 0.3;
      if (son.bag === "case") {
        ctx.fillStyle = INK;
        roundRect(ctx, caseX - sh * 0.13, sy - sh * 0.42, sh * 0.26, sh * 0.4, sh * 0.03);
        ctx.fill();
        ctx.strokeStyle = INK;
        ctx.lineWidth = sh * 0.014;
        ctx.beginPath();
        ctx.moveTo(caseX + sh * 0.05, sy - sh * 0.42);
        ctx.lineTo(caseX + sh * 0.12, sy - sh * 0.56);
        ctx.stroke();
      }
      const me = drawPerson(ctx, {
        x: sx, y: sy, h: sh, dir: 1, child: son.child, walk: arrived ? undefined : t * 8, stride: 0.8, stoop: son.stoop, head: son.head,
        handB: son.bag === "case" && !arrived ? { x: caseX + sh * 0.12, y: sy - sh * 0.56 } : null,
        handF: arrived ? { x: 560 - 20, y: G - sh * 0.6 } : null,
        rim: { color: "rgba(245,238,222,0.9)", dx: 4, dy: -5, blur: 2.5 },
      });
      if (son.bag === "pack") {
        ctx.fillStyle = INK;
        roundRect(ctx, me.shoulder.x - sh * 0.15, me.shoulder.y + sh * 0.02, sh * 0.11, sh * 0.2, sh * 0.03);
        ctx.fill();
      }
      // 年龄标签
      const tag = (str: string, x: number, y: number, a: number) => {
        if (a <= 0) return;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = `600 28px ${SANS}`;
        const w = ctx.measureText(str).width + 34;
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        roundRect(ctx, x - w / 2, y - 24, w, 48, 24);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(str, x, y + 1);
        ctx.restore();
      };
      const ta = smooth(phase(tk, 0.12, 0.3));
      tag(`妈妈 · ${s.mom}岁`, mom.head.x + 80, mom.head.y - mom.headR - 46, ta);
      tag(`我 · ${son.age}岁`, me.head.x - 80, me.head.y - me.headR - 46, ta);
      // 地面
      ctx.restore();
      drift(ctx, t, { count: 60, seed: 9, kind: "snow", alpha: mix(0.4, 0.9, k / 3), speed: 120, wind: -40, size: 0.8 });
      text(ctx, "每年春节 · 回家 3 天", DW / 2, 420, 46, { weight: 600, color: PAPER, shadow: "rgba(0,0,0,0.9)", blur: 14, alpha: smooth(phase(t, 0.1, 0.4)) });
      text(ctx, s.year, DW / 2, 510, 80, { weight: 300, color: RED, spacing: 8, alpha: smooth(clamp(tk / 0.12)) });
    },
    // 年份 → 走回家的他 → 门口迎上来的妈妈
    focus: (t) => {
      const k = Math.min(3, Math.floor(t / STEP));
      const tk = t - k * STEP;
      const q = easeOut(clamp(tk / 0.68));
      const z = mix(1.18, 1.0, easeOut(t / 3.7));
      const wx = mix(300, 470, q), wy = mix(1880, 1280, q) - 300 * mix(1.55, 0.86, q);
      const toScreen = (x: number, y: number) => ({ x: 540 + (x - 540) * z, y: 1050 + (y - 1150) * z });
      const p1 = toScreen(wx, wy), p2 = toScreen(560, 1060);
      return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, r: mix(560, 380, q), a: 0.4 };
    },
  };
};

// ============ I 电话（反转）（27.39 – 30.69）：先看他 → 信号光甩镜 → 再看她 ============
// 0–1.45 他：妈妈问「吃饭了没？」→「吃了，挺好的」→「工作也挺顺利的」→（今天，被裁员了）
// 1.45–1.75 一道信号光从他的手机飞出去，镜头向上甩
// 1.75–3.3 她：特写「妈在家呢，都挺好」→ 拉开：病床、吊瓶 →（明早 8 点手术）
export const call: ShotFactory = () => {
  const T_WHIP = 1.45, T_WHIP_END = 1.75;
  const pill = (ctx: CanvasRenderingContext2D, t: number, y: number, a: number) => {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(20,20,22,0.85)";
    roundRect(ctx, DW / 2 - 150, y - 30, 300, 60, 30);
    ctx.fill();
    ctx.fillStyle = "#34c759";
    ctx.beginPath();
    ctx.arc(DW / 2 - 112, y, 9, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, `通话中 00:${String(23 + Math.floor(t)).padStart(2, "0")}`, DW / 2 + 14, y + 1, 28, { font: SANS, weight: 600, color: "#eee" });
    ctx.restore();
  };
  const sonScene = (ctx: CanvasRenderingContext2D, t: number) => {
    vgrad(ctx, -300, -300, DW + 600, DH + 600, [[0, "#0b0c0f"], [1, "#040405"]]);
    for (let j = 0; j < 7; j++)
      for (let i = 0; i < 9; i++) {
        if (hash(i * 13 + j * 7) < 0.5) continue;
        ctx.fillStyle = `rgba(200,205,210,${0.04 + hash(i + j * 3) * 0.08})`;
        ctx.fillRect(40 + i * 115, 120 + j * 70, 70, 40);
      }
    // 便利店的玻璃门在他身后亮着
    vgrad(ctx, 150, 600, 460, 470, [[0, "#e2e4e1"], [1, "#a9aca9"]]);
    glow(ctx, 380, 840, 620, "rgba(230,235,232,1)", 0.35);
    ctx.fillStyle = "#0b0c0f";
    ctx.fillRect(372, 600, 16, 470);
    ctx.fillRect(150, 600, 460, 16);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    for (let k = 0; k < 4; k++) ctx.fillRect(176, 680 + k * 90, 170, 8);
    text(ctx, "24H", 500, 650, 32, { font: SANS, weight: 800, color: "#333" });
    ctx.fillStyle = "#141518";
    for (let s = 0; s < 4; s++) ctx.fillRect(-300, 1070 + s * 66, DW + 600, 60);
    lightShaft(ctx, t, { x1: 380, y1: 1070, w1: 460, x2: 420, y2: 1330, w2: 760, alpha: 0.16, dust: 0 });
    rain(ctx, t, { count: 90, seed: 19, alpha: 0.28, len: 60, speed: 2000, slant: 0.06, x0: -200, x1: DW + 200, y0: -200, y1: 1400 });
    return drawPerson(ctx, {
      x: 380, y: 1150, h: 620, sit: 1, stoop: 0.35, head: 0.25, earF: true, handB: { x: 560, y: 1010 },
      rim: { color: "rgba(235,240,236,0.95)", dx: -5, dy: -3, blur: 2 },
    });
  };
  const momScene = (ctx: CanvasRenderingContext2D, t: number) => {
    vgrad(ctx, -300, -300, DW + 600, DH + 600, [[0, "#15181c"], [1, "#08090b"]]);
    // 病房的窗（月光）
    vgrad(ctx, 90, 420, 560, 560, [[0, "#68717c"], [1, "#b3bac2"]]);
    lightShaft(ctx, t, { x1: 370, y1: 980, w1: 560, x2: 600, y2: 1300, w2: 900, alpha: 0.12, dust: 14, seed: 8 });
    ctx.fillStyle = "#0d0f12";
    ctx.fillRect(90, 420, 560, 14);
    ctx.fillRect(90, 966, 560, 14);
    ctx.fillRect(90, 420, 14, 560);
    ctx.fillRect(636, 420, 14, 560);
    ctx.fillRect(363, 420, 14, 560);
    // 吊瓶
    ctx.strokeStyle = "#0d0f12";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(250, 1300); ctx.lineTo(250, 560); ctx.lineTo(310, 560);
    ctx.stroke();
    ctx.fillStyle = "#0d0f12";
    roundRect(ctx, 282, 568, 56, 110, 12);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(310, 678);
    ctx.bezierCurveTo(320, 880, 470, 960, 570, 1010);
    ctx.stroke();
    // 病床
    ctx.fillStyle = "#0b0c0e";
    ctx.fillRect(380, 930, 30, 380);
    ctx.fillRect(380, 1080, 800, 54);
    ctx.fillStyle = "#6f737a";
    roundRect(ctx, 470, 840, 74, 250, 24);
    ctx.fill();
    const mom = drawPerson(ctx, {
      x: 610, y: 1100, h: 600, mom: true, dir: 1, sit: 1, stoop: 0.15, head: 0.25, hair: "rgb(140,140,140)", earF: true, handB: { x: 720, y: 1010 },
      rim: { color: "rgba(220,228,236,0.9)", dx: -5, dy: -3, blur: 2 },
    });
    ctx.fillStyle = "#8e9196";
    ctx.beginPath();
    ctx.moveTo(570, 1085);
    ctx.bezierCurveTo(660, 980, 880, 990, 1180, 1030);
    ctx.lineTo(1180, 1090);
    ctx.lineTo(570, 1090);
    ctx.fill();
    ctx.fillStyle = "#08090a";
    ctx.fillRect(-300, 1134, DW + 600, 800);
    // 床头的病历卡
    ctx.fillStyle = "#d9dcdf";
    ctx.fillRect(392, 980, 70, 90);
    ctx.fillStyle = RED;
    ctx.fillRect(392, 980, 70, 14);
    return mom;
  };
  return {
    draw(ctx, t) {
      const whip = easeInOut(phase(t, T_WHIP, T_WHIP_END));
      if (whip < 1) {
        ctx.save();
        ctx.translate(0, whip * DH);
        ctx.save();
        camera(ctx, mix(1.0, 1.08, easeInOut(clamp(t / 1.45))), 540, 900, 540, 900);
        sonScene(ctx, t);
        ctx.restore();
        pill(ctx, t, 300, smooth(phase(t, 0, 0.15)));
        // 一行一行读：妈妈问 → 他答 → 他答 → 真相
        text(ctx, "妈妈", 620, 390, 26, { font: SANS, weight: 600, color: "#aaa", align: "left", alpha: smooth(phase(t, 0.08, 0.2)) });
        bubble(ctx, "吃饭了没？", 640, 420, { side: "left", p: clamp((t - 0.1) / 0.25), size: 40 });
        bubble(ctx, "吃了，挺好的", 1000, 560, { side: "right", p: clamp((t - 0.42) / 0.25), size: 40, bg: "#95ec69" });
        bubble(ctx, "工作也挺顺利的", 1000, 690, { side: "right", p: clamp((t - 0.75) / 0.25), size: 40, bg: "#95ec69" });
        const truth = smooth(phase(t, 1.0, 1.2));
        if (truth > 0) {
          text(ctx, "（今天，被裁员了）", 780, 870, 46, { weight: 800, color: RED, alpha: truth, shadow: "rgba(255,0,0,0.5)", blur: 16 });
          ctx.fillStyle = RED;
          ctx.fillRect(600, 905, 360 * smooth(phase(t, 1.1, 1.35)), 4);
        }
        ctx.restore();
      }
      if (whip > 0) {
        ctx.save();
        ctx.translate(0, -DH + whip * DH);
        const reveal = easeInOut(phase(t, 2.2, 2.7));
        ctx.save();
        camera(ctx, mix(2.0, 1.0, reveal), mix(650, 560, reveal), mix(760, 900, reveal), 540, mix(820, 900, reveal));
        momScene(ctx, t);
        ctx.restore();
        pill(ctx, t, 300, 1);
        bubble(ctx, "妈在家呢，都挺好", 80, 470, { side: "left", p: clamp((t - 1.8) / 0.25), size: 44 });
        const lie = smooth(phase(t, 2.7, 2.9));
        if (lie > 0) {
          text(ctx, "（明早 8 点手术）", 540, 1240, 48, { weight: 800, color: RED, alpha: lie, shadow: "rgba(0,0,0,0.9)", blur: 16 });
          ctx.fillStyle = RED;
          ctx.fillRect(360, 1276, 360 * smooth(phase(t, 2.8, 3.05)), 4);
        }
        ctx.restore();
      }
      // 甩镜：速度线 + 一道信号光
      const v = Math.sin(phase(t, T_WHIP, T_WHIP_END) * Math.PI);
      if (v > 0.01) {
        ctx.save();
        ctx.globalAlpha = v * 0.5;
        ctx.fillStyle = "#fff";
        for (let i = 0; i < 40; i++) {
          const x = hash(i * 3.1) * DW, y = ((hash(i * 7.3) + t * 6) % 1) * DH;
          ctx.fillRect(x, y, 2 + hash(i) * 3, 200 + hash(i * 2) * 400);
        }
        ctx.restore();
      }
      const sig = phase(t, T_WHIP - 0.1, T_WHIP_END);
      if (sig > 0 && sig < 1) {
        const sy = mix(900, -100, easeIn(sig));
        for (let k = 0; k < 8; k++) glow(ctx, 470, sy + k * 40, 60 - k * 5, "rgba(120,255,170,1)", 0.7 - k * 0.08);
        glow(ctx, 470, sy, 26, "#ffffff", 1);
      }
    },
    focus: focusTrack([[0, 760, 420, 280, 0.3], [0.45, 820, 600, 320, 0.4], [1.0, 760, 860, 360, 0.45], [1.45, 540, 900, 600, 0.2], [1.8, 560, 620, 360, 0.45], [2.25, 560, 620, 360, 0.45], [2.7, 540, 1000, 560, 0.35], [3.0, 540, 1150, 520, 0.35]]),
  };
};

// ============ J 病房：心电图跟着心跳（音乐）跳动（30.69 – 34.27） ============
export const ward: ShotFactory = (env) => {
  const ecg = (ctx: CanvasRenderingContext2D, t: number, x: number, y: number, w: number, h: number, col: string) => {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 4;
    ctx.shadowColor = col;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const tau = t - (1 - i / 120) * 2.0;
      const v = (env.beat(tau) - env.beat(tau - 0.035)) * 3.2;
      const spike = clamp(v, -0.4, 1);
      const yy = y + h / 2 - spike * h * 0.48 + Math.sin(tau * 40) * 1.5;
      if (i === 0) ctx.moveTo(x + (i / 120) * w, yy); else ctx.lineTo(x + (i / 120) * w, yy);
    }
    ctx.stroke();
    ctx.restore();
  };
  return {
    draw(ctx, t) {
      const second = t >= 1.9;
      const beat = env.beat(t);
      if (!second) {
        ctx.save();
        camera(ctx, mix(1.0, 1.1, easeInOut(t / 1.9)), 560, 900, 540, 900);
        vgrad(ctx, -100, -100, DW + 200, DH + 200, [[0, "#15181c"], [1, "#08090a"]]);
        // 大窗：夜色与月亮
        vgrad(ctx, 120, 330, 840, 760, [[0, "#5d6670"], [1, "#a9b1b9"]]);
        glow(ctx, 760, 480, 260, "rgba(240,245,250,1)", 0.9);
        ctx.fillStyle = "#eef2f5";
        ctx.beginPath();
        ctx.arc(760, 480, 46, 0, Math.PI * 2);
        ctx.fill();
        rain(ctx, t, { count: 40, seed: 31, alpha: 0.18, len: 40, speed: 700, slant: 0.04, x0: 120, x1: 960, y0: 330, y1: 1090 });
        ctx.fillStyle = "#0d0f12";
        ctx.fillRect(120, 330, 840, 18);
        ctx.fillRect(120, 1072, 840, 18);
        ctx.fillRect(120, 330, 18, 760);
        ctx.fillRect(942, 330, 18, 760);
        ctx.fillRect(531, 330, 18, 760);
        // 输液架
        ctx.strokeStyle = "#0d0f12";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(230, 1300);
        ctx.lineTo(230, 560);
        ctx.lineTo(300, 560);
        ctx.stroke();
        ctx.fillStyle = "#0d0f12";
        roundRect(ctx, 270, 570, 64, 120, 14);
        ctx.fill();
        ctx.fillStyle = "rgba(230,235,240,0.55)";
        roundRect(ctx, 280, 600, 44, 80, 10);
        ctx.fill();
        ctx.strokeStyle = "#0d0f12";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(302, 690);
        ctx.bezierCurveTo(310, 900, 400, 1000, 450, 1080);
        ctx.stroke();
        const dp = (t % 0.7) / 0.7;
        ctx.fillStyle = "rgba(230,235,240,0.9)";
        ctx.beginPath();
        ctx.arc(302, 700 + dp * 34, 5, 0, Math.PI * 2);
        ctx.fill();
        // 床和妈妈（剪影）
        ctx.fillStyle = "#0b0c0e";
        ctx.fillRect(280, 1010, 18, 300);
        ctx.fillRect(280, 1120, 760, 60);
        ctx.beginPath();
        ctx.ellipse(370, 1080, 95, 34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(385, 1045, 46, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(345, 1026, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(420, 1125);
        ctx.bezierCurveTo(470, 1050 - Math.sin(t * 2) * 5, 720, 1040, 1040, 1100);
        ctx.lineTo(1040, 1130);
        ctx.lineTo(420, 1130);
        ctx.fill();
        // 监护仪
        ctx.fillStyle = "#0b0c0e";
        roundRect(ctx, 700, 600, 300, 230, 14);
        ctx.fill();
        ctx.fillRect(840, 830, 14, 300);
        ctx.fillStyle = "#020303";
        ctx.fillRect(716, 616, 268, 168);
        ecg(ctx, t, 722, 630, 256, 130, "#e8f0ec");
        text(ctx, "HR 58", 975, 808, 22, { font: SANS, weight: 600, color: RED, align: "right" });
        glow(ctx, 850, 700, 380, "rgba(220,240,230,1)", 0.08 + beat * 0.14);
        // 他坐在床边，握着她的手
        ctx.fillStyle = "#08090a";
        ctx.fillRect(-100, 1300, DW + 200, 800);
        // 椅子
        ctx.fillRect(700, 1060, 20, 240);
        ctx.fillRect(560, 1150, 160, 18);
        lightShaft(ctx, t, { x1: 540, y1: 1090, w1: 840, x2: 600, y2: 1310, w2: 1150, alpha: 0.1, dust: 0 });
        drawPerson(ctx, { x: 640, y: 1300, h: 760, sit: 1, stoop: 0.6, head: 0.55, dir: -1, handF: { x: 480, y: 1110 }, handB: { x: 500, y: 1118 }, rim: { color: "rgba(220,230,240,0.9)", dx: -4, dy: -5, blur: 2.5 } });
        ctx.restore();
        text(ctx, "第二天，他还是知道了", DW / 2, 262, 50, { weight: 700, color: PAPER, alpha: smooth(phase(t, 0.1, 0.4)) * (1 - smooth(phase(t, 1.6, 1.85))), shadow: "rgba(0,0,0,0.9)", blur: 16 });
      } else {
        // 特写：两只手
        const tt = t - 1.9;
        ctx.save();
        camera(ctx, mix(1.0, 1.12, easeInOut(tt / 1.7)), 540, 1000, 540, 960);
        vgrad(ctx, -100, -100, DW + 200, DH + 200, [[0, "#3a3d42"], [0.5, "#8f9399"], [1, "#2a2c30"]]);
        ctx.strokeStyle = "rgba(0,0,0,0.12)";
        ctx.lineWidth = 6;
        for (let i = 0; i < 12; i++) {
          ctx.beginPath();
          ctx.moveTo(-100, 600 + i * 90);
          ctx.bezierCurveTo(300, 640 + i * 90, 700, 560 + i * 90, 1200, 620 + i * 90);
          ctx.stroke();
        }
        glow(ctx, 900, 400, 700, "rgba(235,245,240,1)", 0.12 + beat * 0.2);
        const twitch = Math.sin(phase(tt, 0.7, 1.1) * Math.PI) * 0.5;
        drawHand(ctx, 470, 1020, -1.35, 1.25, { wrinkle: 1, curl: twitch, color: "#151514", rim: "rgba(225,235,240,0.7)" });
        // 输液胶布
        ctx.save();
        ctx.translate(560, 1000);
        ctx.rotate(-1.35);
        ctx.fillStyle = "rgba(235,235,230,0.85)";
        ctx.fillRect(-60, -30, 120, 40);
        ctx.restore();
        drawHand(ctx, 680, 1150, -2.0, 1.15, { color: "#050505", rim: "rgba(225,235,240,0.6)" });
        ctx.restore();
        // 画面上方的心电图
        ecg(ctx, t, 60, 220, 960, 180, "rgba(255,255,255,0.85)");
        if (tt < 0.08) {
          ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - tt / 0.08)})`;
          ctx.fillRect(0, 0, DW, DH);
        }
      }
    },
    // 字幕 → 床边的他和她 → 心电图 → 切特写：两只手
    focus: focusTrack([[0, 540, 520, 500, 0.3], [0.5, 520, 1040, 430, 0.45], [1.15, 520, 1040, 430, 0.45], [1.5, 720, 860, 480, 0.4], [1.9, 560, 1020, 460, 0.4], [3.58, 560, 1020, 420, 0.45]]),
  };
};

// ============ K 倒带：人生快速倒放，一路退回童年（34.27 – 37.61） ============
export const rewind: ShotFactory = async (env) => {
  const shots: Record<string, [Shot, number]> = {};
  const add = async (name: string, f: ShotFactory, len: number) => { shots[name] = [await f(env), len]; };
  await add("ward", ward, 3.58);
  await add("call", call, 3.3);
  await add("door", door, 3.69);
  await add("fold", fold, 3.05);
  await add("cake", cake, 3.64);
  await add("mute", mute, 3.07);
  await add("grow", grow, 4.74);
    await add("phone", phone, 8.0);
  await add("city", city, 1.2);
  const seq: [string, number][] = [
    ["ward", 0.42], ["call", 0.36], ["door", 0.36], ["fold", 0.3], ["cake", 0.3], ["mute", 0.26], ["grow", 0.5], ["phone", 0.44], ["city", 0.2],
  ];
  const { canvas: noise, ctx: ng } = offscreen(270, 480);
  const r = seeded(77);
  const img = ng.createImageData(270, 480);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = r() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ng.putImageData(img, 0, 0);
  return {
    draw(ctx, t) {
      let acc = 0, idx = 0;
      while (idx < seq.length - 1 && t >= acc + seq[idx][1]) { acc += seq[idx][1]; idx++; }
      const [name, dur] = seq[idx];
      const u = clamp((t - acc) / dur);
      const [shot, len] = shots[name];
      ctx.save();
      shot.draw(ctx, mix(len, 0.05, u));
      ctx.restore();
      // 染红
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "rgb(255,70,72)";
      ctx.fillRect(0, 0, DW, DH);
      ctx.restore();
      // VHS 撕裂
      const f = Math.floor(t * 30);
      const dev = ctx.getTransform();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const cw = ctx.canvas.width, ch = ctx.canvas.height;
      for (let i = 0; i < 6; i++) {
        const sy = hash(f * 3.1 + i) * ch, sh = (10 + hash(f * 7.7 + i) * 60) * dev.d;
        const off = (hash(f * 1.3 + i * 5) - 0.5) * 120 * dev.a;
        ctx.drawImage(ctx.canvas, 0, sy, cw, sh, off, sy, cw, sh);
      }
      ctx.restore();
      // 跟踪噪点带
      const band = ((t * 0.9) % 1) * DH;
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.drawImage(noise, 0, (f % 7) * 20, 270, 40, 0, band, DW, 140);
      ctx.globalAlpha = 0.18;
      ctx.drawImage(noise, 0, (f % 5) * 30, 270, 30, 0, (band + 900) % DH, DW, 60);
      ctx.restore();
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      for (let y = 0; y < DH; y += 6) ctx.fillRect(0, y, DW, 2);
      // OSD
      text(ctx, "◀◀  REW", 70, 120, 54, { font: `"Courier New", monospace`, weight: 700, color: "#fff", align: "left", shadow: "rgba(0,0,0,0.8)", blur: 6 });
      const year = Math.round(mix(2026, 1999, easeIn(clamp(t / 3.1))));
      text(ctx, `${year}`, DW - 70, 120, 54, { font: `"Courier New", monospace`, weight: 700, color: "#fff", align: "right", shadow: "rgba(0,0,0,0.8)", blur: 6 });
      // 最后冲进白光
      const bloom = smooth(phase(t, 3.0, 3.34));
      if (bloom > 0) {
        ctx.fillStyle = `rgba(255,255,255,${bloom})`;
        ctx.fillRect(0, 0, DW, DH);
      }
    },
    dispose() { for (const [s] of Object.values(shots)) s.dispose?.(); },
  };
};

// ============ L 结尾：回到封面里的孩子，光里有妈妈（37.61 – 40） ============
export const ending: ShotFactory = async (env) => {
  const img = await loadImage(COVER);
  const opening = await city(env); // 结尾最后 0.3 秒回到开头第一帧，形成循环
  const S = 2048;
  const { canvas: cov, ctx: g } = offscreen(S, S);
  g.filter = "contrast(1.25)";
  g.drawImage(img, 0, 0, S, S);
  g.filter = "none";
  const tg = g.createLinearGradient(0, 0, 0, S * 0.13);
  tg.addColorStop(0, "rgb(34,34,34)");
  tg.addColorStop(0.7, "rgb(34,34,34)");
  tg.addColorStop(1, "rgba(34,34,34,0)");
  g.fillStyle = tg;
  g.fillRect(0, 0, S, S * 0.13);
  return {
    draw(ctx, t) {
      const fadeIn = smooth(clamp(t / 0.6));
      ctx.save();
      const z = mix(1.0, 1.1, easeOut(t / 2.4));
      camera(ctx, z, 520, 1000, 540, 980);
      const size = DH;
      ctx.drawImage(cov, DW / 2 - size / 2, 0, size, size);
      // 光里的妈妈
      const mom = smooth(phase(t, 0.35, 1.3));
      if (mom > 0) {
        ctx.save();
        // 妈妈的影子俯下身，手落在孩子头上（与封面同样的模糊剪影）
        ctx.globalAlpha = mom * 0.82;
        ctx.filter = `blur(${mix(26, 9, mom).toFixed(1)}px)`;
        const reach = easeInOut(phase(t, 0.6, 1.8));
        drawPerson(ctx, { x: 990, y: 2050, h: 1500, mom: true, dir: -1, stoop: 0.38, head: 0.3, color: "#1e1e1e", handF: { x: mix(820, 640, reach), y: mix(1150, 820, reach) }, armB: 0.1 });
        ctx.filter = "none";
        ctx.restore();
      }
      ctx.restore();
      ctx.fillStyle = `rgba(0,0,0,${1 - fadeIn})`;
      ctx.fillRect(0, 0, DW, DH);
      // 结尾卡片
      const card = smooth(phase(t, 1.0, 1.4));
      if (card > 0) {
        vgrad(ctx, 0, 1150, DW, DH - 1150, [[0, "rgba(0,0,0,0)"], [0.35, `rgba(0,0,0,${0.75 * card})`], [1, `rgba(0,0,0,${0.9 * card})`]]);
        text(ctx, "别等来不及", DW / 2, 1390, 46, { weight: 400, color: PAPER, alpha: card, spacing: 14 });
        const c2 = smooth(phase(t, 1.3, 1.7));
        text(ctx, "今天，给妈妈打个电话吧", DW / 2, 1490, 62, { weight: 900, color: "#fff", alpha: c2, shadow: "rgba(255,42,54,0.6)", blur: 22 });
        // 电话图标 + 振铃
        const ring = Math.sin(t * 40) * 0.12 * c2;
        ctx.save();
        ctx.translate(DW / 2, 1610);
        ctx.rotate(ring);
        ctx.globalAlpha = c2;
        ctx.fillStyle = RED;
        roundRect(ctx, -22, -36, 44, 72, 10);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(-14, -26, 28, 44);
        ctx.restore();
        ctx.strokeStyle = `rgba(255,42,54,${c2})`;
        ctx.lineWidth = 4;
        for (let i = 1; i <= 2; i++) {
          const q = ((t * 1.6) % 1);
          ctx.globalAlpha = c2 * (1 - q * 0.5);
          ctx.beginPath();
          ctx.arc(DW / 2, 1610, 50 + i * 22 + q * 10, -0.6, 0.6);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(DW / 2, 1610, 50 + i * 22 + q * 10, Math.PI - 0.6, Math.PI + 0.6);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      // 循环：妈妈又打来了
      const loop = smooth(phase(t, 1.72, 2.02));
      if (loop > 0) {
        ctx.save();
        ctx.globalAlpha = loop;
        opening.draw(ctx, 0);
        ctx.restore();
      }
    },
    // 「妈妈」→ 妈妈的手落在他头上 → 结尾卡片 → 回到开头的焦点（循环无缝）
    focus: focusTrack([[0, 540, 420, 440, 0.25], [0.7, 640, 820, 470, 0.3], [1.25, 540, 1460, 520, 0.3], [1.72, 540, 1460, 520, 0.3], [2.02, 540, 470, 470, 0.3]]),
    dispose() { opening.dispose?.(); },
  };
};

export type { Env };
