/**
 * 生日书桌镜头 birthdayDesk（《i have no friends》第一幕冷开场和第四幕故事绕回来时同一个构图）：烛光是主光，照亮他的脸和书桌、
 * 在墙上投出比他大的颤动的影子，身后的月光勾出头发和肩膀的轮廓并投下有浮尘的光柱。layer 把火苗和其余分开画（其余走 grade，火苗保持彩色）。
 */
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { Ctx, H, Pt, W, beginFrame, blit, buffer, castShadow, devScale, figureMask, filtered, flicker, glow, lightShaft, loadFonts, motes, onFigure, rimLight, vgrad } from "./draw";
import { KidPose, drawKid } from "./kid";
import { lockScreen, phone } from "./phone";
import { bedroom, cupcake, desk, fairyGlow, partyHorn } from "./sets";

export interface DeskShot {
  lit: number; // candle 0..1
  smoke?: number;
  kid?: KidPose;
  phoneTime?: string;
  phoneOn?: number; // screen brightness 0..1
  dark?: number; // darkness strength around the light
  /** "scene" = everything except the candle's flame and warm light; "flame" = only those. Draw the scene through
   *  grade() (his grey world) and the flame on top in colour — the candle is the only warm thing in his room. */
  layer?: "all" | "scene" | "flame";
  /** 0..1 the clue outside the window: phone lights and a pink banner down on the street (they're already there) */
  clue?: number;
  /** depth of field: blur the room behind him (design px) */
  bgBlur?: number;
  /** a party horn in his lips: u 0 = rolled up … 1 = blown out, droop 0..1 */
  horn?: { u: number; droop: number };
  /** another warm light for a moment (the match flaring at the wick): where it is and how strong; while it is
   *  stronger than the candle it is the key light — his face, his shadow on the wall, the dark round it */
  light?: { at: Pt; k: number };
}

/** The candle flame (design units, before the camera). */
export const FLAME: Pt = [390, 944];
const WIN = { x: 640, y: 300, w: 330, h: 400 }; // the window (bedroom())
const DESK_Y = 1080;

/** The birthday desk: same framing in the cold open (act 1) and when the story loops back (act 4).
 *  光影 (用户：光影和美感是留存的关键，特别是开头): the candle is the key light — it lights his face and the
 *  desk warm and falls off into a cold dark room; it throws his shadow, bigger than him, up the wall behind him and it
 *  trembles with the flame; the moon behind him rims his hair and shoulder in cold light and drops a soft shaft
 *  across the room with dust turning in it; the shadows go blue, the light stays warm. */
