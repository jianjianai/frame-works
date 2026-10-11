import type { SceneOptions } from "@frame/engine/types";
import { createPixiScene } from "@frame/engine/scene-adapters";
import { fireworks } from "@materials/Pixi特效/code/effects";
import { beatAt } from "@frame/engine/tempo";
export function createScene(options:SceneOptions){return createPixiScene(options,app=>{
 const a=fireworks({...options,count:1500,radius:340,color:"#ff69c9",originX:.735,originY:.32,seed:71});
 const b=fireworks({...options,count:850,radius:185,color:"#ffc888",originX:.9,originY:.51,seed:901});
 app.stage.addChild(a.view,b.view);
 return t=>{const local=t-beatAt(28);a.view.visible=local>=0&&t<beatAt(40);b.view.visible=local>=beatAt(2)&&t<beatAt(40);
 a.update(Math.max(0,local));b.update(Math.max(0,local-beatAt(2)));};
});}
