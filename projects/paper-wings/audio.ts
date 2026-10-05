import { createSampledScoreAudio } from "../../src/engine/soundfont-audio";
import { paperWings } from "./music/score.mjs";
import { foley } from "./music/foley.mjs";
import levels from "./music/mix.json";

const score = paperWings();
const audio = createSampledScoreAudio({
  score,
  levels,
  foley: () => foley(score),
  bank: "films/paper-wings/music/GeneralUser-GS.sf2",
  sha256: "9575028c7a1f589f5770fccc8cff2734566af40cd26ed836944e9a5152688cfe",
});
// audio.json selects this generator as module "score"; its trackId picks "music" or "foley".
export const generators = { score: audio };
export const createAudio = audio.createAudio;
