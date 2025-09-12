"use client";

import { useRef, useState } from "react";
import AIAttendancePredictor from "../../../components/AIAttendancePredictor";
type ObjectId = string;

type Subject = {
  _id: ObjectId;
  name: string;
  code: string;
  type: "theory" | "practical";
};

type Faculty = {
  _id: ObjectId;
  name: string;
  department: string;
  email: string;
};

type StudyPerformance = {
  subjectId: ObjectId;
  marks: number;
  timestamp: string;
};

type Student = {
  _id: ObjectId;
  name: string;
  registrationNumber: string;
  email: string;
  facultyId?: ObjectId;
  attendancePercentage: number;
  GPA: number;
  studyPerformance: StudyPerformance[];
};

type ClassSession = {
  _id: ObjectId;
  facultyId: ObjectId;
  subjectId: ObjectId;
  sessionDate: string; // YYYY-MM-DD
  sessionHour: number; // 0-23
  mode: "online" | "offline";
  sessionId: string;
  otp?: string;
};

type Attendance = {
  _id: ObjectId;
  studentId: ObjectId;
  classSessionId: ObjectId;
  attendanceDate: string; // ISO
  status: "present" | "absent";
  method: "otp" | "qr" | "manual";
};

type Leave = {
  _id: ObjectId;
  studentId: ObjectId;
  facultyId: ObjectId;
  leaveDate: string;
  reason: string;
  leaveType: "medical" | "personal" | "other";
  status: "pending" | "approved" | "rejected";
};

type EngagementPrediction = {
  _id: ObjectId;
  studentId: ObjectId;
  engagementRiskScore: number; // 0-1
  riskLevel: "High Risk" | "Low Risk";
  timestamp: string;
};

type PerformancePrediction = {
  _id: ObjectId;
  studentId: ObjectId;
  subjectId: ObjectId;
  predictedMark: number;
  trend: "Improving" | "Declining";
  confidenceScore: number; // 0-1
  timestamp: string;
};

