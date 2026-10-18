# 剪纸角色

二维骨架剪纸画风的角色（深色描边、平涂、右下一道阴影，部件绑在骨架上靠关节转动），用 Canvas 2D 代码画，按绝对时间渲染。所有角色共用一个「基础模型」（骨架、身体、脸和表情、正面 ↔ 3/4 转身），每个角色只在上面换配色、发型、衣服、鞋和人物特点。现在有《引力》的女主秤砣。

## 资源

- `code/figure.ts#figure` **基础模型**（角色）：光头、素色上衣下装、光手光脚的人。
  - 朝向 `face`：0 正面，-1 3/4 朝画面左，1 3/4 朝画面右，中间值连续转身；`headTurn` 头再多转。
  - 表情 `expression`：平常、笑、哭着笑、难过、惊、使劲、闭眼、哼歌、仰望、心疼；`blink` `happy` `sad` `fierce` `wide` `smile` `open` `lookX/lookY` `blush` `tears` 在它上面再调。
  - 姿势：每个关节一个角度（度）。`neck` 脖子、`lean` 腰、`rot` 整个人转；手臂 `shoulder` 肩、`elbow` 肘、`wrist` 手腕、`hand` 手形、`layer` 画在身体前 / 后；腿 `hip` 胯、`knee` 膝、`ankle` 脚、`thigh` 大腿长度比例（正面蹲下时压短）。`ground` 打开时按腿的角度自动把脚放到地面，`lift` 再往上抬。
  - 风和失重：`wind` 风的大小和方向（− 往画面左吹，+ 往右），4 秒一个循环；`float` 0–1 失重，连续过渡、和风一起算（角色的头发、围巾跟着它们动）。`idle` 呼吸和眨眼。
- `code/chengtuo.ts#chengtuo` **秤砣**（角色）：基础模型 + 黑色齐刘海长直发、米白毛衣、深灰裤袜、芥末黄围巾、藏青手套、藏青外套（袖子卷到小臂、肩头铆钉）、左臂红袖标、插着砖的生锈铁靴。
  - 参数是基础模型的全部参数，加上物品：`coat` 外套、`band` 袖标、`boots` 铁靴（关掉是光脚）、`bricks` 靴筒里几块砖（0–2）、`scarf` 围巾、`gloves` 手套、`brickL` / `brickR` 手里拿一块砖。
  - 预设：3/4 朝左 / 朝右、抱臂、半蹲、挥手、坐、单膝跪递砖、跳起来抓、飘、摘了围巾和手套、毛衣光脚（脱掉外套袖标靴子）、呼吸眨眼、风里、水里漂。

## 用法

```ts
import { chengtuo, chengtuoPose, drawChengtuo, walk, jumpGrab, kneelGive, float, stand } from "@materials/剪纸角色/code/chengtuo";

// 按参数画：(x, y) 两脚之间的地面，s = 1 时全身约 590 高，t 是时间（呼吸、眨眼、飘）
chengtuo(ctx, 540, 1500, 1.2, { face: -1, expression: "笑", shoulderL: 150, handL: "open", scarf: false }, t);

// 做动作：参数先变成姿势，再和关键帧、动作混合（blend / sampleKeysPose 在 code/rig.ts）
const pose = chengtuoPose({ face: -1, expression: "难过" }, t);
ctx.save(); ctx.translate(x, y); drawChengtuo(ctx, { ...pose, neck: -0.2 }); ctx.restore();
```

- 角度约定：0 = 垂下 / 伸直，正 = 顺时针（往画面左摆，朝左时就是往前）。除了肩和胯，每个关节都相对上一节骨头。`L` 是正面时画面右边、3/4 时靠近镜头的那只手臂 / 腿。
- `drawChengtuo(ctx, pose, opts)` / `drawFigure(ctx, pose, look, opts)` 是底层画法（角度用弧度，手脚还能给 `to` 用 IK 伸到某一点，`ik` 0→1 在关键帧之间从摆臂过渡到伸手）；`pose.items` 开关物品；`opts.hold.L/R` 在手里画任何东西；`jointsOf(pose)`（秤砣）/ `figureJoints(pose, look)` 给出各关节在画面里的位置，用来对齐道具和别的角色。
- 动作（只依赖时间，可以任意跳转，产出基础模型的姿势，别的角色也能用）：`stand` 呼吸眨眼、`walk` 走路（返回位移，`walkSteps` 给每一步落地的时刻）、`jumpGrab` 蹲跳抓、`kneelGive` 单膝跪掏砖递砖、`float` 飘；`POSES` 片子里的静止姿势，`EXPRESSIONS` 表情。

