# 刷了一晚上，为什么还是没休息够？

作品 UUID：8d43897b-d9e6-482a-90b4-0123d29490ca；工程：work-8d43897b。90 秒，1080×1920，30fps。

- project.ts：静态元数据、镜头标记与加载入口。
- scene.ts：原创二维角色与连续场景；纯绝对时间渲染，可冷跳与倒跳。
- captions.ts：32条中文字幕，由场景按48px/1080宽绘制，支持 setSubtitles 开关。
- audio.ts：原创电子配乐与动作音效；music/foley 生成器。
- audio.json：权威三轨混音（旁白、配乐、音效），旁白避让与峰值保护。
- public/imports：13段中文旁白；通过 Frame 内置 Kokoro 生成。
- production/brief.md：作品设计；sources.md：研究来源与许可；narration-timeline.json：实测语音时长；subtitles.srt：中文字幕。
- records：修改与验收记录；exports：生成产物。

所有修改仅限本工程，公开引擎保持只读。无新增依赖。资源 URL 为 films/work-8d43897b/。

当前 Frame Canvas 导出用 audioTracks 判断是否存在音频，因此元数据保留 music/foley 的真实生成器描述；实际混音以 loadAudioDocument 加载的 audio.json 为唯一权威，不叠加旧轨道。公共字幕列表留空，自绘字幕保持竖屏可读字号；SRT 可用于另行编辑。
