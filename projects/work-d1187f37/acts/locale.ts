// YouTube 版（英文本地化）：素材库自己画的中文字（课本、牛奶盒、黑板、门牌、手机界面……）换成英文，手写体换成英文手写体
// （素材库 english.ts 的 useEnglish）。每一幕和歌词层都先导入这个文件，在画第一帧之前生效；这支片子自己的字（人名、聊天）
// 在 story.ts，聊天界面是素材库 dm.ts 的 Instagram 私信。
import { useEnglish } from "@materials/s0rrow/code/english";

useEnglish();
