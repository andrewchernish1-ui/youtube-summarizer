import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const summarizeRequestSchema = z.object({
  videoUrl: z.string().url({ message: 'Please provide a valid URL.' }),
});

// Utility function to extract YouTube Video ID from various URL formats
function extractYouTubeVideoId(url: string): string | null {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Utility function to decode HTML entities
function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&#39;/g, "'")
        .replace(/"/g, '"')
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/&nbsp;/g, ' ');
}

async function getTranscript(videoId: string): Promise<string> {
  const url = `https://api.supadata.ai/v1/transcript?url=https://www.youtube.com/watch?v=${videoId}&text=true`;
  const options = {
    method: 'GET',
    headers: {
      'x-api-key': process.env.SUPADATA_API_KEY!,
    },
  };

  try {
    console.log(`[${new Date().toISOString()}] Supadata Request URL: ${url}`);
    console.log(`[${new Date().toISOString()}] Supadata Request Options: ${JSON.stringify(options)}`);

    const response = await fetch(url, options);
    console.log(`[${new Date().toISOString()}] Supadata Response Status: ${response.status}`);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[${new Date().toISOString()}] Supadata Error Body: ${errorBody}`);
      throw new Error(`Supadata request failed with status ${response.status}: ${errorBody}`);
    }
    const result = await response.json();
    console.log(`[${new Date().toISOString()}] Supadata Response Result: ${JSON.stringify(result).substring(0, 500)}...`); // Log first 500 chars

    // Supadata returns content as string when text=true
    if (result.content && typeof result.content === 'string') {
      return decodeHtmlEntities(result.content);
    }

    // Fallback for array format (if text=true not working)
    if (Array.isArray(result.content)) {
      const rawTranscript = result.content.map((item: any) => item.text || '').join(' ');
      return decodeHtmlEntities(rawTranscript);
    }

    return '';

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching transcript from Supadata:`, error);
    throw new Error('Failed to fetch transcript.');
  }
}

async function getSummary(transcript: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
    const apiKey = process.env.GEMINI_API_KEY;

    const body = {
        contents: [
            {
                parts: [
                    {
                        text: `Пожалуйста, создайте краткое резюме следующего транскрипта на русском языке:\n\n${transcript}`,
                    },
                ],
            },
        ],
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey!,
        },
        body: JSON.stringify(body),
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorBody = await response.json();
            console.error('Gemini API Error:', errorBody);
            throw new Error(`Gemini API request failed with status ${response.status}`);
        }
        const result = await response.json();
        return result.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error generating summary from Gemini API:', error);
        throw new Error('Failed to generate summary.');
    }
}

export async function handleSummarizeRequest(videoUrl: string) {
  console.log(`[${new Date().toISOString()}] Start summarizing URL: ${videoUrl}`);
  const videoId = extractYouTubeVideoId(videoUrl);

  if (!videoId) {
      console.error(`[${new Date().toISOString()}] Invalid YouTube URL: ${videoUrl}`);
      throw new Error('Invalid YouTube URL provided.');
  }
  console.log(`[${new Date().toISOString()}] Extracted Video ID: ${videoId}`);

  const transcript = await getTranscript(videoId);
  if (!transcript || transcript.trim() === '') {
    console.error(`[${new Date().toISOString()}] Failed to retrieve or empty transcript for Video ID: ${videoId}`);
    throw new Error('Failed to retrieve video transcript.');
  }
  console.log(`[${new Date().toISOString()}] Transcript retrieved successfully for Video ID: ${videoId}`);

  const summary = await getSummary(transcript);
  if (!summary) {
    console.error(`[${new Date().toISOString()}] Failed to generate summary for Video ID: ${videoId}`);
    throw new Error('Failed to generate summary.');
  }
  console.log(`[${new Date().toISOString()}] Summary generated successfully for Video ID: ${videoId}`);

  return { summary };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = summarizeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { videoUrl } = validation.data;
    
    const { summary } = await handleSummarizeRequest(videoUrl);

    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred on the server.' }, { status: 500 });
  }
}
