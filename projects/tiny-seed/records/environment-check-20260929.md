# tiny-seed 制作环境实测

日期：2026-09-29。起始 HEAD：`e9dd24b93e8125bd00233cca1215cfe73cf0c8f3`，起始 Git 工作区干净。

## 结论

主要制作工具可用，标准 pnpm 命令入口存在共享依赖目录写权限问题。此次使用现有脚本的 Node 入口完成检查，没有安装依赖或修改公共运行时、场景与音轨配置。

## 本次实测

- 已读取根与项目 AGENTS.md、AUTHORING、NEW-PROJECT-STANDARD、AI-WORKFLOW 和项目 README。
- `pnpm --silent film context tiny-seed --json`、`pnpm --silent film help`、`pnpm project:check tiny-seed --strict`、`pnpm project:scope tiny-seed` 均在写入共享依赖的 `.bin` shim 时失败，错误为 `ERR_PNPM_CMD_SHIM_WRITE_SHIM` / Permission denied。`node_modules` 指向 `/opt/frame/node_modules`。
- 等价的 `node scripts/film.mjs context/check/scope` 正常；严格结构检查无错误、无警告，范围检查通过。
- `node scripts/film.mjs doctor` 全部通过：Node v24.21.0、Chromium、FFmpeg/FFprobe、动画库、图像工具与编码依赖已提供。但 doctor 只检查 lockfile，没有发现上述 pnpm 入口失败。
- `node scripts/film.mjs validate tiny-seed --json` 通过结构及 TypeScript 检查；项目没有专属单元测试，测试状态为 not_run。
- storyboard 在 2、9、18、26、30、35 秒生成六帧拼图，已回读检查画面与中文字幕；26 秒另导出 960 像素宽单帧，已回读。
- render 导出 16–18 秒片段：640×360、30 fps、60 帧、2 秒，H.264 视频及 48 kHz 双声道 AAC 音轨，工具校验通过；另以 FFprobe 核对并用 FFmpeg 解码音轨。平均音量 -18.6 dB，峰值 -6.5 dB。没有进行主观听感评价或完整 36 秒导出。
- `node scripts/work-tool.mjs help/assets/engines` 正常。素材列表可读；“背景”搜索无匹配，全量列表包含图像与音频，未测试复制既有素材。
- 本地 Kokoro 中文 CPU 引擎成功合成“一颗种子，正在慢慢长大。”，返回当前项目 URL；FFprobe 确认 WAV 为 24 kHz 单声道 PCM、3.775 秒。引擎列表虽含 `configured: false`，实际合成成功，不能仅依据该字段判断不可用。

## 产物

- `exports/environment-check-20260929.png` 及 `.png.json`
- `exports/environment-frame-20260929.png`
- `exports/environment-check-20260929.mp4` 及 `.mp4.render.json`
- `public/imports/8af03b58f12ce7330bf6.wav`，由素材工具自动登记于 `production/materials.json`。这是检查用配音，未接入正式音轨。

## 工作台维护建议

修复标准 pnpm 入口在预装、共享只读依赖环境中尝试写 shim 的问题，并让 doctor 检测标准命令的实际可执行性。素材库搜索可考虑增加中文语义标签；当前关键词未命中不代表素材库为空。以上涉及公共平台，本次仅记录，不越界修改。
