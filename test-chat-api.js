// Test script for faculty chat API integration
const testChatAPI = async () => {
  const testMessage = {
    message: "What are the performance trends for my students?",
    facultyId: "68c4bcbcd781d710cd1146d6", // Example faculty ID
    context: {
      department: "Computer Science",
      timestamp: new Date().toISOString()
    }
  };

  try {
    console.log('Testing faculty chat API...');
    console.log('Sending request:', JSON.stringify(testMessage, null, 2));
    
    const response = await fetch('http://localhost:3000/api/faculty/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Chat API test successful!');
      console.log('AI Response:', data.data.message);
    } else {
      console.log('❌ Chat API test failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error testing chat API:', error.message);
  }
};

// Test the AI service status
const testAIStatus = async () => {
  try {
    console.log('\nTesting AI service status...');
    
    const response = await fetch('https://voicepython-studentrag.hf.space/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('AI Service status:', response.status);
    
    const data = await response.json();
    console.log('AI Service data:', JSON.stringify(data, null, 2));
    
    if (data.status === 'ready') {
      console.log('✅ AI service is ready!');
    } else {
      console.log('⚠️ AI service status:', data.status);
    }
  } catch (error) {
    console.error('❌ Error testing AI service:', error.message);
  }
};

// Run tests
(async () => {
  await testAIStatus();
  await testChatAPI();
})();
