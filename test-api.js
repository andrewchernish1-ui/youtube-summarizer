const fetch = require('node-fetch');

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
