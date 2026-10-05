import {
  DW, DH, RED, INK, PAPER, SERIF, SANS, clamp, mix, phase, smooth, easeInOut, easeOut, easeIn, seeded, hash, wobble,
  bump, vgrad, glow, text, typed, rain, drift, roundRect, drawPerson, drawHand, camera, offscreen, shake,
  type ShotFactory,
} from "./lib";

const lerpColor = (a: number[], b: number[], t: number) =>
  `rgb(${Math.round(mix(a[0], b[0], t))},${Math.round(mix(a[1], b[1], t))},${Math.round(mix(a[2], b[2], t))})`;

// ============ A 雨夜城市：推进一扇亮着的窗（0 – 2.9） ============
export const city: ShotFactory = () => {
  const r = seeded(11);
  type B = { x: number; w: number; top: number; lit: boolean[] };
  const layer = (n: number, base: number, hmin: number, hmax: number, wmin: number, wmax: number) => {
    const out: B[] = [];
    let x = -300;
    for (let i = 0; i < n && x < DW + 300; i++) {
      const w = mix(wmin, wmax, r());
      out.push({ x, w, top: base - mix(hmin, hmax, r()), lit: Array.from({ length: 80 }, () => r() < 0.22) });
      x += w + r() * 30;
    }
    return out;
  };
  const far = layer(40, 1300, 250, 650, 70, 160);
  const mid = layer(30, 1420, 350, 820, 120, 220);
  const TX = 540, TY = 1120; // 目标窗户中心
  const drawLayer = (ctx: CanvasRenderingContext2D, bs: B[], col: string, win: string, ww: number, wh: number, gx: number, gy: number) => {
    for (const b of bs) {
      ctx.fillStyle = col;
      ctx.fillRect(b.x, b.top, b.w, DH * 2);
      ctx.fillStyle = win;
      let k = 0;
      for (let y = b.top + 30; y < b.top + 1400; y += gy)
        for (let x = b.x + 16; x + ww < b.x + b.w - 10; x += gx) if (b.lit[k++ % 80]) ctx.fillRect(x, y, ww, wh);
    }
  };
  return {
    draw(ctx, t) {
      const p = clamp(t / 2.9);
      const Z = 30;
      const z = Math.exp(Math.log(Z) * (0.1 * p + 0.9 * Math.pow(p, 4)));
      const cy = mix(1120, 960, easeInOut(p));
      vgrad(ctx, 0, 0, DW, DH, [[0, "#07080b"], [0.6, "#1b1d22"], [1, "#0b0c0e"]]);
      glow(ctx, 800, 360, 360, "rgba(220,225,235,0.5)", 0.6);
      ctx.save();
      camera(ctx, 1 + (z - 1) * 0.06, TX, TY, TX, cy);
      drawLayer(ctx, far, "#17191d", "rgba(140,145,150,0.35)", 14, 20, 34, 46);
      vgrad(ctx, -2000, 1150, DW + 4000, 300, [[0, "rgba(40,42,48,0)"], [1, "rgba(40,42,48,0.8)"]]);
      ctx.restore();
      ctx.save();
      camera(ctx, 1 + (z - 1) * 0.25, TX, TY, TX, cy);
      drawLayer(ctx, mid, "#0e0f12", "rgba(170,170,165,0.45)", 20, 30, 46, 62);
      ctx.restore();
      // 近景：目标楼
      ctx.save();
      camera(ctx, z, TX, TY, TX, cy);
      ctx.fillStyle = "#050506";
      ctx.fillRect(TX - 240, 640, 480, 2000);
      ctx.fillRect(TX - 260, 630, 520, 20);
      for (let j = 0; j < 9; j++)
        for (let k = 0; k < 5; k++) {
          const x = 380 + k * 80, y = 730 + j * 130;
          const target = k === 2 && j === 3;
          if (target) continue;
          ctx.fillStyle = hash(j * 7 + k) < 0.18 ? "rgba(150,150,145,0.5)" : "#0d0e10";
          ctx.fillRect(x - 27, y - 42, 54, 84);
        }
      // 那扇窗：屋里的他坐在床边，手机的光
      ctx.save();
      ctx.beginPath();
      ctx.rect(TX - 27, TY - 42, 54, 84);
      ctx.clip();
      vgrad(ctx, TX - 27, TY - 42, 54, 84, [[0, "#cfcabd"], [1, "#8d897f"]]);
      glow(ctx, TX + 6, TY + 14, 30, "rgba(255,255,255,0.9)", 0.9);
      ctx.fillStyle = "#3a3833";
      ctx.fillRect(TX - 27, TY + 26, 54, 16);
      drawPerson(ctx, { x: TX + 2, y: TY + 34, h: 46, sit: 1, stoop: 0.5, head: 0.5, handF: { x: TX + 9, y: TY + 18 }, handB: { x: TX + 7, y: TY + 20 } });
      glow(ctx, TX + 9, TY + 17, 6, "#fff", 1);
      // 窗帘
      ctx.fillStyle = "rgba(20,20,20,0.85)";
      ctx.fillRect(TX - 27, TY - 42, 9, 84);
      ctx.fillRect(TX + 20, TY - 42, 7, 84);
      ctx.restore();
      ctx.strokeStyle = "#1c1d20";
      ctx.lineWidth = 3;
      ctx.strokeRect(TX - 27, TY - 42, 54, 84);
      ctx.restore();
      // 雨
      rain(ctx, t, { count: 150, seed: 3, alpha: 0.28, len: 70, speed: 2600, slant: 0.1, width: 2 });
      rain(ctx, t, { count: 40, seed: 4, alpha: 0.18, len: 160, speed: 4200, slant: 0.1, width: 4 });
      // 文案
      const ca = smooth(phase(t, 0.15, 0.5)) * (1 - smooth(phase(t, 2.2, 2.55)));
      if (ca > 0) {
        ctx.save();
        ctx.globalAlpha = ca;
        text(ctx, "00:47", DW / 2, 300, 150, { font: SANS, weight: 200, color: PAPER, spacing: 6 });
        text(ctx, typed("第 3 次，没接妈妈的电话", t, 0.4, 16), DW / 2, 420, 46, { weight: 600, color: PAPER, shadow: "rgba(0,0,0,0.9)" });
        ctx.fillStyle = RED;
        ctx.fillRect(DW / 2 - 30, 480, 60 * smooth(phase(t, 1.2, 1.5)), 4);
        ctx.restore();
      }
    },
  };
};

