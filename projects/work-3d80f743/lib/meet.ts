// 五④ 第四声「活下去」（模块时间 144.02–150.02，作品 124.02–130.02；146.02 是「活」）：把砖给她。
// 人链接着往上冲，穿过天上那张网，越升越慢，145.85 他停在她右下方（lib/coatoff.ts 的 giveAt）；白的边上她闭着眼、发梢一点点化成光，
// 他举着砖绕长边翻过来（她写的「活下去」朝外）；她睁开眼看见他，146.02 两只手接过砖，捧到胸前——是她自己的字；「下」翻过来，
// 背面是「沉沉，明天见」（lib/dive.ts 的 brick5），看着字忍着哭；148.02「去」砖发出全片最强的暖光（只用画面，不加音效）：
// 发梢化成的光停下来、熄掉，头发落下来（有了分量）；她哭着笑，抱住他。五⑤ 往下落时这团光就是落回城里的一盏灯。
// 这里画砖（五④ 起画在所有人上面，两个人的手都捏在两头后面；抱住以后夹在两个人中间，见 scenes/act7.ts）、暖光、发梢的光和镜头。

import { jointsOf } from "@materials/剪纸角色/code/chengtuo";
import { seeded } from "@frame/engine/math";
import { type Cam, E, W, H, aim, applyCam, camLerp, ph, toScreen } from "./cam";
import { drawGlow, drawTinted } from "./world";
import { drawHerBrick } from "./write5";
import { brick5, diveHer } from "./dive";
import { breath } from "./chain";
import { cam53 } from "./link";
import { GIVE_T } from "./t54";

type V2 = [number, number];
const T = GIVE_T;
export { GIVE_T };
/** 砖按街上的大小画（屋里的 1/1.22），和他手里时一样 */
const BS = 1 / 1.22;

/** 砖亮起来到多亮（0–1）：148.02 起 0.35 秒亮到头，之后很慢地一明一暗 */
export const glowAt = (t: number) => (t < T.glow ? 0 : E.out(ph(t, T.glow, T.glow + 0.35)) * (0.94 + 0.06 * Math.sin((t - T.glow) * 5.2)));

/** 画砖（世界坐标）：她那块，中心、转角、翻面跟着 brick5；亮起来以后砖面上叠一层暖光（字照样看得清） */
export function drawGiveBrick(g: CanvasRenderingContext2D, t: number) {
  if (t < T.start) return;
  const b = brick5(t);
  drawHerBrick(g, t, b.c, b.rot, BS, b.flipY);
  const w = glowAt(t);
  if (w <= 0) return;
  g.save();
  g.translate(b.c[0], b.c[1]);
  g.rotate(b.rot);
  g.globalCompositeOperation = "lighter";
  const hw = 41;
  const hh = 15 * Math.max(0.04, Math.abs(b.flipY));
  const gr = g.createRadialGradient(0, 0, 4, 0, 0, hw * 1.1);
  gr.addColorStop(0, `rgba(255,214,150,${0.24 * w})`);
  gr.addColorStop(1, `rgba(255,170,90,${0.1 * w})`);
  g.fillStyle = gr;
  g.fillRect(-hw, -hh, hw * 2, hh * 2);
  g.restore();
}
/** 五④ 抱住以前：砖画在所有人上面（和人一起蒙一次早上的色） */
export function drawGiveBrickOver(g: CanvasRenderingContext2D, t: number) {
  if (t < T.start) return;
  const b = brick5(t);
  drawTinted(g, [b.c[0] - 80, b.c[1] - 50, b.c[0] + 80, b.c[1] + 50], (gg) => drawGiveBrick(gg, t), 0.85);
}

/**
 * 全片最强的暖光（画面坐标，画在白和颗粒上面）：以砖为中心，soft-light 把整个画面提暖（亮处暖、深色的衣服头发不被染色），
 * 砖周围用 lighter 叠一大团、一小团暖光；暖光压住白
 */
