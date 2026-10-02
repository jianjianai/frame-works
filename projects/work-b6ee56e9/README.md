# 折叠｜THE IMPOSSIBLE FOLD

120 秒原创三维视听短片，1920 × 1080，30 fps，128 BPM。建议全屏、佩戴耳机观看；中文字幕可关闭，主要叙事由同一张红纸与同一组机械构件的变化完成。

## 入口

`project.ts` 是元数据、字幕、镜头标记和四轨混音的唯一权威；`scene.ts` 是 Three.js 绝对时间场景；`audio.ts` / `pcm.worker.ts` 将 `music/score.ts` 的原创乐谱与合成器接入公共 PCM Worker。没有在线素材依赖、付费合成调用、独立动画时钟或预先下载的整片配乐。

场景包括纸面形变、带状长廊、螺旋、莫比乌斯曲面、逐实例折纸与飞机群。灯光、镜头、随机纹理、音频采样均可由绝对时间重建。64 个建筑构件在结尾成为 64 架纸飞机；逐实例顶点形变也用于深度材质，保持投影一致。

## 音轨

- RHYTHM：128 BPM 低鼓、军鼓、踩镲、过门。
- WEIGHT：低频与切分脉冲。
- FLIGHT：四和弦发展、拨弦、主题旋律、尾声钟音。
- CREASE：纸张摩擦、冲击、过渡与起飞音效。

音频在工作线程分段生成；冷跳、倒跳、分段导出使用相同采样函数。61 秒附近的低电平是设计的屏息段，不是音轨丢失。片尾 119.8 秒前收尾。

## 检查与导出

```sh
pnpm --silent film validate work-b6ee56e9 --json
pnpm --silent film test-e2e work-b6ee56e9 --json
pnpm --silent film storyboard work-b6ee56e9 --times "1.5,15,34,60.5,66.5,76,103,113,116" --width 960
pnpm --silent film export work-b6ee56e9 --width 1920 --fps 30 --json
node --experimental-strip-types projects/work-b6ee56e9/scripts/render-score.mjs
```

只修改 `projects/work-b6ee56e9/`。运行源文件和说明放在本目录；制作设计位于 `production/brief.md`；验证和审看记录位于 `records/`；临时预览及导出位于忽略的 `exports/`。不复用其他作品私有代码。
