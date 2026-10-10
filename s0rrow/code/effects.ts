/**
 * draw.ts 里效果和转场的预览（这个文件只放资源声明，函数本身从 draw.ts 导入）：回忆的老胶片 oldFilm 和进回忆的老式屏幕转场 oldScreenCut、
 * 甩镜 smear、冲镜 zoomBlur、白场黑场 flash、高光溢出 bloom、灰色世界 grade、光柱和浮尘 lightShaft / motes、景深 filtered、
 * 手持镜头 handheld、轮廓光 rimFigure、地上和墙上的影子 groundShadow / castShadow、时间卡 card、逐字写出 writeOn。
 */
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { clamp } from "@frame/engine/math";
import {
  Ctx,
  F,
  H,
  W,
  beginFrame,
  bloom,
  camera,
  card,
  castShadow,
  easeInOut,
  filtered,
  flash,
  grade,
  groundShadow,
  handheld,
  lightShaft,
  loadFonts,
  motes,
  oldFilm,
  oldScreenCut,
  rimFigure,
  smear,
  text,
  writeOn,
  zoomBlur,
} from "./draw";
import { drawKid } from "./kid";
import { bedroom, classroom, corridor, cupcake, desk, street } from "./sets";

/** Previews of whole frames: the 1080×1920 design frame. */
const FRAME = { width: W, height: H, prepare: loadFonts };
const unit = z.number().min(0).max(1);
/** A sample picture to put the effects on: his room at night, him at the desk. */
const room = (c: Ctx, t: number) => {
  bedroom(c, t);
  drawKid(c, 560, 820, 1.05, { arms: "table", eyes: "sad", look: [-0.5, 0.6] });
  desk(c, 1150);
  cupcake(c, 360, 1260, 1, t, 1);
};
/** …and a sunny morning at school (the memory side). */
const morning = (c: Ctx, t: number) => {
  classroom(c, t);
  drawKid(c, 560, 820, 1.05, { arms: "table", eyes: "happy", mouth: "smile" });
};

