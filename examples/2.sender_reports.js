#!/usr/bin/env node

/**
 * This example shows:
 *  - RTCP sender report generation.
 */

const dgram = require('dgram');

const { SrPacket, rtcpInterval } = require('../index.js');
const ToneGenerator = require('./1.tone_generator');

const DEFAULT_ADDRESS = '127.0.0.1';
const DEFAULT_RTP_PORT = 5002;
const DEFAULT_RTCP_PORT = 5003;
const DEFAULT_BANDWIDTH = 64000; // 64 kbit/s

/**
 * Sends RTP data and generates RTCP SR packets.
 *
 * @param {object} args - class arguments.
 * @param {string} args.address - address to send packets.
 * @param {number} args.rtp_port - port to send RTP packets.
 * @param {number} args.rtcp_port - port to send RTCP packets.
 * @param {number} args.bandwidth - target audio bandwidth for our application.
 */
class Sender {
    constructor(args={}) {
        this.address = args.address || DEFAULT_ADDRESS;
        this.rtp_port = args.rtp_port || DEFAULT_RTP_PORT;
        this.rtcp_port = args.rtcp_port || DEFAULT_RTCP_PORT;
        this.bandwidth = args.bandwidth || DEFAULT_BANDWIDTH;

        // Use example 1 as our RTP channel
        this.gen = new ToneGenerator({
            address: this.address,
            port: this.rtp_port
        });

        // True if we have not yet sent an RTCP packet
        this.initial = true;

        // Average calculated RTCP packet size both sent and received
        this.avg_rtcp_size = 0;

        // The handle for our report timer
        this.timer = null;

        // The handle for our RTCP socket
        this.socket = null;
    }

    /**
     * Get the RTCP report interval.
     */
    get interval() {
        return rtcpInterval({
            // Assume that we are one of two session members
            members: 2,

            // Assume we are the only sender
            senders: 1,

            // Suggested value is 5% of RTP bandwidth
            rtcp_bw: this.bandwidth * 0.5,

            // We are always sending RTP packets
            we_sent: true,

            // The average size of RTCP packets (both sent and received)
            avg_rtcp_size: this.avg_rtcp_size,

            // This flag will be cleared on our first send
            initial: this.initial,
        });
    }

    /**
     * Generate an RTCP SR packet and reschedule the timer.
     */
    send_report() {
        // Generate our report. Since we are not receiving any packets there is
        // no need to add any additional receive reports.
        const packet = new SrPacket();
        packet.ssrc = this.gen.ssrc;
        packet.rtp_ts = this.gen.ts;
        packet.pkt_count = this.gen.pkt_count;
        packet.byte_count = this.gen.byte_count;

        packet.updateNtpTime(new Date());

        const data = packet.serialize();
        this.socket.send(data);

        // Assume that no other RTCP packets are being sent/received. Thus the
        // average packet size is just our report length.
        this.avg_rtcp_size = data.length;

        // Reset counts for next report
        this.gen.pkt_count = 0;
        this.gen.byte_count = 0;

        // Clear 'initial' flag
        this.initial = false;

        this.timer = setTimeout(() => this.send_report(), this.interval);
    }

    /**
     * Start sending packets.
     */
    start() {
        // Connect our RTCP channel
        this.socket = dgram.createSocket('udp4');
        this.socket.on('error', () => { /* ignore */ });
        this.socket.connect(this.rtcp_port, this.address);

        // Connect our RTP channel
        this.gen.start();

        // Schedule our first report
        this.timer = setTimeout(() => this.send_report(), this.interval);
    }

    /**
     * Stop sending packets.
     */
    stop() {
        this.socket.close();
        this.gen.stop();
        clearTimeout(this.timer);
    }
};

if(require.main === module) {
    const sender = new Sender();
    sender.start();
}

module.exports=exports=Sender;