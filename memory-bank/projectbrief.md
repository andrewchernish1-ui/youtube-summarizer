# Project Brief: YouTube Video Summarizer

## 1. Core Objective

To develop a web service that provides users with concise summaries of YouTube videos. The initial phase (MVP) will focus on delivering a fully functional prototype deployed on Vercel.

## 2. Key Features (Phase 1)

-   **Input:** Users can submit a YouTube video URL through a simple web interface.
-   **Processing:** The backend will fetch the video's transcript and generate a summary using a large language model.
-   **Output:** The generated summary will be displayed to the user on the same page.
-   **Technology Stack:**
    -   **Framework:** Next.js (with App Router)
    -   **Deployment:** Vercel
    -   **Transcription Service:** RapidAPI (YouTube Transcript API)
    -   **Summarization Service:** Gemini API (Gemini 2.5 Flash model)

## 3. Target Audience

Users who need to quickly understand the content of a YouTube video without watching it in its entirety, such as students, researchers, and professionals.

## 4. Project Scope (Phase 1)

-   **In Scope:**
    -   A single-page application for submitting URLs and viewing summaries.
    -   Backend logic implemented as a Next.js API Route (Serverless Function).
    -   Secure handling of API keys using Vercel environment variables.
    -   Unit and API route testing to ensure reliability.
    -   Integration with RapidAPI for transcripts and Gemini API for summaries.
    -   Basic UI with loading and error states.

-   **Out of Scope (for Phase 1):**
    -   User authentication and user accounts.
    -   Database integration for storing history.
    -   Advanced features like managing, saving, or sharing summaries.
    -   Support for languages other than the one provided by the transcript API.

## 5. Success Criteria (Phase 1)

-   The service is successfully deployed and accessible on Vercel.
-   Users can submit a valid YouTube URL and receive a coherent summary.
-   The system correctly handles invalid URLs and API errors.
-   API keys are kept secure and are not exposed on the client-side.
-   Key functionalities are covered by automated tests.
