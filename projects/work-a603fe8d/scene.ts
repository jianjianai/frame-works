import type { SceneOptions } from "../../src/engine/types";
import { createCompositionScene } from "../../src/engine/compositor";
import visual from "./visual.json";

// 每个镜头一个 scene 图层（定义在 scenes/shots1.ts、shots2.ts），上面叠歌词层和胶片特效层。
const shot = (name: string) => () =>
  import("./scenes/shots").then((m) => ({ createScene: (o: SceneOptions) => m.createShot(name, o) }));

export function createScene(options: SceneOptions) {
  return createCompositionScene(options, visual, {
    city: shot("city"),
    phone: shot("phone"),
    photo: shot("photo"),
    grow: shot("grow"),
    mute: shot("mute"),
    cake: shot("cake"),
    fold: shot("fold"),
    door: shot("door"),
    call: shot("call"),
    ward: shot("ward"),
    rewind: shot("rewind"),
    ending: shot("ending"),
    lyrics: () => import("./scenes/lyrics"),
    fx: () => import("./scenes/fx"),
  });
}
