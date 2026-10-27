# 剪纸角色

二维骨架剪纸画风的角色（深色描边、平涂、右下一道阴影，部件绑在骨架上靠关节转动），用 Canvas 2D 代码画，按绝对时间渲染。所有角色共用一个「基础模型」（骨架、身体、脸和表情、正面 ↔ 3/4 转身），每个角色只在上面换配色、发型、衣服、鞋和人物特点。现在有《引力》的女主秤砣，和一套用配置生成的配角（十种发型、七种外衣版型、九种上衣、眉毛和皱纹、眼镜、鞋）。

## 资源

- `code/figure.ts#figure` **基础模型**（角色）：光头、素色上衣下装、光手光脚的人。
  - 朝向 `face`：0 正面，-1 3/4 朝画面左，1 3/4 朝画面右，中间值连续转身；`headTurn` 头再多转。
  - 表情 `expression`（20 种）：平常、微笑、笑、哭着笑、含泪、忍着哭、难过、担心、心疼、惊、吓一跳、使劲、坚定、犹豫、闭眼、哼歌、释然、仰望、低头看、嘘；`blink` `happy` `sad` `fierce` `wide` `squint` 眯眼、`smile` `open` `round` 小圆嘴、`teeth` 咬牙、`wobble` 嘴发抖、`lookX/lookY` `blush` `tears` 在它上面再调。眉毛藏在刘海下面（参考图就是这样），表情主要靠眼皮、嘴、腮红和眼泪。
  - 姿势：每个关节一个角度（度）。`neck` 脖子、`lean` 腰、`rot` 整个人转；手臂 `shoulder` 肩、`elbow` 肘、`wrist` 手腕、`hand` 手形、`layer` 画在身体前 / 后；腿 `hip` 胯、`knee` 膝、`ankle` 脚、`thigh` 大腿长度比例（正面蹲下时压短）。`ground` 打开时把最低的着地点放到地面上（鞋底、跪着的膝盖、坐着的大腿后面都算），`lift` 再往上抬。
  - 风和失重：`wind` 风的大小和方向（− 往画面左吹，+ 往右），4 秒一个循环；`float` 0–1 失重，连续过渡、和风一起算（角色的头发、围巾跟着它们动）。`idle` 呼吸和眨眼。
- `code/chengtuo.ts#chengtuo` **秤砣**（角色）：基础模型 + 黑色齐刘海长直发、米白毛衣、深灰裤袜、芥末黄围巾、藏青手套、藏青外套（袖子卷到小臂、肩头铆钉）、左臂红袖标、插着砖的生锈铁靴。
  - 参数是基础模型的全部参数，加上物品：`coat` 外套、`band` 袖标、`boots` 铁靴（关掉是光脚）、`bricks` 靴筒里几块砖（0–2）、`scarf` 围巾、`gloves` 手套、`brickL` / `brickR` 手里拿一块砖。
  - 资源面板不放预设，只看默认（用户 2026-10-18：预设影响对成品的判断）。片子里的姿势在代码的姿势表 `POSES`（chengtuo-moves.ts）。

## 用法

```ts
import { chengtuo, drawChengtuo, walk, jumpGrab, playMove, POSES, CHENGTUO } from "@materials/剪纸角色/code/chengtuo";

// 按参数画：(x, y) 两脚之间的地面，s = 1 时全身约 590 高，t 是时间（呼吸、眨眼、飘）
chengtuo(ctx, 540, 1500, 1.2, { ...POSES.挥手, scarf: false }, t);

// 现成的动作：返回 { pose, x }，x 是根的横向位置（朝左为负）
const f = walk(t, { step: 0.5 });
ctx.save(); ctx.translate(x0 + f.x * s, groundY); ctx.scale(s, s); drawChengtuo(ctx, f.pose); ctx.restore();

// 自己写动作：关键帧用关节角度（度，和资源面板一样），只写变了的；plant 让那只脚钉在地上不打滑
const g = playMove([
  { t: 0, p: POSES.站 },
  { t: 0.5, p: POSES["单膝跪·掏砖"], plant: "L" },
  { t: 1.2, p: POSES.递砖, plant: "L", items: { bricks: 1 } },
], t, { look: CHENGTUO, idle: true });
```

