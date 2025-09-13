'use client';

import { useEffect, useState } from 'react';

type Student = {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  attendancePercentage: number;
  facultyId: string;
  facultyName: string;
};

type AttendanceRecord = {
  date: string;
  period: string;
  hour: number;
  status: 'present' | 'absent';
  method: 'otp' | 'qr' | 'manual';
  facultyName: string;
  subjectName: string;
  markedAt: string;
};

type TimeSlot = {
  period: string;
  startTime: string;
  endTime: string;
  subject: string;
  faculty: string;
};

const timeSlots: TimeSlot[] = [
  { period: 'P1', startTime: '09:00', endTime: '10:00', subject: 'Mathematics', faculty: 'Dr. Smith' },
  { period: 'P2', startTime: '10:00', endTime: '11:00', subject: 'Physics', faculty: 'Dr. Johnson' },
  { period: 'P3', startTime: '11:15', endTime: '12:15', subject: 'Chemistry', faculty: 'Dr. Brown' },
  { period: 'P4', startTime: '12:15', endTime: '13:15', subject: 'English', faculty: 'Dr. Davis' },
  { period: 'P5', startTime: '14:00', endTime: '15:00', subject: 'Computer Science', faculty: 'Dr. Wilson' },
  { period: 'P6', startTime: '15:00', endTime: '16:00', subject: 'Biology', faculty: 'Dr. Miller' },
];

export default function StudentDashboard() {
  const [student, setStudent] = useState<Student | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [otp, setOtp] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load student data
  useEffect(() => {
    // Mock student data - in real app, this would come from authentication
    const mockStudent: Student = {
      id: 'student123',
      name: 'John Doe',
      rollNumber: 'ST001',
      email: 'john.doe@university.edu',
      attendancePercentage: 85,
      facultyId: 'faculty123',
      facultyName: 'Dr. Smith'
    };
    setStudent(mockStudent);

    // Mock attendance records
    const mockRecords: AttendanceRecord[] = [
      {
        date: '2024-01-15',
        period: 'P1',
        hour: 9,
        status: 'present',
        method: 'otp',
        facultyName: 'Dr. Smith',
        subjectName: 'Mathematics',
        markedAt: '2024-01-15T09:05:00Z'
      },
      {
        date: '2024-01-15',
        period: 'P2',
        hour: 10,
        status: 'present',
        method: 'otp',
        facultyName: 'Dr. Johnson',
        subjectName: 'Physics',
        markedAt: '2024-01-15T10:02:00Z'
      }
    ];
    setAttendanceRecords(mockRecords);
  }, []);

  // Get current period based on time
  const getCurrentPeriod = () => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    for (const slot of timeSlots) {
      if (timeString >= slot.startTime && timeString < slot.endTime) {
        return slot;
      }
    }
    return null;
  };

  const currentPeriod = getCurrentPeriod();

  // Handle OTP submission
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || !selectedPeriod) {
      setMessage('Please enter OTP and select period');
      return;
    }

    if (!student) {
      setMessage('Student data not loaded');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/student/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          otp: otp,
          period: selectedPeriod
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Attendance marked successfully!');
        setOtp('');
        
        // Add new attendance record
        const newRecord: AttendanceRecord = {
          date: data.data.date,
          period: data.data.period,
          hour: data.data.hour,
          status: 'present',
          method: 'otp',
          facultyName: data.data.facultyName,
          subjectName: currentPeriod?.subject || 'Unknown',
          markedAt: new Date().toISOString()
        };
        
        setAttendanceRecords(prev => [...prev, newRecord]);
      } else {
        setMessage(data.error || 'Failed to mark attendance');
      }
    } catch (error: any) {
      setMessage(error.message || 'Failed to mark attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
              <p className="text-gray-600">Welcome back, {student.name}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Current Time</div>
              <div className="text-lg font-mono font-semibold text-gray-900">
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Name:</span>
                  <p className="font-medium">{student.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Roll Number:</span>
                  <p className="font-medium">{student.rollNumber}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <p className="font-medium">{student.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Attendance:</span>
                  <p className="font-medium text-green-600">{student.attendancePercentage}%</p>
                </div>
              </div>
            </div>

            {/* Current Period */}
            {currentPeriod && (
              <div className="bg-blue-50 rounded-lg shadow p-6 mt-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Current Period</h3>
                <div className="space-y-2">
                  <p className="font-medium text-blue-800">{currentPeriod.period}</p>
                  <p className="text-blue-700">{currentPeriod.subject}</p>
                  <p className="text-blue-600">{currentPeriod.faculty}</p>
                  <p className="text-sm text-blue-500">
                    {currentPeriod.startTime} - {currentPeriod.endTime}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* OTP Attendance */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Mark Attendance</h2>
              
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Period
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a period</option>
                    {timeSlots.map((slot) => (
                      <option key={slot.period} value={slot.period}>
                        {slot.period} - {slot.subject} ({slot.startTime}-{slot.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Marking Attendance...' : 'Mark Attendance'}
                </button>
              </form>

              {message && (
                <div className={`mt-4 p-3 rounded-md ${
                  message.includes('successfully') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}
            </div>

            {/* Attendance Records */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceRecords.map((record, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.subjectName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.status === 'present' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.method.toUpperCase()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
