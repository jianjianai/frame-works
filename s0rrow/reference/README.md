# reference — 分镜代码参考

几支片子的分镜代码，用来看镜头是怎么写的（构图、运镜、光影、转场、卡点），**只看不拷**，也不会被作品编译。

- `act1.ts`–`act6.ts`：《i have no friends》第一版（冷开场、生日书桌、闪回、砸字、查手机、秋千、群聊发送失败、蜡烛、飞行模式反转、消息洪水、分耳机）。
- `no-friends-remake/`：重置版（开头三镜 opening.ts、烛光 / 阳光 / 路灯 / 门光的光影、回忆转场、反转时颜色回到世界的波、走路时随路灯转的影子、派对、剪辑拼接 `songTime` 和结尾引导）。
- `unhappy/`：《unhappy》小狗视角（狗、雨夜、医院；timeline.ts 是小节和事件时间的写法）。
- `unhappy-chat/`：《unhappy》聊天版（双视角聊天、打字删字、教室、女主房间、上下分屏、窗户转场 street.ts）。
- `mirrors/`：《mirrors》（瑕疵：0）五幕 + 手机夜景 night.ts + 歌词层（开头 5 秒四镜：甩镜 → 飞床单 → 白场 → 冲镜；教室分层视差 + 转焦；天台逆光、奔跑定格、举本子匹配剪辑；指尖光圈 → 长拉开到双人镜头）。

导入已经改成现在的写法（`@materials/s0rrow/code/…`、`@frame/engine/…`），代码本身是当时的：
- 当时 draw.ts 里的 `BEAT` 常量现在是 `beatLength()`，`BPM` / `BEAT0` 写在作品 project.ts 的 `tempo` 里。
- 当时的 `scenes/lyrics.ts` 整个是作品自己的；现在歌词层用 `code/lyrics.ts` 的 `createLyricsScene`，作品只写歌词数据和钩子（templates/lyrics.ts）。
- `./timeline`、`./story`、`./night`、`./lib/lyrics-data` 这些是那支片子自己的文件。

几个常用的写法在这些参考里：
- `unhappy-chat/story.ts`：`phoneCloseup`（手机近景，默认 `PHONE_S` 1.0、`PHONE_CY` 910，自带手持微晃；不画手时在 touch > 0.6 的地方画半透明触点）、`typingThumbs`（两个拇指各管半边键盘、隔半拍交替按）、`tearDrops`、`editing(abs, t0, t1, start, steps)`（草稿反复修改：每步先删到公共前缀再打新字）、`hisFaceReading`（愣住时慢推 → 重拍上暖光一闪、镜头弹一下）。
- `unhappy-chat/act2.ts` 的 `shotHesitate`：犹豫不发——触点按在「发送」上、`sendHot: 1` 一直不松，左拇指从底部往上划、App 缩回主页。
- `unhappy-chat/street.ts` + `act2.ts` 的 `roomWindow`：从一个人的房间出窗、甩过街、推进对面窗户到另一个人的房间（窗户里画的就是那个房间，放大到 `Z_IN` 16.2 铺满画面时换成直接画房间；推进用三次曲线 `-1.4w³+2.4w²`，接着的推镜用 `0.9·(1-(1-p)^2.7)+0.1·p` 接上同样的速度）。
- `no-friends-remake/act1.ts` 的 `shotOldScreen`：进回忆的匹配剪辑（黑屏里的倒影 → 上午的他）。`mirrors/act1.ts` 的 `SHEET_KEYS` / `sheetAt`：飞起来的床单的关键帧。
