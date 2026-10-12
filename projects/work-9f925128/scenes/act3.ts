// 第三幕（作品 30.34–46.5，最后一遍副歌，她的视角）：她的回忆——走廊里他的赞来了又没了；那一晚刷新到天亮——现在她把那条动态
// 设成仅自己可见；他那边作品没了，然后收到她赞了他三年前的「算了。」。
import type { SceneOptions } from "@frame/engine/types";
import { clamp, phase } from "@frame/engine/math";
import { C, Ctx, F, Pt, bloom, camera, designScene, easeInOut, easeOut, figureMask, fillBg, filtered, handheld, oldFilm, onFigure, rimLight, rr, text, vgrad } from "@materials/s0rrow/code/draw";
import { aimPhone, phone, tapRing, touchDot } from "@materials/s0rrow/code/mirrors/phoneui";
import { COR, CorridorBeat, GIRL_AT, corridorPeople } from "./act1";
import { MIRROR_FACE, herBack, herBedScene, herPose } from "./her";
import { corridorScene, gradPhoto } from "./photo";
import { PARALLAX, PARALLAX_ZOOM, bedPose, bedScene, roomBokeh, screenLight } from "./present";
import { DM_SEND, DmItem, LIKE_AT, MENU_DELETE, MENU_PRIVATE, MORE_BTN, PostView, dmBanner, dmScreen, heartBurst, hisAvatar, postMenu, postScreen, privateOver, textPostScreen, toast } from "./socials";
import { EV } from "./timeline";

// ================================================================ 分镜 11：她的回忆 · 走廊
/** her head in the corridor world (after the corridor's own scale 2.4): where the camera holds her */
const HER_HEAD: Pt = [COR.x + GIRL_AT.x * COR.s, GIRL_AT.y * COR.s];
/** the corridor moment, from her side: the same choreography as his shot 6, on this chorus's beats */
const beat11 = (): CorridorBeat => ({
  ping: EV.s11ping,
  squeal: EV.s11squeal,
  show: EV.s11show,
  pat: EV.s11show + 0.24,
  glance: EV.s11look,
  glanceFor: 0.46,
  fade: EV.s11gone,
});

/** her post on her own phone that afternoon: 「刚刚」, his like arriving (`liked` from `on`), then gone */
function postThen(abs: number): PostView {
  const on = abs >= EV.s11ping + 0.12 && abs < EV.s11gone + 0.12;
  return {
    time: "17:42",
    photo: (c, w, h) => gradPhoto(c, w, h),
    author: "小满",
    caption: "毕业了。",
    more: "如果他点赞，我就去表白。",
    expand: 1,
    date: "刚刚",
    liked: on ? 1 : 0,
    likes: on ? 1 : 0,
    likePop: on ? phase(abs, EV.s11ping + 0.12, EV.s11ping + 0.52) : 1,
    likeShrink: abs >= EV.s11gone + 0.12 ? phase(abs, EV.s11gone + 0.12, EV.s11gone + 0.44) : 1,
  };
}

/** the camera on her in the corridor at time abs: [zoom, where her head sits in the frame] — her face where her
 *  reflection was (the cut), pulling back to the two of them, in close again when her smile goes */
function frame11(abs: number): { z: number; at: Pt } {
  const zFace = MIRROR_FACE.s / (GIRL_AT.s * COR.s);
  const pull = easeInOut(phase(abs, EV.s11pull, EV.s11pull + 0.42));
  let z = zFace + (1.45 - zFace) * pull;
  let at: Pt = [MIRROR_FACE.x + (400 - MIRROR_FACE.x) * pull, MIRROR_FACE.y + (720 - MIRROR_FACE.y) * pull];
  if (abs >= EV.s11fade) {
    const k = easeOut(phase(abs, EV.s11fade, EV.s12));
    z = 2.3 + 0.12 * k;
    at = [520, 720];
  }
  return { z, at };
}

