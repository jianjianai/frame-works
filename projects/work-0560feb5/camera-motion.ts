import type { PerspectiveCamera } from 'three';
import {ease,mix} from './visual-kit';
type Key=[number,number,number,number,number,number];
// Absolute-time subject-tracking moves: [time,targetX,targetY,dolly,orbitX,elevation].
const paths:Record<number,Key[]>={
 1:[[0,0,-.55,0,0,0],[3,-2.8,0,-3.2,-.5,.2],[7,0,-.3,0,.3,.2],[11,3,-.7,-2.4,1,.1],[15,0,-.5,0,-.3,.15],[20,0,-.55,0,0,0]],
 2:[[0,0,-.55,0,0,0],[3,-3.1,.1,-3.8,-.4,.55],[7,0,-.4,0,.35,.1],[12,1.7,.1,-2.7,1.25,.75],[16,.2,-.1,-.8,-.5,.45],[21,0,-.65,0,-.25,.05],[26,0,-.55,0,0,0]],
 3:[[0,0,-.55,0,0,0],[3,-2.6,-.4,-2.8,-.2,.2],[7,0,-.4,0,.3,.05],[12,-.5,.35,-1.3,-.5,.1],[18,0,-.4,0,0,.1],[23,0,.25,-2.2,.35,.05],[28,0,-.3,0,0,.05]],
 4:[[0,0,-.55,0,0,0],[3,1.1,.1,-3.1,1,.9],[8,-.7,-.35,0,-.2,.15],[14,1.3,.2,-1.8,.9,.6],[20,0,-.4,0,0,.1],[24,0,-.55,0,0,0]],
 5:[[0,0,-.55,0,0,0],[4,-2.4,-1.4,-2.6,-.3,.15],[8,1.5,.4,-1.7,1,.15],[11,0,-.55,0,0,0],[15,0,-.4,0,0,.05],[20,0,.05,-2.7,.5,.5],[25,0,-.55,0,0,0]],
 6:[[0,0,-.55,0,0,0],[5,0,-.25,-.5,0,.15],[8,-3.2,.9,-3,-.2,.2],[12,2.9,.7,-2.8,.5,.2],[17,3,-1.3,-3.4,.5,-.15],[22,3,.7,-2.4,.3,.2],[27,0,-.5,0,-.5,.3],[34,0,-.55,.4,0,.05],[38,0,-.55,0,0,0]]
};
export function moveCamera(index:number,t:number,camera:PerspectiveCamera,z:number){const keys=paths[index];if(!keys)return;let i=0;while(i<keys.length-2&&t>keys[i+1][0])i++;const a=keys[i],b=keys[i+1],p=ease((t-a[0])/(b[0]-a[0]));const values=a.map((n,j)=>mix(n,b[j],p));const tx=values[1],ty=values[2];camera.position.set(tx+values[4]+Math.sin(t*.21)*.09,1.4+values[5],z+values[3]);camera.lookAt(tx,ty,0);}
