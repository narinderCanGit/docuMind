# DocuMind - RAG Document Chat Application

DocuMind is a modern web application that allows users to upload documents (PDF, CSV) or provide website URLs, and then chat with an AI assistant about the content of those documents. It uses a Retrieval-Augmented Generation (RAG) approach to provide accurate, contextually-relevant answers.

## Features

- Upload and process PDF and CSV documents
- Add content from websites
- Submit text directly to the knowledge base
- Chat with an AI assistant about your documents
- View sources for the assistant's responses
- Responsive UI for desktop and mobile
- Dark/Light theme switcher
- Beautiful gradient backgrounds
- Modern Material UI interface

## Tech Stack

- **Frontend**: React, Material UI, Vite, Axios
- **Backend**: Express.js, Multer
- **AI & Vector Store**: OpenAI, LangChain, Qdrant
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

## Deployment

This application is configured for deployment on Vercel. Use the following steps:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Add the required environment variables in Vercel's dashboard
4. Deploy!

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `QDRANT_URL`: URL for your Qdrant instance
- `COLLECTION_NAME`: Name of the collection in Qdrant
- `VITE_API_URL`: API URL for frontend requests

## Project Structure

```
documind/
├── api/                 # Backend API
│   └── index.js         # Express server
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── ChatInterface.jsx
│   │   └── DocumentInput.jsx
│   ├── App.jsx          # Main application component
│   ├── App.css          # Styles
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── .env.example         # Example environment variables
└── vercel.json          # Vercel deployment configuration
```