/** her and her friend at the window, lit from behind by the sunset; the window soft behind them when close */
function corridor11(ctx: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 3, 81);
  const { z, at } = frame11(abs);
  const people = corridorPeople(abs, beat11());
  const place = (q: Ctx) => {
    camera(q, HER_HEAD[0], HER_HEAD[1], z, hr, at[0] - HER_HEAD[0] + hx, at[1] - HER_HEAD[1] + hy);
    q.translate(COR.x, 0);
    q.scale(COR.s, COR.s);
  };
  fillBg(ctx, "#20182a");
  // the corridor behind them, out of focus (more so the closer the camera)
  filtered(ctx, `blur(${(1.5 + 2 * clamp((z - 1.4) / 1.4)).toFixed(2)}px)`, (k) => {
    k.save();
    place(k);
    corridorScene(k, () => {});
    k.restore();
  }, "cor11");
  ctx.save();
  place(ctx);
  people(ctx);
  const m = figureMask(ctx, people, "cor11People");
  onFigure(ctx, m, (k) => {
    k.fillStyle = vgrad(k, 300, 760, [[0, "rgba(60,36,80,0.18)"], [1, "rgba(50,30,70,0.36)"]]);
    k.fillRect(-100, 200, 900, 700);
  });
  rimLight(ctx, m, -0.6, -1, 5, "rgb(255,198,132)", 0.85, "lighter", 6);
  ctx.restore();
  // her friend: 「快去！」
  const say = phase(abs, EV.s11show + 0.18, EV.s11show + 0.32);
  if (say > 0 && abs < EV.s11look) {
    const [bx, by] = [at[0] + 300, at[1] - 330];
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(easeOut(say), easeOut(say));
    ctx.fillStyle = "#fff";
    rr(ctx, -120, -56, 240, 112, 40);
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, 54);
    ctx.lineTo(10, 100);
    ctx.lineTo(34, 54);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-12, 46, 50, 12);
    text(ctx, "快去！", 0, 2, { size: 60, font: F.cn, fill: C.ink });
    ctx.restore();
  }
  bloom(ctx, 0.15, 22);
}

/** her phone in her hand that afternoon (inserts): the post with his like coming in (`gone` false), or the like
 *  button close as it goes white again (`gone` true) */
function phone11(ctx: Ctx, abs: number, gone: boolean) {
  const [hx, hy, hr] = handheld(abs, 3, 83);
  fillBg(ctx, vgrad(ctx, 0, 1920, [[0, "#f0a26c"], [0.5, "#b36a7c"], [1, "#3b2a48"]]));
  // the corridor's sunset, far out of focus behind the phone
  filtered(ctx, "blur(14px)", (k) => {
    k.save();
    camera(k, HER_HEAD[0], HER_HEAD[1], 1.3, 0, 540 - HER_HEAD[0], 600 - HER_HEAD[1]);
    k.translate(COR.x, 0);
    k.scale(COR.s, COR.s);
    corridorScene(k, () => {});
    k.restore();
  }, "cor11b");
  ctx.save();
  camera(ctx, 540, 960, 1, hr, hx, hy);
  const view = postThen(abs);
  if (!gone) {
    // low enough that the banner stays clear of the 「三年前，她」 label at the top
    const s = 1.12 + 0.05 * easeOut(phase(abs, EV.s11ping, EV.s11squeal));
    phone(ctx, 540, 990, s, 0, (p) => {
      postScreen(p, view);
      dmBanner(p, phase(abs, EV.s11ping + 0.08, EV.s11ping + 0.3), "阿屿", "赞了你的作品");
    });
  } else {
    const s = 2.3;
    const [cx, cy] = aimPhone(LIKE_AT[0], LIKE_AT[1], 640, 760, s);
    phone(ctx, cx, cy, s, 0, (p) => postScreen(p, view));
  }
  ctx.restore();
  bloom(ctx, 0.15, 22);
}

/** 分镜 11：她的回忆 · 走廊（老式屏幕竖线）。从黑屏里她的倒影那个位置，换成十七岁的她的脸，拉开：走廊窗边，她攥着手机在等。
 *  「阿屿 赞了你的作品」弹出来——她叫了一声，拿给朋友看，朋友笑着推她「快去！」、揉她的头（就是他误会的那一幕）；她回头往教室门口
 *  找他，笑着——再低头：赞没了。她的笑一点点没了。 */
function shot11(ctx: Ctx, abs: number) {
  if (abs >= EV.s11ping && abs < EV.s11squeal) phone11(ctx, abs, false);
  else if (abs >= EV.s11gone && abs < EV.s11fade) phone11(ctx, abs, true);
  else corridor11(ctx, abs);
}

// ================================================================ 分镜 12：她的回忆 · 那一晚
/** her question to him that evening (her phone): typed, sent at 17:51 — never answered */
const HER_Q: DmItem[] = [
  { t: "time", text: "17:51" },
  { t: "msg", me: true, text: "你看到了吗？" },
];

