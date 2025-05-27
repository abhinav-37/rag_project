import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { RAGEngine } from './ragEngine';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize RAG engine
let ragEngine: RAGEngine;

async function initializeRAG() {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    console.error('ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  ragEngine = new RAGEngine(anthropicApiKey);

  try {
    await ragEngine.initialize(path.join(__dirname, '../docs'));
    console.log('RAG engine initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RAG engine:', error);
    process.exit(1);
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const chatHandler = async (req: any, res: any) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!ragEngine) {
      return res.status(500).json({ error: 'RAG engine not initialized' });
    }

    const result = await ragEngine.query(message);

    res.json({
      response: result.response,
      sources: result.sources,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

app.post('/api/chat', chatHandler);

const statsHandler = (req: any, res: any) => {
  if (!ragEngine) {
    return res.status(500).json({ error: 'RAG engine not initialized' });
  }

  const stats = ragEngine.getStats();
  res.json(stats);
};

app.get('/api/stats', statsHandler);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ragInitialized: !!ragEngine
  });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
  await initializeRAG();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Place your PDF documents in the "docs" folder');
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