export function birthdayDesk(ctx: Ctx, abs: number, o: DeskShot) {
  const layer = o.layer ?? "all";
  const candle = o.lit;
  const extra = o.light && o.light.k > 0.001 ? o.light : null;
  // the light in the room: the candle, or for a moment the match
  const lit = Math.max(candle, extra ? extra.k : 0);
  const fl = flicker(abs);
  const r = 1050 * (0.6 + 0.4 * lit);
  const [lx, ly] = extra && extra.k > candle ? extra.at : FLAME;
  const pose: KidPose = {
    body: "bust",
    arms: "table",
    hat: true,
    look: [-0.55, 0.7],
    tilt: -0.05,
    headY: Math.sin(abs * 1.6) * 3,
    ...o.kid,
  };
  const kid = (c: Ctx) => {
    drawKid(c, 600, 810, 1.1, pose);
    if (o.horn) {
      // in his lips, in head units (the mouth is at about (6, 102))
      c.save();
      c.translate(600, 810);
      c.scale(1.1, 1.1);
      c.translate(pose.headX ?? 0, pose.headY ?? 0);
      c.rotate(pose.tilt ?? 0);
      partyHorn(c, 4, 104, o.horn.u, o.horn.droop, abs);
      c.restore();
    }
  };
  // the desk is in front of the rest of him: light on him stops at its edge
  const belowDesk = (c: Ctx) => {
    c.beginPath();
    c.moveTo(-60, DESK_Y + 2);
    c.lineTo(W + 60, DESK_Y - 8);
    c.lineTo(W + 60, H + 60);
    c.lineTo(-60, H + 60);
    c.closePath();
    c.fill();
  };
  const phoneOn = o.phoneOn ?? 1;

  if (layer !== "flame") {
    const room = (c: Ctx) => bedroom(c, abs, 1, o.clue ?? 0);
    const blur = o.bgBlur ?? 0;
    if (blur > 0.3) filtered(ctx, `blur(${(blur * devScale(ctx)).toFixed(1)}px)`, room, "deskRoom");
    else room(ctx);
    kid(ctx);
    // the side of him away from the flame turns from the light
    const m = figureMask(ctx, kid, "deskKid");
    onFigure(ctx, m, (c) => {
      const g = c.createLinearGradient(480, 900, 800, 660);
      g.addColorStop(0, "rgba(8,10,28,0)");
      g.addColorStop(1, `rgba(8,10,28,${(0.2 + 0.4 * lit).toFixed(3)})`);
      c.fillStyle = g;
      c.fillRect(-100, -100, W + 200, H + 200);
    });
    desk(ctx, DESK_Y);
    // contact shadows: under the cupcake, and the phone's shadow falling away from the flame
    ctx.save();
    ctx.translate(392, 1274);
    ctx.scale(1, 0.18);
    glow(ctx, 0, 0, 140, "rgba(6,4,2,0.6)");
    ctx.restore();
    ctx.save();
    ctx.filter = `blur(${(7 * devScale(ctx)).toFixed(1)}px)`;
    ctx.translate(884, 1216);
    ctx.rotate(-0.32);
    ctx.fillStyle = "rgba(4,3,2,0.5)";
    ctx.beginPath();
    ctx.roundRect(-64, -132, 128, 264, 18);
    ctx.fill();
    ctx.restore();
    cupcake(ctx, 390, 1170, 0.8, abs, candle, 0, 1, layer === "scene" ? "body" : "all");
    // lit from straight above: the frosting shades the top of the paper case, its foot is in shadow
    ctx.save();
    ctx.translate(390, 1170);
    ctx.scale(0.8, 0.8);
    ctx.beginPath();
    ctx.moveTo(-110, -10);
    ctx.lineTo(110, -10);
    ctx.lineTo(84, 130);
    ctx.lineTo(-84, 130);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = vgrad(ctx, -10, 130, [[0, "rgba(30,12,18,0.5)"], [0.28, "rgba(30,12,18,0)"], [0.55, "rgba(30,12,18,0)"], [1, "rgba(30,12,18,0.42)"]]);
    ctx.fillRect(-120, -20, 240, 160);
    ctx.restore();
    phone(ctx, 860, 1200, 0.2, -0.32, (c) => {
      lockScreen(c, { time: o.phoneTime ?? "23:58", airplane: true });
      if (phoneOn < 1) {
        c.fillStyle = `rgba(0,0,0,${1 - phoneOn})`;
        c.fillRect(0, 0, 600, 1280);
      }
    });
    // the room falls into the dark away from the flame (or is all dark once it's out)
    if (lit > 0.01) {
      const d = o.dark ?? 0.86;
      const g = ctx.createRadialGradient(lx, ly, r * 0.12, lx, ly, r);
      g.addColorStop(0, "rgba(4,5,16,0)");
      g.addColorStop(0.3, `rgba(4,5,16,${(d * 0.24).toFixed(3)})`);
      g.addColorStop(0.62, `rgba(4,5,16,${(d * 0.74).toFixed(3)})`);
      g.addColorStop(1, `rgba(4,5,16,${d})`);
      ctx.fillStyle = g;
      ctx.fillRect(-60, -60, W + 120, H + 120);
    } else {
      ctx.fillStyle = `rgba(3,4,12,${o.dark ?? 0.94})`;
      ctx.fillRect(-60, -60, W + 120, H + 120);
    }
    // the front of the desk is beyond the candle's reach
    ctx.fillStyle = vgrad(ctx, 1290, 1600, [[0, "rgba(4,5,14,0)"], [1, "rgba(4,5,14,0.6)"]]);
    ctx.fillRect(-60, 1290, W + 120, H - 1230);
    // 美感: the fairy lights glow again over the dark (they are lights) — soft discs when the room is out of focus —
    // but not through him where his head is in front of them
    const fb = buffer(ctx, "deskFairy");
    fairyGlow(fb, abs, blur, 0.45 + 0.55 * lit);
    fb.save();
    fb.setTransform(1, 0, 0, 1, 0, 0);
    fb.globalCompositeOperation = "destination-out";
    fb.drawImage(m.canvas, 0, 0);
    fb.restore();
    blit(ctx, fb, "lighter");
    // the window's panes of moonlight laid across the back of the desk (the phone lies in them)
    filtered(
      ctx,
      `blur(${(5 * devScale(ctx)).toFixed(1)}px)`,
      (c) => {
        const q: Pt[] = [[600, 1094], [905, 1090], [850, 1292], [470, 1300]]; // TL TR BR BL
        const at = (u: number, v: number): Pt => [
          (1 - v) * ((1 - u) * q[0][0] + u * q[1][0]) + v * ((1 - u) * q[3][0] + u * q[2][0]),
          (1 - v) * ((1 - u) * q[0][1] + u * q[1][1]) + v * ((1 - u) * q[3][1] + u * q[2][1]),
        ];
        c.fillStyle = vgrad(c, 1090, 1300, [[0, "rgba(165,185,255,0.16)"], [1, "rgba(165,185,255,0.07)"]]);
        for (const [u0, u1] of [[0, 0.47], [0.53, 1]])
          for (const [v0, v1] of [[0, 0.46], [0.54, 1]]) {
            const p = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];
            c.beginPath();
            p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
            c.closePath();
            c.fill();
          }
      },
      "panes",
      1,
      "lighter",
    );
    // moonlight: the window is a light too, a soft shaft of it falls across the room, dust turning in it
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, 870, 390, 300, "rgba(190,205,255,0.14)");
    glow(ctx, 870, 390, 70, "rgba(255,250,225,0.35)");
    ctx.fillStyle = "rgba(120,140,220,0.07)";
    ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    ctx.restore();

    // blown out: a thread of smoke rises from the wick, pale in the moonlight, curling and thinning away
    const smoke = o.smoke ?? 0;
    if (smoke > 0 && smoke < 1 && candle < 0.01) smokeWisp(ctx, 390, 970, smoke, abs);
    // the phone screen's cold light on the desk around it
    if (phoneOn > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(860, 1205);
      ctx.scale(1, 0.55);
      glow(ctx, 0, 0, 230, "rgba(150,170,255,0.12)", phoneOn);
      ctx.restore();
    }
  }

  if (layer === "flame") {
    // cool shadows, warm light: a blue cast over everything the flame doesn't reach (outside the grey grade)
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    const st = ctx.createRadialGradient(lx, ly, 160 * (0.4 + 0.6 * lit), lx, ly, 980);
    st.addColorStop(0, "rgba(30,55,130,0)");
    st.addColorStop(1, "rgba(30,55,130,0.6)");
    ctx.fillStyle = lit > 0.01 ? st : "rgba(30,55,130,0.6)";
    ctx.fillRect(-60, -60, W + 120, H + 120);
    ctx.restore();
    // a soft shaft of moonlight from the window behind him, falling across the room, dust turning in it
    lightShaft(
      ctx,
      [[WIN.x + 10, WIN.y + WIN.h - 20], [WIN.x + WIN.w, WIN.y + WIN.h - 20], [WIN.x + WIN.w - 110, H + 60], [WIN.x - 330, H + 60]],
      810, WIN.y + WIN.h, 560, 1650, "150,175,255", 0.13, 30, "shaft",
    );
    motes(ctx, abs, 760, 1080, 210, 300, 10, 77, "205,220,255", 0.6, 2.2);
    const m = figureMask(ctx, kid, "deskKid");
    if (lit > 0.01) {
      // the candle's warm light on the room around it
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, lx, ly, r * 0.72, `rgba(255,160,70,${(0.2 * fl).toFixed(3)})`, lit);
      ctx.restore();
      // …on him: his face and the near side of him warm
      onFigure(ctx, m, (c) => glow(c, lx, ly, 600, `rgba(255,168,88,${(0.62 * fl).toFixed(3)})`), "screen", lit, belowDesk);
      // his shadow on the wall behind him: thrown up and to the right, bigger than he is, trembling with the flame
      // (laid over the lit wall so it takes the light away; not on the window glass, not on him, not on the desk)
      castShadow(ctx, [lx, ly], 1.5 + 0.4 * (fl - 1), kid, "#03040b", 9, 0.62 * lit, (c) => {
        c.beginPath();
        c.rect(-200, -200, W + 400, DESK_Y - 4 + 200);
        c.rect(WIN.x + 4, WIN.y + 4, WIN.w - 8, WIN.h - 8);
        c.clip("evenodd");
      }, m);
      // a warm edge where the flame catches him
      rimLight(ctx, m, lx - 600, ly - 800, 4.5, "rgb(255,196,120)", 0.5 * lit * fl, "lighter", 6, belowDesk, [lx, ly, 560]);
    }
    // the moon behind him: a cold rim along his hair, the hat and his far shoulder
    rimLight(ctx, m, 0.55, -0.85, 4, "rgb(185,205,255)", 0.1 + 0.2 * lit, "lighter", 6, belowDesk, [880, 420, 760]);
    if (lit > 0.01) {
      // …in a pool on the desk, and its reflection running toward us in the varnish
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(lx, 1300);
      ctx.scale(1, 0.3);
      glow(ctx, 0, 0, 540, `rgba(255,160,70,${(0.2 * fl).toFixed(3)})`, lit);
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.translate(lx, 1530);
      ctx.scale(0.16, 1);
      glow(ctx, 0, 0, 280, `rgba(255,185,100,${(0.3 * fl).toFixed(3)})`, lit);
      ctx.restore();
      // the flame, its halo, a faint horizontal flare, dust glinting in its light
      if (candle > 0.01) cupcake(ctx, 390, 1170, 0.8, abs, candle, 0, 1, "flame");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, lx, ly, 110, `rgba(255,236,190,${(0.4 * fl).toFixed(3)})`, lit);
      glow(ctx, lx, ly, 340, `rgba(255,170,80,${(0.16 * fl).toFixed(3)})`, lit);
      ctx.translate(lx, ly);
      ctx.scale(1, 0.05);
      glow(ctx, 0, 0, 460, `rgba(255,190,120,${(0.22 * fl).toFixed(3)})`, lit);
      ctx.restore();
      motes(ctx, abs, lx + 60, ly - 120, 360, 320, 16, 41, "255,215,160", 0.8 * lit, 2.6);
    }
    // just blown out: the wick still glows orange for a moment, the last warm thing in the room
    const smoke = o.smoke ?? 0;
    if (candle < 0.01 && smoke > 0 && smoke < 0.4) {
      const e = 1 - smoke / 0.4;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      glow(ctx, 390, 972, 46, "rgba(255,120,50,0.35)", e);
      glow(ctx, 390, 972, 9, "rgba(255,170,90,1)", e * (0.8 + 0.2 * Math.sin(abs * 30)));
      ctx.restore();
    }
  }
}

