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
- 外衣 `coat: Garment`（`code/cast-wear.ts`，都从秤砣外套的两片前襟改出来，跟着转身、呼吸）：`kind` 为 `coat` 秤砣那样的敞怀外套、`suit` 西装（腰上一粒扣成 V、缺角翻领、胸袋、带盖口袋、衬衫袖口）、`jacket` 工装夹克（拉链、翻领、两个带盖胸袋、罗纹下摆和袖口）、`cardigan` 开衫（门襟罗纹边、一排小扣子）、`workcoat` 工装外套（立领、大扣子、带盖的大口袋；`hem` 给了是下摆缝铅的格子）、`hoodie` 连帽外套、`trench` 双排扣系腰带的长外套。`size` 大一号、`long` 加长（负数收短）、`rolled` 袖子卷两道、`trim` 罗纹颜色、`button` 扣子颜色。`art` 用手画的线稿代替版型（`size` / `long` 照样以领口为中心放大、加长：小石头裹着妈妈那件就是她的线稿按身高比放大；`GarmentArt`：两片前襟、翻领、衬衫领、领结、领带、腰线、外轮廓，每块正面和 3/4 逐点对应好；周磊的敞怀西装在 `code/cast-wear-art.ts`），配合人物配置的 `shoulderSide`（3/4 时肩关节挪到外衣的肩上），身子自动裁在外衣的轮廓里（Look `torsoClip`）。
- 上衣 `top: Top`：`crew` 圆领、`sweater` 毛衣（`under` 领口露出衬衫领；`turtle` 高领：照基础模型的脖子轮廓 `neckOutline` 放宽一圈的筒，包住脖子到下巴底下，下巴往下三分之一一道翻折线，外衣的立领压在两边）、`shirt` 衬衫、`vneck` V 领毛衣套衬衫、`tee` T 恤（`stripes` 横条纹）、`hoodie` 连帽衫（帽子、抽绳、袋鼠兜）、`duijin` 对襟盘扣、`peter` 小圆领、`polo` 运动校服（立领、拉链、袖子白杠）。裤子 `pants`：`crease` 裤线、`cuff` 卷裤脚、`patch` 膝盖补丁、`seam` 缝线。
- 脸（`code/cast-face.ts`）：`brows` 眉毛（`thick` 男人的粗眉、`bushy` 老人的白浓眉、`kid` 小孩、`soft` 女人；给了就换掉基础模型的细眉，照样跟着表情动）、`wrinkles`（`"forehead"` 连额头）、`glasses` + `glassesShape`（圆框 / 方框，镜片反光）、`mustache`、`stubble` 胡茬、`hairclip` 发卡；`hat` 帽子、`tie` 领带、`bell` 脚踝上的铃铛、`shoes` 三种鞋或铁靴、光脚。
- 比例（只改画法，关节不动）：`scale` 身高、`width` 体型宽窄、`headScale` 头以脖子为中心放大、`headWidth` 头再横着放宽（成年男人的脸比秤砣的瓜子脸宽）、`face0` / `face3` 正面 / 3/4 的脸用自己的线稿（`FaceView`：轮廓、眼珠、鼻子、嘴、耳朵、眉毛的中心，写法同 `figure-side.ts`；周磊的在 `code/cast-face-art.ts`，用户手画的）、`eyeScale` 眼睛连眉毛缩放（秤砣是大眼睛，成年男人 0.8 左右）、`hairVolume` 头发两侧和后脑勺蓬一点、`legWidth` / `legKnee` / `legHem` 裤腿在大腿根、膝盖、裤脚的粗细（直筒宽裤膝盖和裤脚要放得比大腿根多）、`armWidth` 胳膊粗细。周磊是照用户手画的线稿做的：脸、西装用线稿，胳膊、脖子、腿和秤砣一样（只有 `scale`）。小石头、老钟、千斤的妈妈、小石头的妈妈同样做法：脸照参考图描的线稿（`code/cast-kid-art.ts`、`cast-oldzhong-art.ts`、`cast-qinmom-art.ts`、`cast-shitoumom-art.ts`）。**这五个人的头发都是分层画的**（人物配置的 `hairArt.layers`：小石头的妈妈、小石头用户画的，老钟、千斤的妈妈、周磊 AI 照参考图画的；周磊的在 `cast-zhoulei-hair.ts`），骨架和头的大小和秤砣一样，只有 `scale`。**其余配角和路人也都只留 `scale`**：没有自己参考图的按男女老少借描好的脸（成年男人用周磊的 `ZHOULEI_FACE0/3`，成年女人用千斤的妈妈的 `QINMOM_FACE0/3`，老人用老钟的 `OLDZHONG_FACE0/3`，少女和小孩用秤砣的），发型、衣服照旧。`width` / `headScale` / `legWidth` 这些还在（别的作品可能用），《引力》的人都不用了。
- **朝右时不简单镜像**（用户 2026-10-28：「头发和衣服不能左右简单镜像，不然左右旋转时会跳动，并且衣物和头发都对称了」）：骨架都按朝左画、朝右时整个翻过去（`rig.mir`；头往身子反方向转时头再翻一次 `rig.headMir`，头在画面上朝不朝右是 `headFlip(rig)`）。**身上**不对称的用「镜像过的那一份」，翻过去正好是本来的样子——过正面不跳，留在她身上原来那一侧：描的裤腿（`legArt` 两条对调镜像）、手画外衣（两片前襟的正面对调，3/4 还是各片自己的；两片的点一一对应时才对调）、只在一边的细节（扣子、扣眼、胸袋、绣花：翻的时候画在另一片上，`cast-wear.ts` 的 `own`）、罗纹的竖纹从中线往两边排。**头照旧整个翻**（脸、耳朵、头发、眼珠高光、发卡；用户 2026-10-28 定的：「衣服采用当前方案，头部继续采用对称方案」——不对称的发型朝右要另画一张朝右 3/4，推出来的不像，画又太麻烦）。核对用作品 3d80f743 的 `sheets/_转身对照.ts`（正面两侧 face ±0.001 按像素比）。
- 画面上很小的时候（人不到约 260 像素高、头不到约 60 像素）发丝线、罗纹、针脚、扣眼这些细节自动不画，几十个人同场也不变慢。

