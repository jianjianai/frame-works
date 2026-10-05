# 超越对话｜从聊天机器人到 Agent

在这里记录这个作品自己的需求、风格约定和制作说明（AI 每次进入作品都会读取）。

## 需求
原创科技知识短片。用连续三维动画解释规则、学习、注意力、后训练、推理与智能体闭环；以不同顶尖系统的公开能力示意收束。包含逐句实测中文旁白、可关闭字幕和原创五轨混音。参考资料及能力边界见 production/sources.md。

## 约定
- 216 秒、1920×1080、60fps。Three.js 实时生成三维结构、因果过程和连续摄影机运动。
- 46 句中文旁白，字幕时间按实测旁白时长对齐（project.ts 的 subtitles），不按字数估算。
- 结尾用不同顶尖系统的 12 类公开能力做加速蒙太奇，不把所有能力混称为单一模型。来源与能力边界见 production/sources.md。

## 结构
- `scene.ts`：主场景、灯光、画布合成与标题；`visual-kit.ts`：三维构件；`visual-acts.ts`：九段绝对时间场景与旁白对应的快切时码；`camera-motion.ts`：主体跟踪、近景推进与拉远揭示。
- 声音是 `public/audio/` 中的五条文件音轨：旁白 narration、和声 harmony、低音琶音 pulse、鼓组 drums、交互音效 fx。
- 旁白文稿在 `production/story.json`（Kokoro 中文声线 zm_yunyang，语速 1.04）。改文稿后用语音合成重新生成 `public/audio/narration.mp3`，并按实测时长更新 subtitles。
- 原创配乐与音效由 `production/build-score.mjs` 确定性生成（需要 ffmpeg）：`node projects/work-0560feb5/production/build-score.mjs`，按 subtitles 给旁白让位，输出覆盖 `public/audio/` 中的四条音乐/音效。
