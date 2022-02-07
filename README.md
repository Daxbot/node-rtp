# Node-RTP

NodeJS wrapper for librtp

## Installation

To install this package using npm run the following:

    npm config set @daxbot:registry https://npm.pkg.github.com/
    npm install @daxbot/rtp

## Usage

```js
const { RtpPacket } = require("rtp");

// Creating a new RtpPacket
const pkt1 = new RtpPacket(96);
pkt1.payload = Buffer.alloc(10); // Add an empty 10 byte payload
const buffer = pkt1.serialize(); // <Buffer 80 ... >

// Parsing an existing Buffer
const pkt2 = new RtpPacket(buffer); // pkt2 == pkt1
```