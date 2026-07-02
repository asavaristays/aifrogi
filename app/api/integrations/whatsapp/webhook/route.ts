import { NextResponse } from "next/server";
import {
  isValidMetaWebhookVerifyToken,
  processIncomingMetaWebhook,
  processIncomingTwilioWebhook,
  validateTwilioWebhookSignature
} from "@/lib/services/whatsapp-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe") {
    if (await isValidMetaWebhookVerifyToken(token)) {
      return new NextResponse(challenge ?? "", {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    }

    return NextResponse.json({ error: "Invalid Meta verify token" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    providers: ["META_CLOUD_API", "TWILIO_WHATSAPP"],
    message: "AiFrogi WhatsApp webhook endpoint is reachable"
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await request.json()) as Parameters<typeof processIncomingMetaWebhook>[0]["payload"] & {
      object?: string;
    };

    if (payload.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Unsupported Meta webhook payload" }, { status: 400 });
    }

    const result = await processIncomingMetaWebhook({ payload });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, result: result.result }, { status: result.status });
  }

  const rawBody = await request.text();
  const formData = new URLSearchParams(rawBody);
  const signatureHeader = request.headers.get("x-twilio-signature");
  const requestUrl = new URL(request.url);
  const host = request.headers.get("host");
  const forwardedHost = request.headers.get("x-forwarded-host") ?? host;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const envBaseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
  const pathWithSearch = `${requestUrl.pathname}${requestUrl.search}`;
  const pathOnly = requestUrl.pathname;

  const candidateUrls = Array.from(
    new Set(
      [
        request.url,
        requestUrl.toString(),
        envBaseUrl ? `${envBaseUrl}${pathWithSearch}` : null,
        envBaseUrl ? `${envBaseUrl}${pathOnly}` : null,
        forwardedHost && forwardedProto ? `${forwardedProto}://${forwardedHost}${pathWithSearch}` : null,
        forwardedHost && forwardedProto ? `${forwardedProto}://${forwardedHost}${pathOnly}` : null,
        forwardedHost ? `https://${forwardedHost}${pathWithSearch}` : null,
        forwardedHost ? `https://${forwardedHost}${pathOnly}` : null,
        forwardedHost ? `http://${forwardedHost}${pathWithSearch}` : null,
        forwardedHost ? `http://${forwardedHost}${pathOnly}` : null,
        host ? `https://${host}${pathWithSearch}` : null,
        host ? `https://${host}${pathOnly}` : null,
        host ? `http://${host}${pathWithSearch}` : null,
        host ? `http://${host}${pathOnly}` : null
      ].filter((value): value is string => Boolean(value))
    )
  );

  const isValid = await validateTwilioWebhookSignature({
    url: candidateUrls,
    params: formData,
    signatureHeader
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid Twilio signature" }, { status: 403 });
  }

  const result = await processIncomingTwilioWebhook({ formData });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: result.status,
    headers: {
      "Content-Type": "text/xml; charset=utf-8"
    }
  });
}
