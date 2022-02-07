#include "rtp.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports)
{
    return RtpPacket::Init(env, exports);
}

NODE_API_MODULE(addon, InitAll)