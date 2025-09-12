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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="backdrop-blur-sm bg-white/80 border-b border-white/20 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1 font-medium">Comprehensive management system for academic operations</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ActionButton variant="blue" icon="plus">Add Student</ActionButton>
              <ActionButton variant="indigo" icon="user">Add Faculty</ActionButton>
              <ActionButton variant="emerald" icon="book">Add Subject</ActionButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-5 h-5 text-red-600">⚠️</div>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Total Students" 
            value={stats?.totalStudents ?? 0} 
            icon="👥"
            gradient="from-blue-500 to-blue-600"
            bgGradient="from-blue-50 to-blue-100"
          />
          <StatCard 
            title="Total Faculty" 
            value={stats?.totalFaculty ?? 0} 
            icon="👨‍🏫"
            gradient="from-indigo-500 to-indigo-600"
            bgGradient="from-indigo-50 to-indigo-100"
          />
          <StatCard 
            title="Total Subjects" 
            value={stats?.totalSubjects ?? 0} 
            icon="📚"
            gradient="from-emerald-500 to-emerald-600"
            bgGradient="from-emerald-50 to-emerald-100"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
                    <FormInput
                      label="Select Date"
                      type="date"
                      value={otpBulkForm.date}
                      onChange={(e) => setOtpBulkForm({ ...otpBulkForm, date: e.target.value })}
                    />
                  </div>
                ) : (
                  <>
                    <FormInput
                      label="From Date"
                      type="date"
                      value={otpBulkForm.fromDate}
                      onChange={(e) => setOtpBulkForm({ ...otpBulkForm, fromDate: e.target.value })}
                    />
                    <FormInput
                      label="To Date"
                      type="date"
                      value={otpBulkForm.toDate}
                      onChange={(e) => setOtpBulkForm({ ...otpBulkForm, toDate: e.target.value })}
                    />
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Periods</label>
                  <div className="flex flex-wrap gap-3">
                    {[1,2,3,4,5,6,7].map((p) => (
                      <PeriodChip
                        key={p}
                        period={p}
                        selected={otpBulkForm.periods.includes(p)}
                        onClick={() => {
                          setOtpBulkForm({
                            ...otpBulkForm,
                            periods: otpBulkForm.periods.includes(p)
                              ? otpBulkForm.periods.filter(x => x !== p)
                              : [...otpBulkForm.periods, p]
                          });
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {otpError && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <span>⚠️</span>
                  {otpError}
                </div>
              )}

              {otpBulkResult && otpBulkResult.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">Generated OTPs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {otpBulkResult.map((otp, idx) => (
                      <OtpCard key={idx} otp={otp} />
                    ))}
                  </div>
                </div>
              )}

              <SubmitButton loading={otpLoading} variant="indigo">
                {otpLoading ? 'Generating...' : 'Generate OTPs'}
              </SubmitButton>
            </form>
          </ModernCard>

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
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Date Mode</label>
                  <div className="flex gap-4">
                    <RadioOption
                      checked={attnBulkForm.mode === 'single'}
                      onChange={() => setAttnBulkForm({ ...attnBulkForm, mode: 'single' })}
                      label="Single Date"
                    />
                    <RadioOption
                      checked={attnBulkForm.mode === 'range'}
                      onChange={() => setAttnBulkForm({ ...attnBulkForm, mode: 'range' })}
                      label="Date Range"
                    />
                  </div>
                </div>

                {attnBulkForm.mode === 'single' ? (
                  <div className="md:col-span-2">
                    <FormInput
                      label="Select Date"
                      type="date"
                      value={attnBulkForm.date}
                      onChange={(e) => setAttnBulkForm({ ...attnBulkForm, date: e.target.value })}
                    />
                  </div>
                ) : (
                  <>
                    <FormInput
                      label="From Date"
                      type="date"
                      value={attnBulkForm.fromDate}
                      onChange={(e) => setAttnBulkForm({ ...attnBulkForm, fromDate: e.target.value })}
                    />
                    <FormInput
                      label="To Date"
                      type="date"
                      value={attnBulkForm.toDate}
                      onChange={(e) => setAttnBulkForm({ ...attnBulkForm, toDate: e.target.value })}
                    />
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Periods</label>
                  <div className="flex flex-wrap gap-3">
                    {[1,2,3,4,5,6,7].map((p) => (
                      <PeriodChip
                        key={p}
                        period={p}
                        selected={attnBulkForm.periods.includes(p)}
                        onClick={() => {
                          setAttnBulkForm({
                            ...attnBulkForm,
                            periods: attnBulkForm.periods.includes(p)
                              ? attnBulkForm.periods.filter(x => x !== p)
                              : [...attnBulkForm.periods, p]
                          });
                        }}
                        variant="emerald"
                      />
                    ))}
                  </div>
                </div>

                <FormSelect
                  label="Attendance Status"
                  value={attnBulkForm.status}
                  onChange={(e) => setAttnBulkForm({ ...attnBulkForm, status: e.target.value as 'present' | 'absent' })}
                  options={[
                    { value: 'present', label: 'Present' },
                    { value: 'absent', label: 'Absent' }
                  ]}
                />
                <FormSelect
                  label="Method"
                  value={attnBulkForm.method}
                  onChange={(e) => setAttnBulkForm({ ...attnBulkForm, method: e.target.value as 'otp' | 'qr' | 'manual' })}
                  options={[
                    { value: 'manual', label: 'Manual' },
                    { value: 'otp', label: 'OTP' },
                    { value: 'qr', label: 'QR Code' }
                  ]}
                />
              </div>

              {attnBulkMessage && (
                <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                  attnBulkMessage.includes('Successfully') 
                    ? 'text-emerald-700 bg-emerald-50' 
                    : 'text-red-600 bg-red-50'
                }`}>
                  <span>{attnBulkMessage.includes('Successfully') ? '✅' : '⚠️'}</span>
                  {attnBulkMessage}
                </div>
              )}

              <SubmitButton loading={attnBulkSubmitting} variant="emerald">
                {attnBulkSubmitting ? 'Updating...' : 'Apply Bulk Update'}
              </SubmitButton>
            </form>
          </ModernCard>
        </div>

        {/* Students Table */}
        <ModernCard title="👥 Students Overview" subtitle="Manage all registered students">
          <DataTable
            headers={['Name', 'Registration No.', 'Email', 'Attendance', 'GPA']}
            data={students.map(s => [
              s.name,
              s.registrationNumber,
              s.email,
              <AttendanceBadge key={s.id} percentage={s.attendancePercentage} />,
              <GPABadge key={s.id} gpa={s.gpa} />
            ])}
            emptyMessage="No students found"
          />
        </ModernCard>

        {/* Faculty and Subjects */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <ModernCard title="👨‍🏫 Faculty Members" subtitle="Academic staff management">
            <DataTable
              headers={['Name', 'Department', 'Email', 'Subjects', 'Students']}
              data={faculty.map(f => [
                f.name,
                f.department,
                f.email,
                <CountBadge key={f.id} count={f.subjects} color="blue" />,
                <CountBadge key={f.id} count={f.assignedStudents} color="emerald" />
              ])}
              emptyMessage="No faculty members found"
            />
          </ModernCard>

          <ModernCard title="📚 Subjects" subtitle="Course and subject management">
            <DataTable
              headers={['Subject Name', 'Code', 'Type']}
              data={subjects.map(s => [
                s.name,
                <CodeBadge key={s.id} code={s.code} />,
                <TypeBadge key={s.id} type={s.type} />
              ])}
              emptyMessage="No subjects found"
            />
          </ModernCard>
        </div>

        {/* Attendance and Leaves */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <ModernCard title="📊 Recent Attendance" subtitle="Latest attendance records">
            <DataTable
              headers={['Student', 'Subject', 'Date', 'Status', 'Method']}
              data={attendance.map(a => [
                a.studentName,
                a.subject,
                new Date(a.date).toLocaleDateString(),
                <StatusBadge key={a.id} status={a.status} />,
                <MethodBadge key={a.id} method={a.method} />
              ])}
              emptyMessage="No attendance records found"
            />
          </ModernCard>

          <ModernCard title="📋 Leave Requests" subtitle="Student leave applications">
            <div className="space-y-4">
              {leaves.map((leave) => (
                <LeaveCard key={leave.id} leave={leave} />
              ))}
              {leaves.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>No leave requests found</p>
                </div>
              )}
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  );
}

// Enhanced Components
function StatCard({ title, value, icon, gradient, bgGradient }: { 
  title: string; 
  value: number | string; 
  icon: string;
  gradient: string;
  bgGradient: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${bgGradient} backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-2xl">{icon}</div>
        <div className={`w-8 h-1 bg-gradient-to-r ${gradient} rounded-full`}></div>
      </div>
      <p className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">{value}</p>
      <p className="text-sm font-medium text-gray-600">{title}</p>
    </div>
  );
}

function ModernCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-gray-600 mt-1 font-medium">{subtitle}</p>}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function ActionButton({ variant, icon, children }: { variant: string; icon: string; children: React.ReactNode }) {
  const variants = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
    emerald: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
  };
  
  const icons = {
    plus: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
  };

  return (
    <button className={`px-6 py-3 bg-gradient-to-r ${variants[variant]} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[icon]} />
      </svg>
      {children}
    </button>
  );
}

function FormInput({ label, type = 'text', value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function RadioOption({ checked, onChange, label }: any) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="radio"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
          checked ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
        }`}>
          {checked && <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>}
        </div>
      </div>
      <span className="font-medium text-gray-700">{label}</span>
    </label>
  );
}

function PeriodChip({ period, selected, onClick, variant = 'blue' }: any) {
  const variants = {
    blue: selected ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300',
    emerald: selected ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl border-2 font-semibold transition-all duration-200 ${variants[variant]} hover:shadow-md`}
    >
      Period {period}
    </button>
  );
}

