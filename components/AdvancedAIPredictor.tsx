'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

type AttendanceRecord = {
  date: string;
  present: boolean;
  subjectId: string;
  sessionType: 'theory' | 'practical';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: number;
};

type AdvancedPrediction = {
  currentStats: {
    overallPercentage: number;
    weeklyAverage: number;
    monthlyTrend: number;
    subjectBreakdown: { [subjectId: string]: number };
    dayOfWeekPattern: { [day: string]: number };
    timeOfDayPattern: { [time: string]: number };
  };
  predictions: {
    nextWeek: number;
    nextMonth: number;
    semesterEnd: number;
    confidence: number;
  };
  insights: {
    riskFactors: string[];
    opportunities: string[];
    recommendations: string[];
    criticalPeriods: { start: string; end: string; reason: string }[];
  };
  actionPlan: {
    immediateActions: string[];
    weeklyGoals: string[];
    monthlyTargets: string[];
    classesToAttend: number;
    daysToTarget: number | null;
  };
};

type AdvancedResponse = {
  success: boolean;
  data: {
    studentId: string;
    attendanceData: AttendanceRecord[];
    predictions: AdvancedPrediction;
    generatedAt: string;
  };
};

interface AdvancedAIPredictorProps {
  studentId: string;
  targetPercentage?: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdvancedAIPredictor({ studentId, targetPercentage = 75 }: AdvancedAIPredictorProps) {
  const [predictions, setPredictions] = useState<AdvancedPrediction | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'insights' | 'action'>('overview');

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/ai/predictions/advanced?studentId=${studentId}&targetPercentage=${targetPercentage}`);
      const result: AdvancedResponse = await response.json();
      
      if (result.success) {
        setPredictions(result.data.predictions);
        setAttendanceData(result.data.attendanceData);
      } else {
        setError('Failed to fetch advanced predictions');
      }
    } catch (err) {
      setError('Error loading advanced predictions');
      console.error('Advanced prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [studentId, targetPercentage]);

  const getTrendIcon = (trend: number) => {
    if (trend > 2) return '📈';
    if (trend < -2) return '📉';
    return '➡️';
  };

  const getTrendColor = (trend: number) => {
    if (trend > 2) return 'text-green-600';
    if (trend < -2) return 'text-red-600';
    return 'text-blue-600';
  };

  const getRiskLevel = (percentage: number) => {
    if (percentage < 60) return { level: 'High', color: 'text-red-600 bg-red-50 border-red-200' };
    if (percentage < 75) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
    return { level: 'Low', color: 'text-green-600 bg-green-50 border-green-200' };
  };

  // Prepare chart data
  const subjectChartData = Object.entries(predictions?.currentStats.subjectBreakdown || {}).map(([subject, percentage]) => ({
    subject: subject.replace('subject_', 'Subject '),
    percentage: Math.round(percentage * 10) / 10
  }));

  const dayChartData = Object.entries(predictions?.currentStats.dayOfWeekPattern || {}).map(([day, percentage]) => ({
    day,
    percentage: Math.round(percentage * 10) / 10
  }));

  const timeChartData = Object.entries(predictions?.currentStats.timeOfDayPattern || {}).map(([time, percentage]) => ({
    time: time.charAt(0).toUpperCase() + time.slice(1),
    percentage: Math.round(percentage * 10) / 10
  }));

  const predictionChartData = [
    { period: 'Current', percentage: predictions?.currentStats.overallPercentage || 0 },
    { period: 'Next Week', percentage: predictions?.predictions.nextWeek || 0 },
    { period: 'Next Month', percentage: predictions?.predictions.nextMonth || 0 },
    { period: 'Semester End', percentage: predictions?.predictions.semesterEnd || 0 }
  ];

  if (loading) {
    return (
      <div className="rounded-xl border border-black/10 bg-white shadow-sm p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-sm text-gray-600">Loading advanced AI analysis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 shadow-sm p-6">
        <div className="text-red-600 text-center">
          <p className="font-medium">Error loading advanced predictions</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={fetchPredictions}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!predictions) return null;

  const riskLevel = getRiskLevel(predictions.currentStats.overallPercentage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-black/10 bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            🧠 Advanced AI Analysis
          </h2>
          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${riskLevel.color}`}>
            {riskLevel.level} Risk
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-600 font-medium">Overall Attendance</div>
            <div className="text-2xl font-bold text-blue-800">{predictions.currentStats.overallPercentage}%</div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-green-600 font-medium">Weekly Average</div>
            <div className="text-2xl font-bold text-green-800">{predictions.currentStats.weeklyAverage}%</div>
          </div>
          
