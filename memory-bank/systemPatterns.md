# System Patterns: YouTube Video Summarizer

## 1. Overall Architecture

The application follows a serverless architecture, leveraging the capabilities of Next.js and Vercel. The core pattern is a **client-server model** where the frontend (React components) communicates with a backend API route, which in turn acts as a proxy or orchestrator for external services.

```mermaid
graph TD
    A[User's Browser] --&gt;|1. POST /api/summarize with YouTube URL| B(Next.js API Route on Vercel);
    B --&gt;|2. Request Transcript| C{RapidAPI};
    C --&gt;|3. Return Transcript| B;
    B --&gt;|4. Request Summary with Transcript| D{Gemini API};
    D --&gt;|5. Return Summary| B;
    B --&gt;|6. Return Summary to Client| A;
```

## 2. Frontend Pattern: Client-Side State Management

-   **Component Structure:** The UI will be built with a clear separation of concerns.
    -   A "smart" container component on the main page (`app/page.tsx`) will manage the application's state (URL input, loading status, summary result, errors).
    -   "Dumb" presentational components (from `components/ui/` or custom-built) will be used for the form, input fields, buttons, and display areas. They will receive data and callbacks as props.
-   **State Management:** For the MVP, React's built-in state management hooks (`useState`, `useEffect`) will be sufficient.
    -   `useState` will handle the form input, loading state, final summary, and any error messages.
    -   `useEffect` will not be heavily needed for the main flow but could be used for side effects like clearing errors when the user starts typing again.

## 3. Backend Pattern: API Route as an Orchestrator

-   **Single Responsibility:** The `/api/summarize` route has a single responsibility: to orchestrate the process of fetching a transcript and generating a summary. It does not store any state.
-   **Security - API Key Protection:** The API route acts as a secure proxy. All communication with external services (RapidAPI, Gemini API) happens on the server-side. API keys are stored in Vercel's environment variables and are never exposed to the client's browser. This is a critical security pattern.
-   **Error Handling:** The API route will implement robust error handling.
    -   It will validate the incoming request payload (e.g., using Zod) to ensure a valid URL is provided.
    -   It will use `try...catch` blocks to handle potential failures during API calls to external services.
    -   It will return meaningful HTTP status codes and error messages to the client (e.g., `400 Bad Request` for an invalid URL, `500 Internal Server Error` for an external API failure).

## 4. Testing Patterns

-   **API Route Testing:** API routes will be tested in isolation. Tests will mock the external `fetch` or `axios` calls to RapidAPI and Gemini API. This allows for testing the route's logic (request validation, success response, error handling) without making actual network requests, making tests fast and reliable.
-   **Component Testing:** Frontend components will be tested using React Testing Library, focusing on user interactions. Tests will simulate user behavior like typing in the input field, clicking the submit button, and verifying that the UI updates correctly to show loading states, results, or error messages.
