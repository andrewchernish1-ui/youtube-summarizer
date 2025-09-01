const fetch = require('node-fetch');

async function testSupadataTranscript() {
  const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up
  const supadataUrl = `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(videoUrl)}&text=true`;

  console.log('Testing Supadata API...');
  console.log('URL:', supadataUrl);

  try {
    const response = await fetch(supadataUrl, {
      method: 'GET',
      headers: {
        'x-api-key': 'sd_9c053a5ed922faebac43fb7dca4d590f', // Ваш API ключ
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('Success! Transcript preview:', result.content ? result.content.substring(0, 200) + '...' : 'No content');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testFullSummarization() {
  const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

  console.log('\nTesting full summarization process...');

  try {
    // Получаем транскрипт
    const transcriptUrl = `https://api.supadata.ai/v1/transcript?url=${encodeURIComponent(videoUrl)}&text=true`;
    const transcriptResponse = await fetch(transcriptUrl, {
      method: 'GET',
      headers: {
        'x-api-key': 'sd_9c053a5ed922faebac43fb7dca4d590f',
      },
    });

    if (!transcriptResponse.ok) {
      throw new Error('Failed to get transcript');
    }

    const transcriptData = await transcriptResponse.json();
    const transcript = transcriptData.content;

    console.log('Transcript obtained, length:', transcript.length);

    // Генерируем резюме с Gemini (здесь нужно добавить ваш GEMINI_API_KEY)
    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY', // Замените на ваш ключ
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Пожалуйста, создайте краткое резюме следующего транскрипта на русском языке:\n\n${transcript}`,
              },
            ],
          },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error('Failed to generate summary');
    }

    const summaryData = await geminiResponse.json();
    const summary = summaryData.candidates[0].content.parts[0].text;

    console.log('Summary generated successfully!');
    console.log('Summary:', summary);

  } catch (error) {
    console.error('Error in full test:', error.message);
  }
}

// Запуск тестов
testSupadataTranscript().then(() => {
  // Раскомментируйте для полного тестирования
  // return testFullSummarization();
});
