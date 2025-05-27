import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { Document, DocumentChunk, RAGConfig } from './types';

export class DocumentProcessor {
  private config: RAGConfig;

  constructor(config: RAGConfig) {
    this.config = config;
  }

  async processDocuments(docsDir: string): Promise<Document[]> {
    const documents: Document[] = [];
    const files = fs.readdirSync(docsDir);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      switch (ext) {
        case '.pdf':
          try {
            const document = await this.processPDF(path.join(docsDir, file));
            documents.push(document);
            console.log(`Processed PDF: ${file}`);
          } catch (error) {
            console.error(`Error processing ${file}:`, error);
          }
          break;
        case '.txt':
          try {
            const document = await this.processTextFile(path.join(docsDir, file));
            documents.push(document);
            console.log(`Processed text file: ${file}`);
          } catch (error) {
            console.error(`Error processing ${file}:`, error);
          }
          break;
        case '.docx':
          try {
            const document = await this.processDocxFile(path.join(docsDir, file));
            documents.push(document);
            console.log(`Processed docx file: ${file}`);
          } catch (error) {
            console.error(`Error processing ${file}:`, error);
          }
          break;
        default:
          console.log(`Unsupported file type: ${file}`);
          break;
      }
    }

    return documents;
  }

  private async processPDF(filePath: string): Promise<Document> {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);

    const filename = path.basename(filePath);
    const documentId = this.generateId(filename);

    const chunks = this.createChunks(data.text, documentId, filename);

    return {
      id: documentId,
      filename,
      content: data.text,
      chunks
    };
  }

  private async processTextFile(filePath: string): Promise<Document> {
    const content = fs.readFileSync(filePath, 'utf-8');

    const filename = path.basename(filePath);
    const documentId = this.generateId(filename);

    const chunks = this.createChunks(content, documentId, filename);

    return {
      id: documentId,
      filename,
      content,
      chunks
    };
  }

  private async processDocxFile(filePath: string): Promise<Document> {
    const content = fs.readFileSync(filePath, 'utf-8');

    const filename = path.basename(filePath);
    const documentId = this.generateId(filename);

    const chunks = this.createChunks(content, documentId, filename);

    return {
      id: documentId,
      filename,
      content,
      chunks
    };
  }

  private createChunks(text: string, documentId: string, filename: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    let currentChunk = '';
    let chunkIndex = 0;

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + trimmedSentence;

      if (potentialChunk.length > this.config.maxChunkSize && currentChunk) {
        // Create chunk from current content
        chunks.push({
          id: `${documentId}_chunk_${chunkIndex}`,
          documentId,
          content: currentChunk.trim(),
          metadata: {
            filename,
            section: `chunk_${chunkIndex}`
          }
        });

        chunkIndex++;

        // Start new chunk with overlap
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(this.config.chunkOverlap / 10));
        currentChunk = overlapWords.join(' ') + (overlapWords.length > 0 ? '. ' : '') + trimmedSentence;
      } else {
        currentChunk = potentialChunk;
      }
    }

    // Add the last chunk if it has content
    if (currentChunk.trim()) {
      chunks.push({
        id: `${documentId}_chunk_${chunkIndex}`,
        documentId,
        content: currentChunk.trim(),
        metadata: {
          filename,
          section: `chunk_${chunkIndex}`
        }
      });
    }

    return chunks;
  }

  private generateId(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }
}
