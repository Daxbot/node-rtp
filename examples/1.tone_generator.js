#!/usr/bin/env node

const { RtpPacket } = require('../index.js');
const dgram = require('dgram');
const {sin, pow, PI} = Math;

const SAMPLE_RATE_HZ = 48000;
const FREQUENCY_HZ = 312.6;
const DURATION_MS = 20;
const VOLUME = 0.1; // 10%

const socket = dgram.createSocket('udp4');
socket.connect(5002);

// Sample index to maintain the sine wave between intervals
let i = 0;

/**
 * Generate a 20ms pure tone and send it using RTP.
 *
 * Catch it using gstreamer or a similar tool:
 * gst-launch-1.0 udpsrc port=5002 ! "application/x-rtp,payload=(int)96,clock-rate=48000" ! rtpL16depay ! autoaudiosink sync=false
 */
setInterval(() => {
    const samples = (SAMPLE_RATE_HZ * DURATION_MS) / 1000;
    const buffer = Buffer.alloc(samples * 2);

    for(let j = 0; j < samples; ++j) {
        let sample = sin(i++ * 2 * PI * FREQUENCY_HZ / SAMPLE_RATE_HZ);
        sample *= (pow(2, 15) - 1) * VOLUME;
        buffer.writeInt16BE(sample, 2 * j);
    }

    const pkt = new RtpPacket(96);
    pkt.seq += 1;
    pkt.ts += samples;
    pkt.payload = buffer;

    const data = pkt.serialize();
    socket.send(data);

}, DURATION_MS)
