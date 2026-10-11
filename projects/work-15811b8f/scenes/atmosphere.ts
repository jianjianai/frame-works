import type { SceneOptions } from "@frame/engine/types";
import { createPixiScene } from "@frame/engine/scene-adapters";
import { bokeh } from "@materials/Pixi特效/code/effects";
import { beatAt } from "@frame/engine/tempo";
export function createScene(options:SceneOptions){return createPixiScene(options,app=>{
 const fx=bokeh({...options,count:72,radius:23,intensity:.21,seed:313});
 app.stage.addChild(fx.view);
 return t=>{fx.update(t);fx.view.alpha=t>=beatAt(28)&&t<beatAt(40)?.35:1;};
});}
