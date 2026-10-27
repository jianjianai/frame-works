# 歌词时间的核对（2026-10-27）

`lib/lyrics_t.ts` 的时间是这样来的，下次改歌词时间照这个做（在服务器上跑，不参与作品运行）：

1. `node fetch-krc-all.mjs "乌托邦P - 反乌托邦" 152000 > krc.txt`：酷狗所有候选的 KRC 逐字时间（这首 7 个候选一模一样）。
2. 人声分离（KRC 里有 16 处不对，伴奏里看频谱认不出字，要先把人声单独分出来）：
   - 在一个临时目录 `npm install onnxruntime-node@1.20.1`，下载 UVR 的 `Kim_Vocal_2.onnx`（huggingface.co/seanghay/uvr_models，约 67 MB）；
   - ffmpeg 把歌解成 44.1 kHz 双声道 f32le：`ffmpeg -i 歌.flac -ac 2 -ar 44100 -f f32le mix44.f32`；
   - `node separate-vocals.mjs mix44.f32 Kim_Vocal_2.onnx vocals44.f32`（152 秒的歌 8 核约 2 分钟；纯伴奏段落出来是 −50～−70 dB，唱段 −12～−18 dB，说明分得干净）。
3. `node vocal-look.mjs vocals44.f32 <起> <止> [逐字时间,逗号隔开]`：画出这一段人声的频谱（out.ppm，用 ffmpeg 转 png 看；竖白线整秒、灰虚线 0.1 秒、上沿绿刻度是拍子、红/青短线是给的时间），并打印每 20 毫秒的音高、响度、高频（擦音、送气音）。
   - 认字：字和字之间响度掉一截（声母是 b d g 的塞音更深）；zh ch sh z c s j q x h 的字头有一段高频噪声；n m 开头、w y 开头（滑音）没有缺口，看音高的台阶和高频突然变小（w 的圆唇让高频掉下去）。
   - 副歌每句 2 秒一小节，节奏一样，可以拿对的句子当模板对照。
