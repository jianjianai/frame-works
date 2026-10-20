import type { SceneOptions } from "@frame/engine/types";
import { createCompositionScene } from "@frame/engine/compositor";
import visual from "./visual.json";

export function createScene(options: SceneOptions) {
  return createCompositionScene(options, visual, {
    act1: () => import("./scenes/act1"),
    act2: () => import("./scenes/act2"),
    act3: () => import("./scenes/act3"),
    act4: () => import("./scenes/act4"),
    act5: () => import("./scenes/act5"),
    act6: () => import("./scenes/act6"),
    act7: () => import("./scenes/act7"),
  });
}
