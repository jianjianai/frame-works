# 试试水 · 工程说明

工程 id：`work-71cf91d0`。文件修改范围：`projects/work-71cf91d0/`。

未显式指定 renderer 时，新工程是空白合成，不预选 2D 或 3D 引擎，也不指定内容、风格或制作方法。当前 renderer 以工程 context 为准。先了解用户需求，再选择已有框架、组合素材或编写项目场景；目录和示例顺序不代表推荐优先级。

## 快速接手

```sh
pnpm --silent film context work-71cf91d0 --json
pnpm --silent film capabilities --json
pnpm --silent film capabilities --id <capability-id> --json
pnpm --silent film reference <reference-name> --json
```

平台 AI 任务先运行 `node scripts/work-tool.mjs context`；`node scripts/work-tool.mjs capabilities` 返回同一份能力目录，可传 category/query/id JSON 筛选。MCP 先读作品 context，再用 `frame_capabilities` 按需读取详情。接口和操作参数用 `film describe` 或 `frame_tool_describe` 查询，不依靠旧工具清单猜测支持范围。

`context.authority` 标明当前权威文件及 SHA-256。已声明的 `visual.json`、`audio.json` 分别拥有 Canvas 合成与混音；Remotion 的画面根仍是 React 入口，visual.json 只有通过 FrameScene 显式连接才会显示。未声明音频文档的工程使用 `project.ts` 的 audioTracks。导入素材不等于已接入画面或声音，应把返回 URL 接到相应文档或场景代码。音频生成器仍需项目模块注册和实际实现。

Canvas/PixiJS/Three.js/Babylon.js/Lottie 场景可进入 Canvas 合成；Remotion 的 React/DOM 组件必须作为根，通过 FrameScene 嵌入其他场景，不能直接当成 visual.json 的 Canvas 图层。已有空白工程可以按接入指南修改本项目入口；不要对已有 id 重跑 new 或覆盖用户内容。

## 工程结构

| 路径 | 用途 |
|---|---|
| `project.ts` | 静态元数据、尺寸、时长、音轨与加载入口 |
| `scene.ts` | 绝对时间场景入口，可注册项目内多个场景模块 |
| `visual.json` | 默认合成的权威片段数据；通过 loadVisual 加载；程序场景可无此文档 |
| `composition.tsx` | 选择 Remotion 时的 React 根组件及 loadRemotion 入口 |
| `audio.json` | 可选的权威多轨混音文档，通过 loadAudioDocument 声明 |
| `audio.ts` | 可选生成器；通过 loadAudio 加载的模块导出 generators，与文件音频可混用 |
| `public/` | 运行素材，URL 为 films/work-71cf91d0/；资源索引属于本项目 |
| `production/` | 原始材料、参数、来源和许可；brief.md 保存需求 |
| `records/` | 修改记录、验证报告、审查结论 |
| `scripts/`、`tests/` | 本项目的工具和测试 |
| `exports/`、`.cache/` | 忽略的导出结果和临时文件 |

## 可用能力与接入边界

默认工程为空白合成，不预选 2D/3D 框架、内容、风格或制作方法。根据作品需要自主选型；下列能力可组合使用，目录顺序不表示推荐优先级。

| 能力 | 已有接入 | 用法与边界 |
| --- | --- | --- |
| 画面与合成 | 空白合成、Remotion、Canvas 2D、PixiJS、Three.js、Babylon.js、Lottie Canvas | 程序场景按共享绝对时间渲染；空白合成组织图层，Remotion 使用 React 根组件。 |
| 素材 | 视频素材、图片素材、图像序列、纯色图层 | visual.json 的素材源或程序场景资源；视频编码先探测，图像序列需帧数组和 fps。 |
| 动画辅助库 | GSAP、Flubber | GSAP 用于属性/时间线，Flubber 用于路径形变；均不是 renderer，须由场景按绝对时间驱动。 |
| 音频 | 文件音频；Web Audio、Tone.js、PCM Worker / WASM、SoundFont / MIDI、项目自定义生成器 | 项目提供素材、合成函数、Worker/WASM 或 SoundFont/乐谱；在 loadAudio 加载的模块中导出 generators 注册生成器，标签不自动生成内容。 |
| 音频处理器 | 增益、声像、均衡 / 滤波、压缩、峰值保护、延迟、混响、失真、立体声宽度、旁白避让 | audio.json 的轨道、总线和主输出可配置处理链；支持片段、循环、淡化、变速和音量自动化。 |

visual.json 可混合输出 Canvas 的程序场景、Lottie 和媒体。原生 Remotion DOM 不能放入 Canvas 合成图层；使用 Remotion 为根，通过 FrameScene 嵌入其他 Frame 场景。Remotion 组件音频与 Frame 音轨分别管理，导出统一混合一次。

所有模块遵守同一绝对时间和释放协议。适配器不把任意第三方库自动变成可跳转/可离线导出的引擎；具体动画状态、跨切点延音和 WASM 初始化由项目实现。实际编解码、GPU 和浏览器导出能力仍需在运行环境验证。

能力目录：pnpm --silent film capabilities --json；MCP：frame_capabilities；Agent：node scripts/work-tool.mjs capabilities。可用 category、query、id 定位详情，再通过 film reference 读取对应接口说明（composition、remotion、audio-v7、audio、authoring）。

## 修改、验证与输出

项目可以使用共享依赖和公开引擎接口；不修改共享引擎、UI、配置、依赖或其他项目，缺少公共能力时提出维护需求。场景按共同绝对时间绘制，公共播放器处理取消，初始化失败和 dispose 释放本实例资源。接口要求管理工程与运行兼容性，不规定创作方法或风格。

```sh
pnpm film check work-71cf91d0 --strict
pnpm film scope work-71cf91d0
pnpm film dev work-71cf91d0
pnpm film frame work-71cf91d0 --time 0
pnpm --silent film test-e2e work-71cf91d0 --json
pnpm film storyboard work-71cf91d0
pnpm film render work-71cf91d0 --width 1280
```

GUI、CLI、MCP 共用文档编辑操作及 SHA-256 检查；冲突时重新读取，先用 dry-run 查看改动。检查只读，视频/单帧默认拒绝覆盖，输出在本项目 exports/。构建或生成报告不等于已完成视听验收，按实际检查范围报告结果。

完整接入与限制见 [能力指南](../../docs/CAPABILITIES.md)、[合成](../../docs/COMPOSITION.md)、[Remotion](../../docs/REMOTION.md)、[音频 V7](../../docs/AUDIO-V7.md)、[接口](../../docs/AUTHORING.md)。工具与工作流见 [AI-WORKFLOW](../../docs/AI-WORKFLOW.md)、[CREATOR-WORKFLOW](../../docs/CREATOR-WORKFLOW.md)。

语音服务见 [SPEECH](../../docs/SPEECH.md)。`node scripts/work-tool.mjs engines` 查询已配置的语音服务和声线，与视觉框架目录不同；优先复用已配置服务，无需把凭据放进作品。
