// 《341个字》草稿：整支片的渲染。
// 画面 = 世界（楼的剖面、人物）× 光照图（环境很暗，只有说出口的字发光）+ 发光的字 + 手背上的数字 + 后期。
import type { Scene, SceneOptions } from "@frame/engine/types";
import { assetUrl } from "@frame/engine/types";
import { E, clamp, env, hash, hash2, lerp, prog, type Cam } from "./kit";
import { LINES } from "./lyrics";
import { drawBaby, drawPerson, drawTiny, lookNpc, skeleton, LOOK_BOY, LOOK_GIRL, LOOK_HER, LOOK_HIM, LOOK_MOM, LOOK_OLD, type Pose } from "./people";
import * as S from "./story";
import * as W from "./world";
import { counterBoost, herCounterHand, look, modeAt, paperCam, povCam, showBaby, showHer, showHis, showMom, showOld, worldCam, type Mode } from "./direct";

const DW = 1080;
const DH = 1920;
const FACE = "FilmSerif";
const FONT = `"${FACE}", "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif`;
const FONT_URL = "films/work-3d80f743/fonts/serif.woff2";

type Cv = HTMLCanvasElement;
const mk = (w: number, h: number): Cv => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};
type CamS = Cam & { sx: number; sy: number };

export async function createScene({ width, height }: SceneOptions): Promise<Scene> {
  const out = mk(width, height);
  const ctx = out.getContext("2d")!;
  const bufA = mk(width, height);
  const bufB = mk(width, height);
  const base = mk(width, height);
  const smear = mk(width, height);
  const lw = Math.max(8, Math.ceil(width / 4));
  const lh = Math.max(8, Math.ceil(height / 4));
  const light = mk(lw, lh);
  const sc = width / DW;
  const tex = W.makeWorldTex();
  const sprite = makeSprite(255, 186, 112);
  const spriteHot = makeSprite(255, 222, 170);
  const grain = makeGrain(192);
  let grainPat: CanvasPattern | null = null;

  try {
    const f = new FontFace(FACE, `url(${assetUrl(FONT_URL)})`, { weight: "700" });
    document.fonts.add(await f.load());
  } catch {
    // 字体没加载上就用系统的宋体
  }

  // ---------- 世界 ----------
  function worldMatrix(cam: CamS, w = width, h = height) {
    const k = w / DW;
    return new DOMMatrix()
      .translateSelf(w / 2 + cam.sx * k, h / 2 + cam.sy * k)
      .rotateSelf((cam.r * 180) / Math.PI)
      .scaleSelf(cam.z * k)
      .translateSelf(-cam.x, -cam.y);
  }
  function viewRect(m: DOMMatrix): W.Rect {
    const inv = m.inverse();
    const pts = [inv.transformPoint({ x: 0, y: 0 }), inv.transformPoint({ x: width, y: 0 }), inv.transformPoint({ x: 0, y: height }), inv.transformPoint({ x: width, y: height })];
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const pad = 40;
    return { x0: Math.min(...xs) - pad, y0: Math.min(...ys) - pad, x1: Math.max(...xs) + pad, y1: Math.max(...ys) + pad };
  }

  function renderWorld(dst: Cv, cam: CamS, t: number, era: "now" | "past") {
    const g = base.getContext("2d")!;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    g.shadowBlur = 0;
    g.fillStyle = "#0b0d11";
    g.fillRect(0, 0, width, height);
    const m = worldMatrix(cam);
    g.setTransform(m);
    const view = viewRect(m);
    const ws: W.WorldState = { era, t, z: cam.z, view, tex };
    W.drawSkyAndGround(g, view);
    if (cam.z < 0.6) W.drawCity(g, ws);
    W.drawBuilding(g, ws);
    const { glyphs, sparks } = S.glyphsAt(t);
    drawWallDust(g, t, era);
    drawPeople(g, t, cam.z, view, era);
    if (era === "now") drawProps(g, t);

    // 光照图
    const lg = light.getContext("2d")!;
    const lk = look(t);
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.globalCompositeOperation = "source-over";
    lg.globalAlpha = 1;
    lg.fillStyle = `rgb(${Math.round(lk.amb[0] * 255)},${Math.round(lk.amb[1] * 255)},${Math.round(lk.amb[2] * 255)})`;
    lg.fillRect(0, 0, lw, lh);
    lg.globalCompositeOperation = "lighter";
    lg.setTransform(new DOMMatrix().scaleSelf(lw / width, lh / height).multiplySelf(m));
    for (const L of lightsAt(t, era, glyphs, sparks, cam.z)) {
      lg.globalAlpha = clamp(L.a, 0, 1);
      lg.drawImage(L.hot ? spriteHot : sprite, L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
    }
    lg.globalAlpha = 1;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "multiply";
    g.drawImage(light, 0, 0, width, height);
    g.globalCompositeOperation = "source-over";

    // 发光的东西（叠加）
    g.setTransform(m);
    drawCrackGlow(g, t, era, cam.z);
    drawSparks(g, t, sparks, era);
    for (const gl of glyphs) if (gl.sp === "w") drawWorldGlyph(g, gl, cam.z);
    if (era === "now") drawAsh(g, t);
    // 屏幕上的字和数字
    g.setTransform(sc, 0, 0, sc, 0, 0);
    for (const gl of glyphs) if (gl.sp === "s") drawScreenGlyph(g, gl);
    drawCounters(g, t, m, cam, era);

    // 甩镜的动态模糊
    const prev = worldMatrix(worldCamOrPov(t - 1 / 30, era));
    const c0 = m.inverse().transformPoint({ x: width / 2, y: height / 2 });
    const a1 = m.transformPoint(c0);
    const a0 = prev.transformPoint(c0);
    const dx = a1.x - a0.x;
    const dy = a1.y - a0.y;
    const speed = Math.hypot(dx, dy) / sc;
    if (speed > 28) {
      const sg = smear.getContext("2d")!;
      sg.setTransform(1, 0, 0, 1, 0, 0);
      sg.globalCompositeOperation = "copy";
      sg.drawImage(base, 0, 0);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const n = 5;
      const k = Math.min(1, (speed - 28) / 60);
      for (let i = 1; i <= n; i++) {
        g.globalAlpha = 0.22 * k;
        g.drawImage(smear, (-dx * i) / n, (-dy * i) / n);
      }
      g.globalAlpha = 1;
    }

    post(g, t, lk.vig, era);
    const d = dst.getContext("2d")!;
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.globalCompositeOperation = "copy";
    d.drawImage(base, 0, 0);
    d.globalCompositeOperation = "source-over";
  }
  function worldCamOrPov(t: number, era: "now" | "past"): CamS {
    void era;
    return modeAt(t).a === "pov" ? povCam(t) : worldCam(t);
  }

  // ---------- 人 ----------
  function drawPeople(g: CanvasRenderingContext2D, t: number, z: number, view: W.Rect, era: "now" | "past") {
    if (z < 0.3) return;
    const inView = (c: number, r: number) => {
      const x = W.cellX(c);
      const y = W.cellY(r);
      return !(x > view.x1 || x + W.CELL_W < view.x0 || y > view.y1 || y + W.CELL_H < view.y0);
    };
    for (const n of S.NPCS) {
      if (!inView(n.c, n.r)) continue;
      const p = S.npcPose(n, t);
      if (z < 0.5) drawTiny(g, p, lookNpc(n.k));
      else drawPerson(g, p, lookNpc(n.k), z, t);
    }
    if (inView(W.MOM.c, W.MOM.r)) {
      drawPerson(g, S.momPose(t), LOOK_MOM, z, t);
      const lay = E.smooth(prog(t, 117.3, 117.7));
      drawBaby(g, { x: lerp(836, 772, lay), y: lerp(1642, 1674, lay) }, lerp(-0.85, 0.05, lay));
    }
    if (inView(W.OLD.c, W.OLD.r)) drawPerson(g, S.oldPose(t), LOOK_OLD, z, t);
    if (era === "past") {
      drawPerson(g, S.boyPose(t), LOOK_BOY, z, t);
      drawPerson(g, S.girlPose(t), LOOK_GIRL, z, t);
      return;
    }
    const her = S.herPose(t);
    const him = S.hisPose(t);
    if (t < W.T_COLLAPSE + 0.2) {
      drawPerson(g, him, LOOK_HIM, z, t);
      drawPerson(g, her, LOOK_HER, z, t);
    } else {
      drawPerson(g, her, LOOK_HER, z, t);
      drawPerson(g, him, LOOK_HIM, z, t);
    }
  }

  function drawProps(g: CanvasRenderingContext2D, t: number) {
    const her = S.herPose(t);
    const him = S.hisPose(t);
    const k = S.knife(t, him);
    if (k.show) {
      g.save();
      g.translate(k.at.x, k.at.y);
      g.rotate(k.angle);
      g.fillStyle = "#2a2c31";
      g.fillRect(-3, -1.3, 8, 2.6);
      g.fillStyle = "#9aa0a9";
      g.beginPath();
      g.moveTo(5, -1);
      g.lineTo(12.5, -0.2);
      g.lineTo(5, 1);
      g.closePath();
      g.fill();
      g.restore();
    }
    const p = S.paper(t, her);
    if (p.show) drawWorldPaper(g, p.at.x, p.at.y, p.angle);
  }

  /** 世界里的那张纸：小字是潦草的线，右下角圈着「341」 */
  function drawWorldPaper(g: CanvasRenderingContext2D, x: number, y: number, a: number) {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.fillStyle = "#b9b3a6";
    g.fillRect(-8, -11, 16, 22);
    g.strokeStyle = "rgba(40,36,32,0.75)";
    g.lineWidth = 0.35;
    for (let i = 0; i < 9; i++) {
      const yy = -9 + i * 1.9;
      const w = 9 + hash(i * 3.3) * 4;
      g.beginPath();
      g.moveTo(-6.5, yy);
      for (let s = 0; s <= 8; s++) g.lineTo(-6.5 + (s / 8) * w, yy + Math.sin(s * 2.1 + i) * 0.25);
      g.stroke();
      if (i === 2 || i === 5) {
        g.beginPath();
        g.moveTo(-6.8, yy);
        g.lineTo(-6.5 + w, yy - 0.2);
        g.stroke();
      }
    }
    g.fillStyle = "#2b2622";
    g.font = `700 2.6px ${FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("341", 3.5, 8.4);
    g.lineWidth = 0.3;
    g.beginPath();
    g.ellipse(3.5, 8.4, 3.2, 2.1, -0.1, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }

  /** 墙面上的灰：他哼歌时轻轻震动 */
  function drawWallDust(g: CanvasRenderingContext2D, t: number, era: "now" | "past") {
    if (era !== "now" || t > W.T_COLLAPSE) return;
    const hum = S.hisPose(t).hum;
    g.fillStyle = "rgba(150,156,166,0.75)";
    for (let i = 0; i < 26; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const bx = (side < 0 ? W.WALL_L - 1.2 : W.WALL_R + 1.2) + side * hash(i * 1.7) * 2.5;
      const by = 1752 + hash(i * 4.1) * 50;
      const j = hum * 0.55;
      const x = bx + Math.sin(t * 71 + i * 3) * j;
      const y = by + Math.cos(t * 63 + i * 5) * j;
      g.fillRect(x, y, 0.55 + hash(i) * 0.4, 0.55 + hash(i) * 0.4);
    }
  }

  /** 静音时她的指尖化成灰 */
  function drawAsh(g: CanvasRenderingContext2D, t: number) {
    const a = S.ashAmount(t);
    if (a <= 0.01) return;
    const k = skeleton(S.herPose(t));
    g.save();
    for (const h of [k.hn, k.hf]) {
      g.fillStyle = `rgba(120,124,130,${(0.75 * a).toFixed(3)})`;
      g.beginPath();
      g.arc(h.x, h.y, 4.8, 0, Math.PI * 2);
      g.fill();
      for (let i = 0; i < 14; i++) {
        const life = (t * 0.6 + hash(i * 2.3)) % 1;
        g.fillStyle = `rgba(140,144,150,${(a * (1 - life) * 0.8).toFixed(3)})`;
        g.fillRect(h.x + (hash(i) - 0.5) * 8 + life * 3, h.y - life * 16, 0.9, 0.9);
      }
    }
    g.restore();
  }

  // ---------- 光 ----------
  interface Light {
    x: number;
    y: number;
    r: number;
    a: number;
    hot?: boolean;
  }
  function lightsAt(t: number, era: "now" | "past", glyphs: S.Glyph[], sparks: S.Spark[], z: number): Light[] {
    const L: Light[] = [];
    for (const gl of glyphs) if (gl.sp === "w" && gl.light > 0.01) L.push({ x: gl.x, y: gl.y, r: gl.size * 9, a: gl.light * 0.55 });
    for (const s of sparks) L.push({ x: s.x, y: s.y, r: 60, a: s.a * 0.35 });
    if (era === "past") {
      const scream = env(t, 88.3, 88.5, 90.2, 90.8);
      L.push({ x: 850, y: 1768, r: 150, a: 0.55 * scream });
      return L;
    }
    const sing = S.singing(t) * (1 - 0.6 * S.weakness(t));
    if (t > 15.85 && t < 112) {
      // 她的格子被她的字照亮
      L.push({ x: 872, y: 1765, r: 160, a: 0.18 + 0.42 * sing });
      // 光从墙缝漏到他那边（被他捂住时只在指缝里）
      const blocked = t >= 27.95 && t < 39.39;
      const hole = S.holeLight(t);
      if (!blocked) L.push({ x: 960 + 30 * hole, y: 1768, r: 105 + 90 * hole, a: (0.1 + 0.4 * sing) * (t < 39.39 ? 0.7 : 1) + 0.3 * hole });
      else L.push({ x: 934, y: 1770, r: 22, a: 0.5 * sing });
      // 楼上楼下的缝里也漏进去一点（他们被吵醒）
      if (t > 43.9) {
        const leak = 0.08 + 0.22 * sing;
        L.push({ x: 810, y: 1676, r: 95, a: leak });
        L.push({ x: 1040, y: 1836, r: 95, a: leak });
      }
    }
    if (t > 39.39 && t < 39.9) L.push({ x: 960, y: 1768, r: 150, a: 0.8 * (1 - prog(t, 39.39, 39.9)), hot: true });
    // 她醒过来以后，身上的光跟着数字一起变亮
    if (t > 114.5) {
      const c = S.herCount(t);
      L.push({ x: 948, y: 1792, r: 120 + 120 * Math.min(1, c / 400), a: 0.15 + 0.5 * Math.min(1, c / 300) });
    }
    // 整栋楼一格一格亮起来
    if (t > 117.8) {
      for (const n of S.NPCS) {
        const lit = S.cellLit(n, t);
        if (lit <= 0.01) continue;
        const c = W.cellCenter(n.c, n.r);
        L.push({ x: c.x, y: c.y, r: 150, a: lit * 0.55 });
      }
      const mom = env(t, 117.9, 118.2, 122, 126);
      L.push({ x: 830, y: 1630, r: 140, a: 0.5 * mom });
      const old = env(t, 118.25, 118.6, 122, 126);
      L.push({ x: 1040, y: 1900, r: 140, a: 0.5 * old });
    }
    // 整座城
    if (t > 125.9 && z < 0.7) {
      for (const b of W.CITY) {
        const p = E.out(2)(prog(t, b.lightT, b.lightT + 2.4));
        if (p <= 0) continue;
        const h = W.GROUND - b.top;
        const cx = (b.x0 + b.x1) / 2;
        L.push({ x: cx, y: b.lightY, r: h * 0.65 * p + 300, a: 0.55 * p });
        L.push({ x: cx + (hash(b.x0) - 0.5) * (b.x1 - b.x0) * 0.6, y: b.top + h * 0.2, r: h * 0.35 * p + 200, a: 0.4 * p });
      }
      const tw = prog(t, 126.4, 127.6);
      if (tw > 0) for (let k = 0; k < 8; k++) L.push({ x: W.trainX(t) + k * 560 + 270, y: W.RAIL_Y - 90, r: 380, a: 0.5 * tw });
      // 我们这栋楼整体亮着
      L.push({ x: W.B_W / 2, y: W.B_H / 2, r: 2600, a: 0.35 * prog(t, 125.9, 127.5) });
    }
    // 结尾：两人身边暖暖的光
    if (t > 131.5) L.push({ x: 952, y: 1780, r: 230, a: 0.6 * prog(t, 131.5, 135) });
    return L;
  }

  /** 墙缝里透过来的光（叠加画） */
  function drawCrackGlow(g: CanvasRenderingContext2D, t: number, era: "now" | "past", z: number) {
    if (era !== "now" || t > W.T_COLLAPSE + 0.3 || t < 15.85) return;
    const sing = S.singing(t) * (1 - 0.5 * S.weakness(t));
    const burst = env(t, 39.39, 39.45, 39.6, 40.2);
    const blocked = t >= 27.95 && t < 39.39;
    const glow = clamp((0.15 + 0.85 * sing) * (blocked ? 0.55 : 1) + burst);
    if (glow < 0.02) return;
    g.save();
    g.globalCompositeOperation = "lighter";
    g.shadowColor = "rgba(255,160,70,1)";
    g.shadowBlur = 8 * sc * Math.min(3, z / 6);
    g.strokeStyle = `rgba(255,205,140,${(0.85 * glow).toFixed(3)})`;
    g.lineWidth = 0.9 + 1.4 * burst;
    g.beginPath();
    for (let y = W.CRACK_TOP; y <= W.CRACK_BOT; y += 2.3) {
      const x = W.WALL_X + (hash(Math.floor(y / 2.3) + 3) - 0.5) * 2.2;
      if (y === W.CRACK_TOP) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    const hr = W.holeRadius(t);
    if (hr > 0) {
      g.fillStyle = `rgba(255,200,130,${(0.35 + 0.45 * sing).toFixed(3)})`;
      g.fillRect(W.WALL_L, W.HOLE_Y - hr, W.WALL, hr * 2);
    }
    g.restore();
  }

  function drawSparks(g: CanvasRenderingContext2D, t: number, sparks: S.Spark[], era: "now" | "past") {
    g.save();
    g.globalCompositeOperation = "lighter";
    for (const s of sparks) {
      g.globalAlpha = clamp(s.a);
      g.drawImage(spriteHot, s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
    }
    // 结尾：光像雪一样落下来
    if (era === "now" && t > 129.5) {
      const k0 = prog(t, 129.5, 133);
      for (let i = 0; i < 70; i++) {
        const life = (t * (0.05 + hash(i * 1.3) * 0.05) + hash(i * 2.7)) % 1;
        const x = 840 + hash(i * 5.1) * 240 + Math.sin(t * 0.7 + i) * 8;
        const y = 1640 + life * 190;
        g.globalAlpha = k0 * Math.sin(Math.PI * life) * 0.7;
        const r = 2.2 + hash(i) * 2.5;
        g.drawImage(spriteHot, x - r, y - r, r * 2, r * 2);
      }
    }
    g.restore();
  }

  // ---------- 字 ----------
  function drawWorldGlyph(g: CanvasRenderingContext2D, gl: S.Glyph, z: number) {
    const px = gl.size * z * sc;
    if (px < 2.5 || gl.alpha < 0.01) return;
    g.save();
    g.translate(gl.x, gl.y);
    g.scale(1 / (z * sc), 1 / (z * sc));
    paintGlyph(g, gl.ch, px, gl.alpha, gl.kind);
    g.restore();
  }
  function drawScreenGlyph(g: CanvasRenderingContext2D, gl: S.Glyph) {
    if (gl.alpha < 0.01) return;
    g.save();
    g.translate(gl.x, gl.y);
    paintGlyph(g, gl.ch, gl.size, gl.alpha, gl.kind);
    g.restore();
  }
  /** 在当前坐标原点画一个字，px 是当前坐标下的字号 */
  function paintGlyph(g: CanvasRenderingContext2D, ch: string, px: number, alpha: number, kind: "warm" | "ghost") {
    g.font = `700 ${px.toFixed(1)}px ${FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.globalAlpha = clamp(alpha);
    if (kind === "ghost") {
      g.strokeStyle = "rgba(168,176,188,0.95)";
      g.lineWidth = Math.max(1, px * 0.045);
      g.strokeText(ch, 0, 0);
      return;
    }
    g.shadowColor = "rgba(255,140,50,0.95)";
    g.shadowBlur = px * 0.6 * (g.getTransform().a || 1);
    g.fillStyle = "#ffcf8f";
    g.fillText(ch, 0, 0);
    g.shadowBlur = px * 0.16 * (g.getTransform().a || 1);
    g.shadowColor = "rgba(255,200,120,0.9)";
    g.fillStyle = "#fff3dc";
    g.fillText(ch, 0, 0);
    g.shadowBlur = 0;
  }

  // ---------- 手背上的数字 ----------
  function drawCounters(g: CanvasRenderingContext2D, t: number, m: DOMMatrix, cam: CamS, era: "now" | "past") {
    if (cam.z < 2.6) return;
    const size0 = clamp(4.4 * cam.z, 26, 58) * counterBoost(t);
    const label = (n: number, wx: number, wy: number, size: number, flash: number, arrow = 0) => {
      const p = m.transformPoint({ x: wx, y: wy });
      const x = p.x / sc;
      const y = p.y / sc;
      if (x < -60 || x > DW + 60 || y < -60 || y > DH + 60) return;
      const s = size * (1 + 0.28 * flash);
      g.save();
      g.font = `700 ${s.toFixed(1)}px ${FONT}`;
      g.textAlign = "center";
      g.textBaseline = "alphabetic";
      const txt = `余 ${n}`;
      const half = g.measureText(txt).width / 2;
      const edge = clamp((Math.min(x - half, DW - x - half) + 24) / 36);
      if (edge <= 0) {
        g.restore();
        return;
      }
      g.globalAlpha = edge;
      g.lineJoin = "round";
      g.lineWidth = s * 0.18;
      g.strokeStyle = "rgba(8,9,12,0.85)";
      g.strokeText(txt, x, y);
      g.fillStyle = flash > 0.05 ? `rgb(${Math.round(lerp(214, 255, flash))},${Math.round(lerp(221, 236, flash))},${Math.round(lerp(230, 205, flash))})` : "#d6dde6";
      g.fillText(txt, x, y);
      if (arrow) {
        // 一跌一涨的小三角：▼ 她在掉，▲ 他在涨
        const w = g.measureText(txt).width;
        const ax = x + w / 2 + s * 0.45;
        const ay = y - s * 0.38;
        const hw = s * 0.22;
        const hh = s * 0.2 * (arrow < 0 ? 1 : -1);
        g.fillStyle = arrow < 0 ? "#9fb0c4" : "#ffd59a";
        g.beginPath();
        g.moveTo(ax - hw, ay - hh);
        g.lineTo(ax + hw, ay - hh);
        g.lineTo(ax, ay + hh);
        g.closePath();
        g.fill();
      }
      g.restore();
    };
    if (era === "past") {
      if (t > 88.6 && t < 91.0) {
        const k = skeleton(S.girlPose(t));
        label(S.girlCount(t), k.hn.x, k.hn.y - 7, size0 * 0.9, t < 90.4 ? 0.6 : 0);
      }
      return;
    }
    const mirror = t >= 97.9 && t < 99.95;
    if (showHer(t)) {
      const k = skeleton(S.herPose(t));
      const h = herCounterHand(t) === "f" ? k.hf : k.hn;
      const flash = Math.exp(-Math.max(0, t - S.herCountChanged(t)) * 9);
      if (mirror) label(S.herCount(t), 899, 1784, size0, flash, -1);
      else if (t >= 146) label(S.herCount(t), h.x - 15, h.y + 20, size0, flash);
      else label(S.herCount(t), h.x, h.y - 7, t > 111.3 && t < 113.88 ? size0 * 1.1 : size0, flash);
    }
    if (showHis(t)) {
      const k = skeleton(S.hisPose(t));
      const h = t < 4.2 ? k.hf : t >= 97.9 && t < 99.95 ? k.hf : k.hn;
      const flash = t < 113 ? Math.exp(-Math.max(0, t - S.herCountChanged(t)) * 9) : 0;
      if (mirror) label(S.hisCount(t), 917, 1757, size0, flash, 1);
      else if (t >= 146) label(S.hisCount(t), h.x + 16, h.y - 14, size0, flash);
      else if (t > 113) label(S.hisCount(t), h.x + 22, h.y - 26, size0, flash);
      else label(S.hisCount(t), h.x, h.y - 7, size0, flash);
    }
    if (showMom(t)) {
      const k = skeleton(S.momPose(t));
      label(S.momCount(t), k.hn.x, k.hn.y - 8, size0 * 0.9, 0);
    }
    if (showOld(t)) {
      const k = skeleton(S.oldPose(t));
      label(S.oldCount(t), k.hn.x, k.hn.y - 8, size0 * 0.9, 0);
    }
    if (showBaby(t)) {
      const fl = Math.max(...S.NAME_LAND.map((l) => (t >= l ? Math.exp(-(t - l) * 6) : 0)));
      label(S.babyCount(t), 846, 1650, size0 * 0.78, fl);
    }
  }

  // ---------- 后期 ----------
  let vigGrad: { v: number; g: CanvasGradient } | null = null;
  function post(g: CanvasRenderingContext2D, t: number, vig: number, era: "now" | "past" | "paper") {
    g.setTransform(sc, 0, 0, sc, 0, 0);
    if (era === "past" || era === "paper") {
      g.globalCompositeOperation = "color";
      g.fillStyle = "rgba(120,92,64,0.55)";
      g.fillRect(0, 0, DW, DH);
      g.globalCompositeOperation = "source-over";
      vig = Math.min(0.9, vig + 0.22);
    }
    if (!vigGrad || Math.abs(vigGrad.v - vig) > 0.004) {
      const gr = g.createRadialGradient(DW / 2, DH / 2, DH * 0.22, DW / 2, DH / 2, DH * 0.62);
      gr.addColorStop(0, "rgba(0,0,0,0)");
      gr.addColorStop(1, `rgba(0,0,0,${vig.toFixed(3)})`);
      vigGrad = { v: vig, g: gr };
    }
    g.fillStyle = vigGrad.g;
    g.fillRect(0, 0, DW, DH);
    // 颗粒
    if (!grainPat) grainPat = g.createPattern(grain, "repeat");
    if (grainPat) {
      const f = Math.floor(t * 24);
      grainPat.setTransform(new DOMMatrix().translateSelf(hash(f) * 192, hash(f + 7) * 192).scaleSelf(1.6));
      g.globalCompositeOperation = "overlay";
      g.globalAlpha = 0.16;
      g.fillStyle = grainPat;
      g.fillRect(0, 0, DW, DH);
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";
    }
  }

  // ---------- 回忆：写歌的那张纸 ----------
  const PAPER_LINES: { text: string; t: number; struck?: number; n?: number; dim?: boolean }[] = [
    { text: "反乌托邦中的争夺", t: 32.35, n: 8 },
    { text: "把梦想都敲成碎末", t: 34.0, struck: 34.25 },
    { text: "把愿望敲碎成粉末", t: 34.12, n: 8 },
    { text: "心灵也被挂上门锁", t: 34.24, n: 8 },
    { text: "看不清灯火", t: 34.36, n: 5 },
    { text: "但我还想做些什么", t: 34.48, n: 8 },
    { text: "其实想说的有很多", t: 34.6, struck: 34.85 },
    { text: "其实还想要说很多", t: 34.72, n: 8 },
    { text: "请你等等我", t: 34.84, n: 5 },
    { text: "请你等等我", t: 34.96, n: 5 },
    { text: "两块五的签字笔", t: 35.08, n: 7 },
    { text: "……", t: 35.2 },
    { text: "但若你又找不到意义", t: 35.32, n: 9 },
    { text: "希望这首歌能被记起", t: 35.44, n: 9 },
  ];
  const PAPER_TAIL = ["活下去 活下去", "活下去 活下去", "在这反乌托邦里"];
  function renderPaper(dst: Cv, t: number) {
    const g = base.getContext("2d")!;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    g.fillStyle = "#15171b";
    g.fillRect(0, 0, width, height);
    const pc = paperCam(t);
    g.setTransform(sc * pc.z, 0, 0, sc * pc.z, sc * (540 - pc.x * pc.z), sc * (960 - pc.y * pc.z));
    // 地板和她的膝盖（虚影）
    g.fillStyle = "#24272c";
    g.fillRect(-400, 1400, 1900, 900);
    // 纸
    g.save();
    g.translate(540, 900);
    g.rotate(-0.02);
    g.fillStyle = "#9a9486";
    g.fillRect(-390, -540, 780, 1080);
    g.strokeStyle = "rgba(60,58,54,0.25)";
    g.lineWidth = 1.5;
    for (let i = 0; i < 17; i++) {
      g.beginPath();
      g.moveTo(-360, -470 + i * 62 + 20);
      g.lineTo(360, -470 + i * 62 + 20);
      g.stroke();
    }
    g.restore();
    // 歌词：一行一行写上去，有的划掉重写，行末写着这一行几个字
    g.textBaseline = "alphabetic";
    let pen = { x: 0, y: 0, on: false };
    PAPER_LINES.forEach((ln, i) => {
      const y = 470 + i * 62;
      const chars = [...ln.text];
      const dur = i === 0 ? 1.4 : 0.1;
      const shown = Math.floor(chars.length * prog(t, ln.t, ln.t + dur) + (t >= ln.t ? 0.999 : 0));
      if (shown <= 0) return;
      g.font = `700 38px ${FONT}`;
      g.textAlign = "left";
      g.fillStyle = "#2a2622";
      const txt = chars.slice(0, Math.min(shown, chars.length)).join("");
      g.fillText(txt, 200, y);
      const w = g.measureText(txt).width;
      if (i === 0 && t < ln.t + dur + 0.1) pen = { x: 200 + w, y: y - 10, on: true };
      if (ln.struck && t > ln.struck) {
        g.strokeStyle = "#2a2622";
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(195, y - 13);
        g.lineTo(195 + w * prog(t, ln.struck, ln.struck + 0.12) + 6, y - 15);
        g.stroke();
      }
      if (ln.n && t > ln.t + dur + 0.08) {
        g.font = `700 30px ${FONT}`;
        g.textAlign = "right";
        g.fillStyle = "#4a443d";
        g.fillText(String(ln.n), 860, y);
      }
    });
    // 341：画一条线，写下总数，圈起来
    if (t > 35.6) {
      g.strokeStyle = "#2a2622";
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(200, 1322);
      g.lineTo(200 + 660 * prog(t, 35.6, 35.9), 1322);
      g.stroke();
    }
    if (t > 35.95) {
      const s = "341";
      const k = Math.ceil(3 * prog(t, 35.95, 36.4));
      g.font = `700 46px ${FONT}`;
      g.textAlign = "center";
      g.fillStyle = "#231f1b";
      g.fillText(s.slice(0, k), 760, 1394);
      if (t < 36.45) pen = { x: 740 + k * 22, y: 1380, on: true };
      const c = prog(t, 36.5, 36.85);
      if (c > 0) {
        g.lineWidth = 3;
        g.beginPath();
        g.ellipse(760, 1378, 62, 40, -0.08, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * c);
        g.stroke();
        if (c < 1) pen = { x: 760 + Math.cos(-Math.PI / 2 + Math.PI * 2 * c) * 62, y: 1378 + Math.sin(-Math.PI / 2 + Math.PI * 2 * c) * 40, on: true };
      }
    }
    // 线下面还写着她唱不到的最后几句（字比较淡）
    if (t > 35.5) {
      g.font = `700 34px ${FONT}`;
      g.textAlign = "left";
      g.fillStyle = "rgba(42,38,34,0.45)";
      PAPER_TAIL.forEach((s, i) => g.fillText(s, 200, 1452 + i * 56));
    }
    // 熬了好多个夜晚：光一明一暗
    const nights = t > 33.96 && t < 35.91 ? 0.5 - 0.5 * Math.cos(((t - 33.96) / 0.49) * Math.PI * 2) : 0;
    // 签字笔和握笔的手
    if (pen.on) drawPen(g, pen.x, pen.y, t);
    // 另一只手：掰着手指数字数（S11），翻过来是「余 341」（S12）
    if (t > 34.1 && t < 35.85) drawCountingHand(g, 940, 860, t);
    if (t > 36.85) drawTurningHand(g, 690, 1560, t);
    if (nights > 0) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = `rgba(0,0,0,${(0.35 * nights).toFixed(3)})`;
      g.fillRect(0, 0, width, height);
    }
    post(g, t, 0.55, "paper");
    const d = dst.getContext("2d")!;
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.globalCompositeOperation = "copy";
    d.drawImage(base, 0, 0);
    d.globalCompositeOperation = "source-over";
  }
  function drawPen(g: CanvasRenderingContext2D, x: number, y: number, t: number) {
    const a = 0.95 + Math.sin(t * 30) * 0.02;
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.fillStyle = "#3b4049";
    g.fillRect(4, -9, 250, 18);
    g.fillStyle = "#c4c0b6";
    g.fillRect(150, -10, 60, 20);
    g.fillStyle = "#2a2622";
    g.font = `700 16px ${FONT}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("¥2.5", 180, 1);
    g.fillStyle = "#1c1d21";
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(10, -6);
    g.lineTo(10, 6);
    g.closePath();
    g.fill();
    // 握笔的手
    g.fillStyle = "#a9adb4";
    g.beginPath();
    g.ellipse(70, 22, 58, 40, 0.2, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  function drawCountingHand(g: CanvasRenderingContext2D, x: number, y: number, t: number) {
    g.save();
    g.translate(x, y);
    g.fillStyle = "#a9adb4";
    g.beginPath();
    g.ellipse(0, 40, 62, 70, 0, 0, Math.PI * 2);
    g.fill();
    const k = ((t - 34.1) / 0.16) % 6;
    for (let i = 0; i < 5; i++) {
      const folded = k > i + 1;
      g.save();
      g.translate(-44 + i * 22, -14);
      g.rotate(-0.12 + i * 0.06);
      g.fillStyle = "#b3b7be";
      g.beginPath();
      g.roundRect(-9, folded ? -10 : -62, 18, folded ? 22 : 70, 9);
      g.fill();
      g.restore();
    }
    g.restore();
  }
  function drawTurningHand(g: CanvasRenderingContext2D, x: number, y: number, t: number) {
    const flip = E.inOut(prog(t, 36.95, 37.25));
    const sx = Math.abs(Math.cos(flip * Math.PI)) * 0.85 + 0.15;
    g.save();
    g.translate(x, y);
    g.scale(sx, 1);
    g.fillStyle = flip > 0.5 ? "#a3a7ae" : "#b8bcc3";
    g.beginPath();
    g.ellipse(0, 0, 110, 80, 0, 0, Math.PI * 2);
    g.fill();
    if (flip > 0.5) {
      g.font = `700 54px ${FONT}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.lineWidth = 9;
      g.strokeStyle = "rgba(8,9,12,0.85)";
      g.strokeText("余 341", 0, 0);
      g.fillStyle = "#d6dde6";
      g.fillText("余 341", 0, 0);
    }
    g.restore();
  }

  // ---------- 墙缝里看过去 ----------
  function renderPov(dst: Cv, t: number) {
    renderWorld(dst, povCam(t), t, "now");
    const g = dst.getContext("2d")!;
    g.setTransform(sc, 0, 0, sc, 0, 0);
    g.globalCompositeOperation = "source-over";
    const slit: [number, number][] = [];
    const top = 230;
    const bot = 1700;
    // 缝要宽到放得下「余 161」
    for (let y = top; y <= bot; y += 34) slit.push([540 - 112 - 18 * Math.sin(y * 0.006) - (hash(y) - 0.5) * 16, y]);
    for (let y = bot; y >= top; y -= 34) slit.push([540 + 112 + 16 * Math.sin(y * 0.007 + 1) + (hash(y + 3) - 0.5) * 16, y]);
    g.beginPath();
    g.rect(0, 0, DW, DH);
    g.moveTo(slit[0][0], slit[0][1]);
    for (const [x, y] of slit) g.lineTo(x, y);
    g.closePath();
    g.fillStyle = "#17191d";
    g.fill("evenodd");
    // 缝的边缘被那边的光照亮
    g.save();
    g.globalCompositeOperation = "lighter";
    g.shadowColor = "rgba(255,150,60,0.9)";
    g.shadowBlur = 24 * sc;
    g.strokeStyle = "rgba(255,190,120,0.55)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(slit[0][0], slit[0][1]);
    for (const [x, y] of slit) g.lineTo(x, y);
    g.closePath();
    g.stroke();
    g.restore();
  }

  // ---------- 叠在最终画面上的文字 ----------
  function overlays(g: CanvasRenderingContext2D, t: number) {
    g.setTransform(sc, 0, 0, sc, 0, 0);
    g.globalCompositeOperation = "source-over";
    // 开场钩子字（首帧完整出现）
    const hook = 1 - prog(t, 3.4, 4.1);
    if (hook > 0) {
      g.save();
      g.globalAlpha = hook;
      g.textAlign = "center";
      g.textBaseline = "alphabetic";
      g.font = `700 60px ${FONT}`;
      g.shadowColor = "rgba(0,0,0,0.9)";
      g.shadowBlur = 18 * sc;
      g.fillStyle = "#e4e9f0";
      g.fillText("这里的人，一生只能说一千个字。", 540, 300);
      g.fillText("说完，就会死。", 540, 388);
      g.restore();
    }
    // 整栋楼、整座城一起喊的「活下去」
    for (const li of [45, 46]) {
      const line = LINES[li];
      const end = li === 45 ? 125.75 : 129.75;
      const size = li === 45 ? 150 : 172;
      line.chars.forEach((ch, j) => {
        const a = prog(t, ch.t - 0.02, ch.t + 0.18) * (1 - prog(t, end - 0.35, end));
        if (a <= 0) return;
        const pop = 1 + 0.25 * (1 - E.out(3)(prog(t, ch.t - 0.02, ch.t + 0.25)));
        drawScreenGlyph(g, { ch: ch.c, x: 540 + (j - 1) * size * 1.08, y: li === 45 ? 900 : 860, size: size * pop, alpha: a, sp: "s", kind: "warm", light: 0 });
      });
    }
    // 夜空里像灯一样飘起来的字，和最后一句
    if (t > 129.4 && t < 133.4) {
      const k = prog(t, 129.4, 130.2) * (1 - prog(t, 132.4, 133.4));
      const pool = "活下去说给你听我在别怕";
      for (let i = 0; i < 64; i++) {
        const sp = 90 + hash(i * 3.1) * 170;
        const y = 1900 + hash(i * 7.3) * 600 - (t - 129.4) * sp;
        const x = 60 + hash(i * 1.7) * 960 + Math.sin(t + i) * 10;
        const size = 26 + hash(i * 9.9) * 44;
        drawScreenGlyph(g, { ch: pool[i % pool.length], x, y, size, alpha: k * (0.35 + 0.5 * hash(i)), sp: "s", kind: "warm", light: 0 });
      }
      const last = LINES[47];
      last.chars.forEach((ch, j) => {
        const a = prog(t, ch.t - 0.02, ch.t + 0.2) * (1 - prog(t, 132.3, 133.2));
        if (a > 0) drawScreenGlyph(g, { ch: ch.c, x: 540 + (j - 3) * 92, y: 760, size: 86, alpha: a, sp: "s", kind: "warm", light: 0 });
      });
    }
    // 结尾两个引导：点赞（模拟双击）和评论问题
    if (t > 149.3) {
      const h1 = prog(t, 149.35, 149.6);
      const pop = E.back(1.8)(h1);
      g.save();
      for (const tt of [149.35, 149.52]) {
        const r = prog(t, tt, tt + 0.6);
        if (r > 0 && r < 1) {
          g.strokeStyle = `rgba(255,214,160,${(0.8 * (1 - r)).toFixed(3)})`;
          g.lineWidth = 4;
          g.beginPath();
          g.arc(540, 700, 40 + r * 120, 0, Math.PI * 2);
          g.stroke();
        }
      }
      if (h1 > 0) drawHeart(g, 540, 700, 70 * pop);
      const a1 = prog(t, 149.55, 149.95);
      g.globalAlpha = a1;
      g.textAlign = "center";
      g.font = `700 46px ${FONT}`;
      g.shadowColor = "rgba(0,0,0,0.9)";
      g.shadowBlur = 14 * sc;
      g.fillStyle = "#f3ede4";
      g.fillText("点赞的人，总有人愿意把字说给你听", 540, 860);
      const a2 = prog(t, 149.85, 150.25);
      g.globalAlpha = a2;
      g.font = `700 54px ${FONT}`;
      g.fillStyle = "#ffe2b6";
      g.fillText("如果只剩 3 个字，你会说给谁？", 540, 1400);
      g.font = `700 40px ${FONT}`;
      g.fillStyle = "#e4e9f0";
      g.fillText("答案打在评论区", 540, 1478);
      g.strokeStyle = "#e4e9f0";
      g.lineWidth = 5;
      g.lineCap = "round";
      const by = 1520 + 8 * Math.sin(t * 6);
      g.beginPath();
      g.moveTo(540, by);
      g.lineTo(540, by + 60);
      g.moveTo(518, by + 38);
      g.lineTo(540, by + 60);
      g.lineTo(562, by + 38);
      g.stroke();
      g.restore();
    }
  }
  function drawHeart(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
    g.save();
    g.translate(x, y);
    g.scale(s / 50, s / 50);
    g.shadowColor = "rgba(255,120,60,0.9)";
    g.shadowBlur = 30 * sc;
    g.fillStyle = "#ff8a5c";
    g.beginPath();
    g.moveTo(0, 18);
    g.bezierCurveTo(-50, -14, -26, -52, 0, -26);
    g.bezierCurveTo(26, -52, 50, -14, 0, 18);
    g.fill();
    g.restore();
  }

  // ---------- 一帧 ----------
  function renderMode(dst: Cv, mode: Mode, t: number) {
    if (mode === "paper") renderPaper(dst, t);
    else if (mode === "pov") renderPov(dst, t);
    else renderWorld(dst, worldCam(t), t, mode === "past" ? "past" : "now");
  }

  return {
    canvas: out,
    render(time: number) {
      const t = Math.max(0, Math.min(152, time));
      const mm = modeAt(t);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      if (mm.b && mm.p > 0) {
        renderMode(bufA, mm.a, t);
        renderMode(bufB, mm.b, t);
        ctx.drawImage(bufA, 0, 0);
        ctx.globalAlpha = mm.p;
        ctx.drawImage(bufB, 0, 0);
        ctx.globalAlpha = 1;
      } else {
        renderMode(bufA, mm.a, t);
        ctx.drawImage(bufA, 0, 0);
      }
      overlays(ctx, t);
    },
    dispose() {
      for (const c of [out, bufA, bufB, base, smear, light, sprite, spriteHot, grain]) c.width = c.height = 1;
    },
  };
}

function makeSprite(r: number, g: number, b: number): Cv {
  const c = mk(128, 128);
  const x = c.getContext("2d")!;
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
  gr.addColorStop(0.25, `rgba(${r},${g},${b},0.55)`);
  gr.addColorStop(0.6, `rgba(${r},${g},${b},0.16)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr;
  x.fillRect(0, 0, 128, 128);
  return c;
}
function makeGrain(n: number): Cv {
  const c = mk(n, n);
  const x = c.getContext("2d")!;
  const img = x.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const v = Math.floor(hash2(i % n, Math.floor(i / n)) * 255);
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}
export type { Pose };
