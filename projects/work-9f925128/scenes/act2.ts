// 第二幕（作品 15.20–30.34，主歌）：回到现在。分镜 7 往上划过她这三年 → 她现在的男朋友；8 她发来「对方正在输入…」，他愣住；
// 9 画面像镜子一样翻过去：她也醒着，打了「我等过你」又删掉；10 锁屏、黑屏里她的脸 → 竖线转场进她的回忆（第三幕）。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { beatAt } from "@frame/engine/tempo";
import { Ctx, H, bloom, camera, designScene, easeInOut, easeOut, fillBg, filtered, handheld, oldScreenCut, smear, vgrad } from "@materials/s0rrow/code/draw";
import { drawKid } from "@materials/s0rrow/code/kid";
import { SH, SW, phone, tapRing, touchDot } from "@materials/s0rrow/code/mirrors/phoneui";
import { memoryOpen } from "./act3";
import { MIRROR_FACE, herBack, herBedScene, herPose } from "./her";
import { GRAD_INDEX, POSTS, kissPhoto, tileArt, tileLikes } from "./herlife";
import { gradPhoto } from "./photo";
import { PARALLAX, PARALLAX_ZOOM, bedPose, bedScene, roomBokeh, screenLight } from "./present";
import { DM_DEL, DM_SEND, DmItem, PostView, dmBanner, dmScreen, hisAvatar, lockScreen, postScreen, profileScreen, tileRect } from "./socials";
import { EV } from "./timeline";

/** the phone in shot 7 */
const PH7 = { cx: 540, cy: 960, s: 1.1 };

/** her 2023 post as he left it (not liked, caption unfolded) */
const oldPost: PostView = {
  time: "3:08",
  photo: (c, w, h) => gradPhoto(c, w, h),
  author: "小满",
  caption: "毕业了。",
  more: "如果他点赞，我就去表白。",
  expand: 1,
  date: "2023-06-09",
  liked: 0,
  likes: 0,
};
/** her newest post */
const newPost: PostView = {
  time: "3:08",
  photo: kissPhoto,
  author: "小满",
  caption: "和你的第100天",
  date: "4天前",
  liked: 0,
  likes: 128,
};

/** where her profile is scrolled: at the 2023 post (where he came from), then flicked to the top */
const GRAD_SCROLL = tileRect(GRAD_INDEX)[1] - 470;
function profileScroll(abs: number) {
  const k = phase(abs, EV.s7flick, EV.s7stop);
  return GRAD_SCROLL * (1 - easeOut(k));
}
/** the scroll's speed (screen units per second), for the blur */
function profileSpeed(abs: number) {
  const dur = EV.s7stop - EV.s7flick;
  const k = phase(abs, EV.s7flick, EV.s7stop);
  return k > 0 && k < 1 ? (GRAD_SCROLL * 3 * (1 - k) * (1 - k)) / dur : 0;
}