          <div className={`border rounded-lg p-3 ${getTrendColor(predictions.currentStats.monthlyTrend)}`}>
            <div className="text-xs font-medium">Monthly Trend</div>
            <div className="text-2xl font-bold flex items-center gap-1">
              {getTrendIcon(predictions.currentStats.monthlyTrend)}
              {Math.abs(predictions.currentStats.monthlyTrend).toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-xs text-purple-600 font-medium">AI Confidence</div>
            <div className="text-2xl font-bold text-purple-800">{predictions.predictions.confidence}%</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="flex border-b border-gray-200">
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'patterns', label: 'Patterns', icon: '🔍' },
            { key: 'insights', label: 'Insights', icon: '💡' },
            { key: 'action', label: 'Action Plan', icon: '🎯' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Attendance Overview</h3>
              
              {/* Prediction Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Future Predictions</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={predictionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => [`${value}%`, 'Attendance']} />
                    <Bar dataKey="percentage" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-2">Next Week Prediction</h5>
                  <div className="text-2xl font-bold text-blue-600">{predictions.predictions.nextWeek}%</div>
                  <div className="text-sm text-gray-600">Based on current trends</div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-2">Semester End Prediction</h5>
                  <div className="text-2xl font-bold text-green-600">{predictions.predictions.semesterEnd}%</div>
                  <div className="text-sm text-gray-600">Long-term projection</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'patterns' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Attendance Patterns</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subject Breakdown */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">By Subject</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={subjectChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ subject, percentage }) => `${subject}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {subjectChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Day of Week Pattern */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">By Day of Week</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dayChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value: number) => [`${value}%`, 'Attendance']} />
                      <Bar dataKey="percentage" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Time of Day Pattern */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">By Time of Day</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={timeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => [`${value}%`, 'Attendance']} />
                    <Bar dataKey="percentage" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">AI Insights</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Factors */}
                <div>
                  <h4 className="text-sm font-medium text-red-700 mb-3 flex items-center gap-2">
                    ⚠️ Risk Factors
                  </h4>
                  <div className="space-y-2">
                    {predictions.insights.riskFactors.map((risk, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm text-red-800">{risk}</div>
                      </div>
                    ))}
                    {predictions.insights.riskFactors.length === 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-sm text-green-800">No significant risk factors detected</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Opportunities */}
                <div>
                  <h4 className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2">
                    🚀 Opportunities
                  </h4>
                  <div className="space-y-2">
                    {predictions.insights.opportunities.map((opportunity, index) => (
                      <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-sm text-green-800">{opportunity}</div>
                      </div>
                    ))}
                    {predictions.insights.opportunities.length === 0 && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-sm text-gray-600">No specific opportunities identified</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
                  💡 AI Recommendations
                </h4>
                <div className="space-y-2">
                  {predictions.insights.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">💡</span>
                        <span>{rec}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Periods */}
              {predictions.insights.criticalPeriods.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-orange-700 mb-3 flex items-center gap-2">
                    📅 Critical Periods
                  </h4>
                  <div className="space-y-2">
                    {predictions.insights.criticalPeriods.map((period, index) => (
                      <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="text-sm font-medium text-orange-800">{period.reason}</div>
                        <div className="text-xs text-orange-600">
                          {new Date(period.start).toLocaleDateString()} - {new Date(period.end).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'action' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Action Plan</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Immediate Actions */}
                <div>
                  <h4 className="text-sm font-medium text-red-700 mb-3 flex items-center gap-2">
                    🚨 Immediate Actions
                  </h4>
                  <div className="space-y-2">
                    {predictions.actionPlan.immediateActions.map((action, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm text-red-800 flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">⚡</span>
                          <span>{action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Goals */}
                <div>
                  <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
                    📅 Weekly Goals
                  </h4>
                  <div className="space-y-2">
                    {predictions.actionPlan.weeklyGoals.map((goal, index) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm text-blue-800 flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">🎯</span>
                          <span>{goal}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monthly Targets */}
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-3 flex items-center gap-2">
                  🗓️ Monthly Targets
                </h4>
                <div className="space-y-2">
                  {predictions.actionPlan.monthlyTargets.map((target, index) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm text-green-800 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">🎯</span>
                        <span>{target}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {predictions.actionPlan.classesToAttend > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800">Classes to Attend</div>
                    <div className="text-2xl font-bold text-yellow-900">{predictions.actionPlan.classesToAttend}</div>
                    <div className="text-xs text-yellow-600">To reach 75% attendance</div>
                  </div>
                )}
                
                {predictions.actionPlan.daysToTarget && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="text-sm font-medium text-purple-800">Days to Target</div>
                    <div className="text-2xl font-bold text-purple-900">{predictions.actionPlan.daysToTarget}</div>
                    <div className="text-xs text-purple-600">Based on current trend</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
