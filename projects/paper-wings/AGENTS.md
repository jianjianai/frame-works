# 风的邮差

在这里记录这个作品自己的需求、风格约定和制作说明（AI 每次进入作品都会读取）。

## 需求
纸飞机离开山间小镇，穿过树林与海湾，在灯塔下折回信封、落入信箱。钢琴与木管展开旅程，海风、投递与亮灯共同完成结尾。

## 结构
- `scene.ts`：按绝对时间绘制全部画面。
- `public/art/`：项目原创的分层插画，`scene.ts` 用 Pixi 做视差镜头和路径运动。
- `music/score.mjs`：配乐的音符、乐句、配器、力度与声像；`music/foley.mjs`：代码生成的动作音效（固定随机种子，与画面时间对齐）。
- `audio.ts`：注册声音生成器 `score`；`audio.json` 中的两条音轨分别用它的 `music`（配乐）和 `foley`（动作音效）。
- `music/mix.json`：配乐与动作音效的增益，按 -18 LUFS 标定。修改乐谱或音效后用 `preview_audio` 重新测量并更新它。
- 乐器声音来自 `public/music/GeneralUser-GS.sf2`（GeneralUser GS 2.0.3，由 spessasynth_core 在浏览器中按乐谱合成）。加载时校验 SHA-256，不能换用其他音色库；许可原文 `public/music/GENERALUSER-LICENSE.txt` 必须随素材保留。素材来源见 `production/licenses.md`。
