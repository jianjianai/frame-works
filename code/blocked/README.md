# code/blocked —《屏蔽》（stalk ur socials）的人物和场景

竖屏 1080×1920，和 `code/draw.ts`、`code/kid.ts` 同一套画法，直接导入使用（例如 `import { drawDad } from "@materials/s0rrow/code/blocked/dad"`）。每个文件末尾的 `resources` 声明了可以预览的资源，用 `resources_search` / `resource_view` 查看。

| 文件 | 内容 |
|---|---|
| `dad.ts` | **爸爸（夜班保安）** `drawDad(ctx, x, y, s, pose)`：(x, y) 头中心，s = 1 脸宽约 236。花白鬓角、老花镜、保安大檐帽、深蓝制服，`coat` 披带毛领的军大衣；正面 / 背影；表情（tired 熬夜、down 低头看手机、wide 愣住、teary 含泪、happy 笑眯眼）；手（`phone` 两手捧手机、`type` 一根手指打字 + `tap`、`mouth` 捂嘴）都是圆手；`young` 是年轻时的他（黑发白衬衫，放进旧合照）。手里的手机用 `holding` 画（在袖子和手之间）。 |
| `booth.ts` | **门卫室**：雪夜的厂门口 `gateNight`（厂名牌、伸缩门、钠灯光锥、车辙脚印）、室内朝窗 `boothBack`（他的背影之后画）、背墙 `boothFront`（挂钟、挂历、蜡笔画，`blur` 做景深）、值班桌俯拍 `deskTop`（玻璃板下的照片和便条、值班本；手机放在 (540, 880)）、外景 `boothOutside`（暖窗里由 `inside` 画人，窗中心 `BOOTH_WINDOW`）；钠灯颜色 `LAMP`。厂名、LED 屏、监控时间、挂钟、挂历、便条和值班记录都是参数，默认是《屏蔽》里的。 |
| `snow.ts` | **下雪** `snow(ctx, abs, { n, seed, speed, size, alpha, drift, x, y, w, h })`：按绝对时间、确定性；远景一层小而密，近景再叠一层 `filtered` blur 4px 的大雪花。 |

人物的夜景打光用 draw.ts 的 `litFigure`（暗部 + 点光 + 轮廓光）：手机照脸 `{ shade: 0.3, lights: [{ x, y, r: 430, rgb: "170,195,255", a: 0.4 }], rim }`，岗亭里的背影 `{ shade: 0.45, rim: { ux: 0.3, uy: -1, rgb: "255,190,120", a: 0.55, width: 8 } }`（门外路灯的暖色轮廓光）。

《屏蔽》里的用法（作品 work-73c8f9bc 的 acts/act2.ts、act3.ts）：岗亭背影 `boothBack` + `drawDad(…, { view: "back", coat: true })`；桌面俯拍 `deskTop` + 手机熄屏时黑屏里映出 `drawDad` 的脸；一根手指打字 `boothFront({ blur: 7 })` + `drawDad(540, 600, 1.42, { arms: "type", tap })`；结尾从窗里拉出来 `boothOutside(ctx, abs, (k) => drawDad(k, 590, 925, 0.4, …))`。
