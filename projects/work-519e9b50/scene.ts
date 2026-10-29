import type { SceneOptions } from "@frame/engine/types";
import { createCompositionScene } from "@frame/engine/compositor";
import { timeline } from "@frame/engine/timeline";
export function createScene(options: SceneOptions) {
 return createCompositionScene(options,timeline().visual,{
  title:()=>import("./scenes/title"), background:()=>import("./scenes/background"),
  product:()=>import("./scenes/product"), identity:()=>import("./scenes/identity")
 });
}