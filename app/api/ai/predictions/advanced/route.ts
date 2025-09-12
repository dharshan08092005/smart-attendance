import { NextRequest, NextResponse } from "next/server";

// Advanced AI prediction types
type AttendanceRecord = {
  date: string;
  present: boolean;
  subjectId: string;
  sessionType: 'theory' | 'practical';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
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

// Generate realistic attendance data with patterns
function generateAdvancedAttendanceData(studentId: string, days: number = 90): AttendanceRecord[] {
  const data: AttendanceRecord[] = [];
  const today = new Date();
  
  // Define patterns
  const subjectPreferences = {
    'subject_1': 0.9, // High attendance
    'subject_2': 0.7, // Medium attendance  
    'subject_3': 0.8  // Good attendance
  };
  
  const dayOfWeekPattern = {
    1: 0.85, // Monday
    2: 0.9,  // Tuesday
    3: 0.8,  // Wednesday
    4: 0.75, // Thursday
    5: 0.7,  // Friday
  };
  
  const timeOfDayPattern = {
    'morning': 0.9,
    'afternoon': 0.8,
    'evening': 0.6
  };
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dayOfWeek = date.getDay();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    // Generate 2-3 classes per day
    const classesPerDay = Math.floor(Math.random() * 2) + 2; // 2-3 classes
    
    for (let j = 0; j < classesPerDay; j++) {
      const subjectId = `subject_${Math.floor(Math.random() * 3) + 1}`;
      const timeOfDay = j === 0 ? 'morning' : j === 1 ? 'afternoon' : 'evening';
      
      // Calculate attendance probability based on patterns
      let baseProbability = 0.8;
      baseProbability *= subjectPreferences[subjectId as keyof typeof subjectPreferences] || 0.8;
      baseProbability *= dayOfWeekPattern[dayOfWeek as keyof typeof dayOfWeekPattern] || 0.8;
      baseProbability *= timeOfDayPattern[timeOfDay as keyof typeof timeOfDayPattern] || 0.8;
      
      // Add some randomness and recent trend
      const recentTrend = i < 7 ? 0.1 : i < 14 ? 0.05 : 0; // Slight improvement over time
      baseProbability += recentTrend;
      
      const present = Math.random() < baseProbability;
      
      data.push({
        date: date.toISOString().split('T')[0],
        present,
        subjectId,
        sessionType: Math.random() > 0.6 ? 'theory' : 'practical',
        timeOfDay,
        dayOfWeek
      });
    }
  }
  
  return data;
}

