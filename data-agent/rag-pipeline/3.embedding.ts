/**
 * Google Gemini Text Embedding Service
 * 
 * This module provides text-to-vector conversion using Google's text-embedding-004 model,
 * optimized for use with Gemini 2.5 LLM for RAG (Retrieval Augmented Generation).
 * 
 * Features:
 * - 768-dimensional vectors optimized for Gemini
 * - Task-specific embeddings (RETRIEVAL_DOCUMENT vs RETRIEVAL_QUERY)
 * - Batch processing support
 * - Automatic retry and error handling
 * 
 * Performance:
 * - Batch processing: ~100-500 texts per request
 * - Single embedding: ~200-500ms
 * - Batch embedding: Much faster per text
 */

import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import prisma from "../db-client";
import { toSql } from "pgvector";

// Configuration
const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_DIMENSION = 768;
const BATCH_SIZE = 100; // Google API supports up to 100 per request

export class GeminiEmbedder {
  private genAI: GoogleGenerativeAI;
  private embeddingModel: any;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY not found. Please set it in your .env file or pass it to the constructor."
      );
    }

    this.genAI = new GoogleGenerativeAI(key);
    this.embeddingModel = this.genAI.getGenerativeModel({
      model: EMBEDDING_MODEL,
    });

    console.log(`✓ Gemini Embedder initialized (${EMBEDDING_MODEL}, ${EMBEDDING_DIMENSION} dimensions)`);
  }

  /**
   * Embed a single text string into a 768-dimensional vector.
   * Use for RETRIEVAL_DOCUMENT (indexing) or RETRIEVAL_QUERY (searching).
   * 
   * @param text - Text to embed
   * @param taskType - Type of embedding task (default: RETRIEVAL_DOCUMENT)
   * @returns 768-dimensional embedding vector
   */
  async embedText(
    text: string,
    taskType: TaskType = TaskType.RETRIEVAL_DOCUMENT
  ): Promise<number[]> {
    try {
      const result = await this.embeddingModel.embedContent({
        content: { parts: [{ text }] },
        taskType,
      });

      return result.embedding.values;
    } catch (error) {
      console.error("Error embedding text:", error);
      throw error;
    }
  }

  /**
   * Embed multiple texts in batches for better performance.
   * Automatically splits into chunks of 100 (API limit).
   * 
   * @param texts - Array of texts to embed
   * @param taskType - Type of embedding task (default: RETRIEVAL_DOCUMENT)
   * @returns Array of 768-dimensional embedding vectors
   */
  async embedBatch(
    texts: string[],
    taskType: TaskType = TaskType.RETRIEVAL_DOCUMENT
  ): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const embeddings: number[][] = [];

    // Process in batches of BATCH_SIZE
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      
      try {
        const result = await this.embeddingModel.batchEmbedContents({
          requests: batch.map((text) => ({
            content: { parts: [{ text }] },
            taskType,
          })),
        });

        // Extract embedding values from each result
        const batchEmbeddings = result.embeddings.map(
          (embedding: any) => embedding.values
        );
        embeddings.push(...batchEmbeddings);

        console.log(
          `✓ Embedded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} texts)`
        );

        // Small delay to avoid rate limiting
        if (i + BATCH_SIZE < texts.length) {
          await this.sleep(100);
        }
      } catch (error) {
        console.error(`Error embedding batch ${i}-${i + batch.length}:`, error);
        throw error;
      }
    }

    return embeddings;
  }

  /**
   * Process all chunks from database that don't have embeddings yet.
   * This is the main function to run after chunking is complete.
   * 
   * @param limit - Maximum number of chunks to process (for testing)
   */
  async embedUnprocessedChunks(limit?: number): Promise<void> {
    console.log("\n🚀 Starting embedding process for unprocessed chunks...\n");

    // Fetch chunks without embeddings (embeddedAt null means not yet embedded)
    const chunks = await prisma.chunk.findMany({
      where: {
        embeddedAt: null
      },
      take: limit,
      orderBy: { createdAt: "asc" },
    });

    if (chunks.length === 0) {
      console.log("✓ No unprocessed chunks found. All chunks are embedded!");
      return;
    }

    console.log(`Found ${chunks.length} chunks to embed\n`);

    // Extract texts to embed (use contextMetadata for richer context)
    const textsToEmbed = chunks.map((chunk) => chunk.contextMetadata);

    // Embed in batches
    const embeddings = await this.embedBatch(
      textsToEmbed,
      TaskType.RETRIEVAL_DOCUMENT
    );

    console.log(`\n✓ Generated ${embeddings.length} embeddings\n`);

    // Update database with embeddings
    console.log("💾 Saving embeddings to database...\n");
    
    for (let i = 0; i < chunks.length; i++) {
      await prisma.$executeRaw`
        UPDATE "Chunk"
        SET embedding = ${toSql(embeddings[i])}::vector,
            "embeddedAt" = NOW()
        WHERE id = ${chunks[i]!.id}
      `;

      if ((i + 1) % 50 === 0) {
        console.log(`   Saved ${i + 1}/${chunks.length} embeddings`);
      }
    }

    console.log(`\n✅ Successfully embedded and saved ${chunks.length} chunks!\n`);
  }

  /**
   * Search for similar chunks using pgvector's cosine distance operator.
   * Much faster than calculating similarity in application code.
   * 
   * @param query - Search query text
   * @param topK - Number of results to return (default: 5)
   * @param source - Optional filter by source (Discord/Github)
   * @returns Array of similar chunks with similarity scores
   */
  async searchSimilar(
    query: string,
    topK: number = 5,
    source?: "Discord" | "Github"
  ): Promise<Array<{ chunk: any; similarity: number }>> {
    console.log(`\n🔍 Searching for: "${query}"\n`);

    // Embed the query with RETRIEVAL_QUERY task type
    const queryEmbedding = await this.embedText(query, TaskType.RETRIEVAL_QUERY);

    // Use pgvector's cosine distance operator for fast similarity search
    // <=> is the cosine distance operator (0 = identical, 2 = opposite)
    // We convert to similarity: 1 - (distance / 2)
    
    const vectorString = toSql(queryEmbedding);
    
    // Build query based on source filter
    const results = source
      ? await prisma.$queryRaw<Array<{
          id: string;
          content: string;
          chunkType: string;
          contextMetadata: string;
          source: string;
          distance: number;
          username?: string;
          filename?: string;
          timestamp?: Date;
        }>>`
          SELECT 
            c.id,
            c.content,
            c."chunkType",
            c."contextMetadata",
            c.source,
            c.embedding <=> ${vectorString}::vector as distance,
            cd.username,
            cd.filename,
            cd.timestamp
          FROM "Chunk" c
          LEFT JOIN "CleanedData" cd ON c."cleanedDataId" = cd.id
          WHERE c.embedding IS NOT NULL AND c.source = ${source}
          ORDER BY c.embedding <=> ${vectorString}::vector
          LIMIT ${topK}
        `
      : await prisma.$queryRaw<Array<{
          id: string;
          content: string;
          chunkType: string;
          contextMetadata: string;
          source: string;
          distance: number;
          username?: string;
          filename?: string;
          timestamp?: Date;
        }>>`
          SELECT 
            c.id,
            c.content,
            c."chunkType",
            c."contextMetadata",
            c.source,
            c.embedding <=> ${vectorString}::vector as distance,
            cd.username,
            cd.filename,
            cd.timestamp
          FROM "Chunk" c
          LEFT JOIN "CleanedData" cd ON c."cleanedDataId" = cd.id
          WHERE c.embedding IS NOT NULL
          ORDER BY c.embedding <=> ${vectorString}::vector
          LIMIT ${topK}
        `;

    if (results.length === 0) {
      console.log("⚠️  No embedded chunks found in database");
      return [];
    }

    // Convert distance to similarity score (1 = identical, 0 = opposite)
    const formattedResults = results.map((result) => ({
      chunk: {
        id: result.id,
        content: result.content,
        chunkType: result.chunkType,
        contextMetadata: result.contextMetadata,
        source: result.source,
        cleanedData: {
          username: result.username,
          filename: result.filename,
          timestamp: result.timestamp,
        },
      },
      similarity: 1 - (result.distance / 2), // Convert cosine distance to similarity
    }));

    console.log(`✓ Found ${formattedResults.length} similar chunks:\n`);
    formattedResults.forEach((result, i) => {
      console.log(`${i + 1}. Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`   Type: ${result.chunk.chunkType}`);
      console.log(`   Preview: ${result.chunk.content.substring(0, 100)}...\n`);
    });

    return formattedResults;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Example usage and testing
async function main() {
  try {
    const embedder = new GeminiEmbedder();

    // Test 1: Embed a single text
    console.log("\n=== Test 1: Single Text Embedding ===");
    const text = "How do I configure TypeScript with Prisma?";
    const embedding = await embedder.embedText(text);
    console.log(`✓ Embedded text into ${embedding.length}-dimensional vector\n`);

    // Test 2: Process unprocessed chunks
    console.log("=== Test 2: Process Unprocessed Chunks ===");
    await embedder.embedUnprocessedChunks(10); // Process max 10 for testing

    // Test 3: Search for similar content
    console.log("=== Test 3: Semantic Search ===");
    await embedder.searchSimilar("TypeScript configuration", 3);

  } catch (error) {
    console.error("Error:", error);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}

export default GeminiEmbedder;

