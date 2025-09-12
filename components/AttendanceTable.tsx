'use client';

import Link from 'next/link';

export default function AdminHeader() {
  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Link href="/dashboard/admin/students" className="hover:text-blue-600">Students</Link>
            <Link href="/dashboard/admin/faculty" className="hover:text-blue-600">Faculty</Link>
            <Link href="/dashboard/admin/attendance" className="hover:text-blue-600">Attendance</Link>
            <Link href="/dashboard/admin/subjects" className="hover:text-blue-600">Subjects</Link>
          </div>
        </div>
      </nav>
    </header>
  );
}