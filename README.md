# 动态文字

动态文字是一套 Canvas 2D + GSAP 的 7 个参数化文字与图形资源，适合横屏、竖屏和方形知识视频。所有资源统一支持 `scale`（默认 1，旧作品原样）；新作品可用 `motionScale(width, height)` 按画布短边等比缩放，锚点按画布比例排版。

素材库 id：`动态文字`；代码：`code/motion.ts`；导入路径：`@materials/动态文字/code/motion`。

## 资源清单

| 资源 | 用途 | x/y 锚点 | 原始尺寸 / 注意事项 |
| --- | --- | --- | --- |
| kineticTitle | 逐字弹出标题 | 第一行左侧基线 | `size` / `maxWidth` 为设计单位；新多行标题显式设 `lineHeight` 倍数，例如0.9 |
| callout | 描边生长的标注 | 折线顶端高度 | 首个圆点位于 y+90；文字在 y−24 |
| morphIcon | 圆形变菱形 | 图标中心 | `size` 是图标直径；说明文字在图标下方 |
| numberCard | 滚动数字卡 | 卡片左上角 | 固定 420×310；`scale: 2` 后为 840×620 |
| pathArrow | 沿路径移动的箭头 | 路径局部原点 | 路径高度约 100；说明基线 y+168；需给箭头头部留边 |
| lowerThird | 主副字幕条 | 左上角 | 默认 `width:900`、高132；主字32、副字18；`wrap:true` 可自动换行增高 |
| quoteCard | 逐字引言与署名 | 引言区域左上角 | `size` / `maxWidth` 为设计单位；左侧/上方装饰额外留约40设计单位 |

每项 `scale` 都缩放完整资源：图形、字体、间距、圆角、线宽、裁切区域、动画位移和署名；不改变时间、数字值或 x/y 锚点。资源数量仍为 7，`motionScale` 是辅助函数。

## 一套坐标与缩放规则

- 960×540 是原资源预览窗口。资源内部使用**缩放前设计单位**；不是要求作品也使用这个画幅。
- `x/y` 使用调用方当前 Canvas 坐标，不会被资源的 `scale` 再乘一次。没有外部 transform 时就是实际画布像素；例如 `(width * 0.08, height * 0.7)`。
- `scale` 必须是大于 0 的有限数，省略等于 1。实际尺寸 = 设计尺寸 × scale；`size`、`width`、`maxWidth` 不要预先乘 scale。
- 原始 Canvas 上的推荐值：`const scale = motionScale(width, height)`，即 `Math.min(width, height) / 540`。使用 `createScene` 收到的真实 `width/height`，预览和导出会一致。
- 960×540 → 1；1920×1080 → 2；1080×1920 → 2；1080×1080 → 2；720×1280 → 4/3。横竖屏都等比缩放，不拉伸字形。
- 这个辅助函数只负责资源大小，不会把整张横屏布局挤进竖屏。位置按画布比例设置；可用的局部设计宽度 = `(width - leftMargin - rightMargin) / scale`，需要调整密度时可直接选其他正数 scale。
- 外层已经 `ctx.scale(...)` / `ctx.setTransform(...)` 的旧场景可继续使用 `scale:1`。若有意组合，最终倍率是外部变换 × 资源 scale；不要无意重复缩放。

## 横屏与竖屏示例

先 `materials_link` 关联本库，再 `materials_use` 锁定 `动态文字/code/motion.ts`。以下代码直接使用实际画布坐标，外层不另设设计画布 transform：

```ts
import { motionScale, prepareTypography, disposeResources,
  kineticTitle, numberCard, lowerThird } from "@materials/动态文字/code/motion";

// createScene({ width, height }) 内：
await prepareTypography();
const scale = motionScale(width, height);
const margin = width / 15;
const designWidth = (width - 2 * margin) / scale;

// 1920×1080：scale=2；主字64px，副字36px，条高264px。
// render(t)：
lowerThird(ctx, margin, height * 0.7, t, {
  text: "观察 · 从一个好问题开始",
  detail: "KNOWLEDGE NOTES / 01",
  width: designWidth, scale, wrap: true,
});

// 1080×1920：scale=2，designWidth=468。
// 分别放在竖屏的顶部、中部和底部；t 是资源局部秒数。
kineticTitle(ctx, margin, height * 0.19, t - 0.12, {
  text: "把复杂问题\n拆成三步。", size: 64, maxWidth: designWidth,
  lineHeight: 0.9, scale,
});
numberCard(ctx, (width - 420 * scale) / 2, height * 0.37, t - 0.7, {
  text: "让思考更清楚", value: 3, suffix: "步", scale,
});
lowerThird(ctx, margin, height * 0.73, t - 1.3, {
  text: "先记录事实，再建立解释，最后用证据检验想法。",
  detail: "观察 / 建模 / 验证", width: designWidth, wrap: true, scale,
});

// dispose() 中：
disposeResources(ctx);
```

