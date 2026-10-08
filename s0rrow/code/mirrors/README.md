# code/mirrors —《mirrors》（瑕疵：0）的场景和道具

竖屏 1080×1920，和 `code/draw.ts`、`code/kid.ts`、`code/people.ts` 同一套画法。用法和库里其他代码一样：**整个拷进作品的 `scenes/lib/`**（和 draw/kid/people 放在一起），相互之间用 `./draw` `./kid` `./story` `./phoneui` 引用，引擎路径（`../../../../src/engine/...`）按 `scenes/lib/` 的深度写好了。需要库里 draw.ts 的 `rootScale`（story.ts 的 `px`/`toDesign` 用）和 kid.ts 的 `elbowL/elbowR`（2026-10-09 已加进库）。

| 文件 | 内容 |
|---|---|
| `sets.ts` | **浴室夜景**（`BATH`、`bathroom`、`bathLight` 冷色壁灯、`bathDoorLight` 门缝暖光；镜子内容由镜头自己画）· **夜走廊落地镜**（`HALL` 坐标、`hallRoom` 墙纸/护墙板/地板/窗外月亮和小城灯火/纱帘/壁灯、`hallGlass` 镜面裁剪、`hallMirrorFrame`、`hallMirrorShadow`、`hallLight` 灯光+月光光柱、`hallPlant` 前景虚化绿植）· **飞起来的床单** `clothSheet(q)`（四角 + 顶边拱度 + 侧边 + 下摆飘动，`SHEET_ON_MIRROR` 盖好的样子；关键帧和 Catmull-Rom 插值见 reference/mirrors/act1.ts 的 `SHEET_KEYS`/`sheetAt`）· `hallwayNight`（盖好后的同一面墙，当虚化背景）· **教室（从前往后拍）**`CLASS`、`classroomBack`（黑板报、彩旗、钟、储物格、窗）、`classroomSun`、`deskAt(x, y, s, seed, items?)`；坐着的人：头心 y = 520 + 264·s、桌前沿 = 头 + 300·s |
| `roof.ts` | **黄昏天台**：`ROOF`、`rooftop(ctx, abs, {door})`（栏杆、小城、夕阳、楼梯间的门）、`roofLight`、`roofReverse`（反打：楼梯间在阳光里）、`backpack`（挂白猫挂件的书包） |
| `living.ts` | **夜里的客厅**：`livingRoom(ctx, abs, {clock, day, ring})`（沙发、糊报纸的圆镜子、落地灯、窗和月亮、边几）、`alarmClock`（指针按小时数）、`livingLight`/`livingNight`、`livingBokeh`（手机镜头的虚化背景）、`coffeeTable` |
| `phoneui.ts` | 深色聊天 App：`phone`、`phoneBack`、`statusBar`、`chatScreen`（气泡、照片、「已拒绝」通话记录、对方正在输入…）、头像 `catAvatar`（白猫/背对的黑猫）、`whiteCatFace`/`whiteCatSticker`、**视频来电** `callScreen` + `frontCamera`（前置摄像头里是自己的脸）、**美颜 App** `beautyScreen`（祛斑滑条、「瑕疵：1→0」）、`sendDialog`、自拍 `selfie`、触点 `touchDot`/`tapRing` |
| `sketchbook.ts` | 速写本（`sketchCover` 带白猫贴纸和小枫叶、页边、线圈）；她举着本子的姿势 `holdPose(raise, hide)`、`holdTop`、`heldBook`、圆手 `bookHands` |
| `story.ts` | 主角的**胎记** `birthmark` / `MARK_AT`（看起来的中心比 MARK_AT 偏左上约 (−12, −10)）；**红笔批注** `penRing`（一圈多一点的笔圈）、`redNote`（Long Cang 写字动画）、`redArrow`、`penHeart`、`mapleLeaf`；`newspaper`、`tape`（糊镜子）；**伪装** `disguise`（遮瑕/口罩/墨镜/帽子，可以单独移开）；袖子+圆手 `sleeveHand`；`toDesign`/`px`（屏幕坐标、按设计像素的线宽） |

镜头写法（甩镜、冲镜、床单、白场转场、转焦、指尖光圈、拉开到双人镜头）在 `reference/mirrors/`。经验在经验库 s0rrow 的「手绘涂鸦风格.md」。
