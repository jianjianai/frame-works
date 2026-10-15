// 近景道具：大手、两块五的圆珠笔、灰锭、挂锁、收灰车、排队的人。
import { type C, clamp, mix, seeded } from "./core";
import { figure, type Fig } from "./figure";
import { UMBRELLAS, crowdLook } from "./palette";

/** 近景的手：袖口（tone 是袖子颜色）+ 皮肤，带描边。grip 0 张开 1 握拳 */
export function hand(c: C, x: number, y: number, s: number, rot: number, o: { grip?: number; left?: boolean; tone?: string; skin?: string; rim?: boolean } = {}) {
  const g = clamp(o.grip ?? 0);
  const sleeve = o.tone ?? "#465f93";
  const skin = o.skin ?? "#f5d3bf";
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  if (o.left) c.scale(-1, 1);
  c.scale(s, s);
  const draw = (pass: "outline" | "color") => {
    const ow = pass === "outline" ? 5 : 0;
    const pick = (col: string) => (pass === "outline" ? "#3e3149" : col);
    c.lineCap = "round";
    // 袖子
    c.strokeStyle = pick(sleeve);
    c.lineWidth = 38 + ow;
    c.beginPath();
    c.moveTo(-130, 0);
    c.lineTo(-30, 0);
    c.stroke();
    // 手腕和掌
    c.strokeStyle = pick(skin);
    c.fillStyle = pick(skin);
    c.lineWidth = 30 + ow;
    c.beginPath();
    c.moveTo(-30, 0);
    c.lineTo(0, 0);
    c.stroke();
    c.beginPath();
    c.ellipse(18, 0, 34 + ow / 2, 28 + ow / 2, 0, 0, Math.PI * 2);
    c.fill();
    c.lineWidth = 13 + ow;
    for (let i = 0; i < 4; i++) {
      const by = -18 + i * 12;
      const l1 = 26 - Math.abs(i - 1.3) * 3;
      const a = g * 1.9;
      const kx = 44 + Math.cos(a * 0.5) * l1;
      const ky = by + Math.sin(a * 0.5) * l1 * 0.6;
      c.beginPath();
      c.moveTo(42, by);
      c.lineTo(kx, ky);
      c.lineTo(kx + Math.cos(a) * 20, ky + Math.sin(a) * 20);
      c.stroke();
    }
    c.lineWidth = 14 + ow;
    c.beginPath();
    c.moveTo(20, -22);
    c.lineTo(40 + g * 6, -38 + g * 14);
    c.lineTo(56 + g * 4, -44 + g * 26);
    c.stroke();
    // 袖口一道
    if (pass === "color") {
      c.strokeStyle = "rgba(255,255,255,0.35)";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(-34, -17);
      c.lineTo(-34, 17);
      c.stroke();
    }
  };
  c.globalAlpha *= 0.8;
  draw("outline");
  c.globalAlpha /= 0.8;
  draw("color");
  c.restore();
}

/** 两块五的圆珠笔（笔尖在 (x, y)），带价签 */
export function pen(c: C, x: number, y: number, rot: number, s = 1) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  c.fillStyle = "#3b4250";
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(10, -5);
  c.lineTo(10, 5);
  c.closePath();
  c.fill();
  c.fillStyle = "rgba(200,210,220,0.85)";
  c.fillRect(10, -7, 190, 14);
  c.fillStyle = "#2b3a66";
  c.fillRect(160, -8, 50, 16);
  c.fillRect(150, -10, 8, 4);
  // 价签
  c.fillStyle = "#f2efe6";
  c.fillRect(70, -12, 58, 24);
  c.fillStyle = "#b8332c";
  c.font = `700 15px "YinliSerif", serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("2.5元", 99, 1);
  c.restore();
}

/** 灰锭：打着斤数的铁砖 */
export function ingot(c: C, x: number, y: number, s = 1, rot = 0, label = true) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  c.fillStyle = "#6c7192";
  c.beginPath();
  c.moveTo(-34, 0);
  c.lineTo(34, 0);
  c.lineTo(26, -26);
  c.lineTo(-26, -26);
  c.closePath();
  c.fill();
  c.fillStyle = "#a9aecb";
  c.fillRect(-26, -27, 52, 3);
  if (label) {
    c.fillStyle = "#e9e6f4";
    c.font = `700 13px "YinliSerif", serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("十斤", 0, -12);
  }
  c.restore();
}

