import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// In real app, load from process.env.QR_HMAC_SECRET
const HMAC_SECRET = process.env.QR_HMAC_SECRET || "dev-secret-change-me";

type GenerateBody = {
  sessionId: string;
  otp: string;
  facultyId?: string; // for mentee validation
  ttlSeconds?: number; // default 120
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateBody;
    const { sessionId, otp, facultyId } = body || {};
    const ttlSeconds = Math.max(5, Math.min(600, body?.ttlSeconds ?? 120));
    if (!sessionId || !otp) {
      return NextResponse.json({ error: "sessionId and otp are required" }, { status: 400 });
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const exp = nowSec + ttlSeconds;
    const iat = nowSec;

    const toSign = `${sessionId}|${otp}|${exp}|${iat}|${facultyId ?? ''}|v1`;
    const sig = crypto.createHmac("sha256", HMAC_SECRET).update(toSign).digest("hex");

    const payload = { v: 1, sessionId, otp, exp, iat, facultyId, sig };
    return NextResponse.json({ payload });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}


