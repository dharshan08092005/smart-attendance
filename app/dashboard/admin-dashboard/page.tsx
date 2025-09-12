'use client';

import { useEffect, useState } from 'react';

type AdminStats = {
  totalStudents: number;
  totalFaculty: number;
  totalSubjects: number;
  averageAttendance: number;
  pendingLeaves: number;
  todaySessions: number;
};

type AdminStudent = {
  id: string;
  name: string;
  registrationNumber: string;
  email: string;
  attendancePercentage: number;
  gpa: number;
};

type AdminFaculty = {
  id: string;
  name: string;
  department: string;
  email: string;
  subjects: number;
  assignedStudents: number;
};

type AdminSubject = {
  id: string;
  name: string;
  code: string;
  type: string;
};

type AdminAttendance = {
  id: string;
  studentName: string;
  subject: string;
  date: string;
  status: 'present' | 'absent';
  method: 'otp' | 'qr' | 'manual';
};

type AdminSession = {
  id: string;
  faculty: string;
  subject: string;
  date: string;
  hour: number;
  mode: 'online' | 'offline';
};

type AdminLeave = {
  id: string;
  studentName: string;
  date: string;
  reason: string;
  type: 'medical' | 'personal' | 'other';
  status: 'pending' | 'approved' | 'rejected';
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [faculty, setFaculty] = useState<AdminFaculty[]>([]);
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [attendance, setAttendance] = useState<AdminAttendance[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [leaves, setLeaves] = useState<AdminLeave[]>([]);

  // OTP form state
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpBulkForm, setOtpBulkForm] = useState({
    mode: 'single' as 'single' | 'range',
    date: '',
    fromDate: '',
    toDate: '',
    periods: [] as number[],
  });
  type OtpItem = { date: string; period: number; otp: string; expiresAt: number; remaining: number; showQR?: boolean; };
  const [otpBulkResult, setOtpBulkResult] = useState<OtpItem[] | null>(null);

  // tick timer for OTP expiry
  useEffect(() => {
    if (!otpBulkResult || otpBulkResult.length === 0) return;
    const id = setInterval(() => {
      setOtpBulkResult((prev) => {
        if (!prev) return prev;
        const now = Date.now();
        return prev.map((it) => ({
          ...it,
          remaining: Math.max(0, Math.ceil((it.expiresAt - now) / 1000)),
        }));
      });
    }, 1000);
    return () => clearInterval(id);
  }, [otpBulkResult?.length]);

  // Attendance update form state
  const [attnForm, setAttnForm] = useState({
    studentId: '',
    date: '', // YYYY-MM-DD
    hour: '',
    status: 'present' as 'present' | 'absent',
    method: 'manual' as 'otp' | 'qr' | 'manual',
    subjectId: '',
    classSessionId: '',
  });
  const [attnSubmitting, setAttnSubmitting] = useState(false);
  const [attnMessage, setAttnMessage] = useState<string | null>(null);

  // Attendance bulk form
  const [attnBulkForm, setAttnBulkForm] = useState({
    studentId: '',
    mode: 'single' as 'single' | 'range',
    date: '',
    fromDate: '',
    toDate: '',
    periods: [] as number[],
    status: 'present' as 'present' | 'absent',
    method: 'manual' as 'otp' | 'qr' | 'manual',
    subjectId: '',
  });
  const [attnBulkSubmitting, setAttnBulkSubmitting] = useState(false);
  const [attnBulkMessage, setAttnBulkMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Load analytics data
        const analyticsResponse = await fetch('/api/admin/analytics');
        const analyticsData = await analyticsResponse.json();
        
        if (analyticsData.success) {
          setStats({
            totalStudents: analyticsData.data.overview.totalStudents,
            totalFaculty: analyticsData.data.overview.totalFaculty,
            totalSubjects: 32, // This would need a subjects API
            averageAttendance: Math.round(analyticsData.data.overview.averageAttendance),
            pendingLeaves: 12, // This would need a leaves API
            todaySessions: 18 // This would need a sessions API
          });
        }

        // Load students data
        const studentsResponse = await fetch('/api/admin/students?limit=10');
        const studentsData = await studentsResponse.json();
        
        if (studentsData.success) {
          setStudents(studentsData.data.map((s: any) => ({
            id: s._id,
            name: s.name,
            registrationNumber: s.registrationNumber,
            email: s.email,
            attendancePercentage: s.attendancePercentage || 0,
            gpa: s.GPA || 0
          })));
        }

        // Load faculty data
        const facultyResponse = await fetch('/api/admin/faculty?limit=10');
        const facultyData = await facultyResponse.json();
        
        if (facultyData.success) {
          setFaculty(facultyData.data.map((f: any) => ({
            id: f._id,
            name: f.name,
            department: f.department,
            email: f.email,
            subjects: f.subjects?.length || 0,
            assignedStudents: f.assignedStudentsCount || 0
          })));
        }

        // Mock data for subjects, attendance, and leaves (these would need their own APIs)
        setSubjects([
          { id: '1', name: 'Data Structures', code: 'CS201', type: 'core' },
          { id: '2', name: 'Linear Algebra', code: 'MA101', type: 'core' },
          { id: '3', name: 'Web Development', code: 'CS301', type: 'elective' }
        ]);
        
        setAttendance([
          { id: '1', studentName: 'John Doe', subject: 'Data Structures', date: '2024-03-15', status: 'present', method: 'otp' },
          { id: '2', studentName: 'Jane Smith', subject: 'Linear Algebra', date: '2024-03-15', status: 'absent', method: 'qr' }
        ]);
        
        setLeaves([
          { id: '1', studentName: 'Mike Johnson', date: '2024-03-20', reason: 'Medical appointment', type: 'medical', status: 'pending' },
          { id: '2', studentName: 'Sarah Davis', date: '2024-03-22', reason: 'Family emergency', type: 'personal', status: 'approved' }
        ]);
        
        setError(null);
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="font-sans min-h-screen p-0 sm:p-8 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(59,130,246,0.15)_0%,transparent_70%)] bg-[length:100%_100%] bg-no-repeat flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/60 font-medium">Loading dashboard...</p>
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
              ADMIN
            </div>
            <div>
              <div className="uppercase text-xs/5 opacity-90">Hi</div>
              <div className="text-2xl font-bold tracking-wide">ADMIN</div>
              <div className="text-sm opacity-90">Here's your dashboard overview</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-0 pt-4 sm:pt-0 pb-24 sm:pb-0">
        {/* Header */}
        <header className="hidden sm:flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Admin Dashboard</h1>
            <p className="text-sm/6 text-foreground/70">Comprehensive management system for academic operations</p>
          </div>
          <div className="flex gap-3">
            <button className="h-10 px-4 rounded-md text-sm font-medium inline-flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Add Student
            </button>
            <button className="h-10 px-4 rounded-md text-sm font-medium inline-flex items-center gap-2 bg-violet-600 text-white hover:bg-violet-700 transition shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Add Faculty
            </button>
            <button className="h-10 px-4 rounded-md text-sm font-medium inline-flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Add Subject
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-5 h-5 text-rose-600">⚠️</div>
            <p className="text-rose-700 font-medium">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <section className="rounded-xl border border-black/10 bg-white shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Overview Statistics</h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <div className="text-xs/5 text-foreground/60">Total Students</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{stats?.totalStudents ?? 0}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <div className="text-xs/5 text-foreground/60">Total Faculty</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{stats?.totalFaculty ?? 0}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <div className="text-xs/5 text-foreground/60">Total Subjects</div>
              <div className="mt-1 text-2xl font-semibold text-foreground">{stats?.totalSubjects ?? 0}</div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* OTP Generation */}
          <ModernCard title="🔐 Generate OTPs" subtitle="Create OTPs for attendance by periods and date range">
            <form
              className="space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                setOtpError(null);
                setOtpBulkResult(null);
                if (
                  (otpBulkForm.mode === 'single' && !otpBulkForm.date) ||
                  (otpBulkForm.mode === 'range' && (!otpBulkForm.fromDate || !otpBulkForm.toDate)) ||
                  otpBulkForm.periods.length === 0
                ) {
                  setOtpError('Provide date(s) and at least one period.');
                  return;
                }
                setOtpLoading(true);
                
                try {
                  const response = await fetch('/api/admin/otp/generate', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      mode: otpBulkForm.mode,
                      date: otpBulkForm.date,
                      fromDate: otpBulkForm.fromDate,
                      toDate: otpBulkForm.toDate,
                      periods: otpBulkForm.periods
                    })
                  });

                  const data = await response.json();
                  
                  if (data.success) {
                    setOtpBulkResult(data.data);
                  } else {
                    setOtpError(data.error || 'Failed to generate OTPs');
                  }
                } catch (err: any) {
                  setOtpError(err.message || 'Failed to generate OTPs');
                } finally {
                  setOtpLoading(false);
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Generation Mode</label>
                  <div className="flex gap-4">
                    <RadioOption
                      checked={otpBulkForm.mode === 'single'}
                      onChange={() => setOtpBulkForm({ ...otpBulkForm, mode: 'single' })}
                      label="Single Date"
                    />
                    <RadioOption
                      checked={otpBulkForm.mode === 'range'}
                      onChange={() => setOtpBulkForm({ ...otpBulkForm, mode: 'range' })}
                      label="Date Range"
                    />
                  </div>
                </div>

                  {otpBulkForm.mode === 'single' ? (
                    <div className="md:col-span-2">
                      <label className="block text-xs/5 text-foreground/60 mb-2">Select Date</label>
                      <input
                        type="date"
                        value={otpBulkForm.date}
                        onChange={(e) => setOtpBulkForm({ ...otpBulkForm, date: e.target.value })}
                        className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs/5 text-foreground/60 mb-2">From Date</label>
                        <input
                          type="date"
                          value={otpBulkForm.fromDate}
                          onChange={(e) => setOtpBulkForm({ ...otpBulkForm, fromDate: e.target.value })}
                          className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs/5 text-foreground/60 mb-2">To Date</label>
                        <input
                          type="date"
                          value={otpBulkForm.toDate}
                          onChange={(e) => setOtpBulkForm({ ...otpBulkForm, toDate: e.target.value })}
                          className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs/5 text-foreground/60 mb-2">Select Periods</label>
                    <div className="flex flex-wrap gap-2">
                      {[1,2,3,4,5,6,7].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setOtpBulkForm({
                              ...otpBulkForm,
                              periods: otpBulkForm.periods.includes(p)
                                ? otpBulkForm.periods.filter(x => x !== p)
                                : [...otpBulkForm.periods, p]
                            });
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                            otpBulkForm.periods.includes(p)
                              ? 'bg-violet-600 border-violet-600 text-white'
                              : 'bg-white border-gray-200 text-foreground hover:border-violet-300'
                          }`}
                        >
                          Period {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {otpError && (
                  <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 p-3 rounded-lg">
                    <span>⚠️</span>
                    {otpError}
                  </div>
                )}

                {otpBulkResult && otpBulkResult.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground">Generated OTPs</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {otpBulkResult.map((otp, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                          <div className="text-center mb-2">
                            <p className="text-xs text-foreground/60 mb-1">Period {otp.period}</p>
                            <p className={`text-xl font-mono font-bold ${otp.remaining <= 0 ? 'line-through text-gray-400' : 'text-foreground'}`}>
                              {otp.otp}
                            </p>
                          </div>
                          <div className="text-center">
                            {otp.remaining <= 0 ? (
                              <span className="text-rose-600 font-semibold text-xs">🔴 Expired</span>
                            ) : (
                              <span className="text-emerald-600 font-semibold text-xs">⏱️ {otp.remaining}s remaining</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full h-10 px-4 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? 'Generating...' : 'Generate OTPs'}
                </button>
              </form>
            </div>
          </section>

          {/* Bulk Attendance Update */}
          <ModernCard title="📊 Bulk Attendance Update" subtitle="Update attendance for multiple periods and dates">
            <form
              className="space-y-6"
              onSubmit={async (e) => {
                e.preventDefault();
                setAttnBulkMessage(null);
                if (!attnBulkForm.studentId || attnBulkForm.periods.length === 0) {
                  setAttnBulkMessage('Provide student ID and at least one period.');
                  return;
                }
                if (
                  (attnBulkForm.mode === 'single' && !attnBulkForm.date) ||
                  (attnBulkForm.mode === 'range' && (!attnBulkForm.fromDate || !attnBulkForm.toDate))
                ) {
                  setAttnBulkMessage('Provide valid date or date range.');
                  return;
                }
                setAttnBulkSubmitting(true);
                
                try {
                  const response = await fetch('/api/admin/bulk', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      operation: 'updateAttendance',
                      type: 'student',
                      data: {
                        studentIds: [attnBulkForm.studentId],
                        attendancePercentage: attnBulkForm.status === 'present' ? 100 : 0,
                        method: attnBulkForm.method
                      }
                    })
                  });

                  const data = await response.json();
                  
                  if (data.success) {
                    setAttnBulkMessage(data.message);
                  } else {
                    setAttnBulkMessage(data.error || 'Failed to update attendance');
                  }
                } catch (err: any) {
                  setAttnBulkMessage(err.message || 'Failed to update attendance');
                } finally {
                  setAttnBulkSubmitting(false);
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Student ID"
                  value={attnBulkForm.studentId}
                  onChange={(e) => setAttnBulkForm({ ...attnBulkForm, studentId: e.target.value })}
                  placeholder="Enter student ID"
                />
                <FormInput
                  label="Subject ID (Optional)"
                  value={attnBulkForm.subjectId}
                  onChange={(e) => setAttnBulkForm({ ...attnBulkForm, subjectId: e.target.value })}
                  placeholder="Enter subject ID"
                />

                  <div className="md:col-span-2">
                    <label className="block text-xs/5 text-foreground/60 mb-2">Date Mode</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={attnBulkForm.mode === 'single'}
                          onChange={() => setAttnBulkForm({ ...attnBulkForm, mode: 'single' })}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                          attnBulkForm.mode === 'single' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                        }`}>
                          {attnBulkForm.mode === 'single' && <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>}
                        </div>
                        <span className="text-sm font-medium text-foreground">Single Date</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={attnBulkForm.mode === 'range'}
                          onChange={() => setAttnBulkForm({ ...attnBulkForm, mode: 'range' })}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                          attnBulkForm.mode === 'range' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                        }`}>
                          {attnBulkForm.mode === 'range' && <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>}
                        </div>
                        <span className="text-sm font-medium text-foreground">Date Range</span>
                      </label>
                    </div>
                  </div>

                  {attnBulkForm.mode === 'single' ? (
                    <div className="md:col-span-2">
                      <label className="block text-xs/5 text-foreground/60 mb-2">Select Date</label>
                      <input
                        type="date"
                        value={attnBulkForm.date}
                        onChange={(e) => setAttnBulkForm({ ...attnBulkForm, date: e.target.value })}
                        className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs/5 text-foreground/60 mb-2">From Date</label>
                        <input
                          type="date"
                          value={attnBulkForm.fromDate}
                          onChange={(e) => setAttnBulkForm({ ...attnBulkForm, fromDate: e.target.value })}
                          className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs/5 text-foreground/60 mb-2">To Date</label>
                        <input
                          type="date"
                          value={attnBulkForm.toDate}
                          onChange={(e) => setAttnBulkForm({ ...attnBulkForm, toDate: e.target.value })}
                          className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs/5 text-foreground/60 mb-2">Select Periods</label>
                    <div className="flex flex-wrap gap-2">
                      {[1,2,3,4,5,6,7].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setAttnBulkForm({
                              ...attnBulkForm,
                              periods: attnBulkForm.periods.includes(p)
                                ? attnBulkForm.periods.filter(x => x !== p)
                                : [...attnBulkForm.periods, p]
                            });
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                            attnBulkForm.periods.includes(p)
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-gray-200 text-foreground hover:border-emerald-300'
                          }`}
                        >
                          Period {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs/5 text-foreground/60 mb-2">Attendance Status</label>
                    <select
                      value={attnBulkForm.status}
                      onChange={(e) => setAttnBulkForm({ ...attnBulkForm, status: e.target.value as 'present' | 'absent' })}
                      className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs/5 text-foreground/60 mb-2">Method</label>
                    <select
                      value={attnBulkForm.method}
                      onChange={(e) => setAttnBulkForm({ ...attnBulkForm, method: e.target.value as 'otp' | 'qr' | 'manual' })}
                      className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
                    >
                      <option value="manual">Manual</option>
                      <option value="otp">OTP</option>
                      <option value="qr">QR Code</option>
                    </select>
                  </div>
                </div>

                {attnBulkMessage && (
                  <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                    attnBulkMessage.includes('Successfully') 
                      ? 'text-emerald-700 bg-emerald-50' 
                      : 'text-rose-600 bg-rose-50'
                  }`}>
                    <span>{attnBulkMessage.includes('Successfully') ? '✅' : '⚠️'}</span>
                    {attnBulkMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={attnBulkSubmitting}
                  className="w-full h-10 px-4 rounded-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {attnBulkSubmitting ? 'Updating...' : 'Apply Bulk Update'}
                </button>
              </form>
            </div>
          </section>
        </div>

        {/* Students Table */}
        <section className="rounded-xl border border-black/10 bg-white shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">👥 Students Overview</h2>
            <span className="text-xs/5 text-foreground/60">Manage all registered students</span>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium text-foreground/80">Name</th>
                    <th className="px-3 py-2 font-medium text-foreground/80">Registration No.</th>
                    <th className="px-3 py-2 font-medium text-foreground/80">Email</th>
                    <th className="px-3 py-2 font-medium text-foreground/80">Attendance</th>
                    <th className="px-3 py-2 font-medium text-foreground/80">GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-2 text-foreground">{s.name}</td>
                      <td className="px-3 py-2 text-foreground">{s.registrationNumber}</td>
                      <td className="px-3 py-2 text-foreground">{s.email}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          s.attendancePercentage >= 90 ? 'bg-emerald-100 text-emerald-800' :
                          s.attendancePercentage >= 75 ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {s.attendancePercentage}%
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          s.gpa >= 3.7 ? 'bg-emerald-100 text-emerald-800' :
                          s.gpa >= 3.0 ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {s.gpa.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && (
                <div className="text-center py-12 text-foreground/60">
                  <p className="text-sm">No students found</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Faculty and Subjects */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="rounded-xl border border-black/10 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">👨‍🏫 Faculty Members</h2>
              <span className="text-xs/5 text-foreground/60">Academic staff management</span>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium text-foreground/80">Name</th>
                      <th className="px-3 py-2 font-medium text-foreground/80">Department</th>
                      <th className="px-3 py-2 font-medium text-foreground/80">Email</th>
                      <th className="px-3 py-2 font-medium text-foreground/80">Subjects</th>
                      <th className="px-3 py-2 font-medium text-foreground/80">Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faculty.map(f => (
                      <tr key={f.id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-3 py-2 text-foreground">{f.name}</td>
                        <td className="px-3 py-2 text-foreground">{f.department}</td>
                        <td className="px-3 py-2 text-foreground">{f.email}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {f.subjects}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            {f.assignedStudents}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {faculty.length === 0 && (
                  <div className="text-center py-12 text-foreground/60">
                    <p className="text-sm">No faculty members found</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-black/10 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">📚 Subjects</h2>
              <span className="text-xs/5 text-foreground/60">Course and subject management</span>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium text-foreground/80">Subject Name</th>
                      <th className="px-3 py-2 font-medium text-foreground/80">Code</th>
                      <th className="px-3 py-2 font-medium text-foreground/80">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map(s => (
                      <tr key={s.id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-3 py-2 text-foreground">{s.name}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-mono font-semibold bg-gray-100 text-gray-800">
                            {s.code}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                            s.type.toLowerCase() === 'core' ? 'bg-blue-100 text-blue-800' :
                            s.type.toLowerCase() === 'elective' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {s.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {subjects.length === 0 && (
                  <div className="text-center py-12 text-foreground/60">
                    <p className="text-sm">No subjects found</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Attendance and Leaves */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="rounded-xl border border-black/10 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">📊 Recent Attendance</h2>
              <span className="text-xs/5 text-foreground/60">Latest attendance records</span>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium text-foreground/80">Student</th>
                      <th className="px-3 py-2 font-medium text-foreground/80">Subject</th>
                      <th className="px-3 py-2 font-medium text-foreground/80">Date</th>
                      <th className="px-3 py-2 font-medium text-foreground/80">Status</th>
                      <th className="px-3 py-2 font-medium text-foreground/80">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a.id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-3 py-2 text-foreground">{a.studentName}</td>
                        <td className="px-3 py-2 text-foreground">{a.subject}</td>
                        <td className="px-3 py-2 text-foreground">{new Date(a.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            a.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {a.status === 'present' ? '✅ Present' : '❌ Absent'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                            {a.method === 'otp' ? '🔢' : a.method === 'qr' ? '📱' : '✋'} {a.method.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {attendance.length === 0 && (
                  <div className="text-center py-12 text-foreground/60">
                    <p className="text-sm">No attendance records found</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-black/10 bg-white shadow-sm">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">📋 Leave Requests</h2>
              <span className="text-xs/5 text-foreground/60">Student leave applications</span>
            </div>
            <div className="p-4 space-y-3">
              {leaves.map((leave) => (
                <div key={leave.id} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{leave.studentName}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      leave.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      leave.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {leave.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-foreground/60 mb-2">
                    <span className="flex items-center gap-1">
                      {leave.type === 'medical' ? '🏥' : leave.type === 'personal' ? '👤' : '📝'} {leave.type}
                    </span>
                    <span className="flex items-center gap-1">
                      📅 {new Date(leave.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/70 bg-white rounded-lg p-2">
                    {leave.reason}
                  </p>
                </div>
              ))}
              {leaves.length === 0 && (
                <div className="text-center py-12 text-foreground/60">
                  <p className="text-sm">No leave requests found</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}