/** 哑铃（侧面）：中间一根握杆，两头一大一小的铁片。(x, y) 是握杆中心；s=1 长约 80、铁片高 34；躺在地上时 y = -17·s */
export function dumbbell(c: C, x: number, y: number, s = 1, rot = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  c.lineJoin = "round";
  c.strokeStyle = "#3b3550";
  c.lineWidth = 2.6 / Math.max(0.6, s * 0.6);
  const part = (x0: number, w: number, h: number, col: string) => {
    c.fillStyle = col;
    c.beginPath();
    c.roundRect(x0, -h / 2, w, h, Math.min(w, h) * 0.3);
    c.fill();
    c.stroke();
  };
  part(-28, 56, 7, "#9a9fbd"); // 握杆
  for (const sgn of [-1, 1]) {
    part(sgn > 0 ? 36 : -40, 4, 10, "#6c7192"); // 端头
    part(sgn > 0 ? 25 : -36, 11, 34, "#5d6286"); // 大铁片
    part(sgn > 0 ? 18 : -25, 7, 25, "#6c7192"); // 小铁片
  }
  // 高光
  c.fillStyle = "rgba(220,224,245,0.55)";
  c.fillRect(-34, -15, 4, 12);
  c.fillRect(28, -15, 4, 12);
  c.restore();
}

