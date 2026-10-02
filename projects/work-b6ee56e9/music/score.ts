/** THE IMPOSSIBLE FOLD — original 128 BPM score; no samples, external audio or hidden clocks. */
export const BPM=128;
export const BEAT=60/BPM;
export const DURATION=120;
type Stem='rhythm'|'bass'|'harmony'|'foley';
type Voice='kick'|'snare'|'hat'|'tom'|'bass'|'pad'|'pluck'|'lead'|'impact'|'riser'|'paper'|'chime';
export interface Event {at:number;length:number;voice:Voice;note:number;gain:number;pan:number;seed:number;}
const score:Record<Stem,Event[]>={rhythm:[],bass:[],harmony:[],foley:[]};
const tau=Math.PI*2;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const x=clamp(n);return x*x*(3-2*x);};
const hz=(n:number)=>440*2**((n-69)/12);
let sequence=0;
function put(stem:Stem,voice:Voice,beat:number,length:number,note:number,gain:number,pan=0){
  score[stem].push({at:beat*BEAT,length,voice,note,gain,pan,seed:++sequence});
}
// Dm(add9), Bbmaj7, F(add9), Csus2. Final F major is intentionally open, not a minor-key loop.
const chords=[[38,50,57,60,64],[34,53,57,60,65],[41,53,57,60,67],[36,55,58,62,67]];
const melody=[74,77,81,79,77,72,74,69,70,74,77,81,79,77,76,72];
for(let bar=0;bar<64;bar++){
  const at=bar*4, section=bar<4?0:bar<16?1:bar<28?2:bar<32?3:bar<34?4:bar<52?5:bar<56?6:7;
  const chord=chords[Math.floor((bar<34?bar:bar-34)/2+400)%4];
  const active=section!==4;
  if(bar%2===0 && active){
    for(let j=1;j<5;j++)put('harmony','pad',at,BEAT*8+.85,chord[j],section===0?.032:section>=5?.045:.026,(j-2.5)*.4);
  }
  if(section===0){
    if(bar%2===0)put('harmony','chime',at+.5,3.6,chord[3]+12,.13,-.3);
    put('foley','paper',at+1.5,.7,60,.045,(bar%2-.5)*.7);
    continue;
  }
  if(section===4){
    if(bar===32)put('foley','impact',at,1.7,34,.24);
    if(bar===33){put('foley','paper',at+1.5,.65,60,.12);put('foley','riser',at+2.2,.78,60,.055);}
    continue;
  }
  if(section<7){
    for(let b=0;b<4;b++){
      if(!(section===6 && b%2===1))put('rhythm','kick',at+b,.42,36,section>=5?.46:.38);
      if(b%2===1)put('rhythm','snare',at+b,.28,48,section>=5?.21:.16);
      if(section>=2 || b%2===0)put('rhythm','hat',at+b+.5,.11,90,section>=5?.065:.044,.34);
      if(section>=2 && section!==6){
        put('rhythm','hat',at+b+.25,.045,90,.024,-.28);
        put('rhythm','hat',at+b+.75,.05,90,.033,-.18);
      }
      const low=chord[0]-12;
      put('bass','bass',at+b+.5,BEAT*.42,low,section>=5?.19:.14);
      if(section>=2 && section!==6)put('bass','bass',at+b+.82,BEAT*.14,low+12,.06);
    }
    if(bar%4===3){
      put('rhythm','tom',at+3.25,.23,45,.17,-.55);put('rhythm','tom',at+3.5,.29,41,.2,.45);
      put('rhythm','snare',at+3.75,.18,48,.1);
    }
  }
  if(section>=1 && section<7){
    const pattern=[1,3,2,4,2,3,1,4];
    for(let s=0;s<8;s++){
      const n=chord[pattern[s]]+12+(section>=5?0:-12);
      put('harmony','pluck',at+s*.5,section>=5?1.5:1.05,n,section>=5?.077:.059,Math.sin(s*1.3)*.5);
    }
  }
  if(section===3){
    for(let i=0;i<(bar>=30?16:8);i++)put('rhythm','snare',at+i/(bar>=30?4:2),.12,48,.025+(bar-28)*.012,0);
  }
  if(section===5){
    const m=((bar-34)%8)*2;
    put('harmony','lead',at+.25,BEAT*1.5,melody[m],.096,-.1);
    put('harmony','lead',at+2,BEAT*1.65,melody[m+1],.10,.1);
  }
  if(section>=6){
    const n=[77,81,84,79][Math.floor((bar-52)/2)%4];
    if(bar%2===0){put('harmony','chime',at,4.1,n,.15,-.18);put('harmony','chime',at+1.5,3.7,n-12,.095,.32);}
    if(section===7 && bar<60){put('rhythm','kick',at,.7,36,.20);put('bass','bass',at+1,1.4,chord[0]-12,.075);}
  }
}
for(const beat of [16,32,56,72,88,104,136,152,168,192,208,224]){
  put('foley','impact',beat,2.2,31,beat===136?.29:.15);
  if(beat>=32)put('foley','riser',beat-4,BEAT*4,60,.07);
}
for(const beat of [12,20,28,36,48,64,80,96,112,124,131.5,211.4,213.4,215.5])put('foley','paper',beat,.42,60,.035,Math.sin(beat)*.45);
// The final crease is articulated three times, then a stereo pass follows the plane.
put('foley','paper',214,.75,60,.085,-.3);put('foley','paper',217,.55,60,.08,.3);
put('foley','riser',219,2.1,65,.05,-.4);
put('foley','impact',240,3.6,29,.14);
for(const [i,n] of [77,81,84,89].entries()){put('harmony','lead',224+i*2,2.2,n,.075,(i-1.5)*.18);put('harmony','chime',240+i*1.5,4.2,n,.09,(i-1.5)*.25);}
for(const stem of Object.values(score))stem.sort((a,b)=>a.at-b.at);
export const scoreEvents=score;