/** her phone that evening and night, close: the chat (her question going out), then his post 「算了。」 from 17:43 */
function phone12(ctx: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 3, 85);
  const push = 1 + 0.05 * phase(abs, EV.s12, EV.s12face);
  fillBg(ctx, vgrad(ctx, 0, 1920, [[0, "#140f26"], [0.55, "#1d1534"], [1, "#100b1f"]]));
  ctx.save();
  camera(ctx, 540, 900, 1 + PARALLAX_ZOOM * (push - 1), hr * 0.6, hx * PARALLAX, hy * PARALLAX);
  herBack(ctx, abs);
  ctx.restore();
  ctx.save();
  camera(ctx, 540, 900, push, hr, hx, hy);
  screenLight(ctx, 540, 860, 1.15, 1);
  phone(ctx, 540, 860, 1.15, 0, (p) => {
    if (abs < EV.s12post) {
      const sent = abs >= EV.s12 + 0.24;
      dmScreen(p, {
        time: "17:51",
        name: "阿屿",
        typing: false,
        items: sent ? HER_Q : HER_Q.slice(0, 1),
        bubble: 0,
        abs,
        other: hisAvatar,
        draft: sent ? "" : "你看到了吗？",
        caret: !sent,
        keyboard: true,
      });
      touchDot(p, { x: DM_SEND[0], y: DM_SEND[1], touch: 1 - clamp(Math.abs(abs - (EV.s12 + 0.24)) / 0.07) });
      tapRing(p, DM_SEND[0], DM_SEND[1], phase(abs, EV.s12 + 0.24, EV.s12 + 0.54));
    } else {
      // that night, on his page: what he posted at 17:43, a minute after taking his like back
      textPostScreen(p, { time: "23:48", author: "阿屿", text: "算了。", date: "今天 17:43", liked: 0, likes: 0, avatar: hisAvatar });
    }
  });
  ctx.restore();
  bloom(ctx, 0.15, 22);
}

/** her at seventeen in bed that night, the phone's light on her face; the night going by until the window is pale */
function face12(ctx: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 3, 87);
  const dawn = easeInOut(phase(abs, EV.s12dawn, EV.s13 - 0.1));
  const pose = herPose({
    eyes: dawn > 0.5 ? "tired" : "teary",
    look: [0, 0.62],
    brows: "sad",
    mouth: dawn > 0.5 ? "flat" : "wobble",
    tears: 0.5 + 0.4 * phase(abs, EV.s12face, EV.s12dawn),
    seed: 66,
  });
  herBedScene(ctx, abs, { pose, zoom: 1.3 + 0.08 * easeInOut(phase(abs, EV.s12face, EV.s13)), cx: 540, cy: 600, rot: hr, dx: hx, dy: hy, dawn });
  bloom(ctx, 0.22, 24);
}

/** 分镜 12：她的回忆 · 那一晚。17:51 她给他发「你看到了吗？」，没有回音；夜里在他的主页上看到他 17:43 发的「算了。」——就在
 *  他取消赞的那一分钟；她在被窝里哭，一直看着手机，窗外一点点亮了。 */
function shot12(ctx: Ctx, abs: number) {
  if (abs < EV.s12face) phone12(ctx, abs);
  else face12(ctx, abs);
}

// ================================================================ 分镜 13：现在 · 仅自己可见
/** her graduation post tonight (his like taken back again): as she sees it, and as he does */
const gradPost = (time: string): PostView => ({
  time,
  photo: (c, w, h) => gradPhoto(c, w, h),
  author: "小满",
  caption: "毕业了。",
  more: "如果他点赞，我就去表白。",
  expand: 1,
  date: "2023-06-09",
  liked: 0,
  likes: 0,
});

/** 13a：她，现在。锁掉的手机又被拿起来，屏幕的光重新照亮她哭过的脸。 */
function face13(ctx: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 3, 89);
  const light = easeOut(phase(abs, EV.s13 + 0.08, EV.s13 + 0.32));
  const pose = herPose({ eyes: "tired", look: [0, 0.62], brows: "sad", mouth: "flat", tears: 0.35 });
  herBedScene(ctx, abs, { pose, zoom: 1.36 + 0.04 * phase(abs, EV.s13, EV.s13post), cx: 540, cy: 600, rot: hr, dx: hx, dy: hy, light });
  bloom(ctx, 0.22, 24);
}

