const chai = require('chai');
const { SrPacket } = require('..');

const expect = chai.expect;

describe('SrPacket', function() {
    it('should be constructable', function() {
        new SrPacket();
    });

    it('should add reports', function() {
        const pkt = new SrPacket();

        pkt.addReport({
            ssrc: 0x1234,
            lost: 1.0,
        });

        expect(pkt.reports.length).to.equal(1);
        expect(pkt.reports[0].ssrc).to.equal(0x1234);
    });

    it('should remove reports', function() {
        const pkt = new SrPacket();

        pkt.addReport({ ssrc: 0x1234 });
        pkt.addReport({ ssrc: 0x5678 });
        pkt.addReport({ ssrc: 0x9ABC });

        expect(pkt.reports.length).to.equal(3);

        pkt.removeReport(0x1234);
        expect(pkt.reports.length).to.equal(2);

        for(let i = 0; i < pkt.reports.length; ++i)
            expect(pkt.reports[i].ssrc).to.not.equal(0x1234);
    });

    it('should support arbitrary extension data', function() {
        const pkt = new SrPacket();
        const start_size = pkt.size;

        const buffer = Buffer.from([1, 2, 3, 4]);

        pkt.ext = buffer;
        expect(pkt.ext).to.equalBytes(buffer);
        expect(pkt.size).to.be.greaterThan(start_size);

        const data = pkt.serialize();
        expect(buffer.compare(data, start_size, start_size + buffer.length)).to.equal(0);
    });
});