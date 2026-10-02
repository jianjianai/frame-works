import {describe,it,expect} from 'vitest';
import {renderScore,scoreEvents,BEAT,DURATION} from '../../music/score';
describe('original fold score',()=>{
 it('has four independent complete stems and the drop is on the musical grid',()=>{
  expect(Object.keys(scoreEvents)).toEqual(['rhythm','bass','harmony','foley']);
  expect(BEAT*136).toBe(63.75);expect(DURATION).toBe(120);
  for(const events of Object.values(scoreEvents))expect(events.length).toBeGreaterThan(20);
 });
 it('reconstructs the exact same samples for cold, split and reversed requests',()=>{
  for(const trackId of Object.keys(scoreEvents)){
   const a=renderScore({trackId,startFrame:3071833,frames:4096,sampleRate:48000});
   renderScore({trackId,startFrame:17000,frames:512,sampleRate:48000});
   const b=renderScore({trackId,startFrame:3071833,frames:2048,sampleRate:48000});
   const c=renderScore({trackId,startFrame:3073881,frames:2048,sampleRate:48000});
   for(let ch=0;ch<2;ch++){expect(a[ch].slice(0,2048)).toEqual(b[ch]);expect(a[ch].slice(2048)).toEqual(c[ch]);}
  }
 });
 it('returns finite stereo samples with bounded peaks and resolves to silence',()=>{
  for(const trackId of Object.keys(scoreEvents))for(const t of [0,15.13,47,61,64,76.1,110,120]){
   const data=renderScore({trackId,startFrame:Math.round(t*48000),frames:1024,sampleRate:48000});
   expect(data.every(ch=>ch.every(x=>Number.isFinite(x)&&Math.abs(x)<=.72))).toBe(true);
   if(t===120)expect(data[0].every(x=>x===0)).toBe(true);
  }
 });
});