function OtpCard({ otp }: any) {
  const expired = otp.remaining <= 0;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otp.otp)}`;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-lg">
      <div className="text-center mb-4">
        <p className="text-xs text-gray-500 mb-1">Period {otp.period}</p>
        <p className={`text-2xl font-mono font-bold ${expired ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {otp.otp}
        </p>
      </div>
      
      <div className="flex justify-center mb-4">
        {!expired ? (
          <img src={qrUrl} alt={`QR for ${otp.otp}`} className="w-32 h-32 rounded-lg shadow-md" />
        ) : (
          <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-sm font-medium">Expired</span>
          </div>
        )}
      </div>
      
      <div className="text-center">
        {expired ? (
          <span className="text-red-600 font-semibold text-sm">🔴 Expired</span>
        ) : (
          <span className="text-emerald-600 font-semibold text-sm">⏱️ {otp.remaining}s remaining</span>
        )}
      </div>
    </div>
  );
}

function SubmitButton({ loading, variant, children }: any) {
  const variants = {
    indigo: loading ? 'bg-gray-400' : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
    emerald: loading ? 'bg-gray-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
  };

  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full px-6 py-4 ${variants[variant]} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed`}
    >
      {loading && (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
      )}
      {children}
    </button>
  );
}

function DataTable({ headers, data, emptyMessage }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
            {headers.map((header: string, index: number) => (
              <th key={index} className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row: any[], index: number) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

function AttendanceBadge({ percentage }: { percentage: number }) {
  const getColor = (pct: number) => {
    if (pct >= 90) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (pct >= 75) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getColor(percentage)}`}>
      {percentage}%
    </span>
  );
}

