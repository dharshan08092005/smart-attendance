
'use client';

import { useEffect, useState } from 'react';
import OtpGenerationModal from '@/components/OtpGenerationModal';

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

  // Student registration form state
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentForm, setStudentForm] = useState({
    name: '',
    rollNumber: '',
    registrationNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    facultyId: '',
    attendancePercentage: 0,
    gpa: 0,
    leavesInLastMonth: 0,
    otpMissRate: 0,
    engagementRiskScore: 0,
  });
  const [studentSubmitting, setStudentSubmitting] = useState(false);
  const [studentMessage, setStudentMessage] = useState<string | null>(null);

  // Faculty registration form state
  const [showFacultyForm, setShowFacultyForm] = useState(false);
  const [facultyForm, setFacultyForm] = useState({
    name: '',
    department: '',
    email: '',
    password: '',
    confirmPassword: '',
    subjects: [] as string[], // Array of subject codes
  });
  const [facultySubmitting, setFacultySubmitting] = useState(false);
  const [facultyMessage, setFacultyMessage] = useState<string | null>(null);

  // Subject registration form state
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    type: 'theory' as 'theory' | 'practical',
  });
  const [subjectSubmitting, setSubjectSubmitting] = useState(false);
  const [subjectMessage, setSubjectMessage] = useState<string | null>(null);

  // OTP Generation state
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpForm, setOtpForm] = useState({
    facultyId: '',
    period: '',
    subjectId: ''
  });
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();
        
        if (data.success) {
          setStats(data.data.stats);
          setStudents(data.data.students);
          setFaculty(data.data.faculty);
          setSubjects(data.data.subjects);
          
          // Mock data for attendance and leaves (these would come from separate APIs)
          setAttendance([
            { id: '1', studentName: 'John Doe', subject: 'Data Structures', date: '2024-03-15', status: 'present', method: 'otp' },
            { id: '2', studentName: 'Jane Smith', subject: 'Linear Algebra', date: '2024-03-15', status: 'absent', method: 'qr' }
          ]);
          
          setLeaves([
            { id: '1', studentName: 'Mike Johnson', date: '2024-03-20', reason: 'Medical appointment', type: 'medical', status: 'pending' },
            { id: '2', studentName: 'Sarah Davis', date: '2024-03-22', reason: 'Family emergency', type: 'personal', status: 'approved' }
          ]);
          
          setError(null);
        } else {
          setError(data.error || 'Failed to load dashboard data');
        }
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
              <ActionButton variant="blue" icon="plus" onClick={() => setShowStudentForm(true)}>Add Student</ActionButton>
              <ActionButton variant="indigo" icon="user" onClick={() => setShowFacultyForm(true)}>Add Faculty</ActionButton>
              <ActionButton variant="emerald" icon="book" onClick={() => setShowSubjectForm(true)}>Add Subject</ActionButton>
              <ActionButton variant="blue" icon="plus" onClick={() => setShowOtpForm(true)}>Generate OTP</ActionButton>
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
                  const response = await fetch('/api/admin/otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      periods: otpBulkForm.periods,
                      date: otpBulkForm.date,
                      mode: otpBulkForm.mode,
                      fromDate: otpBulkForm.fromDate,
                      toDate: otpBulkForm.toDate
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtpBulkForm({ ...otpBulkForm, date: e.target.value })}
                    />
                  </div>
                ) : (
                  <>
                    <FormInput
                      label="From Date"
                      type="date"
                      value={otpBulkForm.fromDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtpBulkForm({ ...otpBulkForm, fromDate: e.target.value })}
                    />
                    <FormInput
                      label="To Date"
                      type="date"
                      value={otpBulkForm.toDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtpBulkForm({ ...otpBulkForm, toDate: e.target.value })}
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
                  const response = await fetch('/api/admin/attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      studentId: attnBulkForm.studentId,
                      mode: attnBulkForm.mode,
                      date: attnBulkForm.date,
                      fromDate: attnBulkForm.fromDate,
                      toDate: attnBulkForm.toDate,
                      periods: attnBulkForm.periods,
                      status: attnBulkForm.status,
                      method: attnBulkForm.method,
                      subjectId: attnBulkForm.subjectId
                    })
                  });
                  
                  const data = await response.json();
                  
                  if (data.success) {
                    setAttnBulkMessage(data.message || 'Attendance updated successfully');
                  } else {
                    setAttnBulkMessage(data.error || 'Failed to update attendance');
                  }
                } catch (err: any) {
                  setAttnBulkMessage(err.message || 'Failed to update');
                } finally {
                  setAttnBulkSubmitting(false);
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Student ID"
                  value={attnBulkForm.studentId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAttnBulkForm({ ...attnBulkForm, studentId: e.target.value })}
                  placeholder="Enter student ID"
                />
                <FormInput
                  label="Subject ID (Optional)"
                  value={attnBulkForm.subjectId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAttnBulkForm({ ...attnBulkForm, subjectId: e.target.value })}
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAttnBulkForm({ ...attnBulkForm, date: e.target.value })}
                    />
                  </div>
                ) : (
                  <>
                    <FormInput
                      label="From Date"
                      type="date"
                      value={attnBulkForm.fromDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAttnBulkForm({ ...attnBulkForm, fromDate: e.target.value })}
                    />
                    <FormInput
                      label="To Date"
                      type="date"
                      value={attnBulkForm.toDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAttnBulkForm({ ...attnBulkForm, toDate: e.target.value })}
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
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAttnBulkForm({ ...attnBulkForm, status: e.target.value as 'present' | 'absent' })}
                  options={[
                    { value: 'present', label: 'Present' },
                    { value: 'absent', label: 'Absent' }
                  ]}
                />
                <FormSelect
                  label="Method"
                  value={attnBulkForm.method}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAttnBulkForm({ ...attnBulkForm, method: e.target.value as 'otp' | 'qr' | 'manual' })}
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

      {/* Student Registration Modal */}
      {showStudentForm && (
        <StudentRegistrationModal
          isOpen={showStudentForm}
          onClose={() => setShowStudentForm(false)}
          formData={studentForm}
          setFormData={setStudentForm}
          onSubmit={async () => {
            setStudentSubmitting(true);
            setStudentMessage(null);
            
            // Validate required fields
            if (!studentForm.name || !studentForm.rollNumber || !studentForm.registrationNumber || !studentForm.email || !studentForm.password || !studentForm.facultyId) {
              setStudentMessage('Please fill in all required fields');
              setStudentSubmitting(false);
              return;
            }

            // Validate password confirmation
            if (studentForm.password !== studentForm.confirmPassword) {
              setStudentMessage('Passwords do not match');
              setStudentSubmitting(false);
              return;
            }

            // Validate password strength
            if (studentForm.password.length < 6) {
              setStudentMessage('Password must be at least 6 characters long');
              setStudentSubmitting(false);
              return;
            }

            try {
              const response = await fetch('/api/admin/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: studentForm.name,
                  rollNumber: studentForm.rollNumber,
                  registrationNumber: studentForm.registrationNumber,
                  email: studentForm.email,
                  password: studentForm.password,
                  facultyId: studentForm.facultyId,
                  attendancePercentage: studentForm.attendancePercentage,
                  GPA: studentForm.gpa,
                  leavesInLastMonth: studentForm.leavesInLastMonth,
                  otpMissRate: studentForm.otpMissRate,
                  engagementRiskScore: studentForm.engagementRiskScore
                })
              });
              
              const data = await response.json();
              
              if (data.success) {
                // Add new student to the list
                const newStudent: AdminStudent = {
                  id: data.data.id,
                  name: data.data.name,
                  registrationNumber: data.data.registrationNumber,
                  email: data.data.email,
                  attendancePercentage: data.data.attendancePercentage,
                  gpa: data.data.gpa,
                };
                
                setStudents(prev => [...prev, newStudent]);
                setStudentMessage('Student registered successfully!');
                
                // Reset form
                setStudentForm({
                  name: '',
                  rollNumber: '',
                  registrationNumber: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  facultyId: '',
                  attendancePercentage: 0,
                  gpa: 0,
                  leavesInLastMonth: 0,
                  otpMissRate: 0,
                  engagementRiskScore: 0,
                });
                
                // Close modal after success
                setTimeout(() => {
                  setShowStudentForm(false);
                  setStudentMessage(null);
                }, 2000);
              } else {
                setStudentMessage(data.error || 'Failed to register student');
              }
              
            } catch (err: any) {
              setStudentMessage(err.message || 'Failed to register student');
            } finally {
              setStudentSubmitting(false);
            }
          }}
          submitting={studentSubmitting}
          message={studentMessage}
          faculty={faculty}
        />
      )}

      {/* Faculty Registration Modal */}
      {showFacultyForm && (
        <FacultyRegistrationModal
          isOpen={showFacultyForm}
          onClose={() => setShowFacultyForm(false)}
          formData={facultyForm}
          setFormData={setFacultyForm}
          onSubmit={async () => {
            setFacultySubmitting(true);
            setFacultyMessage(null);
            
            // Validate required fields
            if (!facultyForm.name || !facultyForm.department || !facultyForm.email || !facultyForm.password) {
              setFacultyMessage('Please fill in all required fields');
              setFacultySubmitting(false);
              return;
            }

            // Validate password confirmation
            if (facultyForm.password !== facultyForm.confirmPassword) {
              setFacultyMessage('Passwords do not match');
              setFacultySubmitting(false);
              return;
            }

            // Validate password strength
            if (facultyForm.password.length < 6) {
              setFacultyMessage('Password must be at least 6 characters long');
              setFacultySubmitting(false);
              return;
            }

            try {
              const response = await fetch('/api/admin/faculty', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: facultyForm.name,
                  department: facultyForm.department,
                  email: facultyForm.email,
                  password: facultyForm.password,
                  subjects: facultyForm.subjects
                })
              });
              
              const data = await response.json();
              
              if (data.success) {
                // Add new faculty to the list
                const newFaculty: AdminFaculty = {
                  id: data.data.id,
                  name: data.data.name,
                  department: data.data.department,
                  email: data.data.email,
                  subjects: data.data.subjects,
                  assignedStudents: data.data.assignedStudents,
                };
                
                setFaculty(prev => [...prev, newFaculty]);
                setFacultyMessage('Faculty member registered successfully!');
                
                // Reset form
                setFacultyForm({
                  name: '',
                  department: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  subjects: [],
                });
                
                // Close modal after success
                setTimeout(() => {
                  setShowFacultyForm(false);
                  setFacultyMessage(null);
                }, 2000);
              } else {
                setFacultyMessage(data.error || 'Failed to register faculty member');
              }
              
            } catch (err: any) {
              setFacultyMessage(err.message || 'Failed to register faculty member');
            } finally {
              setFacultySubmitting(false);
            }
          }}
          submitting={facultySubmitting}
          message={facultyMessage}
          subjects={subjects}
        />
      )}

      {/* Subject Registration Modal */}
      {showSubjectForm && (
        <SubjectRegistrationModal
          isOpen={showSubjectForm}
          onClose={() => setShowSubjectForm(false)}
          formData={subjectForm}
          setFormData={setSubjectForm}
          onSubmit={async () => {
            setSubjectSubmitting(true);
            setSubjectMessage(null);
            
            // Validate required fields
            if (!subjectForm.name || !subjectForm.code) {
              setSubjectMessage('Please fill in all required fields');
              setSubjectSubmitting(false);
              return;
            }

            // Validate subject code format (basic validation)
            if (subjectForm.code.length < 2) {
              setSubjectMessage('Subject code must be at least 2 characters long');
              setSubjectSubmitting(false);
              return;
            }

            try {
              const response = await fetch('/api/admin/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: subjectForm.name,
                  code: subjectForm.code,
                  type: subjectForm.type
                })
              });
              
              const data = await response.json();
              
              if (data.success) {
                // Add new subject to the list
                const newSubject: AdminSubject = {
                  id: data.data.id,
                  name: data.data.name,
                  code: data.data.code,
                  type: data.data.type,
                };
                
                setSubjects(prev => [...prev, newSubject]);
                setSubjectMessage('Subject registered successfully!');
                
                // Reset form
                setSubjectForm({
                  name: '',
                  code: '',
                  type: 'theory',
                });
                
                // Close modal after success
                setTimeout(() => {
                  setShowSubjectForm(false);
                  setSubjectMessage(null);
                }, 2000);
              } else {
                setSubjectMessage(data.error || 'Failed to register subject');
              }
              
            } catch (err: any) {
              setSubjectMessage(err.message || 'Failed to register subject');
            } finally {
              setSubjectSubmitting(false);
            }
          }}
          submitting={subjectSubmitting}
          message={subjectMessage}
        />
      )}

      {/* OTP Generation Modal */}
      {showOtpForm && (
        <OtpGenerationModal
          isOpen={showOtpForm}
          onClose={() => setShowOtpForm(false)}
          formData={otpForm}
          setFormData={setOtpForm}
          onSubmit={async () => {
            setOtpSubmitting(true);
            setOtpMessage(null);
            
            // Validate required fields
            if (!otpForm.facultyId || !otpForm.period) {
              setOtpMessage('Please select faculty and period');
              setOtpSubmitting(false);
              return;
            }

            try {
              const response = await fetch('/api/admin/faculty-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  facultyId: otpForm.facultyId,
                  period: otpForm.period,
                  subjectId: otpForm.subjectId || null
                })
              });
              
              const data = await response.json();
              
              if (data.success) {
                setGeneratedOtp(data.data.otp);
                setOtpMessage('OTP generated successfully! Valid for 20 seconds.');
                
                // Reset form
                setOtpForm({
                  facultyId: '',
                  period: '',
                  subjectId: ''
                });
                
                // Auto-close modal after 5 seconds
                setTimeout(() => {
                  setShowOtpForm(false);
                  setOtpMessage(null);
                  setGeneratedOtp(null);
                }, 5000);
              } else {
                setOtpMessage(data.error || 'Failed to generate OTP');
              }
              
            } catch (err: any) {
              setOtpMessage(err.message || 'Failed to generate OTP');
            } finally {
              setOtpSubmitting(false);
            }
          }}
          submitting={otpSubmitting}
          message={otpMessage}
          generatedOtp={generatedOtp}
          faculty={faculty}
          subjects={subjects}
        />
      )}
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

