const chai = require('chai');
const { SdesPacket, PacketType, parse } = require('..');

const expect = chai.expect;

describe('SdesPacket', function() {
    it('should be constructable', function() {
        const pkt = new SdesPacket();
        expect(pkt.version).to.equal(2);
        expect(pkt.type).to.equal(PacketType.SDES);
    });

    it('should be parsable', function() {
        const pkt1 = new SdesPacket();
        const pkt2 = parse(pkt1.serialize());
        expect(pkt2 instanceof SdesPacket).to.be.true;
        expect(pkt2.type).to.equal(PacketType.SDES);
    });

    it('should add sources', function() {
        const pkt = new SdesPacket();

        pkt.addSource({ ssrc: 0x1234 });

        expect(pkt.sources.length).to.equal(1);
        expect(pkt.sources[0].ssrc).to.equal(0x1234);
    });

    it('should remove sources', function() {
        const pkt = new SdesPacket();

        pkt.addSource({ ssrc: 0x1234 });
        pkt.addSource({ ssrc: 0x5678 });
        pkt.addSource({ ssrc: 0x9ABC });

        expect(pkt.sources.length).to.equal(3);

        pkt.removeSource(0x1234);
        expect(pkt.sources.length).to.equal(2);

        for(let i = 0; i < pkt.sources.length; ++i)
            expect(pkt.sources[i].ssrc).to.not.equal(0x1234);
    });
});