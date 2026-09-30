import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const SR=48000,D=216,N=SR*D,TAU=Math.PI*2;
const stems={harmony:new Float32Array(N*2),pulse:new Float32Array(N*2),drums:new Float32Array(N*2),fx:new Float32Array(N*2)};
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)},midi=n=>440*Math.pow(2,(n-69)/12);
let seed=93617;const noise=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/2147483648-1;};
const cache=new Map();
function sound(kind,n=48,dur=1){const key=`${kind}/${n}/${dur}`;if(cache.has(key))return cache.get(key);const b=new Float32Array(Math.ceil(SR*dur));let f=midi(n),prev=0,lp=0;
 for(let i=0;i<b.length;i++){const t=i/SR,tail=clamp((dur-t)/.06);let s=0;
  if(kind==='pad'){const a=smooth(t/1.25)*smooth((dur-t)/1.8);s=(Math.sin(TAU*f*t+.3*Math.sin(t*.55))*.56+Math.sin(TAU*f*1.0023*t)*.24+Math.sin(TAU*f*.9981*t)*.24+Math.sin(TAU*f*2*t)*.1+Math.sin(TAU*f*3.003*t)*.045)*a*(.93+.07*Math.sin(t*1.7));}
  if(kind==='pluck'){const a=(1-Math.exp(-t*180))*Math.exp(-t*4.6);s=(Math.sin(TAU*f*t+1.2*Math.sin(TAU*f*2*t)*Math.exp(-t*7))*.8+Math.sin(TAU*f*2*t)*.17+Math.sin(TAU*f*3*t)*.07)*a;}
  if(kind==='lead'){const a=(1-Math.exp(-t*30))*Math.exp(-t*1.6);s=(Math.sin(TAU*f*t+.08*Math.sin(t*TAU*5))+.27*Math.sin(TAU*f*2.003*t)+.12*Math.sin(TAU*f*3*t))*.6*a;}
  if(kind==='bass'){const a=(1-Math.exp(-t*160))*Math.exp(-t*6);s=Math.tanh((Math.sin(TAU*f*t)+.25*Math.sin(TAU*f*2*t)+.12*Math.sin(TAU*f*3*t))*1.1)*a;}
  if(kind==='kick'){const phase=TAU*(43*t+110*.032*(1-Math.exp(-t/.032)));s=Math.sin(phase)*Math.exp(-t*8.5)*.9+noise()*.12*Math.exp(-t*220);}
  if(kind==='snare'){let x=noise();lp+=.18*(x-lp);const hp=x-lp;s=(hp*.54*Math.exp(-t*15)+Math.sin(TAU*187*t)*.35*Math.exp(-t*28))*(1-Math.exp(-t*600));for(const dt of [.012,.026])if(t>dt)s+=hp*.18*Math.exp(-(t-dt)*55);}
  if(kind==='hat'){let x=noise();let hp=x-prev;prev=x;s=hp*.28*Math.exp(-t*(dur>.2?17:65))*(.7+.3*Math.sin(t*13000));}
  if(kind==='impact'){let x=noise();lp+=.045*(x-lp);s=Math.sin(TAU*(32*t+35*.11*(1-Math.exp(-t/.11))))*.76*Math.exp(-t*2.7)+lp*.7*Math.exp(-t*1.7);}
  if(kind==='whoosh'){let x=noise();lp+=.035*(x-lp);const e=Math.pow(Math.sin(Math.PI*clamp(t/dur)),2);s=(x-lp)*e*.25+Math.sin(TAU*(90*t+70*t*t))*e*.12;}
  if(kind==='click'){let x=noise();s=(x*.55+Math.sin(TAU*920*t)*.1)*Math.exp(-t*95);}
  b[i]=s*tail;
 }
 cache.set(key,b);return b;
}
function put(stem,b,at,g=1,pan=0){const o=Math.round(at*SR),a=stems[stem],l=Math.sqrt((1-pan)/2)*g,r=Math.sqrt((1+pan)/2)*g;for(let i=Math.max(0,-o);i<b.length&&o+i<N;i++){a[(o+i)*2]+=b[i]*l;a[(o+i)*2+1]+=b[i]*r;}}
function note(stem,kind,n,at,dur,g,pan=0,delay=false){const b=sound(kind,n,dur);put(stem,b,at,g,pan);if(delay){put(stem,b,at+.375,g*.22,-pan*.85);put(stem,b,at+.75,g*.08,pan*.6);}}
const chords=[[50,57,60,64,69],[46,53,57,62,65],[48,53,57,60,67],[48,55,58,62,67]];
function energy(t){return t<8?.25:t<16?.45:t<36?.58:t<62?.74:t<92?.9:t<98?.36:t<116?.68:t<142?.83:t<174?.96:t<180?1.08:t<204?1.22:t<207?.55:.35;}
for(let bar=0;bar<27;bar++){const t=bar*8,ch=chords[bar%4];ch.forEach((n,j)=>note('harmony','pad',n,t-.15,10.2,.057*(bar>=22?1.14:1),(j-2)*.31));}
// Resolve on an open D minor ninth; same motif, wider spacing.
[38,50,57,62,64,69].forEach((n,i)=>note('harmony','pad',n,207,9,.044,(i-2.5)*.28));
for(let t=8;t<207;t+=.5){const e=energy(t),bar=Math.floor(t/8),ch=chords[bar%4],step=Math.round(t*2)%4;if(t>=92&&t<96||t>=204.5&&t<207)continue;
 if(t>=32||step%2===0)note('drums','kick',0,t,.74,.59*e);
 if(step===2&&t>=18)note('drums','snare',0,t,.34,.34*e,.06);
 if(t>=32){note('drums','hat',0,t+.25,.085,.1*e,-.35);if(t>=62)note('drums','hat',0,t+.375,.063,.038*e,.43);}
 if(step===1&&t>=60)note('drums','hat',0,t+.25,.32,.09*e,.35);
 if(step===0||step===3||t>=142&&step===1){note('pulse','bass',ch[0]-12,t+.025,.48,.22*e);if(step===0&&t>=116)note('pulse','bass',ch[0],t+.38,.29,.1*e);}
}
for(let t=34,i=0;t<204;t+=.25,i++){if(t>=92&&t<98)continue;const e=energy(t),ch=chords[Math.floor(t/8)%4],pattern=[0,2,4,1,3,2,4,1];if(i%8===6&&t<174)continue;const n=ch[pattern[i%8]]+12,g=(i%4===0?.095:.053)*e;note('pulse','pluck',n,t,.85,g,Math.sin(i*.83)*.58,true);if(t>=180&&i%4===2)note('pulse','pluck',n+12,t+.125,.65,.028,.65,true);}
const theme=[74,76,77,81,79,77,76,74];for(const at of [8,64,80,120,152,184,196])theme.forEach((n,i)=>{if(i===3||i===7)return;note('harmony','lead',n,at+i*.75,1.8,.057,Math.sin(i)*.3,true);});
const major=[0,8,16,36,62,92,116,142,180,207];major.forEach((t,i)=>{note('fx','impact',0,t,3,.24*(i===8?1.4:1));if(t>0)note('fx','whoosh',0,t-1.25,1.45,.24,0);});
for(const at of [59,89,139,176,200]){note('fx','whoosh',0,at,3.6,.21,.12);for(let j=0;j<8;j++)note('drums','snare',0,at+2+j*.125,.28,.025+j*.012,(j%2?.2:-.2));}
const contacts=[3.8,7.2,18,20.5,24.7,28.5,33,37.4,40.3,44,47,52,56,64,67,70,73,76,79,83,86,89,94,99,103,108,113,118,122,126,130,133,136,140,145,149,153,157,160,163,167,171,175,179];for(let i=0;i<contacts.length;i++)note('fx','click',0,contacts[i],.13,.07,i%2?.35:-.35);for(let t=181.5;t<206;t+=2.1)note('fx','whoosh',0,t-.18,.46,.1,0);
const caps=JSON.parse(await fs.readFile(path.join(root,'captions.json'),'utf8'));const activity=new Float32Array(N);for(const c of caps){const a=Math.max(0,Math.floor((c.start-.12)*SR)),b=Math.min(N,Math.ceil((c.end+.18)*SR));for(let i=a;i<b;i++){const t=i/SR;activity[i]=Math.max(activity[i],smooth((t-c.start+.12)/.14)*smooth((c.end+.18-t)/.2));}}
const names=Object.keys(stems);let peak=0;
for(let i=0;i<N;i++){const t=i/SR,duck=1-.53*activity[i],fade=smooth(t/.8)*smooth((D-t)/1.1),side=1-.17*Math.exp(-(t%.5)*20);let suml=0,sumr=0;for(const name of names){const a=stems[name],g=fade*(name==='drums'?1-.32*activity[i]:duck)*(name==='harmony'||name==='pulse'?side:1);a[i*2]*=g;a[i*2+1]*=g;suml+=a[i*2];sumr+=a[i*2+1];}peak=Math.max(peak,Math.abs(suml),Math.abs(sumr));}
const global=.43/Math.max(.43,peak);await fs.mkdir(path.join(root,'public/audio'),{recursive:true});
for(const name of names){const a=stems[name];for(let i=0;i<a.length;i++)a[i]*=global;const p=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','f32le','-ar',String(SR),'-ac','2','-i','pipe:0','-c:a','libmp3lame','-b:a','160k',path.join(root,'public/audio',name+'.mp3')],{input:Buffer.from(a.buffer),maxBuffer:4*1024*1024});if(p.status!==0)throw new Error(p.stderr.toString());console.log('SCORE_STEM '+name);}
await fs.writeFile(path.join(root,'production/score-cues.json'),JSON.stringify({title:'Beyond the Chat — original score',bpm:120,key:'D minor / modal ninths',duration:D,stems:names,sampleRate:SR,measuredPreGainPeak:peak,gain:global,voiceDucking:true,impactTimes:major,contactTimes:contacts,license:'Original procedural composition and sound design for this work; no third-party samples.'},null,2));
console.log('SCORE_COMPLETE');
