# 动态文字

动态文字是一套以 Canvas 2D 与 GSAP 制作的参数化文字和图形资源，适合科普、知识讲解、课程片头与数据解说视频。

素材库 id：`动态文字`。所有视觉资源位于 `code/motion.ts`，使用 `defineResources/resource` 声明，参数由 zod 提供默认值、取值范围和说明，并附有预设。

## 资源清单

| 资源名 | 作用 | 动效接口 | 常用预设 |
| --- | --- | --- | --- |
| kineticTitle | 逐字弹出大标题，支持换行 | splitText / drawGlyphs / stagger | 知识开场、珊瑚强调 |
| callout | 描边生长的折线与标注 | strokePath | 知识标注、浅色画面 |
| morphIcon | 圆形转为菱形的结构图标 | morphPath / CustomEase | 珊瑚结构、青柠结构 |
| numberCard | 纵向滚动数字卡片 | timeline.seek / 数值插值 | 三个步骤、示意数据 |
| pathArrow | 沿曲线路径移动的箭头 | motionPath / strokePath | 探索路径、证据路径 |
| lowerThird | 下三分之一主副字幕条 | CustomEase / 裁切展开 | 观察、收束 |
| quoteCard | 引用卡片：引言逐字出现、竖线生长、署名淡入；可调文字、署名、颜色、字号、时长、换行宽度 | splitText / drawGlyphs / stagger | 深色引言、青柠大字 |

在 `resources_search` 中以 `library: "动态文字", engine: "canvas"` 查找；在 `resource_view` 中使用 `动态文字/code/motion.ts#资源名`。每个资源可改文字、颜色、动画时长；另有字号、宽度、目标数字等专用参数。

## 用法要点

1. 用 `materials_link` 关联素材库，再用 `materials_use` 锁定 `动态文字/code/motion.ts`；作品中从 `@materials/动态文字/code/motion` 导入。
2. 在异步 `createScene` 内先 `await prepareTypography()`，然后才开始调用标题。资源预览通过 `preview.prepare` 做同样的字体准备。
3. 中文使用系统字体栈 Noto Sans CJK SC、Microsoft YaHei、PingFang SC、sans-serif。没有下载、复制或分发字体文件。不同系统的字形可能不同，换环境后要重新检查。
4. 资源使用局部设计像素。预览 960×540 只是展示窗口，不是作品画幅限制。1920×1080 作品按自己的坐标摆放，画布实际尺寸通过 `ctx.scale(width / 1920, height / 1080)` 适配。
5. 时间是资源局部秒数，例如 `kineticTitle(ctx, 120, 400, t - 0.3, {text:"保持好奇",size:128,duration:1.2})`。时间线只建一次并按参数缓存，所有动画使用暂停时间线和 `seek(t, true)`，支持跳转、倒放与重复绘制。
6. 每个资源成对 save/restore，不占用作品的绘图状态。场景销毁时调用 `disposeResources(ctx)` 杀掉该画布关联的时间线。
7. 标题的 x/y 为第一行左侧基线；callout 的 x/y 为折线顶端高度、首个圆点在其下方 90px；morphIcon 的 x/y 为中心；numberCard、lowerThird 为左上角；quoteCard 的 x/y 为引言区域左上角（引号和竖线在其左侧/上方，需留出约 40px 边距），署名自动排在最后一行下方；pathArrow 为路径局部原点。
8. 字幕和标注建议保持简短。numberCard 设计尺寸 420×310；示例数值仅展示滚动效果，不是研究数据。
9. 改素材库后，用 `materials_use update: true` 更新目标作品的锁定版本，再运行 `work_check` 与 `preview_frames`。

## 素材来源与许可

- `code/motion.ts`、本 README：本任务原创代码和文字，原始来源就是本素材库，无第三方下载。原创内容以 **CC0-1.0** 提供，许可说明：https://creativecommons.org/publicdomain/zero/1.0/ 。
- 图形路径、几何形状与配色：本任务原创 Canvas / SVG 路径数据，随上述原创代码以 CC0-1.0 提供。
- 字体：仅调用运行环境已安装的系统字体；不随素材库分发，也不改变字体原有许可。使用者负责其环境中字体的授权。
- FRAME、GSAP 与 zod：调用平台现有依赖，未复制其实现到素材库；依赖遵循各自原有许可，不属于本素材库的 CC0 声明范围。
- 没有使用第三方图片、视频、模型、Lottie、音频或下载字体，不需要额外素材署名。

## 示例作品

`frame-works/5d3d8aa5` —《示例：知识讲解开场》，1920×1080，30fps，24 秒。结构：引子（0–4.8s）→观察（4.8–9.6s）→建模（9.6–14.4s）→验证（14.4–19.2s）→结语（19.2–24s）。

## 来源与许可

- `code/motion.ts`：来源 本任务原创 Canvas 2D / TypeScript 代码，无第三方素材下载。；许可 CC0-1.0；https://creativecommons.org/publicdomain/zero/1.0/
