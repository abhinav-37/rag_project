export interface Document {
  id: string;
  filename: string;
  content: string;
  chunks: DocumentChunk[];
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding?: number[];
  metadata: {
    page?: number;
    section?: string;
    filename: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface QueryResult {
  relevantChunks: DocumentChunk[];
  response: string;
  sources: string[];
}

export interface RAGConfig {
  maxChunkSize: number;
  chunkOverlap: number;
  maxRelevantChunks: number;
  similarityThreshold: number;
}

export interface EmbeddingResponse {
  embedding: number[];
}
