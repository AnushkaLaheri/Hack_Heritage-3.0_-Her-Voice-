// Deployment Test Script
// Run this in your browser console on https://her-voice-six.vercel.app

console.log('🚀 Testing Her Voice Deployment...\n');

// Test 1: Check Environment Variables
console.log('1. Environment Variables:');
console.log('   API URL:', process.env.REACT_APP_API_URL || 'Not set');
console.log('   Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'Set ✅' : 'Not set ❌');

// Test 2: Test CORS and API Connection
console.log('\n2. Testing API Connection...');
fetch('https://her-voice-backend.onrender.com/api/test', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('   Status:', response.status);
  console.log('   CORS Headers:', {
    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
    'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
  });
  return response.json();
})
.then(data => {
  console.log('   Response:', data);
  console.log('   ✅ API Connection Working!');
})
.catch(error => {
  console.error('   ❌ API Connection Failed:', error);
});

// Test 3: Test Login Endpoint
console.log('\n3. Testing Login Endpoint...');
fetch('https://her-voice-backend.onrender.com/api/auth/login', {
  method: 'OPTIONS',
  headers: {
    'Origin': window.location.origin,
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type,Authorization'
  }
})
.then(response => {
  console.log('   Login CORS Status:', response.status);
  if (response.status === 200) {
    console.log('   ✅ Login endpoint CORS working!');
  } else {
    console.log('   ❌ Login endpoint CORS failed');
  }
})
.catch(error => {
  console.error('   ❌ Login endpoint test failed:', error);
});

// Test 4: Check Current Page
console.log('\n4. Current Page Info:');
console.log('   Origin:', window.location.origin);
console.log('   Expected:', 'https://her-voice-six.vercel.app');
console.log('   Match:', window.location.origin === 'https://her-voice-six.vercel.app' ? '✅' : '❌');

console.log('\n🏁 Test Complete! Check results above.');
console.log('\nIf you see CORS errors, make sure:');
console.log('1. Backend is deployed with updated CORS settings');
console.log('2. Google OAuth console has your domain added');
console.log('3. Environment variables are set correctly');