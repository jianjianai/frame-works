# 示例：三维产品展示
本作品是 FRAME 官方 Three.js 示例，1920×1080、30 fps、24 秒、静音。

## 示范内容
- 0–6 秒：直接 model 图层使用 Avocado.glb，spin 转动和 HDR 环境光。
- 6–13 秒：three scene 调用素材库 turntable，展示 loadModel / loadEnvironment / showcase / frameObject。
- 13–19 秒：直接 model 图层使用 Fox.glb，Walk 骨骼动画、转动、HDR 环境光。
- 19–24 秒：three scene 调用 emblem，品牌式收尾。
- Canvas 2D background 和 title 层独立控制背景、标题、卖点、章节与进度线。

## 素材与资源
- 素材库「三维示例」是为本作品新建的：用 三维示例/code/studio.ts#turntable、#emblem（从 @materials/三维示例/code/studio 导入）；库里另有 habitat（低多边形森林岛）与 orbit（几何轨道）可直接复用。
- 资产：models/Avocado.glb、models/Fox.glb、environments/studio_small_09_1k.hdr。

## 视觉约定
- 深墨绿 #10251f、暖白 #f3f1df、青柠 #d9ff65。左侧排字、右侧物体，104px 安全边距，四章：形体 → 光影 → 生机 → 结尾。
- 章节切点 6、13、19 秒；不使用测试图、调试标签。

## 许可
- Avocado：Microsoft，CC0-1.0。
- Fox 模型：PixelMannen，CC0-1.0；绑定动画：tomkranis，CC-BY-4.0；glTF 转换：AsoboStudio & scurest，CC-BY-4.0。来源 https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox ，许可 https://creativecommons.org/licenses/by/4.0/ 。
- HDR：Studio Small 09，Sergej Majboroda / Poly Haven，CC0，https://polyhaven.com/a/studio_small_09 。
- 原始 GLB / HDR 未修改，展示时只做变换、动画与照明处理。原创几何资源及代码 CC0-1.0。