## 配角线稿工具（`tools/`）：照参考图做配角

用户给了配角的参考图（和主角共用一套头顶、膝的横线）时：骨架、胳膊、腿、脖子、头的大小用秤砣的（人物配置只留 `scale`），脸、头发（衣服）从参考图拿轮廓——用户在底稿 SVG 里画，或者用工具按颜色描，再换算成 `code/cast-<名>-art.ts`。为什么这么做、每一步怎么定参数、踩过的坑见经验库「骨架剪纸动画」的 `配角线稿.md`。

- **怎么跑**：`tools/*.mjs` 是 Node 脚本（不在作品里 import，所以不会复制进作品的 `.materials/`）。**在作品文件夹 `projects/<名称>/` 里运行**：服务器上直接 `node /data/libraries/<作品库>/剪纸角色/tools/<工具>.mjs …`（`ls -d /data/libraries/*/剪纸角色` 找到它）；找不到时用 `material_read` 把 `tools/` 下的 9 个文件原样复制到作品的 `production/线稿工具/`，`node production/线稿工具/<工具>.mjs …`（工具之间按相对路径引用，放在一起就行）。sharp 从作品往上找 `node_modules`。
- **作品里要有 `production/线稿配置.mjs`**（每个角色一项）：

```js
const sum = (p) => p[0] + p[1] + p[2];
export default {
  小石头: {
    ref: "public/ref/比例参考-小孩.png", // 参考图（作品里的路径）
    lines: [162, 706.5], // 参考图里头顶、膝两条横线（像素）
    // 底稿里参考图横着对齐：cx（参考图像素，用 描图.mjs 打出来的「脖子中心」）对到线稿的 x0（正面不写 = 229.5，3/4 写 218.05），crop 裁左右
    views: { front: { cx: 141, crop: [0, 253] }, side: { cx: 383.5, x0: 218.05, crop: [253, 506] } },
    // 描图.mjs 用：正面和 3/4 之间的竖线、头部那一条的上下、脸和脖子的盒子界限、量脖子的那一行（像素）、头发 / 皮肤 / 鼻嘴的颜色
    trace: { split: 253, head: [140, 345], faceTop: 300, faceBottom: 340, neckTop: 300, neckRow: 336,
      isHair: (p) => sum(p) >= 170 && sum(p) <= 300 && p[0] < 125,
      isSkin: (p) => p[0] > 215 && p[1] > 160 && p[1] < 222 && p[2] > 140 && p[2] < 212 && p[0] - p[2] > 28,
      isMark: (p) => sum(p) < 600 && p[0] - p[2] > 20 },
    art: { file: "kid", prefix: "KID" }, // 线稿换算.mjs 用：写 cast-kid-art.ts，导出 KID_FACE0 / KID_FACE3 / KID_HAIR
  },
};
```

