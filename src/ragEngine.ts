import Anthropic from "@anthropic-ai/sdk";
import { DocumentProcessor } from "./documentProcessor";
import { VectorStore } from "./vectorStore";
import { QueryResult, RAGConfig, DocumentChunk } from "./types";

export class RAGEngine {
  private anthropic: Anthropic;
  private documentProcessor: DocumentProcessor;
  private vectorStore: VectorStore;
  private config: RAGConfig;
  private isInitialized: boolean = false;

  constructor(anthropicApiKey: string, config?: Partial<RAGConfig>) {
    this.anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    this.config = {
      maxChunkSize: 1000,
      chunkOverlap: 200,
      maxRelevantChunks: 5,
      similarityThreshold: 0.1,
      ...config,
    };

    this.documentProcessor = new DocumentProcessor(this.config);
    this.vectorStore = new VectorStore();
  }

  async initialize(docsDirectory: string): Promise<void> {
    console.log("Initializing RAG engine...");

    // Process documents
    const documents = await this.documentProcessor.processDocuments(
      docsDirectory
    );
    console.log(`Processed ${documents.length} documents`);

    // Add chunks to vector store
    const allChunks = documents.flatMap((doc) => doc.chunks);
    this.vectorStore.addChunks(allChunks);
    console.log(`Added ${allChunks.length} chunks to vector store`);

    // Generate embeddings
    await this.vectorStore.addEmbeddingsToChunks();
    console.log("Generated embeddings for all chunks");

    this.isInitialized = true;
    console.log("RAG engine initialized successfully");
  }

  async query(userQuery: string): Promise<QueryResult> {
    if (!this.isInitialized) {
      throw new Error("RAG engine not initialized. Call initialize() first.");
    }

    // Retrieve relevant chunks
    const relevantChunks = await this.vectorStore.findSimilarChunks(
      userQuery,
      this.config.maxRelevantChunks,
      this.config.similarityThreshold
    );

    // If no relevant chunks found, return "I don't know"
    if (relevantChunks.length === 0) {
      return {
        relevantChunks: [],
        response:
          "I don't know. The information you're asking about is not available in the provided documentation.",
        sources: [],
      };
    }

    // Generate response using Anthropic
    const response = await this.generateResponse(userQuery, relevantChunks);

    // Extract unique sources
    const sources = [
      ...new Set(relevantChunks.map((chunk) => chunk.metadata.filename)),
    ];

    return {
      relevantChunks,
      response,
      sources,
    };
  }

  private async generateResponse(
    query: string,
    chunks: DocumentChunk[]
  ): Promise<string> {
    const context = chunks
      .map(
        (chunk) =>
          `\nContent: ${chunk.content}`
      )
      .join("\n\n---\n\n");

    const prompt = `You are a helpful customer support assistant. Answer the user's question based ONLY on the provided context from the documentation. If the information is not available in the context, respond with "I don't know."

Context from documentation:
${context}

User Question: ${query}

Instructions:
- Only use information from the provided context
- If the answer is not in the context, say "I don't know"
- Be helpful and provide specific details when available
- Do not provide sources

Answer:`;

    try {
      const message = await this.anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const responseText = message.content[0];
      if (responseText.type === "text") {
        return responseText.text;
      } else {
        return "I don't know. Unable to process the response.";
      }
    } catch (error) {
      console.error("Error generating response:", error);
      return "I don't know. There was an error processing your request.";
    }
  }

  getStats(): { documentsProcessed: number; chunksStored: number } {
    return {
      documentsProcessed: 0, // We could track this if needed
      chunksStored: this.vectorStore.getChunkCount(),
    };
  }
}
