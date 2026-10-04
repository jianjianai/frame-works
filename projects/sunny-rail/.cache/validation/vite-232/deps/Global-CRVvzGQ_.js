import { version } from "./tone_build_esm_version__js.js";
import { C as audioBufferConstructor, D as isAnyOfflineAudioContext, E as isAnyAudioParam, S as isUndef, T as isAnyAudioNode, a as theWindow, b as isObject, g as isDefined, i as hasAudioContext, m as isArray, n as createAudioWorkletNode, r as createOfflineAudioContext, s as assert, t as createAudioContext, w as isAnyAudioContext, x as isString, y as isNumber } from "./AudioContext-CkfqkzaP.js";
import { a as __awaiter, i as Tone, n as BaseContext, t as DummyContext } from "./DummyContext-C0eVIcbW.js";
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/clock/Ticker.js
/**
* A class which provides a reliable callback using either
* a Web Worker, or if that isn't supported, falls back to setTimeout.
*/
var Ticker = class {
	constructor(callback, type, updateInterval, contextSampleRate) {
		this._callback = callback;
		this._type = type;
		this._minimumUpdateInterval = Math.max(128 / (contextSampleRate || 44100), .001);
		this.updateInterval = updateInterval;
		this._createClock();
	}
	/**
	* Generate a web worker
	*/
	_createWorker() {
		const blob = new Blob([`
			// the initial timeout time
			let timeoutTime =  ${(this._updateInterval * 1e3).toFixed(1)};
			// onmessage callback
			self.onmessage = function(msg){
				timeoutTime = parseInt(msg.data);
			};
			// the tick function which posts a message
			// and schedules a new tick
			function tick(){
				setTimeout(tick, timeoutTime);
				self.postMessage('tick');
			}
			// call tick initially
			tick();
			`], { type: "text/javascript" });
		const blobUrl = URL.createObjectURL(blob);
		const worker = new Worker(blobUrl);
		worker.onmessage = this._callback.bind(this);
		this._worker = worker;
	}
	/**
	* Create a timeout loop
	*/
	_createTimeout() {
		this._timeout = setTimeout(() => {
			this._createTimeout();
			this._callback();
		}, this._updateInterval * 1e3);
	}
	/**
	* Create the clock source.
	*/
	_createClock() {
		if (this._type === "worker") try {
			this._createWorker();
		} catch (e) {
			this._type = "timeout";
			this._createClock();
		}
		else if (this._type === "timeout") this._createTimeout();
	}
	/**
	* Clean up the current clock source
	*/
	_disposeClock() {
		if (this._timeout) clearTimeout(this._timeout);
		if (this._worker) {
			this._worker.terminate();
			this._worker.onmessage = null;
		}
	}
	/**
	* The rate in seconds the ticker will update
	*/
	get updateInterval() {
		return this._updateInterval;
	}
	set updateInterval(interval) {
		var _a;
		this._updateInterval = Math.max(interval, this._minimumUpdateInterval);
		if (this._type === "worker") (_a = this._worker) === null || _a === void 0 || _a.postMessage(this._updateInterval * 1e3);
	}
	/**
	* The type of the ticker, either a worker or a timeout
	*/
	get type() {
		return this._type;
	}
	set type(type) {
		this._disposeClock();
		this._type = type;
		this._createClock();
	}
	/**
	* Clean up
	*/
	dispose() {
		this._disposeClock();
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/util/AdvancedTypeCheck.js
/**
* Test if the given value is an instanceof AudioParam
*/
function isAudioParam(arg) {
	return isAnyAudioParam(arg);
}
/**
* Test if the given value is an instanceof AudioNode
*/
function isAudioNode(arg) {
	return isAnyAudioNode(arg);
}
/**
* Test if the arg is instanceof an OfflineAudioContext
*/
function isOfflineAudioContext(arg) {
	return isAnyOfflineAudioContext(arg);
}
/**
* Test if the arg is an instanceof AudioContext
*/
function isAudioContext(arg) {
	return isAnyAudioContext(arg);
}
/**
* Test if the arg is instanceof an AudioBuffer
*/
function isAudioBuffer(arg) {
	return arg instanceof audioBufferConstructor;
}
//#endregion
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/util/Defaults.js
/**
* Some objects should not be merged
*/
function noCopy(key, arg) {
	return key === "value" || isAudioParam(arg) || isAudioNode(arg) || isAudioBuffer(arg);
}
/**
* Recursively merge an object
* @param target the object to merge into
* @param sources the source objects to merge
*/
function deepMerge(target, ...sources) {
	if (!sources.length) return target;
	const source = sources.shift();
	if (isObject(target) && isObject(source)) for (const key in source) if (noCopy(key, source[key])) target[key] = source[key];
	else if (isObject(source[key])) {
		if (!target[key]) Object.assign(target, { [key]: {} });
		deepMerge(target[key], source[key]);
	} else Object.assign(target, { [key]: source[key] });
	return deepMerge(target, ...sources);
}
/**
* Returns true if the two arrays have the same value for each of the elements
*/
function deepEquals(arrayA, arrayB) {
	return arrayA.length === arrayB.length && arrayA.every((element, index) => arrayB[index] === element);
}
/**
* Convert an args array into an object.
* @internal
*/
function optionsFromArguments(defaults, argsArray, keys = [], objKey) {
	const opts = {};
	const args = Array.from(argsArray);
	if (isObject(args[0]) && objKey && !Reflect.has(args[0], objKey)) {
		if (!Object.keys(args[0]).some((key) => Reflect.has(defaults, key))) {
			deepMerge(opts, { [objKey]: args[0] });
			keys.splice(keys.indexOf(objKey), 1);
			args.shift();
		}
	}
	if (args.length === 1 && isObject(args[0])) deepMerge(opts, args[0]);
	else for (let i = 0; i < keys.length; i++) if (isDefined(args[i])) opts[keys[i]] = args[i];
	return deepMerge(defaults, opts);
}
/**
* Return this instances default values by calling Constructor.getDefaults()
*/
function getDefaultsFromInstance(instance) {
	return instance.constructor.getDefaults();
}
/**
* Returns the fallback if the given object is undefined.
* Take an array of arguments and return a formatted options object.
* @internal
*/
function defaultArg(given, fallback) {
	if (isUndef(given)) return fallback;
	else return given;
}
/**
* Remove all of the properties belonging to omit from obj.
*/
function omitFromObject(obj, omit) {
	omit.forEach((prop) => {
		if (Reflect.has(obj, prop)) delete obj[prop];
	});
	return obj;
}
//#endregion
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/util/Math.js
/**
* The threshold for correctness for operators. Less than one sample even
* at very high sampling rates (e.g. `1e-6 < 1 / 192000`).
*/
var EPSILON = 1e-6;
/**
* Test if A is greater than B
*/
function GT(a, b) {
	return a > b + EPSILON;
}
/**
* Test if A is greater than or equal to B
*/
function GTE(a, b) {
	return GT(a, b) || EQ(a, b);
}
/**
* Test if A is less than B
*/
function LT(a, b) {
	return a + EPSILON < b;
}
/**
* Test if A is less than B
*/
function EQ(a, b) {
	return Math.abs(a - b) < EPSILON;
}
/**
* Clamp the value within the given range
*/
function clamp(value, min, max) {
	return Math.max(Math.min(value, max), min);
}
//#endregion
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/util/Timeline.js
/**
* A Timeline class for scheduling and maintaining state
* along a timeline. All events must have a "time" property.
* Internally, events are stored in time order for fast
* retrieval.
* @internal
*/
var Timeline = class Timeline extends Tone {
	constructor() {
		super();
		this.name = "Timeline";
		/**
		* The array of scheduled timeline events
		*/
		this._timeline = [];
		const options = optionsFromArguments(Timeline.getDefaults(), arguments, ["memory"]);
		this.memory = options.memory;
		this.increasing = options.increasing;
	}
	static getDefaults() {
		return {
			memory: Infinity,
			increasing: false
		};
	}
	/**
	* The number of items in the timeline.
	*/
	get length() {
		return this._timeline.length;
	}
	/**
	* Insert an event object onto the timeline. Events must have a "time" attribute.
	* @param event  The event object to insert into the timeline.
	*/
	add(event) {
		assert(Reflect.has(event, "time"), "Timeline: events must have a time attribute");
		event.time = event.time.valueOf();
		if (this.increasing && this.length) {
			const lastValue = this._timeline[this.length - 1];
			assert(GTE(event.time, lastValue.time), "The time must be greater than or equal to the last scheduled time");
			this._timeline.push(event);
		} else {
			const index = this._search(event.time);
			this._timeline.splice(index + 1, 0, event);
		}
		if (this.length > this.memory) {
			const diff = this.length - this.memory;
			this._timeline.splice(0, diff);
		}
		return this;
	}
	/**
	* Remove an event from the timeline.
	* @param  {Object}  event  The event object to remove from the list.
	* @returns {Timeline} this
	*/
	remove(event) {
		const index = this._timeline.indexOf(event);
		if (index !== -1) this._timeline.splice(index, 1);
		return this;
	}
	/**
	* Get the nearest event whose time is less than or equal to the given time.
	* @param  time  The time to query.
	*/
	get(time, param = "time") {
		const index = this._search(time, param);
		if (index !== -1) return this._timeline[index];
		else return null;
	}
	/**
	* Return the first event in the timeline without removing it
	* @returns {Object} The first event object
	* @deprecated
	*/
	peek() {
		return this._timeline[0];
	}
	/**
	* Return the first event in the timeline and remove it
	* @deprecated
	*/
	shift() {
		return this._timeline.shift();
	}
	/**
	* Get the event which is scheduled after the given time.
	* @param  time  The time to query.
	*/
	getAfter(time, param = "time") {
		const index = this._search(time, param);
		if (index + 1 < this._timeline.length) return this._timeline[index + 1];
		else return null;
	}
	/**
	* Get the event before the event at the given time.
	* @param  time  The time to query.
	*/
	getBefore(time) {
		const len = this._timeline.length;
		if (len > 0 && this._timeline[len - 1].time < time) return this._timeline[len - 1];
		const index = this._search(time);
		if (index - 1 >= 0) return this._timeline[index - 1];
		else return null;
	}
	/**
	* Cancel events at and after the given time
	* @param  after  The time to query.
	*/
	cancel(after) {
		if (this._timeline.length > 1) {
			let index = this._search(after);
			if (index >= 0) {
				if (EQ(this._timeline[index].time, after)) {
					for (let i = index; i >= 0; i--) if (EQ(this._timeline[i].time, after)) index = i;
					else break;
					this._timeline = this._timeline.slice(0, index);
				} else this._timeline = this._timeline.slice(0, index + 1);
			} else this._timeline = [];
		} else if (this._timeline.length === 1) {
			if (GTE(this._timeline[0].time, after)) this._timeline = [];
		}
		return this;
	}
	/**
	* Cancel events before or equal to the given time.
	* @param  time  The time to cancel before.
	*/
	cancelBefore(time) {
		const index = this._search(time);
		if (index >= 0) this._timeline = this._timeline.slice(index + 1);
		return this;
	}
	/**
	* Returns the previous event if there is one. null otherwise
	* @param  event The event to find the previous one of
	* @return The event right before the given event
	*/
	previousEvent(event) {
		const index = this._timeline.indexOf(event);
		if (index > 0) return this._timeline[index - 1];
		else return null;
	}
	/**
	* Does a binary search on the timeline array and returns the
	* nearest event index whose time is after or equal to the given time.
	* If a time is searched before the first index in the timeline, -1 is returned.
	* If the time is after the end, the index of the last item is returned.
	*/
	_search(time, param = "time") {
		if (this._timeline.length === 0) return -1;
		let beginning = 0;
		const len = this._timeline.length;
		let end = len;
		if (len > 0 && this._timeline[len - 1][param] <= time) return len - 1;
		while (beginning < end) {
			let midPoint = Math.floor(beginning + (end - beginning) / 2);
			const event = this._timeline[midPoint];
			const nextEvent = this._timeline[midPoint + 1];
			if (EQ(event[param], time)) {
				for (let i = midPoint; i < this._timeline.length; i++) {
					const testEvent = this._timeline[i];
					if (EQ(testEvent[param], time)) midPoint = i;
					else break;
				}
				return midPoint;
			} else if (LT(event[param], time) && GT(nextEvent[param], time)) return midPoint;
			else if (GT(event[param], time)) end = midPoint;
			else beginning = midPoint + 1;
		}
		return -1;
	}
	/**
	* Internal iterator. Applies extra safety checks for
	* removing items from the array.
	*/
	_iterate(callback, lowerBound = 0, upperBound = this._timeline.length - 1) {
		this._timeline.slice(lowerBound, upperBound + 1).forEach(callback);
	}
	/**
	* Iterate over everything in the array
	* @param  callback The callback to invoke with every item
	*/
	forEach(callback) {
		this._iterate(callback);
		return this;
	}
	/**
	* Iterate over everything in the array at or before the given time.
	* @param  time The time to check if items are before
	* @param  callback The callback to invoke with every item
	*/
	forEachBefore(time, callback) {
		const upperBound = this._search(time);
		if (upperBound !== -1) this._iterate(callback, 0, upperBound);
		return this;
	}
	/**
	* Iterate over everything in the array after the given time.
	* @param  time The time to check if items are before
	* @param  callback The callback to invoke with every item
	*/
	forEachAfter(time, callback) {
		const lowerBound = this._search(time);
		this._iterate(callback, lowerBound + 1);
		return this;
	}
	/**
	* Iterate over everything in the array between the startTime and endTime.
	* The timerange is inclusive of the startTime, but exclusive of the endTime.
	* range = [startTime, endTime).
	* @param  startTime The time to check if items are before
	* @param  endTime The end of the test interval.
	* @param  callback The callback to invoke with every item
	*/
	forEachBetween(startTime, endTime, callback) {
		let lowerBound = this._search(startTime);
		let upperBound = this._search(endTime);
		if (lowerBound !== -1 && upperBound !== -1) {
			if (this._timeline[lowerBound].time !== startTime) lowerBound += 1;
			if (this._timeline[upperBound].time === endTime) upperBound -= 1;
			this._iterate(callback, lowerBound, upperBound);
		} else if (lowerBound === -1) this._iterate(callback, 0, upperBound);
		return this;
	}
	/**
	* Iterate over everything in the array at or after the given time. Similar to
	* forEachAfter, but includes the item(s) at the given time.
	* @param  time The time to check if items are before
	* @param  callback The callback to invoke with every item
	*/
	forEachFrom(time, callback) {
		let lowerBound = this._search(time);
		while (lowerBound >= 0 && this._timeline[lowerBound].time >= time) lowerBound--;
		this._iterate(callback, lowerBound + 1);
		return this;
	}
	/**
	* Iterate over everything in the array at the given time
	* @param  time The time to check if items are before
	* @param  callback The callback to invoke with every item
	*/
	forEachAtTime(time, callback) {
		const upperBound = this._search(time);
		if (upperBound !== -1 && EQ(this._timeline[upperBound].time, time)) {
			let lowerBound = upperBound;
			for (let i = upperBound; i >= 0; i--) if (EQ(this._timeline[i].time, time)) lowerBound = i;
			else break;
			this._iterate((event) => {
				callback(event);
			}, lowerBound, upperBound);
		}
		return this;
	}
	/**
	* Clean up.
	*/
	dispose() {
		super.dispose();
		this._timeline = [];
		return this;
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/context/ContextInitialization.js
/**
* Array of callbacks to invoke when a new context is created
*/
var notifyNewContext = [];
/**
* Used internally to setup a new Context
*/
function onContextInit(cb) {
	notifyNewContext.push(cb);
}
/**
* Invoke any classes which need to also be initialized when a new context is created.
*/
function initializeContext(ctx) {
	notifyNewContext.forEach((cb) => cb(ctx));
}
/**
* Array of callbacks to invoke when a new context is closed
*/
var notifyCloseContext = [];
/**
* Used internally to tear down a Context
*/
function onContextClose(cb) {
	notifyCloseContext.push(cb);
}
function closeContext(ctx) {
	notifyCloseContext.forEach((cb) => cb(ctx));
}
//#endregion
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/context/Context.js
/**
* Wrapper around the native AudioContext.
* @category Core
*/
var Context = class Context extends BaseContext {
	constructor() {
		var _a, _b;
		super();
		this.name = "Context";
		/**
		* An object containing all of the constants AudioBufferSourceNodes
		*/
		this._constants = /* @__PURE__ */ new Map();
		/**
		* All of the setTimeout events.
		*/
		this._timeouts = new Timeline();
		/**
		* The timeout id counter
		*/
		this._timeoutIds = 0;
		/**
		* Private indicator if the context has been initialized
		*/
		this._initialized = false;
		/**
		* Private indicator if a close() has been called on the context, since close is async
		*/
		this._closeStarted = false;
		/**
		* Indicates if the context is an OfflineAudioContext or an AudioContext
		*/
		this.isOffline = false;
		/**
		* Maps a module name to promise of the addModule method
		*/
		this._workletPromise = null;
		const options = optionsFromArguments(Context.getDefaults(), arguments, ["context"]);
		if (options.context) {
			this._context = options.context;
			this._latencyHint = ((_a = arguments[0]) === null || _a === void 0 ? void 0 : _a.latencyHint) || "";
		} else {
			this._context = createAudioContext({ latencyHint: options.latencyHint });
			this._latencyHint = options.latencyHint;
		}
		this._ticker = new Ticker(this.emit.bind(this, "tick"), options.clockSource, options.updateInterval, this._context.sampleRate);
		this.on("tick", this._timeoutLoop.bind(this));
		this._context.onstatechange = () => {
			this.emit("statechange", this.state);
		};
		this[((_b = arguments[0]) === null || _b === void 0 ? void 0 : _b.hasOwnProperty("updateInterval")) ? "_lookAhead" : "lookAhead"] = options.lookAhead;
	}
	static getDefaults() {
		return {
			clockSource: "worker",
			latencyHint: "interactive",
			lookAhead: .1,
			updateInterval: .05
		};
	}
	/**
	* Finish setting up the context. **You usually do not need to do this manually.**
	*/
	initialize() {
		if (!this._initialized) {
			initializeContext(this);
			this._initialized = true;
		}
		return this;
	}
	createAnalyser() {
		return this._context.createAnalyser();
	}
	createOscillator() {
		return this._context.createOscillator();
	}
	createBufferSource() {
		return this._context.createBufferSource();
	}
	createBiquadFilter() {
		return this._context.createBiquadFilter();
	}
	createBuffer(numberOfChannels, length, sampleRate) {
		return this._context.createBuffer(numberOfChannels, length, sampleRate);
	}
	createChannelMerger(numberOfInputs) {
		return this._context.createChannelMerger(numberOfInputs);
	}
	createChannelSplitter(numberOfOutputs) {
		return this._context.createChannelSplitter(numberOfOutputs);
	}
	createConstantSource() {
		return this._context.createConstantSource();
	}
	createConvolver() {
		return this._context.createConvolver();
	}
	createDelay(maxDelayTime) {
		return this._context.createDelay(maxDelayTime);
	}
	createDynamicsCompressor() {
		return this._context.createDynamicsCompressor();
	}
	createGain() {
		return this._context.createGain();
	}
	createIIRFilter(feedForward, feedback) {
		return this._context.createIIRFilter(feedForward, feedback);
	}
	createPanner() {
		return this._context.createPanner();
	}
	createPeriodicWave(real, imag, constraints) {
		return this._context.createPeriodicWave(real, imag, constraints);
	}
	createStereoPanner() {
		return this._context.createStereoPanner();
	}
	createWaveShaper() {
		return this._context.createWaveShaper();
	}
	createMediaStreamSource(stream) {
		assert(isAudioContext(this._context), "Not available if OfflineAudioContext");
		return this._context.createMediaStreamSource(stream);
	}
	createMediaElementSource(element) {
		assert(isAudioContext(this._context), "Not available if OfflineAudioContext");
		return this._context.createMediaElementSource(element);
	}
	createMediaStreamDestination() {
		assert(isAudioContext(this._context), "Not available if OfflineAudioContext");
		return this._context.createMediaStreamDestination();
	}
	decodeAudioData(audioData) {
		return this._context.decodeAudioData(audioData);
	}
	/**
	* The current time in seconds of the AudioContext.
	*/
	get currentTime() {
		return this._context.currentTime;
	}
	/**
	* The current time in seconds of the AudioContext.
	*/
	get state() {
		return this._context.state;
	}
	/**
	* The current time in seconds of the AudioContext.
	*/
	get sampleRate() {
		return this._context.sampleRate;
	}
	/**
	* The listener
	*/
	get listener() {
		this.initialize();
		return this._listener;
	}
	set listener(l) {
		assert(!this._initialized, "The listener cannot be set after initialization.");
		this._listener = l;
	}
	/**
	* There is only one Transport per Context. It is created on initialization.
	*/
	get transport() {
		this.initialize();
		return this._transport;
	}
	set transport(t) {
		assert(!this._initialized, "The transport cannot be set after initialization.");
		this._transport = t;
	}
	/**
	* This is the Draw object for the context which is useful for synchronizing the draw frame with the Tone.js clock.
	*/
	get draw() {
		this.initialize();
		return this._draw;
	}
	set draw(d) {
		assert(!this._initialized, "Draw cannot be set after initialization.");
		this._draw = d;
	}
	/**
	* A reference to the Context's destination node.
	*/
	get destination() {
		this.initialize();
		return this._destination;
	}
	set destination(d) {
		assert(!this._initialized, "The destination cannot be set after initialization.");
		this._destination = d;
	}
	/**
	* Create an audio worklet node from a name and options. The module
	* must first be loaded using {@link addAudioWorkletModule}.
	*/
	createAudioWorkletNode(name, options) {
		return createAudioWorkletNode(this.rawContext, name, options);
	}
	/**
	* Add an AudioWorkletProcessor module
	* @param url The url of the module
	*/
	addAudioWorkletModule(url) {
		return __awaiter(this, void 0, void 0, function* () {
			assert(isDefined(this.rawContext.audioWorklet), "AudioWorkletNode is only available in a secure context (https or localhost)");
			if (!this._workletPromise) this._workletPromise = this.rawContext.audioWorklet.addModule(url);
			yield this._workletPromise;
		});
	}
	/**
	* Returns a promise which resolves when all of the worklets have been loaded on this context
	*/
	workletsAreReady() {
		return __awaiter(this, void 0, void 0, function* () {
			(yield this._workletPromise) ? this._workletPromise : Promise.resolve();
		});
	}
	/**
	* How often the interval callback is invoked.
	* This number corresponds to how responsive the scheduling
	* can be. Setting to 0 will result in the lowest practial interval
	* based on context properties. context.updateInterval + context.lookAhead
	* gives you the total latency between scheduling an event and hearing it.
	*/
	get updateInterval() {
		return this._ticker.updateInterval;
	}
	set updateInterval(interval) {
		this._ticker.updateInterval = interval;
	}
	/**
	* What the source of the clock is, either "worker" (default),
	* "timeout", or "offline" (none).
	*/
	get clockSource() {
		return this._ticker.type;
	}
	set clockSource(type) {
		this._ticker.type = type;
	}
	/**
	* The amount of time into the future events are scheduled. Giving Web Audio
	* a short amount of time into the future to schedule events can reduce clicks and
	* improve performance. This value can be set to 0 to get the lowest latency.
	* Adjusting this value also affects the {@link updateInterval}.
	*/
	get lookAhead() {
		return this._lookAhead;
	}
	set lookAhead(time) {
		this._lookAhead = time;
		this.updateInterval = time ? time / 2 : .01;
	}
	/**
	* The type of playback, which affects tradeoffs between audio
	* output latency and responsiveness.
	* In addition to setting the value in seconds, the latencyHint also
	* accepts the strings "interactive" (prioritizes low latency),
	* "playback" (prioritizes sustained playback), "balanced" (balances
	* latency and performance).
	* @example
	* // prioritize sustained playback
	* const context = new Tone.Context({ latencyHint: "playback" });
	* // set this context as the global Context
	* Tone.setContext(context);
	* // the global context is gettable with Tone.getContext()
	* console.log(Tone.getContext().latencyHint);
	*/
	get latencyHint() {
		return this._latencyHint;
	}
	/**
	* The unwrapped AudioContext or OfflineAudioContext
	*/
	get rawContext() {
		return this._context;
	}
	/**
	* The current audio context time plus a short {@link lookAhead}.
	* @example
	* setInterval(() => {
	* 	console.log("now", Tone.now());
	* }, 100);
	*/
	now() {
		return this._context.currentTime + this._lookAhead;
	}
	/**
	* The current audio context time without the {@link lookAhead}.
	* In most cases it is better to use {@link now} instead of {@link immediate} since
	* with {@link now} the {@link lookAhead} is applied equally to _all_ components including internal components,
	* to making sure that everything is scheduled in sync. Mixing {@link now} and {@link immediate}
	* can cause some timing issues. If no lookAhead is desired, you can set the {@link lookAhead} to `0`.
	*/
	immediate() {
		return this._context.currentTime;
	}
	/**
	* Starts the audio context from a suspended state. This is required
	* to initially start the AudioContext.
	* @see {@link start}
	*/
	resume() {
		if (isAudioContext(this._context)) return this._context.resume();
		else return Promise.resolve();
	}
	/**
	* Close the context. Once closed, the context can no longer be used and
	* any AudioNodes created from the context will be silent.
	*/
	close() {
		return __awaiter(this, void 0, void 0, function* () {
			if (isAudioContext(this._context) && this.state !== "closed" && !this._closeStarted) {
				this._closeStarted = true;
				yield this._context.close();
			}
			if (this._initialized) closeContext(this);
		});
	}
	/**
	* **Internal** Generate a looped buffer at some constant value.
	*/
	getConstant(val) {
		if (this._constants.has(val)) return this._constants.get(val);
		else {
			const buffer = this._context.createBuffer(1, 128, this._context.sampleRate);
			const arr = buffer.getChannelData(0);
			for (let i = 0; i < arr.length; i++) arr[i] = val;
			const constant = this._context.createBufferSource();
			constant.channelCount = 1;
			constant.channelCountMode = "explicit";
			constant.buffer = buffer;
			constant.loop = true;
			constant.start(0);
			this._constants.set(val, constant);
			return constant;
		}
	}
	/**
	* Clean up. Also closes the audio context.
	*/
	dispose() {
		super.dispose();
		this._ticker.dispose();
		this._timeouts.dispose();
		Object.keys(this._constants).map((val) => this._constants[val].disconnect());
		this.close();
		return this;
	}
	/**
	* The private loop which keeps track of the context scheduled timeouts
	* Is invoked from the clock source
	*/
	_timeoutLoop() {
		const now = this.now();
		this._timeouts.forEachBefore(now, (event) => {
			event.callback();
			this._timeouts.remove(event);
		});
	}
	/**
	* A setTimeout which is guaranteed by the clock source.
	* Also runs in the offline context.
	* @param  fn       The callback to invoke
	* @param  timeout  The timeout in seconds
	* @returns ID to use when invoking Context.clearTimeout
	*/
	setTimeout(fn, timeout) {
		this._timeoutIds++;
		const now = this.now();
		this._timeouts.add({
			callback: fn,
			id: this._timeoutIds,
			time: now + timeout
		});
		return this._timeoutIds;
	}
	/**
	* Clears a previously scheduled timeout with Tone.context.setTimeout
	* @param  id  The ID returned from setTimeout
	*/
	clearTimeout(id) {
		this._timeouts.forEach((event) => {
			if (event.id === id) this._timeouts.remove(event);
		});
		return this;
	}
	/**
	* Clear the function scheduled by {@link setInterval}
	*/
	clearInterval(id) {
		return this.clearTimeout(id);
	}
	/**
	* Adds a repeating event to the context's callback clock
	*/
	setInterval(fn, interval) {
		const id = ++this._timeoutIds;
		const intervalFn = () => {
			const now = this.now();
			this._timeouts.add({
				callback: () => {
					fn();
					intervalFn();
				},
				id,
				time: now + interval
			});
		};
		intervalFn();
		return id;
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/util/Interface.js
/**
* Make the property not writable using `defineProperty`. Internal use only.
*/
function readOnly(target, property) {
	if (isArray(property)) property.forEach((str) => readOnly(target, str));
	else Object.defineProperty(target, property, {
		enumerable: true,
		writable: false
	});
}
/**
* Make an attribute writeable. Internal use only.
*/
function writable(target, property) {
	if (isArray(property)) property.forEach((str) => writable(target, str));
	else Object.defineProperty(target, property, { writable: true });
}
var noOp = () => {};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/context/ToneAudioBuffer.js
/**
* AudioBuffer loading and storage. ToneAudioBuffer is used internally by all
* classes that make requests for audio files such as Tone.Player,
* Tone.Sampler and Tone.Convolver.
* @example
* const buffer = new Tone.ToneAudioBuffer("https://tonejs.github.io/audio/casio/A1.mp3", () => {
* 	console.log("loaded");
* });
* @category Core
*/
var ToneAudioBuffer = class ToneAudioBuffer extends Tone {
	constructor() {
		super();
		this.name = "ToneAudioBuffer";
		/**
		* Callback when the buffer is loaded.
		*/
		this.onload = noOp;
		const options = optionsFromArguments(ToneAudioBuffer.getDefaults(), arguments, [
			"url",
			"onload",
			"onerror"
		]);
		this.reverse = options.reverse;
		this.onload = options.onload;
		if (isString(options.url)) this.load(options.url).catch(options.onerror);
		else if (options.url) this.set(options.url);
	}
	static getDefaults() {
		return {
			onerror: noOp,
			onload: noOp,
			reverse: false
		};
	}
	/**
	* The sample rate of the AudioBuffer
	*/
	get sampleRate() {
		if (this._buffer) return this._buffer.sampleRate;
		else return getContext().sampleRate;
	}
	/**
	* Pass in an AudioBuffer or ToneAudioBuffer to set the value of this buffer.
	*/
	set(buffer) {
		if (buffer instanceof ToneAudioBuffer) {
			if (buffer.loaded) this._buffer = buffer.get();
			else buffer.onload = () => {
				this.set(buffer);
				this.onload(this);
			};
		} else this._buffer = buffer;
		if (this._reversed) this._reverse();
		return this;
	}
	/**
	* The audio buffer stored in the object.
	*/
	get() {
		return this._buffer;
	}
	/**
	* Makes an fetch request for the selected url then decodes the file as an audio buffer.
	* Invokes the callback once the audio buffer loads.
	* @param url The url of the buffer to load. filetype support depends on the browser.
	* @returns A Promise which resolves with this ToneAudioBuffer
	*/
	load(url) {
		return __awaiter(this, void 0, void 0, function* () {
			const doneLoading = ToneAudioBuffer.load(url).then((audioBuffer) => {
				this.set(audioBuffer);
				this.onload(this);
			});
			ToneAudioBuffer.downloads.push(doneLoading);
			try {
				yield doneLoading;
			} finally {
				const index = ToneAudioBuffer.downloads.indexOf(doneLoading);
				ToneAudioBuffer.downloads.splice(index, 1);
			}
			return this;
		});
	}
	/**
	* clean up
	*/
	dispose() {
		super.dispose();
		this._buffer = void 0;
		return this;
	}
	/**
	* Set the audio buffer from the array.
	* To create a multichannel AudioBuffer, pass in a multidimensional array.
	* @param array The array to fill the audio buffer
	*/
	fromArray(array) {
		const isMultidimensional = isArray(array) && array[0].length > 0;
		const channels = isMultidimensional ? array.length : 1;
		const len = isMultidimensional ? array[0].length : array.length;
		const context = getContext();
		const buffer = context.createBuffer(channels, len, context.sampleRate);
		const multiChannelArray = !isMultidimensional && channels === 1 ? [array] : array;
		for (let c = 0; c < channels; c++) buffer.copyToChannel(multiChannelArray[c], c);
		this._buffer = buffer;
		return this;
	}
	/**
	* Sums multiple channels into 1 channel
	* @param chanNum Optionally only copy a single channel from the array.
	*/
	toMono(chanNum) {
		if (isNumber(chanNum)) this.fromArray(this.toArray(chanNum));
		else {
			let outputArray = new Float32Array(this.length);
			const numChannels = this.numberOfChannels;
			for (let channel = 0; channel < numChannels; channel++) {
				const channelArray = this.toArray(channel);
				for (let i = 0; i < channelArray.length; i++) outputArray[i] += channelArray[i];
			}
			outputArray = outputArray.map((sample) => sample / numChannels);
			this.fromArray(outputArray);
		}
		return this;
	}
	/**
	* Get the buffer as an array. Single channel buffers will return a 1-dimensional
	* Float32Array, and multichannel buffers will return multidimensional arrays.
	* @param channel Optionally only copy a single channel from the array.
	*/
	toArray(channel) {
		if (isNumber(channel)) return this.getChannelData(channel);
		else if (this.numberOfChannels === 1) return this.toArray(0);
		else {
			const ret = [];
			for (let c = 0; c < this.numberOfChannels; c++) ret[c] = this.getChannelData(c);
			return ret;
		}
	}
	/**
	* Returns the Float32Array representing the PCM audio data for the specific channel.
	* @param  channel  The channel number to return
	* @return The audio as a TypedArray
	*/
	getChannelData(channel) {
		if (this._buffer) return this._buffer.getChannelData(channel);
		else return /* @__PURE__ */ new Float32Array(0);
	}
	/**
	* Cut a subsection of the array and return a buffer of the
	* subsection. Does not modify the original buffer
	* @param start The time to start the slice
	* @param end The end time to slice. If none is given will default to the end of the buffer
	*/
	slice(start, end = this.duration) {
		assert(this.loaded, "Buffer is not loaded");
		const startSamples = Math.floor(start * this.sampleRate);
		const endSamples = Math.floor(end * this.sampleRate);
		assert(startSamples < endSamples, "The start time must be less than the end time");
		const length = endSamples - startSamples;
		const retBuffer = getContext().createBuffer(this.numberOfChannels, length, this.sampleRate);
		for (let channel = 0; channel < this.numberOfChannels; channel++) retBuffer.copyToChannel(this.getChannelData(channel).subarray(startSamples, endSamples), channel);
		return new ToneAudioBuffer(retBuffer);
	}
	/**
	* Reverse the buffer.
	*/
	_reverse() {
		if (this.loaded) for (let i = 0; i < this.numberOfChannels; i++) this.getChannelData(i).reverse();
		return this;
	}
	/**
	* If the buffer is loaded or not
	*/
	get loaded() {
		return this.length > 0;
	}
	/**
	* The duration of the buffer in seconds.
	*/
	get duration() {
		if (this._buffer) return this._buffer.duration;
		else return 0;
	}
	/**
	* The length of the buffer in samples
	*/
	get length() {
		if (this._buffer) return this._buffer.length;
		else return 0;
	}
	/**
	* The number of discrete audio channels. Returns 0 if no buffer is loaded.
	*/
	get numberOfChannels() {
		if (this._buffer) return this._buffer.numberOfChannels;
		else return 0;
	}
	/**
	* Reverse the buffer.
	*/
	get reverse() {
		return this._reversed;
	}
	set reverse(rev) {
		if (this._reversed !== rev) {
			this._reversed = rev;
			this._reverse();
		}
	}
	/**
	* Create a ToneAudioBuffer from the array. To create a multichannel AudioBuffer,
	* pass in a multidimensional array.
	* @param array The array to fill the audio buffer
	* @return A ToneAudioBuffer created from the array
	*/
	static fromArray(array) {
		return new ToneAudioBuffer().fromArray(array);
	}
	/**
	* Creates a ToneAudioBuffer from a URL, returns a promise which resolves to a ToneAudioBuffer
	* @param  url The url to load.
	* @return A promise which resolves to a ToneAudioBuffer
	*/
	static fromUrl(url) {
		return __awaiter(this, void 0, void 0, function* () {
			return yield new ToneAudioBuffer().load(url);
		});
	}
	/**
	* Loads a url using fetch and returns the AudioBuffer.
	*/
	static load(url) {
		return __awaiter(this, void 0, void 0, function* () {
			const baseUrl = ToneAudioBuffer.baseUrl === "" || ToneAudioBuffer.baseUrl.endsWith("/") ? ToneAudioBuffer.baseUrl : ToneAudioBuffer.baseUrl + "/";
			const response = yield fetch(baseUrl + url);
			if (!response.ok) throw new Error(`could not load url: ${url}`);
			const arrayBuffer = yield response.arrayBuffer();
			return yield getContext().decodeAudioData(arrayBuffer);
		});
	}
	/**
	* Checks a url's extension to see if the current browser can play that file type.
	* @param url The url/extension to test
	* @return If the file extension can be played
	* @static
	* @example
	* Tone.ToneAudioBuffer.supportsType("wav"); // returns true
	* Tone.ToneAudioBuffer.supportsType("path/to/file.wav"); // returns true
	*/
	static supportsType(url) {
		const extensions = url.split(".");
		const extension = extensions[extensions.length - 1];
		return document.createElement("audio").canPlayType("audio/" + extension) !== "";
	}
	/**
	* Returns a Promise which resolves when all of the buffers have loaded
	*/
	static loaded() {
		return __awaiter(this, void 0, void 0, function* () {
			yield Promise.resolve();
			while (ToneAudioBuffer.downloads.length) yield ToneAudioBuffer.downloads[0];
		});
	}
};
/**
* A path which is prefixed before every url.
*/
ToneAudioBuffer.baseUrl = "";
/**
* All of the downloads
*/
ToneAudioBuffer.downloads = [];
//#endregion
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/context/OfflineContext.js
/**
* Wrapper around the OfflineAudioContext
* @category Core
* @example
* // generate a single channel, 0.5 second buffer
* const context = new Tone.OfflineContext(1, 0.5, 44100);
* const osc = new Tone.Oscillator({ context });
* context.render().then(buffer => {
* 	console.log(buffer.numberOfChannels, buffer.duration);
* });
*/
var OfflineContext = class extends Context {
	constructor() {
		super({
			clockSource: "offline",
			context: isOfflineAudioContext(arguments[0]) ? arguments[0] : createOfflineAudioContext(arguments[0], arguments[1] * arguments[2], arguments[2]),
			lookAhead: 0,
			updateInterval: isOfflineAudioContext(arguments[0]) ? 128 / arguments[0].sampleRate : 128 / arguments[2]
		});
		this.name = "OfflineContext";
		/**
		* An artificial clock source
		*/
		this._currentTime = 0;
		this.isOffline = true;
		this._duration = isOfflineAudioContext(arguments[0]) ? arguments[0].length / arguments[0].sampleRate : arguments[1];
	}
	/**
	* Override the now method to point to the internal clock time
	*/
	now() {
		return this._currentTime;
	}
	/**
	* Same as this.now()
	*/
	get currentTime() {
		return this._currentTime;
	}
	/**
	* Render just the clock portion of the audio context.
	*/
	_renderClock(asynchronous) {
		return __awaiter(this, void 0, void 0, function* () {
			let index = 0;
			while (this._duration - this._currentTime >= 0) {
				this.emit("tick");
				this._currentTime += 128 / this.sampleRate;
				index++;
				const yieldEvery = Math.floor(this.sampleRate / 128);
				if (asynchronous && index % yieldEvery === 0) yield new Promise((done) => setTimeout(done, 1));
			}
		});
	}
	/**
	* Render the output of the OfflineContext
	* @param asynchronous If the clock should be rendered asynchronously, which will not block the main thread, but be slightly slower.
	*/
	render() {
		return __awaiter(this, arguments, void 0, function* (asynchronous = true) {
			yield this.workletsAreReady();
			yield this._renderClock(asynchronous);
			return new ToneAudioBuffer(yield this._context.startRendering());
		});
	}
	/**
	* Close the context
	*/
	close() {
		return Promise.resolve();
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/tone@15.1.22/node_modules/tone/build/esm/core/Global.js
/**
* This dummy context is used to avoid throwing immediate errors when importing in Node.js
*/
var dummyContext = new DummyContext();
/**
* The global audio context which is getable and assignable through
* getContext and setContext
*/
var globalContext = dummyContext;
/**
* Returns the default system-wide {@link Context}
* @category Core
*/
function getContext() {
	if (globalContext === dummyContext && hasAudioContext) setContext(new Context());
	return globalContext;
}
/**
* Set the default audio context
* @param context
* @param disposeOld Pass `true` if you don't need the old context to dispose it.
* @category Core
*/
function setContext(context, disposeOld = false) {
	if (disposeOld) globalContext.dispose();
	if (isAudioContext(context)) globalContext = new Context(context);
	else if (isOfflineAudioContext(context)) globalContext = new OfflineContext(context);
	else globalContext = context;
}
/**
* Most browsers will not play _any_ audio until a user
* clicks something (like a play button). Invoke this method
* on a click or keypress event handler to start the audio context.
* More about the Autoplay policy
* [here](https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio)
* @example
* document.querySelector("button").addEventListener("click", async () => {
* 	await Tone.start();
* 	console.log("context started");
* });
* @category Core
*/
function start() {
	return globalContext.resume();
}
/**
* Log Tone.js + version in the console.
*/
if (theWindow && !theWindow.TONE_SILENCE_LOGGING) {
	const printString = ` * Tone.js v${version} * `;
	console.log(`%c${printString}`, "background: #000; color: #fff");
}
//#endregion
export { optionsFromArguments as C, omitFromObject as S, isAudioParam as T, clamp as _, ToneAudioBuffer as a, defaultArg as b, writable as c, onContextInit as d, Timeline as f, LT as g, GTE as h, OfflineContext as i, Context as l, GT as m, setContext as n, noOp as o, EQ as p, start as r, readOnly as s, getContext as t, onContextClose as u, deepEquals as v, isAudioNode as w, getDefaultsFromInstance as x, deepMerge as y };
