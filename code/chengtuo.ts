// 秤砣：入口。基础模型在 figure.ts（所有角色共用），秤砣的配色、发型、衣服、鞋在 chengtuo-draw.ts，动作在 chengtuo-moves.ts，这里一起导出；
// 另外有一套「按关节角度摆姿势」的参数（角度用度数，基础模型的 figureOptions 加上秤砣的物品），资源面板里调的就是它。

import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { type DrawOptions, type PoseIn, figureOptions, figurePose } from "./figure";
import { CHENGTUO, drawChengtuo, holdBrick } from "./chengtuo-draw";

export * from "./figure";
export * from "./chengtuo-draw";
export * from "./chengtuo-moves";

/** 秤砣的参数：基础模型的参数（朝向、表情、每个关节的角度、风、失重…）加上她身上的物品 */
export const chengtuoOptions = figureOptions.extend({
  scarf: z.boolean().default(true).describe("围巾（关掉露出脖子）"),
  gloves: z.boolean().default(true).describe("手套（关掉是光着的手）"),
  coat: z.boolean().default(true).describe("外套（袖子卷到小臂中间；关掉是毛衣）"),
  band: z.boolean().default(true).describe("红袖标（左上臂）"),
  boots: z.boolean().default(true).describe("铁靴（关掉是光脚）"),
  bricks: z.number().int().min(0).max(2).default(2).describe("靴筒里插着几块砖：1 画面左边那只，2 两只都有"),
  brickL: z.boolean().default(false).describe("L 手里拿一块砖"),
  brickR: z.boolean().default(false).describe("R 手里拿一块砖"),
});
export type ChengtuoOptions = z.input<typeof chengtuoOptions>;

/** 参数 → 姿势（drawChengtuo 用的 PoseIn，可以再和动作、关键帧混合）。t：时间（呼吸、眨眼、飘的摆动）。 */
export function chengtuoPose(options: ChengtuoOptions = {}, t = 0): PoseIn {
  const o = chengtuoOptions.parse(options);
  return { ...figurePose(o, t, CHENGTUO), items: { scarf: o.scarf, gloves: o.gloves, coat: o.coat, band: o.band, boots: o.boots, bricks: o.bricks } };
}

/**
 * 按参数画秤砣：(x, y) 是两脚之间的地面，s = 1 时全身约 590 高。
 * opts 同 drawChengtuo（hold 手里拿的东西、beforeFrontArms 等）；brickL / brickR 打开时手里画一块砖。
 */
export function chengtuo(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, options: ChengtuoOptions = {}, t = 0, opts: DrawOptions = {}) {
  const o = chengtuoOptions.parse(options);
  const hold = { ...opts.hold };
  if (o.brickL) hold.L ??= holdBrick;
  if (o.brickR) hold.R ??= holdBrick;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  drawChengtuo(ctx, chengtuoPose(o, t), { ...opts, line: o.line * (opts.line ?? 1), hold });
  ctx.restore();
}

