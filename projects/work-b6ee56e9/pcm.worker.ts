import {exposePcmGenerator} from '../../src/engine/worker-pcm';
import {renderScore} from './music/score';
exposePcmGenerator((request,signal)=>renderScore(request,signal));
