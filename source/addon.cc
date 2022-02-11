#include "app.h"
#include "bye.h"
#include "rr.h"
#include "rtp.h"
#include "sdes.h"
#include "sr.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports)
{
    AppPacket::Init(env, exports);
    ByePacket::Init(env, exports);
    RrPacket::Init(env, exports);
    RtpPacket::Init(env, exports);
    SdesPacket::Init(env, exports);
    SrPacket::Init(env, exports);

    return exports;
}

NODE_API_MODULE(addon, InitAll)