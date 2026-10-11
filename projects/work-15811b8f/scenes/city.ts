import type { SceneOptions } from "@frame/engine/types";
import { createPixiScene } from "@frame/engine/scene-adapters";
import { nightCity } from "@materials/Pixi特效/code/effects";
import { beatAt } from "@frame/engine/tempo";
export function createScene(options:SceneOptions){return createPixiScene(options,app=>{
 const a=nightCity({...options,seed:73,accent:"#79f5ed"});
 const b=nightCity({...options,seed:19,accent:"#ff69c9",hue:15,skyline:1.25});
 app.stage.addChild(a.view,b.view);
 return t=>{
  a.update(t);b.update(t);b.view.visible=t>=beatAt(12)&&t<beatAt(40);
  a.view.visible=!b.view.visible;
  const zoom=1+Math.min(t,14)*.0016;
  for(const fx of [a,b]){fx.view.scale.set(zoom);fx.view.pivot.set(options.width*.7,options.height*.6);fx.view.position.set(options.width*.7,options.height*.6);}
 };
});}
