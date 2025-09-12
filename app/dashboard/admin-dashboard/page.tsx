'use client';

import { useEffect, useState } from 'react';

// ModernCard Component
function ModernCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs/5 text-foreground/60 mt-1">{subtitle}</p>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

// RadioOption Component
function RadioOption({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 text-violet-600 border-gray-300 focus:ring-violet-500"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

// FormInput Component
function FormInput({ label, type, value, onChange, placeholder, required }: { 
  label: string; 
  type: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string; 
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs/5 text-foreground/60 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm"
      />
    </div>
  );
}

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
  department: string;
  year: string;
  status: 'active' | 'inactive';
};

type AdminFaculty = {
  id: string;
  name: string;
  email: string;
  department: string;
  subjects: string[];
  studentsCount: number;
  status: 'active' | 'inactive';
};

type LeaveRequest = {
  id: string;
  studentName: string;
  registrationNumber: string;
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
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load analytics
        const statsResponse = await fetch('/api/admin/analytics');
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);
        }

        // Load students
        const studentsResponse = await fetch('/api/admin/students');
        const studentsData = await studentsResponse.json();
        if (studentsData.success) {
          setStudents(studentsData.data);
        }

        // Load faculty
        const facultyResponse = await fetch('/api/admin/faculty');
        const facultyData = await facultyResponse.json();
        if (facultyData.success) {
          setFaculty(facultyData.data);
        }

        // Load pending leaves
        const leavesResponse = await fetch('/api/admin/leaves?status=pending');
        const leavesData = await leavesResponse.json();
        if (leavesData.success) {
          setLeaves(leavesData.data);
        }

      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen p-0 sm:p-8 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(59,130,246,0.15)_0%,transparent_70%)] bg-[length:100%_100%] bg-no-repeat">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage students, faculty, and attendance system</p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Faculty</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFaculty}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👨‍🏫</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Attendance</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageAttendance}%</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Leaves</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingLeaves}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <ModernCard title="🔐 Generate OTPs" subtitle="Create OTPs for attendance by periods and date range">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">OTP generation feature will be implemented here.</p>
              <button className="w-full h-10 px-4 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700">
                Generate OTPs
              </button>
            </div>
          </ModernCard>

          <ModernCard title="📊 Bulk Operations" subtitle="Perform bulk operations on students and faculty">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Bulk operations feature will be implemented here.</p>
              <button className="w-full h-10 px-4 rounded-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700">
                Bulk Operations
              </button>
            </div>
          </ModernCard>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Students Overview</h2>
            <p className="text-sm text-gray-600">Manage all registered students</p>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Registration</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Attendance</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">GPA</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{student.name}</td>
                      <td className="py-3 px-4">{student.registrationNumber}</td>
                      <td className="py-3 px-4">{student.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.attendancePercentage >= 75 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.attendancePercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4">{student.gpa}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Faculty Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Faculty Overview</h2>
            <p className="text-sm text-gray-600">Manage all faculty members</p>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Students</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {faculty.map((facultyMember) => (
                    <tr key={facultyMember.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{facultyMember.name}</td>
                      <td className="py-3 px-4">{facultyMember.email}</td>
                      <td className="py-3 px-4">{facultyMember.department}</td>
                      <td className="py-3 px-4">{facultyMember.studentsCount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          facultyMember.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {facultyMember.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Leave Requests</h2>
            <p className="text-sm text-gray-600">Review and approve leave requests</p>
          </div>
          <div className="p-4">
            {leaves.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending leave requests</p>
            ) : (
              <div className="space-y-4">
                {leaves.map((leave) => (
                  <div key={leave.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{leave.studentName}</h3>
                        <p className="text-sm text-gray-600">{leave.registrationNumber}</p>
                        <p className="text-sm text-gray-500">{leave.date} • {leave.type}</p>
                        <p className="text-sm text-gray-700 mt-2">{leave.reason}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium hover:bg-green-200">
                          Approve
                        </button>
                        <button className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm font-medium hover:bg-red-200">
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}