export function drawGiveGlow(g: CanvasRenderingContext2D, base: DOMMatrix, cam: Cam, t: number) {
  const w = glowAt(t);
  if (w <= 0.003) return;
  const b = brick5(t);
  const [sx, sy] = toScreen(cam, b.c[0], b.c[1]);
  g.save();
  g.setTransform(base);
  g.globalCompositeOperation = "soft-light";
  const r = 1500;
  const wash = g.createRadialGradient(sx, sy, 0, sx, sy, r);
  wash.addColorStop(0, `rgba(255,186,110,${0.6 * w})`);
  wash.addColorStop(0.35, `rgba(255,190,120,${0.32 * w})`);
  wash.addColorStop(1, `rgba(255,200,150,${0.08 * w})`);
  g.fillStyle = wash;
  g.fillRect(0, 0, W, H);
  g.restore();
  // 光团按世界的大小（跟着镜头放大）：砖跟前一小团亮的，外面一圈淡的；不把人冲白
  g.save();
  applyCam(g, base, cam, 1);
  drawGlow(g, b.c[0], b.c[1], 60 + 20 * w, 0.7 * w);
  drawGlow(g, b.c[0], b.c[1], 170 * w, 0.24 * w);
  drawGlow(g, b.c[0], b.c[1] - 30, 420 * w, 0.07 * w);
  // 五⑤ 镜头拉到整座城时：光团在画面上不小于一盏灯（按画面大小再叠一团，越远越明显）
  const far = Math.min(1, Math.max(0, (1 - cam.z) / 0.75));
  if (far > 0) {
    drawGlow(g, b.c[0], b.c[1], 30 / cam.z, 0.55 * w * far);
    drawGlow(g, b.c[0], b.c[1], 95 / cam.z, 0.28 * w * far);
  }
  // 抱住以前砖面再压一层在光上（光从砖的四周漫出来，「沉沉，明天见」照样看得清）；抱住以后砖夹在两个人中间，不压
  if (t < T.hug0 + 0.1) {
    g.globalAlpha = 0.8;
    drawTinted(g, [b.c[0] - 80, b.c[1] - 50, b.c[0] + 80, b.c[1] + 50], (gg) => drawGiveBrick(gg, t), 0.85);
    g.globalAlpha = 1;
  }
  g.restore();
}

// ——— 她发梢化成的光（四⑧那样：一颗颗彩色的光点从发梢冒出来往上飘进白里）：他升上来时还在化，砖亮起来那一下停住、熄掉 ———
const MOTES5 = (() => {
  const r = seeded(854);
  return Array.from({ length: 80 }, (_, i) => ({
    t0: 144.3 + ((T.glow - 144.3) * (i + r() * 0.8)) / 80,
    a: (r() - 0.5) * Math.PI * 1.25,
    vx: (r() - 0.5) * 80,
    vy: -(60 + r() * 120),
    s: 3.2 + r() * 4.6,
    hue: [330, 25, 50, 150, 200, 265][Math.floor(r() * 6)] + (r() - 0.5) * 20,
    ph: r() * 6,
  }));
})();
/** 她头顶在哪（世界坐标） */
function herHead(t: number): V2 {
  const h = diveHer(t);
  const j = jointsOf(h.pose);
  return [h.root[0] + j.head[0], h.root[1] + j.head[1]];
}
/** 画发梢化成的光（世界坐标）：画在白的上面（发梢就在白的边上，画在下面会被白盖掉）；砖亮起来以后不再冒，飘着的很快淡掉，发梢那圈白光收掉 */
export function drawHairLight5(g: CanvasRenderingContext2D, t: number) {
  if (t < T.start) return;
  const off = 1 - E.io(ph(t, T.glow, T.glow + 0.4));
  if (off <= 0) return;
  const head = herHead(t);
  const tip: V2 = [head[0] - 4, head[1] - 60];
  g.save();
  const rg = g.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 120);
  rg.addColorStop(0, `rgba(255,250,240,${0.5 * off})`);
  rg.addColorStop(1, "rgba(255,250,240,0)");
  g.fillStyle = rg;
  g.fillRect(tip[0] - 120, tip[1] - 120, 240, 240);
  for (const m of MOTES5) {
    const a = t - m.t0;
    if (a < 0 || a > 1.3) continue;
    const x = tip[0] + 78 * Math.sin(m.a) + m.vx * a + 10 * Math.sin(a * 3 + m.ph);
    const y = tip[1] - 30 * Math.cos(m.a) + 40 * (1 - Math.cos(m.a)) + m.vy * a;
    g.globalAlpha = Math.min(1, a * 6) * (1 - a / 1.3) ** 1.1 * (0.7 + 0.3 * Math.sin(a * 8 + m.ph)) * off;
    g.fillStyle = `hsl(${m.hue}, 82%, ${70 + 12 * Math.min(1, a)}%)`;
    g.beginPath();
    g.arc(x, y, m.s * (1 - 0.35 * a), 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

// ——— 镜头 ———
/**
 * 五④的镜头：接着五③跟着整条人链往上走（lib/link.ts 的 cam53：砖留在画面上边，跟着他越升越慢）；144.6 起推向两个人
 * （到了跟前推近，倍数按对数插值、位置按看得见的范围走），146.3 落在她、他和砖上（1.45 倍），之后一路很慢地凑近
 * （翻过来看字时砖在画面上约 200 像素宽，字看得清；砖亮起来、抱住时 2.85 倍）；只推不退，叠手持呼吸
 */
export function cam54(t: number): Cam {
  const [bx, by] = breath(t);
  const zc = 1.45 * Math.exp(Math.log(2.85 / 1.45) * E.io(ph(t, 145.7, 148.9)));
  // 砖亮起来她往下一沉、抱住他：镜头跟着往下落一点
  const close = aim(-2250 + bx / zc, -8990 + 70 * E.io(ph(t, T.glow, T.hug1 + 0.1)) + by / zc, 540, 960, zc);
  return camLerp(cam53(t), close, E.io(ph(t, 144.6, 146.3)));
}