- 角度约定：0 = 垂下 / 伸直，正 = 顺时针（往画面左摆，朝左时就是往前）。除了肩和胯，每个关节都相对上一节骨头。`L` 是正面时画面右边、3/4 时靠近镜头的那只手臂 / 腿。
- `drawChengtuo(ctx, pose, opts)` / `drawFigure(ctx, pose, look, opts)` 是底层画法（角度用弧度，手脚还能给 `to` 用 IK 伸到某一点，`ik` 0→1 在关键帧之间从摆臂过渡到伸手）；`pose.items` 开关物品；`opts.hold.L/R` 在手里画任何东西；`jointsOf(pose)`（秤砣）/ `figureJoints(pose, look)` 给出各关节在画面里的位置，用来对齐道具和别的角色。
- 动作引擎（`code/figure-motion.ts`，所有角色共用，只依赖时间，可以任意跳转）：`playMove(关键帧, t, { look, idle })` 关键帧之间按缓动插（表情也平滑过渡），脚踩地按着地点算，`plant` 的那段脚钉在地上（根的 x 反算），`dx` 相对上一帧挪多少，`items` 物品在这一帧起变化；头发、围巾按身体的速度往后甩。`gait(一步的关键姿势, t, …)` 走 / 跑：第二步左右对调，站着的脚不打滑。`shiftKeys` 把一段动作接到另一段后面。
- 秤砣的动作（`code/chengtuo-moves.ts`，都按 3/4 朝左写，返回 `{ pose, x }`）：`stand` 呼吸眨眼、`walk` 铁靴走路（一步一咚，`walkSteps` 给每一步落地的时刻）、`run` 跑、`jumpGrab` 蹲跳在空中抓住人带着坠下来落地、`kneelGive` 单膝跪掏砖递砖再站起来（脚跟离地一下）、`greet` 抬手打招呼、`patHead` 弯腰摸头、`float` 光脚飘；`jumpGrabKeys` / `kneelGiveKeys` 是它们的关键帧，`JUMP_GRAB` / `KNEEL_GIVE` 是里面的时刻；`POSES` 片子里的姿势（角度用度），`legL` / `legR` 按「脚相对地面的角度」写一条腿。

## 做一个新角色

不改基础模型，写一个 `Look`（`code/figure.ts` 里有每一项的说明），在基础模型的各层之间加自己的东西：

- `colors`：配色（皮肤、眼睛、眉毛这些人物特点，上衣 `top`、下装 `bottom`）；`collar: false` 去掉上衣的圆领。
- 发型：`backHair`（最后面）、`frontHair`（脸上面、眉毛下面；拿到头的坐标、贴着脸边的映射和「只描压在皮肤上的边」）。
- 衣服：`overTorso`（身子上面的外衣，配 `bodyPieces` 让手臂按外衣裁描边、`armsOver` 让正面的上臂压在外衣上、`shoulderOut` 加宽肩），`neckBack` / `neckFront`（围脖、领子），`chest`（挂在胸前、和手臂排前后的东西），`sleeve` 袖子颜色，`forearm` / `onUpperArm` / `onForearm`（卷袖子、袖标、袖口），`hands` 手套颜色。
- 鞋：`shoe`（这只脚穿着鞋，不画光脚）+ `overLeg`（每条腿画完以后画鞋）。
- 人物特点：`face`（脸上另外的东西：雀斑、痣、眼镜，最后画）。
- 物品默认值写在 `items`，然后像 `chengtuo-draw.ts` 那样包一个 `drawXxx(ctx, pose, opts) = drawFigure(ctx, pose, LOOK, opts)`。资源参数要写成字面量的 zod 对象（资源面板不运行代码读参数，`figureOptions.extend()` 读不出来）：把 `figureOptions` 的字段原样写一遍再加自己的物品，见 `chengtuo.ts`。