function calculateAdvancedPredictions(attendanceData: AttendanceRecord[]): AdvancedPrediction {
  if (attendanceData.length === 0) {
    return {
      currentStats: {
        overallPercentage: 0,
        weeklyAverage: 0,
        monthlyTrend: 0,
        subjectBreakdown: {},
        dayOfWeekPattern: {},
        timeOfDayPattern: {}
      },
      predictions: {
        nextWeek: 0,
        nextMonth: 0,
        semesterEnd: 0,
        confidence: 0
      },
      insights: {
        riskFactors: ['No attendance data available'],
        opportunities: [],
        recommendations: ['Start attending classes to generate predictions'],
        criticalPeriods: []
      },
      actionPlan: {
        immediateActions: ['Begin attending classes regularly'],
        weeklyGoals: [],
        monthlyTargets: [],
        classesToAttend: 0,
        daysToTarget: null
      }
    };
  }

  // Calculate current statistics
  const overallPercentage = (attendanceData.filter(d => d.present).length / attendanceData.length) * 100;
  
  // Weekly average (last 4 weeks)
  const last4Weeks = attendanceData.slice(-28);
  const weeklyAverage = last4Weeks.length > 0 ? 
    (last4Weeks.filter(d => d.present).length / last4Weeks.length) * 100 : overallPercentage;
  
  // Monthly trend (comparing last 30 days vs previous 30 days)
  const last30Days = attendanceData.slice(-30);
  const previous30Days = attendanceData.slice(-60, -30);
  const last30Percentage = last30Days.length > 0 ? 
    (last30Days.filter(d => d.present).length / last30Days.length) * 100 : 0;
  const previous30Percentage = previous30Days.length > 0 ? 
    (previous30Days.filter(d => d.present).length / previous30Days.length) * 100 : 0;
  const monthlyTrend = last30Percentage - previous30Percentage;
  
  // Subject breakdown
  const subjectBreakdown: { [subjectId: string]: number } = {};
  const subjects = [...new Set(attendanceData.map(d => d.subjectId))];
  subjects.forEach(subject => {
    const subjectData = attendanceData.filter(d => d.subjectId === subject);
    subjectBreakdown[subject] = (subjectData.filter(d => d.present).length / subjectData.length) * 100;
  });
  
  // Day of week pattern
  const dayOfWeekPattern: { [day: string]: number } = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (let day = 1; day <= 5; day++) { // Monday to Friday
    const dayData = attendanceData.filter(d => d.dayOfWeek === day);
    if (dayData.length > 0) {
      dayOfWeekPattern[dayNames[day]] = (dayData.filter(d => d.present).length / dayData.length) * 100;
    }
  }
  
  // Time of day pattern
  const timeOfDayPattern: { [time: string]: number } = {};
  ['morning', 'afternoon', 'evening'].forEach(time => {
    const timeData = attendanceData.filter(d => d.timeOfDay === time);
    if (timeData.length > 0) {
      timeOfDayPattern[time] = (timeData.filter(d => d.present).length / timeData.length) * 100;
    }
  });
  
  // Predictions using trend analysis
  const trendSlope = monthlyTrend / 30; // Daily trend
  const nextWeek = Math.max(0, Math.min(100, overallPercentage + (trendSlope * 7)));
  const nextMonth = Math.max(0, Math.min(100, overallPercentage + (trendSlope * 30)));
  const semesterEnd = Math.max(0, Math.min(100, overallPercentage + (trendSlope * 60)));
  
  // Confidence based on data consistency
  const confidence = Math.min(95, Math.max(60, 100 - Math.abs(monthlyTrend)));
  
  // Generate insights
  const riskFactors: string[] = [];
  const opportunities: string[] = [];
  const recommendations: string[] = [];
  
  if (overallPercentage < 75) {
    riskFactors.push('Overall attendance below 75% threshold');
  }
  
  if (monthlyTrend < -5) {
    riskFactors.push('Declining attendance trend detected');
  }
  
  const lowestSubject = Object.entries(subjectBreakdown).reduce((min, [subject, percentage]) => 
    percentage < min.percentage ? { subject, percentage } : min, 
    { subject: '', percentage: 100 }
  );
  
  if (lowestSubject.percentage < 70) {
    riskFactors.push(`Low attendance in ${lowestSubject.subject} (${lowestSubject.percentage.toFixed(1)}%)`);
  }
  
  const lowestDay = Object.entries(dayOfWeekPattern).reduce((min, [day, percentage]) => 
    percentage < min.percentage ? { day, percentage } : min, 
    { day: '', percentage: 100 }
  );
  
  if (lowestDay.percentage < 70) {
    opportunities.push(`Focus on improving ${lowestDay.day} attendance`);
  }
  
  const lowestTime = Object.entries(timeOfDayPattern).reduce((min, [time, percentage]) => 
    percentage < min.percentage ? { time, percentage } : min, 
    { time: '', percentage: 100 }
  );
  
  if (lowestTime.percentage < 70) {
    opportunities.push(`Improve ${lowestTime.time} class attendance`);
  }
  
  // Generate recommendations
  if (overallPercentage < 75) {
    recommendations.push('Increase overall attendance to meet 75% requirement');
  }
  
  if (monthlyTrend < 0) {
    recommendations.push('Reverse the declining attendance trend');
  }
  
  if (lowestSubject.percentage < 70) {
    recommendations.push(`Prioritize attendance in ${lowestSubject.subject}`);
  }
  
  if (trendSlope > 0) {
    recommendations.push('Maintain the positive attendance trend');
  }
  
  // Critical periods (exam periods, project deadlines, etc.)
  const criticalPeriods = [
    { start: '2024-03-01', end: '2024-03-15', reason: 'Mid-term examinations' },
    { start: '2024-04-15', end: '2024-04-30', reason: 'Project submission period' },
    { start: '2024-05-20', end: '2024-06-05', reason: 'Final examinations' }
  ];
  
  // Action plan
  const immediateActions: string[] = [];
  const weeklyGoals: string[] = [];
  const monthlyTargets: string[] = [];
  
  if (overallPercentage < 75) {
    immediateActions.push('Attend all classes this week');
    immediateActions.push('Set up attendance reminders');
  }
  
  if (monthlyTrend < 0) {
    immediateActions.push('Identify and address attendance barriers');
  }
  
  weeklyGoals.push(`Maintain ${Math.max(75, overallPercentage)}% attendance`);
  weeklyGoals.push('Attend all theory classes');
  
  monthlyTargets.push(`Reach ${Math.min(100, overallPercentage + 5)}% attendance`);
  monthlyTargets.push('Improve consistency across all subjects');
  
  // Calculate classes needed to reach 75%
  const targetPercentage = 75;
  let classesToAttend = 0;
  let daysToTarget: number | null = null;
  
  if (overallPercentage < targetPercentage) {
    const totalClasses = attendanceData.length;
    const presentClasses = attendanceData.filter(d => d.present).length;
    const neededClasses = Math.ceil((targetPercentage / 100) * totalClasses) - presentClasses;
    classesToAttend = Math.max(0, neededClasses);
    
    // Estimate days based on current trend
    if (trendSlope > 0) {
      daysToTarget = Math.ceil((targetPercentage - overallPercentage) / (trendSlope * 7));
    }
  }
  
  return {
    currentStats: {
      overallPercentage: Math.round(overallPercentage * 10) / 10,
      weeklyAverage: Math.round(weeklyAverage * 10) / 10,
      monthlyTrend: Math.round(monthlyTrend * 10) / 10,
      subjectBreakdown,
      dayOfWeekPattern,
      timeOfDayPattern
    },
    predictions: {
      nextWeek: Math.round(nextWeek * 10) / 10,
      nextMonth: Math.round(nextMonth * 10) / 10,
      semesterEnd: Math.round(semesterEnd * 10) / 10,
      confidence: Math.round(confidence)
    },
    insights: {
      riskFactors,
      opportunities,
      recommendations,
      criticalPeriods
    },
    actionPlan: {
      immediateActions,
      weeklyGoals,
      monthlyTargets,
      classesToAttend,
      daysToTarget
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const { studentId, targetPercentage = 75 } = await req.json();
    
    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }
    
    // Generate advanced attendance data
    const attendanceData = generateAdvancedAttendanceData(studentId, 90);
    
    // Calculate advanced predictions
    const predictions = calculateAdvancedPredictions(attendanceData);
    
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
    console.error('Advanced prediction error:', error);
    return NextResponse.json(
      { error: "Failed to generate advanced predictions" },
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
    // Generate advanced attendance data
    const attendanceData = generateAdvancedAttendanceData(studentId, 90);
    
    // Calculate advanced predictions
    const predictions = calculateAdvancedPredictions(attendanceData);
    
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
    console.error('Advanced prediction error:', error);
    return NextResponse.json(
      { error: "Failed to generate advanced predictions" },
      { status: 500 }
    );
  }
}
