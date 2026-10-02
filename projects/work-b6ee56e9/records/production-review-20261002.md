# 《折叠》制作与复核

作品：b6ee56e9-8061-4ae4-8363-7465dd7600a5；工程：work-b6ee56e9。
最终运行源码已保存至 Frame 作品分支，提交 723d8c41dfacd54ac46d4bfbb8d4154c5bdf19fe。发布构建 861cf72f-4a4f-4586-9363-5d284ef1ca57 成功，作品库状态已设为 finished。

## 内容与画面

120 秒、1920×1080 工程画幅、30 fps。原创三维连续纸面变形与四轨电子配乐。画面从同一张红纸和同一组 64 个构件发展，不靠章节卡片切换。可选中文字幕；无旁白。

先后实际渲染并审看 storyboard-first、storyboard-second、storyboard-final-beats、storyboard-lock、final-plane-check：修正了门户遮挡主体、光照发灰、释放段过久、折纸时地形遮挡及最终飞机面片重叠。最终 101.5、105、113 秒关键帧已复查。64.1 秒附近保留短暂的前景擦镜，64.35 秒主体重新出现。未声称逐帧人工审阅全部 3600 帧。

## 实测结果

- 最终结构、TypeScript、3 项乐谱采样确定性测试通过。报告：exports/reports/validate-b7484a55-1ecd-4a7d-a77a-530a096b3ad4.json。
- 最终浏览器 E2E 通过：直接和倒序跳转重建同一帧完全一致。
- 真实生产预览完成 0→120 秒播放，音频运行且无运行错误；倒跳、2 倍速与暂停稳定检查通过。详细记录：records/published-verification.json。
- 最终四条 AAC 分轨按 project.ts 的实际增益混音：-17.3 LUFS，响度范围 4.9 LU，真峰 -1.7 dBFS。记录：records/final-aac-loudness.txt。
- 当前项目边界检查通过。未修改其他作品或公共引擎、依赖、生产服务配置。

## 限制与取舍

无显卡的软件 WebGL 环境下，直接源码预览的实时合成音频曾触发 PCM Worker 跟不上；改成原创源码生成的 AAC 分轨后，直接源码长播放仍出现测试超时。未修改公共播放器来掩盖问题。交付的已编译生产预览使用平台代理音频，完整播放测试通过。

软件 WebGL 的实际渲染帧率偏低；完整播放通过不等于该测试环境实时达到 30 fps。独立 MP4 使用逐帧离线渲染，不依赖用户设备实时计算三维场景。音乐经过合成、解码与响度测量，没有进行人工听审；不把数值检查称为主观音乐验收。

## 版本核对

project.ts SHA-256：1971ee2d9475e0117e6b22157b5d426a87c28bb431d6115f2f409ad998fad116。
scene.ts SHA-256：c0692304d3507eeafe4943a45ccb92b8b427c536e2c36636e334e441e87b14ae。
music/score.ts SHA-256：f1b859bc72f6cd8f89f1965c198e2c7f47447c6b7c502c5adbf743ed82bedada。
最终本地运行输入指纹：4d964b0d2671a07eb80be5306b883b01ad7c3344df39a05448a23ca47d4bd32a。

## MP4 导出

渲染任务：005d5531-aeea-42d4-a6dc-9161da5e194a 已成功完成。成片为 1280×720、30 fps、H.264/AAC、120.000 秒，共 3600 帧，41655584 字节。完整解码、声画时长、实际计帧和源版本匹配全部通过；最终文件抽帧复核了 1.5、23、43、64.4、77、113 秒画面。原生浏览器 MP4 播放检查通过（60→66 秒，音频未静音、实际解码，无媒体错误）。

最终 MP4 响度 -17.47 LUFS，真峰 -1.76 dBFS。SHA-256：b31e180325e7651afd2ef7dcacd2327e094d0e55cf39b1ab0f5fdad7a430818f。完整验证清单：exports/renders/005d5531-aeea-42d4-a6dc-9161da5e194a/verification/verification.json。

成片另存入 Frame 素材库：4c95c2b4-e57c-4513-94ae-001b3ab8ad4e，名称为「折叠_THE_IMPOSSIBLE_FOLD_720p.mp4」，上传完成后返回的 SHA-256 与成片一致。没有把成片再次作为镜头素材接入工程，避免自引用与无意义加载。

聊天工作容器无法解析服务器下载域名，未创建 ChatGPT 文件库副本。交付使用用户 Frame 中的持久作品/成片和经过 HTTP 200、Content-Type、Content-Length 检查的服务器下载链接；不虚构 sandbox 文件链接。
