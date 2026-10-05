import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {renderScore,DURATION} from '../music/score.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// WAV intermediates go to exports/; the encoded stems replace the ones the work plays.
const out=path.join(root,'exports/stems'),music=path.join(root,'public/music');fs.mkdirSync(out,{recursive:true});fs.mkdirSync(music,{recursive:true});
const sampleRate=48000,frames=DURATION*sampleRate;
const stems=['rhythm','bass','harmony','foley'];
function header(){const b=Buffer.alloc(44);b.write('RIFF');b.writeUInt32LE(36+frames*4,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(sampleRate,24);b.writeUInt32LE(sampleRate*4,28);b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(frames*4,40);return b;}
for(const trackId of stems){
 const wav=path.join(out,trackId+'.wav'),fd=fs.openSync(wav,'w');fs.writeSync(fd,header());let peak=0;
 for(let startFrame=0;startFrame<frames;startFrame+=sampleRate){
  const n=Math.min(sampleRate,frames-startFrame),channels=renderScore({trackId,startFrame,frames:n,sampleRate}),pcm=Buffer.alloc(n*4);
  for(let i=0;i<n;i++)for(let c=0;c<2;c++){const v=channels[c][i];peak=Math.max(peak,Math.abs(v));pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),i*4+c*2);}
  fs.writeSync(fd,pcm);
 }
 fs.closeSync(fd);const file=path.join(music,trackId+'.m4a');
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',wav,'-c:a','aac','-b:a','128k','-movflags','+faststart',file]);
 const data=fs.readFileSync(file);const row={id:trackId,file:path.relative(root,file),sha256:createHash('sha256').update(data).digest('hex'),bytes:data.length,sourcePeak:peak};console.log(JSON.stringify(row));
}