/** 13b：她的手机——那条毕业照。点「…」，菜单滑上来；拇指停在「删除」上，停了很久；滑到「设为仅自己可见」，按下。 */
function phone13(ctx: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 2.5, 91);
  const open = easeOut(phase(abs, EV.s13more + 0.04, EV.s13more + 0.3));
  const close = easeInOut(phase(abs, EV.s13private + 0.1, EV.s13private + 0.36));
  // the phone rises as her thumb goes down to the menu (its rows stay above the lyrics)
  const lift = easeInOut(phase(abs, EV.s13more, EV.s13delete)) * (1 - 0.7 * close);
  const cy = 860 - 400 * lift;
  fillBg(ctx, vgrad(ctx, 0, 1920, [[0, "#140f26"], [0.55, "#1d1534"], [1, "#100b1f"]]));
  ctx.save();
  camera(ctx, 540, 900, 1, hr * 0.6, hx * PARALLAX, hy * PARALLAX - 400 * lift * PARALLAX);
  herBack(ctx, abs);
  ctx.restore();
  ctx.save();
  camera(ctx, 540, 900, 1, hr, hx, hy);
  screenLight(ctx, 540, cy, 1.15, 1);
  phone(ctx, 540, cy, 1.15, 0, (p) => {
    postScreen(p, gradPost("3:09"));
    const row = abs >= EV.s13slide + 0.22 ? "private" : abs >= EV.s13delete - 0.05 ? "delete" : null;
    const hot = row === "private" ? 1 - phase(abs, EV.s13private + 0.1, EV.s13private + 0.3) : row === "delete" ? 0.6 + 0.4 * Math.sin(abs * 9) ** 2 : 0;
    postMenu(p, open * (1 - close), row, hot);
    toast(p, phase(abs, EV.s13private + 0.2, EV.s14), "已设为仅自己可见");
    // her thumb: 「…」, then resting on 删除 (pressing a little), sliding down, pressing 设为仅自己可见
    touchDot(p, { x: MORE_BTN[0], y: MORE_BTN[1], touch: 1 - clamp(Math.abs(abs - EV.s13more) / 0.07) });
    tapRing(p, MORE_BTN[0], MORE_BTN[1], phase(abs, EV.s13more, EV.s13more + 0.3));
    if (abs >= EV.s13delete - 0.1 && abs < EV.s13private + 0.12) {
      const s = easeInOut(phase(abs, EV.s13slide, EV.s13slide + 0.3));
      const y = MENU_DELETE[1] + (MENU_PRIVATE[1] - MENU_DELETE[1]) * s;
      const press = abs >= EV.s13private ? 1 : 0.45 + 0.15 * Math.sin(abs * 7);
      touchDot(p, { x: MENU_DELETE[0] - 120, y, touch: press });
    }
    tapRing(p, MENU_PRIVATE[0] - 120, MENU_PRIVATE[1], phase(abs, EV.s13private, EV.s13private + 0.3));
  });
  ctx.restore();
  bloom(ctx, 0.15, 22);
}

// ================================================================ 分镜 14–15：他那边
/** his phone in his room (the framing of shots 7–8) */
function hisPhone(ctx: Ctx, abs: number, push: number, screen: (p: Ctx) => void) {
  const [hx, hy, hr] = handheld(abs, 3, 93);
  fillBg(ctx, vgrad(ctx, 0, 1920, [[0, "#0a0f22"], [0.55, "#111834"], [1, "#080b18"]]));
  ctx.save();
  camera(ctx, 540, 960, 1 + PARALLAX_ZOOM * (push - 1), hr * 0.6, hx * PARALLAX, hy * PARALLAX);
  roomBokeh(ctx, abs);
  ctx.restore();
  ctx.save();
  camera(ctx, 540, 820, push, hr, hx, hy);
  screenLight(ctx, 540, 960, 1.1, 1);
  phone(ctx, 540, 960, 1.1, 0, screen);
  ctx.restore();
  bloom(ctx, 0.2, 24);
}

/** 分镜 14a：他的手机。她那条毕业照还开着——照片没了，「作品已设为私密」。 */
function phone14(ctx: Ctx, abs: number) {
  const gone = easeInOut(phase(abs, EV.s14gone, EV.s14gone + 0.4));
  hisPhone(ctx, abs, 1.04 + 0.04 * phase(abs, EV.s14, EV.s14face), (p) => {
    postScreen(p, gradPost("3:09"));
    privateOver(p, gone);
  });
}

