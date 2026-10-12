# 示例：知识讲解开场

本作品是 FRAME 官方示例，演示 Canvas 2D + GSAP 在绝对时间上的动态文字与图形编排。

- 作品：frame-works/5d3d8aa5，标题「示例：知识讲解开场」。
- 画幅 1920×1080，30fps，24 秒。
- 素材库「动态文字」，从 @materials/动态文字/code/motion 导入六项资源：kineticTitle、callout、morphIcon、numberCard、pathArrow、lowerThird。
- 0–4.8s：开场「把复杂问题拆成三步」；4.8–9.6s：观察；9.6–14.4s：建模；14.4–19.2s：验证；19.2–24s：结尾「保持好奇」。
- 风格：深墨绿 #12372F、奶油白 #F2EFE4、珊瑚橙 #FF805F，编辑式排版、固定章节导航、清楚的文字层级。
- 内容：一个通用思考方法的说明，无未经证实的研究结论；滚动数字「3 轮」明确标注为演示计数。
- 所有动效来自暂停的 GSAP 时间线和 seek(t,true)，不可使用自有时钟、随机数、requestAnimationFrame 或累计状态。
- 字体使用系统中文字体，在 createScene 中 await prepareTypography() 后再 splitText。场景销毁时 disposeResources(ctx) 与 timeline.kill()。
- 视觉图层用 layers_edit；作品代码用 files_batch；素材库用 material_write；更新库后 materials_use(update:true)。
- 素材库的完整说明在它的 README.md（material_read 读取 动态文字/README.md）。
- 不修改其他作品或素材库。原创代码和图形按 CC0-1.0 提供；系统字体与 FRAME/GSAP/zod 的许可不受此声明影响。
- 本片为无旁白的视觉示例；无需声音即可阅读。不得悄悄加入第三方音乐或字体。
- 每次修改后 work_check；preview_frames 检查关键帧和整体节奏；用户要求完成后 version_save 保存。
