# code/blocked —《屏蔽》（stalk ur socials）的人物和场景

竖屏 1080×1920，和 `code/draw.ts`、`code/kid.ts` 同一套画法，直接导入使用（例如 `import { drawDad } from "@materials/s0rrow/code/blocked/dad"`）。每个文件末尾的 `resources` 声明了可以预览的资源，用 `resources_search` / `resource_view` 查看。

| 文件 | 内容 |
|---|---|
| `dad.ts` | **爸爸（夜班保安）** 配色 `DAD_COLORS`（画他身上局部特写时用：大衣 coat、制服 uni、肤色 skin）；`drawDad(ctx, x, y, s, pose)`：(x, y) 头中心，s = 1 脸宽约 236。花白鬓角、老花镜、保安大檐帽、深蓝制服，`coat` 披带毛领的军大衣；正面 / 背影；表情（tired 熬夜、down 低头看手机、wide 愣住、teary 含泪、happy 笑眯眼）；手（`phone` 两手捧手机、`type` 一根手指打字 + `tap`、`mouth` 捂嘴）都是圆手；`young` 是年轻时的他（黑发白衬衫，放进旧合照）。手里的手机用 `holding` 画（在袖子和手之间）。 |
| `booth.ts` | **门卫室**：雪夜的厂门口 `gateNight`（厂名牌、伸缩门、钠灯光锥、车辙脚印）、室内朝窗 `boothBack`（他的背影之后画）、背墙 `boothFront`（挂钟、挂历、蜡笔画，`blur` 做景深）、值班桌俯拍 `deskTop`（玻璃板下的照片和便条、值班本；手机放在 (540, 880)）、外景 `boothOutside`（暖窗里由 `inside` 画人，窗中心 `BOOTH_WINDOW`）；钠灯颜色 `LAMP`。厂名、LED 屏、监控时间、挂钟、挂历、便条和值班记录都是参数，默认是《屏蔽》里的。 |
| `booth-detail.ts` | `boothBack({ detailed: true })` 的精细实现：窗框凹槽、锁扣螺丝、冷凝水与霜、四路厂区监控、玻璃木桌与值班本、杯瓶磨损、收音机、钥匙、柜腿、椅子、地砖和桌下取暖器。厂门和杯瓶通过原模块直接复用；默认基础版不变。 |
| `desk-detail.ts` | `deskTop({ detailed: true })` 的精细实现：木纹清漆、玻璃厚边与窗光、玻璃下的旧照片/便条、值班本叠页与书脊、钢笔、茶汤/杯沿/热气、钥匙齿口与皮牌。`phoneLight: 0..1` 控制微弱漏光，`phoneResting: true` 加中央手机接触阴影（机身中心 (540, 880)、scale .92、rot .06）；手机由镜头画，默认基础版不变。正在写值班记录：`logWrite: 0..1` 把最后一行（时间已写好）后面的字从左到右写出来，`pen: false` 把桌上的笔拿走，`heldPen(ctx, logPen(ctx, o), 0.3)` 把同一支笔画在笔尖处（手由镜头画：`camera` 放大到值班本约 3.4 倍，圆手和袖子画在屏幕坐标里；《屏蔽》试过、被否，片里没有用）。 |
| `booth-front-detail.ts` | `boothFront({ detailed: true })` 的正面反打：挂钟刻度、日历叠页、旧蜡笔画、针织围巾、侧窗锁扣与结霜、椅背和取暖器。`boothFrontDesk(ctx, abs, { y: 1495, phoneLight: 1 })` 在人物之后画玻璃桌、左侧茶杯和右侧值班本，遮住半身下沿。精细背景自带夜景光影，近景 blur 约 3.5，不再整幅叠黑。 |
| `booth-outside-detail.ts` | `boothOutside({ detailed: true })` 的雪夜外景：屋顶积雪与冰挂、墙体板缝/五金/侧门、偏置滑窗/窗台/霜、砖柱与伸缩门、自行车轮辐/挡泥板/链条/后架、雪地压痕和脚印。复用原厂门及正面室内背景，冷蓝雪地承接柔边暖窗光；窗内人物由调用方画，原窗中心保持不变。 |
| `cctv.ts` | **监控屏的四路画面** `cctvFeeds(ctx, abs, { time, guard })`：01 大门、02 厂区、03 门卫室、04 道路，深夜下雪、空无一人，只有门卫室那一路坐着他（`guard` 在 boothBack 的整幅坐标里画他），道路那一路只有一串脚印。画在 `boothBack({ detailed: true })` 之后、同一套坐标里，盖住原来的简笔画面；特写时 camera 推到 `CCTV_SCREEN` / `feedRect(2)`。《屏蔽》试过用它表现他一个人守夜，用户否掉（工作镜头和看女儿照片的主线接不上），片里没有用。 |
| `snow.ts` | **下雪** `snow(ctx, abs, { n, seed, speed, size, alpha, drift, x, y, w, h })`：按绝对时间、确定性；远景一层小而密，近景再叠一层 `filtered` blur 4px 的大雪花。 |

人物的夜景打光用 draw.ts 的 `litFigure`（暗部 + 点光 + 轮廓光）：手机照脸 `{ shade: 0.3, lights: [{ x, y, r: 430, rgb: "170,195,255", a: 0.4 }], rim }`。精细岗亭的背影加 `backDetails: true`（帽子拼缝、花白短发、毛领、大衣肩线与半腰带），shade 约 0.38、冷色环境底，手机/监控的点光照在后脑，取暖器暖光落在大衣下方，窗外路灯的内侧轮廓光约 0.38、width 7；各点光坐标跟镜头里真实物件对齐。场景已经处理材质暗部和光池，画完人物后不要再整幅压黑。

正面近景加 `drawDad({ frontDetails: true, screenReflection: .85 })`：帽子缝线与织纹、灰白鬓角、制服缝线、胸章、袖口、毛领，仍保留简单圆手。`arms: "type"` 时点按手位于手机的屏幕一侧；手机在袖子和握持手之间，使用 `phoneBack` 的 detailed 深灰款。眼镜反射裁在镜片外下角，避免遮住瞳孔；不要再额外画两个大光晕。场景只做小范围冷光（下半张脸约 r=310、a=.27；手约 r=215、a=.1），暖窗光照右侧，人物 shade 约 .38，内侧轮廓光约 .34/width 5。

桌面俯拍的打光：右上窗外钠灯为暖光，左侧监控为弱冷色补光。玻璃下的照片和便条只有薄纸边；桌上的本子、茶杯和钥匙按高度画接触阴影与柔和投影，窗光反射留在它们下面。手机漏光宜低（局部约 0.09），不可整幅叠蓝；熄屏时设 `phoneLight: 0`，结尾返回同一张桌子继续用同一个精细版本。

《屏蔽》里的用法（作品 work-73c8f9bc 的 acts/act2.ts、act3.ts）：岗亭背影 `boothBack` + `drawDad(…, { view: "back", coat: true })`；桌面俯拍 `deskTop` + 手机熄屏时黑屏里映出 `drawDad` 的脸；一根手指打字 `boothFront({ blur: 7 })` + `drawDad(540, 600, 1.42, { arms: "type", tap })`；结尾从窗里拉出来 `boothOutside(ctx, abs, (k) => drawDad(k, 590, 925, 0.4, …))`。