/** 分镜 14b：他的脸。屏幕上的照片没了，他看着那一片灰。 */
function face14(ctx: Ctx, abs: number) {
  const [hx, hy, hr] = handheld(abs, 4, 95);
  const pose = bedPose({ eyes: "sad", look: [0, 0.8], brows: "sad", mouth: "flat", headY: 6 });
  bedScene(ctx, abs, { pose, zoom: 1.3 + 0.06 * easeInOut(phase(abs, EV.s14face, EV.s15)), cx: 540, cy: 600, rot: hr, dx: hx, dy: hy, whip: 0 });
  bloom(ctx, 0.25, 26);
}

/** 分镜 15：「小满 赞了你的作品」——他点开：三年前那条「算了。」，赞 1。结尾引导。 */
function phone15(ctx: Ctx, abs: number) {
  hisPhone(ctx, abs, 1.08 + 0.06 * easeOut(phase(abs, EV.s15open, EV.s15card)), (p) => {
    if (abs < EV.s15open + 0.04) {
      postScreen(p, gradPost("3:10"));
      privateOver(p, 1);
      dmBanner(p, phase(abs, EV.s15, EV.s15 + 0.25), "小满", "赞了你的作品");
    } else {
      const k = easeOut(phase(abs, EV.s15open + 0.04, EV.s15open + 0.3));
      p.save();
      p.translate(0, 1280 * (1 - k));
      textPostScreen(p, { time: "3:10", author: "阿屿", text: "算了。", date: "2023-06-09", liked: 1, likes: 1, likePop: phase(abs, EV.s15open + 0.3, EV.s15open + 0.7), avatar: hisAvatar });
      p.restore();
    }
    touchDot(p, { x: 300, y: 104, touch: 1 - clamp(Math.abs(abs - EV.s15open) / 0.07) });
    tapRing(p, 300, 104, phase(abs, EV.s15open, EV.s15open + 0.3));
  });
  endCard(ctx, abs);
}

/** the end card over the last frames: the like guide (a heart popping where you'd double-tap) and the question */
function endCard(ctx: Ctx, abs: number) {
  const k = easeOut(phase(abs, EV.s15card, EV.s15card + 0.3));
  if (k <= 0) return;
  ctx.save();
  ctx.fillStyle = `rgba(6,6,14,${(0.58 * k).toFixed(3)})`;
  ctx.fillRect(-60, -60, 1200, 2040);
  ctx.globalAlpha = k;
  text(ctx, "这个赞，", 540, 470, { size: 92, font: F.cn, fill: "#ffffff", stroke: C.ink, lw: 12 });
  text(ctx, "别再迟到三年", 540, 590, { size: 92, font: F.cn, fill: "#ffd166", stroke: C.ink, lw: 12 });
  text(ctx, "回看 0:13：她回头在看谁？", 540, 1080, { size: 54, font: F.cn, fill: "#ffffff", stroke: C.ink, lw: 9 });
  text(ctx, "答案打在评论区", 540, 1160, { size: 40, font: F.cn, fill: "rgba(255,255,255,0.8)", stroke: C.ink, lw: 7 });
  ctx.restore();
  // (small and low enough that, floating up as it fades, it stays clear of the words)
  heartBurst(ctx, 540, 850, phase(abs, EV.s15card + 0.08, EV.s15card + 1.0), -0.1, 165);
}

/** the first frames of her memory, for act 2's old-screen cut into it */
export function memoryOpen(ctx: Ctx, abs: number) {
  oldFilm(ctx, abs, (c) => shot11(c, abs));
}

export function createScene(options: SceneOptions) {
  return designScene(options, 30.34, (ctx, abs) => {
    fillBg(ctx, "#0b0812");
    if (abs < EV.s12) oldFilm(ctx, abs, (c) => shot11(c, abs));
    else if (abs < EV.s13) oldFilm(ctx, abs, (c) => shot12(c, abs));
    else if (abs < EV.s13post) face13(ctx, abs);
    else if (abs < EV.s14) phone13(ctx, abs);
    else if (abs < EV.s14face) phone14(ctx, abs);
    else if (abs < EV.s15) face14(ctx, abs);
    else phone15(ctx, abs);
  });
}