/** what the phone shows in shot 7, in screen units */
function screen7(p: Ctx, abs: number) {
  const back = easeInOut(phase(abs, EV.s7back + 0.04, EV.s7back + 0.28));
  const scroll = profileScroll(abs);
  const view = {
    time: "3:08",
    scroll,
    count: POSTS,
    tile: tileArt,
    likes: tileLikes,
    pressed: abs >= EV.s7tap && abs < EV.s7tap + 0.12 ? 0 : undefined,
  };
  if (abs < EV.s7tap + 0.04) {
    // the post slides away to the right, her profile comes back from the left (iOS back)
    if (back > 0) {
      const v = profileSpeed(abs);
      smear(p, (q) => {
        q.save();
        q.translate(-SW * 0.3 * (1 - back), 0);
        profileScreen(q, view);
        if (back < 1) {
          q.fillStyle = `rgba(0,0,0,${(0.4 * (1 - back)).toFixed(3)})`;
          q.fillRect(0, 0, SW, SH);
        }
        q.restore();
      }, 0, v / 30, "scroll7", Math.min(26, 6 + Math.round(v / 600)));
    }
    if (back < 1) {
      p.save();
      p.translate(SW * back, 0);
      postScreen(p, oldPost);
      p.restore();
    }
  } else {
    // the newest post opens out of its thumbnail
    profileScreen(p, view);
    const k = easeInOut(phase(abs, EV.s7tap + 0.04, EV.s7open));
    const [tx, ty, tw, th] = tileRect(0);
    const x = tx * (1 - k),
      y = (ty - scroll) * (1 - k),
      w = tw + (SW - tw) * k,
      h = th + (SH - th) * k;
    p.save();
    p.beginPath();
    p.roundRect(x, y, w, h, 14 * (1 - k));
    p.clip();
    p.translate(x, y);
    p.scale(w / SW, h / SH);
    postScreen(p, newPost);
    p.restore();
  }
  // his thumb: back, then on the newest post
  touchDot(p, { x: 40, y: 122, touch: 1 - clamp(Math.abs(abs - EV.s7back) / 0.07) });
  tapRing(p, 40, 122, phase(abs, EV.s7back, EV.s7back + 0.3));
  const [tx, ty, tw, th] = tileRect(0);
  touchDot(p, { x: tx + tw / 2, y: ty + th / 2, touch: 1 - clamp(Math.abs(abs - EV.s7tap) / 0.07) });
  tapRing(p, tx + tw / 2, ty + th / 2, phase(abs, EV.s7tap, EV.s7tap + 0.3));
  // the flick: a swipe up the middle of the screen
  const fl = phase(abs, EV.s7flick - 0.12, EV.s7flick + 0.06);
  if (fl > 0 && fl < 1) touchDot(p, { x: 300, y: 980 - 520 * easeOut(fl), touch: 1 });
}

/** 分镜 7：现在。黑场里手机屏幕重新亮起来（还停在她三年前那条）；他退回她的主页，往上一划，三年的照片飞快掠过，停在最上面——
 *  最新一条，点开：唱到 "Kissing someone else"，是她和男朋友在摩天轮前接吻的剪影（向日葵发卡），「和你的第100天」。 */
function shot7(ctx: Ctx, abs: number) {
  const glowUp = easeOut(phase(abs, EV.s7, EV.s7 + 0.35));
  const [hx, hy, hr] = handheld(abs, 3, 41);
  const push = 1 + 0.08 * easeInOut(phase(abs, EV.s7open, EV.s8));
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#0a0f22"], [0.55, "#111834"], [1, "#080b18"]]));
  ctx.save();
  ctx.globalAlpha = glowUp;
  ctx.save();
  camera(ctx, PH7.cx, PH7.cy, 1 + PARALLAX_ZOOM * (push - 1), hr * 0.6, hx * PARALLAX, hy * PARALLAX);
  roomBokeh(ctx, abs);
  ctx.restore();
  ctx.save();
  camera(ctx, PH7.cx, PH7.cy - 140, push, hr, hx, hy);
  screenLight(ctx, PH7.cx, PH7.cy, PH7.s, glowUp);
  phone(ctx, PH7.cx, PH7.cy, PH7.s, 0, (p) => {
    screen7(p, abs);
    // the screen coming back on
    if (glowUp < 1) {
      p.fillStyle = `rgba(0,0,0,${(1 - glowUp).toFixed(3)})`;
      p.fillRect(0, 0, SW, SH);
    }
  });
  ctx.restore();
  ctx.restore();
  bloom(ctx, 0.2, 24);
}

// ================================================================ 分镜 8：对方正在输入…
/** their chat: her last message, three years ago, nine minutes after she posted the photo; he never answered */
const OLD_CHAT: DmItem[] = [
  { t: "time", text: "2023年6月9日 17:51" },
  { t: "msg", text: "你看到了吗？" },
];

/** 分镜 8a：她的新动态上掉下来一条私信通知「小满 正在给你发消息…」（震动、镜头一惊）；他点开——他们的聊天停在三年前：发动态 9 分钟后
 *  她问「你看到了吗？」，他没有回。标题跳成「对方正在输入…」，下面三个点在跳。 */
