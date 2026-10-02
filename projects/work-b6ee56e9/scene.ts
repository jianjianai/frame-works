import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Scene, SceneOptions } from '../../src/engine/types';
import { disposeObject } from '../../src/engine/three-assets';

// One red sheet. The surrounding press is the same 64 objects before and after liberation.
// Everything, including camera, texture grain and paper deformation, is absolute-time seekable.
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const mix = THREE.MathUtils.lerp;
const ease = (v: number) => { const x = clamp(v); return x*x*x*(x*(x*6-15)+10); };
const gate = (t: number, a: number, b: number) => ease((t-a)/(b-a));
const triangle = (x: number) => 2 / Math.PI * Math.asin(Math.sin(x));

type V = [number, number, number];
const cameraKeys: {t: number; p: V; aim: V; fov: number}[] = [
  {t:0,p:[1.5,1.4,4.2],aim:[0,.14,.1],fov:37},
  {t:3.75,p:[6,6,8],aim:[0,.25,0],fov:37},
  {t:7.5,p:[4.2,5.2,8.5],aim:[0,.4,0],fov:38},
  {t:15,p:[4.8,4,12],aim:[0,1,-7],fov:40},
  {t:22.5,p:[1,2.7,5],aim:[0,1,-11],fov:46},
  {t:28.125,p:[.5,2,-7],aim:[0,1,-19],fov:49},
  {t:33.75,p:[5.5,7.7,8.5],aim:[0,2,0],fov:48},
  {t:41.25,p:[5.8,6,9],aim:[0,4,0],fov:48},
  {t:48.75,p:[-5.5,11,8.5],aim:[0,5,0],fov:48},
  {t:56.25,p:[-5,5.5,9.5],aim:[0,3,0],fov:42},
  {t:60,p:[3.1,2.6,5.5],aim:[0,.5,0],fov:42},
  {t:63.75,p:[3.1,2.6,5.5],aim:[0,.5,0],fov:42},
  {t:67.5,p:[0,18,25],aim:[0,2,0],fov:45},
  {t:75,p:[16,15,19],aim:[0,2,0],fov:43},
  {t:82.5,p:[10,8,13],aim:[0,3,0],fov:43},
  {t:90,p:[-7,7,11],aim:[0,3,0],fov:48},
  {t:97.5,p:[8,7,11],aim:[0,.6,0],fov:38},
  {t:101.25,p:[8,5,12],aim:[0,2,0],fov:40},
  {t:105,p:[7,5,6],aim:[0,2,-5],fov:43},
  {t:110,p:[9,9,3],aim:[2,7,-12],fov:43},
  {t:115,p:[10,14,13],aim:[0,10,-15],fov:43},
  {t:120,p:[17,23,29],aim:[0,10,-8],fov:43},
];
const positionPath = new THREE.CatmullRomCurve3(cameraKeys.map(k=>new THREE.Vector3(...k.p)),false,'catmullrom',.32);
const aimPath = new THREE.CatmullRomCurve3(cameraKeys.map(k=>new THREE.Vector3(...k.aim)),false,'catmullrom',.3);
const shapeKeys = [
  [0,0], [5.625,0], [11.25,1], [16.875,2], [26.25,2], [33.75,3],
  [41.25,3], [48.75,4], [54.375,4], [60,5], [63.75,5], [69.375,6],
  [75,6], [80.625,7], [91.875,7], [98.5,0], [99,0],
];
function shape(mode:number,u:number,v:number,t:number,out:THREE.Vector3) {
  const a=(u+1)*Math.PI;
  switch(mode) {
    case 0: {
      const lift=(1-gate(t,5,9))*(.12+.22*Math.pow((u+1)/2,5));
      out.set(u*3,.3+lift*Math.sin(t*1.6+v*2)+.06*Math.abs(u),v*3); break;
    }
    case 1: out.set(u*2.5,.35+1.7*(triangle(u*Math.PI*4)*.5+.5),v*3);break;
    case 2: out.set(v*1.25+Math.sin(u*5+t*.35)*1.4,1.5+Math.sin(u*8-t*.85)*.65,u*20);break;
    case 3: { const r=5.4+v*1.05;out.set(r*Math.cos(a),2.5+u*2.1,r*Math.sin(a));break; }
    case 4: { const aa=a*1.6+t*.11, r=3.8+v*1.1;out.set(r*Math.cos(aa),5+u*9,r*Math.sin(aa));break; }
    case 5: out.set(u*2.1,.5+.17*triangle(u*16*Math.PI),v*.8);break;
    case 6: out.set(u*11,4.5+2.5*Math.sin(u*4-t*.7)*(1-.12*v),v*3.5+u*3);break;
    default: { const r=5.8+v*1.5*Math.cos(a/2);out.set(r*Math.cos(a),3.3+v*1.5*Math.sin(a/2),r*Math.sin(a)); }
  }
}
function texture() {
  const n=128, data=new Uint8Array(n*n*4);let seed=17;
  for(let i=0;i<n*n;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const c=180+((seed>>>24)&63);data.set([c,c,c,255],i*4);}
  const tex=new THREE.DataTexture(data,n,n,THREE.RGBAFormat);tex.needsUpdate=true;
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(4,4);return tex;
}
function planeGeometry() {
  const flat: V[]=[[0,0,-3],[-3,0,-3],[-3,0,3],[0,0,3],[3,0,3],[3,0,-3],[-1.1,0,1.4],[1.1,0,1.4]];
  const folded: V[]=[[0,0,-3],[-3.7,.05,2],[-.85,-.13,2.45],[0,.65,2.4],[.85,-.13,2.45],[3.7,.05,2],[-.55,-.22,.9],[.55,-.22,.9]];
  const faces=[[0,1,6],[1,2,6],[2,3,6],[3,0,6],[0,7,5],[5,7,4],[4,7,3],[3,7,0]];
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(72),3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(faces.flatMap(f=>f.flatMap(i=>[(flat[i][0]+3)/6,(flat[i][2]+3)/6])),2));
  const position=geometry.getAttribute('position') as THREE.BufferAttribute;
  function update(fold:number,flap:number) {
    let k=0;
    for(const face of faces)for(const i of face){
      const p=flat[i],q=folded[i];const x=mix(p[0],q[0],fold);
      position.setXYZ(k++,x,mix(.3,q[1]+.3,fold)+Math.pow(Math.abs(x)/3.7,1.4)*flap,mix(p[2],q[2],fold));
    }
    position.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
  }
  update(0,0);return {geometry,update};
}

