# Meeting Minutes Generator

Noted takes meeting audio, transcripts, and messy notes to generate clear, structured, and actionable meeting minutes. It includes key points, decisions, and action items.

## Features

- **Audio Recording**: Record meeting audio directly within the app using ffmpeg.
- **Transcription**: Utilizes Deepgram for accurate speech-to-text conversion.
- **Note Taking**: Integrated note-taking interface.
- **AI Processing**: Uses LangChain and Google GenAI to structure notes and transcripts into actionable minutes.

## Project Structure

- **backend/**: Electron main process and backend logic.
- **frontend/**: React-based user interface.

## Getting Started

### Prerequisites

- Node.js installed.
- Google GenAI API Key.
- Deepgram API Key.

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
    (This will install dependencies for both frontend and backend via the `postinstall` script).

### Running the App

To run both frontend and backend concurrently:

```bash
npm run dev
```