function shot8(ctx: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 3, 43);
  const jolt = abs < EV.s8 ? 0 : Math.sin(Math.PI * clamp((abs - EV.s8) / 0.16)) * (abs - EV.s8 < 0.16 ? 1 : 0);
  // carry on from shot 7's push, then lean in toward her old message
  const lean = easeInOut(phase(abs, EV.s8typing, EV.s8face));
  const push = 1.08 + 0.03 * jolt + 0.1 * lean;
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#0a0f22"], [0.55, "#111834"], [1, "#080b18"]]));
  ctx.save();
  camera(ctx, PH7.cx, PH7.cy, 1 + PARALLAX_ZOOM * (push - 1), hr * 0.6, hx * PARALLAX, hy * PARALLAX);
  roomBokeh(ctx, abs);
  ctx.restore();
  ctx.save();
  camera(ctx, PH7.cx, PH7.cy - 140 - 120 * lean, push, hr, hx, hy);
  screenLight(ctx, PH7.cx, PH7.cy, PH7.s, 1);
  phone(ctx, PH7.cx, PH7.cy, PH7.s, 0, (p) => {
    const open = easeOut(phase(abs, EV.s8tap + 0.04, EV.s8tap + 0.28));
    if (open < 1) {
      postScreen(p, newPost);
      dmBanner(p, phase(abs, EV.s8, EV.s8 + 0.25) * (1 - open), "小满", "正在给你发消息…");
    }
    if (open > 0) {
      p.save();
      p.translate(0, SH * (1 - open));
      dmScreen(p, {
        time: "3:08",
        name: "小满",
        typing: abs >= EV.s8typing,
        items: OLD_CHAT,
        bubble: phase(abs, EV.s8typing, EV.s8typing + 0.2),
        abs,
      });
      p.restore();
    }
    touchDot(p, { x: 300, y: 104, touch: 1 - clamp(Math.abs(abs - EV.s8tap) / 0.07) });
    tapRing(p, 300, 104, phase(abs, EV.s8tap, EV.s8tap + 0.3));
  });
  ctx.restore();
  bloom(ctx, 0.2, 24);
}

/** 分镜 8b：他的脸——三年没动静的聊天里，她在打字。愣住（眼睛睁大、嘴微张），然后眼睛眯起来、落回手机：他想到了什么。 */
function shot8face(ctx: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 4, 47);
  const think = easeInOut(phase(abs, EV.s8think, EV.s8think + 0.3));
  const pose = bedPose({
    eyes: think > 0.5 ? "open" : "wide",
    look: [0, 0.55 + 0.4 * think],
    brows: think > 0.5 ? "worried" : "up",
    mouth: think > 0.5 ? "flat" : "o",
    headY: 6 * think,
  });
  bedScene(ctx, abs, {
    pose,
    zoom: 1.26 + 0.07 * easeInOut(phase(abs, EV.s8face, EV.s9)),
    cx: 540,
    cy: 600,
    rot: hr,
    dx: hx,
    dy: hy,
    whip: 0,
  });
  bloom(ctx, 0.25, 26);
}

// ================================================================ 分镜 9：她也醒着（反转）
/** her chat with him, on her phone: her question three years ago, never answered */
const HER_CHAT: DmItem[] = [
  { t: "time", text: "2023年6月9日 17:51" },
  { t: "msg", me: true, text: "你看到了吗？" },
];
const WAIT = "我等过你";
/** her phone close (shots 9–10): the chat with the keyboard up, the box she types in clear of the lyrics */
const PH9 = { cx: 540, cy: 820, s: 1.25 };

/** what is in the box at time abs: typed a character a sixteenth, deleted one every half beat */
function draftAt(abs: number) {
  const B = beatAt(1) - beatAt(0);
  let n = 0;
  for (let i = 0; i < WAIT.length; i++) if (abs >= EV.s9screen + (i * B) / 4) n = i + 1;
  for (let j = 0; j < WAIT.length; j++) if (abs >= EV.s9del + (j * B) / 2) n = Math.min(n, WAIT.length - 1 - j);
  return WAIT.slice(0, n);
}
/** the deletes, for her thumb and the key */
function deletes() {
  const B = beatAt(1) - beatAt(0);
  return Array.from(WAIT, (_, j) => EV.s9del + (j * B) / 2);
}

/** a card turning over about the frame's vertical centre line (u 0..1): `a` going away, `b` coming round, a glint of
 *  glass on the edge */
