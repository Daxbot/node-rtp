const chai = require('chai');
const { AppPacket } = require('..');

const expect = chai.expect;
chai.use(require('chai-bytes'));

describe('AppPacket', function() {
    it('should be constructable', function() {
        new AppPacket();
    });

    it('should support arbitrary app data', function() {
        const pkt = new AppPacket();
        const start_size = pkt.size;

        const buffer = Buffer.from([1, 2, 3, 4, 5]);

        pkt.data = buffer;
        expect(pkt.data).to.equalBytes(buffer);
        expect(pkt.size).to.be.greaterThan(start_size);

        const data = pkt.serialize();
        expect(buffer.compare(data, start_size, start_size + buffer.length)).to.equal(0);
    });
});