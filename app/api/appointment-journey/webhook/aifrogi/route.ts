import { NextResponse } from "next/server";
import {
  parseAppointmentInboundEvent,
  validateAppointmentSignature
} from "@/lib/appointment-journey-contract";
import { processAppointmentInboundEvent } from "@/lib/appointment-journey-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = validateAppointmentSignature({
    rawBody,
    signatureHeader: request.headers.get("x-aifrogi-signature") || request.headers.get("x-appointment-signature")
  });
  if (!signature.ok) return NextResponse.json({ error: signature.error }, { status: signature.status });

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid Appointment Journey JSON payload" }, { status: 400 });
  }

  let event;
  try {
    event = parseAppointmentInboundEvent(payload);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid appointment event" }, { status: 400 });
  }

  const result = await processAppointmentInboundEvent(event);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, result: result.result }, { status: result.status });
}
