# Pixi特效

Pixi特效是一套可按绝对时间寻址的原创 PixiJS 夜景特效资源，适合音乐短片、夜间活动宣传、城市片头与霓虹风格品牌视频。

## 资源清单
库 id：`Pixi特效`。所有视觉资源位于 `code/effects.ts`，预览引擎均为 `pixi`，都有 zod 参数与两个预设。

| 资源 id 后缀 | 名称 | 主要能力 | 预设 |
| --- | --- | --- | --- |
| #nightCity | 霓虹夜城 | 程序天际线、湿地倒影、月环、ColorMatrixFilter | 青蓝夜色 / 粉紫午夜 |
| #bokeh | 漂浮散景 | 90 个默认加色精灵、BlurFilter、节拍包络 | 电光 / 暖夜 |
| #rain | 双层霓虹雨幕 | 100–2400 雨丝精灵、分层模糊、地面涟漪 | 细雨 / 疾雨 |
| #neonType | 脉冲霓虹字 | 亮芯、描边、BlurFilter 辉光、随拍呼吸 | 青色招牌 / 粉色双行 |
| #fireworks | 千点烟花 | 100–2200 加色粒子、解析弹道、按拍循环 | 粉蓝烟火 / 香槟火花 |
| #rippleWipe | 液态波纹转场 | 原创位移纹理、DisplacementFilter、全遮挡切换 | 青色涟漪 / 粉色热浪 |

`code/sounds.ts` 使用 defineSounds 声明：
- `#nightDrive` 夜行合成配乐，24 秒，节拍从 project.tempo 读取。
- `#liquidSweep` 液态掠过，1 秒，hit=0.5。
- `#sparkle` 微光绽放，1.6 秒，hit=0.04。

## 用法要点
1. 先 materials_link 关联，再 materials_use 锁定所需文件。导入：`import { rain, neonType } from "@materials/Pixi特效/code/effects"`。
2. 在 createPixiScene 的 build 中创建资源，将 fx.view 加到 app.stage；在返回的更新函数中调用 fx.update(t)。资源只依赖绝对时间，使用固定 seed；不使用真实时钟或累计模拟。
3. width、height 传 SceneOptions 的实际尺寸。形状按画幅缩放；1600×900 是内部设计参考。竖屏应调整 originX / originY、文字 fontSize 和构图，避免横屏排版直接拉伸。
4. neonType 的 view 原点是文字左上角，调用方设置 position；text 可换行。使用运行环境 Arial / sans-serif，无外部字体依赖。
5. rippleWipe 在 duration/2 完全遮挡画面，应在此刻切换下层场景；0 与 duration 时透明。将它作为独立 scene 图层放在最上方。
6. 素材库根据 FRAME 当前 tempo 的 pulse / beatLength 更新；不在模块顶层缓存节拍。示例作品为 120 BPM，4/4，首拍 0 秒。
7. 粒子数量在创建时固定，逐帧只更新精灵属性。每个实例独立拥有的纹理与滤镜在 view 销毁后通过微任务延迟到渲染器解绑完成再释放；Texture.WHITE 是 Pixi 的共享纹理，不由资源销毁。
8. 音效通过 audio_place 的 sound 放置。配乐整体音量与音效音量独立平衡，没有 duck。
9. 使用 resources_search(engine="pixi", library="Pixi特效") 查目录，resource_view 查看预设、参数和预览。示例：`Pixi特效/code/effects.ts#rain`。

## 素材来源与许可
全部图形、位移纹理、旋律、合成器与噪声由本任务原创代码生成；没有下载或引用第三方图片、音频、视频、模型与字体文件。原创代码、生成图形和合成声音以 CC0-1.0 提供：
https://creativecommons.org/publicdomain/zero/1.0/
无需署名，可自愿标注“FRAME Studio · Pixi特效”。

PixiJS、zod 与 FRAME 是宿主运行依赖，不作为第三方素材收录；其软件许可仍以各项目为准。实现时参考 PixiJS 官方 API（仅接口文档，没有复制素材）：
- https://pixijs.download/release/docs/filters.DisplacementFilter.html
- https://pixijs.download/release/docs/filters.ColorMatrixFilter.html
