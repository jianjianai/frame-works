import type { SceneOptions } from "../../../src/engine/types";
import { createShotScene, type ShotFactory } from "./lib";
import { city, phone, photo, grow, mute, cake } from "./shots1";
import { fold, door, call, ward, rewind, ending } from "./shots2";

// 每个镜头在时间轴上的预定起点（鼓点对齐用；与 visual.json 保持一致）
export const SHOTS: Record<string, [ShotFactory, number]> = {
  city: [city, 0],
  phone: [phone, 0.75],
  photo: [photo, 6.16],
  grow: [grow, 9.2],
  mute: [mute, 13.94],
  cake: [cake, 17.01],
  fold: [fold, 20.65],
  door: [door, 23.7],
  call: [call, 27.39],
  ward: [ward, 30.69],
  rewind: [rewind, 34.27],
  ending: [ending, 37.61],
};

export function createShot(name: string, options: SceneOptions) {
  const [factory, start] = SHOTS[name];
  return createShotScene(options, factory, start);
}
