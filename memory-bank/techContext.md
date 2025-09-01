# Technical Context: YouTube Video Summarizer

## 1. Technology Stack

-   **Framework:** **Next.js 14+ (App Router)**
    -   **Reasoning:** Provides a robust framework for building hybrid web applications with Server-Side Rendering (SSR) and Client-Side Rendering (CSR). The App Router is the current standard, offering improved routing, layout management, and support for React Server Components.
-   **Language:** **TypeScript**
    -   **Reasoning:** Ensures type safety, which improves code quality, reduces runtime errors, and enhances developer experience, especially in a project that will scale.
-   **Styling:** **Tailwind CSS** with **shadcn/ui** components.
    -   **Reasoning:** The project is already set up with this stack. It allows for rapid UI development with a utility-first approach and provides a set of accessible, and customizable components.
-   **Deployment Platform:** **Vercel**
    -   **Reasoning:** Offers seamless integration with Next.js, providing automatic deployments, serverless functions for API routes, global CDN, and easy management of environment variables.
-   **Testing:**
    -   **Jest:** For running tests and assertions.
    -   **React Testing Library:** For testing React components to ensure they are rendered and behave correctly from a user's perspective.
    -   **`next-test-api-route-handler`** or a similar library: To test API routes in isolation by mocking requests and responses.

## 2. External APIs

-   **Supadata.ai Transcript API**
    -   **Purpose:** To fetch the transcript (subtitles) of a given YouTube video.
    -   **Authentication:** Requires a Supadata API key (`x-api-key`) sent in the request headers.
    -   **Endpoint:** `https://api.supadata.ai/v1/transcript`
    -   **Parameters:** `url` (YouTube video URL), `text=true` (returns plain text instead of timed segments)
    -   **Response:** JSON with `content` field containing the transcript text
-   **Gemini API (Google AI)**
    -   **Purpose:** To generate a summary from the fetched transcript text.
    -   **Model:** `gemini-2.0-flash` (as specified).
    -   **Authentication:** Requires a Google AI API key (`X-goog-api-key`) sent in the request headers.
    -   **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`

## 3. Development Environment

-   **Package Manager:** `pnpm` (as indicated by `pnpm-lock.yaml`).
-   **Environment Variables:** API keys and other secrets will be managed using a `.env.local` file for local development. This file is included in `.gitignore` to prevent secrets from being committed to version control.
-   **Vercel CLI:** Can be used to sync environment variables from the Vercel cloud to the local development environment (`vercel env pull .env.local`).

## 4. Key Dependencies (to be added)

-   `axios` or `node-fetch`: For making HTTP requests to external APIs from the backend.
-   `jest`, `@testing-library/react`, `@testing-library/jest-dom`: For testing.
-   `zod`: For validating incoming request bodies on the API route to ensure the URL is correctly formatted.
