#!/usr/bin/env node

/**
 * This example builds upon the ToneGenerator by adding SR report generation.
 * SR packets provide a way for session members to detect packet loss.
 *
 * Features shown:
 *  - RTCP SR generation.
 */

const { SrPacket } = require('../index.js');
const Example2 = require('./2.source_description');

/**
 * Sends RTP data and generates RTCP SR packets.
 *
 * @param {object} args - class arguments.
 * @param {number} args.rtp_port - port to send RTP packets.
 * @param {number} args.rtcp_port - port to send RTCP packets.
 * @param {string} [args.address] - address to send packets.
 * @param {number} [args.sample_rate] - audio sample rate in Hz.
 * @param {number} [args.frequency] - tone frequency in Hz.
 * @param {number} [args.duration] - frame duration in ms.
 * @param {number} [args.volume] - output volume [0.0, 1.0].
 * @param {number} [args.bandwidth] - target audio bandwidth.
 * @param {number} [args.cname] - canonical name.
 * @param {number} [args.name] - user name.
 */
class Example3 extends Example2 {
    constructor(args={}) {
        super(args);

        // The handle for our report timer
        this.sr_timer = null;
    }

    /**
     * Generate an RTCP SR packet and reschedule the timer.
     */
    sendSr() {
        // Generate our report. Since we are not receiving any packets there is
        // no need to add any additional receive reports.
        const packet = new SrPacket();
        packet.ssrc = this.ssrc;
        packet.rtp_ts = this.ts;
        packet.pkt_count = this.rtp_pkt_count;
        packet.byte_count = this.rtp_byte_count;

        packet.updateNtpTime(new Date());

        console.log("Sending SR");
        const data = packet.serialize();
        this.rtcp_socket.send(data, this.rtcp_port, this.address);

        // Assume that no other RTCP packets are being sent/received. Thus the
        // average packet size is just our report length.
        this.avg_rtcp_size = data.length;

        // Reset counts for next report
        this.rtp_pkt_count = 0;
        this.rtp_byte_count = 0;

        // Clear 'initial' flag
        this.initial = false;

        this.sr_timer = setTimeout(() => this.sendSr(), this.interval);
    }

    /**
     * Start sending packets.
     */
    start() {
        super.start();
        this.sr_timer = setTimeout(() => this.sendSr(), this.interval);
    }

    /**
     * Stop sending packets.
     */
    stop() {
        super.stop();
        clearTimeout(this.sr_timer);
    }
};

if(require.main === module) {
    const example = new Example3({
        rtp_port: 5002,
        rtcp_port: 5003,
        name: "Example3"
    });
    example.start();
}

module.exports=exports=Example3;
