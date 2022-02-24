#!/usr/bin/env node

/**
 * This example builds on Example2 by adding RTCP report generation. A typical
 * application will choose whether to send an SR or RR packet based on if it
 * has sent an RTP packet in the last two report intervals.
 *
 * This example shows:
 *  - RTCP SR/RR generation.
 *  - Calculating packet loss.
 */

const {
    RtpPacket,
    RrPacket,
    SrPacket,
    Source,
    PacketType,
    parse
} = require('../index.js');

const Example2 = require('./2.source_description');

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
class Example3 extends Example2 {
    constructor(args={}) {
        super(args);

        // Holds information about session sources
        this.sources = {};

        // The handle for our report timer
        this.report_timer = null;

        // The handle for our RTP on/off cycle timer
        this.on_off_timer = null;
    }

    get members() {
        // Now that we are receving packets we no longer have to assume the
        // count of session members.
        return Object.keys(this.sources).length;
    }

    /**
     * Send an RTCP SR packet.
     */
    sendSr() {
        const packet = new SrPacket();
        packet.ssrc = this.ssrc;
        packet.rtp_ts = this.ts;
        packet.pkt_count = this.rtp_pkt_count;
        packet.byte_count = this.rtp_byte_count;

        packet.updateNtpTime(new Date());

        for(let source of Object.values(this.sources)) {
            // Update the lost packet count
            source.updateLost();

            // Generate a report
            const report = source.toReport(new Date());
            packet.addReport(report);
        }

        console.log("Sending SR");
        const data = packet.serialize();
        this.rtcp_socket.send(data, this.rtcp_port, this.address);
        this.updateAvgSize(data.length);

        // Reset counts for next report
        this.rtp_pkt_count = 0;
        this.rtp_byte_count = 0;

        // Clear 'initial' flag
        this.initial = false;
    }

    /**
     * Send an RTCP RR packet.
     */
    sendRr() {
        const packet = new RrPacket();
        packet.ssrc = this.ssrc;

        for(let source of Object.values(this.sources)) {
            // Update the lost packet count
            source.updateLost();

            // Generate a report
            const report = source.toReport(new Date());
            packet.addReport(report);
        }

        // Send our reports
        console.log("Sending RR");
        const data = packet.serialize();
        this.rtcp_socket.send(data, this.rtcp_port, this.address);
        this.updateAvgSize(data.length);

        // Clear 'initial' flag
        this.initial = false;
    }

    /**
     * Chooses whether to send an SR or RR packet.
     */
    cycleReports() {
        // If we have sent in the last cycle send an SR packet, otherwise
        // send an RR packet.
        if(this.we_sent)
            this.sendSr();
        else
            this.sendRr();

        this.report_timer = setTimeout(() => this.cycleReports(), this.interval);
    }

    /**
     * Start sending packets.
     */
    start() {
        super.start();

        this.report_timer = setTimeout(() => this.cycleReports(), this.interval);

        this.on_off_timer = setInterval(() => {
            // Every 10 seconds stop sending RTP packets to switch which report
            // type we are sending.
            if(this.rtp_timer) {
                console.log("Stop tone");
                this.stopRtp();
            }
            else {
                console.log("Start tone");
                this.startRtp();
            }

        }, 10000);
    }

    /**
     * Stop sending packets.
     */
    stop() {
        super.stop();
        clearTimeout(this.report_timer);
        clearInterval(this.on_off_timer);
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
    const example = new Example3({
        rtp_port: 6002,
        rtcp_port: 6003,
        name: "Example3"
    });

    example.bind(5002, 5003);
    example.start();
}

module.exports=exports=Example3;