- **工具**（都在作品文件夹里运行）：
  - `线稿生成.mjs <角色> <底图目录>`：生成底稿 `public/ref/<角色>-线稿.svg`、`<角色>-侧面线稿.svg`（和秤砣的线稿同一套坐标：参考图 → 对齐线 → 现在的样子（对照，默认隐藏）→ 头部 / 身体两层）。**文件已有时只换对照那张图**，画好的线不动。底图目录里放 front-white / front-black / side-white / side-black.png：作品里写个样片 `sheets/_<角色>底图.ts`（`export const sample = lineBaseSample; export const createScene = lineBaseScene(CAST.<角色>);`，从 `@materials/剪纸角色/code/linebase` 导入），`preview_frames` 画 0.5 / 1.5 / 2.5 / 3.5 秒（region [0,0,920,1640]、scale 1、png、sheet: false）。样片 4–5 秒是转身一排头部、5–6 关节坐标、6–8 不穿衣服的基础模型（量胳膊、脖子的轮廓）。
  - `看颜色.mjs <参考图> x0 y0 x1 y1 [x,y …]`：一块地方最多的颜色和几个点的颜色（定 `isHair` / `isSkin`）。
  - `描图.mjs <角色> [--debug]`：从平涂的参考图描头（脸、耳朵、眼珠、鼻子、嘴、头发后面那片、刘海），写进两张 SVG 的身体图层，每条线有 id（`face` `ear-l` `ear-r` `eye-l` `eye-r` `nose` `mouth` `hair-back` `fringe`，可选 `brow-l` `brow-r`、秃顶两鬓的 `hair-1` `hair-2`…），用户可以在编辑器里改。`--debug` 只出调试图。**会把身体图层整个换掉，用户改过线就别再跑。** `trace` 里可选的：`isEye` 眼珠的颜色（不写同头发；戴眼镜的在脸的盒子里找圆的两块）、`brows: true` 描眉毛（和刘海连着的那一面自动不写）、`bald: true` 秃顶（头的皮肤整个就是脸、取凸包再扣掉耳朵，不描刘海和后面那片，两鬓的头发是单独的几块）、`pieceSmooth` 单独的几块头发顺多狠（默认 1.5）、`earRound: true` 耳朵取凸包、`faceRound: true` 脸取凸包再顺一顺（圆脸：去掉像素描出来的小起伏）、`earBox` 框里的皮肤就是这只耳朵（耳垂和脸颊连成一块、耳朵里面偏深时；`{ front: [[左耳框], [右耳框]], side: [框] }`）、`eyeBox` / `noseBox` / `mouthBox` 只在框里找（`{ front: [x0, y0, x1, y1], side: […] }`，眼镜框、法令纹、眉毛会被当成眼睛鼻子嘴）、`neckX: [正面, 3/4]` 直接给脖子中心、`hairMin` 面积够这么大的几块头发都算（盘发的髻有自己的描边）、`backClose` 后面那片闭运算的半径（头发和脸之间留了细缝）、`coat: { isCoat, rows }` 敞怀外衣（开衫）的颜色和它在参考图里的上下几行：再描两片前襟的门襟和下摆（`coat-l` / `coat-r`，门襟上端 → 下摆外角，画面左那片是 l）、`pants: { isPants, rows }` 裤子的颜色和它的上下几行：再描正面两条裤腿（`leg-l` / `leg-r`，只在正面那张）、`tieBox` 发圈的框（挨着它的几块头发是马尾，写 `hair-tail`；框里的发圈写 `hair-tie`；换算成 hairArt 的 tail / tie，马尾画在最后面、发圈压在顶上）、`fringePad` 刘海往脸外多扩几像素（额头上透出一道细弧线时加大，太大了转身时刘海乱）、`browBox` 两条眉毛的框（眉毛是比头发还深的细线时；压在头发边上的描不出来，不描就是）。`coat.isCoat(颜色, x, y)` 可以按位置分（下摆缝的一条边和头发同色时只在那几行算）；门襟从肩线那一行开始，描到的立领不要（工装外套的立领另外画）。
  - **头发要分层画**（经验库「骨架剪纸动画」的 `配角头发.md`）：描图描出来的头发只是一块剪影，转身不顺。底稿 SVG 里另外建这几个图层（3/4 那张前面加 `side-`），每块头发一条闭合的路径、正面和 3/4 的同一块 id 一样：`hair-bun` 发髻（一直在后面那片后面）、`hair-back` 后面那片（头顶、后脑勺、翘出来的碎发；画在身子后面，几块合起来描外轮廓）、`hair-bangs` 刘海的一缕一缕、`hair-lock-l` / `hair-lock-r` 鬓发（压在脸上：先都填色，只描压在皮肤上和伸到头发外面的边；画面左边的 `hair-lock-l` 转到 3/4 时在远处，压在脸上的部分往脸边收、转过一半藏到脸后面，照主角远处那缕）、`hair-tail` 马尾、`hair-tie` 发圈（正面时在身子后面，身子转到 3/4 时搭在背上、压在外衣上：Look 的 `underHead`）。尖的地方画成角点。耳朵用户画的放在身体图层 `ear-l` / `ear-r`，耳朵里的一道线 `ear-line-l` / `ear-line-r`（`FaceView.earLines`）。`线稿换算.mjs` 见到这些图层就输出 `<prefix>_HAIR.layers`（`头发分层.mjs`：两张各按画的节点取点、节点原样保留，在标志点处对齐、标志点之间按弧长比例逐点对应；标志点不写时节点一样多就按顺序一个对一个，不然按最左、最上、最右、最低；画法不一样的几块在配置的 `art.hairMarks` 里写 `{ <id>: [[正面节点, 3/4 节点], …] }`（或 `"box"`：最左、最上、最右、最低），例：作品 3d80f743 的小石头的妈妈；节点数不一样又没写的，按节点在这一块的包围盒里的相对位置自动配（顺时针排好、试每一种错位、按顺序动态对齐）；用户随手画、起笔的地方不一样时配置写 `art.hairAlign: "shape"`，一样多的也按位置配（小石头）。只在一张里画了的一块（正面看得到、转到 3/4 被头挡住）：`art.hairOnly: { <id>: { to: [X, Y] } }`，另一张里它缩成 to 那一点（另一张的线稿坐标，选在被挡住的地方）。压在脸上的几块藏在头发里的上沿（朝上的边、在脸里面、在眼睛上面）换算时自动抬到脸的圆顶外面（不然刘海顶上露出一线皮肤、描出小尖；用户的线不动，`art.hairLiftTops: false` 关掉）。耳朵里的线只在 3/4 画了的（`ear-line-r` 只在侧面那张）：正面按耳朵的包围盒搬过去，转身时淡出来。眉毛描进身体图层的 `brow-l` / `brow-r`（只用位置）：不描的话按眼睛推，眼睛大的会被推到刘海里、从刘海缝里露出一截（小石头）。配置的 `art.hairUnderEars: true`：压在脸上的几块在耳朵后面（秃顶两鬓的白发，老钟）。换算时压在脸上的一块贴着脸的圆顶从里面走会提示（额头上会多一道弧）。`--hair-only` 只换算头发，写 `cast-<file>-hair.ts`（脸、衣服是用户画、别的脚本换算的人：周磊）。
  - `头发描点.mjs 看 <角色> <front|side> X0 Y0 X1 Y1 放大 <png> [点.json]` / `头发描点.mjs 写 <角色> <点.json>`：AI 照参考图分层画头发用。参考图按线稿坐标放大、叠 5 一格的网格和脸、五官、画的每一块（点的编号、角点是方框）；点（线稿坐标，第三项 1 是角点）写进两张线稿的头发图层、描的旧头发挪进隐藏图层；写的线带 `data-by="ai"`，头发图层里有用户画的线（不带这个标记）时不写（`--force` 才覆盖）。点的格式写在文件开头，例：作品 3d80f743 的 `production/头发描点/`。
  - `线稿叠图.mjs <角色> <ref|now> [输出目录]`：线（洋红）叠在参考图 / 现在的样子上出 PNG，核对用。
  - `线稿换算.mjs <角色> <输出目录>`：按 id 读线，写 `cast-<file>-art.ts.txt`（`<prefix>_FACE0` / `_FACE3` / `_HAIR`），再 `material_write` put `work_file` 到 `code/cast-<file>-art.ts`，人物配置写 `face0`、`face3`、`hairArt`，删掉 headScale / width / legWidth / armWidth 这些。有 `coat-l` / `coat-r` 时还写 `<prefix>_COAT`（`GarmentArt`：两片前襟、敞开的那块、两道门襟），人物配置的 `coat` 写 `art: <prefix>_COAT`（`long`、口袋、门襟边这些版型就不用了，kind 只定袖口）：门襟、下摆用描的，肩、腰下接主角外套的（`线稿换算工具.mjs` 的 `COAT_SHOULDER`、`NECK_SIDE`），侧缝从腰下直着接到下摆外角，下摆被手挡住时照原来的高度往外接到腰下正下方。里面的上衣照通用的画（只画在敞开的那块里）。kind 是 workcoat 的按线稿画的外套另外画一排大扣子、扣眼短线、斜插袋、下摆一圈 hem 色的边、立领。裤脚长度用配置的 `art.legHem`（裤脚落在脚踝下面多少，默认 5；长裤盖到鞋面给 20 多）。有 `leg-l` / `leg-r` 时写 `<prefix>_LEGS`，人物配置写 `legArt: <prefix>_LEGS`（Look 的 `legShape`）：只取裤腿的宽窄（每一行离这条腿中线多远），绕着主角的胯、膝、脚踝重新摆（参考图里的人站得直，主角的腿往外撇），和基础模型的腿一样在膝盖切成两节跟着骨头动。
  - `描图工具.mjs`（分色、形态学、连通块、描轮廓、顺滑；sharp、作品文件夹、读配置）、`线稿换算工具.mjs`（读 SVG 路径、线稿 → 头的坐标 / 身体坐标）是底层，用户画的线没有 id 时自己写换算脚本也用它们（例：作品 3d80f743 的 `production/周磊线稿换算.mjs`）。

