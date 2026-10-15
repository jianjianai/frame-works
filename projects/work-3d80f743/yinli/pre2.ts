// 导歌二 1:27.93–1:35.49：一盏灯照着半张桌子（全片第一处暖光）→ 教他写「活下去」→ 他自己写了「妈妈，明天见」→ 她的靴子塞满了
import { type C, type Shot, W, H, E, ph, kcam, kick, applyCam, vignette, fill, mix, writeOn } from "./core";
import { figure, stone, type Fig } from "./figure";
import { qinRoom } from "./sets";
import { hand, pen } from "./props";

function lampRoom(c: C, t: number, lamp: number, o: { kidHead?: number; qinHand?: [number, number]; stroke?: number } = {}) {
  qinRoom(c, t, { night: 0.92, lamp, boots: 1, glare: 0.75 });
  // 她坐在桌子左边，他站在桌子右边
  figure(c, { x: 150, y: -70, grounded: false, kind: "qin", facing: 1, legL: 1.35, legR: 1.25, kneeL: 1.45, kneeR: 1.35, lean: 0.3, head: -0.5, hR: o.qinHand ?? [262, -160], hL: [240, -156], rim: 0.5, warm: lamp * 0.45, barefoot: true, boots: false, eyes: "open" }, t);
  figure(c, { x: 400, y: 0, kind: "kid", facing: -1, lean: 0.15, head: o.kidHead ?? -0.6, hR: [318, -160], hL: [330, -156], rim: 0.5, warm: lamp * 0.45, eyes: "open", barefoot: true }, t);
  stone(c, 300, -158, 9, "", 0);
}

/** 灯下的近景：暖光，桌面上一块砖 */
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

// ---------- S39 87.93–89.85：夜，她的小屋第一次点了灯 ----------
const s39: Shot = {
  a: 87.93,
  b: 89.85,
  xin: 0.45,
  draw(c, t) {
    const lamp = E.out(ph(t, 88.05, 88.45));
    const k = kcam(t, [[87.93, { x: 200, y: -240, z: 2.0 }], [89.85, { x: 280, y: -190, z: 3.0 }, E.io]]);
    c.save();
    applyCam(c, k);
    lampRoom(c, t, lamp, { kidHead: 0.2 - lamp * 0.8 });
    c.restore();
    vignette(c, 0.6 - 0.15 * lamp, 420, 1250, "12,9,7");
  },
};

// ---------- S40 89.85–91.89：她握着他的手写「活下去」，把那支两块五的笔塞给他 ----------
const s40: Shot = {
  a: 89.85,
  b: 91.89,
  draw(c, t) {
    warmClose(c, 1);
    const p = ph(t, 90.0, 90.95);
    const i = Math.min(2, Math.floor(p * 3));
    const wob = Math.sin(t * 30) * 8;
    stone(c, 520, 1120, 130, writeOn("活下去", p), 0.25, -0.05);
    const give = E.io(ph(t, 91.15, 91.6));
    if (give < 1) {
      const px = 440 + i * 80 + wob;
      const py = 1110 + Math.cos(t * 27) * 6;
      pen(c, px + give * 260, py + give * 160, -0.85, 2.2);
      hand(c, px + 230 + give * 260, py - 250 + give * 160, 1.45, 2.25, { grip: 0.8, left: true, tone: "#6fb07a", skin: "#f7dac7" }); // 他的小手
      hand(c, px + 300 + give * 300, py - 310 + give * 170, 2.3, 2.3, { grip: 0.55, left: true, tone: "#465f93" }); // 她的手握着他的手
    } else {
      pen(c, 760, 1300, -0.3, 2.2);
      hand(c, 900, 1290, 1.45, Math.PI + 0.3, { grip: 0.6, tone: "#6fb07a", skin: "#f7dac7" });
    }
    vignette(c, 0.55, 420, 1250, "12,9,7");
  },
};

// ---------- S41 91.89–93.84：他自己写了一块，歪歪扭扭，写的不是她教的：「妈妈，明天见」。她愣住，摸摸他的头 ----------
const s41: Shot = {
  a: 91.89,
  b: 93.84,
  draw(c, t) {
    if (t < 93.0) {
      warmClose(c, 1);
      const p = ph(t, 91.95, 92.85);
      stone(c, 540, 1110, 140, writeOn("妈妈，明天见", p), 0.25, 0.09, "#2a2a3a");
      const n = 6;
      const i = Math.min(n - 1, Math.floor(p * n));
      const wob = Math.sin(t * 24) * 14;
      const px = 540 - 2.5 * 46 + i * 46 + wob;
      const py = 1110 + Math.cos(t * 19) * 10;
      pen(c, px, py, -0.95, 2.2);
      hand(c, px + 200, py - 240, 1.45, 2.2, { grip: 0.85, left: true, tone: "#6fb07a", skin: "#f7dac7" });
      vignette(c, 0.55, 420, 1250, "12,9,7");
      return;
    }
    const k = kcam(t, [[93.0, { x: 290, y: -230, z: 3.4 }], [93.84, { x: 280, y: -230, z: 3.2 }, E.io]]);
    c.save();
    applyCam(c, k);
    const stroke = E.io(ph(t, 93.35, 93.7));
    lampRoom(c, t, 1, { kidHead: -0.7, qinHand: [mix(262, 392, stroke), mix(-160, -226, stroke)] });
    c.restore();
    vignette(c, 0.5, 420, 1250, "12,9,7");
  },
};

// ---------- S42 93.84–95.49：她写下自己那块「活下去」，往靴子里塞——满了，砖从靴口掉到地上 ----------
const s42: Shot = {
  a: 93.84,
  b: 95.49,
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
    // 靴口：满到边，新的一颗放上去滑下来，两颗滚到地上
    fill(c, "#7d5f6e");
    const g = c.createRadialGradient(W * 0.7, 200, 40, W * 0.6, 600, 1200);
    g.addColorStop(0, "rgba(255,186,105,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
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
    stone(c, W / 2 + 60 + slide * 320, mix(420, 760, put) + slide * 900, 80, "活下去", 0, -0.1 + slide * 2);
    for (const [j, d] of [
      [0, 0.0],
      [1, 0.12],
    ] as [number, number][]) {
      const s = E.in2(ph(t, 94.8 + d, 95.35 + d));
      if (s > 0) stone(c, W / 2 - 200 + j * 330 + s * (j ? 200 : -240), 860 + s * 1000, 64, "活下去", 0, s * 3);
    }
    vignette(c, 0.6, 420, 1250, "12,9,7");
    void kick;
  },
};

export const pre2Shots: Shot[] = [s39, s40, s41, s42];
export type { Fig };