export const resources = defineResources({
  chengtuo: resource({
    kind: "character",
    title: "秤砣",
    description:
      "《引力》的女主秤砣：19 岁，黑色齐刘海长直发，藏青外套（袖子卷到小臂、肩头铆钉）、左臂红袖标、米白毛衣、深灰裤袜、插着砖的生锈铁靴（麻绳、铆钉），芥末黄围巾、藏青手套。二维骨架剪纸画风（深色描边、平涂、右下一道阴影），建在「基础模型」上（骨架、身体、脸和表情、转身都是基础模型的，她只换了配色、发型、衣服、鞋）。正面和 3/4 连续转身；表情 10 种并可细调眼皮、眉毛、嘴；外套、袖标、铁靴、围巾、手套都可以单独脱掉（全脱是基础模型），靴子里、手里可以插砖、拿砖；姿势按每个关节的角度摆，脚自动踩地；头发、刘海、围巾随风一阵一阵地飘（4 秒循环），失重从垂着到漂起来连续过渡、和风联动。",
    tags: ["秤砣", "女主", "少女", "长发", "围巾", "外套", "铁靴", "袖标", "剪纸", "骨架", "引力"],
    usage:
      "chengtuo(ctx, x, y, s, { face, expression, shoulderL, elbowL, …, coat, band, boots, bricks, scarf, gloves }, t)  // (x, y) 两脚之间的地面，s = 1 全身约 590 高；动作用 drawChengtuo(ctx, pose) + walk / jumpGrab / kneelGive / float",
    params: chengtuoOptions,
    presets: {
      "3/4 朝左": { face: -1, shoulderL: -5, elbowL: 16, wristL: 15, shoulderR: 8, elbowR: 18, wristR: -15, hipL: 6, kneeL: -15, ankleL: 9, hipR: 8, kneeR: -15, ankleR: 7 },
      "3/4 朝右": { face: 1, shoulderL: -5, elbowL: 16, wristL: 15, shoulderR: 8, elbowR: 18, wristR: -15, hipL: 6, kneeL: -15, ankleL: 9, hipR: 8, kneeR: -15, ankleR: 7 },
      抱臂: { shoulderL: -17, elbowL: 115, wristL: -14, shoulderR: 17, elbowR: -99, wristR: 6 },
      半蹲: { shoulderL: -18, elbowL: 15, wristL: 9, shoulderR: 18, elbowR: -15, wristR: -9, hipL: -54, kneeL: 74, ankleL: -20, hipR: 54, kneeR: -74, ankleR: 20, thighL: 0.52, thighR: 0.52 },
      挥手: { face: -1, expression: "笑", neck: 5, shoulderL: -135, elbowL: -35, wristL: -10, handL: "open", shoulderR: 8, elbowR: 18, wristR: -15, hipL: 6, kneeL: -15, ankleL: 9, hipR: 8, kneeR: -15, ankleR: 7 },
      坐: { face: -1, neck: -3, lean: 5, shoulderL: 20, elbowL: 34, wristL: 15, shoulderR: 26, elbowR: 37, wristR: -15, hipL: 88, kneeL: -95, ankleL: 7, hipR: 88, kneeR: -99, ankleR: 12, lookX: -0.4, lookY: 0.3 },
      单膝跪递砖: { face: -1, neck: 10, lean: 11, shoulderL: 84, elbowL: 1, wristL: -14, handL: "flat", brickL: true, shoulderR: 40, elbowR: 63, wristR: 0, hipL: -16, kneeL: -110, ankleL: 62, hipR: 77, kneeR: -115, ankleR: 38, happy: 0.35, smile: 0.75, blush: 0.6, lookX: -0.6, lookY: -0.3 },
      跳起来抓: { face: -1, expression: "使劲", neck: 29, lean: -5, lift: 187, shoulderL: 52, elbowL: 34, wristL: 0, handL: "open", shoulderR: 158, elbowR: -1, wristR: 11, handR: "grip", hipL: 25, kneeL: -55, ankleL: 30, hipR: 23, kneeR: -54, ankleR: 30, open: 0.3, lookX: -0.2, lookY: -1 },
      飘: { face: -0.55, expression: "闭眼", float: 1, lift: 60, neck: 8, lean: 5, rot: 3, shoulderL: -47, elbowL: 37, wristL: 11, handL: "open", shoulderR: 42, elbowR: 25, wristR: -6, handR: "open", hipL: -8, kneeL: -36, ankleL: 29, hipR: 4, kneeR: -17, ankleR: 26, blush: 0.4 },
      摘了围巾和手套: { scarf: false, gloves: false },
      基础模型: { coat: false, band: false, boots: false },
      呼吸眨眼: { idle: true },
      风里: { face: -1, wind: 1.6, idle: true, neck: 4, shoulderL: -5, elbowL: 16, wristL: 15, shoulderR: 8, elbowR: 18, wristR: -15, hipL: 6, kneeL: -15, ankleL: 9, hipR: 8, kneeR: -15, ankleR: 7 },
      水里漂: { face: -0.55, expression: "闭眼", float: 1, wind: 0.6, lift: 60, neck: 8, lean: 5, rot: 3, shoulderL: -47, elbowL: 37, wristL: 11, handL: "open", shoulderR: 42, elbowR: 25, wristR: -6, handR: "open", hipL: -8, kneeL: -36, ankleL: 29, hipR: 4, kneeR: -17, ankleR: 26, blush: 0.4 },
    },
    preview: {
      width: 640,
      height: 960,
      duration: 4,
      background: "#f7ede8",
      draw(ctx, t, p) {
        const gy = 880;
        ctx.fillStyle = "rgba(90,70,110,0.12)";
        ctx.beginPath();
        ctx.ellipse(320, gy, 130, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        // 抬高了（跳、飘）就缩小一点，整个人留在画面里
        chengtuo(ctx, 320, gy, Math.min(1.3, 840 / (650 + Math.max(0, p.lift))), p, t);
      },
    },
  }),
});