// ============ B 手机：妈妈的消息，打字又删掉（2.9 – 6.16） ============
export const phone: ShotFactory = () => {
  const r = seeded(21);
  const bokeh = Array.from({ length: 26 }, () => ({ x: r() * DW, y: r() * 900, rad: 30 + r() * 90, a: 0.05 + r() * 0.12 }));
  const PW = 600, PH = 1220;
  const msgs = [
    { at: 0.1, text: "睡了吗？", time: "23:12" },
    { at: 0.4, text: "降温了，记得多穿点", time: "23:40" },
    { at: 0.7, text: "妈不打扰你了，早点睡", time: "00:31" },
  ];
  const draft = "妈，我想你了";
  return {
    draw(ctx, t) {
      const screenOn = 1 - smooth(phase(t, 2.58, 2.7));
      ctx.fillStyle = "#040405";
      ctx.fillRect(0, 0, DW, DH);
      // 背后的雨窗散景
      for (const b of bokeh) glow(ctx, b.x, b.y + t * 6, b.rad, "rgba(200,205,215,1)", b.a * (0.4 + 0.6 * screenOn));
      rain(ctx, t, { count: 50, seed: 8, alpha: 0.08, len: 90, speed: 900, slant: 0.05, y1: 900 });
      glow(ctx, 540, 900, 1100, "rgba(230,232,240,1)", 0.22 * screenOn);
      ctx.save();
      const z = mix(1, 1.07, easeInOut(clamp(t / 3.2)));
      camera(ctx, z, 540, 880, 540 + wobble(t, 1) * 6, 900 + wobble(t, 4) * 6, -0.035 + wobble(t, 2) * 0.006);
      const x0 = 540 - PW / 2, y0 = 880 - PH / 2;
      // 机身
      ctx.fillStyle = "#151515";
      roundRect(ctx, x0 - 16, y0 - 16, PW + 32, PH + 32, 86);
      ctx.fill();
      ctx.save();
      roundRect(ctx, x0, y0, PW, PH, 70);
      ctx.clip();
      ctx.fillStyle = "#f2f1ed";
      ctx.fillRect(x0, y0, PW, PH);
      // 状态栏 + 标题
      text(ctx, "00:47", x0 + 70, y0 + 52, 28, { font: SANS, weight: 600, color: "#111", align: "left" });
      ctx.fillStyle = "#111";
      ctx.fillRect(x0 + PW - 110, y0 + 42, 50, 22);
      ctx.fillStyle = "#e9e8e4";
      ctx.fillRect(x0, y0 + 90, PW, 100);
      text(ctx, "‹", x0 + 40, y0 + 140, 56, { font: SANS, weight: 400, color: "#111" });
      text(ctx, "妈妈", x0 + PW / 2, y0 + 140, 38, { font: SANS, weight: 700, color: "#111" });
      ctx.fillStyle = "#d2d0ca";
      ctx.fillRect(x0, y0 + 190, PW, 2);
      // 未接来电
      const missA = smooth(phase(t, 0, 0.2));
      ctx.globalAlpha = missA;
      ctx.fillStyle = "#e2e0db";
      roundRect(ctx, x0 + PW / 2 - 170, y0 + 222, 340, 50, 25);
      ctx.fill();
      text(ctx, "未接语音通话 × 3", x0 + PW / 2, y0 + 248, 26, { font: SANS, weight: 500, color: RED });
      ctx.globalAlpha = 1;
      // 妈妈的消息
      msgs.forEach((m, i) => {
        const mp = clamp((t - m.at) / 0.25);
        if (mp <= 0) return;
        const y = y0 + 320 + i * 150;
        ctx.globalAlpha = mp;
        text(ctx, m.time, x0 + PW / 2, y - 22, 20, { font: SANS, weight: 400, color: "#9a9893" });
        ctx.fillStyle = "#9c9890";
        roundRect(ctx, x0 + 30, y, 70, 70, 12);
        ctx.fill();
        text(ctx, "妈", x0 + 65, y + 36, 34, { font: SERIF, weight: 900, color: "#fff" });
        ctx.globalAlpha = 1;
        const bx = x0 + 128, by = y + 4 + (1 - easeOut(mp)) * 20;
        ctx.save();
        ctx.globalAlpha = mp;
        ctx.font = `500 32px ${SANS}`;
        const w = ctx.measureText(m.text).width + 48;
        ctx.fillStyle = "#ffffff";
        roundRect(ctx, bx, by, w, 66, 14);
        ctx.fill();
        ctx.fillStyle = "#111";
        ctx.textBaseline = "middle";
        ctx.fillText(m.text, bx + 24, by + 34);
        ctx.restore();
      });
      // 输入框 + 键盘
      const ky = y0 + PH - 430;
      ctx.fillStyle = "#e6e4df";
      ctx.fillRect(x0, ky - 110, PW, 540);
      ctx.fillStyle = "#fff";
      roundRect(ctx, x0 + 24, ky - 92, PW - 160, 70, 14);
      ctx.fill();
      let shown = "";
      if (t < 2.05) shown = typed(draft, t, 1.15, 8);
      else shown = [...draft].slice(0, Math.max(0, draft.length - Math.floor((t - 2.05) * 16))).join("");
      text(ctx, shown, x0 + 46, ky - 56, 32, { font: SANS, weight: 500, color: "#111", align: "left" });
      ctx.font = `500 32px ${SANS}`;
      const cw = ctx.measureText(shown).width;
      if (Math.floor(t * 2.2) % 2 === 0 || (t > 1.15 && t < 2.5)) {
        ctx.fillStyle = "#1a7cff";
        ctx.fillRect(x0 + 48 + cw, ky - 78, 3, 42);
      }
      ctx.fillStyle = shown ? "#2b2b2b" : "#c9c7c1";
      roundRect(ctx, x0 + PW - 120, ky - 88, 96, 62, 12);
      ctx.fill();
      text(ctx, "发送", x0 + PW - 72, ky - 57, 26, { font: SANS, weight: 600, color: "#fff" });
      for (let row = 0; row < 4; row++)
        for (let k = 0; k < 10; k++) {
          ctx.fillStyle = "#fbfaf8";
          roundRect(ctx, x0 + 14 + k * 57.5, ky + row * 92, 50, 78, 10);
          ctx.fill();
        }
      // 锁屏
      if (screenOn < 1) {
        ctx.fillStyle = `rgba(0,0,0,${1 - screenOn})`;
        ctx.fillRect(x0, y0, PW, PH);
        ctx.globalAlpha = (1 - screenOn) * 0.12;
        const g = ctx.createLinearGradient(x0, y0, x0 + PW, y0 + PH);
        g.addColorStop(0.3, "rgba(255,255,255,0)");
        g.addColorStop(0.45, "rgba(255,255,255,1)");
        g.addColorStop(0.6, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x0, y0, PW, PH);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      // 手：拇指打字
      const typing = t > 1.1 && t < 2.5;
      const tap = typing ? Math.abs(Math.sin(t * 22)) : 0;
      const thumbX = x0 + PW - 120 + (typing ? Math.sin(t * 9) * 140 - 60 : 0);
      const thumbY = ky + 120 + tap * 18;
      ctx.fillStyle = INK;
      ctx.strokeStyle = INK;
      ctx.lineCap = "round";
      ctx.lineWidth = 120;
      ctx.beginPath();
      ctx.moveTo(x0 + PW + 160, y0 + PH + 260);
      ctx.quadraticCurveTo(x0 + PW + 40, ky + 300, thumbX, thumbY);
      ctx.stroke();
      // 左侧握着机身的指尖
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(x0 - 4, y0 + PH - 420 + i * 105, 34, 46, 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.lineWidth = 90;
      ctx.beginPath();
      ctx.moveTo(x0 - 160, y0 + PH + 200);
      ctx.quadraticCurveTo(x0 - 60, y0 + PH - 200, x0 - 30, y0 + PH - 420);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(540, y0 + PH + 260, 560, 300, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // 熄屏后：只剩黑暗里的一点反光
      if (screenOn < 1) glow(ctx, 540, 900, 500, "rgba(120,125,135,1)", 0.06 * (1 - screenOn));
    },
  };
};

// ============ C 老照片 + 一滴眼泪（6.16 – 9.2） ============
export const photo: ShotFactory = () => {
  const PWd = 720, PHt = 900;
  const { canvas: pc, ctx: g } = offscreen(PWd, PHt);
  // 照片本体
  g.fillStyle = "#e9e4d8";
  g.fillRect(0, 0, PWd, PHt);
  const ix = 40, iy = 40, iw = PWd - 80, ih = PHt - 180;
  g.save();
  g.beginPath();
  g.rect(ix, iy, iw, ih);
  g.clip();
  vgrad(g, ix, iy, iw, ih, [[0, "#b9b5ab"], [0.65, "#ece8de"], [0.66, "#5d5a54"], [1, "#3d3b37"]]);
  glow(g, ix + iw * 0.72, iy + ih * 0.42, 260, "rgba(255,255,250,1)", 0.9);
  // 年轻的妈妈抱着刚满周岁的孩子
  const gx = ix + iw * 0.42, gy = iy + ih * 0.93;
  drawPerson(g, { x: gx + 78, y: gy - 205, h: 150, child: 1, dir: -1, sit: 0.9, head: -0.25, handF: { x: gx + 40, y: gy - 380 }, handB: { x: gx + 46, y: gy - 370 }, color: "#1d1c1a" });
  drawPerson(g, { x: gx, y: gy, h: 470, mom: true, dir: 1, head: 0.3, handF: { x: gx + 110, y: gy - 290 }, handB: { x: gx + 85, y: gy - 215 }, color: "#1d1c1a" });
  // 斑驳
  const r = seeded(31);
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
    g.fillRect(ix + r() * iw, iy + r() * ih, 2 + r() * 3, 2 + r() * 3);
  }
  g.strokeStyle = "rgba(255,255,255,0.35)";
  g.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    const sx = ix + r() * iw, sy = iy + r() * ih;
    g.moveTo(sx, sy);
    g.quadraticCurveTo(sx + r() * 80, sy + 60 + r() * 120, sx + r() * 40 - 20, sy + 200 + r() * 200);
    g.stroke();
  }
  g.restore();
  const vg = g.createRadialGradient(PWd / 2, iy + ih / 2, ih * 0.3, PWd / 2, iy + ih / 2, ih * 0.75);
  vg.addColorStop(0, "rgba(60,45,20,0)");
  vg.addColorStop(1, "rgba(60,45,20,0.45)");
  g.fillStyle = vg;
  g.fillRect(ix, iy, iw, ih);
  g.font = `700 34px "Courier New", monospace`;
  g.fillStyle = "#ff7a2a";
  g.shadowColor = "#ff5a1a";
  g.shadowBlur = 10;
  g.textAlign = "right";
  g.fillText("'98  6  12", ix + iw - 24, iy + ih - 26);
  g.shadowBlur = 0;
  g.font = `400 34px ${SERIF}`;
  g.fillStyle = "#57534a";
  g.textAlign = "center";
  g.fillText("宝宝一周岁", PWd / 2, PHt - 72);

  const C = { x: 540, y: 840 };
  const face = { x: C.x - 33, y: C.y - 168 }; // 照片里妈妈的脸（大致）
  return {
    draw(ctx, t) {
      const lamp = 1 - 0.85 * smooth(phase(t, 2.0, 2.35));
      vgrad(ctx, 0, 0, DW, DH, [[0, "#1a1816"], [1, "#0b0a09"]]);
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 3;
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 52 + Math.sin(i) * 10);
        ctx.bezierCurveTo(400, i * 52 + 20, 700, i * 52 - 20, DW, i * 52 + Math.cos(i) * 10);
        ctx.stroke();
      }
      ctx.save();
      const z = mix(1.0, 1.18, easeInOut(clamp(t / 2.3))) * mix(1, 1.45, easeIn(phase(t, 2.3, 3.04)));
      const fx = mix(C.x, face.x, easeInOut(phase(t, 2.0, 3.0)));
      const fy = mix(C.y, face.y + 80, easeInOut(phase(t, 2.0, 3.0)));
      camera(ctx, z, fx, fy, 540 + wobble(t, 3) * 4, 900, mix(0.05, 0, easeOut(t / 2.5)));
      ctx.save();
      ctx.translate(C.x, C.y);
      ctx.rotate(-0.07);
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 18;
      const blur = 8 * (1 - smooth(phase(t, 0, 0.7)));
      if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
      ctx.drawImage(pc, -PWd / 2, -PHt / 2);
      ctx.filter = "none";
      ctx.restore();
      // 拇指轻轻摩挲照片里的妈妈
      const th = smooth(phase(t, 0.8, 1.3)) * (1 - smooth(phase(t, 2.0, 2.4)));
      if (th > 0) {
        // 食指尖落在照片里妈妈的脸上
        const sx = face.x + 10 + Math.sin((t - 0.8) * 3.2) * 18;
        const sy = face.y + 10;
        drawHand(ctx, mix(1350, sx + 107, th), mix(1900, sy + 126, th), -0.62, 0.7, { curl: 0.15, color: "#0b0b0b" });
      }
      // 眼泪
      const fall = phase(t, 2.5, 2.98);
      if (fall > 0 && fall < 1) {
        const y = mix(face.y - 900, face.y + 40, fall * fall);
        ctx.save();
        ctx.translate(face.x + 20, y);
        ctx.fillStyle = "rgba(220,230,240,0.85)";
        ctx.beginPath();
        ctx.moveTo(0, -46);
        ctx.bezierCurveTo(14, -16, 22, 0, 22, 12);
        ctx.arc(0, 12, 22, 0, Math.PI);
        ctx.bezierCurveTo(-22, 0, -14, -16, 0, -46);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-7, 8, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      const hit = t - 2.98;
      if (hit > 0) {
        for (let i = 0; i < 3; i++) {
          const rr = (hit * 900 + i * 40);
          ctx.strokeStyle = `rgba(255,255,255,${0.6 - i * 0.15})`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(face.x + 20, face.y + 40, rr, rr * 0.55, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.restore();
      // 台灯光
      glow(ctx, 160, 200, 1300, "rgba(255,245,225,1)", 0.28 * lamp);
      ctx.fillStyle = `rgba(0,0,0,${0.15 + (1 - lamp) * 0.6})`;
      ctx.fillRect(0, 0, DW, DH);
      if (lamp < 0.9) glow(ctx, face.x + 20, face.y + 40, 380, "rgba(255,255,255,1)", (1 - lamp) * 0.25);
    },
  };
};

// ============ D 时光：牵着手走过四季，孩子长大，妈妈变老（9.2 – 13.94） ============
export const grow: ShotFactory = (env) => {
  const r = seeded(41);
  const trees = Array.from({ length: 30 }, (_, i) => ({ x: i * 240 + r() * 120, h: 220 + r() * 220, w: 110 + r() * 90 }));
  const hillSeed = r() * 10;
  const GROUND = 1200;
  const skyA = [[206, 201, 190], [242, 238, 229]], skyB = [[38, 40, 45], [128, 131, 137]];
  return {
    draw(ctx, t) {
      const a = easeInOut(clamp(t / 4.5));
      const winter = smooth(phase(t, 3.2, 4.2));
      const beat = env.beat(t);
      ctx.save();
      shake(ctx, t, beat * 8);
      const z = mix(1.12, 1.0, easeOut(t / 4.7)) * (1 + beat * 0.012);
      camera(ctx, z, 540, 960, 540, 960);
      vgrad(ctx, -200, -200, DW + 400, GROUND + 200, [[0, lerpColor(skyA[0], skyB[0], a)], [1, lerpColor(skyA[1], skyB[1], a)]]);
      // 太阳慢慢落下
      const sunY = mix(720, 1120, a);
      glow(ctx, 760, sunY, 520, "rgba(255,252,240,1)", mix(0.8, 0.35, a));
      ctx.fillStyle = `rgba(255,253,246,${mix(0.95, 0.5, a)})`;
      ctx.beginPath();
      ctx.arc(760, sunY, 120, 0, Math.PI * 2);
      ctx.fill();
      // 远山
      const s1 = t * 70;
      ctx.fillStyle = lerpColor([182, 178, 170], [88, 90, 96], a);
      ctx.beginPath();
      ctx.moveTo(-200, GROUND);
      for (let x = -200; x <= DW + 200; x += 20) ctx.lineTo(x, GROUND - 170 - Math.sin((x + s1) * 0.004 + hillSeed) * 70 - Math.sin((x + s1) * 0.011) * 30);
      ctx.lineTo(DW + 200, GROUND);
      ctx.fill();
      // 树（中景）
      const s2 = t * 230;
      ctx.fillStyle = lerpColor([128, 124, 117], [58, 60, 65], a);
      for (const tr of trees) {
        const x = ((tr.x - s2) % 7200 + 7200) % 7200 - 300;
        if (x < -300 || x > DW + 300) continue;
        ctx.fillRect(x - 9, GROUND - tr.h, 18, tr.h);
        const crown = mix(1, 0.3, winter) * (1 - 0.25 * smooth(phase(t, 2.4, 3.2)));
        if (crown > 0.05) {
          for (let k = 0; k < 5; k++) {
            ctx.beginPath();
            ctx.arc(x + Math.cos(k * 1.3) * tr.w * 0.45, GROUND - tr.h - Math.sin(k * 2.1) * tr.w * 0.3, tr.w * 0.45 * crown, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.lineWidth = 6;
          ctx.strokeStyle = ctx.fillStyle as string;
          for (let k = -1; k <= 1; k++) {
            ctx.beginPath();
            ctx.moveTo(x, GROUND - tr.h * 0.7);
            ctx.lineTo(x + k * 60, GROUND - tr.h - 60);
            ctx.stroke();
          }
        }
      }
      // 电线杆（近景）
      const s3 = t * 480;
      ctx.strokeStyle = "#0b0b0c";
      ctx.fillStyle = "#0b0b0c";
      const poleX = (k: number) => ((k * 820 - s3) % 3280 + 3280) % 3280 - 600;
      for (let k = 0; k < 4; k++) {
        const x = poleX(k);
        ctx.fillRect(x - 10, GROUND - 760, 20, 760);
        ctx.fillRect(x - 70, GROUND - 720, 140, 10);
      }
      ctx.lineWidth = 2.5;
      for (let k = 0; k < 4; k++) {
        const x1 = poleX(k), x2 = x1 + 820;
        for (const off of [-60, 60]) {
          ctx.beginPath();
          ctx.moveTo(x1 + off, GROUND - 715);
          ctx.quadraticCurveTo((x1 + x2) / 2 + off, GROUND - 640, x2 + off, GROUND - 715);
          ctx.stroke();
        }
      }
      // 地面
      vgrad(ctx, -200, GROUND, DW + 400, DH - GROUND + 300, [[0, "#0d0d0e"], [1, "#000"]]);
      ctx.fillStyle = "#0d0d0e";
      for (let k = 0; k < 60; k++) {
        const x = ((k * 61 - t * 480) % 3660 + 3660) % 3660 - 300;
        ctx.beginPath();
        ctx.moveTo(x, GROUND + 2);
        ctx.lineTo(x + 8, GROUND - 18 - (k % 3) * 8);
        ctx.lineTo(x + 14, GROUND + 2);
        ctx.fill();
      }
      // 季节
      drift(ctx, t, { count: 40, seed: 5, kind: "petal", alpha: 0.8 * (1 - smooth(phase(t, 1.0, 1.4))), speed: 160, wind: -220, color: "#ffffff" });
      drift(ctx, t, { count: 34, seed: 6, kind: "leaf", alpha: 0.85 * bump(t, 2.2, 2.6, 3.4, 3.8), speed: 260, wind: -320, color: "#1a1a1a" });
      // 母子
      const kidH = mix(240, 610, a);
      const child = 1 - smooth(phase(a, 0.12, 0.7));
      const momStoop = mix(0, 0.5, smooth(phase(a, 0.3, 1)));
      const kidX = 440, momX = 650;
      const holdY = GROUND - mix(215, 300, a) + Math.sin(t * 7.5) * 4;
      const hold = { x: (kidX + momX) / 2 + mix(10, -15, a), y: holdY };
      const hair = Math.round(mix(7, 165, smooth(phase(a, 0.35, 1))));
      const mom = drawPerson(ctx, { x: momX, y: GROUND, h: mix(560, 545, a), mom: true, walk: t * mix(7.5, 6, a), stride: mix(1, 0.55, a), stoop: momStoop, handB: hold, cane: a > 0.78, hair: `rgb(${hair},${hair},${hair})` });
      const kid = drawPerson(ctx, { x: kidX, y: GROUND, h: kidH, child, walk: t * mix(11, 6, a) + 1, stride: mix(1.2, 0.6, a), handF: hold });
      drift(ctx, t, { count: 70, seed: 7, kind: "snow", alpha: 0.9 * winter, speed: 140, wind: -90, color: "#fff", size: 0.9 });
      // 年龄标签
      const tag = (str: string, x: number, y: number) => {
        ctx.save();
        ctx.font = `600 30px ${SANS}`;
        const w = ctx.measureText(str).width + 36;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        roundRect(ctx, x - w / 2, y - 26, w, 52, 26);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(str, x, y + 1);
        ctx.restore();
      };
      const tagA = smooth(phase(t, 0.3, 0.6));
      ctx.globalAlpha = tagA;
      tag(`我 · ${Math.round(mix(3, 33, a))}岁`, kid.head.x, kid.head.y - kid.headR - 60);
      tag(`妈妈 · ${Math.round(mix(27, 57, a))}岁`, mom.head.x, mom.head.y - mom.headR - 60);
      ctx.globalAlpha = 1;
      ctx.restore();
      // 年份
      const year = Math.round(mix(1996, 2026, a));
      text(ctx, String(year), DW / 2, 290, 170, { weight: 300, color: RED, spacing: 10, shadow: "rgba(0,0,0,0.35)", blur: 20 });
      const cap = smooth(phase(t, 2.6, 3.0));
      if (cap > 0) text(ctx, "这条路，她走得越来越慢", DW / 2, 410, 42, { weight: 600, color: PAPER, alpha: cap, shadow: "rgba(0,0,0,0.8)", blur: 14 });
    },
  };
};

// ============ E 分屏：6岁疼了会哭 / 26岁疼了不说（13.94 – 17.01） ============
export const mute: ShotFactory = () => {
  const PH = 900, STRIP = 120;
  return {
    draw(ctx, t) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, DW, DH);
      // ---- 上：童年 ----
      const inTop = easeOut(phase(t, 0, 0.3));
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, DW, PH);
      ctx.clip();
      ctx.translate(-(1 - inTop) * DW, 0);
      vgrad(ctx, 0, 0, DW, PH, [[0, "#d8d3c8"], [1, "#f1ede4"]]);
      glow(ctx, 820, 200, 380, "rgba(255,255,250,1)", 0.8);
      const G = 760;
      ctx.fillStyle = "#2a2826";
      ctx.fillRect(0, G, DW, PH - G);
      const fall = smooth(phase(t, 0.45, 0.7));
      const sitUp = smooth(phase(t, 0.85, 1.05));
      const kx = mix(160, 470, easeOut(phase(t, 0, 0.6)));
      ctx.save();
      ctx.translate(kx, G);
      ctx.rotate(fall * (1 - sitUp) * 1.25);
      const kid = drawPerson(ctx, {
        x: 0, y: 0, h: 260, child: 1, walk: sitUp > 0 ? undefined : t * 14, sit: sitUp, head: sitUp * -0.5,
        handF: sitUp > 0.5 ? { x: 40, y: -150 } : null, handB: sitUp > 0.5 ? { x: 30, y: -140 } : null,
      });
      ctx.restore();
      // 哭声
      const cry = smooth(phase(t, 0.95, 1.1)) * (1 - smooth(phase(t, 1.85, 2.15)));
      if (cry > 0) {
        const hx = kx + 30, hy = G - 175;
        for (let i = 0; i < 4; i++) {
          const q = ((t * 1.8 + i * 0.25) % 1);
          ctx.strokeStyle = `rgba(20,20,20,${(1 - q) * 0.7 * cry})`;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(hx, hy, 40 + q * 220, -1.2, 0.2);
          ctx.stroke();
        }
        ctx.save();
        ctx.translate(hx + 230 + (hash(Math.floor(t * 30)) - 0.5) * 10, hy - 170);
        ctx.rotate(-0.12);
        text(ctx, "哇——", 0, 0, 120, { weight: 900, color: "#111", alpha: cry });
        ctx.restore();
      }
      void kid;
      // 妈妈跑过来抱住
      const run = easeOut(phase(t, 1.2, 1.75));
      if (run > 0) {
        const kneel = smooth(phase(t, 1.7, 1.95));
        drawPerson(ctx, {
          x: mix(1200, kx + 215, run), y: G, h: 560, mom: true, dir: -1, walk: kneel > 0.5 ? undefined : t * 12, sit: kneel * 0.7, stoop: kneel * 0.6, head: kneel * 0.3,
          handF: kneel > 0.3 ? { x: kx + 10, y: G - 150 } : null, handB: kneel > 0.3 ? { x: kx + 50, y: G - 120 } : null,
        });
      }
      ctx.restore();
      // ---- 下：成年 ----
      const inBot = easeOut(phase(t, 0.08, 0.4));
      const by = PH + STRIP;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, by, DW, PH);
      ctx.clip();
      ctx.translate((1 - inBot) * DW, by);
      ctx.fillStyle = "#0b0c0e";
      ctx.fillRect(0, 0, DW, PH);
      // 路灯光锥
      const cone = ctx.createLinearGradient(0, 80, 0, 780);
      cone.addColorStop(0, "rgba(235,232,222,0.55)");
      cone.addColorStop(1, "rgba(235,232,222,0.12)");
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(700, 90);
      ctx.lineTo(760, 90);
      ctx.lineTo(1000, 780);
      ctx.lineTo(260, 780);
      ctx.fill();
      ctx.fillStyle = "#1c1c1e";
      ctx.fillRect(820, 60, 18, 800);
      ctx.fillRect(700, 60, 140, 26);
      glow(ctx, 730, 92, 120, "rgba(255,255,245,1)", 0.9);
      ctx.fillStyle = "#18191b";
      ctx.fillRect(0, 760, DW, 40);
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 800, DW, 100);
      rain(ctx, t, { count: 90, seed: 12, alpha: 0.35, len: 60, speed: 2200, slant: 0.08, y1: PH });
      const man = drawPerson(ctx, {
        x: 470, y: 760, h: 560, sit: 1, stoop: 0.45, head: 0.45,
        handF: { x: 610, y: 600 }, handB: { x: 600, y: 610 },
      });
      // 封住的嘴
      const tape = easeOut(phase(t, 1.95, 2.15));
      if (tape > 0) {
        const mx = man.head.x + man.headR * 0.55, my = man.head.y + man.headR * 0.45;
        ctx.save();
        ctx.translate(mx, my);
        ctx.scale(mix(2, 1, tape), mix(2, 1, tape));
        ctx.globalAlpha = clamp(tape * 2);
        ctx.strokeStyle = RED;
        ctx.lineWidth = 12;
        ctx.lineCap = "round";
        for (const s of [1, -1]) {
          ctx.beginPath();
          ctx.moveTo(-26, -20 * s);
          ctx.lineTo(26, 20 * s);
          ctx.stroke();
        }
        ctx.restore();
      }
      // 一条平直的“静音”声波
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 3;
      ctx.setLineDash([14, 12]);
      ctx.beginPath();
      ctx.moveTo(man.head.x + 90, man.head.y + 30);
      ctx.lineTo(man.head.x + 330, man.head.y + 30);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      // 标签
      const label = (str: string, y: number, a: number, dark: boolean) => {
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = `700 38px ${SERIF}`;
        const w = ctx.measureText(str).width + 44;
        ctx.fillStyle = dark ? "rgba(0,0,0,0.75)" : "rgba(255,255,255,0.12)";
        const lx = DW - 50 - w;
        roundRect(ctx, lx, y, w, 70, 8);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.textBaseline = "middle";
        ctx.fillText(str, lx + 22, y + 37);
        ctx.fillStyle = RED;
        ctx.fillRect(DW - 58, y, 8, 70);
        ctx.restore();
      };
      label("6岁 · 疼了会哭", 60, smooth(phase(t, 0.3, 0.5)), true);
      label("26岁 · 疼了不说", by + 60, smooth(phase(t, 0.45, 0.65)), false);
    },
  };
};

