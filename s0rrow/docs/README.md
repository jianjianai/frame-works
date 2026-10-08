# 素材库 s0rrow

用 s0rrow 的歌做手绘涂鸦风剧情 MV 的可复用制作素材。每个函数的参数和用法见经验库 s0rrow 的「代码速查.md」，开工步骤见「下一支视频流程.md」。

## 怎么用
- 代码是**拷进作品**用的：`code/*.ts` → 作品的 `scenes/lib/`（`grain.ts`、`lyrics.ts` → `scenes/`，`sfx-audio.ts` → 根目录 `audio.ts`）。文件里的引擎导入路径（`../../../../src/engine/…`）按 `scenes/lib/` 写好，所以不要直接 `@materials/…` 导入。`code/mirrors/` 也是整组拷进 `scenes/lib/`。
- 拷完先改 `draw.ts` 顶部：`FONT_DIR`（作品内部名称）、`BPM`、`BEAT0`；`FONT_FILES` 里按需加补字的 extra 子集。
- `templates/` 是空模板，`tools/` 拷到 `production/`，`fonts/` 拷到 `public/fonts/`（按原作品用字子集化，换文案要重新取）。
- `reference/` 只看不拷（要放进作品就改成 `.ts.txt`，否则会被类型检查）。

## 内容
- `code/draw.ts`：手绘引擎（抖动线条、形状、上色、文字、节拍、镜头 `camera`/`handheld`/`easeInOut`），离屏多次绘制 `buffer`/`blit`/`filtered`，光影工具（`figureMask`、`onFigure`、`rimLight`、`rimFigure`、`castShadow`、`groundShadow`、`lightShaft`、`motes`、`bokehDisc`、`bloom`、`flicker`），运镜模糊（竖向 `smearV`、任意方向甩镜 `smear`、冲镜径向模糊 `zoomBlur`），灰色世界 `grade`，回忆效果 `oldFilm` + `linesOutsideCentre` + 转场 `oldScreenCut`，眨眼 `blinkEyes`，屏幕坐标缩放 `rootScale`。
- `code/kid.ts`：主角和女主（精细版；`elbowL/elbowR` 直接给手肘位置、跳过 IK）。`code/people.ts`：其他人（精细版，可单独覆盖一只手臂）。`code/hand.ts`：握手机的手 `heldHands`、触点 `touchDot`（不画手时用）、`tapRipple`。
- `code/phone.ts`：手机（带边框高光）、背面 `phoneBack`（可开手电）、侧键 `phoneButtons`、玻璃反光 `glassGlare`、锁屏和壁纸、聊天、动态、控制中心（飞行模式/手电/Wi‑Fi/蓝牙）、通知、角标。`code/chat.ts`：微信风格聊天（第二版）、朋友圈、资料卡、主页、开关机。`code/screens.ts`：相册、存钱、接单、便利贴。
- `code/sets.ts`：《i have no friends》的场景（重置版精细化）：卧室（串灯+拍立得、窗外月亮和云）、书桌、小蛋糕、派对喇叭、走廊和教室（窗户阳光、窗格光 `paneLight`、压暗 `shadeAround`）、回家的街、窗外街景、楼门口、大蛋糕、彩带、光斑（`bokeh`、`roomBokeh`、`streetBokeh`）、屏幕光 `screenSpill`、秋千、心形。`code/shared.ts`：生日书桌镜头 `birthdayDesk`（烛光主光、墙上的影子、月光轮廓光和光柱、吹灭后的余烬和烟）。`code/places.ts`：《unhappy》的场景（玄关、雨夜、宠物医院、女生房间、教室、街景等）。`code/dog.ts`：小狗豆豆。
- `code/mirrors/`：《mirrors》（瑕疵：0）的场景和道具（说明见该目录的 README.md）：浴室、夜走廊落地镜 + 飞的床单 `clothSheet`、从前往后拍的教室（黑板报）、黄昏天台、夜客厅（闹钟）、深色聊天 / 视频来电 / 美颜 App、速写本和举本子的姿势、胎记和红笔批注（笔圈、红字、箭头、心、枫叶）、报纸胶带、伪装。
- `code/lyrics.ts`：中英歌词层（《unhappy》版：钩子、视角翻转、两行大字幕）。`code/grain.ts`：胶片颗粒层。`code/sfx-audio.ts`：全部合成音效（四支视频的，按作品分组）。
- `templates/`：scene.ts、visual.json、歌词数据模板。`tools/`：fetch-krc.mjs（酷狗逐词时间）、fetch-fonts.mjs（字体子集）。`fonts/`：六个字体子集。
- `reference/`：《i have no friends》第一版六幕和封面；`reference/no-friends-remake/`：重置版（开头三镜 opening.ts、四幕、带剪辑拼接和结尾引导的歌词层、visual.json）；`reference/unhappy/`、`reference/unhappy-chat/`：《unhappy》两版；`reference/mirrors/`：《mirrors》（瑕疵：0）五幕 + 手机夜景 night.ts + 歌词层 + timeline + visual.json（开头 5 秒四镜：甩镜 → 飞床单 → 白场 → 冲镜；教室分层视差 + 转焦；天台逆光、奔跑定格、举本子匹配剪辑；第四幕指尖光圈 → 长拉开到双人镜头）。

## 来源与许可
- 代码和音效：为这些作品编写/合成（work-bdd5c2f8、work-d1187f37、work-afa1129b、frame-works/9586fbc4）。
- 字体：Google Fonts，均为 SIL Open Font License 1.1——Gochi Hand、Permanent Marker、ZCOOL KuaiLe（站酷快乐体）、Long Cang（龙藏体）、Noto Sans SC。
- `reference/cover.jpg`：歌曲封面，用户提供，只作画风参考，不放进成片。
- 不放歌曲、歌词数据、混音 audio.json。

## 更新记录
- 2026-10（重置版之后）：draw.ts 加光影工具、回忆效果和 `oldScreenCut`、`rimFigure`、`groundShadow`；sets/shared/phone/people 换成重置版；hand 加 `touchDot`；音效加 bellElectric/horn/floodFast；加 reference/no-friends-remake/。kid.ts 没换（重置版只把耳机改成默认戴着）。
- 2026-10-09（《mirrors》之后）：draw.ts 加 `smear`（任意方向甩镜，`smearV` 改成调用它）、`zoomBlur`、`rootScale`；kid.ts 加 `elbowL/elbowR`；sfx-audio.ts 加 `swish` 和《mirrors》的 19 种音效；加 code/mirrors/、reference/mirrors/。
