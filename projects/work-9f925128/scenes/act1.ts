// 第一幕（作品 0–15.20，第一遍副歌）：凌晨三点他的房间 → 回忆毕业那天。
// 已做：分镜 1（0 → barAt(1)）手机特写，双击爱心，最后向上甩镜（接分镜 2 他的脸）。之后的分镜还没做，透明（下面是分镜占位）。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { Ctx, H, backOut, bloom, bokehDisc, camera, designScene, easeInOut, fillBg, glow, handheld, hash, shake, smear, vgrad } from "@materials/s0rrow/code/draw";
import { phone, tapRing, touchDot } from "@materials/s0rrow/code/mirrors/phoneui";
import { gradPhoto } from "./photo";
import { PostView, heartBurst, postScreen } from "./socials";
import { EV } from "./timeline";

/** the phone in shot 1 (design units): below the hook words, the like button clear of the lyrics */
const PH1 = { cx: 540, cy: 1000, s: 1.1 };
/** where the thumb double-taps (screen units): on the photo, just above the boy's head */
const TAP: [number, number] = [300, 470];

/** His room at 3 a.m., far out of focus behind the phone: the dark, moonlight from the window on the right and the
 *  warm fairy lights strung along the wall. */
function roomBokeh(ctx: Ctx, abs: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  glow(ctx, 1040, 430, 560, "rgba(100,130,225,0.2)");
  glow(ctx, 1060, 360, 220, "rgba(165,190,255,0.16)");
  ctx.restore();
  // fairy lights sagging across the wall
  for (let i = 0; i < 11; i++) {
    const u = i / 10;
    const x = -60 + u * 1200;
    const y = 250 + 170 * Math.sin(u * Math.PI) + (i % 2) * 22;
    const r = 30 + 26 * hash(i * 3.1 + 1);
    const tw = 0.86 + 0.14 * Math.sin(abs * 1.6 + i * 1.9);
    bokehDisc(ctx, x, y, r, "255,184,110", 0.34 * tw);
  }
  // a few cold specks of the town outside, lower right; a charger's tiny green light lower left
  for (let i = 0; i < 5; i++) bokehDisc(ctx, 950 + hash(i * 5.3) * 160, 700 + hash(i * 2.9) * 300, 14 + 10 * hash(i), "150,180,255", 0.18);
  bokehDisc(ctx, 90, 1560, 16, "120,255,170", 0.22);
}

/** the phone's cold light in the air around it */
function screenLight(ctx: Ctx, cx: number, cy: number, s: number, a: number) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(cx, cy);
  ctx.scale(1, 1.45);
  glow(ctx, 0, 0, 620 * s, "rgba(150,170,240,0.13)", a);
  ctx.restore();
}

/** her post as it looks tonight; `liked` from the double tap on */
function postAt(abs: number): PostView {
  const on = abs >= EV.tap2;
  return {
    time: "3:07",
    photo: (c, w, h) => gradPhoto(c, w, h),
    author: "小满",
    caption: "毕业了。",
    more: "如果他点赞，我就去表白。",
    expand: 0,
    date: "2023-06-09",
    liked: on ? 1 : 0,
    likes: on ? 1 : 0,
    likePop: on ? phase(abs, EV.tap2, EV.tap2 + 0.4) : 1,
  };
}

/** 分镜 1：钩子。凌晨三点，她三年前的照片铺满手机；拇指想双击放大，屏幕中间炸开一颗红心，赞「赞」→「1」；
 *  镜头被吓得一顿（急推 + 震），然后加速向上甩（接分镜 2 他的脸，切点落在唱 "eyes" 上）。 */
function shot1(ctx: Ctx, abs: number) {
  const tap = EV.tap2;
  const since = abs - tap;
  const jolt = since < 0 ? 0 : backOut(clamp(since / 0.16)) * (1 - clamp((since - 0.3) / 0.9));
  const [hx, hy, hr] = handheld(abs, 4, 7);
  const [sx, sy] = since > 0 ? shake(abs, 9 * Math.max(0, 1 - since / 0.32)) : [0, 0];
  // the whip: the picture drops away faster and faster as the camera tilts up to his face
  const dur = EV.s2 - EV.whip;
  const w = clamp((abs - EV.whip) / dur);
  const drop = 1800 * w * w * w;
  const speed = (3 * 1800 * w * w) / dur;
  // after the jolt the camera creeps toward the red heart and its 「1」
  const creep = easeInOut(phase(abs, tap + 0.2, EV.whip + 0.1));
  const zoom = 1 + 0.02 * phase(abs, 0, EV.s2) + 0.07 * jolt + 0.07 * creep;
  const [fx, fy] = [540 + 230 * creep, 1000 + 40 * creep];
  const draw = (c: Ctx) => {
    // the dark of the room fills the frame whatever the camera does; its lights move with the camera
    fillBg(c, vgrad(c, 0, H, [[0, "#0a0f22"], [0.55, "#111834"], [1, "#080b18"]]));
    c.save();
    camera(c, fx, fy, zoom, hr, hx + sx + (540 - fx) * 0.35 * creep, hy + sy + drop);
    roomBokeh(c, abs);
    screenLight(c, PH1.cx, PH1.cy, PH1.s, 1);
    phone(c, PH1.cx, PH1.cy, PH1.s, 0, (p) => {
      postScreen(p, postAt(abs));
      heartBurst(p, TAP[0], TAP[1], phase(abs, tap, tap + 0.95), -0.16);
      for (const tt of [EV.tap1, tap]) {
        touchDot(p, { x: TAP[0], y: TAP[1], touch: 1 - clamp(Math.abs(abs - tt) / 0.07) });
        tapRing(p, TAP[0], TAP[1], phase(abs, tt, tt + 0.32));
      }
    });
    c.restore();
  };
  const len = speed / 48;
  smear(ctx, draw, 0, len, "whip1", Math.min(28, 9 + Math.round(len / 6)));
  bloom(ctx, 0.22, 24);
}

export function createScene(options: SceneOptions) {
  return designScene(options, 0, (ctx, abs) => {
    if (abs < EV.s2) shot1(ctx, abs);
  });
}