## 做一个新角色

不改基础模型，写一个 `Look`（`code/figure.ts` 里有每一项的说明），在基础模型的各层之间加自己的东西：

- `colors`：配色（皮肤、眼睛、眉毛这些人物特点，上衣 `top`、下装 `bottom`）；`collar: false` 去掉上衣的圆领。
- 发型：`backHair`（最后面）、`frontHair`（脸上面、眉毛下面；拿到头的坐标、贴着脸边的映射和「只描压在皮肤上的边」）。
- 衣服：`overTorso`（身子上面的外衣，配 `bodyPieces` 让手臂按外衣裁描边、`armsOver` 让正面的上臂压在外衣上、`shoulderOut` 加宽肩），`neckBack` / `neckFront`（围脖、领子），`chest`（挂在胸前、和手臂排前后的东西），`sleeve` 袖子颜色，`forearm` / `onUpperArm` / `onForearm`（卷袖子、袖标、袖口），`hands` 手套颜色。
- 鞋：`shoe`（这只脚穿着鞋，不画光脚）+ `overLeg`（每条腿画完以后画鞋）。
- 人物特点：`face`（脸上另外的东西：雀斑、痣、眼镜，最后画）。
- 物品默认值写在 `items`，然后像 `chengtuo-draw.ts` 那样包一个 `drawXxx(ctx, pose, opts) = drawFigure(ctx, pose, LOOK, opts)`。资源参数要写成字面量的 zod 对象（资源面板不运行代码读参数，`figureOptions.extend()` 读不出来）：把 `figureOptions` 的字段原样写一遍再加自己的物品，见 `chengtuo.ts`。

## 文件

- `code/rig.ts`：通用的二维骨架工具（关节坐标系、两节 IK、平滑路径、合并描边、右下阴影、受力的链、关键帧混合、呼吸和眨眼、两张线稿之间的轮廓变形 `matchOutlines` / `lerpPts`、受力弯曲 `bendAlong`、风的循环 `loopSin` / `gusty`）。
- `code/figure.ts`：**基础模型**：尺寸、骨架、姿势类型、身体和头的线稿常量（用户亲手画的，作品 5b227852 的 `public/ref/秤砣-线稿.svg`）、画法和 `Look` 图层接口、表情、按关节角度的参数和资源。
- `code/figure-side.ts`：基础模型 3/4 侧面（朝左）的线稿常量（用户画的 `public/ref/秤砣-侧面线稿.svg`）：脸、眼珠、鼻子、嘴、脖子、身子。和 `chengtuo-side.ts` 一起由作品 5b227852 的 `production/侧面线稿换算.cjs` 生成，别手改。
- `code/chengtuo-draw.ts`：**秤砣**的 Look：配色、头发（后面的长发、刘海、鬓发，随风和失重）、围巾、手套、外套、袖标、铁靴、拿砖 `holdBrick`。
- `code/chengtuo-side.ts`：秤砣刘海的 3/4 外轮廓（生成的）。
- `code/chengtuo-costume.ts`：外套（正面、3/4 两张）、袖口、袖标、肩头铆钉、铁靴的线稿常量，由作品 5b227852 的 `production/服装线稿换算.cjs` 从 `public/ref/秤砣-服装线稿.svg`、`秤砣-服装侧面线稿.svg` 生成（按元素 id 认），别手改。
- `code/chengtuo-moves.ts`：动作、`POSES`。
- `code/chengtuo.ts`：秤砣的入口，导出上面全部（连同基础模型），加上参数和资源声明。