function GPABadge({ gpa }: { gpa: number }) {
  const getColor = (score: number) => {
    if (score >= 3.7) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (score >= 3.0) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getColor(gpa)}`}>
      {gpa.toFixed(2)}
    </span>
  );
}

function CountBadge({ count, color }: { count: number; color: string }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${colors[color]}`}>
      {count}
    </span>
  );
}

function CodeBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-mono font-semibold bg-gray-100 text-gray-800 border border-gray-200">
      {code}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const getColor = (t: string) => {
    switch (t.toLowerCase()) {
      case 'core': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'elective': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold capitalize border ${getColor(type)}`}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: 'present' | 'absent' }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${
      status === 'present' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'
    }`}>
      {status === 'present' ? '✅ Present' : '❌ Absent'}
    </span>
  );
}

function MethodBadge({ method }: { method: 'otp' | 'qr' | 'manual' }) {
  const getIcon = (m: string) => {
    switch (m) {
      case 'otp': return '🔢';
      case 'qr': return '📱';
      case 'manual': return '✋';
      default: return '📝';
    }
  };

  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
      {getIcon(method)} {method.toUpperCase()}
    </span>
  );
}

function LeaveCard({ leave }: { leave: AdminLeave }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medical': return '🏥';
      case 'personal': return '👤';
      default: return '📝';
    }
  };

  return (
    <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-gray-800">{leave.studentName}</h4>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(leave.status)}`}>
          {leave.status.toUpperCase()}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
        <span className="flex items-center gap-1">
          {getTypeIcon(leave.type)} {leave.type}
        </span>
        <span className="flex items-center gap-1">
          📅 {new Date(leave.date).toLocaleDateString()}
        </span>
      </div>
      
      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
        {leave.reason}
      </p>
    </div>
  );
}