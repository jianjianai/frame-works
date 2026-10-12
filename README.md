# 三维示例

三维示例是用于产品展示、品牌片头与轻量角色短片的 Three.js 素材库，包含两份 GLB、1k HDR 环境光与四个可调三维资源。

## 资源清单
均声明在 `code/studio.ts`，参数使用 zod，每个资源含 presets，preview engine 为 three。
| 资源 id | 用途 | 参数 | 预设 |
|---|---|---|---|
| 三维示例/code/studio.ts#turntable | GLB 产品转台与 HDR 环境照明 | model、color、lighting、speed | 青柠产品、暖色狐狸 |
| 三维示例/code/studio.ts#habitat | 带骨骼动画狐狸的森林岛 | color、animation | 青柠森林、秋日漫步 |
| 三维示例/code/studio.ts#emblem | 立体取景框与旋转晶体 | color、twist | 青柠标志、冰蓝标志 |
| 三维示例/code/studio.ts#orbit | 金属轨道与几何粒子背景 | color、density | 青柠轨道、冷色密集 |

## 资产清单
| 文件 | 大小 | 内容 |
|---|---:|---|
| models/Avocado.glb | 8,110,040 bytes | 682 三角形，无动画 |
| models/Fox.glb | 162,852 bytes | 576 三角形，带骨骼；Survey 3.417s / Walk 0.708s / Run 1.158s |
| environments/studio_small_09_1k.hdr | 1,615,248 bytes | 1024×512（1k）HDR 全景图 |
所有文件小于 10 MB。GLB 自带纹理，三个原始下载文件均未修改。

## 用法要点
1. materials_link 关联库，materials_use 锁定代码与资产；更新后用 update:true 切换版本，不要手改 .materials 或 materials.lock.json。
2. resources_search 找资源，resource_view 选 preset 或 params 并预览；asset_view 查看原始模型、动画与 HDR。
3. 场景导入示例：
```ts
import type { SceneOptions } from "@frame/engine/types";
import { createThreeScene } from "@frame/engine/scene-adapters";
import { turntable } from "@materials/三维示例/code/studio";
export function createScene(options: SceneOptions) {
  return createThreeScene(options, renderer =>
    turntable(renderer, { model: "Avocado", lighting: "hdr", speed: 16 })
  );
}
```
4. 返回 scene、camera、object、update(t)。每帧传绝对时间，允许跳转、倒退与重复取帧。Fox 同时只启用一个动画，setAnimationTime 驱动 AnimationMixer。
5. 资源使用 loadModel、loadEnvironment 和 showcase；作品可用 frameObject 再构图。改变相机 aspect 后需重新取景和 updateProjectionMatrix。
6. turntable.color 控制展台边缘，保留原模型材质；lighting 为 hdr 或 studio。模型会归一化，Fox 与 Avocado 原始尺度不同。
7. 资源默认透明；只有资源预览用深绿底。visual.json 的 scene.engine 为 three，scene.ts 注册 loader；Canvas 2D 标题独立叠加。
8. 直接模型图层 source 示例：{kind:"model", src:"materials/三维示例/models/Fox.glb", animation:"Walk", spin:4, environment:"materials/三维示例/environments/studio_small_09_1k.hdr"}。
9. createThreeScene 与资源预览清理场景内 GPU 资源；自定义 Scene 需自己清理。无独立计时器、无非确定随机数。
10. 配套作品「示例：三维产品展示」为 24 秒静音视觉作品，使用 turntable、emblem 及直接模型图层。

## 素材来源与许可
### Avocado
作者 Microsoft（2017），CC0-1.0。
来源：https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Avocado
下载：https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Avocado/glTF-Binary/Avocado.glb
许可：https://creativecommons.org/publicdomain/zero/1.0/

### Fox
- 模型：PixelMannen（2014），CC0-1.0。
- 绑定与动画：tomkranis（2014），CC-BY-4.0。
- glTF 转换：AsoboStudio、scurest（2017），CC-BY-4.0。
来源：https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Fox
下载：https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb
许可：https://creativecommons.org/licenses/by/4.0/
原始 GLB 未修改；展示时仅改变比例、旋转、灯光、镜头与动画时刻。再次使用请保留以上署名、来源与许可链接。

### Studio Small 09
作者 Sergej Majboroda / Poly Haven，CC0-1.0。
来源：https://polyhaven.com/a/studio_small_09
下载：https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr
许可：https://polyhaven.com/license

### 原创内容
本任务原创的展台、树木、标志、轨道几何、TypeScript 代码和本文档采用 CC0-1.0；第三方资产按上述许可使用。