/** 哑铃店：门脸、卷起的卷帘门、招牌（大哑铃 + 「哑铃」）、店里一排排哑铃架、柜台。x 是门脸中心，站在 y=0 */
export function dumbbellShop(c: C, x: number) {
  c.save();
  c.translate(x, 0);
  // 门脸
  c.fillStyle = "#e7b49c";
  c.fillRect(-300, -560, 600, 560);
  c.fillStyle = "#d39c86";
  c.fillRect(-300, -560, 600, 18);
  // 店里：暖黄的灯
  c.fillStyle = "#f6dcae";
  c.fillRect(-230, -300, 460, 300);
  const g = c.createLinearGradient(0, -300, 0, 0);
  g.addColorStop(0, "rgba(255,240,205,0.9)");
  g.addColorStop(1, "rgba(230,190,150,0.2)");
  c.fillStyle = g;
  c.fillRect(-230, -300, 460, 300);
  // 哑铃架：三层，从小到大
  c.fillStyle = "#9b6d55";
  for (let r = 0; r < 3; r++) {
    const y = -250 + r * 70;
    c.fillRect(-220, y, 440, 8);
    for (let i = 0; i < 6; i++) dumbbell(c, -180 + i * 72, y - 4 - 8 * (0.45 + r * 0.12), 0.45 + r * 0.12);
  }
  // 卷起的卷帘门
  c.fillStyle = "#b9b4c8";
  c.fillRect(-240, -322, 480, 26);
  c.strokeStyle = "rgba(90,80,110,0.4)";
  c.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    c.beginPath();
    c.moveTo(-240, -322 + i * 6.5);
    c.lineTo(240, -322 + i * 6.5);
    c.stroke();
  }
  // 门框
  c.strokeStyle = "#6e4a3a";
  c.lineWidth = 12;
  c.strokeRect(-236, -300, 472, 300);
  // 招牌：一只大哑铃 + 字
  c.fillStyle = "#4f3f63";
  c.beginPath();
  c.roundRect(-210, -480, 420, 120, 18);
  c.fill();
  c.strokeStyle = "#f2c64a";
  c.lineWidth = 5;
  c.stroke();
  dumbbell(c, -120, -420, 1.15);
  c.fillStyle = "#fff3d8";
  c.font = `700 64px "YinliSerif", serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("哑铃", 60, -418);
  // 柜台
  c.fillStyle = "#a8745a";
  c.fillRect(-230, -96, 250, 96);
  c.fillStyle = "#c48e70";
  c.fillRect(-236, -104, 262, 12);
  c.restore();
}

/** 挂锁（近景），open 0..1 锁梁弹开 */
export function padlock(c: C, x: number, y: number, s = 1, open = 0) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.strokeStyle = "#a9a6b8";
  c.lineWidth = 9;
  c.beginPath();
  c.arc(0, -30 - open * 26, 22, Math.PI, Math.PI * 2);
  c.lineTo(22, -30 + (open > 0.1 ? -open * 26 : 0) + 6);
  c.moveTo(-22, -30 - open * 26);
  c.lineTo(-22, -24);
  c.stroke();
  c.fillStyle = "#d9a948";
  c.fillRect(-32, -30, 64, 52);
  c.fillStyle = "#6b4a2e";
  c.beginPath();
  c.arc(0, -8, 7, 0, Math.PI * 2);
  c.fill();
  c.fillRect(-3, -8, 6, 16);
  c.restore();
}

/** 链子：两点之间一串环 */
export function chain(c: C, a: [number, number], b: [number, number], sag: number, s = 1) {
  c.save();
  c.strokeStyle = "#9c9ab4";
  c.lineWidth = 4 * s;
  const n = Math.max(3, Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / (14 * s)));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = mix(a[0], b[0], t);
    const y = mix(a[1], b[1], t) + Math.sin(t * Math.PI) * sag;
    c.beginPath();
    c.ellipse(x, y, 7 * s, 4.5 * s, i % 2 ? 1.2 : 0.2, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}

/** 收灰车：车厢后翻 tilt 0..1 */
export function truck(c: C, x: number, y: number, tilt: number) {
  c.save();
  c.translate(x, y);
  c.fillStyle = "#4f8f8a";
  c.fillRect(-60, -230, 260, 200);
  c.fillStyle = "#e8f3f0";
  c.fillRect(70, -210, 100, 70);
  c.fillStyle = "#3e3149";
  for (const wx of [-260, 80]) {
    c.beginPath();
    c.arc(wx, -30, 42, 0, Math.PI * 2);
    c.fill();
  }
  c.save();
  c.translate(-60, -60);
  c.rotate(-tilt * 0.55);
  c.fillStyle = "#6e9fa0";
  c.fillRect(-420, -150, 420, 150);
  c.fillStyle = "#fff4e2";
  c.font = `700 46px "YinliSerif", serif`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("收 灰 处", -210, -75);
  c.restore();
  c.restore();
}

/** 一排低头打伞的人（排队、旁观）。每个人一个固定的小摇摆 */
export function crowd(
  c: C,
  t: number,
  xs: number[],
  y: number,
  o: { s?: number; tone?: number; facing?: 1 | -1; umbrella?: boolean; head?: number; seed?: number; look?: number } = {},
) {
  const rnd = seeded(o.seed ?? 5);
  for (const x of xs) {
    const kinds = ["man", "woman", "worker", "plain", "old"] as const;
    const kind = kinds[Math.floor(rnd() * kinds.length)];
    const sway = Math.sin(t * 0.9 + x * 0.03) * 0.03;
    const f: Fig = {
      x,
      y,
      s: (o.s ?? 1) * (0.92 + rnd() * 0.12),
      kind,
      facing: o.facing ?? 1,
      head: mix(o.head ?? -0.7, 0.9, o.look ?? 0),
      lean: sway + 0.06,
      tone: o.tone ?? 0.35,
      umbrella: o.umbrella ?? true,
      umbrellaColor: UMBRELLAS[Math.floor(rnd() * UMBRELLAS.length)],
      look: crowdLook(x * 0.013 + (o.seed ?? 5)),
      aL: -0.5,
      bendL: -1.6,
      tie: false,
      rim: 0.35,
    };
    figure(c, f, t);
  }
}

/** 小刀（割脚绳用的） */
export function knife(c: C, x: number, y: number, s = 1, rot = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  c.fillStyle = "#c9ccd1";
  c.beginPath();
  c.moveTo(0, -4);
  c.lineTo(46, -1);
  c.lineTo(52, 3);
  c.lineTo(0, 5);
  c.closePath();
  c.fill();
  c.fillStyle = "#3a2c22";
  c.fillRect(-34, -5, 36, 11);
  c.restore();
}

/** 一只大铁靴（单只，脚踝在 (x, y)，靴底在 y + 14s） */
export function bigBoot(c: C, x: number, y: number, s = 1, facing = 1, rot = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s * facing, s);
  c.fillStyle = "rgba(62,49,73,0.85)";
  const path = () => {
    c.beginPath();
    c.moveTo(-14, -32);
    c.lineTo(12, -32);
    c.lineTo(14, 2);
    c.quadraticCurveTo(40, 2, 38, 16);
    c.lineTo(-16, 16);
    c.closePath();
  };
  c.lineWidth = 4;
  c.strokeStyle = "rgba(62,49,73,0.85)";
  path();
  c.stroke();
  c.fillStyle = "#5d3f34";
  path();
  c.fill();
  c.fillStyle = "rgba(255,235,220,0.35)";
  c.fillRect(-12, -30, 22, 4);
  c.restore();
}
