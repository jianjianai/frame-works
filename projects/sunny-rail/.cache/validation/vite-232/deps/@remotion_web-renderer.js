import { i as __toESM } from "./rolldown-runtime-B-lAHAz2.js";
import { t as require_react } from "./react.js";
import { t as require_react_dom } from "./react-dom.js";
import { t as require_jsx_runtime } from "./react_jsx-runtime.js";
import { Internals } from "./remotion.js";
import { $ as EBMLUnicodeString, $t as CallSerializer, A as VideoSample, An as toDataView, At as iterateNalUnitsInAnnexB, B as readAdtsFrameHeader, Bt as buildAacAudioSpecificConfig, C as canEncodeVideo, Cn as roundToDivisor, Ct as FlacBlockType, D as validateAudioEncodingConfig, Dn as simplifyRational, Dt as determineVideoPacketType, E as resolveQuality, En as setUint24, Et as createVorbisComments, Ft as parseOpusIdentificationHeader, G as computeOggPageCrc, Gt as AttachedFile, H as MAX_PAGE_SIZE, Ht as parseAacAudioSpecificConfig, It as serializeAvcDecoderConfigurationRecord, J as CODEC_STRING_MAP, Jt as validateMetadataTags, K as extractSampleMetadata, Kt as RichImageData, L as getBlockSizeOrUncommon, Lt as serializeHevcDecoderConfigurationRecord, M as toInterleavedAudioFormat, Mn as uint8ArraysAreEqual, Mt as parseDtsFrame, Nn as wait, Nt as parseEac3SyncFrame, O as validateVideoEncodingConfig, On as textEncoder, Ot as extractAvcDecoderConfigurationRecord, Pn as writeBits, Pt as parseModesFromVorbisSetupPacket, Q as EBMLSignedInt, Qt as COLOR_PRIMARIES_MAP, R as readBlockSize, Rt as aacChannelMap, S as canEncodeAudio, Sn as promiseWithResolvers, St as validateVideoChunkMetadata, T as getEncodableVideoCodecs$1, Tn as setInt64, Tt as concatNalUnitsInLengthPrefixed, U as OGGS, Ut as writeAdtsFrameLength, V as WaveFormat, Vt as buildAdtsHeaderTemplate, W as buildOggMimeType, Wt as Bitstream, X as EBMLFloat64, Xt as Logging, Y as EBMLFloat32, Yt as validateTrackDisposition, Z as EBMLId, Zt as AsyncMutex, _n as isWebKit, _t as generateAv1CodecConfigurationFromCodecString, an as binarySearchLessOrEqual, at as SAMPLING_RATES, b as buildQuantizerEncodeOptions, bn as missingWebCodecsClassMessage, bt as validateAudioChunkMetadata, cn as computeRationalApproximation, ct as computeMp3FrameSize, dn as isI32, dt as AUDIO_CODECS, en as EventEmitter, et as EBMLWriter, f as toAlaw, fn as isIso639Dash2LanguageCode, ft as NON_PCM_AUDIO_CODECS, g as customVideoEncoders, gn as isU32, gt as VIDEO_CODECS, h as customAudioEncoders, hn as isThenable, ht as SUBTITLE_CODECS, i as readBytes, in as assertNever, it as KILOBIT_RATES, j as audioSampleToInterleavedFormat, jn as toUint8Array, jt as parseAc3SyncFrame, k as AudioSample, kn as toArray, kt as extractHevcDecoderConfigurationRecord, ln as floorToDivisor, lt as getXingOffset, mn as isNumber, mt as PCM_AUDIO_CODECS, n as Id3V2Writer, nn as TRANSFER_CHARACTERISTICS_MAP, nt as EncodedPacket, on as clamp, ot as XING, p as toUlaw, pn as isIso88591Compatible, pt as OPUS_SAMPLE_RATE, q as buildMatroskaMimeType, qt as metadataTagsAreEmpty, r as FileSlice, rn as assert, sn as colorSpaceIsEmpty, st as XingFlags, t as NoReactInternals, tn as MATRIX_COEFFICIENTS_MAP, tt as buildIsobmffMimeType, un as imageMimeTypeToExtension, ut as readMp3FrameHeader, v as Quality, vn as keyValueIterator, vt as generateVp9CodecConfigurationFromCodecString, w as getEncodableAudioCodecs$1, wn as setInt24, wt as buildDtsSpecificBox, x as buildVideoEncoderConfigs, xn as normalizeRotation, xt as validateSubtitleMetadata, y as buildAudioEncoderConfig, yn as last, yt as parsePcmCodec, z as readCodedNumber, zt as aacFrequencyTable } from "./no-react-DlJ0D5KV.js";
import { t as require_client } from "./client-CPjaHjLo.js";
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/muxer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var Muxer = class {
	constructor(output) {
		this.mutex = new AsyncMutex();
		this.trackTimestampInfo = /* @__PURE__ */ new WeakMap();
		this.output = output;
	}
	onTrackClose(track) {}
	validateTimestamp(track, timestampInSeconds, isKeyPacket) {
		let timestampInfo = this.trackTimestampInfo.get(track);
		if (!timestampInfo) {
			if (!isKeyPacket) throw new Error("First packet must be a key packet.");
			timestampInfo = {
				maxTimestamp: timestampInSeconds,
				maxTimestampBeforeLastKeyPacket: null
			};
			this.trackTimestampInfo.set(track, timestampInfo);
		} else {
			if (isKeyPacket) timestampInfo.maxTimestampBeforeLastKeyPacket = timestampInfo.maxTimestamp;
			if (timestampInfo.maxTimestampBeforeLastKeyPacket !== null && timestampInSeconds < timestampInfo.maxTimestampBeforeLastKeyPacket) throw new Error(`Timestamps cannot be smaller than the largest timestamp of the previous GOP (a GOP begins with a key packet and ends right before the next key packet). Got ${timestampInSeconds}s, but largest timestamp is ${timestampInfo.maxTimestampBeforeLastKeyPacket}s.`);
			timestampInfo.maxTimestamp = Math.max(timestampInfo.maxTimestamp, timestampInSeconds);
		}
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/adts/adts-muxer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var AdtsMuxer = class extends Muxer {
	constructor(output, format) {
		super(output);
		this.header = null;
		this.headerBitstream = null;
		this.inputIsAdts = null;
		this.format = format;
	}
	async start() {
		const release = await this.mutex.acquire();
		this.writer = await this.output._getRootWriter(true);
		if (!metadataTagsAreEmpty(this.output._metadataTags)) new Id3V2Writer(this.writer).writeId3V2Tag(this.output._metadataTags);
		release();
	}
	async getMimeType() {
		return "audio/aac";
	}
	async addEncodedVideoPacket() {
		throw new Error("ADTS does not support video.");
	}
	async addEncodedAudioPacket(track, packet, meta) {
		const release = await this.mutex.acquire();
		try {
			this.validateTimestamp(track, packet.timestamp, packet.type === "key");
			if (this.inputIsAdts === null) {
				validateAudioChunkMetadata(meta, track.source._codec);
				const description = meta?.decoderConfig?.description;
				this.inputIsAdts = !description;
				if (!this.inputIsAdts) {
					const config = parseAacAudioSpecificConfig(toUint8Array(description));
					const template = buildAdtsHeaderTemplate(config);
					this.header = template.header;
					this.headerBitstream = template.bitstream;
				}
			}
			if (this.inputIsAdts) {
				const startPos = this.writer.getPos();
				this.writer.write(packet.data);
				if (this.format._options.onFrame) this.format._options.onFrame(packet.data, startPos);
			} else {
				assert(this.header);
				const frameLength = packet.data.byteLength + this.header.byteLength;
				writeAdtsFrameLength(this.headerBitstream, frameLength);
				const startPos = this.writer.getPos();
				this.writer.write(this.header);
				this.writer.write(packet.data);
				if (this.format._options.onFrame) {
					const frameBytes = new Uint8Array(frameLength);
					frameBytes.set(this.header, 0);
					frameBytes.set(packet.data, this.header.byteLength);
					this.format._options.onFrame(frameBytes, startPos);
				}
			}
			await this.writer.flush();
		} finally {
			release();
		}
	}
	async addSubtitleCue() {
		throw new Error("ADTS does not support subtitles.");
	}
	async finalize() {
		const release = await this.mutex.acquire();
		if (this.inputIsAdts === null) throw new Error("Cannot finalize an empty ADTS file: not a single packet was added.");
		release();
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/flac/flac-muxer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var FLAC_HEADER = /* #__PURE__ */ new Uint8Array([
	102,
	76,
	97,
	67
]);
var STREAMINFO_SIZE = 38;
var STREAMINFO_BLOCK_SIZE = 34;
var FlacMuxer = class extends Muxer {
	constructor(output, format) {
		super(output);
		this.metadataWritten = false;
		this.blockSizes = [];
		this.frameSizes = [];
		this.sampleRate = null;
		this.channels = null;
		this.bitsPerSample = null;
		this.format = format;
	}
	async start() {
		const release = await this.mutex.acquire();
		this.writer = await this.output._getRootWriter(!!this.format._options.appendOnly);
		this.writer.write(FLAC_HEADER);
		const track = this.output.tracks[0];
		assert(track?.isAudioTrack());
		if (track.metadata.decoderConfig) {
			validateAudioChunkMetadata({ decoderConfig: track.metadata.decoderConfig }, track.source._codec);
			this.applyDecoderConfig(track.metadata.decoderConfig);
		}
		release();
	}
	applyDecoderConfig(decoderConfig) {
		assert(decoderConfig.description);
		this.sampleRate = decoderConfig.sampleRate;
		this.channels = decoderConfig.numberOfChannels;
		const descriptionBitstream = new Bitstream(toUint8Array(decoderConfig.description));
		descriptionBitstream.skipBits(167);
		this.bitsPerSample = descriptionBitstream.readBits(5) + 1;
		if (this.format._options.appendOnly) this.writeHeader({
			minimumBlockSize: 16,
			maximumBlockSize: 65535,
			minimumFrameSize: 0,
			maximumFrameSize: 0,
			sampleRate: this.sampleRate,
			channels: this.channels,
			bitsPerSample: this.bitsPerSample,
			totalSamples: 0
		});
	}
	writeHeader({ bitsPerSample, minimumBlockSize, maximumBlockSize, minimumFrameSize, maximumFrameSize, sampleRate, channels, totalSamples }) {
		assert(this.writer.getPos() === 4);
		const hasMetadata = !metadataTagsAreEmpty(this.output._metadataTags);
		const headerBitstream = new Bitstream(/* @__PURE__ */ new Uint8Array(4));
		headerBitstream.writeBits(1, Number(!hasMetadata));
		headerBitstream.writeBits(7, FlacBlockType.STREAMINFO);
		headerBitstream.writeBits(24, STREAMINFO_BLOCK_SIZE);
		this.writer.write(headerBitstream.bytes);
		const contentBitstream = new Bitstream(/* @__PURE__ */ new Uint8Array(18));
		contentBitstream.writeBits(16, minimumBlockSize);
		contentBitstream.writeBits(16, maximumBlockSize);
		contentBitstream.writeBits(24, minimumFrameSize);
		contentBitstream.writeBits(24, maximumFrameSize);
		contentBitstream.writeBits(20, sampleRate);
		contentBitstream.writeBits(3, channels - 1);
		contentBitstream.writeBits(5, bitsPerSample - 1);
		if (totalSamples >= 2 ** 32) throw new Error("This muxer only supports writing up to 2 ** 32 samples");
		contentBitstream.writeBits(4, 0);
		contentBitstream.writeBits(32, totalSamples);
		this.writer.write(contentBitstream.bytes);
		this.writer.write(/* @__PURE__ */ new Uint8Array(16));
	}
	writePictureBlock(picture) {
		const headerSize = 32 + picture.mimeType.length + (picture.description?.length ?? 0) + picture.data.length;
		const header = new Uint8Array(headerSize);
		let offset = 0;
		const dataView = toDataView(header);
		dataView.setUint32(offset, picture.kind === "coverFront" ? 3 : picture.kind === "coverBack" ? 4 : 0);
		offset += 4;
		dataView.setUint32(offset, picture.mimeType.length);
		offset += 4;
		header.set(textEncoder.encode(picture.mimeType), 8);
		offset += picture.mimeType.length;
		dataView.setUint32(offset, picture.description?.length ?? 0);
		offset += 4;
		header.set(textEncoder.encode(picture.description ?? ""), offset);
		offset += picture.description?.length ?? 0;
		offset += 16;
		dataView.setUint32(offset, picture.data.length);
		offset += 4;
		header.set(picture.data, offset);
		offset += picture.data.length;
		assert(offset === headerSize);
		const headerBitstream = new Bitstream(/* @__PURE__ */ new Uint8Array(4));
		headerBitstream.writeBits(1, 0);
		headerBitstream.writeBits(7, FlacBlockType.PICTURE);
		headerBitstream.writeBits(24, headerSize);
		this.writer.write(headerBitstream.bytes);
		this.writer.write(header);
	}
	writeVorbisCommentAndPictureBlock() {
		if (!this.format._options.appendOnly) this.writer.seek(STREAMINFO_SIZE + FLAC_HEADER.byteLength);
		if (metadataTagsAreEmpty(this.output._metadataTags)) {
			this.metadataWritten = true;
			return;
		}
		const pictures = this.output._metadataTags.images ?? [];
		for (const picture of pictures) this.writePictureBlock(picture);
		const vorbisComment = createVorbisComments(/* @__PURE__ */ new Uint8Array(0), this.output._metadataTags, false);
		const headerBitstream = new Bitstream(/* @__PURE__ */ new Uint8Array(4));
		headerBitstream.writeBits(1, 1);
		headerBitstream.writeBits(7, FlacBlockType.VORBIS_COMMENT);
		headerBitstream.writeBits(24, vorbisComment.length);
		this.writer.write(headerBitstream.bytes);
		this.writer.write(vorbisComment);
		this.metadataWritten = true;
	}
	async getMimeType() {
		return "audio/flac";
	}
	async addEncodedVideoPacket() {
		throw new Error("FLAC does not support video.");
	}
	async addEncodedAudioPacket(track, packet, meta) {
		const release = await this.mutex.acquire();
		try {
			this.validateTimestamp(track, packet.timestamp, packet.type === "key");
			if (this.sampleRate === null) {
				validateAudioChunkMetadata(meta, track.source._codec);
				assert(meta);
				assert(meta.decoderConfig);
				this.applyDecoderConfig(meta.decoderConfig);
			}
			if (!this.metadataWritten) this.writeVorbisCommentAndPictureBlock();
			const slice = FileSlice.tempFromBytes(packet.data);
			slice.skip(2);
			const bytes = readBytes(slice, 2);
			const bitstream = new Bitstream(bytes);
			const blockSizeOrUncommon = getBlockSizeOrUncommon(bitstream.readBits(4));
			if (blockSizeOrUncommon === null) throw new Error("Invalid FLAC frame: Invalid block size.");
			readCodedNumber(slice);
			const blockSize = readBlockSize(slice, blockSizeOrUncommon);
			if (!this.format._options.appendOnly) {
				this.blockSizes.push(blockSize);
				this.frameSizes.push(packet.data.length);
			}
			const startPos = this.writer.getPos();
			this.writer.write(packet.data);
			if (this.format._options.onFrame) this.format._options.onFrame(packet.data, startPos);
			await this.writer.flush();
		} finally {
			release();
		}
	}
	addSubtitleCue() {
		throw new Error("FLAC does not support subtitles.");
	}
	async finalize() {
		const release = await this.mutex.acquire();
		if (this.sampleRate === null) throw new Error("Cannot finalize an empty FLAC file: no packets were added and the track specified no decoderConfig in its metadata, so there's no telling what the file should look like.");
		if (!this.metadataWritten) this.writeVorbisCommentAndPictureBlock();
		if (!this.format._options.appendOnly) {
			let minimumBlockSize = Infinity;
			let maximumBlockSize = 0;
			let minimumFrameSize = Infinity;
			let maximumFrameSize = 0;
			let totalSamples = 0;
			for (let i = 0; i < this.blockSizes.length; i++) {
				minimumFrameSize = Math.min(minimumFrameSize, this.frameSizes[i]);
				maximumFrameSize = Math.max(maximumFrameSize, this.frameSizes[i]);
				maximumBlockSize = Math.max(maximumBlockSize, this.blockSizes[i]);
				totalSamples += this.blockSizes[i];
				if (i === this.blockSizes.length - 1) continue;
				minimumBlockSize = Math.min(minimumBlockSize, this.blockSizes[i]);
			}
			if (this.blockSizes.length === 0) {
				minimumBlockSize = 16;
				maximumBlockSize = 65535;
				minimumFrameSize = 0;
				maximumFrameSize = 0;
			}
			assert(this.channels !== null);
			assert(this.bitsPerSample !== null);
			this.writer.seek(4);
			this.writeHeader({
				minimumBlockSize,
				maximumBlockSize,
				minimumFrameSize,
				maximumFrameSize,
				sampleRate: this.sampleRate,
				channels: this.channels,
				bitsPerSample: this.bitsPerSample,
				totalSamples
			});
		}
		release();
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/subtitles.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var inlineTimestampRegex = /<(?:(\d{2}):)?(\d{2}):(\d{2}).(\d{3})>/g;
var timestampRegex = /(?:(\d{2}):)?(\d{2}):(\d{2}).(\d{3})/;
var parseSubtitleTimestamp = (string) => {
	const match = timestampRegex.exec(string);
	if (!match) throw new Error("Expected match.");
	return 36e5 * Number(match[1] || "0") + 6e4 * Number(match[2]) + 1e3 * Number(match[3]) + Number(match[4]);
};
var formatSubtitleTimestamp = (timestamp) => {
	const hours = Math.floor(timestamp / 36e5);
	const minutes = Math.floor(timestamp % 36e5 / 6e4);
	const seconds = Math.floor(timestamp % 6e4 / 1e3);
	const milliseconds = timestamp % 1e3;
	return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0") + "." + milliseconds.toString().padStart(3, "0");
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/isobmff/isobmff-boxes.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var IsobmffBoxWriter = class {
	constructor(writer) {
		this.writer = writer;
		this.helper = /* @__PURE__ */ new Uint8Array(8);
		this.helperView = new DataView(this.helper.buffer);
		/**
		* Stores the position from the start of the file to where boxes elements have been written. This is used to
		* rewrite/edit elements that were already added before, and to measure sizes of things.
		*/
		this.offsets = /* @__PURE__ */ new WeakMap();
	}
	writeU32(value) {
		this.helperView.setUint32(0, value, false);
		this.writer.write(this.helper.subarray(0, 4));
	}
	writeU64(value) {
		this.helperView.setUint32(0, Math.floor(value / 2 ** 32), false);
		this.helperView.setUint32(4, value, false);
		this.writer.write(this.helper.subarray(0, 8));
	}
	writeAscii(text) {
		for (let i = 0; i < text.length; i++) {
			this.helperView.setUint8(i % 8, text.charCodeAt(i));
			if (i % 8 === 7) this.writer.write(this.helper);
		}
		if (text.length % 8 !== 0) this.writer.write(this.helper.subarray(0, text.length % 8));
	}
	writeBox(box) {
		this.offsets.set(box, this.writer.getPos());
		if (box.contents && !box.children) {
			this.writeBoxHeader(box, box.size ?? box.contents.byteLength + 8);
			this.writer.write(box.contents);
		} else {
			const startPos = this.writer.getPos();
			this.writeBoxHeader(box, 0);
			if (box.contents) this.writer.write(box.contents);
			if (box.children) {
				for (const child of box.children) if (child) this.writeBox(child);
			}
			const endPos = this.writer.getPos();
			const size = box.size ?? endPos - startPos;
			this.writer.seek(startPos);
			this.writeBoxHeader(box, size);
			this.writer.seek(endPos);
		}
	}
	writeBoxHeader(box, size) {
		this.writeU32(box.largeSize ? 1 : size);
		this.writeAscii(box.type);
		if (box.largeSize) this.writeU64(size);
	}
	measureBoxHeader(box) {
		return 8 + (box.largeSize ? 8 : 0);
	}
	patchBox(box) {
		const boxOffset = this.offsets.get(box);
		assert(boxOffset !== void 0);
		const endPos = this.writer.getPos();
		this.writer.seek(boxOffset);
		this.writeBox(box);
		this.writer.seek(endPos);
	}
	measureBox(box) {
		if (box.contents && !box.children) return this.measureBoxHeader(box) + box.contents.byteLength;
		else {
			let result = this.measureBoxHeader(box);
			if (box.contents) result += box.contents.byteLength;
			if (box.children) {
				for (const child of box.children) if (child) result += this.measureBox(child);
			}
			return result;
		}
	}
};
var bytes = /* #__PURE__ */ new Uint8Array(8);
var view = /* #__PURE__ */ new DataView(bytes.buffer);
var u8 = (value) => {
	return [(value % 256 + 256) % 256];
};
var u16 = (value) => {
	view.setUint16(0, value, false);
	return [bytes[0], bytes[1]];
};
var i16 = (value) => {
	view.setInt16(0, value, false);
	return [bytes[0], bytes[1]];
};
var u24 = (value) => {
	view.setUint32(0, value, false);
	return [
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
var u32 = (value) => {
	view.setUint32(0, value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
var i32 = (value) => {
	view.setInt32(0, value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
var u64 = (value) => {
	view.setUint32(0, Math.floor(value / 2 ** 32), false);
	view.setUint32(4, value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3],
		bytes[4],
		bytes[5],
		bytes[6],
		bytes[7]
	];
};
var i64 = (value) => {
	view.setInt32(0, Math.floor(value / 2 ** 32), false);
	view.setUint32(4, value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3],
		bytes[4],
		bytes[5],
		bytes[6],
		bytes[7]
	];
};
var fixed_8_8 = (value) => {
	view.setInt16(0, 256 * value, false);
	return [bytes[0], bytes[1]];
};
var fixed_16_16 = (value) => {
	view.setInt32(0, 2 ** 16 * value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
var fixed_2_30 = (value) => {
	view.setInt32(0, 2 ** 30 * value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
var variableUnsignedInt = (value, byteLength) => {
	const bytes = [];
	let remaining = value;
	do {
		let byte = remaining & 127;
		remaining >>= 7;
		if (bytes.length > 0) byte |= 128;
		bytes.push(byte);
		if (byteLength !== void 0) byteLength--;
	} while (remaining > 0 || byteLength);
	return bytes.reverse();
};
var ascii = (text, nullTerminated = false) => {
	const bytes = Array(text.length).fill(null).map((_, i) => text.charCodeAt(i));
	if (nullTerminated) bytes.push(0);
	return bytes;
};
var rotationMatrix = (rotationInDegrees) => {
	const theta = rotationInDegrees * (Math.PI / 180);
	const cosTheta = Math.round(Math.cos(theta));
	const sinTheta = Math.round(Math.sin(theta));
	return [
		cosTheta,
		sinTheta,
		0,
		-sinTheta,
		cosTheta,
		0,
		0,
		0,
		1
	];
};
var IDENTITY_MATRIX = /* #__PURE__ */ rotationMatrix(0);
var matrixToBytes = (matrix) => {
	return [
		fixed_16_16(matrix[0]),
		fixed_16_16(matrix[1]),
		fixed_2_30(matrix[2]),
		fixed_16_16(matrix[3]),
		fixed_16_16(matrix[4]),
		fixed_2_30(matrix[5]),
		fixed_16_16(matrix[6]),
		fixed_16_16(matrix[7]),
		fixed_2_30(matrix[8])
	];
};
var box = (type, contents, children) => ({
	type,
	contents: contents && new Uint8Array(contents.flat(10)),
	children
});
/** A FullBox always starts with a version byte, followed by three flag bytes. */
var fullBox = (type, version, flags, contents, children) => box(type, [
	u8(version),
	u24(flags),
	contents ?? []
], children);
/**
* File Type Compatibility Box: Allows the reader to determine whether this is a type of file that the
* reader understands.
*/
var ftyp = (details) => {
	const minorVersion = 512;
	if (details.isQuickTime) return box("ftyp", [
		ascii("qt  "),
		u32(minorVersion),
		ascii("qt  ")
	]);
	if (details.fragmented) {
		if (details.cmaf) return box("ftyp", [
			ascii("iso5"),
			u32(minorVersion),
			ascii("iso5"),
			ascii("iso6"),
			ascii("mp41"),
			ascii("cmfc"),
			ascii("dash")
		]);
		else return box("ftyp", [
			ascii("iso5"),
			u32(minorVersion),
			ascii("iso5"),
			ascii("iso6"),
			ascii("mp41")
		]);
	}
	return box("ftyp", [
		ascii("isom"),
		u32(minorVersion),
		ascii("isom"),
		details.holdsAvc ? ascii("avc1") : [],
		ascii("mp41")
	]);
};
/** Segment Type Box */
var styp = () => box("styp", [
	ascii("iso5"),
	u32(0),
	ascii("iso5"),
	ascii("iso6"),
	ascii("mp41"),
	ascii("cmfc"),
	ascii("dash")
]);
/** Segment Index Box */
var sidx = (muxer, referencedSize) => {
	const earliestPresentationTime = Math.max(0, muxer.minWrittenTimestamp);
	let duration = Math.max(0, muxer.maxWrittenEndTimestamp - earliestPresentationTime);
	if (!Number.isFinite(duration)) duration = 0;
	return fullBox("sidx", 1, 0, [
		u32(1),
		u32(GLOBAL_TIMESCALE),
		u64(intoTimescale(earliestPresentationTime, GLOBAL_TIMESCALE)),
		u64(0),
		u16(0),
		u16(1),
		u32(referencedSize & 2147483647),
		u32(intoTimescale(duration, GLOBAL_TIMESCALE)),
		u32(0)
	]);
};
/** Movie Sample Data Box. Contains the actual frames/samples of the media. */
var mdat = (reserveLargeSize) => ({
	type: "mdat",
	largeSize: reserveLargeSize
});
/** Free Space Box: A box that designates unused space in the movie data file. */
var free = (size) => ({
	type: "free",
	size
});
/**
* Movie Box: Used to specify the information that defines a movie - that is, the information that allows
* an application to interpret the sample data that is stored elsewhere.
*/
var moov = (muxer) => {
	return box("moov", void 0, [
		mvhd(muxer.creationTime, muxer.trackDatas),
		...muxer.trackDatas.map((x) => trak(x, muxer.creationTime)),
		muxer.isFragmented ? mvex(muxer.trackDatas) : null,
		udta(muxer)
	]);
};
/** Movie Header Box: Used to specify the characteristics of the entire movie, such as timescale and duration. */
var mvhd = (creationTime, trackDatas) => {
	const duration = Math.max(0, ...trackDatas.map((trackData) => Math.max(0, intoTimescale(presentationSpan(trackData), GLOBAL_TIMESCALE) + intoTimescale(trackData.startTimestampOffset ?? 0, GLOBAL_TIMESCALE))));
	const nextTrackId = Math.max(0, ...trackDatas.map((x) => x.track.id)) + 1;
	const needsU64 = !isU32(creationTime) || !isU32(duration);
	const u32OrU64 = needsU64 ? u64 : u32;
	return fullBox("mvhd", +needsU64, 0, [
		u32OrU64(creationTime),
		u32OrU64(creationTime),
		u32(GLOBAL_TIMESCALE),
		u32OrU64(duration),
		fixed_16_16(1),
		fixed_8_8(1),
		Array(10).fill(0),
		matrixToBytes(IDENTITY_MATRIX),
		Array(24).fill(0),
		u32(nextTrackId)
	]);
};
var presentationSpan = (trackData) => {
	if (trackData.samples.length === 0) return 0;
	let minTimestamp = Infinity;
	let maxEndTimestamp = -Infinity;
	for (let i = 0; i < trackData.samples.length; i++) {
		const sample = trackData.samples[i];
		if (sample.timestamp < minTimestamp) minTimestamp = sample.timestamp;
		if (sample.timestamp + sample.duration > maxEndTimestamp) maxEndTimestamp = sample.timestamp + sample.duration;
	}
	if (minTimestamp === Infinity) return 0;
	return maxEndTimestamp - minTimestamp;
};
/**
* Track Box: Defines a single track of a movie. A movie may consist of one or more tracks. Each track is
* independent of the other tracks in the movie and carries its own temporal and spatial information. Each Track Box
* contains its associated Media Box.
*/
var trak = (trackData, creationTime) => {
	const trackMetadata = getTrackMetadata(trackData);
	const needsEditList = trackData.startTimestampOffset !== null && trackData.startTimestampOffset !== 0;
	return box("trak", void 0, [
		tkhd(trackData, creationTime),
		needsEditList ? edts(trackData) : null,
		mdia(trackData, creationTime),
		trackMetadata.name !== void 0 ? box("udta", void 0, [box("name", [...textEncoder.encode(trackMetadata.name)])]) : null
	]);
};
/** Track Header Box: Specifies the characteristics of a single track within a movie. */
var tkhd = (trackData, creationTime) => {
	const durationInGlobalTimescale = Math.max(0, intoTimescale(presentationSpan(trackData), GLOBAL_TIMESCALE) + intoTimescale(trackData.startTimestampOffset ?? 0, GLOBAL_TIMESCALE));
	const needsU64 = !isU32(creationTime) || !isU32(durationInGlobalTimescale);
	const u32OrU64 = needsU64 ? u64 : u32;
	let matrix;
	if (trackData.type === "video") {
		const rotation = trackData.track.metadata.rotation;
		matrix = rotationMatrix(rotation ?? 0);
	} else matrix = IDENTITY_MATRIX;
	let flags = 2;
	if (trackData.track.metadata.disposition?.default !== false) flags |= 1;
	const alternateGroup = trackData.type === "video" ? 0 : trackData.type === "audio" ? 1 : trackData.type === "subtitle" ? 2 : assertNever(trackData);
	return fullBox("tkhd", +needsU64, flags, [
		u32OrU64(creationTime),
		u32OrU64(creationTime),
		u32(trackData.track.id),
		u32(0),
		u32OrU64(durationInGlobalTimescale),
		Array(8).fill(0),
		u16(0),
		u16(alternateGroup),
		fixed_8_8(trackData.type === "audio" ? 1 : 0),
		u16(0),
		matrixToBytes(matrix),
		fixed_16_16(trackData.type === "video" ? trackData.info.width : 0),
		fixed_16_16(trackData.type === "video" ? trackData.info.height : 0)
	]);
};
/** Edit Box: Specifies edits to the track's media. */
var edts = (trackData) => {
	const offset = trackData.startTimestampOffset;
	assert(offset !== null);
	if (offset > 0) {
		const startOffset = intoTimescale(offset, GLOBAL_TIMESCALE);
		const mediaDuration = intoTimescale(presentationSpan(trackData), GLOBAL_TIMESCALE);
		const needs64Bits = !isU32(startOffset) || !isU32(mediaDuration);
		const u32OrU64 = needs64Bits ? u64 : u32;
		const i32OrI64 = needs64Bits ? i64 : i32;
		return box("edts", void 0, [fullBox("elst", needs64Bits ? 1 : 0, 0, [
			u32(2),
			u32OrU64(startOffset),
			i32OrI64(-1),
			fixed_16_16(1),
			u32OrU64(mediaDuration),
			i32OrI64(0),
			fixed_16_16(1)
		])]);
	} else {
		const mediaTime = intoTimescale(-offset, trackData.timescale);
		const mediaDuration = Math.max(0, intoTimescale(presentationSpan(trackData), GLOBAL_TIMESCALE) + intoTimescale(offset, GLOBAL_TIMESCALE));
		const needs64Bits = !isI32(mediaTime) || !isU32(mediaDuration);
		const u32OrU64 = needs64Bits ? u64 : u32;
		const i32OrI64 = needs64Bits ? i64 : i32;
		return box("edts", void 0, [fullBox("elst", needs64Bits ? 1 : 0, 0, [
			u32(1),
			u32OrU64(mediaDuration),
			i32OrI64(mediaTime),
			fixed_16_16(1)
		])]);
	}
};
/** Media Box: Describes and define a track's media type and sample data. */
var mdia = (trackData, creationTime) => box("mdia", void 0, [
	mdhd(trackData, creationTime),
	hdlr(true, TRACK_TYPE_TO_COMPONENT_SUBTYPE[trackData.type], TRACK_TYPE_TO_HANDLER_NAME[trackData.type]),
	minf(trackData)
]);
/** Media Header Box: Specifies the characteristics of a media, including timescale and duration. */
var mdhd = (trackData, creationTime) => {
	const localDuration = intoTimescale(presentationSpan(trackData), trackData.timescale);
	const needsU64 = !isU32(creationTime) || !isU32(localDuration);
	const u32OrU64 = needsU64 ? u64 : u32;
	return fullBox("mdhd", +needsU64, 0, [
		u32OrU64(creationTime),
		u32OrU64(creationTime),
		u32(trackData.timescale),
		u32OrU64(localDuration),
		u16(getLanguageCodeInt(trackData.track.metadata.languageCode ?? "und")),
		u16(0)
	]);
};
var TRACK_TYPE_TO_COMPONENT_SUBTYPE = {
	video: "vide",
	audio: "soun",
	subtitle: "text"
};
var TRACK_TYPE_TO_HANDLER_NAME = {
	video: "MediabunnyVideoHandler",
	audio: "MediabunnySoundHandler",
	subtitle: "MediabunnyTextHandler"
};
/** Handler Reference Box. */
var hdlr = (hasComponentType, handlerType, name, manufacturer = "\0\0\0\0") => fullBox("hdlr", 0, 0, [
	hasComponentType ? ascii("mhlr") : u32(0),
	ascii(handlerType),
	ascii(manufacturer),
	u32(0),
	u32(0),
	ascii(name, true)
]);
/**
* Media Information Box: Stores handler-specific information for a track's media data. The media handler uses this
* information to map from media time to media data and to process the media data.
*/
var minf = (trackData) => box("minf", void 0, [
	TRACK_TYPE_TO_HEADER_BOX[trackData.type](),
	dinf(),
	stbl(trackData)
]);
/** Video Media Information Header Box: Defines specific color and graphics mode information. */
var vmhd = () => fullBox("vmhd", 0, 1, [
	u16(0),
	u16(0),
	u16(0),
	u16(0)
]);
/** Sound Media Information Header Box: Stores the sound media's control information, such as balance. */
var smhd = () => fullBox("smhd", 0, 0, [u16(0), u16(0)]);
/** Null Media Header Box. */
var nmhd = () => fullBox("nmhd", 0, 0);
var TRACK_TYPE_TO_HEADER_BOX = {
	video: vmhd,
	audio: smhd,
	subtitle: nmhd
};
/**
* Data Information Box: Contains information specifying the data handler component that provides access to the
* media data. The data handler component uses the Data Information Box to interpret the media's data.
*/
var dinf = () => box("dinf", void 0, [dref()]);
/**
* Data Reference Box: Contains tabular data that instructs the data handler component how to access the media's data.
*/
var dref = () => fullBox("dref", 0, 0, [u32(1)], [url()]);
var url = () => fullBox("url ", 0, 1);
/**
* Sample Table Box: Contains information for converting from media time to sample number to sample location. This box
* also indicates how to interpret the sample (for example, whether to decompress the video data and, if so, how).
*/
var stbl = (trackData) => {
	const needsCtts = trackData.compositionTimeOffsetTable.length > 1 || trackData.compositionTimeOffsetTable.some((x) => x.sampleCompositionTimeOffset !== 0);
	return box("stbl", void 0, [
		stsd(trackData),
		stts(trackData),
		needsCtts ? ctts(trackData) : null,
		needsCtts ? cslg(trackData) : null,
		stsc(trackData),
		stsz(trackData),
		stco(trackData),
		stss(trackData)
	]);
};
/**
* Sample Description Box: Stores information that allows you to decode samples in the media. The data stored in the
* sample description varies, depending on the media type.
*/
var stsd = (trackData) => {
	let sampleDescription;
	if (trackData.type === "video") sampleDescription = videoSampleDescription(videoCodecToBoxName(trackData.track.source._codec, trackData.info.decoderConfig.codec), trackData);
	else if (trackData.type === "audio") {
		const boxName = audioCodecToBoxName(trackData.track.source._codec, trackData.info.decoderConfig.codec, trackData.muxer.isQuickTime);
		assert(boxName);
		sampleDescription = soundSampleDescription(boxName, trackData);
	} else if (trackData.type === "subtitle") sampleDescription = subtitleSampleDescription(SUBTITLE_CODEC_TO_BOX_NAME[trackData.track.source._codec], trackData);
	assert(sampleDescription);
	return fullBox("stsd", 0, 0, [u32(1)], [sampleDescription]);
};
/** Video Sample Description Box: Contains information that defines how to interpret video media data. */
var videoSampleDescription = (compressionType, trackData) => box(compressionType, [
	Array(6).fill(0),
	u16(1),
	u16(0),
	u16(0),
	Array(12).fill(0),
	u16(trackData.info.width),
	u16(trackData.info.height),
	u32(4718592),
	u32(4718592),
	u32(0),
	u16(1),
	u8(10),
	ascii("Mediabunny"),
	Array(21).fill(0),
	u16(trackData.info.hasAlphaChannel ? 32 : 24),
	i16(65535)
], [
	VIDEO_CODEC_TO_CONFIGURATION_BOX[trackData.track.source._codec]?.(trackData) ?? null,
	pasp(trackData),
	colorSpaceIsEmpty(trackData.info.decoderConfig.colorSpace) ? null : colr(trackData)
]);
/** Pixel Aspect Ratio Box: Specifies pixel width:height spacing for non-square pixels. */
var pasp = (trackData) => {
	if (trackData.info.pixelAspectRatio.num === trackData.info.pixelAspectRatio.den) return null;
	return box("pasp", [u32(trackData.info.pixelAspectRatio.num), u32(trackData.info.pixelAspectRatio.den)]);
};
/** Colour Information Box: Specifies the color space of the video. */
var colr = (trackData) => {
	const colorSpace = trackData.info.decoderConfig.colorSpace;
	return box("colr", [
		ascii(trackData.muxer.isQuickTime ? "nclc" : "nclx"),
		u16(colorSpace?.primaries != null ? COLOR_PRIMARIES_MAP[colorSpace.primaries] : 2),
		u16(colorSpace?.transfer != null ? TRANSFER_CHARACTERISTICS_MAP[colorSpace.transfer] : 2),
		u16(colorSpace?.matrix != null ? MATRIX_COEFFICIENTS_MAP[colorSpace.matrix] : 2),
		trackData.muxer.isQuickTime ? [] : u8((colorSpace?.fullRange ? 1 : 0) << 7)
	]);
};
/** AVC Configuration Box: Provides additional information to the decoder. */
var avcC = (trackData) => trackData.info.decoderConfig && box("avcC", [...toUint8Array(trackData.info.decoderConfig.description)]);
/** HEVC Configuration Box: Provides additional information to the decoder. */
var hvcC = (trackData) => trackData.info.decoderConfig && box("hvcC", [...toUint8Array(trackData.info.decoderConfig.description)]);
/** VP Configuration Box: Provides additional information to the decoder. */
var vpcC = (trackData) => {
	if (!trackData.info.decoderConfig) return null;
	const decoderConfig = trackData.info.decoderConfig;
	const parts = decoderConfig.codec.split(".");
	const profile = Number(parts[1]);
	const level = Number(parts[2]);
	const bitDepth = Number(parts[3]);
	const chromaSubsampling = parts[4] ? Number(parts[4]) : 1;
	const videoFullRangeFlag = parts[8] ? Number(parts[8]) : Number(decoderConfig.colorSpace?.fullRange ?? 0);
	const thirdByte = (bitDepth << 4) + (chromaSubsampling << 1) + videoFullRangeFlag;
	const colourPrimaries = parts[5] ? Number(parts[5]) : decoderConfig.colorSpace?.primaries ? COLOR_PRIMARIES_MAP[decoderConfig.colorSpace.primaries] : 1;
	const transferCharacteristics = parts[6] ? Number(parts[6]) : decoderConfig.colorSpace?.transfer ? TRANSFER_CHARACTERISTICS_MAP[decoderConfig.colorSpace.transfer] : 1;
	const matrixCoefficients = parts[7] ? Number(parts[7]) : decoderConfig.colorSpace?.matrix ? MATRIX_COEFFICIENTS_MAP[decoderConfig.colorSpace.matrix] : 1;
	return fullBox("vpcC", 1, 0, [
		u8(profile),
		u8(level),
		u8(thirdByte),
		u8(colourPrimaries),
		u8(transferCharacteristics),
		u8(matrixCoefficients),
		u16(0)
	]);
};
/** AV1 Configuration Box: Provides additional information to the decoder. */
var av1C = (trackData) => {
	return box("av1C", generateAv1CodecConfigurationFromCodecString(trackData.info.decoderConfig.codec));
};
/** Sound Sample Description Box: Contains information that defines how to interpret sound media data. */
var soundSampleDescription = (compressionType, trackData) => {
	let version = 0;
	let contents;
	let sampleSizeInBits = 16;
	const isPcmCodec = PCM_AUDIO_CODECS.includes(trackData.track.source._codec);
	if (isPcmCodec) {
		const codec = trackData.track.source._codec;
		const { sampleSize } = parsePcmCodec(codec);
		sampleSizeInBits = 8 * sampleSize;
		if (sampleSizeInBits > 16) version = 1;
	}
	if (trackData.muxer.isQuickTime) version = 1;
	if (version === 0) contents = [
		Array(6).fill(0),
		u16(1),
		u16(version),
		u16(0),
		u32(0),
		u16(trackData.info.numberOfChannels),
		u16(sampleSizeInBits),
		u16(0),
		u16(0),
		u16(trackData.info.sampleRate < 2 ** 16 ? trackData.info.sampleRate : 0),
		u16(0)
	];
	else {
		const compressionId = isPcmCodec ? 0 : -2;
		contents = [
			Array(6).fill(0),
			u16(1),
			u16(version),
			u16(0),
			u32(0),
			u16(trackData.info.numberOfChannels),
			u16(Math.min(sampleSizeInBits, 16)),
			i16(compressionId),
			u16(0),
			u16(trackData.info.sampleRate < 2 ** 16 ? trackData.info.sampleRate : 0),
			u16(0),
			isPcmCodec ? [
				u32(1),
				u32(sampleSizeInBits / 8),
				u32(trackData.info.numberOfChannels * sampleSizeInBits / 8)
			] : [
				u32(0),
				u32(0),
				u32(0)
			],
			u32(2)
		];
	}
	return box(compressionType, contents, [audioCodecToConfigurationBox(trackData.track.source._codec, trackData.muxer.isQuickTime)?.(trackData) ?? null]);
};
/** MPEG-4 Elementary Stream Descriptor Box. */
var esds = (trackData) => {
	let objectTypeIndication;
	switch (trackData.track.source._codec) {
		case "aac":
			objectTypeIndication = 64;
			break;
		case "mp3":
			objectTypeIndication = 107;
			break;
		case "vorbis":
			objectTypeIndication = 221;
			break;
		default: throw new Error(`Unhandled audio codec: ${trackData.track.source._codec}`);
	}
	let bytes = [
		...u8(objectTypeIndication),
		...u8(21),
		...u24(0),
		...u32(0),
		...u32(0)
	];
	if (trackData.info.decoderConfig.description) {
		const description = toUint8Array(trackData.info.decoderConfig.description);
		bytes = [
			...bytes,
			...u8(5),
			...variableUnsignedInt(description.byteLength),
			...description
		];
	}
	bytes = [
		...u16(1),
		...u8(0),
		...u8(4),
		...variableUnsignedInt(bytes.length),
		...bytes,
		...u8(6),
		...u8(1),
		...u8(2)
	];
	bytes = [
		...u8(3),
		...variableUnsignedInt(bytes.length),
		...bytes
	];
	return fullBox("esds", 0, 0, bytes);
};
var wave = (trackData) => {
	return box("wave", void 0, [
		frma(trackData),
		enda(trackData),
		box("\0\0\0\0")
	]);
};
var frma = (trackData) => {
	return box("frma", [ascii(audioCodecToBoxName(trackData.track.source._codec, trackData.info.decoderConfig.codec, trackData.muxer.isQuickTime))]);
};
var enda = (trackData) => {
	const { littleEndian } = parsePcmCodec(trackData.track.source._codec);
	return box("enda", [u16(+littleEndian)]);
};
/** Opus Specific Box. */
var dOps = (trackData) => {
	let outputChannelCount = trackData.info.numberOfChannels;
	let preSkip = 3840;
	let inputSampleRate = trackData.info.sampleRate;
	let outputGain = 0;
	let channelMappingFamily = 0;
	let channelMappingTable = /* @__PURE__ */ new Uint8Array(0);
	const description = trackData.info.decoderConfig?.description;
	if (description) {
		assert(description.byteLength >= 18);
		const bytes = toUint8Array(description);
		const header = parseOpusIdentificationHeader(bytes);
		outputChannelCount = header.outputChannelCount;
		preSkip = header.preSkip;
		inputSampleRate = header.inputSampleRate;
		outputGain = header.outputGain;
		channelMappingFamily = header.channelMappingFamily;
		if (header.channelMappingTable) channelMappingTable = header.channelMappingTable;
	}
	return box("dOps", [
		u8(0),
		u8(outputChannelCount),
		u16(preSkip),
		u32(inputSampleRate),
		i16(outputGain),
		u8(channelMappingFamily),
		...channelMappingTable
	]);
};
/** FLAC specific box. */
var dfLa = (trackData) => {
	const description = trackData.info.decoderConfig?.description;
	assert(description);
	return fullBox("dfLa", 0, 0, [...toUint8Array(description).subarray(4)]);
};
/** PCM Configuration Box, ISO/IEC 23003-5. */
var pcmC = (trackData) => {
	const { littleEndian, sampleSize } = parsePcmCodec(trackData.track.source._codec);
	return fullBox("pcmC", 0, 0, [u8(+littleEndian), u8(8 * sampleSize)]);
};
/** AC3SpecificBox */
var dac3 = (trackData) => {
	assert(trackData.info.primingPacket);
	const frameInfo = parseAc3SyncFrame(trackData.info.primingPacket.data);
	if (!frameInfo) throw new Error("Couldn't extract AC-3 frame info from the audio packet. Ensure the packets contain valid AC-3 sync frames (as specified in ETSI TS 102 366).");
	const bytes = /* @__PURE__ */ new Uint8Array(3);
	const bitstream = new Bitstream(bytes);
	bitstream.writeBits(2, frameInfo.fscod);
	bitstream.writeBits(5, frameInfo.bsid);
	bitstream.writeBits(3, frameInfo.bsmod);
	bitstream.writeBits(3, frameInfo.acmod);
	bitstream.writeBits(1, frameInfo.lfeon);
	bitstream.writeBits(5, frameInfo.bitRateCode);
	bitstream.writeBits(5, 0);
	return box("dac3", [...bytes]);
};
/** EC3SpecificBox */
var dec3 = (trackData) => {
	assert(trackData.info.primingPacket);
	const frameInfo = parseEac3SyncFrame(trackData.info.primingPacket.data);
	if (!frameInfo) throw new Error("Couldn't extract E-AC-3 frame info from the audio packet. Ensure the packets contain valid E-AC-3 sync frames (as specified in ETSI TS 102 366).");
	let totalBits = 16;
	for (const sub of frameInfo.substreams) {
		totalBits += 23;
		if (sub.numDepSub > 0) totalBits += 9;
		else totalBits += 1;
	}
	const size = Math.ceil(totalBits / 8);
	const bytes = new Uint8Array(size);
	const bitstream = new Bitstream(bytes);
	bitstream.writeBits(13, frameInfo.dataRate);
	bitstream.writeBits(3, frameInfo.substreams.length - 1);
	for (const sub of frameInfo.substreams) {
		bitstream.writeBits(2, sub.fscod);
		bitstream.writeBits(5, sub.bsid);
		bitstream.writeBits(1, 0);
		bitstream.writeBits(1, 0);
		bitstream.writeBits(3, sub.bsmod);
		bitstream.writeBits(3, sub.acmod);
		bitstream.writeBits(1, sub.lfeon);
		bitstream.writeBits(3, 0);
		bitstream.writeBits(4, sub.numDepSub);
		if (sub.numDepSub > 0) bitstream.writeBits(9, sub.chanLoc);
		else bitstream.writeBits(1, 0);
	}
	return box("dec3", [...bytes]);
};
/** DTSSpecificBox */
var ddts = (trackData) => {
	assert(trackData.info.primingPacket);
	const frameInfo = parseDtsFrame(trackData.info.primingPacket.data);
	if (!frameInfo) throw new Error("Couldn't extract DTS frame info from the audio packet. Ensure the packets contain valid DTS frames as specified in ETSI TS 102 114.");
	return box("ddts", [...buildDtsSpecificBox(frameInfo)]);
};
var subtitleSampleDescription = (compressionType, trackData) => box(compressionType, [Array(6).fill(0), u16(1)], [SUBTITLE_CODEC_TO_CONFIGURATION_BOX[trackData.track.source._codec](trackData)]);
var vttC = (trackData) => box("vttC", [...textEncoder.encode(trackData.info.config.description)]);
/**
* Time-To-Sample Box: Stores duration information for a media's samples, providing a mapping from a time in a media
* to the corresponding data sample. The table is compact, meaning that consecutive samples with the same time delta
* will be grouped.
*/
var stts = (trackData) => {
	return fullBox("stts", 0, 0, [u32(trackData.timeToSampleTable.length), trackData.timeToSampleTable.map((x) => [u32(x.sampleCount), u32(x.sampleDelta)])]);
};
/** Sync Sample Box: Identifies the key frames in the media, marking the random access points within a stream. */
var stss = (trackData) => {
	if (trackData.samples.every((x) => x.type === "key")) return null;
	const keySamples = [...trackData.samples.entries()].filter(([, sample]) => sample.type === "key");
	return fullBox("stss", 0, 0, [u32(keySamples.length), keySamples.map(([index]) => u32(index + 1))]);
};
/**
* Sample-To-Chunk Box: As samples are added to a media, they are collected into chunks that allow optimized data
* access. A chunk contains one or more samples. Chunks in a media may have different sizes, and the samples within a
* chunk may have different sizes. The Sample-To-Chunk Box stores chunk information for the samples in a media, stored
* in a compactly-coded fashion.
*/
var stsc = (trackData) => {
	return fullBox("stsc", 0, 0, [u32(trackData.compactlyCodedChunkTable.length), trackData.compactlyCodedChunkTable.map((x) => [
		u32(x.firstChunk),
		u32(x.samplesPerChunk),
		u32(1)
	])]);
};
/** Sample Size Box: Specifies the byte size of each sample in the media. */
var stsz = (trackData) => {
	if (trackData.type === "audio" && trackData.info.requiresPcmTransformation) {
		const { sampleSize } = parsePcmCodec(trackData.track.source._codec);
		return fullBox("stsz", 0, 0, [u32(sampleSize * trackData.info.numberOfChannels), u32(trackData.samples.reduce((acc, x) => acc + intoTimescale(x.duration, trackData.timescale), 0))]);
	}
	return fullBox("stsz", 0, 0, [
		u32(0),
		u32(trackData.samples.length),
		trackData.samples.map((x) => u32(x.size))
	]);
};
/** Chunk Offset Box: Identifies the location of each chunk of data in the media's data stream, relative to the file. */
var stco = (trackData) => {
	if (trackData.finalizedChunks.length > 0 && last(trackData.finalizedChunks).offset >= 2 ** 32) return fullBox("co64", 0, 0, [u32(trackData.finalizedChunks.length), trackData.finalizedChunks.map((x) => u64(x.offset))]);
	return fullBox("stco", 0, 0, [u32(trackData.finalizedChunks.length), trackData.finalizedChunks.map((x) => u32(x.offset))]);
};
/**
* Composition Time to Sample Box: Stores composition time offset information (PTS-DTS) for a
* media's samples. The table is compact, meaning that consecutive samples with the same time
* composition time offset will be grouped.
*/
var ctts = (trackData) => {
	return fullBox("ctts", 1, 0, [u32(trackData.compositionTimeOffsetTable.length), trackData.compositionTimeOffsetTable.map((x) => [u32(x.sampleCount), i32(x.sampleCompositionTimeOffset)])]);
};
/**
* Composition to Decode Box: Stores information about the composition and display times of the media samples.
*/
var cslg = (trackData) => {
	let leastDecodeToDisplayDelta = Infinity;
	let greatestDecodeToDisplayDelta = -Infinity;
	let compositionStartTime = Infinity;
	let compositionEndTime = -Infinity;
	assert(trackData.compositionTimeOffsetTable.length > 0);
	assert(trackData.samples.length > 0);
	for (let i = 0; i < trackData.compositionTimeOffsetTable.length; i++) {
		const entry = trackData.compositionTimeOffsetTable[i];
		leastDecodeToDisplayDelta = Math.min(leastDecodeToDisplayDelta, entry.sampleCompositionTimeOffset);
		greatestDecodeToDisplayDelta = Math.max(greatestDecodeToDisplayDelta, entry.sampleCompositionTimeOffset);
	}
	for (let i = 0; i < trackData.samples.length; i++) {
		const sample = trackData.samples[i];
		compositionStartTime = Math.min(compositionStartTime, intoTimescale(sample.timestamp, trackData.timescale));
		compositionEndTime = Math.max(compositionEndTime, intoTimescale(sample.timestamp + sample.duration, trackData.timescale));
	}
	const compositionToDtsShift = Math.max(-leastDecodeToDisplayDelta, 0);
	if (compositionEndTime >= 2 ** 31) return null;
	return fullBox("cslg", 0, 0, [
		i32(compositionToDtsShift),
		i32(leastDecodeToDisplayDelta),
		i32(greatestDecodeToDisplayDelta),
		i32(compositionStartTime),
		i32(compositionEndTime)
	]);
};
/**
* Movie Extends Box: This box signals to readers that the file is fragmented. Contains a single Track Extends Box
* for each track in the movie.
*/
var mvex = (trackDatas) => {
	return box("mvex", void 0, trackDatas.map(trex));
};
/** Track Extends Box: Contains the default values used by the movie fragments. */
var trex = (trackData) => {
	return fullBox("trex", 0, 0, [
		u32(trackData.track.id),
		u32(1),
		u32(0),
		u32(0),
		u32(0)
	]);
};
/**
* Movie Fragment Box: The movie fragments extend the presentation in time. They provide the information that would
* previously have been	in the Movie Box.
*/
var moof = (sequenceNumber, trackDatas) => {
	return box("moof", void 0, [mfhd(sequenceNumber), ...trackDatas.map(traf)]);
};
/** Movie Fragment Header Box: Contains a sequence number as a safety check. */
var mfhd = (sequenceNumber) => {
	return fullBox("mfhd", 0, 0, [u32(sequenceNumber)]);
};
var fragmentSampleFlags = (sample) => {
	let byte1 = 0;
	let byte2 = 0;
	const sampleIsDifferenceSample = sample.type === "delta";
	byte2 |= +sampleIsDifferenceSample;
	if (sampleIsDifferenceSample) byte1 |= 1;
	else byte1 |= 2;
	return byte1 << 24 | byte2 << 16 | 0;
};
/** Track Fragment Box */
var traf = (trackData) => {
	return box("traf", void 0, [
		tfhd(trackData),
		tfdt(trackData),
		trun(trackData)
	]);
};
/** Track Fragment Header Box: Provides a reference to the extended track, and flags. */
var tfhd = (trackData) => {
	assert(trackData.currentChunk);
	let tfFlags = 0;
	tfFlags |= 8;
	tfFlags |= 16;
	tfFlags |= 32;
	tfFlags |= 131072;
	const referenceSample = trackData.currentChunk.samples[1] ?? trackData.currentChunk.samples[0];
	const referenceSampleInfo = {
		duration: referenceSample.timescaleUnitsToNextSample,
		size: referenceSample.size,
		flags: fragmentSampleFlags(referenceSample)
	};
	return fullBox("tfhd", 0, tfFlags, [
		u32(trackData.track.id),
		u32(referenceSampleInfo.duration),
		u32(referenceSampleInfo.size),
		u32(referenceSampleInfo.flags)
	]);
};
/**
* Track Fragment Decode Time Box: Provides the absolute decode time of the first sample of the fragment. This is
* useful for performing random access on the media file.
*/
var tfdt = (trackData) => {
	assert(trackData.currentChunk);
	return fullBox("tfdt", 1, 0, [u64(intoTimescale(trackData.currentChunk.startTimestamp, trackData.timescale))]);
};
/** Track Run Box: Specifies a run of contiguous samples for a given track. */
var trun = (trackData) => {
	assert(trackData.currentChunk);
	const allSampleDurations = trackData.currentChunk.samples.map((x) => x.timescaleUnitsToNextSample);
	const allSampleSizes = trackData.currentChunk.samples.map((x) => x.size);
	const allSampleFlags = trackData.currentChunk.samples.map(fragmentSampleFlags);
	const allSampleCompositionTimeOffsets = trackData.currentChunk.samples.map((x) => intoTimescale(x.timestamp - x.decodeTimestamp, trackData.timescale));
	const uniqueSampleDurations = new Set(allSampleDurations);
	const uniqueSampleSizes = new Set(allSampleSizes);
	const uniqueSampleFlags = new Set(allSampleFlags);
	const uniqueSampleCompositionTimeOffsets = new Set(allSampleCompositionTimeOffsets);
	const firstSampleFlagsPresent = uniqueSampleFlags.size === 2 && allSampleFlags[0] !== allSampleFlags[1];
	const sampleDurationPresent = uniqueSampleDurations.size > 1;
	const sampleSizePresent = uniqueSampleSizes.size > 1;
	const sampleFlagsPresent = !firstSampleFlagsPresent && uniqueSampleFlags.size > 1;
	const sampleCompositionTimeOffsetsPresent = uniqueSampleCompositionTimeOffsets.size > 1 || [...uniqueSampleCompositionTimeOffsets].some((x) => x !== 0);
	let flags = 0;
	flags |= 1;
	flags |= 4 * +firstSampleFlagsPresent;
	flags |= 256 * +sampleDurationPresent;
	flags |= 512 * +sampleSizePresent;
	flags |= 1024 * +sampleFlagsPresent;
	flags |= 2048 * +sampleCompositionTimeOffsetsPresent;
	return fullBox("trun", 1, flags, [
		u32(trackData.currentChunk.samples.length),
		u32(trackData.currentChunk.offset - trackData.currentChunk.moofOffset || 0),
		firstSampleFlagsPresent ? u32(allSampleFlags[0]) : [],
		trackData.currentChunk.samples.map((_, i) => [
			sampleDurationPresent ? u32(allSampleDurations[i]) : [],
			sampleSizePresent ? u32(allSampleSizes[i]) : [],
			sampleFlagsPresent ? u32(allSampleFlags[i]) : [],
			sampleCompositionTimeOffsetsPresent ? i32(allSampleCompositionTimeOffsets[i]) : []
		])
	]);
};
/**
* Movie Fragment Random Access Box: For each track, provides pointers to sync samples within the file
* for random access.
*/
var mfra = (trackDatas) => {
	return box("mfra", void 0, [...trackDatas.map(tfra), mfro()]);
};
/** Track Fragment Random Access Box: Provides pointers to sync samples within the file for random access. */
var tfra = (trackData) => {
	return fullBox("tfra", 1, 0, [
		u32(trackData.track.id),
		u32(63),
		u32(trackData.finalizedChunks.length),
		trackData.finalizedChunks.map((chunk) => [
			u64(intoTimescale(chunk.samples[0].timestamp, trackData.timescale)),
			u64(chunk.moofOffset),
			u32(chunk.trafIndex + 1),
			u32(1),
			u32(1)
		])
	]);
};
/**
* Movie Fragment Random Access Offset Box: Provides the size of the enclosing mfra box. This box can be used by readers
* to quickly locate the mfra box by searching from the end of the file.
*/
var mfro = () => {
	return fullBox("mfro", 0, 0, [u32(0)]);
};
/** VTT Empty Cue Box */
var vtte = () => box("vtte");
/** VTT Cue Box */
var vttc = (payload, timestamp, identifier, settings, sourceId) => box("vttc", void 0, [
	sourceId !== null ? box("vsid", [i32(sourceId)]) : null,
	identifier !== null ? box("iden", [...textEncoder.encode(identifier)]) : null,
	timestamp !== null ? box("ctim", [...textEncoder.encode(formatSubtitleTimestamp(timestamp))]) : null,
	settings !== null ? box("sttg", [...textEncoder.encode(settings)]) : null,
	box("payl", [...textEncoder.encode(payload)])
]);
/** VTT Additional Text Box */
var vtta = (notes) => box("vtta", [...textEncoder.encode(notes)]);
/** User Data Box */
var udta = (muxer) => {
	const boxes = [];
	const metadataFormat = muxer.format._options.metadataFormat ?? "auto";
	const metadataTags = muxer.output._metadataTags;
	if (metadataFormat === "mdir" || metadataFormat === "auto" && !muxer.isQuickTime) {
		const metaBox = metaMdir(metadataTags);
		if (metaBox) boxes.push(metaBox);
	} else if (metadataFormat === "mdta") {
		const metaBox = metaMdta(metadataTags);
		if (metaBox) boxes.push(metaBox);
	} else if (metadataFormat === "udta" || metadataFormat === "auto" && muxer.isQuickTime) addQuickTimeMetadataTagBoxes(boxes, muxer.output._metadataTags);
	if (boxes.length === 0) return null;
	return box("udta", void 0, boxes);
};
var addQuickTimeMetadataTagBoxes = (boxes, tags) => {
	for (const { key, value } of keyValueIterator(tags)) switch (key) {
		case "title":
			boxes.push(metadataTagStringBoxShort("©nam", value));
			break;
		case "description":
			boxes.push(metadataTagStringBoxShort("©des", value));
			break;
		case "artist":
			boxes.push(metadataTagStringBoxShort("©ART", value));
			break;
		case "album":
			boxes.push(metadataTagStringBoxShort("©alb", value));
			break;
		case "albumArtist":
			boxes.push(metadataTagStringBoxShort("albr", value));
			break;
		case "genre":
			boxes.push(metadataTagStringBoxShort("©gen", value));
			break;
		case "date":
			boxes.push(metadataTagStringBoxShort("©day", value.toISOString().slice(0, 10)));
			break;
		case "comment":
			boxes.push(metadataTagStringBoxShort("©cmt", value));
			break;
		case "lyrics":
			boxes.push(metadataTagStringBoxShort("©lyr", value));
			break;
		case "raw": break;
		case "discNumber":
		case "discsTotal":
		case "trackNumber":
		case "tracksTotal":
		case "images": break;
		default: assertNever(key);
	}
	if (tags.raw) for (const key in tags.raw) {
		const value = tags.raw[key];
		if (value == null || key.length !== 4 || boxes.some((x) => x.type === key)) continue;
		if (typeof value === "string") boxes.push(metadataTagStringBoxShort(key, value));
		else if (value instanceof Uint8Array) boxes.push(box(key, Array.from(value)));
	}
};
var metadataTagStringBoxShort = (name, value) => {
	const encoded = textEncoder.encode(value);
	return box(name, [
		u16(encoded.length),
		u16(getLanguageCodeInt("und")),
		Array.from(encoded)
	]);
};
var DATA_BOX_MIME_TYPE_MAP = {
	"image/jpeg": 13,
	"image/png": 14,
	"image/bmp": 27
};
/**
* Generates key-value metadata for inclusion in the "meta" box.
*/
var generateMetadataPairs = (tags, isMdta) => {
	const pairs = [];
	for (const { key, value } of keyValueIterator(tags)) switch (key) {
		case "title":
			pairs.push({
				key: isMdta ? "title" : "©nam",
				value: dataStringBoxLong(value)
			});
			break;
		case "description":
			pairs.push({
				key: isMdta ? "description" : "©des",
				value: dataStringBoxLong(value)
			});
			break;
		case "artist":
			pairs.push({
				key: isMdta ? "artist" : "©ART",
				value: dataStringBoxLong(value)
			});
			break;
		case "album":
			pairs.push({
				key: isMdta ? "album" : "©alb",
				value: dataStringBoxLong(value)
			});
			break;
		case "albumArtist":
			pairs.push({
				key: isMdta ? "album_artist" : "aART",
				value: dataStringBoxLong(value)
			});
			break;
		case "comment":
			pairs.push({
				key: isMdta ? "comment" : "©cmt",
				value: dataStringBoxLong(value)
			});
			break;
		case "genre":
			pairs.push({
				key: isMdta ? "genre" : "©gen",
				value: dataStringBoxLong(value)
			});
			break;
		case "lyrics":
			pairs.push({
				key: isMdta ? "lyrics" : "©lyr",
				value: dataStringBoxLong(value)
			});
			break;
		case "date":
			pairs.push({
				key: isMdta ? "date" : "©day",
				value: dataStringBoxLong(value.toISOString().slice(0, 10))
			});
			break;
		case "images":
			for (const image of value) {
				if (image.kind !== "coverFront") continue;
				pairs.push({
					key: "covr",
					value: box("data", [
						u32(DATA_BOX_MIME_TYPE_MAP[image.mimeType] ?? 0),
						u32(0),
						Array.from(image.data)
					])
				});
			}
			break;
		case "trackNumber":
			if (isMdta) {
				const string = tags.tracksTotal !== void 0 ? `${value}/${tags.tracksTotal}` : value.toString();
				pairs.push({
					key: "track",
					value: dataStringBoxLong(string)
				});
			} else pairs.push({
				key: "trkn",
				value: box("data", [
					u32(0),
					u32(0),
					u16(0),
					u16(value),
					u16(tags.tracksTotal ?? 0),
					u16(0)
				])
			});
			break;
		case "discNumber":
			if (!isMdta) pairs.push({
				key: "disc",
				value: box("data", [
					u32(0),
					u32(0),
					u16(0),
					u16(value),
					u16(tags.discsTotal ?? 0),
					u16(0)
				])
			});
			break;
		case "tracksTotal":
		case "discsTotal": break;
		case "raw": break;
		default: assertNever(key);
	}
	if (tags.raw) for (const key in tags.raw) {
		const value = tags.raw[key];
		if (value == null || !isMdta && key.length !== 4 || pairs.some((x) => x.key === key)) continue;
		if (typeof value === "string") pairs.push({
			key,
			value: dataStringBoxLong(value)
		});
		else if (value instanceof Uint8Array) pairs.push({
			key,
			value: box("data", [
				u32(0),
				u32(0),
				Array.from(value)
			])
		});
		else if (value instanceof RichImageData) pairs.push({
			key,
			value: box("data", [
				u32(DATA_BOX_MIME_TYPE_MAP[value.mimeType] ?? 0),
				u32(0),
				Array.from(value.data)
			])
		});
	}
	return pairs;
};
/** Metadata Box (mdir format) */
var metaMdir = (tags) => {
	const pairs = generateMetadataPairs(tags, false);
	if (pairs.length === 0) return null;
	return fullBox("meta", 0, 0, void 0, [hdlr(false, "mdir", "", "appl"), box("ilst", void 0, pairs.map((pair) => box(pair.key, void 0, [pair.value])))]);
};
/** Metadata Box (mdta format with keys box) */
var metaMdta = (tags) => {
	const pairs = generateMetadataPairs(tags, true);
	if (pairs.length === 0) return null;
	return box("meta", void 0, [
		hdlr(false, "mdta", ""),
		fullBox("keys", 0, 0, [u32(pairs.length)], pairs.map((pair) => box("mdta", [...textEncoder.encode(pair.key)]))),
		box("ilst", void 0, pairs.map((pair, i) => {
			return box(String.fromCharCode(...u32(i + 1)), void 0, [pair.value]);
		}))
	]);
};
var dataStringBoxLong = (value) => {
	return box("data", [
		u32(1),
		u32(0),
		...textEncoder.encode(value)
	]);
};
var videoCodecToBoxName = (codec, fullCodecString) => {
	switch (codec) {
		case "avc": return fullCodecString.startsWith("avc3") ? "avc3" : "avc1";
		case "hevc": return "hvc1";
		case "vp8": return "vp08";
		case "vp9": return "vp09";
		case "av1": return "av01";
		case "prores": return fullCodecString;
	}
};
var VIDEO_CODEC_TO_CONFIGURATION_BOX = {
	avc: avcC,
	hevc: hvcC,
	vp8: vpcC,
	vp9: vpcC,
	av1: av1C,
	prores: null
};
var audioCodecToBoxName = (codec, fullCodecString, isQuickTime) => {
	switch (codec) {
		case "aac": return "mp4a";
		case "mp3": return "mp4a";
		case "opus": return "Opus";
		case "vorbis": return "mp4a";
		case "flac": return "fLaC";
		case "ulaw": return "ulaw";
		case "alaw": return "alaw";
		case "pcm-u8": return "raw ";
		case "pcm-s8": return "sowt";
		case "ac3": return "ac-3";
		case "eac3": return "ec-3";
		case "dts": return fullCodecString;
	}
	if (isQuickTime) switch (codec) {
		case "pcm-s16": return "sowt";
		case "pcm-s16be": return "twos";
		case "pcm-s24": return "in24";
		case "pcm-s24be": return "in24";
		case "pcm-s32": return "in32";
		case "pcm-s32be": return "in32";
		case "pcm-f32": return "fl32";
		case "pcm-f32be": return "fl32";
		case "pcm-f64": return "fl64";
		case "pcm-f64be": return "fl64";
	}
	else switch (codec) {
		case "pcm-s16": return "ipcm";
		case "pcm-s16be": return "ipcm";
		case "pcm-s24": return "ipcm";
		case "pcm-s24be": return "ipcm";
		case "pcm-s32": return "ipcm";
		case "pcm-s32be": return "ipcm";
		case "pcm-f32": return "fpcm";
		case "pcm-f32be": return "fpcm";
		case "pcm-f64": return "fpcm";
		case "pcm-f64be": return "fpcm";
	}
};
var audioCodecToConfigurationBox = (codec, isQuickTime) => {
	switch (codec) {
		case "aac": return esds;
		case "mp3": return esds;
		case "opus": return dOps;
		case "vorbis": return esds;
		case "flac": return dfLa;
		case "ac3": return dac3;
		case "eac3": return dec3;
		case "dts": return ddts;
	}
	if (isQuickTime) switch (codec) {
		case "pcm-s24": return wave;
		case "pcm-s24be": return wave;
		case "pcm-s32": return wave;
		case "pcm-s32be": return wave;
		case "pcm-f32": return wave;
		case "pcm-f32be": return wave;
		case "pcm-f64": return wave;
		case "pcm-f64be": return wave;
	}
	else switch (codec) {
		case "pcm-s16": return pcmC;
		case "pcm-s16be": return pcmC;
		case "pcm-s24": return pcmC;
		case "pcm-s24be": return pcmC;
		case "pcm-s32": return pcmC;
		case "pcm-s32be": return pcmC;
		case "pcm-f32": return pcmC;
		case "pcm-f32be": return pcmC;
		case "pcm-f64": return pcmC;
		case "pcm-f64be": return pcmC;
	}
	return null;
};
var SUBTITLE_CODEC_TO_BOX_NAME = { webvtt: "wvtt" };
var SUBTITLE_CODEC_TO_CONFIGURATION_BOX = { webvtt: vttC };
var getLanguageCodeInt = (code) => {
	assert(code.length === 3);
	let language = 0;
	for (let i = 0; i < 3; i++) {
		language <<= 5;
		language += code.charCodeAt(i) - 96;
	}
	return language;
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/writer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var Writer = class {
	constructor(target, isMonotonic) {
		this.finalized = false;
		this.started = false;
		this.pos = 0;
		this.trackedWrites = null;
		this.trackedStart = -1;
		this.trackedEnd = -1;
		if (target._writerAcquired) throw new Error("Can't have multiple Writers for the same Target.");
		this.target = target;
		target._setMonotonicity(isMonotonic);
		target._writerAcquired = true;
	}
	start() {
		assert(!this.started);
		this.target._start();
		this.started = true;
	}
	/** Writes the given data to the target, at the current position. */
	write(data) {
		assert(this.started && !this.finalized);
		this.maybeTrackWrites(data);
		this.target._write(data, this.pos);
		this.pos += data.byteLength;
	}
	/** Sets the current position for future writes to a new one. */
	seek(newPos) {
		this.pos = newPos;
	}
	/** Returns the current position. */
	getPos() {
		return this.pos;
	}
	/** Signals to the writer that it may be time to flush. */
	async flush() {
		assert(this.started && !this.finalized);
		return this.target._flush();
	}
	/** Called after muxing has finished. */
	async finalize() {
		assert(this.started && !this.finalized);
		await this.target._finalize();
		this.finalized = true;
	}
	maybeTrackWrites(data) {
		if (!this.trackedWrites) return;
		let pos = this.getPos();
		if (pos < this.trackedStart) {
			if (pos + data.byteLength <= this.trackedStart) return;
			data = data.subarray(this.trackedStart - pos);
			pos = 0;
		}
		const neededSize = pos + data.byteLength - this.trackedStart;
		let newLength = this.trackedWrites.byteLength;
		while (newLength < neededSize) newLength *= 2;
		if (newLength !== this.trackedWrites.byteLength) {
			const copy = new Uint8Array(newLength);
			copy.set(this.trackedWrites, 0);
			this.trackedWrites = copy;
		}
		this.trackedWrites.set(data, pos - this.trackedStart);
		this.trackedEnd = Math.max(this.trackedEnd, pos + data.byteLength);
	}
	startTrackingWrites() {
		this.trackedWrites = /* @__PURE__ */ new Uint8Array(1024);
		this.trackedStart = this.getPos();
		this.trackedEnd = this.trackedStart;
	}
	stopTrackingWrites() {
		if (!this.trackedWrites) throw new Error("Internal error: Can't get tracked writes since nothing was tracked.");
		const result = {
			data: this.trackedWrites.subarray(0, this.trackedEnd - this.trackedStart),
			start: this.trackedStart,
			end: this.trackedEnd
		};
		this.trackedWrites = null;
		return result;
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/target.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* Base class for targets, specifying where output files are written.
* @group Output targets
* @public
*/
var Target = class extends EventEmitter {
	constructor() {
		super(...arguments);
		/** @internal */
		this._writerAcquired = false;
		/** @internal */
		this._monotonicity = null;
		/**
		* Called each time data is written to the target. Will be called with the byte range into which data was written.
		*
		* Use this callback to track the size of the output file as it grows. But be warned, this function is chatty and
		* gets called *extremely* often.
		*
		* @deprecated Use `target.on('write', ({ start, end }) => ...)` instead.
		*/
		this.onwrite = null;
	}
	/** @internal */
	_setMonotonicity(monotonicity) {
		if (this._monotonicity !== false) this._monotonicity = monotonicity;
	}
	/** @internal */
	_dispatchWrite(start, end) {
		this.onwrite?.(start, end);
		this._emit("write", {
			start,
			end
		});
	}
	/**
	* Returns a new {@link RangedTarget} that writes data to this target using the given offset.
	*
	* Useful for writing a file into a section of a larger file.
	*/
	slice(offset) {
		if (!Number.isInteger(offset) || offset < 0) throw new TypeError("offset must be a non-negative integer.");
		return new RangedTarget(this, offset);
	}
};
var ARRAY_BUFFER_INITIAL_SIZE = 2 ** 16;
var ARRAY_BUFFER_MAX_SIZE = 2 ** 32;
/**
* A target that writes data directly into an ArrayBuffer in memory. Great for performance, but not suitable for very
* large files. The buffer will be available once the output has been finalized.
* @group Output targets
* @public
*/
var BufferTarget = class extends Target {
	/** Creates a new {@link BufferTarget}. The buffer holding the data will be created and managed internally. */
	constructor(options = {}) {
		super();
		/** Stores the final output buffer. Until the output is finalized, this will be `null`. */
		this.buffer = null;
		/** @internal */
		this._maxPos = 0;
		if (!options || typeof options !== "object") throw new TypeError("BufferTarget options, when provided, must be an object.");
		if (options.onFinalize !== void 0 && typeof options.onFinalize !== "function") throw new TypeError("options.onFinalize, when provided, must be a function.");
		this._options = options;
		this._supportsResize = "resize" in /* @__PURE__ */ new ArrayBuffer(0);
		if (this._supportsResize) try {
			this._buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE, { maxByteLength: ARRAY_BUFFER_MAX_SIZE });
		} catch {
			this._buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE);
			this._supportsResize = false;
		}
		else this._buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE);
		this._bytes = new Uint8Array(this._buffer);
	}
	/** @internal */
	_ensureSize(size) {
		let newLength = this._buffer.byteLength;
		while (newLength < size) newLength *= 2;
		if (newLength === this._buffer.byteLength) return;
		if (newLength > ARRAY_BUFFER_MAX_SIZE) throw new Error(`ArrayBuffer exceeded maximum size of ${ARRAY_BUFFER_MAX_SIZE} bytes. Please consider using another target.`);
		if (this._supportsResize) this._buffer.resize(newLength);
		else {
			const newBuffer = new ArrayBuffer(newLength);
			const newBytes = new Uint8Array(newBuffer);
			newBytes.set(this._bytes, 0);
			this._buffer = newBuffer;
			this._bytes = newBytes;
		}
	}
	/** @internal */
	_start() {}
	/** @internal */
	_write(data, pos) {
		this._ensureSize(pos + data.byteLength);
		this._bytes.set(data, pos);
		this._maxPos = Math.max(this._maxPos, pos + data.byteLength);
		this._dispatchWrite(pos, pos + data.byteLength);
	}
	/** @internal */
	async _flush() {}
	/** @internal */
	async _finalize() {
		this.buffer = this._buffer.slice(0, this._maxPos);
		if (this._options.onFinalize) await this._options.onFinalize(this.buffer);
		this._emit("finalized");
	}
	/** @internal */
	async _close() {}
	/** @internal */
	_getSlice(start, end) {
		return this._bytes.slice(start, end);
	}
};
var DEFAULT_CHUNK_SIZE = 2 ** 24;
var MAX_CHUNKS_AT_ONCE = 2;
/**
* This target writes data to a [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream),
* making it a general-purpose target for writing data anywhere. It is also compatible with
* [`FileSystemWritableFileStream`](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream) for
* use with the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API). The
* `WritableStream` can also apply backpressure, which will propagate to the output and throttle the encoders.
* @group Output targets
* @public
*/
var StreamTarget = class extends Target {
	/** Creates a new {@link StreamTarget} which writes to the specified `writable`. */
	constructor(writable, options = {}) {
		super();
		/** @internal */
		this._sections = [];
		/** @internal */
		this._lastWriteEnd = 0;
		/** @internal */
		this._lastFlushEnd = 0;
		/** @internal */
		this._streamWriter = null;
		/** @internal */
		this._writeError = null;
		/**
		* The data is divided up into fixed-size chunks, whose contents are first filled in RAM and then flushed out.
		* A chunk is flushed if all of its contents have been written.
		*/
		/** @internal */
		this._chunks = [];
		if (!(writable instanceof WritableStream)) throw new TypeError("StreamTarget requires a WritableStream instance.");
		if (options != null && typeof options !== "object") throw new TypeError("StreamTarget options, when provided, must be an object.");
		if (options.chunked !== void 0 && typeof options.chunked !== "boolean") throw new TypeError("options.chunked, when provided, must be a boolean.");
		if (options.chunkSize !== void 0 && (!Number.isInteger(options.chunkSize) || options.chunkSize < 1024)) throw new TypeError("options.chunkSize, when provided, must be an integer and not smaller than 1024.");
		this._writable = writable;
		this._options = options;
		this._chunked = options.chunked ?? false;
		this._chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
	}
	/** @internal */
	_start() {
		this._streamWriter = this._writable.getWriter();
	}
	/** @internal */
	_write(data, pos) {
		if (pos > this._lastWriteEnd) {
			const paddingBytesNeeded = pos - this._lastWriteEnd;
			this._write(new Uint8Array(paddingBytesNeeded), this._lastWriteEnd);
		}
		this._sections.push({
			data: data.slice(),
			start: pos
		});
		this._lastWriteEnd = Math.max(this._lastWriteEnd, pos + data.byteLength);
		this._dispatchWrite(pos, pos + data.byteLength);
	}
	/** @internal */
	async _flush() {
		if (this._writeError !== null) throw this._writeError;
		assert(this._streamWriter);
		if (this._sections.length === 0) return;
		const chunks = [];
		const sorted = [...this._sections].sort((a, b) => a.start - b.start);
		chunks.push({
			start: sorted[0].start,
			size: sorted[0].data.byteLength
		});
		for (let i = 1; i < sorted.length; i++) {
			const lastChunk = chunks[chunks.length - 1];
			const section = sorted[i];
			if (section.start <= lastChunk.start + lastChunk.size) lastChunk.size = Math.max(lastChunk.size, section.start + section.data.byteLength - lastChunk.start);
			else chunks.push({
				start: section.start,
				size: section.data.byteLength
			});
		}
		for (const chunk of chunks) {
			chunk.data = new Uint8Array(chunk.size);
			for (const section of this._sections) if (chunk.start <= section.start && section.start < chunk.start + chunk.size) chunk.data.set(section.data, section.start - chunk.start);
			if (this._streamWriter.desiredSize !== null && this._streamWriter.desiredSize <= 0) await this._streamWriter.ready;
			if (this._chunked) {
				this._writeDataIntoChunks(chunk.data, chunk.start);
				this._tryToFlushChunks();
			} else {
				if (this._monotonicity === true && chunk.start !== this._lastFlushEnd) throw new Error("Internal error: Monotonicity violation.");
				this._streamWriter.write({
					type: "write",
					data: chunk.data,
					position: chunk.start
				}).catch((error) => {
					this._writeError ??= error;
				});
				this._lastFlushEnd = chunk.start + chunk.data.byteLength;
			}
		}
		this._sections.length = 0;
	}
	/** @internal */
	_writeDataIntoChunks(data, position) {
		let chunkIndex = this._chunks.findIndex((x) => x.start <= position && position < x.start + this._chunkSize);
		if (chunkIndex === -1) chunkIndex = this._createChunk(position);
		const chunk = this._chunks[chunkIndex];
		const relativePosition = position - chunk.start;
		const toWrite = data.subarray(0, Math.min(this._chunkSize - relativePosition, data.byteLength));
		chunk.data.set(toWrite, relativePosition);
		const section = {
			start: relativePosition,
			end: relativePosition + toWrite.byteLength
		};
		this._insertSectionIntoChunk(chunk, section);
		if (chunk.written[0].start === 0 && chunk.written[0].end === this._chunkSize) chunk.shouldFlush = true;
		if (this._chunks.length > MAX_CHUNKS_AT_ONCE) {
			for (let i = 0; i < this._chunks.length - 1; i++) this._chunks[i].shouldFlush = true;
			this._tryToFlushChunks();
		}
		if (toWrite.byteLength < data.byteLength) this._writeDataIntoChunks(data.subarray(toWrite.byteLength), position + toWrite.byteLength);
	}
	/** @internal */
	_insertSectionIntoChunk(chunk, section) {
		let low = 0;
		let high = chunk.written.length - 1;
		let index = -1;
		while (low <= high) {
			const mid = Math.floor(low + (high - low + 1) / 2);
			if (chunk.written[mid].start <= section.start) {
				low = mid + 1;
				index = mid;
			} else high = mid - 1;
		}
		chunk.written.splice(index + 1, 0, section);
		if (index === -1 || chunk.written[index].end < section.start) index++;
		while (index < chunk.written.length - 1 && chunk.written[index].end >= chunk.written[index + 1].start) {
			chunk.written[index].end = Math.max(chunk.written[index].end, chunk.written[index + 1].end);
			chunk.written.splice(index + 1, 1);
		}
	}
	/** @internal */
	_createChunk(includesPosition) {
		const chunk = {
			start: Math.floor(includesPosition / this._chunkSize) * this._chunkSize,
			data: new Uint8Array(this._chunkSize),
			written: [],
			shouldFlush: false
		};
		this._chunks.push(chunk);
		this._chunks.sort((a, b) => a.start - b.start);
		return this._chunks.indexOf(chunk);
	}
	/** @internal */
	_tryToFlushChunks(force = false) {
		assert(this._streamWriter);
		for (let i = 0; i < this._chunks.length; i++) {
			const chunk = this._chunks[i];
			if (!chunk.shouldFlush && !force) continue;
			for (const section of chunk.written) {
				const position = chunk.start + section.start;
				if (this._monotonicity === true && position !== this._lastFlushEnd) throw new Error("Internal error: Monotonicity violation.");
				const isPartialView = section.start !== 0 || section.end !== chunk.data.byteLength;
				let data;
				if (isPartialView && isWebKit()) data = chunk.data.slice(section.start, section.end);
				else data = chunk.data.subarray(section.start, section.end);
				this._streamWriter.write({
					type: "write",
					data,
					position
				}).catch((error) => {
					this._writeError ??= error;
				});
				this._lastFlushEnd = chunk.start + section.end;
			}
			this._chunks.splice(i--, 1);
		}
	}
	/** @internal */
	async _finalize() {
		if (this._chunked) this._tryToFlushChunks(true);
		if (this._writeError !== null) throw this._writeError;
		assert(this._streamWriter);
		await this._streamWriter.ready;
		await this._streamWriter.close();
		this._emit("finalized");
	}
	/** @internal */
	async _close() {
		return this._streamWriter?.close();
	}
};
/**
* A target that writes to a subrange (defined by an offset) of another, underlying target. Useful for writing a file
* into a section of a larger file.
* @group Output targets
* @public
*/
var RangedTarget = class extends Target {
	/** @internal */
	constructor(baseTarget, offset) {
		super();
		this._baseTarget = baseTarget;
		this._offset = offset;
	}
	/** @internal */
	_start() {}
	/** @internal */
	_write(data, pos) {
		this._baseTarget._write(data, this._offset + pos);
		this._dispatchWrite(pos, pos + data.byteLength);
	}
	/** @internal */
	_flush() {
		return this._baseTarget._flush();
	}
	/** @internal */
	async _finalize() {
		this._emit("finalized");
	}
	/** @internal */
	async _close() {}
	/** @internal */
	_setMonotonicity(monotonicity) {
		super._setMonotonicity(monotonicity);
		this._baseTarget._setMonotonicity(monotonicity);
	}
};
/**
* A special target for writing multi-file media where each file is uniquely identified by a path.
* @group Output targets
* @public
*/
var PathedTarget = class {
	/** Creates a new {@link PathedTarget} from a root path and a callback. */
	constructor(rootPath, getTarget) {
		this.rootPath = rootPath;
		this.getTarget = getTarget;
		if (typeof rootPath !== "string") throw new TypeError("rootPath must be a string.");
		if (typeof getTarget !== "function") throw new TypeError("getTarget must be a function.");
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/isobmff/isobmff-muxer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var GLOBAL_TIMESCALE = 57600;
var TIMESTAMP_OFFSET = 2082844800;
var getTrackMetadata = (trackData) => {
	const metadata = {};
	const track = trackData.track;
	if (track.metadata.name !== void 0) metadata.name = track.metadata.name;
	return metadata;
};
var intoTimescale = (timeInSeconds, timescale, round = true) => {
	const value = timeInSeconds * timescale;
	return round ? Math.round(value) : value;
};
var IsobmffMuxer = class extends Muxer {
	constructor(output, format) {
		super(output);
		this.writer = null;
		this.boxWriter = null;
		this.initWriter = null;
		this.initBoxWriter = null;
		this.auxTarget = new BufferTarget();
		this.auxWriter = new Writer(this.auxTarget, false);
		this.auxBoxWriter = new IsobmffBoxWriter(this.auxWriter);
		this.mdat = null;
		this.ftypSize = null;
		this.trackDatas = [];
		this.allTracksKnown = promiseWithResolvers();
		this.creationTime = Math.floor(Date.now() / 1e3) + TIMESTAMP_OFFSET;
		this.finalizedChunks = [];
		this.wroteFragmentedHeader = false;
		this.nextFragmentNumber = 1;
		this.maxWrittenTimestamp = -Infinity;
		this.minWrittenTimestamp = Infinity;
		this.maxWrittenEndTimestamp = -Infinity;
		this.segmentHeaderSize = null;
		this.format = format;
		this.formatOptions = { ...format._options };
		this.isQuickTime = format instanceof MovOutputFormat;
		this.isCmaf = format instanceof CmafOutputFormat;
		this.minimumFragmentDuration = this.formatOptions.minimumFragmentDuration ?? (format instanceof CmafOutputFormat ? Infinity : 1);
		this.auxWriter.start();
	}
	async start() {
		const release = await this.mutex.acquire();
		if (!this.isCmaf) {
			this.writer = await this.output._getRootWriter((target) => this.formatOptions.fastStart !== void 0 ? this.formatOptions.fastStart === "fragmented" : target instanceof BufferTarget);
			this.boxWriter = new IsobmffBoxWriter(this.writer);
			this.fastStart = this.formatOptions.fastStart ?? (this.writer.target instanceof BufferTarget ? "in-memory" : false);
			this.isFragmented = this.fastStart === "fragmented";
		} else {
			this.fastStart = "fragmented";
			this.isFragmented = true;
		}
		if (this.isCmaf) {
			if (!this.output._hasInitTarget()) throw new Error("CMAF outputs require the initTarget field in OutputOptions to be set; the init segment will be written to it.");
			const initWriter = new Writer(await this.output._getInitTarget(), true);
			initWriter.start();
			this.initWriter = initWriter;
			this.initBoxWriter = new IsobmffBoxWriter(initWriter);
		}
		const holdsAvc = this.output.tracks.some((x) => x.isVideoTrack() && x.source._codec === "avc");
		{
			const boxWriter = this.initBoxWriter ?? this.boxWriter;
			assert(boxWriter);
			if (this.formatOptions.onFtyp) boxWriter.writer.startTrackingWrites();
			boxWriter.writeBox(ftyp({
				isQuickTime: this.isQuickTime,
				holdsAvc,
				fragmented: this.isFragmented,
				cmaf: this.isCmaf
			}));
			if (this.formatOptions.onFtyp) {
				const { data, start } = boxWriter.writer.stopTrackingWrites();
				this.formatOptions.onFtyp(data, start);
			}
			this.ftypSize = boxWriter.writer.getPos();
			if (this.isCmaf) await this.initWriter.flush();
		}
		if (this.fastStart === "in-memory") {} else if (this.fastStart === "reserve") {
			for (const track of this.output.tracks) if (track.metadata.maximumPacketCount === void 0) throw new Error("All tracks must specify maximumPacketCount in their metadata when using fastStart: 'reserve'.");
		} else if (this.isFragmented) {} else {
			assert(this.writer);
			assert(this.boxWriter);
			if (this.formatOptions.onMdat) this.writer.startTrackingWrites();
			this.mdat = mdat(true);
			this.boxWriter.writeBox(this.mdat);
		}
		await this.writer?.flush();
		for (const track of this.output.tracks) if (track.isVideoTrack() && track.metadata.decoderConfig) this.getVideoTrackData(track, track.metadata.primingPacket ?? null, { decoderConfig: track.metadata.decoderConfig });
		else if (track.isAudioTrack() && track.metadata.decoderConfig) this.getAudioTrackData(track, track.metadata.primingPacket ?? null, { decoderConfig: track.metadata.decoderConfig });
		release();
	}
	allTracksAreKnown() {
		for (const track of this.output.tracks) if (!track.source._closed && !this.trackDatas.some((x) => x.track === track)) return false;
		return true;
	}
	async getMimeType() {
		await this.allTracksKnown.promise;
		const codecStrings = this.trackDatas.map((trackData) => {
			if (trackData.type === "video") return trackData.info.decoderConfig.codec;
			else if (trackData.type === "audio") return trackData.info.decoderConfig.codec;
			else return { webvtt: "wvtt" }[trackData.track.source._codec];
		});
		return buildIsobmffMimeType({
			isQuickTime: this.isQuickTime,
			hasVideo: this.trackDatas.some((x) => x.type === "video"),
			hasAudio: this.trackDatas.some((x) => x.type === "audio"),
			codecStrings
		});
	}
	getVideoTrackData(track, packet, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateVideoChunkMetadata(meta, track.source._codec);
		assert(meta);
		assert(meta.decoderConfig);
		const decoderConfig = { ...meta.decoderConfig };
		assert(decoderConfig.codedWidth !== void 0);
		assert(decoderConfig.codedHeight !== void 0);
		let requiresAnnexBTransformation = false;
		if (track.source._codec === "avc" && !decoderConfig.description) {
			if (!packet) throw new Error("No AVC description provided; you must therefore provide a priming packet.");
			const decoderConfigurationRecord = extractAvcDecoderConfigurationRecord(packet.data);
			if (!decoderConfigurationRecord) throw new Error("Couldn't extract an AVCDecoderConfigurationRecord from the AVC packet. Make sure the packets are in Annex B format (as specified in ITU-T-REC-H.264) when not providing a description, or provide a description (must be an AVCDecoderConfigurationRecord as specified in ISO 14496-15) and ensure the packets are in AVCC format.");
			decoderConfig.description = serializeAvcDecoderConfigurationRecord(decoderConfigurationRecord);
			requiresAnnexBTransformation = true;
		} else if (track.source._codec === "hevc" && !decoderConfig.description) {
			if (!packet) throw new Error("No HEVC description provided; you must therefore provide a priming packet.");
			const decoderConfigurationRecord = extractHevcDecoderConfigurationRecord(packet.data);
			if (!decoderConfigurationRecord) throw new Error("Couldn't extract an HEVCDecoderConfigurationRecord from the HEVC packet. Make sure the packets are in Annex B format (as specified in ITU-T-REC-H.265) when not providing a description, or provide a description (must be an HEVCDecoderConfigurationRecord as specified in ISO 14496-15) and ensure the packets are in HEVC format.");
			decoderConfig.description = serializeHevcDecoderConfigurationRecord(decoderConfigurationRecord);
			requiresAnnexBTransformation = true;
		}
		const timescale = computeRationalApproximation(1 / (track.metadata.frameRate ?? 57600), 1e6).den;
		const displayAspectWidth = decoderConfig.displayAspectWidth;
		const displayAspectHeight = decoderConfig.displayAspectHeight;
		const pixelAspectRatio = displayAspectWidth === void 0 || displayAspectHeight === void 0 ? {
			num: 1,
			den: 1
		} : simplifyRational({
			num: displayAspectWidth * decoderConfig.codedHeight,
			den: displayAspectHeight * decoderConfig.codedWidth
		});
		const hasAlphaChannel = decoderConfig.codec === "ap4h" || decoderConfig.codec === "ap4x";
		const newTrackData = {
			muxer: this,
			track,
			type: "video",
			info: {
				width: decoderConfig.codedWidth,
				height: decoderConfig.codedHeight,
				pixelAspectRatio,
				decoderConfig,
				requiresAnnexBTransformation,
				hasAlphaChannel
			},
			timescale,
			samples: [],
			sampleQueue: [],
			timestampProcessingQueue: [],
			timeToSampleTable: [],
			compositionTimeOffsetTable: [],
			lastTimescaleUnits: null,
			lastSample: null,
			startTimestampOffset: null,
			finalizedChunks: [],
			currentChunk: null,
			compactlyCodedChunkTable: [],
			closed: false
		};
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	getAudioTrackData(track, packet, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateAudioChunkMetadata(meta, track.source._codec);
		assert(meta);
		assert(meta.decoderConfig);
		const decoderConfig = { ...meta.decoderConfig };
		let requiresAdtsStripping = false;
		if (track.source._codec === "aac" && !decoderConfig.description) {
			if (!packet) throw new Error("No AAC description provided; you must therefore provide a priming packet.");
			const adtsFrame = readAdtsFrameHeader(FileSlice.tempFromBytes(packet.data));
			if (!adtsFrame) throw new Error("Couldn't parse ADTS header from the AAC packet. Make sure the packets are in ADTS format (as specified in ISO 13818-7) when not providing a description, or provide a description (must be an AudioSpecificConfig as specified in ISO 14496-3) and ensure the packets are raw AAC data.");
			const sampleRate = aacFrequencyTable[adtsFrame.samplingFrequencyIndex];
			const numberOfChannels = aacChannelMap[adtsFrame.channelConfiguration];
			if (sampleRate === void 0 || numberOfChannels === void 0) throw new Error("Invalid ADTS frame header.");
			decoderConfig.description = buildAacAudioSpecificConfig({
				objectType: adtsFrame.objectType,
				outputSampleRate: sampleRate,
				outputNumberOfChannels: numberOfChannels
			});
			requiresAdtsStripping = true;
		}
		if (!packet) {
			if (track.source._codec === "ac3" || track.source._codec === "eac3") throw new Error("AC-3/E-AC-3 require a priming packet.");
			if (track.source._codec === "dts") throw new Error("DTS requires a priming packet.");
		}
		const newTrackData = {
			muxer: this,
			track,
			type: "audio",
			info: {
				numberOfChannels: meta.decoderConfig.numberOfChannels,
				sampleRate: meta.decoderConfig.sampleRate,
				decoderConfig,
				requiresPcmTransformation: !this.isFragmented && PCM_AUDIO_CODECS.includes(track.source._codec),
				expectedNextPcmPacketTimestamp: null,
				requiresAdtsStripping,
				primingPacket: packet
			},
			timescale: decoderConfig.sampleRate,
			samples: [],
			sampleQueue: [],
			timestampProcessingQueue: [],
			timeToSampleTable: [],
			compositionTimeOffsetTable: [],
			lastTimescaleUnits: null,
			lastSample: null,
			startTimestampOffset: null,
			finalizedChunks: [],
			currentChunk: null,
			compactlyCodedChunkTable: [],
			closed: false
		};
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	getSubtitleTrackData(track, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateSubtitleMetadata(meta);
		assert(meta);
		assert(meta.config);
		const newTrackData = {
			muxer: this,
			track,
			type: "subtitle",
			info: { config: meta.config },
			timescale: 1e3,
			samples: [],
			sampleQueue: [],
			timestampProcessingQueue: [],
			timeToSampleTable: [],
			compositionTimeOffsetTable: [],
			lastTimescaleUnits: null,
			lastSample: null,
			startTimestampOffset: null,
			finalizedChunks: [],
			currentChunk: null,
			compactlyCodedChunkTable: [],
			closed: false,
			lastCueEndTimestamp: null,
			cueQueue: [],
			nextSourceId: 0,
			cueToSourceId: /* @__PURE__ */ new WeakMap()
		};
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	async addEncodedVideoPacket(track, packet, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getVideoTrackData(track, packet, meta);
			let packetData = packet.data;
			if (trackData.info.requiresAnnexBTransformation) {
				const nalUnits = [...iterateNalUnitsInAnnexB(packetData)].map((loc) => packetData.subarray(loc.offset, loc.offset + loc.length));
				if (nalUnits.length === 0) throw new Error("Failed to transform packet data. Make sure all packets are provided in Annex B format, as specified in ITU-T-REC-H.264 and ITU-T-REC-H.265.");
				packetData = concatNalUnitsInLengthPrefixed(nalUnits, 4);
			}
			this.validateTimestamp(trackData.track, packet.timestamp, packet.type === "key");
			const internalSample = this.createSampleForTrack(trackData, packetData, packet.timestamp, packet.duration, packet.type);
			await this.registerSample(trackData, internalSample);
		} finally {
			release();
		}
	}
	async addEncodedAudioPacket(track, packet, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getAudioTrackData(track, packet, meta);
			let packetData = packet.data;
			if (trackData.info.requiresAdtsStripping) {
				const adtsFrame = readAdtsFrameHeader(FileSlice.tempFromBytes(packetData));
				if (!adtsFrame) throw new Error("Expected ADTS frame, didn't get one.");
				const headerLength = adtsFrame.crcCheck === null ? 7 : 9;
				packetData = packetData.subarray(headerLength);
			}
			this.validateTimestamp(trackData.track, packet.timestamp, packet.type === "key");
			let timestamp = packet.timestamp;
			let duration = packet.duration;
			if (trackData.info.requiresPcmTransformation) {
				const frameSize = parsePcmCodec(trackData.info.decoderConfig.codec).sampleSize * trackData.info.numberOfChannels;
				duration = packetData.byteLength / frameSize / trackData.info.sampleRate;
				if (trackData.info.expectedNextPcmPacketTimestamp !== null) {
					const diff = timestamp - trackData.info.expectedNextPcmPacketTimestamp;
					if (diff < .01) timestamp = trackData.info.expectedNextPcmPacketTimestamp;
					else {
						const paddedDuration = await this.padWithSilence(trackData, trackData.info.expectedNextPcmPacketTimestamp, diff);
						timestamp = trackData.info.expectedNextPcmPacketTimestamp + paddedDuration;
					}
				}
				trackData.info.expectedNextPcmPacketTimestamp = timestamp + duration;
			}
			const internalSample = this.createSampleForTrack(trackData, packetData, timestamp, duration, packet.type);
			await this.registerSample(trackData, internalSample);
		} finally {
			release();
		}
	}
	async padWithSilence(trackData, timestamp, duration) {
		const deltaInTimescale = intoTimescale(duration, trackData.timescale);
		duration = deltaInTimescale / trackData.timescale;
		if (deltaInTimescale > 0) {
			const { sampleSize, silentValue } = parsePcmCodec(trackData.info.decoderConfig.codec);
			const samplesNeeded = deltaInTimescale * trackData.info.numberOfChannels;
			const data = new Uint8Array(sampleSize * samplesNeeded).fill(silentValue);
			const paddingSample = this.createSampleForTrack(trackData, new Uint8Array(data.buffer), timestamp, duration, "key");
			await this.registerSample(trackData, paddingSample);
		}
		return duration;
	}
	async addSubtitleCue(track, cue, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getSubtitleTrackData(track, meta);
			this.validateTimestamp(trackData.track, cue.timestamp, true);
			if (track.source._codec === "webvtt") {
				trackData.cueQueue.push(cue);
				await this.processWebVTTCues(trackData, cue.timestamp);
			}
		} finally {
			release();
		}
	}
	async processWebVTTCues(trackData, until) {
		while (trackData.cueQueue.length > 0) {
			trackData.lastCueEndTimestamp ??= Math.min(0, trackData.cueQueue[0].timestamp);
			const timestamps = /* @__PURE__ */ new Set([]);
			for (const cue of trackData.cueQueue) {
				assert(cue.timestamp <= until);
				assert(trackData.lastCueEndTimestamp <= cue.timestamp + cue.duration);
				timestamps.add(Math.max(cue.timestamp, trackData.lastCueEndTimestamp));
				timestamps.add(cue.timestamp + cue.duration);
			}
			const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
			const sampleStart = sortedTimestamps[0];
			const sampleEnd = sortedTimestamps[1] ?? sampleStart;
			if (until < sampleEnd) break;
			if (trackData.lastCueEndTimestamp < sampleStart) {
				this.auxWriter.seek(0);
				const box = vtte();
				this.auxBoxWriter.writeBox(box);
				const body = this.auxTarget._getSlice(0, this.auxWriter.getPos());
				const sample = this.createSampleForTrack(trackData, body, trackData.lastCueEndTimestamp, sampleStart - trackData.lastCueEndTimestamp, "key");
				await this.registerSample(trackData, sample);
				trackData.lastCueEndTimestamp = sampleStart;
			}
			this.auxWriter.seek(0);
			for (let i = 0; i < trackData.cueQueue.length; i++) {
				const cue = trackData.cueQueue[i];
				if (cue.timestamp >= sampleEnd) break;
				inlineTimestampRegex.lastIndex = 0;
				const containsTimestamp = inlineTimestampRegex.test(cue.text);
				const endTimestamp = cue.timestamp + cue.duration;
				let sourceId = trackData.cueToSourceId.get(cue);
				if (sourceId === void 0 && sampleEnd < endTimestamp) {
					sourceId = trackData.nextSourceId++;
					trackData.cueToSourceId.set(cue, sourceId);
				}
				if (cue.notes) {
					const box = vtta(cue.notes);
					this.auxBoxWriter.writeBox(box);
				}
				const box = vttc(cue.text, containsTimestamp ? sampleStart : null, cue.identifier ?? null, cue.settings ?? null, sourceId ?? null);
				this.auxBoxWriter.writeBox(box);
				if (endTimestamp === sampleEnd) trackData.cueQueue.splice(i--, 1);
			}
			const body = this.auxTarget._getSlice(0, this.auxWriter.getPos());
			const sample = this.createSampleForTrack(trackData, body, sampleStart, sampleEnd - sampleStart, "key");
			await this.registerSample(trackData, sample);
			trackData.lastCueEndTimestamp = sampleEnd;
		}
	}
	createSampleForTrack(trackData, data, timestamp, duration, type) {
		return {
			timestamp,
			decodeTimestamp: timestamp,
			duration,
			data,
			size: data.byteLength,
			type,
			timescaleUnitsToNextSample: intoTimescale(duration, trackData.timescale)
		};
	}
	processTimestamps(trackData, nextSample) {
		if (trackData.timestampProcessingQueue.length === 0) return;
		if (trackData.type === "audio" && trackData.info.requiresPcmTransformation) {
			assert(!this.isFragmented);
			trackData.startTimestampOffset ??= trackData.timestampProcessingQueue[0].timestamp;
			let totalDuration = 0;
			for (let i = 0; i < trackData.timestampProcessingQueue.length; i++) {
				const sample = trackData.timestampProcessingQueue[i];
				const duration = intoTimescale(sample.duration, trackData.timescale);
				totalDuration += duration;
			}
			if (trackData.timeToSampleTable.length === 0) trackData.timeToSampleTable.push({
				sampleCount: totalDuration,
				sampleDelta: 1
			});
			else {
				const lastEntry = last(trackData.timeToSampleTable);
				lastEntry.sampleCount += totalDuration;
			}
			trackData.timestampProcessingQueue.length = 0;
			return;
		}
		const sortedTimestamps = trackData.timestampProcessingQueue.map((x) => x.timestamp).sort((a, b) => a - b);
		if (this.isFragmented) trackData.startTimestampOffset ??= Math.min(sortedTimestamps[0], 0);
		else trackData.startTimestampOffset ??= sortedTimestamps[0];
		for (let i = 0; i < trackData.timestampProcessingQueue.length; i++) {
			const sample = trackData.timestampProcessingQueue[i];
			sample.decodeTimestamp = sortedTimestamps[i];
			const sampleCompositionTimeOffset = intoTimescale(sample.timestamp - sample.decodeTimestamp, trackData.timescale);
			const durationInTimescale = intoTimescale(sample.duration, trackData.timescale);
			if (trackData.lastTimescaleUnits !== null) {
				assert(trackData.lastSample);
				const timescaleUnits = intoTimescale(sample.decodeTimestamp, trackData.timescale, false);
				const delta = Math.round(timescaleUnits - trackData.lastTimescaleUnits);
				assert(delta >= 0);
				trackData.lastTimescaleUnits += delta;
				trackData.lastSample.timescaleUnitsToNextSample = delta;
				if (!this.isFragmented) {
					let lastTableEntry = last(trackData.timeToSampleTable);
					assert(lastTableEntry);
					if (lastTableEntry.sampleCount === 1) {
						lastTableEntry.sampleDelta = delta;
						const entryBefore = trackData.timeToSampleTable[trackData.timeToSampleTable.length - 2];
						if (entryBefore && entryBefore.sampleDelta === delta) {
							entryBefore.sampleCount++;
							trackData.timeToSampleTable.pop();
							lastTableEntry = entryBefore;
						}
					} else if (lastTableEntry.sampleDelta !== delta) {
						lastTableEntry.sampleCount--;
						trackData.timeToSampleTable.push(lastTableEntry = {
							sampleCount: 1,
							sampleDelta: delta
						});
					}
					if (lastTableEntry.sampleDelta === durationInTimescale) lastTableEntry.sampleCount++;
					else trackData.timeToSampleTable.push({
						sampleCount: 1,
						sampleDelta: durationInTimescale
					});
					const lastCompositionTimeOffsetTableEntry = last(trackData.compositionTimeOffsetTable);
					assert(lastCompositionTimeOffsetTableEntry);
					if (lastCompositionTimeOffsetTableEntry.sampleCompositionTimeOffset === sampleCompositionTimeOffset) lastCompositionTimeOffsetTableEntry.sampleCount++;
					else trackData.compositionTimeOffsetTable.push({
						sampleCount: 1,
						sampleCompositionTimeOffset
					});
				}
			} else {
				trackData.lastTimescaleUnits = intoTimescale(sample.decodeTimestamp, trackData.timescale, false);
				if (!this.isFragmented) {
					trackData.timeToSampleTable.push({
						sampleCount: 1,
						sampleDelta: durationInTimescale
					});
					trackData.compositionTimeOffsetTable.push({
						sampleCount: 1,
						sampleCompositionTimeOffset
					});
				}
			}
			trackData.lastSample = sample;
		}
		trackData.timestampProcessingQueue.length = 0;
		assert(trackData.lastSample);
		assert(trackData.lastTimescaleUnits !== null);
		if (nextSample !== void 0 && trackData.lastSample.timescaleUnitsToNextSample === 0) {
			assert(nextSample.type === "key");
			const timescaleUnits = intoTimescale(nextSample.timestamp, trackData.timescale, false);
			const delta = Math.round(timescaleUnits - trackData.lastTimescaleUnits);
			trackData.lastSample.timescaleUnitsToNextSample = delta;
		}
	}
	async registerSample(trackData, sample) {
		if (sample.type === "key") this.processTimestamps(trackData, sample);
		trackData.timestampProcessingQueue.push(sample);
		if (this.isFragmented) {
			trackData.sampleQueue.push(sample);
			await this.interleaveSamples();
		} else if (this.fastStart === "reserve") await this.registerSampleFastStartReserve(trackData, sample);
		else await this.addSampleToTrack(trackData, sample);
	}
	async addSampleToTrack(trackData, sample) {
		if (!this.isFragmented) {
			trackData.samples.push(sample);
			if (this.fastStart === "reserve") {
				const maximumPacketCount = trackData.track.metadata.maximumPacketCount;
				assert(maximumPacketCount !== void 0);
				if (trackData.samples.length > maximumPacketCount) throw new Error(`Track #${trackData.track.id} has already reached the maximum packet count (${maximumPacketCount}). Either add less packets or increase the maximum packet count.`);
			}
		}
		let beginNewChunk = false;
		if (!trackData.currentChunk) beginNewChunk = true;
		else {
			trackData.currentChunk.startTimestamp = Math.min(trackData.currentChunk.startTimestamp, sample.timestamp);
			const currentChunkDuration = sample.timestamp - trackData.currentChunk.startTimestamp;
			if (this.isFragmented) {
				const keyFrameQueuedEverywhere = this.trackDatas.every((otherTrackData) => {
					if (trackData === otherTrackData) return sample.type === "key";
					const firstQueuedSample = otherTrackData.sampleQueue[0];
					if (firstQueuedSample) return firstQueuedSample.type === "key";
					return otherTrackData.closed;
				});
				if (currentChunkDuration >= this.minimumFragmentDuration && keyFrameQueuedEverywhere && sample.timestamp > this.maxWrittenTimestamp) {
					beginNewChunk = true;
					await this.finalizeFragment();
				}
			} else beginNewChunk = currentChunkDuration >= .5;
		}
		if (beginNewChunk) {
			if (trackData.currentChunk) await this.finalizeCurrentChunk(trackData);
			trackData.currentChunk = {
				startTimestamp: sample.timestamp,
				samples: [],
				offset: null,
				moofOffset: null,
				trafIndex: null
			};
		}
		assert(trackData.currentChunk);
		trackData.currentChunk.samples.push(sample);
		if (this.isFragmented) {
			this.maxWrittenTimestamp = Math.max(this.maxWrittenTimestamp, sample.timestamp);
			this.maxWrittenEndTimestamp = Math.max(this.maxWrittenEndTimestamp, sample.timestamp + sample.duration);
			this.minWrittenTimestamp = Math.min(this.minWrittenTimestamp, sample.timestamp);
		}
	}
	async finalizeCurrentChunk(trackData) {
		assert(!this.isFragmented);
		assert(this.writer);
		if (!trackData.currentChunk) return;
		trackData.finalizedChunks.push(trackData.currentChunk);
		this.finalizedChunks.push(trackData.currentChunk);
		let sampleCount = trackData.currentChunk.samples.length;
		if (trackData.type === "audio" && trackData.info.requiresPcmTransformation) sampleCount = trackData.currentChunk.samples.reduce((acc, sample) => acc + intoTimescale(sample.duration, trackData.timescale), 0);
		if (trackData.compactlyCodedChunkTable.length === 0 || last(trackData.compactlyCodedChunkTable).samplesPerChunk !== sampleCount) trackData.compactlyCodedChunkTable.push({
			firstChunk: trackData.finalizedChunks.length,
			samplesPerChunk: sampleCount
		});
		if (this.fastStart === "in-memory") {
			trackData.currentChunk.offset = 0;
			return;
		}
		trackData.currentChunk.offset = this.writer.getPos();
		for (const sample of trackData.currentChunk.samples) {
			assert(sample.data);
			this.writer.write(sample.data);
			sample.data = null;
		}
		await this.writer.flush();
	}
	async interleaveSamples(isFinalCall = false) {
		assert(this.isFragmented);
		if (!isFinalCall && !this.allTracksAreKnown()) return;
		outer: while (true) {
			let trackWithMinTimestamp = null;
			let minTimestamp = Infinity;
			for (const trackData of this.trackDatas) {
				if (!isFinalCall && trackData.sampleQueue.length === 0 && !trackData.closed) break outer;
				if (trackData.sampleQueue.length > 0 && trackData.sampleQueue[0].timestamp < minTimestamp) {
					trackWithMinTimestamp = trackData;
					minTimestamp = trackData.sampleQueue[0].timestamp;
				}
			}
			if (!trackWithMinTimestamp) break;
			const sample = trackWithMinTimestamp.sampleQueue.shift();
			await this.addSampleToTrack(trackWithMinTimestamp, sample);
		}
	}
	async finalizeFragment(flushWriter = !this.isCmaf) {
		assert(this.isFragmented);
		if (!this.wroteFragmentedHeader) {
			this.wroteFragmentedHeader = true;
			const boxWriter = this.initBoxWriter ?? this.boxWriter;
			assert(boxWriter);
			if (this.formatOptions.onMoov) boxWriter.writer.startTrackingWrites();
			this.ensureOneEnabledTrack();
			const movieBox = moov(this);
			boxWriter.writeBox(movieBox);
			if (this.formatOptions.onMoov) {
				const { data, start } = boxWriter.writer.stopTrackingWrites();
				this.formatOptions.onMoov(data, start);
			}
			if (this.isCmaf) {
				assert(this.initWriter);
				await this.initWriter.flush();
				await this.initWriter.finalize();
				this.writer = await this.output._getRootWriter(true);
				this.boxWriter = new IsobmffBoxWriter(this.writer);
				const stypSize = this.boxWriter.measureBox(styp());
				const sidxSize = this.boxWriter.measureBox(sidx(this, 0));
				this.segmentHeaderSize = stypSize + sidxSize;
				this.writer.seek(this.segmentHeaderSize);
			}
		}
		assert(this.writer);
		assert(this.boxWriter);
		const tracksInFragment = this.trackDatas.filter((x) => x.currentChunk);
		if (tracksInFragment.length === 0) {
			if (flushWriter) await this.writer.flush();
			return;
		}
		const fragmentNumber = this.nextFragmentNumber++;
		const moofBox = moof(fragmentNumber, tracksInFragment);
		const moofOffset = this.writer.getPos();
		const mdatStartPos = moofOffset + this.boxWriter.measureBox(moofBox);
		let currentPos = mdatStartPos + 8;
		let fragmentStartTimestamp = Infinity;
		for (let i = 0; i < tracksInFragment.length; i++) {
			const trackData = tracksInFragment[i];
			assert(trackData.currentChunk);
			assert(trackData.startTimestampOffset !== null);
			trackData.currentChunk.offset = currentPos;
			trackData.currentChunk.moofOffset = moofOffset;
			trackData.currentChunk.trafIndex = i;
			trackData.currentChunk.startTimestamp -= trackData.startTimestampOffset;
			for (const sample of trackData.currentChunk.samples) {
				currentPos += sample.size;
				sample.timestamp -= trackData.startTimestampOffset;
				sample.decodeTimestamp -= trackData.startTimestampOffset;
			}
			fragmentStartTimestamp = Math.min(fragmentStartTimestamp, trackData.currentChunk.startTimestamp);
		}
		const mdatSize = currentPos - mdatStartPos;
		const needsLargeMdatSize = mdatSize >= 2 ** 32;
		if (needsLargeMdatSize) for (const trackData of tracksInFragment) trackData.currentChunk.offset += 8;
		if (this.formatOptions.onMoof) this.writer.startTrackingWrites();
		const newMoofBox = moof(fragmentNumber, tracksInFragment);
		this.boxWriter.writeBox(newMoofBox);
		if (this.formatOptions.onMoof) {
			const { data, start } = this.writer.stopTrackingWrites();
			this.formatOptions.onMoof(data, start, fragmentStartTimestamp);
		}
		assert(this.writer.getPos() === mdatStartPos);
		if (this.formatOptions.onMdat) this.writer.startTrackingWrites();
		const mdatBox = mdat(needsLargeMdatSize);
		mdatBox.size = mdatSize;
		this.boxWriter.writeBox(mdatBox);
		this.writer.seek(mdatStartPos + (needsLargeMdatSize ? 16 : 8));
		for (const trackData of tracksInFragment) for (const sample of trackData.currentChunk.samples) {
			this.writer.write(sample.data);
			sample.data = null;
		}
		if (this.formatOptions.onMdat) {
			const { data, start } = this.writer.stopTrackingWrites();
			this.formatOptions.onMdat(data, start);
		}
		for (const trackData of tracksInFragment) {
			trackData.finalizedChunks.push(trackData.currentChunk);
			this.finalizedChunks.push(trackData.currentChunk);
			trackData.currentChunk = null;
		}
		if (flushWriter) await this.writer.flush();
	}
	async registerSampleFastStartReserve(trackData, sample) {
		if (this.allTracksAreKnown()) {
			if (!this.mdat) await this.createFastStartReserveMdat();
			await this.addSampleToTrack(trackData, sample);
		} else trackData.sampleQueue.push(sample);
	}
	async createFastStartReserveMdat() {
		assert(this.writer);
		assert(this.boxWriter);
		this.ensureOneEnabledTrack();
		const moovBox = moov(this);
		const reservedSize = this.boxWriter.measureBox(moovBox) + this.computeSampleTableSizeUpperBound() + 4096;
		assert(this.ftypSize !== null);
		this.writer.seek(this.ftypSize + reservedSize);
		if (this.formatOptions.onMdat) this.writer.startTrackingWrites();
		this.mdat = mdat(true);
		this.boxWriter.writeBox(this.mdat);
		for (const trackData of this.trackDatas) {
			for (const sample of trackData.sampleQueue) await this.addSampleToTrack(trackData, sample);
			trackData.sampleQueue.length = 0;
		}
	}
	computeSampleTableSizeUpperBound() {
		assert(this.fastStart === "reserve");
		let upperBound = 0;
		for (const trackData of this.trackDatas) {
			const n = trackData.track.metadata.maximumPacketCount;
			assert(n !== void 0);
			upperBound += 8 * Math.ceil(2 / 3 * n);
			upperBound += 4 * n;
			upperBound += 8 * Math.ceil(2 / 3 * n);
			upperBound += 12 * Math.ceil(2 / 3 * n);
			upperBound += 4 * n;
			upperBound += 8 * n;
		}
		return upperBound;
	}
	async onTrackClose(track) {
		const release = await this.mutex.acquire();
		const trackData = this.trackDatas.find((x) => x.track === track);
		if (trackData) {
			trackData.closed = true;
			if (trackData.type === "subtitle" && track.source._codec === "webvtt") await this.processWebVTTCues(trackData, Infinity);
			this.processTimestamps(trackData);
		}
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		if (this.isFragmented) await this.interleaveSamples();
		release();
	}
	ensureOneEnabledTrack() {
		for (const type of [
			"video",
			"audio",
			"subtitle"
		]) {
			const tracks = this.trackDatas.filter((t) => t.type === type);
			if (tracks.length === 0) continue;
			if (!tracks.some((t) => t.track.metadata.disposition?.default !== false)) {
				const firstTrack = tracks[0];
				firstTrack.track.metadata.disposition = {
					...firstTrack.track.metadata.disposition,
					default: true
				};
			}
		}
	}
	/** Internal function for external callers who want to full control fragment boundaries. */
	async forceFragmentFinalization() {
		assert(this.isFragmented);
		const release = await this.mutex.acquire();
		try {
			for (const trackData of this.trackDatas) {
				if (trackData.type === "subtitle" && trackData.track.source._codec === "webvtt") await this.processWebVTTCues(trackData, Infinity);
				this.processTimestamps(trackData);
			}
			await this.interleaveSamples(true);
			await this.finalizeFragment();
		} finally {
			release();
		}
	}
	/** Finalizes the file, making it ready for use. Must be called after all video and audio chunks have been added. */
	async finalize() {
		const release = await this.mutex.acquire();
		this.allTracksKnown.resolve();
		this.ensureOneEnabledTrack();
		if (!this.mdat && this.fastStart === "reserve") await this.createFastStartReserveMdat();
		for (const trackData of this.trackDatas) {
			trackData.closed = true;
			if (trackData.type === "subtitle" && trackData.track.source._codec === "webvtt") await this.processWebVTTCues(trackData, Infinity);
			this.processTimestamps(trackData);
		}
		if (this.isFragmented) {
			await this.interleaveSamples(true);
			await this.finalizeFragment(false);
		} else for (const trackData of this.trackDatas) {
			await this.finalizeCurrentChunk(trackData);
			if (trackData.startTimestampOffset !== null) for (let i = 0; i < trackData.samples.length; i++) {
				const sample = trackData.samples[i];
				sample.timestamp -= trackData.startTimestampOffset;
				sample.decodeTimestamp -= trackData.startTimestampOffset;
			}
		}
		assert(this.writer);
		assert(this.boxWriter);
		if (this.fastStart === "in-memory") {
			this.mdat = mdat(false);
			let mdatSize;
			for (let i = 0; i < 2; i++) {
				const movieBox = moov(this);
				const movieBoxSize = this.boxWriter.measureBox(movieBox);
				mdatSize = this.boxWriter.measureBox(this.mdat);
				let currentChunkPos = this.writer.getPos() + movieBoxSize + mdatSize;
				for (const chunk of this.finalizedChunks) {
					chunk.offset = currentChunkPos;
					for (const { data } of chunk.samples) {
						assert(data);
						currentChunkPos += data.byteLength;
						mdatSize += data.byteLength;
					}
				}
				if (currentChunkPos < 2 ** 32) break;
				if (mdatSize >= 2 ** 32) this.mdat.largeSize = true;
			}
			if (this.formatOptions.onMoov) this.writer.startTrackingWrites();
			const movieBox = moov(this);
			this.boxWriter.writeBox(movieBox);
			if (this.formatOptions.onMoov) {
				const { data, start } = this.writer.stopTrackingWrites();
				this.formatOptions.onMoov(data, start);
			}
			if (this.formatOptions.onMdat) this.writer.startTrackingWrites();
			this.mdat.size = mdatSize;
			this.boxWriter.writeBox(this.mdat);
			for (const chunk of this.finalizedChunks) for (const sample of chunk.samples) {
				assert(sample.data);
				this.writer.write(sample.data);
				sample.data = null;
			}
			if (this.formatOptions.onMdat) {
				const { data, start } = this.writer.stopTrackingWrites();
				this.formatOptions.onMdat(data, start);
			}
		} else if (this.isFragmented) {
			if (this.isCmaf) {
				const contentSize = this.segmentHeaderSize !== null ? this.writer.getPos() - this.segmentHeaderSize : 0;
				this.writer.seek(0);
				this.boxWriter.writeBox(styp());
				this.boxWriter.writeBox(sidx(this, contentSize));
			} else {
				const startPos = this.writer.getPos();
				const mfraBox = mfra(this.trackDatas);
				this.boxWriter.writeBox(mfraBox);
				const mfraBoxSize = this.writer.getPos() - startPos;
				this.writer.seek(this.writer.getPos() - 4);
				this.boxWriter.writeU32(mfraBoxSize);
			}
		} else {
			assert(this.mdat);
			const mdatPos = this.boxWriter.offsets.get(this.mdat);
			assert(mdatPos !== void 0);
			const mdatSize = this.writer.getPos() - mdatPos;
			this.mdat.size = mdatSize;
			this.mdat.largeSize = mdatSize >= 2 ** 32;
			this.boxWriter.patchBox(this.mdat);
			if (this.formatOptions.onMdat) {
				const { data, start } = this.writer.stopTrackingWrites();
				this.formatOptions.onMdat(data, start);
			}
			const movieBox = moov(this);
			if (this.fastStart === "reserve") {
				assert(this.ftypSize !== null);
				this.writer.seek(this.ftypSize);
				if (this.formatOptions.onMoov) this.writer.startTrackingWrites();
				this.boxWriter.writeBox(movieBox);
				const remainingSpace = this.boxWriter.offsets.get(this.mdat) - this.writer.getPos();
				this.boxWriter.writeBox(free(remainingSpace));
			} else {
				if (this.formatOptions.onMoov) this.writer.startTrackingWrites();
				this.boxWriter.writeBox(movieBox);
			}
			if (this.formatOptions.onMoov) {
				const { data, start } = this.writer.stopTrackingWrites();
				this.formatOptions.onMoov(data, start);
			}
		}
		release();
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/matroska/matroska-muxer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var MIN_CLUSTER_TIMESTAMP_MS = -(2 ** 15);
var MAX_CLUSTER_TIMESTAMP_MS = 2 ** 15 - 1;
var APP_NAME = "Mediabunny";
var SEGMENT_SIZE_BYTES = 6;
var CLUSTER_SIZE_BYTES = 5;
var TRACK_TYPE_MAP = {
	video: 1,
	audio: 2,
	subtitle: 17
};
var MatroskaMuxer = class extends Muxer {
	constructor(output, format) {
		super(output);
		this.trackDatas = [];
		this.allTracksKnown = promiseWithResolvers();
		this.segment = null;
		this.segmentInfo = null;
		this.seekHead = null;
		this.tracksElement = null;
		this.tagsElement = null;
		this.attachmentsElement = null;
		this.segmentDuration = null;
		this.cues = null;
		this.currentCluster = null;
		this.currentClusterStartMsTimestamp = null;
		this.currentClusterMaxMsTimestamp = null;
		this.trackDatasInCurrentCluster = /* @__PURE__ */ new Map();
		this.startTimestamp = Infinity;
		this.endTimestamp = -Infinity;
		this.warnedAboutTooNegativeTimestamp = false;
		this.format = format;
	}
	async start() {
		const release = await this.mutex.acquire();
		this.writer = await this.output._getRootWriter(!!this.format._options.appendOnly);
		this.ebmlWriter = new EBMLWriter(this.writer);
		this.writeEBMLHeader();
		this.createSegmentInfo();
		this.createCues();
		await this.writer.flush();
		for (const track of this.output.tracks) if (track.isVideoTrack() && track.metadata.decoderConfig) this.getVideoTrackData(track, track.metadata.primingPacket ?? null, { decoderConfig: track.metadata.decoderConfig });
		else if (track.isAudioTrack() && track.metadata.decoderConfig) this.getAudioTrackData(track, track.metadata.primingPacket ?? null, { decoderConfig: track.metadata.decoderConfig });
		release();
	}
	writeEBMLHeader() {
		if (this.format._options.onEbmlHeader) this.writer.startTrackingWrites();
		const ebmlHeader = {
			id: EBMLId.EBML,
			data: [
				{
					id: EBMLId.EBMLVersion,
					data: 1
				},
				{
					id: EBMLId.EBMLReadVersion,
					data: 1
				},
				{
					id: EBMLId.EBMLMaxIDLength,
					data: 4
				},
				{
					id: EBMLId.EBMLMaxSizeLength,
					data: 8
				},
				{
					id: EBMLId.DocType,
					data: this.format instanceof WebMOutputFormat ? "webm" : "matroska"
				},
				{
					id: EBMLId.DocTypeVersion,
					data: 2
				},
				{
					id: EBMLId.DocTypeReadVersion,
					data: 2
				}
			]
		};
		this.ebmlWriter.writeEBML(ebmlHeader);
		if (this.format._options.onEbmlHeader) {
			const { data, start } = this.writer.stopTrackingWrites();
			this.format._options.onEbmlHeader(data, start);
		}
	}
	/**
	* Creates a SeekHead element which is positioned near the start of the file and allows the media player to seek to
	* relevant sections more easily. Since we don't know the positions of those sections yet, we'll set them later.
	*/
	maybeCreateSeekHead(writeOffsets) {
		if (this.format._options.appendOnly) return;
		const kaxCues = new Uint8Array([
			28,
			83,
			187,
			107
		]);
		const kaxInfo = new Uint8Array([
			21,
			73,
			169,
			102
		]);
		const kaxTracks = new Uint8Array([
			22,
			84,
			174,
			107
		]);
		const kaxAttachments = new Uint8Array([
			25,
			65,
			164,
			105
		]);
		const kaxTags = new Uint8Array([
			18,
			84,
			195,
			103
		]);
		const seekHead = {
			id: EBMLId.SeekHead,
			data: [
				{
					id: EBMLId.Seek,
					data: [{
						id: EBMLId.SeekID,
						data: kaxCues
					}, {
						id: EBMLId.SeekPosition,
						size: 5,
						data: writeOffsets ? this.ebmlWriter.offsets.get(this.cues) - this.segmentDataOffset : 0
					}]
				},
				{
					id: EBMLId.Seek,
					data: [{
						id: EBMLId.SeekID,
						data: kaxInfo
					}, {
						id: EBMLId.SeekPosition,
						size: 5,
						data: writeOffsets ? this.ebmlWriter.offsets.get(this.segmentInfo) - this.segmentDataOffset : 0
					}]
				},
				{
					id: EBMLId.Seek,
					data: [{
						id: EBMLId.SeekID,
						data: kaxTracks
					}, {
						id: EBMLId.SeekPosition,
						size: 5,
						data: writeOffsets ? this.ebmlWriter.offsets.get(this.tracksElement) - this.segmentDataOffset : 0
					}]
				},
				this.attachmentsElement ? {
					id: EBMLId.Seek,
					data: [{
						id: EBMLId.SeekID,
						data: kaxAttachments
					}, {
						id: EBMLId.SeekPosition,
						size: 5,
						data: writeOffsets ? this.ebmlWriter.offsets.get(this.attachmentsElement) - this.segmentDataOffset : 0
					}]
				} : null,
				this.tagsElement ? {
					id: EBMLId.Seek,
					data: [{
						id: EBMLId.SeekID,
						data: kaxTags
					}, {
						id: EBMLId.SeekPosition,
						size: 5,
						data: writeOffsets ? this.ebmlWriter.offsets.get(this.tagsElement) - this.segmentDataOffset : 0
					}]
				} : null
			]
		};
		this.seekHead = seekHead;
	}
	createSegmentInfo() {
		const segmentDuration = {
			id: EBMLId.Duration,
			data: new EBMLFloat64(0)
		};
		this.segmentDuration = segmentDuration;
		const segmentInfo = {
			id: EBMLId.Info,
			data: [
				{
					id: EBMLId.TimestampScale,
					data: 1e6
				},
				{
					id: EBMLId.MuxingApp,
					data: APP_NAME
				},
				{
					id: EBMLId.WritingApp,
					data: APP_NAME
				},
				!this.format._options.appendOnly ? segmentDuration : null
			]
		};
		this.segmentInfo = segmentInfo;
	}
	createTracks() {
		const tracksElement = {
			id: EBMLId.Tracks,
			data: []
		};
		this.tracksElement = tracksElement;
		for (const trackData of this.trackDatas) {
			let codecId = CODEC_STRING_MAP[trackData.track.source._codec];
			assert(codecId);
			if (trackData.type === "audio" && trackData.track.source._codec === "dts") {
				if (trackData.info.decoderConfig.codec === "dtse") codecId = "A_DTS/EXPRESS";
				else if (trackData.info.decoderConfig.codec === "dtsl") codecId = "A_DTS/LOSSLESS";
			}
			let seekPreRollNs = 0;
			if (trackData.type === "audio" && trackData.track.source._codec === "opus") {
				seekPreRollNs = 8e7;
				const description = trackData.info.decoderConfig.description;
				if (description) {
					const bytes = toUint8Array(description);
					const header = parseOpusIdentificationHeader(bytes);
					seekPreRollNs = Math.round(1e9 * (header.preSkip / OPUS_SAMPLE_RATE));
				}
			}
			tracksElement.data.push({
				id: EBMLId.TrackEntry,
				data: [
					{
						id: EBMLId.TrackNumber,
						data: trackData.track.id
					},
					{
						id: EBMLId.TrackUID,
						data: trackData.track.id
					},
					{
						id: EBMLId.TrackType,
						data: TRACK_TYPE_MAP[trackData.type]
					},
					trackData.track.metadata.disposition?.default === false ? {
						id: EBMLId.FlagDefault,
						data: 0
					} : null,
					trackData.track.metadata.disposition?.forced ? {
						id: EBMLId.FlagForced,
						data: 1
					} : null,
					trackData.track.metadata.disposition?.hearingImpaired ? {
						id: EBMLId.FlagHearingImpaired,
						data: 1
					} : null,
					trackData.track.metadata.disposition?.visuallyImpaired ? {
						id: EBMLId.FlagVisualImpaired,
						data: 1
					} : null,
					trackData.track.metadata.disposition?.original ? {
						id: EBMLId.FlagOriginal,
						data: 1
					} : null,
					trackData.track.metadata.disposition?.commentary ? {
						id: EBMLId.FlagCommentary,
						data: 1
					} : null,
					{
						id: EBMLId.FlagLacing,
						data: 0
					},
					{
						id: EBMLId.Language,
						data: trackData.track.metadata.languageCode ?? "und"
					},
					{
						id: EBMLId.CodecID,
						data: codecId
					},
					trackData.codecPrivate ? {
						id: EBMLId.CodecPrivate,
						data: toUint8Array(trackData.codecPrivate)
					} : null,
					{
						id: EBMLId.CodecDelay,
						data: 0
					},
					{
						id: EBMLId.SeekPreRoll,
						data: seekPreRollNs
					},
					trackData.track.metadata.name !== void 0 ? {
						id: EBMLId.Name,
						data: new EBMLUnicodeString(trackData.track.metadata.name)
					} : null,
					trackData.type === "video" ? this.videoSpecificTrackInfo(trackData) : null,
					trackData.type === "audio" ? this.audioSpecificTrackInfo(trackData) : null,
					trackData.type === "subtitle" ? this.subtitleSpecificTrackInfo(trackData) : null
				]
			});
		}
	}
	videoSpecificTrackInfo(trackData) {
		const { frameRate, rotation } = trackData.track.metadata;
		const elements = [frameRate ? {
			id: EBMLId.DefaultDuration,
			data: 1e9 / frameRate
		} : null];
		const flippedRotation = rotation ? normalizeRotation(-rotation) : 0;
		const hasNonSquarePixelAspectRatio = !!trackData.info.aspectRatio && trackData.info.aspectRatio.num * trackData.info.height !== trackData.info.aspectRatio.den * trackData.info.width;
		const colorSpace = trackData.info.decoderConfig.colorSpace;
		const videoElement = {
			id: EBMLId.Video,
			data: [
				{
					id: EBMLId.PixelWidth,
					data: trackData.info.width
				},
				{
					id: EBMLId.PixelHeight,
					data: trackData.info.height
				},
				hasNonSquarePixelAspectRatio ? {
					id: EBMLId.DisplayWidth,
					data: trackData.info.aspectRatio.num
				} : null,
				hasNonSquarePixelAspectRatio ? {
					id: EBMLId.DisplayHeight,
					data: trackData.info.aspectRatio.den
				} : null,
				hasNonSquarePixelAspectRatio ? {
					id: EBMLId.DisplayUnit,
					data: 3
				} : null,
				trackData.info.alphaMode ? {
					id: EBMLId.AlphaMode,
					data: 1
				} : null,
				colorSpaceIsEmpty(colorSpace) ? null : {
					id: EBMLId.Colour,
					data: [
						{
							id: EBMLId.MatrixCoefficients,
							data: colorSpace?.matrix != null ? MATRIX_COEFFICIENTS_MAP[colorSpace.matrix] : 2
						},
						{
							id: EBMLId.TransferCharacteristics,
							data: colorSpace?.transfer != null ? TRANSFER_CHARACTERISTICS_MAP[colorSpace.transfer] : 2
						},
						{
							id: EBMLId.Primaries,
							data: colorSpace?.primaries != null ? COLOR_PRIMARIES_MAP[colorSpace.primaries] : 2
						},
						{
							id: EBMLId.Range,
							data: colorSpace?.fullRange != null ? colorSpace.fullRange ? 2 : 1 : 0
						}
					]
				},
				flippedRotation ? {
					id: EBMLId.Projection,
					data: [{
						id: EBMLId.ProjectionType,
						data: 0
					}, {
						id: EBMLId.ProjectionPoseRoll,
						data: new EBMLFloat32((flippedRotation + 180) % 360 - 180)
					}]
				} : null
			]
		};
		elements.push(videoElement);
		return elements;
	}
	audioSpecificTrackInfo(trackData) {
		const pcmInfo = PCM_AUDIO_CODECS.includes(trackData.track.source._codec) ? parsePcmCodec(trackData.track.source._codec) : null;
		return [{
			id: EBMLId.Audio,
			data: [
				{
					id: EBMLId.SamplingFrequency,
					data: new EBMLFloat32(trackData.info.sampleRate)
				},
				{
					id: EBMLId.Channels,
					data: trackData.info.numberOfChannels
				},
				pcmInfo ? {
					id: EBMLId.BitDepth,
					data: 8 * pcmInfo.sampleSize
				} : null
			]
		}];
	}
	subtitleSpecificTrackInfo(trackData) {
		return [];
	}
	maybeCreateTags() {
		const simpleTags = [];
		const addSimpleTag = (key, value) => {
			simpleTags.push({
				id: EBMLId.SimpleTag,
				data: [{
					id: EBMLId.TagName,
					data: new EBMLUnicodeString(key)
				}, typeof value === "string" ? {
					id: EBMLId.TagString,
					data: new EBMLUnicodeString(value)
				} : {
					id: EBMLId.TagBinary,
					data: value
				}]
			});
		};
		const metadataTags = this.output._metadataTags;
		const writtenTags = /* @__PURE__ */ new Set();
		for (const { key, value } of keyValueIterator(metadataTags)) switch (key) {
			case "title":
				addSimpleTag("TITLE", value);
				writtenTags.add("TITLE");
				break;
			case "description":
				addSimpleTag("DESCRIPTION", value);
				writtenTags.add("DESCRIPTION");
				break;
			case "artist":
				addSimpleTag("ARTIST", value);
				writtenTags.add("ARTIST");
				break;
			case "album":
				addSimpleTag("ALBUM", value);
				writtenTags.add("ALBUM");
				break;
			case "albumArtist":
				addSimpleTag("ALBUM_ARTIST", value);
				writtenTags.add("ALBUM_ARTIST");
				break;
			case "genre":
				addSimpleTag("GENRE", value);
				writtenTags.add("GENRE");
				break;
			case "comment":
				addSimpleTag("COMMENT", value);
				writtenTags.add("COMMENT");
				break;
			case "lyrics":
				addSimpleTag("LYRICS", value);
				writtenTags.add("LYRICS");
				break;
			case "date":
				addSimpleTag("DATE", value.toISOString().slice(0, 10));
				writtenTags.add("DATE");
				break;
			case "trackNumber":
				addSimpleTag("PART_NUMBER", metadataTags.tracksTotal !== void 0 ? `${value}/${metadataTags.tracksTotal}` : value.toString());
				writtenTags.add("PART_NUMBER");
				break;
			case "discNumber":
				addSimpleTag("DISC", metadataTags.discsTotal !== void 0 ? `${value}/${metadataTags.discsTotal}` : value.toString());
				writtenTags.add("DISC");
				break;
			case "tracksTotal":
			case "discsTotal": break;
			case "images":
			case "raw": break;
			default: assertNever(key);
		}
		if (metadataTags.raw) for (const key in metadataTags.raw) {
			const value = metadataTags.raw[key];
			if (value == null || writtenTags.has(key)) continue;
			if (typeof value === "string" || value instanceof Uint8Array) addSimpleTag(key, value);
		}
		if (simpleTags.length === 0) return;
		this.tagsElement = {
			id: EBMLId.Tags,
			data: [{
				id: EBMLId.Tag,
				data: [{
					id: EBMLId.Targets,
					data: [{
						id: EBMLId.TargetTypeValue,
						data: 50
					}, {
						id: EBMLId.TargetType,
						data: "MOVIE"
					}]
				}, ...simpleTags]
			}]
		};
	}
	maybeCreateAttachments() {
		const metadataTags = this.output._metadataTags;
		const elements = [];
		const existingFileUids = /* @__PURE__ */ new Set();
		const images = metadataTags.images ?? [];
		for (const image of images) {
			let imageName = image.name;
			if (imageName === void 0) imageName = (image.kind === "coverFront" ? "cover" : image.kind === "coverBack" ? "back" : "image") + (imageMimeTypeToExtension(image.mimeType) ?? "");
			let fileUid;
			while (true) {
				fileUid = 0n;
				for (let i = 0; i < 8; i++) {
					fileUid <<= 8n;
					fileUid |= BigInt(Math.floor(Math.random() * 256));
				}
				if (fileUid !== 0n && !existingFileUids.has(fileUid)) break;
			}
			existingFileUids.add(fileUid);
			elements.push({
				id: EBMLId.AttachedFile,
				data: [
					image.description !== void 0 ? {
						id: EBMLId.FileDescription,
						data: new EBMLUnicodeString(image.description)
					} : null,
					{
						id: EBMLId.FileName,
						data: new EBMLUnicodeString(imageName)
					},
					{
						id: EBMLId.FileMediaType,
						data: image.mimeType
					},
					{
						id: EBMLId.FileData,
						data: image.data
					},
					{
						id: EBMLId.FileUID,
						data: fileUid
					}
				]
			});
		}
		for (const [key, value] of Object.entries(metadataTags.raw ?? {})) {
			if (!(value instanceof AttachedFile)) continue;
			if (!/^\d+$/.test(key)) continue;
			if (images.find((x) => x.mimeType === value.mimeType && uint8ArraysAreEqual(x.data, value.data))) continue;
			elements.push({
				id: EBMLId.AttachedFile,
				data: [
					value.description !== void 0 ? {
						id: EBMLId.FileDescription,
						data: new EBMLUnicodeString(value.description)
					} : null,
					{
						id: EBMLId.FileName,
						data: new EBMLUnicodeString(value.name ?? "")
					},
					{
						id: EBMLId.FileMediaType,
						data: value.mimeType ?? ""
					},
					{
						id: EBMLId.FileData,
						data: value.data
					},
					{
						id: EBMLId.FileUID,
						data: BigInt(key)
					}
				]
			});
		}
		if (elements.length === 0) return;
		this.attachmentsElement = {
			id: EBMLId.Attachments,
			data: elements
		};
	}
	createSegment() {
		this.createTracks();
		this.maybeCreateTags();
		this.maybeCreateAttachments();
		this.maybeCreateSeekHead(false);
		const segment = {
			id: EBMLId.Segment,
			size: this.format._options.appendOnly ? -1 : SEGMENT_SIZE_BYTES,
			data: [
				this.seekHead,
				this.segmentInfo,
				this.tracksElement,
				this.attachmentsElement,
				this.tagsElement
			]
		};
		this.segment = segment;
		if (this.format._options.onSegmentHeader) this.writer.startTrackingWrites();
		this.ebmlWriter.writeEBML(segment);
		if (this.format._options.onSegmentHeader) {
			const { data, start } = this.writer.stopTrackingWrites();
			this.format._options.onSegmentHeader(data, start);
		}
	}
	createCues() {
		this.cues = {
			id: EBMLId.Cues,
			data: []
		};
	}
	get segmentDataOffset() {
		assert(this.segment);
		return this.ebmlWriter.dataOffsets.get(this.segment);
	}
	allTracksAreKnown() {
		for (const track of this.output.tracks) if (!track.source._closed && !this.trackDatas.some((x) => x.track === track)) return false;
		return true;
	}
	async getMimeType() {
		await this.allTracksKnown.promise;
		const codecStrings = this.trackDatas.map((trackData) => {
			if (trackData.type === "video") return trackData.info.decoderConfig.codec;
			else if (trackData.type === "audio") return trackData.info.decoderConfig.codec;
			else return { webvtt: "wvtt" }[trackData.track.source._codec];
		});
		return buildMatroskaMimeType({
			isWebM: this.format instanceof WebMOutputFormat,
			hasVideo: this.trackDatas.some((x) => x.type === "video"),
			hasAudio: this.trackDatas.some((x) => x.type === "audio"),
			codecStrings
		});
	}
	getVideoTrackData(track, packet, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateVideoChunkMetadata(meta, track.source._codec);
		assert(meta);
		assert(meta.decoderConfig);
		assert(meta.decoderConfig.codedWidth !== void 0);
		assert(meta.decoderConfig.codedHeight !== void 0);
		const displayAspectWidth = meta.decoderConfig.displayAspectWidth;
		const displayAspectHeight = meta.decoderConfig.displayAspectHeight;
		const aspectRatio = displayAspectWidth === void 0 || displayAspectHeight === void 0 ? null : simplifyRational({
			num: displayAspectWidth,
			den: displayAspectHeight
		});
		const newTrackData = {
			track,
			type: "video",
			info: {
				width: meta.decoderConfig.codedWidth,
				height: meta.decoderConfig.codedHeight,
				aspectRatio,
				decoderConfig: meta.decoderConfig,
				alphaMode: packet ? !!packet.sideData.alpha : null
			},
			chunkQueue: [],
			lastWrittenMsTimestamp: null,
			codecPrivate: meta.decoderConfig.description ?? null,
			closed: false
		};
		if (track.source._codec === "vp9") newTrackData.codecPrivate = new Uint8Array(generateVp9CodecConfigurationFromCodecString(newTrackData.info.decoderConfig.codec));
		else if (track.source._codec === "av1") newTrackData.codecPrivate = new Uint8Array(generateAv1CodecConfigurationFromCodecString(newTrackData.info.decoderConfig.codec));
		else if (track.source._codec === "prores") newTrackData.codecPrivate = textEncoder.encode(meta.decoderConfig.codec);
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	getAudioTrackData(track, packet, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateAudioChunkMetadata(meta, track.source._codec);
		assert(meta);
		assert(meta.decoderConfig);
		const decoderConfig = { ...meta.decoderConfig };
		let requiresAdtsStripping = false;
		if (track.source._codec === "aac" && !decoderConfig.description) {
			if (!packet) throw new Error("No AAC description provided; you must therefore provide a priming packet.");
			const adtsFrame = readAdtsFrameHeader(FileSlice.tempFromBytes(packet.data));
			if (!adtsFrame) throw new Error("Couldn't parse ADTS header from the AAC packet. Make sure the packets are in ADTS format (as specified in ISO 13818-7) when not providing a description, or provide a description (must be an AudioSpecificConfig as specified in ISO 14496-3) and ensure the packets are raw AAC data.");
			const sampleRate = aacFrequencyTable[adtsFrame.samplingFrequencyIndex];
			const numberOfChannels = aacChannelMap[adtsFrame.channelConfiguration];
			if (sampleRate === void 0 || numberOfChannels === void 0) throw new Error("Invalid ADTS frame header.");
			decoderConfig.description = buildAacAudioSpecificConfig({
				objectType: adtsFrame.objectType,
				outputSampleRate: sampleRate,
				outputNumberOfChannels: numberOfChannels
			});
			requiresAdtsStripping = true;
		}
		const newTrackData = {
			track,
			type: "audio",
			info: {
				numberOfChannels: meta.decoderConfig.numberOfChannels,
				sampleRate: meta.decoderConfig.sampleRate,
				decoderConfig,
				requiresAdtsStripping
			},
			chunkQueue: [],
			lastWrittenMsTimestamp: null,
			codecPrivate: decoderConfig.description ?? null,
			closed: false
		};
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	getSubtitleTrackData(track, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateSubtitleMetadata(meta);
		assert(meta);
		assert(meta.config);
		const newTrackData = {
			track,
			type: "subtitle",
			info: { config: meta.config },
			chunkQueue: [],
			lastWrittenMsTimestamp: null,
			codecPrivate: textEncoder.encode(meta.config.description),
			closed: false
		};
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	async addEncodedVideoPacket(track, packet, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getVideoTrackData(track, packet, meta);
			trackData.info.alphaMode ??= !!packet.sideData.alpha;
			let packetData = packet.data;
			if (track.source._codec === "prores") {
				if (packetData.byteLength < 8) throw new Error("ProRes packet too small, expected at least 8 bytes.");
				packetData = packetData.subarray(8);
			}
			const isKeyFrame = packet.type === "key";
			this.validateTimestamp(trackData.track, packet.timestamp, isKeyFrame);
			let timestamp = packet.timestamp;
			let duration = packet.duration;
			if (track.metadata.frameRate !== void 0) {
				timestamp = roundToDivisor(timestamp, track.metadata.frameRate);
				duration = roundToDivisor(duration, track.metadata.frameRate);
			}
			const additions = trackData.info.alphaMode ? packet.sideData.alpha ?? null : null;
			const videoChunk = this.createInternalChunk(packetData, timestamp, duration, packet.type, additions);
			if (track.source._codec === "vp9") this.fixVP9ColorSpace(trackData, videoChunk);
			trackData.chunkQueue.push(videoChunk);
			await this.interleaveChunks();
		} finally {
			release();
		}
	}
	async addEncodedAudioPacket(track, packet, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getAudioTrackData(track, packet, meta);
			let packetData = packet.data;
			if (trackData.info.requiresAdtsStripping) {
				const adtsFrame = readAdtsFrameHeader(FileSlice.tempFromBytes(packetData));
				if (!adtsFrame) throw new Error("Expected ADTS frame, didn't get one.");
				const headerLength = adtsFrame.crcCheck === null ? 7 : 9;
				packetData = packetData.subarray(headerLength);
			}
			const isKeyFrame = packet.type === "key";
			this.validateTimestamp(trackData.track, packet.timestamp, isKeyFrame);
			const audioChunk = this.createInternalChunk(packetData, packet.timestamp, packet.duration, packet.type);
			trackData.chunkQueue.push(audioChunk);
			await this.interleaveChunks();
		} finally {
			release();
		}
	}
	async addSubtitleCue(track, cue, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getSubtitleTrackData(track, meta);
			this.validateTimestamp(trackData.track, cue.timestamp, true);
			let bodyText = cue.text;
			const timestampMs = Math.round(cue.timestamp * 1e3);
			inlineTimestampRegex.lastIndex = 0;
			bodyText = bodyText.replace(inlineTimestampRegex, (match) => {
				return `<${formatSubtitleTimestamp(parseSubtitleTimestamp(match.slice(1, -1)) - timestampMs)}>`;
			});
			const body = textEncoder.encode(bodyText);
			const additions = `${cue.settings ?? ""}\n${cue.identifier ?? ""}\n${cue.notes ?? ""}`;
			const subtitleChunk = this.createInternalChunk(body, cue.timestamp, cue.duration, "key", additions.trim() ? textEncoder.encode(additions) : null);
			trackData.chunkQueue.push(subtitleChunk);
			await this.interleaveChunks();
		} finally {
			release();
		}
	}
	async interleaveChunks(isFinalCall = false) {
		if (!isFinalCall && !this.allTracksAreKnown()) return;
		outer: while (true) {
			let trackWithMinTimestamp = null;
			let minTimestamp = Infinity;
			for (const trackData of this.trackDatas) {
				if (!isFinalCall && trackData.chunkQueue.length === 0 && !trackData.closed) break outer;
				if (trackData.chunkQueue.length > 0 && trackData.chunkQueue[0].timestamp < minTimestamp) {
					trackWithMinTimestamp = trackData;
					minTimestamp = trackData.chunkQueue[0].timestamp;
				}
			}
			if (!trackWithMinTimestamp) break;
			const chunk = trackWithMinTimestamp.chunkQueue.shift();
			this.writeBlock(trackWithMinTimestamp, chunk);
		}
		if (!isFinalCall) await this.writer.flush();
	}
	/**
	* Due to [a bug in Chromium](https://bugs.chromium.org/p/chromium/issues/detail?id=1377842), VP9 streams often
	* lack color space information. This method patches in that information.
	*/
	fixVP9ColorSpace(trackData, chunk) {
		if (chunk.type !== "key") return;
		if (!trackData.info.decoderConfig.colorSpace || !trackData.info.decoderConfig.colorSpace.matrix) return;
		const bitstream = new Bitstream(chunk.data);
		bitstream.skipBits(2);
		const profileLowBit = bitstream.readBits(1);
		const profile = (bitstream.readBits(1) << 1) + profileLowBit;
		if (profile === 3) bitstream.skipBits(1);
		if (bitstream.readBits(1)) return;
		if (bitstream.readBits(1) !== 0) return;
		bitstream.skipBits(2);
		if (bitstream.readBits(24) !== 4817730) return;
		if (profile >= 2) bitstream.skipBits(1);
		const colorSpaceID = {
			rgb: 7,
			bt709: 2,
			bt470bg: 1,
			smpte170m: 3
		}[trackData.info.decoderConfig.colorSpace.matrix];
		writeBits(chunk.data, bitstream.pos, bitstream.pos + 3, colorSpaceID);
	}
	/** Converts a read-only external chunk into an internal one for easier use. */
	createInternalChunk(data, timestamp, duration, type, additions = null) {
		return {
			data,
			type,
			timestamp,
			duration,
			additions
		};
	}
	/** Writes a block containing media data to the file. */
	writeBlock(trackData, chunk) {
		if (!this.segment) this.createSegment();
		const msTimestamp = Math.round(1e3 * chunk.timestamp);
		const keyFrameQueuedEverywhere = this.trackDatas.every((otherTrackData) => {
			if (trackData === otherTrackData) return chunk.type === "key";
			const firstQueuedSample = otherTrackData.chunkQueue[0];
			if (firstQueuedSample) return firstQueuedSample.type === "key";
			return otherTrackData.closed;
		});
		let shouldCreateNewCluster = false;
		if (!this.currentCluster) shouldCreateNewCluster = true;
		else {
			assert(this.currentClusterStartMsTimestamp !== null);
			assert(this.currentClusterMaxMsTimestamp !== null);
			const relativeTimestamp = msTimestamp - this.currentClusterStartMsTimestamp;
			shouldCreateNewCluster = keyFrameQueuedEverywhere && msTimestamp > this.currentClusterMaxMsTimestamp && relativeTimestamp >= 1e3 * (this.format._options.minimumClusterDuration ?? 1) || relativeTimestamp > MAX_CLUSTER_TIMESTAMP_MS;
		}
		if (shouldCreateNewCluster) this.createNewCluster(msTimestamp);
		const relativeTimestamp = msTimestamp - this.currentClusterStartMsTimestamp;
		if (relativeTimestamp < MIN_CLUSTER_TIMESTAMP_MS) {
			if (!this.warnedAboutTooNegativeTimestamp) {
				const formatName = this.format instanceof WebMOutputFormat ? "WebM" : "Matroska";
				Logging._warn(`Packets had to be discarded because their timestamp is too negative to represent in ${formatName}.`);
				this.warnedAboutTooNegativeTimestamp = true;
			}
			return;
		}
		const prelude = /* @__PURE__ */ new Uint8Array(4);
		const view = new DataView(prelude.buffer);
		view.setUint8(0, 128 | trackData.track.id);
		view.setInt16(1, relativeTimestamp, false);
		const msDuration = Math.round(1e3 * chunk.duration);
		if (!(!!chunk.additions || trackData.type === "subtitle")) {
			view.setUint8(3, Number(chunk.type === "key") << 7);
			const simpleBlock = {
				id: EBMLId.SimpleBlock,
				data: [prelude, chunk.data]
			};
			this.ebmlWriter.writeEBML(simpleBlock);
		} else {
			const blockGroup = {
				id: EBMLId.BlockGroup,
				data: [
					{
						id: EBMLId.Block,
						data: [prelude, chunk.data]
					},
					chunk.type === "delta" ? {
						id: EBMLId.ReferenceBlock,
						data: new EBMLSignedInt(trackData.lastWrittenMsTimestamp - msTimestamp)
					} : null,
					chunk.additions ? {
						id: EBMLId.BlockAdditions,
						data: [{
							id: EBMLId.BlockMore,
							data: [{
								id: EBMLId.BlockAddID,
								data: 1
							}, {
								id: EBMLId.BlockAdditional,
								data: chunk.additions
							}]
						}]
					} : null,
					msDuration > 0 ? {
						id: EBMLId.BlockDuration,
						data: msDuration
					} : null
				]
			};
			this.ebmlWriter.writeEBML(blockGroup);
		}
		this.startTimestamp = Math.min(this.startTimestamp, msTimestamp);
		this.endTimestamp = Math.max(this.endTimestamp, msTimestamp + msDuration);
		trackData.lastWrittenMsTimestamp = msTimestamp;
		if (!this.trackDatasInCurrentCluster.has(trackData)) this.trackDatasInCurrentCluster.set(trackData, { firstMsTimestamp: msTimestamp });
		this.currentClusterMaxMsTimestamp = Math.max(this.currentClusterMaxMsTimestamp, msTimestamp);
	}
	/** Creates a new Cluster element to contain media chunks. */
	createNewCluster(msTimestamp) {
		msTimestamp = Math.max(0, msTimestamp);
		if (this.currentCluster) this.finalizeCurrentCluster();
		if (this.format._options.onCluster) this.writer.startTrackingWrites();
		this.currentCluster = {
			id: EBMLId.Cluster,
			size: this.format._options.appendOnly ? -1 : CLUSTER_SIZE_BYTES,
			data: [{
				id: EBMLId.Timestamp,
				data: msTimestamp
			}]
		};
		this.ebmlWriter.writeEBML(this.currentCluster);
		this.currentClusterStartMsTimestamp = msTimestamp;
		this.currentClusterMaxMsTimestamp = msTimestamp;
		this.trackDatasInCurrentCluster.clear();
	}
	finalizeCurrentCluster() {
		assert(this.currentCluster);
		if (!this.format._options.appendOnly) {
			const clusterSize = this.writer.getPos() - this.ebmlWriter.dataOffsets.get(this.currentCluster);
			const endPos = this.writer.getPos();
			this.writer.seek(this.ebmlWriter.offsets.get(this.currentCluster) + 4);
			this.ebmlWriter.writeVarInt(clusterSize, CLUSTER_SIZE_BYTES);
			this.writer.seek(endPos);
		}
		if (this.format._options.onCluster) {
			assert(this.currentClusterStartMsTimestamp !== null);
			const { data, start } = this.writer.stopTrackingWrites();
			this.format._options.onCluster(data, start, this.currentClusterStartMsTimestamp / 1e3);
		}
		const clusterOffsetFromSegment = this.ebmlWriter.offsets.get(this.currentCluster) - this.segmentDataOffset;
		const groupedByTimestamp = /* @__PURE__ */ new Map();
		for (const [trackData, { firstMsTimestamp }] of this.trackDatasInCurrentCluster) {
			if (!groupedByTimestamp.has(firstMsTimestamp)) groupedByTimestamp.set(firstMsTimestamp, []);
			groupedByTimestamp.get(firstMsTimestamp).push(trackData);
		}
		const groupedAndSortedByTimestamp = [...groupedByTimestamp.entries()].sort((a, b) => a[0] - b[0]);
		for (const [msTimestamp, trackDatas] of groupedAndSortedByTimestamp) {
			assert(this.cues);
			this.cues.data.push({
				id: EBMLId.CuePoint,
				data: [{
					id: EBMLId.CueTime,
					data: Math.max(0, msTimestamp)
				}, ...trackDatas.map((trackData) => {
					return {
						id: EBMLId.CueTrackPositions,
						data: [{
							id: EBMLId.CueTrack,
							data: trackData.track.id
						}, {
							id: EBMLId.CueClusterPosition,
							data: clusterOffsetFromSegment
						}]
					};
				})]
			});
		}
	}
	async onTrackClose(track) {
		const release = await this.mutex.acquire();
		const trackData = this.trackDatas.find((x) => x.track === track);
		if (trackData) trackData.closed = true;
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		await this.interleaveChunks();
		release();
	}
	/** Finalizes the file, making it ready for use. Must be called after all media chunks have been added. */
	async finalize() {
		const release = await this.mutex.acquire();
		this.allTracksKnown.resolve();
		for (const trackData of this.trackDatas) trackData.closed = true;
		if (!this.segment) this.createSegment();
		await this.interleaveChunks(true);
		if (this.currentCluster) this.finalizeCurrentCluster();
		assert(this.cues);
		this.ebmlWriter.writeEBML(this.cues);
		if (!this.format._options.appendOnly) {
			const segmentSize = this.writer.getPos() - this.segmentDataOffset;
			this.writer.seek(this.ebmlWriter.offsets.get(this.segment) + 4);
			this.ebmlWriter.writeVarInt(segmentSize, SEGMENT_SIZE_BYTES);
			const duration = this.startTimestamp === Infinity ? 0 : this.endTimestamp - this.startTimestamp;
			this.segmentDuration.data = new EBMLFloat64(duration);
			this.writer.seek(this.ebmlWriter.offsets.get(this.segmentDuration));
			this.ebmlWriter.writeEBML(this.segmentDuration);
			assert(this.seekHead);
			this.writer.seek(this.ebmlWriter.offsets.get(this.seekHead));
			this.maybeCreateSeekHead(true);
			this.ebmlWriter.writeEBML(this.seekHead);
		}
		release();
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/mp3/mp3-writer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var Mp3Writer = class {
	constructor(writer) {
		this.writer = writer;
		this.helper = /* @__PURE__ */ new Uint8Array(8);
		this.helperView = new DataView(this.helper.buffer);
	}
	writeU32(value) {
		this.helperView.setUint32(0, value, false);
		this.writer.write(this.helper.subarray(0, 4));
	}
	writeXingFrame(data) {
		const startPos = this.writer.getPos();
		const firstByte = 255;
		const secondByte = 224 | data.mpegVersionId << 3 | data.layer << 1;
		let lowSamplingFrequency;
		if (data.mpegVersionId & 2) lowSamplingFrequency = data.mpegVersionId & 1 ? 0 : 1;
		else lowSamplingFrequency = 1;
		const padding = 0;
		const neededBytes = 155;
		let bitrateIndex = -1;
		const bitrateOffset = lowSamplingFrequency * 16 * 4 + data.layer * 16;
		for (let i = 0; i < 16; i++) {
			const kbr = KILOBIT_RATES[bitrateOffset + i];
			if (computeMp3FrameSize(lowSamplingFrequency, data.layer, 1e3 * kbr, data.sampleRate, padding) >= neededBytes) {
				bitrateIndex = i;
				break;
			}
		}
		if (bitrateIndex === -1) throw new Error("No suitable bitrate found.");
		const thirdByte = bitrateIndex << 4 | data.frequencyIndex << 2 | 0;
		const fourthByte = data.channel << 6 | data.modeExtension << 4 | data.copyright << 3 | data.original << 2 | data.emphasis;
		this.helper[0] = firstByte;
		this.helper[1] = secondByte;
		this.helper[2] = thirdByte;
		this.helper[3] = fourthByte;
		this.writer.write(this.helper.subarray(0, 4));
		const xingOffset = getXingOffset(data.mpegVersionId, data.channel);
		this.writer.seek(startPos + xingOffset);
		this.writeU32(XING);
		let flags = 0;
		if (data.frameCount !== null) flags |= XingFlags.FrameCount;
		if (data.fileSize !== null) flags |= XingFlags.FileSize;
		if (data.toc !== null) flags |= XingFlags.Toc;
		this.writeU32(flags);
		this.writeU32(data.frameCount ?? 0);
		this.writeU32(data.fileSize ?? 0);
		this.writer.write(data.toc ?? /* @__PURE__ */ new Uint8Array(100));
		const kilobitRate = KILOBIT_RATES[bitrateOffset + bitrateIndex];
		const frameSize = computeMp3FrameSize(lowSamplingFrequency, data.layer, 1e3 * kilobitRate, data.sampleRate, padding);
		this.writer.write(new Uint8Array(startPos + frameSize - this.writer.getPos()));
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/mp3/mp3-muxer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var Mp3Muxer = class extends Muxer {
	constructor(output, format) {
		super(output);
		this.xingFrameData = null;
		this.frameCount = 0;
		this.framePositions = [];
		this.xingFramePos = null;
		this.format = format;
	}
	async start() {
		const release = await this.mutex.acquire();
		this.writer = await this.output._getRootWriter(this.format._options.xingHeader === false);
		this.mp3Writer = new Mp3Writer(this.writer);
		if (!metadataTagsAreEmpty(this.output._metadataTags)) new Id3V2Writer(this.writer).writeId3V2Tag(this.output._metadataTags);
		release();
	}
	async getMimeType() {
		return "audio/mpeg";
	}
	async addEncodedVideoPacket() {
		throw new Error("MP3 does not support video.");
	}
	async addEncodedAudioPacket(track, packet) {
		const release = await this.mutex.acquire();
		try {
			const writeXingHeader = this.format._options.xingHeader !== false;
			if (!this.xingFrameData && writeXingHeader) {
				const view = toDataView(packet.data);
				if (view.byteLength < 4) throw new Error("Invalid MP3 header in sample.");
				const word = view.getUint32(0, false);
				const header = readMp3FrameHeader(word, null).header;
				if (!header) throw new Error("Invalid MP3 header in sample.");
				const xingOffset = getXingOffset(header.mpegVersionId, header.channel);
				if (view.byteLength >= xingOffset + 4) {
					const word = view.getUint32(xingOffset, false);
					if (word === 1483304551 || word === 1231971951) return;
				}
				this.xingFrameData = {
					mpegVersionId: header.mpegVersionId,
					layer: header.layer,
					frequencyIndex: header.frequencyIndex,
					sampleRate: header.sampleRate,
					channel: header.channel,
					modeExtension: header.modeExtension,
					copyright: header.copyright,
					original: header.original,
					emphasis: header.emphasis,
					frameCount: null,
					fileSize: null,
					toc: null
				};
				this.xingFramePos = this.writer.getPos();
				this.mp3Writer.writeXingFrame(this.xingFrameData);
				this.frameCount++;
			}
			this.validateTimestamp(track, packet.timestamp, packet.type === "key");
			if (writeXingHeader) this.framePositions.push(this.writer.getPos());
			this.writer.write(packet.data);
			this.frameCount++;
			await this.writer.flush();
		} finally {
			release();
		}
	}
	async addSubtitleCue() {
		throw new Error("MP3 does not support subtitles.");
	}
	async finalize() {
		const release = await this.mutex.acquire();
		if (!this.xingFrameData && this.format._options.xingHeader === false) throw new Error("Cannot finalize an empty MP3 file: not a single packet was added and the Xing header is disabled, so there's no frame we could write.");
		if (!this.xingFrameData) {
			const track = this.output.tracks[0];
			assert(track?.isAudioTrack());
			const primingPacket = track.metadata.primingPacket;
			if (primingPacket) {
				const view = toDataView(primingPacket.data);
				if (view.byteLength < 4) throw new Error("Invalid MP3 header in priming packet.");
				const word = view.getUint32(0, false);
				const header = readMp3FrameHeader(word, null).header;
				if (!header) throw new Error("Invalid MP3 header in priming packet.");
				this.xingFrameData = {
					mpegVersionId: header.mpegVersionId,
					layer: header.layer,
					frequencyIndex: header.frequencyIndex,
					sampleRate: header.sampleRate,
					channel: header.channel,
					modeExtension: header.modeExtension,
					copyright: header.copyright,
					original: header.original,
					emphasis: header.emphasis,
					frameCount: null,
					fileSize: null,
					toc: null
				};
			} else if (track.metadata.decoderConfig) {
				const { sampleRate, numberOfChannels } = track.metadata.decoderConfig;
				const mpegVersionIds = [
					3,
					2,
					0
				];
				let mpegVersionId = null;
				let frequencyIndex = -1;
				for (let i = 0; i < mpegVersionIds.length; i++) {
					frequencyIndex = SAMPLING_RATES.indexOf(sampleRate << i);
					if (frequencyIndex !== -1) {
						mpegVersionId = mpegVersionIds[i];
						break;
					}
				}
				if (mpegVersionId === null) throw new Error(`${sampleRate} Hz is not a valid MP3 sample rate.`);
				this.xingFrameData = {
					mpegVersionId,
					layer: 1,
					frequencyIndex,
					sampleRate,
					channel: numberOfChannels === 1 ? 3 : 0,
					modeExtension: 0,
					copyright: 0,
					original: 0,
					emphasis: 0,
					frameCount: null,
					fileSize: null,
					toc: null
				};
			} else throw new Error("Cannot finalize an empty MP3 file: no packets were added and the track specified neither a decoderConfig nor a primingPacket in its metadata, so there's no telling what the file should look like.");
			this.xingFramePos = this.writer.getPos();
			this.mp3Writer.writeXingFrame(this.xingFrameData);
			this.frameCount++;
		}
		assert(this.xingFramePos !== null);
		const audioDataEndPos = this.writer.getPos() - this.xingFramePos;
		this.writer.seek(this.xingFramePos);
		if (this.framePositions.length > 0) {
			const toc = /* @__PURE__ */ new Uint8Array(100);
			for (let i = 0; i < 100; i++) {
				const index = Math.floor(this.framePositions.length * (i / 100));
				const byteOffset = this.framePositions[index] - this.xingFramePos;
				toc[i] = 256 * (byteOffset / audioDataEndPos);
			}
			this.xingFrameData.toc = toc;
		}
		this.xingFrameData.frameCount = this.frameCount;
		this.xingFrameData.fileSize = audioDataEndPos;
		if (this.format._options.onXingFrame) this.writer.startTrackingWrites();
		this.mp3Writer.writeXingFrame(this.xingFrameData);
		if (this.format._options.onXingFrame) {
			const { data, start } = this.writer.stopTrackingWrites();
			this.format._options.onXingFrame(data, start);
		}
		release();
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/ogg/ogg-muxer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var PAGE_SIZE_TARGET = 8192;
var OggMuxer = class extends Muxer {
	constructor(output, format) {
		super(output);
		this.trackDatas = [];
		this.bosPagesWritten = false;
		this.allTracksKnown = promiseWithResolvers();
		this.pageBytes = new Uint8Array(MAX_PAGE_SIZE);
		this.pageView = new DataView(this.pageBytes.buffer);
		this.format = format;
	}
	async start() {
		const release = await this.mutex.acquire();
		this.writer = await this.output._getRootWriter(true);
		for (const track of this.output.tracks) {
			assert(track.isAudioTrack());
			if (track.metadata.decoderConfig) this.getTrackData(track, { decoderConfig: track.metadata.decoderConfig });
		}
		release();
	}
	async getMimeType() {
		await this.allTracksKnown.promise;
		return buildOggMimeType({ codecStrings: this.trackDatas.map((x) => x.codecInfo.codec) });
	}
	addEncodedVideoPacket() {
		throw new Error("Video tracks are not supported.");
	}
	getTrackData(track, meta) {
		const existingTrackData = this.trackDatas.find((td) => td.track === track);
		if (existingTrackData) return existingTrackData;
		let serialNumber;
		do
			serialNumber = Math.floor(2 ** 32 * Math.random());
		while (this.trackDatas.some((td) => td.serialNumber === serialNumber));
		assert(track.source._codec === "vorbis" || track.source._codec === "opus");
		validateAudioChunkMetadata(meta, track.source._codec);
		assert(meta);
		assert(meta.decoderConfig);
		const newTrackData = {
			track,
			serialNumber,
			internalSampleRate: track.source._codec === "opus" ? OPUS_SAMPLE_RATE : meta.decoderConfig.sampleRate,
			codecInfo: {
				codec: track.source._codec,
				vorbisInfo: null,
				opusInfo: null
			},
			vorbisLastBlocksize: null,
			packetQueue: [],
			currentTimestampInSamples: 0,
			pagesWritten: 0,
			currentGranulePosition: 0,
			currentLacingValues: [],
			currentPageData: [],
			currentPageSize: 27,
			currentPageStartsWithFreshPacket: true,
			currentPageStartTimestampInSamples: 0,
			closed: false
		};
		this.queueHeaderPackets(newTrackData, meta);
		this.trackDatas.push(newTrackData);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	queueHeaderPackets(trackData, meta) {
		assert(meta.decoderConfig);
		if (trackData.track.source._codec === "vorbis") {
			assert(meta.decoderConfig.description);
			const bytes = toUint8Array(meta.decoderConfig.description);
			if (bytes[0] !== 2) throw new TypeError("First byte of Vorbis decoder description must be 2.");
			let pos = 1;
			const readPacketLength = () => {
				let length = 0;
				while (true) {
					const value = bytes[pos++];
					if (value === void 0) throw new TypeError("Vorbis decoder description is too short.");
					length += value;
					if (value < 255) return length;
				}
			};
			const identificationHeaderLength = readPacketLength();
			const commentHeaderLength = readPacketLength();
			if (bytes.length - pos <= 0) throw new TypeError("Vorbis decoder description is too short.");
			const identificationHeader = bytes.subarray(pos, pos += identificationHeaderLength);
			pos += commentHeaderLength;
			const setupHeader = bytes.subarray(pos);
			const commentHeaderHeader = /* @__PURE__ */ new Uint8Array(7);
			commentHeaderHeader[0] = 3;
			commentHeaderHeader[1] = 118;
			commentHeaderHeader[2] = 111;
			commentHeaderHeader[3] = 114;
			commentHeaderHeader[4] = 98;
			commentHeaderHeader[5] = 105;
			commentHeaderHeader[6] = 115;
			const commentHeader = createVorbisComments(commentHeaderHeader, this.output._metadataTags, true);
			trackData.packetQueue.push({
				data: identificationHeader,
				timestampInSamples: 0,
				durationInSamples: 0,
				forcePageFlush: true
			}, {
				data: commentHeader,
				timestampInSamples: 0,
				durationInSamples: 0,
				forcePageFlush: false
			}, {
				data: setupHeader,
				timestampInSamples: 0,
				durationInSamples: 0,
				forcePageFlush: true
			});
			const blockSizeByte = toDataView(identificationHeader).getUint8(28);
			trackData.codecInfo.vorbisInfo = {
				blocksizes: [1 << (blockSizeByte & 15), 1 << (blockSizeByte >> 4)],
				modeBlockflags: parseModesFromVorbisSetupPacket(setupHeader).modeBlockflags
			};
		} else if (trackData.track.source._codec === "opus") {
			if (!meta.decoderConfig.description) throw new TypeError("For Ogg, Opus decoder description is required.");
			const identificationHeader = toUint8Array(meta.decoderConfig.description);
			const commentHeaderHeader = /* @__PURE__ */ new Uint8Array(8);
			const commentHeaderHeaderView = toDataView(commentHeaderHeader);
			commentHeaderHeaderView.setUint32(0, 1332770163, false);
			commentHeaderHeaderView.setUint32(4, 1415669619, false);
			const commentHeader = createVorbisComments(commentHeaderHeader, this.output._metadataTags, true);
			trackData.packetQueue.push({
				data: identificationHeader,
				timestampInSamples: 0,
				durationInSamples: 0,
				forcePageFlush: true
			}, {
				data: commentHeader,
				timestampInSamples: 0,
				durationInSamples: 0,
				forcePageFlush: true
			});
			trackData.codecInfo.opusInfo = { preSkip: parseOpusIdentificationHeader(identificationHeader).preSkip };
		}
	}
	async addEncodedAudioPacket(track, packet, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getTrackData(track, meta);
			this.validateTimestamp(trackData.track, packet.timestamp, packet.type === "key");
			const currentTimestampInSamples = trackData.currentTimestampInSamples;
			const { durationInSamples, vorbisBlockSize } = extractSampleMetadata(packet.data, trackData.codecInfo, trackData.vorbisLastBlocksize);
			trackData.currentTimestampInSamples += durationInSamples;
			trackData.vorbisLastBlocksize = vorbisBlockSize;
			trackData.packetQueue.push({
				data: packet.data,
				timestampInSamples: currentTimestampInSamples,
				durationInSamples,
				forcePageFlush: false
			});
			await this.interleavePages();
		} finally {
			release();
		}
	}
	addSubtitleCue() {
		throw new Error("Subtitle tracks are not supported.");
	}
	allTracksAreKnown() {
		for (const track of this.output.tracks) if (!track.source._closed && !this.trackDatas.some((x) => x.track === track)) return false;
		return true;
	}
	async interleavePages(isFinalCall = false) {
		if (!this.bosPagesWritten) {
			if (!this.allTracksAreKnown() && !isFinalCall) return;
			for (const trackData of this.trackDatas) while (trackData.packetQueue.length > 0) {
				const packet = trackData.packetQueue.shift();
				this.writePacket(trackData, packet, false);
				if (packet.forcePageFlush) break;
			}
			this.bosPagesWritten = true;
		}
		outer: while (true) {
			let trackWithMinTimestamp = null;
			let minTimestamp = Infinity;
			for (const trackData of this.trackDatas) {
				if (!isFinalCall && trackData.packetQueue.length <= 1 && !trackData.closed) break outer;
				if (trackData.packetQueue.length > 0 && trackData.packetQueue[0].timestampInSamples < minTimestamp) {
					trackWithMinTimestamp = trackData;
					minTimestamp = trackData.packetQueue[0].timestampInSamples;
				}
			}
			if (!trackWithMinTimestamp) break;
			const packet = trackWithMinTimestamp.packetQueue.shift();
			const isFinalPacket = trackWithMinTimestamp.packetQueue.length === 0;
			this.writePacket(trackWithMinTimestamp, packet, isFinalPacket);
		}
		if (!isFinalCall) await this.writer.flush();
	}
	writePacket(trackData, packet, isFinalPacket) {
		const packetEndTimestampInSamples = packet.timestampInSamples + packet.durationInSamples;
		if (this.format._options.maximumPageDuration !== void 0) {
			const maxDurationInSamples = this.format._options.maximumPageDuration * trackData.internalSampleRate;
			if (trackData.currentLacingValues.length > 0 && packetEndTimestampInSamples - trackData.currentPageStartTimestampInSamples > maxDurationInSamples) this.writePage(trackData, false);
		}
		let remainingLength = packet.data.length;
		let dataStartOffset = 0;
		let dataOffset = 0;
		while (true) {
			if (trackData.currentLacingValues.length === 0 && dataStartOffset > 0) trackData.currentPageStartsWithFreshPacket = false;
			const segmentSize = Math.min(255, remainingLength);
			trackData.currentLacingValues.push(segmentSize);
			trackData.currentPageSize++;
			dataOffset += segmentSize;
			const segmentIsLastOfPacket = remainingLength < 255;
			if (trackData.currentLacingValues.length === 255) {
				const slice = packet.data.subarray(dataStartOffset, dataOffset);
				dataStartOffset = dataOffset;
				trackData.currentPageData.push(slice);
				trackData.currentPageSize += slice.length;
				this.writePage(trackData, isFinalPacket && segmentIsLastOfPacket);
				if (segmentIsLastOfPacket) return;
			}
			if (segmentIsLastOfPacket) break;
			remainingLength -= 255;
		}
		const slice = packet.data.subarray(dataStartOffset);
		trackData.currentPageData.push(slice);
		trackData.currentPageSize += slice.length;
		trackData.currentGranulePosition = packetEndTimestampInSamples;
		if (trackData.currentPageSize >= PAGE_SIZE_TARGET || packet.forcePageFlush) this.writePage(trackData, isFinalPacket);
	}
	writePage(trackData, isEos) {
		this.pageView.setUint32(0, OGGS, true);
		this.pageView.setUint8(4, 0);
		let headerType = 0;
		if (!trackData.currentPageStartsWithFreshPacket) headerType |= 1;
		if (trackData.pagesWritten === 0) headerType |= 2;
		if (isEos) headerType |= 4;
		this.pageView.setUint8(5, headerType);
		const granulePosition = trackData.currentLacingValues.every((x) => x === 255) ? -1 : trackData.currentGranulePosition;
		setInt64(this.pageView, 6, granulePosition, true);
		this.pageView.setUint32(14, trackData.serialNumber, true);
		this.pageView.setUint32(18, trackData.pagesWritten, true);
		this.pageView.setUint32(22, 0, true);
		this.pageView.setUint8(26, trackData.currentLacingValues.length);
		this.pageBytes.set(trackData.currentLacingValues, 27);
		let pos = 27 + trackData.currentLacingValues.length;
		for (const data of trackData.currentPageData) {
			this.pageBytes.set(data, pos);
			pos += data.length;
		}
		const slice = this.pageBytes.subarray(0, pos);
		const crc = computeOggPageCrc(slice);
		this.pageView.setUint32(22, crc, true);
		trackData.pagesWritten++;
		trackData.currentLacingValues.length = 0;
		trackData.currentPageData.length = 0;
		trackData.currentPageSize = 27;
		trackData.currentPageStartsWithFreshPacket = true;
		trackData.currentPageStartTimestampInSamples = trackData.currentGranulePosition;
		if (this.format._options.onPage) this.writer.startTrackingWrites();
		this.writer.write(slice);
		if (this.format._options.onPage) {
			const { data, start } = this.writer.stopTrackingWrites();
			this.format._options.onPage(data, start, trackData.track.source);
		}
	}
	async onTrackClose(track) {
		const release = await this.mutex.acquire();
		const trackData = this.trackDatas.find((x) => x.track === track);
		if (trackData) trackData.closed = true;
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		await this.interleavePages();
		release();
	}
	async finalize() {
		const release = await this.mutex.acquire();
		this.allTracksKnown.resolve();
		for (const trackData of this.trackDatas) trackData.closed = true;
		await this.interleavePages(true);
		for (const trackData of this.trackDatas) if (trackData.currentLacingValues.length > 0) this.writePage(trackData, true);
		release();
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/wave/riff-writer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var RiffWriter = class {
	constructor(writer) {
		this.writer = writer;
		this.helper = /* @__PURE__ */ new Uint8Array(8);
		this.helperView = new DataView(this.helper.buffer);
	}
	writeU16(value) {
		this.helperView.setUint16(0, value, true);
		this.writer.write(this.helper.subarray(0, 2));
	}
	writeU32(value) {
		this.helperView.setUint32(0, value, true);
		this.writer.write(this.helper.subarray(0, 4));
	}
	writeU64(value) {
		this.helperView.setUint32(0, value, true);
		this.helperView.setUint32(4, Math.floor(value / 2 ** 32), true);
		this.writer.write(this.helper);
	}
	writeAscii(text) {
		this.writer.write(new TextEncoder().encode(text));
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/wave/wave-muxer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var WaveMuxer = class extends Muxer {
	constructor(output, format) {
		super(output);
		this.headerWritten = false;
		this.dataSize = 0;
		this.sampleRate = null;
		this.sampleCount = 0;
		this.riffSizePos = null;
		this.dataSizePos = null;
		this.ds64RiffSizePos = null;
		this.ds64DataSizePos = null;
		this.ds64SampleCountPos = null;
		this.format = format;
		this.isRf64 = !!format._options.large;
	}
	async start() {
		const release = await this.mutex.acquire();
		this.writer = await this.output._getRootWriter(false);
		this.riffWriter = new RiffWriter(this.writer);
		const track = this.output.tracks[0];
		assert(track?.isAudioTrack());
		if (track.metadata.decoderConfig) {
			validateAudioChunkMetadata({ decoderConfig: track.metadata.decoderConfig }, track.source._codec);
			this.writeHeader(track, track.metadata.decoderConfig);
			this.sampleRate = track.metadata.decoderConfig.sampleRate;
			this.headerWritten = true;
		}
		release();
	}
	async getMimeType() {
		return "audio/wav";
	}
	async addEncodedVideoPacket() {
		throw new Error("WAVE does not support video.");
	}
	async addEncodedAudioPacket(track, packet, meta) {
		const release = await this.mutex.acquire();
		try {
			if (!this.headerWritten) {
				validateAudioChunkMetadata(meta, track.source._codec);
				assert(meta);
				assert(meta.decoderConfig);
				this.writeHeader(track, meta.decoderConfig);
				this.sampleRate = meta.decoderConfig.sampleRate;
				this.headerWritten = true;
			}
			this.validateTimestamp(track, packet.timestamp, packet.type === "key");
			if (!this.isRf64 && this.writer.getPos() + packet.data.byteLength >= 2 ** 32) throw new Error("Adding more audio data would exceed the maximum RIFF size of 4 GiB. To write larger files, use RF64 by setting `large: true` in the WavOutputFormatOptions.");
			this.writer.write(packet.data);
			this.dataSize += packet.data.byteLength;
			this.sampleCount += Math.round(packet.duration * this.sampleRate);
			await this.writer.flush();
		} finally {
			release();
		}
	}
	async addSubtitleCue() {
		throw new Error("WAVE does not support subtitles.");
	}
	writeHeader(track, config) {
		if (this.format._options.onHeader) this.writer.startTrackingWrites();
		let format;
		const codec = track.source._codec;
		const pcmInfo = parsePcmCodec(codec);
		if (pcmInfo.dataType === "ulaw") format = WaveFormat.MULAW;
		else if (pcmInfo.dataType === "alaw") format = WaveFormat.ALAW;
		else if (pcmInfo.dataType === "float") format = WaveFormat.IEEE_FLOAT;
		else format = WaveFormat.PCM;
		const channels = config.numberOfChannels;
		const sampleRate = config.sampleRate;
		const blockSize = pcmInfo.sampleSize * channels;
		this.riffWriter.writeAscii(this.isRf64 ? "RF64" : "RIFF");
		if (this.isRf64) this.riffWriter.writeU32(4294967295);
		else {
			this.riffSizePos = this.writer.getPos();
			this.riffWriter.writeU32(0);
		}
		this.riffWriter.writeAscii("WAVE");
		if (this.isRf64) {
			this.riffWriter.writeAscii("ds64");
			this.riffWriter.writeU32(28);
			this.ds64RiffSizePos = this.writer.getPos();
			this.riffWriter.writeU64(0);
			this.ds64DataSizePos = this.writer.getPos();
			this.riffWriter.writeU64(0);
			this.ds64SampleCountPos = this.writer.getPos();
			this.riffWriter.writeU64(0);
			this.riffWriter.writeU32(0);
		}
		this.riffWriter.writeAscii("fmt ");
		this.riffWriter.writeU32(16);
		this.riffWriter.writeU16(format);
		this.riffWriter.writeU16(channels);
		this.riffWriter.writeU32(sampleRate);
		this.riffWriter.writeU32(sampleRate * blockSize);
		this.riffWriter.writeU16(blockSize);
		this.riffWriter.writeU16(8 * pcmInfo.sampleSize);
		if (!metadataTagsAreEmpty(this.output._metadataTags)) {
			const metadataFormat = this.format._options.metadataFormat ?? "info";
			if (metadataFormat === "info") this.writeInfoChunk(this.output._metadataTags);
			else if (metadataFormat === "id3") this.writeId3Chunk(this.output._metadataTags);
			else assertNever(metadataFormat);
		}
		this.riffWriter.writeAscii("data");
		if (this.isRf64) this.riffWriter.writeU32(4294967295);
		else {
			this.dataSizePos = this.writer.getPos();
			this.riffWriter.writeU32(0);
		}
		if (this.format._options.onHeader) {
			const { data, start } = this.writer.stopTrackingWrites();
			this.format._options.onHeader(data, start);
		}
	}
	writeInfoChunk(metadata) {
		const startPos = this.writer.getPos();
		this.riffWriter.writeAscii("LIST");
		this.riffWriter.writeU32(0);
		this.riffWriter.writeAscii("INFO");
		const writtenTags = /* @__PURE__ */ new Set();
		const writeInfoTag = (tag, value) => {
			if (!isIso88591Compatible(value)) {
				Logging._warn(`Didn't write tag '${tag}' because '${value}' is not ISO 8859-1-compatible.`);
				return;
			}
			const size = value.length + 1;
			const bytes = new Uint8Array(size);
			for (let i = 0; i < value.length; i++) bytes[i] = value.charCodeAt(i);
			this.riffWriter.writeAscii(tag);
			this.riffWriter.writeU32(size);
			this.writer.write(bytes);
			if (size & 1) this.writer.write(/* @__PURE__ */ new Uint8Array(1));
			writtenTags.add(tag);
		};
		for (const { key, value } of keyValueIterator(metadata)) switch (key) {
			case "title":
				writeInfoTag("INAM", value);
				writtenTags.add("INAM");
				break;
			case "artist":
				writeInfoTag("IART", value);
				writtenTags.add("IART");
				break;
			case "album":
				writeInfoTag("IPRD", value);
				writtenTags.add("IPRD");
				break;
			case "trackNumber":
				writeInfoTag("ITRK", metadata.tracksTotal !== void 0 ? `${value}/${metadata.tracksTotal}` : value.toString());
				writtenTags.add("ITRK");
				break;
			case "genre":
				writeInfoTag("IGNR", value);
				writtenTags.add("IGNR");
				break;
			case "date":
				writeInfoTag("ICRD", value.toISOString().slice(0, 10));
				writtenTags.add("ICRD");
				break;
			case "comment":
				writeInfoTag("ICMT", value);
				writtenTags.add("ICMT");
				break;
			case "albumArtist":
			case "discNumber":
			case "tracksTotal":
			case "discsTotal":
			case "description":
			case "lyrics":
			case "images": break;
			case "raw": break;
			default: assertNever(key);
		}
		if (metadata.raw) for (const key in metadata.raw) {
			const value = metadata.raw[key];
			if (value == null || key.length !== 4 || writtenTags.has(key)) continue;
			if (typeof value === "string") writeInfoTag(key, value);
		}
		const endPos = this.writer.getPos();
		const chunkSize = endPos - startPos - 8;
		this.writer.seek(startPos + 4);
		this.riffWriter.writeU32(chunkSize);
		this.writer.seek(endPos);
		if (chunkSize & 1) this.writer.write(/* @__PURE__ */ new Uint8Array(1));
	}
	writeId3Chunk(metadata) {
		const startPos = this.writer.getPos();
		this.riffWriter.writeAscii("ID3 ");
		this.riffWriter.writeU32(0);
		const id3TagSize = new Id3V2Writer(this.writer).writeId3V2Tag(metadata);
		const endPos = this.writer.getPos();
		this.writer.seek(startPos + 4);
		this.riffWriter.writeU32(id3TagSize);
		this.writer.seek(endPos);
		if (id3TagSize & 1) this.writer.write(/* @__PURE__ */ new Uint8Array(1));
	}
	async finalize() {
		const release = await this.mutex.acquire();
		if (!this.headerWritten) throw new Error("Cannot finalize an empty WAVE file: no packets were added and the track specified no decoderConfig in its metadata, so there's no telling what the file should look like.");
		const endPos = this.writer.getPos();
		if (this.isRf64) {
			assert(this.ds64RiffSizePos !== null);
			this.writer.seek(this.ds64RiffSizePos);
			this.riffWriter.writeU64(endPos - 8);
			assert(this.ds64DataSizePos !== null);
			this.writer.seek(this.ds64DataSizePos);
			this.riffWriter.writeU64(this.dataSize);
			assert(this.ds64SampleCountPos !== null);
			this.writer.seek(this.ds64SampleCountPos);
			this.riffWriter.writeU64(this.sampleCount);
		} else {
			assert(this.riffSizePos !== null);
			this.writer.seek(this.riffSizePos);
			this.riffWriter.writeU32(endPos - 8);
			assert(this.dataSizePos !== null);
			this.writer.seek(this.dataSizePos);
			this.riffWriter.writeU32(this.dataSize);
		}
		release();
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/resample.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* Utility class to handle audio resampling, handling both sample rate resampling as well as channel up/downmixing.
* The advantage over doing this manually rather than using OfflineAudioContext to do it for us is the artifact-free
* handling of putting multiple resampled audio samples back to back, which produces flaky results using
* OfflineAudioContext.
*/
var AudioResampler = class {
	constructor(options) {
		this.sourceSampleRate = null;
		this.sourceNumberOfChannels = null;
		this.startTime = null;
		/** Start frame of current buffer */
		this.bufferStartFrame = 0;
		/** The highest index written to in the current buffer */
		this.maxWrittenFrame = null;
		this.targetSampleRate = options.targetSampleRate;
		this.targetNumberOfChannels = options.targetNumberOfChannels;
		this.onSample = options.onSample;
		this.bufferSizeInFrames = Math.floor(this.targetSampleRate * 5);
		this.bufferSizeInSamples = this.bufferSizeInFrames * this.targetNumberOfChannels;
		this.outputBuffer = new Float32Array(this.bufferSizeInSamples);
	}
	/**
	* Sets up the channel mixer to handle up/downmixing in the case where input and output channel counts don't match.
	*/
	doChannelMixerSetup() {
		assert(this.sourceNumberOfChannels !== null);
		const sourceNum = this.sourceNumberOfChannels;
		const targetNum = this.targetNumberOfChannels;
		if (sourceNum === 1 && targetNum === 2) this.channelMixer = (sourceData, sourceFrameIndex) => {
			return sourceData[sourceFrameIndex * sourceNum];
		};
		else if (sourceNum === 1 && targetNum === 4) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			return sourceData[sourceFrameIndex * sourceNum] * +(targetChannelIndex < 2);
		};
		else if (sourceNum === 1 && targetNum === 6) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			return sourceData[sourceFrameIndex * sourceNum] * +(targetChannelIndex === 2);
		};
		else if (sourceNum === 2 && targetNum === 1) this.channelMixer = (sourceData, sourceFrameIndex) => {
			const baseIdx = sourceFrameIndex * sourceNum;
			return .5 * (sourceData[baseIdx] + sourceData[baseIdx + 1]);
		};
		else if (sourceNum === 2 && targetNum === 4) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			return sourceData[sourceFrameIndex * sourceNum + targetChannelIndex] * +(targetChannelIndex < 2);
		};
		else if (sourceNum === 2 && targetNum === 6) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			return sourceData[sourceFrameIndex * sourceNum + targetChannelIndex] * +(targetChannelIndex < 2);
		};
		else if (sourceNum === 4 && targetNum === 1) this.channelMixer = (sourceData, sourceFrameIndex) => {
			const baseIdx = sourceFrameIndex * sourceNum;
			return .25 * (sourceData[baseIdx] + sourceData[baseIdx + 1] + sourceData[baseIdx + 2] + sourceData[baseIdx + 3]);
		};
		else if (sourceNum === 4 && targetNum === 2) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			const baseIdx = sourceFrameIndex * sourceNum;
			return .5 * (sourceData[baseIdx + targetChannelIndex] + sourceData[baseIdx + targetChannelIndex + 2]);
		};
		else if (sourceNum === 4 && targetNum === 6) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			const baseIdx = sourceFrameIndex * sourceNum;
			if (targetChannelIndex < 2) return sourceData[baseIdx + targetChannelIndex];
			if (targetChannelIndex === 2 || targetChannelIndex === 3) return 0;
			return sourceData[baseIdx + targetChannelIndex - 2];
		};
		else if (sourceNum === 6 && targetNum === 1) this.channelMixer = (sourceData, sourceFrameIndex) => {
			const baseIdx = sourceFrameIndex * sourceNum;
			return Math.SQRT1_2 * (sourceData[baseIdx] + sourceData[baseIdx + 1]) + sourceData[baseIdx + 2] + .5 * (sourceData[baseIdx + 4] + sourceData[baseIdx + 5]);
		};
		else if (sourceNum === 6 && targetNum === 2) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			const baseIdx = sourceFrameIndex * sourceNum;
			return sourceData[baseIdx + targetChannelIndex] + Math.SQRT1_2 * (sourceData[baseIdx + 2] + sourceData[baseIdx + targetChannelIndex + 4]);
		};
		else if (sourceNum === 6 && targetNum === 4) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			const baseIdx = sourceFrameIndex * sourceNum;
			if (targetChannelIndex < 2) return sourceData[baseIdx + targetChannelIndex] + Math.SQRT1_2 * sourceData[baseIdx + 2];
			return sourceData[baseIdx + targetChannelIndex + 2];
		};
		else this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			return targetChannelIndex < sourceNum ? sourceData[sourceFrameIndex * sourceNum + targetChannelIndex] : 0;
		};
	}
	ensureTempBufferSize(requiredSamples) {
		let length = this.tempSourceBuffer.length;
		while (length < requiredSamples) length *= 2;
		if (length !== this.tempSourceBuffer.length) {
			const newBuffer = new Float32Array(length);
			newBuffer.set(this.tempSourceBuffer);
			this.tempSourceBuffer = newBuffer;
		}
	}
	async add(audioSample) {
		if (this.sourceSampleRate === null) {
			this.sourceSampleRate = audioSample.sampleRate;
			this.sourceNumberOfChannels = audioSample.numberOfChannels;
			this.startTime = audioSample.timestamp;
			this.tempSourceBuffer = new Float32Array(this.sourceSampleRate * this.sourceNumberOfChannels);
			this.doChannelMixerSetup();
		}
		assert(this.startTime !== null);
		const requiredSamples = audioSample.numberOfFrames * audioSample.numberOfChannels;
		this.ensureTempBufferSize(requiredSamples);
		const sourceDataSize = audioSample.allocationSize({
			planeIndex: 0,
			format: "f32"
		});
		const sourceView = new Float32Array(this.tempSourceBuffer.buffer, 0, sourceDataSize / 4);
		audioSample.copyTo(sourceView, {
			planeIndex: 0,
			format: "f32"
		});
		const inputStartTime = audioSample.timestamp - this.startTime;
		const inputEndTime = inputStartTime + audioSample.duration;
		const outputStartFrame = Math.floor((inputStartTime - 1 / this.sourceSampleRate) * this.targetSampleRate) + 1;
		const outputEndFrame = Math.ceil(inputEndTime * this.targetSampleRate);
		for (let outputFrame = outputStartFrame; outputFrame < outputEndFrame; outputFrame++) {
			if (outputFrame < this.bufferStartFrame) continue;
			while (outputFrame >= this.bufferStartFrame + this.bufferSizeInFrames) {
				await this.finalizeCurrentBuffer();
				this.bufferStartFrame += this.bufferSizeInFrames;
			}
			const bufferFrameIndex = outputFrame - this.bufferStartFrame;
			assert(bufferFrameIndex < this.bufferSizeInFrames);
			const sourcePosition = (outputFrame / this.targetSampleRate - inputStartTime) * this.sourceSampleRate;
			const sourceLowerFrame = Math.floor(sourcePosition);
			const sourceUpperFrame = Math.ceil(sourcePosition);
			const fraction = sourcePosition - sourceLowerFrame;
			for (let targetChannel = 0; targetChannel < this.targetNumberOfChannels; targetChannel++) {
				let lowerSample = 0;
				let upperSample = 0;
				if (sourceLowerFrame >= 0 && sourceLowerFrame < audioSample.numberOfFrames) lowerSample = this.channelMixer(sourceView, sourceLowerFrame, targetChannel);
				if (sourceUpperFrame >= 0 && sourceUpperFrame < audioSample.numberOfFrames) upperSample = this.channelMixer(sourceView, sourceUpperFrame, targetChannel);
				const outputSample = lowerSample + fraction * (upperSample - lowerSample);
				const outputIndex = bufferFrameIndex * this.targetNumberOfChannels + targetChannel;
				this.outputBuffer[outputIndex] += outputSample;
			}
			if (this.maxWrittenFrame === null) this.maxWrittenFrame = bufferFrameIndex;
			else this.maxWrittenFrame = Math.max(this.maxWrittenFrame, bufferFrameIndex);
		}
	}
	async finalizeCurrentBuffer() {
		if (this.maxWrittenFrame === null) return;
		assert(this.startTime !== null);
		const samplesWritten = (this.maxWrittenFrame + 1) * this.targetNumberOfChannels;
		const outputData = new Float32Array(samplesWritten);
		outputData.set(this.outputBuffer.subarray(0, samplesWritten));
		const audioSample = new AudioSample({
			format: "f32",
			sampleRate: this.targetSampleRate,
			numberOfChannels: this.targetNumberOfChannels,
			timestamp: this.startTime + this.bufferStartFrame / this.targetSampleRate,
			data: outputData
		});
		await this.onSample(audioSample);
		this.outputBuffer.fill(0);
		this.maxWrittenFrame = null;
	}
	finalize() {
		return this.finalizeCurrentBuffer();
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/media-source.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var __addDisposableResource = function(env, value, async) {
	if (value !== null && value !== void 0) {
		if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
		var dispose, inner;
		if (async) {
			if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
			dispose = value[Symbol.asyncDispose];
		}
		if (dispose === void 0) {
			if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
			dispose = value[Symbol.dispose];
			if (async) inner = dispose;
		}
		if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
		if (inner) dispose = function() {
			try {
				inner.call(this);
			} catch (e) {
				return Promise.reject(e);
			}
		};
		env.stack.push({
			value,
			dispose,
			async
		});
	} else if (async) env.stack.push({ async: true });
	return value;
};
var __disposeResources = (function(SuppressedError) {
	return function(env) {
		function fail(e) {
			env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
			env.hasError = true;
		}
		var r, s = 0;
		function next() {
			while (r = env.stack.pop()) try {
				if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
				if (r.dispose) {
					var result = r.dispose.call(r.value);
					if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
						fail(e);
						return next();
					});
				} else s |= 1;
			} catch (e) {
				fail(e);
			}
			if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
			if (env.hasError) throw env.error;
		}
		return next();
	};
})(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
	var e = new Error(message);
	return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
/**
* Base class for media sources. Media sources are used to add media samples to an output file.
* @group Media sources
* @public
*/
var MediaSource = class {
	constructor() {
		/** @internal */
		this._connectedTrack = null;
		/** @internal */
		this._closingPromise = null;
		/** @internal */
		this._closed = false;
	}
	/** @internal */
	_ensureValidAdd() {
		if (!this._connectedTrack) throw new Error("Source is not connected to an output track.");
		if (this._connectedTrack.output.state === "canceled") throw new Error("Output has been canceled.");
		if (this._connectedTrack.output.state === "finalizing" || this._connectedTrack.output.state === "finalized") throw new Error("Output has been finalized.");
		if (this._connectedTrack.output.state === "pending") throw new Error("Output has not started.");
		if (this._closed) throw new Error("Source is closed.");
	}
	/** @internal */
	async _start() {}
	/** @internal */
	async _flushAndClose(forceClose) {}
	/**
	* Closes this source. This prevents future samples from being added and signals to the output file that no further
	* samples will come in for this track. Calling `.close()` is optional but recommended after adding the
	* last sample - for improved performance and reduced memory usage.
	*/
	close() {
		if (this._closingPromise) return;
		const connectedTrack = this._connectedTrack;
		if (!connectedTrack) throw new Error("Cannot call close without connecting the source to an output track.");
		if (connectedTrack.output.state === "pending") throw new Error("Cannot call close before output has been started.");
		this._closingPromise = (async () => {
			await this._flushAndClose(false);
			this._closed = true;
			if (connectedTrack.output.state === "finalizing" || connectedTrack.output.state === "finalized") return;
			connectedTrack.output._muxer.onTrackClose(connectedTrack);
		})();
	}
	/** @internal */
	async _flushOrWaitForOngoingClose(forceClose) {
		return this._closingPromise ??= (async () => {
			await this._flushAndClose(forceClose);
			this._closed = true;
		})();
	}
};
/**
* Base class for video sources - sources for video tracks.
* @group Media sources
* @public
*/
var VideoSource = class extends MediaSource {
	/** Internal constructor. */
	constructor(codec) {
		super();
		/** @internal */
		this._connectedTrack = null;
		if (!VIDEO_CODECS.includes(codec)) throw new TypeError(`Invalid video codec '${codec}'. Must be one of: ${VIDEO_CODECS.join(", ")}.`);
		this._codec = codec;
	}
};
var maybeEnsureIsKeyPacket = (track, packet) => {
	if (track.metadata.hasOnlyKeyPackets && packet.type !== "key") throw new Error("Cannot add non-key packets to a hasOnlyKeyPackets video track.");
};
var VideoEncoderWrapper = class {
	setError(error) {
		if (!this.errorSet) {
			this.error = error;
			this.errorSet = true;
		}
	}
	constructor(source, encodingConfig) {
		this.source = source;
		this.encodingConfig = encodingConfig;
		this.ensureEncoderPromise = null;
		this.encoderInitialized = false;
		this.encoder = null;
		this.muxer = null;
		this.lastMultipleOfKeyFrameInterval = -1;
		this.emittedEncoderPackets = 0;
		this.codedWidth = null;
		this.codedHeight = null;
		this.outputWidth = null;
		this.outputHeight = null;
		this.frameRateLastSample = null;
		this.frameRateLastTimestamp = null;
		this.frameRateLastEndTimestamp = null;
		this.preciseTimings = [];
		this.customEncoder = null;
		this.customEncoderCallSerializer = new CallSerializer();
		this.customEncoderQueueSize = 0;
		this.defaultEncodeOptions = {};
		this.alphaEncoder = null;
		this.splitter = null;
		this.splitterCreationFailed = false;
		this.alphaFrameQueue = [];
		/**
		* Encoders typically throw their errors "out of band", meaning asynchronously in some other execution context.
		* However, we want to surface these errors to the user within the normal control flow, so they don't go uncaught.
		* So, we keep track of the encoder error and throw it as soon as we get the chance.
		*/
		this.error = null;
		this.errorSet = false;
		this.lastMuxerPromise = Promise.resolve();
		this.closed = false;
	}
	async add(videoSample, shouldClose, encodeOptions) {
		const originalSample = videoSample;
		try {
			this.checkForEncoderError();
			this.source._ensureValidAdd();
			const config = this.encodingConfig;
			const sizeChangeBehavior = config.sizeChangeBehavior ?? "deny";
			let isSizeChange = false;
			if (this.codedWidth !== null && this.codedHeight !== null) {
				if (videoSample.codedWidth !== this.codedWidth || videoSample.codedHeight !== this.codedHeight) {
					isSizeChange = true;
					if (sizeChangeBehavior === "deny") throw new Error(`Video sample size must remain constant. Expected ${this.codedWidth}x${this.codedHeight}, got ${videoSample.codedWidth}x${videoSample.codedHeight}. To allow the sample size to change over time, set \`sizeChangeBehavior\` to a value other than 'deny' in the encoding options.`);
				}
			} else {
				this.codedWidth = videoSample.codedWidth;
				this.codedHeight = videoSample.codedHeight;
			}
			if (config.transform?.width !== void 0 || config.transform?.height !== void 0 || config.transform?.rotate !== void 0 || config.transform?.crop !== void 0 || config.transform?.force === true || isSizeChange && sizeChangeBehavior !== "passThrough") {
				let targetWidth = config.transform?.width;
				let targetHeight = config.transform?.height;
				let appliedFit = config.transform?.fit ?? "fill";
				if (isSizeChange && sizeChangeBehavior !== "passThrough") {
					assert(this.outputWidth);
					assert(this.outputHeight);
					assert(sizeChangeBehavior !== "deny");
					targetWidth = this.outputWidth;
					targetHeight = this.outputHeight;
					appliedFit = sizeChangeBehavior;
				}
				const transformed = await videoSample.transform({
					width: targetWidth,
					height: targetHeight,
					roundDimensionsTo: 2,
					crop: config.transform?.crop,
					rotate: config.transform?.rotate,
					fit: appliedFit,
					alpha: config.alpha
				});
				if (this.outputWidth === null || this.outputHeight === null) {
					this.outputWidth = transformed.displayWidth;
					this.outputHeight = transformed.displayHeight;
				}
				if (shouldClose) videoSample.close();
				videoSample = transformed;
				shouldClose = true;
			} else if (this.outputWidth === null || this.outputHeight === null) {
				this.outputWidth = videoSample.codedWidth;
				this.outputHeight = videoSample.codedHeight;
			}
			const frameRate = config.transform?.frameRate;
			if (frameRate !== void 0) {
				const originalEndTimestamp = videoSample.timestamp + videoSample.duration;
				const alignedTimestamp = floorToDivisor(videoSample.timestamp, frameRate);
				if (this.frameRateLastSample !== null) {
					if (alignedTimestamp <= this.frameRateLastTimestamp) {
						this.frameRateLastSample.close();
						this.frameRateLastSample = videoSample.clone();
						this.frameRateLastEndTimestamp = originalEndTimestamp;
						return;
					} else await this.padFrameRate(alignedTimestamp, encodeOptions);
				}
				if (videoSample === originalSample) {
					videoSample = videoSample.clone();
					shouldClose = true;
				}
				videoSample.setTimestamp(alignedTimestamp);
				videoSample.setDuration(1 / frameRate);
				this.frameRateLastSample?.close();
				this.frameRateLastSample = videoSample.clone();
				this.frameRateLastTimestamp = alignedTimestamp;
				this.frameRateLastEndTimestamp = originalEndTimestamp;
			}
			await this.processAndEncode(videoSample, encodeOptions);
		} finally {
			if (shouldClose) videoSample.close();
		}
	}
	/**
	* Runs the process function (if any) and encodes the resulting samples.
	*/
	async processAndEncode(videoSample, encodeOptions) {
		const config = this.encodingConfig;
		let samplesToEncode;
		if (config.transform?.process) {
			let processed = config.transform.process(videoSample);
			if (isThenable(processed)) processed = await processed;
			if (processed === null) return;
			if (!Array.isArray(processed)) processed = [processed];
			const mappedSamples = [];
			try {
				for (const x of processed) if (x instanceof VideoSample) mappedSamples.push(x);
				else if (typeof VideoFrame !== "undefined" && x instanceof VideoFrame) mappedSamples.push(new VideoSample(x));
				else mappedSamples.push(new VideoSample(x, {
					timestamp: videoSample.timestamp,
					duration: videoSample.duration
				}));
			} catch (error) {
				for (const sample of mappedSamples) if (sample !== videoSample) sample.close();
				for (const x of processed) if (x instanceof VideoSample && x !== videoSample) x.close();
				else if (typeof VideoFrame !== "undefined" && x instanceof VideoFrame) x.close();
				throw error;
			}
			samplesToEncode = mappedSamples;
		} else samplesToEncode = [videoSample];
		try {
			for (const sampleToEncode of samplesToEncode) {
				if (!this.encoderInitialized) {
					if (!this.ensureEncoderPromise) this.ensureEncoder(sampleToEncode);
					if (!this.encoderInitialized) await this.ensureEncoderPromise;
				}
				assert(this.encoderInitialized);
				if (this.closed) break;
				const keyFrameInterval = this.encodingConfig.keyFrameInterval ?? 2;
				const multipleOfKeyFrameInterval = Math.floor(sampleToEncode.timestamp / keyFrameInterval);
				const mergedEncodeOptions = {
					...this.defaultEncodeOptions,
					...sampleToEncode.encodeOptions,
					...encodeOptions
				};
				const finalEncodeOptions = {
					...mergedEncodeOptions,
					keyFrame: mergedEncodeOptions.keyFrame !== void 0 ? mergedEncodeOptions.keyFrame : keyFrameInterval === 0 || multipleOfKeyFrameInterval !== this.lastMultipleOfKeyFrameInterval
				};
				this.lastMultipleOfKeyFrameInterval = multipleOfKeyFrameInterval;
				this.encodingConfig.onEncodedSample?.(sampleToEncode);
				if (this.customEncoder) {
					this.customEncoderQueueSize++;
					const clonedSample = sampleToEncode.clone();
					const promise = this.customEncoderCallSerializer.call(() => this.customEncoder.encode(clonedSample, finalEncodeOptions)).catch((error) => this.setError(error)).finally(() => {
						this.customEncoderQueueSize--;
						clonedSample.close();
					});
					if (this.customEncoderQueueSize >= 4) await promise;
				} else {
					assert(this.encoder);
					const videoFrame = sampleToEncode.toVideoFrame();
					const preciseTimingIndex = binarySearchLessOrEqual(this.preciseTimings, videoFrame.timestamp, (x) => x.microsecondTimestamp);
					const existingEntry = preciseTimingIndex !== -1 ? this.preciseTimings[preciseTimingIndex] : null;
					if (existingEntry && existingEntry.microsecondTimestamp === videoFrame.timestamp) {
						if (existingEntry.timestamp !== sampleToEncode.timestamp) existingEntry.timestampIsValid = false;
						if (existingEntry.duration !== sampleToEncode.duration) existingEntry.durationIsValid = false;
					} else {
						this.preciseTimings.splice(preciseTimingIndex + 1, 0, {
							microsecondTimestamp: videoFrame.timestamp,
							timestamp: sampleToEncode.timestamp,
							duration: sampleToEncode.duration,
							timestampIsValid: true,
							durationIsValid: true
						});
						if (this.preciseTimings.length > 128) this.preciseTimings.shift();
					}
					if (!this.alphaEncoder) try {
						this.encoder.encode(videoFrame, finalEncodeOptions);
					} finally {
						videoFrame.close();
					}
					else if (!!videoFrame.format && !videoFrame.format.includes("A") || this.splitterCreationFailed) {
						this.alphaFrameQueue.push(null);
						try {
							this.encoder.encode(videoFrame, finalEncodeOptions);
						} finally {
							videoFrame.close();
						}
					} else {
						if (!this.splitter) this.splitter = new ColorAlphaSplitter();
						const { colorFrame, alphaFrame } = await this.splitter.split(videoFrame);
						this.alphaFrameQueue.push(alphaFrame);
						try {
							this.encoder.encode(colorFrame, finalEncodeOptions);
						} finally {
							colorFrame.close();
						}
					}
					if (this.encoder.encodeQueueSize >= 4) await new Promise((resolve) => this.encoder.addEventListener("dequeue", resolve, { once: true }));
				}
				await this.lastMuxerPromise;
			}
		} finally {
			for (const sample of samplesToEncode) if (sample !== videoSample) sample.close();
		}
	}
	/** Repeats the last frame rate sample to fill the gap up to the given timestamp. */
	async padFrameRate(until, encodeOptions) {
		const frameRate = this.encodingConfig.transform.frameRate;
		assert(this.frameRateLastSample);
		const frameDifference = Math.round((until - this.frameRateLastTimestamp) * frameRate);
		for (let i = 1; i < frameDifference; i++) {
			const env_1 = {
				stack: [],
				error: void 0,
				hasError: false
			};
			try {
				const sample = __addDisposableResource(env_1, this.frameRateLastSample.clone(), false);
				sample.setTimestamp(this.frameRateLastTimestamp + i / frameRate);
				sample.setDuration(1 / frameRate);
				await this.processAndEncode(sample, encodeOptions);
			} catch (e_1) {
				env_1.error = e_1;
				env_1.hasError = true;
			} finally {
				__disposeResources(env_1);
			}
		}
	}
	ensureEncoder(videoSample) {
		this.ensureEncoderPromise = (async () => {
			const quality = resolveQuality(this.encodingConfig.quality, this.encodingConfig.bitrate);
			assert(quality !== void 0);
			const candidates = buildVideoEncoderConfigs({
				...this.encodingConfig,
				quality,
				width: videoSample.codedWidth,
				height: videoSample.codedHeight,
				squarePixelWidth: videoSample.squarePixelWidth,
				squarePixelHeight: videoSample.squarePixelHeight,
				framerate: this.source._connectedTrack?.metadata.frameRate
			});
			let selected = null;
			let MatchingCustomEncoder;
			for (const candidate of candidates) {
				const candidateConfig = candidate.config;
				this.encodingConfig.onEncoderConfig?.(candidateConfig);
				MatchingCustomEncoder = customVideoEncoders.find((x) => x.supports(this.encodingConfig.codec, candidateConfig));
				if (MatchingCustomEncoder) {
					selected = candidate;
					break;
				}
				if (typeof VideoEncoder === "undefined") continue;
				candidateConfig.alpha = "discard";
				if (this.encodingConfig.alpha === "keep") candidateConfig.latencyMode = "quality";
				if ((candidateConfig.width % 2 === 1 || candidateConfig.height % 2 === 1) && (this.encodingConfig.codec === "avc" || this.encodingConfig.codec === "hevc")) throw new Error(`The dimensions ${candidateConfig.width}x${candidateConfig.height} are not supported for codec '${this.encodingConfig.codec}'; both width and height must be even numbers. Make sure to round your dimensions to the nearest even number.`);
				try {
					if ((await VideoEncoder.isConfigSupported(candidateConfig)).supported) {
						selected = candidate;
						break;
					}
				} catch {}
			}
			if (!selected) {
				if (typeof VideoEncoder === "undefined") throw new Error(missingWebCodecsClassMessage("VideoEncoder"));
				const firstConfig = candidates[0].config;
				const rateControls = candidates.map(({ config, quantizer }) => quantizer !== null ? `quantizer ${quantizer}` : `${config.bitrate} bps`);
				throw new Error(`This specific encoder configuration (${firstConfig.codec}, ${rateControls.join(" / ")}, ${firstConfig.width}x${firstConfig.height}, hardware acceleration: ${firstConfig.hardwareAcceleration ?? "no-preference"}) is not supported in this environment. Consider using another codec or changing your video parameters.`);
			}
			const encoderConfig = selected.config;
			if (selected.quantizer !== null) this.defaultEncodeOptions = buildQuantizerEncodeOptions(this.encodingConfig.codec, selected.quantizer);
			if (MatchingCustomEncoder) {
				this.customEncoder = new MatchingCustomEncoder();
				this.customEncoder.codec = this.encodingConfig.codec;
				this.customEncoder.config = encoderConfig;
				this.customEncoder.onPacket = (packet, meta) => {
					if (!(packet instanceof EncodedPacket)) throw new TypeError("The first argument passed to onPacket must be an EncodedPacket.");
					if (meta !== void 0 && (!meta || typeof meta !== "object")) throw new TypeError("The second argument passed to onPacket must be an object or undefined.");
					maybeEnsureIsKeyPacket(this.source._connectedTrack, packet);
					this.encodingConfig.onEncodedPacket?.(packet, meta);
					this.lastMuxerPromise = this.muxer.addEncodedVideoPacket(this.source._connectedTrack, packet, meta).catch((error) => {
						this.setError(error);
					});
				};
				this.customEncoder.onError = (error) => {
					this.setError(error);
				};
				await this.customEncoder.init();
			} else {
				/** Queue of color chunks waiting for their alpha counterpart. */
				const colorChunkQueue = [];
				/** Each value is the number of encoded alpha chunks at which a null alpha chunk should be added. */
				const nullAlphaChunkQueue = [];
				let encodedAlphaChunkCount = 0;
				let alphaEncoderQueue = 0;
				const addPacket = (colorChunk, alphaChunk, meta) => {
					const sideData = {};
					if (alphaChunk) {
						const alphaData = new Uint8Array(alphaChunk.byteLength);
						alphaChunk.copyTo(alphaData);
						sideData.alpha = alphaData;
					}
					let packet = EncodedPacket.fromEncodedChunk(colorChunk, sideData);
					const preciseTimingIndex = binarySearchLessOrEqual(this.preciseTimings, colorChunk.timestamp, (x) => x.microsecondTimestamp);
					const entry = preciseTimingIndex !== -1 ? this.preciseTimings[preciseTimingIndex] : null;
					let actualType = null;
					if (this.emittedEncoderPackets === 0 && packet.type === "delta" && meta?.decoderConfig) actualType = determineVideoPacketType(this.encodingConfig.codec, meta.decoderConfig, packet.data);
					if (entry && entry.microsecondTimestamp === colorChunk.timestamp || actualType !== null) packet = packet.clone({
						timestamp: entry?.timestampIsValid ? entry.timestamp : void 0,
						duration: entry?.durationIsValid ? entry.duration : void 0,
						type: actualType ?? void 0
					});
					maybeEnsureIsKeyPacket(this.source._connectedTrack, packet);
					this.encodingConfig.onEncodedPacket?.(packet, meta);
					this.lastMuxerPromise = this.muxer.addEncodedVideoPacket(this.source._connectedTrack, packet, meta).catch((error) => {
						this.setError(error);
					});
					this.emittedEncoderPackets++;
				};
				const stack = (/* @__PURE__ */ new Error("Encoding error")).stack;
				this.encoder = new VideoEncoder({
					output: (chunk, meta) => {
						if (!this.alphaEncoder) {
							addPacket(chunk, null, meta);
							return;
						}
						const alphaFrame = this.alphaFrameQueue.shift();
						assert(alphaFrame !== void 0);
						if (alphaFrame) {
							this.alphaEncoder.encode(alphaFrame, {
								...this.defaultEncodeOptions,
								keyFrame: chunk.type === "key"
							});
							alphaEncoderQueue++;
							alphaFrame.close();
							colorChunkQueue.push({
								chunk,
								meta
							});
						} else if (alphaEncoderQueue === 0) addPacket(chunk, null, meta);
						else {
							nullAlphaChunkQueue.push(encodedAlphaChunkCount + alphaEncoderQueue);
							colorChunkQueue.push({
								chunk,
								meta
							});
						}
					},
					error: (error) => {
						error.stack = stack;
						this.setError(error);
					}
				});
				this.encoder.configure(encoderConfig);
				if (this.encodingConfig.alpha === "keep") {
					const stack = (/* @__PURE__ */ new Error("Encoding error")).stack;
					this.alphaEncoder = new VideoEncoder({
						output: (chunk, meta) => {
							alphaEncoderQueue--;
							const colorChunk = colorChunkQueue.shift();
							assert(colorChunk !== void 0);
							addPacket(colorChunk.chunk, chunk, colorChunk.meta);
							encodedAlphaChunkCount++;
							while (nullAlphaChunkQueue.length > 0 && nullAlphaChunkQueue[0] === encodedAlphaChunkCount) {
								nullAlphaChunkQueue.shift();
								const colorChunk = colorChunkQueue.shift();
								assert(colorChunk !== void 0);
								addPacket(colorChunk.chunk, null, colorChunk.meta);
							}
						},
						error: (error) => {
							error.stack = stack;
							this.setError(error);
						}
					});
					this.alphaEncoder.configure(encoderConfig);
				}
			}
			assert(this.source._connectedTrack);
			this.muxer = this.source._connectedTrack.output._muxer;
			this.encoderInitialized = true;
		})();
	}
	async flushAndClose(forceClose) {
		try {
			if (!forceClose) {
				this.checkForEncoderError();
				if (this.frameRateLastSample) {
					const frameRate = this.encodingConfig.transform.frameRate;
					const alignedEnd = floorToDivisor(this.frameRateLastEndTimestamp, frameRate);
					await this.padFrameRate(alignedEnd);
				}
			}
			this.closed = true;
			if (!forceClose) {
				if (this.customEncoder) this.customEncoderCallSerializer.call(() => this.customEncoder.flush());
				else if (this.encoder) {
					await this.encoder.flush();
					await this.alphaEncoder?.flush();
					await wait(25);
				}
			}
		} finally {
			this.closed = true;
			this.frameRateLastSample?.close();
			this.frameRateLastSample = null;
			if (this.customEncoder) await this.customEncoderCallSerializer.call(() => this.customEncoder.close()).catch((error) => this.setError(error));
			else if (this.encoder) {
				if (this.encoder.state !== "closed") this.encoder.close();
				if (this.alphaEncoder && this.alphaEncoder.state !== "closed") this.alphaEncoder.close();
				this.alphaFrameQueue.forEach((x) => x?.close());
				this.alphaFrameQueue.length = 0;
				this.splitter?.close();
			}
		}
		if (!forceClose) this.checkForEncoderError();
	}
	getQueueSize() {
		if (this.customEncoder) return this.customEncoderQueueSize;
		else return this.encoder?.encodeQueueSize ?? 0;
	}
	checkForEncoderError() {
		if (this.errorSet) throw this.error;
	}
};
var splitterWorkerUrl = null;
/** Utility class for splitting a composite frame into separate color and alpha parts on the CPU in a worker. */
var ColorAlphaSplitter = class {
	constructor() {
		this.worker = null;
		this.pendingRequests = /* @__PURE__ */ new Map();
		this.nextRequestId = 0;
	}
	split(sourceFrame) {
		if (!this.worker) {
			if (!splitterWorkerUrl) {
				const blob = new Blob([`(${colorAlphaSplitterWorkerCode.toString()})()`], { type: "application/javascript" });
				splitterWorkerUrl = URL.createObjectURL(blob);
			}
			this.worker = new Worker(splitterWorkerUrl);
			this.worker.addEventListener("message", (event) => {
				const data = event.data;
				const pending = this.pendingRequests.get(data.id);
				if (!pending) return;
				this.pendingRequests.delete(data.id);
				if ("error" in data) pending.reject(new Error(data.error));
				else pending.resolve({
					colorFrame: data.colorFrame,
					alphaFrame: data.alphaFrame
				});
			});
			this.worker.addEventListener("error", (event) => {
				const error = new Error(event.message || "Color/alpha splitter worker error.");
				for (const pending of this.pendingRequests.values()) pending.reject(error);
				this.pendingRequests.clear();
			});
		}
		const id = this.nextRequestId++;
		const pending = promiseWithResolvers();
		this.pendingRequests.set(id, pending);
		this.worker.postMessage({
			id,
			sourceFrame
		}, { transfer: [sourceFrame] });
		return pending.promise;
	}
	close() {
		this.worker?.terminate();
		this.worker = null;
		const error = /* @__PURE__ */ new Error("Color/alpha splitter closed.");
		for (const pending of this.pendingRequests.values()) pending.reject(error);
		this.pendingRequests.clear();
	}
};
var colorAlphaSplitterWorkerCode = () => {
	let cpuSourceBuffer = null;
	let chain = Promise.resolve();
	self.addEventListener("message", (event) => {
		const { id, sourceFrame } = event.data;
		chain = chain.then(async () => {
			try {
				const { colorFrame, alphaFrame } = await split(sourceFrame);
				self.postMessage({
					id,
					colorFrame,
					alphaFrame
				}, { transfer: [colorFrame, alphaFrame] });
			} catch (error) {
				self.postMessage({
					id,
					error: error.message
				});
			} finally {
				sourceFrame.close();
			}
		});
	});
	const split = async (sourceFrame) => {
		const format = sourceFrame.format;
		if (!format) throw new Error("CPU color/alpha splitting requires a known VideoFrame format.");
		const sourceSize = sourceFrame.allocationSize();
		if (!cpuSourceBuffer || cpuSourceBuffer.byteLength !== sourceSize) cpuSourceBuffer = new Uint8Array(sourceSize);
		await sourceFrame.copyTo(cpuSourceBuffer);
		if (format === "RGBA" || format === "BGRA") return splitInterleavedRgba(cpuSourceBuffer, format, sourceFrame);
		else if (format === "I420A" || format === "I420AP10" || format === "I420AP12" || format === "I422A" || format === "I422AP10" || format === "I422AP12" || format === "I444A" || format === "I444AP10" || format === "I444AP12") return splitPlanarYuvA(cpuSourceBuffer, format, sourceFrame);
		throw new Error(`CPU color/alpha splitting does not support format '${format}'.`);
	};
	const splitInterleavedRgba = (source, format, sourceFrame) => {
		const width = sourceFrame.visibleRect?.width ?? sourceFrame.codedWidth;
		const height = sourceFrame.visibleRect?.height ?? sourceFrame.codedHeight;
		const pixelCount = width * height;
		const alphaSize = pixelCount + Math.ceil(width / 2) * Math.ceil(height / 2) * 2;
		const alphaBuffer = new Uint8Array(alphaSize);
		for (let i = 0, j = 3; i < pixelCount; i++, j += 4) alphaBuffer[i] = source[j];
		alphaBuffer.fill(128, pixelCount);
		const colorFrame = new VideoFrame(source, {
			format: format === "RGBA" ? "RGBX" : "BGRX",
			codedWidth: width,
			codedHeight: height,
			timestamp: sourceFrame.timestamp,
			duration: sourceFrame.duration ?? void 0
		});
		const alphaInit = {
			format: "I420",
			codedWidth: width,
			codedHeight: height,
			timestamp: sourceFrame.timestamp,
			duration: sourceFrame.duration ?? void 0,
			transfer: [alphaBuffer.buffer]
		};
		return {
			colorFrame,
			alphaFrame: new VideoFrame(alphaBuffer, alphaInit)
		};
	};
	const splitPlanarYuvA = (source, format, sourceFrame) => {
		const width = sourceFrame.visibleRect?.width ?? sourceFrame.codedWidth;
		const height = sourceFrame.visibleRect?.height ?? sourceFrame.codedHeight;
		const is10 = format.includes("P10");
		const is12 = format.includes("P12");
		const bytesPerSample = is10 || is12 ? 2 : 1;
		let chromaW;
		let chromaH;
		if (format.startsWith("I420")) {
			chromaW = Math.ceil(width / 2);
			chromaH = Math.ceil(height / 2);
		} else if (format.startsWith("I422")) {
			chromaW = Math.ceil(width / 2);
			chromaH = height;
		} else {
			chromaW = width;
			chromaH = height;
		}
		const ySamples = width * height;
		const uvSamples = chromaW * chromaH;
		const yBytes = ySamples * bytesPerSample;
		const uvBytes = uvSamples * bytesPerSample;
		const aBytes = ySamples * bytesPerSample;
		const colorBytes = yBytes + uvBytes * 2;
		const colorFormat = format.replace("A", "");
		const alphaUvSamples = Math.ceil(width / 2) * Math.ceil(height / 2);
		const alphaSize = aBytes + 2 * (alphaUvSamples * bytesPerSample);
		const alphaBuffer = new Uint8Array(alphaSize);
		const aPlaneStart = colorBytes;
		alphaBuffer.set(source.subarray(aPlaneStart, aPlaneStart + aBytes), 0);
		const uvOffset = aBytes;
		const neutralChroma = is10 ? 512 : is12 ? 2048 : 128;
		if (bytesPerSample === 1) alphaBuffer.fill(neutralChroma, uvOffset);
		else new Uint16Array(alphaBuffer.buffer, uvOffset, 2 * alphaUvSamples).fill(neutralChroma);
		const alphaFormat = is10 ? "I420P10" : is12 ? "I420P12" : "I420";
		const colorFrame = new VideoFrame(source.subarray(0, colorBytes), {
			format: colorFormat,
			codedWidth: width,
			codedHeight: height,
			timestamp: sourceFrame.timestamp,
			duration: sourceFrame.duration ?? void 0
		});
		const alphaInit = {
			format: alphaFormat,
			codedWidth: width,
			codedHeight: height,
			timestamp: sourceFrame.timestamp,
			duration: sourceFrame.duration ?? void 0,
			transfer: [alphaBuffer.buffer]
		};
		return {
			colorFrame,
			alphaFrame: new VideoFrame(alphaBuffer, alphaInit)
		};
	};
};
/**
* This source can be used to add raw, unencoded video samples (frames) to an output video track. These frames will
* automatically be encoded and then piped into the output.
* @group Media sources
* @public
*/
var VideoSampleSource = class extends VideoSource {
	/**
	* Creates a new {@link VideoSampleSource} whose samples are encoded according to the specified
	* {@link VideoEncodingConfig}.
	*/
	constructor(encodingConfig) {
		validateVideoEncodingConfig(encodingConfig);
		super(encodingConfig.codec);
		this._encoder = new VideoEncoderWrapper(this, encodingConfig);
	}
	/**
	* Encodes a video sample (frame) and then adds it to the output.
	*
	* @returns A Promise that resolves once the output is ready to receive more samples. You should await this Promise
	* to respect writer and encoder backpressure.
	*/
	add(videoSample, encodeOptions) {
		if (!(videoSample instanceof VideoSample)) throw new TypeError("videoSample must be a VideoSample.");
		return this._encoder.add(videoSample, false, encodeOptions);
	}
	/** @internal */
	_flushAndClose(forceClose) {
		return this._encoder.flushAndClose(forceClose);
	}
};
/**
* Base class for audio sources - sources for audio tracks.
* @group Media sources
* @public
*/
var AudioSource = class extends MediaSource {
	/** Internal constructor. */
	constructor(codec) {
		super();
		/** @internal */
		this._connectedTrack = null;
		if (!AUDIO_CODECS.includes(codec)) throw new TypeError(`Invalid audio codec '${codec}'. Must be one of: ${AUDIO_CODECS.join(", ")}.`);
		this._codec = codec;
	}
};
var AudioEncoderWrapper = class {
	setError(error) {
		if (!this.errorSet) {
			this.error = error;
			this.errorSet = true;
		}
	}
	constructor(source, encodingConfig) {
		this.source = source;
		this.encodingConfig = encodingConfig;
		this.ensureEncoderPromise = null;
		this.encoderInitialized = false;
		this.encoder = null;
		this.muxer = null;
		this.lastNumberOfChannels = null;
		this.lastSampleRate = null;
		this.isPcmEncoder = false;
		this.outputSampleSize = null;
		this.writeOutputValue = null;
		this.customEncoder = null;
		this.customEncoderCallSerializer = new CallSerializer();
		this.customEncoderQueueSize = 0;
		this.lastEndSampleIndex = null;
		this.resampler = null;
		/**
		* Encoders typically throw their errors "out of band", meaning asynchronously in some other execution context.
		* However, we want to surface these errors to the user within the normal control flow, so they don't go uncaught.
		* So, we keep track of the encoder error and throw it as soon as we get the chance.
		*/
		this.error = null;
		this.errorSet = false;
		this.lastMuxerPromise = Promise.resolve();
		this.closed = false;
	}
	async add(audioSample, shouldClose) {
		try {
			this.checkForEncoderError();
			this.source._ensureValidAdd();
			if (this.lastNumberOfChannels !== null && this.lastSampleRate !== null) {
				if (audioSample.numberOfChannels !== this.lastNumberOfChannels || audioSample.sampleRate !== this.lastSampleRate) throw new Error(`Audio parameters must remain constant. Expected ${this.lastNumberOfChannels} channels at ${this.lastSampleRate} Hz, got ${audioSample.numberOfChannels} channels at ${audioSample.sampleRate} Hz.`);
			} else {
				this.lastNumberOfChannels = audioSample.numberOfChannels;
				this.lastSampleRate = audioSample.sampleRate;
			}
			const config = this.encodingConfig;
			if (config.transform?.numberOfChannels !== void 0 || config.transform?.sampleRate !== void 0) {
				if (!this.resampler) this.resampler = new AudioResampler({
					targetNumberOfChannels: config.transform.numberOfChannels ?? audioSample.numberOfChannels,
					targetSampleRate: config.transform.sampleRate ?? audioSample.sampleRate,
					onSample: async (sample) => {
						await this.processAndEncode(sample, true);
					}
				});
				await this.resampler.add(audioSample);
			} else await this.processAndEncode(audioSample, shouldClose);
		} finally {
			if (shouldClose) audioSample.close();
		}
	}
	/**
	* Runs the process function (if any) and encodes the resulting samples.
	*/
	async processAndEncode(audioSample, shouldClose) {
		const config = this.encodingConfig;
		if (config.transform?.sampleFormat !== void 0 && toInterleavedAudioFormat(audioSample.format) !== config.transform.sampleFormat) {
			const newSample = audioSampleToInterleavedFormat(audioSample, config.transform.sampleFormat);
			if (shouldClose) audioSample.close();
			audioSample = newSample;
			shouldClose = true;
		}
		if (config.transform?.process) try {
			let processed = config.transform.process(audioSample);
			if (isThenable(processed)) processed = await processed;
			if (processed === null) return;
			if (!Array.isArray(processed)) processed = [processed];
			try {
				for (const sample of processed) if (!(sample instanceof AudioSample)) throw new TypeError("The audio process function must return an AudioSample, null, or an array of AudioSamples.");
				for (const sample of processed) await this.encodeSample(sample, true);
			} finally {
				for (const sample of processed) if (sample instanceof AudioSample) sample.close();
			}
		} finally {
			if (shouldClose) audioSample.close();
		}
		else await this.encodeSample(audioSample, shouldClose);
	}
	/**
	* Encodes a single audio sample, handling encoder init, gap padding, and backpressure.
	*/
	async encodeSample(audioSample, shouldClose) {
		try {
			if (!this.encoderInitialized) {
				if (!this.ensureEncoderPromise) this.ensureEncoder(audioSample);
				if (!this.encoderInitialized) await this.ensureEncoderPromise;
			}
			assert(this.encoderInitialized);
			if (this.closed) return;
			{
				const startSampleIndex = Math.round(audioSample.timestamp * audioSample.sampleRate);
				const endSampleIndex = Math.round((audioSample.timestamp + audioSample.duration) * audioSample.sampleRate);
				if (this.lastEndSampleIndex === null) this.lastEndSampleIndex = endSampleIndex;
				else {
					const sampleDiff = startSampleIndex - this.lastEndSampleIndex;
					if (sampleDiff >= 64) {
						const fillSample = new AudioSample({
							data: new Float32Array(sampleDiff * audioSample.numberOfChannels),
							format: "f32-planar",
							sampleRate: audioSample.sampleRate,
							numberOfChannels: audioSample.numberOfChannels,
							numberOfFrames: sampleDiff,
							timestamp: this.lastEndSampleIndex / audioSample.sampleRate
						});
						await this.encodeSample(fillSample, true);
					}
					this.lastEndSampleIndex += audioSample.numberOfFrames;
				}
			}
			this.encodingConfig.onEncodedSample?.(audioSample);
			if (this.customEncoder) {
				this.customEncoderQueueSize++;
				const clonedSample = audioSample.clone();
				const promise = this.customEncoderCallSerializer.call(() => this.customEncoder.encode(clonedSample)).catch((error) => this.setError(error)).finally(() => {
					this.customEncoderQueueSize--;
					clonedSample.close();
				});
				if (this.customEncoderQueueSize >= 4) await promise;
				await this.lastMuxerPromise;
			} else if (this.isPcmEncoder) await this.doPcmEncoding(audioSample, shouldClose);
			else {
				assert(this.encoder);
				const audioData = audioSample.toAudioData();
				this.encoder.encode(audioData);
				audioData.close();
				if (shouldClose) audioSample.close();
				if (this.encoder.encodeQueueSize >= 4) await new Promise((resolve) => this.encoder.addEventListener("dequeue", resolve, { once: true }));
				await this.lastMuxerPromise;
			}
		} finally {
			if (shouldClose) audioSample.close();
		}
	}
	async doPcmEncoding(audioSample, shouldClose) {
		assert(this.outputSampleSize);
		assert(this.writeOutputValue);
		const { numberOfChannels, numberOfFrames, sampleRate, timestamp } = audioSample;
		const CHUNK_SIZE = 2048;
		const outputs = [];
		for (let frame = 0; frame < numberOfFrames; frame += CHUNK_SIZE) {
			const frameCount = Math.min(CHUNK_SIZE, audioSample.numberOfFrames - frame);
			const outputSize = frameCount * numberOfChannels * this.outputSampleSize;
			const outputBuffer = new ArrayBuffer(outputSize);
			const outputView = new DataView(outputBuffer);
			outputs.push({
				frameCount,
				view: outputView
			});
		}
		const allocationSize = audioSample.allocationSize({
			planeIndex: 0,
			format: "f32-planar"
		});
		const floats = new Float32Array(allocationSize / Float32Array.BYTES_PER_ELEMENT);
		for (let i = 0; i < numberOfChannels; i++) {
			audioSample.copyTo(floats, {
				planeIndex: i,
				format: "f32-planar"
			});
			for (let j = 0; j < outputs.length; j++) {
				const { frameCount, view } = outputs[j];
				for (let k = 0; k < frameCount; k++) this.writeOutputValue(view, (k * numberOfChannels + i) * this.outputSampleSize, floats[j * CHUNK_SIZE + k]);
			}
		}
		if (shouldClose) audioSample.close();
		const meta = { decoderConfig: {
			codec: this.encodingConfig.codec,
			numberOfChannels,
			sampleRate
		} };
		for (let i = 0; i < outputs.length; i++) {
			const { frameCount, view } = outputs[i];
			const outputBuffer = view.buffer;
			const startFrame = i * CHUNK_SIZE;
			const packet = new EncodedPacket(new Uint8Array(outputBuffer), "key", timestamp + startFrame / sampleRate, frameCount / sampleRate);
			this.encodingConfig.onEncodedPacket?.(packet, meta);
			await this.muxer.addEncodedAudioPacket(this.source._connectedTrack, packet, meta);
		}
	}
	ensureEncoder(audioSample) {
		this.ensureEncoderPromise = (async () => {
			const { numberOfChannels, sampleRate } = audioSample;
			const quality = resolveQuality(this.encodingConfig.quality, this.encodingConfig.bitrate);
			const encoderConfig = buildAudioEncoderConfig({
				numberOfChannels,
				sampleRate,
				...this.encodingConfig,
				quality
			});
			this.encodingConfig.onEncoderConfig?.(encoderConfig);
			const MatchingCustomEncoder = customAudioEncoders.find((x) => x.supports(this.encodingConfig.codec, encoderConfig));
			if (MatchingCustomEncoder) {
				this.customEncoder = new MatchingCustomEncoder();
				this.customEncoder.codec = this.encodingConfig.codec;
				this.customEncoder.config = encoderConfig;
				this.customEncoder.onPacket = (packet, meta) => {
					if (!(packet instanceof EncodedPacket)) throw new TypeError("The first argument passed to onPacket must be an EncodedPacket.");
					if (meta !== void 0 && (!meta || typeof meta !== "object")) throw new TypeError("The second argument passed to onPacket must be an object or undefined.");
					this.encodingConfig.onEncodedPacket?.(packet, meta);
					this.lastMuxerPromise = this.muxer.addEncodedAudioPacket(this.source._connectedTrack, packet, meta).catch((error) => {
						this.setError(error);
					});
				};
				this.customEncoder.onError = (error) => {
					this.setError(error);
				};
				await this.customEncoder.init();
			} else if (PCM_AUDIO_CODECS.includes(this.encodingConfig.codec)) this.initPcmEncoder();
			else {
				if (typeof AudioEncoder === "undefined") throw new Error(missingWebCodecsClassMessage("AudioEncoder"));
				let supported;
				try {
					supported = (await AudioEncoder.isConfigSupported(encoderConfig)).supported ?? false;
				} catch {
					supported = false;
				}
				if (!supported) throw new Error(`This specific encoder configuration (${encoderConfig.codec}, ${encoderConfig.bitrate} bps, ${encoderConfig.numberOfChannels} channels, ${encoderConfig.sampleRate} Hz) is not supported in this environment. Consider using another codec or changing your audio parameters.`);
				const stack = (/* @__PURE__ */ new Error("Encoding error")).stack;
				this.encoder = new AudioEncoder({
					output: (chunk, meta) => {
						if (this.encodingConfig.codec === "aac" && meta?.decoderConfig) {
							let needsDescriptionOverwrite = false;
							if (!meta.decoderConfig.description || meta.decoderConfig.description.byteLength < 2) needsDescriptionOverwrite = true;
							else needsDescriptionOverwrite = parseAacAudioSpecificConfig(toUint8Array(meta.decoderConfig.description)).objectType === 0;
							if (needsDescriptionOverwrite) {
								const objectType = Number(last(encoderConfig.codec.split(".")));
								meta.decoderConfig.description = buildAacAudioSpecificConfig({
									objectType,
									outputNumberOfChannels: meta.decoderConfig.numberOfChannels,
									outputSampleRate: meta.decoderConfig.sampleRate
								});
							}
						}
						let packet = EncodedPacket.fromEncodedChunk(chunk);
						packet = packet.clone({
							timestamp: roundToDivisor(packet.timestamp, encoderConfig.sampleRate),
							duration: chunk.duration != null ? roundToDivisor(packet.duration, encoderConfig.sampleRate) : void 0
						});
						this.encodingConfig.onEncodedPacket?.(packet, meta);
						this.lastMuxerPromise = this.muxer.addEncodedAudioPacket(this.source._connectedTrack, packet, meta).catch((error) => {
							this.setError(error);
						});
					},
					error: (error) => {
						error.stack = stack;
						this.setError(error);
					}
				});
				this.encoder.configure(encoderConfig);
			}
			assert(this.source._connectedTrack);
			this.muxer = this.source._connectedTrack.output._muxer;
			this.encoderInitialized = true;
		})();
	}
	initPcmEncoder() {
		this.isPcmEncoder = true;
		const codec = this.encodingConfig.codec;
		const { dataType, sampleSize, littleEndian } = parsePcmCodec(codec);
		this.outputSampleSize = sampleSize;
		switch (sampleSize) {
			case 1:
				if (dataType === "unsigned") this.writeOutputValue = (view, byteOffset, value) => view.setUint8(byteOffset, clamp((value + 1) * 127.5, 0, 255));
				else if (dataType === "signed") this.writeOutputValue = (view, byteOffset, value) => {
					view.setInt8(byteOffset, clamp(Math.round(value * 128), -128, 127));
				};
				else if (dataType === "ulaw") this.writeOutputValue = (view, byteOffset, value) => {
					const int16 = clamp(Math.floor(value * 32767), -32768, 32767);
					view.setUint8(byteOffset, toUlaw(int16));
				};
				else if (dataType === "alaw") this.writeOutputValue = (view, byteOffset, value) => {
					const int16 = clamp(Math.floor(value * 32767), -32768, 32767);
					view.setUint8(byteOffset, toAlaw(int16));
				};
				else assert(false);
				break;
			case 2:
				if (dataType === "unsigned") this.writeOutputValue = (view, byteOffset, value) => view.setUint16(byteOffset, clamp((value + 1) * 32767.5, 0, 65535), littleEndian);
				else if (dataType === "signed") this.writeOutputValue = (view, byteOffset, value) => view.setInt16(byteOffset, clamp(Math.round(value * 32767), -32768, 32767), littleEndian);
				else assert(false);
				break;
			case 3:
				if (dataType === "unsigned") this.writeOutputValue = (view, byteOffset, value) => setUint24(view, byteOffset, clamp((value + 1) * 8388607.5, 0, 16777215), littleEndian);
				else if (dataType === "signed") this.writeOutputValue = (view, byteOffset, value) => setInt24(view, byteOffset, clamp(Math.round(value * 8388607), -8388608, 8388607), littleEndian);
				else assert(false);
				break;
			case 4:
				if (dataType === "unsigned") this.writeOutputValue = (view, byteOffset, value) => view.setUint32(byteOffset, clamp((value + 1) * 2147483647.5, 0, 4294967295), littleEndian);
				else if (dataType === "signed") this.writeOutputValue = (view, byteOffset, value) => view.setInt32(byteOffset, clamp(Math.round(value * 2147483647), -2147483648, 2147483647), littleEndian);
				else if (dataType === "float") this.writeOutputValue = (view, byteOffset, value) => view.setFloat32(byteOffset, value, littleEndian);
				else assert(false);
				break;
			case 8:
				if (dataType === "float") this.writeOutputValue = (view, byteOffset, value) => view.setFloat64(byteOffset, value, littleEndian);
				else assert(false);
				break;
			default:
				assertNever(sampleSize);
				assert(false);
		}
	}
	async flushAndClose(forceClose) {
		try {
			if (!forceClose) {
				this.checkForEncoderError();
				if (this.resampler) await this.resampler.finalize();
			}
			this.closed = true;
			if (!forceClose) {
				if (this.customEncoder) this.customEncoderCallSerializer.call(() => this.customEncoder.flush());
				else if (this.encoder) await this.encoder.flush();
			}
		} finally {
			this.closed = true;
			this.resampler = null;
			if (this.customEncoder) await this.customEncoderCallSerializer.call(() => this.customEncoder.close()).catch((error) => this.setError(error));
			else if (this.encoder && this.encoder.state !== "closed") this.encoder.close();
		}
		if (!forceClose) this.checkForEncoderError();
	}
	getQueueSize() {
		if (this.customEncoder) return this.customEncoderQueueSize;
		else if (this.isPcmEncoder) return 0;
		else return this.encoder?.encodeQueueSize ?? 0;
	}
	checkForEncoderError() {
		if (this.errorSet) throw this.error;
	}
};
/**
* This source can be used to add raw, unencoded audio samples to an output audio track. These samples will
* automatically be encoded and then piped into the output.
* @group Media sources
* @public
*/
var AudioSampleSource = class extends AudioSource {
	/**
	* Creates a new {@link AudioSampleSource} whose samples are encoded according to the specified
	* {@link AudioEncodingConfig}.
	*/
	constructor(encodingConfig) {
		validateAudioEncodingConfig(encodingConfig);
		super(encodingConfig.codec);
		this._encoder = new AudioEncoderWrapper(this, encodingConfig);
	}
	/**
	* Encodes an audio sample and then adds it to the output.
	*
	* @returns A Promise that resolves once the output is ready to receive more samples. You should await this Promise
	* to respect writer and encoder backpressure.
	*/
	add(audioSample) {
		if (!(audioSample instanceof AudioSample)) throw new TypeError("audioSample must be an AudioSample.");
		return this._encoder.add(audioSample, false);
	}
	/** @internal */
	_flushAndClose(forceClose) {
		return this._encoder.flushAndClose(forceClose);
	}
};
/**
* Base class for subtitle sources - sources for subtitle tracks.
* @group Media sources
* @public
*/
var SubtitleSource = class extends MediaSource {
	/** Internal constructor. */
	constructor(codec) {
		super();
		/** @internal */
		this._connectedTrack = null;
		if (!SUBTITLE_CODECS.includes(codec)) throw new TypeError(`Invalid subtitle codec '${codec}'. Must be one of: ${SUBTITLE_CODECS.join(", ")}.`);
		this._codec = codec;
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/output-format.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* Base class representing an output media file format.
* @group Output formats
* @public
*/
var OutputFormat = class {
	/** Returns a list of video codecs that this output format can contain. */
	getSupportedVideoCodecs() {
		return this.getSupportedCodecs().filter((codec) => VIDEO_CODECS.includes(codec));
	}
	/** Returns a list of audio codecs that this output format can contain. */
	getSupportedAudioCodecs() {
		return this.getSupportedCodecs().filter((codec) => AUDIO_CODECS.includes(codec));
	}
	/** Returns a list of subtitle codecs that this output format can contain. */
	getSupportedSubtitleCodecs() {
		return this.getSupportedCodecs().filter((codec) => SUBTITLE_CODECS.includes(codec));
	}
	/** @internal */
	_codecUnsupportedHint(codec) {
		return "";
	}
	/** @internal */
	_isFragmentedIsobmff() {
		return false;
	}
};
/**
* Format representing files compatible with the ISO base media file format (ISOBMFF), like MP4 or MOV files.
* @group Output formats
* @public
*/
var IsobmffOutputFormat = class extends OutputFormat {
	/** Internal constructor. */
	constructor(options = {}) {
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (options.fastStart !== void 0 && ![
			false,
			"in-memory",
			"reserve",
			"fragmented"
		].includes(options.fastStart)) throw new TypeError("options.fastStart, when provided, must be false, 'in-memory', 'reserve', or 'fragmented'.");
		if (options.minimumFragmentDuration !== void 0 && (!isNumber(options.minimumFragmentDuration) || options.minimumFragmentDuration < 0)) throw new TypeError("options.minimumFragmentDuration, when provided, must be a non-negative number.");
		if (options.onFtyp !== void 0 && typeof options.onFtyp !== "function") throw new TypeError("options.onFtyp, when provided, must be a function.");
		if (options.onMoov !== void 0 && typeof options.onMoov !== "function") throw new TypeError("options.onMoov, when provided, must be a function.");
		if (options.onMdat !== void 0 && typeof options.onMdat !== "function") throw new TypeError("options.onMdat, when provided, must be a function.");
		if (options.onMoof !== void 0 && typeof options.onMoof !== "function") throw new TypeError("options.onMoof, when provided, must be a function.");
		if (options.metadataFormat !== void 0 && ![
			"mdir",
			"mdta",
			"udta",
			"auto"
		].includes(options.metadataFormat)) throw new TypeError("options.metadataFormat, when provided, must be either 'auto', 'mdir', 'mdta', or 'udta'.");
		super();
		this._options = options;
	}
	getSupportedTrackCounts() {
		const max = 2 ** 32 - 1;
		return {
			video: {
				min: 0,
				max
			},
			audio: {
				min: 0,
				max
			},
			subtitle: {
				min: 0,
				max
			},
			total: {
				min: 0,
				max
			}
		};
	}
	get supportsVideoRotationMetadata() {
		return true;
	}
	get supportsTimestampedMediaData() {
		return true;
	}
	get negativeTimestampSupport() {
		return "full";
	}
	/** @internal */
	_createMuxer(output) {
		return new IsobmffMuxer(output, this);
	}
	/** @internal */
	_isFragmentedIsobmff() {
		return this._options.fastStart === "fragmented";
	}
};
/**
* MPEG-4 Part 14 (MP4) file format. Supports most codecs.
* @group Output formats
* @public
*/
var Mp4OutputFormat = class extends IsobmffOutputFormat {
	/** Creates a new {@link Mp4OutputFormat} configured with the specified `options`. */
	constructor(options) {
		super(options);
	}
	/** @internal */
	get _name() {
		return "MP4";
	}
	get fileExtension() {
		return ".mp4";
	}
	get mimeType() {
		return "video/mp4";
	}
	getSupportedCodecs() {
		return [
			...VIDEO_CODECS,
			...NON_PCM_AUDIO_CODECS,
			"pcm-s16",
			"pcm-s16be",
			"pcm-s24",
			"pcm-s24be",
			"pcm-s32",
			"pcm-s32be",
			"pcm-f32",
			"pcm-f32be",
			"pcm-f64",
			"pcm-f64be",
			...SUBTITLE_CODECS
		];
	}
	/** @internal */
	_codecUnsupportedHint(codec) {
		if (new MovOutputFormat().getSupportedCodecs().includes(codec)) return " Switching to MOV will grant support for this codec.";
		return "";
	}
};
/**
* Creates a single Common Media Application Format (CMAF) segment. An init segment will be written to the
* {@link Target} specified in {@link OutputOptions.initTarget}. Supports most codecs.
* @group Output formats
* @public
*/
var CmafOutputFormat = class extends IsobmffOutputFormat {
	/** Creates a new {@link CmafOutputFormat} configured with the specified `options`. */
	constructor(options) {
		super(options);
	}
	/** @internal */
	get _name() {
		return "CMAF";
	}
	get fileExtension() {
		return ".m4s";
	}
	get mimeType() {
		return "video/mp4";
	}
	getSupportedCodecs() {
		return [
			...VIDEO_CODECS,
			...NON_PCM_AUDIO_CODECS,
			"pcm-s16",
			"pcm-s16be",
			"pcm-s24",
			"pcm-s24be",
			"pcm-s32",
			"pcm-s32be",
			"pcm-f32",
			"pcm-f32be",
			"pcm-f64",
			"pcm-f64be",
			...SUBTITLE_CODECS
		];
	}
};
/**
* QuickTime File Format (QTFF), often called MOV. Supports all video and audio codecs, but not subtitle codecs.
* @group Output formats
* @public
*/
var MovOutputFormat = class extends IsobmffOutputFormat {
	/** Creates a new {@link MovOutputFormat} configured with the specified `options`. */
	constructor(options) {
		super(options);
	}
	/** @internal */
	get _name() {
		return "MOV";
	}
	get fileExtension() {
		return ".mov";
	}
	get mimeType() {
		return "video/quicktime";
	}
	getSupportedCodecs() {
		return [...VIDEO_CODECS, ...AUDIO_CODECS];
	}
	/** @internal */
	_codecUnsupportedHint(codec) {
		if (new Mp4OutputFormat().getSupportedCodecs().includes(codec)) return " Switching to MP4 will grant support for this codec.";
		return "";
	}
};
/**
* Matroska file format.
*
* Supports writing transparent video. For a video track to be marked as transparent, the first packet added must
* contain alpha side data.
*
* @group Output formats
* @public
*/
var MkvOutputFormat = class extends OutputFormat {
	/** Creates a new {@link MkvOutputFormat} configured with the specified `options`. */
	constructor(options = {}) {
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (options.appendOnly !== void 0 && typeof options.appendOnly !== "boolean") throw new TypeError("options.appendOnly, when provided, must be a boolean.");
		if (options.minimumClusterDuration !== void 0 && (!isNumber(options.minimumClusterDuration) || options.minimumClusterDuration < 0)) throw new TypeError("options.minimumClusterDuration, when provided, must be a non-negative number.");
		if (options.onEbmlHeader !== void 0 && typeof options.onEbmlHeader !== "function") throw new TypeError("options.onEbmlHeader, when provided, must be a function.");
		if (options.onSegmentHeader !== void 0 && typeof options.onSegmentHeader !== "function") throw new TypeError("options.onHeader, when provided, must be a function.");
		if (options.onCluster !== void 0 && typeof options.onCluster !== "function") throw new TypeError("options.onCluster, when provided, must be a function.");
		super();
		this._options = options;
	}
	/** @internal */
	_createMuxer(output) {
		return new MatroskaMuxer(output, this);
	}
	/** @internal */
	get _name() {
		return "Matroska";
	}
	getSupportedTrackCounts() {
		const max = 127;
		return {
			video: {
				min: 0,
				max
			},
			audio: {
				min: 0,
				max
			},
			subtitle: {
				min: 0,
				max
			},
			total: {
				min: 0,
				max
			}
		};
	}
	get fileExtension() {
		return ".mkv";
	}
	get mimeType() {
		return "video/x-matroska";
	}
	getSupportedCodecs() {
		return [
			...VIDEO_CODECS,
			...NON_PCM_AUDIO_CODECS,
			...PCM_AUDIO_CODECS.filter((codec) => ![
				"pcm-s8",
				"pcm-f32be",
				"pcm-f64be",
				"ulaw",
				"alaw"
			].includes(codec)),
			...SUBTITLE_CODECS
		];
	}
	get supportsVideoRotationMetadata() {
		return false;
	}
	get supportsTimestampedMediaData() {
		return true;
	}
	get negativeTimestampSupport() {
		return "prefer-non-negative";
	}
};
/**
* WebM file format, based on Matroska.
*
* Supports writing transparent video. For a video track to be marked as transparent, the first packet added must
* contain alpha side data.
*
* @group Output formats
* @public
*/
var WebMOutputFormat = class extends MkvOutputFormat {
	/** Creates a new {@link WebMOutputFormat} configured with the specified `options`. */
	constructor(options) {
		super(options);
	}
	getSupportedCodecs() {
		return [
			...VIDEO_CODECS.filter((codec) => [
				"vp8",
				"vp9",
				"av1"
			].includes(codec)),
			...AUDIO_CODECS.filter((codec) => ["opus", "vorbis"].includes(codec)),
			...SUBTITLE_CODECS
		];
	}
	/** @internal */
	get _name() {
		return "WebM";
	}
	get fileExtension() {
		return ".webm";
	}
	get mimeType() {
		return "video/webm";
	}
	/** @internal */
	_codecUnsupportedHint(codec) {
		if (new MkvOutputFormat().getSupportedCodecs().includes(codec)) return " Switching to MKV will grant support for this codec.";
		return "";
	}
};
/**
* MP3 file format.
* @group Output formats
* @public
*/
var Mp3OutputFormat = class extends OutputFormat {
	/** Creates a new {@link Mp3OutputFormat} configured with the specified `options`. */
	constructor(options = {}) {
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (options.xingHeader !== void 0 && typeof options.xingHeader !== "boolean") throw new TypeError("options.xingHeader, when provided, must be a boolean.");
		if (options.onXingFrame !== void 0 && typeof options.onXingFrame !== "function") throw new TypeError("options.onXingFrame, when provided, must be a function.");
		super();
		this._options = options;
	}
	/** @internal */
	_createMuxer(output) {
		return new Mp3Muxer(output, this);
	}
	/** @internal */
	get _name() {
		return "MP3";
	}
	getSupportedTrackCounts() {
		return {
			video: {
				min: 0,
				max: 0
			},
			audio: {
				min: 1,
				max: 1
			},
			subtitle: {
				min: 0,
				max: 0
			},
			total: {
				min: 1,
				max: 1
			}
		};
	}
	get fileExtension() {
		return ".mp3";
	}
	get mimeType() {
		return "audio/mpeg";
	}
	getSupportedCodecs() {
		return ["mp3"];
	}
	get supportsVideoRotationMetadata() {
		return false;
	}
	get supportsTimestampedMediaData() {
		return false;
	}
	get negativeTimestampSupport() {
		return null;
	}
};
/**
* WAVE file format, based on RIFF.
* @group Output formats
* @public
*/
var WavOutputFormat = class extends OutputFormat {
	/** Creates a new {@link WavOutputFormat} configured with the specified `options`. */
	constructor(options = {}) {
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (options.large !== void 0 && typeof options.large !== "boolean") throw new TypeError("options.large, when provided, must be a boolean.");
		if (options.metadataFormat !== void 0 && !["info", "id3"].includes(options.metadataFormat)) throw new TypeError("options.metadataFormat, when provided, must be either 'info' or 'id3'.");
		if (options.onHeader !== void 0 && typeof options.onHeader !== "function") throw new TypeError("options.onHeader, when provided, must be a function.");
		super();
		this._options = options;
	}
	/** @internal */
	_createMuxer(output) {
		return new WaveMuxer(output, this);
	}
	/** @internal */
	get _name() {
		return "WAVE";
	}
	getSupportedTrackCounts() {
		return {
			video: {
				min: 0,
				max: 0
			},
			audio: {
				min: 1,
				max: 1
			},
			subtitle: {
				min: 0,
				max: 0
			},
			total: {
				min: 1,
				max: 1
			}
		};
	}
	get fileExtension() {
		return ".wav";
	}
	get mimeType() {
		return "audio/wav";
	}
	getSupportedCodecs() {
		return [...PCM_AUDIO_CODECS.filter((codec) => [
			"pcm-s16",
			"pcm-s24",
			"pcm-s32",
			"pcm-f32",
			"pcm-f64",
			"pcm-u8",
			"ulaw",
			"alaw"
		].includes(codec))];
	}
	get supportsVideoRotationMetadata() {
		return false;
	}
	get supportsTimestampedMediaData() {
		return false;
	}
	get negativeTimestampSupport() {
		return null;
	}
};
/**
* Ogg file format.
* @group Output formats
* @public
*/
var OggOutputFormat = class extends OutputFormat {
	/** Creates a new {@link OggOutputFormat} configured with the specified `options`. */
	constructor(options = {}) {
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (options.maximumPageDuration !== void 0 && (!isNumber(options.maximumPageDuration) || options.maximumPageDuration <= 0)) throw new TypeError("options.maximumPageDuration, when provided, must be a positive number.");
		if (options.onPage !== void 0 && typeof options.onPage !== "function") throw new TypeError("options.onPage, when provided, must be a function.");
		super();
		this._options = options;
	}
	/** @internal */
	_createMuxer(output) {
		return new OggMuxer(output, this);
	}
	/** @internal */
	get _name() {
		return "Ogg";
	}
	getSupportedTrackCounts() {
		const max = 2 ** 32;
		return {
			video: {
				min: 0,
				max: 0
			},
			audio: {
				min: 0,
				max
			},
			subtitle: {
				min: 0,
				max: 0
			},
			total: {
				min: 0,
				max
			}
		};
	}
	get fileExtension() {
		return ".ogg";
	}
	get mimeType() {
		return "application/ogg";
	}
	getSupportedCodecs() {
		return [...AUDIO_CODECS.filter((codec) => ["vorbis", "opus"].includes(codec))];
	}
	get supportsVideoRotationMetadata() {
		return false;
	}
	get supportsTimestampedMediaData() {
		return false;
	}
	get negativeTimestampSupport() {
		return null;
	}
};
/**
* ADTS file format.
* @group Output formats
* @public
*/
var AdtsOutputFormat = class extends OutputFormat {
	/** Creates a new {@link AdtsOutputFormat} configured with the specified `options`. */
	constructor(options = {}) {
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (options.onFrame !== void 0 && typeof options.onFrame !== "function") throw new TypeError("options.onFrame, when provided, must be a function.");
		super();
		this._options = options;
	}
	/** @internal */
	_createMuxer(output) {
		return new AdtsMuxer(output, this);
	}
	/** @internal */
	get _name() {
		return "ADTS";
	}
	getSupportedTrackCounts() {
		return {
			video: {
				min: 0,
				max: 0
			},
			audio: {
				min: 1,
				max: 1
			},
			subtitle: {
				min: 0,
				max: 0
			},
			total: {
				min: 1,
				max: 1
			}
		};
	}
	get fileExtension() {
		return ".aac";
	}
	get mimeType() {
		return "audio/aac";
	}
	getSupportedCodecs() {
		return ["aac"];
	}
	get supportsVideoRotationMetadata() {
		return false;
	}
	get supportsTimestampedMediaData() {
		return false;
	}
	get negativeTimestampSupport() {
		return null;
	}
};
/**
* FLAC file format.
* @group Output formats
* @public
*/
var FlacOutputFormat = class extends OutputFormat {
	/** Creates a new {@link FlacOutputFormat} configured with the specified `options`. */
	constructor(options = {}) {
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (options.appendOnly !== void 0 && typeof options.appendOnly !== "boolean") throw new TypeError("options.appendOnly, when provided, must be a boolean.");
		super();
		this._options = options;
	}
	/** @internal */
	_createMuxer(output) {
		return new FlacMuxer(output, this);
	}
	/** @internal */
	get _name() {
		return "FLAC";
	}
	getSupportedTrackCounts() {
		return {
			video: {
				min: 0,
				max: 0
			},
			audio: {
				min: 1,
				max: 1
			},
			subtitle: {
				min: 0,
				max: 0
			},
			total: {
				min: 1,
				max: 1
			}
		};
	}
	get fileExtension() {
		return ".flac";
	}
	get mimeType() {
		return "audio/flac";
	}
	getSupportedCodecs() {
		return ["flac"];
	}
	get supportsVideoRotationMetadata() {
		return false;
	}
	get supportsTimestampedMediaData() {
		return false;
	}
	get negativeTimestampSupport() {
		return null;
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/mediabunny@1.56.1/node_modules/mediabunny/dist/modules/src/output.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* List of all track types.
* @group Miscellaneous
* @public
*/
var ALL_TRACK_TYPES = [
	"video",
	"audio",
	"subtitle"
];
/**
* Represents a track added to an {@link Output}.
* @group Output files
* @public
*/
var OutputTrack = class OutputTrack {
	/** @internal */
	constructor(id, output, type, source, metadata) {
		this.id = id;
		this.output = output;
		this.type = type;
		this.source = source;
		this.metadata = metadata;
	}
	/** Returns true if and only if this track is a video track. */
	isVideoTrack() {
		return this.type === "video";
	}
	/** Returns true if and only if this track is an audio track. */
	isAudioTrack() {
		return this.type === "audio";
	}
	/** Returns true if and only if this track is a subtitle track. */
	isSubtitleTrack() {
		return this.type === "subtitle";
	}
	/**
	* Returns true if and only if this track can be paired with the given other track. Pairability can be set using
	* the {@link BaseTrackMetadata.group} option.
	*/
	canBePairedWith(other) {
		if (!(other instanceof OutputTrack)) throw new TypeError("other must be an OutputTrack.");
		if (this === other) return false;
		const thisGroups = toArray(this.metadata.group);
		const otherGroups = toArray(other.metadata.group);
		for (const aGroup of thisGroups) {
			if (this.type !== other.type && otherGroups.some((bGroup) => aGroup === bGroup)) return true;
			if (otherGroups.some((bGroup) => aGroup._pairedGroups.has(bGroup))) return true;
		}
		return false;
	}
};
/**
* An {@link OutputTrack} providing video data, created using {@link Output.addVideoTrack}.
* @group Output files
* @public
*/
var OutputVideoTrack = class extends OutputTrack {
	/** @internal */
	constructor(id, output, source, metadata) {
		super(id, output, "video", source, metadata);
	}
};
/**
* An {@link OutputTrack} providing audio data, created using {@link Output.addAudioTrack}.
* @group Output files
* @public
*/
var OutputAudioTrack = class extends OutputTrack {
	/** @internal */
	constructor(id, output, source, metadata) {
		super(id, output, "audio", source, metadata);
	}
};
/**
* An {@link OutputTrack} providing subtitle data, created using {@link Output.addSubtitleTrack}.
* @group Output files
* @public
*/
var OutputSubtitleTrack = class extends OutputTrack {
	/** @internal */
	constructor(id, output, source, metadata) {
		super(id, output, "subtitle", source, metadata);
	}
};
/**
* Used to define pairability between {@link OutputTrack} instances. First create the group, then assign tracks to it
* via {@link BaseTrackMetadata.group}.
*
* Two tracks are considered _pairable_ if they are in the same group but have a different {@link TrackType}, or if they
* are in different groups that are paired with each other. Groups can be paired with each other using the
* {@link OutputTrackGroup.pairWith} method.
*
* @group Output files
* @public
*/
var OutputTrackGroup = class OutputTrackGroup {
	/** Creates a new {@link OutputTrackGroup}. */
	constructor() {
		/** @internal */
		this._pairedGroups = /* @__PURE__ */ new Set();
	}
	/**
	* Marks this group as being pairable with another group, symmetrically. Output tracks where each track is assigned
	* to one half of a group pairing are then considered pairable.
	*
	* You cannot pair a group with itself.
	*/
	pairWith(other) {
		if (!(other instanceof OutputTrackGroup)) throw new TypeError("other must be an OutputTrackGroup.");
		if (this === other) throw new TypeError("Cannot pair a group with itself.");
		this._pairedGroups.add(other);
		other._pairedGroups.add(this);
	}
};
var validateBaseTrackMetadata = (metadata) => {
	if (!metadata || typeof metadata !== "object") throw new TypeError("metadata must be an object.");
	if (metadata.languageCode !== void 0 && !isIso639Dash2LanguageCode(metadata.languageCode)) throw new TypeError("metadata.languageCode, when provided, must be a three-letter, ISO 639-2/T language code.");
	if (metadata.name !== void 0 && typeof metadata.name !== "string") throw new TypeError("metadata.name, when provided, must be a string.");
	if (metadata.disposition !== void 0) validateTrackDisposition(metadata.disposition);
	if (metadata.maximumPacketCount !== void 0 && (!Number.isInteger(metadata.maximumPacketCount) || metadata.maximumPacketCount < 0)) throw new TypeError("metadata.maximumPacketCount, when provided, must be a non-negative integer.");
	if (metadata.group !== void 0 && !(metadata.group instanceof OutputTrackGroup) && (!Array.isArray(metadata.group) || metadata.group.some((group) => !(group instanceof OutputTrackGroup)))) throw new TypeError("metadata.group, when provided, must be an OutputTrackGroup instance or an array of OutputTrackGroup instances.");
};
/**
* Main class orchestrating the creation of new media files.
* @group Output files
* @public
*/
var Output = class extends EventEmitter {
	/**
	* The target to which the root file will be written. Throws when using {@link PathedTarget} with an async callback;
	* prefer the `'target'` event for those cases.
	*/
	get target() {
		const errorMessage = "Output.target cannot be used when using PathedTarget with an async callback. Use the 'target' event instead.";
		if (this._rootTargetPromise) throw new TypeError(errorMessage);
		const rootTargetResult = this._getRootTarget();
		if (isThenable(rootTargetResult)) throw new TypeError(errorMessage);
		return rootTargetResult;
	}
	/**
	* Creates a new instance of {@link Output} which can then be used to create a new media file according to the
	* specified {@link OutputOptions}.
	*/
	constructor(options) {
		super();
		/** The current state of the output. */
		this.state = "pending";
		/**
		* The {@link OutputTrackGroup} that all tracks are assigned to by default unless otherwise specified by
		* {@link BaseTrackMetadata.group}.
		*/
		this.defaultTrackGroup = new OutputTrackGroup();
		/**
		* The tracks that have been added to this output. Treat it as a readonly field; to add tracks, use the methods.
		*/
		this.tracks = [];
		/** @internal */
		this._onFinalize = null;
		/** @internal */
		this._unfinalizedTargets = /* @__PURE__ */ new Set();
		/** @internal */
		this._rootWriterPromise = null;
		/** @internal */
		this._startPromise = null;
		/** @internal */
		this._cancelPromise = null;
		/** @internal */
		this._finalizePromise = null;
		/** @internal */
		this._mutex = new AsyncMutex();
		/** @internal */
		this._metadataTags = {};
		/** @internal */
		this._rootTarget = null;
		/** @internal */
		this._rootTargetPromise = null;
		/**
		* This field is used to synchronize multiple MediaStreamTracks. They use the same time coordinate system across
		* tracks, and to ensure correct audio-video sync, we must use the same offset for all of them. The reason an offset
		* is needed at all is because the timestamps typically don't start at zero.
		* @internal
		*/
		this._firstMediaStreamTimestamp = null;
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (!(options.format instanceof OutputFormat)) throw new TypeError("options.format must be an OutputFormat.");
		if (!(options.target instanceof Target || options.target instanceof PathedTarget)) throw new TypeError("options.target must be a Target or a PathedTarget.");
		if (options.target instanceof Target) this._rememberTarget(options.target);
		if (options.initTarget !== void 0 && !(options.initTarget instanceof Target) && typeof options.initTarget !== "function") throw new Error("options.initTarget, when provided, must be a Target or a function that returns or resolves to a Target.");
		if (options.onFinalize !== void 0 && typeof options.onFinalize !== "function") throw new TypeError("options.onFinalize, when provided, must be a function.");
		this.format = options.format;
		this._target = options.target;
		this._onFinalize = options.onFinalize ?? null;
		this._initTarget = options.initTarget ?? null;
		if (this._initTarget instanceof Target) this._rememberTarget(this._initTarget);
		this._muxer = options.format._createMuxer(this);
	}
	/** @internal */
	_getTargetValidated(request) {
		assert(this._target instanceof PathedTarget);
		const result = this._target.getTarget(request);
		const handleResult = (result) => {
			if (!(result instanceof Target)) throw new TypeError("getTarget must return a Target.");
			return result;
		};
		if (isThenable(result)) return result.then(handleResult);
		else return handleResult(result);
	}
	/** @internal */
	async _getTarget(request) {
		assert(this._target instanceof PathedTarget);
		const target = await this._getTargetValidated(request);
		this._emit("target", {
			target,
			request,
			isRoot: request.isRoot
		});
		if (this.state === "canceled") await target._close();
		else this._rememberTarget(target);
		return target;
	}
	/** @internal */
	_rememberTarget(target) {
		this._unfinalizedTargets.add(target);
		target.on("finalized", () => this._unfinalizedTargets.delete(target), { once: true });
	}
	/** @internal */
	async _getInitTarget() {
		assert(this._initTarget !== null);
		if (this._initTarget instanceof Target) return this._initTarget;
		const target = await this._initTarget();
		if (this.state === "canceled") await target._close();
		else this._rememberTarget(target);
		return target;
	}
	/** @internal */
	_hasInitTarget() {
		return this._initTarget !== null;
	}
	/** @internal */
	_getRootTarget() {
		if (this._rootTarget) return this._rootTarget;
		if (this._rootTargetPromise) return this._rootTargetPromise;
		if (this._target instanceof Target) {
			this._emit("target", {
				target: this._target,
				request: null,
				isRoot: true
			});
			this._rootTarget = this._target;
			return this._target;
		}
		const request = {
			path: this._target.rootPath,
			isRoot: true,
			mimeType: this.format.mimeType
		};
		const result = this._getTargetValidated(request);
		const handleResult = (target) => {
			if (this.state === "canceled") target._close();
			else this._rememberTarget(target);
			this._emit("target", {
				target,
				request,
				isRoot: true
			});
			this._rootTarget = target;
			return target;
		};
		if (isThenable(result)) return this._rootTargetPromise = result.then(handleResult);
		else return handleResult(result);
	}
	/** @internal */
	_getRootWriter(isMonotonic) {
		return this._rootWriterPromise ??= (async () => {
			const target = await this._getRootTarget();
			const writer = new Writer(target, typeof isMonotonic === "boolean" ? isMonotonic : isMonotonic(target));
			writer.start();
			return writer;
		})();
	}
	/** Adds a video track to the output with the given source. Can only be called before the output is started. */
	addVideoTrack(source, metadata = {}) {
		if (!(source instanceof VideoSource)) throw new TypeError("source must be a VideoSource.");
		validateBaseTrackMetadata(metadata);
		if (metadata.rotation !== void 0 && ![
			0,
			90,
			180,
			270
		].includes(metadata.rotation)) throw new TypeError(`Invalid video rotation: ${metadata.rotation}. Has to be 0, 90, 180 or 270.`);
		if (!this.format.supportsVideoRotationMetadata && metadata.rotation) throw new Error(`${this.format._name} does not support video rotation metadata.`);
		if (metadata.frameRate !== void 0 && (!Number.isFinite(metadata.frameRate) || metadata.frameRate <= 0)) throw new TypeError(`Invalid video frame rate: ${metadata.frameRate}. Must be a positive number.`);
		if (metadata.decoderConfig !== void 0) validateVideoChunkMetadata({ decoderConfig: metadata.decoderConfig }, source._codec);
		if (metadata.primingPacket !== void 0) {
			if (!(metadata.primingPacket instanceof EncodedPacket)) throw new TypeError("metadata.primingPacket, when provided, must be an EncodedPacket.");
			if (metadata.decoderConfig === void 0) throw new TypeError("metadata.primingPacket can only be provided alongside metadata.decoderConfig.");
		}
		const metadataCopy = { ...metadata };
		metadataCopy.group ??= this.defaultTrackGroup;
		return this._addTrack(new OutputVideoTrack(this.tracks.length + 1, this, source, metadataCopy));
	}
	/** Adds an audio track to the output with the given source. Can only be called before the output is started. */
	addAudioTrack(source, metadata = {}) {
		if (!(source instanceof AudioSource)) throw new TypeError("source must be an AudioSource.");
		validateBaseTrackMetadata(metadata);
		if (metadata.decoderConfig !== void 0) validateAudioChunkMetadata({ decoderConfig: metadata.decoderConfig }, source._codec);
		if (metadata.primingPacket !== void 0) {
			if (!(metadata.primingPacket instanceof EncodedPacket)) throw new TypeError("metadata.primingPacket, when provided, must be an EncodedPacket.");
			if (metadata.decoderConfig === void 0) throw new TypeError("metadata.primingPacket can only be provided alongside metadata.decoderConfig.");
		}
		const metadataCopy = { ...metadata };
		metadataCopy.group ??= this.defaultTrackGroup;
		return this._addTrack(new OutputAudioTrack(this.tracks.length + 1, this, source, metadataCopy));
	}
	/** Adds a subtitle track to the output with the given source. Can only be called before the output is started. */
	addSubtitleTrack(source, metadata = {}) {
		if (!(source instanceof SubtitleSource)) throw new TypeError("source must be a SubtitleSource.");
		validateBaseTrackMetadata(metadata);
		const metadataCopy = { ...metadata };
		metadataCopy.group ??= this.defaultTrackGroup;
		return this._addTrack(new OutputSubtitleTrack(this.tracks.length + 1, this, source, metadataCopy));
	}
	/**
	* Sets descriptive metadata tags about the media file, such as title, author, date, or cover art. When called
	* multiple times, only the metadata from the last call will be used.
	*
	* Can only be called before the output is started.
	*/
	setMetadataTags(tags) {
		validateMetadataTags(tags);
		if (this.state !== "pending") throw new Error("Cannot set metadata tags after output has been started or canceled.");
		this._metadataTags = tags;
	}
	/** @internal */
	_addTrack(track) {
		if (this.state !== "pending") throw new Error("Cannot add track after output has been started or canceled.");
		if (track.source._connectedTrack) throw new Error("Source is already used for a track.");
		const supportedTrackCounts = this.format.getSupportedTrackCounts();
		const presentTracksOfThisType = this.tracks.reduce((count, t) => count + (t.type === track.type ? 1 : 0), 0);
		const maxCount = supportedTrackCounts[track.type].max;
		if (presentTracksOfThisType === maxCount) throw new Error(maxCount === 0 ? `${this.format._name} does not support ${track.type} tracks.` : `${this.format._name} does not support more than ${maxCount} ${track.type} track${maxCount === 1 ? "" : "s"}.`);
		const maxTotalCount = supportedTrackCounts.total.max;
		if (this.tracks.length === maxTotalCount) throw new Error(`${this.format._name} does not support more than ${maxTotalCount} tracks${maxTotalCount === 1 ? "" : "s"} in total.`);
		if (track.isVideoTrack()) {
			const supportedVideoCodecs = this.format.getSupportedVideoCodecs();
			if (supportedVideoCodecs.length === 0) throw new Error(`${this.format._name} does not support video tracks.` + this.format._codecUnsupportedHint(track.source._codec));
			else if (!supportedVideoCodecs.includes(track.source._codec)) throw new Error(`Codec '${track.source._codec}' cannot be contained within ${this.format._name}. Supported video codecs are: ${supportedVideoCodecs.map((codec) => `'${codec}'`).join(", ")}.` + this.format._codecUnsupportedHint(track.source._codec));
		} else if (track.isAudioTrack()) {
			const supportedAudioCodecs = this.format.getSupportedAudioCodecs();
			if (supportedAudioCodecs.length === 0) throw new Error(`${this.format._name} does not support audio tracks.` + this.format._codecUnsupportedHint(track.source._codec));
			else if (!supportedAudioCodecs.includes(track.source._codec)) throw new Error(`Codec '${track.source._codec}' cannot be contained within ${this.format._name}. Supported audio codecs are: ${supportedAudioCodecs.map((codec) => `'${codec}'`).join(", ")}.` + this.format._codecUnsupportedHint(track.source._codec));
		} else if (track.isSubtitleTrack()) {
			const supportedSubtitleCodecs = this.format.getSupportedSubtitleCodecs();
			if (supportedSubtitleCodecs.length === 0) throw new Error(`${this.format._name} does not support subtitle tracks.` + this.format._codecUnsupportedHint(track.source._codec));
			else if (!supportedSubtitleCodecs.includes(track.source._codec)) throw new Error(`Codec '${track.source._codec}' cannot be contained within ${this.format._name}. Supported subtitle codecs are: ${supportedSubtitleCodecs.map((codec) => `'${codec}'`).join(", ")}.` + this.format._codecUnsupportedHint(track.source._codec));
		}
		this.tracks.push(track);
		track.source._connectedTrack = track;
		return track;
	}
	/**
	* Whether the output has enough tracks (of the correct type) to be started, based on the requirements of the output
	* format.
	*/
	hasEnoughTracks() {
		const supportedTrackCounts = this.format.getSupportedTrackCounts();
		for (const trackType of ALL_TRACK_TYPES) if (this.tracks.reduce((count, track) => count + (track.type === trackType ? 1 : 0), 0) < supportedTrackCounts[trackType].min) return false;
		const totalMinCount = supportedTrackCounts.total.min;
		if (this.tracks.length < totalMinCount) return false;
		return true;
	}
	/**
	* Starts the creation of the output file. This method should be called after all tracks have been added. Only after
	* the output has started can media samples be added to the tracks.
	*
	* @returns A promise that resolves when the output has successfully started and is ready to receive media samples.
	*/
	async start() {
		const supportedTrackCounts = this.format.getSupportedTrackCounts();
		for (const trackType of ALL_TRACK_TYPES) {
			const presentTracksOfThisType = this.tracks.reduce((count, track) => count + (track.type === trackType ? 1 : 0), 0);
			const minCount = supportedTrackCounts[trackType].min;
			if (presentTracksOfThisType < minCount) throw new Error(minCount === supportedTrackCounts[trackType].max ? `${this.format._name} requires exactly ${minCount} ${trackType} track${minCount === 1 ? "" : "s"}.` : `${this.format._name} requires at least ${minCount} ${trackType} track${minCount === 1 ? "" : "s"}.`);
		}
		const totalMinCount = supportedTrackCounts.total.min;
		if (this.tracks.length < totalMinCount) throw new Error(totalMinCount === supportedTrackCounts.total.max ? `${this.format._name} requires exactly ${totalMinCount} track${totalMinCount === 1 ? "" : "s"}.` : `${this.format._name} requires at least ${totalMinCount} track${totalMinCount === 1 ? "" : "s"}.`);
		if (this.state === "canceled") throw new Error("Output has been canceled.");
		if (this._startPromise) {
			Logging._warn("Output has already been started.");
			return this._startPromise;
		}
		return this._startPromise = (async () => {
			this.state = "started";
			const releasePromise = this._mutex.acquire();
			try {
				await this._muxer.start();
				const promises = this.tracks.map((track) => track.source._start());
				await Promise.all(promises);
			} finally {
				(await releasePromise)();
			}
		})();
	}
	/**
	* Resolves with the full MIME type of the output file, including track codecs.
	*
	* The returned promise will resolve only once the precise codec strings of all tracks are known.
	*/
	getMimeType() {
		return this._muxer.getMimeType();
	}
	/**
	* Cancels the creation of the output file, releasing internal resources like encoders and preventing further
	* samples from being added.
	*
	* @returns A promise that resolves once all internal resources have been released.
	*/
	async cancel() {
		if (this._cancelPromise) {
			Logging._warn("Output has already been canceled.");
			return this._cancelPromise;
		} else if (this.state === "finalizing" || this.state === "finalized") {
			if (this.state === "finalized") Logging._warn("Output has already been finalized.");
			return;
		}
		return this._cancelPromise = (async () => {
			this.state = "canceled";
			const release = await this._mutex.acquire();
			try {
				const promises = this.tracks.map((x) => x.source._flushOrWaitForOngoingClose(true));
				await Promise.all(promises);
				await Promise.all([...this._unfinalizedTargets].map((target) => target._close()));
				this._unfinalizedTargets.clear();
			} finally {
				release();
			}
		})();
	}
	/**
	* Finalizes the output file. This method must be called after all media samples across all tracks have been added.
	* Once the Promise returned by this method completes, the output file is ready.
	*/
	async finalize() {
		if (this.state === "pending") throw new Error("Cannot finalize before starting.");
		if (this.state === "canceled") throw new Error("Cannot finalize after canceling.");
		if (this._finalizePromise) {
			Logging._warn("Output has already been finalized.");
			return this._finalizePromise;
		}
		return this._finalizePromise = (async () => {
			this.state = "finalizing";
			const release = await this._mutex.acquire();
			try {
				const promises = this.tracks.map((x) => x.source._flushOrWaitForOngoingClose(false));
				await Promise.all(promises);
				await this._muxer.finalize();
				if (this._rootWriterPromise) {
					const rootWriter = await this._rootWriterPromise;
					if (!rootWriter.finalized) {
						await rootWriter.flush();
						await rootWriter.finalize();
					}
				}
				if (this._onFinalize) await this._onFinalize();
				this.state = "finalized";
			} finally {
				await Promise.all([...this._unfinalizedTargets].map((target) => target._close().catch(() => {})));
				this._unfinalizedTargets.clear();
				release();
			}
		})();
	}
};
//#endregion
//#region ../opt/frame/node_modules/.pnpm/remotion@4.0.530_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/remotion/dist/esm/version.mjs
var VERSION = "4.0.530";
//#endregion
//#region ../opt/frame/node_modules/.pnpm/@remotion+web-renderer@4.0.530_react-dom@19.3.0_react@19.3.0__react@19.3.0/node_modules/@remotion/web-renderer/dist/esm/index.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_react_dom = require_react_dom();
var import_client = /* @__PURE__ */ __toESM(require_client(), 1);
var import_jsx_runtime = require_jsx_runtime();
var __dispose = Symbol.dispose || /* @__PURE__ */ Symbol.for("Symbol.dispose");
var __asyncDispose = Symbol.asyncDispose || /* @__PURE__ */ Symbol.for("Symbol.asyncDispose");
var __using = (stack, value, async) => {
	if (value != null) {
		if (typeof value !== "object" && typeof value !== "function") throw TypeError("Object expected to be assigned to \"using\" declaration");
		var dispose;
		if (async) dispose = value[__asyncDispose];
		if (dispose === void 0) dispose = value[__dispose];
		if (typeof dispose !== "function") throw TypeError("Object not disposable");
		stack.push([
			async,
			dispose,
			value
		]);
	} else if (async) stack.push([async]);
	return value;
};
var __callDispose = (stack, error, hasError) => {
	var E = typeof SuppressedError === "function" ? SuppressedError : function(e, s, m, _) {
		return _ = Error(m), _.name = "SuppressedError", _.error = e, _.suppressed = s, _;
	}, fail = (e) => error = hasError ? new E(e, error, "An error was suppressed during disposal") : (hasError = true, e), next = (it) => {
		while (it = stack.pop()) try {
			var result = it[1] && it[1].call(it[2]);
			if (it[0]) return Promise.resolve(result).then(next, (e) => (fail(e), next()));
		} catch (e) {
			fail(e);
		}
		if (hasError) throw error;
	};
	return next();
};
if (typeof Symbol.dispose !== "symbol") Object.defineProperty(Symbol, "dispose", { value: Symbol.for("dispose") });
if (typeof Symbol.asyncDispose !== "symbol") Object.defineProperty(Symbol, "asyncDispose", { value: Symbol.for("asyncDispose") });
var canUseWebFsWriter = async () => {
	if (!("storage" in navigator)) return false;
	if (!("getDirectory" in navigator.storage)) return false;
	try {
		return (await (await navigator.storage.getDirectory()).getFileHandle("remotion-probe-web-fs-support", { create: true })).createWritable !== void 0;
	} catch {
		return false;
	}
};
var checkWebGLSupport = () => {
	try {
		const canvas = new OffscreenCanvas(1, 1);
		if (!(canvas.getContext("webgl2") || canvas.getContext("webgl"))) return {
			type: "webgl-unsupported",
			message: "WebGL is not supported. 3D CSS transforms will fail.",
			severity: "error"
		};
		return null;
	} catch {
		return {
			type: "webgl-unsupported",
			message: "WebGL is not supported. 3D CSS transforms will fail.",
			severity: "error"
		};
	}
};
var isAudioOnlyContainer = (container) => {
	return container === "wav" || container === "mp3" || container === "aac" || container === "ogg" || container === "flac";
};
var codecToMediabunnyCodec = (codec) => {
	switch (codec) {
		case "h264": return "avc";
		case "h265": return "hevc";
		case "vp8": return "vp8";
		case "vp9": return "vp9";
		case "av1": return "av1";
		default: throw new Error(`Unsupported codec: ${codec}`);
	}
};
var containerToMediabunnyContainer = (container) => {
	switch (container) {
		case "mp4": return new Mp4OutputFormat({ fastStart: "reserve" });
		case "webm": return new WebMOutputFormat();
		case "mkv": return new MkvOutputFormat();
		case "wav": return new WavOutputFormat();
		case "mp3": return new Mp3OutputFormat();
		case "aac": return new AdtsOutputFormat();
		case "ogg": return new OggOutputFormat();
		case "flac": return new FlacOutputFormat();
		case "mov": return new MovOutputFormat({ fastStart: "reserve" });
		default: throw new Error(`Unsupported container: ${container}`);
	}
};
var getDefaultVideoCodecForContainer = (container) => {
	switch (container) {
		case "mp4": return "h264";
		case "webm": return "vp8";
		case "mkv":
		case "mov": return "h264";
		case "wav":
		case "mp3":
		case "aac":
		case "ogg":
		case "flac": return null;
		default: throw new Error(`Unsupported container: ${container}`);
	}
};
var getDefaultContainerForCodec = (codec) => {
	switch (codec) {
		case "h264":
		case "h265":
		case "av1": return "mp4";
		case "vp8":
		case "vp9": return "webm";
		default: throw new Error(`Unsupported codec: ${codec}`);
	}
};
var getQualityForWebRendererQuality = (quality) => {
	return new Quality({
		quality,
		preferBitrate: true
	});
};
var getMimeType = (container) => {
	switch (container) {
		case "mp4": return "video/mp4";
		case "webm": return "video/webm";
		case "mkv": return "video/x-matroska";
		case "wav": return "audio/wav";
		case "mp3": return "audio/mpeg";
		case "aac": return "audio/aac";
		case "ogg": return "audio/ogg";
		case "flac": return "audio/flac";
		case "mov": return "video/quicktime";
		default: throw new Error(`Unsupported container: ${container}`);
	}
};
var getDefaultAudioCodecForContainer = (container) => {
	switch (container) {
		case "mp4": return "aac";
		case "webm": return "opus";
		case "mkv": return "aac";
		case "wav": return "pcm-s16";
		case "mp3": return "mp3";
		case "aac": return "aac";
		case "ogg": return "opus";
		case "flac": return "flac";
		case "mov": return "aac";
		default: throw new Error(`Unsupported container: ${container}`);
	}
};
var WEB_RENDERER_VIDEO_CODECS = [
	"h264",
	"h265",
	"vp8",
	"vp9",
	"av1"
];
var getSupportedVideoCodecsForContainer = (container) => {
	if (isAudioOnlyContainer(container)) return [];
	const allSupported = containerToMediabunnyContainer(container).getSupportedVideoCodecs();
	return WEB_RENDERER_VIDEO_CODECS.filter((codec) => allSupported.includes(codecToMediabunnyCodec(codec)));
};
var WEB_RENDERER_AUDIO_CODECS = [
	"aac",
	"opus",
	"mp3",
	"vorbis",
	"pcm-s16",
	"flac"
];
var audioCodecToMediabunnyAudioCodec = (audioCodec) => {
	switch (audioCodec) {
		case "aac": return "aac";
		case "opus": return "opus";
		case "mp3": return "mp3";
		case "vorbis": return "vorbis";
		case "pcm-s16": return "pcm-s16";
		case "flac": return "flac";
		default: throw new Error(`Unsupported audio codec: ${audioCodec}`);
	}
};
var getSupportedAudioCodecsForContainer = (container) => {
	const allSupported = containerToMediabunnyContainer(container).getSupportedAudioCodecs();
	return WEB_RENDERER_AUDIO_CODECS.filter((codec) => allSupported.includes(audioCodecToMediabunnyAudioCodec(codec)));
};
var registrationPromise = null;
var doRegister = async () => {
	if (!await canEncodeAudio("aac")) {
		const { registerAacEncoder } = await import("./mediabunny-aac-encoder-C_n9Pp4X.js");
		registerAacEncoder();
	}
};
var ensureAacEncoderRegistered = () => {
	if (!registrationPromise) registrationPromise = doRegister();
	return registrationPromise;
};
var registrationPromise2 = null;
var doRegister2 = async () => {
	if (!await canEncodeAudio("flac")) {
		const { registerFlacEncoder } = await import("./mediabunny-flac-encoder-CvSn5reU.js");
		registerFlacEncoder();
	}
};
var ensureFlacEncoderRegistered = () => {
	if (!registrationPromise2) registrationPromise2 = doRegister2();
	return registrationPromise2;
};
var registrationPromise3 = null;
var doRegister3 = async () => {
	if (!await canEncodeAudio("mp3")) {
		const { registerMp3Encoder } = await import("./mediabunny-mp3-encoder-CMTL7eKD.js");
		registerMp3Encoder();
	}
};
var ensureMp3EncoderRegistered = () => {
	if (!registrationPromise3) registrationPromise3 = doRegister3();
	return registrationPromise3;
};
var resolveAudioCodec = async (options) => {
	const issues = [];
	const { container, requestedCodec, userSpecifiedAudioCodec, bitrate } = options;
	const audioCodec = requestedCodec ?? getDefaultAudioCodecForContainer(container);
	const supportedAudioCodecs = getSupportedAudioCodecsForContainer(container);
	if (!supportedAudioCodecs.includes(audioCodec)) {
		issues.push({
			type: "audio-codec-unsupported",
			message: `Audio codec "${audioCodec}" is not supported for container "${container}". Supported: ${supportedAudioCodecs.join(", ")}`,
			severity: "error"
		});
		return {
			codec: null,
			issues
		};
	}
	const mediabunnyAudioCodec = audioCodecToMediabunnyAudioCodec(audioCodec);
	if (audioCodec === "mp3") await ensureMp3EncoderRegistered();
	if (audioCodec === "aac") await ensureAacEncoderRegistered();
	if (audioCodec === "flac") await ensureFlacEncoderRegistered();
	if (await canEncodeAudio(mediabunnyAudioCodec, { bitrate })) return {
		codec: audioCodec,
		issues
	};
	if (userSpecifiedAudioCodec) {
		issues.push({
			type: "audio-codec-unsupported",
			message: `Audio codec "${audioCodec}" cannot be encoded by this browser. This is common for AAC on Firefox. Try using "opus" instead.`,
			severity: "error"
		});
		return {
			codec: null,
			issues
		};
	}
	for (const fallbackCodec of supportedAudioCodecs) if (fallbackCodec !== audioCodec) {
		if (fallbackCodec === "mp3") await ensureMp3EncoderRegistered();
		if (fallbackCodec === "aac") await ensureAacEncoderRegistered();
		if (fallbackCodec === "flac") await ensureFlacEncoderRegistered();
		const fallbackMediabunnyCodec = audioCodecToMediabunnyAudioCodec(fallbackCodec);
		if (await canEncodeAudio(fallbackMediabunnyCodec, { bitrate })) {
			issues.push({
				type: "audio-codec-unsupported",
				message: `Falling back from audio codec "${audioCodec}" to "${fallbackCodec}" because the original codec cannot be encoded by this browser.`,
				severity: "warning"
			});
			return {
				codec: fallbackCodec,
				issues
			};
		}
	}
	issues.push({
		type: "audio-codec-unsupported",
		message: `No audio codec can be encoded by this browser for container "${container}".`,
		severity: "error"
	});
	return {
		codec: null,
		issues
	};
};
var getEncodedDimensions = ({ width, height, scale, codec }) => {
	if (!(codec === "h264" || codec === "h265" || codec === "av1")) return {
		width: Math.ceil(width * scale),
		height: Math.ceil(height * scale)
	};
	let heightWithEvenDimensions = height;
	while (Math.round(heightWithEvenDimensions * scale) % 2 !== 0) heightWithEvenDimensions--;
	let widthWithEvenDimensions = width;
	while (Math.round(widthWithEvenDimensions * scale) % 2 !== 0) widthWithEvenDimensions--;
	return {
		width: Math.round(widthWithEvenDimensions * scale),
		height: Math.round(heightWithEvenDimensions * scale)
	};
};
var validateDimensions = (options) => {
	const { width, height, codec } = options;
	if (codec === "h264" || codec === "h265") {
		if (width % 2 !== 0 || height % 2 !== 0) return {
			type: "invalid-dimensions",
			message: `${codec.toUpperCase()} codec requires width and height to be multiples of 2. Got ${width}x${height}`,
			severity: "error"
		};
	}
	return null;
};
var validateScale = (scale) => {
	if (typeof scale === "undefined") return;
	if (typeof scale !== "number") throw new Error("Scale should be a number or undefined, but is \"" + JSON.stringify(scale) + "\"");
	if (Number.isNaN(scale)) throw new Error("`scale` should not be NaN, but is NaN");
	if (!Number.isFinite(scale)) throw new Error(`"scale" must be finite, but is ${scale}`);
	if (scale <= 0) throw new Error(`"scale" must be bigger than 0, but is ${scale}`);
	if (scale > 16) throw new Error(`"scale" must be smaller or equal than 16, but is ${scale}`);
};
var canRenderMediaOnWeb = async (options) => {
	const issues = [];
	const container = options.container ?? "mp4";
	const videoCodec = options.videoCodec ?? getDefaultVideoCodecForContainer(container) ?? null;
	const videoEnabled = !isAudioOnlyContainer(container);
	const transparent = options.transparent ?? false;
	const muted = options.muted ?? false;
	const scale = options.scale ?? 1;
	validateScale(scale);
	const { width, height } = getEncodedDimensions({
		width: options.width,
		height: options.height,
		scale,
		codec: videoCodec
	});
	const resolvedVideoBitrate = typeof options.videoBitrate === "number" ? options.videoBitrate : getQualityForWebRendererQuality(options.videoBitrate ?? "medium");
	const resolvedAudioBitrate = typeof options.audioBitrate === "number" ? options.audioBitrate : getQualityForWebRendererQuality(options.audioBitrate ?? "medium");
	if (videoEnabled) {
		if (typeof VideoEncoder === "undefined") issues.push({
			type: "webcodecs-unavailable",
			message: "WebCodecs API is not available in this browser. A modern browser with WebCodecs support is required.",
			severity: "error"
		});
		if (!videoCodec) issues.push({
			type: "container-codec-mismatch",
			message: `A video codec is required for container ${container}`,
			severity: "error"
		});
		else {
			if (!containerToMediabunnyContainer(container).getSupportedCodecs().includes(codecToMediabunnyCodec(videoCodec))) issues.push({
				type: "container-codec-mismatch",
				message: `Codec ${videoCodec} is not supported for container ${container}`,
				severity: "error"
			});
			const dimensionIssue = validateDimensions({
				width,
				height,
				codec: videoCodec
			});
			if (dimensionIssue) issues.push(dimensionIssue);
			if (!await canEncodeVideo(codecToMediabunnyCodec(videoCodec), {
				bitrate: resolvedVideoBitrate,
				width,
				height
			})) issues.push({
				type: "video-codec-unsupported",
				message: `Video codec "${videoCodec}" cannot be encoded by this browser`,
				severity: "error"
			});
			if (transparent && !["vp8", "vp9"].includes(videoCodec)) issues.push({
				type: "transparent-video-unsupported",
				message: `Transparent video requires VP8 or VP9 codec with WebM container. ${videoCodec} does not support alpha channel.`,
				severity: "error"
			});
		}
	}
	let resolvedAudioCodec = null;
	if (!muted) {
		const audioResult = await resolveAudioCodec({
			container,
			requestedCodec: options.audioCodec,
			userSpecifiedAudioCodec: options.audioCodec !== void 0 && options.audioCodec !== null,
			bitrate: resolvedAudioBitrate
		});
		resolvedAudioCodec = audioResult.codec;
		issues.push(...audioResult.issues);
	}
	const webglIssue = checkWebGLSupport();
	if (webglIssue) issues.push(webglIssue);
	const canUseWebFs = await canUseWebFsWriter();
	let resolvedOutputTarget;
	if (options.outputTarget === "web-fs") {
		if (!canUseWebFs) issues.push({
			type: "output-target-unsupported",
			message: "The \"web-fs\" output target is not supported in this browser. The File System Access API is required.",
			severity: "error"
		});
		resolvedOutputTarget = "web-fs";
	} else if (options.outputTarget === "arraybuffer") resolvedOutputTarget = "arraybuffer";
	else resolvedOutputTarget = canUseWebFs ? "web-fs" : "arraybuffer";
	return {
		canRender: issues.filter((i) => i.severity === "error").length === 0,
		issues,
		resolvedVideoCodec: videoEnabled ? videoCodec : null,
		resolvedAudioCodec,
		resolvedOutputTarget
	};
};
var getEncodableVideoCodecs = async (container, options) => {
	const supported = getSupportedVideoCodecsForContainer(container);
	const mediabunnyCodecs = supported.map(codecToMediabunnyCodec);
	const resolvedBitrate = options?.videoBitrate ? typeof options.videoBitrate === "number" ? options.videoBitrate : getQualityForWebRendererQuality(options.videoBitrate) : void 0;
	const encodable = await getEncodableVideoCodecs$1(mediabunnyCodecs, { bitrate: resolvedBitrate });
	return supported.filter((c) => encodable.includes(codecToMediabunnyCodec(c)));
};
var getEncodableAudioCodecs = async (container, options) => {
	const supported = getSupportedAudioCodecsForContainer(container);
	if (supported.includes("mp3")) await ensureMp3EncoderRegistered();
	if (supported.includes("aac")) await ensureAacEncoderRegistered();
	if (supported.includes("flac")) await ensureFlacEncoderRegistered();
	const resolvedBitrate = options?.audioBitrate ? typeof options.audioBitrate === "number" ? options.audioBitrate : getQualityForWebRendererQuality(options.audioBitrate) : void 0;
	const encodable = await getEncodableAudioCodecs$1(supported, { bitrate: resolvedBitrate });
	return supported.filter((c) => encodable.includes(c));
};
var addVideoSampleAndCloseFrame = async (frameToEncode, videoSampleSource) => {
	const sample = new VideoSample(frameToEncode);
	try {
		await videoSampleSource.add(sample);
	} finally {
		sample.close();
		frameToEncode.close();
	}
};
var addAudioSample = async (audio, audioSampleSource) => {
	const sample = new AudioSample(audio);
	try {
		await audioSampleSource.add(sample);
	} finally {
		sample.close();
	}
};
var onlyArtifact = async ({ assets, frameBuffer }) => {
	const artifacts = assets.filter((asset) => asset.type === "artifact");
	let frameBufferUint8 = null;
	const result = [];
	for (const artifact of artifacts) {
		if (artifact.contentType === "binary" || artifact.contentType === "text") {
			result.push({
				frame: artifact.frame,
				content: artifact.content,
				filename: artifact.filename,
				downloadBehavior: artifact.downloadBehavior
			});
			continue;
		}
		if (artifact.contentType === "thumbnail") {
			if (frameBuffer === null) continue;
			const ab = frameBuffer instanceof Blob ? await frameBuffer.arrayBuffer() : new Uint8Array(await (await frameBuffer.convertToBlob({ type: "image/png" })).arrayBuffer());
			frameBufferUint8 = new Uint8Array(ab);
			result.push({
				frame: artifact.frame,
				content: frameBufferUint8,
				filename: artifact.filename,
				downloadBehavior: artifact.downloadBehavior
			});
			continue;
		}
		throw new Error("Unknown artifact type: " + artifact);
	}
	return result.filter(NoReactInternals.truthy);
};
var handleArtifacts = () => {
	const previousArtifacts = [];
	const handle = async ({ imageData, frame, assets: artifactAssets, onArtifact }) => {
		const artifacts = await onlyArtifact({
			assets: artifactAssets,
			frameBuffer: imageData
		});
		for (const artifact of artifacts) {
			const previousArtifact = previousArtifacts.find((a) => a.filename === artifact.filename);
			if (previousArtifact) throw new Error(`An artifact with output "${artifact.filename}" was already registered at frame ${previousArtifact.frame}, but now registered again at frame ${frame}. Artifacts must have unique names. https://remotion.dev/docs/artifacts`);
			onArtifact(artifact);
			previousArtifacts.push({
				frame,
				filename: artifact.filename
			});
		}
	};
	return { handle };
};
var REFERENCE_SAMPLE_RATE = 48e3;
var REFERENCE_HOP_SIZE = 512;
var makePlanarAudio = (numberOfChannels, length) => {
	return new Array(numberOfChannels).fill(null).map(() => new Float32Array(length));
};
var ensurePlanarCapacity = ({ buffers, requiredLength }) => {
	if (buffers[0].length >= requiredLength) return buffers;
	let newLength = buffers[0].length;
	while (newLength < requiredLength) newLength *= 2;
	return buffers.map((buffer) => {
		const expanded = new Float32Array(newLength);
		expanded.set(buffer);
		return expanded;
	});
};
var PlanarAudioQueue = class {
	chunks = [];
	length = 0;
	push(audio) {
		if (audio[0].length === 0) return;
		this.chunks.push(audio);
		this.length += audio[0].length;
	}
	take(numberOfFrames, numberOfChannels) {
		const framesToTake = Math.min(numberOfFrames, this.length);
		const result = makePlanarAudio(numberOfChannels, framesToTake);
		let written = 0;
		while (written < framesToTake) {
			const first = this.chunks[0];
			const available = first[0].length;
			const count = Math.min(available, framesToTake - written);
			for (let channel = 0; channel < numberOfChannels; channel++) result[channel].set(first[channel].subarray(0, count), written);
			if (count === available) this.chunks.shift();
			else this.chunks[0] = first.map((channel) => channel.subarray(count));
			written += count;
			this.length -= count;
		}
		return result;
	}
	getLength() {
		return this.length;
	}
};
var StreamingTimeStretcher = class {
	numberOfChannels;
	factor;
	hopSize;
	windowSize;
	searchRadius;
	analysisHop;
	input;
	inputLength = 0;
	output;
	outputLength = 0;
	analysisPosition = 0;
	synthesisPosition = 0;
	initialized = false;
	finalized = false;
	totalInputFrames = 0;
	totalOutputFrames = 0;
	constructor({ numberOfChannels, sampleRate, factor }) {
		this.numberOfChannels = numberOfChannels;
		this.factor = factor;
		this.hopSize = Math.max(32, Math.round(REFERENCE_HOP_SIZE * sampleRate / REFERENCE_SAMPLE_RATE));
		this.windowSize = this.hopSize * 2;
		this.searchRadius = this.hopSize;
		this.analysisHop = this.hopSize / factor;
		this.input = makePlanarAudio(numberOfChannels, 65536);
		this.output = makePlanarAudio(numberOfChannels, 65536);
	}
	append(audio) {
		if (this.finalized) throw new Error("Cannot append audio after the time stretcher was finalized.");
		const { length } = audio[0];
		this.input = ensurePlanarCapacity({
			buffers: this.input,
			requiredLength: this.inputLength + length
		});
		for (let channel = 0; channel < this.numberOfChannels; channel++) this.input[channel].set(audio[channel], this.inputLength);
		this.inputLength += length;
		this.totalInputFrames += length;
		this.process();
		return this.drainFinalizedOutput();
	}
	findBestAnalysisPosition({ expectedPosition, nextSynthesisPosition }) {
		const minimum = Math.max(0, Math.floor(expectedPosition - this.searchRadius));
		const maximum = Math.min(this.inputLength - this.windowSize, Math.ceil(expectedPosition + this.searchRadius));
		let bestPosition = minimum;
		let bestCorrelation = -Infinity;
		for (let candidate = minimum; candidate <= maximum; candidate += 4) {
			let dotProduct = 0;
			let previousEnergy = 0;
			let candidateEnergy = 0;
			for (let channel = 0; channel < this.numberOfChannels; channel++) {
				const previous = this.output[channel];
				const incoming = this.input[channel];
				for (let frame = 0; frame < this.hopSize; frame += 2) {
					const previousValue = previous[nextSynthesisPosition + frame];
					const candidateValue = incoming[candidate + frame];
					dotProduct += previousValue * candidateValue;
					previousEnergy += previousValue * previousValue;
					candidateEnergy += candidateValue * candidateValue;
				}
			}
			const correlation = dotProduct / (Math.sqrt(previousEnergy * candidateEnergy) || Number.EPSILON);
			if (correlation > bestCorrelation) {
				bestCorrelation = correlation;
				bestPosition = candidate;
			}
		}
		const fineMinimum = Math.max(minimum, bestPosition - 4);
		const fineMaximum = Math.min(maximum, bestPosition + 4);
		for (let candidate = fineMinimum; candidate <= fineMaximum; candidate++) {
			let dotProduct = 0;
			let previousEnergy = 0;
			let candidateEnergy = 0;
			for (let channel = 0; channel < this.numberOfChannels; channel++) {
				const previous = this.output[channel];
				const incoming = this.input[channel];
				for (let frame = 0; frame < this.hopSize; frame++) {
					const previousValue = previous[nextSynthesisPosition + frame];
					const candidateValue = incoming[candidate + frame];
					dotProduct += previousValue * candidateValue;
					previousEnergy += previousValue * previousValue;
					candidateEnergy += candidateValue * candidateValue;
				}
			}
			const correlation = dotProduct / (Math.sqrt(previousEnergy * candidateEnergy) || Number.EPSILON);
			if (correlation > bestCorrelation) {
				bestCorrelation = correlation;
				bestPosition = candidate;
			}
		}
		return bestPosition;
	}
	process() {
		if (!this.initialized) {
			if (this.inputLength < this.windowSize + this.searchRadius) return;
			for (let channel = 0; channel < this.numberOfChannels; channel++) this.output[channel].set(this.input[channel].subarray(0, this.windowSize));
			this.outputLength = this.windowSize;
			this.initialized = true;
		}
		while (true) {
			const expectedPosition = this.analysisPosition + this.analysisHop;
			if (expectedPosition + this.searchRadius + this.windowSize > this.inputLength) break;
			const nextSynthesisPosition = this.synthesisPosition + this.hopSize;
			this.output = ensurePlanarCapacity({
				buffers: this.output,
				requiredLength: nextSynthesisPosition + this.windowSize
			});
			const bestPosition = this.findBestAnalysisPosition({
				expectedPosition,
				nextSynthesisPosition
			});
			for (let channel = 0; channel < this.numberOfChannels; channel++) {
				for (let frame = 0; frame < this.hopSize; frame++) {
					const fadeIn = .5 - .5 * Math.cos(Math.PI * (frame + 1) / (this.hopSize + 1));
					const outputIndex = nextSynthesisPosition + frame;
					this.output[channel][outputIndex] = this.output[channel][outputIndex] * (1 - fadeIn) + this.input[channel][bestPosition + frame] * fadeIn;
				}
				this.output[channel].set(this.input[channel].subarray(bestPosition + this.hopSize, bestPosition + this.windowSize), nextSynthesisPosition + this.hopSize);
			}
			this.analysisPosition = expectedPosition;
			this.synthesisPosition = nextSynthesisPosition;
			this.outputLength = nextSynthesisPosition + this.windowSize;
		}
	}
	drainFinalizedOutput() {
		if (!this.initialized) return makePlanarAudio(this.numberOfChannels, 0);
		const finalizedLength = Math.max(0, this.synthesisPosition + this.hopSize);
		const result = this.output.map((channel) => channel.slice(0, finalizedLength));
		this.totalOutputFrames += finalizedLength;
		for (let channel = 0; channel < this.numberOfChannels; channel++) this.output[channel].copyWithin(0, finalizedLength, this.outputLength);
		this.outputLength -= finalizedLength;
		this.synthesisPosition -= finalizedLength;
		const inputFramesToDiscard = Math.max(0, Math.floor(this.analysisPosition) - this.searchRadius);
		for (let channel = 0; channel < this.numberOfChannels; channel++) this.input[channel].copyWithin(0, inputFramesToDiscard, this.inputLength);
		this.inputLength -= inputFramesToDiscard;
		this.analysisPosition -= inputFramesToDiscard;
		return result;
	}
	finalize() {
		if (this.finalized) throw new Error("The time stretcher has already been finalized.");
		this.finalized = true;
		const targetLength = Math.round(this.totalInputFrames * this.factor);
		const padding = makePlanarAudio(this.numberOfChannels, this.windowSize + this.searchRadius * 2);
		this.input = ensurePlanarCapacity({
			buffers: this.input,
			requiredLength: this.inputLength + padding[0].length
		});
		for (let channel = 0; channel < this.numberOfChannels; channel++) this.input[channel].set(padding[channel], this.inputLength);
		this.inputLength += padding[0].length;
		this.process();
		const finalized = this.drainFinalizedOutput();
		const remaining = Math.max(0, targetLength - this.totalOutputFrames + finalized[0].length);
		if (finalized[0].length >= remaining) return finalized.map((channel) => channel.slice(0, remaining));
		const result = makePlanarAudio(this.numberOfChannels, remaining);
		for (let channel = 0; channel < this.numberOfChannels; channel++) result[channel].set(finalized[channel]);
		return result;
	}
};
var StreamingLinearResampler = class {
	numberOfChannels;
	step;
	input;
	inputLength = 0;
	position = 0;
	constructor({ numberOfChannels, step }) {
		this.numberOfChannels = numberOfChannels;
		this.step = step;
		this.input = makePlanarAudio(numberOfChannels, 65536);
	}
	append(audio) {
		this.input = ensurePlanarCapacity({
			buffers: this.input,
			requiredLength: this.inputLength + audio[0].length
		});
		for (let channel = 0; channel < this.numberOfChannels; channel++) this.input[channel].set(audio[channel], this.inputLength);
		this.inputLength += audio[0].length;
		return this.process(false);
	}
	process(finalizing) {
		const outputLength = Math.max(0, Math.floor((this.inputLength - (finalizing ? 0 : 1) - this.position) / this.step) + 1);
		const result = makePlanarAudio(this.numberOfChannels, outputLength);
		for (let outputFrame = 0; outputFrame < outputLength; outputFrame++) {
			const leftIndex = Math.floor(this.position);
			const rightIndex = Math.min(leftIndex + 1, this.inputLength - 1);
			const fraction = this.position - leftIndex;
			for (let channel = 0; channel < this.numberOfChannels; channel++) {
				const left = this.input[channel][leftIndex];
				const right = this.input[channel][rightIndex];
				result[channel][outputFrame] = left + (right - left) * fraction;
			}
			this.position += this.step;
		}
		const discard = Math.min(Math.floor(this.position), this.inputLength);
		for (let channel = 0; channel < this.numberOfChannels; channel++) this.input[channel].copyWithin(0, discard, this.inputLength);
		this.inputLength -= discard;
		this.position -= discard;
		return result;
	}
	finalize() {
		return this.process(true);
	}
};
var StreamingPitchShifter = class {
	numberOfChannels;
	stretcher;
	resampler;
	outputQueue = new PlanarAudioQueue();
	totalInputFrames = 0;
	totalOutputFrames = 0;
	constructor({ numberOfChannels, sampleRate, toneFrequency }) {
		this.numberOfChannels = numberOfChannels;
		this.stretcher = new StreamingTimeStretcher({
			numberOfChannels,
			sampleRate,
			factor: toneFrequency
		});
		this.resampler = new StreamingLinearResampler({
			numberOfChannels,
			step: toneFrequency
		});
	}
	append(audio) {
		this.totalInputFrames += audio[0].length;
		const stretched = this.stretcher.append(audio);
		this.outputQueue.push(this.resampler.append(stretched));
		return this.takeAvailableOutput();
	}
	takeAvailableOutput() {
		const availableInputFrames = this.totalInputFrames - this.totalOutputFrames;
		const framesToTake = Math.min(availableInputFrames, this.outputQueue.getLength());
		const result = this.outputQueue.take(framesToTake, this.numberOfChannels);
		this.totalOutputFrames += framesToTake;
		return result;
	}
	finalize() {
		this.outputQueue.push(this.resampler.append(this.stretcher.finalize()));
		this.outputQueue.push(this.resampler.finalize());
		const remaining = this.totalInputFrames - this.totalOutputFrames;
		const available = this.outputQueue.take(Math.min(remaining, this.outputQueue.getLength()), this.numberOfChannels);
		const result = makePlanarAudio(this.numberOfChannels, remaining);
		for (let channel = 0; channel < this.numberOfChannels; channel++) result[channel].set(available[channel]);
		this.totalOutputFrames += remaining;
		return result;
	}
};
var TARGET_NUMBER_OF_CHANNELS = 2;
var createAudioMixer = ({ fps, sampleRate }) => {
	const toneFrequencies = /* @__PURE__ */ new Map();
	const shifters = /* @__PURE__ */ new Map();
	const pendingFrames = [];
	let frameIndex = 0;
	const mixShiftedOutput = (state, output) => {
		let offset = 0;
		while (offset < output[0].length) {
			const pending = state.pending[0];
			const frameLength = pending.frame.mixed.length / TARGET_NUMBER_OF_CHANNELS;
			const count = Math.min(frameLength - pending.written, output[0].length - offset);
			for (let i = 0; i < count; i++) for (let channel = 0; channel < TARGET_NUMBER_OF_CHANNELS; channel++) pending.frame.mixed[(pending.written + i) * TARGET_NUMBER_OF_CHANNELS + channel] += output[channel][offset + i] * 32768;
			pending.written += count;
			offset += count;
			if (pending.written === frameLength) {
				pending.frame.pendingAssets--;
				state.pending.shift();
			}
		}
	};
	return {
		addFrame: ({ assets, timestamp, isLastFrame }) => {
			const inlineAudio = assets.filter((asset) => asset.type === "inline-audio");
			const activeIds = new Set(inlineAudio.map((asset) => asset.id));
			for (const [id, state] of shifters) if (!activeIds.has(id)) {
				mixShiftedOutput(state, state.shifter.finalize());
				shifters.delete(id);
			}
			const numberOfFrames = Math.round((frameIndex + 1) * sampleRate / fps) - Math.round(frameIndex * sampleRate / fps);
			frameIndex++;
			const frame = {
				timestamp,
				mixed: new Float64Array(numberOfFrames * TARGET_NUMBER_OF_CHANNELS),
				pendingAssets: 0
			};
			pendingFrames.push(frame);
			for (const asset of inlineAudio) {
				const previousFrequency = toneFrequencies.get(asset.id);
				if (previousFrequency !== void 0 && previousFrequency !== asset.toneFrequency) throw new Error(`toneFrequency must be the same across the entire audio, got ${asset.toneFrequency}, but before it was ${previousFrequency}`);
				toneFrequencies.set(asset.id, asset.toneFrequency);
				if (asset.toneFrequency === 1) {
					for (let i = 0; i < Math.min(asset.audio.length, frame.mixed.length); i++) frame.mixed[i] += asset.audio[i];
					continue;
				}
				let state = shifters.get(asset.id);
				if (!state) {
					state = {
						shifter: new StreamingPitchShifter({
							numberOfChannels: TARGET_NUMBER_OF_CHANNELS,
							sampleRate,
							toneFrequency: asset.toneFrequency
						}),
						pending: []
					};
					shifters.set(asset.id, state);
				}
				const planar = Array.from({ length: TARGET_NUMBER_OF_CHANNELS }, (_, channel) => {
					const data = new Float32Array(numberOfFrames);
					for (let i = 0; i < numberOfFrames; i++) data[i] = (asset.audio[i * TARGET_NUMBER_OF_CHANNELS + channel] ?? 0) / 32768;
					return data;
				});
				frame.pendingAssets++;
				state.pending.push({
					frame,
					written: 0
				});
				mixShiftedOutput(state, state.shifter.append(planar));
			}
			if (isLastFrame) {
				for (const state of shifters.values()) mixShiftedOutput(state, state.shifter.finalize());
				shifters.clear();
			}
		},
		getReadyAudio: () => {
			const frame = pendingFrames[0];
			if (!frame || frame.pendingAssets > 0) return null;
			pendingFrames.shift();
			const data = new Int16Array(frame.mixed.length);
			for (let i = 0; i < data.length; i++) data[i] = Math.max(-32768, Math.min(32767, frame.mixed[i]));
			return new AudioData({
				data,
				format: "s16",
				numberOfChannels: TARGET_NUMBER_OF_CHANNELS,
				numberOfFrames: data.length / TARGET_NUMBER_OF_CHANNELS,
				sampleRate,
				timestamp: frame.timestamp
			});
		}
	};
};
var WORKER_CODE = `
let intervalId = null;
self.onmessage = (e) => {
	if (e.data.type === 'start') {
		if (intervalId !== null) {
			clearInterval(intervalId);
		}
		intervalId = setInterval(() => self.postMessage('tick'), e.data.intervalMs);
	} else if (e.data.type === 'stop') {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}
};
`;
function createBackgroundKeepalive({ fps, logLevel }) {
	const intervalMs = Math.round(1e3 / fps);
	let pendingResolvers = [];
	let worker = null;
	let disposed = false;
	if (typeof Worker === "undefined") {
		Internals.Log.warn({
			logLevel,
			tag: "@remotion/web-renderer"
		}, "Web Workers not available. Rendering may pause when tab is backgrounded.");
		return {
			waitForTick: () => {
				return new Promise((resolve) => {
					setTimeout(resolve, intervalMs);
				});
			},
			[Symbol.dispose]: () => {}
		};
	}
	const blob = new Blob([WORKER_CODE], { type: "application/javascript" });
	const workerUrl = URL.createObjectURL(blob);
	worker = new Worker(workerUrl);
	worker.onmessage = () => {
		const resolvers = pendingResolvers;
		pendingResolvers = [];
		for (const resolve of resolvers) resolve();
	};
	worker.onerror = (event) => {
		Internals.Log.error({
			logLevel,
			tag: "@remotion/web-renderer"
		}, "Background keepalive worker encountered an error and will be terminated.", event);
		const resolvers = pendingResolvers;
		pendingResolvers = [];
		for (const resolve of resolvers) resolve();
		if (!disposed) {
			disposed = true;
			worker?.terminate();
			worker = null;
			URL.revokeObjectURL(workerUrl);
		}
	};
	worker.postMessage({
		type: "start",
		intervalMs
	});
	return {
		waitForTick: () => {
			return new Promise((resolve) => {
				pendingResolvers.push(resolve);
			});
		},
		[Symbol.dispose]: () => {
			if (disposed) return;
			disposed = true;
			worker?.postMessage({ type: "stop" });
			worker?.terminate();
			worker = null;
			URL.revokeObjectURL(workerUrl);
			const resolvers = pendingResolvers;
			pendingResolvers = [];
			for (const resolve of resolvers) resolve();
		}
	};
}
var createAudioSampleSource = ({ muted, codec, bitrate }) => {
	if (muted || codec === null) return null;
	const audioSampleSource = new AudioSampleSource({
		codec,
		bitrate
	});
	return {
		audioSampleSource,
		[Symbol.dispose]: () => audioSampleSource.close()
	};
};
var supportsNativeHtmlInCanvas = () => {
	if (typeof document === "undefined") return false;
	return typeof document.createElement("canvas").getContext("2d")?.drawElementImage === "function";
};
var containsLayoutSubtreeCanvas = (element) => {
	return Array.from(element.querySelectorAll("canvas")).some((canvas) => canvas.layoutSubtree === true);
};
var setupHtmlInCanvas = ({ wrapper, div, width, height }) => {
	if (!supportsNativeHtmlInCanvas()) return null;
	const layoutCanvas = document.createElement("canvas");
	layoutCanvas.layoutSubtree = true;
	layoutCanvas.width = width;
	layoutCanvas.height = height;
	layoutCanvas.style.position = "absolute";
	layoutCanvas.style.top = "0";
	layoutCanvas.style.left = "0";
	layoutCanvas.style.width = `${width}px`;
	layoutCanvas.style.height = `${height}px`;
	layoutCanvas.style.visibility = "visible";
	const maybeCtx = layoutCanvas.getContext("2d");
	if (!maybeCtx || typeof maybeCtx.drawElementImage !== "function") return null;
	if (typeof layoutCanvas.requestPaint !== "function") return null;
	wrapper.removeChild(div);
	layoutCanvas.appendChild(div);
	wrapper.appendChild(layoutCanvas);
	return {
		layoutCanvas,
		ctx: maybeCtx
	};
};
var waitForPaint = (layoutCanvas) => {
	return new Promise((resolve) => {
		layoutCanvas.addEventListener("paint", () => resolve(), { once: true });
		layoutCanvas.requestPaint();
	});
};
var drawWithHtmlInCanvas = async ({ htmlInCanvasContext, element, scaledWidth, scaledHeight }) => {
	const { ctx, layoutCanvas } = htmlInCanvasContext;
	if (layoutCanvas.width !== scaledWidth || layoutCanvas.height !== scaledHeight) {
		layoutCanvas.width = scaledWidth;
		layoutCanvas.height = scaledHeight;
	}
	await waitForPaint(layoutCanvas);
	ctx.reset();
	ctx.drawElementImage(element, 0, 0, scaledWidth, scaledHeight);
	const offCtx = new OffscreenCanvas(scaledWidth, scaledHeight).getContext("2d");
	if (!offCtx) throw new Error("Could not get offscreen context");
	offCtx.drawImage(layoutCanvas, 0, 0);
	return offCtx;
};
var teardownHtmlInCanvas = ({ htmlInCanvasContext, wrapper, div }) => {
	const { layoutCanvas } = htmlInCanvasContext;
	layoutCanvas.removeChild(div);
	wrapper.removeChild(layoutCanvas);
	wrapper.appendChild(div);
};
var UpdateTime = ({ children, audioEnabled, sampleRate, videoEnabled, logLevel, compId, initialFrame, timeUpdater }) => {
	const [frame, setFrame] = (0, import_react.useState)(initialFrame);
	(0, import_react.useImperativeHandle)(timeUpdater, () => ({ update: (f) => {
		(0, import_react_dom.flushSync)(() => {
			setFrame(f);
		});
	} }));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Internals.RemotionRootContexts, {
		_experimentalKeepAudioContextAlive: false,
		audioEnabled,
		videoEnabled,
		logLevel,
		numberOfAudioTags: 0,
		audioLatencyHint: "interactive",
		previewSampleRate: sampleRate,
		frameState: { [compId]: frame },
		children
	});
};
var GENERIC_REACT_RENDER_ERROR_MESSAGES = /* @__PURE__ */ new Set(["Error thrown during rendering"]);
var isMessageLikeObject = (err) => {
	return typeof err === "object" && err !== null && "message" in err && typeof err.message === "string";
};
var unknownErrorToMessage = (err) => {
	if (typeof err === "string") return err;
	if (isMessageLikeObject(err)) return err.message;
	try {
		const serialized = JSON.stringify(err);
		if (serialized) return serialized;
	} catch {}
	return String(err);
};
var setErrorCause = (error, cause) => {
	try {
		Object.defineProperty(error, "cause", {
			value: cause,
			enumerable: false,
			configurable: true,
			writable: true
		});
	} catch {}
};
var appendComponentStack = (error, componentStack) => {
	if (!componentStack?.trim()) return error;
	const normalizedComponentStack = componentStack.trim();
	const stack = error.stack ?? `${error.name}: ${error.message}`;
	if (stack.includes(normalizedComponentStack)) return error;
	const errorTitle = `${error.name}: ${error.message}`;
	const stackWithoutTitle = stack.startsWith(errorTitle) ? stack.slice(errorTitle.length).trimStart() : stack;
	error.stack = `${errorTitle}
For the likely root cause, see "React component stack:" after the JavaScript stack trace below.${stackWithoutTitle.length > 0 ? `
${stackWithoutTitle}` : ""}
React component stack:
${normalizedComponentStack}`;
	return error;
};
var normalizeUncaughtReactError = (err, componentStack) => {
	if (err instanceof Error) {
		const { cause } = err;
		return appendComponentStack(cause instanceof Error && GENERIC_REACT_RENDER_ERROR_MESSAGES.has(err.message) ? cause : err, componentStack);
	}
	const normalized = new Error(unknownErrorToMessage(err));
	setErrorCause(normalized, err);
	return appendComponentStack(normalized, componentStack);
};
function checkForError(errorHolder) {
	if (errorHolder.error) throw errorHolder.error;
}
function createScaffold({ width, height, delayRenderTimeoutInMilliseconds, logLevel, resolvedProps, id, mediaCacheSizeInBytes, durationInFrames, fps, initialFrame, schema, Component, audioEnabled, videoEnabled, defaultCodec, defaultOutName, useHtmlInCanvas, pixelDensity, sampleRate }) {
	if (!import_client.createRoot) throw new Error("@remotion/web-renderer requires React 18 or higher");
	const wrapper = document.createElement("div");
	wrapper.style.position = "fixed";
	wrapper.style.inset = "0";
	wrapper.style.overflow = "hidden";
	wrapper.style.visibility = "hidden";
	wrapper.style.filter = "opacity(0)";
	wrapper.style.pointerEvents = "none";
	wrapper.style.zIndex = "-9999";
	const div = document.createElement("div");
	div.style.position = "absolute";
	div.style.top = "0";
	div.style.left = "0";
	div.style.display = "flex";
	div.style.flexDirection = "column";
	div.style.backgroundColor = "transparent";
	div.style.width = `${width}px`;
	div.style.height = `${height}px`;
	const scaffoldClassName = `remotion-scaffold-${Math.random().toString(36).substring(2, 15)}`;
	div.className = scaffoldClassName;
	const cleanupCSS = Internals.CSSUtils.injectCSS(Internals.CSSUtils.makeDefaultPreviewCSS(`.${scaffoldClassName}`, "white"));
	wrapper.appendChild(div);
	document.body.appendChild(wrapper);
	const htmlInCanvasContext = useHtmlInCanvas ? setupHtmlInCanvas({
		wrapper,
		div,
		width,
		height
	}) : null;
	const updateFallbackScaffoldVisibility = () => {
		if (htmlInCanvasContext) return;
		div.style.visibility = containsLayoutSubtreeCanvas(div) ? "visible" : "";
	};
	const fallbackScaffoldObserver = htmlInCanvasContext ? null : new MutationObserver(updateFallbackScaffoldVisibility);
	fallbackScaffoldObserver?.observe(div, {
		childList: true,
		subtree: true
	});
	const errorHolder = { error: null };
	const root = import_client.createRoot(div, { onUncaughtError: (err, errorInfo) => {
		errorHolder.error = normalizeUncaughtReactError(err, errorInfo?.componentStack);
	} });
	const delayRenderScope = {
		remotion_renderReady: true,
		remotion_delayRenderTimeouts: {},
		remotion_puppeteerTimeout: delayRenderTimeoutInMilliseconds,
		remotion_attempt: 0,
		remotion_delayRenderHandles: []
	};
	const timeUpdater = (0, import_react.createRef)();
	const collectAssets = (0, import_react.createRef)();
	const renderResourceManager = Internals.makeRenderResourceManager();
	(0, import_react_dom.flushSync)(() => {
		root.render(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Internals.RenderResourceManagerContext.Provider, {
			value: renderResourceManager,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Internals.MaxMediaCacheSizeContext.Provider, {
				value: mediaCacheSizeInBytes,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Internals.RemotionEnvironmentContext.Provider, {
					value: {
						isStudio: false,
						isRendering: true,
						isPlayer: false,
						isReadOnlyStudio: false,
						isClientSideRendering: true
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Internals.DelayRenderContextType.Provider, {
						value: delayRenderScope,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Internals.CompositionManager.Provider, {
							value: {
								compositions: [{
									id,
									component: Component,
									order: null,
									defaultProps: {},
									folderName: null,
									parentFolderName: null,
									schema: schema ?? null,
									calculateMetadata: null,
									durationInFrames,
									fps,
									height,
									width
								}],
								canvasContent: {
									type: "composition",
									compositionId: id
								},
								currentAssetMetadata: null,
								currentCompositionMetadata: {
									props: resolvedProps,
									durationInFrames,
									fps,
									height,
									width,
									defaultCodec: defaultCodec ?? null,
									defaultOutName: defaultOutName ?? null,
									defaultVideoImageFormat: null,
									defaultPixelFormat: null,
									defaultProResProfile: null,
									defaultSampleRate: null
								},
								folders: []
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Internals.PixelDensityContext.Provider, {
								value: pixelDensity,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Internals.RenderAssetManagerProvider, {
									collectAssets,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UpdateTime, {
										audioEnabled,
										sampleRate,
										videoEnabled,
										logLevel,
										compId: id,
										initialFrame,
										timeUpdater,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Internals.CanUseRemotionHooks.Provider, {
											value: true,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Component, { ...resolvedProps })
										})
									})
								})
							})
						})
					})
				})
			})
		}));
	});
	updateFallbackScaffoldVisibility();
	return {
		delayRenderScope,
		div,
		errorHolder,
		htmlInCanvasContext,
		[Symbol.dispose]: () => {
			fallbackScaffoldObserver?.disconnect();
			try {
				root.unmount();
			} finally {
				try {
					renderResourceManager.dispose();
				} finally {
					if (htmlInCanvasContext) teardownHtmlInCanvas({
						htmlInCanvasContext,
						wrapper,
						div
					});
					div.remove();
					wrapper.remove();
					cleanupCSS();
				}
			}
		},
		timeUpdater,
		collectAssets
	};
}
var getRealFrameRange = (durationInFrames, frameRange) => {
	if (frameRange === null) return [0, durationInFrames - 1];
	if (typeof frameRange === "number") {
		if (frameRange < 0 || frameRange >= durationInFrames) throw new Error(`Frame number is out of range, must be between 0 and ${durationInFrames - 1} but got ${frameRange}`);
		return [frameRange, frameRange];
	}
	const resolved = [frameRange[0], frameRange[1] === null ? durationInFrames - 1 : frameRange[1]];
	if (resolved[0] < 0 || resolved[1] >= durationInFrames || resolved[0] > resolved[1]) throw new Error(`The "durationInFrames" of the composition was evaluated to be ${durationInFrames}, but frame range ${resolved.join("-")} is not inbetween 0-${durationInFrames - 1}`);
	return resolved;
};
var makeMaskImageLoaderState = ({ signal, timeoutInMilliseconds }) => {
	const images = /* @__PURE__ */ new Set();
	return {
		cache: /* @__PURE__ */ new Map(),
		images,
		signal,
		timeoutInMilliseconds,
		[Symbol.dispose]: () => {
			for (const image of images) image.close();
			images.clear();
		}
	};
};
var validateMaskImageUrl = (src) => {
	const url = new URL(src, document.baseURI);
	if (url.protocol === "data:" || url.protocol === "blob:") return url.href;
	if ((url.protocol === "http:" || url.protocol === "https:") && url.origin === window.location.origin) return url.href;
	throw new Error(`@remotion/web-renderer only supports same-origin, data:, and blob: mask-image URLs. Received: ${url.href}`);
};
var loadMaskImage = async ({ src, state }) => {
	const resolvedSrc = validateMaskImageUrl(src);
	if (state.signal?.aborted) throw new Error(`Loading mask-image URL was cancelled: ${resolvedSrc}`);
	const controller = new AbortController();
	let timedOut = false;
	const onAbort = () => controller.abort();
	state.signal?.addEventListener("abort", onAbort, { once: true });
	const timeout = window.setTimeout(() => {
		timedOut = true;
		controller.abort();
	}, state.timeoutInMilliseconds);
	const operation = (async () => {
		const response = await fetch(resolvedSrc, {
			credentials: "same-origin",
			signal: controller.signal
		});
		if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
		const blob = await response.blob();
		const contentType = blob.type.toLowerCase().split(";")[0];
		if (!contentType.startsWith("image/") || contentType === "image/svg+xml") throw new Error(`Expected a raster image, but received Content-Type "${blob.type || "unknown"}"`);
		return createImageBitmap(blob);
	})();
	operation.then((image) => {
		if (controller.signal.aborted) image.close();
	}, () => {});
	const aborted = new Promise((_, reject) => {
		controller.signal.addEventListener("abort", () => reject(/* @__PURE__ */ new Error("Mask image loading was aborted")), { once: true });
	});
	try {
		const image = await Promise.race([operation, aborted]);
		state.images.add(image);
		return image;
	} catch (error) {
		if (timedOut) throw new Error(`Timed out loading mask-image URL after ${state.timeoutInMilliseconds}ms: ${resolvedSrc}`);
		if (state.signal?.aborted) throw new Error(`Loading mask-image URL was cancelled: ${resolvedSrc}`);
		const detail = error instanceof Error ? error.message : String(error);
		throw new Error(`Could not load mask-image URL ${resolvedSrc}: ${detail}`);
	} finally {
		window.clearTimeout(timeout);
		state.signal?.removeEventListener("abort", onAbort);
	}
};
var getMaskImage = ({ src, state }) => {
	const cached = state.cache.get(src);
	if (cached) return cached;
	const promise = loadMaskImage({
		src,
		state
	});
	state.cache.set(src, promise);
	promise.catch(() => state.cache.delete(src));
	return promise;
};
var makeInternalState = ({ signal = null, maskImageTimeoutInMilliseconds = 3e4 } = {}) => {
	let drawnPrecomposedPixels = 0;
	let precomposedTextures = 0;
	let waitForReadyTime = 0;
	let addSampleTime = 0;
	let createFrameTime = 0;
	let audioMixingTime = 0;
	const helperCanvasState = { current: null };
	const maskImageLoaderState = makeMaskImageLoaderState({
		signal,
		timeoutInMilliseconds: maskImageTimeoutInMilliseconds
	});
	return {
		getDrawn3dPixels: () => drawnPrecomposedPixels,
		getPrecomposedTiles: () => precomposedTextures,
		addPrecompose: ({ canvasWidth, canvasHeight }) => {
			drawnPrecomposedPixels += canvasWidth * canvasHeight;
			precomposedTextures++;
		},
		helperCanvasState,
		maskImageLoaderState,
		[Symbol.dispose]: () => {
			if (helperCanvasState.current) helperCanvasState.current.cleanup();
			maskImageLoaderState[Symbol.dispose]();
		},
		getWaitForReadyTime: () => waitForReadyTime,
		addWaitForReadyTime: (time) => {
			waitForReadyTime += time;
		},
		getAddSampleTime: () => addSampleTime,
		addAddSampleTime: (time) => {
			addSampleTime += time;
		},
		getCreateFrameTime: () => createFrameTime,
		addCreateFrameTime: (time) => {
			createFrameTime += time;
		},
		getAudioMixingTime: () => audioMixingTime,
		addAudioMixingTime: (time) => {
			audioMixingTime += time;
		}
	};
};
var makeOutputWithCleanup = (options) => {
	const output = new Output(options);
	return {
		output,
		[Symbol.dispose]: () => {
			if (output.state === "finalized" || output.state === "canceled") return;
			output.cancel();
		}
	};
};
var makeVideoSampleSourceCleanup = (encodingConfig) => {
	const videoSampleSource = new VideoSampleSource(encodingConfig);
	return {
		videoSampleSource,
		[Symbol.dispose]: () => {
			videoSampleSource.close();
		}
	};
};
var PRESET_INTERVALS = {
	low: 100,
	medium: 33,
	high: 16
};
var resolvePageResponsivenessInterval = (pageResponsiveness) => {
	if (pageResponsiveness === "disabled") return null;
	if (pageResponsiveness === "low" || pageResponsiveness === "medium" || pageResponsiveness === "high") return PRESET_INTERVALS[pageResponsiveness];
	if (typeof pageResponsiveness === "number") {
		if (Number.isNaN(pageResponsiveness)) throw new Error("`pageResponsiveness` should not be NaN, but is NaN");
		if (!Number.isFinite(pageResponsiveness)) throw new Error(`"pageResponsiveness" must be finite, but is ${pageResponsiveness}`);
		if (pageResponsiveness <= 0) throw new Error(`"pageResponsiveness" must be greater than 0, but is ${pageResponsiveness}`);
		return pageResponsiveness;
	}
	throw new Error(`"pageResponsiveness" must be one of "disabled", "low", "medium", "high", or a number, but got ${JSON.stringify(pageResponsiveness)}`);
};
var createPageResponsivenessController = ({ intervalInMilliseconds, now, wait }) => {
	let lastYieldAt = now();
	return { waitIfNeeded: async () => {
		if (intervalInMilliseconds === null) return;
		if (now() - lastYieldAt < intervalInMilliseconds) return;
		await wait();
		lastYieldAt = now();
	} };
};
var onlyOneMediaRenderAtATimeQueue = { ref: Promise.resolve() };
var onlyOneStillRenderAtATimeQueue = { ref: Promise.resolve() };
function isNetworkError(error) {
	if (error.message.includes("Failed to fetch") || error.message.includes("Load failed") || error.message.includes("NetworkError when attempting to fetch resource")) return true;
	return false;
}
var HOST = "https://www.remotion.pro";
var DEFAULT_MAX_RETRIES = 3;
var exponentialBackoffMs = (attempt) => {
	return 1e3 * 2 ** (attempt - 1);
};
var sleep = (ms) => {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
};
var internalRegisterUsageEvent = async ({ host, succeeded, event, isStill, isProduction, licenseKey }) => {
	let lastError;
	const totalAttempts = DEFAULT_MAX_RETRIES + 1;
	for (let attempt = 1; attempt <= totalAttempts; attempt++) {
		const abortController = new AbortController();
		const timeout = setTimeout(() => {
			abortController.abort();
		}, 1e4);
		try {
			const res = await fetch(`${HOST}/api/track/register-usage-point`, {
				method: "POST",
				body: JSON.stringify({
					event,
					apiKey: licenseKey,
					host,
					succeeded,
					isStill,
					isProduction
				}),
				headers: { "Content-Type": "application/json" },
				signal: abortController.signal
			});
			clearTimeout(timeout);
			const json = await res.json();
			if (json.success) return {
				billable: json.billable,
				classification: json.classification
			};
			if (!res.ok) throw new Error(json.error);
			throw new Error(`Unexpected response from server: ${JSON.stringify(json)}`);
		} catch (err) {
			clearTimeout(timeout);
			const error = err;
			const isTimeout = error.name === "AbortError";
			if (!(isNetworkError(error) || isTimeout)) throw err;
			lastError = isTimeout ? /* @__PURE__ */ new Error("Request timed out after 10 seconds") : error;
			if (attempt < totalAttempts) {
				const backoffMs = exponentialBackoffMs(attempt);
				console.log(`Failed to send usage event (attempt ${attempt}/${totalAttempts}), retrying in ${backoffMs}ms...`, err);
				await sleep(backoffMs);
			}
		}
	}
	throw lastError;
};
var LicensingInternals = { internalRegisterUsageEvent };
var sendUsageEvent = async ({ licenseKey, succeeded, apiName, isStill, isProduction }) => {
	const host = typeof window === "undefined" ? null : typeof window.location === "undefined" ? null : window.location.origin ?? null;
	if (host === null) return;
	if (licenseKey === null) Internals.Log.warn({
		logLevel: "warn",
		tag: "web-renderer"
	}, `Pass "licenseKey" to ${apiName}(). If you qualify for the Free License (https://remotion.dev/license), pass "free-license" instead.`);
	await LicensingInternals.internalRegisterUsageEvent({
		licenseKey: licenseKey === "free-license" ? null : licenseKey,
		event: "web-render",
		host,
		succeeded,
		isStill,
		isProduction
	});
};
var createTreeWalkerCleanupAfterChildren = (treeWalker) => {
	const cleanupAfterChildren = [];
	const checkCleanUpAtBeginningOfIteration = () => {
		for (let i = 0; i < cleanupAfterChildren.length;) {
			const cleanup = cleanupAfterChildren[i];
			if (!(cleanup.element === treeWalker.currentNode || cleanup.element.contains(treeWalker.currentNode))) {
				cleanup.cleanupFn();
				cleanupAfterChildren.splice(i, 1);
			} else i++;
		}
	};
	const addCleanup = (element, cleanupFn) => {
		cleanupAfterChildren.unshift({
			element,
			cleanupFn
		});
	};
	const cleanupInTheEndOfTheIteration = () => {
		for (const cleanup of cleanupAfterChildren) cleanup.cleanupFn();
	};
	return {
		checkCleanUpAtBeginningOfIteration,
		addCleanup,
		[Symbol.dispose]: cleanupInTheEndOfTheIteration
	};
};
var calculateFill = ({ containerSize, intrinsicSize }) => {
	return {
		sourceX: 0,
		sourceY: 0,
		sourceWidth: intrinsicSize.width,
		sourceHeight: intrinsicSize.height,
		destX: containerSize.left,
		destY: containerSize.top,
		destWidth: containerSize.width,
		destHeight: containerSize.height
	};
};
var calculateContain = ({ containerSize, intrinsicSize }) => {
	const containerAspect = containerSize.width / containerSize.height;
	const imageAspect = intrinsicSize.width / intrinsicSize.height;
	let destWidth;
	let destHeight;
	if (imageAspect > containerAspect) {
		destWidth = containerSize.width;
		destHeight = containerSize.width / imageAspect;
	} else {
		destHeight = containerSize.height;
		destWidth = containerSize.height * imageAspect;
	}
	const destX = containerSize.left + (containerSize.width - destWidth) / 2;
	const destY = containerSize.top + (containerSize.height - destHeight) / 2;
	return {
		sourceX: 0,
		sourceY: 0,
		sourceWidth: intrinsicSize.width,
		sourceHeight: intrinsicSize.height,
		destX,
		destY,
		destWidth,
		destHeight
	};
};
var calculateCover = ({ containerSize, intrinsicSize }) => {
	if (containerSize.height <= 0 || intrinsicSize.height <= 0) return {
		sourceX: 0,
		sourceY: 0,
		sourceWidth: 0,
		sourceHeight: 0,
		destX: containerSize.left,
		destY: containerSize.top,
		destWidth: 0,
		destHeight: 0
	};
	const containerAspect = containerSize.width / containerSize.height;
	const imageAspect = intrinsicSize.width / intrinsicSize.height;
	let sourceX = 0;
	let sourceY = 0;
	let sourceWidth = intrinsicSize.width;
	let sourceHeight = intrinsicSize.height;
	if (imageAspect > containerAspect) {
		sourceWidth = intrinsicSize.height * containerAspect;
		sourceX = (intrinsicSize.width - sourceWidth) / 2;
	} else {
		sourceHeight = intrinsicSize.width / containerAspect;
		sourceY = (intrinsicSize.height - sourceHeight) / 2;
	}
	return {
		sourceX,
		sourceY,
		sourceWidth,
		sourceHeight,
		destX: containerSize.left,
		destY: containerSize.top,
		destWidth: containerSize.width,
		destHeight: containerSize.height
	};
};
var calculateNone = ({ containerSize, intrinsicSize }) => {
	const centeredX = containerSize.left + (containerSize.width - intrinsicSize.width) / 2;
	const centeredY = containerSize.top + (containerSize.height - intrinsicSize.height) / 2;
	let sourceX = 0;
	let sourceY = 0;
	let sourceWidth = intrinsicSize.width;
	let sourceHeight = intrinsicSize.height;
	let destX = centeredX;
	let destY = centeredY;
	let destWidth = intrinsicSize.width;
	let destHeight = intrinsicSize.height;
	if (destX < containerSize.left) {
		const clipAmount = containerSize.left - destX;
		sourceX = clipAmount;
		sourceWidth -= clipAmount;
		destX = containerSize.left;
		destWidth -= clipAmount;
	}
	if (destY < containerSize.top) {
		const clipAmount = containerSize.top - destY;
		sourceY = clipAmount;
		sourceHeight -= clipAmount;
		destY = containerSize.top;
		destHeight -= clipAmount;
	}
	const containerRight = containerSize.left + containerSize.width;
	if (destX + destWidth > containerRight) {
		const clipAmount = destX + destWidth - containerRight;
		sourceWidth -= clipAmount;
		destWidth -= clipAmount;
	}
	const containerBottom = containerSize.top + containerSize.height;
	if (destY + destHeight > containerBottom) {
		const clipAmount = destY + destHeight - containerBottom;
		sourceHeight -= clipAmount;
		destHeight -= clipAmount;
	}
	return {
		sourceX,
		sourceY,
		sourceWidth,
		sourceHeight,
		destX,
		destY,
		destWidth,
		destHeight
	};
};
var calculateObjectFit = ({ objectFit, containerSize, intrinsicSize }) => {
	switch (objectFit) {
		case "fill": return calculateFill({
			containerSize,
			intrinsicSize
		});
		case "contain": return calculateContain({
			containerSize,
			intrinsicSize
		});
		case "cover": return calculateCover({
			containerSize,
			intrinsicSize
		});
		case "none": return calculateNone({
			containerSize,
			intrinsicSize
		});
		case "scale-down": {
			const containResult = calculateContain({
				containerSize,
				intrinsicSize
			});
			const noneResult = calculateNone({
				containerSize,
				intrinsicSize
			});
			return containResult.destWidth * containResult.destHeight < noneResult.destWidth * noneResult.destHeight ? containResult : noneResult;
		}
		default: throw new Error(`Unknown object-fit value: ${objectFit}`);
	}
};
var parseObjectFit = (value) => {
	if (!value) return "fill";
	const normalized = value.trim().toLowerCase();
	switch (normalized) {
		case "fill":
		case "contain":
		case "cover":
		case "none":
		case "scale-down": return normalized;
		default: return "fill";
	}
};
var fitSvgIntoItsContainer = ({ containerSize, elementSize }) => {
	if (Math.round(containerSize.width) === Math.round(elementSize.width) && Math.round(containerSize.height) === Math.round(elementSize.height)) return {
		width: containerSize.width,
		height: containerSize.height,
		top: containerSize.top,
		left: containerSize.left
	};
	if (containerSize.width <= 0 || containerSize.height <= 0) throw new Error(`Container must have positive dimensions, but got ${containerSize.width}x${containerSize.height}`);
	if (elementSize.width <= 0 || elementSize.height <= 0) throw new Error(`Element must have positive dimensions, but got ${elementSize.width}x${elementSize.height}`);
	const heightRatio = containerSize.height / elementSize.height;
	const widthRatio = containerSize.width / elementSize.width;
	const ratio = Math.min(heightRatio, widthRatio);
	const newWidth = elementSize.width * ratio;
	const newHeight = elementSize.height * ratio;
	if (newWidth > containerSize.width + 1e-6 || newHeight > containerSize.height + 1e-6) throw new Error(`Element is too big to fit into the container. Max size: ${containerSize.width}x${containerSize.height}, element size: ${newWidth}x${newHeight}`);
	return {
		width: newWidth,
		height: newHeight,
		top: (containerSize.height - newHeight) / 2 + containerSize.top,
		left: (containerSize.width - newWidth) / 2 + containerSize.left
	};
};
var base64ByData = /* @__PURE__ */ new WeakMap();
var ruleByFontFace = /* @__PURE__ */ new WeakMap();
var styleByFontFaceSet = /* @__PURE__ */ new Map();
var fontIndexesByFamily = /* @__PURE__ */ new Map();
var indexedFontCount = 0;
var getBase64 = (data) => {
	const cached = base64ByData.get(data);
	if (cached) return cached;
	const bytes = new Uint8Array(data);
	let binary = "";
	for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
	const base64 = btoa(binary);
	base64ByData.set(data, base64);
	return base64;
};
var normalizeWeight = (value) => {
	if (value === "normal") return 400;
	if (value === "bold") return 700;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
};
var stretchKeywords = {
	"ultra-condensed": 50,
	"extra-condensed": 62.5,
	condensed: 75,
	"semi-condensed": 87.5,
	normal: 100,
	"semi-expanded": 112.5,
	expanded: 125,
	"extra-expanded": 150,
	"ultra-expanded": 200
};
var normalizeStretch = (value) => {
	const keyword = stretchKeywords[value];
	if (keyword !== void 0) return keyword;
	if (!value.endsWith("%")) return null;
	const parsed = Number(value.slice(0, -1));
	return Number.isFinite(parsed) ? parsed : null;
};
var valueMatchesRange = ({ actual, descriptor, normalize }) => {
	const actualValue = normalize(actual);
	const range = descriptor.trim().split(/\s+/).map(normalize);
	if (actualValue === null || range.some((value) => value === null)) return actual.toLowerCase() === descriptor.toLowerCase();
	if (range.length === 1) return actualValue === range[0];
	return range.length === 2 && actualValue >= Math.min(range[0], range[1]) && actualValue <= Math.max(range[0], range[1]);
};
var descriptorsMatch = (font, computedStyle) => {
	if ((font.style ?? "normal").split(/\s+/)[0]?.toLowerCase() !== computedStyle.fontStyle.split(/\s+/)[0]?.toLowerCase()) return false;
	if (!valueMatchesRange({
		actual: computedStyle.fontWeight,
		descriptor: font.weight ?? "400",
		normalize: normalizeWeight
	})) return false;
	return valueMatchesRange({
		actual: computedStyle.fontStretch || "normal",
		descriptor: font.stretch ?? "normal",
		normalize: normalizeStretch
	});
};
var unicodeRangeSupportsText = (unicodeRange, text) => {
	if (unicodeRange === null) return true;
	const ranges = unicodeRange.split(",").map((range) => {
		const match = /^U\+([0-9A-F?]+)(?:-([0-9A-F]+))?$/i.exec(range.trim());
		if (!match) return null;
		return {
			from: Number.parseInt(match[1].replace(/\?/g, "0"), 16),
			to: Number.parseInt((match[2] ?? match[1]).replace(/\?/g, "F"), 16)
		};
	});
	if (ranges.some((range) => range === null)) return true;
	return Array.from(text).some((character) => {
		const codePoint = character.codePointAt(0);
		return ranges.some((range) => range !== null && codePoint >= range.from && codePoint <= range.to);
	});
};
var getFontFaceRule = (font) => {
	const cached = ruleByFontFace.get(font);
	if (cached) return cached;
	const declarations = [`font-family:${JSON.stringify(font.fontFamily)}`, `src:url(data:${{
		opentype: "font/otf",
		truetype: "font/ttf",
		woff: "font/woff",
		woff2: "font/woff2"
	}[font.format]};base64,${getBase64(font.fontData)}) format(${JSON.stringify(font.format)})`];
	const optionalDeclarations = [
		["ascent-override", font.ascentOverride],
		["descent-override", font.descentOverride],
		["font-display", font.display],
		["font-feature-settings", font.featureSettings],
		["line-gap-override", font.lineGapOverride],
		["font-stretch", font.stretch],
		["font-style", font.style],
		["font-weight", font.weight],
		["unicode-range", font.unicodeRange],
		["font-variant", font.variant]
	];
	for (const [property, value] of optionalDeclarations) if (value !== null) declarations.push(`${property}:${value}`);
	const rule = `@font-face{${declarations.join(";")}}`;
	ruleByFontFace.set(font, rule);
	return rule;
};
var getEmbeddedFontStyleForSvg = (svg) => {
	const textElements = svg.querySelectorAll("text");
	if (textElements.length === 0) return null;
	const registeredFonts = NoReactInternals.getRegisteredFontFaces();
	for (let index = indexedFontCount; index < registeredFonts.length; index++) {
		const family = registeredFonts[index].fontFamily.toLowerCase();
		const indexes = fontIndexesByFamily.get(family) ?? [];
		indexes.push(index);
		fontIndexesByFamily.set(family, indexes);
	}
	indexedFontCount = registeredFonts.length;
	const usedFontIndexes = /* @__PURE__ */ new Set();
	for (const textElement of textElements) {
		const textNodeWalker = svg.ownerDocument.createTreeWalker(textElement, 4);
		const computedStyleByElement = /* @__PURE__ */ new WeakMap();
		while (textNodeWalker.nextNode()) {
			const text = textNodeWalker.currentNode.textContent ?? "";
			if (text.length === 0) continue;
			const parentElement = textNodeWalker.currentNode.parentElement ?? textElement;
			const computedStyle = computedStyleByElement.get(parentElement) ?? (svg.ownerDocument.defaultView ?? window).getComputedStyle(parentElement);
			computedStyleByElement.set(parentElement, computedStyle);
			for (const family of computedStyle.fontFamily.split(",")) {
				const normalizedFamily = family.trim().replace(/^(['"])(.*)\1$/, "$2").toLowerCase();
				const familyIndexes = fontIndexesByFamily.get(normalizedFamily) ?? [];
				const matchingIndexes = familyIndexes.filter((index) => descriptorsMatch(registeredFonts[index], computedStyle));
				const candidateIndexes = matchingIndexes.length === 0 ? familyIndexes : matchingIndexes;
				for (const index of candidateIndexes) if (unicodeRangeSupportsText(registeredFonts[index].unicodeRange, text)) usedFontIndexes.add(index);
			}
		}
	}
	if (usedFontIndexes.size === 0) return null;
	const sortedIndexes = Array.from(usedFontIndexes).sort((a, b) => a - b);
	const cacheKey = sortedIndexes.join(",");
	const cached = styleByFontFaceSet.get(cacheKey);
	if (cached) return cached;
	const css = sortedIndexes.map((index) => getFontFaceRule(registeredFonts[index])).join("").replace(/]]>/g, "]]]]><![CDATA[>");
	const style = `<style type="text/css"><![CDATA[${css}]]></style>`;
	const embeddedStyle = {
		blob: new Blob([style]),
		cacheKey,
		css
	};
	styleByFontFaceSet.set(cacheKey, embeddedStyle);
	return embeddedStyle;
};
var drawableBySvg = /* @__PURE__ */ new WeakMap();
var turnSvgIntoDrawable = (svg) => {
	const { fill, color } = getComputedStyle(svg);
	const originalStyle = svg.getAttribute("style");
	svg.style.position = "static";
	svg.style.inset = "auto";
	svg.style.transform = "none";
	svg.style.translate = "none";
	svg.style.scale = "none";
	svg.style.rotate = "none";
	svg.style.transformOrigin = "";
	svg.style.marginLeft = "0";
	svg.style.marginRight = "0";
	svg.style.marginTop = "0";
	svg.style.marginBottom = "0";
	svg.style.fill = fill;
	svg.style.color = color;
	const serializedSvg = new XMLSerializer().serializeToString(svg).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
	if (originalStyle === null) svg.removeAttribute("style");
	else svg.setAttribute("style", originalStyle);
	const embeddedFontStyle = getEmbeddedFontStyleForSvg(svg);
	const fontStyleKey = embeddedFontStyle?.cacheKey ?? null;
	const cached = drawableBySvg.get(svg);
	if (cached?.serializedSvg === serializedSvg && cached.fontStyleKey === fontStyleKey) return cached.drawable;
	const drawable = new Promise((resolve, reject) => {
		const image = new Image();
		const openingTagEnd = serializedSvg.indexOf(">");
		const blobParts = embeddedFontStyle === null || openingTagEnd === -1 ? [serializedSvg] : [
			serializedSvg.slice(0, openingTagEnd + 1),
			embeddedFontStyle.blob,
			serializedSvg.slice(openingTagEnd + 1)
		];
		const url = URL.createObjectURL(new Blob(blobParts, { type: "image/svg+xml;charset=utf-8" }));
		image.onload = function() {
			URL.revokeObjectURL(url);
			resolve(image);
		};
		image.onerror = () => {
			URL.revokeObjectURL(url);
			reject(/* @__PURE__ */ new Error("Failed to convert SVG to image"));
		};
		image.src = url;
	});
	drawableBySvg.set(svg, {
		fontStyleKey,
		serializedSvg,
		drawable
	});
	drawable.catch(() => {
		if (drawableBySvg.get(svg)?.drawable === drawable) drawableBySvg.delete(svg);
	});
	return drawable;
};
var getReadableImageError = (err, node) => {
	if (!(err instanceof DOMException)) return null;
	if (err.name === "SecurityError") return /* @__PURE__ */ new Error(`Could not draw image with src="${node.src}" to canvas: The image is tainted due to CORS restrictions. The server hosting this image must respond with the "Access-Control-Allow-Origin" header. See: https://remotion.dev/docs/client-side-rendering/migration`);
	if (err.name === "InvalidStateError") return /* @__PURE__ */ new Error(`Could not draw image with src="${node.src}" to canvas: The image is in a broken state. This usually means the image failed to load - check that the URL is valid and accessible.`);
	return null;
};
var drawSvg = ({ drawable, dimensions, contextToDraw }) => {
	const fitted = fitSvgIntoItsContainer({
		containerSize: dimensions,
		elementSize: {
			width: drawable.width,
			height: drawable.height
		}
	});
	contextToDraw.drawImage(drawable, fitted.left, fitted.top, fitted.width, fitted.height);
};
var drawReplacedElement = ({ drawable, dimensions, computedStyle, contextToDraw }) => {
	const objectFit = parseObjectFit(computedStyle.objectFit);
	const intrinsicSize = drawable instanceof HTMLImageElement ? {
		width: drawable.naturalWidth,
		height: drawable.naturalHeight
	} : {
		width: drawable.width,
		height: drawable.height
	};
	if (drawable instanceof HTMLImageElement && drawable.currentSrc.startsWith("data:image/svg+xml")) {
		const containerAspect = dimensions.width / dimensions.height;
		const imageAspect = intrinsicSize.width / intrinsicSize.height;
		let destWidth = dimensions.width;
		let destHeight = dimensions.height;
		let destX = dimensions.left;
		let destY = dimensions.top;
		if (objectFit === "contain" || objectFit === "scale-down" && (intrinsicSize.width > dimensions.width || intrinsicSize.height > dimensions.height)) {
			if (imageAspect > containerAspect) {
				destWidth = dimensions.width;
				destHeight = destWidth / imageAspect;
			} else {
				destHeight = dimensions.height;
				destWidth = destHeight * imageAspect;
			}
			destX = dimensions.left + (dimensions.width - destWidth) / 2;
			destY = dimensions.top + (dimensions.height - destHeight) / 2;
		} else if (objectFit === "cover") {
			if (imageAspect > containerAspect) {
				destHeight = dimensions.height;
				destWidth = destHeight * imageAspect;
			} else {
				destWidth = dimensions.width;
				destHeight = destWidth / imageAspect;
			}
			destX = dimensions.left + (dimensions.width - destWidth) / 2;
			destY = dimensions.top + (dimensions.height - destHeight) / 2;
		} else if (objectFit === "none" || objectFit === "scale-down") {
			destWidth = intrinsicSize.width;
			destHeight = intrinsicSize.height;
			destX = dimensions.left + (dimensions.width - destWidth) / 2;
			destY = dimensions.top + (dimensions.height - destHeight) / 2;
		}
		contextToDraw.save();
		contextToDraw.beginPath();
		contextToDraw.rect(dimensions.left, dimensions.top, dimensions.width, dimensions.height);
		contextToDraw.clip();
		contextToDraw.drawImage(drawable, destX, destY, destWidth, destHeight);
		contextToDraw.restore();
		return;
	}
	const result = calculateObjectFit({
		objectFit,
		containerSize: {
			width: dimensions.width,
			height: dimensions.height,
			left: dimensions.left,
			top: dimensions.top
		},
		intrinsicSize
	});
	contextToDraw.drawImage(drawable, result.sourceX, result.sourceY, result.sourceWidth, result.sourceHeight, result.destX, result.destY, result.destWidth, result.destHeight);
};
var drawDomElement = (node) => {
	const domDrawFn = async ({ dimensions, contextToDraw, computedStyle }) => {
		if (node instanceof SVGSVGElement) {
			drawSvg({
				drawable: await turnSvgIntoDrawable(node),
				dimensions,
				contextToDraw
			});
			return;
		}
		if (node instanceof HTMLImageElement || node instanceof HTMLCanvasElement) try {
			drawReplacedElement({
				drawable: node,
				dimensions,
				computedStyle,
				contextToDraw
			});
		} catch (err) {
			if (node instanceof HTMLImageElement) {
				const readableError = getReadableImageError(err, node);
				if (readableError) throw readableError;
			}
			throw err;
		}
	};
	return domDrawFn;
};
var hasTransformCssValue = (style) => {
	return style.transform !== "none" && style.transform !== "";
};
var hasRotateCssValue = (style) => {
	return style.rotate !== "none" && style.rotate !== "";
};
var hasScaleCssValue = (style) => {
	return style.scale !== "none" && style.scale !== "";
};
var hasAnyTransformCssValue = (style) => {
	return hasTransformCssValue(style) || hasRotateCssValue(style) || hasScaleCssValue(style);
};
var parseScaleComponent = (component) => {
	if (component.endsWith("%")) return Number(component.slice(0, -1)) / 100;
	return Number(component);
};
var parseScale = (transform) => {
	const match = /^scale\((.*)\)$/.exec(transform);
	if (!match) return null;
	const scaleValue = match[1].trim();
	if (scaleValue === "") return null;
	const components = scaleValue.split(/\s+/).map(parseScaleComponent);
	if (components.length < 1 || components.length > 3 || components.some((component) => !Number.isFinite(component))) return null;
	return {
		x: components[0],
		y: components[1] ?? components[0],
		z: components[2] ?? 1
	};
};
var parseAxisRotate = (transform) => {
	const match = /^rotate\((.*)\)$/.exec(transform);
	if (!match) return null;
	const rotateValue = match[1].trim();
	const keywordAxis = /^(x|y|z)\s+(.+)$/i.exec(rotateValue);
	if (keywordAxis) {
		const axisKeyword = keywordAxis[1].toLowerCase();
		const angle = keywordAxis[2];
		return `${axisKeyword === "x" ? "rotateX" : axisKeyword === "y" ? "rotateY" : "rotate"}(${angle})`;
	}
	const vectorAxis = /^(\S+)\s+(\S+)\s+(\S+)\s+(.+)$/.exec(rotateValue);
	if (!vectorAxis) return null;
	const axisVector = vectorAxis.slice(1, 4).map(Number);
	if (axisVector.some((component) => !Number.isFinite(component))) return null;
	return `rotate3d(${axisVector.join(", ")}, ${vectorAxis[4]})`;
};
var makeDOMMatrix = (transform) => {
	if (transform) {
		const scale = parseScale(transform);
		if (scale) return new DOMMatrix().scale(scale.x, scale.y, scale.z);
		const axisRotate = parseAxisRotate(transform);
		if (axisRotate) return new DOMMatrix(axisRotate);
	}
	return new DOMMatrix(transform);
};
var isValidColor = (color) => {
	try {
		const result = NoReactInternals.processColor(color);
		return result !== null && result !== void 0;
	} catch {
		return false;
	}
};
var parseDirection = (directionStr) => {
	const trimmed = directionStr.trim().toLowerCase();
	if (trimmed.startsWith("to ")) switch (trimmed.substring(3).trim()) {
		case "top": return 0;
		case "right": return 90;
		case "bottom": return 180;
		case "left": return 270;
		case "top right":
		case "right top": return 45;
		case "bottom right":
		case "right bottom": return 135;
		case "bottom left":
		case "left bottom": return 225;
		case "top left":
		case "left top": return 315;
		default: return 180;
	}
	const angleMatch = trimmed.match(/^(-?\d+\.?\d*)(deg|rad|grad|turn)$/);
	if (angleMatch) {
		const value = parseFloat(angleMatch[1]);
		switch (angleMatch[2]) {
			case "deg": return value;
			case "rad": return value * 180 / Math.PI;
			case "grad": return value * 360 / 400;
			case "turn": return value * 360;
			default: return value;
		}
	}
	return 180;
};
var cssColorToRgba = (color) => {
	try {
		const packed = NoReactInternals.processColor(color);
		const a = (packed >>> 24 & 255) / 255;
		return {
			r: packed >>> 16 & 255,
			g: packed >>> 8 & 255,
			b: packed & 255,
			a
		};
	} catch {
		return null;
	}
};
var isFullyTransparent = (color) => {
	const rgba = cssColorToRgba(color);
	return rgba !== null && rgba.a === 0;
};
var findNearestNonTransparent = (stops, fromIndex, direction) => {
	let i = fromIndex + direction;
	while (i >= 0 && i < stops.length) {
		if (!isFullyTransparent(stops[i].color)) return stops[i].color;
		i += direction;
	}
	return null;
};
var resolveTransparentStops = (stops) => {
	for (let i = 0; i < stops.length; i++) {
		if (!isFullyTransparent(stops[i].color)) continue;
		const prev = findNearestNonTransparent(stops, i, -1);
		const next = findNearestNonTransparent(stops, i, 1);
		const neighbor = prev ?? next;
		if (neighbor) {
			const rgba = cssColorToRgba(neighbor);
			if (rgba) stops[i].color = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, 0)`;
		}
	}
};
var parseColorStops = (colorStopsStr) => {
	const parts = colorStopsStr.split(/,(?![^(]*\))/);
	const stops = [];
	for (const part of parts) {
		const trimmed = part.trim();
		if (!trimmed) continue;
		const colorMatch = trimmed.match(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-f]{3,8}|[a-z]+)/i);
		if (!colorMatch) continue;
		const colorStr = colorMatch[0];
		if (!isValidColor(colorStr)) continue;
		const remaining = trimmed.substring(colorMatch.index + colorStr.length).trim();
		const normalizedColor = colorStr;
		let position = null;
		if (remaining) {
			const posMatch = remaining.match(/(-?\d+\.?\d*)(%|px)?/);
			if (posMatch) {
				const value = parseFloat(posMatch[1]);
				const unit = posMatch[2];
				if (unit === "%") position = value / 100;
				else if (unit === "px") position = null;
				else position = value / 100;
			}
		}
		stops.push({
			color: normalizedColor,
			position: position !== null ? position : -1
		});
	}
	if (stops.length === 0) return null;
	let lastExplicitIndex = -1;
	let lastExplicitPosition = 0;
	for (let i = 0; i < stops.length; i++) if (stops[i].position !== -1) {
		if (lastExplicitIndex >= 0) {
			const numImplicit = i - lastExplicitIndex - 1;
			if (numImplicit > 0) {
				const step = (stops[i].position - lastExplicitPosition) / (numImplicit + 1);
				for (let j = lastExplicitIndex + 1; j < i; j++) stops[j].position = lastExplicitPosition + step * (j - lastExplicitIndex);
			}
		} else {
			const numImplicit = i;
			if (numImplicit > 0) {
				const step = stops[i].position / (numImplicit + 1);
				for (let j = 0; j < i; j++) stops[j].position = step * (j + 1);
			}
		}
		lastExplicitIndex = i;
		lastExplicitPosition = stops[i].position;
	}
	if (stops.every((s) => s.position === -1)) {
		if (stops.length === 1) stops[0].position = .5;
		else for (let i = 0; i < stops.length; i++) stops[i].position = i / (stops.length - 1);
	} else if (lastExplicitIndex < stops.length - 1) {
		const numImplicit = stops.length - 1 - lastExplicitIndex;
		const step = (1 - lastExplicitPosition) / (numImplicit + 1);
		for (let i = lastExplicitIndex + 1; i < stops.length; i++) stops[i].position = lastExplicitPosition + step * (i - lastExplicitIndex);
	}
	for (const stop of stops) stop.position = Math.max(0, Math.min(1, stop.position));
	resolveTransparentStops(stops);
	return stops;
};
var extractGradientContent = (backgroundImage) => {
	const startIndex = backgroundImage.toLowerCase().indexOf("linear-gradient(");
	if (startIndex === -1) return null;
	let depth = 0;
	const contentStart = startIndex + 16;
	for (let i = contentStart; i < backgroundImage.length; i++) {
		const char = backgroundImage[i];
		if (char === "(") depth++;
		else if (char === ")") {
			if (depth === 0) return backgroundImage.substring(contentStart, i).trim();
			depth--;
		}
	}
	return null;
};
var parseLinearGradient = (backgroundImage) => {
	if (!backgroundImage || backgroundImage === "none") return null;
	const content = extractGradientContent(backgroundImage);
	if (!content) return null;
	const parts = content.split(/,(?![^(]*\))/);
	let angle = 180;
	let colorStopsStart = 0;
	if (parts.length > 0) {
		const firstPart = parts[0].trim();
		if (firstPart.startsWith("to ") || /^-?\d+\.?\d*(deg|rad|grad|turn)$/.test(firstPart)) {
			angle = parseDirection(firstPart);
			colorStopsStart = 1;
		}
	}
	const colorStops = parseColorStops(parts.slice(colorStopsStart).join(","));
	if (!colorStops || colorStops.length === 0) return null;
	return {
		angle,
		colorStops
	};
};
var createCanvasGradient = ({ ctx, rect, gradientInfo, offsetLeft, offsetTop }) => {
	const angleRad = (gradientInfo.angle - 90) * Math.PI / 180;
	const centerX = rect.left - offsetLeft + rect.width / 2;
	const centerY = rect.top - offsetTop + rect.height / 2;
	const cos = Math.cos(angleRad);
	const sin = Math.sin(angleRad);
	const halfWidth = rect.width / 2;
	const halfHeight = rect.height / 2;
	let length = Math.abs(cos) * halfWidth + Math.abs(sin) * halfHeight;
	if (!Number.isFinite(length) || length === 0) length = Math.sqrt(halfWidth ** 2 + halfHeight ** 2);
	const x0 = centerX - cos * length;
	const y0 = centerY - sin * length;
	const x1 = centerX + cos * length;
	const y1 = centerY + sin * length;
	const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
	for (const stop of gradientInfo.colorStops) gradient.addColorStop(stop.position, stop.color);
	return gradient;
};
var getMaskImageValue = (computedStyle) => {
	const { maskImage, webkitMaskImage } = computedStyle;
	const value = maskImage || webkitMaskImage;
	if (!value || value === "none") return null;
	return value;
};
var parseUrlFunction = (value) => {
	const trimmed = value.trim();
	if (!trimmed.toLowerCase().startsWith("url(")) return null;
	let index = 4;
	while (/\s/.test(trimmed[index] ?? "")) index++;
	const quote = trimmed[index] === "\"" || trimmed[index] === "'" ? trimmed[index] : null;
	if (quote) index++;
	let url = "";
	let closedQuote = quote === null;
	for (; index < trimmed.length; index++) {
		const char = trimmed[index];
		if (char === "\\") {
			const next = trimmed[index + 1];
			if (next === void 0) return null;
			url += next;
			index++;
			continue;
		}
		if (quote && char === quote) {
			closedQuote = true;
			index++;
			break;
		}
		if (!quote && char === ")") break;
		url += char;
	}
	if (!closedQuote) return null;
	while (/\s/.test(trimmed[index] ?? "")) index++;
	if (trimmed[index] !== ")") return null;
	index++;
	while (/\s/.test(trimmed[index] ?? "")) index++;
	if (index !== trimmed.length) return null;
	return url.trim();
};
var getMaskProperty = ({ standard, prefixed }) => standard || prefixed;
var normalizeCssValue = (value) => value.trim().toLowerCase().replace(/\s+/g, " ");
var validateUrlMaskImageStyle = (computedStyle) => {
	const maskSize = normalizeCssValue(getMaskProperty({
		standard: computedStyle.maskSize,
		prefixed: computedStyle.webkitMaskSize
	}));
	const maskPosition = normalizeCssValue(getMaskProperty({
		standard: computedStyle.maskPosition,
		prefixed: computedStyle.webkitMaskPosition
	}));
	const maskRepeat = normalizeCssValue(getMaskProperty({
		standard: computedStyle.maskRepeat,
		prefixed: computedStyle.webkitMaskRepeat
	}));
	const maskMode = normalizeCssValue(computedStyle.maskMode);
	const maskOrigin = normalizeCssValue(getMaskProperty({
		standard: computedStyle.maskOrigin,
		prefixed: computedStyle.webkitMaskOrigin
	}));
	const maskClip = normalizeCssValue(getMaskProperty({
		standard: computedStyle.maskClip,
		prefixed: computedStyle.webkitMaskClip
	}));
	const isSupportedPosition = maskPosition === "0% 0%" || maskPosition === "0px 0px" || maskPosition === "left top";
	const unsupportedProperties = [
		maskSize !== "100% 100%" ? `mask-size: ${maskSize}` : null,
		!isSupportedPosition ? `mask-position: ${maskPosition}` : null,
		maskRepeat !== "no-repeat" ? `mask-repeat: ${maskRepeat}` : null,
		maskMode !== "" && maskMode !== "alpha" && maskMode !== "match-source" ? `mask-mode: ${maskMode}` : null,
		maskOrigin !== "border-box" ? `mask-origin: ${maskOrigin}` : null,
		maskClip !== "border-box" ? `mask-clip: ${maskClip}` : null
	].filter((property) => property !== null);
	if (unsupportedProperties.length > 0) throw new Error(`@remotion/web-renderer only supports URL masks with mask-size: 100% 100%, mask-position: 0% 0%, mask-repeat: no-repeat, the border box as origin and clip, and alpha semantics. Unsupported value${unsupportedProperties.length === 1 ? "" : "s"}: ${unsupportedProperties.join(", ")}`);
};
var parseMaskImage = (maskImageValue) => {
	const gradientInfo = parseLinearGradient(maskImageValue);
	if (gradientInfo) return {
		type: "linear-gradient",
		gradientInfo
	};
	const url = parseUrlFunction(maskImageValue);
	if (url !== null) {
		if (!url) throw new Error("mask-image: url() must contain a URL");
		return {
			type: "url",
			src: new URL(url, document.baseURI).href
		};
	}
	if (maskImageValue.trim().toLowerCase().startsWith("url(")) throw new Error("@remotion/web-renderer only supports a single mask-image: url() layer");
	return null;
};
var elementHasUrlMaskImage = (element) => {
	return getMaskImageValue(getComputedStyle(element))?.trim().toLowerCase().startsWith("url(") ?? false;
};
var containsUrlMaskImage = (element) => {
	if (elementHasUrlMaskImage(element)) return true;
	const children = element.querySelectorAll("*");
	for (let index = 0; index < children.length; index++) {
		const child = children[index];
		if (elementHasUrlMaskImage(child)) return true;
	}
	return false;
};
var parseTransformOrigin = (transformOrigin) => {
	if (transformOrigin.trim() === "") return null;
	const [x, y] = transformOrigin.split(" ");
	return {
		x: parseFloat(x),
		y: parseFloat(y)
	};
};
var filterRequiresPrecompositing = (filter) => {
	if (!filter || filter === "none") return null;
	if (filter.includes("drop-shadow")) return filter;
	return null;
};
var snapshotTransformStyle = (computedStyle) => {
	return {
		display: computedStyle.display,
		rotate: computedStyle.rotate,
		scale: computedStyle.scale,
		transform: computedStyle.transform,
		transformOrigin: computedStyle.transformOrigin
	};
};
var isReplacedElement = (element) => {
	return element instanceof HTMLImageElement || element instanceof HTMLVideoElement || element instanceof HTMLCanvasElement || element instanceof HTMLIFrameElement || element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || element instanceof HTMLObjectElement || element instanceof HTMLEmbedElement;
};
var canApplyCssTransforms = ({ element, computedStyle }) => {
	if (element instanceof SVGElement) return true;
	if (computedStyle.display !== "inline") return true;
	return isReplacedElement(element);
};
var makeTransformResetter = (element) => {
	const { transform, scale, rotate } = element.style;
	return (hasApplicableTransformCssValue) => {
		if (hasApplicableTransformCssValue) {
			element.style.transform = "none";
			element.style.scale = "none";
			element.style.rotate = "none";
		}
		return () => {
			if (hasApplicableTransformCssValue) {
				element.style.transform = transform;
				element.style.scale = scale;
				element.style.rotate = rotate;
			}
		};
	};
};
var getInternalTransformOrigin = (transform) => {
	const centerX = transform.boundingClientRect.width / 2;
	const centerY = transform.boundingClientRect.height / 2;
	return parseTransformOrigin(transform.transformOrigin) ?? {
		x: centerX,
		y: centerY
	};
};
var getGlobalTransformOrigin = ({ transform }) => {
	const { x: originX, y: originY } = getInternalTransformOrigin(transform);
	return {
		x: originX + transform.boundingClientRect.left,
		y: originY + transform.boundingClientRect.top
	};
};
var calculateTransforms = ({ element, rootElement, transformStyleCache }) => {
	let parent = element;
	const transforms = [];
	const toReset = [];
	let opacity = 1;
	let elementComputedStyle = null;
	let maskImageInfo = null;
	let filterForPrecompositing = null;
	while (parent) {
		const cachedTransformStyle = transformStyleCache.get(parent);
		const shouldReadComputedStyle = parent === element || cachedTransformStyle === void 0;
		const originalTransition = parent.style.transition;
		parent.style.transition = "none";
		const computedStyle = shouldReadComputedStyle ? getComputedStyle(parent) : null;
		const transformStyle = computedStyle === null ? cachedTransformStyle : snapshotTransformStyle(computedStyle);
		if (computedStyle !== null) transformStyleCache.set(parent, transformStyle);
		if (parent === element) {
			if (computedStyle === null) throw new Error("Element computed style not found");
			elementComputedStyle = computedStyle;
			opacity = parseFloat(computedStyle.opacity);
			const maskImageValue = getMaskImageValue(computedStyle);
			maskImageInfo = maskImageValue ? parseMaskImage(maskImageValue) : null;
			if (maskImageInfo?.type === "url") validateUrlMaskImageStyle(computedStyle);
			filterForPrecompositing = filterRequiresPrecompositing(computedStyle.filter);
			const originalMaskImage = parent.style.maskImage;
			const originalWebkitMaskImage = parent.style.webkitMaskImage;
			parent.style.maskImage = "none";
			parent.style.webkitMaskImage = "none";
			const originalFilter = parent.style.filter;
			if (filterForPrecompositing) parent.style.filter = "none";
			const parentRef = parent;
			toReset.push(() => {
				parentRef.style.maskImage = originalMaskImage;
				parentRef.style.webkitMaskImage = originalWebkitMaskImage;
				if (filterForPrecompositing) parentRef.style.filter = originalFilter;
			});
		}
		const hasApplicableTransformCssValue = canApplyCssTransforms({
			computedStyle: transformStyle,
			element: parent
		}) && hasAnyTransformCssValue(transformStyle);
		if (hasApplicableTransformCssValue || parent === element) {
			const matrix = makeDOMMatrix(hasApplicableTransformCssValue && hasTransformCssValue(transformStyle) ? transformStyle.transform : void 0);
			const resetTransforms = makeTransformResetter(parent);
			const { scale, rotate } = parent.style;
			const additionalMatrices = [];
			if (hasApplicableTransformCssValue && rotate !== "" && rotate !== "none") additionalMatrices.push(makeDOMMatrix(`rotate(${rotate})`));
			if (hasApplicableTransformCssValue && scale !== "" && scale !== "none") additionalMatrices.push(makeDOMMatrix(`scale(${scale})`));
			additionalMatrices.push(matrix);
			const cleanup = resetTransforms(hasApplicableTransformCssValue);
			transforms.push({
				element: parent,
				transformOrigin: transformStyle.transformOrigin,
				boundingClientRect: null,
				matrices: additionalMatrices
			});
			const parentRef = parent;
			toReset.push(() => {
				cleanup();
				parentRef.style.transition = originalTransition;
			});
		} else {
			const parentRef = parent;
			toReset.push(() => {
				parentRef.style.transition = originalTransition;
			});
		}
		if (parent === rootElement) break;
		parent = parent.parentElement;
	}
	for (const transform of transforms) transform.boundingClientRect = transform.element.getBoundingClientRect();
	const dimensions = transforms[0].boundingClientRect;
	const nativeTransformOrigin = getInternalTransformOrigin(transforms[0]);
	const totalMatrix = new DOMMatrix();
	for (const transform of transforms.slice().reverse()) for (const matrix of transform.matrices) {
		const globalTransformOrigin = getGlobalTransformOrigin({ transform });
		const transformMatrix = new DOMMatrix().translate(globalTransformOrigin.x, globalTransformOrigin.y).multiply(matrix).translate(-globalTransformOrigin.x, -globalTransformOrigin.y);
		totalMatrix.multiplySelf(transformMatrix);
	}
	if (!elementComputedStyle) throw new Error("Element computed style not found");
	const needs3DTransformViaWebGL = !totalMatrix.is2D;
	const needsMaskImage = maskImageInfo !== null;
	const needsFilterPrecompositing = filterForPrecompositing !== null;
	return {
		dimensions,
		totalMatrix,
		[Symbol.dispose]: () => {
			for (const reset of toReset) reset();
		},
		nativeTransformOrigin,
		computedStyle: elementComputedStyle,
		opacity,
		maskImageInfo,
		precompositing: {
			needs3DTransformViaWebGL,
			needsMaskImage: maskImageInfo,
			needsFilterPrecompositing: filterForPrecompositing,
			needsPrecompositing: Boolean(needs3DTransformViaWebGL || needsMaskImage || needsFilterPrecompositing)
		}
	};
};
var roundToExpandRect = (rect) => {
	const left = Math.floor(rect.left);
	const top = Math.floor(rect.top);
	const right = Math.ceil(rect.right);
	const bottom = Math.ceil(rect.bottom);
	return new DOMRect(left, top, right - left, bottom - top);
};
var getNarrowerRect = ({ firstRect, secondRect }) => {
	const left = Math.max(firstRect.left, secondRect.left);
	const top = Math.max(firstRect.top, secondRect.top);
	const bottom = Math.min(firstRect.bottom, secondRect.bottom);
	const right = Math.min(firstRect.right, secondRect.right);
	return new DOMRect(left, top, right - left, bottom - top);
};
var getWiderRectAndExpand = ({ firstRect, secondRect }) => {
	if (firstRect === null) return roundToExpandRect(secondRect);
	const left = Math.min(firstRect.left, secondRect.left);
	const top = Math.min(firstRect.top, secondRect.top);
	const bottom = Math.max(firstRect.bottom, secondRect.bottom);
	const right = Math.max(firstRect.right, secondRect.right);
	return roundToExpandRect(new DOMRect(left, top, right - left, bottom - top));
};
function doRectsIntersect(rect1, rect2) {
	return !(rect1.right <= rect2.left || rect1.left >= rect2.right || rect1.bottom <= rect2.top || rect1.top >= rect2.bottom);
}
var drawRoundedRectPath = ({ ctx, x, y, width, height, borderRadius }) => {
	ctx.beginPath();
	ctx.moveTo(x + borderRadius.topLeft.horizontal, y);
	ctx.lineTo(x + width - borderRadius.topRight.horizontal, y);
	if (borderRadius.topRight.horizontal > 0 || borderRadius.topRight.vertical > 0) ctx.ellipse(x + width - borderRadius.topRight.horizontal, y + borderRadius.topRight.vertical, borderRadius.topRight.horizontal, borderRadius.topRight.vertical, 0, -Math.PI / 2, 0);
	ctx.lineTo(x + width, y + height - borderRadius.bottomRight.vertical);
	if (borderRadius.bottomRight.horizontal > 0 || borderRadius.bottomRight.vertical > 0) ctx.ellipse(x + width - borderRadius.bottomRight.horizontal, y + height - borderRadius.bottomRight.vertical, borderRadius.bottomRight.horizontal, borderRadius.bottomRight.vertical, 0, 0, Math.PI / 2);
	ctx.lineTo(x + borderRadius.bottomLeft.horizontal, y + height);
	if (borderRadius.bottomLeft.horizontal > 0 || borderRadius.bottomLeft.vertical > 0) ctx.ellipse(x + borderRadius.bottomLeft.horizontal, y + height - borderRadius.bottomLeft.vertical, borderRadius.bottomLeft.horizontal, borderRadius.bottomLeft.vertical, 0, Math.PI / 2, Math.PI);
	ctx.lineTo(x, y + borderRadius.topLeft.vertical);
	if (borderRadius.topLeft.horizontal > 0 || borderRadius.topLeft.vertical > 0) ctx.ellipse(x + borderRadius.topLeft.horizontal, y + borderRadius.topLeft.vertical, borderRadius.topLeft.horizontal, borderRadius.topLeft.vertical, 0, Math.PI, Math.PI * 3 / 2);
	ctx.closePath();
};
var getPaddingBox = (rect, computedStyle) => {
	const borderLeft = parseFloat(computedStyle.borderLeftWidth);
	const borderRight = parseFloat(computedStyle.borderRightWidth);
	const borderTop = parseFloat(computedStyle.borderTopWidth);
	const borderBottom = parseFloat(computedStyle.borderBottomWidth);
	return new DOMRect(rect.left + borderLeft, rect.top + borderTop, rect.width - borderLeft - borderRight, rect.height - borderTop - borderBottom);
};
var getContentBox = (rect, computedStyle) => {
	const paddingBox = getPaddingBox(rect, computedStyle);
	const paddingLeft = parseFloat(computedStyle.paddingLeft);
	const paddingRight = parseFloat(computedStyle.paddingRight);
	const paddingTop = parseFloat(computedStyle.paddingTop);
	const paddingBottom = parseFloat(computedStyle.paddingBottom);
	return new DOMRect(paddingBox.left + paddingLeft, paddingBox.top + paddingTop, paddingBox.width - paddingLeft - paddingRight, paddingBox.height - paddingTop - paddingBottom);
};
var getBoxBasedOnBackgroundClip = (rect, computedStyle, backgroundClip) => {
	if (!backgroundClip) return rect;
	if (backgroundClip.includes("text")) return rect;
	if (backgroundClip.includes("padding-box")) return getPaddingBox(rect, computedStyle);
	if (backgroundClip.includes("content-box")) return getContentBox(rect, computedStyle);
	return rect;
};
function parseValue({ value, reference }) {
	value = value.trim();
	if (value.endsWith("%")) return parseFloat(value) / 100 * reference;
	if (value.endsWith("px")) return parseFloat(value);
	return parseFloat(value);
}
function expandShorthand(values) {
	if (values.length === 1) return [
		values[0],
		values[0],
		values[0],
		values[0]
	];
	if (values.length === 2) return [
		values[0],
		values[1],
		values[0],
		values[1]
	];
	if (values.length === 3) return [
		values[0],
		values[1],
		values[2],
		values[1]
	];
	return [
		values[0],
		values[1],
		values[2],
		values[3]
	];
}
function clampBorderRadius({ borderRadius, width, height }) {
	const topHorizontal = borderRadius.topLeft.horizontal + borderRadius.topRight.horizontal;
	const bottomHorizontal = borderRadius.bottomLeft.horizontal + borderRadius.bottomRight.horizontal;
	const leftVertical = borderRadius.topLeft.vertical + borderRadius.bottomLeft.vertical;
	const rightVertical = borderRadius.topRight.vertical + borderRadius.bottomRight.vertical;
	const factor = Math.min(1, topHorizontal === 0 ? 1 : width / topHorizontal, bottomHorizontal === 0 ? 1 : width / bottomHorizontal, leftVertical === 0 ? 1 : height / leftVertical, rightVertical === 0 ? 1 : height / rightVertical);
	return {
		topLeft: {
			horizontal: borderRadius.topLeft.horizontal * factor,
			vertical: borderRadius.topLeft.vertical * factor
		},
		topRight: {
			horizontal: borderRadius.topRight.horizontal * factor,
			vertical: borderRadius.topRight.vertical * factor
		},
		bottomRight: {
			horizontal: borderRadius.bottomRight.horizontal * factor,
			vertical: borderRadius.bottomRight.vertical * factor
		},
		bottomLeft: {
			horizontal: borderRadius.bottomLeft.horizontal * factor,
			vertical: borderRadius.bottomLeft.vertical * factor
		}
	};
}
function parseBorderRadius({ borderRadius, width, height }) {
	const parts = borderRadius.split("/").map((part) => part.trim());
	const horizontalPart = parts[0];
	const verticalPart = parts[1];
	const horizontalValues = horizontalPart.split(/\s+/).filter((v) => v);
	const verticalValues = verticalPart ? verticalPart.split(/\s+/).filter((v) => v) : horizontalValues;
	const [hTopLeft, hTopRight, hBottomRight, hBottomLeft] = expandShorthand(horizontalValues);
	const [vTopLeft, vTopRight, vBottomRight, vBottomLeft] = expandShorthand(verticalValues);
	return clampBorderRadius({
		borderRadius: {
			topLeft: {
				horizontal: parseValue({
					value: hTopLeft,
					reference: width
				}),
				vertical: parseValue({
					value: vTopLeft,
					reference: height
				})
			},
			topRight: {
				horizontal: parseValue({
					value: hTopRight,
					reference: width
				}),
				vertical: parseValue({
					value: vTopRight,
					reference: height
				})
			},
			bottomRight: {
				horizontal: parseValue({
					value: hBottomRight,
					reference: width
				}),
				vertical: parseValue({
					value: vBottomRight,
					reference: height
				})
			},
			bottomLeft: {
				horizontal: parseValue({
					value: hBottomLeft,
					reference: width
				}),
				vertical: parseValue({
					value: vBottomLeft,
					reference: height
				})
			}
		},
		width,
		height
	});
}
function setBorderRadius({ ctx, rect, borderRadius, forceClipEvenWhenZero = false, computedStyle, backgroundClip }) {
	if (borderRadius.topLeft.horizontal === 0 && borderRadius.topLeft.vertical === 0 && borderRadius.topRight.horizontal === 0 && borderRadius.topRight.vertical === 0 && borderRadius.bottomRight.horizontal === 0 && borderRadius.bottomRight.vertical === 0 && borderRadius.bottomLeft.horizontal === 0 && borderRadius.bottomLeft.vertical === 0 && !forceClipEvenWhenZero) return () => {};
	ctx.save();
	const boundingRect = getBoxBasedOnBackgroundClip(rect, computedStyle, backgroundClip);
	const actualBorderRadius = {
		topLeft: {
			horizontal: Math.max(0, borderRadius.topLeft.horizontal - (boundingRect.left - rect.left)),
			vertical: Math.max(0, borderRadius.topLeft.vertical - (boundingRect.top - rect.top))
		},
		topRight: {
			horizontal: Math.max(0, borderRadius.topRight.horizontal - (rect.right - boundingRect.right)),
			vertical: Math.max(0, borderRadius.topRight.vertical - (boundingRect.top - rect.top))
		},
		bottomRight: {
			horizontal: Math.max(0, borderRadius.bottomRight.horizontal - (rect.right - boundingRect.right)),
			vertical: Math.max(0, borderRadius.bottomRight.vertical - (rect.bottom - boundingRect.bottom))
		},
		bottomLeft: {
			horizontal: Math.max(0, borderRadius.bottomLeft.horizontal - (boundingRect.left - rect.left)),
			vertical: Math.max(0, borderRadius.bottomLeft.vertical - (rect.bottom - boundingRect.bottom))
		}
	};
	drawRoundedRectPath({
		ctx,
		x: boundingRect.left,
		y: boundingRect.top,
		width: boundingRect.width,
		height: boundingRect.height,
		borderRadius: actualBorderRadius
	});
	ctx.clip();
	return () => {
		ctx.restore();
	};
}
function resolveLength(value, reference) {
	value = value.trim();
	if (value.endsWith("%")) return parseFloat(value) / 100 * reference;
	if (value.endsWith("px")) return parseFloat(value);
	return parseFloat(value);
}
function parsePosition(parts, width, height) {
	if (parts.length === 0) return {
		x: width / 2,
		y: height / 2
	};
	if (parts.length === 1) return {
		x: resolveLength(parts[0], width),
		y: height / 2
	};
	return {
		x: resolveLength(parts[0], width),
		y: resolveLength(parts[1], height)
	};
}
function parsePolygon(args, rect) {
	return {
		type: "polygon",
		points: args.split(",").map((pointStr) => {
			const coords = pointStr.trim().split(/\s+/);
			return {
				x: resolveLength(coords[0], rect.width) + rect.left,
				y: resolveLength(coords[1], rect.height) + rect.top
			};
		})
	};
}
function parsePath(args) {
	const match = args.match(/^(?:(nonzero|evenodd)\s*,\s*)?["'](.+)["']$/);
	if (!match) return {
		type: "path",
		d: args.replace(/["']/g, ""),
		fillRule: "nonzero"
	};
	const fillRule = match[1] === "evenodd" ? "evenodd" : "nonzero";
	return {
		type: "path",
		d: match[2],
		fillRule
	};
}
function parseCircle(args, rect) {
	const atIndex = args.indexOf(" at ");
	let radiusStr;
	let positionParts;
	if (atIndex !== -1) {
		radiusStr = args.slice(0, atIndex).trim();
		positionParts = args.slice(atIndex + 4).trim().split(/\s+/);
	} else {
		radiusStr = args.trim();
		positionParts = [];
	}
	const closestSide = Math.min(rect.width, rect.height) / 2;
	const farthestSide = Math.max(rect.width, rect.height) / 2;
	let radius;
	if (radiusStr === "closest-side" || radiusStr === "") radius = closestSide;
	else if (radiusStr === "farthest-side") radius = farthestSide;
	else {
		const refSize = Math.sqrt(rect.width * rect.width + rect.height * rect.height) / Math.SQRT2;
		radius = resolveLength(radiusStr, refSize);
	}
	const position = parsePosition(positionParts, rect.width, rect.height);
	return {
		type: "circle",
		radius,
		cx: position.x + rect.left,
		cy: position.y + rect.top
	};
}
function parseEllipse(args, rect) {
	const atIndex = args.indexOf(" at ");
	let radiiStr;
	let positionParts;
	if (atIndex !== -1) {
		radiiStr = args.slice(0, atIndex).trim();
		positionParts = args.slice(atIndex + 4).trim().split(/\s+/);
	} else {
		radiiStr = args.trim();
		positionParts = [];
	}
	const radiiParts = radiiStr.split(/\s+/);
	let rx;
	let ry;
	if (radiiParts.length >= 2) {
		rx = resolveLength(radiiParts[0], rect.width);
		ry = resolveLength(radiiParts[1], rect.height);
	} else {
		rx = rect.width / 2;
		ry = rect.height / 2;
	}
	const position = parsePosition(positionParts, rect.width, rect.height);
	return {
		type: "ellipse",
		rx,
		ry,
		cx: position.x + rect.left,
		cy: position.y + rect.top
	};
}
function parseInset(args, rect) {
	const [insetPart] = args.split(/\s+round\s+/);
	const parts = insetPart.split(/\s+/);
	let top;
	let right;
	let bottom;
	let left;
	if (parts.length === 1) {
		const val = resolveLength(parts[0], rect.height);
		top = val;
		right = val;
		bottom = val;
		left = val;
	} else if (parts.length === 2) {
		top = resolveLength(parts[0], rect.height);
		bottom = resolveLength(parts[0], rect.height);
		right = resolveLength(parts[1], rect.width);
		left = resolveLength(parts[1], rect.width);
	} else if (parts.length === 3) {
		top = resolveLength(parts[0], rect.height);
		right = resolveLength(parts[1], rect.width);
		left = resolveLength(parts[1], rect.width);
		bottom = resolveLength(parts[2], rect.height);
	} else {
		top = resolveLength(parts[0], rect.height);
		right = resolveLength(parts[1], rect.width);
		bottom = resolveLength(parts[2], rect.height);
		left = resolveLength(parts[3], rect.width);
	}
	return {
		type: "inset",
		top,
		right,
		bottom,
		left
	};
}
function parseClipPath(clipPath, rect) {
	if (clipPath === "none" || clipPath === "") return { type: "none" };
	const polygonMatch = clipPath.match(/^polygon\((.+)\)$/);
	if (polygonMatch) return parsePolygon(polygonMatch[1], rect);
	const pathMatch = clipPath.match(/^path\((.+)\)$/);
	if (pathMatch) return parsePath(pathMatch[1]);
	const circleMatch = clipPath.match(/^circle\((.+)\)$/);
	if (circleMatch) return parseCircle(circleMatch[1], rect);
	const ellipseMatch = clipPath.match(/^ellipse\((.+)\)$/);
	if (ellipseMatch) return parseEllipse(ellipseMatch[1], rect);
	const insetMatch = clipPath.match(/^inset\((.+)\)$/);
	if (insetMatch) return parseInset(insetMatch[1], rect);
	return { type: "none" };
}
function setClipPath({ ctx, clipPath, rect }) {
	const parsed = parseClipPath(clipPath, rect);
	if (parsed.type === "none") return () => {};
	ctx.save();
	switch (parsed.type) {
		case "polygon":
			ctx.beginPath();
			for (let i = 0; i < parsed.points.length; i++) {
				const point = parsed.points[i];
				if (i === 0) ctx.moveTo(point.x, point.y);
				else ctx.lineTo(point.x, point.y);
			}
			ctx.closePath();
			ctx.clip();
			break;
		case "path": {
			const path2d = new Path2D();
			const offsetMatrix = new DOMMatrix().translate(rect.left, rect.top);
			path2d.addPath(new Path2D(parsed.d), offsetMatrix);
			ctx.clip(path2d, parsed.fillRule);
			break;
		}
		case "circle":
			ctx.beginPath();
			ctx.arc(parsed.cx, parsed.cy, parsed.radius, 0, Math.PI * 2);
			ctx.closePath();
			ctx.clip();
			break;
		case "ellipse":
			ctx.beginPath();
			ctx.ellipse(parsed.cx, parsed.cy, parsed.rx, parsed.ry, 0, 0, Math.PI * 2);
			ctx.closePath();
			ctx.clip();
			break;
		case "inset": {
			const x = rect.left + parsed.left;
			const y = rect.top + parsed.top;
			const w = rect.width - parsed.left - parsed.right;
			const h = rect.height - parsed.top - parsed.bottom;
			ctx.beginPath();
			ctx.rect(x, y, w, h);
			ctx.clip();
			break;
		}
	}
	return () => {
		ctx.restore();
	};
}
var firstLayer = (value) => value.split(",")[0].trim();
var parseLengthPercentage = (value) => {
	const match = value.match(/^(-?(?:\d+\.?\d*|\.\d+))(%|px)$/);
	if (match) return {
		unit: match[2],
		value: Number(match[1])
	};
	if (value === "0") return {
		unit: "px",
		value: 0
	};
	return null;
};
var resolveSize = ({ containerSize, value }) => {
	if (value === void 0 || value === "auto") return containerSize;
	const parsed = parseLengthPercentage(value);
	if (!parsed) return containerSize;
	return parsed.unit === "%" ? containerSize * (parsed.value / 100) : parsed.value;
};
var positionKeywordToPercentage = (value) => {
	if (value === "left" || value === "top") return 0;
	if (value === "center") return 50;
	if (value === "right" || value === "bottom") return 100;
	return null;
};
var resolvePosition = ({ containerSize, imageSize, value }) => {
	const keywordPercentage = positionKeywordToPercentage(value);
	if (keywordPercentage !== null) return (containerSize - imageSize) * (keywordPercentage / 100);
	const parsed = parseLengthPercentage(value);
	if (!parsed) return 0;
	return parsed.unit === "%" ? (containerSize - imageSize) * (parsed.value / 100) : parsed.value;
};
var parsePosition2 = (value) => {
	const parts = firstLayer(value).split(/\s+/);
	if (parts.length === 1) {
		if (parts[0] === "top" || parts[0] === "bottom") return {
			x: "center",
			y: parts[0]
		};
		return {
			x: parts[0],
			y: "center"
		};
	}
	if (parts[0] === "top" || parts[0] === "bottom") return {
		x: parts[1],
		y: parts[0]
	};
	return {
		x: parts[0],
		y: parts[1]
	};
};
var getBackgroundImageRect = ({ backgroundPosition, backgroundSize, positioningArea }) => {
	const sizeParts = firstLayer(backgroundSize).split(/\s+/);
	const width = resolveSize({
		containerSize: positioningArea.width,
		value: sizeParts[0]
	});
	const height = resolveSize({
		containerSize: positioningArea.height,
		value: sizeParts[1]
	});
	const position = parsePosition2(backgroundPosition);
	return new DOMRect(positioningArea.left + resolvePosition({
		containerSize: positioningArea.width,
		imageSize: width,
		value: position.x
	}), positioningArea.top + resolvePosition({
		containerSize: positioningArea.height,
		imageSize: height,
		value: position.y
	}), width, height);
};
var isColorTransparent = (color) => {
	return color === "transparent" || color.startsWith("rgba") && (color.endsWith(", 0)") || color.endsWith(",0"));
};
var getBackgroundFill = ({ backgroundColor, backgroundImage, backgroundPosition, backgroundSize, contextToDraw, boundingRect, offsetLeft, offsetTop }) => {
	if (backgroundImage && backgroundImage !== "none") {
		const gradientInfo = parseLinearGradient(backgroundImage);
		if (gradientInfo) return createCanvasGradient({
			ctx: contextToDraw,
			rect: getBackgroundImageRect({
				backgroundPosition,
				backgroundSize,
				positioningArea: boundingRect
			}),
			gradientInfo,
			offsetLeft,
			offsetTop
		});
	}
	if (backgroundColor && backgroundColor !== "transparent" && !isColorTransparent(backgroundColor)) return backgroundColor;
	return null;
};
var drawBackground = async ({ backgroundImage, context, rect, backgroundColor, backgroundClip, element, logLevel, internalState, computedStyle, offsetLeft: parentOffsetLeft, offsetTop: parentOffsetTop, scale }) => {
	let __stack = [];
	try {
		let contextToDraw = context;
		const originalCompositeOperation = context.globalCompositeOperation;
		let offsetLeft = 0;
		let offsetTop = 0;
		__using(__stack, { [Symbol.dispose]: () => {
			context.globalCompositeOperation = originalCompositeOperation;
			if (context !== contextToDraw) context.drawImage(contextToDraw.canvas, offsetLeft, offsetTop, contextToDraw.canvas.width / scale, contextToDraw.canvas.height / scale);
		} }, 0);
		const boundingRect = getBoxBasedOnBackgroundClip(rect, computedStyle, backgroundClip);
		if (backgroundClip.includes("text")) {
			offsetLeft = boundingRect.left;
			offsetTop = boundingRect.top;
			const originalBackgroundClip = element.style.backgroundClip;
			const originalWebkitBackgroundClip = element.style.webkitBackgroundClip;
			element.style.backgroundClip = "initial";
			element.style.webkitBackgroundClip = "initial";
			const onlyBackgroundClipText = await createLayer({
				element,
				cutout: new DOMRect(boundingRect.left + parentOffsetLeft, boundingRect.top + parentOffsetTop, boundingRect.width, boundingRect.height),
				logLevel,
				internalState,
				scale,
				onlyBackgroundClipText: true,
				waitForPageResponsiveness: null
			});
			onlyBackgroundClipText.setTransform(new DOMMatrix().scale(scale, scale));
			element.style.backgroundClip = originalBackgroundClip;
			element.style.webkitBackgroundClip = originalWebkitBackgroundClip;
			contextToDraw = onlyBackgroundClipText;
			contextToDraw.globalCompositeOperation = "source-in";
		}
		const backgroundFill = getBackgroundFill({
			backgroundImage,
			backgroundPosition: computedStyle.backgroundPosition,
			backgroundSize: computedStyle.backgroundSize,
			backgroundColor,
			contextToDraw,
			boundingRect,
			offsetLeft,
			offsetTop
		});
		if (!backgroundFill) return;
		const originalFillStyle = contextToDraw.fillStyle;
		contextToDraw.fillStyle = backgroundFill;
		contextToDraw.fillRect(boundingRect.left - offsetLeft, boundingRect.top - offsetTop, boundingRect.width, boundingRect.height);
		contextToDraw.fillStyle = originalFillStyle;
	} catch (_catch) {
		var _err = _catch, _hasErr = 1;
	} finally {
		__callDispose(__stack, _err, _hasErr);
	}
};
var parseBorderWidth = (value) => {
	return parseFloat(value) || 0;
};
var getBorderSideProperties = (computedStyle) => {
	return {
		top: {
			width: parseBorderWidth(computedStyle.borderTopWidth),
			color: computedStyle.borderTopColor || computedStyle.borderColor || "black",
			style: computedStyle.borderTopStyle || computedStyle.borderStyle || "solid"
		},
		right: {
			width: parseBorderWidth(computedStyle.borderRightWidth),
			color: computedStyle.borderRightColor || computedStyle.borderColor || "black",
			style: computedStyle.borderRightStyle || computedStyle.borderStyle || "solid"
		},
		bottom: {
			width: parseBorderWidth(computedStyle.borderBottomWidth),
			color: computedStyle.borderBottomColor || computedStyle.borderColor || "black",
			style: computedStyle.borderBottomStyle || computedStyle.borderStyle || "solid"
		},
		left: {
			width: parseBorderWidth(computedStyle.borderLeftWidth),
			color: computedStyle.borderLeftColor || computedStyle.borderColor || "black",
			style: computedStyle.borderLeftStyle || computedStyle.borderStyle || "solid"
		}
	};
};
var getLineDashPattern = (style, width) => {
	if (style === "dashed") return [width * 2, width];
	if (style === "dotted") return [width, width];
	return [];
};
var drawBorderSide = ({ ctx, side, x, y, width, height, borderRadius, borderProperties }) => {
	const { width: borderWidth, color, style } = borderProperties;
	if (borderWidth <= 0 || style === "none" || style === "hidden") return;
	ctx.beginPath();
	ctx.strokeStyle = color;
	ctx.lineWidth = borderWidth;
	ctx.setLineDash(getLineDashPattern(style, borderWidth));
	const halfWidth = borderWidth / 2;
	if (side === "top") {
		const startX = x + borderRadius.topLeft.horizontal;
		const startY = y + halfWidth;
		const endX = x + width - borderRadius.topRight.horizontal;
		const endY = y + halfWidth;
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
	} else if (side === "right") {
		const startX = x + width - halfWidth;
		const startY = y + borderRadius.topRight.vertical;
		const endX = x + width - halfWidth;
		const endY = y + height - borderRadius.bottomRight.vertical;
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
	} else if (side === "bottom") {
		const startX = x + borderRadius.bottomLeft.horizontal;
		const startY = y + height - halfWidth;
		const endX = x + width - borderRadius.bottomRight.horizontal;
		const endY = y + height - halfWidth;
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
	} else if (side === "left") {
		const startX = x + halfWidth;
		const startY = y + borderRadius.topLeft.vertical;
		const endX = x + halfWidth;
		const endY = y + height - borderRadius.bottomLeft.vertical;
		ctx.moveTo(startX, startY);
		ctx.lineTo(endX, endY);
	}
	ctx.stroke();
};
var drawCorner = ({ ctx, corner, x, y, width, height, borderRadius, topBorder, rightBorder, bottomBorder, leftBorder }) => {
	const radius = borderRadius[corner];
	if (radius.horizontal <= 0 && radius.vertical <= 0) return;
	let border1;
	let border2;
	let centerX;
	let centerY;
	let startAngle;
	let endAngle;
	if (corner === "topLeft") {
		border1 = leftBorder;
		border2 = topBorder;
		centerX = x + radius.horizontal;
		centerY = y + radius.vertical;
		startAngle = Math.PI;
		endAngle = Math.PI * 3 / 2;
	} else if (corner === "topRight") {
		border1 = topBorder;
		border2 = rightBorder;
		centerX = x + width - radius.horizontal;
		centerY = y + radius.vertical;
		startAngle = -Math.PI / 2;
		endAngle = 0;
	} else if (corner === "bottomRight") {
		border1 = rightBorder;
		border2 = bottomBorder;
		centerX = x + width - radius.horizontal;
		centerY = y + height - radius.vertical;
		startAngle = 0;
		endAngle = Math.PI / 2;
	} else {
		border1 = bottomBorder;
		border2 = leftBorder;
		centerX = x + radius.horizontal;
		centerY = y + height - radius.vertical;
		startAngle = Math.PI / 2;
		endAngle = Math.PI;
	}
	const avgWidth = (border1.width + border2.width) / 2;
	const useColor = border1.width >= border2.width ? border1.color : border2.color;
	const useStyle = border1.width >= border2.width ? border1.style : border2.style;
	if (avgWidth > 0 && useStyle !== "none" && useStyle !== "hidden") {
		ctx.beginPath();
		ctx.strokeStyle = useColor;
		ctx.lineWidth = avgWidth;
		ctx.setLineDash(getLineDashPattern(useStyle, avgWidth));
		const adjustedRadiusH = Math.max(0, radius.horizontal - avgWidth / 2);
		const adjustedRadiusV = Math.max(0, radius.vertical - avgWidth / 2);
		ctx.ellipse(centerX, centerY, adjustedRadiusH, adjustedRadiusV, 0, startAngle, endAngle);
		ctx.stroke();
	}
};
var drawUniformBorder = ({ ctx, x, y, width, height, borderRadius, borderWidth, borderColor, borderStyle }) => {
	ctx.beginPath();
	ctx.strokeStyle = borderColor;
	ctx.lineWidth = borderWidth;
	ctx.setLineDash(getLineDashPattern(borderStyle, borderWidth));
	const halfWidth = borderWidth / 2;
	const borderX = x + halfWidth;
	const borderY = y + halfWidth;
	const borderW = width - borderWidth;
	const borderH = height - borderWidth;
	const adjustedBorderRadius = {
		topLeft: {
			horizontal: Math.max(0, borderRadius.topLeft.horizontal - halfWidth),
			vertical: Math.max(0, borderRadius.topLeft.vertical - halfWidth)
		},
		topRight: {
			horizontal: Math.max(0, borderRadius.topRight.horizontal - halfWidth),
			vertical: Math.max(0, borderRadius.topRight.vertical - halfWidth)
		},
		bottomRight: {
			horizontal: Math.max(0, borderRadius.bottomRight.horizontal - halfWidth),
			vertical: Math.max(0, borderRadius.bottomRight.vertical - halfWidth)
		},
		bottomLeft: {
			horizontal: Math.max(0, borderRadius.bottomLeft.horizontal - halfWidth),
			vertical: Math.max(0, borderRadius.bottomLeft.vertical - halfWidth)
		}
	};
	ctx.moveTo(borderX + adjustedBorderRadius.topLeft.horizontal, borderY);
	ctx.lineTo(borderX + borderW - adjustedBorderRadius.topRight.horizontal, borderY);
	if (adjustedBorderRadius.topRight.horizontal > 0 || adjustedBorderRadius.topRight.vertical > 0) ctx.ellipse(borderX + borderW - adjustedBorderRadius.topRight.horizontal, borderY + adjustedBorderRadius.topRight.vertical, adjustedBorderRadius.topRight.horizontal, adjustedBorderRadius.topRight.vertical, 0, -Math.PI / 2, 0);
	ctx.lineTo(borderX + borderW, borderY + borderH - adjustedBorderRadius.bottomRight.vertical);
	if (adjustedBorderRadius.bottomRight.horizontal > 0 || adjustedBorderRadius.bottomRight.vertical > 0) ctx.ellipse(borderX + borderW - adjustedBorderRadius.bottomRight.horizontal, borderY + borderH - adjustedBorderRadius.bottomRight.vertical, adjustedBorderRadius.bottomRight.horizontal, adjustedBorderRadius.bottomRight.vertical, 0, 0, Math.PI / 2);
	ctx.lineTo(borderX + adjustedBorderRadius.bottomLeft.horizontal, borderY + borderH);
	if (adjustedBorderRadius.bottomLeft.horizontal > 0 || adjustedBorderRadius.bottomLeft.vertical > 0) ctx.ellipse(borderX + adjustedBorderRadius.bottomLeft.horizontal, borderY + borderH - adjustedBorderRadius.bottomLeft.vertical, adjustedBorderRadius.bottomLeft.horizontal, adjustedBorderRadius.bottomLeft.vertical, 0, Math.PI / 2, Math.PI);
	ctx.lineTo(borderX, borderY + adjustedBorderRadius.topLeft.vertical);
	if (adjustedBorderRadius.topLeft.horizontal > 0 || adjustedBorderRadius.topLeft.vertical > 0) ctx.ellipse(borderX + adjustedBorderRadius.topLeft.horizontal, borderY + adjustedBorderRadius.topLeft.vertical, adjustedBorderRadius.topLeft.horizontal, adjustedBorderRadius.topLeft.vertical, 0, Math.PI, Math.PI * 3 / 2);
	ctx.closePath();
	ctx.stroke();
};
var drawBorder = ({ ctx, rect, borderRadius, computedStyle }) => {
	const borders = getBorderSideProperties(computedStyle);
	if (!(borders.top.width > 0 || borders.right.width > 0 || borders.bottom.width > 0 || borders.left.width > 0)) return;
	const originalStrokeStyle = ctx.strokeStyle;
	const originalLineWidth = ctx.lineWidth;
	const originalLineDash = ctx.getLineDash();
	if (borders.top.width === borders.right.width && borders.top.width === borders.bottom.width && borders.top.width === borders.left.width && borders.top.color === borders.right.color && borders.top.color === borders.bottom.color && borders.top.color === borders.left.color && borders.top.style === borders.right.style && borders.top.style === borders.bottom.style && borders.top.style === borders.left.style && borders.top.width > 0) drawUniformBorder({
		ctx,
		x: rect.left,
		y: rect.top,
		width: rect.width,
		height: rect.height,
		borderRadius,
		borderWidth: borders.top.width,
		borderColor: borders.top.color,
		borderStyle: borders.top.style
	});
	else {
		drawCorner({
			ctx,
			corner: "topLeft",
			x: rect.left,
			y: rect.top,
			width: rect.width,
			height: rect.height,
			borderRadius,
			topBorder: borders.top,
			rightBorder: borders.right,
			bottomBorder: borders.bottom,
			leftBorder: borders.left
		});
		drawCorner({
			ctx,
			corner: "topRight",
			x: rect.left,
			y: rect.top,
			width: rect.width,
			height: rect.height,
			borderRadius,
			topBorder: borders.top,
			rightBorder: borders.right,
			bottomBorder: borders.bottom,
			leftBorder: borders.left
		});
		drawCorner({
			ctx,
			corner: "bottomRight",
			x: rect.left,
			y: rect.top,
			width: rect.width,
			height: rect.height,
			borderRadius,
			topBorder: borders.top,
			rightBorder: borders.right,
			bottomBorder: borders.bottom,
			leftBorder: borders.left
		});
		drawCorner({
			ctx,
			corner: "bottomLeft",
			x: rect.left,
			y: rect.top,
			width: rect.width,
			height: rect.height,
			borderRadius,
			topBorder: borders.top,
			rightBorder: borders.right,
			bottomBorder: borders.bottom,
			leftBorder: borders.left
		});
		drawBorderSide({
			ctx,
			side: "top",
			x: rect.left,
			y: rect.top,
			width: rect.width,
			height: rect.height,
			borderRadius,
			borderProperties: borders.top
		});
		drawBorderSide({
			ctx,
			side: "right",
			x: rect.left,
			y: rect.top,
			width: rect.width,
			height: rect.height,
			borderRadius,
			borderProperties: borders.right
		});
		drawBorderSide({
			ctx,
			side: "bottom",
			x: rect.left,
			y: rect.top,
			width: rect.width,
			height: rect.height,
			borderRadius,
			borderProperties: borders.bottom
		});
		drawBorderSide({
			ctx,
			side: "left",
			x: rect.left,
			y: rect.top,
			width: rect.width,
			height: rect.height,
			borderRadius,
			borderProperties: borders.left
		});
	}
	ctx.strokeStyle = originalStrokeStyle;
	ctx.lineWidth = originalLineWidth;
	ctx.setLineDash(originalLineDash);
};
var parseShadowValues = (shadowValue) => {
	if (!shadowValue || shadowValue === "none") return [];
	const shadows = [];
	const shadowStrings = shadowValue.split(/,(?![^(]*\))/);
	for (const shadowStr of shadowStrings) {
		const trimmed = shadowStr.trim();
		if (!trimmed || trimmed === "none") continue;
		const shadow = {
			offsetX: 0,
			offsetY: 0,
			blurRadius: 0,
			color: "rgba(0, 0, 0, 0.5)"
		};
		let remaining = trimmed.replace(/\binset\b/gi, "").trim();
		const colorMatch = remaining.match(/(rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-f]{3,8}|[a-z]+)/i);
		if (colorMatch) {
			shadow.color = colorMatch[0];
			remaining = remaining.replace(colorMatch[0], "").trim();
		}
		const values = (remaining.match(/[+-]?\d*\.?\d+(?:px|em|rem|%)?/gi) || []).map((n) => parseFloat(n) || 0);
		if (values.length >= 2) {
			shadow.offsetX = values[0];
			shadow.offsetY = values[1];
			if (values.length >= 3) shadow.blurRadius = Math.max(0, values[2]);
		}
		shadows.push(shadow);
	}
	return shadows;
};
var parseBoxShadow = (boxShadowValue) => {
	if (!boxShadowValue || boxShadowValue === "none") return [];
	const baseShadows = parseShadowValues(boxShadowValue);
	const shadowStrings = boxShadowValue.split(/,(?![^(]*\))/);
	return baseShadows.map((base, i) => ({
		...base,
		inset: /\binset\b/i.test(shadowStrings[i] || "")
	}));
};
var drawBorderRadius = ({ ctx, rect, borderRadius, computedStyle, logLevel }) => {
	const shadows = parseBoxShadow(computedStyle.boxShadow);
	if (shadows.length === 0) return;
	for (let i = shadows.length - 1; i >= 0; i--) {
		const shadow = shadows[i];
		const newLeft = rect.left + Math.min(shadow.offsetX, 0) - shadow.blurRadius;
		const newRight = rect.right + Math.max(shadow.offsetX, 0) + shadow.blurRadius;
		const newTop = rect.top + Math.min(shadow.offsetY, 0) - shadow.blurRadius;
		const newBottom = rect.bottom + Math.max(shadow.offsetY, 0) + shadow.blurRadius;
		const newRect = new DOMRect(newLeft, newTop, newRight - newLeft, newBottom - newTop);
		const leftOffset = rect.left - newLeft;
		const topOffset = rect.top - newTop;
		const newCanvas = new OffscreenCanvas(newRect.width, newRect.height);
		const newCtx = newCanvas.getContext("2d");
		if (!newCtx) throw new Error("Failed to get context");
		if (shadow.inset) {
			Internals.Log.warn({
				logLevel,
				tag: "@remotion/web-renderer"
			}, "Detected \"box-shadow\" with \"inset\". This is not yet supported in @remotion/web-renderer");
			continue;
		}
		newCtx.shadowBlur = shadow.blurRadius;
		newCtx.shadowColor = shadow.color;
		newCtx.shadowOffsetX = shadow.offsetX;
		newCtx.shadowOffsetY = shadow.offsetY;
		newCtx.fillStyle = "black";
		drawRoundedRectPath({
			ctx: newCtx,
			x: leftOffset,
			y: topOffset,
			width: rect.width,
			height: rect.height,
			borderRadius
		});
		newCtx.fill();
		newCtx.shadowColor = "transparent";
		newCtx.globalCompositeOperation = "destination-out";
		drawRoundedRectPath({
			ctx: newCtx,
			x: leftOffset,
			y: topOffset,
			width: rect.width,
			height: rect.height,
			borderRadius
		});
		newCtx.fill();
		ctx.drawImage(newCanvas, rect.left - leftOffset, rect.top - topOffset);
	}
};
var parseOutlineWidth = (value) => {
	return parseFloat(value) || 0;
};
var parseOutlineOffset = (value) => {
	return parseFloat(value) || 0;
};
var getLineDashPattern2 = (style, width) => {
	if (style === "dashed") return [width * 2, width];
	if (style === "dotted") return [width, width];
	return [];
};
var drawOutline = ({ ctx, rect, borderRadius, computedStyle }) => {
	const outlineWidth = parseOutlineWidth(computedStyle.outlineWidth);
	const { outlineStyle } = computedStyle;
	const outlineColor = computedStyle.outlineColor || "black";
	const outlineOffset = parseOutlineOffset(computedStyle.outlineOffset);
	if (outlineWidth <= 0 || outlineStyle === "none" || outlineStyle === "hidden") return;
	const originalStrokeStyle = ctx.strokeStyle;
	const originalLineWidth = ctx.lineWidth;
	const originalLineDash = ctx.getLineDash();
	ctx.strokeStyle = outlineColor;
	ctx.lineWidth = outlineWidth;
	ctx.setLineDash(getLineDashPattern2(outlineStyle, outlineWidth));
	const offset = outlineOffset + outlineWidth / 2;
	drawRoundedRectPath({
		ctx,
		x: rect.left - offset,
		y: rect.top - offset,
		width: rect.width + offset * 2,
		height: rect.height + offset * 2,
		borderRadius: {
			topLeft: {
				horizontal: borderRadius.topLeft.horizontal === 0 ? 0 : Math.max(0, borderRadius.topLeft.horizontal + offset),
				vertical: borderRadius.topLeft.vertical === 0 ? 0 : Math.max(0, borderRadius.topLeft.vertical + offset)
			},
			topRight: {
				horizontal: borderRadius.topRight.horizontal === 0 ? 0 : Math.max(0, borderRadius.topRight.horizontal + offset),
				vertical: borderRadius.topRight.vertical === 0 ? 0 : Math.max(0, borderRadius.topRight.vertical + offset)
			},
			bottomRight: {
				horizontal: borderRadius.bottomRight.horizontal === 0 ? 0 : Math.max(0, borderRadius.bottomRight.horizontal + offset),
				vertical: borderRadius.bottomRight.vertical === 0 ? 0 : Math.max(0, borderRadius.bottomRight.vertical + offset)
			},
			bottomLeft: {
				horizontal: borderRadius.bottomLeft.horizontal === 0 ? 0 : Math.max(0, borderRadius.bottomLeft.horizontal + offset),
				vertical: borderRadius.bottomLeft.vertical === 0 ? 0 : Math.max(0, borderRadius.bottomLeft.vertical + offset)
			}
		}
	});
	ctx.stroke();
	ctx.strokeStyle = originalStrokeStyle;
	ctx.lineWidth = originalLineWidth;
	ctx.setLineDash(originalLineDash);
};
var setFilter = ({ ctx, filter }) => {
	const previousFilter = ctx.filter;
	if (filter && filter !== "none") ctx.filter = filter;
	return () => {
		ctx.filter = previousFilter;
	};
};
var setOpacity = ({ ctx, opacity }) => {
	const previousAlpha = ctx.globalAlpha;
	ctx.globalAlpha = previousAlpha * opacity;
	return () => {
		ctx.globalAlpha = previousAlpha;
	};
};
var setOverflowHidden = ({ ctx, rect, borderRadius, overflowHidden, computedStyle, backgroundClip }) => {
	if (!overflowHidden) return () => {};
	return setBorderRadius({
		ctx,
		rect,
		borderRadius,
		forceClipEvenWhenZero: true,
		computedStyle,
		backgroundClip
	});
};
var setTransform = ({ ctx, transform, parentRect, scale }) => {
	const offsetMatrix = new DOMMatrix().scale(scale, scale).translate(-parentRect.x, -parentRect.y).multiply(transform).translate(parentRect.x, parentRect.y);
	ctx.setTransform(offsetMatrix);
	return () => {
		ctx.setTransform(new DOMMatrix());
	};
};
var drawElement = async ({ rect, computedStyle, context, draw, opacity, totalMatrix, parentRect, logLevel, element, internalState, scale }) => {
	const { backgroundImage, backgroundColor, backgroundClip } = computedStyle;
	const borderRadius = parseBorderRadius({
		borderRadius: computedStyle.borderRadius,
		width: rect.width,
		height: rect.height
	});
	const finishTransform = setTransform({
		ctx: context,
		transform: totalMatrix,
		parentRect,
		scale
	});
	const finishClipPath = setClipPath({
		ctx: context,
		clipPath: computedStyle.clipPath,
		rect
	});
	const finishOpacity = setOpacity({
		ctx: context,
		opacity
	});
	const finishFilter = setFilter({
		ctx: context,
		filter: computedStyle.filter
	});
	drawBorderRadius({
		ctx: context,
		computedStyle,
		rect,
		borderRadius,
		logLevel
	});
	const finishBorderRadius = setBorderRadius({
		ctx: context,
		rect,
		borderRadius,
		forceClipEvenWhenZero: false,
		computedStyle,
		backgroundClip
	});
	await drawBackground({
		backgroundImage,
		context,
		rect,
		backgroundColor,
		backgroundClip,
		element,
		logLevel,
		internalState,
		computedStyle,
		offsetLeft: parentRect.left,
		offsetTop: parentRect.top,
		scale
	});
	await draw({
		dimensions: rect,
		computedStyle,
		contextToDraw: context
	});
	finishBorderRadius();
	drawBorder({
		ctx: context,
		rect,
		borderRadius,
		computedStyle
	});
	drawOutline({
		ctx: context,
		rect,
		borderRadius,
		computedStyle
	});
	const finishOverflowHidden = setOverflowHidden({
		ctx: context,
		rect,
		borderRadius,
		overflowHidden: computedStyle.overflow === "hidden",
		computedStyle,
		backgroundClip
	});
	finishTransform();
	return { cleanupAfterChildren: () => {
		finishOverflowHidden();
		finishFilter();
		finishOpacity();
		finishClipPath();
	} };
};
function skipToNextNonDescendant(treeWalker) {
	if (treeWalker.nextSibling()) return true;
	while (treeWalker.parentNode()) if (treeWalker.nextSibling()) return true;
	return false;
}
var getTextOverflowForLineHeight = (computedStyle) => {
	const { lineHeight } = computedStyle;
	const fontSize = parseFloat(computedStyle.fontSize);
	if (!fontSize || isNaN(fontSize)) return {
		top: 0,
		bottom: 0
	};
	let lineHeightValue;
	if (lineHeight === "normal") return {
		top: 0,
		bottom: 0
	};
	if (lineHeight.endsWith("px")) lineHeightValue = parseFloat(lineHeight) / fontSize;
	else {
		lineHeightValue = parseFloat(lineHeight);
		if (lineHeight.endsWith("%")) lineHeightValue /= 100;
	}
	if (isNaN(lineHeightValue) || lineHeightValue >= 1) return {
		top: 0,
		bottom: 0
	};
	const overflow = (1 - lineHeightValue) * fontSize;
	return {
		top: overflow,
		bottom: overflow
	};
};
var getBiggestBoundingClientRect = (element) => {
	const treeWalker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
	let mostLeft = Infinity;
	let mostTop = Infinity;
	let mostRight = -Infinity;
	let mostBottom = -Infinity;
	while (true) {
		const computedStyle = getComputedStyle(treeWalker.currentNode);
		const outlineWidth = parseOutlineWidth(computedStyle.outlineWidth);
		const outlineOffset = parseOutlineOffset(computedStyle.outlineOffset);
		const rect = treeWalker.currentNode.getBoundingClientRect();
		const textOverflow = getTextOverflowForLineHeight(computedStyle);
		const shadows = parseBoxShadow(computedStyle.boxShadow);
		let shadowLeft = 0;
		let shadowRight = 0;
		let shadowTop = 0;
		let shadowBottom = 0;
		for (const shadow of shadows) if (!shadow.inset) {
			shadowLeft = Math.max(shadowLeft, Math.abs(Math.min(shadow.offsetX, 0)) + shadow.blurRadius);
			shadowRight = Math.max(shadowRight, Math.max(shadow.offsetX, 0) + shadow.blurRadius);
			shadowTop = Math.max(shadowTop, Math.abs(Math.min(shadow.offsetY, 0)) + shadow.blurRadius);
			shadowBottom = Math.max(shadowBottom, Math.max(shadow.offsetY, 0) + shadow.blurRadius);
		}
		mostLeft = Math.min(mostLeft, rect.left - outlineOffset - outlineWidth - shadowLeft);
		mostTop = Math.min(mostTop, rect.top - outlineOffset - outlineWidth - shadowTop - textOverflow.top);
		mostRight = Math.max(mostRight, rect.right + outlineOffset + outlineWidth + shadowRight);
		mostBottom = Math.max(mostBottom, rect.bottom + outlineOffset + outlineWidth + shadowBottom + textOverflow.bottom);
		if (computedStyle.overflow === "hidden") {
			if (!skipToNextNonDescendant(treeWalker)) break;
		}
		if (!treeWalker.nextNode()) break;
	}
	return new DOMRect(mostLeft, mostTop, mostRight - mostLeft, mostBottom - mostTop);
};
var MAX_SCALE_FACTOR = 100;
var isScaleTooBig = (matrix) => {
	const origin = new DOMPoint(0, 0).matrixTransform(matrix);
	const unitX = new DOMPoint(1, 0).matrixTransform(matrix);
	const unitY = new DOMPoint(0, 1).matrixTransform(matrix);
	const basisX = {
		x: unitX.x - origin.x,
		y: unitX.y - origin.y
	};
	const basisY = {
		x: unitY.x - origin.x,
		y: unitY.y - origin.y
	};
	const scaleX = 1 / Math.hypot(basisX.x, basisX.y);
	const scaleY = 1 / Math.hypot(basisY.x, basisY.y);
	if (Math.max(scaleX, scaleY) > MAX_SCALE_FACTOR) return true;
	return false;
};
function invertProjectivePoint(xp, yp, matrix) {
	const A = matrix.m11 - xp * matrix.m14;
	const B = matrix.m21 - xp * matrix.m24;
	const C = xp * matrix.m44 - matrix.m41;
	const D = matrix.m12 - yp * matrix.m14;
	const E = matrix.m22 - yp * matrix.m24;
	const F = yp * matrix.m44 - matrix.m42;
	const det = A * E - B * D;
	if (Math.abs(det) < 1e-10) return null;
	return {
		x: (C * E - B * F) / det,
		y: (A * F - C * D) / det
	};
}
function getPreTransformRect(targetRect, matrix) {
	if (isScaleTooBig(matrix)) return null;
	const corners = [
		{
			x: targetRect.x,
			y: targetRect.y
		},
		{
			x: targetRect.x + targetRect.width,
			y: targetRect.y
		},
		{
			x: targetRect.x + targetRect.width,
			y: targetRect.y + targetRect.height
		},
		{
			x: targetRect.x,
			y: targetRect.y + targetRect.height
		}
	];
	const invertedCorners = [];
	for (const corner of corners) {
		const inverted = invertProjectivePoint(corner.x, corner.y, matrix);
		if (inverted === null) return null;
		invertedCorners.push(inverted);
	}
	const xCoords = invertedCorners.map((p) => p.x);
	const yCoords = invertedCorners.map((p) => p.y);
	return new DOMRect(Math.min(...xCoords), Math.min(...yCoords), Math.max(...xCoords) - Math.min(...xCoords), Math.max(...yCoords) - Math.min(...yCoords));
}
var vsSource = `
    attribute vec2 aPosition;
    attribute vec2 aTexCoord;
    uniform mat4 uTransform;
    uniform vec2 uResolution;
    uniform vec2 uOffset;
    varying vec2 vTexCoord;

    void main() {
        vec4 pos = uTransform * vec4(aPosition, 0.0, 1.0);
        pos.xy = pos.xy + uOffset * pos.w;

        // Convert homogeneous coords to clip space
        gl_Position = vec4(
            (pos.x / uResolution.x) * 2.0 - pos.w,   // x
            pos.w - (pos.y / uResolution.y) * 2.0,   // y (flipped)
            0.0,
            pos.w
        );

        vTexCoord = aTexCoord;
    }
`;
var fsSource = `
		precision mediump float;
		uniform sampler2D uTexture;
		varying vec2 vTexCoord;

		void main() {
				gl_FragColor = texture2D(uTexture, vTexCoord);
		}
`;
function compileShader(shaderGl, source, type) {
	const shader = shaderGl.createShader(type);
	if (!shader) throw new Error("Could not create shader");
	shaderGl.shaderSource(shader, source);
	shaderGl.compileShader(shader);
	if (!shaderGl.getShaderParameter(shader, shaderGl.COMPILE_STATUS)) {
		const log = shaderGl.getShaderInfoLog(shader);
		shaderGl.deleteShader(shader);
		throw new Error("Shader compile error: " + log);
	}
	return shader;
}
var createHelperCanvas = ({ canvasWidth, canvasHeight, helperCanvasState }) => {
	if (helperCanvasState.current) {
		if (helperCanvasState.current.canvas.width !== canvasWidth || helperCanvasState.current.canvas.height !== canvasHeight) {
			helperCanvasState.current.canvas.width = canvasWidth;
			helperCanvasState.current.canvas.height = canvasHeight;
		}
		helperCanvasState.current.gl.viewport(0, 0, canvasWidth, canvasHeight);
		helperCanvasState.current.gl.clearColor(0, 0, 0, 0);
		helperCanvasState.current.gl.clear(helperCanvasState.current.gl.COLOR_BUFFER_BIT);
		return helperCanvasState.current;
	}
	const canvas = new OffscreenCanvas(canvasWidth, canvasHeight);
	const gl = canvas.getContext("webgl", { premultipliedAlpha: true }) ?? void 0;
	if (!gl) throw new Error("WebGL not supported");
	const vertexShader = compileShader(gl, vsSource, gl.VERTEX_SHADER);
	const fragmentShader = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
	const program = gl.createProgram();
	if (!program) throw new Error("Could not create program");
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Program link error: " + gl.getProgramInfoLog(program));
	const locations = {
		aPosition: gl.getAttribLocation(program, "aPosition"),
		aTexCoord: gl.getAttribLocation(program, "aTexCoord"),
		uTransform: gl.getUniformLocation(program, "uTransform"),
		uResolution: gl.getUniformLocation(program, "uResolution"),
		uOffset: gl.getUniformLocation(program, "uOffset"),
		uTexture: gl.getUniformLocation(program, "uTexture")
	};
	gl.deleteShader(vertexShader);
	gl.deleteShader(fragmentShader);
	const cleanup = () => {
		gl.deleteProgram(program);
		const loseContext = gl.getExtension("WEBGL_lose_context");
		if (loseContext) loseContext.loseContext();
	};
	helperCanvasState.current = {
		canvas,
		gl,
		program,
		locations,
		cleanup
	};
	return helperCanvasState.current;
};
var transformIn3d = ({ matrix, sourceCanvas, sourceRect, destRect, internalState, scale }) => {
	const { canvas, gl, program, locations } = createHelperCanvas({
		canvasWidth: destRect.width,
		canvasHeight: destRect.height,
		helperCanvasState: internalState.helperCanvasState
	});
	gl.useProgram(program);
	gl.viewport(0, 0, destRect.width, destRect.height);
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	const positions = new Float32Array([
		sourceRect.x,
		sourceRect.y,
		sourceRect.x + sourceRect.width,
		sourceRect.y,
		sourceRect.x,
		sourceRect.y + sourceRect.height,
		sourceRect.x,
		sourceRect.y + sourceRect.height,
		sourceRect.x + sourceRect.width,
		sourceRect.y,
		sourceRect.x + sourceRect.width,
		sourceRect.y + sourceRect.height
	]);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
	gl.enableVertexAttribArray(locations.aPosition);
	gl.vertexAttribPointer(locations.aPosition, 2, gl.FLOAT, false, 0, 0);
	const texCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
	const texCoords = new Float32Array([
		0,
		0,
		1,
		0,
		0,
		1,
		0,
		1,
		1,
		0,
		1,
		1
	]);
	gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
	gl.enableVertexAttribArray(locations.aTexCoord);
	gl.vertexAttribPointer(locations.aTexCoord, 2, gl.FLOAT, false, 0, 0);
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
	const transformMatrix = (scale !== 1 ? new DOMMatrix().scale(scale, scale).multiply(matrix) : matrix).toFloat32Array();
	gl.uniformMatrix4fv(locations.uTransform, false, transformMatrix);
	gl.uniform2f(locations.uResolution, destRect.width, destRect.height);
	gl.uniform2f(locations.uOffset, -destRect.x, -destRect.y);
	gl.uniform1i(locations.uTexture, 0);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	gl.disableVertexAttribArray(locations.aPosition);
	gl.disableVertexAttribArray(locations.aTexCoord);
	gl.deleteTexture(texture);
	gl.deleteBuffer(positionBuffer);
	gl.deleteBuffer(texCoordBuffer);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.disable(gl.BLEND);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
	return canvas;
};
var getPrecomposeRectFor3DTransform = ({ element, parentRect, matrix }) => {
	const unclampedBiggestBoundingClientRect = getBiggestBoundingClientRect(element);
	const biggestPossiblePretransformRect = getPreTransformRect(parentRect, matrix);
	if (!biggestPossiblePretransformRect) return null;
	return getNarrowerRect({
		firstRect: unclampedBiggestBoundingClientRect,
		secondRect: biggestPossiblePretransformRect
	});
};
var handle3dTransform = ({ matrix, sourceRect, tempCanvas, rectAfterTransforms, internalState, scale }) => {
	if (rectAfterTransforms.width <= 0 || rectAfterTransforms.height <= 0) return null;
	return transformIn3d({
		sourceRect,
		matrix,
		sourceCanvas: tempCanvas,
		destRect: rectAfterTransforms,
		internalState,
		scale
	});
};
var parseDropShadowExpansion = (filter) => {
	const expansion = {
		left: 0,
		right: 0,
		top: 0,
		bottom: 0
	};
	const dropShadowRegex = /drop-shadow\(((?:[^()]+|\([^()]*\))+)\)/gi;
	let match;
	while ((match = dropShadowRegex.exec(filter)) !== null) {
		const params = match[1].trim();
		const numbers = [];
		const numberRegex = /([+-]?\d*\.?\d+)(?:px)?/g;
		let numMatch;
		while ((numMatch = numberRegex.exec(params)) !== null) {
			const beforeMatch = params.slice(0, numMatch.index);
			if (!/(?:rgba?|hsla?)\([^)]*$/i.test(beforeMatch)) numbers.push(parseFloat(numMatch[1]));
		}
		if (numbers.length >= 2) {
			const offsetX = numbers[0];
			const offsetY = numbers[1];
			const blurSpread = (numbers.length >= 3 ? numbers[2] : 0) * 3;
			if (offsetX > 0) {
				expansion.right = Math.max(expansion.right, offsetX + blurSpread);
				expansion.left = Math.max(expansion.left, blurSpread);
			} else {
				expansion.left = Math.max(expansion.left, Math.abs(offsetX) + blurSpread);
				expansion.right = Math.max(expansion.right, blurSpread);
			}
			if (offsetY > 0) {
				expansion.bottom = Math.max(expansion.bottom, offsetY + blurSpread);
				expansion.top = Math.max(expansion.top, blurSpread);
			} else {
				expansion.top = Math.max(expansion.top, Math.abs(offsetY) + blurSpread);
				expansion.bottom = Math.max(expansion.bottom, blurSpread);
			}
		}
	}
	return expansion;
};
var getPrecomposeRectForFilter = ({ element, filter }) => {
	const elementRect = getBiggestBoundingClientRect(element);
	const expansion = parseDropShadowExpansion(filter);
	return new DOMRect(elementRect.left - expansion.left, elementRect.top - expansion.top, elementRect.width + expansion.left + expansion.right, elementRect.height + expansion.top + expansion.bottom);
};
var applyFilterToDrawOperation = ({ context, filter, drawFn }) => {
	const previousFilter = context.filter;
	context.filter = filter;
	drawFn();
	context.filter = previousFilter;
};
var getPrecomposeRectForMask = (element) => {
	return getBiggestBoundingClientRect(element);
};
var handleMask = async ({ maskImageInfo, maskRect, precomposeRect, tempContext, scale, internalState }) => {
	const rectToFill = new DOMRect((maskRect.left - precomposeRect.left) * scale, (maskRect.top - precomposeRect.top) * scale, maskRect.width * scale, maskRect.height * scale);
	if (maskImageInfo.type === "linear-gradient") {
		const gradient = createCanvasGradient({
			ctx: tempContext,
			rect: rectToFill,
			gradientInfo: maskImageInfo.gradientInfo,
			offsetLeft: 0,
			offsetTop: 0
		});
		tempContext.globalCompositeOperation = "destination-in";
		tempContext.fillStyle = gradient;
		tempContext.fillRect(rectToFill.left, rectToFill.top, rectToFill.width, rectToFill.height);
		return;
	}
	const image = await getMaskImage({
		src: maskImageInfo.src,
		state: internalState.maskImageLoaderState
	});
	tempContext.globalCompositeOperation = "destination-in";
	tempContext.drawImage(image, rectToFill.left, rectToFill.top, rectToFill.width, rectToFill.height);
};
var scaleRect = ({ rect, scale }) => {
	return new DOMRect(rect.x * scale, rect.y * scale, rect.width * scale, rect.height * scale);
};
function transformDOMRect({ rect, matrix }) {
	const topLeft = new DOMPointReadOnly(rect.left, rect.top);
	const topRight = new DOMPointReadOnly(rect.right, rect.top);
	const bottomLeft = new DOMPointReadOnly(rect.left, rect.bottom);
	const bottomRight = new DOMPointReadOnly(rect.right, rect.bottom);
	const transformedTopLeft = topLeft.matrixTransform(matrix);
	const transformedTopRight = topRight.matrixTransform(matrix);
	const transformedBottomLeft = bottomLeft.matrixTransform(matrix);
	const transformedBottomRight = bottomRight.matrixTransform(matrix);
	const minX = Math.min(transformedTopLeft.x / transformedTopLeft.w, transformedTopRight.x / transformedTopRight.w, transformedBottomLeft.x / transformedBottomLeft.w, transformedBottomRight.x / transformedBottomRight.w);
	const maxX = Math.max(transformedTopLeft.x / transformedTopLeft.w, transformedTopRight.x / transformedTopRight.w, transformedBottomLeft.x / transformedBottomLeft.w, transformedBottomRight.x / transformedBottomRight.w);
	const minY = Math.min(transformedTopLeft.y / transformedTopLeft.w, transformedTopRight.y / transformedTopRight.w, transformedBottomLeft.y / transformedBottomLeft.w, transformedBottomRight.y / transformedBottomRight.w);
	const maxY = Math.max(transformedTopLeft.y / transformedTopLeft.w, transformedTopRight.y / transformedTopRight.w, transformedBottomLeft.y / transformedBottomLeft.w, transformedBottomRight.y / transformedBottomRight.w);
	return new DOMRect(minX, minY, maxX - minX, maxY - minY);
}
var processNode = async ({ element, context, draw, logLevel, parentRect, internalState, rootElement, scale, waitForPageResponsiveness, transformStyleCache }) => {
	let __stack = [];
	try {
		const { opacity, computedStyle, totalMatrix, dimensions, precompositing } = __using(__stack, calculateTransforms({
			element,
			rootElement,
			transformStyleCache
		}), 0);
		if (opacity === 0) return { type: "skip-children" };
		if (computedStyle.backfaceVisibility === "hidden" && totalMatrix.m33 < 0) return { type: "skip-children" };
		if (dimensions.width <= 0 || dimensions.height <= 0) return {
			type: "continue",
			cleanupAfterChildren: null
		};
		const rect = new DOMRect(dimensions.left - parentRect.x, dimensions.top - parentRect.y, dimensions.width, dimensions.height);
		if (precompositing.needsPrecompositing) {
			const start = Date.now();
			let precomposeRect = null;
			if (precompositing.needsMaskImage) precomposeRect = roundToExpandRect(getPrecomposeRectForMask(element));
			if (precompositing.needs3DTransformViaWebGL) {
				const tentativePrecomposeRect = getPrecomposeRectFor3DTransform({
					element,
					parentRect,
					matrix: totalMatrix
				});
				if (!tentativePrecomposeRect) return {
					type: "continue",
					cleanupAfterChildren: null
				};
				precomposeRect = roundToExpandRect(getWiderRectAndExpand({
					firstRect: precomposeRect,
					secondRect: tentativePrecomposeRect
				}));
			}
			if (precompositing.needsFilterPrecompositing) {
				const tentativePrecomposeRect = getPrecomposeRectForFilter({
					element,
					filter: precompositing.needsFilterPrecompositing
				});
				precomposeRect = roundToExpandRect(getWiderRectAndExpand({
					firstRect: precomposeRect,
					secondRect: tentativePrecomposeRect
				}));
			}
			if (!precomposeRect) throw new Error("Precompose rect not found");
			if (precomposeRect.width <= 0 || precomposeRect.height <= 0) return {
				type: "continue",
				cleanupAfterChildren: null
			};
			if (!doRectsIntersect(precomposeRect, parentRect)) return {
				type: "continue",
				cleanupAfterChildren: null
			};
			const tempContext = await createLayer({
				cutout: precomposeRect,
				element,
				logLevel,
				internalState,
				scale,
				onlyBackgroundClipText: false,
				waitForPageResponsiveness
			});
			if (waitForPageResponsiveness !== null) await waitForPageResponsiveness();
			let drawable = tempContext.canvas;
			const rectAfterTransforms = roundToExpandRect(scaleRect({
				scale,
				rect: transformDOMRect({
					rect: precomposeRect,
					matrix: totalMatrix
				})
			}));
			if (precompositing.needsMaskImage) {
				await handleMask({
					maskImageInfo: precompositing.needsMaskImage,
					maskRect: dimensions,
					precomposeRect,
					tempContext,
					scale,
					internalState
				});
				if (waitForPageResponsiveness !== null) await waitForPageResponsiveness();
			}
			if (precompositing.needs3DTransformViaWebGL) {
				const t = handle3dTransform({
					matrix: totalMatrix,
					sourceRect: precomposeRect,
					tempCanvas: drawable,
					rectAfterTransforms,
					internalState,
					scale
				});
				if (t) drawable = t;
				if (waitForPageResponsiveness !== null) await waitForPageResponsiveness();
			}
			const previousTransform = context.getTransform();
			const is3DPrecomposition = precompositing.needs3DTransformViaWebGL;
			if (is3DPrecomposition) context.setTransform(new DOMMatrix());
			else setTransform({
				ctx: context,
				transform: totalMatrix,
				parentRect,
				scale
			});
			const destinationRect = is3DPrecomposition ? rectAfterTransforms : precomposeRect;
			const parentOffsetScale = is3DPrecomposition ? scale : 1;
			const drawPrecomposedCanvas = () => {
				context.drawImage(drawable, 0, 0, drawable.width, drawable.height, destinationRect.left - parentRect.x * parentOffsetScale, destinationRect.top - parentRect.y * parentOffsetScale, destinationRect.width, destinationRect.height);
			};
			if (precompositing.needsFilterPrecompositing) applyFilterToDrawOperation({
				context,
				filter: precompositing.needsFilterPrecompositing,
				drawFn: drawPrecomposedCanvas
			});
			else drawPrecomposedCanvas();
			context.setTransform(previousTransform);
			if (waitForPageResponsiveness !== null) await waitForPageResponsiveness();
			Internals.Log.trace({
				logLevel,
				tag: "@remotion/web-renderer"
			}, `Transforming element in 3D - canvas size: ${precomposeRect.width}x${precomposeRect.height} - compose: ${Date.now() - start}ms - helper canvas: ${drawable.width}x${drawable.height}`);
			internalState.addPrecompose({
				canvasWidth: precomposeRect.width,
				canvasHeight: precomposeRect.height
			});
			return { type: "skip-children" };
		}
		const { cleanupAfterChildren } = await drawElement({
			rect,
			computedStyle,
			context,
			draw,
			opacity,
			totalMatrix,
			parentRect,
			logLevel,
			element,
			internalState,
			scale
		});
		return {
			type: "continue",
			cleanupAfterChildren
		};
	} catch (_catch) {
		var _err = _catch, _hasErr = 1;
	} finally {
		__callDispose(__stack, _err, _hasErr);
	}
};
var applyTextTransform = (text, transform) => {
	if (transform === "uppercase") return text.toUpperCase();
	if (transform === "lowercase") return text.toLowerCase();
	if (transform === "capitalize") return text.replace(/\b(?<!['\u2019])\w/g, (char) => char.toUpperCase());
	return text;
};
var wordSegmenter = new Intl.Segmenter("en", { granularity: "word" });
var findWords = (span) => {
	const originalText = span.textContent;
	const segments = Array.from(wordSegmenter.segment(originalText));
	const tokens = [];
	for (const { index, segment } of segments) {
		const wordsBeforeText = originalText.slice(0, index);
		const wordsAfterText = originalText.slice(index + segment.length);
		const beforeNode = document.createTextNode(wordsBeforeText);
		const afterNode = document.createTextNode(wordsAfterText);
		const interstitialNode = document.createElement("span");
		interstitialNode.textContent = segment;
		span.textContent = "";
		span.appendChild(beforeNode);
		span.appendChild(interstitialNode);
		span.appendChild(afterNode);
		const rect = interstitialNode.getBoundingClientRect();
		span.textContent = originalText;
		tokens.push({
			text: segment,
			rect
		});
	}
	return tokens;
};
var fontStretchOptions = [
	{
		keyword: "ultra-condensed",
		percentage: 50
	},
	{
		keyword: "extra-condensed",
		percentage: 62.5
	},
	{
		keyword: "condensed",
		percentage: 75
	},
	{
		keyword: "semi-condensed",
		percentage: 87.5
	},
	{
		keyword: "normal",
		percentage: 100
	},
	{
		keyword: "semi-expanded",
		percentage: 112.5
	},
	{
		keyword: "expanded",
		percentage: 125
	},
	{
		keyword: "extra-expanded",
		percentage: 150
	},
	{
		keyword: "ultra-expanded",
		percentage: 200
	}
];
var getCanvasFontStretch = (fontStretch) => {
	const keyword = fontStretchOptions.find((option) => option.keyword === fontStretch);
	if (keyword) return keyword.keyword;
	const percentage = Number.parseFloat(fontStretch);
	if (!Number.isFinite(percentage)) return "normal";
	let closest = fontStretchOptions[0];
	for (const option of fontStretchOptions.slice(1)) {
		const distance = Math.abs(option.percentage - percentage);
		const closestDistance = Math.abs(closest.percentage - percentage);
		if (distance < closestDistance || distance === closestDistance && percentage >= 100) closest = option;
	}
	return closest.keyword;
};
var parsePaintOrder = (paintOrder) => {
	const paintOrderValue = paintOrder || "normal";
	const paintOrderParts = paintOrderValue === "normal" ? ["fill", "stroke"] : paintOrderValue.split(/\s+/).filter(Boolean);
	const strokeIndex = paintOrderParts.indexOf("stroke");
	const fillIndex = paintOrderParts.indexOf("fill");
	return { strokeFirst: strokeIndex !== -1 && (fillIndex === -1 || strokeIndex < fillIndex) };
};
var parseTextShadow = (textShadowValue) => {
	return parseShadowValues(textShadowValue);
};
var textDecorationLines = [
	"underline",
	"overline",
	"line-through"
];
var currentColorValues = /* @__PURE__ */ new Set(["currentcolor", "currentColor"]);
var getDefaultTextDecorationThickness = (fontSizePx) => {
	return Math.max(1, Number.isFinite(fontSizePx) ? fontSizePx / 16 : 1);
};
var getTextDecorationStyle = (style) => {
	if (style === "double" || style === "dotted" || style === "dashed" || style === "wavy") return style;
	return "solid";
};
var parseTextDecoration = ({ onlyBackgroundClipText, style }) => {
	const textDecorationStyle = getTextDecorationStyle(style.getPropertyValue("text-decoration-style").trim());
	const lineParts = style.getPropertyValue("text-decoration-line").split(/\s+/);
	const lines = textDecorationLines.filter((line) => lineParts.includes(line));
	if (lines.length === 0) return null;
	const textDecorationThickness = style.getPropertyValue("text-decoration-thickness");
	const thicknessValue = parseFloat(textDecorationThickness);
	const thickness = Number.isFinite(thicknessValue) ? thicknessValue : getDefaultTextDecorationThickness(parseFloat(style.fontSize));
	if (thickness <= 0) return null;
	const textDecorationColor = style.getPropertyValue("text-decoration-color");
	return {
		lines,
		color: onlyBackgroundClipText || !textDecorationColor || currentColorValues.has(textDecorationColor) ? onlyBackgroundClipText ? "black" : style.color : textDecorationColor,
		thickness,
		style: textDecorationStyle
	};
};
var getTextDecorations = ({ computedStyle, onlyBackgroundClipText, span }) => {
	const decorations = [];
	const spanDecoration = parseTextDecoration({
		onlyBackgroundClipText,
		style: computedStyle
	});
	if (spanDecoration) decorations.push(spanDecoration);
	let parent = span.parentElement;
	while (parent) {
		const parentDecoration = parseTextDecoration({
			onlyBackgroundClipText,
			style: getComputedStyle(parent)
		});
		if (parentDecoration) decorations.push(parentDecoration);
		parent = parent.parentElement;
	}
	return decorations;
};
var getTextDecorationY = ({ line, measurements, y, thickness, fontSizePx }) => {
	const fontAscent = measurements.fontBoundingBoxAscent || measurements.actualBoundingBoxAscent || fontSizePx;
	const fontDescent = measurements.fontBoundingBoxDescent || measurements.actualBoundingBoxDescent || fontSizePx * .2;
	const actualAscent = measurements.actualBoundingBoxAscent || fontAscent;
	if (line === "underline") return y + Math.max(thickness, fontDescent * .4);
	if (line === "overline") return y - fontAscent + thickness / 2;
	return y - actualAscent * .35;
};
var getTextDecorationLineDashPattern = (style, thickness) => {
	if (style === "dashed") return [thickness * 2, thickness];
	if (style === "dotted") return [thickness, thickness];
	return [];
};
var drawWavyTextDecorationLine = ({ contextToDraw, endX, lineY, startX, thickness }) => {
	const step = Math.max(2, thickness);
	const amplitude = step;
	const halfWavelength = step * 2;
	const wavelength = halfWavelength * 2;
	const phaseStartX = Math.floor(startX / wavelength) * wavelength;
	contextToDraw.save();
	contextToDraw.beginPath();
	contextToDraw.rect(startX, lineY - amplitude - thickness, endX - startX, (amplitude + thickness) * 2);
	contextToDraw.clip();
	contextToDraw.beginPath();
	contextToDraw.moveTo(phaseStartX, lineY);
	let x = phaseStartX;
	let direction = 1;
	while (x < endX) {
		contextToDraw.quadraticCurveTo(x + halfWavelength / 2, lineY + direction * amplitude * 2, x + halfWavelength, lineY);
		x += halfWavelength;
		direction = -direction;
	}
	contextToDraw.stroke();
	contextToDraw.restore();
};
var strokeTextDecorationLine = ({ contextToDraw, endX, lineY, startX }) => {
	contextToDraw.beginPath();
	contextToDraw.moveTo(startX, lineY);
	contextToDraw.lineTo(endX, lineY);
	contextToDraw.stroke();
};
var drawTextDecoration = ({ contextToDraw, fontSizePx, measurements, parentRect, textDecorations, token, y }) => {
	if (textDecorations.length === 0) return;
	const startX = token.rect.left - parentRect.x;
	const endX = token.rect.right - parentRect.x;
	if (endX <= startX) return;
	contextToDraw.save();
	contextToDraw.lineCap = "butt";
	for (const textDecoration of textDecorations) {
		contextToDraw.strokeStyle = textDecoration.color;
		contextToDraw.lineWidth = textDecoration.thickness;
		for (const line of textDecoration.lines) {
			const lineY = getTextDecorationY({
				line,
				measurements,
				y,
				thickness: textDecoration.thickness,
				fontSizePx
			});
			if (textDecoration.style === "wavy") {
				contextToDraw.setLineDash([]);
				drawWavyTextDecorationLine({
					contextToDraw,
					endX,
					lineY,
					startX,
					thickness: textDecoration.thickness
				});
				continue;
			}
			if (textDecoration.style === "double") {
				contextToDraw.setLineDash([]);
				strokeTextDecorationLine({
					contextToDraw,
					endX,
					lineY: lineY - textDecoration.thickness,
					startX
				});
				strokeTextDecorationLine({
					contextToDraw,
					endX,
					lineY: lineY + textDecoration.thickness,
					startX
				});
				contextToDraw.setLineDash([]);
				continue;
			}
			contextToDraw.setLineDash(getTextDecorationLineDashPattern(textDecoration.style, textDecoration.thickness));
			strokeTextDecorationLine({
				contextToDraw,
				endX,
				lineY,
				startX
			});
			contextToDraw.setLineDash([]);
		}
	}
	contextToDraw.restore();
};
var drawText = ({ span, logLevel, onlyBackgroundClipText, parentRect }) => {
	const drawFn = ({ computedStyle, contextToDraw }) => {
		const { fontFamily, fontSize, fontWeight, fontStyle, fontVariantCaps, fontKerning, fontStretch, direction, writingMode, letterSpacing, wordSpacing, textTransform, textRendering, webkitTextFillColor, webkitTextStrokeWidth, webkitTextStrokeColor, textShadow: textShadowValue, paintOrder, filter } = computedStyle;
		if (writingMode !== "horizontal-tb") {
			Internals.Log.warn({
				logLevel,
				tag: "@remotion/web-renderer"
			}, "Detected \"writing-mode\" CSS property. Vertical text is not yet supported in @remotion/web-renderer");
			return;
		}
		contextToDraw.save();
		const finishFilter = setFilter({
			ctx: contextToDraw,
			filter
		});
		const fontSizePx = parseFloat(fontSize);
		contextToDraw.font = `${fontStyle} ${fontWeight} ${fontSizePx}px ${fontFamily}`;
		contextToDraw.fontVariantCaps = fontVariantCaps;
		contextToDraw.fontKerning = fontKerning;
		contextToDraw.fontStretch = getCanvasFontStretch(fontStretch);
		contextToDraw.textRendering = textRendering;
		contextToDraw.fillStyle = onlyBackgroundClipText ? "black" : webkitTextFillColor;
		contextToDraw.letterSpacing = letterSpacing;
		contextToDraw.wordSpacing = wordSpacing;
		const textDecorations = getTextDecorations({
			computedStyle,
			onlyBackgroundClipText,
			span
		});
		const strokeWidth = parseFloat(webkitTextStrokeWidth);
		const hasStroke = strokeWidth > 0;
		if (hasStroke) {
			contextToDraw.strokeStyle = webkitTextStrokeColor;
			contextToDraw.lineWidth = strokeWidth;
		}
		const isRTL = direction === "rtl";
		contextToDraw.textAlign = isRTL ? "right" : "left";
		contextToDraw.textBaseline = "alphabetic";
		const originalText = span.textContent;
		span.textContent = applyTextTransform(originalText, textTransform);
		const tokens = findWords(span);
		const textShadows = parseTextShadow(textShadowValue);
		const ctm = contextToDraw.getTransform();
		const blurScale = Math.hypot(ctm.a, ctm.b);
		const { strokeFirst } = parsePaintOrder(paintOrder);
		const measurements = contextToDraw.measureText(originalText);
		const { fontBoundingBoxDescent, fontBoundingBoxAscent } = measurements;
		const fontHeight = fontBoundingBoxAscent + fontBoundingBoxDescent;
		for (const token of tokens) {
			const halfLeading = (token.rect.height - fontHeight) / 2;
			const x = (isRTL ? token.rect.right : token.rect.left) - parentRect.x;
			const y = token.rect.top + fontBoundingBoxAscent + halfLeading - parentRect.y;
			for (let i = textShadows.length - 1; i >= 0; i--) {
				const shadow = textShadows[i];
				contextToDraw.shadowColor = shadow.color;
				contextToDraw.shadowBlur = shadow.blurRadius * blurScale;
				contextToDraw.shadowOffsetX = shadow.offsetX * ctm.a + shadow.offsetY * ctm.c;
				contextToDraw.shadowOffsetY = shadow.offsetX * ctm.b + shadow.offsetY * ctm.d;
				contextToDraw.fillText(token.text, x, y);
			}
			contextToDraw.shadowColor = "transparent";
			contextToDraw.shadowBlur = 0;
			contextToDraw.shadowOffsetX = 0;
			contextToDraw.shadowOffsetY = 0;
			const drawFill = () => contextToDraw.fillText(token.text, x, y);
			const drawStroke = () => {
				if (hasStroke) contextToDraw.strokeText(token.text, x, y);
			};
			if (strokeFirst) {
				drawStroke();
				drawFill();
			} else {
				drawFill();
				drawStroke();
			}
			drawTextDecoration({
				contextToDraw,
				fontSizePx,
				measurements,
				parentRect,
				textDecorations,
				token,
				y
			});
		}
		span.textContent = originalText;
		finishFilter();
		contextToDraw.restore();
	};
	return drawFn;
};
var handleTextNode = async ({ node, context, logLevel, parentRect, internalState, rootElement, onlyBackgroundClipText, scale, waitForPageResponsiveness, transformStyleCache }) => {
	const span = document.createElement("span");
	const parent = node.parentNode;
	if (!parent) throw new Error("Text node has no parent");
	parent.insertBefore(span, node);
	span.appendChild(node);
	const value = await processNode({
		context,
		element: span,
		draw: drawText({
			span,
			logLevel,
			onlyBackgroundClipText,
			parentRect
		}),
		logLevel,
		parentRect,
		internalState,
		rootElement,
		scale,
		waitForPageResponsiveness,
		transformStyleCache
	});
	parent.insertBefore(node, span);
	parent.removeChild(span);
	return value;
};
var walkOverNode = ({ node, context, logLevel, parentRect, internalState, rootElement, onlyBackgroundClipText, scale, waitForPageResponsiveness, transformStyleCache }) => {
	if (node instanceof HTMLElement || node instanceof SVGElement) return processNode({
		element: node,
		context,
		draw: drawDomElement(node),
		logLevel,
		parentRect,
		internalState,
		rootElement,
		scale,
		waitForPageResponsiveness,
		transformStyleCache
	});
	if (node instanceof Text) return handleTextNode({
		node,
		context,
		logLevel,
		parentRect,
		internalState,
		rootElement,
		onlyBackgroundClipText,
		scale,
		waitForPageResponsiveness,
		transformStyleCache
	});
	throw new Error("Unknown node type");
};
var getFilterFunction = (node) => {
	if (!(node instanceof Element)) return NodeFilter.FILTER_ACCEPT;
	if (node.parentElement instanceof SVGSVGElement) return NodeFilter.FILTER_REJECT;
	if (getComputedStyle(node).display === "none") return NodeFilter.FILTER_REJECT;
	return NodeFilter.FILTER_ACCEPT;
};
var compose = async ({ element, context, logLevel, parentRect, internalState, onlyBackgroundClipText, scale, waitForPageResponsiveness }) => {
	let __stack = [];
	try {
		const treeWalker = document.createTreeWalker(element, onlyBackgroundClipText ? NodeFilter.SHOW_TEXT : NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, getFilterFunction);
		const transformStyleCache = /* @__PURE__ */ new WeakMap();
		if (onlyBackgroundClipText) {
			treeWalker.nextNode();
			if (!treeWalker.currentNode) return;
		}
		const { checkCleanUpAtBeginningOfIteration, addCleanup } = __using(__stack, createTreeWalkerCleanupAfterChildren(treeWalker), 0);
		while (true) {
			checkCleanUpAtBeginningOfIteration();
			const val = await walkOverNode({
				node: treeWalker.currentNode,
				context,
				logLevel,
				parentRect,
				internalState,
				rootElement: element,
				onlyBackgroundClipText,
				scale,
				waitForPageResponsiveness,
				transformStyleCache
			});
			if (val.type === "skip-children") {
				if (!skipToNextNonDescendant(treeWalker)) break;
			} else {
				if (val.cleanupAfterChildren) addCleanup(treeWalker.currentNode, val.cleanupAfterChildren);
				if (!treeWalker.nextNode()) break;
			}
			if (waitForPageResponsiveness !== null) await waitForPageResponsiveness();
		}
	} catch (_catch) {
		var _err = _catch, _hasErr = 1;
	} finally {
		__callDispose(__stack, _err, _hasErr);
	}
};
var createLayer = async ({ element, scale, logLevel, internalState, onlyBackgroundClipText, cutout, htmlInCanvasContext, onHtmlInCanvasLayerOutcome, waitForPageResponsiveness }) => {
	const scaledWidth = Math.ceil(cutout.width * scale);
	const scaledHeight = Math.ceil(cutout.height * scale);
	if (!onlyBackgroundClipText && element instanceof HTMLElement && htmlInCanvasContext && onHtmlInCanvasLayerOutcome) {
		if (containsUrlMaskImage(element)) onHtmlInCanvasLayerOutcome({
			native: false,
			reason: "URL masks are loaded by the built-in DOM composer to guarantee deterministic rendering.",
			shouldWarn: false
		});
		else if (containsLayoutSubtreeCanvas(element)) onHtmlInCanvasLayerOutcome({
			native: false,
			reason: "The composition contains an <HtmlInCanvas> element. Nested HTML-in-canvas capture is unsupported, so the built-in DOM composer is used.",
			shouldWarn: false
		});
		else try {
			const offCtx = await drawWithHtmlInCanvas({
				htmlInCanvasContext,
				element,
				scaledWidth,
				scaledHeight
			});
			onHtmlInCanvasLayerOutcome({ native: true });
			return offCtx;
		} catch (err) {
			onHtmlInCanvasLayerOutcome({
				native: false,
				reason: `drawElementImage failed (${err instanceof Error ? err.message : JSON.stringify(err)}); falling back to the built-in DOM composer.`,
				shouldWarn: true
			});
			Internals.Log.verbose({
				logLevel,
				tag: "@remotion/web-renderer"
			}, "HTML-in-canvas capture failed, falling back to software compose", err);
		}
	}
	const context = new OffscreenCanvas(scaledWidth, scaledHeight).getContext("2d");
	if (!context) throw new Error("Could not get context");
	await compose({
		element,
		context,
		logLevel,
		parentRect: cutout,
		internalState,
		onlyBackgroundClipText,
		scale,
		waitForPageResponsiveness
	});
	return context;
};
var DEFAULT_THROTTLE_MS = 250;
var createThrottledProgressCallback = (callback, throttleMs = DEFAULT_THROTTLE_MS) => {
	if (!callback) return null;
	let lastCallTime = 0;
	let pendingUpdate = null;
	let timeoutId = null;
	const throttled = (progress) => {
		const now = Date.now();
		const timeSinceLastCall = now - lastCallTime;
		pendingUpdate = progress;
		if (timeSinceLastCall >= throttleMs) {
			lastCallTime = now;
			callback(progress);
			pendingUpdate = null;
			if (timeoutId !== null) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		} else if (timeoutId === null) {
			const remainingTime = throttleMs - timeSinceLastCall;
			timeoutId = setTimeout(() => {
				if (pendingUpdate !== null) {
					lastCallTime = Date.now();
					callback(pendingUpdate);
					pendingUpdate = null;
				}
				timeoutId = null;
			}, remainingTime);
		}
	};
	const cleanup = () => {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
		pendingUpdate = null;
	};
	return {
		throttled,
		[Symbol.dispose]: cleanup
	};
};
var validateVideoFrame = ({ originalFrame, returnedFrame, expectedWidth, expectedHeight, expectedTimestamp }) => {
	if (!(returnedFrame instanceof VideoFrame)) {
		originalFrame.close();
		throw new Error("onFrame callback must return a VideoFrame or void");
	}
	if (returnedFrame === originalFrame) return returnedFrame;
	if (returnedFrame.displayWidth !== expectedWidth || returnedFrame.displayHeight !== expectedHeight) {
		originalFrame.close();
		returnedFrame.close();
		throw new Error(`VideoFrame dimensions mismatch: expected ${expectedWidth}x${expectedHeight}, got ${returnedFrame.displayWidth}x${returnedFrame.displayHeight}`);
	}
	if (returnedFrame.timestamp !== expectedTimestamp) {
		originalFrame.close();
		returnedFrame.close();
		throw new Error(`VideoFrame timestamp mismatch: expected ${expectedTimestamp}, got ${returnedFrame.timestamp}`);
	}
	originalFrame.close();
	return returnedFrame;
};
var withResolvers = function() {
	let resolve;
	let reject;
	return {
		promise: new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		}),
		resolve,
		reject
	};
};
var waitForReady = ({ timeoutInMilliseconds, scope, signal, apiName, internalState, keepalive }) => {
	const start = performance.now();
	const { promise, resolve, reject } = withResolvers();
	let cancelled = false;
	const check = () => {
		if (cancelled) return;
		if (signal?.aborted) {
			cancelled = true;
			internalState?.addWaitForReadyTime(performance.now() - start);
			reject(/* @__PURE__ */ new Error(`${apiName}() was cancelled`));
			return;
		}
		if (scope.remotion_renderReady === true) {
			internalState?.addWaitForReadyTime(performance.now() - start);
			resolve();
			return;
		}
		if (scope.remotion_cancelledError !== void 0) {
			cancelled = true;
			internalState?.addWaitForReadyTime(performance.now() - start);
			const stack = scope.remotion_cancelledError;
			const message = stack.split(`
`)[0].replace(/^Error: /, "");
			const error = new Error(message);
			error.stack = stack;
			reject(error);
			return;
		}
		if (performance.now() - start > timeoutInMilliseconds + 3e3) {
			cancelled = true;
			internalState?.addWaitForReadyTime(performance.now() - start);
			reject(new Error(Object.values(scope.remotion_delayRenderTimeouts).map((d) => d.label).join(", ")));
			return;
		}
		scheduleNextCheck();
	};
	const scheduleNextCheck = () => {
		const rafTick = new Promise((res) => {
			requestAnimationFrame(() => res());
		});
		(keepalive ? Promise.race([rafTick, keepalive.waitForTick()]) : rafTick).then(check);
	};
	check();
	return promise;
};
var sessionId = null;
var getPrefix = () => {
	if (!sessionId) sessionId = crypto.randomUUID();
	return `__remotion_render:${sessionId}:`;
};
var cleanupStaleOpfsFiles = async () => {
	try {
		const root = await navigator.storage.getDirectory();
		for await (const [name] of root.entries()) if (name.startsWith("__remotion_render:") && !name.startsWith(getPrefix())) await root.removeEntry(name);
	} catch {}
};
var createWebFsTarget = async () => {
	const directoryHandle = await navigator.storage.getDirectory();
	const filename = `${getPrefix()}${crypto.randomUUID()}`;
	const writable = await (await directoryHandle.getFileHandle(filename, { create: true })).createWritable();
	const stream = new WritableStream({ async write(chunk) {
		await writable.seek(chunk.position);
		await writable.write(chunk);
	} });
	const getBlob = async () => {
		return (await directoryHandle.getFileHandle(filename)).getFile();
	};
	const close = () => writable.close();
	return {
		stream,
		getBlob,
		close
	};
};
var MAX_RECENT_FRAME_TIMINGS = 150;
var internalRenderMediaOnWeb = async ({ composition, inputProps, delayRenderTimeoutInMilliseconds, logLevel, mediaCacheSizeInBytes, schema, videoCodec: codec, audioCodec: unresolvedAudioCodec, audioBitrate, container, signal, onProgress, hardwareAcceleration, keyframeIntervalInSeconds, videoBitrate, frameRange, transparent, onArtifact, onFrame, pageResponsiveness, outputTarget: userDesiredOutputTarget, outputWritable, licenseKey, muted, scale, isProduction, sampleRate, allowHtmlInCanvas, metadata }) => {
	let __stack2 = [];
	try {
		validateScale(scale);
		const pageResponsivenessIntervalInMilliseconds = resolvePageResponsivenessInterval(pageResponsiveness);
		let htmlInCanvasLayerOutcomeReported = false;
		const onHtmlInCanvasLayerOutcome = (outcome) => {
			if (htmlInCanvasLayerOutcomeReported) return;
			htmlInCanvasLayerOutcomeReported = true;
			if (outcome.native) Internals.Log.warn({
				logLevel,
				tag: "@remotion/web-renderer"
			}, "Using Chromium experimental HTML-in-canvas (drawElementImage) for video frames. Pixels may differ from the built-in DOM composer. Set allowHtmlInCanvas: false to force software rasterization. See https://remotion.dev/docs/client-side-rendering/html-in-canvas");
			else if (outcome.shouldWarn) Internals.Log.warn({
				logLevel,
				tag: "@remotion/web-renderer"
			}, `Not using HTML-in-canvas: ${outcome.reason}`);
		};
		const outputTarget = outputWritable !== null ? null : userDesiredOutputTarget === null ? await canUseWebFsWriter() ? "web-fs" : "arraybuffer" : userDesiredOutputTarget;
		if (outputTarget === "web-fs") await cleanupStaleOpfsFiles();
		const format = containerToMediabunnyContainer(container);
		const videoEnabled = !isAudioOnlyContainer(container);
		if (videoEnabled && codec && !format.getSupportedCodecs().includes(codecToMediabunnyCodec(codec))) return Promise.reject(/* @__PURE__ */ new Error(`Codec ${codec} is not supported for container ${container}`));
		if (transparent) {
			if (container !== "webm" && container !== "mkv") return Promise.reject(/* @__PURE__ */ new Error(`Transparent videos are only supported with the "webm" and "mkv" containers, but you specified "${container}". Change the \`container\` option to "webm" or "mkv".`));
			if (codec && codec !== "vp8" && codec !== "vp9") return Promise.reject(/* @__PURE__ */ new Error(`Transparent videos are only supported with the "vp8" and "vp9" codecs, but you specified "${codec}". Change the \`videoCodec\` option to "vp8" or "vp9", or remove it to use the default.`));
		}
		const resolvedAudioBitrate = typeof audioBitrate === "number" ? audioBitrate : getQualityForWebRendererQuality(audioBitrate);
		let finalAudioCodec = null;
		if (!muted) {
			const audioResult = await resolveAudioCodec({
				container,
				requestedCodec: unresolvedAudioCodec,
				userSpecifiedAudioCodec: unresolvedAudioCodec !== void 0 && unresolvedAudioCodec !== null,
				bitrate: resolvedAudioBitrate
			});
			for (const issue of audioResult.issues) {
				if (issue.severity === "error") return Promise.reject(new Error(issue.message));
				Internals.Log.warn({
					logLevel,
					tag: "@remotion/web-renderer"
				}, issue.message);
			}
			finalAudioCodec = audioResult.codec;
		}
		const resolved = await Internals.resolveVideoConfig({
			calculateMetadata: composition.calculateMetadata ?? null,
			signal: signal ?? new AbortController().signal,
			defaultProps: composition.defaultProps ?? {},
			inputProps: inputProps ?? {},
			compositionId: composition.id,
			compositionDurationInFrames: composition.durationInFrames ?? null,
			compositionFps: composition.fps ?? null,
			compositionHeight: composition.height ?? null,
			compositionWidth: composition.width ?? null
		});
		const encodedDimensions = getEncodedDimensions({
			width: resolved.width,
			height: resolved.height,
			scale,
			codec: videoEnabled ? codec : null
		});
		const sourceDimensions = {
			width: Math.ceil(resolved.width * scale),
			height: Math.ceil(resolved.height * scale)
		};
		const needsCrop = encodedDimensions.width !== sourceDimensions.width || encodedDimensions.height !== sourceDimensions.height;
		if (needsCrop && codec) {
			const croppedPixelsOnRight = sourceDimensions.width - encodedDimensions.width;
			const croppedPixelsOnBottom = sourceDimensions.height - encodedDimensions.height;
			const croppedEdges = [croppedPixelsOnRight > 0 ? `${croppedPixelsOnRight} ${croppedPixelsOnRight === 1 ? "pixel was" : "pixels were"} removed from the right edge` : null, croppedPixelsOnBottom > 0 ? `${croppedPixelsOnBottom} ${croppedPixelsOnBottom === 1 ? "pixel was" : "pixels were"} removed from the bottom edge` : null].filter(Boolean);
			const codecName = codec === "h264" ? "H.264" : codec === "h265" ? "H.265" : codec === "av1" ? "AV1" : codec.toUpperCase();
			Internals.Log.warn({
				logLevel,
				tag: "@remotion/web-renderer"
			}, `The output was cropped from ${sourceDimensions.width}×${sourceDimensions.height} to ${encodedDimensions.width}×${encodedDimensions.height} because ${codecName} requires even dimensions. ${croppedEdges.join(" and ")}. Use even output dimensions to avoid cropping.`);
		}
		const realFrameRange = getRealFrameRange(resolved.durationInFrames, frameRange);
		if (signal?.aborted) return Promise.reject(/* @__PURE__ */ new Error("renderMediaOnWeb() was cancelled"));
		const { delayRenderScope, div, timeUpdater, collectAssets, errorHolder, htmlInCanvasContext } = __using(__stack2, createScaffold({
			width: resolved.width,
			height: resolved.height,
			fps: resolved.fps,
			durationInFrames: resolved.durationInFrames,
			Component: composition.component,
			resolvedProps: resolved.props,
			id: resolved.id,
			delayRenderTimeoutInMilliseconds,
			logLevel,
			mediaCacheSizeInBytes,
			schema: schema ?? null,
			audioEnabled: !muted,
			videoEnabled,
			initialFrame: 0,
			defaultCodec: resolved.defaultCodec,
			defaultOutName: resolved.defaultOutName,
			useHtmlInCanvas: allowHtmlInCanvas,
			pixelDensity: scale,
			sampleRate
		}), 0);
		if (allowHtmlInCanvas && !htmlInCanvasContext) {
			if (!supportsNativeHtmlInCanvas()) onHtmlInCanvasLayerOutcome({
				native: false,
				reason: "This browser does not expose CanvasRenderingContext2D.prototype.drawElementImage. In Chromium, enable chrome://flags/#canvas-draw-element and use a version that ships the API.",
				shouldWarn: false
			});
			else onHtmlInCanvasLayerOutcome({
				native: false,
				reason: "drawElementImage is available but canvas.requestPaint() is missing. Use a Chromium version that ships requestPaint.",
				shouldWarn: true
			});
		} else if (!allowHtmlInCanvas) onHtmlInCanvasLayerOutcome({
			native: false,
			reason: "allowHtmlInCanvas is false; using the built-in DOM composer.",
			shouldWarn: false
		});
		const internalState = __using(__stack2, makeInternalState({
			signal,
			maskImageTimeoutInMilliseconds: delayRenderTimeoutInMilliseconds
		}), 0);
		const pageResponsivenessController = createPageResponsivenessController({
			intervalInMilliseconds: pageResponsivenessIntervalInMilliseconds,
			now: () => performance.now(),
			wait: () => new Promise((resolve) => {
				setTimeout(resolve, 0);
			})
		});
		const waitForPageResponsiveness = async () => {
			await pageResponsivenessController.waitIfNeeded();
			if (signal?.aborted) throw new Error("renderMediaOnWeb() was cancelled");
		};
		const keepalive = __using(__stack2, createBackgroundKeepalive({
			fps: resolved.fps,
			logLevel
		}), 0);
		const waitForRenderReady = async () => {
			await waitForReady({
				timeoutInMilliseconds: delayRenderTimeoutInMilliseconds,
				scope: delayRenderScope,
				signal,
				apiName: "renderMediaOnWeb",
				internalState,
				keepalive
			});
			checkForError(errorHolder);
		};
		const artifactsHandler = handleArtifacts();
		const webFsTarget = outputTarget === "web-fs" ? await createWebFsTarget() : null;
		const target = outputWritable ? new StreamTarget(outputWritable) : webFsTarget ? new StreamTarget(webFsTarget.stream) : new BufferTarget();
		const outputWithCleanup = __using(__stack2, makeOutputWithCleanup({
			format,
			target
		}), 0);
		const defaultComment = `Made with Remotion ${VERSION}`;
		outputWithCleanup.output.setMetadataTags({
			...metadata ?? {},
			comment: metadata?.comment === void 0 ? defaultComment : `${defaultComment}; ${metadata.comment}`
		});
		const throttledOnProgress = __using(__stack2, createThrottledProgressCallback(onProgress), 0)?.throttled ?? null;
		try {
			let __stack = [];
			try {
				if (signal?.aborted) throw new Error("renderMediaOnWeb() was cancelled");
				await waitForRenderReady();
				if (signal?.aborted) throw new Error("renderMediaOnWeb() was cancelled");
				const videoSampleSource = __using(__stack, videoEnabled && codec ? makeVideoSampleSourceCleanup({
					codec: codecToMediabunnyCodec(codec),
					bitrate: typeof videoBitrate === "number" ? videoBitrate : getQualityForWebRendererQuality(videoBitrate),
					sizeChangeBehavior: "deny",
					...needsCrop ? { transform: { crop: {
						left: 0,
						top: 0,
						...encodedDimensions
					} } } : {},
					hardwareAcceleration,
					latencyMode: "quality",
					keyFrameInterval: keyframeIntervalInSeconds,
					alpha: transparent ? "keep" : "discard"
				}) : null, 0);
				const totalFrames = realFrameRange[1] - realFrameRange[0] + 1;
				const durationInSeconds = totalFrames / resolved.fps;
				const renderStart = Date.now();
				let doneIn = null;
				let renderEstimatedTime = 0;
				const recentFrameTimings = [];
				if (videoSampleSource) outputWithCleanup.output.addVideoTrack(videoSampleSource.videoSampleSource, { maximumPacketCount: Math.ceil(totalFrames * 1.33) });
				const audioSampleSource = __using(__stack, createAudioSampleSource({
					muted,
					codec: finalAudioCodec ? audioCodecToMediabunnyAudioCodec(finalAudioCodec) : null,
					bitrate: resolvedAudioBitrate
				}), 0);
				if (audioSampleSource) outputWithCleanup.output.addAudioTrack(audioSampleSource.audioSampleSource, { maximumPacketCount: Math.max(8, Math.ceil(durationInSeconds * 100 * 1.33)) });
				await outputWithCleanup.output.start();
				if (signal?.aborted) throw new Error("renderMediaOnWeb() was cancelled");
				const audioMixer = createAudioMixer({
					fps: resolved.fps,
					sampleRate
				});
				const encodeReadyAudio = async () => {
					if (!audioSampleSource) return;
					let audio;
					while (audio = audioMixer.getReadyAudio()) {
						try {
							await addAudioSample(audio, audioSampleSource.audioSampleSource);
						} finally {
							audio.close();
						}
						await waitForPageResponsiveness();
					}
				};
				let timeOfLastFrame = Date.now();
				const progress = {
					renderedFrames: 0,
					encodedFrames: 0
				};
				const getProgressPayload = () => {
					const overallProgress = Math.round((70 * progress.renderedFrames + 30 * progress.encodedFrames) / totalFrames) / 100;
					return {
						renderedFrames: progress.renderedFrames,
						encodedFrames: progress.encodedFrames,
						doneIn,
						renderEstimatedTime,
						progress: overallProgress
					};
				};
				for (let frame = realFrameRange[0]; frame <= realFrameRange[1]; frame++) {
					if (signal?.aborted) throw new Error("renderMediaOnWeb() was cancelled");
					timeUpdater.current?.update(frame);
					await waitForRenderReady();
					if (signal?.aborted) throw new Error("renderMediaOnWeb() was cancelled");
					const timestamp = Math.round((frame - realFrameRange[0]) / resolved.fps * 1e6);
					let frameToEncode = null;
					let layerCanvas = null;
					if (videoEnabled) {
						const createFrameStart = performance.now();
						const layer = await createLayer({
							element: div,
							scale,
							logLevel,
							internalState,
							onlyBackgroundClipText: false,
							cutout: new DOMRect(0, 0, resolved.width, resolved.height),
							htmlInCanvasContext,
							onHtmlInCanvasLayerOutcome: htmlInCanvasContext ? onHtmlInCanvasLayerOutcome : void 0,
							waitForPageResponsiveness
						});
						internalState.addCreateFrameTime(performance.now() - createFrameStart);
						layerCanvas = layer.canvas;
						if (signal?.aborted) throw new Error("renderMediaOnWeb() was cancelled");
						await waitForPageResponsiveness();
						const videoFrame = new VideoFrame(layer.canvas, { timestamp });
						frameToEncode = videoFrame;
						if (onFrame) {
							const returnedFrame = await onFrame(videoFrame);
							if (signal?.aborted) throw new Error("renderMediaOnWeb() was cancelled");
							frameToEncode = validateVideoFrame({
								originalFrame: videoFrame,
								returnedFrame,
								expectedWidth: sourceDimensions.width,
								expectedHeight: sourceDimensions.height,
								expectedTimestamp: timestamp
							});
							await waitForPageResponsiveness();
						}
					}
					const now = Date.now();
					const timeToRenderInMilliseconds = now - timeOfLastFrame;
					timeOfLastFrame = now;
					progress.renderedFrames++;
					recentFrameTimings.push(timeToRenderInMilliseconds);
					if (recentFrameTimings.length > MAX_RECENT_FRAME_TIMINGS) recentFrameTimings.shift();
					const newAverage = recentFrameTimings.reduce((sum, time) => sum + time, 0) / recentFrameTimings.length;
					const remainingFrames = totalFrames - progress.renderedFrames;
					renderEstimatedTime = Math.round(remainingFrames * newAverage);
					throttledOnProgress?.(getProgressPayload());
					const audioCombineStart = performance.now();
					const assets = collectAssets.current.collectAssets();
					if (onArtifact) await artifactsHandler.handle({
						imageData: layerCanvas,
						frame,
						assets,
						onArtifact
					});
					await waitForPageResponsiveness();
					if (audioSampleSource) audioMixer.addFrame({
						assets,
						timestamp,
						isLastFrame: frame === realFrameRange[1]
					});
					internalState.addAudioMixingTime(performance.now() - audioCombineStart);
					await waitForPageResponsiveness();
					const addSampleStart = performance.now();
					const encodingPromises = [];
					if (frameToEncode && videoSampleSource) encodingPromises.push(addVideoSampleAndCloseFrame(frameToEncode, videoSampleSource.videoSampleSource));
					encodingPromises.push(encodeReadyAudio());
					await Promise.all(encodingPromises);
					internalState.addAddSampleTime(performance.now() - addSampleStart);
					progress.encodedFrames++;
					if (progress.encodedFrames === totalFrames) doneIn = Date.now() - renderStart;
					throttledOnProgress?.(getProgressPayload());
					if (signal?.aborted) throw new Error("renderMediaOnWeb() was cancelled");
					await waitForPageResponsiveness();
				}
				onProgress?.(getProgressPayload());
				await waitForPageResponsiveness();
				videoSampleSource?.videoSampleSource.close();
				audioSampleSource?.audioSampleSource.close();
				await outputWithCleanup.output.finalize();
				Internals.Log.verbose({
					logLevel,
					tag: "web-renderer"
				}, `Render timings: waitForReady=${internalState.getWaitForReadyTime().toFixed(2)}ms, createFrame=${internalState.getCreateFrameTime().toFixed(2)}ms, addSample=${internalState.getAddSampleTime().toFixed(2)}ms, audioMixing=${internalState.getAudioMixingTime().toFixed(2)}ms`);
				if (outputWritable) {
					sendUsageEvent({
						licenseKey: licenseKey ?? null,
						succeeded: true,
						apiName: "renderMediaOnWeb",
						isStill: false,
						isProduction: isProduction ?? true
					});
					return {
						getBlob: () => Promise.reject(/* @__PURE__ */ new Error("getBlob() is unavailable when outputWritable is used")),
						internalState
					};
				}
				if (webFsTarget) {
					sendUsageEvent({
						licenseKey: licenseKey ?? null,
						succeeded: true,
						apiName: "renderMediaOnWeb",
						isStill: false,
						isProduction: isProduction ?? true
					});
					await webFsTarget.close();
					return {
						getBlob: async () => {
							const file = await webFsTarget.getBlob();
							return new Blob([file], { type: getMimeType(container) });
						},
						internalState
					};
				}
				if (!(target instanceof BufferTarget)) throw new Error("Expected target to be a BufferTarget");
				sendUsageEvent({
					licenseKey: licenseKey ?? null,
					succeeded: true,
					apiName: "renderMediaOnWeb",
					isStill: false,
					isProduction: isProduction ?? true
				});
				return {
					getBlob: () => {
						if (!target.buffer) throw new Error("The resulting buffer is empty");
						return Promise.resolve(new Blob([target.buffer], { type: getMimeType(container) }));
					},
					internalState
				};
			} catch (_catch) {
				var _err = _catch, _hasErr = 1;
			} finally {
				__callDispose(__stack, _err, _hasErr);
			}
		} catch (err) {
			if (!signal?.aborted) sendUsageEvent({
				succeeded: false,
				licenseKey: licenseKey ?? null,
				apiName: "renderMediaOnWeb",
				isStill: false,
				isProduction: isProduction ?? true
			}).catch((err2) => {
				Internals.Log.error({
					logLevel: "error",
					tag: "web-renderer"
				}, "Failed to send usage event", err2);
			});
			throw err;
		}
	} catch (_catch2) {
		var _err2 = _catch2, _hasErr2 = 1;
	} finally {
		__callDispose(__stack2, _err2, _hasErr2);
	}
};
var renderMediaOnWeb = (options) => {
	const container = options.container ?? "mp4";
	const codec = options.videoCodec ?? getDefaultVideoCodecForContainer(container) ?? null;
	onlyOneMediaRenderAtATimeQueue.ref = onlyOneMediaRenderAtATimeQueue.ref.catch(() => Promise.resolve()).then(() => internalRenderMediaOnWeb({
		...options,
		delayRenderTimeoutInMilliseconds: options.delayRenderTimeoutInMilliseconds ?? 3e4,
		logLevel: options.logLevel ?? window.remotion_logLevel ?? "info",
		schema: options.schema ?? void 0,
		mediaCacheSizeInBytes: options.mediaCacheSizeInBytes ?? null,
		videoCodec: codec,
		audioCodec: options.audioCodec ?? null,
		audioBitrate: options.audioBitrate ?? "medium",
		container,
		signal: options.signal ?? null,
		onProgress: options.onProgress ?? null,
		hardwareAcceleration: options.hardwareAcceleration ?? "no-preference",
		keyframeIntervalInSeconds: options.keyframeIntervalInSeconds ?? 5,
		videoBitrate: options.videoBitrate ?? "medium",
		frameRange: options.frameRange ?? null,
		transparent: options.transparent ?? false,
		onArtifact: options.onArtifact ?? null,
		onFrame: options.onFrame ?? null,
		pageResponsiveness: options.pageResponsiveness ?? "medium",
		outputTarget: options.outputTarget ?? null,
		outputWritable: options.outputWritable ?? null,
		licenseKey: options.licenseKey ?? null,
		muted: options.muted ?? false,
		scale: options.scale ?? 1,
		isProduction: options.isProduction ?? true,
		allowHtmlInCanvas: options.allowHtmlInCanvas ?? false,
		sampleRate: options.sampleRate ?? 48e3,
		metadata: options.metadata ?? null
	}));
	return onlyOneMediaRenderAtATimeQueue.ref;
};
var mimeTypeForFormat = (format) => {
	if (format === "jpeg") return "image/jpeg";
	if (format === "webp") return "image/webp";
	return "image/png";
};
var encodeCanvasToBlob = async (canvas, options) => {
	const format = options?.format ?? "png";
	const type = mimeTypeForFormat(format);
	if (format === "png") return canvas.convertToBlob({ type });
	return canvas.convertToBlob({
		type,
		quality: options?.quality
	});
};
var createRenderStillOnWebResult = ({ canvas, internalState }) => {
	return {
		internalState,
		canvas: () => Promise.resolve(canvas),
		blob: (options) => encodeCanvasToBlob(canvas, options),
		url: async (options) => {
			const blob = await encodeCanvasToBlob(canvas, options);
			return URL.createObjectURL(blob);
		}
	};
};
async function internalRenderStillOnWeb({ frame, delayRenderTimeoutInMilliseconds, logLevel, inputProps, schema, mediaCacheSizeInBytes, composition, signal, onArtifact, licenseKey, scale, isProduction, allowHtmlInCanvas }) {
	let __stack = [];
	try {
		validateScale(scale);
		const onHtmlInCanvasLayerOutcome = (outcome) => {
			if (outcome.native) Internals.Log.warn({
				logLevel,
				tag: "@remotion/web-renderer"
			}, "Using Chromium experimental HTML-in-canvas (drawElementImage) for this frame. Pixels may differ from the built-in DOM composer. Set allowHtmlInCanvas: false to force software rasterization. See https://remotion.dev/docs/client-side-rendering/html-in-canvas");
			else if (outcome.shouldWarn) Internals.Log.warn({
				logLevel,
				tag: "@remotion/web-renderer"
			}, `Not using HTML-in-canvas: ${outcome.reason}`);
		};
		const resolved = await Internals.resolveVideoConfig({
			calculateMetadata: composition.calculateMetadata ?? null,
			signal: signal ?? new AbortController().signal,
			defaultProps: composition.defaultProps ?? {},
			inputProps: inputProps ?? {},
			compositionId: composition.id,
			compositionDurationInFrames: composition.durationInFrames ?? null,
			compositionFps: composition.fps ?? null,
			compositionHeight: composition.height ?? null,
			compositionWidth: composition.width ?? null
		});
		if (signal?.aborted) return Promise.reject(/* @__PURE__ */ new Error("renderStillOnWeb() was cancelled"));
		const internalState = __using(__stack, makeInternalState({
			signal,
			maskImageTimeoutInMilliseconds: delayRenderTimeoutInMilliseconds
		}), 0);
		const { delayRenderScope, div, collectAssets, errorHolder, htmlInCanvasContext } = __using(__stack, createScaffold({
			sampleRate: null,
			width: resolved.width,
			height: resolved.height,
			delayRenderTimeoutInMilliseconds,
			logLevel,
			resolvedProps: resolved.props,
			id: resolved.id,
			mediaCacheSizeInBytes,
			audioEnabled: false,
			Component: composition.component,
			videoEnabled: true,
			durationInFrames: resolved.durationInFrames,
			fps: resolved.fps,
			schema: schema ?? null,
			initialFrame: frame,
			defaultCodec: resolved.defaultCodec,
			defaultOutName: resolved.defaultOutName,
			useHtmlInCanvas: allowHtmlInCanvas,
			pixelDensity: scale
		}), 0);
		if (allowHtmlInCanvas && !htmlInCanvasContext) {
			if (!supportsNativeHtmlInCanvas()) onHtmlInCanvasLayerOutcome({
				native: false,
				reason: "This browser does not expose CanvasRenderingContext2D.prototype.drawElementImage. In Chromium, enable chrome://flags/#canvas-draw-element and use a version that ships the API.",
				shouldWarn: false
			});
			else onHtmlInCanvasLayerOutcome({
				native: false,
				reason: "drawElementImage is available but canvas.requestPaint() is missing. Use a Chromium version that ships requestPaint.",
				shouldWarn: true
			});
		} else if (!allowHtmlInCanvas) onHtmlInCanvasLayerOutcome({
			native: false,
			reason: "allowHtmlInCanvas is false; using the built-in DOM composer.",
			shouldWarn: false
		});
		const artifactsHandler = handleArtifacts();
		const waitForRenderReady = async () => {
			await waitForReady({
				timeoutInMilliseconds: delayRenderTimeoutInMilliseconds,
				scope: delayRenderScope,
				signal,
				apiName: "renderStillOnWeb",
				internalState: null,
				keepalive: null
			});
			checkForError(errorHolder);
		};
		try {
			if (signal?.aborted) throw new Error("renderStillOnWeb() was cancelled");
			await waitForRenderReady();
			if (signal?.aborted) throw new Error("renderStillOnWeb() was cancelled");
			const { canvas } = await createLayer({
				element: div,
				scale,
				logLevel,
				internalState,
				onlyBackgroundClipText: false,
				cutout: new DOMRect(0, 0, resolved.width, resolved.height),
				htmlInCanvasContext,
				onHtmlInCanvasLayerOutcome: htmlInCanvasContext ? onHtmlInCanvasLayerOutcome : void 0,
				waitForPageResponsiveness: null
			});
			const assets = collectAssets.current.collectAssets();
			if (onArtifact) await artifactsHandler.handle({
				imageData: canvas,
				frame,
				assets,
				onArtifact
			});
			sendUsageEvent({
				licenseKey: licenseKey ?? null,
				succeeded: true,
				apiName: "renderStillOnWeb",
				isStill: true,
				isProduction
			});
			return createRenderStillOnWebResult({
				canvas,
				internalState
			});
		} catch (err) {
			if (!signal?.aborted) sendUsageEvent({
				succeeded: false,
				licenseKey: licenseKey ?? null,
				apiName: "renderStillOnWeb",
				isStill: true,
				isProduction
			}).catch((err2) => {
				Internals.Log.error({
					logLevel: "error",
					tag: "web-renderer"
				}, "Failed to send usage event", err2);
			});
			throw err;
		}
	} catch (_catch) {
		var _err = _catch, _hasErr = 1;
	} finally {
		__callDispose(__stack, _err, _hasErr);
	}
}
var renderStillOnWeb = (options) => {
	onlyOneStillRenderAtATimeQueue.ref = onlyOneStillRenderAtATimeQueue.ref.catch(() => Promise.resolve()).then(() => internalRenderStillOnWeb({
		...options,
		delayRenderTimeoutInMilliseconds: options.delayRenderTimeoutInMilliseconds ?? 3e4,
		logLevel: options.logLevel ?? window.remotion_logLevel ?? "info",
		schema: options.schema ?? void 0,
		mediaCacheSizeInBytes: options.mediaCacheSizeInBytes ?? null,
		signal: options.signal ?? null,
		onArtifact: options.onArtifact ?? null,
		licenseKey: options.licenseKey ?? null,
		scale: options.scale ?? 1,
		isProduction: options.isProduction ?? true,
		allowHtmlInCanvas: options.allowHtmlInCanvas ?? false
	}));
	return onlyOneStillRenderAtATimeQueue.ref;
};
//#endregion
export { canRenderMediaOnWeb, getDefaultAudioCodecForContainer, getDefaultContainerForCodec, getDefaultVideoCodecForContainer, getEncodableAudioCodecs, getEncodableVideoCodecs, getSupportedAudioCodecsForContainer, getSupportedVideoCodecsForContainer, isAudioOnlyContainer, renderMediaOnWeb, renderStillOnWeb };
