import type { SceneOptions } from "@frame/engine/types";
import { createThreeScene } from "@frame/engine/scene-adapters";
import { frameObject } from "@frame/engine/three-assets";
import { turntable } from "@materials/三维示例/code/studio";
export function createScene(options:SceneOptions) {
 const renderOptions={...options,width:Math.round(options.height*1.25)};
 return createThreeScene(renderOptions,async(renderer)=>{
  const r=await turntable(renderer,{model:"Avocado",color:"#d9ff65",lighting:"hdr",speed:8});
  frameObject(r.camera,r.object,{azimuth:18,elevation:12,margin:1.05});
  r.camera.zoom=1.22;r.camera.updateProjectionMatrix();
  return r;
 });
}