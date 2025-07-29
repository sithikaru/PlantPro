const axios = require('axios');

// Test authentication and health logs
async function testHealthLogs() {
  try {
    // First login
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'manager@plantpro.com',
      password: 'manager123'
    });
    
    const token = loginResponse.data.accessToken;
    console.log('Login successful, token:', token.substring(0, 20) + '...');
    
    // Get health logs
    const healthLogsResponse = await axios.get('http://localhost:3000/api/v1/health-logs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Health logs count:', healthLogsResponse.data.length);
    
    // Find health logs with images
    const healthLogsWithImages = healthLogsResponse.data.filter(log => log.images && log.images.length > 0);
    console.log('Health logs with images:', healthLogsWithImages.length);
    
    if (healthLogsWithImages.length > 0) {
      console.log('Sample image URLs:');
      healthLogsWithImages.slice(0, 3).forEach((log, index) => {
        console.log(`Log ${log.id}:`, log.images);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testHealthLogs();
