'use client';

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

interface OtpGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    facultyId: string;
    period: string;
    subjectId: string;
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  submitting: boolean;
  message: string | null;
  generatedOtp: string | null;
  faculty: AdminFaculty[];
  subjects: AdminSubject[];
}

export default function OtpGenerationModal({ 
  isOpen, 
  onClose, 
  formData, 
  setFormData, 
  onSubmit, 
  submitting, 
  message, 
  generatedOtp,
  faculty,
  subjects
}: OtpGenerationModalProps) {
  if (!isOpen) return null;

  const periods = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Generate OTP</h2>
              <p className="text-gray-600 mt-1">Generate 6-digit OTP for faculty attendance</p>
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

          {generatedOtp && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Generated OTP</h3>
              <div className="text-3xl font-mono font-bold text-green-600 text-center py-2 bg-white rounded-lg border-2 border-green-300">
                {generatedOtp}
              </div>
              <p className="text-sm text-green-600 text-center mt-2">Valid for 20 seconds</p>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Faculty *
              </label>
              <select
                value={formData.facultyId}
                onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose faculty member</option>
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} - {f.department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Period *
              </label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose period</option>
                {periods.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Subject (Optional)
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose subject (optional)</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            {message && (
              <div className={`p-4 rounded-xl ${
                message.includes('successfully') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
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
                {submitting ? 'Generating...' : 'Generate OTP'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
