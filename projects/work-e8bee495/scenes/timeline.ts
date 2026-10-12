import { beatAt, beatLength } from "@frame/engine/tempo";
export const END = 47.203;
/** All visual cuts use the measured song grid. */
export const at = (beat: number) => beatAt(beat);
export const musicJump = () => beatLength() * 32;
export const SHOTS: [number, string, string][] = [
  [0,"opening","她的新照片"],[4,"patch","那件外套"],[8,"reaction","认出补丁"],
  [12,"location","熟悉的咖啡馆"],[16,"message","我来拿外套"],[24,"street","赶去转角"],
  [32,"arrival","窗外"],[40,"glass","隔着玻璃"],[48,"revealMove","看清对面"],
  [56,"empty","空着的位置"],[64,"her","她的视角"],[72,"enter","门铃"],
  [76,"take","取回外套"],[80,"choice","他没有离开"],[84,"sit","坐下"],
  [88,"ending","把手机放下"]
];

