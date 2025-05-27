# RAG Chatbot for Customer Support Documentation

A Retrieval-Augmented Generation (RAG) chatbot built with TypeScript that answers questions based on PDF documentation using Anthropic's Claude API.

## Features

- **PDF Document Processing**: Automatically processes PDF files and extracts text content
- **Intelligent Chunking**: Splits documents into manageable chunks with overlap for better context
- **Vector Similarity Search**: Uses TF-IDF-like embeddings for finding relevant content
- **Claude Integration**: Uses Anthropic's Claude API for generating natural responses
- **Source Attribution**: Shows which documents were used to generate responses
- **"I Don't Know" Responses**: Returns "I don't know" when information isn't available in the documents
- **Simple Web Interface**: Clean, responsive chat interface built with vanilla HTML/CSS/JS

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and add your Anthropic API key:

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=your_actual_api_key_here
```

You can get an API key from [Anthropic Console](https://console.anthropic.com/).

### 3. Add Your PDF Documents

Place your PDF documents in the `docs/` folder. The system will automatically process all PDF files in this directory when the server starts.

### 4. Build and Run

```bash
# Build the TypeScript code
npm run build

# Start the server
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### 5. Access the Chatbot

Open your browser and go to `http://localhost:3000` to use the chatbot interface.

## Project Structure

```
rag_project/
├── src/
│   ├── types.ts              # TypeScript interfaces
│   ├── documentProcessor.ts  # PDF processing and chunking
│   ├── vectorStore.ts        # Vector embeddings and similarity search
│   ├── ragEngine.ts          # Main RAG logic
│   └── server.ts             # Express server
├── public/
│   ├── index.html            # Chat interface
│   ├── style.css             # Styling
│   └── script.js             # Frontend JavaScript
├── docs/                     # Place your PDF files here
├── dist/                     # Compiled JavaScript (generated)
└── README.md
```

## API Endpoints

- `GET /` - Chat interface
- `POST /api/chat` - Send a message to the chatbot
- `GET /api/health` - Check server health
- `GET /api/stats` - Get statistics about loaded documents

## How It Works

1. **Document Processing**: PDF files are processed and split into chunks
2. **Embedding Generation**: Simple TF-IDF-like embeddings are created for each chunk
3. **Query Processing**: User queries are converted to embeddings
4. **Similarity Search**: Most relevant chunks are found using cosine similarity
5. **Response Generation**: Claude generates responses based on relevant chunks
6. **Source Attribution**: The system tracks which documents were used

## Configuration

You can modify the RAG configuration in `src/ragEngine.ts`:

```typescript
const config = {
  maxChunkSize: 1000,        // Maximum characters per chunk
  chunkOverlap: 200,         // Overlap between chunks
  maxRelevantChunks: 5,      // Max chunks to use for response
  similarityThreshold: 0.1   // Minimum similarity score
};
```

## Limitations

- Uses simple TF-IDF embeddings (for production, consider using proper embedding models)
- Processes documents on server startup (for large document sets, consider persistent storage)
- Single-threaded processing (could be optimized for large document collections)

## Troubleshooting

1. **"RAG engine not initialized"**: Make sure you have PDF files in the `docs/` folder
2. **API errors**: Check that your Anthropic API key is correct and has sufficient credits
3. **No responses**: Ensure your PDF files contain readable text (not just images)

## Next Steps for Production

- Use proper embedding models (OpenAI, Cohere, etc.)
- Add persistent vector storage (Pinecone, Weaviate, etc.)
- Implement user authentication
- Add conversation history
- Optimize for larger document collections
- Add support for more file formats
