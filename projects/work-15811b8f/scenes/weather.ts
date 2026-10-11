import type { SceneOptions } from "@frame/engine/types";
import { createPixiScene } from "@frame/engine/scene-adapters";
import { rain } from "@materials/Pixi特效/code/effects";
import { beatAt } from "@frame/engine/tempo";
export function createScene(options:SceneOptions){return createPixiScene(options,app=>{
 const fine=rain({...options,count:460,speed:.8,wind:-.16,opacity:.24,seed:471});
 const storm=rain({...options,count:1250,speed:1.45,wind:-.28,opacity:.45,color:"#79f5ed",seed:631});
 app.stage.addChild(fine.view,storm.view);
 return t=>{fine.update(t);storm.update(t);storm.view.visible=t>=beatAt(12)&&t<beatAt(28);fine.view.visible=!storm.view.visible;
 fine.view.alpha=t>=beatAt(28)&&t<beatAt(40)?.2:1;};
});}
