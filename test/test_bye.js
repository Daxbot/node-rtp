const chai = require('chai');
const { ByePacket } = require('..');

const expect = chai.expect;

describe('ByePacket', function() {
    it('should be constructable', function() {
        new ByePacket();
    });

    it('should add sources', function() {
        const pkt = new ByePacket();

        pkt.addSource(0x1234);
        expect(pkt.sources[0]).to.equal(0x1234);
    });

    it('should remove sources', function() {
        const pkt = new ByePacket();

        pkt.addSource(0x1234);
        pkt.addSource(0x5678);
        pkt.addSource(0x9ABC);

        expect(pkt.sources.length).to.equal(3);
        expect(pkt.sources).to.include(0x5678);

        pkt.removeSource(0x5678);

        expect(pkt.sources.length).to.equal(2);
        expect(pkt.sources).to.not.include(0x5678);
    });

    it('should support arbitrary message data', function() {
        const pkt = new ByePacket();
        const start_size = pkt.size;

        const message = "this is a message";

        pkt.message = message;
        expect(pkt.message).to.equal(message);
        expect(pkt.size).to.be.greaterThan(start_size);

        const data = pkt.serialize().toString();
        expect(data.includes(message)).to.be.true;
    });
});