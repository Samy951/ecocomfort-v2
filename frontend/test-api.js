// Test script to verify API connection
const testConnection = async () => {
  try {
    console.log('Testing API connection...');
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@ecocomfort.com',
        password: 'Admin@123'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Token received:', data.access_token ? 'Yes' : 'No');
      console.log('User data:', data.user);
    } else {
      const error = await response.text();
      console.error('Error:', error);
    }
  } catch (error) {
    console.error('Connection failed:', error);
  }
};

// Run test
testConnection();
