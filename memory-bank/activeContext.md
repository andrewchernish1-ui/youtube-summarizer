# Active Context: YouTube Video Summarizer

## 1. Current Focus

The immediate goal is to build the Minimum Viable Product (MVP) of the YouTube Summarizer service as defined in the `projectbrief.md`.

The current phase of work is **Phase 1: Initial Setup and Backend Development**.

## 2. Recent Changes &amp; Decisions

-   **Decision:** The project will use the **Next.js App Router** (`/app` directory) instead of the Pages Router (`/pages`). This decision was made because the existing project structure is already configured for it, and it is the modern standard for Next.js development.
-   **Action:** The Memory Bank has been initialized with the core documents (`projectbrief.md`, `productContext.md`, `techContext.md`, `systemPatterns.md`). This provides a documented foundation for the project.

## 3. Next Steps

1.  **Complete Memory Bank Initialization:**
    -   Create and populate `progress.md`.

2.  **Environment Setup:**
    -   Create the `.env.local` file to prepare for storing API keys. The actual keys will need to be provided by the user.

3.  **Backend API Development:**
    -   Create the directory structure `app/api/summarize/`.
    -   Implement the `route.ts` file for the API endpoint.
    -   Install necessary dependencies like `zod` for validation.
    -   Write the core logic for the API:
        -   Parse and validate the incoming request.
        -   Call the RapidAPI service to get the transcript.
        -   Call the Gemini API to get the summary.
        -   Return the response or an appropriate error.

## 4. Key Considerations &amp; Blockers

-   **API Keys:** I will need the actual API keys for RapidAPI and Gemini to proceed with the implementation of the backend logic. I will create the structure and logic, but it can only be fully tested with valid keys.
-   **YouTube Video ID Extraction:** A utility function will be needed to reliably extract the video ID from various YouTube URL formats (e.g., `youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/embed/...`).
-   **Transcript Format:** The exact format of the transcript returned by the RapidAPI needs to be handled. It might be a single block of text or an array of timed segments. If it's the latter, it will need to be concatenated into a single string before being sent to the Gemini API.
