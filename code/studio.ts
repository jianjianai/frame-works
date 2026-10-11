import * as THREE from "three";
import { z } from "zod";
import { defineResources, resource } from "@frame/engine/resources";
import { loadModel, loadEnvironment, showcase, frameObject, setAnimationTime } from "@frame/engine/three-assets";

const HDR = "materials/三维示例/environments/studio_small_09_1k.hdr";
const models = { Avocado: "materials/三维示例/models/Avocado.glb", Fox: "materials/三维示例/models/Fox.glb" };
function mesh(geo: THREE.BufferGeometry, color: string, metalness=0.15) {
 return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color, metalness, roughness:0.32}));
}
function normalize(object: THREE.Object3D, height: number) {
 const box = new THREE.Box3().setFromObject(object); const size=box.getSize(new THREE.Vector3());
 object.scale.multiplyScalar(height/size.y);
 const b = new THREE.Box3().setFromObject(object), c=b.getCenter(new THREE.Vector3());
 object.position.sub(new THREE.Vector3(c.x,b.min.y,c.z)); return object;
}
export const turntableOptions=z.object({
 model:z.enum(["Avocado","Fox"]).default("Avocado").describe("展示模型"),
 color:z.enum(["#d9ff65","#ffae70","#a2cfff"]).default("#d9ff65").describe("展台强调色"),
 lighting:z.enum(["hdr","studio"]).default("hdr").describe("HDR 摄影棚或内置柔光"),
 speed:z.number().min(0).max(40).default(16).describe("转速，度每秒"),
});
export async function turntable(renderer: THREE.WebGLRenderer, options: z.input<typeof turntableOptions>={}) {
 renderer.toneMapping=THREE.NeutralToneMapping; const p=turntableOptions.parse(options); const gltf=await loadModel(models[p.model],renderer);
 const model=normalize(gltf.scene,2.5); const root=new THREE.Group(), pivot=new THREE.Group();
 pivot.add(model); root.add(pivot);
 const base=mesh(new THREE.CylinderGeometry(1.7,1.85,0.22,64),"#182c29",0.65);base.position.y=-0.18;root.add(base);
 const rim=mesh(new THREE.TorusGeometry(1.72,0.018,8,96),p.color,0.5);rim.rotation.x=Math.PI/2;rim.position.y=-0.06;root.add(rim);
 const result=showcase(root,renderer,{azimuth:24,elevation:13,margin:1.12,turning:true});
 if(p.lighting==="hdr"){result.scene.environment?.dispose(); result.scene.environment=await loadEnvironment(HDR,renderer);}
 result.camera.zoom=1.22;result.camera.updateProjectionMatrix(); const mixer=new THREE.AnimationMixer(model); if(gltf.animations.length)mixer.clipAction(gltf.animations[0]).play();
 return {...result, object:root,update(t:number){pivot.rotation.y=THREE.MathUtils.degToRad(-18+t*p.speed);setAnimationTime(mixer,t);}};
}
export const habitatOptions=z.object({
 color:z.enum(["#d9ff65","#ffae70","#a2cfff"]).default("#d9ff65").describe("树冠颜色"),
 animation:z.enum(["Survey","Walk","Run"]).default("Survey").describe("狐狸骨骼动作"),
});
export async function habitat(renderer:THREE.WebGLRenderer,options:z.input<typeof habitatOptions>={}) {
 renderer.toneMapping=THREE.NeutralToneMapping; const p=habitatOptions.parse(options),gltf=await loadModel(models.Fox,renderer),root=new THREE.Group();
 const fox=normalize(gltf.scene,1.15);fox.rotation.y=-0.8;fox.position.x=0.15;root.add(fox);
 const island=mesh(new THREE.CylinderGeometry(2.2,1.7,0.4,7),"#334c40");island.position.y=-0.22;root.add(island);
 for(let i=0;i<3;i++){const x=-1.2+i*1.15,z=-0.75-Math.sin(i)*0.4;const trunk=mesh(new THREE.CylinderGeometry(0.065,0.09,0.7,6),"#8e7052");trunk.position.set(x,0.3,z);root.add(trunk);const crown=mesh(new THREE.ConeGeometry(0.52,1.3,5),p.color);crown.position.set(x,1.08,z);root.add(crown);}
 const mixer=new THREE.AnimationMixer(fox);const clip=gltf.animations.find(a=>a.name===p.animation);if(clip)mixer.clipAction(clip).play();
 const result=showcase(root,renderer,{azimuth:12,elevation:18,margin:1.1}); result.camera.zoom=1.12;result.camera.updateProjectionMatrix();
 return {...result,object:root,update(t:number){setAnimationTime(mixer,t);root.rotation.y=0.12*Math.sin(t*0.5);}};
}
export const emblemOptions=z.object({
 color:z.enum(["#d9ff65","#ffae70","#a2cfff"]).default("#d9ff65").describe("立体标志颜色"),
 twist:z.number().min(0).max(1).default(0.35).describe("转动幅度"),
});
export function emblem(renderer:THREE.WebGLRenderer,options:z.input<typeof emblemOptions>={}) {
 renderer.toneMapping=THREE.NeutralToneMapping; const p=emblemOptions.parse(options),root=new THREE.Group();
 for(const side of [-1,1]){
  const bar=mesh(new THREE.BoxGeometry(0.18,2.4,0.32),p.color,0.7);bar.position.x=side*1.3;root.add(bar);
  for(const y of [-1.11,1.11]){const arm=mesh(new THREE.BoxGeometry(0.82,0.18,0.32),p.color,0.7);arm.position.set(side*0.98,y,0);root.add(arm);}
 }
 const gem=mesh(new THREE.OctahedronGeometry(0.72), "#f5f0dc",0.8);root.add(gem);
 const result=showcase(root,renderer,{azimuth:12,elevation:8,margin:1.3});
 return {...result,object:root,update(t:number){root.rotation.y=Math.sin(t*0.45)*p.twist;gem.rotation.set(t*0.17,t*0.35,0);}};
}
export const orbitOptions=z.object({
 color:z.enum(["#d9ff65","#ffae70","#a2cfff"]).default("#d9ff65").describe("轨道与粒子颜色"),
 density:z.number().int().min(12).max(70).default(32).describe("几何粒子数量"),
});
export function orbit(renderer:THREE.WebGLRenderer,options:z.input<typeof orbitOptions>={}) {
 renderer.toneMapping=THREE.NeutralToneMapping; const p=orbitOptions.parse(options),root=new THREE.Group();
 for(let i=0;i<3;i++){const ring=mesh(new THREE.TorusGeometry(1.25+i*0.3,0.022,6,96),p.color,0.6);ring.rotation.set(0.5+i*0.7,i*0.8,0);root.add(ring);}
 const bits:THREE.Mesh[]=[];for(let i=0;i<p.density;i++){const m=mesh(new THREE.IcosahedronGeometry(0.025+(i%5)*0.009,0),i%3===0?"#f5f0dc":p.color,0.6);root.add(m);bits.push(m);}
 const result=showcase(root,renderer,{azimuth:0,elevation:4,margin:1.1}); result.camera.zoom=1.45;result.camera.updateProjectionMatrix();
 return {...result,object:root,update(t:number){root.rotation.y=t*0.12;bits.forEach((m,i)=>{const a=i*2.39996+t*(0.08+(i%3)*0.03),r=1.2+(i%7)*0.11;m.position.set(Math.cos(a)*r,Math.sin(i*1.73)*1.3,Math.sin(a)*r);});}};
}
function backdrop<T extends {scene:THREE.Scene}>(r:T):T{r.scene.background=new THREE.Color("#10251f");return r;}
export const resources=defineResources({
 turntable:resource({kind:"prop",title:"产品展示转台",description:"GLB 模型、发光色展台与 HDR 环境光；支持模型和转速选择。",tags:["产品","转台","HDR","GLB"],usage:"const r = await turntable(renderer, { model: 'Avocado', color: '#d9ff65', lighting: 'hdr', speed: 16 }); 返回 scene、camera、update(t)。",params:turntableOptions,presets:{青柠产品:{model:"Avocado",color:"#d9ff65",lighting:"hdr",speed:16},暖色狐狸:{model:"Fox",color:"#ffae70",lighting:"studio",speed:12}},preview:{engine:"three",width:800,height:650,duration:6,build:async({renderer,params})=>backdrop(await turntable(renderer,params))}}),
 habitat:resource({kind:"set",title:"低多边形森林岛",description:"三棵几何树与带骨骼动画的狐狸组成的微缩森林。",tags:["低多边形","狐狸","骨骼动画","场景"],usage:"const r = await habitat(renderer, { animation: 'Survey' }); 每帧调用 r.update(t)。",params:habitatOptions,presets:{青柠森林:{color:"#d9ff65",animation:"Survey"},秋日漫步:{color:"#ffae70",animation:"Walk"}},preview:{engine:"three",width:800,height:650,duration:4,build:async({renderer,params})=>backdrop(await habitat(renderer,params))}}),
 emblem:resource({kind:"prop",title:"立体取景框标志",description:"金属取景框与旋转晶体组成的几何标志，适合片头片尾。",tags:["Logo","标志","几何","片头"],usage:"const r = emblem(renderer, { color: '#d9ff65', twist: 0.35 }); 每帧调用 r.update(t)。",params:emblemOptions,presets:{青柠标志:{color:"#d9ff65",twist:0.35},冰蓝标志:{color:"#a2cfff",twist:0.6}},preview:{engine:"three",width:700,height:650,duration:5,build:({renderer,params})=>backdrop(emblem(renderer,params))}}),
 orbit:resource({kind:"effect",title:"几何轨道背景",description:"确定性球面粒子与交错金属轨道，适合科技产品背景。",tags:["背景","粒子","轨道"],usage:"const r = orbit(renderer, { density: 32 }); 每帧调用 r.update(t)。",params:orbitOptions,presets:{青柠轨道:{color:"#d9ff65",density:32},冷色密集:{color:"#a2cfff",density:60}},preview:{engine:"three",width:800,height:650,duration:6,build:({renderer,params})=>backdrop(orbit(renderer,params))}}),
});
