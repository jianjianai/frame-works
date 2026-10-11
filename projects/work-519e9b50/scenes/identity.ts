import type { SceneOptions } from "@frame/engine/types";
import { createThreeScene } from "@frame/engine/scene-adapters";
import { emblem } from "@materials/三维示例/code/studio";
export function createScene(options:SceneOptions) {
 return createThreeScene({...options,width:options.height},renderer=>emblem(renderer,{color:"#d9ff65",twist:0.25}));
}