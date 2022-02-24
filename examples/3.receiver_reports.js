#!/usr/bin/env node

/**
 * This example shows:
 *  - RTCP receiver report generation.
 *  - Calculating packet loss.
 *  - Calculating average rtp packet size.
 */

const { createSocket, RemoteInfo } = require('dgram');

const {
    RtpPacket,
    RrPacket,
    Source,
    PacketType,
    rtcpInterval,
    parse
} = require('../index.js');

// Sequence wrap around value
const SEQ_MOD = 1 << 16;

const DEFAULT_RTP_PORT = 5002;
const DEFAULT_RTCP_PORT = 5003;
const DEFAULT_BANDWIDTH = 64000; // 64 kbit/s

/**
 * Receives RTP/RTCP packets and generates RTCP RR packets.
 *
 * @param {object} args - class arguments.
 * @param {number} args.rtp_port - port to listen for RTP packets.
 * @param {number} args.rtcp_port - port to listen for RTCP packets.
 * @param {number} args.bandwidth - target audio bandwidth for our application.
 */
class Receiver {
    constructor(args={}) {
        this.rtp_port = args.rtp_port || DEFAULT_RTP_PORT;
        this.rtcp_port = args.rtcp_port || DEFAULT_RTCP_PORT;
        this.bandwidth = args.bandwidth || DEFAULT_BANDWIDTH;

        // True if we have not yet sent an RTCP packet
        this.initial = true;

        // Our synchronization source identifier
        this.ssrc = Math.floor(Math.random() * (SEQ_MOD - 1));

        // Average calculated RTCP packet size both sent and received
        this.avg_rtcp_size = 0;

        // RTCP packet sizes used to calculate avg_rtcp_size
        this.rtcp_sizes = [];

        // Holds information about our sender
        this.source = null;

        // Holds our sender's source transport address
        this.rinfo = null;

        // The handle for our report timer
        this.timer = null;

        // The handle for our RTP socket
        this.rtp_socket = null;

        // The handle for our RTCP socket
        this.rtcp_socket = null;
    }

    /**
     * Get the RTCP report interval.
     */
    get interval() {
        return rtcpInterval({
            // Assume that we are one of two session members
            members: 2,

            // Assume that the other member is a sender.
            senders: 1,

            // Suggested value is 5% of RTP bandwidth
            rtcp_bw: this.bandwidth * 0.5,

            // We are never sending RTP packets
            we_sent: false,

            // The average size of RTCP packets (both sent and received)
            avg_rtcp_size: this.avg_rtcp_size,

            // This flag will be cleared on our first send
            initial: this.initial,
        });
    }

    /**
     * Update the avg_rtcp_size.
     *
     * @param {Number} size - size of an incoming/outgoing RTCP packet.
     */
    update_avg_size(size) {
        size += 28; // Estimated size of IPv4 + UDP headers

        this.rtcp_sizes.push(size);
        if(this.rtcp_sizes.length > 16)
            this.rtcp_sizes.shift();

        let total = 0;
        for(let i = 0; i < this.rtcp_sizes.length; ++i)
            total += this.rtcp_sizes[i];

        this.avg_rtcp_size = total / this.rtcp_sizes.length;
    }

    /**
     * Generate an RTCP RR packet and reschedule the timer.
     */
    send_report() {
        if(!this.source) {
            // No sender data yet, just reschedule
            this.timer = setTimeout(() => this.send_report(), this.interval);
            return;
        }

        // Update the lost packet count
        this.source.updateLost();

        // Generate a report on our source
        const report = this.source.toReport(new Date());
        console.log(report);

        // Send our report
        const packet = new RrPacket();
        packet.ssrc = this.ssrc;
        packet.addReport(report);

        const data = packet.serialize();
        this.rtcp_socket.send(data, this.rinfo.port, this.rinfo.address);
        this.update_avg_size(data.length);

        // Clear 'initial' flag
        this.initial = false;

        this.timer = setTimeout(() => this.send_report(), this.interval);
    }

    /**
     * Start receiving packets.
     */
    start() {
        // Bind our sockets
        this.rtp_socket = createSocket('udp4');
        this.rtp_socket.on('error', () => { /* ignore */ });
        this.rtp_socket.on('message', this.onRtp.bind(this));
        this.rtp_socket.bind(this.rtp_port);

        this.rtcp_socket = createSocket('udp4');
        this.rtcp_socket.on('error', () => { /* ignore */ });
        this.rtcp_socket.on('message', this.onRtcp.bind(this));
        this.rtcp_socket.bind(this.rtcp_port);

        // Schedule our first report
        this.timer = setTimeout(() => this.send_report(), this.interval);
    }

    /**
     * Stop receiving packets.
     */
    stop() {
        this.rtp_socket.close();
        this.rtcp_socket.close();
        clearTimeout(this.timer);
    }

    /**
     * Called on receiving a new RTP packet.
     *
     * @param {Buffer} data - packet data.
     * @param {RemoteInfo} rinfo - remote address info.
     */
    onRtp(data, rinfo) {
        // Parse the packet
        const packet = new RtpPacket(data);

        if(!this.source || this.source.id != packet.ssrc)
            this.source = new Source(packet.ssrc);

        this.source.updateSeq(packet.seq);
        this.rinfo = rinfo;
    }

    /**
     * Called on receiving a new RTCP packet.
     *
     * @param {Buffer} data - packet data.
     */
    onRtcp(data) {
        const packet = parse(data);
        if(packet)
            this.update_avg_size(packet.size);

        if(packet.type == PacketType.SR) {
            if(!this.source || this.source.id != packet.ssrc)
                return;

            // Update our LSR timestamp
            this.source.updateLsr(packet.ntp_sec, packet.ntp_frac);
        }
    }
};

if(require.main === module) {
    const receiver = new Receiver();
    receiver.start();
}

module.exports=exports=Receiver;