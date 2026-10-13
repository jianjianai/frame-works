# code/blocked —《屏蔽》（stalk ur socials）的人物和场景

竖屏 1080×1920，和 `code/draw.ts`、`code/kid.ts` 同一套画法，直接导入使用（例如 `import { drawDad } from "@materials/s0rrow/code/blocked/dad"`）。每个文件末尾的 `resources` 声明了可以预览的资源，用 `resources_search` / `resource_view` 查看。

| 文件 | 内容 |
|---|---|
| `dad.ts` | **爸爸（夜班保安）** `drawDad(ctx, x, y, s, pose)`：(x, y) 头中心，s = 1 脸宽约 236。花白鬓角、老花镜、保安大檐帽、深蓝制服，`coat` 披带毛领的军大衣；正面 / 背影；表情（tired 熬夜、down 低头看手机、wide 愣住、teary 含泪、happy 笑眯眼）；手（`phone` 两手捧手机、`type` 一根手指打字 + `tap`、`mouth` 捂嘴）都是圆手；`young` 是年轻时的他（黑发白衬衫，放进旧合照）。手里的手机用 `holding` 画（在袖子和手之间）。 |
| `booth.ts` | **门卫室**：雪夜的厂门口 `gateNight`（厂名牌、伸缩门、钠灯光锥、车辙脚印）、室内朝窗 `boothBack`（他的背影之后画）、背墙 `boothFront`（挂钟、挂历、蜡笔画，`blur` 做景深）、值班桌俯拍 `deskTop`（玻璃板下的照片和便条、值班本；手机放在 (540, 880)）、外景 `boothOutside`（暖窗里由 `inside` 画人，窗中心 `BOOTH_WINDOW`）；钠灯颜色 `LAMP`。厂名、LED 屏、监控时间、挂钟、挂历、便条和值班记录都是参数，默认是《屏蔽》里的。 |
| `booth-detail.ts` | `boothBack({ detailed: true })` 的精细实现：窗框凹槽、锁扣螺丝、冷凝水与霜、四路厂区监控、玻璃木桌与值班本、杯瓶磨损、收音机、钥匙、柜腿、椅子、地砖和桌下取暖器。厂门和杯瓶通过原模块直接复用；默认基础版不变。 |
| `desk-detail.ts` | `deskTop({ detailed: true })` 的精细实现：木纹清漆、玻璃厚边与窗光、玻璃下的旧照片/便条、值班本叠页与书脊、钢笔、茶汤/杯沿/热气、钥匙齿口与皮牌。`phoneLight: 0..1` 控制微弱漏光，`phoneResting: true` 加中央手机接触阴影（机身中心 (540, 880)、scale .92、rot .06）；手机由镜头画，默认基础版不变。 |
| `snow.ts` | **下雪** `snow(ctx, abs, { n, seed, speed, size, alpha, drift, x, y, w, h })`：按绝对时间、确定性；远景一层小而密，近景再叠一层 `filtered` blur 4px 的大雪花。 |

人物的夜景打光用 draw.ts 的 `litFigure`（暗部 + 点光 + 轮廓光）：手机照脸 `{ shade: 0.3, lights: [{ x, y, r: 430, rgb: "170,195,255", a: 0.4 }], rim }`。精细岗亭的背影加 `backDetails: true`（帽子拼缝、花白短发、毛领、大衣肩线与半腰带），shade 约 0.38、冷色环境底，手机/监控的点光照在后脑，取暖器暖光落在大衣下方，窗外路灯的内侧轮廓光约 0.38、width 7；各点光坐标跟镜头里真实物件对齐。场景已经处理材质暗部和光池，画完人物后不要再整幅压黑。

桌面俯拍的打光：右上窗外钠灯为暖光，左侧监控为弱冷色补光。玻璃下的照片和便条只有薄纸边；桌上的本子、茶杯和钥匙按高度画接触阴影与柔和投影，窗光反射留在它们下面。手机漏光宜低（局部约 0.09），不可整幅叠蓝；熄屏时设 `phoneLight: 0`，结尾返回同一张桌子继续用同一个精细版本。

《屏蔽》里的用法（作品 work-73c8f9bc 的 acts/act2.ts、act3.ts）：岗亭背影 `boothBack` + `drawDad(…, { view: "back", coat: true })`；桌面俯拍 `deskTop` + 手机熄屏时黑屏里映出 `drawDad` 的脸；一根手指打字 `boothFront({ blur: 7 })` + `drawDad(540, 600, 1.42, { arms: "type", tap })`；结尾从窗里拉出来 `boothOutside(ctx, abs, (k) => drawDad(k, 590, 925, 0.4, …))`。
