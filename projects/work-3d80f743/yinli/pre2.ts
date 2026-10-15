// 导歌二 1:27.93–1:35.49（一盏灯照着半张桌子，两个人挤在这半平米的光里；镜头推进去以后，靠匹配溶解在桌面近景和屋子之间来回，不硬切）
// S39 87.93–89.85「发着光的半平米」：夜，屋子很暗，只有台灯照着半张桌子；两个人的脚绳系在一起。镜头从暗处慢慢推进那片光，落到桌上的砖
// S40 89.85–91.89「胡乱哼唱的旋律」：桌面近景（同一块砖在画面同一个位置溶进来）：她哼着歌，握着他的小手写「活下去」；写完把那支两块五的笔塞进他手里
// S41 91.89–93.84「但是还想拯救你」：他自己写了一块，歪歪扭扭，写的不是她教的：「妈妈，明天见」；镜头退回屋子：她愣住，伸手摸了摸他的头
// S42 93.84–95.49「同时拯救我自己」：她写下自己那块「活下去」往靴子里塞——满了，塞不进去；砖从靴口滑出来，镜头跟着它掉到地上「咚」
import { type C, type Cam, type Shot, W, H, E, ph, kcam, applyCam, vignette, fill, mix, writeOn } from "./core";
import { figure, stone, rope, pose, type Fig, type Pt } from "./figure";
import { qinRoom } from "./sets";
import { hand, pen } from "./props";

const KID_COAT = { top: "#f39a5f", accent: "#e65a4f" };
const KID_SLEEVE = "#f39a5f";
const DESK_BRICK: Pt = [300, -158]; // 桌上的砖（屋子里的位置）
const S_DESK: Pt = [W / 2, 1110]; // 近景里砖在画面上的位置；屋子那一镜推到这里结束
const lerpPt = (a: Pt, b: Pt, e: number): Pt => [mix(a[0], b[0], e), mix(a[1], b[1], e)];

function lampRoom(c: C, t: number, lamp: number, o: { kidHead?: number; qinHand?: Pt; qinHead?: number; qinEyes?: Fig["eyes"] } = {}) {
  qinRoom(c, t, { night: 0.92, lamp, boots: 1, glare: 0.6 });
  // 她坐在桌子左边，他站在桌子右边；两个人的脚绳系在一起
  const q = figure(c, { x: 150, y: -70, grounded: false, kind: "qin", facing: 1, legL: 1.35, legR: 1.25, kneeL: 1.45, kneeR: 1.35, lean: 0.3, head: o.qinHead ?? -0.5 + Math.sin(t * 3.2) * 0.08, hR: o.qinHand ?? [262, -160], hL: [240, -156], rim: 0.5, warm: lamp * 0.45, barefoot: true, boots: false, eyes: o.qinEyes ?? "open" }, t);
  const k = figure(c, { x: 262, y: 0, kind: "kid", look: KID_COAT, coat: 1.55, facing: -1, lean: 0.1, head: o.kidHead ?? -0.6, hR: [290, -160], hL: [300, -156], rim: 0.5, warm: lamp * 0.45, eyes: "open", barefoot: true, bell: true }, t);
  rope(c, q.anR, k.anL, 26, 2.8);
  stone(c, DESK_BRICK[0], DESK_BRICK[1], 9, "", 0.2 * lamp);
}