function timeFromHour(hour: number) {
  const h = ((hour + 11) % 12) + 1;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:00 ${ampm}`;
}

function timeRangeFromHour(hour: number) {
  const start = timeFromHour(hour);
  const endHour = (hour + 1) % 24;
  const end = timeFromHour(endHour);
  return `${start} - ${end}`;
}

export default function StudentDashboardPage() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [activeView, setActiveView] = useState<"home" | "attendance" | "leave" | "profile" | "notifications" | "ai-predictions">("home");
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const calendarInputRef = useRef<HTMLInputElement | null>(null);
  const [leaveType, setLeaveType] = useState<string>("leave");
  const [leaves, setLeaves] = useState<Array<{ id: string; fromDate: string; fromTime: string; toDate: string; toTime: string; type: string; reason: string; status: "Pending" | "Mentor Approved" }>>([]);

  // Mock data shaped to your schemas
  const subjects: Subject[] = [
    { _id: "s1", name: "Data Structures", code: "CSE201", type: "theory" },
    { _id: "s2", name: "Operating Systems Lab", code: "CSE252", type: "practical" },
    { _id: "s3", name: "Discrete Mathematics", code: "MAT210", type: "theory" },
  ];

  const faculty: Faculty = {
    _id: "f1",
    name: "Dr. Priya Sharma",
    department: "Computer Science",
    email: "priya@university.edu",
  };

  const student: Student = {
    _id: "st1",
    name: "Rahul Kumar",
    registrationNumber: "REG2023CSE001",
    email: "rahul@university.edu",
    facultyId: faculty._id,
    attendancePercentage: 92,
    GPA: 8.6,
    studyPerformance: [
      { subjectId: "s1", marks: 82, timestamp: new Date().toISOString() },
      { subjectId: "s2", marks: 91, timestamp: new Date().toISOString() },
      { subjectId: "s3", marks: 76, timestamp: new Date().toISOString() },
    ],
  };

  const upcomingSessions: ClassSession[] = [];

  const attendances: Attendance[] = [];

  const pendingLeaves: Leave[] = [];

  const engagement: EngagementPrediction = {
    _id: "e1",
    studentId: student._id,
    engagementRiskScore: 0.23,
    riskLevel: "Low Risk",
    timestamp: new Date().toISOString(),
  };

  const perfPreds: PerformancePrediction[] = [
    { _id: "p1", studentId: student._id, subjectId: "s1", predictedMark: 84, trend: "Improving", confidenceScore: 0.9, timestamp: new Date().toISOString() },
    { _id: "p2", studentId: student._id, subjectId: "s3", predictedMark: 72, trend: "Declining", confidenceScore: 0.78, timestamp: new Date().toISOString() },
  ];

  const subjectById = new Map(subjects.map((s) => [s._id, s] as const));

  function generateSevenHourAttendance(dateISO: string) {
    // Mock: alternate present/absent based on date
    const seed = new Date(dateISO).getDate();
    return Array.from({ length: 7 }).map((_, idx) => (seed + idx) % 3 === 0 ? "absent" : "present") as Array<"present" | "absent">;
  }

  function computeHalfDayStatuses(dateISO: string) {
    const statuses = generateSevenHourAttendance(dateISO);
    const forenoonPresent = statuses.slice(0, 4).some((s) => s === "present");
    const afternoonPresent = statuses.slice(4).some((s) => s === "present");
    return {
      forenoon: forenoonPresent ? "present" : "absent",
      afternoon: afternoonPresent ? "present" : "absent",
    } as const;
  }

  return (
    <div className="font-sans min-h-screen p-0 sm:p-8 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(59,130,246,0.15)_0%,transparent_70%)] bg-[length:100%_100%] bg-no-repeat">
      {/* Mobile header */}
      <div className="sm:hidden bg-blue-600 text-white px-4 pt-6 pb-5 rounded-b-3xl shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center font-semibold">
              {student.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="uppercase text-xs/5 opacity-90">Hi</div>
              <div className="text-2xl font-bold tracking-wide">{student.name.toUpperCase()}</div>
              <div className="text-sm opacity-90">Here's your dashboard overview</div>
            </div>
          </div>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="h-9 w-9 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-sm"
            title="Open scanner"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 4h4M16 4h4M4 20h4M16 20h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <rect x="8" y="8" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-0 pt-4 sm:pt-0 pb-24 sm:pb-0">
        {/* Mobile "All Caught Up" card (kept subtle) */}
        {activeView === "home" && (
          <div className="sm:hidden -mt-6">
            <div className="mx-2 rounded-3xl bg-white shadow-sm p-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">✓</div>
              <div className="mt-3 text-xl font-semibold text-foreground">All Caught Up</div>
              <div className="text-sm text-foreground/60">No pending actions require your attention at this time.</div>
            </div>
          </div>
        )}
        {/* Header */}
        <header className="hidden sm:flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Hi, {student.name}</h1>
            <p className="text-sm/6 text-foreground/70">Reg No: {student.registrationNumber} • Advisor: {faculty.name}</p>
          </div>
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => setIsOtpOpen(true)}
              className="h-10 px-4 rounded-md text-sm font-medium inline-flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M4 4h4M16 4h4M4 20h4M16 20h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="8" y="8" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Scan / OTP
            </button>

            <div className="relative">
              <button
                aria-haspopup="dialog"
                aria-expanded={isProfileOpen}
                onClick={() => setIsProfileOpen((v) => !v)}
                className="h-10 w-10 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center select-none shadow-sm"
                title="Profile"
              >
                {student.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </button>

              {isProfileOpen && (
                <div
                  role="dialog"
                  className="absolute right-0 mt-2 w-72 rounded-xl border border-black/10 bg-white shadow-lg p-4 z-20"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                      {student.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="font-semibold">{student.name}</div>
                      <div className="text-xs/5 text-foreground/60">{student.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md border border-black/10 bg-white p-2">
                      <div className="text-xs/5 text-foreground/60">Reg No</div>
                      <div className="font-medium break-all">{student.registrationNumber}</div>
                    </div>
                    <div className="rounded-md border border-black/10 bg-white p-2">
                      <div className="text-xs/5 text-foreground/60">Advisor</div>
                      <div className="font-medium">{faculty.name}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="h-9 px-3 rounded-md border border-black/10 bg-white hover:bg-gray-50 text-xs font-medium transition">View Profile</button>
                    <button className="h-9 px-3 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700" onClick={() => setIsProfileOpen(false)}>Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Desktop navigation to switch views */}
        <nav className="hidden sm:flex items-center gap-2 -mt-2">
          {([
            { key: "home", label: "Home" },
            { key: "attendance", label: "Attendance" },
            { key: "ai-predictions", label: "AI Predictions" },
            { key: "leave", label: "Leave" },
            { key: "notifications", label: "Notifications" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveView(t.key)}
              className={`h-9 px-3 rounded-full border text-xs font-semibold transition ${
                activeView === t.key
                  ? "bg-violet-600 border-violet-600 text-white"
                  : "bg-white border-gray-200 text-foreground hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {activeView === "home" && (
          <section className="rounded-xl border border-black/10 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Semester Summary</h2>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <div className="text-xs/5 text-foreground/60">Overall Attendance</div>
                <div className="mt-1 text-2xl font-semibold text-foreground">{student.attendancePercentage}%</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <div className="text-xs/5 text-foreground/60">Total Working Days</div>
                <div className="mt-1 text-2xl font-semibold text-foreground">{90}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <div className="text-xs/5 text-foreground/60">Leaves Taken</div>
                <div className="mt-1 text-2xl font-semibold text-foreground">{leaves.length}</div>
              </div>
            </div>
          </section>
        )}

        {activeView === "home" && (
          <section className="lg:col-span-2 rounded-xl border border-black/10 bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Enrolled Courses</h2>
              <span className="text-xs/5 text-foreground/60">{subjects.length} Courses</span>
            </div>
            <div className="p-4">
              <div className="rounded-md border border-gray-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium text-foreground/80">Course</th>
                      <th className="px-3 py-2 font-medium text-foreground/80">Code</th>
                      <th className="px-3 py-2 font-medium text-foreground/80">Type</th>
                      <th className="px-3 py-2 font-medium text-foreground/80">Marks</th>
                      <th className="px-3 py-2 font-medium text-foreground/80">Prediction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subj) => {
                      const perf = student.studyPerformance.find((p) => p.subjectId === subj._id);
                      const pred = perfPreds.find((p) => p.subjectId === subj._id);
                      return (
                        <tr key={subj._id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-3 py-2">{subj.name}</td>
                          <td className="px-3 py-2">{subj.code}</td>
                          <td className="px-3 py-2 capitalize">{subj.type}</td>
                          <td className="px-3 py-2">{perf?.marks ?? "-"}</td>
                          <td className="px-3 py-2">
                            {pred ? (
                              <span>
                                {pred.predictedMark} ({pred.trend})
                                <span className="ml-1 text-foreground/60">{Math.round(pred.confidenceScore * 100)}%</span>
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Main content grid */}
        {/* Other views behind icons */}
        {activeView === "attendance" && (
          <section className="rounded-xl border border-violet-200 bg-white shadow-sm">
            <div className="p-4 border-b border-violet-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-violet-800">Attendance</h2>
              <form className="flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
                <label className="text-xs/5 text-foreground/60 hidden sm:inline">Date</label>
                <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full pl-2 pr-2 h-9">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="text-violet-700">
                    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M3 9h18M8 4v6" stroke="currentColor" strokeWidth="1.6"/>
                  </svg>
                  <input
                    ref={calendarInputRef}
                    type="date"
                    value={selectedAttendanceDate}
                    onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                    className="bg-transparent text-sm px-1 outline-none"
                    aria-label="Attendance date"
                  />
                </div>
              </form>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {generateSevenHourAttendance(selectedAttendanceDate).map((status, idx) => (
                <div key={idx} className={`rounded-xl border p-3 ${status === "present" ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold">Hour {idx + 1}</div>
                      <div className="text-xs/5 text-foreground/60">{new Date(selectedAttendanceDate).toLocaleDateString()}</div>
                    </div>
                    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold ${status === "present" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status === "present" ? "bg-emerald-600" : "bg-rose-600"}`} />
                      {status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeView === "leave" && (
          <section className="rounded-xl border border-black/10 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold">Apply Leave</h2>
            </div>
            <form
              className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget as HTMLFormElement);
                const fromDate = String(data.get("fromDate") || "");
                const toDate = String(data.get("toDate") || "");
                const fromTime = String(data.get("fromTime") || "");
                const toTime = String(data.get("toTime") || "");
                const reason = String(data.get("reason") || "").trim();
                const leaveTypeValue = String(data.get("leaveType") || "leave");
                const today = new Date();
                const from = new Date(`${fromDate}T${fromTime || "00:00"}`);
                const to = new Date(`${toDate}T${toTime || "00:00"}`);
                if (!fromDate || !toDate || !fromTime || !toTime || from < new Date(today.toDateString()) || to < from || !reason) {
                  alert("Invalid time: choose future dates, proper range, and add reason.");
                  return;
                }
                setLeaves((prev) => [
                  { id: String(Date.now()), fromDate, fromTime, toDate, toTime, type: leaveTypeValue, reason, status: "Pending" },
                  ...prev,
                ]);
                (e.currentTarget as HTMLFormElement).reset();
              }}
            >
              <div>
                <label className="text-xs/5 text-foreground/60">From Date</label>
                <input name="fromDate" type="date" required className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 text-sm" />
              </div>
              <div>
                <label className="text-xs/5 text-foreground/60">From Time</label>
                <input name="fromTime" type="time" required className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 text-sm" />
              </div>
              <div>
                <label className="text-xs/5 text-foreground/60">To Date</label>
                <input name="toDate" type="date" required className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 text-sm" />
              </div>
              <div>
                <label className="text-xs/5 text-foreground/60">To Time</label>
                <input name="toTime" type="time" required className="mt-1 w-full h-10 rounded-md border border-gray-300 px-3 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs/5 text-foreground/60">Type</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {[
                    { key: "onduty", label: "On Duty" },
                    { key: "leave", label: "Leave" },
                    { key: "special", label: "Special Permission" },
                  ].map((t) => (
                    <label
                      key={t.key}
                      onClick={() => setLeaveType(t.key)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition ${
                        leaveType === t.key
                          ? "bg-violet-600 border-violet-600 text-white"
                          : "bg-violet-50 border-violet-200 text-violet-700"
                      }`}
                    >
                      <input type="radio" name="leaveType" value={t.key} className="sr-only" checked={leaveType === t.key} readOnly />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs/5 text-foreground/60">Reason</label>
                <textarea name="reason" required rows={3} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Enter your reason" />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="reset" className="h-10 px-4 rounded-md border border-gray-300 text-sm">Clear</button>
                <button type="submit" className="h-10 px-4 rounded-md bg-violet-600 text-white text-sm font-semibold">Submit</button>
              </div>
            </form>

            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold mb-3">Your Leave Requests</h3>
              <div className="space-y-2">
                {leaves.map((lv) => (
                  <div key={lv.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{lv.type === "onduty" ? "On Duty" : lv.type === "special" ? "Special Permission" : "Leave"}</div>
                      <div className="text-xs/5 text-foreground/60">{lv.fromDate} {lv.fromTime} → {lv.toDate} {lv.toTime}</div>
                      <div className="text-xs/5 text-foreground/60">Reason: {lv.reason}</div>
                    </div>
                    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold ${lv.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {lv.status}
                    </span>
                  </div>
                ))}
                {leaves.length === 0 && (
                  <div className="text-xs/5 text-foreground/60">No leave requests yet.</div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeView === "ai-predictions" && (
          <AIAttendancePredictor studentId={student._id} targetPercentage={75} />
        )}

        {activeView === "notifications" && (
          <section className="rounded-xl border border-black/10 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-base font-semibold">Notifications</h2>
            </div>
            <ul className="p-4 space-y-3 text-sm">
              {[
                student.attendancePercentage < 75 ? `Attendance below 75%` : `Good attendance standing`,
                pendingLeaves.length ? `Leave request ${pendingLeaves[0].status}` : `No pending leaves`,
                `Advisor: ${faculty.name}`,
              ].map((msg, idx) => (
                <li key={idx} className="p-0">
                  <div className="flex overflow-hidden rounded-xl border border-violet-200">
                    <div className="w-1.5 bg-violet-600" />
                    <div className="flex-1 p-3 bg-violet-50/50">{msg}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeView === "home" && (
        <section className="rounded-xl border border-black/10 bg-white shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Attendance Overview</h2>
            <button
              onClick={() => setIsSessionsOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 text-white text-xs font-semibold px-3 py-1.5 hover:bg-violet-700"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-white" />
              Session-wise
            </button>
          </div>
          <div className="p-4 flex items-center gap-3">
            {(() => {
              const halves = computeHalfDayStatuses(new Date().toISOString().slice(0, 10));
              return (
                <>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    halves.forenoon === "present" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${halves.forenoon === "present" ? "bg-emerald-600" : "bg-rose-600"}`} />
                    Forenoon: {halves.forenoon.toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    halves.afternoon === "present" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${halves.afternoon === "present" ? "bg-emerald-600" : "bg-rose-600"}`} />
                    Afternoon: {halves.afternoon.toUpperCase()}
                  </span>
                </>
              );
            })()}
          </div>
        </section>
        )}

        {/* OTP Modal */}
        {isOtpOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-30 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/30" onClick={() => setIsOtpOpen(false)} />
            <div className="relative z-40 w-full max-w-md rounded-xl border border-black/10 bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">Scan OTP / Enter OTP</h3>
                <button className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50" onClick={() => setIsOtpOpen(false)} aria-label="Close">×</button>
              </div>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-foreground/70 bg-gray-50">
                  Camera preview placeholder. Implement QR/OTP scan here.
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    placeholder="Enter OTP"
                    className="h-10 flex-1 rounded-md border border-gray-300 px-3 text-sm bg-white placeholder:text-foreground/50"
                  />
                  <button className="h-10 px-4 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={() => {/* submit OTP handler */}}>Submit</button>
                </div>
                <div className="flex items-center justify-between text-xs/5 text-foreground/60">
                  <span>Method: scan via camera or enter manually</span>
                  <button className="underline" onClick={() => setOtpValue("")}>Clear</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Bottom Navigation & FAB (mobile) */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 h-20">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="h-14 w-14 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center"
            title="Scan"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 4h4M16 4h4M4 20h4M16 20h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <rect x="8" y="8" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-around h-full px-6 text-[22px]">
          <button className={`${"home" === activeView ? "text-violet-600" : "text-gray-400"} hover:text-violet-600`} onClick={() => setActiveView("home")} aria-label="Home">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className={`${"attendance" === activeView ? "text-violet-600" : "text-gray-400"} hover:text-violet-600`} onClick={() => setActiveView("attendance")} aria-label="Attendance">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M3 9h18M8 4v16" stroke="currentColor" strokeWidth="1.6"/></svg>
          </button>
          <button className={`${"ai-predictions" === activeView ? "text-violet-600" : "text-gray-400"} hover:text-violet-600`} onClick={() => setActiveView("ai-predictions")} aria-label="AI Predictions">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v15A2.5 2.5 0 0 0 9.5 22h5a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 14.5 2h-5Z" stroke="currentColor" strokeWidth="1.6"/><path d="M9 6h6M9 10h6M9 14h4" stroke="currentColor" strokeWidth="1.6"/></svg>
          </button>
          <button className={`${"leave" === activeView ? "text-violet-600" : "text-gray-400"} hover:text-violet-600`} onClick={() => setActiveView("leave")} aria-label="Leave">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 6a2 2 0 0 1 2-2h8.5a2 2 0 0 1 1.6.8L19 7.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z" stroke="currentColor" strokeWidth="1.6"/><path d="M10 3v6h6" stroke="currentColor" strokeWidth="1.6"/></svg>
          </button>
          <button className={`${"notifications" === activeView ? "text-violet-600" : "text-gray-400"} hover:text-violet-600`} onClick={() => setActiveView("notifications")} aria-label="Notifications">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 10a6 6 0 1 1 12 0v3.2l1.2 2.4c.36.72-.16 1.6-.96 1.6H5.76c-.8 0-1.32-.88-.96-1.6L6 13.2V10Z" stroke="currentColor" strokeWidth="1.6"/><path d="M9 19a3 3 0 0 0 6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {/* Full-screen Scanner (mobile) */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-40 bg-black">
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-24">
            <div className="relative w-[86%] aspect-[3/4] border-2 border-white/80 rounded-2xl mt-28">
              <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-[2px] bg-violet-400" />
              <div className="absolute inset-x-0 bottom-16 text-center text-white font-medium">Position QR code within the frame to scan</div>
            </div>
            <button
              onClick={() => { setIsScannerOpen(false); setIsOtpOpen(true); }}
              className="mt-8 rounded-full border-2 border-white text-white px-8 py-3 text-base font-semibold"
            >
              Use OTP
            </button>
          </div>
          <button
            onClick={() => setIsScannerOpen(false)}
            className="absolute top-5 right-5 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center"
            aria-label="Close Scanner"
          >
            ×
          </button>
        </div>
      )}

      {false && <div />}

      {false && <div />}
    </div>
  );
}