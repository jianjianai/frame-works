# s0rrow

用 s0rrow 的歌做手绘涂鸦风剧情 MV 的可复用素材：角色、场景、道具、手机界面、效果和转场、中英歌词层、颗粒层、合成音效和字体。

## 怎么用

- **直接导入，不要拷进作品**：`import { drawKid } from "@materials/s0rrow/code/kid"`。保存版本时作品锁定用到的版本，之后素材库再改也不影响它；要用新版本时 `materials_use` 加 `update: true`。
- **找东西用工具**：`resources_search`（例如「下雨 街道」「手机 聊天」「回忆」「甩镜」「门」）列出资源和函数，`resource_view` 看用法、参数、预设和预览图（按作品的节拍渲染）。工作台「素材 → 资源」里可以预览、调参数，音效可以试听并拖到音轨。
- **节拍跟作品走**：project.ts 写 `tempo`（BPM、第一小节第一拍的秒数），代码用 `beatAt` / `barAt` / `pulse` / `sinceBeat` / `beatLength`（draw.ts 从 `@frame/engine/tempo` 重新导出）。素材库里没有要按歌改的常量。
- **字体是完整的**（fonts/），`designScene` 和 `loadFonts` 自动加载，任何文案都不缺字，不用再取子集或补字。
- **每一幕**：`designScene(options, t0, (ctx, abs) => …)`，在 1080×1920 的设计坐标里按绝对时间画；镜头写法看 reference/。新作品从 templates/ 开始（scene.ts、visual.json、timeline.ts、歌词层 lyrics.ts）。
- **音效**：`audio_place` 的 `sound: "s0rrow/code/sfx.ts#slam"`，或从资源里拖到音轨；不用写进作品的 audio.ts。
- **某支片子要不一样的效果**：给素材库里的函数加参数（带默认值，已有的调用不受影响），用 `material_write` 改，然后用 `resource_view` 看一眼；不要把文件拷进作品再改（拷贝的副本不会再得到改进）。新画的、以后还会用到的角色、场景、道具放进对应的文件，并在文件末尾的 `resources` 里声明（写法见 frame_guide resources）。

## 目录

| 文件 | 内容 |
|---|---|
| `code/draw.ts` | 基础库：抖动线条、形状、上色、文字和字体、节拍、镜头、离屏、光影（人物打光 `litFigure`、轮廓光 `rimFigure`）、回忆效果、`designScene` |
| `code/kid.ts` | 主角和女主（表情、服装、手臂 IK、腿、背影），单只手、头盔、发卡 |
| `code/people.ts` | 其他人（`CAST`）、X 脸、生日横幅、笑声涂鸦 |
| `code/dog.ts` | 小狗豆豆、宠物店小狗、兔子玩偶、网球、X 光片 |
| `code/hand.ts` | 握手机的双手、触点、点击涟漪 |
| `code/phone.ts` | 手机、锁屏（黄昏秋千壁纸）、群聊、动态、控制中心、通知、角标、手机背面 |
| `code/chat.ts` | 微信风格聊天、朋友圈、资料页、主页、App 窗口、关机、开机、头像、贴纸、合照 |
| `code/social.ts` | 深色社交界面线性图标、适宽按钮、手机底部手势条；600×1280 屏幕坐标 |
| `code/screens.ts` | 《unhappy》的相册、存钱、外卖接单、便利贴、小狗照片 |
| `code/sets.ts`、`code/shared.ts` | 《i have no friends》的场景和道具，生日书桌镜头 |
| `code/places.ts` | 《unhappy》的场景（家、雨夜、宠物医院、学校、便利店）、雨、道具；herRoom 可选精细雪夜房间 |
| `code/bedroom-detail.ts` | herRoom 的精细卧室实现：家具、照片、窗帘、雪夜楼影、木地板、地毯和拖鞋；台灯与月光，人物另画 |
| `code/mirrors/` | 《mirrors》的场景（浴室、夜走廊和落地镜、教室、天台、客厅）、深色手机界面、速写本、胎记、伪装、红笔批注 |
| `code/blocked/` | 《屏蔽》的爸爸（夜班保安：正面 / 背影、捧手机、一根手指打字、捂嘴、年轻时）、门卫室（雪夜厂门口、朝窗、背墙、值班桌俯拍、外景）、下雪 |
| `code/effects.ts` | 效果和转场的预览（函数在 draw.ts）：回忆、进回忆转场、甩镜、冲镜、白场黑场、高光溢出、灰色世界、光柱、景深、手持镜头、轮廓光、人物打光、影子、时间卡 |
| `code/lyrics.ts` | 中英卡拉 OK 歌词层（作品给歌词数据、段落样式和钩子）、两行大字幕 |
| `code/grain.ts` | 胶片颗粒和暗角（visual.json 里 overlay 叠在最上面） |
| `code/sfx.ts` | 78 个合成音效（中文名、时长、重音时刻） |
| `fonts/` | 6 款完整字体 |
| `templates/` | 新作品的 scene.ts、visual.json、timeline.ts、scenes/lyrics.ts |
| `tools/fetch-krc.mjs` | 酷狗 KRC 逐词歌词时间 → 作品的 scenes/krc.ts |
| `reference/` | 几支片子的分镜代码：镜头写法参考，只看不拷（见 reference/README.md） |

不放歌曲、歌词和作品自己的混音。

## 来源与许可

- `code/`、`templates/`、`tools/`、`reference/`：为《i have no friends》（work-bdd5c2f8，重置版 work-afa1129b）、《unhappy》（work-d1187f37）、《mirrors》（frame-works/9586fbc4）编写；音效全部代码合成。许可：自制。
- `reference/cover.jpg`：《i have no friends》的歌曲封面，用户提供，只作画风参考，不放进成片；版权归原作者。
- `fonts/gochi-hand.ttf`：Google Fonts，Gochi Hand；SIL Open Font License 1.1。
- `fonts/permanent-marker.ttf`：Google Fonts，Permanent Marker（Font Diner）；Apache License 2.0。
- `fonts/zcool-kuaile.ttf`：Google Fonts，ZCOOL KuaiLe 站酷快乐体；SIL Open Font License 1.1。
- `fonts/long-cang.ttf`：Google Fonts，Long Cang 龙藏体；SIL Open Font License 1.1。
- `fonts/noto-sans-sc-400.ttf`、`fonts/noto-sans-sc-700.ttf`：Google Fonts，Noto Sans SC（400、700）；SIL Open Font License 1.1。
- `code/cafe.ts`：来源 为作品 work-e8bee495《空着的位置》原创绘制。；许可 自制
- `code/blocked/snow.ts`：来源 为作品 work-73c8f9bc《屏蔽》编写；许可 自制
- `code/blocked/dad.ts`：来源 为作品 work-73c8f9bc《屏蔽》原创绘制；许可 自制
- `code/blocked/booth.ts`：来源 为作品 work-73c8f9bc《屏蔽》原创绘制；许可 自制
- `code/blocked/README.md`：来源 为作品 work-73c8f9bc《屏蔽》编写；许可 自制
- `code/blocked/booth.ts`：来源 为作品 work-73c8f9bc《屏蔽》原创绘制；许可 自制
- `code/social.ts`：来源 为作品 work-73c8f9bc 第一幕手机界面补全编写；许可 自制
- `code/bedroom-detail.ts`：来源 为作品 work-73c8f9bc 卧室细节与灯光补全编写；由 places.ts 的 herRoom detailed 参数调用；许可 自制
- `code/bedroom-detail.ts`：来源 原创 Canvas 手绘卧室，由 places.herRoom 的 detailed 参数调用。；许可 原创