/** A thread of smoke from a blown-out wick at (x, y): `t` 0..1 over its life — it rises, sways, curls and thins
 *  away; pale, as if the moonlight catches it. Layered soft strokes (no blur pass). */
function smokeWisp(ctx: Ctx, x: number, y: number, t: number, abs: number) {
  const fade = Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t);
  if (fade <= 0.01) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let strand = 0; strand < 2; strand++) {
    const pts: Pt[] = [];
    const rise = 0.55 + 0.9 * t;
    for (let k = 0; k <= 12; k++) {
      const h = k * 34 * rise;
      const sway = Math.sin(k * 0.75 + abs * 2.4 + strand * 1.9) * (3 + k * 4.2) * (0.4 + t) + (strand ? 10 : -4) * (k / 12) * t * 3;
      pts.push([x + sway, y - h]);
    }
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length - 1; k++) {
        const mx = (pts[k][0] + pts[k + 1][0]) / 2,
          my = (pts[k][1] + pts[k + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[k][0], pts[k][1], mx, my);
      }
    };
    for (const [w, a] of [[14, 0.06], [7, 0.12], [2.5, 0.28]] as [number, number][]) {
      const g = ctx.createLinearGradient(x, y, x, y - 12 * 34 * rise);
      g.addColorStop(0, `rgba(215,222,240,${(a * fade).toFixed(3)})`);
      g.addColorStop(0.6, `rgba(215,222,240,${(a * fade * 0.7).toFixed(3)})`);
      g.addColorStop(1, "rgba(215,222,240,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = w * (1 + 1.5 * t) * (strand ? 0.7 : 1);
      path();
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- resources (preview and catalog)
export const resources = defineResources({
  birthdayDesk: resource({
    kind: "set",
    title: "生日书桌（烛光镜头）",
    description:
      "书桌前过生日的整个镜头：lit 烛光（0 吹灭）、smoke 吹灭后的余烬和烟、kid 覆盖他的姿势（默认戴派对帽、手放桌上、低头看蛋糕）、phoneOn 手机屏幕亮度、dark 光以外的暗、bgBlur 背景景深、horn 派对喇叭、light 一瞬间的另一盏暖光（划亮的火柴）、clue 窗外楼下的线索。layer: scene 走 grade，flame 在外面画彩色。FLAME 是火苗的位置。",
    tags: ["生日", "书桌", "蜡烛", "烛光", "光影", "冷开场"],
    usage: "birthdayDesk(ctx, abs, { lit, smoke, kid, phoneOn, dark, layer, bgBlur, horn, light, clue })",
    params: z.object({
      lit: z.number().min(0).max(1).default(1).describe("烛光"),
      smoke: z.number().min(0).max(1).default(0).describe("吹灭后的烟"),
      phoneOn: z.number().min(0).max(1).default(1).describe("手机屏幕亮度"),
      dark: z.number().min(0).max(1).optional().describe("光以外的暗（默认约 0.9）"),
      bgBlur: z.number().min(0).max(8).default(0).describe("背景景深（px）"),
      clue: z.number().min(0).max(1).default(0).describe("窗外的线索"),
    }),
    presets: { 吹灭: { lit: 0, smoke: 0.7 }, 手机黑屏: { phoneOn: 0 } },
    preview: {
      width: 1080,
      height: 1920,
      duration: 3,
      prepare: loadFonts,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        birthdayDesk(ctx, t, { ...p, phoneTime: "23:58" });
      },
    },
  }),
});
