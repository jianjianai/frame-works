// 《引力》的配角，一个人一个资源（素材 → 资源里能打开看：缩略图、预览、调朝向、表情、风、失重、脱外衣）。
// 人物配置都在 cast.ts（CAST、passerby、大叔 GLASSES_UNCLE、女学生 SCHOOLGIRL、七到十二岁的秤砣 youngChengtuo）和 cast-woman.ts（开场光里的女人）；
// 这里只登记、画预览。主角秤砣在 chengtuo.ts，基础模型在 figure.ts。
// 资源面板不运行代码读参数，所以参数在这里原样写（基础模型 figureOptions 的一部分，加上「穿外衣」，路人加 i、小时候的秤砣加 age）。
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { type Look, figure } from "./figure";
import { CAST, type CastSpec, GLASSES_UNCLE, SCHOOLGIRL, lookOf, passerby, youngChengtuo } from "./cast";
import { LIGHT_WOMAN, LIGHT_WOMAN_LOOK, LIGHT_WOMAN_LOOK_BARE } from "./cast-woman";

export const castOptions = z.object({
  face: z.number().min(-1).max(1).default(0).describe("朝向：0 正面，-1 3/4 朝画面左，1 3/4 朝画面右（中间值连续转身）"),
  headTurn: z.number().min(-1).max(1).default(0).describe("头比身体多转多少（正 = 更朝向侧面）"),
  expression: z.enum(["平常", "微笑", "笑", "哭着笑", "含泪", "忍着哭", "难过", "担心", "心疼", "惊", "吓一跳", "使劲", "坚定", "犹豫", "闭眼", "哼歌", "释然", "仰望", "低头看", "嘘"]).default("平常").describe("表情；下面几项可以在它上面再调"),
  smile: z.number().min(-1).max(1).optional().describe("嘴角：1 笑，-1 撇（不写用表情里的值）"),
  tears: z.number().min(0).max(1).optional().describe("眼泪（0..1，不写用表情里的值）"),
  lookX: z.number().min(-1).max(1).optional().describe("眼珠往左（−）右（+）看"),
  lookY: z.number().min(-1).max(1).optional().describe("眼珠往上（−）下（+）看"),
  neck: z.number().min(-60).max(60).default(0).describe("脖子：正 = 仰头（朝左时；正面时是往画面右歪头）"),
  lean: z.number().min(-60).max(100).default(0).describe("腰：正 = 往前弯"),
  shoulderL: z.number().min(-180).max(180).default(-15).describe("L 肩（画面右那只）：0 垂下；正面时往外张是负"),
  elbowL: z.number().min(-170).max(170).default(-1).describe("L 肘（相对上臂）"),
  shoulderR: z.number().min(-180).max(180).default(15).describe("R 肩（画面左那只）：0 垂下；正面时往外张是正"),
  elbowR: z.number().min(-170).max(170).default(1).describe("R 肘（相对上臂）"),
  wind: z.number().min(-2).max(2).default(0).describe("风：往画面左（−）或右（+）吹，头发、衣角跟着飘"),
  float: z.number().min(0).max(1).default(0).describe("失重：0 垂着 → 1 头发往上漂"),
  idle: z.boolean().default(false).describe("呼吸和眨眼（按时间动）"),
  coat: z.boolean().default(true).describe("穿外衣（没有外衣的人不起作用）"),
});
export type CastFigureOptions = z.input<typeof castOptions>;
export const passerbyOptions = z.object({
  face: z.number().min(-1).max(1).default(0).describe("朝向：0 正面，-1 3/4 朝画面左，1 3/4 朝画面右（中间值连续转身）"),
  headTurn: z.number().min(-1).max(1).default(0).describe("头比身体多转多少（正 = 更朝向侧面）"),
  expression: z.enum(["平常", "微笑", "笑", "哭着笑", "含泪", "忍着哭", "难过", "担心", "心疼", "惊", "吓一跳", "使劲", "坚定", "犹豫", "闭眼", "哼歌", "释然", "仰望", "低头看", "嘘"]).default("平常").describe("表情；下面几项可以在它上面再调"),
  smile: z.number().min(-1).max(1).optional().describe("嘴角：1 笑，-1 撇（不写用表情里的值）"),
  tears: z.number().min(0).max(1).optional().describe("眼泪（0..1，不写用表情里的值）"),
  lookX: z.number().min(-1).max(1).optional().describe("眼珠往左（−）右（+）看"),
  lookY: z.number().min(-1).max(1).optional().describe("眼珠往上（−）下（+）看"),
  neck: z.number().min(-60).max(60).default(0).describe("脖子：正 = 仰头（朝左时；正面时是往画面右歪头）"),
  lean: z.number().min(-60).max(100).default(0).describe("腰：正 = 往前弯"),
  shoulderL: z.number().min(-180).max(180).default(-15).describe("L 肩（画面右那只）：0 垂下；正面时往外张是负"),
  elbowL: z.number().min(-170).max(170).default(-1).describe("L 肘（相对上臂）"),
  shoulderR: z.number().min(-180).max(180).default(15).describe("R 肩（画面左那只）：0 垂下；正面时往外张是正"),
  elbowR: z.number().min(-170).max(170).default(1).describe("R 肘（相对上臂）"),
  wind: z.number().min(-2).max(2).default(0).describe("风：往画面左（−）或右（+）吹，头发、衣角跟着飘"),
  float: z.number().min(0).max(1).default(0).describe("失重：0 垂着 → 1 头发往上漂"),
  idle: z.boolean().default(false).describe("呼吸和眨眼（按时间动）"),
  coat: z.boolean().default(true).describe("穿外衣（没有外衣的人不起作用）"),
  i: z.number().int().min(0).max(7).default(0).describe("第几个路人（0–7）"),
});
export const youngOptions = z.object({
  face: z.number().min(-1).max(1).default(0).describe("朝向：0 正面，-1 3/4 朝画面左，1 3/4 朝画面右（中间值连续转身）"),
  headTurn: z.number().min(-1).max(1).default(0).describe("头比身体多转多少（正 = 更朝向侧面）"),
  expression: z.enum(["平常", "微笑", "笑", "哭着笑", "含泪", "忍着哭", "难过", "担心", "心疼", "惊", "吓一跳", "使劲", "坚定", "犹豫", "闭眼", "哼歌", "释然", "仰望", "低头看", "嘘"]).default("平常").describe("表情；下面几项可以在它上面再调"),
  smile: z.number().min(-1).max(1).optional().describe("嘴角：1 笑，-1 撇（不写用表情里的值）"),
  tears: z.number().min(0).max(1).optional().describe("眼泪（0..1，不写用表情里的值）"),
  lookX: z.number().min(-1).max(1).optional().describe("眼珠往左（−）右（+）看"),
  lookY: z.number().min(-1).max(1).optional().describe("眼珠往上（−）下（+）看"),
  neck: z.number().min(-60).max(60).default(0).describe("脖子：正 = 仰头（朝左时；正面时是往画面右歪头）"),
  lean: z.number().min(-60).max(100).default(0).describe("腰：正 = 往前弯"),
  shoulderL: z.number().min(-180).max(180).default(-15).describe("L 肩（画面右那只）：0 垂下；正面时往外张是负"),
  elbowL: z.number().min(-170).max(170).default(-1).describe("L 肘（相对上臂）"),
  shoulderR: z.number().min(-180).max(180).default(15).describe("R 肩（画面左那只）：0 垂下；正面时往外张是正"),
  elbowR: z.number().min(-170).max(170).default(1).describe("R 肘（相对上臂）"),
  wind: z.number().min(-2).max(2).default(0).describe("风：往画面左（−）或右（+）吹，头发、衣角跟着飘"),
  float: z.number().min(0).max(1).default(0).describe("失重：0 垂着 → 1 头发往上漂"),
  idle: z.boolean().default(false).describe("呼吸和眨眼（按时间动）"),
  coat: z.boolean().default(true).describe("穿外衣（没有外衣的人不起作用）"),
  age: z.number().int().min(7).max(12).default(7).describe("几岁（7–12）：头、腿、身高一年年长；十岁起穿藏青外套"),
});