export function createScene({width,height,quality}:SceneOptions):Scene {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(1);renderer.setSize(width,height);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();const background=new THREE.Color('#dcd3c3');scene.background=background;
  const fog=new THREE.FogExp2(background,.014);scene.fog=fog;
  const camera=new THREE.PerspectiveCamera(40,width/height,.08,240);
  const room=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromScene(room,.05);
  scene.environment=environment.texture;scene.environmentIntensity=.72;room.dispose();pmrem.dispose();
  const grain=texture();
  const red=new THREE.MeshPhysicalMaterial({color:'#a30a17',roughness:.48,metalness:.015,clearcoat:.10,clearcoatRoughness:.55,side:THREE.DoubleSide,bumpMap:grain,bumpScale:.018});
  red.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb *= gl_FrontFacing ? vec3(1.0) : vec3(1.1,.86,.8);');};
  const porcelain=new THREE.MeshStandardMaterial({color:'#afa89b',roughness:.3,metalness:.4});
  const floorMat=new THREE.MeshStandardMaterial({color:'#c6c2b9',roughness:.72,metalness:.05});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,240),floorMat);ground.rotation.x=-Math.PI/2;ground.position.y=-1.6;ground.receiveShadow=true;scene.add(ground);
  const key=new THREE.DirectionalLight('#fff1df',3.8);key.position.set(-12,22,14);key.castShadow=true;
  const sm=quality==='high'?1536:1024;key.shadow.mapSize.set(sm,sm);Object.assign(key.shadow.camera,{left:-23,right:23,top:25,bottom:-23,near:1,far:85});key.shadow.bias=-.0006;key.shadow.normalBias=.03;scene.add(key);
  const rim=new THREE.DirectionalLight('#c0d6ff',2.2);rim.position.set(8,7,-15);scene.add(rim);
  const fill=new THREE.HemisphereLight('#eef3ff','#453a35',1.1);scene.add(fill);
  const redGlow=new THREE.PointLight('#ff432d',25,26,2);redGlow.position.set(0,4,0);scene.add(redGlow);

  const nu=192,nv=16;const sheetGeometry=new THREE.PlaneGeometry(1,1,nu,nv);const attr=sheetGeometry.getAttribute('position') as THREE.BufferAttribute;
  const paper=new THREE.Mesh(sheetGeometry,red);paper.castShadow=true;paper.receiveShadow=true;paper.frustumCulled=false;scene.add(paper);
  const edgeGeometry=new THREE.BufferGeometry();const edgePositions=new THREE.Float32BufferAttribute(new Float32Array((nu*2+nv*2+1)*3),3);edgeGeometry.setAttribute('position',edgePositions);
  const edgeLine=new THREE.Line(edgeGeometry,new THREE.LineBasicMaterial({color:'#6a0010',transparent:true,opacity:.42}));edgeLine.frustumCulled=false;scene.add(edgeLine);
  const origami=planeGeometry();const bird=new THREE.Mesh(origami.geometry,red);bird.castShadow=true;bird.receiveShadow=true;bird.frustumCulled=false;scene.add(bird);

  const architecture=new THREE.InstancedMesh(new RoundedBoxGeometry(1,1,1,2,.075),porcelain,64);
  architecture.instanceMatrix.setUsage(THREE.DynamicDrawUsage);architecture.castShadow=true;architecture.receiveShadow=true;architecture.frustumCulled=false;scene.add(architecture);
  const accentMat=new THREE.MeshBasicMaterial({color:'#fff0d6',toneMapped:false,transparent:true});
  const seams=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),accentMat,32);seams.frustumCulled=false;scene.add(seams);
  // Every liberated panel becomes a folded plane. Per-instance morphs keep one draw call.
  const flockShape=planeGeometry();flockShape.update(1,0);
  const foldedPosition=flockShape.geometry.getAttribute('position').clone();
  const foldedNormal=flockShape.geometry.getAttribute('normal').clone();flockShape.update(0,0);
  flockShape.geometry.setAttribute('foldedPosition',foldedPosition);flockShape.geometry.setAttribute('foldedNormal',foldedNormal);
  const folds=new THREE.InstancedBufferAttribute(new Float32Array(64),1);flockShape.geometry.setAttribute('fold',folds);
  const flockMaterial=new THREE.MeshStandardMaterial({color:'#f0e6d3',roughness:.52,metalness:.02,side:THREE.DoubleSide,bumpMap:grain,bumpScale:.01});
  flockMaterial.onBeforeCompile=shader=>{
    shader.vertexShader='attribute vec3 foldedPosition;attribute vec3 foldedNormal;attribute float fold;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','vec3 transformed=mix(position,foldedPosition,fold);').replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=normalize(mix(normal,foldedNormal,fold));');
  };
  const flock=new THREE.InstancedMesh(flockShape.geometry,flockMaterial,64);flock.castShadow=true;flock.receiveShadow=true;flock.frustumCulled=false;scene.add(flock);
  const flockDepth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:THREE.DoubleSide});
  flockDepth.onBeforeCompile=shader=>{shader.vertexShader='attribute vec3 foldedPosition;attribute float fold;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','vec3 transformed=mix(position,foldedPosition,fold);');};
  flock.customDepthMaterial=flockDepth;
  const dummy=new THREE.Object3D(),v1=new THREE.Vector3(),v2=new THREE.Vector3(),aim=new THREE.Vector3();
  const daytime=new THREE.Color('#dcd3c3'),night=new THREE.Color('#030609');
  const floorDay=new THREE.Color('#aaa395'),floorNight=new THREE.Color('#0b1420');
  const porcelainDay=new THREE.Color('#b4ada0'),porcelainNight=new THREE.Color('#2c3b4d');

  // A thin photographic finish; no external assets or decorative particle layers.
  const finishScene=new THREE.Scene(),finishCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const finishMat=new THREE.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
    uniforms:{uTime:{value:0},uFade:{value:0},uSize:{value:new THREE.Vector2(width,height)}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}',
    fragmentShader:'precision highp float;varying vec2 vUv;uniform float uTime;uniform float uFade;uniform vec2 uSize;void main(){vec2 q=(vUv-.5)*2.;float vignette=.19*pow(clamp(dot(q,q)*.44,0.,1.),1.5);float n=fract(sin(dot(floor(vUv*uSize),vec2(12.9898,78.233))+floor(uTime*24.)*.371)*43758.5453);float a=max(uFade,vignette+.022*n);gl_FragColor=vec4(vec3(0.),a);}'
  });
  const finishQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),finishMat);finishScene.add(finishQuad);
  let disposed=false;
  function render(time:number) {
    if(disposed)return;const t=Math.max(0,Math.min(120,time));
    const pressure=gate(t,8,18)*(1-gate(t,63.75,70));
    background.copy(daytime).lerp(night,pressure);fog.color.copy(background);fog.density=mix(.009,.018,pressure);
    floorMat.color.copy(floorDay).lerp(floorNight,pressure);scene.environmentIntensity=mix(.45,.28,pressure);porcelain.color.copy(porcelainDay).lerp(porcelainNight,pressure);
    fill.intensity=mix(.5,.25,pressure);key.intensity=mix(2.4,2.3,pressure);rim.intensity=mix(1.4,2.8,pressure);
    redGlow.intensity=pressure*20;renderer.toneMappingExposure=mix(.95,1.08,pressure);

    let ki=0;while(ki<cameraKeys.length-2 && t>cameraKeys[ki+1].t)ki++;
    const ka=cameraKeys[ki],kb=cameraKeys[ki+1],q=clamp((t-ka.t)/(kb.t-ka.t));
    const pathT=(ki+q)/(cameraKeys.length-1);positionPath.getPoint(pathT,camera.position);aimPath.getPoint(pathT,aim);
    // The deliberate held breath is a true settled camera, not a constant orbit.
    if(t>=60 && t<63.75){camera.position.set(3.1,2.6,5.5);aim.set(0,.5,0);}
    const releaseKick=gate(t,63.75,64.05)*(1-gate(t,64.05,65));camera.position.z+=.4*releaseKick;
    camera.fov=mix(ka.fov,kb.fov,ease(q));camera.up.set(Math.sin(t*.16)*.026,1,0);camera.lookAt(aim);camera.updateProjectionMatrix();

    let si=0;while(si<shapeKeys.length-2 && t>shapeKeys[si+1][0])si++;
    const sa=shapeKeys[si],sb=shapeKeys[si+1],m=gate(t,sa[0],sb[0]);
    paper.visible=t<99;edgeLine.visible=paper.visible;bird.visible=t>=99;
    if(paper.visible){
      let k=0;for(let j=0;j<=nv;j++){const v=j/nv*2-1;for(let i=0;i<=nu;i++){
        const u=i/nu*2-1;shape(sa[1],u,v,t,v1);shape(sb[1],u,v,t,v2);v1.lerp(v2,m);attr.setXYZ(k++,v1.x,v1.y,v1.z);
      }}
      attr.needsUpdate=true;sheetGeometry.computeVertexNormals();
      let e=0;const addEdge=(index:number)=>edgePositions.setXYZ(e++,attr.getX(index),attr.getY(index)+.006,attr.getZ(index));
      for(let i=0;i<=nu;i++)addEdge(i);for(let j=1;j<=nv;j++)addEdge(j*(nu+1)+nu);for(let i=nu-1;i>=0;i--)addEdge(nv*(nu+1)+i);for(let j=nv-1;j>=0;j--)addEdge(j*(nu+1));edgePositions.needsUpdate=true;
      paper.rotation.y=gate(t,29,38)*.12*Math.sin(t*.22)*(1-gate(t,93,98));edgeLine.rotation.y=paper.rotation.y;
    } else {
      const fold=gate(t,99,101.25),flight=gate(t,101.25,116.25);
      const wing=.1*Math.sin((t-101.25)*3.3)*fold;
      origami.update(fold,wing);bird.position.set(Math.sin(flight*2.4)*2,flight*9,-flight*18);
      bird.rotation.set(-.08*flight,.15*Math.sin(flight*4),-.18*Math.sin(flight*5));
      if(t>114){bird.position.x+=(t-114)*(t-114)*.4;bird.position.y+=(t-114)*.65;}
    }
    const emerge=gate(t,7.5,16.875),release=gate(t,63.75,64.6),quiet=gate(t,55,60)*(1-gate(t,63.75,66));
    architecture.visible=t>7.5&&t<107;seams.visible=t>10 && t<66.25;accentMat.opacity=1-release;flock.visible=t>=107;
    const twist=gate(t,26.25,43)*.22*(1-gate(t,54,61));
    const converge=gate(t,39,52)*(1-gate(t,57,63.75));
    for(let i=0;i<64;i++){
      const ring=Math.floor(i/4),part=i%4,z=(ring-7.5)*3.25;
      let x=part<2?(part===0?-7.4:7.4):0,y=part<2?3.7:(part===2?8.4:-1.1);
      let sx=part<2?.7:15.5,sy=part<2?10:.55,sz=.65;
      let rz=(ring-7.5)*twist*.32+Math.sin(t*.5+ring*.45)*.02*pressure;
      const xx=x*Math.cos(rz)-y*Math.sin(rz),yy=x*Math.sin(rz)+y*Math.cos(rz);
      x=mix(xx,xx*.78,quiet);y=mix(yy,part===2?4.6:part<2?2.3:yy,quiet);
      if(part===2)y+=gate(t,34,45)*(1-gate(t,51,59))*6;
      if(part<2)sy=mix(sy,6.8,quiet);
      const tx=(i%8-3.5)*3.65,tz=(Math.floor(i/8)-3.5)*4.1;
      const distance=Math.hypot(tx,tz),wake=Math.sin(distance*.55-(t-63.75)*2.4);
      const ty=-.9+1.4*wake*gate(distance,4.5,10)*(1-gate(t,96,99));
      dummy.position.set(mix(x,tx,release),mix(y,ty,release)-(1-emerge)*24,mix(z*(1-.18*converge),tz,release));
      dummy.rotation.set(release*(.22+Math.sin(distance*.4-t*1.5)*.4)*(1-gate(t,110,116)),converge*(ring-7.5)*.06*(1-release),mix(rz,Math.sin(t*1.4+distance*.5)*.42,release)*(1-gate(t,109,116)));
      dummy.scale.set(mix(sx,3.4,release),mix(sy,.09,release),mix(sz,3.85,release));dummy.updateMatrix();architecture.setMatrixAt(i,dummy.matrix);
      if(t>=107){
        const fold=gate(t,107+distance*.055,110.4+distance*.055),lift=gate(t,109+distance*.08,116.4+distance*.08);
        dummy.position.set(tx+Math.sin(i*1.7+lift*4)*lift*3,ty+lift*(7+(i%7)*.68),tz-lift*(22+(i%5)*1.8));
        dummy.rotation.x=mix(dummy.rotation.x,-.13+Math.sin(i*.25)*.09,lift);
        dummy.rotation.y=Math.sin(i*.7+lift*2)*lift*.22;
        dummy.rotation.z=mix(dummy.rotation.z,Math.sin(t*1.2+i*.9)*.16,lift);
        dummy.scale.set(3.4/6,.6,3.85/6);dummy.updateMatrix();flock.setMatrixAt(i,dummy.matrix);folds.setX(i,fold);
      }

      if(i<32){
        const j=Math.floor(i/2),side=i%2===0?-1:1;dummy.position.set(side*7.02,4-(1-emerge)*24,(j-7.5)*3.25);
        dummy.rotation.set(0,0,(j-7.5)*twist*.32);dummy.scale.set(.045,7.9,.075);dummy.updateMatrix();seams.setMatrixAt(i,dummy.matrix);
      }
    }
    architecture.instanceMatrix.needsUpdate=true;seams.instanceMatrix.needsUpdate=true;flock.instanceMatrix.needsUpdate=true;folds.needsUpdate=true;
    // Closing shot returns the entire mechanism to an uncreased sheet, while the plane leaves it.
    floorMat.roughness=mix(.74,.58,gate(t,105,118));
    finishMat.uniforms.uTime.value=t;finishMat.uniforms.uFade.value=Math.max(1-gate(t,0,.7),gate(t,118.8,120));
    renderer.autoClear=true;renderer.render(scene,camera);renderer.autoClear=false;renderer.render(finishScene,finishCamera);
  }
  return {canvas:renderer.domElement,render,dispose(){
    if(disposed)return;disposed=true;disposeObject(scene);finishQuad.geometry.dispose();finishMat.dispose();grain.dispose();environment.dispose();flockDepth.dispose();renderer.dispose();renderer.forceContextLoss();
  }};
}
