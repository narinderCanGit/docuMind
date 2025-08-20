# DocuMind - RAG Document Chat Application

DocuMind is a modern web application that allows users to upload documents (PDF, CSV) or provide website URLs, and then chat with an AI assistant about the content of those documents. It uses a Retrieval-Augmented Generation (RAG) approach to provide accurate, contextually-relevant answers. The app also features audio transcription, allowing users to speak their queries and have them automatically transcribed.

## Features

- Upload and process PDF and CSV documents
- Add content from websites
- Submit text directly to the knowledge base
- Chat with an AI assistant about your documents
- Record and transcribe audio messages automatically using OpenAI Whisper
- Edit transcribed messages before sending
- View sources for the assistant's responses
- Responsive UI for desktop and mobile
- Dark/Light theme switcher
- Beautiful gradient backgrounds
- Modern Material UI interface
- Real-time audio visualization during recording

## Tech Stack

- **Frontend**: 
  - React, Material UI, Vite
  - Axios for API requests
  - React-Mic for audio recording and visualization
- **Backend**: 
  - Express.js for the server
  - Multer for file uploads and memory storage
  - OpenAI Whisper API for audio transcription
- **AI & Vector Store**: 
  - OpenAI GPT models for chat responses
  - LangChain for document processing and RAG pipeline
  - Qdrant for vector storage and similarity search
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- pnpm (v10 or later)
- Qdrant instance (local or cloud)
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```
3. Create a `.env` file based on `.env.example` and add your API keys

### Running Locally

1. Start the server:
   ```
   pnpm run server
   ```
2. In a separate terminal, start the frontend:
   ```
   pnpm run dev
   ```
3. Open http://localhost:5173 in your browser

### Using the Audio Transcription Feature

1. Click the microphone icon in the chat input field to start recording
2. Speak your question or comment clearly
3. Click the microphone icon again to stop recording
4. The system will automatically transcribe your speech using OpenAI Whisper
5. Review and edit the transcribed text if needed
6. Click the send button to submit your question

## Deployment

### Vercel Deployment

This application is configured for deployment on Vercel. Use the following steps:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add the required environment variables in Vercel's dashboard
4. Deploy!

### Docker Deployment

The project includes a docker-compose.yml file for containerized deployment:

1. Make sure Docker and Docker Compose are installed on your system
2. Run the following command to start all services:
   ```
   docker-compose up -d
   ```
3. This will start both the application and a Qdrant instance for vector storage
4. Access the application at http://localhost:6333

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for chat completions and audio transcription
- `QDRANT_URL`: URL for your Qdrant instance (local or cloud)
- `COLLECTION_NAME`: Name of the collection in Qdrant for storing document embeddings
- `VITE_API_URL`: API URL for frontend requests (e.g., http://localhost:3000 for development)

## System Requirements

- **Node.js**: v18.0.0 or later
- **pnpm**: v10.0.0 or later
- **Memory**: At least 4GB RAM recommended for running the vector database
- **Storage**: Minimum 1GB free space for dependencies and document storage
- **Browser**: Modern browsers like Chrome, Firefox, Safari, or Edge (latest versions)
- **Microphone**: Required for the audio transcription feature

## Key Dependencies

- **React**: ^19.1.1
- **Material UI**: ^7.3.1
- **OpenAI SDK**: ^5.12.2
- **LangChain**: Various packages including @langchain/openai, @langchain/qdrant
- **React-Mic**: ^12.4.6 for audio recording functionality
- **Express**: ^5.1.0
- **Multer**: ^2.0.2 for file uploads
- **Axios**: ^1.11.0 for API requests

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Project Structure

```
documind/
├── api/                 # Backend API
│   ├── index.js         # Express server
│   └── uploads/         # Temporary storage for uploaded files
├── public/              # Static assets
│   └── vite.svg         # Vite logo
├── src/
│   ├── components/      # React components
│   │   ├── ChatInterface.jsx   # Chat UI with audio recording
│   │   ├── DocumentInput.jsx   # Document upload interface
│   │   └── NotificationBar.jsx # Notification system
│   ├── assets/          # Static assets for the frontend
│   │   └── react.svg    # React logo
│   ├── App.jsx          # Main application component
│   ├── App.css          # Styles
│   ├── main.jsx         # Entry point
│   ├── index.css        # Global styles
├── .env.example         # Example environment variables
├── docker-compose.yml   # Docker configuration for Qdrant and application
├── index.html           # HTML entry point for the Vite application
├── package.json         # Project dependencies
├── vite.config.js       # Vite configuration
└── vercel.json          # Vercel deployment configuration
```
