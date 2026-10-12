import type { SceneOptions } from "@frame/engine/types";
import { createLyricsScene, lyricLines, type LyricWords } from "@materials/s0rrow/code/lyrics";
import { LYRIC_WORDS } from "./krc";
import { musicJump, END } from "./timeline";
// The supplied LRC supplies phrase anchors; the matching 78 s KRC supplies word intervals.
const A = [
 ["我","反复","看你的","动态 ","直","到","双眼","","麻木"],
 ["你","根本","不","知道 ","我","有","多","渴望","你的","心"],
 ["我","看遍","你","的","转发 ","想","知道","你","在","想什么"],
 ["可","我","无法","和你","在一起 ","你","想要","另一个","人"]
];
const CN = [...A,
 ["看着","你","那么","快乐 ","那么","快乐"],
 ["吻着","另","一个人 ","那么","快乐"],
 ["让","我","如此","孤独 ","如此","孤独"],
 ["为什么","一切","会","这么","难"],
 ["去","看向","镜子","里","的自己 ","如此","孤独"],
 ["而","你","所看","到","的 ","不","过是","倒影"],
 ["那么","快乐"], ...A];
const INDICES=[0,1,2,3,8,9,10,11,12,13,14,15,16,17,18];
const SHIFTS=[-.140,-.166,-.263,-.252,.144,.144,.172,.172,-.208,-.208,-.208,-.112,-.267,-.209,-.281];
export function createScene(options: SceneOptions) {
  const lines: LyricWords=INDICES.map((source,i)=>LYRIC_WORDS[source].map(([s,d,w])=>[s+SHIFTS[i]-(source>=8?musicJump():0),d,w]));
  // Prevent the last syllable of one phrase overlapping the next subtitle.
  lines.forEach((line,i)=>{if(i+1<lines.length){const last=line[line.length-1];last[1]=Math.max(.04,Math.min(last[1],lines[i+1][0][0]-last[0]-.025));}});
  return createLyricsScene(options,{
    lines:lyricLines(lines,CN),end:END-.18,
    style:i=>({bridge:i>=4&&i<11,outro:i>=11}),
  });
}

