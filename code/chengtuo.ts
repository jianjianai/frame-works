// 秤砣：入口。基础模型在 figure.ts（所有角色共用），秤砣的配色、发型、衣服、鞋在 chengtuo-draw.ts，动作在 chengtuo-moves.ts，这里一起导出；
// 另外有一套「按关节角度摆姿势」的参数（角度用度数，基础模型的 figureOptions 加上秤砣的物品），资源面板里调的就是它。

import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { type DrawOptions, type PoseIn, figurePose } from "./figure";
import { CHENGTUO, drawChengtuo, holdBrick } from "./chengtuo-draw";

export * from "./figure";
export * from "./chengtuo-draw";
export * from "./chengtuo-moves";
export * from "./figure-motion";

/**
 * 秤砣的参数：基础模型的参数（figureOptions，朝向、表情、每个关节的角度、风、失重…）加上她身上的物品。
 * 资源面板不运行代码读参数，所以基础模型那部分在这里原样写一遍（改 figureOptions 时这里一起改）。
 */
export const chengtuoOptions = z.object({
  face: z.number().min(-1).max(1).default(0).describe("朝向：0 正面，-1 3/4 朝画面左，1 3/4 朝画面右（中间值连续转身；朝右是整套镜像）"),
  headTurn: z.number().min(-1).max(1).default(0).describe("头比身体多转多少（正 = 更朝向侧面）"),

  expression: z
    .enum(["平常", "微笑", "笑", "哭着笑", "含泪", "忍着哭", "难过", "担心", "心疼", "惊", "吓一跳", "使劲", "坚定", "犹豫", "闭眼", "哼歌", "释然", "仰望", "低头看", "嘘"])
    .default("平常")
    .describe("表情；下面几项可以在它上面再调"),
  blink: z.number().min(0).max(1).optional().describe("闭眼（0..1，不写用表情里的值）"),
  happy: z.number().min(0).max(1).optional().describe("笑眼：下眼皮推上来，1 弯成 ∩（0..1，不写用表情里的值）"),
  sad: z.number().min(0).max(1).optional().describe("难过：外眼角压下、眉毛内端抬起（0..1，不写用表情里的值）"),
  fierce: z.number().min(0).max(1).optional().describe("使劲：内眼角压下、眉毛内端压下（0..1，不写用表情里的值）"),
  wide: z.number().min(0).max(1).optional().describe("睁大眼（0..1，不写用表情里的值）"),
  smile: z.number().min(-1).max(1).optional().describe("嘴角：1 笑，-1 撇（不写用表情里的值）"),
  open: z.number().min(0).max(1).optional().describe("张嘴（0..1，不写用表情里的值）"),
  lookX: z.number().min(-1).max(1).optional().describe("眼珠往左（−）右（+）看"),
  lookY: z.number().min(-1).max(1).optional().describe("眼珠往上（−）下（+）看"),
  blush: z.number().min(0).max(1).optional().describe("腮红（0..1，不写用表情里的值）"),
  tears: z.number().min(0).max(1).optional().describe("眼泪（0..1，不写用表情里的值）"),
  squint: z.number().min(0).max(1).optional().describe("眯眼：下眼皮推上来一点（0..1，不写用表情里的值）"),
  round: z.number().min(0).max(1).optional().describe("小圆嘴：惊讶、「哦」（0..1，不写用表情里的值）"),
  teeth: z.number().min(0).max(1).optional().describe("咬紧牙（0..1，不写用表情里的值）"),
  wobble: z.number().min(0).max(1).optional().describe("嘴发抖：忍着哭（0..1，不写用表情里的值）"),

  neck: z.number().min(-60).max(60).default(0).describe("脖子：正 = 仰头（朝左时；正面时是往画面右歪头）"),
  lean: z.number().min(-60).max(100).default(0).describe("腰：正 = 往前弯（正面时是往画面左歪）"),
  rot: z.number().min(-180).max(180).default(0).describe("整个人绕胯转（躺下、倒过来）"),

  shoulderL: z.number().min(-180).max(180).default(-15).describe("L 肩：0 垂下；正面时往外张是负"),
  elbowL: z.number().min(-170).max(170).default(-1).describe("L 肘（相对上臂）"),
  wristL: z.number().min(-120).max(120).default(15).describe("L 手腕（相对前臂）"),
  handL: z.enum(["relax", "open", "fist", "grip", "point", "pinky", "flat"]).default("relax").describe("L 手形：relax 放松、open 张开、fist 握拳、grip 抓住东西、point 伸一根手指、pinky 拉钩、flat 平托"),
  layerL: z.enum(["auto", "front", "back"]).default("auto").describe("L 手臂画在身体前面还是后面（auto：3/4 时远侧的在后）"),
  shoulderR: z.number().min(-180).max(180).default(15).describe("R 肩：0 垂下；正面时往外张是正"),
  elbowR: z.number().min(-170).max(170).default(1).describe("R 肘（相对上臂）"),
  wristR: z.number().min(-120).max(120).default(-15).describe("R 手腕（相对前臂）"),
  handR: z.enum(["relax", "open", "fist", "grip", "point", "pinky", "flat"]).default("relax").describe("R 手形：relax 放松、open 张开、fist 握拳、grip 抓住东西、point 伸一根手指、pinky 拉钩、flat 平托"),
  layerR: z.enum(["auto", "front", "back"]).default("auto").describe("R 手臂画在身体前面还是后面"),

  hipL: z.number().min(-150).max(150).default(-6).describe("L 胯：0 腿竖直；往前抬是正"),
  kneeL: z.number().min(-170).max(170).default(-1).describe("L 膝（相对大腿）：往后弯是负"),
  ankleL: z.number().min(-90).max(90).default(7).describe("L 脚（相对小腿）：小腿竖直时 0 = 脚放平"),
  thighL: z.number().min(0.4).max(1).default(1).describe("L 大腿的长度比例：正面蹲下、大腿朝镜头伸出来时压短"),
  hipR: z.number().min(-150).max(150).default(7).describe("R 胯"),
  kneeR: z.number().min(-170).max(170).default(-1).describe("R 膝（相对大腿）"),
  ankleR: z.number().min(-90).max(90).default(-6).describe("R 脚（相对小腿）"),
  thighR: z.number().min(0.4).max(1).default(1).describe("R 大腿的长度比例"),

  ground: z.boolean().default(true).describe("脚踩地：按腿的角度把低的那只脚放到地面上（关掉时胯停在站着的高度）"),
  lift: z.number().min(-300).max(600).default(0).describe("再往上抬多高（跳起来、飘着；全身约 590 高）"),
  float: z.number().min(0).max(1).default(0).describe("失重：0 垂着 → 0.5 没有重量 → 1 头发、围巾都往上漂，像在水里（连续过渡，和风一起算）"),
  wind: z.number().min(-2).max(2).default(0).describe("风：大小和方向，往画面左（−）或右（+）吹；头发、围巾跟着一阵一阵地飘（4 秒一个循环）"),
  idle: z.boolean().default(false).describe("呼吸和眨眼（按时间动）"),
  line: z.number().min(0.4).max(2).default(1).describe("描边粗细倍数（特写时调细）"),

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
  const items = { scarf: o.scarf, gloves: o.gloves, coat: o.coat, band: o.band, boots: o.boots, bricks: o.bricks };
  return figurePose(o, t, CHENGTUO, items);
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
      "《引力》的女主秤砣：19 岁，黑色齐刘海长直发，藏青外套（袖子卷到小臂、肩头铆钉）、左臂红袖标、米白毛衣、深灰裤袜、插着砖的生锈铁靴（麻绳、铆钉），芥末黄围巾、藏青手套。二维骨架剪纸画风（深色描边、平涂、右下一道阴影），建在「基础模型」上（骨架、身体、脸和表情、转身都是基础模型的，她只换了配色、发型、衣服、鞋）。正面和 3/4 连续转身；表情 10 种并可细调眼皮、眉毛、嘴；外套、袖标、铁靴、围巾、手套都可以单独脱掉，靴子里、手里可以插砖、拿砖；姿势按每个关节的角度摆，脚自动踩地；头发、刘海、围巾随风一阵一阵地飘（4 秒循环），失重从垂着到漂起来连续过渡、和风联动。",
    tags: ["秤砣", "女主", "少女", "长发", "围巾", "外套", "铁靴", "袖标", "剪纸", "骨架", "引力"],
    usage:
      "chengtuo(ctx, x, y, s, { face, expression, shoulderL, elbowL, …, coat, band, boots, bricks, scarf, gloves }, t)  // (x, y) 两脚之间的地面，s = 1 全身约 590 高。动作：walk / run / jumpGrab / kneelGive / greet / patHead / float / stand 返回 { pose, x }，translate(x0 + x·s, 地面) 后 drawChengtuo(ctx, pose)；姿势表 POSES（角度用度），自己写动作用 playMove(关键帧, t)",
    params: chengtuoOptions,
    presets: {
      站: { face: -1, hipL: 7, kneeL: -9, ankleL: 2, hipR: -4, kneeR: -2, ankleR: 6, shoulderL: -5, elbowL: 14, wristL: 8, shoulderR: 7, elbowR: 16, wristR: -4, lean: 2 },
      仰头: { face: -1, hipL: 7, kneeL: -9, ankleL: 2, hipR: -4, kneeR: -2, ankleR: 6, shoulderL: -2, elbowL: 14, wristL: 8, shoulderR: 10, elbowR: 16, wristR: -4, lean: -3, neck: 30, expression: "仰望" },
      "蹲（起跳前）": { face: -1, hipL: 66, kneeL: -112, ankleL: 46, hipR: 52, kneeR: -104, ankleR: 52, lean: 34, neck: 34, shoulderL: -46, elbowL: 18, wristL: 10, shoulderR: -34, elbowR: 22, expression: "使劲", lookY: -0.9 },
      空中抓住: { face: -1, hipL: 34, kneeL: -62, ankleL: -2, hipR: 8, kneeR: -40, ankleR: -8, lean: -6, neck: 30, shoulderL: 75, elbowL: 35, wristL: 10, handL: "open", shoulderR: 168, elbowR: 4, wristR: 6, handR: "grip", lift: 230, expression: "使劲", lookY: -1 },
      落地: { face: -1, hipL: 46, kneeL: -70, ankleL: 24, hipR: 30, kneeR: -60, ankleR: 30, lean: 32, neck: 18, shoulderL: 30, elbowL: 40, handL: "open", shoulderR: 150, elbowR: 10, handR: "grip", expression: "使劲", lookY: -0.6 },
      "单膝跪·掏砖": { face: -1, hipL: 78, kneeL: -84, ankleL: 6, hipR: -12, kneeR: -98, ankleR: 55, lean: 32, neck: -22, shoulderL: 18, elbowL: 42, wristL: -10, handL: "grip", shoulderR: 24, elbowR: 40, expression: "平常", lookY: 0.8 },
      递砖: { face: -1, hipL: 78, kneeL: -84, ankleL: 6, hipR: -12, kneeR: -98, ankleR: 55, lean: 8, neck: 10, shoulderL: 72, elbowL: 12, wristL: -22, handL: "flat", shoulderR: 18, elbowR: 34, expression: "微笑", lookX: -0.4, lookY: -0.3, bricks: 1, brickL: true },
      半蹲: { face: 0, shoulderL: -18, elbowL: 15, wristL: 9, shoulderR: 18, elbowR: -15, wristR: -9, hipL: -54, kneeL: 74, ankleL: -20, hipR: 54, kneeR: -74, ankleR: 20, thighL: 0.52, thighR: 0.52 },
      抱臂: { face: 0, shoulderL: -17, elbowL: 115, wristL: -14, shoulderR: 17, elbowR: -99, wristR: 6 },
      挥手: { face: -1, hipL: 7, kneeL: -9, ankleL: 2, hipR: -4, kneeR: -2, ankleR: 6, shoulderL: -4, elbowL: 16, wristL: 8, shoulderR: 138, elbowR: 38, wristR: 8, lean: 2, neck: -8, handR: "open", expression: "微笑", lookX: -0.4, lookY: -0.5 },
      弯腰摸头: { face: -1, hipL: 16, kneeL: -14, ankleL: -2, hipR: -6, kneeR: -10, ankleR: 16, shoulderL: 62, elbowL: 18, wristL: -36, shoulderR: -14, elbowR: 22, wristR: -4, lean: 24, neck: -14, handL: "flat", expression: "微笑", lookY: 0.7 },
      拽: { face: -1, hipL: 32, kneeL: -44, ankleL: 12, hipR: -18, kneeR: -26, ankleR: 44, lean: -16, neck: 18, shoulderL: 168, elbowL: 14, handL: "grip", shoulderR: 160, elbowR: 20, handR: "grip", expression: "使劲", lookY: -0.8 },
      抱住: { face: -1, hipL: 16, kneeL: -38, ankleL: -13, hipR: 4, kneeR: -24, ankleR: -20, lean: 14, neck: -16, shoulderL: 34, elbowL: 112, wristL: 20, handL: "relax", shoulderR: 46, elbowR: 118, handR: "relax", lift: 120, expression: "心疼" },
      坐: { face: -1, hipL: 86, kneeL: -76, ankleL: -6, hipR: 80, kneeR: -96, ankleR: 20, lean: 8, neck: -4, shoulderL: 34, elbowL: 40, wristL: 10, shoulderR: 30, elbowR: 44, lookX: -0.4, lookY: 0.2 },
      写字: { face: -1, hipL: 84, kneeL: -86, ankleL: 2, hipR: 80, kneeR: -84, ankleR: 4, lean: 22, neck: -20, shoulderL: 48, elbowL: 84, wristL: -18, handL: "grip", shoulderR: 44, elbowR: 78, handR: "flat", expression: "平常", lookY: 0.9 },
      嘘: { face: -1, hipL: 7, kneeL: -9, ankleL: 2, hipR: -4, kneeR: -2, ankleR: 6, shoulderL: 24, elbowL: 142, wristL: -10, shoulderR: 7, elbowR: 16, wristR: -4, lean: 2, neck: -4, handL: "point", expression: "嘘", lookX: -0.5 },
      拉钩: { face: -1, hipL: 12, kneeL: -12, ankleL: 0, hipR: -4, kneeR: -2, ankleR: 6, shoulderL: 46, elbowL: 50, wristL: -10, shoulderR: 7, elbowR: 16, wristR: -4, lean: 8, neck: -8, handL: "pinky", expression: "心疼", lookY: 0.5 },
      从楼顶跳下: { face: -1, rot: -38, hipL: -14, kneeL: -40, ankleL: 14, hipR: -30, kneeR: -20, ankleR: 10, lean: 4, neck: 30, shoulderL: 150, elbowL: 10, handL: "open", shoulderR: 140, elbowR: 14, handR: "open", lift: 200, expression: "使劲" },
      倒着睡: { face: -1, rot: -90, ground: false, hipL: 4, kneeL: -8, ankleL: -16, hipR: 0, kneeR: -4, ankleR: -16, lean: 0, neck: -4, shoulderL: 8, elbowL: 14, shoulderR: 10, elbowR: 12, expression: "闭眼", float: 1, boots: false },
      弯腰握手: { face: -1, hipL: 24, kneeL: -46, ankleL: -18, hipR: 12, kneeR: -34, ankleR: -23, lean: 54, neck: -24, shoulderL: 74, elbowL: 6, wristL: -8, handL: "grip", shoulderR: 30, elbowR: 40, handR: "relax", lift: 160, float: 0.5, expression: "哭着笑", lookY: 0.9, boots: false },
      飘: { face: -0.5, hipL: -6, kneeL: -40, ankleL: -4, hipR: 3, kneeR: -22, ankleR: -26, lean: 4, neck: 9, rot: 3, shoulderL: -44, elbowL: 40, wristL: 12, handL: "open", shoulderR: 46, elbowR: 28, wristR: -8, handR: "open", float: 1, lift: 70, expression: "闭眼", boots: false, bricks: 0 },
      "3/4 朝右": { face: 1, hipL: 7, kneeL: -9, ankleL: 2, hipR: -4, kneeR: -2, ankleR: 6, shoulderL: -5, elbowL: 14, wristL: 8, shoulderR: 7, elbowR: 16, wristR: -4, lean: 2 },
      水里漂: { face: -0.5, hipL: -6, kneeL: -40, ankleL: -4, hipR: 3, kneeR: -22, ankleR: -26, lean: 4, neck: 9, rot: 3, shoulderL: -44, elbowL: 40, wristL: 12, handL: "open", shoulderR: 46, elbowR: 28, wristR: -8, handR: "open", float: 1, lift: 70, expression: "闭眼", boots: false, bricks: 0, wind: 0.6 },
      风里: { face: -1, hipL: 7, kneeL: -9, ankleL: 2, hipR: -4, kneeR: -2, ankleR: 6, shoulderL: -5, elbowL: 14, wristL: 8, shoulderR: 7, elbowR: 16, wristR: -4, lean: 2, wind: 1.6, idle: true },
      毛衣光脚: { coat: false, band: false, boots: false },
      摘了围巾和手套: { scarf: false, gloves: false },
      呼吸眨眼: { idle: true },
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
