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
    if (!facultyId) {
      console.error('Faculty ID not available');
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
    
    try {
      const res = await fetch("/api/faculty/otp/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId: sid, 
          facultyId: facultyId,
          ttlSeconds: 300 // 5 minutes
        }),
      });
      
      if (!res.ok) throw new Error("Failed to generate OTP");
      
      const data = await res.json();
      if (data.success && data.data) {
        setOtp(data.data.otp);
        setQrValue(JSON.stringify(data.data.payload));
        const expMs = data.data.expiresAt;
        if (expMs) {
          setOtpExpirationAt(expMs);
          const remainingSec = Math.max(0, Math.ceil((expMs - Date.now()) / 1000));
          setOtpExpiresIn(remainingSec);
        }
      }
    } catch (error) {
      console.error('Error generating OTP:', error);
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
    <div className="min-h-screen flex flex-col bg-[#F6F4FF] text-gray-900">
      {/* Purple themed header */}
      <header className="px-4 py-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-white/40">
            <Image src="/faculty.svg" alt="Faculty" width={40} height={40} priority />
          </div>
          <div>
            <div className="text-sm/4 opacity-90">Hi SANDHIYA,</div>
            <h1 className="text-lg font-semibold">Here's your dashboard overview</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24">
        {activeTab === TabKey.Leaves && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Leave Requests</h2>
            <div className="space-y-3">
              {leaves.length === 0 && (
                <div className="text-sm text-gray-500">No leave requests</div>
              )}
              {leaves.map((leave: LeaveRequest) => {
                const cardColor =
                  leave.status === "approved"
                    ? "bg-green-50 border-green-200"
                    : leave.status === "rejected"
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-gray-200";
                return (
                <div
                  key={leave.id}
                  className={`border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${cardColor}`}
                >
                  <div className="space-y-1">
                    <div className="font-medium">
                      {leave.studentName} <span className="text-gray-500">({leave.registrationNumber})</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      {leave.type.toUpperCase()} • {leave.date}
                    </div>
                    <div className="text-sm text-gray-600">{leave.reason}</div>
                    <div className="text-xs">
                      <span
                        className={
                          leave.status === "pending"
                            ? "text-amber-600"
                            : leave.status === "approved"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        Status: {leave.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-2 rounded-md text-sm bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 shadow-sm inline-flex items-center gap-2"
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
                      className="px-3 py-2 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 shadow-sm inline-flex items-center gap-2"
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
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-lg font-semibold">Generate OTP + QR</h2>
              <div className="flex gap-2">
                <button
                  className="px-3 py-2 rounded-md border text-sm bg-blue-600 text-white"
                  onClick={handleGenerateOtpAndQr}
                >
                  Generate
                </button>
                <button
                  className="px-3 py-2 rounded-md border text-sm"
                  onClick={handleMockMarkAttendance}
                  disabled={!otp}
                  title={!otp ? "Generate session first" : "Simulate a student marking"}
                >
                  Mock Mark Attendance
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-xl p-4 space-y-2 bg-white">
                <div className="text-sm text-gray-500">Session</div>
                <div className="text-sm">{sessionId || "—"}</div>
                <div className="text-xs text-gray-500">Period: {currentPeriodKey}</div>
                <div className="text-sm text-gray-500 mt-2">OTP</div>
                {otp && otpExpiresIn > 0 && (
                  <div className="text-xs font-bold text-red-600">Expires in {otpExpiresIn}s</div>
                )}
                <div className="text-2xl font-mono tracking-widest">{otp || "------"}</div>
              </div>

              <div className="border rounded-xl p-4 md:col-span-2 bg-white">
                <div className="text-sm text-gray-500 mb-2">QR Code</div>
                <div className="h-48 w-48 grid place-items-center text-gray-800">
                  {isGenerating && (
                    <span className="text-sm text-gray-500">Generating…</span>
                  )}
                  {!isGenerating && otp && qrValue && (
                    <QRCode size={192} value={qrValue} bgColor="#FFFFFF" fgColor="#111827" level="M" />
                  )}
                  {!isGenerating && (!otp || !qrValue) && (
                    <span className="text-sm text-gray-500">Generate to view</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border rounded-xl p-4 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Marked Students</h3>
                <div className="text-sm text-gray-600">Total: {totalMarked}</div>
              </div>
              <div className="mt-3 space-y-2">
                {markedStudents.length === 0 && (
                  <div className="text-sm text-gray-500">No students marked yet</div>
                )}
                {markedStudents.map((s: MarkedStudent) => (
                  <div key={s.id} className="flex items-center justify-between text-sm border rounded-md px-3 py-2">
                    <div>
                      <span className="font-medium">{s.name}</span>
                      <span className="text-gray-500"> ({s.registrationNumber})</span>
                    </div>
                    <div className="text-gray-500">{s.markedAt}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === TabKey.Timetable && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Timetable</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timetable.map((slot) => (
                <div key={slot.id} className="border rounded-xl p-4 bg-white">
                  <div className="text-xs text-gray-500">{slot.day}</div>
                  <div className="font-medium">{slot.subject}</div>
                  <div className="text-sm text-gray-600">{slot.hour}</div>
                  <div className="text-sm text-gray-600">Room: {slot.room}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === TabKey.Mentees && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Mentees</h2>
            <div className="text-sm text-gray-600">Connect this to your backend to fetch mentees from `Faculty.mentees`.</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1,2,3].map((i) => (
                <div key={i} className="border rounded-xl p-4 bg-white">
                  <div className="font-medium">Mentee {i}</div>
                  <div className="text-sm text-gray-600">Reg: 21CSE0{i}1</div>
                  <div className="text-sm text-gray-600">Attendance: 92%</div>
                  <div className="text-sm text-gray-600">GPA: 8.{i}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

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

      {/* Bottom Navigation with professional icons and centered FAB */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-200">
        <div className="relative max-w-4xl mx-auto h-16 flex items-center justify-between px-8">
          {/* Left: Leaves */}
          <button
            className={`flex flex-col items-center justify-center text-xs ${
              activeTab === TabKey.Leaves ? "text-blue-600" : "text-gray-600"
            }`}
            onClick={() => setActiveTab(TabKey.Leaves)}
            aria-label="Leaves"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 14l2.5 2.5L16 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="mt-1">Leaves</span>
          </button>

          {/* Center: Floating Attendance action */}
          <button
            className={`absolute left-1/2 -translate-x-1/2 -translate-y-6 h-14 w-14 rounded-full shadow-lg grid place-items-center text-white ${
              activeTab === TabKey.Attendance ? "bg-blue-600" : "bg-blue-600"
            }`}
            onClick={() => setActiveTab(TabKey.Attendance)}
            aria-label="Attendance"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Right: Timetable */}
          <button
            className={`flex flex-col items-center justify-center text-xs ${
              activeTab === TabKey.Timetable ? "text-blue-600" : "text-gray-600"
            }`}
            onClick={() => setActiveTab(TabKey.Timetable)}
            aria-label="Timetable"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 2v4M16 2v4M3 9h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="7" y="12" width="4" height="3" rx="0.5" fill="currentColor"/>
              <rect x="13" y="12" width="4" height="3" rx="0.5" fill="currentColor" opacity=".5"/>
            </svg>
            <span className="mt-1">Timetable</span>
          </button>

          {/* Far Right: Mentees */}
          <button
            className={`flex flex-col items-center justify-center text-xs ${
              activeTab === TabKey.Mentees ? "text-blue-600" : "text-gray-600"
            }`}
            onClick={() => setActiveTab(TabKey.Mentees)}
            aria-label="Mentees"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="mt-1">Mentees</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