## 配角（`code/cast.ts`）

配角不一个个写 Look，写一份「人物配置」`CastSpec`，`castLook(spec)` / `lookOf(spec)` 生成外观，`drawCast(ctx, spec, pose)` 按身高画、`castJoints(spec, pose)` 给关节位置。《引力》的人在 `CAST`（周磊、老钟、小石头、千斤、阿满、老太太、年轻人……），`passerby(i)` 是轮着换衣服、发型、鞋的路人。

- 发型 `hair`（`code/cast-hair.ts`）：`short` 侧分短发、`kid` 毛茸茸带呆毛、`curtain` 中分、`bob` 齐刘海齐耳、`sidebob` 侧分齐耳、`bun` 盘发（`hairTie` 给了插一根发簪）、`long` 中分长直发、`ponytail` 低马尾、`highpony` 高马尾（`hairTie` 是皮筋）、`receding` 秃顶两鬓白发、`tousled` 周磊的碎发（用户手画的正面和 3/4 两张线稿，`code/cast-hair-art.ts`，按周磊头的比例换算的，别人用要按自己的比例重新生成）。都是正面一套线稿，转到 3/4 时按脸的轮廓自动过渡（`turnHair`），后脑勺圆、不会外推出刺；发梢分缝处一道由粗到细的发丝线；长的几种随风、失重飘。
- 外衣 `coat: Garment`（`code/cast-wear.ts`，都从秤砣外套的两片前襟改出来，跟着转身、呼吸）：`kind` 为 `coat` 秤砣那样的敞怀外套、`suit` 西装（腰上一粒扣成 V、缺角翻领、胸袋、带盖口袋、衬衫袖口）、`jacket` 工装夹克（拉链、翻领、两个带盖胸袋、罗纹下摆和袖口）、`cardigan` 开衫（门襟罗纹边、一排小扣子）、`workcoat` 工装外套（立领、大扣子、带盖的大口袋；`hem` 给了是下摆缝铅的格子）、`hoodie` 连帽外套、`trench` 双排扣系腰带的长外套。`size` 大一号、`long` 加长（负数收短）、`rolled` 袖子卷两道、`trim` 罗纹颜色、`button` 扣子颜色。`art` 用手画的线稿代替版型（`GarmentArt`：两片前襟、翻领、衬衫领、领结、领带、腰线、外轮廓，每块正面和 3/4 逐点对应好；周磊的敞怀西装在 `code/cast-wear-art.ts`），配合人物配置的 `shoulderSide`（3/4 时肩关节挪到外衣的肩上），身子自动裁在外衣的轮廓里（Look `torsoClip`）。
- 上衣 `top: Top`：`crew` 圆领、`sweater` 毛衣（`under` 领口露出衬衫领）、`shirt` 衬衫、`vneck` V 领毛衣套衬衫、`tee` T 恤（`stripes` 横条纹）、`hoodie` 连帽衫（帽子、抽绳、袋鼠兜）、`duijin` 对襟盘扣、`peter` 小圆领、`polo` 运动校服（立领、拉链、袖子白杠）。裤子 `pants`：`crease` 裤线、`cuff` 卷裤脚、`patch` 膝盖补丁、`seam` 缝线。
- 脸（`code/cast-face.ts`）：`brows` 眉毛（`thick` 男人的粗眉、`bushy` 老人的白浓眉、`kid` 小孩、`soft` 女人；给了就换掉基础模型的细眉，照样跟着表情动）、`wrinkles`（`"forehead"` 连额头）、`glasses` + `glassesShape`（圆框 / 方框，镜片反光）、`mustache`、`stubble` 胡茬、`hairclip` 发卡；`hat` 帽子、`tie` 领带、`bell` 脚踝上的铃铛、`shoes` 三种鞋或铁靴、光脚。
- 比例（只改画法，关节不动）：`scale` 身高、`width` 体型宽窄、`headScale` 头以脖子为中心放大、`headWidth` 头再横着放宽（成年男人的脸比秤砣的瓜子脸宽）、`face0` / `face3` 正面 / 3/4 的脸用自己的线稿（`FaceView`：轮廓、眼珠、鼻子、嘴、耳朵、眉毛的中心，写法同 `figure-side.ts`；周磊的在 `code/cast-face-art.ts`，用户手画的）、`eyeScale` 眼睛连眉毛缩放（秤砣是大眼睛，成年男人 0.8 左右）、`hairVolume` 头发两侧和后脑勺蓬一点、`legWidth` / `legKnee` / `legHem` 裤腿在大腿根、膝盖、裤脚的粗细（直筒宽裤膝盖和裤脚要放得比大腿根多）、`armWidth` 胳膊粗细。周磊是照用户手画的线稿做的：脸、头发、西装用线稿，胳膊、脖子、腿和秤砣一样（只有 `scale`）。
- 画面上很小的时候（人不到约 260 像素高、头不到约 60 像素）发丝线、罗纹、针脚、扣眼这些细节自动不画，几十个人同场也不变慢。

