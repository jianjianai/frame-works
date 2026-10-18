// 常用的场景组合：街道（天 + 白 + 城 + 临街的房子 + 网 + 地面）。
import { type C, type Cam, applyCam, seeded, mix } from "./core";
import { sky, whiteBand, city, net, ground, shoes, room, bed, chair, bootsPair, door as doorShape } from "./world";
import { PAL, blend } from "./palette";

interface Facade {
  x: number;
  w: number;
  h: number;
  shoes: number;
  lit: boolean;
  col: string;
  awning: string | null;
}
const rnd = seeded(808);
const AWN = ["#e65a4f", "#5fa8a0", "#f0b44a", "#7d8fd6", null, null];
export const FACADES: Facade[] = [];
for (let x = -7000; x < 7000; ) {
  const w = mix(360, 620, rnd());
  FACADES.push({
    x,
    w,
    h: mix(560, 980, rnd()),
    shoes: rnd() < 0.55 ? 1 + Math.floor(rnd() * 3) : 0,
    lit: rnd() < 0.5,
    col: PAL.buildings[Math.floor(rnd() * PAL.buildings.length)],
    awning: AWN[Math.floor(rnd() * AWN.length)],
  });
  x += w + mix(40, 220, rnd());
}

/** 临街的一排矮房子：门、窗、遮阳棚、门口的空鞋。lights 0..1 窗里的灯 */
export function facades(c: C, k: Cam, o: { night?: number; lights?: number } = {}) {
  const n = o.night ?? 0;
  const x0 = k.x - 700 / k.z;
  const x1 = k.x + 700 / k.z;
  for (const f of FACADES) {
    if (f.x + f.w < x0 || f.x > x1) continue;
    const base = blend(f.col, "#4f5891", n * 0.7);
    c.fillStyle = base;
    c.fillRect(f.x, -f.h, f.w, f.h);
    c.fillStyle = blend(base, "#ffffff", 0.35);
    c.fillRect(f.x - 10, -f.h - 16, f.w + 20, 16);
    // 门
    const dx = f.x + f.w * 0.3;
    c.fillStyle = blend(PAL.woodDark, "#3b3566", n * 0.6);
    c.fillRect(dx - 8, -238, 116, 238);
    c.fillStyle = blend(PAL.wood, "#4b3f70", n * 0.6);
    c.fillRect(dx, -230, 100, 230);
    c.fillStyle = "#f2c64a";
    c.beginPath();
    c.arc(dx + 82, -115, 5, 0, Math.PI * 2);
    c.fill();
    // 遮阳棚
    if (f.awning) {
      const ax = f.x + f.w * 0.55;
      for (let i = 0; i < 6; i++) {
        c.fillStyle = i % 2 ? "#fff4e8" : blend(f.awning, "#4f5891", n * 0.6);
        c.fillRect(ax + i * 22, -372, 22, 34);
      }
    }
    // 窗
    const lit = f.lit && (o.lights ?? 0) > 0;
    c.fillStyle = lit ? PAL.lit : blend(blend(f.col, PAL.unlit, 0.6), PAL.unlitNight, n);
    c.globalAlpha = lit ? 0.4 + 0.6 * (o.lights ?? 0) : 1;
    c.fillRect(f.x + f.w * 0.62, -330, 90, 120);
    if (f.h > 700) c.fillRect(f.x + f.w * 0.25, -f.h + 140, 90, 120);
    c.globalAlpha = 1;
    c.fillStyle = blend(f.col, "#ffffff", 0.55);
    c.fillRect(f.x + f.w * 0.62 - 6, -214, 102, 8);
    if (f.shoes) shoes(c, dx + 116, 0, f.shoes, 1);
  }
}

export interface StreetOpt {
  night?: number;
  lights?: number;
  nets?: boolean;
  facades?: boolean;
  glow?: number;
}
/** 街道底子（不画人）：调用前不要套镜头 */
export function street(c: C, k: Cam, t: number, o: StreetOpt = {}) {
  sky(c, k, { night: o.night });
  whiteBand(c, k, t, o.glow ?? 1);
  city(c, k, { layers: [0, 1, 2], lights: (o.lights ?? 0) * 0.5, night: o.night });
  c.save();
  applyCam(c, k);
  if (o.facades !== false) facades(c, k, { night: o.night, lights: o.lights });
  if (o.nets !== false) {
    net(c, -5200, 5200, -1350, t, [-140, 140]);
    net(c, -5200, 5200, -2300, t, [300, 520]);
  }
  ground(c, k, { tone: o.night ?? 0 });
  c.restore();
}

// ---------- 她的屋子：全城最高那栋楼的最顶上 ----------
export interface QinRoomOpt {
  night?: number;
  lamp?: number;
  glare?: number;
  boots?: number; // 地上那双靴子塞了多满；undefined = 不在地上（穿在脚上）
  doorOpen?: number;
  doorLit?: number;
  kidBed?: boolean; // 天花板上再钉一张小床（小石头搬来以后，两个人都倒着睡在天花板上）
  coatOnChair?: boolean; // 他妈妈那件橘色外套叠在椅子上（他夜里脱了它才飘得上去）
}
export function qinRoom(c: C, t: number, o: QinRoomOpt = {}) {
  room(c, { night: o.night ?? 0.8, glare: o.glare ?? 0.85, bars: true, lamp: o.lamp, t });
  chair(c, o.night ?? 0.8); // 地上没有床，只有一把椅子
  // 天花板上倒着钉的一张床：她太轻了，夜里脱了靴子就飘上去，睡在这张床上
  c.save();
  c.fillStyle = blend("#b9a6bd", "#3a3f72", o.night ?? 0.8);
  c.fillRect(-480, -612, 960, 12);
  c.translate(0, -600);
  c.scale(1, -1);
  bed(c, o.night ?? 0.8);
  if (o.kidBed) {
    const n = o.night ?? 0.8;
    c.fillStyle = blend(PAL.wood, "#4b3c62", n);
    c.fillRect(6, -84, 14, 84);
    c.fillRect(204, -66, 12, 66);
    c.fillStyle = blend("#b9d9b0", "#5f7a8e", n);
    c.fillRect(14, -58, 196, 24);
    c.fillStyle = blend("#fff7ef", "#a69bc6", n);
    c.fillRect(150, -72, 52, 16);
  }
  c.restore();
  if (o.coatOnChair) {
    const n = o.night ?? 0.8;
    c.fillStyle = blend("#f39a5f", "#7a5a7a", n * 0.7);
    c.fillRect(-262, -78, 66, 16);
    c.fillRect(-200, -78, 12, 40);
    c.fillStyle = "#6b6a80";
    for (let i = 0; i < 4; i++) c.fillRect(-256 + i * 15, -64, 8, 4);
  }
  doorShape(c, 540, 0, { open: o.doorOpen ?? 0, lit: o.doorLit, w: 120, h: 250 });
  if (o.boots !== undefined) bootsPair(c, -20, 0, 1, o.boots);
}
