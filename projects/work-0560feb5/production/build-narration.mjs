import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const story=JSON.parse(await fs.readFile(path.join(root,'production/story.json'),'utf8'));
const raw=path.join(root,'production/voice'); await fs.mkdir(raw,{recursive:true}); await fs.mkdir(path.join(root,'public/audio'),{recursive:true});
const sr=24000, final=new Float32Array(sr*story.duration), captions=[], log=[];
function run(args,input){const p=spawnSync('ffmpeg',['-hide_banner','-loglevel','error',...args],{input,maxBuffer:64*1024*1024});if(p.status!==0)throw new Error(p.stderr.toString());return p.stdout;}
let index=0;
for(const act of story.acts){
 const lines=[];
 for(const text of act.lines){
  const key=createHash('sha256').update(JSON.stringify({text,voice:story.voice,speed:story.speed})).digest('hex').slice(0,20);
  const file=path.join(raw,key+'.wav');
  try{await fs.access(file);}catch{
   const r=await fetch('http://speech:8000/v1/audio/speech',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model:'builtin',input:text,voice:story.voice,speed:story.speed,response_format:'wav'}),signal:AbortSignal.timeout(180000)});
   if(!r.ok)throw new Error('Speech '+r.status+': '+(await r.text()).slice(0,300));
   await fs.writeFile(file,Buffer.from(await r.arrayBuffer()));
  }
  const pcm=run(['-i',file,'-af','silenceremove=start_periods=1:start_duration=0.02:start_threshold=-52dB,areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-52dB,areverse','-f','f32le','-ar',String(sr),'-ac','1','pipe:1']);
  const samples=new Float32Array(pcm.buffer.slice(pcm.byteOffset,pcm.byteOffset+pcm.byteLength));
  lines.push({text,samples,duration:samples.length/sr,file:path.relative(root,file)});
  console.log(JSON.stringify({sentence:++index,act:act.id,duration:+(samples.length/sr).toFixed(3),text}));
 }
 const sum=lines.reduce((a,b)=>a+b.duration,0), budget=act.end-act.start;
 if(sum+0.18*(lines.length-1)>budget-0.8)throw new Error(`ACT_OVERFLOW ${act.id}: speech ${sum.toFixed(2)} / budget ${budget}. Rewrite shorter; do not speed audio.`);
 const rest=budget-sum, gap=Math.min(0.58,rest/(lines.length+1)); let at=act.start+Math.min(1,rest*0.22);
 if(act.id==='outro')at=act.start+0.35;
 for(const line of lines){
  const start=at,end=start+line.duration, n=Math.round(start*sr);
  for(let i=0;i<line.samples.length;i++){let env=Math.min(1,i/180,(line.samples.length-1-i)/180); final[n+i]+=line.samples[i]*Math.max(0,env);}
  captions.push({start:+start.toFixed(3),end:+end.toFixed(3),text:line.text});
  log.push({act:act.id,start,end,duration:line.duration,file:line.file,text:line.text}); at=end+gap;
 }
 console.log(JSON.stringify({act:act.id,speech:sum,budget,rest,ending:at-gap}));
}
const pcm=Buffer.from(final.buffer);
run(['-y','-f','f32le','-ar',String(sr),'-ac','1','-i','pipe:0','-af','loudnorm=I=-17:TP=-2:LRA=8','-ar','48000','-ac','2','-c:a','libmp3lame','-b:a','128k',path.join(root,'public/audio/narration.mp3')],pcm);
await fs.writeFile(path.join(root,'production/narration-timing.json'),JSON.stringify(log,null,2));
await fs.writeFile(path.join(root,'captions.json'),JSON.stringify(captions,null,2));
function tc(t){let m=Math.round(t*1000);return `${String(Math.floor(m/3600000)).padStart(2,'0')}:${String(Math.floor(m/60000)%60).padStart(2,'0')}:${String(Math.floor(m/1000)%60).padStart(2,'0')},${String(m%1000).padStart(3,'0')}`;}
await fs.writeFile(path.join(root,'public/captions.srt'),captions.map((c,i)=>`${i+1}\n${tc(c.start)} --> ${tc(c.end)}\n${c.text}\n`).join('\n'));
console.log('NARRATION_COMPLETE '+captions.length+' sentences. All times measured from decoded audio.');
