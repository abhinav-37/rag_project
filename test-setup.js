// Simple test to verify the document processing works
const { DocumentProcessor } = require('./dist/documentProcessor');
const { VectorStore } = require('./dist/vectorStore');

async function testSetup() {
  console.log('Testing document processing...');
  
  const config = {
    maxChunkSize: 1000,
    chunkOverlap: 200,
    maxRelevantChunks: 5,
    similarityThreshold: 0.1
  };
  
  const processor = new DocumentProcessor(config);
  const vectorStore = new VectorStore();
  
  try {
    // Process documents
    const documents = await processor.processDocuments('./docs');
    console.log(`Processed ${documents.length} documents`);
    
    // Add chunks to vector store
    const allChunks = documents.flatMap(doc => doc.chunks);
    vectorStore.addChunks(allChunks);
    console.log(`Added ${allChunks.length} chunks to vector store`);
    
    // Generate embeddings
    await vectorStore.addEmbeddingsToChunks();
    console.log('Generated embeddings for all chunks');
    
    // Test similarity search
    const testQuery = "How do I reset my password?";
    const similarChunks = await vectorStore.findSimilarChunks(testQuery, 3);
    console.log(`\nTest query: "${testQuery}"`);
    console.log(`Found ${similarChunks.length} similar chunks:`);
    
    similarChunks.forEach((chunk, index) => {
      console.log(`\n${index + 1}. From: ${chunk.metadata.filename}`);
      console.log(`Content: ${chunk.content.substring(0, 200)}...`);
    });
    
    console.log('\n✅ Setup test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Add your Anthropic API key to the .env file');
    console.log('2. Run: npm start');
    console.log('3. Open http://localhost:3000 in your browser');
    
  } catch (error) {
    console.error('❌ Error during setup test:', error);
  }
}

testSetup();
