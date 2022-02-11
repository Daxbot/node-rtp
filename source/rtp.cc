#include "rtp.h"

Napi::Object RtpPacket::Init(Napi::Env env, Napi::Object exports)
{
    Napi::Function func = DefineClass(env, "RtpPacket", {
        InstanceMethod<&RtpPacket::Serialize>("serialize", napi_enumerable),
        InstanceAccessor<&RtpPacket::GetSize>("size", napi_enumerable),
        InstanceAccessor<&RtpPacket::GetVersion, &RtpPacket::SetVersion>("version", napi_enumerable),
        InstanceAccessor<&RtpPacket::GetPadding, &RtpPacket::SetPadding>("p", napi_enumerable),
        InstanceAccessor<&RtpPacket::GetExtension, &RtpPacket::SetExtension>("x", napi_enumerable),
        InstanceAccessor<&RtpPacket::GetCsrcCount, &RtpPacket::SetCsrcCount>("cc", napi_enumerable),
        InstanceAccessor<&RtpPacket::GetMarker, &RtpPacket::SetMarker>("m", napi_enumerable),
        InstanceAccessor<&RtpPacket::GetType, &RtpPacket::SetType>("pt", napi_enumerable),
        InstanceAccessor<&RtpPacket::GetSequence, &RtpPacket::SetSequence>("seq", napi_enumerable),
        InstanceAccessor<&RtpPacket::GetTimestamp, &RtpPacket::SetTimestamp>("ts", napi_enumerable),
        InstanceAccessor<&RtpPacket::GetSsrc, &RtpPacket::SetSsrc>("ssrc", napi_enumerable),
        InstanceAccessor<&RtpPacket::GetPayload, &RtpPacket::SetPayload>("payload", napi_enumerable),
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("RtpPacket", func);
    return exports;
}

RtpPacket::RtpPacket(const Napi::CallbackInfo& info) : ObjectWrap(info)
{
    Napi::Env env = info.Env();

    if(info.Length() < 1 || !(info[0].IsNumber() || info[0].IsBuffer())) {
        auto e = Napi::TypeError::New(env,
            "Must provide either a packet type (Number) or a Buffer");

        e.ThrowAsJavaScriptException();
    }

    packet = rtp_packet_create();
    if(!packet) {
        auto e = Napi::Error::New(env, "Failed to allocate memory");
        e.ThrowAsJavaScriptException();
    }

    if(info[0].IsNumber()) {
        // Packet type
        const unsigned int pt = info[0].As<Napi::Number>();
        if(pt < 0 || pt > 0x7f) {
            auto e = Napi::RangeError::New(env,
                "Packet type must be in range [0-127]");

            rtp_packet_free(packet);
            packet = nullptr;

            e.ThrowAsJavaScriptException();
        }
        else {
            rtp_packet_init(packet, pt);
        }
    }
    else {
        // Buffer
        auto buffer = info[0].As<Napi::Uint8Array>();
        if(rtp_packet_parse(packet, buffer.Data(), buffer.ElementLength()) != 0) {
            auto e = Napi::Error::New(env, "Failed to parse Buffer");

            rtp_packet_free(packet);
            packet = nullptr;

            e.ThrowAsJavaScriptException();
        }
    }
}

RtpPacket::~RtpPacket()
{
    if(packet)
        rtp_packet_free(packet);
}

Napi::Value RtpPacket::Serialize(const Napi::CallbackInfo &info)
{
    auto buffer = Napi::Buffer<uint8_t>::New(info.Env(), rtp_packet_size(packet));
    rtp_packet_serialize(packet, buffer.Data(), buffer.Length());

    return buffer;
}

Napi::Value RtpPacket::GetSize(const Napi::CallbackInfo &info)
{
    return Napi::Number::New(info.Env(), rtp_packet_size(packet));
}

Napi::Value RtpPacket::GetVersion(const Napi::CallbackInfo &info)
{
    return Napi::Number::New(info.Env(), packet->header->version);
}

Napi::Value RtpPacket::GetPadding(const Napi::CallbackInfo &info)
{
    return Napi::Boolean::New(info.Env(), packet->header->p);
}

Napi::Value RtpPacket::GetExtension(const Napi::CallbackInfo &info)
{
    return Napi::Boolean::New(info.Env(), packet->header->x);
}

Napi::Value RtpPacket::GetCsrcCount(const Napi::CallbackInfo &info)
{
    return Napi::Number::New(info.Env(), packet->header->cc);
}

Napi::Value RtpPacket::GetMarker(const Napi::CallbackInfo &info)
{
    return Napi::Boolean::New(info.Env(), packet->header->m);
}

Napi::Value RtpPacket::GetType(const Napi::CallbackInfo &info)
{
    return Napi::Number::New(info.Env(), packet->header->pt);
}

Napi::Value RtpPacket::GetSequence(const Napi::CallbackInfo &info)
{
    return Napi::Number::New(info.Env(), packet->header->seq);
}

Napi::Value RtpPacket::GetTimestamp(const Napi::CallbackInfo &info)
{
    return Napi::Number::New(info.Env(), packet->header->ts);
}

Napi::Value RtpPacket::GetSsrc(const Napi::CallbackInfo &info)
{
    return Napi::Number::New(info.Env(), packet->header->ssrc);
}

Napi::Value RtpPacket::GetPayload(const Napi::CallbackInfo &info)
{
    auto buffer = Napi::Buffer<uint8_t>::New(info.Env(), packet->payload_size);
    memcpy(buffer.Data(), packet->payload_data, buffer.Length());

    return buffer;
}

void RtpPacket::SetVersion(const Napi::CallbackInfo &info, const Napi::Value &value)
{
    packet->header->version = value.As<Napi::Number>();
}

void RtpPacket::SetPadding(const Napi::CallbackInfo &info, const Napi::Value &value)
{
    packet->header->p = value.As<Napi::Boolean>();
}

void RtpPacket::SetExtension(const Napi::CallbackInfo &info, const Napi::Value &value)
{
    packet->header->x = value.As<Napi::Boolean>();
}

void RtpPacket::SetCsrcCount(const Napi::CallbackInfo &info, const Napi::Value &value)
{
    packet->header->cc = value.As<Napi::Number>();
}

void RtpPacket::SetMarker(const Napi::CallbackInfo &info, const Napi::Value &value)
{
    packet->header->m = value.As<Napi::Boolean>();
}

void RtpPacket::SetType(const Napi::CallbackInfo &info, const Napi::Value &value)
{
    packet->header->pt = value.As<Napi::Number>();
}

void RtpPacket::SetSequence(const Napi::CallbackInfo &info, const Napi::Value &value)
{
    packet->header->seq = value.As<Napi::Number>();
}

void RtpPacket::SetTimestamp(const Napi::CallbackInfo &info, const Napi::Value &value)
{
    packet->header->ts = value.As<Napi::Number>();
}

void RtpPacket::SetSsrc(const Napi::CallbackInfo &info, const Napi::Value &value)
{
    packet->header->ssrc = value.As<Napi::Number>();
}

void RtpPacket::SetPayload(const Napi::CallbackInfo &info, const Napi::Value &value)
{
    if(value.IsNull()) {
        rtp_packet_clear_payload(packet);
        return;
    }

    auto buffer = value.As<Napi::Uint8Array>();
    rtp_packet_set_payload(packet, buffer.Data(), buffer.ElementLength());
}
