import type { SceneOptions } from "@frame/engine/types";
import { createCompositionScene } from "@frame/engine/compositor";
import { timeline } from "@frame/engine/timeline";

export async function createScene(options: SceneOptions) {
  return createCompositionScene(options, timeline().visual, {
    act1: () => import("./scenes/act1"),
    act2: () => import("./scenes/act2"),
    act3: () => import("./scenes/act3"),
    act4: () => import("./scenes/act4"),
    act5: () => import("./scenes/act5"),
    act6: () => import("./scenes/act6"),
    finale: () => import("./scenes/finale"),
    recall: () => import("./scenes/recall"),
    lyrics: () => import("./scenes/lyrics"),
  });
}
