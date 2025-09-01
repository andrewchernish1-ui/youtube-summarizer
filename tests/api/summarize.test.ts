import { handleSummarizeRequest } from '../../app/api/summarize/route';
// import { createRequest, createResponse } from 'node-mocks-http'; // Not directly used in Next.js App Router API tests
// import '@testing-library/jest-dom/extend-expect'; // Moved to jest.setup.js

// Mock environment variables
process.env.RAPIDAPI_KEY = 'mock_rapidapi_key';
process.env.RAPIDAPI_HOST = 'mock_rapidapi_host';
process.env.GEMINI_API_KEY = 'mock_gemini_api_key';

// Mock the fetch API
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('handleSummarizeRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error for an invalid YouTube URL', async () => {
    await expect(handleSummarizeRequest('invalid-url')).rejects.toThrow('Invalid YouTube URL provided.');
  });

  it('should throw an error for a non-YouTube URL', async () => {
    await expect(handleSummarizeRequest('https://www.google.com')).rejects.toThrow('Invalid YouTube URL provided.');
  });

  it('should return a summary for a valid YouTube URL', async () => {
    // Mock RapidAPI response
    mockFetch.mockImplementationOnce((url: string, options: RequestInit) => {
      if (url.includes(process.env.RAPIDAPI_HOST!)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ subtitle: 'transcript part one' }, { subtitle: 'transcript part two' }]),
        });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    // Mock Gemini API response
    mockFetch.mockImplementationOnce((url: string, options: RequestInit) => {
      if (url.includes('generativelanguage.googleapis.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: 'Это сгенерированное резюме на русском языке.' }] } }] }),
        });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    const result = await handleSummarizeRequest('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    expect(result.summary).toBe('Это сгенерированное резюме на русском языке.');
    expect(mockFetch).toHaveBeenCalledTimes(2); // One for RapidAPI, one for Gemini
  });

  it('should handle RapidAPI transcript fetching failure', async () => {
    mockFetch.mockImplementationOnce((url: string, options: RequestInit) => {
      if (url.includes(process.env.RAPIDAPI_HOST!)) {
        return Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('RapidAPI error response'),
          json: () => Promise.resolve({ message: 'RapidAPI error' }),
        });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    await expect(handleSummarizeRequest('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).rejects.toThrow('Failed to fetch transcript.');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle Gemini API summarization failure', async () => {
    // Mock RapidAPI success
    mockFetch.mockImplementationOnce((url: string, options: RequestInit) => {
      if (url.includes(process.env.RAPIDAPI_HOST!)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ subtitle: 'transcript part one' }]),
        });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    // Mock Gemini API failure
    mockFetch.mockImplementationOnce((url: string, options: RequestInit) => {
      if (url.includes('generativelanguage.googleapis.com')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: { message: 'Gemini error' } }),
        });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    await expect(handleSummarizeRequest('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).rejects.toThrow('Failed to generate summary.');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