function mirrorTurn(ctx: Ctx, u: number, a: (c: Ctx) => void, b: (c: Ctx) => void) {
  fillBg(ctx, "#05040a");
  const sx = Math.abs(Math.cos(Math.PI * u));
  if (sx > 0.01) {
    ctx.save();
    ctx.translate(540, 0);
    ctx.scale(sx, 1);
    ctx.translate(-540, 0);
    (u < 0.5 ? a : b)(ctx);
    ctx.restore();
  }
  const k = 1 - Math.abs(u - 0.5) * 2;
  const w = 4 + 40 * k;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const x of [540 - 540 * sx, 540 + 540 * sx]) {
    const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
    g.addColorStop(0, "rgba(210,225,255,0)");
    g.addColorStop(0.5, `rgba(225,235,255,${(0.75 * k).toFixed(3)})`);
    g.addColorStop(1, "rgba(210,225,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - w, 0, 2 * w, 1920);
  }
  ctx.restore();
}

/** 分镜 9a：她的脸——和他同一个构图，左右相反。凌晨三点她也醒着，手机的冷光照着她，眼睛红了，在打字。 */
function shot9face(ctx: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 4, 71);
  const pose = herPose({
    eyes: "teary",
    look: [0, 0.62],
    brows: "sad",
    mouth: "flat",
    tears: 0.3 * phase(abs, EV.s9her, EV.s9screen),
  });
  herBedScene(ctx, abs, {
    pose,
    zoom: 1.33 + 0.05 * easeInOut(phase(abs, EV.s9, EV.s9screen)),
    cx: 540,
    cy: 600,
    rot: hr,
    dx: hx,
    dy: hy,
  });
  bloom(ctx, 0.25, 26);
}

/** her lock screen's wallpaper: the Ferris-wheel kiss, cropped to fill the screen */
function wallpaper(c: Ctx, w: number, h: number) {
  const k = Math.max(w / 600, h / 800);
  c.save();
  c.translate((w - 600 * k) / 2, (h - 800 * k) / 2);
  c.scale(k, k);
  kissPhoto(c, 600, 800);
  c.restore();
}

/** 分镜 9b–10：她的手机。和他的聊天，键盘弹着：「我等过你」，拇指停在发送上，没按；唱到 "a reflective picture" 一个字一个字删掉。
 *  然后锁屏——锁屏是她和男朋友，上面还挂着「阿屿 赞了你的作品」；屏幕黑下去，黑玻璃里是她的脸。 */
/** the camera on her phone: the whole chat, then in close on the box she types in (「我等过你」 big), out again for
 *  the lock screen, then slowly in on her face in the black glass */
function chatCam(abs: number) {
  // the whole input bar (draft and 发送) across the frame, her old question still in view above it
  const box: [number, number] = [PH9.cx, PH9.cy + (802 - SH / 2) * PH9.s];
  const k = easeInOut(phase(abs, EV.s9screen + 0.25, EV.s9hover)) * (1 - easeInOut(phase(abs, EV.s10 - 0.04, EV.s10 + 0.2)));
  const z = 1 + 0.5 * k + 0.1 * easeInOut(phase(abs, EV.s10dark, EV.cut11a + 0.48));
  const c: [number, number] = [540 + (box[0] - 540) * k, 940 + (box[1] - 940) * k];
  const to: [number, number] = [540, 940 + (1000 - 940) * k];
  return { c, z, dx: to[0] - c[0], dy: to[1] - c[1] };
}