/** 灯下的近景：暖光，桌面 */
function warmClose(c: C, warm: number) {
  fill(c, "#3d3a68");
  const g = c.createRadialGradient(W * 0.72, 380, 60, W * 0.6, 700, 1300);
  g.addColorStop(0, `rgba(255,190,110,${0.7 * warm})`);
  g.addColorStop(0.5, `rgba(150,96,52,${0.35 * warm})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(160,112,84,0.97)";
  c.fillRect(0, 1180, W, 740);
  c.fillStyle = "rgba(255,214,150,0.25)";
  c.fillRect(0, 1180, W, 10);
}

// ---------- S39 屋子：从暗处推进那片光 ----------
const roomCam = (t: number): Cam =>
  kcam(t, [
    [87.93, { x: 120, y: -300, z: 1.5 }],
    [88.5, { x: 190, y: -250, z: 1.9 }, E.soft],
    [89.85, { x: 245, y: -165, z: 3.6 }, E.out], // 越推越慢，停在灯下挤在一起的两个人和桌上的砖
  ]);
const s39: Shot = {
  a: 87.93,
  b: 89.85,
  xin: 0.45,
  draw(c, t) {
    const lamp = E.out(ph(t, 88.0, 88.45));
    c.save();
    applyCam(c, roomCam(t));
    lampRoom(c, t, lamp, { kidHead: 0.2 - lamp * 0.8 });
    c.restore();
    vignette(c, 0.6 - 0.15 * lamp, 420, 1250, "12,9,7");
  },
};

// ---------- S40 近景：她握着他的手写「活下去」，把那支两块五的笔塞给他 ----------
const s40: Shot = {
  a: 89.85,
  b: 91.89,
  xin: 0.35, // 同一块砖在画面同一个位置：屋子 → 桌面近景
  draw(c, t) {
    warmClose(c, 1);
    const p = ph(t, 90.0, 90.95);
    const i = Math.min(2, Math.floor(p * 3));
    const hum = Math.sin(t * 6.4) * 6; // 哼着歌，手跟着轻轻晃
    const wob = Math.sin(t * 30) * 8;
    stone(c, S_DESK[0] - 20, S_DESK[1] + 10, 130, writeOn("活下去", p), 0.25, -0.05);
    const give = E.io(ph(t, 91.15, 91.6));
    if (give < 1) {
      const px = 440 + i * 80 + wob;
      const py = 1110 + Math.cos(t * 27) * 6 + hum;
      pen(c, px + give * 260, py + give * 160, -0.85, 2.2);
      hand(c, px + 230 + give * 260, py - 250 + give * 160, 1.45, 2.25, { grip: 0.8, left: true, tone: KID_SLEEVE, skin: "#f7dac7" }); // 他的小手
      hand(c, px + 300 + give * 300, py - 310 + give * 170, 2.3, 2.3, { grip: 0.55, left: true, tone: "#465f93" }); // 她的手握着他的手
    } else {
      pen(c, 760, 1300, -0.3, 2.2);
      hand(c, 900, 1290, 1.45, Math.PI + 0.3, { grip: 0.6, tone: KID_SLEEVE, skin: "#f7dac7" });
    }
    vignette(c, 0.55, 420, 1250, "12,9,7");
  },
};

// ---------- S41 他自己写了一块：「妈妈，明天见」；她愣住，摸摸他的头 ----------
const T_BACK = 92.95; // 退回屋子
const s41: Shot = {
  a: 91.89,
  b: 93.84,
  draw(c, t) {
    const close = (c: C) => {
      warmClose(c, 1);
      const p = ph(t, 91.95, 92.85);
      stone(c, 540, 1110, 140, writeOn("妈妈，明天见", p), 0.25, 0.09, "#2a2a3a");
      const n = 6;
      const i = Math.min(n - 1, Math.floor(p * n));
      const wob = Math.sin(t * 24) * 14;
      const px = 540 - 2.5 * 46 + i * 46 + wob;
      const py = 1110 + Math.cos(t * 19) * 10;
      pen(c, px, py, -0.95, 2.2);
      hand(c, px + 200, py - 240, 1.45, 2.2, { grip: 0.85, left: true, tone: KID_SLEEVE, skin: "#f7dac7" });
      vignette(c, 0.55, 420, 1250, "12,9,7");
    };
    const room = (c: C) => {
      // 从砖上退开，抬到她的脸：她愣住，伸手摸摸他的头
      const k = kcam(t, [
        [T_BACK - 0.3, { x: 290, y: -170, z: 4.2 }],
        [T_BACK + 0.25, { x: 235, y: -170, z: 3.4 }, E.out],
        [93.84, { x: 232, y: -168, z: 3.55 }, E.io],
      ]);
      c.save();
      applyCam(c, k);
      const stroke = E.io(ph(t, 93.3, 93.65));
      const freeze = t > T_BACK && t < 93.3;
      lampRoom(c, t, 1, { kidHead: -0.7, qinHead: freeze ? -0.15 : -0.35, qinEyes: freeze ? "wide" : "open", qinHand: [mix(262, 258, stroke), mix(-160, -118, stroke)] });
      c.restore();
      vignette(c, 0.5, 420, 1250, "12,9,7");
    };
    const e = E.io(ph(t, T_BACK - 0.3, T_BACK + 0.05));
    if (e <= 0) return close(c);
    if (e >= 1) return room(c);
    close(c);
    c.save();
    c.globalAlpha = e;
    room(c);
    c.restore();
  },
};

// ---------- S42 她写下自己那块「活下去」，往靴子里塞——满了，砖从靴口滑出来，掉在地上「咚」 ----------
/** 靴口那一镜（副歌二第一镜开头接着画一小段，跨两个图层溶过去） */
export function pre2Tail(c: C, t: number) {
  s42.draw(c, t, t - 93.84);
}
const s42: Shot = {
  a: 93.84,
  b: 95.49,
  xin: 0.3,
  draw(c, t) {
    if (t < 94.35) {
      warmClose(c, 0.8);
      stone(c, 540, 1110, 130, writeOn("活下去", ph(t, 93.88, 94.3)), 0, -0.04);
      const p = ph(t, 93.88, 94.3);
      pen(c, 540 - 120 + p * 240 + Math.sin(t * 40) * 8, 1110, -0.85, 2.2);
      hand(c, 540 + 110 + p * 240, 1110 - 300, 2.2, 2.25, { grip: 0.75, left: true, tone: "#465f93" });
      vignette(c, 0.6, 420, 1250, "12,9,7");
      return;
    }
    // 靴口：满到边，新的一块放上去滑下来；镜头跟着它往下掉
    const fallCam = E.in2(ph(t, 94.75, 95.25)) * 420;
    fill(c, "#7d5f6e");
    const g = c.createRadialGradient(W * 0.7, 200, 40, W * 0.6, 600, 1200);
    g.addColorStop(0, "rgba(255,186,105,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.save();
    c.translate(0, -fallCam);
    c.save();
    c.translate(W / 2, 1000);
    c.fillStyle = "#3b2a2a";
    c.beginPath();
    c.ellipse(0, 0, 400, 230, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#5d3f34";
    c.lineWidth = 40;
    c.stroke();
    c.restore();
    for (let i = 0; i < 26; i++) {
      const a = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
      const b = Math.abs((Math.sin(i * 78.233) * 12345.678) % 1);
      stone(c, W / 2 - 320 + a * 640, 820 + b * 260, 56 + (i % 3) * 6, "活下去", 0, (a - 0.5) * 0.8);
    }
    const put = E.io(ph(t, 94.35, 94.6));
    const slide = E.in2(ph(t, 94.7, 95.2));
    const landed = t > 95.2;
    const sy = landed ? 1660 : mix(420, 760, put) + slide * 900;
    stone(c, W / 2 + 60 + slide * 320, sy, 80, "活下去", 0, -0.1 + slide * 2);
    // 地板
    c.fillStyle = "#5d4c72";
    c.fillRect(0, 1720, W, 800);
    c.restore();
    // 落地「咚」：一震
    const thud = t > 95.2 ? Math.exp(-(t - 95.2) / 0.12) : 0;
    if (thud > 0.01) {
      c.fillStyle = `rgba(255,240,230,${0.25 * thud})`;
      c.fillRect(0, 0, W, H);
    }
    vignette(c, 0.6, 420, 1250, "12,9,7");
  },
};

export const pre2Shots: Shot[] = [s39, s40, s41, s42];
void pose;
void lerpPt;
