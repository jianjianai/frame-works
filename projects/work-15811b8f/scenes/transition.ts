import type { SceneOptions } from "@frame/engine/types";
import { createPixiScene } from "@frame/engine/scene-adapters";
import { beatAt } from "@frame/engine/tempo";
import { rippleWipe } from "@materials/Pixi特效/code/effects";
export function createScene(options:SceneOptions){return createPixiScene(options,app=>{
 const fx=rippleWipe({...options,duration:1,strength:100,color:"#79f5ed"});
 app.stage.addChild(fx.view);
 return t=>{
  const centers=[beatAt(12),beatAt(28),beatAt(40)];
  const center=centers.find(c=>t>=c-.5&&t<=c+.5);
  fx.update(center===undefined?-1:t-(center-.5));
 };
});}
