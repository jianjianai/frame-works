# 一颗种子的四季

在这里记录这个作品自己的需求、风格约定和制作说明（AI 每次进入作品都会读取）。

## 需求
一颗种子在雨中扎根、向阳开花，蜜蜂短暂停留，绒球成熟后把新种子交还给风。镜头从土壤近景跟随到花朵，以三拍子室内乐讲述生命循环的艺术寓言。

## 结构
- `scene.ts`：按绝对时间绘制全部画面。
- `music/score.mjs`：配乐的音符、乐句、配器、力度与声像；`music/foley.mjs`：代码生成的动作音效（固定随机种子，与画面时间对齐）。
- `audio.ts`：注册声音生成器 `score`；`audio.json` 中的两条音轨分别用它的 `music`（配乐）和 `foley`（动作音效）。
- `music/mix.json`：配乐与动作音效的增益，按 -18 LUFS 标定。修改乐谱或音效后用 `preview_audio` 重新测量并更新它。
- 乐器声音来自 `public/music/GeneralUser-GS.sf2`（GeneralUser GS 2.0.3，由 spessasynth_core 在浏览器中按乐谱合成）。加载时校验 SHA-256，不能换用其他音色库；许可原文 `public/music/GENERALUSER-LICENSE.txt` 必须随素材保留。素材来源见 `production/licenses.md`。
