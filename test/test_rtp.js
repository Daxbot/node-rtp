const chai = require('chai');
const { RtpPacket } = require('..');

const expect = chai.expect;
chai.use(require('chai-bytes'));

describe('RtpPacket', function() {
    it('should be constructable', function() {
        new RtpPacket(96);
    });

    it('should throw without parameters', function() {
        expect(() => new RtpPacket()).to.throw();
    });

    it('should be created with initialized values', function() {
        const pkt = new RtpPacket(96);
        expect(pkt.version).to.equal(2);
    });

    it('should accept a payload', function() {
        const pkt = new RtpPacket(96);
        const hdr_size = pkt.size;

        pkt.payload = Buffer.alloc(10);
        const buffer = pkt.serialize();

        expect(buffer.length).to.equal(hdr_size + 10);
    });

    it('should parse existing Buffers', function() {
        const pkt1 = new RtpPacket(96);
        pkt1.payload = Buffer.from([1, 2, 3, 4, 5]);
        const buffer = pkt1.serialize();

        const pkt2 = new RtpPacket(buffer);
        expect(buffer).to.equalBytes(pkt2.serialize());
    });
});