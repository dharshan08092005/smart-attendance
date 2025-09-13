import { NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';

dotenv.config();

// POST - Send message to Student Skill Advisor AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, facultyId, context } = body;

    if (!message || !facultyId) {
      return NextResponse.json(
        { success: false, error: 'Message and faculty ID are required' },
        { status: 400 }
      );
    }

    // Prepare the request to Student Skill Advisor AI
    const aiRequest = {
      query: message,
      faculty_id: facultyId,
      context: context || {},
      collection: "recommendation" // Using the same collection as the AI expects
    };

    // Call the Student Skill Advisor AI endpoint
    const aiResponse = await fetch('https://voicepython-studentrag.hf.space/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiRequest)
    });

    if (!aiResponse.ok) {
      throw new Error(`AI service responded with status: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // Process the AI response
    let responseMessage = "I'm sorry, I couldn't process your request at the moment.";
    
    if (aiData.response) {
      responseMessage = aiData.response;
    } else if (aiData.answer) {
      responseMessage = aiData.answer;
    } else if (aiData.message) {
      responseMessage = aiData.message;
    }

    // Add additional context if available
    if (aiData.documents && aiData.documents.length > 0) {
      responseMessage += "\n\nBased on the student data, here are some relevant insights:";
      aiData.documents.forEach((doc: any, index: number) => {
        if (doc.content) {
          responseMessage += `\n\n${index + 1}. ${doc.content}`;
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: responseMessage,
        timestamp: new Date().toISOString(),
        facultyId: facultyId,
        aiResponse: aiData
      }
    });

  } catch (error) {
    console.error('Faculty chat API error:', error);
    
    // Fallback response in case of AI service failure
    const fallbackMessage = "I'm currently unable to connect to the Student Skill Advisor AI. Please try again later or contact the system administrator.";
    
    return NextResponse.json({
      success: true,
      data: {
        message: fallbackMessage,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        isFallback: true
      }
    });
  }
}

// GET - Get chat history or status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('facultyId');

    if (!facultyId) {
      return NextResponse.json(
        { success: false, error: 'Faculty ID is required' },
        { status: 400 }
      );
    }

    // Check AI service status
    const statusResponse = await fetch('https://voicepython-studentrag.hf.space/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    let aiStatus = null;
    if (statusResponse.ok) {
      aiStatus = await statusResponse.json();
    }

    return NextResponse.json({
      success: true,
      data: {
        facultyId,
        aiStatus,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Faculty chat status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get chat status' },
      { status: 500 }
    );
  }
}
