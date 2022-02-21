#!/usr/bin/env node

const dgram = require('dgram');
const { RtpPacket } = require('../index.js');

// Unpack Math
const {sin, pow, PI} = Math;

const DEFAULT_ADDRESS = '127.0.0.1';
const DEFAULT_PORT = 5002;
const DEFAULT_SAMPLE_RATE = 48000;  // Hz
const DEFAULT_FREQUENCY = 261.63;   // Hz
const DEFAULT_DURATION = 20;        // ms
const DEFAULT_VOLUME = 0.1;         // 10%

/**
 * Generates a pure tone and sends it using RTP.
 *
 * Catch using gstreamer or a similar tool:
 * gst-launch-1.0 udpsrc port=5002 ! "application/x-rtp,payload=96,clock-rate=48000" ! rtpL16depay ! autoaudiosink sync=false
 *
 * @param {object} args - class arguments.
 * @param {string} args.address - socket address to send frames.
 * @param {number} args.port - socket port to send frames.
 * @param {number} sample_rate - audio sample rate in Hz.
 * @param {number} frequency - tone frequency in Hz.
 * @param {number} duration - frame duration in ms.
 * @param {number} volume - output volume [0.0, 1.0].
 */
class ToneGenerator {
    constructor(args={}) {
        this.address = args.address || DEFAULT_ADDRESS;
        this.port = args.port || DEFAULT_PORT;
        this.sample_rate = args.sample_rate || DEFAULT_SAMPLE_RATE;
        this.frequency = args.frequency || DEFAULT_FREQUENCY;
        this.duration = args.duration || DEFAULT_DURATION;
        this.volume = args.volume || DEFAULT_VOLUME;

        // The number of samples per audio frame
        this.frame_samples = (this.sample_rate * this.duration) / 1000;

        // The size of an audio frame in bytes
        this.frame_size = this.frame_samples * 2; // int16_t

        // The buffer to use when constructing our tone
        this.frame_buffer = Buffer.alloc(this.frame_size);

        // Our RTP packet. It's important to keep this allocated so that we
        // can maintain our sequence/ssrc between frames.
        this.packet = new RtpPacket(96);

        // This value will be incremented for each sample so that we can
        // maintain our sine wave through subsequent frames.
        this.sample_index = 0;

        // The number of packets that have been sent.
        this.pkt_count = 0;

        // The number of octets that have been sent.
        this.byte_count = 0;

        // The handle for our interval timer
        this.timer = null;

        // The handle for our RTP socket
        this.socket = null;
    }

    /**
     * Get the RTP ssrc.
     */
    get ssrc() {
        return this.packet.ssrc;
    }

    /**
     * Get the RTP timestamp.
     */
    get ts() {
        return this.packet.ts;
    }

    /**
     * Start sending RTP packets.
     */
    start() {
        this.socket = dgram.createSocket('udp4');
        this.socket.on('error', () => { /* ignore */ });
        this.socket.connect(this.port, this.address);

        this.timer = setInterval(() => {
            for(let j = 0; j < this.frame_samples; ++j) {
                const f = 2 * PI * this.frequency / this.sample_rate;
                const A = (pow(2, 15) - 1) * this.volume;
                const sample = A * sin(f * this.sample_index++);
                this.frame_buffer.writeInt16BE(sample, 2 * j);
            }

            this.packet.seq += 1;
            this.packet.ts += this.frame_samples;
            this.packet.payload = this.frame_buffer;

            const data = this.packet.serialize();
            this.socket.send(data);

            this.pkt_count += 1;
            this.byte_count += data.length;

        }, this.duration);
    }

    /**
     * Stop sending RTP packets.
     */
    stop() {
        this.socket.disconnect();
        clearInterval(this.timer);
    }
}

if(require.main === module) {
    const gen = new ToneGenerator();
    gen.start();
}

module.exports=exports=ToneGenerator;