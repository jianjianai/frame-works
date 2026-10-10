# code/mirrors —《mirrors》（瑕疵：0）的场景和道具

竖屏 1080×1920，和 `code/draw.ts`、`code/kid.ts`、`code/people.ts` 同一套画法，直接导入使用（例如 `import { bathroom } from "@materials/s0rrow/code/mirrors/sets"`）。每个文件末尾的 `resources` 声明了可以预览的资源，用 `resources_search` / `resource_view` 查看。

| 文件 | 内容 |
|---|---|
| `sets.ts` | **浴室夜景**（`BATH`、`bathroom`、冷色壁灯 `bathLight`、门缝暖光 `bathDoorLight`；镜子里的内容由镜头自己画）· **夜走廊落地镜**（`HALL`、`hallRoom`、镜面裁剪 `hallGlass`、`hallMirrorFrame`、`hallMirrorShadow`、灯光和月光光柱 `hallLight`、前景虚化绿植 `hallPlant`）· **飞起来的床单** `clothSheet(q)`（四角 + 顶边拱度 + 侧边 + 下摆飘动，`SHEET_ON_MIRROR` 是盖好的样子；飞行关键帧和插值见 reference/mirrors/act1.ts 的 `SHEET_KEYS` / `sheetAt`）· `hallwayNight`（盖好后的同一面墙，当虚化背景）· **教室（从前往后拍）** `CLASS`、`classroomBack`（黑板报、彩旗、钟、储物格、窗）、`classroomSun`、`deskAt(x, y, s, seed, items?)`；坐着的人：头心 y = 520 + 264·s、桌前沿 = 头 + 300·s |
| `roof.ts` | **黄昏天台**：`ROOF`、`rooftop(ctx, abs, { door })`、`roofLight`、反打 `roofReverse`、挂白猫挂件的书包 `backpack` |
| `living.ts` | **夜里的客厅**：`livingRoom(ctx, abs, { clock, day, ring })`、闹钟 `alarmClock`、`livingLight` / `livingNight`、手机镜头的虚化背景 `livingBokeh`、茶几 `coffeeTable` |
| `phoneui.ts` | 深色聊天 App：`phone`、`phoneBack`、`statusBar`、`chatScreen`（气泡、照片、「已拒绝」通话记录、对方正在输入…）、猫头像 `catAvatar`、`whiteCatFace` / `whiteCatSticker`、**视频来电** `callScreen` + `frontCamera`、**美颜 App** `beautyScreen`、`sendDialog`、自拍 `selfie`、触点 `touchDot` / `tapRing` |
| `sketchbook.ts` | 速写本（`sketchCover`、`sketchEdges`、`sketchSpiral`）；她举着本子的姿势 `holdPose(raise, hide)`、`holdTop`、`heldBook`、`bookHands`、`bookFrame` |
| `story.ts` | 主角的**胎记** `birthmark` / `MARK_AT`（看起来的中心比 MARK_AT 偏左上约 (−12, −10)）；**伪装** `disguise`；**红笔批注** `penRing`、`redNote`、`redArrow`、`penHeart`、`mapleLeaf`；糊镜子的 `newspaper`、`tape`；袖子加圆手 `sleeveHand`；`toDesign` / `px`（屏幕坐标、按设计像素的线宽） |

镜头写法（甩镜、冲镜、床单、白场转场、转焦、指尖光圈、拉开到双人镜头）在 `reference/mirrors/`。
