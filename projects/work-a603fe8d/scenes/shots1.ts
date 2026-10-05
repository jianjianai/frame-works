import {
  DW, DH, RED, INK, PAPER, SERIF, SANS, clamp, mix, phase, smooth, easeInOut, easeOut, easeIn, seeded, hash, wobble,
  bump, vgrad, glow, text, typed, rain, drift, roundRect, drawPerson, drawHand, drawCallBanner, camera, offscreen, shake, lightShaft, focusTrack,
  type ShotFactory,
} from "./lib";

const lerpColor = (a: number[], b: number[], t: number) =>
  `rgb(${Math.round(mix(a[0], b[0], t))},${Math.round(mix(a[1], b[1], t))},${Math.round(mix(a[2], b[2], t))})`;

// ============ A 雨夜城市：快速推进一扇亮着的窗（0 – 1.0） ============
const CITY_LEN = 1.0;
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
      // 1 秒内快速推进那扇窗
      const p = clamp(t / CITY_LEN);
      const Z = 30;
      const z = Math.exp(Math.log(Z) * (0.12 * p + 0.88 * Math.pow(p, 3)));
      const cy = mix(1120, 960, easeInOut(p));
      void drawCallBanner;
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
      // 那扇窗：整栋楼唯一亮着暖光的窗，光晕随推镜变强，把视线拉过去
      glow(ctx, TX, TY, 120, "rgba(255,248,230,1)", 0.35 + 0.4 * smooth(phase(t, 0.3, 0.8)));
      ctx.fillStyle = "rgba(255,248,230,0.08)";
      ctx.beginPath();
      ctx.moveTo(TX - 27, TY + 42); ctx.lineTo(TX + 27, TY + 42); ctx.lineTo(TX + 70, TY + 260); ctx.lineTo(TX - 70, TY + 260);
      ctx.fill();
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
      // 钩子文案（第一帧就在）
      const ca = 1 - smooth(phase(t, 0.55, 0.8));
      if (ca > 0) {
        ctx.save();
        ctx.globalAlpha = ca;
        text(ctx, "00:47", DW / 2, 300, 130, { font: SANS, weight: 200, color: PAPER, spacing: 6, shadow: "rgba(0,0,0,0.8)", blur: 20 });
        ctx.font = `900 56px ${SERIF}`;
        const p1 = "这是他第 3 次，", p2 = "挂掉妈妈的电话";
        const w1 = ctx.measureText(p1).width, w2 = ctx.measureText(p2).width;
        const lx = DW / 2 - (w1 + w2) / 2;
        text(ctx, p1, lx, 425, 56, { weight: 900, color: "#fff", align: "left", shadow: "rgba(0,0,0,0.9)", blur: 16 });
        text(ctx, p2, lx + w1, 425, 56, { weight: 900, color: RED, align: "left", shadow: "rgba(255,30,40,0.7)", blur: 18 });
        ctx.restore();
      }
    },
    // 先看文案 → 那扇窗
    focus: (t) => {
      const w = smooth(phase(t, 0.3, 0.7));
      const cy = mix(1120, 960, easeInOut(clamp(t / CITY_LEN)));
      return { x: 540, y: mix(470, cy, w), r: mix(470, 280, w), a: mix(0.3, 0.55, w) };
    },
  };
};

