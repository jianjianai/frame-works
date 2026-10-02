import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderScore,DURATION} from '../music/score.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'exports','score-master.wav');fs.mkdirSync(path.dirname(out),{recursive:true});
const rate=48000,frames=DURATION*rate,fd=fs.openSync(out,'w');
const head=Buffer.alloc(44);head.write('RIFF');head.writeUInt32LE(36+frames*4,4);head.write('WAVEfmt ',8);head.writeUInt32LE(16,16);head.writeUInt16LE(1,20);head.writeUInt16LE(2,22);head.writeUInt32LE(rate,24);head.writeUInt32LE(rate*4,28);head.writeUInt16LE(4,32);head.writeUInt16LE(16,34);head.write('data',36);head.writeUInt32LE(frames*4,40);fs.writeSync(fd,head);
const tracks=[['rhythm',1.632],['bass',1.7],['harmony',1.7],['foley',1.53]];let peak=0,clipped=0;
for(let startFrame=0;startFrame<frames;startFrame+=rate){
 const n=Math.min(rate,frames-startFrame),L=new Float32Array(n),R=new Float32Array(n);
 for(const [trackId,g]of tracks){const data=renderScore({trackId,startFrame,frames:n,sampleRate:rate});for(let i=0;i<n;i++){L[i]+=data[0][i]*g;R[i]+=data[1][i]*g;}}
 const pcm=Buffer.alloc(n*4);for(let i=0;i<n;i++)for(let c=0;c<2;c++){const v=c?R[i]:L[i];peak=Math.max(peak,Math.abs(v));if(Math.abs(v)>=1)clipped++;pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),i*4+c*2);}
 fs.writeSync(fd,pcm);
}
fs.closeSync(fd);console.log(JSON.stringify({file:out,duration:DURATION,peak,peakDb:20*Math.log10(peak),clipped}));
