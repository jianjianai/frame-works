# 剪纸角色

二维骨架剪纸画风的角色（深色描边、平涂、右下一道阴影，部件绑在骨架上靠关节转动），用 Canvas 2D 代码画，按绝对时间渲染。现在有《引力》的女主秤砣：正面 ↔ 3/4 连续转身，表情可调，身上的物品可以显示或隐藏，姿势按每个关节的角度摆。

## 资源

- `code/chengtuo.ts#chengtuo` **秤砣**（角色）：19 岁少女，黑色齐刘海长直发，米白毛衣、深灰裤袜、光脚，芥末黄围巾、藏青手套。
  - 朝向 `face`：0 正面，-1 3/4 朝画面左，1 3/4 朝画面右，中间值连续转身。
  - 表情 `expression`：平常、笑、哭着笑、难过、惊、使劲、闭眼、哼歌、仰望、心疼；`blink` `happy` `sad` `fierce` `wide` `smile` `open` `lookX/lookY` `blush` `tears` 在它上面再调。
  - 物品：`scarf` 围巾、`gloves` 手套（关掉是光着的手）、`brickL` / `brickR` 手里拿一块砖。外套、铁靴、红袖标还没画，画好后也放在这里开关。
  - 姿势：每个关节一个角度（度）。`neck` 脖子、`lean` 腰、`rot` 整个人转；手臂 `shoulder` 肩、`elbow` 肘、`wrist` 手腕、`hand` 手形、`layer` 画在身体前 / 后；腿 `hip` 胯、`knee` 膝、`ankle` 脚、`thigh` 大腿长度比例（正面蹲下时压短）。`ground` 打开时按腿的角度自动把脚放到地面，`lift` 再往上抬。
  - 头发、围巾：`float` 飘起来（像在水里），`wind` 往左右甩。`idle` 呼吸和眨眼。
  - 预设：3/4 朝左 / 朝右、抱臂、半蹲、挥手、坐、单膝跪递砖、跳起来抓、飘、摘了围巾和手套。

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
- `drawChengtuo(ctx, pose, opts)` 是底层画法（角度用弧度，手脚还能给 `to` 用 IK 伸到某一点，`ik` 0→1 在关键帧之间从摆臂过渡到伸手）；`pose.items` 开关物品；`opts.hold.L/R` 在手里画任何东西；`jointsOf(pose)` 给出各关节在画面里的位置，用来对齐道具和别的角色。
- 动作（全部只依赖时间，可以任意跳转）：`stand` 呼吸眨眼、`walk` 走路（返回位移，`walkSteps` 给每一步落地的时刻）、`jumpGrab` 蹲跳抓、`kneelGive` 单膝跪掏砖递砖、`float` 飘；`POSES` 片子里的静止姿势，`EXPRESSIONS` 表情。

## 文件

- `code/rig.ts`：通用的二维骨架工具（关节坐标系、两节 IK、平滑路径、合并描边、右下阴影、受力的链、关键帧混合、呼吸和眨眼、两张线稿之间的轮廓变形 `matchOutlines` / `lerpPts`），别的剪纸角色也用它。
- `code/chengtuo-draw.ts`：秤砣的画法、尺寸、配色、姿势类型。头和身体的轮廓是用户亲手画的线稿（作品 5b227852 的 `public/ref/秤砣-线稿.svg`）换算出来的贝塞尔常量。
- `code/chengtuo-side.ts`：3/4 侧面（朝左）的线稿常量（用户画的，作品 5b227852 的 `public/ref/秤砣-侧面线稿.svg`，换算脚本在那个作品的 `production/侧面线稿换算.cjs`）：脸、刘海外轮廓、眼珠、鼻子、嘴、脖子、身子。转身时和正面的同一块逐点对应、平滑过渡。
- `code/chengtuo-moves.ts`：动作、`POSES`、`EXPRESSIONS`。
- `code/chengtuo.ts`：入口，导出上面全部，加上按关节角度摆姿势的参数和资源声明。
