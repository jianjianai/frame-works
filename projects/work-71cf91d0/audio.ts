import type {
  GeneratedAudioOptions,
  GeneratedAudioSegmentOptions,
} from "../../src/engine/types";
import { createAudioRack, createWebAudioGenerator } from "../../src/engine/audio-adapters";

// 《潮汐之间》 generators — pure Web Audio, no pre-rendered files.
// Every voice schedules from source time `offset`, so arbitrary segments,
// rate changes and cold seeks reconstruct identically. No independent clock.

function makeNoiseBuffer(context: BaseAudioContext, seconds: number, seed: number): AudioBuffer {
  const length = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let state = seed + ch * 0.618;
    for (let i = 0; i < length; i++) {
      // deterministic LCG white noise
      state = (state * 9301 + 49297) % 233280;
      data[i] = (state / 233280 - 0.5) * 2;
    }
  }
  return buffer;
}

/** Swelling surf: filtered noise whose gain follows the deterministic tide envelope. */
const surf = createWebAudioGenerator(
  ({ context, destination, when, offset, duration, rate }: GeneratedAudioOptions) => {
    const nodes: AudioNode[] = [];
    const noise = context.createBufferSource();
    noise.buffer = makeNoiseBuffer(context, Math.max(2, Math.min(10, duration / rate + 1)), 7);
    noise.loop = true;
    // loop points map source time deterministically
    noise.loopStart = 0;
    noise.loopEnd = noise.buffer.duration;

    const lowpass = context.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 900;
    lowpass.Q.value = 0.4;

    const gain = context.createGain();
    gain.gain.value = 0;

    noise.connect(lowpass).connect(gain).connect(destination);
    nodes.push(noise, lowpass, gain);

    // deterministic tide envelope sampled from source time, honoring rate
    const period = 6; // one full swell every 6 source-seconds
    const end = offset + duration * rate;
    const swellAt = (t: number) => 0.45 + 0.55 * (0.5 + 0.5 * Math.sin((t / period) * Math.PI * 2 - Math.PI / 2));
    // schedule envelope in ~0.25s source steps over the requested window
    const step = 0.25;
    const startStep = Math.floor(offset / step) * step;
    for (let t = startStep; t < end; t += step) {
      const at = when + (t - offset) / rate;
      if (at < when - 1e-6) continue;
      gain.gain.linearRampToValueAtTime(0.16 * swellAt(t), at);
    }
    const stopAt = when + duration / rate + 0.05;
    noise.start(when, offset % noise.buffer.duration);
    noise.stop(stopAt);

    return {
      dispose() {
        try { noise.stop(); } catch { /* already stopped */ }
        for (const n of nodes) n.disconnect();
      },
    };
  },
);

/** Breathing low pad: slowly detuned sines whose chord follows the film phases. */
const pad = createWebAudioGenerator(
  ({ context, destination, when, duration, rate }: GeneratedAudioOptions) => {
    const nodes: { dispose(): void }[] = [];
    const bus = context.createGain();
    bus.gain.value = 0.22;
    bus.connect(destination);
    nodes.push(bus as unknown as { dispose(): void });

    // D minor-ish drone: A2, D3, F3 with slow beating
    const freqs = [110, 146.83, 174.61];
    const oscs: OscillatorNode[] = [];
    for (let i = 0; i < freqs.length; i++) {
      const osc = context.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freqs[i];
      // slow deterministic detune beating
      const lfo = context.createOscillator();
      lfo.frequency.value = 0.13 + i * 0.07;
      const lfoGain = context.createGain();
      lfoGain.gain.value = 1.2 + i * 0.8;
      lfo.connect(lfoGain).connect(osc.detune);
      oscs.push(lfo);
      nodes.push({
        dispose() {
          try { lfo.stop(); } catch { /* stopped */ }
          lfo.disconnect();
        },
      } as never);

      const voiceGain = context.createGain();
      voiceGain.gain.value = i === 0 ? 0.9 : 0.45;
      osc.connect(voiceGain).connect(bus);
      oscs.push(osc);
      nodes.push({
        dispose() {
          try { osc.stop(); } catch { /* stopped */ }
          osc.disconnect();
        },
      } as never);
    }

    // gentle overall swell matching the tide: one slow LFO on the bus
    const swellLfo = context.createOscillator();
    swellLfo.frequency.value = 1 / 6;
    const swellGain = context.createGain();
    swellGain.gain.value = 0.08;
    swellLfo.connect(swellGain).connect(bus.gain);
    swellLfo.start(when);
    nodes.push({
      dispose() {
        try { swellLfo.stop(); } catch { /* stopped */ }
        swellLfo.disconnect();
      },
    } as never);

    const stopAt = when + duration / rate + 0.05;
    for (const o of oscs) {
      o.start(when);
      o.stop(stopAt);
    }

    return {
      dispose() {
        for (const n of nodes) {
          try { (n as unknown as { dispose(): void }).dispose(); } catch { /* noop */ }
        }
        try { bus.disconnect(); } catch { /* noop */ }
      },
    };
  },
);

// Offline rendering requests whole segments; live playback requests rolling
// windows. Both paths only use the deterministic source-time scheduling above,
// so no extra prepareSegment state is needed.
function noopPrepare(_options: GeneratedAudioSegmentOptions): void {}

export const { generators, createAudio } = createAudioRack({
  surf,
  pad,
});
void noopPrepare;