// ============ A2 屋里（1.0 – 2.9）：他在看解除劳动合同通知书 → 床上的手机响了 → 他挂掉了妈妈的电话 ============
export const room: ShotFactory = () => {
  // 通知书
  const NW = 540, NH = 700;
  const { canvas: doc, ctx: d } = offscreen(NW, NH);
  d.fillStyle = "#ece8de";
  d.fillRect(0, 0, NW, NH);
  d.fillStyle = "#111";
  d.textAlign = "center";
  d.font = `900 40px ${SERIF}`;
  d.fillText("解除劳动合同通知书", NW / 2, 92);
  d.textAlign = "left";
  d.font = `500 26px ${SERIF}`;
  d.fillText("您好：", 50, 170);
  const body = ["因公司业务调整，经研究决定，", "自 2026 年 10 月 5 日起，", "与您解除劳动合同。"];
  d.font = `700 30px ${SERIF}`;
  body.forEach((line, i) => d.fillText(line, 80, 225 + i * 50));
  d.fillStyle = "rgba(0,0,0,0.18)";
  for (let i = 0; i < 6; i++) d.fillRect(50, 400 + i * 34, i === 5 ? 260 : 440, 12);
  d.fillStyle = "#111";
  d.font = `500 24px ${SERIF}`;
  d.textAlign = "right";
  d.fillText("人力资源部", NW - 60, 610);
  d.fillText("2026 年 10 月 5 日", NW - 60, 650);
  // 红章
  d.strokeStyle = "rgba(220,30,40,0.85)";
  d.lineWidth = 6;
  d.beginPath();
  d.arc(NW - 140, 600, 70, 0, Math.PI * 2);
  d.stroke();
  d.fillStyle = "rgba(220,30,40,0.85)";
  d.font = `900 44px ${SERIF}`;
  d.textAlign = "center";
  d.fillText("★", NW - 140, 616);
  const DOC = { x: 470, y: 640, rot: -0.05 };
  const PHONE = { x: 760, y: 1080, rot: 0.14, w: 250, h: 500 };
  const T_RING = 0.95, T_PRESS = 1.5;
  return {
    draw(ctx, t) {
      const look = easeInOut(phase(t, T_RING, T_RING + 0.3));
      ctx.save();
      const z = mix(mix(1.12, 1.28, easeOut(clamp(t / T_RING))), 1.3, look);
      camera(ctx, z, mix(DOC.x, PHONE.x - 60, look), mix(DOC.y, PHONE.y - 40, look), 540, 900);
      // 床单 + 台灯
      vgrad(ctx, -300, -300, DW + 600, DH + 600, [[0, "#3a3835"], [1, "#151413"]]);
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 18;
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.moveTo(-200, 300 + i * 260);
        ctx.bezierCurveTo(300, 200 + i * 260, 700, 420 + i * 260, 1300, 260 + i * 260);
        ctx.stroke();
      }
      glow(ctx, 260, 300, 1000, "rgba(255,240,215,1)", 0.35);
      // 手机（床上）
      const ring = t >= T_RING && t < T_PRESS;
      const buzz = ring ? Math.sin(t * 90) * 6 : 0;
      ctx.save();
      ctx.translate(PHONE.x + buzz, PHONE.y);
      ctx.rotate(PHONE.rot);
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 30;
      ctx.fillStyle = "#111";
      roundRect(ctx, -PHONE.w / 2, -PHONE.h / 2, PHONE.w, PHONE.h, 36);
      ctx.fill();
      ctx.shadowBlur = 0;
      const sw = PHONE.w - 20, sh = PHONE.h - 20;
      if (ring) {
        vgrad(ctx, -sw / 2, -sh / 2, sw, sh, [[0, "#3b3d42"], [1, "#16171a"]]);
        ctx.fillStyle = "#8f8a80";
        ctx.beginPath();
        ctx.arc(0, -120, 40, 0, Math.PI * 2);
        ctx.fill();
        text(ctx, "妈", 0, -118, 40, { weight: 900, color: "#fff" });
        text(ctx, "妈妈", 0, -45, 38, { font: SANS, weight: 700, color: "#fff" });
        text(ctx, "邀请你语音通话…", 0, -5, 20, { font: SANS, weight: 400, color: "#bbb" });
        const press = bump(t, T_PRESS - 0.1, T_PRESS - 0.03, T_PRESS, T_PRESS + 0.05);
        for (const [bx, col] of [[-62, RED], [62, "#34c759"]] as const) {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(bx, 170, bx < 0 ? 34 * (1 + press * 0.2) : 34 + Math.sin(t * 12) * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        glow(ctx, 0, 0, 300, "rgba(220,225,235,1)", 0.25);
      } else if (t >= T_PRESS) {
        // 挂断后：锁屏上只剩一条红色的未接来电
        vgrad(ctx, -sw / 2, -sh / 2, sw, sh, [[0, "#1b1c1f"], [1, "#0c0c0e"]]);
        const a = smooth(phase(t, T_PRESS, T_PRESS + 0.12));
        ctx.globalAlpha = a;
        text(ctx, "00:47", 0, -150, 56, { font: SANS, weight: 300, color: "#ddd" });
        ctx.fillStyle = "rgba(240,240,240,0.92)";
        roundRect(ctx, -sw / 2 + 12, -60, sw - 24, 84, 18);
        ctx.fill();
        text(ctx, "未接来电 (3)", -sw / 2 + 30, -32, 22, { font: SANS, weight: 700, color: RED, align: "left" });
        text(ctx, "妈妈", -sw / 2 + 30, 2, 22, { font: SANS, weight: 600, color: "#222", align: "left" });
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = "#050506";
        ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
      }
      ctx.restore();
      if (ring) glow(ctx, PHONE.x, PHONE.y, 420, "rgba(220,225,235,1)", 0.18 + 0.08 * Math.sin(t * 20));
      // 两只手：左手一直捏着纸，右手放下纸去挂电话
      const L = { x: DOC.x - 250, y: DOC.y + 360 };
      drawHand(ctx, L.x, L.y, 0.62, 0.72, { color: "#121110", rim: "rgba(255,240,215,0.6)" });
      const go = easeInOut(phase(t, 1.2, T_PRESS - 0.05));
      const btn = { x: PHONE.x - 62 * Math.cos(PHONE.rot) - 170 * Math.sin(PHONE.rot), y: PHONE.y + 170 * Math.cos(PHONE.rot) - 62 * Math.sin(PHONE.rot) };
      const R0 = { x: DOC.x + 250, y: DOC.y + 360 };
      // 中指尖相对手的位置约 (12, −171)（镜像、缩放 0.72）
      const R1 = { x: btn.x - 12, y: btn.y + 171 };
      const tap = bump(t, T_PRESS - 0.1, T_PRESS - 0.03, T_PRESS, T_PRESS + 0.08) * 10;
      drawHand(ctx, mix(R0.x, R1.x, go), mix(R0.y, R1.y, go) + tap, mix(-0.62, 0, go), 0.72, { color: "#121110", mirror: true, curl: mix(0, 0.25, go), rim: "rgba(255,240,215,0.6)" });
      // 通知书
      ctx.save();
      const lift = easeOut(phase(t, 1.2, 1.45)) * 0.04;
      ctx.translate(DOC.x, DOC.y);
      ctx.rotate(DOC.rot + lift);
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;
      ctx.drawImage(doc, -NW / 2, -NH / 2);
      ctx.shadowColor = "transparent";
      // 他读到的那一句：红线划过
      const ul = easeInOut(phase(t, 0.3, 0.7));
      if (ul > 0) {
        ctx.fillStyle = RED;
        ctx.fillRect(-NW / 2 + 80, -NH / 2 + 240 + 2 * 50, 270 * ul, 5);
      }
      ctx.restore();
      ctx.restore();
    },
    // 先读通知书（红线划过那一句）→ 手机响了，视线移到手机
    focus: (t) => {
      const w = easeInOut(phase(t, T_RING, T_RING + 0.3));
      return { x: mix(500, 640, w), y: mix(700, 1000, w), r: mix(420, 360, w), a: 0.45 };
    },
  };
};

// ============ B 手机（2.9 – 9.2）============
// 本地时间（作品时间 − 2.9）：
// 0.12 锁屏弹出「妈妈：国庆节回家吗？」→ 0.45 点开 → 0.8 打字「工作太忙了，不回了」→ 1.62 发送 → 1.9 标题变「对方正在讲话…」
// 2.58 锁屏（歌曲停顿）→ 2.95 微信提示音亮屏：「妈妈 [语音] 12''」→ 3.2 点开 → 3.26 语音出现在他那句回复下面并播放 → 5.4 播完 → 6.22 眼泪落在语音上
export const phone: ShotFactory = (env) => {
  const r = seeded(21);
  const bokeh = Array.from({ length: 26 }, () => ({ x: r() * DW, y: r() * 900, rad: 30 + r() * 90, a: 0.05 + r() * 0.12 }));
  const PW = 600, PH = 1220;
  const photo = buildPhoto();
  const { canvas: avatar, ctx: ag } = offscreen(140, 140);
  ag.drawImage(photo, 150, 120, 380, 380, 0, 0, 140, 140);
  const { canvas: wall, ctx: wg } = offscreen(PW, PH);
  wg.filter = "blur(3px) brightness(0.55)";
  wg.drawImage(photo, -((PH * (PWd / PHt)) - PW) / 2, 0, PH * (PWd / PHt), PH);
  wg.filter = "none";
  const reply = "工作太忙了，不回了";
  const T_N1 = 0.12, T_TAP1 = 0.45, T_OPEN1 = 0.55, T_TYPE = 0.8, T_SEND = 1.62, T_SPEAK = 1.9;
  const T_OFF = 2.58, T_DING = 2.95, T_OPEN = 3.26, T_VEND = 5.4, T_TEAR = 6.22;
  const x0 = 540 - PW / 2, y0 = 880 - PH / 2;
  const Q = { y: y0 + 330 }, A = { y: y0 + 470 };
  const vb = { x: x0 + 128, y: y0 + 620, w: 330, h: 70 };
  const ky = y0 + PH - 430; // 键盘顶
  const sendBtn = { x: x0 + PW - 72, y: ky - 57 };
  const notifY = y0 + 380;

  const notification = (ctx: CanvasRenderingContext2D, t: number, start: number, title: string, body: string, y: number) => {
    const np = easeOut(phase(t, start, start + 0.2));
    const ny = mix(y0 - 140, y, np);
    ctx.save();
    ctx.translate(x0 + PW / 2, ny + 70);
    const pop = 1 + 0.06 * Math.sin(phase(t, start + 0.12, start + 0.3) * Math.PI);
    ctx.scale(pop, pop);
    ctx.fillStyle = "rgba(245,245,245,0.95)";
    roundRect(ctx, -270, -70, 540, 140, 30);
    ctx.fill();
    ctx.fillStyle = "#07c160";
    roundRect(ctx, -240, -48, 40, 40, 10);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-225, -31, 10, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(-214, -23, 8, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, "微信", -186, -28, 24, { font: SANS, weight: 500, color: "#666", align: "left" });
    text(ctx, "现在", 245, -28, 22, { font: SANS, weight: 400, color: "#888", align: "right" });
    text(ctx, title, -240, 26, 30, { font: SANS, weight: 700, color: "#111", align: "left" });
    text(ctx, body, -166, 26, 30, { font: SANS, weight: 400, color: "#333", align: "left" });
    ctx.restore();
  };
  const lockScreen = (ctx: CanvasRenderingContext2D, t: number, start: number, body: string) => {
    ctx.drawImage(wall, x0, y0, PW, PH);
    text(ctx, "10月5日 星期一", x0 + PW / 2, y0 + 140, 30, { font: SANS, weight: 500, color: "#eee" });
    text(ctx, "00:48", x0 + PW / 2, y0 + 250, 150, { font: SANS, weight: 300, color: "#fff" });
    // 刚挂掉的电话
    const my = y0 + mix(380, 540, easeOut(phase(t, start, start + 0.2)));
    ctx.fillStyle = "rgba(235,235,235,0.82)";
    roundRect(ctx, x0 + 30, my, PW - 60, 120, 28);
    ctx.fill();
    ctx.fillStyle = "#34c759";
    roundRect(ctx, x0 + 60, my + 22, 40, 40, 10);
    ctx.fill();
    text(ctx, "电话", x0 + 116, my + 42, 24, { font: SANS, weight: 500, color: "#666", align: "left" });
    text(ctx, "未接来电 (3)  妈妈", x0 + 60, my + 90, 28, { font: SANS, weight: 700, color: RED, align: "left" });
    notification(ctx, t, start, "妈妈", body, notifY);
  };
  const avatarAt = (ctx: CanvasRenderingContext2D, y: number) => {
    ctx.save();
    roundRect(ctx, x0 + 30, y, 70, 70, 12);
    ctx.clip();
    ctx.drawImage(avatar, x0 + 30, y, 70, 70);
    ctx.restore();
  };
  const textBubble = (ctx: CanvasRenderingContext2D, str: string, y: number, mine: boolean, p: number) => {
    if (p <= 0) return;
    ctx.save();
    ctx.globalAlpha = clamp(p * 2);
    ctx.font = `500 32px ${SANS}`;
    const w = ctx.measureText(str).width + 48;
    const bx = mine ? x0 + PW - 128 - w : x0 + 128;
    const by = y + 4 + (1 - easeOut(p)) * 20;
    ctx.fillStyle = mine ? "#95ec69" : "#ffffff";
    roundRect(ctx, bx, by, w, 66, 14);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(str, bx + 24, by + 34);
    ctx.restore();
    if (mine) {
      // 自己的头像（灰色）
      ctx.fillStyle = "#3c3c3c";
      roundRect(ctx, x0 + PW - 100, y, 70, 70, 12);
      ctx.fill();
    } else avatarAt(ctx, y);
  };
  const chat = (ctx: CanvasRenderingContext2D, t: number, second: boolean) => {
    ctx.fillStyle = "#f2f1ed";
    ctx.fillRect(x0, y0, PW, PH);
    text(ctx, "00:48", x0 + 70, y0 + 52, 28, { font: SANS, weight: 600, color: "#111", align: "left" });
    ctx.fillStyle = "#111";
    ctx.fillRect(x0 + PW - 110, y0 + 42, 50, 22);
    ctx.fillStyle = "#e9e8e4";
    ctx.fillRect(x0, y0 + 90, PW, 100);
    text(ctx, "‹", x0 + 40, y0 + 140, 56, { font: SANS, weight: 400, color: "#111" });
    const speaking = !second && t >= T_SPEAK;
    text(ctx, speaking ? "对方正在讲话…" : "妈妈", x0 + PW / 2, y0 + 140, speaking ? 32 : 38, { font: SANS, weight: speaking ? 500 : 700, color: speaking ? "#555" : "#111" });
    ctx.fillStyle = "#d2d0ca";
    ctx.fillRect(x0, y0 + 190, PW, 2);
    ctx.fillStyle = "#e2e0db";
    roundRect(ctx, x0 + PW / 2 - 170, y0 + 222, 340, 50, 25);
    ctx.fill();
    text(ctx, "未接语音通话 × 3", x0 + PW / 2, y0 + 248, 26, { font: SANS, weight: 500, color: RED });
    text(ctx, "00:48", x0 + PW / 2, Q.y - 22, 20, { font: SANS, weight: 400, color: "#9a9893" });
    textBubble(ctx, "国庆节回家吗？", Q.y, false, 1);
    textBubble(ctx, reply, A.y, true, second ? 1 : clamp((t - T_SEND) / 0.22));
    if (!second) {
      // 输入框 + 键盘（发送后收起）
      const down = easeIn(phase(t, T_SEND + 0.05, T_SEND + 0.3)) * 560;
      ctx.save();
      ctx.translate(0, down);
      ctx.fillStyle = "#e6e4df";
      ctx.fillRect(x0, ky - 110, PW, 540);
      ctx.fillStyle = "#fff";
      roundRect(ctx, x0 + 24, ky - 92, PW - 160, 70, 14);
      ctx.fill();
      const shown = t < T_SEND ? typed(reply, t, T_TYPE, 12) : "";
      text(ctx, shown, x0 + 46, ky - 56, 32, { font: SANS, weight: 500, color: "#111", align: "left" });
      ctx.font = `500 32px ${SANS}`;
      const cw = ctx.measureText(shown).width;
      if (Math.floor(t * 2.2) % 2 === 0 || (t > T_TYPE && t < T_SEND)) {
        ctx.fillStyle = "#1a7cff";
        ctx.fillRect(x0 + 48 + cw, ky - 78, 3, 42);
      }
      const press = bump(t, T_SEND - 0.08, T_SEND - 0.02, T_SEND + 0.02, T_SEND + 0.1);
      ctx.fillStyle = shown ? "#07c160" : "#c9c7c1";
      roundRect(ctx, x0 + PW - 120 + press * 4, ky - 88 + press * 4, 96 - press * 8, 62 - press * 8, 12);
      ctx.fill();
      text(ctx, "发送", sendBtn.x, sendBtn.y, 26, { font: SANS, weight: 600, color: "#fff" });
      for (let row = 0; row < 4; row++)
        for (let k = 0; k < 10; k++) {
          ctx.fillStyle = "#fbfaf8";
          roundRect(ctx, x0 + 14 + k * 57.5, ky + row * 92, 50, 78, 10);
          ctx.fill();
        }
      ctx.restore();
      if (down > 0) {
        ctx.fillStyle = "#e6e4df";
        ctx.fillRect(x0, y0 + PH - 150 + Math.max(0, 560 - down) * 0, PW, 150);
        ctx.fillStyle = "#fff";
        roundRect(ctx, x0 + 90, y0 + PH - 128, PW - 180, 70, 14);
        ctx.fill();
        text(ctx, "按住 说话", x0 + PW / 2, y0 + PH - 92, 28, { font: SANS, weight: 600, color: "#333", alpha: clamp(down / 560) });
      }
    } else {
      // 他那句回复下面：妈妈的语音
      const playing = t >= T_OPEN && t < T_VEND;
      text(ctx, "00:48", x0 + PW / 2, vb.y - 22, 20, { font: SANS, weight: 400, color: "#9a9893" });
      avatarAt(ctx, vb.y);
      const appear = easeOut(phase(t, T_OPEN, T_OPEN + 0.2));
      ctx.save();
      ctx.globalAlpha = appear;
      ctx.translate(0, (1 - appear) * 30);
      if (playing) {
        const lv = env.beat(t);
        for (let i = 0; i < 3; i++) {
          const q = ((t - T_OPEN) * 1.4 + i / 3) % 1;
          ctx.strokeStyle = `rgba(7,193,96,${(1 - q) * 0.35 * (0.5 + lv)})`;
          ctx.lineWidth = 4;
          roundRect(ctx, vb.x - q * 60, vb.y - q * 40, vb.w + q * 120, vb.h + q * 80, 14 + q * 40);
          ctx.stroke();
        }
      }
      ctx.fillStyle = playing ? "#eaf7ef" : "#ffffff";
      roundRect(ctx, vb.x, vb.y, vb.w, vb.h, 14);
      ctx.fill();
      const sx = vb.x + 36, sy = vb.y + vb.h / 2;
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      const step = Math.floor((t - T_OPEN) * 3) % 3;
      for (let i = 1; i <= 2; i++) {
        ctx.globalAlpha = appear * (!playing || step >= i ? 1 : 0.2);
        ctx.beginPath();
        ctx.arc(sx, sy, 10 + i * 10, -0.8, 0.8);
        ctx.stroke();
      }
      ctx.globalAlpha = appear;
      for (let i = 0; i < 14; i++) {
        const lv = playing ? env.beat(t - i * 0.04) : 0;
        const h = 8 + (playing ? Math.abs(Math.sin(t * 13 + i * 1.7)) * 18 + lv * 22 : 4 + Math.abs(Math.sin(i * 2.3)) * 10);
        ctx.fillStyle = playing ? "#07c160" : "#bdbdbd";
        roundRect(ctx, vb.x + 82 + i * 12, sy - h / 2, 6, h, 3);
        ctx.fill();
      }
      text(ctx, "12''", vb.x + vb.w + 18, sy, 28, { font: SANS, weight: 500, color: "#8a8a8a", align: "left" });
      ctx.restore();
      ctx.fillStyle = "#e6e4df";
      ctx.fillRect(x0, y0 + PH - 150, PW, 150);
      ctx.fillStyle = "#fff";
      roundRect(ctx, x0 + 90, y0 + PH - 128, PW - 180, 70, 14);
      ctx.fill();
      text(ctx, "按住 说话", x0 + PW / 2, y0 + PH - 92, 28, { font: SANS, weight: 600, color: "#333" });
    }
  };

  return {
    draw(ctx, t) {
      const off = smooth(phase(t, T_OFF, T_OFF + 0.12)) * (1 - smooth(phase(t, T_DING, T_DING + 0.06)));
      const dim = 0.5 * smooth(phase(t, T_VEND, T_VEND + 0.5));
      const screenOn = (1 - off) * (1 - dim);
      const buzz = (t >= T_N1 && t < T_N1 + 0.3 ? 1 - (t - T_N1) / 0.3 : 0) + (t >= T_DING && t < T_DING + 0.35 ? 1 - (t - T_DING) / 0.35 : 0);
      ctx.fillStyle = "#040405";
      ctx.fillRect(0, 0, DW, DH);
      for (const b of bokeh) glow(ctx, b.x, b.y + t * 6, b.rad, "rgba(200,205,215,1)", b.a * (0.4 + 0.6 * screenOn));
      rain(ctx, t, { count: 50, seed: 8, alpha: 0.08, len: 90, speed: 900, slant: 0.05, y1: 900 });
      glow(ctx, 540, 900, 1100, "rgba(230,232,240,1)", 0.22 * screenOn);

      ctx.save();
      // 镜头跟着视线：通知 → 妈妈的问题 → 输入框 → 他的回复 → 标题「对方正在讲话」→ 锁屏 → 语音
      const look =
        t < T_OPEN1 ? mix(820, notifY + 70, easeInOut(phase(t, T_N1, T_N1 + 0.25)))
        : t < T_TYPE ? mix(notifY + 70, Q.y + 35, easeInOut(phase(t, T_OPEN1, T_OPEN1 + 0.2)))
        : t < T_SEND ? mix(Q.y + 35, 960, easeInOut(phase(t, T_TYPE, T_TYPE + 0.25)))
        : t < T_SPEAK ? mix(960, A.y + 35, easeInOut(phase(t, T_SEND, T_SEND + 0.2)))
        : t < T_OFF ? mix(A.y + 35, y0 + 260, easeInOut(phase(t, T_SPEAK, T_SPEAK + 0.25)))
        : t < T_OPEN ? mix(y0 + 260, notifY + 70, easeInOut(phase(t, T_OFF, T_DING)))
        : notifY + 70;
      const push = easeInOut(phase(t, T_OPEN + 0.05, T_TEAR));
      const z = mix(1.06, 1.1, easeInOut(clamp(t / 2.5))) * mix(1, 1.5, push);
      const fx = mix(540, vb.x + vb.w / 2, push), fy = mix(look, vb.y + vb.h / 2, push);
      camera(ctx, z, fx, fy, 540 + wobble(t, 1) * 6 + Math.sin(t * 90) * 7 * buzz, 900 + wobble(t, 4) * 6, -0.03 * (1 - push * 0.6) + wobble(t, 2) * 0.006);
      ctx.fillStyle = "#151515";
      roundRect(ctx, x0 - 16, y0 - 16, PW + 32, PH + 32, 86);
      ctx.fill();
      ctx.save();
      roundRect(ctx, x0, y0, PW, PH, 70);
      ctx.clip();
      if (t < T_OPEN1) lockScreen(ctx, t, T_N1, "国庆节回家吗？");
      else if (t < T_DING) chat(ctx, t, false);
      else if (t < T_OPEN) lockScreen(ctx, t, T_DING, "[语音] 12''");
      else chat(ctx, t, true);
      if (screenOn < 1) {
        ctx.fillStyle = `rgba(0,0,0,${1 - screenOn})`;
        ctx.fillRect(x0, y0, PW, PH);
        ctx.globalAlpha = off * 0.12;
        const g = ctx.createLinearGradient(x0, y0, x0 + PW, y0 + PH);
        g.addColorStop(0.3, "rgba(255,255,255,0)");
        g.addColorStop(0.45, "rgba(255,255,255,1)");
        g.addColorStop(0.6, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x0, y0, PW, PH);
        ctx.globalAlpha = 1;
      }
      const wake = t >= T_DING ? Math.exp(-(t - T_DING) / 0.08) * 0.6 : 0;
      if (wake > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${wake})`;
        ctx.fillRect(x0, y0, PW, PH);
      }
      // 眼泪
      const fall = phase(t, T_TEAR - 0.42, T_TEAR);
      const tx = vb.x + 140, ty = vb.y + 30;
      if (fall > 0 && fall < 1) {
        const yy = mix(ty - 1000, ty, fall * fall);
        ctx.save();
        ctx.translate(tx, yy);
        ctx.fillStyle = "rgba(220,230,240,0.9)";
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.bezierCurveTo(12, -14, 18, 0, 18, 10);
        ctx.arc(0, 10, 18, 0, Math.PI);
        ctx.bezierCurveTo(-18, 0, -12, -14, 0, -40);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(-6, 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (t >= T_TEAR) {
        const k = t - T_TEAR;
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.beginPath();
        ctx.ellipse(tx, ty, 46, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 3;
        ctx.stroke();
        glow(ctx, tx - 14, ty - 14, 16, "#fff", 0.9);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + 0.3;
          const dd = 40 + k * 900;
          ctx.fillStyle = `rgba(230,240,250,${Math.max(0, 0.8 - k * 6)})`;
          ctx.beginPath();
          ctx.arc(tx + Math.cos(a) * dd, ty + Math.sin(a) * dd * 0.7, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      // 右手拇指：点通知 → 打字 → 发送 → 放下 → 再点通知
      const restP = { x: x0 + PW + 40, y: y0 + PH - 30 };
      let th = { ...restP };
      const toward = (p: { x: number; y: number }, a: number, b: number, c: number, d: number) => {
        const k = bump(t, a, b, c, d);
        th = { x: mix(th.x, p.x, k), y: mix(th.y, p.y, k) };
      };
      toward({ x: x0 + PW / 2 + 40, y: notifY + 90 }, T_N1 + 0.15, T_TAP1, T_TAP1 + 0.05, T_OPEN1 + 0.2);
      const typing = t > T_TYPE && t < T_SEND - 0.1;
      const kx = x0 + PW / 2 + Math.sin(t * 11) * 180, kyy = ky + 140 + Math.abs(Math.sin(t * 24)) * 16;
      toward({ x: kx, y: kyy }, T_TYPE - 0.15, T_TYPE, T_SEND - 0.12, T_SEND - 0.1);
      if (typing) th = { x: kx, y: kyy };
      toward({ x: sendBtn.x, y: sendBtn.y + 30 }, T_SEND - 0.12, T_SEND - 0.04, T_SEND + 0.04, T_SEND + 0.3);
      toward({ x: x0 + PW / 2 + 40, y: notifY + 90 }, T_DING + 0.1, T_OPEN - 0.04, T_OPEN + 0.05, T_OPEN + 0.4);
      ctx.fillStyle = "#0e0e0e";
      ctx.strokeStyle = "#0e0e0e";
      ctx.lineCap = "round";
      ctx.lineWidth = 118;
      ctx.beginPath();
      ctx.moveTo(x0 + PW + 160, y0 + PH + 260);
      ctx.quadraticCurveTo(x0 + PW + 40, ky + 300, th.x, th.y);
      ctx.stroke();
      ctx.lineWidth = 96;
      ctx.beginPath();
      ctx.moveTo(x0 + PW + 70, y0 + PH + 120);
      ctx.lineTo(th.x, th.y);
      ctx.stroke();
      // 左手握住机身
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
      if (off > 0) glow(ctx, 540, 900, 500, "rgba(120,125,135,1)", 0.06 * off);
    },
    focus: (t) => {
      if (t < T_OPEN1) return { x: 540, y: 760, r: 360, a: 0.45 };
      if (t < T_TYPE) return { x: 540, y: 900, r: 340, a: 0.45 };
      if (t < T_SEND) return { x: 540, y: 900, r: 360, a: 0.45 };
      if (t < T_OFF) return { x: 540, y: 900, r: 380, a: 0.45 };
      if (t < T_OPEN) return { x: 540, y: 900, r: 380, a: 0.45 };
      return { x: 540, y: 900, r: 320, a: 0.5 };
    },
  };
};

// 老照片：'98 宝宝一周岁（妈妈的头像、锁屏壁纸、倒带里都用它）
const PWd = 720, PHt = 900;
export function buildPhoto() {
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

  return pc;
}

// ============ C 老照片 + 一滴眼泪（6.16 – 9.2） ============
export const photo: ShotFactory = () => {
  const pc = buildPhoto();
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
      // 夕阳的光束扫向母子
      for (let k = 0; k < 3; k++) {
        const sw = Math.sin(t * 0.6 + k * 2.1) * 60;
        lightShaft(ctx, t, { x1: 760, y1: sunY, w1: 30, x2: 200 + k * 260 + sw, y2: GROUND, w2: 160, alpha: mix(0.14, 0.05, a), dust: 0 });
      }
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
      const momStoop = mix(0, 0.32, smooth(phase(a, 0.3, 1)));
      const kidX = 440, momX = 650;
      const holdY = GROUND - mix(215, 300, a) + Math.sin(t * 7.5) * 4;
      const hold = { x: (kidX + momX) / 2 + mix(10, -15, a), y: holdY };
      const hair = Math.round(mix(7, 120, smooth(phase(a, 0.45, 1))));
      const mom = drawPerson(ctx, { x: momX, y: GROUND, h: mix(560, 545, a), mom: true, walk: t * mix(7.5, 6, a), stride: mix(1, 0.7, a), stoop: momStoop, handB: hold, hair: `rgb(${hair},${hair},${hair})`, rim: { color: "rgba(255,252,240,0.9)", dx: 4, dy: -3, blur: 2 } });
      const kid = drawPerson(ctx, { x: kidX, y: GROUND, h: kidH, child, walk: t * mix(11, 6, a) + 1, stride: mix(1.2, 0.6, a), handF: hold, rim: { color: "rgba(255,252,240,0.9)", dx: 4, dy: -3, blur: 2 } });
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
      tag(`我 · ${Math.round(mix(3, 30, a))}岁`, kid.head.x, kid.head.y - kid.headR - 60);
      tag(`妈妈 · ${Math.round(mix(31, 58, a))}岁`, mom.head.x, mom.head.y - mom.headR - 60);
      ctx.globalAlpha = 1;
      ctx.restore();
      // 年份
      const year = Math.round(mix(1999, 2026, a));
      text(ctx, String(year), DW / 2, 470, 150, { weight: 300, color: RED, spacing: 10, shadow: "rgba(0,0,0,0.35)", blur: 20 });
      const cap = smooth(phase(t, 2.6, 3.0));
      if (cap > 0) text(ctx, "这条路，她走得越来越慢", DW / 2, 345, 44, { weight: 600, color: PAPER, alpha: cap, shadow: "rgba(0,0,0,0.8)", blur: 14 });
    },
    focus: focusTrack([[0, 540, 640, 520, 0.3], [0.9, 545, 900, 440, 0.38], [2.5, 545, 900, 440, 0.38], [2.8, 545, 760, 520, 0.32], [4.74, 545, 800, 500, 0.32]]),
  };
};

// ============ E 疼了会哭 → 疼了不说（13.94 – 17.01）：全屏顺序叙事，动作匹配转场 ============
// 0–1.45 6岁：摔倒大哭，妈妈跑来抱住，哭声停 → 1.45–1.75 雨幕从上往下扫过（同一位置同一姿势）→ 30岁：路灯下一个人，嘴被封住，镜头拉开看到纸箱
export const mute: ShotFactory = () => {
  const G = 1250;
  const T_WIPE = 1.45, T_WIPE_END = 1.75;
  const label = (ctx: CanvasRenderingContext2D, str: string, y: number, a: number, dark: boolean) => {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `700 46px ${SERIF}`;
    const w = ctx.measureText(str).width + 60;
    const x = DW / 2 - w / 2 + (1 - easeOut(a)) * -40;
    ctx.fillStyle = dark ? "rgba(10,10,10,0.82)" : "rgba(255,255,255,0.1)";
    roundRect(ctx, x, y - 42, w, 84, 10);
    ctx.fill();
    ctx.fillStyle = RED;
    ctx.fillRect(x, y - 42, 8, 84);
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    ctx.fillText(str, x + 32, y + 2);
    ctx.restore();
  };
  const kidScene = (ctx: CanvasRenderingContext2D, t: number) => {
    vgrad(ctx, -300, -300, DW + 600, G + 300, [[0, "#cfc9bd"], [1, "#f1ede4"]]);
    glow(ctx, 800, 560, 520, "rgba(255,255,250,1)", 0.75);
    // 远处的秋千与滑梯（交代：游乐场）
    ctx.strokeStyle = "#a9a398";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(760, G); ctx.lineTo(840, G - 330); ctx.lineTo(920, G);
    ctx.moveTo(840, G - 330); ctx.lineTo(1140, G - 330);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(960, G - 330); ctx.lineTo(960 + Math.sin(t * 2) * 10, G - 120);
    ctx.moveTo(1030, G - 330); ctx.lineTo(1030 + Math.sin(t * 2) * 10, G - 120);
    ctx.stroke();
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(950 + Math.sin(t * 2) * 10, G - 118); ctx.lineTo(1040 + Math.sin(t * 2) * 10, G - 118);
    ctx.stroke();
    ctx.fillStyle = "#b3ada3";
    ctx.beginPath();
    ctx.moveTo(60, G); ctx.lineTo(120, G - 260); ctx.lineTo(170, G - 260); ctx.lineTo(330, G); ctx.fill();
    vgrad(ctx, -300, G, DW + 600, DH, [[0, "#2c2a27"], [1, "#121110"]]);
    // 跑 → 绊倒 → 坐起来哭
    const fall = smooth(phase(t, 0.3, 0.45));
    const sitUp = smooth(phase(t, 0.52, 0.66));
    const kx = mix(120, 470, easeOut(phase(t, 0, 0.4)));
    ctx.save();
    ctx.translate(kx, G);
    ctx.rotate(fall * (1 - sitUp) * 1.3);
    drawPerson(ctx, {
      x: 0, y: 0, h: 330, child: 1, walk: sitUp > 0 ? undefined : t * 15, sit: sitUp, head: sitUp * -0.45,
      handF: sitUp > 0.5 ? { x: 48, y: -190 } : null, handB: sitUp > 0.5 ? { x: 38, y: -180 } : null,
    });
    ctx.restore();
    // 摔倒的一下：尘土
    const dust = phase(t, 0.42, 0.75);
    if (dust > 0 && dust < 1) {
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + (i / 8) * Math.PI;
        ctx.fillStyle = `rgba(120,112,100,${0.5 * (1 - dust)})`;
        ctx.beginPath();
        ctx.arc(kx + 120 + Math.cos(a) * dust * 120, G - 10 + Math.sin(a) * dust * 50, 10 + dust * 14, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const cry = smooth(phase(t, 0.6, 0.7)) * (1 - smooth(phase(t, 1.05, 1.3)));
    const hx = kx + 40, hy = G - 220;
    if (cry > 0) {
      for (let i = 0; i < 4; i++) {
        const q = (t * 2 + i * 0.25) % 1;
        ctx.strokeStyle = `rgba(20,20,20,${(1 - q) * 0.7 * cry})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(hx, hy, 50 + q * 200, -2.6, -1.6);
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(hx - 150 + (hash(Math.floor(t * 30)) - 0.5) * 12, hy - 210 + (hash(Math.floor(t * 30) + 3) - 0.5) * 12);
      ctx.rotate(-0.12);
      const s = 1 + 0.25 * (1 - easeOut(phase(t, 0.6, 0.75)));
      ctx.scale(s, s);
      text(ctx, "哇——", 0, 0, 130, { weight: 900, color: "#111", alpha: cry });
      ctx.restore();
    }
    // 妈妈跑过来，蹲下抱住
    const run = easeOut(phase(t, 0.68, 1.0));
    if (run > 0) {
      const kneel = smooth(phase(t, 0.95, 1.15));
      drawPerson(ctx, {
        x: mix(1250, kx + 230, run), y: G, h: 600, mom: true, dir: -1, walk: kneel > 0.5 ? undefined : t * 13, sit: kneel * 0.7, stoop: kneel * 0.62, head: kneel * 0.35,
        handF: kneel > 0.3 ? { x: kx + 15, y: G - 190 } : null, handB: kneel > 0.3 ? { x: kx + 60, y: G - 150 } : null,
      });
    }
    return { kx };
  };
  const manScene = (ctx: CanvasRenderingContext2D, t: number) => {
    ctx.fillStyle = "#0a0b0d";
    ctx.fillRect(-300, -300, DW + 600, DH + 600);
    // 远处模糊的车灯
    for (let i = 0; i < 6; i++) glow(ctx, 80 + i * 190 + Math.sin(i) * 40, 980 + Math.cos(i * 2) * 30, 70, "rgba(200,200,205,1)", 0.12);
    // 路灯 + 光柱
    ctx.fillStyle = "#1a1b1d";
    ctx.fillRect(830, 380, 18, G - 380);
    ctx.fillRect(700, 380, 148, 24);
    lightShaft(ctx, t, { x1: 735, y1: 410, w1: 70, x2: 560, y2: G, w2: 780, alpha: 0.42, seed: 12, dust: 30 });
    glow(ctx, 735, 410, 150, "rgba(255,255,245,1)", 0.95);
    ctx.fillStyle = "#1a1b1e";
    ctx.fillRect(-300, G, DW + 600, 40);
    ctx.fillStyle = "#050506";
    ctx.fillRect(-300, G + 40, DW + 600, 800);
    // 路面的反光
    ctx.fillStyle = "rgba(230,228,220,0.07)";
    ctx.fillRect(330, G + 60, 460, 300);
    rain(ctx, t, { count: 110, seed: 12, alpha: 0.32, len: 70, speed: 2300, slant: 0.08, x0: -200, x1: DW + 200, y0: -200, y1: G + 300 });
    const man = drawPerson(ctx, {
      x: 470, y: G, h: 600, sit: 1, stoop: 0.45, head: 0.45, handF: { x: 620, y: G - 170 }, handB: { x: 610, y: G - 160 },
      rim: { color: "rgba(240,238,228,0.95)", dx: 5, dy: -5, blur: 2 },
    });
    // 脚边：从公司收拾回来的纸箱
    ctx.fillStyle = "#3a3630";
    ctx.fillRect(670, G - 125, 200, 125);
    ctx.fillStyle = "#4a453d";
    ctx.fillRect(660, G - 136, 220, 22);
    ctx.fillStyle = "#121212";
    ctx.fillRect(700, G - 185, 40, 50);
    ctx.beginPath();
    ctx.ellipse(720, G - 200, 36, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d8d6cf";
    ctx.fillRect(772, G - 210, 64, 86);
    ctx.fillStyle = "#121212";
    ctx.fillRect(784, G - 196, 40, 30);
    text(ctx, "工牌", 804, G - 146, 18, { font: SANS, weight: 700, color: "#333" });
    // 封住的嘴（唱到「哑巴」）
    const tape = easeOut(phase(t, 2.02, 2.2));
    if (tape > 0) {
      const mx = man.head.x + man.headR * 0.55, my = man.head.y + man.headR * 0.45;
      ctx.save();
      ctx.translate(mx, my);
      ctx.scale(mix(2.4, 1, tape), mix(2.4, 1, tape));
      ctx.globalAlpha = clamp(tape * 2);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.shadowColor = "rgba(255,30,40,0.8)";
      ctx.shadowBlur = 16;
      for (const s of [1, -1]) {
        ctx.beginPath();
        ctx.moveTo(-28, -22 * s);
        ctx.lineTo(28, 22 * s);
        ctx.stroke();
      }
      ctx.restore();
    }
    return { man };
  };
  const cam = (t: number) => {
    // 6岁：慢推 → 推近拥抱；30岁：从同样的近景拉开
    if (t < T_WIPE_END) {
      const z = mix(1.0, 1.12, easeInOut(phase(t, 0, 1.2))) * mix(1, 1.35, easeIn(phase(t, 1.15, T_WIPE_END)));
      return { z, fx: mix(420, 560, easeInOut(phase(t, 0.6, 1.3))), fy: 1080 };
    }
    const p = easeInOut(phase(t, 1.85, 2.6));
    return { z: mix(1.5, 1.05, p), fx: mix(520, 600, p), fy: mix(1060, 1020, p) };
  };
  return {
    draw(ctx, t) {
      const wipe = easeInOut(phase(t, T_WIPE, T_WIPE_END));
      const c = cam(t);
      if (wipe < 1) {
        ctx.save();
        camera(ctx, c.z, c.fx, c.fy, 540, 1000);
        kidScene(ctx, t);
        ctx.restore();
        label(ctx, "6岁 · 疼了会哭", 560, smooth(phase(t, 0.05, 0.3)) * (1 - smooth(phase(t, 0.75, 0.9))), true);
      }
      if (wipe > 0) {
        const wy = mix(-60, DH + 60, wipe);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, DW, wy);
        ctx.clip();
        ctx.save();
        const c2 = t < T_WIPE_END ? { z: 1.5, fx: 520, fy: 1060 } : c;
        camera(ctx, c2.z, c2.fx, c2.fy, 540, 1000);
        manScene(ctx, t);
        ctx.restore();
        ctx.restore();
        if (wipe < 1) {
          // 雨幕的边缘
          rain(ctx, t, { count: 60, seed: 44, alpha: 0.6, len: 120, speed: 3200, slant: 0.05, y0: wy - 260, y1: wy + 40 });
          vgrad(ctx, 0, wy - 30, DW, 60, [[0, "rgba(255,255,255,0)"], [0.5, "rgba(255,255,255,0.35)"], [1, "rgba(255,255,255,0)"]]);
        }
        label(ctx, "30岁 · 疼了不说", 560, smooth(phase(t, 1.8, 2.05)), false);
      }
    },
    focus: focusTrack([[0, 420, 1050, 360, 0.35], [0.7, 520, 1050, 400, 0.35], [1.3, 560, 1040, 360, 0.45], [1.8, 520, 1000, 330, 0.5], [2.6, 600, 1000, 520, 0.4]]),
  };
};

// ============ F 生日蛋糕：35 → 48 → 62 → 100，桌边的人越来越少（17.01 – 20.65） ============
export const cake: ShotFactory = () => {
  const STEP = 0.91;
  const cuts = [
    { n: "32", kid: "small", hair: 10, stoop: 0 },
    { n: "45", kid: "teen", hair: 50, stoop: 0.08 },
    { n: "58", kid: "video", hair: 110, stoop: 0.25 },
    { n: "100", kid: "none", hair: 210, stoop: 0.55 },
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
      drawPerson(ctx, { x: 690, y: TABLE + 60, h: 820, mom: true, dir: -1, sit: 1, stoop: c.stoop + blow * 0.15, head: 0.15, hair: `rgb(${hair},${hair},${hair})`, handF: { x: 600, y: TABLE - 30 }, handB: { x: 630, y: TABLE - 20 }, rim: { color: "rgba(255,238,210,0.85)", dx: -3, dy: -4, blur: 3 } });
      if (c.kid === "small") {
        const kidP = drawPerson(ctx, { x: 330, y: TABLE - 60, h: 420, child: 1, dir: 1, sit: 0.8, armF: 2.7, armB: 2.3, rim: { color: "rgba(255,238,210,0.85)", dx: -3, dy: -4, blur: 3 } });
        ctx.fillStyle = "#070707";
        const hx = kidP.head.x, hy = kidP.head.y - kidP.headR * 0.7;
        ctx.beginPath();
        ctx.moveTo(hx - 36, hy + 6);
        ctx.lineTo(hx + 36, hy + 6);
        ctx.lineTo(hx + 4, hy - 90);
        ctx.fill();
        glow(ctx, hx + 4, hy - 92, 16, "#fff", 0.9);
      } else if (c.kid === "teen") {
        drawPerson(ctx, { x: 300, y: TABLE + 60, h: 800, child: 0.1, dir: 1, sit: 1, stoop: 0.35, head: 0.6, handF: { x: 420, y: TABLE - 190 }, handB: { x: 405, y: TABLE - 180 }, rim: { color: "rgba(255,238,210,0.85)", dx: -3, dy: -4, blur: 3 } });
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
      vgrad(ctx, -100, TABLE, DW + 200, DH - TABLE + 200, [[0, "#8a857b"], [0.05, "#4a4741"], [1, "#121110"]]);
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
      // 按每个数字的实际字形排版：数字立在蛋糕面上，灯芯插在字形顶端正中
      const digits = [...c.n];
      ctx.save();
      ctx.font = `900 170px ${SERIF}`;
      const ms = digits.map((d) => ctx.measureText(d));
      ctx.restore();
      const gap = 16;
      const widths = ms.map((m) => m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
      const totalW = widths.reduce((x, y) => x + y, 0) + gap * (digits.length - 1);
      const baseY = top + 14;
      let left = cx - totalW / 2;
      const boxes = widths.map((w, i) => { const b = { left, w, m: ms[i] }; left += w + gap; return b; });
      digits.forEach((d, i) => {
        const { left: bl, w: bw, m } = boxes[i];
        const dx = bl + bw / 2;
        ctx.save();
        ctx.font = `900 170px ${SERIF}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.lineWidth = 8;
        ctx.strokeStyle = RED;
        ctx.strokeText(d, bl + m.actualBoundingBoxLeft, baseY);
        ctx.fillStyle = "#f6f1e7";
        ctx.fillText(d, bl + m.actualBoundingBoxLeft, baseY);
        ctx.restore();
        const wy = baseY - m.actualBoundingBoxAscent + 4;
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
      text(ctx, ["她的 32 岁", "她的 45 岁", "她的 58 岁 · 今年", "她能等到 100 岁吗？"][k], DW / 2, 560, 52, { weight: 600, color: PAPER, shadow: "rgba(0,0,0,0.9)", blur: 16, alpha: smooth(clamp(tk / 0.15)) });
    },
    focus: (t) => {
      const k = Math.min(3, Math.floor(t / 0.91));
      return [{ x: 520, y: 950, r: 460, a: 0.35 }, { x: 500, y: 950, r: 460, a: 0.35 }, { x: 420, y: 1000, r: 470, a: 0.38 }, { x: 560, y: 980, r: 380, a: 0.5 }][k];
    },
  };
};