function shot9screen(ctx: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 2.5, 73);
  const dark = easeInOut(phase(abs, EV.s10dark, EV.s10dark + 0.2));
  const cam = chatCam(abs);
  fillBg(ctx, vgrad(ctx, 0, H, [[0, "#140f26"], [0.55, "#1d1534"], [1, "#100b1f"]]));
  ctx.save();
  camera(ctx, PH9.cx, PH9.cy, 1 + PARALLAX_ZOOM * (cam.z - 1), hr * 0.6, hx * PARALLAX, hy * PARALLAX);
  herBack(ctx, abs);
  ctx.restore();
  ctx.save();
  camera(ctx, cam.c[0], cam.c[1], cam.z, hr, cam.dx + hx, cam.dy + hy);
  screenLight(ctx, PH9.cx, PH9.cy, PH9.s, 1 - dark);
  phone(ctx, PH9.cx, PH9.cy, PH9.s, 0, (p) => {
    if (abs < EV.s10) {
      const dels = deletes();
      const delHot = dels.reduce((m, t) => Math.max(m, abs >= t ? 1 - clamp((abs - t) / 0.16) : 0), 0);
      dmScreen(p, {
        time: "3:08",
        name: "阿屿",
        typing: false,
        items: HER_CHAT,
        bubble: 0,
        abs,
        other: hisAvatar,
        draft: draftAt(abs),
        caret: Math.floor(abs * 3.2) % 2 === 0,
        keyboard: true,
        delHot,
      });
      // her thumb: comes to rest over 发送 (not pressing), then goes to the delete key
      const hover = phase(abs, EV.s9hover - 0.2, EV.s9hover + 0.2) * (1 - phase(abs, EV.s9del - 0.3, EV.s9del - 0.1));
      if (hover > 0) touchDot(p, { x: DM_SEND[0] + 6, y: DM_SEND[1] + 38 - 30 * hover, touch: 0.35 * hover });
      for (const t of dels) {
        touchDot(p, { x: DM_DEL[0], y: DM_DEL[1], touch: 1 - clamp(Math.abs(abs - t) / 0.07) });
        tapRing(p, DM_DEL[0], DM_DEL[1], phase(abs, t, t + 0.26));
      }
    } else {
      lockScreen(p, { time: "3:08", date: "6月9日 星期二", wallpaper, notes: [["阿屿", "赞了你的作品", "3:07"]] });
      // the screen going dark
      if (dark > 0) {
        p.fillStyle = `rgba(4,3,8,${dark.toFixed(3)})`;
        p.fillRect(0, 0, SW, SH);
      }
    }
  });
  ctx.restore();
  // her face in the black glass (she is crying), the phone's own glare across it
  if (dark > 0.05) {
    ctx.save();
    camera(ctx, cam.c[0], cam.c[1], cam.z, hr, cam.dx + hx, cam.dy + hy);
    ctx.beginPath();
    ctx.roundRect(PH9.cx - (SW / 2) * PH9.s, PH9.cy - (SH / 2) * PH9.s, SW * PH9.s, SH * PH9.s, 60 * PH9.s);
    ctx.restore();
    ctx.save();
    ctx.clip();
    filtered(ctx, "saturate(0.25) brightness(1.1)", (c) => {
      c.save();
      c.translate(MIRROR_FACE.x, 0);
      c.scale(-1, 1);
      c.translate(-MIRROR_FACE.x, 0);
      drawKid(c, MIRROR_FACE.x, MIRROR_FACE.y, MIRROR_FACE.s, { who: "girl", body: "bust", outfit: "pajamas", eyes: "teary", look: [0, -0.1], brows: "sad", mouth: "wobble", tears: 0.7, seed: 64 });
      c.restore();
      c.save();
      c.globalCompositeOperation = "destination-in";
      const g = c.createRadialGradient(MIRROR_FACE.x, MIRROR_FACE.y + 40, 120, MIRROR_FACE.x, MIRROR_FACE.y + 40, 560);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 1080, 1920);
      c.restore();
    }, "herReflect", 0.42 * dark, "screen");
    ctx.restore();
  }
  bloom(ctx, 0.2, 24);
}

/** 10 → 11：老式屏幕竖线转场（不配音效）：黑玻璃里她的脸，竖线下面换成同一个位置、同样大小的十七岁的她（她的回忆）。 */
function cut1011(ctx: Ctx, abs: number) {
  oldScreenCut(ctx, abs, phase(abs, EV.cut11a, EV.s11), (c) => shot9screen(c, abs), (c) => memoryOpen(c, abs));
}

export function createScene(options: SceneOptions) {
  return designScene(options, 15.2, (ctx, abs) => {
    fillBg(ctx, "#040308");
    if (abs < EV.s7) return;
    if (abs < EV.s8) shot7(ctx, abs);
    else if (abs < EV.s8face) shot8(ctx, abs);
    else if (abs < EV.s9) shot8face(ctx, abs);
    else if (abs < EV.s9her) mirrorTurn(ctx, phase(abs, EV.s9, EV.s9her), (c) => shot8face(c, abs), (c) => shot9face(c, abs));
    else if (abs < EV.s9screen) shot9face(ctx, abs);
    else if (abs < EV.cut11a) shot9screen(ctx, abs);
    else cut1011(ctx, abs);
  });
}
