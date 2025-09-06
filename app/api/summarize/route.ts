import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
  const apiKey = process.env.SUPADATA_API_KEY;

  if (!apiKey) {
    throw new Error('SUPADATA_API_KEY is not configured');
  }

  const url = `https://api.supadata.ai/v1/transcript?url=https://www.youtube.com/watch?v=${videoId}&text=true`;
  const options = {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
    },
  };

  try {
    console.log(`[${new Date().toISOString()}] Supadata Request URL: ${url}`);
    console.log(`[${new Date().toISOString()}] Supadata API Key configured: ${apiKey ? 'Yes' : 'No'}`);

    const response = await fetch(url, options);
    console.log(`[${new Date().toISOString()}] Supadata Response Status: ${response.status}`);
    console.log(`[${new Date().toISOString()}] Supadata Response Headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorBody;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        errorBody = await response.json();
      } else {
        errorBody = await response.text();
      }

      console.error(`[${new Date().toISOString()}] Supadata Error Body:`, errorBody);
      // Log the full text response if it's not JSON
      if (typeof errorBody === 'string') {
        console.error(`[${new Date().toISOString()}] Full Supadata Error Response (non-JSON): ${errorBody}`);
      }
      throw new Error(`Supadata request failed with status ${response.status}: ${typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody)}`);
    }

    const responseText = await response.text();
    console.log(`[${new Date().toISOString()}] Supadata Raw Response: ${responseText.substring(0, 1000)}...`);

    let result;
    try {
      result = JSON.parse(responseText);
      console.log(`[${new Date().toISOString()}] Supadata Parsed JSON:`, result);
    } catch (parseError) {
      console.error(`[${new Date().toISOString()}] Failed to parse Supadata response as JSON:`, parseError);
      console.error(`[${new Date().toISOString()}] Response starts with: ${responseText.substring(0, 200)}`);
      throw new Error(`Supadata returned invalid JSON response`);
    }

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

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Error fetching transcript from Supadata:`, error);

    // Provide more specific error messages
    if (error.message?.includes('SUPADATA_API_KEY is not configured')) {
      throw new Error('Сервис транскрибации не настроен. Пожалуйста, свяжитесь с администратором.');
    }

    if (error.message?.includes('status 401')) {
      throw new Error('Ошибка аутентификации сервиса транскрибации. Пожалуйста, свяжитесь с администратором.');
    }

    if (error.message?.includes('status 404')) {
      throw new Error('Видео не найдено или субтитры недоступны.');
    }

    if (error.message?.includes('status 429')) {
      throw new Error('Превышен лимит запросов к сервису транскрибации. Попробуйте позже.');
    }

    if (error.message?.includes('<!DOCTYPE')) {
      throw new Error('Сервис транскрибации временно недоступен. Попробуйте позже.');
    }

    throw new Error('Не удалось получить транскрипт видео. Возможно, субтитры недоступны для этого видео.');
  }
}

async function getSummary(transcript: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent`;

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
            'X-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
    };

    try {
        console.log(`[${new Date().toISOString()}] Gemini API Request`);
        console.log(`[${new Date().toISOString()}] Gemini API Key configured: ${apiKey ? 'Yes' : 'No'}`);

        const response = await fetch(url, options);
        console.log(`[${new Date().toISOString()}] Gemini Response Status: ${response.status}`);

        if (!response.ok) {
            let errorBody;
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                errorBody = await response.json();
            } else {
                errorBody = await response.text();
            }

            console.error('Gemini API Error:', errorBody);
            // Log the full text response if it's not JSON
            if (typeof errorBody === 'string') {
              console.error(`[${new Date().toISOString()}] Full Gemini Error Response (non-JSON): ${errorBody}`);
            }
            throw new Error(`Gemini API request failed with status ${response.status}: ${typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody)}`);
        }

        const result = await response.json();
        console.log(`[${new Date().toISOString()}] Gemini Response received successfully`);

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
    // Create Supabase client for server-side auth
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check authentication
    console.log(`[${new Date().toISOString()}] API Route: Checking authentication...`);
    console.log(`[${new Date().toISOString()}] API Route: Cookies available:`, cookieStore.getAll());
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error(`[${new Date().toISOString()}] API Route: Authentication failed.`, { authError, user });
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.log(`[${new Date().toISOString()}] API Route: User authenticated successfully:`, user.id);

    // Check daily limit
    const today = new Date().toISOString().split('T')[0]
    const { data: usageData, error: usageError } = await supabase
      .from('user_usage')
      .select('video_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (usageError && usageError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking usage:', usageError)
      return NextResponse.json({ error: 'Failed to check usage limits' }, { status: 500 })
    }

    const currentCount = usageData?.video_count || 0
    if (currentCount >= 3) {
      return NextResponse.json({
        error: 'Daily limit exceeded. You can summarize up to 3 videos per day.'
      }, { status: 429 })
    }

    const body = await req.json();
    const validation = summarizeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { videoUrl } = validation.data;

    const { summary } = await handleSummarizeRequest(videoUrl);

    // Update usage count
    const { error: updateError } = await supabase
      .from('user_usage')
      .upsert({
        user_id: user.id,
        date: today,
        video_count: currentCount + 1,
        updated_at: new Date().toISOString()
      })

    if (updateError) {
      console.error('Error updating usage:', updateError)
      // Don't fail the request if usage update fails
    }

    // Save to history
    const { error: historyError } = await supabase
      .from('video_summaries')
      .insert({
        user_id: user.id,
        video_url: videoUrl,
        summary: summary
      })

    if (historyError) {
      console.error('Error saving to history:', historyError)
      // Don't fail the request if history save fails
    }

    return NextResponse.json({
      summary,
      remainingRequests: 3 - (currentCount + 1)
    });

  } catch (error: any) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred on the server.' }, { status: 500 });
  }
}
