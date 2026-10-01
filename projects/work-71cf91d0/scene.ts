import type { SceneOptions } from "../../src/engine/types";
import { createCompositionScene } from "../../src/engine/compositor";
import visual from "./visual.json";

// Register project-local scene modules here.
export function createScene(options: SceneOptions) {
  return createCompositionScene(options, visual, {
    tides: () => import("./scenes/tides"),
  });
}
