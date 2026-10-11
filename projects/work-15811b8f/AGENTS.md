# 示例：霓虹夜景特效

24 秒、1920×1080、30 fps，展示 PixiJS 精灵批量渲染、模糊/辉光、颜色矩阵与置换滤镜。只修改本作品 frame-works/15811b8f 与本任务新建素材库 Pixi特效。

## 素材与复用
视觉代码只从 @materials/Pixi特效/code/effects 导入：
nightCity、bokeh、rain、neonType、fireworks、rippleWipe。
六个资源均使用 defineResources/resource、zod 参数、两组 presets、engine: "pixi" 预览。
音频从 Pixi特效/code/sounds.ts 的 nightDrive、liquidSweep、sparkle 生成。
原创程序素材 CC0-1.0，无第三方下载，完整来源说明见素材库 README.md。

## 叙事与节拍
project.tempo：120 BPM，首拍0秒，4/4。
0–6秒：AFTER HOURS，夜城点灯与主标题。
6–14秒：FEEL THE CURRENT，增强雨幕。
14–20秒：LIGHT IT UP，烟花每4拍爆发，第二簇错开2拍。
20–24秒：KEEP GLOWING，回到青色夜城，23.4秒起收束。
5.5–6.5、13.5–14.5、19.5–20.5秒为液态置换转场，下层镜头在中点切换。
六个 Pixi scene 图层全程存在，特效由绝对时间控制显隐：避免短图层结束销毁 Pixi Application 时触发共享滤镜/渲染缓存问题（曾出现 geometry / clear 为 null）。实际转场仍只在三个 1 秒窗口可见。图层编排通过 layers_edit，声音通过 audio_place/audio_edit。
所有运动只读绝对时间，固定种子，不使用真实时钟、ticker 或 Math.random；资源由 scene 生命周期释放。
原创建合成配乐及音效不做 duck；使用各轨 gain 平衡。
所有修改后运行 work_check；资源逐一 resource_view；作品 preview_frames 多时间与 count 检查；交付前 version_save。

## 编辑约定
图层使用 FRAME layers_edit，文件使用 files_batch，素材使用 material_write/materials_use。不要修改锁文件或 .materials 缓存。
不要修改 s0rrow、共享素材等既有库与其他作品。临时文件与 Docker 用完清理；本任务未使用 Docker。
