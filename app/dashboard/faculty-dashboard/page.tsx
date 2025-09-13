"use client";

import React, { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import Image from "next/image";

type LeaveRequest = {
  id: string;
  studentName: string;
  registrationNumber: string;
  date: string; // YYYY-MM-DD
  reason: string;
  type: "medical" | "personal" | "other";
  status: "pending" | "approved" | "rejected";
};

type MarkedStudent = {
  id: string;
  name: string;
  registrationNumber: string;
  markedAt: string; // time string
};

type TimetableEntry = {
  id: string;
  day: string; // Mon, Tue, ...
  hour: string; // 09:00 - 10:00
  subject: string;
  room: string;
};

enum TabKey {
  Leaves = "leaves",
  Attendance = "attendance",
  Timetable = "timetable",
  Mentees = "mentees",
}

function generateOtp(length = 6): string {
  const digits = "0123456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += digits[Math.floor(Math.random() * digits.length)];
  }
  return result;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPeriodKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  // Period granularity: per hour. Adjust if your backend defines periods differently
  return `${yyyy}-${mm}-${dd}@${hour}`;
}

export default function FacultyDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>(TabKey.Leaves);

  // State for real data
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [facultyId, setFacultyId] = useState<string>('');

  const [otp, setOtp] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [qrValue, setQrValue] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: "user" | "assistant"; content: string }>>([
    { id: "m1", role: "assistant", content: "Hi! How can I help you today?" },
  ]);
  const [markedStudents, setMarkedStudents] = useState<MarkedStudent[]>([]);
  const [otpExpiresIn, setOtpExpiresIn] = useState<number>(0); // seconds remaining
  const [otpExpirationAt, setOtpExpirationAt] = useState<number | null>(null);
  const [currentPeriodKey, setCurrentPeriodKey] = useState<string>(getPeriodKey(new Date()));
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Load faculty data on component mount
  useEffect(() => {
    const loadFacultyData = async () => {
      try {
        // Get faculty ID from localStorage or session
        const user = localStorage.getItem('user');
        if (user) {
          const userData = JSON.parse(user);
          if (userData.userType === 'faculty') {
            setFacultyId(userData.id);
            
            // Load leave requests
            const leavesResponse = await fetch(`/api/faculty/leaves?facultyId=${userData.id}&status=pending`);
            const leavesData = await leavesResponse.json();
            if (leavesData.success) {
              setLeaves(leavesData.data.map((leave: any) => ({
                id: leave._id,
                studentName: leave.studentName,
                registrationNumber: leave.registrationNumber,
                date: leave.date,
                reason: leave.reason,
                type: leave.type,
                status: leave.status
              })));
            }
          }
        }
      } catch (error) {
        console.error('Error loading faculty data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFacultyData();
  }, []);

  const timetable: TimetableEntry[] = useMemo(
    () => [
      { id: "TT1", day: "Mon", hour: "09:00-10:00", subject: "DBMS", room: "A-201" },
      { id: "TT2", day: "Mon", hour: "11:00-12:00", subject: "OS", room: "Lab-2" },
      { id: "TT3", day: "Tue", hour: "10:00-11:00", subject: "CN", room: "A-105" },
      { id: "TT4", day: "Wed", hour: "14:00-15:00", subject: "ML", room: "A-301" },
      { id: "TT5", day: "Thu", hour: "09:00-10:00", subject: "SE", room: "A-101" },
      { id: "TT6", day: "Fri", hour: "13:00-14:00", subject: "DBMS", room: "A-201" },
    ],
    []
  );

  async function handleLeaveAction(id: string, next: "approved" | "rejected"): Promise<void> {
    try {
      const response = await fetch('/api/faculty/leaves', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveId: id,
          status: next,
          facultyId: facultyId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setLeaves((curr: LeaveRequest[]) => curr.map((l: LeaveRequest) => (l.id === id ? { ...l, status: next } : l)));
      } else {
        console.error('Error updating leave:', data.error);
      }
    } catch (error) {
      console.error('Error updating leave:', error);
    }
  }

  async function handleGenerateOtpAndQr(): Promise<void> {
    // Clear previous messages
    setError("");
    setSuccess("");
    
    // Use demo faculty ID if no real faculty ID is available
    // Generate a valid ObjectId for demo purposes
    const currentFacultyId = facultyId || "507f1f77bcf86cd799439011"; // Valid ObjectId format
    
    if (!currentFacultyId) {
      setError("Faculty ID not available. Please log in again.");
      return;
    }

    const sid = `SID-${Date.now()}`;
    setSessionId(sid);
    
    // Determine if we're still in the same period; if not, reset the list for the new period
    const now = new Date();
    const nextPeriodKey = getPeriodKey(now);
    setCurrentPeriodKey((prev) => {
      if (prev !== nextPeriodKey) {
        setMarkedStudents([]);
      }
      return nextPeriodKey;
    });

    setIsGenerating(true);
    setQrValue("");
    setOtpExpirationAt(null);
    setOtpExpiresIn(0);
    
    // Show immediate feedback
    setTimeout(() => {
      if (isGenerating) {
        setSuccess("Generating OTP and QR code...");
      }
    }, 100);
    
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const res = await fetch("/api/faculty/otp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId: sid, 
          facultyId: currentFacultyId,
          ttlSeconds: 10 // 10 seconds
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to generate OTP`);
      }
      
      const data = await res.json();
      if (data.success && data.data) {
        setOtp(data.data.otp);
        setQrValue(JSON.stringify(data.data.payload));
        const expMs = data.data.expiresAt;
        if (expMs) {
          setOtpExpirationAt(expMs);
          const remainingSec = Math.max(0, Math.ceil((expMs - Date.now()) / 1000));
          setOtpExpiresIn(remainingSec);
          
          // Start countdown timer
          const interval = setInterval(() => {
            const newRemaining = Math.max(0, Math.ceil((expMs - Date.now()) / 1000));
            setOtpExpiresIn(newRemaining);
            if (newRemaining === 0) {
              clearInterval(interval);
            }
          }, 1000);
        }
        setSuccess("OTP and QR code generated successfully! Valid for 10 seconds.");
      } else {
        throw new Error(data.error || "Invalid response from server");
      }
    } catch (error) {
      console.error('Error generating OTP:', error);
      setError(error instanceof Error ? error.message : "Failed to generate OTP. Please check your connection and try again.");
      setQrValue("");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSendMessage(): void {
    const text = chatInput.trim();
    if (!text) return;
    const userMsg = { id: `u-${Date.now()}`, role: "user" as const, content: text };
    setChatMessages((curr) => [...curr, userMsg]);
    setChatInput("");
    // Mock assistant response
    setTimeout(() => {
      setChatMessages((curr) => [
        ...curr,
        { id: `a-${Date.now()}`, role: "assistant", content: "Thanks! I'll look into that." },
      ]);
    }, 400);
  }

  function handleMockMarkAttendance(): void {
    // Simulate a student marking attendance
    const demoNames = [
      ["Priya N", "21CSE012"],
      ["Karthik M", "21CSE033"],
      ["Sana A", "21CSE017"],
      ["Vikram S", "21CSE052"],
    ];
    const [name, reg] = demoNames[Math.floor(Math.random() * demoNames.length)];
    setMarkedStudents((curr: MarkedStudent[]) => {
      // Prevent duplicates (same registration number) within the period view
      const exists = curr.some((s) => s.registrationNumber === reg);
      if (exists) return curr;
      return [
        ...curr,
        { id: `${reg}-${Date.now()}`, name, registrationNumber: reg, markedAt: formatTime(new Date()) },
      ];
    });
  }

  const totalMarked = markedStudents.length;

  // Countdown effect for OTP expiration
  useEffect(() => {
    if (!otp || !otpExpirationAt) return;
    const tick = () => {
      const remainingMs = otpExpirationAt - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      setOtpExpiresIn(remainingSec);
      if (remainingSec <= 0) {
        setOtp("");
        setSessionId("");
        setOtpExpirationAt(null);
        setQrValue("");
      }
    };
    tick();
    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [otp, otpExpirationAt]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F4FF]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading faculty dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen p-0 sm:p-8 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(59,130,246,0.15)_0%,transparent_70%)] bg-[length:100%_100%] bg-no-repeat">
      {/* Mobile header */}
      <div className="sm:hidden bg-blue-600 text-white px-4 pt-6 pb-5 rounded-b-3xl shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center font-semibold">
              SANDHIYA
            </div>
            <div>
              <div className="uppercase text-xs/5 opacity-90">Hi</div>
              <div className="text-2xl font-bold tracking-wide">SANDHIYA</div>
              <div className="text-sm opacity-90">Here's your dashboard overview</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-0 pt-4 sm:pt-0 pb-24 sm:pb-0">
        {/* Header */}
        <header className="hidden sm:flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Hi, SANDHIYA</h1>
            <p className="text-sm/6 text-foreground/70">Faculty • Computer Science Department</p>
          </div>
        </header>

        {/* Desktop navigation to switch views */}
        <nav className="hidden sm:flex items-center gap-2 -mt-2">
          {([
            { key: "leaves", label: "Leaves" },
            { key: "attendance", label: "Attendance" },
            { key: "timetable", label: "Timetable" },
            { key: "mentees", label: "Mentees" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as TabKey)}
              className={`h-9 px-3 rounded-full border text-xs font-semibold transition ${
                activeTab === t.key
                  ? "bg-violet-600 border-violet-600 text-white"
                  : "bg-white border-gray-200 text-foreground hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {activeTab === TabKey.Leaves && (
          <section className="rounded-xl border border-black/10 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Pending Leave Requests</h2>
            </div>
            <div className="p-4 space-y-3">
              {leaves.length === 0 && (
                <div className="text-sm text-foreground/60">No leave requests</div>
              )}
              {leaves.map((leave: LeaveRequest) => {
                const cardColor =
                  leave.status === "approved"
                    ? "bg-emerald-50 border-emerald-200"
                    : leave.status === "rejected"
                    ? "bg-rose-50 border-rose-200"
                    : "bg-white border-gray-200";
                return (
                <div
                  key={leave.id}
                  className={`border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${cardColor}`}
                >
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">
                      {leave.studentName} <span className="text-foreground/60">({leave.registrationNumber})</span>
                    </div>
                    <div className="text-sm text-foreground/70">
                      {leave.type.toUpperCase()} • {leave.date}
                    </div>
                    <div className="text-sm text-foreground/60">{leave.reason}</div>
                    <div className="text-xs">
                      <span
                        className={
                          leave.status === "pending"
                            ? "text-amber-600"
                            : leave.status === "approved"
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }
                      >
                        Status: {leave.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-2 rounded-md text-sm bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 shadow-sm inline-flex items-center gap-2"
                      onClick={() => handleLeaveAction(leave.id, "approved")}
                      disabled={leave.status !== "pending"}
                      aria-label="Approve leave"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Approve
                    </button>
                    <button
                      className="px-3 py-2 rounded-md text-sm bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 shadow-sm inline-flex items-center gap-2"
                      onClick={() => handleLeaveAction(leave.id, "rejected")}
                      disabled={leave.status !== "pending"}
                      aria-label="Reject leave"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
              );})}
            </div>
          </section>
        )}

        {activeTab === TabKey.Attendance && (
          <section className="rounded-xl border border-violet-200 bg-white shadow-sm">
            <div className="p-4 border-b border-violet-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-violet-800">Attendance Session</h2>
                <p className="text-xs text-violet-600 mt-1">Generate OTP and QR code for student attendance</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="h-10 px-4 rounded-md text-sm font-medium inline-flex items-center gap-2 bg-violet-600 text-white hover:bg-violet-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleGenerateOtpAndQr}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4h4M16 4h4M4 20h4M16 20h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <rect x="8" y="8" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      Generate OTP & QR
                    </>
                  )}
                </button>
                <button
                  className="h-10 px-4 rounded-md text-sm font-medium border border-gray-300 text-foreground hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleMockMarkAttendance}
                  disabled={!otp}
                  title={!otp ? "Generate session first" : "Simulate a student marking attendance"}
                >
                  Test Attendance
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {(error || success) && (
              <div className="p-4 border-b border-gray-200">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                    <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                    <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-sm text-green-700">{success}</span>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Session Info */}
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-4 bg-gradient-to-br from-violet-50 to-purple-50">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-violet-600" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M3 9h18M8 4v16" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <h3 className="text-sm font-semibold text-violet-800">Session Details</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-violet-600 font-medium">Session ID</div>
                      <div className="text-sm font-mono text-violet-800">{sessionId || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-violet-600 font-medium">Current Period</div>
                      <div className="text-sm text-violet-800">{currentPeriodKey}</div>
                    </div>
                    <div>
                      <div className="text-xs text-violet-600 font-medium">Faculty ID</div>
                      <div className="text-sm font-mono text-violet-800">{facultyId || "Demo Mode"}</div>
                      {!facultyId && (
                        <div className="text-xs text-amber-600 mt-1">⚠️ Using demo faculty for testing</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* OTP Display */}
                <div className="rounded-lg border border-gray-200 p-4 bg-gradient-to-br from-emerald-50 to-green-50">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="16" r="1" fill="currentColor"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <h3 className="text-sm font-semibold text-emerald-800">One-Time Password</h3>
                  </div>
                  <div className="text-center">
                    {otp && otpExpiresIn > 0 && (
                      <div className="text-xs font-bold text-red-600 mb-2">
                        ⏰ Expires in {otpExpiresIn}s
                      </div>
                    )}
                    <div className="text-3xl font-mono tracking-widest text-emerald-800 bg-white rounded-lg p-3 border-2 border-emerald-200">
                      {otp || "------"}
                    </div>
                    <div className="text-xs text-emerald-600 mt-2">
                      Share this code with students
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="lg:col-span-2">
                <div className="rounded-lg border border-gray-200 p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h4M16 4h4M4 20h4M16 20h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <rect x="8" y="8" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <h3 className="text-sm font-semibold text-blue-800">QR Code</h3>
                  </div>
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                      {isGenerating && (
                        <div className="h-48 w-48 flex items-center justify-center">
                          <div className="text-center">
                            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                            </svg>
                            <span className="text-sm text-blue-600">Generating QR Code...</span>
                          </div>
                        </div>
                      )}
                      {!isGenerating && otp && qrValue && (
                        <QRCode 
                          size={192} 
                          value={qrValue} 
                          bgColor="#FFFFFF" 
                          fgColor="#111827" 
                          level="M"
                          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        />
                      )}
                      {!isGenerating && (!otp || !qrValue) && (
                        <div className="h-48 w-48 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                          <div className="text-center">
                            <svg className="h-12 w-12 text-gray-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none">
                              <path d="M4 4h4M16 4h4M4 20h4M16 20h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <rect x="8" y="8" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                            <span className="text-sm text-gray-500">Click Generate to create QR Code</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-center mt-3">
                    <p className="text-xs text-blue-600">
                      Students can scan this QR code or enter the OTP manually
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Marked Students */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <h3 className="text-sm font-semibold text-foreground">Attendance Records</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground/60">Total:</span>
                  <span className="text-sm font-semibold text-violet-600">{totalMarked}</span>
                </div>
              </div>
              <div className="space-y-2">
                {markedStudents.length === 0 && (
                  <div className="text-center py-8 text-sm text-foreground/60 bg-gray-50 rounded-lg border border-gray-200">
                    <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    No students marked yet
                  </div>
                )}
                {markedStudents.map((s: MarkedStudent) => (
                  <div key={s.id} className="flex items-center justify-between text-sm border border-gray-200 rounded-lg px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none">
                          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{s.name}</span>
                        <span className="text-foreground/60 ml-2">({s.registrationNumber})</span>
                      </div>
                    </div>
                    <div className="text-foreground/60">{s.markedAt}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === TabKey.Timetable && (
          <section className="rounded-xl border border-black/10 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Your Timetable</h2>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timetable.map((slot) => (
                <div key={slot.id} className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <div className="text-xs/5 text-foreground/60">{slot.day}</div>
                  <div className="mt-1 font-medium text-foreground">{slot.subject}</div>
                  <div className="text-sm text-foreground/60">{slot.hour}</div>
                  <div className="text-sm text-foreground/60">Room: {slot.room}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === TabKey.Mentees && (
          <section className="rounded-xl border border-black/10 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Your Mentees</h2>
            </div>
            <div className="p-4">
              <div className="text-sm text-foreground/60 mb-4">Connect this to your backend to fetch mentees from `Faculty.mentees`.</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3].map((i) => (
                  <div key={i} className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                    <div className="font-medium text-foreground">Mentee {i}</div>
                    <div className="text-sm text-foreground/60">Reg: 21CSE0{i}1</div>
                    <div className="text-sm text-foreground/60">Attendance: 92%</div>
                    <div className="text-sm text-foreground/60">GPA: 8.{i}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Bottom Navigation & FAB (mobile) */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 h-20">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <button
            onClick={() => setActiveTab(TabKey.Attendance)}
            className="h-14 w-14 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center"
            title="Attendance"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-around h-full px-6 text-[22px]">
          <button className={`${activeTab === TabKey.Leaves ? "text-violet-600" : "text-gray-400"} hover:text-violet-600`} onClick={() => setActiveTab(TabKey.Leaves)} aria-label="Leaves">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6"/><path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6"/><path d="M8 14l2.5 2.5L16 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="w-10" />
          <button className={`${activeTab === TabKey.Timetable ? "text-violet-600" : "text-gray-400"} hover:text-violet-600`} onClick={() => setActiveTab(TabKey.Timetable)} aria-label="Timetable">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M8 2v4M16 2v4M3 9h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><rect x="7" y="12" width="4" height="3" rx="0.5" fill="currentColor"/><rect x="13" y="12" width="4" height="3" rx="0.5" fill="currentColor" opacity=".5"/></svg>
          </button>
          <button className={`${activeTab === TabKey.Mentees ? "text-violet-600" : "text-gray-400"} hover:text-violet-600`} onClick={() => setActiveTab(TabKey.Mentees)} aria-label="Mentees">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="1.6"/><path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg grid place-items-center hover:bg-blue-700"
        onClick={() => setIsChatOpen(true)}
        aria-label="Open Chatbot"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12c0 4.418-4.03 8-9 8-1.06 0-2.07-.16-3-.46L3 20l1.07-3.2C3.4 15.55 3 13.82 3 12 3 7.582 7.03 4 12 4s9 3.582 9 8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="12" r="1" fill="currentColor"/>
          <circle cx="12" cy="12" r="1" fill="currentColor"/>
          <circle cx="15" cy="12" r="1" fill="currentColor"/>
        </svg>
      </button>

      {/* Chat Slide-over */}
      {isChatOpen && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsChatOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-medium">Chat Assistant</div>
              <button
                className="h-8 w-8 grid place-items-center rounded hover:bg-gray-100"
                onClick={() => setIsChatOpen(false)}
                aria-label="Close Chat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {chatMessages.map((m) => (
                <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                  <div
                    className={
                      m.role === "user"
                        ? "inline-block rounded-xl px-3 py-2 bg-blue-600 text-white"
                        : "inline-block rounded-xl px-3 py-2 bg-gray-100 text-gray-900"
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                />
                <button
                  className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                >
                  Send
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