function ActionButton({ variant, icon, children, onClick }: { variant: 'blue' | 'indigo' | 'emerald'; icon: 'plus' | 'user' | 'book'; children: React.ReactNode; onClick?: () => void }) {
  const variants: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
    emerald: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
  };
  
  const icons: Record<string, string> = {
    plus: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
  };

  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 bg-gradient-to-r ${variants[variant]} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2`}
    >
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

function PeriodChip({ period, selected, onClick, variant = 'blue' }: { period: number; selected: boolean; onClick: () => void; variant?: 'blue' | 'emerald' }) {
  const variants: Record<string, string> = {
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

function SubmitButton({ loading, variant, children }: { loading: boolean; variant: 'indigo' | 'emerald'; children: React.ReactNode }) {
  const variants: Record<string, string> = {
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

function CountBadge({ count, color }: { count: number; color: 'blue' | 'emerald' }) {
  const colors: Record<string, string> = {
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

// Student Registration Modal Component
function StudentRegistrationModal({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData, 
  onSubmit, 
  submitting, 
  message, 
  faculty 
}: {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  submitting: boolean;
  message: string | null;
  faculty: AdminFaculty[];
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Register New Student</h2>
              <p className="text-gray-600 mt-1">Add a new student to the system with complete details</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <span>👤</span> Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Full Name *"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter student's full name"
                />
                <FormInput
                  label="Roll Number *"
                  value={formData.rollNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, rollNumber: e.target.value })}
                  placeholder="Enter roll number"
                />
                <FormInput
                  label="Registration Number *"
                  value={formData.registrationNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="Enter registration number"
                />
                <FormInput
                  label="Email Address *"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
                <FormInput
                  label="Password *"
                  type="password"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password (min 6 characters)"
                />
                <FormInput
                  label="Confirm Password *"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                />
                <div className="md:col-span-2">
                  <FormSelect
                    label="Assigned Faculty *"
                    value={formData.facultyId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, facultyId: e.target.value })}
                    options={[
                      { value: '', label: 'Select a faculty member' },
                      ...faculty.map(f => ({ value: f.id, label: `${f.name} (${f.department})` }))
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Academic Performance */}
            <div className="bg-emerald-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                <span>📊</span> Academic Performance
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Attendance Percentage"
                  type="number"
                  value={formData.attendancePercentage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, attendancePercentage: parseFloat(e.target.value) || 0 })}
                  placeholder="0-100"
                />
                <FormInput
                  label="Current GPA"
                  type="number"
                  step="0.01"
                  value={formData.gpa}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, gpa: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00-4.00"
                />
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="bg-amber-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
                <span>📈</span> Engagement Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  label="Leaves in Last Month"
                  type="number"
                  value={formData.leavesInLastMonth}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, leavesInLastMonth: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <FormInput
                  label="OTP Miss Rate (%)"
                  type="number"
                  value={formData.otpMissRate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, otpMissRate: parseFloat(e.target.value) || 0 })}
                  placeholder="0-100"
                />
                <FormInput
                  label="Engagement Risk Score"
                  type="number"
                  value={formData.engagementRiskScore}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, engagementRiskScore: parseFloat(e.target.value) || 0 })}
                  placeholder="0-100"
                />
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                message.includes('successfully') 
                  ? 'text-emerald-700 bg-emerald-50' 
                  : 'text-red-600 bg-red-50'
              }`}>
                <span>{message.includes('successfully') ? '✅' : '⚠️'}</span>
                {message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {submitting ? 'Registering...' : 'Register Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Faculty Registration Modal Component
function FacultyRegistrationModal({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData, 
  onSubmit, 
  submitting, 
  message,
  subjects 
}: {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  submitting: boolean;
  message: string | null;
  subjects: AdminSubject[];
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Register New Faculty</h2>
              <p className="text-gray-600 mt-1">Add a new faculty member to the system</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-indigo-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center gap-2">
                <span>👨‍🏫</span> Faculty Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Full Name *"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter faculty member's full name"
                />
                <FormInput
                  label="Department *"
                  value={formData.department}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Enter department name"
                />
                <FormInput
                  label="Email Address *"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
                <FormInput
                  label="Password *"
                  type="password"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password (min 6 characters)"
                />
                <div className="md:col-span-2">
                  <FormInput
                    label="Confirm Password *"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            </div>

            {/* Subject Assignment */}
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                <span>📚</span> Subject Assignment
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Select Subjects (Optional)</label>
                  <div className="flex flex-wrap gap-3">
                    {subjects.map((subject) => (
                      <SubjectChip
                        key={subject.id}
                        subject={subject}
                        selected={formData.subjects.includes(subject.code)}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            subjects: formData.subjects.includes(subject.code)
                              ? formData.subjects.filter((code: string) => code !== subject.code)
                              : [...formData.subjects, subject.code]
                          });
                        }}
                      />
                    ))}
                  </div>
                  {formData.subjects.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">No subjects selected. Faculty can be assigned subjects later.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                message.includes('successfully') 
                  ? 'text-emerald-700 bg-emerald-50' 
                  : 'text-red-600 bg-red-50'
              }`}>
                <span>{message.includes('successfully') ? '✅' : '⚠️'}</span>
                {message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {submitting ? 'Registering...' : 'Register Faculty'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Subject Chip Component for Faculty Form
function SubjectChip({ 
  subject, 
  selected, 
  onClick 
}: { 
  subject: AdminSubject; 
  selected: boolean; 
  onClick: () => void; 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl border-2 font-semibold transition-all duration-200 hover:shadow-md ${
        selected 
          ? 'bg-purple-500 text-white border-purple-500' 
          : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
      }`}
    >
      <div className="text-left">
        <div className="font-mono text-sm">{subject.code}</div>
        <div className="text-xs opacity-90">{subject.name}</div>
      </div>
    </button>
  );
}

// Subject Registration Modal Component
function SubjectRegistrationModal({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData, 
  onSubmit, 
  submitting, 
  message 
}: {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  submitting: boolean;
  message: string | null;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Add New Subject</h2>
              <p className="text-gray-600 mt-1">Create a new subject for the curriculum</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
            {/* Subject Information */}
            <div className="bg-emerald-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                <span>📚</span> Subject Details
              </h3>
              <div className="space-y-4">
                <FormInput
                  label="Subject Name *"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter subject name (e.g., Data Structures)"
                />
                <FormInput
                  label="Subject Code *"
                  value={formData.code}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Enter subject code (e.g., CS201)"
                />
                <FormSelect
                  label="Subject Type *"
                  value={formData.type}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, type: e.target.value as 'theory' | 'practical' })}
                  options={[
                    { value: 'theory', label: 'Theory' },
                    { value: 'practical', label: 'Practical' }
                  ]}
                />
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                message.includes('successfully') 
                  ? 'text-emerald-700 bg-emerald-50' 
                  : 'text-red-600 bg-red-50'
              }`}>
                <span>{message.includes('successfully') ? '✅' : '⚠️'}</span>
                {message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {submitting ? 'Adding...' : 'Add Subject'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}