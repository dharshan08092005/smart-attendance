'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, User } from 'lucide-react';

const Login = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    userType: 'student',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!credentials.email || !credentials.password) {
      setError('Please enter email and password');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect based on user type
        switch (credentials.userType) {
          case 'admin':
            router.push('/dashboard/admin-dashboard');
            break;
          case 'faculty':
            router.push('/dashboard/faculty-dashboard');
            break;
          case 'student':
            router.push('/dashboard/student_dashboard');
            break;
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 transform transition duration-300 hover:scale-[1.02]">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          CLASS LENS
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Login to continue
        </p>
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="email"
              id="email"
              className="peer pl-10 pr-3 py-3 w-full border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-gray-50"
              value={credentials.email}
              onChange={(e) =>
                setCredentials({ ...credentials, email: e.target.value })
              }
              required
            />
            <label
              htmlFor="email"
              className="absolute left-10 -top-2.5 text-xs text-indigo-600 bg-gray-50 px-1 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-600"
            >
              Email Address
            </label>
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="password"
              id="password"
              className="peer pl-10 pr-3 py-3 w-full border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-gray-50"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              required
            />
            <label
              htmlFor="password"
              className="absolute left-10 -top-2.5 text-xs text-indigo-600 bg-gray-50 px-1 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-600"
            >
              Password
            </label>
          </div>

          {/* User type */}
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={20} />
            <select
              id="userType"
              className="pl-10 pr-3 py-3 w-full border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              value={credentials.userType}
              onChange={(e) =>
                setCredentials({ ...credentials, userType: e.target.value })
              }
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
            <label
              htmlFor="userType"
              className="absolute left-10 -top-2.5 text-xs text-indigo-600 bg-gray-50 px-1"
            >
              Login As
            </label>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition text-white shadow-md ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;