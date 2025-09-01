const fetch = require('node-fetch');

async function testLocalAPI() {
  const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

  console.log('🚀 Testing local API endpoint...');
  console.log('📡 POST to http://localhost:3001/api/summarize');
  console.log('📝 Payload:', { videoUrl });

  try {
    const response = await fetch('http://localhost:3001/api/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoUrl }),
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Success! Response:', result);

    if (result.summary) {
      console.log('\n📋 Generated Summary:');
      console.log('===================');
      console.log(result.summary);
      console.log('===================');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔍 Возможные причины:');
    console.log('1. Сервер не запущен (npm run dev)');
    console.log('2. Неправильный GEMINI_API_KEY в .env.local');
    console.log('3. Проблемы с подключением к Supadata.ai или Gemini');
    console.log('4. Видео не имеет транскрипта');
  }
}

// Запуск теста
testLocalAPI();