/** 不穿外衣的那一份（按人物配置缓存，同一个对象才能用上 lookOf 的缓存） */
const BARE = new WeakMap<CastSpec, CastSpec>();
function bareOf(spec: CastSpec): CastSpec {
  let b = BARE.get(spec);
  if (!b) BARE.set(spec, (b = { ...spec, coat: undefined }));
  return b;
}

/**
 * 按参数画一个配角：(x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高再乘人物配置的 scale）。
 * look 不写按人物配置（lookOf）；coat: false 脱掉外衣
 */
export function castFigure(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, spec: CastSpec, options: CastFigureOptions = {}, t = 0, look?: Look) {
  const o = castOptions.parse(options);
  const sp = o.coat || !spec.coat ? spec : bareOf(spec);
  figure(ctx, x, y, s * spec.scale, o, t, look ?? lookOf(sp));
}

/** 资源预览：脚下一小块影子，站在画面下面（身高 1.1 的人头顶也在画面里） */
function stage(ctx: CanvasRenderingContext2D, t: number, p: CastFigureOptions, spec: CastSpec, look?: Look) {
  const gy = 940;
  ctx.fillStyle = "rgba(90,70,110,0.12)";
  ctx.beginPath();
  ctx.ellipse(320, gy, 120 * spec.scale, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  castFigure(ctx, 320, gy, 1.25, spec, p, t, look);
}

export const resources = defineResources({
  zhoulei: resource({
    kind: "character",
    title: "周磊",
    description: "《引力》35 岁的职员：灰蓝西装敞着怀（缺角翻领）、白衬衫、蓝领带，凌乱的短碎发、浓眉；开场第一个被她拽回来的人。脸、碎发、西装是用户照参考图手画的线稿（作品 3d80f743 的 public/ref/周磊-线稿.svg），骨架、胳膊腿和主角一样，身高 1.06。",
    tags: ["周磊", "男人", "职员", "西装", "领带", "剪纸", "骨架", "引力"],
    usage: "castFigure(ctx, x, y, s, CAST.周磊, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, CAST.周磊, pose)",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true }, "不穿外衣": { coat: false } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, CAST.周磊),
    },
  }),
  weigher: resource({
    kind: "character",
    title: "称重员",
    description: "《引力》称重的人：全城最厚的铁靴、藏蓝制服帽；也是轻的。骨架和主角一样，脸借周磊的，身高 1.1。",
    tags: ["称重员", "男人", "制服", "帽子", "铁靴", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, CAST.称重员, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, CAST.称重员, pose)",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true }, "不穿外衣": { coat: false } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, CAST.称重员),
    },
  }),
  oldzhong: resource({
    kind: "character",
    title: "老钟",
    description: "《引力》七十多岁的老人：头顶秃了、两鬓和后脑勺一圈白头发，白眉毛，圆框眼镜；棕色 V 领毛衣套浅色衬衫；每天等她的脚步声。脸、白发照参考图描的，骨架和主角一样，身高 0.96。",
    tags: ["老钟", "老人", "眼镜", "毛衣", "秃顶", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, CAST.老钟, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, CAST.老钟, pose)",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, CAST.老钟),
    },
  }),
  shitou: resource({
    kind: "character",
    title: "小石头",
    description: "《引力》7 岁的男孩：毛茸茸的黑发、头顶一根呆毛；绿色连帽外套、米白条纹 T 恤、又宽又直的牛仔裤卷着裤脚，红色帆布鞋，脚踝红绳拴着一只铃铛。脸、头发、裤腿照参考图描的；小孩的头身比（头放大 1.335、腿 0.7），身高 0.79（大人的 0.716）。",
    tags: ["小石头", "男孩", "小孩", "连帽衫", "牛仔裤", "铃铛", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, CAST.小石头, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, CAST.小石头, pose)",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true }, "不穿外衣": { coat: false } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, CAST.小石头),
    },
  }),
  shitouCoat: resource({
    kind: "character",
    title: "小石头（穿妈妈的外套）",
    description: "《引力》副歌一以后的小石头：裹着妈妈那件大一号的橘色工装外套（爸爸留下的：立领、大扣子、袖子卷了两道、下摆缝了一圈铅）。其余同小石头。",
    tags: ["小石头", "男孩", "小孩", "工装外套", "橘色", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, CAST.小石头穿妈妈的外套, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, CAST.小石头穿妈妈的外套, pose)",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true }, "不穿外衣": { coat: false } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, CAST.小石头穿妈妈的外套),
    },
  }),
  shitouMom: resource({
    kind: "character",
    title: "小石头的妈妈",
    description: "《引力》年轻的轻户：穿着丈夫留下的橘色工装外套（立领、大扣子、下摆缝了一圈铅）、米白毛衣、低马尾。脸借千斤的妈妈的，骨架和主角一样，身高 0.98。",
    tags: ["小石头的妈妈", "女人", "妈妈", "工装外套", "马尾", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, CAST.小石头的妈妈, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, CAST.小石头的妈妈, pose)",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true }, "不穿外衣": { coat: false } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, CAST.小石头的妈妈),
    },
  }),
  qianjin: resource({
    kind: "character",
    title: "千斤",
    description: "《引力》16 岁的女孩：侧分齐耳短发、黄色一字夹别住刘海；红毛衣粗罗纹领、领口翻出白衬衫领。脸是主角的，骨架和主角一样，身高 0.94。",
    tags: ["千斤", "女孩", "少女", "短发", "红毛衣", "发夹", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, CAST.千斤, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, CAST.千斤, pose)",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, CAST.千斤),
    },
  }),
  qianjinMom: resource({
    kind: "character",
    title: "千斤的妈妈",
    description: "《引力》在哑铃厂打两份工的妈妈：盘发（圆髻），紫色开衫（照参考图描的：门襟笔直、下摆刚过胯，门襟罗纹边、一排米白小扣子、左胸绣一朵小花），里面淡紫圆领。脸、盘发照参考图描的，身高 1.0。",
    tags: ["千斤的妈妈", "女人", "妈妈", "开衫", "盘发", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, CAST.千斤的妈妈, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, CAST.千斤的妈妈, pose)",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true }, "不穿外衣": { coat: false } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, CAST.千斤的妈妈),
    },
  }),
  aman: resource({
    kind: "character",
    title: "阿满",
    description: "《引力》四十多岁的压锭工：绿毛线帽、棕色工装夹克（翻领、拉链、两个带盖的胸袋、罗纹下摆）、胡茬，膝盖上打着补丁。脸借周磊的，身高 1.04。",
    tags: ["阿满", "男人", "工人", "毛线帽", "夹克", "补丁", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, CAST.阿满, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, CAST.阿满, pose)",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true }, "不穿外衣": { coat: false } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, CAST.阿满),
    },
  }),
  oldLady: resource({
    kind: "character",
    title: "老太太",
    description: "《引力》窗口的老太太（千斤用砖救下的）：花白盘发插一根发簪、白眉、皱纹，淡紫对襟盘扣褂子（立领、滚边），布鞋。脸借老钟的，身高 0.88。",
    tags: ["老太太", "老人", "女人", "盘发", "盘扣", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, CAST.老太太, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, CAST.老太太, pose)",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, CAST.老太太),
    },
  }),
  youngMan: resource({
    kind: "character",
    title: "年轻人",
    description: "《引力》周磊拽下来的年轻人：中分、粗眉，青绿连帽衫（抽绳、袋鼠兜），牛仔裤卷着裤脚。脸借周磊的，身高 1.02。",
    tags: ["年轻人", "男人", "连帽衫", "牛仔裤", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, CAST.年轻人, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, CAST.年轻人, pose)",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, CAST.年轻人),
    },
  }),
  uncle: resource({
    kind: "character",
    title: "戴眼镜的大叔",
    description: "《引力》间奏里公交站被十岁的她拽下来的大叔，高潮的人链里会回来：方框眼镜，棕色夹克（翻领、拉链、胸袋）里面一件衬衫，西裤。脸借周磊的，身高 1.04。",
    tags: ["大叔", "男人", "眼镜", "夹克", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, GLASSES_UNCLE, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, GLASSES_UNCLE, pose)",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true }, "不穿外衣": { coat: false } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, GLASSES_UNCLE),
    },
  }),
  schoolgirl: resource({
    kind: "character",
    title: "扎马尾的女学生",
    description: "《引力》间奏里学校门口被十六岁的她拽下来的女学生，高潮的人链里会回来：高马尾（粉皮筋）、碎刘海，浅蓝运动校服（白立领、拉链、袖子两道白杠）。脸是主角的，身高 0.9。",
    tags: ["女学生", "女孩", "少女", "马尾", "校服", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, SCHOOLGIRL, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, SCHOOLGIRL, pose)",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, SCHOOLGIRL),
    },
  }),
  chenMom: resource({
    kind: "character",
    title: "秤砣的妈妈",
    description: "《引力》秤砣的妈妈，只在回忆和白里出现：中分长直发，锈红长外套（大翻领、双排扣、带扣的腰带，腰下散开）、米白衬衫，光着脚。脸借千斤的妈妈的，身高 1.0。",
    tags: ["秤砣的妈妈", "女人", "妈妈", "长外套", "腰带", "长发", "光脚", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, CAST.秤砣的妈妈, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, CAST.秤砣的妈妈, pose)",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true }, "不穿外衣": { coat: false } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, CAST.秤砣的妈妈),
    },
  }),
  youngChen: resource({
    kind: "character",
    title: "小时候的秤砣",
    description: "《引力》七到十二岁的秤砣：齐耳短发、鹅黄毛衣配白色小圆领，脚上一双大得不合脚的铁靴（是妈妈的）；十岁起穿藏青外套。七岁是小孩的头身比（和小石头一样：头大、腿短、直筒裤腿），一年年长到十三岁（现在的她的头身比）；age 调年纪。十三岁以后用「秤砣」按身高缩小。",
    tags: ["秤砣", "小时候", "女孩", "小孩", "铁靴", "短发", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, youngChengtuo(age), { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, youngChengtuo(age), pose)",
    params: youngOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true }, "不穿外衣": { coat: false }, "十岁": { age: 10 }, "十二岁": { age: 12 } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, youngChengtuo(p.age)),
    },
  }),
  lightWoman: resource({
    kind: "character",
    title: "光里的女人",
    description: "《引力》开场飘在光里的女人：米白上衣外面一件浅玫瑰色长开衫（门襟罗纹、小白扣子、小贴袋），浅蓝裤子、白帆布鞋；头发是秤砣那套换成暖棕色（风里、失重像在水里一样漂），耳边一朵小白花。身高 0.98。",
    tags: ["光里的女人", "女人", "开衫", "长发", "小白花", "失重", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, LIGHT_WOMAN, { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, LIGHT_WOMAN, pose)（她的样子用 LIGHT_WOMAN_LOOK：头发是秤砣那套）",
    params: castOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true }, "不穿外衣": { coat: false }, "张手飘着": { float: 1, idle: true, shoulderL: -120, shoulderR: 120, expression: "微笑" } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, LIGHT_WOMAN, p.coat ? LIGHT_WOMAN_LOOK : LIGHT_WOMAN_LOOK_BARE),
    },
  }),
  passerby: resource({
    kind: "character",
    title: "路人",
    description: "《引力》街上的路人：八种轮着来（i 0–7），外衣七种版型（夹克、开衫、外套、工装外套、连帽衫、西装…）、上衣、发型、鞋各不相同，男人粗眉；脸借描好的几张（男人周磊、女人千斤的妈妈、秃顶老钟），骨架和主角一样，身高 0.92–1.04。",
    tags: ["路人", "男人", "女人", "群众", "剪纸", "引力"],
    usage: "castFigure(ctx, x, y, s, passerby(i), { face, expression, coat, … }, t)  // (x, y) 两脚之间的地面，s = 1 和秤砣同一个比例（身高按人物配置的 scale）；做动作：姿势用基础模型的 figurePose / 动作引擎，drawCast(ctx, passerby(i), pose)",
    params: passerbyOptions,
    presets: { "3/4 朝左": { face: -1 }, "笑": { expression: "笑" }, "哭着笑": { expression: "哭着笑" }, "风里": { wind: 1, idle: true }, "失重": { float: 1, idle: true }, "不穿外衣": { coat: false }, "路人 1": { i: 1 }, "路人 2": { i: 2 }, "路人 3": { i: 3 }, "路人 4": { i: 4 }, "路人 5": { i: 5 }, "路人 6": { i: 6 }, "路人 7": { i: 7 } },
    preview: {
      width: 640,
      height: 1000,
      duration: 4,
      background: "#f7ede8",
      draw: (ctx, t, p) => stage(ctx, t, p, passerby(p.i)),
    },
  }),
});
