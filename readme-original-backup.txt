Lottie动效是一套原创 CC0 的轻快互动贴纸与 Canvas 组件，适合竖屏短视频开场、点赞引导、加载反馈和结尾确认。

# 资源清单

| 文件 / 资源 | 规格 | 用途 |
|---|---|---|
| lottie/spark-star.json | 512×512，3 秒，30 fps | 弹跳八角笑脸星星，开场贴纸 |
| lottie/heart-pop.json | 512×512，3 秒，30 fps | 心动弹出与短射线，点赞贴纸 |
| lottie/check-draw.json | 512×512，3 秒，30 fps | 圆形徽章和描边勾选 |
| lottie/orbit-loader.json | 512×512，3 秒，30 fps | 八段环形加载 |
| lottie/color-wipe.json | 1080×1920，1.2 秒，30 fps | 黑、珊瑚红、黄绿三色全屏擦拭 |
| code/widgets.ts#likeCounter | Canvas，800×280 | 参数化点赞文案、计数起止、增长时间、配色 |
| code/widgets.ts#loadingCard | Canvas，800×280 | 参数化加载文案、总时长、速度、配色 |
| code/widgets.ts#successChip | Canvas，800×280 | 参数化完成提示、副文案、配色 |

所有 JSON 只有形状与关键帧；无表达式、文字图层、外部图片、外部网络引用。透明背景；描边统一，适用于奶油白、黑色和荧光黄绿底色。

# 用法要点

1. 用 materials_link 关联本库，用 materials_use 锁定所需代码和 JSON 版本。引用地址为 materials/Lottie动效/lottie/文件名.json。
2. JSON 可直接放入 visual.json 的 lottie 图层。512×512 贴纸使用 fit: contain，并按画幅配置 transform。当前原生 Lottie 图层先按整幅作品生成 canvas：在 1080×1920 中，方形贴纸会带上下透明留边，本示例用 crop: { x: 0, y: 0.21875, width: 1, height: 0.5625 } 去掉留边后再放进方形图层框（其他画幅需要按实际宽高重新算）。竖屏 color-wipe 使用全屏 contain 或 fill，切镜时刻设在其 0.6 秒处。
3. 三秒贴纸可设 loop: 3；offset 为素材起始秒数，rate 为播放速度。非循环 check 建议保留完成帧；原生图层长度不要让素材时间超过 3 秒，或用极低 rate 保持。代码 successChip 已将结束时间限制在最后有效帧。
4. 转场 color-wipe 的图层长度用 1.2 秒，rate: 1；在素材中间遮满画面时切换下层场景。它是覆盖式转场，不要求图层蒙版功能。
5. 组件使用 createLottieScene 加载 JSON，再用 render(t) 定位、drawImage 合成。创建只做一次，场景退出必须 dispose；计数与进度完全由 t 推导，可重复、倒放、任意跳转。
6. 组件设计尺寸 800×280，内部等比适配调用者的 SceneOptions。可作为局部横向卡片摆进竖屏画面；不要拉伸成整幅。参数由 zod 校验，资源目录中可预览并切换 presets。
7. 使用系统无衬线 / Noto Sans CJK SC 字体，库不捆绑字体文件。中文实机外观以运行环境字体为准。最长文案限制在 schema 中。
8. 修改素材后，用 materials_use update: true 更新作品所锁版本，再 work_check 和 preview_frames。

```ts
import { createLikeCounter } from "@materials/Lottie动效/code/widgets";
const card = await createLikeCounter(
  { width: 800, height: 280, quality: "standard" },
  { label: "喜欢就点个赞", from: 1240, to: 1280, seconds: 1.6 }
);
// 在父 Scene.render(t) 中：
await card.render(t);
ctx.drawImage(card.canvas, 100, 1400, 880, 308);
// 父 Scene.dispose() 中：card.dispose()
```

# 素材来源与许可

本库全部 5 个 Lottie JSON、Canvas 组件代码和文档均由本仓库原创，CC0；没有下载第三方素材，没有署名义务。原创来源：FRAME Studio 官方示例「Lottie 动效贴纸」制作任务。material_write 的 source 写“本仓库原创（FRAME Studio 官方示例）”，license 写“本仓库原创，CC0”。CC0 法律文本：https://creativecommons.org/publicdomain/zero/1.0/ 。

运行依赖 FRAME、zod 和平台已有的 Lottie 播放器；它们不是本库新增分发的素材，继续适用各自原有许可。

## 来源与许可
- `lottie/orbit-loader.json`：来源 本仓库原创（FRAME Studio 官方示例）；许可 本仓库原创，CC0