export const resources = defineResources({
  oldFilm: resource({
    kind: "effect",
    title: "回忆（老胶片）",
    description:
      "回忆的画面：颜色不变（用户要求回忆不改颜色），只叠上胶片相机：18 fps 的片门晃动、粗颗粒、灰尘和毛发、偶尔的划痕（深灰，不用白点）、轻微曝光闪烁、暗角。amount 0.45 是别人视角的闪回（更淡）。进回忆用 oldScreenCut 转场。里面可以再嵌 filtered（景深）。时间卡和标注在效果之后画。",
    tags: ["回忆", "闪回", "老胶片", "复古", "颗粒"],
    usage: "oldFilm(ctx, abs, (c) => drawMemory(c, abs), \"film\", amount)",
    params: z.object({ amount: unit.default(1).describe("强度（0.45 别人视角的闪回）") }),
    preview: {
      ...FRAME,
      duration: 2,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        oldFilm(ctx, t, (c) => morning(c, t), "film", p.amount);
      },
    },
  }),
  oldScreenCut: resource({
    kind: "transition",
    title: "进回忆（老式屏幕竖线）",
    description:
      "切进回忆的转场，两拍、不配音效（用户定的回忆标准）：p 0 → 1，现在的画面碎成闪烁的竖线并抖动，在 at（默认 0.5）前后溶成回忆（回忆自动走 oldFilm），回忆稳定下来时竖线变少。最好做成匹配剪辑：两边是同一张脸、同样大小和位置（重置版：黑屏里的倒影 → 早上的他）。",
    tags: ["转场", "回忆", "闪回", "老式屏幕", "竖线", "匹配剪辑"],
    usage: "oldScreenCut(ctx, abs, p, (c) => drawNow(c), (c) => drawMemory(c), at)  // p 在两拍里从 0 到 1",
    params: z.object({ at: z.number().min(0.1).max(0.9).default(0.5).describe("什么时候溶成回忆") }),
    preview: {
      ...FRAME,
      duration: 2,
      time: 1,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        oldScreenCut(ctx, t, clamp(t / 2), (c) => room(c, t), (c) => morning(c, t), p.at);
      },
    },
  }),
  smear: resource({
    kind: "transition",
    title: "甩镜头（动态模糊）",
    description:
      "任意方向的甩镜：draw 画一次，沿 (dx, dy) 叠 n 份取平均。在场景的根变换下调用，镜头放在 draw 里。模糊长度 = 画面速度（px/s）÷ 48（1/48 秒快门）；下一个镜头沿同方向接着减速，带它自己的模糊（《mirrors》浴室 → 走廊）。竖直方向的甩镜（从脸甩到俯拍桌面）也可以用 smearV。",
    tags: ["转场", "甩镜", "动态模糊", "运镜", "快速"],
    usage: "smear(ctx, (c) => { camera(c, …); drawShot(c); }, dx, dy, key, n)",
    params: z.object({ length: z.number().min(0).max(240).default(120).describe("模糊长度（设计单位）"), vertical: z.boolean().default(false).describe("竖直方向") }),
    preview: {
      ...FRAME,
      duration: 1,
      time: 0.5,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        // The pan speeds up and slows down over the second; the blur follows the speed.
        const speed = Math.sin(Math.PI * clamp(t));
        const shift = easeInOut(clamp(t)) * 600;
        const len = p.length * speed;
        smear(ctx, (c) => (p.vertical ? street(c, t, 0) : street(c, t, shift)), p.vertical ? 0 : len, p.vertical ? len : 0);
      },
    },
  }),
  zoomBlur: resource({
    kind: "transition",
    title: "冲镜（径向模糊）",
    description:
      "冲镜头 / 推进转场：draw 画一次，叠 n 份从 1 放大到 1 + amount（围绕设计坐标 (cx, cy)）取平均；amount 0.1–0.25。一个镜头末尾冲进某个东西，下一个镜头开头减速推进，两边都模糊，看起来是一个动作（《mirrors》他的脸 → 鼓点上冲进胎记）。在场景的根变换下调用。",
    tags: ["转场", "冲镜", "推进", "径向模糊", "运镜"],
    usage: "zoomBlur(ctx, (c) => drawShot(c), cx, cy, amount, key, n)",
    params: z.object({ amount: z.number().min(0).max(0.4).default(0.2).describe("冲多远") }),
    preview: {
      ...FRAME,
      duration: 1,
      time: 0.6,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        const k = Math.sin(Math.PI * clamp(t));
        zoomBlur(ctx, (c) => {
          camera(c, 600, 700, 1 + 0.6 * easeInOut(clamp(t)));
          room(c, t);
        }, 600, 700, p.amount * k);
      },
    },
  }),
  flash: resource({
    kind: "transition",
    title: "白场 / 黑场",
    description: "整个画面盖一层白（纸白的闪白）或黑（淡入淡出黑场），a 0..1。床单盖上镜子推进成白场、反转前的黑场都用它。",
    tags: ["转场", "白场", "黑场", "闪白", "淡出"],
    usage: "flash(ctx, a, color)",
    params: z.object({ color: z.enum(["#fff", "#000"]).default("#fff").describe("白或黑") }),
    preview: {
      ...FRAME,
      duration: 1,
      time: 0.2,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        room(ctx, t);
        flash(ctx, Math.sin(Math.PI * clamp(t)), p.color);
      },
    },
  }),
  bloom: resource({
    kind: "effect",
    title: "高光溢出（Bloom）",
    description: "画面里亮的东西（火苗、亮着的屏幕、被照亮的脸）向周围的暗处溢出柔光，像夜里的镜头。在一幕 createScene 的最后、镜头 if/else 链之后调用一次（插在链中间会让后一个镜头盖住转场）。threshold 决定多亮才发光。",
    tags: ["光", "高光", "溢出", "夜晚", "柔光"],
    usage: "bloom(ctx, amount, radius, threshold)  // 一幕的最后调用",
    params: z.object({ amount: unit.default(0.3).describe("强度"), radius: z.number().min(4).max(80).default(26).describe("半径") }),
    preview: {
      ...FRAME,
      duration: 2,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        room(ctx, t);
        bloom(ctx, p.amount, p.radius);
      },
    },
  }),
  grade: resource({
    kind: "effect",
    title: "灰色世界（去饱和）",
    description: "反转之前他的世界是灰的：draw 去饱和画（sat 0..1）；仍然保持暖色的东西（蜡烛、飞行模式开关、红色的“!”）在它外面、之后画。反转时颜色从开关扩散回来（重置版）。",
    tags: ["去饱和", "灰色", "调色", "反转", "情绪"],
    usage: "grade(ctx, sat, (c) => drawScene(c)); /* 保持彩色的东西 */",
    params: z.object({ sat: unit.default(0.15).describe("饱和度") }),
    preview: {
      ...FRAME,
      duration: 2,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        grade(ctx, p.sat, (c) => morning(c, t));
      },
    },
  }),
  lightShaft: resource({
    kind: "effect",
    title: "光柱和浮尘",
    description: "柔边光柱 lightShaft（窗户透进来的月光、门里的阳光）：四边形 pts 填 rgb，从 (x0, y0) 的 a0 渐隐到 (x1, y1)，边缘柔化 soft，叠加成光；motes 是光里慢慢上升的浮尘（中间最亮）。",
    tags: ["光柱", "月光", "阳光", "浮尘", "灰尘", "丁达尔"],
    usage: "lightShaft(ctx, pts, x0, y0, x1, y1, rgb, a0, soft, key); motes(ctx, abs, x, y, rx, ry, n, seed, rgb, alpha)",
    params: z.object({ a0: unit.default(0.35).describe("光柱强度"), dust: z.number().int().min(0).max(80).default(30).describe("浮尘数量") }),
    preview: {
      ...FRAME,
      duration: 3,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        bedroom(ctx, t);
        lightShaft(ctx, [[640, 300], [970, 300], [700, 1700], [120, 1700]], 800, 300, 400, 1700, "190,210,255", p.a0, 30);
        motes(ctx, t, 560, 1000, 260, 520, p.dust, 4, "200,215,255", 0.8);
      },
    },
  }),
  depthOfField: resource({
    kind: "effect",
    title: "景深（背景虚化）",
    description: "filtered 把 draw 画进离屏画布再套 CSS 滤镜：背景用 \"blur(1.5px)\" 虚化，人物在它之后画保持清晰；也用来做倒影、动态模糊。key 让几次处理各用各的缓冲（不要嵌套同一个 key）。跟着镜头缩放的模糊乘 devScale(ctx)。",
    tags: ["景深", "虚化", "模糊", "背景", "焦点"],
    usage: "filtered(ctx, \"blur(2px)\", (c) => background(c, abs), \"bg\"); drawKid(…)",
    params: z.object({ blur: z.number().min(0).max(12).default(3).describe("背景模糊（px）") }),
    preview: {
      ...FRAME,
      duration: 2,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        filtered(ctx, `blur(${p.blur}px)`, (c) => corridor(c, t), "bg");
        drawKid(ctx, 540, 900, 1.2, { body: "full", eyes: "open" });
      },
    },
  }),
  handheld: resource({
    kind: "effect",
    title: "手持镜头",
    description: "手持摄影机的感觉：几条正弦叠加的缓慢漂移（不是逐帧抖），返回 [dx, dy, rot] 传给 camera。amp 约等于像素：安静的镜头 3–6，紧张时 8–12；同一个画面跨镜头用同一个 seed。推拉用 easeInOut 代替线性。",
    tags: ["手持", "运镜", "镜头", "摄影机", "漂移"],
    usage: "const [dx, dy, rot] = handheld(abs, amp, seed); camera(ctx, cx, cy, zoom, rot, dx, dy)",
    params: z.object({ amp: z.number().min(0).max(16).default(6).describe("幅度") }),
    preview: {
      ...FRAME,
      duration: 4,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        const [dx, dy, rot] = handheld(t, p.amp * 3, 1);
        camera(ctx, 540, 900, 1.15, rot, dx, dy);
        room(ctx, t);
      },
    },
  }),
  rimFigure: resource({
    kind: "effect",
    title: "轮廓光（逆光的人）",
    description: "从背后打光的人（窗里的太阳、亮着的门、月亮）：先画人，再在朝向光的边缘、墨线内侧加一圈光，(ux, uy) 指向光。早晨的阳光 \"rgb(255,238,200)\" 0.5 宽 5；门里的暖光 \"rgb(255,222,165)\" 0.55 宽 6；月光用冷蓝、更淡。",
    tags: ["轮廓光", "逆光", "光", "人物"],
    usage: "rimFigure(ctx, (c) => drawKid(c, x, y, s, pose), ux, uy, color, alpha, width)",
    params: z.object({ angle: z.number().min(-3.14).max(3.14).default(-0.8).describe("光的方向（弧度）") }),
    preview: {
      width: 800,
      height: 1200,
      background: "#1d2236",
      duration: 2,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        rimFigure(ctx, (c) => drawKid(c, 400, 260, 1, { body: "full", view: "back" }), Math.cos(p.angle), Math.sin(p.angle), "rgb(255,222,165)", 0.9, 10);
      },
    },
  }),
  groundShadow: resource({
    kind: "effect",
    title: "地上的影子",
    description: "灯或太阳投在地上的人影：剪影压扁到地面，脚 foot 不动，头顶（脚上方 height）落在 tip（背离光源，光低或近时拉长）。路灯在身后时朝镜头拉长、经过时横到一边（重置版走过路灯）。先画影子再画人。",
    tags: ["影子", "阴影", "路灯", "地面", "光"],
    usage: "groundShadow(ctx, (c) => drawKid(c, x, y, s, pose), foot, height, tip, alpha, soft, sx)",
    params: z.object({ tipX: z.number().min(-600).max(600).default(260).describe("影子头顶的横向位置（相对脚）") }),
    preview: {
      width: 1080,
      height: 1400,
      background: "#cfc6b4",
      duration: 2,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        const kid = (c: Ctx) => drawKid(c, 540, 260, 1, { body: "full", legs: "stand" });
        groundShadow(ctx, kid, [540, 1170], 1000, [540 + p.tipX, 1330], 0.5, 6);
        kid(ctx);
      },
    },
  }),
  castShadow: resource({
    kind: "effect",
    title: "墙上的影子（点光源）",
    description: "点光源 light 把人的影子放大投到身后的墙上（放大倍数 k、颜色、柔化 soft）：叠在灯光之后，figure（人物遮罩）让影子不盖在人身上。生日书桌：烛光把他的影子投在墙上，比他大，随火苗颤动。",
    tags: ["影子", "墙", "烛光", "点光源", "光影"],
    usage: "castShadow(ctx, light, k, (c) => drawKid(…), color, soft, alpha, clip, figure)",
    params: z.object({ k: z.number().min(1).max(2.5).default(1.5).describe("放大倍数") }),
    preview: {
      width: 1080,
      height: 1400,
      background: "#3b3550",
      duration: 2,
      draw(ctx, t, p) {
        beginFrame(ctx, t);
        const kid = (c: Ctx) => drawKid(c, 540, 500, 0.9, { arms: "table" });
        castShadow(ctx, [380, 1100], p.k, kid, "rgba(10,8,20,1)", 10, 0.6);
        kid(ctx);
        cupcake(ctx, 380, 1180, 1, t, 1);
      },
    },
  }),
  card: resource({
    kind: "text",
    title: "时间卡（手写字幕）",
    description: "像胶片时间卡一样的小号手写字：\"23:58\"、\"今天早些时候\"，a 淡入淡出，align 可 center。",
    tags: ["时间卡", "字幕", "手写", "文字", "时间"],
    usage: "card(ctx, s, x, y, a, size, align)",
    params: z.object({ text: z.string().default("今天早些时候").describe("文字") }),
    preview: {
      width: 800,
      height: 300,
      background: "#141a33",
      duration: 1,
      time: 1,
      prepare: loadFonts,
      draw(ctx, t, p) {
        card(ctx, p.text, 400, 150, clamp(t * 2), 56, "center");
      },
    },
  }),
  writeOn: resource({
    kind: "text",
    title: "逐字写出",
    description: "writeOn(s, p) 返回写到进度 p（0..1）为止的字，配合 text() 画出逐字出现的效果（字体 F：en 英文手写、marker 马克笔、cn 站酷快乐体、pen 龙藏体、ui 思源黑体）。",
    tags: ["文字", "逐字", "打字机", "手写", "字体"],
    usage: "text(ctx, writeOn(\"生日快乐\", p), x, y, { size, font: F.cn, fill })",
    params: z.object({
      text: z.string().default("我没有朋友").describe("文字"),
      font: z.enum(["en", "marker", "cn", "pen", "ui"]).default("cn").describe("字体"),
    }),
    preview: {
      width: 1000,
      height: 360,
      background: "#141a33",
      duration: 2,
      time: 2,
      prepare: loadFonts,
      draw(ctx, t, p) {
        text(ctx, writeOn(p.text, clamp(t / 1.6)), 500, 180, { size: 110, font: F[p.font], fill: "#fff" });
      },
    },
  }),
});
