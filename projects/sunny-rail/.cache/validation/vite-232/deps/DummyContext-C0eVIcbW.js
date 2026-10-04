import { version } from "./tone_build_esm_version__js.js";
import { S as isUndef, a as theWindow, f as log } from "./AudioContext-CkfqkzaP.js";
//#region ../opt/frame/node_modules/.pnpm/tslib@2.8.1/node_modules/tslib/tslib.es6.mjs
function __decorate(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function __awaiter(thisArg, _arguments, P, generator) {
	function adopt(value) {
		return value instanceof P ? value : new P(function(resolve) {
			resolve(value);
		});
	}
	return new (P || (P = Promise))(function(resolve, reject) {
		function fulfilled(value) {
			try {
				step(generator.next(value));
			} catch (e) {
				reject(e);
			}
		}
		function rejected(value) {
			try {
				step(generator["throw"](value));
			} catch (e) {
				reject(e);
			}
		}
		function step(result) {
			result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
		}
		step((generator = generator.apply(thisArg, _arguments || [])).next());
	});
}
//#endregion
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/Tone.js
/**
* Tone.js
* @author Yotam Mann
* @license http://opensource.org/licenses/MIT MIT License
* @copyright 2014-2024 Yotam Mann
*/
/**
* Tone is the base class of all other classes.
*
* @category Core
* @constructor
*/
var Tone = class {
	constructor() {
		/**
		* Set this debug flag to log all events that happen in this class.
		*/
		this.debug = false;
		/**
		* Indicates if the instance was disposed
		*/
		this._wasDisposed = false;
	}
	/**
	* Returns all of the default options belonging to the class.
	*/
	static getDefaults() {
		return {};
	}
	/**
	* Prints the outputs to the console log for debugging purposes.
	* Prints the contents only if either the object has a property
	* called `debug` set to true, or a variable called TONE_DEBUG_CLASS
	* is set to the name of the class.
	* @example
	* const osc = new Tone.Oscillator();
	* // prints all logs originating from this oscillator
	* osc.debug = true;
	* // calls to start/stop will print in the console
	* osc.start();
	*/
	log(...args) {
		if (this.debug || theWindow && this.toString() === theWindow.TONE_DEBUG_CLASS) log(this, ...args);
	}
	/**
	* disconnect and dispose.
	*/
	dispose() {
		this._wasDisposed = true;
		return this;
	}
	/**
	* Indicates if the instance was disposed. 'Disposing' an
	* instance means that all of the Web Audio nodes that were
	* created for the instance are disconnected and freed for garbage collection.
	*/
	get disposed() {
		return this._wasDisposed;
	}
	/**
	* Convert the class to a string
	* @example
	* const osc = new Tone.Oscillator();
	* console.log(osc.toString());
	*/
	toString() {
		return this.name;
	}
};
/**
* The version number semver
*/
Tone.version = version;
//#endregion
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/util/Emitter.js
/**
* Emitter gives classes which extend it
* the ability to listen for and emit events.
* Inspiration and reference from Jerome Etienne's [MicroEvent](https://github.com/jeromeetienne/microevent.js).
* MIT (c) 2011 Jerome Etienne.
* @category Core
*/
var Emitter = class Emitter extends Tone {
	constructor() {
		super(...arguments);
		this.name = "Emitter";
	}
	/**
	* Bind a callback to a specific event.
	* @param  event     The name of the event to listen for.
	* @param  callback  The callback to invoke when the event is emitted
	*/
	on(event, callback) {
		event.split(/\W+/).forEach((eventName) => {
			if (isUndef(this._events)) this._events = {};
			if (!this._events.hasOwnProperty(eventName)) this._events[eventName] = [];
			this._events[eventName].push(callback);
		});
		return this;
	}
	/**
	* Bind a callback which is only invoked once
	* @param  event     The name of the event to listen for.
	* @param  callback  The callback to invoke when the event is emitted
	*/
	once(event, callback) {
		const boundCallback = (...args) => {
			callback(...args);
			this.off(event, boundCallback);
		};
		this.on(event, boundCallback);
		return this;
	}
	/**
	* Remove the event listener.
	* @param  event     The event to stop listening to.
	* @param  callback  The callback which was bound to the event with Emitter.on.
	*                   If no callback is given, all callbacks events are removed.
	*/
	off(event, callback) {
		event.split(/\W+/).forEach((eventName) => {
			if (isUndef(this._events)) this._events = {};
			if (this._events.hasOwnProperty(eventName)) {
				if (isUndef(callback)) this._events[eventName] = [];
				else {
					const eventList = this._events[eventName];
					for (let i = eventList.length - 1; i >= 0; i--) if (eventList[i] === callback) eventList.splice(i, 1);
				}
			}
		});
		return this;
	}
	/**
	* Invoke all of the callbacks bound to the event
	* with any arguments passed in.
	* @param  event  The name of the event.
	* @param args The arguments to pass to the functions listening.
	*/
	emit(event, ...args) {
		if (this._events) {
			if (this._events.hasOwnProperty(event)) {
				const eventList = this._events[event].slice(0);
				for (let i = 0, len = eventList.length; i < len; i++) eventList[i].apply(this, args);
			}
		}
		return this;
	}
	/**
	* Add Emitter functions (on/off/emit) to the object
	*/
	static mixin(constr) {
		[
			"on",
			"once",
			"off",
			"emit"
		].forEach((name) => {
			const property = Object.getOwnPropertyDescriptor(Emitter.prototype, name);
			Object.defineProperty(constr.prototype, name, property);
		});
	}
	/**
	* Clean up
	*/
	dispose() {
		super.dispose();
		this._events = void 0;
		return this;
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/context/BaseContext.js
var BaseContext = class extends Emitter {
	constructor() {
		super(...arguments);
		this.isOffline = false;
	}
	toJSON() {
		return {};
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/context/DummyContext.js
var DummyContext = class extends BaseContext {
	constructor() {
		super(...arguments);
		this.lookAhead = 0;
		this.latencyHint = 0;
		this.isOffline = false;
	}
	createAnalyser() {
		return {};
	}
	createOscillator() {
		return {};
	}
	createBufferSource() {
		return {};
	}
	createBiquadFilter() {
		return {};
	}
	createBuffer(_numberOfChannels, _length, _sampleRate) {
		return {};
	}
	createChannelMerger(_numberOfInputs) {
		return {};
	}
	createChannelSplitter(_numberOfOutputs) {
		return {};
	}
	createConstantSource() {
		return {};
	}
	createConvolver() {
		return {};
	}
	createDelay(_maxDelayTime) {
		return {};
	}
	createDynamicsCompressor() {
		return {};
	}
	createGain() {
		return {};
	}
	createIIRFilter(_feedForward, _feedback) {
		return {};
	}
	createPanner() {
		return {};
	}
	createPeriodicWave(_real, _imag, _constraints) {
		return {};
	}
	createStereoPanner() {
		return {};
	}
	createWaveShaper() {
		return {};
	}
	createMediaStreamSource(_stream) {
		return {};
	}
	createMediaElementSource(_element) {
		return {};
	}
	createMediaStreamDestination() {
		return {};
	}
	decodeAudioData(_audioData) {
		return Promise.resolve({});
	}
	createAudioWorkletNode(_name, _options) {
		return {};
	}
	get rawContext() {
		return {};
	}
	addAudioWorkletModule(_url) {
		return __awaiter(this, void 0, void 0, function* () {
			return Promise.resolve();
		});
	}
	resume() {
		return Promise.resolve();
	}
	setTimeout(_fn, _timeout) {
		return 0;
	}
	clearTimeout(_id) {
		return this;
	}
	setInterval(_fn, _interval) {
		return 0;
	}
	clearInterval(_id) {
		return this;
	}
	getConstant(_val) {
		return {};
	}
	get currentTime() {
		return 0;
	}
	get state() {
		return {};
	}
	get sampleRate() {
		return 0;
	}
	get listener() {
		return {};
	}
	get transport() {
		return {};
	}
	get draw() {
		return {};
	}
	set draw(_d) {}
	get destination() {
		return {};
	}
	set destination(_d) {}
	now() {
		return 0;
	}
	immediate() {
		return 0;
	}
};
//#endregion
export { __awaiter as a, Tone as i, BaseContext as n, __decorate as o, Emitter as r, DummyContext as t };