// ============ F 生日蛋糕：35 → 48 → 62 → 100，桌边的人越来越少（17.01 – 20.65） ============
export const cake: ShotFactory = () => {
  const STEP = 0.91;
  const cuts = [
    { n: "35", kid: "small", hair: 10, stoop: 0 },
    { n: "48", kid: "teen", hair: 60, stoop: 0.1 },
    { n: "62", kid: "video", hair: 120, stoop: 0.3 },
    { n: "100", kid: "none", hair: 200, stoop: 0.55 },
  ] as const;
  return {
    draw(ctx, t) {
      const k = Math.min(3, Math.floor(t / STEP));
      const tk = t - k * STEP;
      const c = cuts[k];
      const blow = k === 3 ? smooth(phase(tk, 0.45, 0.6)) : 0;
      const light = 1 - blow * 0.8;
      ctx.fillStyle = "#070707";
      ctx.fillRect(0, 0, DW, DH);
      ctx.save();
      const z = [1.0, 1.12, 1.05, 1.22][k] + tk * 0.04;
      camera(ctx, z, 540, 1050, 540, 1000);
      // 烛光照亮的墙
      glow(ctx, 540, 900, 900, "rgba(235,228,212,1)", 0.55 * light);
      const TABLE = 1300;
      // 人物（桌后）
      const hair = c.hair;
      drawPerson(ctx, { x: 690, y: TABLE + 60, h: 820, mom: true, dir: -1, sit: 1, stoop: c.stoop + blow * 0.15, head: 0.15, hair: `rgb(${hair},${hair},${hair})`, handF: { x: 600, y: TABLE - 30 }, handB: { x: 630, y: TABLE - 20 } });
      if (c.kid === "small") {
        const kidP = drawPerson(ctx, { x: 330, y: TABLE - 60, h: 420, child: 1, dir: 1, sit: 0.8, armF: 2.7, armB: 2.3 });
        ctx.fillStyle = "#070707";
        const hx = kidP.head.x, hy = kidP.head.y - kidP.headR * 0.7;
        ctx.beginPath();
        ctx.moveTo(hx - 36, hy + 6);
        ctx.lineTo(hx + 36, hy + 6);
        ctx.lineTo(hx + 4, hy - 90);
        ctx.fill();
        glow(ctx, hx + 4, hy - 92, 16, "#fff", 0.9);
      } else if (c.kid === "teen") {
        drawPerson(ctx, { x: 300, y: TABLE + 60, h: 800, child: 0.1, dir: 1, sit: 1, stoop: 0.35, head: 0.6, handF: { x: 420, y: TABLE - 190 }, handB: { x: 405, y: TABLE - 180 } });
        ctx.fillStyle = "#fff";
        ctx.fillRect(408, TABLE - 215, 28, 46);
        glow(ctx, 420, TABLE - 195, 110, "rgba(255,255,255,1)", 0.5);
      } else {
        // 空椅子
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(250, TABLE - 330, 22, 330);
        ctx.fillRect(250, TABLE - 330, 160, 22);
        ctx.fillRect(250, TABLE - 230, 160, 12);
      }
      // 桌子
      vgrad(ctx, -100, TABLE, DW + 200, DH - TABLE + 200, [[0, "#d9d4c8"], [0.08, "#8f8a80"], [1, "#1a1918"]]);
      ctx.globalAlpha = light;
      glow(ctx, 540, TABLE + 40, 600, "rgba(255,248,230,1)", 0.4);
      ctx.globalAlpha = 1;
      if (c.kid === "video") {
        // 立着的手机：视频通话里的儿子
        ctx.fillStyle = "#111";
        roundRect(ctx, 220, TABLE - 230, 140, 250, 18);
        ctx.fill();
        ctx.fillStyle = "#cfd2d6";
        roundRect(ctx, 230, TABLE - 220, 120, 230, 12);
        ctx.fill();
        drawPerson(ctx, { x: 290, y: TABLE + 10, h: 300, sit: 1, head: 0.1 });
        text(ctx, "视频通话 01:12", 290, TABLE - 250, 22, { font: SANS, weight: 500, color: "#bbb" });
      }
      // 蛋糕
      const cx = 540, top = TABLE - 110, CR = 185;
      ctx.fillStyle = "#e8e3d8";
      ctx.fillRect(cx - CR, top, CR * 2, 120);
      ctx.beginPath();
      ctx.ellipse(cx, top + 120, CR, 38, 0, 0, Math.PI);
      ctx.fillStyle = "#c9c3b7";
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, top, CR, 38, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#f6f2ea";
      ctx.fill();
      ctx.fillStyle = RED;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(cx - 150 + i * 50, top + 50 + Math.sin(i) * 5, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      // 数字蜡烛
      const digits = [...c.n];
      const dw = 100;
      digits.forEach((d, i) => {
        const dx = cx + (i - (digits.length - 1) / 2) * dw;
        const dy = top - 70;
        ctx.save();
        ctx.font = `900 170px ${SERIF}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 8;
        ctx.strokeStyle = RED;
        ctx.strokeText(d, dx, dy);
        ctx.fillStyle = "#f6f1e7";
        ctx.fillText(d, dx, dy);
        ctx.restore();
        const wy = dy - 95;
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(dx, wy);
        ctx.lineTo(dx, wy - 22);
        ctx.stroke();
        const fl = 1 - blow;
        if (fl > 0.02) {
          const fk = 1 + Math.sin(t * 31 + i * 2) * 0.08 + Math.sin(t * 17 + i) * 0.06;
          glow(ctx, dx, wy - 40, 160 * fl, "rgba(255,240,210,1)", 0.6 * fl);
          ctx.save();
          ctx.translate(dx + Math.sin(t * 9 + i) * 3 - blow * 20, wy - 25);
          ctx.scale(fl, fl * fk);
          ctx.fillStyle = "#fffaf0";
          ctx.beginPath();
          ctx.moveTo(0, -70);
          ctx.bezierCurveTo(22, -30, 20, 0, 0, 2);
          ctx.bezierCurveTo(-20, 0, -22, -30, 0, -70);
          ctx.fill();
          ctx.restore();
        } else {
          // 青烟
          ctx.strokeStyle = "rgba(200,200,200,0.45)";
          ctx.lineWidth = 4;
          ctx.beginPath();
          for (let s = 0; s < 30; s++) {
            const yy = wy - 22 - s * 14 * (0.5 + (tk - 0.6) * 2);
            const xx = dx + Math.sin(s * 0.5 + t * 4 + i) * (6 + s * 1.5);
            if (s === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
          }
          ctx.stroke();
        }
      });
      ctx.restore();
      ctx.fillStyle = `rgba(0,0,0,${blow * 0.55})`;
      ctx.fillRect(0, 0, DW, DH);
      // 切镜闪白
      if (k > 0) {
        const f = Math.exp(-tk / 0.06) * 0.5;
        ctx.fillStyle = `rgba(255,255,255,${f})`;
        ctx.fillRect(0, 0, DW, DH);
      }
      text(ctx, ["她的 35 岁", "她的 48 岁", "她的 62 岁", "她的 100 岁？"][k], DW / 2, 300, 52, { weight: 600, color: PAPER, shadow: "rgba(0,0,0,0.9)", blur: 16, alpha: smooth(clamp(tk / 0.15)) });
    },
  };
};
