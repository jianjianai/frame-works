import type { SceneOptions } from "@frame/engine/types";
import { createCompositionScene } from "@frame/engine/compositor";
import visual from "./visual.json";
export function createScene(options:SceneOptions){
 return createCompositionScene(options,visual,{
  city:()=>import("./scenes/city"),atmosphere:()=>import("./scenes/atmosphere"),
  weather:()=>import("./scenes/weather"),type:()=>import("./scenes/type"),
  fireworks:()=>import("./scenes/fireworks"),transition:()=>import("./scenes/transition"),
 });
}
