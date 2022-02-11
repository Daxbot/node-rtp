const chai = require('chai');
const { SdesPacket } = require('..');

const expect = chai.expect;

describe('SdesPacket', function() {
    it('should be constructable', function() {
        new SdesPacket();
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