## 文件

- `code/rig.ts`：通用的二维骨架工具（关节坐标系、两节 IK、平滑路径、合并描边、右下阴影、受力的链、关键帧混合、呼吸和眨眼、两张线稿之间的轮廓变形 `matchOutlines` / `lerpPts`、受力弯曲 `bendAlong`、风的循环 `loopSin` / `gusty`）。
- `code/figure.ts`：**基础模型**：尺寸、骨架、姿势类型、身体和头的线稿常量（用户亲手画的，作品 5b227852 的 `public/ref/秤砣-线稿.svg`）、画法和 `Look` 图层接口、表情、按关节角度的参数和资源。
- `code/figure-side.ts`：基础模型 3/4 侧面（朝左）的线稿常量（用户画的 `public/ref/秤砣-侧面线稿.svg`）：脸、眼珠、鼻子、嘴、脖子、身子。和 `chengtuo-side.ts` 一起由作品 5b227852 的 `production/侧面线稿换算.cjs` 生成，别手改。
- `code/chengtuo-draw.ts`：**秤砣**的 Look：配色、头发（后面的长发、刘海、鬓发，随风和失重）、围巾、手套、外套、袖标、铁靴、拿砖 `holdBrick`。
- `code/chengtuo-side.ts`：秤砣刘海的 3/4 外轮廓（生成的）。
- `code/chengtuo-costume.ts`：外套（正面、3/4 两张）、袖口、袖标、肩头铆钉、铁靴的线稿常量，由作品 5b227852 的 `production/服装线稿换算.cjs` 从 `public/ref/秤砣-服装线稿.svg`、`秤砣-服装侧面线稿.svg` 生成（按元素 id 认），别手改。
- `code/figure-motion.ts`：动作引擎（关键帧、走 / 跑、脚不打滑、头发跟着速度甩）。
- `code/chengtuo-moves.ts`：秤砣的动作和 `POSES`。
- `code/chengtuo.ts`：秤砣的入口，导出上面全部（连同基础模型），加上参数和资源声明。
- `code/cast.ts`：配角的入口：人物配置 `CastSpec` → Look、帽子、鞋、领带、铃铛、《引力》的 `CAST` 和路人 `passerby`。
- `code/cast-hair.ts`：配角的十种发型（正面线稿 + 3/4 自动过渡、风、失重、马尾、髻）。
- `code/cast-wear.ts`：配角的衣服：外衣七种版型、上衣九种、袖口、裤子细节。
- `code/cast-face.ts`：配角脸上的人物特点：眉毛、皱纹、眼镜、胡子、胡茬、发卡。