function noise(index:number,seed:number){let n=(index^Math.imul(seed,0x45d9f3b))|0;n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/2147483648-1;}
function tone(voice:Voice,x:number,length:number,f:number,seed:number,rate:number){
  if(x<0||x>=length)return 0;
  const tail=smooth((length-x)/Math.min(.055,length*.22));
  switch(voice){
    case 'kick': {
      const phase=tau*(46*x+100*.024*(1-Math.exp(-x/.024)));
      return (Math.sin(phase)*Math.exp(-x*9)+.17*noise(Math.floor(x*rate),seed)*Math.exp(-x*210))*tail;
    }
    case 'snare': {
      const n=noise(Math.floor(x*rate),seed),n0=noise(Math.floor(x*rate)-1,seed);
      const crack=(n-n0)*.56*Math.exp(-x*23);
      const body=(Math.sin(tau*187*x)+.35*Math.sin(tau*336*x))*Math.exp(-x*33);
      const clap=(Math.exp(-Math.abs(x-.012)*240)+.4*Math.exp(-Math.abs(x-.024)*240))*(n-n0)*.14;
      return (crack+.38*body+clap)*tail;
    }
    case 'hat': {const n=noise(Math.floor(x*rate),seed)-noise(Math.floor(x*rate)-1,seed);return n*.5*Math.exp(-x*55)*smooth(x/.0008)*tail;}
    case 'tom':return Math.sin(tau*(f*x+f*.1*.06*(1-Math.exp(-x/.06))))*Math.exp(-x*12)*tail;
    case 'bass': {
      const e=smooth(x/.007)*smooth((length-x)/.045),p=tau*f*x;
      return (Math.sin(p)+.3*Math.sin(2*p)+.11*Math.sin(3*p)+.035*Math.sin(5*p))*e*.72;
    }
    case 'pad': {
      const e=smooth(x/.7)*smooth((length-x)/1.0),p=tau*f*x;
      return (Math.sin(p)+.23*Math.sin(p*2+.4)+.13*Math.sin(p*3)+.25*Math.sin(p*1.0017+.6)+.18*Math.sin(p*.9983))*e*.63;
    }
    case 'pluck': {
      const e=smooth(x/.003)*Math.exp(-x*4.3)*tail,p=tau*f*x;
      return (Math.sin(p+.9*Math.sin(p*2)*Math.exp(-x*9))+.25*Math.sin(p*2)+.11*Math.sin(p*3))*e*.8;
    }
    case 'lead': {
      const e=smooth(x/.025)*smooth((length-x)/.14),p=tau*f*x+.018*Math.sin(x*tau*5.4);
      return (Math.sin(p)+.32*Math.sin(p*2)+.16*Math.sin(p*3)+.07*Math.sin(p*5)+.18*Math.sin(p*.997))*e*.65;
    }
    case 'chime': {
      const e=smooth(x/.002)*Math.exp(-x*1.3)*tail,p=tau*f*x;
      return (Math.sin(p+.55*Math.sin(p*2.003)*Math.exp(-x*3))+.13*Math.sin(p*3.997)*Math.exp(-x*4))*e;
    }
    case 'impact':{
      const low=Math.sin(tau*(36*x+42*.045*(1-Math.exp(-x/.045))))*Math.exp(-x*3.5);
      const n=noise(Math.floor(x*rate/3),seed)*Math.exp(-x*9);return (.85*low+.15*n)*tail;
    }
    case 'paper':{
      const n=noise(Math.floor(x*rate),seed)-.75*noise(Math.floor(x*rate)-1,seed);
      const e=smooth(x/.014)*Math.exp(-x*9)*(1+.35*Math.sin(x*tau*43));return n*.38*e*tail;
    }
    default: {
      const e=Math.sin(Math.PI*clamp(x/length))**1.3,n=noise(Math.floor(x*rate),seed);
      return (n*.3+Math.sin(tau*(220*x+200*x*x/length))*.16)*e;
    }
  }
}
export function renderScore(request:{trackId:string;startFrame:number;frames:number;sampleRate:number},signal?:AbortSignal):[Float32Array,Float32Array]{
  const {trackId,startFrame,frames,sampleRate}=request;
  if(!(trackId in score))throw Error('Unknown score stem: '+trackId);
  const start=startFrame/sampleRate,end=(startFrame+frames)/sampleRate;
  const L=new Float32Array(frames),R=new Float32Array(frames);
  for(const e of score[trackId as Stem]){
    const echoes=['pad','pluck','lead','chime'].includes(e.voice)?[0,BEAT*.75,BEAT*1.5,BEAT*2.25]:[0];
    for(let tap=0;tap<echoes.length;tap++){
      const at=e.at+echoes[tap];if(at+e.length<=start||at>=end)continue;
      signal?.throwIfAborted();
      const gain=e.gain*[1,.23,.13,.075][tap];
      const pan=tap%2?-.85*e.pan:e.pan,gl=Math.cos((pan+1)*Math.PI/4)*gain,gr=Math.sin((pan+1)*Math.PI/4)*gain;
      const from=Math.max(0,Math.ceil((at-start)*sampleRate)),to=Math.min(frames,Math.ceil((at+e.length-start)*sampleRate));
      const f=hz(e.note);
      for(let i=from;i<to;i++){
        const absolute=(startFrame+i)/sampleRate;
        const x=absolute-at;
        let v=tone(e.voice,x,e.length,f,e.seed,sampleRate);
        if(trackId==='harmony' && absolute>7.5 && absolute<105 && !(absolute>=60&&absolute<63.75)){
          const phase=(absolute/BEAT)%1;v*=.5+.5*smooth(phase/.5);
        }
        L[i]+=v*gl;R[i]+=v*gr;
      }
    }
  }
  for(let i=0;i<frames;i++){
    const t=(startFrame+i)/sampleRate;
    const breath=1-.97*smooth((t-60)/.55)*(1-smooth((t-63.7)/.05));
    const fade=smooth(t/.07)*smooth((119.8-t)/2.8)*(t<DURATION?1:0);
    // A common cinematic breath; foley alone retains the crease before the drop.
    const g=fade*(trackId==='foley'?1:breath);
    L[i]=Math.tanh(L[i]*g*1.35)*.72;R[i]=Math.tanh(R[i]*g*1.35)*.72;
  }
  return [L,R];
}
