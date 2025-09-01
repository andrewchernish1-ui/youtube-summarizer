import { handleSummarizeRequest } from '../../app/api/summarize/route';
// import { createRequest, createResponse } from 'node-mocks-http'; // Not directly used in Next.js App Router API tests
// import '@testing-library/jest-dom/extend-expect'; // Moved to jest.setup.js

// Mock environment variables
process.env.SUPADATA_API_KEY = 'mock_supadata_api_key';
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
    // Mock Supadata response
    mockFetch.mockImplementationOnce((url: string, options: RequestInit) => {
      if (url.includes('api.supadata.ai')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ content: 'transcript part one transcript part two' }),
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
    expect(mockFetch).toHaveBeenCalledTimes(2); // One for Supadata, one for Gemini
  });

  it('should handle Supadata transcript fetching failure', async () => {
    mockFetch.mockImplementationOnce((url: string, options: RequestInit) => {
      if (url.includes('api.supadata.ai')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Supadata error response'),
          json: () => Promise.resolve({ message: 'Supadata error' }),
        });
      }
      return Promise.reject(new Error('Unexpected fetch call'));
    });

    await expect(handleSummarizeRequest('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).rejects.toThrow('Failed to fetch transcript.');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle Gemini API summarization failure', async () => {
    // Mock Supadata success
    mockFetch.mockImplementationOnce((url: string, options: RequestInit) => {
      if (url.includes('api.supadata.ai')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ content: 'transcript part one' }),
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
