import {createWorkerPcmAudio} from '../../src/engine/worker-pcm';
const score=createWorkerPcmAudio({createWorker:()=>new Worker(new URL('./pcm.worker.ts',import.meta.url),{type:'module'}),maxCacheBytes:48*1024*1024});
export const {prepareAudio,prepareSegment,createAudio,disposeAudio}=score;
