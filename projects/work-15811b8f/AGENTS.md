# 示例：霓虹夜景特效

24 秒、1920×1080、30 fps，展示 PixiJS 精灵批量渲染、模糊/辉光、颜色矩阵与置换滤镜。

## 素材与复用
- 视觉代码只从素材库 Pixi特效（为本作品新建）导入：`@materials/Pixi特效/code/effects` 的 nightCity、bokeh、rain、neonType、fireworks、rippleWipe。六个资源都用 defineResources/resource 声明，zod 参数、两组 presets、engine: "pixi" 预览。
- 音频由 Pixi特效/code/sounds.ts 的 nightDrive、liquidSweep、sparkle 生成；原创合成配乐和音效不做 duck，用各轨 gain 平衡。
- 原创程序素材 CC0-1.0，无第三方下载，来源说明见素材库 README.md。

## 叙事与节拍
- project.tempo：120 BPM，首拍 0 秒，4/4。
- 0–6 秒：AFTER HOURS，夜城点灯与主标题。
- 6–14 秒：FEEL THE CURRENT，增强雨幕。
- 14–20 秒：LIGHT IT UP，烟花每 4 拍爆发，第二簇错开 2 拍。
- 20–24 秒：KEEP GLOWING，回到青色夜城，23.4 秒起收束。
- 5.5–6.5、13.5–14.5、19.5–20.5 秒是液态置换转场，下层镜头在中点切换。
- 六个 Pixi scene 图层全程存在，特效由绝对时间控制显隐：短图层结束时销毁 Pixi Application 会触发共享滤镜 / 渲染缓存的问题（曾出现 geometry / clear 为 null）。实际转场只在三个 1 秒窗口可见。