以上横屏和竖屏是各自独立的排版片段，不要在同一画面叠画两条字幕。`width`、`maxWidth` 等仍遵守各资源原有参数范围，见 `resource_view`；特别窄的容器可降低 scale，而不是把字号缩成不可读的小字。

## 避免文字被截断

- `lowerThird` 默认保留原来的单行展开效果；长文字显式传 `wrap:true`。主副字幕均按 `width-64` 自动换行，固定原字号、自动增加条带高度，不删字、不加省略号；长西文单词也可按字素分行。
- 高度（设计单位）= `132 + (副字幕行数-1)*26 + (主字幕行数-1)*44`。调用方需为增加后的高度留出空间，画布不会自动变高。换行发生在缩放前，再整体放大，动画展开时的短暂裁切属于入场效果。
- 例：1080宽、左右各72、scale=2 → `width:468`，最终宽936。主字32×2=64px；不要传 `width:936` 又 `scale:2`。
- `kineticTitle` 新多行内容显式设 `lineHeight`（**字体度量的倍数，不是像素**；紧凑中文标题可用0.9，宽松排版可用1.25），并给 `maxWidth` 设计单位。省略 `lineHeight` 时保留旧版行距，以免改动已有作品。
- `quoteCard` 使用 `maxWidth` 自动换行，署名排在最后一行下方；标题、标注、数字卡标签宜简短，scale 本身不自动重新排版或适配任意长文本。

## 兼容性、预览与生命周期

1. 原有 7 个函数签名保留，新参数可选。默认 `scale:1`、`wrap:false`、未指定 `lineHeight` 与旧行为一致；已有作品无需改代码。
2. 字体先 `await prepareTypography()` 再绘制。使用系统 Noto Sans CJK SC / Microsoft YaHei / PingFang SC / sans-serif；跨系统需重新检查字形。
3. 动画以资源局部秒数驱动，例如 `t-0.3`；时间线按参数缓存、暂停并 `seek(t,true)`，支持倒放、重复和跳转。每项资源成对 save/restore；场景销毁时 `disposeResources(ctx)`。
4. 用 `resources_search` 的 `library:"动态文字", engine:"canvas"` 找资源；`resource_view` 的 id 为 `动态文字/code/motion.ts#资源名`，可查看所有参数与预览。`width` 工具参数只改变返回图片尺寸，不改变资源的 960×540 设计窗口；放大预览可能超出窗口，作品中应按实际画幅排版。旧 lowerThird 预览会把局部 width 限为880，完整尺寸请用作品验证。
5. 素材库改动自动保存为新版本；作品继续用锁定版本，需 `materials_use(update:true)` 显式升级，再 `work_check` 和 `preview_frames`。

## 示例与验证作品

- `frame-works/5d3d8aa5`《示例：知识讲解开场》：1920×1080，30fps，24秒，旧代码兼容性基准。
- `frame-works/d9d6a690`《测试：竖屏知识卡片》：1080×1920，30fps，10秒，统一 scale + 三项资源 + 长字幕换行。

## 素材来源与许可

- `code/motion.ts`、本 README、图形路径与几何配色：本素材库原创，无第三方下载；原创内容按 **CC0-1.0** 提供：https://creativecommons.org/publicdomain/zero/1.0/ 。
- 字体仅调用运行环境已安装的系统字体，不分发字体文件；字体及 FRAME、GSAP、zod 依赖保留各自原有许可。
- 无第三方图片、视频、模型、Lottie 或音频。

## 来源与许可

- `code/motion.ts`：来源 本任务原创 Canvas 2D / TypeScript 代码，无第三方素材下载。；许可 CC0-1.0；https://creativecommons.org/publicdomain/zero/1.0/
