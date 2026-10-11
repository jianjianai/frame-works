import type { SceneOptions } from "@frame/engine/types";
import { createCompositionScene } from "@frame/engine/compositor";
import visual from "./visual.json";
export function createScene(options: SceneOptions) {
  return createCompositionScene(options, visual, {
    background: () => import("./scenes/background"),
  });
}
