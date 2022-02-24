#!/usr/bin/env node

/**
 * This example shows:
 *  - RTCP receiver report generation.
 *  - Calculating packet loss.
 *  - Calculating average rtp packet size.
 */

const {
    RtpPacket,
    RrPacket,
    Source,
    PacketType,
    parse
} = require('../index.js');

const Example3 = require('./3.sender_report');

/**
 * Receives RTP/RTCP packets and generates RTCP RR packets.
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
class Example4 extends Example3 {
    constructor(args={}) {
        super(args);

        // Holds information about session sources
        this.sources = {};

        // The handle for our report timer
        this.rr_timer = null;
    }

    /**
     * Generate an RTCP RR packet and reschedule the timer.
     */
    sendRr() {
        const packet = new RrPacket();
        packet.ssrc = this.ssrc;

        for(let source of Object.values(this.sources)) {
            // Update the lost packet count
            source.updateLost();

            // Generate a report on our source
            const report = source.toReport(new Date());
            console.log("Source report:", report);

            packet.addReport(report);
        }

        // Send our reports
        console.log("Sending RR");
        const data = packet.serialize();
        this.rtcp_socket.send(data, this.rtcp_port, this.address);
        this.updateAvgSize(data.length);

        // Clear 'initial' flag
        this.initial = false;

        this.rr_timer = setTimeout(() => this.sendRr(), this.interval);
    }

    /**
     * Start sending packets.
     */
    start() {
        super.start();
        this.rr_timer = setTimeout(() => this.sendRr(), this.interval);
    }

    /**
     * Stop sending packets.
     */
    stop() {
        super.stop();
        clearTimeout(this.sr_timer);
    }

    /**
     * Begin listening for packets.
     *
     * @param {Number} rtp_port - RTP receive port.
     * @param {Number} rtcp_port - RTCP receive port.
     * @param {String} address - receive address.
     */
    bind(rtp_port, rtcp_port, address) {
        this.rtp_socket.bind(rtp_port, address);
        this.rtp_socket.on('message', this.onRtp.bind(this));

        this.rtcp_socket.bind(rtcp_port, address);
        this.rtcp_socket.on('message', this.onRtcp.bind(this));
    }

    /**
     * Called on receiving a new RTP packet.
     *
     * @param {Buffer} data - packet data.
     */
    onRtp(data) {
        // Parse the packet
        const packet = new RtpPacket(data);

        if(!this.sources[packet.ssrc]) {
            console.log('New source with ID', packet.ssrc, '(RTP)');
            this.sources[packet.ssrc] = new Source(packet.ssrc);
        }

        this.sources[packet.ssrc].updateSeq(packet.seq);
    }

    /**
     * Called on receiving a new RTCP packet.
     *
     * @param {Buffer} data - packet data.
     */
    onRtcp(data) {
        const packet = parse(data);

        if(packet.type == PacketType.SR) {
            if(!this.sources[packet.ssrc]) {
                console.log('New source with ID', packet.ssrc, '(SR)');
                this.sources[packet.ssrc] = new Source(packet.ssrc);
            }

            // Update our LSR timestamp
            this.sources[packet.ssrc].updateLsr(packet.ntp_sec, packet.ntp_frac);
        }

        this.updateAvgSize(packet.size);
    }
};

if(require.main === module) {
    const example = new Example4({
        rtp_port: 6002,
        rtcp_port: 6003,
        name: "Example4"
    });

    example.bind(5002, 5003);
    example.start();
}

module.exports=exports=Example4;