import { defineSounds } from "@frame/engine/resources";
import type { StereoPcm } from "@frame/engine/procedural-audio";
import { beatLength } from "@frame/engine/tempo";
import { seeded } from "@frame/engine/math";
const SR=48000, TAU=Math.PI*2;
const note=(m:number)=>440*Math.pow(2,(m-69)/12);
const soft=(x:number)=>Math.tanh(x);
function drive():StereoPcm {
  const duration=24, n=SR*duration, l=new Float32Array(n), r=new Float32Array(n);
  const beat=beatLength(), random=seeded(177), roots=[45,41,48,43], arp=[0,7,12,14,7,3,10,7];
  for(let i=0;i<n;i++){
    const t=i/SR, b=Math.floor(t/beat), u=t-b*beat, bar=Math.floor(b/4);
    const root=roots[Math.floor(bar/2)%4], half=beat/2, k=Math.floor(t/half), a=t-k*half;
    const intro=Math.min(1,t/2), outro=Math.min(1,(duration-t)/2.2);
    const kick=Math.sin(TAU*(49*u+4.8*(1-Math.exp(-u*32))))*Math.exp(-u*16)*.32;
    const noise=random()*2-1;
    const hat=noise*Math.exp(-a*110)*.044;
    const snare=b%2===1?(noise*.11+Math.sin(TAU*180*u)*.045)*Math.exp(-u*35):0;
    const bf=note(root),bass=(Math.sin(TAU*bf*u)+.28*Math.sin(TAU*bf*2*u))*Math.exp(-u*5)*.105;
    const f=note(root+24+arp[k%8]);
    const ar=(Math.sin(TAU*f*a)+.25*Math.sin(TAU*f*2*a))*Math.exp(-a*12)*(1-Math.exp(-a*180))*.084;
    const delayAge=(a+half*.64)%half;
    const delay=Math.sin(TAU*f*delayAge)*Math.exp(-delayAge*15)*.026;
    const pad=(Math.sin(TAU*note(root+12)*t)+Math.sin(TAU*note(root+19)*t)+Math.sin(TAU*note(root+22)*t))*.018;
    const groove=t<2?.4:1;
    const env=Math.max(0,intro*outro);
    l[i]=soft((kick+hat+snare+bass)*groove+ar+pad+delay*.35)*env;
    r[i]=soft((kick+hat*.65+snare+bass)*groove+ar*.7+pad+delay)*env;
  }
  return [l,r];
}
function sweep():StereoPcm {
  const n=SR, l=new Float32Array(n),r=new Float32Array(n),random=seeded(23);let low=0;
  for(let i=0;i<n;i++){const t=i/SR,env=Math.sin(Math.PI*t)**2;low=low*.9+(random()*2-1)*.1;
    const wave=Math.sin(TAU*(160*t+740*t*t))*.085;
    l[i]=(low*.55+wave)*env;r[i]=(low*.42+wave*.7)*env;}
  return [l,r];
}
function sparkle():StereoPcm {
  const n=Math.floor(SR*1.6),l=new Float32Array(n),r=new Float32Array(n),random=seeded(109);
  for(let i=0;i<n;i++){const t=i/SR,e=Math.exp(-t*4.2)*(1-Math.exp(-t*90));
    const s=(Math.sin(TAU*880*t)+.5*Math.sin(TAU*1320*t)+.3*Math.sin(TAU*1760*t))*.09*e;
    const fizz=(random()*2-1)*Math.exp(-t*15)*.035;l[i]=s+fizz;r[i]=s*.85-fizz*.4;}
  return [l,r];
}
export default defineSounds(SR,{
  nightDrive:{title:"夜行合成配乐",duration:24,hit:0,tags:["原创","配乐","电子","节拍"],description:"24秒原创电子配乐；速度读取 project.tempo。无采样、固定种子。",make:drive},
  liquidSweep:{title:"液态掠过",duration:1,hit:.5,tags:["原创","转场","合成"],description:"正弦扫频与带限噪声，峰值位于转场中点。",make:sweep},
  sparkle:{title:"微光绽放",duration:1.6,hit:.04,tags:["原创","烟花","合成"],description:"玻璃般的和谐泛音与柔和噪声尾音。",make:sparkle},
});
