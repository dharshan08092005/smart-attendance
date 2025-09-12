import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const HMAC_SECRET = process.env.QR_HMAC_SECRET || "dev-secret-change-me";

type VerifyBody = {
  studentId: string; // MongoDB ObjectId string
  payload: {
    v: number;
    sessionId: string;
    otp: string;
    exp: number; // seconds since epoch
    iat?: number;
    facultyId?: string;
    sig: string; // hex
  };
};

// Simple in-memory idempotency guard for dev: prevents duplicate marks during server lifetime
const seenMarks = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const { studentId, payload } = (await req.json()) as VerifyBody;
    if (!studentId || !payload) {
      return NextResponse.json({ error: "studentId and payload are required" }, { status: 400 });
    }

    const { v, sessionId, otp, exp, iat, facultyId, sig } = payload;
    if (v !== 1) return NextResponse.json({ error: "Unsupported payload version" }, { status: 400 });
    if (!sessionId || !otp || !exp || !sig) {
      return NextResponse.json({ error: "Invalid payload fields" }, { status: 400 });
    }

    // Check expiry
    const nowSec = Math.floor(Date.now() / 1000);
    if (exp < nowSec) {
      return NextResponse.json({ ok: false, error: "QR expired" }, { status: 400 });
    }

    // Verify signature
    const toSign = `${sessionId}|${otp}|${exp}|${iat ?? 0}|${facultyId ?? ''}|v1`;
    const expectedSig = crypto.createHmac("sha256", HMAC_SECRET).update(toSign).digest("hex");
    if (!timingSafeEqualHex(sig, expectedSig)) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 400 });
    }

    // TODO: DB check: ensure the student belongs to the faculty (mentee or assigned)
    // e.g., find Student by studentId, ensure Student.facultyId equals facultyId.
    // If not, return 403

    // Idempotency: prevent duplicate markings for same student-session
    const dedupeKey = `${studentId}|${sessionId}`;
    if (seenMarks.has(dedupeKey)) {
      return NextResponse.json({ ok: true, alreadyMarked: true });
    }
    seenMarks.add(dedupeKey);

    // TODO: Integrate with DB
    // 1) Find ClassSession by sessionId, ensure active and otp matches if required
    // 2) Upsert Attendance { studentId, classSessionId, status: 'present', method: 'qr' }
    // 3) Optionally compute attendance percentage

    return NextResponse.json({ ok: true, sessionId, studentId });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}