## 文件

- `code/rig.ts`：通用的二维骨架工具（关节坐标系、两节 IK、平滑路径、合并描边、右下阴影、受力的链、关键帧混合、呼吸和眨眼、两张线稿之间的轮廓变形 `matchOutlines` / `lerpPts`、受力弯曲 `bendAlong`、风的循环 `loopSin` / `gusty`）。
- `code/figure.ts`：**基础模型**：尺寸、骨架、姿势类型、身体和头的线稿常量（用户亲手画的，作品 5b227852 的 `public/ref/秤砣-线稿.svg`）、画法和 `Look` 图层接口、表情、按关节角度的参数和资源。
- `code/figure-side.ts`：基础模型 3/4 侧面（朝左）的线稿常量（用户画的 `public/ref/秤砣-侧面线稿.svg`）：脸、眼珠、鼻子、嘴、脖子、身子。和 `chengtuo-side.ts` 一起由作品 5b227852 的 `production/侧面线稿换算.cjs` 生成，别手改。
- `code/chengtuo-draw.ts`：**秤砣**的 Look：配色、头发（后面的长发、刘海、鬓发，随风和失重）、围巾（垂下来那头在她左边：朝右时镜像过来，过正面不换边）、手套、外套、袖标、铁靴、拿砖 `holdBrick`。
- `code/chengtuo-side.ts`：秤砣刘海的 3/4 外轮廓（生成的）。
- `code/chengtuo-costume.ts`：外套（正面、3/4 两张）、袖口、袖标、肩头铆钉、铁靴的线稿常量，由作品 5b227852 的 `production/服装线稿换算.cjs` 从 `public/ref/秤砣-服装线稿.svg`、`秤砣-服装侧面线稿.svg` 生成（按元素 id 认），别手改。
- `code/figure-motion.ts`：动作引擎（关键帧、走 / 跑、脚不打滑、头发跟着速度甩）。
- `code/chengtuo-moves.ts`：秤砣的动作和 `POSES`。
- `code/chengtuo.ts`：秤砣的入口，导出上面全部（连同基础模型），加上参数和资源声明。
- `code/cast.ts`：配角的入口：人物配置 `CastSpec` → Look、帽子、鞋、领带、铃铛、《引力》的 `CAST`、路人 `passerby`、间奏里被拽下来的大叔 `GLASSES_UNCLE` 和女学生 `SCHOOLGIRL`、七到十二岁的秤砣 `youngChengtuo(age)`（头、腿、身高一年年从小孩长到大人的头身比）。
- `code/cast-woman.ts`：《引力》（作品 3d80f743）开场光里的女人 `LIGHT_WOMAN` / `LIGHT_WOMAN_LOOK`（浅玫瑰长开衫，头发借秤砣那套换成暖棕色、耳边一朵小白花）。`CAST.光里的女人` 是另一版（作品 5b227852：粉衣服、长发）。
- `code/characters.ts`：每个配角登记成一个资源（素材 → 资源里能打开看：调朝向、表情、风、失重、脱外衣，路人调第几个、小时候的秤砣调年纪），画法 `castFigure(ctx, x, y, s, 人物配置, 参数, t)`。新加人物时在这里加一项。
- `code/cast-hair.ts`：配角的十种发型（正面线稿 + 3/4 自动过渡、风、失重、马尾、髻），和分层画的头发（`HairLayers`：发髻、后面那片、压在脸上的几块、远处的鬓发、马尾、发圈，各自的层和描边）。
- `code/cast-wear.ts`：配角的衣服：外衣七种版型、按线稿画的外衣 `GarmentArt`（周磊的西装、千斤的妈妈的开衫）、上衣九种、袖口、裤子细节。
- `code/cast-face.ts`：配角脸上的人物特点：眉毛、皱纹、眼镜、胡子、胡茬、发卡。
- `code/cast-face-art.ts`、`cast-hair-art.ts`、`cast-wear-art.ts`：周磊的脸、碎发（旧的一整圈，周磊现在用 `cast-zhoulei-hair.ts` 的分层头发）、西装（用户手画的线稿换算的）；`code/cast-kid-art.ts`、`cast-oldzhong-art.ts`、`cast-qinmom-art.ts`、`cast-shitoumom-art.ts`：小石头、老钟、千斤的妈妈、小石头的妈妈的脸（`tools/描图.mjs` 照参考图描的）和分层的头发（线稿里 hair-* 那几个图层）；`code/cast-zhoulei-hair.ts`：周磊的分层头发。都是生成的，别手改。
- `code/linebase.ts`：配角线稿工具的底图样片（`lineBaseScene(spec)`）。
- `tools/`：配角线稿工具（Node 脚本，见上面「配角线稿工具」）。

## 来源与许可
- `code/cast-zhoulei-hair.ts`：来源 作品 3d80f743 的 public/ref/周磊-线稿.svg、周磊-侧面线稿.svg 里 hair-* 图层（AI 照参考图分层画的），tools/线稿换算.mjs --hair-only 生成；许可 本作品库自制
- `tools/头发描点.mjs`：来源 作品 3d80f743 做配角分层头发时写的工具（2026-10-28）；许可 本作品库自制
