'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AdvancedAIPredictor from './AdvancedAIPredictor';

type AttendanceData = {
  date: string;
  present: boolean;
  subjectId: string;
  sessionType: 'theory' | 'practical';
};

type AttendancePrediction = {
  currentPercentage: number;
  predictedPercentage: number;
  trend: 'improving' | 'declining' | 'stable';
  daysToTarget: number | null;
  classesNeeded: number | null;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  recommendations: string[];
  weeklyProjection: {
    week: number;
    predictedPercentage: number;
  }[];
};

type PredictionResponse = {
  success: boolean;
  data: {
    studentId: string;
    attendanceData: AttendanceData[];
    predictions: AttendancePrediction;
    generatedAt: string;
  };
};

interface AIAttendancePredictorProps {
  studentId: string;
  targetPercentage?: number;
}

export default function AIAttendancePredictor({ studentId, targetPercentage = 75 }: AIAttendancePredictorProps) {
  const [predictions, setPredictions] = useState<AttendancePrediction | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customTarget, setCustomTarget] = useState(targetPercentage);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/ai/predictions/attendance?studentId=${studentId}&targetPercentage=${customTarget}`);
      const result: PredictionResponse = await response.json();
      
      if (result.success) {
        setPredictions(result.data.predictions);
        setAttendanceData(result.data.attendanceData);
      } else {
        setError('Failed to fetch predictions');
      }
    } catch (err) {
      setError('Error loading predictions');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [studentId, customTarget]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  // Prepare chart data
  const chartData = attendanceData.map((record, index) => {
    const recentData = attendanceData.slice(0, index + 1);
    const percentage = (recentData.filter(d => d.present).length / recentData.length) * 100;
    return {
      day: index + 1,
      percentage: Math.round(percentage * 10) / 10,
      date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  if (loading) {
    return (
      <div className="rounded-xl border border-black/10 bg-white shadow-sm p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-sm text-gray-600">Loading AI predictions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 shadow-sm p-6">
        <div className="text-red-600 text-center">
          <p className="font-medium">Error loading predictions</p>
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

  if (showAdvanced) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            🧠 AI Attendance Analysis
          </h2>
          <button
            onClick={() => setShowAdvanced(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
          >
            Back to Basic
          </button>
        </div>
        <AdvancedAIPredictor studentId={studentId} targetPercentage={customTarget} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Target Setting */}
      <div className="rounded-xl border border-black/10 bg-white shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            🤖 AI Attendance Predictor
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvanced(true)}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
            >
              Advanced Analysis
            </button>
            <label className="text-sm text-gray-600">Target:</label>
            <input
              type="number"
              value={customTarget}
              onChange={(e) => setCustomTarget(parseInt(e.target.value) || 75)}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
              min="0"
              max="100"
            />
            <span className="text-sm text-gray-600">%</span>
            <button
              onClick={fetchPredictions}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Update
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-600 font-medium">Current Attendance</div>
            <div className="text-2xl font-bold text-blue-800">{predictions.currentPercentage}%</div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-green-600 font-medium">Predicted (30 days)</div>
            <div className="text-2xl font-bold text-green-800">{predictions.predictedPercentage}%</div>
          </div>
          
          <div className={`border rounded-lg p-3 ${getRiskColor(predictions.riskLevel)}`}>
            <div className="text-xs font-medium">Risk Level</div>
            <div className="text-2xl font-bold capitalize">{predictions.riskLevel}</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-xs text-purple-600 font-medium">Confidence</div>
            <div className="text-2xl font-bold text-purple-800">{predictions.confidence}%</div>
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="rounded-xl border border-black/10 bg-white shadow-sm p-4">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          📊 Trend Analysis
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Trend Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Attendance Trend (Last 30 Days)</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(value, payload) => {
                    const data = payload?.[0]?.payload;
                    return data ? `Day ${data.day} (${data.date})` : '';
                  }}
                  formatter={(value: number) => [`${value}%`, 'Attendance']}
                />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Projection */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">8-Week Projection</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={predictions.weeklyProjection}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Predicted Attendance']}
                  labelFormatter={(value) => `Week ${value}`}
                />
                <Bar dataKey="predictedPercentage" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Summary */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getTrendIcon(predictions.trend)}</span>
            <div>
              <div className={`font-semibold ${getTrendColor(predictions.trend)}`}>
                Trend: {predictions.trend.charAt(0).toUpperCase() + predictions.trend.slice(1)}
              </div>
              <div className="text-sm text-gray-600">
                {predictions.trend === 'improving' && 'Your attendance is improving over time'}
                {predictions.trend === 'declining' && 'Your attendance is declining - action needed'}
                {predictions.trend === 'stable' && 'Your attendance is stable'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="rounded-xl border border-black/10 bg-white shadow-sm p-4">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          🎯 Action Plan
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Goals */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Goals & Timeline</h4>
            <div className="space-y-3">
              {predictions.daysToTarget && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Days to reach {customTarget}%</div>
                  <div className="text-2xl font-bold text-blue-900">{predictions.daysToTarget} days</div>
                </div>
              )}
              
              {predictions.classesNeeded && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800">Classes needed</div>
                  <div className="text-2xl font-bold text-green-900">{predictions.classesNeeded} classes</div>
                </div>
              )}
              
              {!predictions.daysToTarget && predictions.currentPercentage >= customTarget && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800">Status</div>
                  <div className="text-lg font-bold text-green-900">✅ Target Achieved!</div>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">AI Recommendations</h4>
            <div className="space-y-2">
              {predictions.recommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800 flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">💡</span>
                    <span>{rec}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="rounded-xl border border-black/10 bg-white shadow-sm p-4">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          ⚠️ Risk Assessment
        </h3>
        
        <div className={`p-4 rounded-lg border-2 ${getRiskColor(predictions.riskLevel)}`}>
          <div className="flex items-center gap-3">
            <div className="text-3xl">
              {predictions.riskLevel === 'high' && '🔴'}
              {predictions.riskLevel === 'medium' && '🟡'}
              {predictions.riskLevel === 'low' && '🟢'}
            </div>
            <div>
              <div className="font-semibold text-lg capitalize">
                {predictions.riskLevel} Risk Level
              </div>
              <div className="text-sm opacity-80">
                {predictions.riskLevel === 'high' && 'Immediate attention required to improve attendance'}
                {predictions.riskLevel === 'medium' && 'Monitor attendance closely to prevent further decline'}
                {predictions.riskLevel === 'low' && 'Attendance is healthy, maintain current patterns'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
