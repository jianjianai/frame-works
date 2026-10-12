# 示例：Lottie 动效贴纸

本作品是 FRAME 官方竖屏示例，1080×1920、30 fps、21 秒。演示 Lottie JSON 原生图层叠加 Canvas 背景与中文标题，并用素材库代码把 Lottie canvas 合成到可调参数的互动卡片。

## 叙事与画面
0–5.65 秒：奶油白开场，笑脸星星和“让灵感动起来”。
5.65–11.65 秒：深色点赞互动，红心、增长数字。
11.65–16.15 秒：灵感加载，环形贴纸、百分比。
16.15–21 秒：荧光黄绿收尾，勾选完成、收藏提示。
切镜前后用三色 Lottie 遮挡式擦拭；保持标题和底部信息安全区。声音为可选，本版无音轨。

## 素材与接口
只引用本次新建的 Lottie动效 素材库，不改其他作品或素材库。
- lottie/spark-star.json：笑脸贴纸，原生 lottie 图层，loop:3。
- lottie/heart-pop.json：点赞贴纸，原生图层，phase:0.12、rate:1.1、loop:3。
- lottie/orbit-loader.json：加载贴纸，phase:0.4、rate:1.35、loop:3。
- lottie/check-draw.json：结尾勾选，offset:0.12、rate:0.55，覆盖结尾有效时段。
- lottie/color-wipe.json：1.2 秒全屏覆盖式擦拭；0.6 秒附近切下层。
- code/widgets.ts#likeCounter、#loadingCard、#successChip：3 个 defineResources/resource Canvas 组件，zod 参数与 presets，调用 createLottieScene 后 drawImage 合成。
scenes/background.ts 导入上述 3 个工厂，各创建一次；所有状态由绝对时间 render(t) 决定，dispose 释放组件。
素材与代码许可均为“本仓库原创，CC0”；README 列出明细和用法。无表达式、无外部图片，无第三方下载。

## 编辑约定
作品代码用 files_batch，时间轴用 layers_edit，素材库用 material_write。修改后 work_check，再 preview_frames 检查完整节奏及切镜边界。时间可随意跳转、倒退与重复。保存版本前 materials_use 更新本次修改的素材版本。不要手改 materials.lock.json。

循环时间公式为 offset + (((t-start)*rate+phase) % loop)。整段循环错相使用 phase，避免非零 offset 加整段 loop 导致素材越界。Lottie 图层按动画自己的宽高比绘制：方形贴纸放进方形图层框即可填满，不用 crop。
