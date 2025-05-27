import { DocumentChunk } from './types';

export class VectorStore {
  private chunks: DocumentChunk[] = [];

  addChunks(chunks: DocumentChunk[]): void {
    this.chunks.push(...chunks);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Simple TF-IDF-like embedding for demonstration
    // In a production system, you'd use a proper embedding model
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const wordFreq: { [key: string]: number } = {};
    
    // Count word frequencies
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Create a simple vocabulary from all chunks
    const vocabulary = this.getVocabulary();
    const embedding = new Array(vocabulary.length).fill(0);
    
    // Create embedding vector
    vocabulary.forEach((word, index) => {
      if (wordFreq[word]) {
        embedding[index] = wordFreq[word] / words.length; // Normalized frequency
      }
    });
    
    return embedding;
  }

  async addEmbeddingsToChunks(): Promise<void> {
    for (const chunk of this.chunks) {
      if (!chunk.embedding) {
        chunk.embedding = await this.generateEmbedding(chunk.content);
      }
    }
  }

  async findSimilarChunks(query: string, maxResults: number = 5, threshold: number = 0.1): Promise<DocumentChunk[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    
    const similarities = this.chunks.map(chunk => ({
      chunk,
      similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding || [])
    }));
    
    return similarities
      .filter(item => item.similarity > threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults)
      .map(item => item.chunk);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private getVocabulary(): string[] {
    const words = new Set<string>();
    
    this.chunks.forEach(chunk => {
      const chunkWords = chunk.content.toLowerCase().split(/\W+/).filter(w => w.length > 2);
      chunkWords.forEach(word => words.add(word));
    });
    
    return Array.from(words).sort();
  }

  getChunkCount(): number {
    return this.chunks.length;
  }

  getAllChunks(): DocumentChunk[] {
    return this.chunks;
  }
}
