# s0rrow《i have no friends》

来自作品 work-bdd5c2f8 的可复用素材。

- `i-have-no-friends.flac`：整曲，99.1 秒。
- `cover.jpg`：封面，3000×3000。
- `i-have-no-friends.lrc`：逐行歌词时间。
- `lyrics-data.ts`：酷狗 KRC 逐字时间 + 自译中文（每句中文拆成与英文单词数相同的词，第 i 个中文词用第 i 个英文单词的时间点亮；改歌词必须保持词数一致）。
- `audio-template.json`：混音参考。歌曲分三段（0–65.62、65.59–67.07、67.04–99.1）；中间一段走 480Hz 低通做「闷音」；音乐轨对音效轨闪避（duck amount 0.7 = 闪避时保留的增益）；房间混响 bus；master 限幅 -1dB。`src` 指向原作品路径，复用时改成 `materials/s0rrow/i-have-no-friends/i-have-no-friends.flac`；generated 音效源需要作品自己的 `audio.ts`。

## 来源与许可
- 歌曲、封面、LRC：用户提供，版权归原作者，仅用于该用户自己的作品。
- 逐字时间来自酷狗 KRC；中文翻译为作品自译。
- 字体未放入：作品里的字体按用到的字符子集化，换文案会缺字。可自行从 Google Fonts 取 Gochi Hand、Permanent Marker、ZCOOL KuaiLe、Long Cang、Noto Sans SC（均为 OFL 1.1）。
