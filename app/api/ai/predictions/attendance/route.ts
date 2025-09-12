import { NextRequest, NextResponse } from "next/server";

// Types for attendance prediction
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

// Simple linear regression for trend analysis
function calculateTrend(attendanceData: AttendanceData[]): { slope: number; r2: number } {
  if (attendanceData.length < 3) {
    return { slope: 0, r2: 0 };
  }

  const n = attendanceData.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = attendanceData.map((_, i) => {
    const recentData = attendanceData.slice(0, i + 1);
    const presentCount = recentData.filter(d => d.present).length;
    return (presentCount / recentData.length) * 100;
  });

  // Calculate slope using least squares
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // Calculate R²
  const yMean = sumY / n;
  const ssRes = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + (sumY - slope * sumX) / n;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const r2 = 1 - (ssRes / ssTot);

  return { slope, r2: Math.max(0, r2) };
}

function generateMockAttendanceData(studentId: string, days: number = 60): AttendanceData[] {
  const data: AttendanceData[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    // Generate realistic attendance pattern with some randomness
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (!isWeekend) {
      // Higher attendance on weekdays, some variation
      const baseAttendance = 0.85; // 85% base attendance
      const randomFactor = Math.random();
      const present = randomFactor < baseAttendance;
      
      data.push({
        date: date.toISOString().split('T')[0],
        present,
        subjectId: `subject_${Math.floor(Math.random() * 3) + 1}`,
        sessionType: Math.random() > 0.5 ? 'theory' : 'practical'
      });
    }
  }
  
  return data;
}

function calculateAttendancePredictions(
  attendanceData: AttendanceData[],
  targetPercentage: number = 75
): AttendancePrediction {
  if (attendanceData.length === 0) {
    return {
      currentPercentage: 0,
      predictedPercentage: 0,
      trend: 'stable',
      daysToTarget: null,
      classesNeeded: null,
      riskLevel: 'high',
      confidence: 0,
      recommendations: ['No attendance data available'],
      weeklyProjection: []
    };
  }

  const currentPercentage = (attendanceData.filter(d => d.present).length / attendanceData.length) * 100;
  const { slope, r2 } = calculateTrend(attendanceData);
  
  // Determine trend
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (slope > 0.5) trend = 'improving';
  else if (slope < -0.5) trend = 'declining';
  
  // Predict future percentage (next 30 days)
  const futureDays = 30;
  const predictedPercentage = Math.max(0, Math.min(100, currentPercentage + (slope * futureDays / 7)));
  
  // Calculate days to reach target
  let daysToTarget: number | null = null;
  let classesNeeded: number | null = null;
  
  if (currentPercentage < targetPercentage && slope > 0) {
    const percentageGap = targetPercentage - currentPercentage;
    daysToTarget = Math.ceil((percentageGap / slope) * 7);
    
    // Estimate classes per week (assuming 5 days per week, 2-3 classes per day)
    const classesPerWeek = 12; // Conservative estimate
    classesNeeded = Math.ceil((daysToTarget / 7) * classesPerWeek);
  }
  
  // Risk assessment
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (currentPercentage < 60 || (slope < -1 && currentPercentage < 80)) {
    riskLevel = 'high';
  } else if (currentPercentage < 75 || slope < -0.5) {
    riskLevel = 'medium';
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (currentPercentage < 75) {
    recommendations.push(`Your attendance is below 75%. Focus on attending more classes.`);
  }
  
  if (trend === 'declining') {
    recommendations.push(`Your attendance trend is declining. Consider reviewing your schedule.`);
  }
  
  if (daysToTarget && daysToTarget > 30) {
    recommendations.push(`It may take ${daysToTarget} days to reach ${targetPercentage}% attendance.`);
  }
  
  if (riskLevel === 'high') {
    recommendations.push(`High risk of attendance issues. Immediate action recommended.`);
  } else if (riskLevel === 'medium') {
    recommendations.push(`Monitor your attendance closely to avoid further decline.`);
  } else {
    recommendations.push(`Great job! Your attendance is on track.`);
  }
  
  // Weekly projection
  const weeklyProjection = [];
  for (let week = 1; week <= 8; week++) {
    const weekPercentage = Math.max(0, Math.min(100, currentPercentage + (slope * week)));
    weeklyProjection.push({
      week,
      predictedPercentage: Math.round(weekPercentage * 10) / 10
    });
  }
  
  return {
    currentPercentage: Math.round(currentPercentage * 10) / 10,
    predictedPercentage: Math.round(predictedPercentage * 10) / 10,
    trend,
    daysToTarget,
    classesNeeded,
    riskLevel,
    confidence: Math.round(r2 * 100),
    recommendations,
    weeklyProjection
  };
}

export async function POST(req: NextRequest) {
  try {
    const { studentId, targetPercentage = 75 } = await req.json();
    
    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }
    
    // Generate mock attendance data (in real app, fetch from database)
    const attendanceData = generateMockAttendanceData(studentId, 60);
    
    // Calculate predictions
    const predictions = calculateAttendancePredictions(attendanceData, targetPercentage);
    
    return NextResponse.json({
      success: true,
      data: {
        studentId,
        attendanceData: attendanceData.slice(-30), // Last 30 days
        predictions,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Attendance prediction error:', error);
    return NextResponse.json(
      { error: "Failed to generate attendance predictions" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const targetPercentage = parseInt(searchParams.get('targetPercentage') || '75');
  
  if (!studentId) {
    return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
  }
  
  try {
    // Generate mock attendance data
    const attendanceData = generateMockAttendanceData(studentId, 60);
    
    // Calculate predictions
    const predictions = calculateAttendancePredictions(attendanceData, targetPercentage);
    
    return NextResponse.json({
      success: true,
      data: {
        studentId,
        attendanceData: attendanceData.slice(-30),
        predictions,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Attendance prediction error:', error);
    return NextResponse.json(
      { error: "Failed to generate attendance predictions" },
      { status: 500 }
    );
  }
}
