/**
 * Automated RAG Pipeline Orchestrator
 * 
 * This service continuously monitors for new data and automatically processes it:
 * 1. Watches for new raw data (Data table)
 * 2. Auto-cleans unprocessed data
 * 3. Auto-chunks cleaned data
 * 4. Auto-embeds chunks
 * 
 * Run this service in the background to keep your RAG system always up-to-date.
 * 
 * Usage:
 *   bun run rag-pipeline/auto-pipeline.ts
 */

import prisma from "../db-client";
import GeminiEmbedder from "./3.embedding";

// Import processing functions
import { processUncleanedData } from "./1.cleaning";
import { processUnchunkedData } from "./2.chunking";

// Configuration
const POLL_INTERVAL_MS = 10000; // Check every 10 seconds
const BATCH_SIZE = 50; // Process 50 items at a time
const ENABLE_AUTO_CLEANING = true;
const ENABLE_AUTO_CHUNKING = true;
const ENABLE_AUTO_EMBEDDING = true;

export class AutoPipeline {
  private embedder: GeminiEmbedder;
  private isRunning = false;
  private processedCount = {
    cleaned: 0,
    chunked: 0,
    embedded: 0,
  };

  constructor() {
    this.embedder = new GeminiEmbedder();
  }

  /**
   * Start the automated pipeline
   */
  async start(): Promise<void> {
    this.isRunning = true;

    console.log("\n" + "=".repeat(60));
    console.log("🤖 AUTOMATED RAG PIPELINE STARTED");
    console.log("=".repeat(60));
    console.log(`✓ Polling interval: ${POLL_INTERVAL_MS / 1000}s`);
    console.log(`✓ Batch size: ${BATCH_SIZE}`);
    console.log(`✓ Auto-cleaning: ${ENABLE_AUTO_CLEANING ? "ON" : "OFF"}`);
    console.log(`✓ Auto-chunking: ${ENABLE_AUTO_CHUNKING ? "ON" : "OFF"}`);
    console.log(`✓ Auto-embedding: ${ENABLE_AUTO_EMBEDDING ? "ON" : "OFF"}`);
    console.log("=".repeat(60) + "\n");

    console.log("👀 Watching for new data...\n");

    // Main processing loop
    while (this.isRunning) {
      try {
        let hasWork = false;

        // Step 1: Clean unprocessed raw data
        if (ENABLE_AUTO_CLEANING) {
          const cleaned = await this.autoClean();
          if (cleaned > 0) hasWork = true;
        }

        // Step 2: Chunk uncleaned data
        if (ENABLE_AUTO_CHUNKING) {
          const chunked = await this.autoChunk();
          if (chunked > 0) hasWork = true;
        }

        // Step 3: Embed unchunked data
        if (ENABLE_AUTO_EMBEDDING) {
          const embedded = await this.autoEmbed();
          if (embedded > 0) hasWork = true;
        }

        // Show status periodically
        if (!hasWork) {
          // Only log every 6th iteration (1 minute if 10s interval)
          if (Math.random() < 0.16) {
            this.showStatus();
          }
        }

        // Wait before next poll
        await this.sleep(POLL_INTERVAL_MS);
      } catch (error) {
        console.error("❌ Error in pipeline:", error);
        console.log("⏸️  Waiting 30s before retry...\n");
        await this.sleep(30000);
      }
    }
  }

  /**
   * Stop the automated pipeline
   */
  stop(): void {
    console.log("\n🛑 Stopping automated pipeline...");
    this.isRunning = false;
  }

  /**
   * Auto-clean unprocessed raw data
   */
  private async autoClean(): Promise<number> {
    // Find raw data that hasn't been processed
    const unprocessedData = await prisma.data.findMany({
      where: {
        processed: false,
        deletedAt: null,
      },
      take: BATCH_SIZE,
      orderBy: { createdAt: "asc" },
    });

    if (unprocessedData.length === 0) {
      return 0;
    }

    console.log(`\n🧹 Cleaning ${unprocessedData.length} new records...`);

    const cleaned = await processUncleanedData();

    this.processedCount.cleaned += cleaned;

    console.log(`✅ Cleaned ${cleaned} records\n`);

    return cleaned;
  }

  /**
   * Auto-chunk cleaned data that hasn't been chunked
   */
  private async autoChunk(): Promise<number> {
    // Find cleaned data without chunks
    const unchunkedData = await prisma.cleanedData.findMany({
      where: {
        chunks: {
          none: {}, // Has no chunks yet
        },
      },
      take: BATCH_SIZE,
      orderBy: { createdAt: "asc" },
    });

    if (unchunkedData.length === 0) {
      return 0;
    }

    console.log(`\n✂️  Chunking ${unchunkedData.length} cleaned records...`);

    const chunked = await processUnchunkedData();

    this.processedCount.chunked += chunked;

    console.log(`✅ Chunked ${chunked} records\n`);

    return chunked;
  }

  /**
   * Auto-embed chunks that don't have embeddings
   */
  private async autoEmbed(): Promise<number> {
    // Find chunks without embeddings
    const unembeddedChunks = await prisma.chunk.findMany({
      where: {
        embeddedAt: null,
      },
      take: BATCH_SIZE,
      orderBy: { createdAt: "asc" },
    });

    if (unembeddedChunks.length === 0) {
      return 0;
    }

    console.log(`\n🧠 Embedding ${unembeddedChunks.length} chunks...`);

    await this.embedder.embedUnprocessedChunks(BATCH_SIZE);

    this.processedCount.embedded += unembeddedChunks.length;

    console.log(`✅ Embedded ${unembeddedChunks.length} chunks\n`);

    return unembeddedChunks.length;
  }

  /**
   * Show current processing status
   */
  private showStatus(): void {
    const now = new Date().toLocaleTimeString();
    console.log(`[${now}] 💤 No new data. Total processed: Cleaned=${this.processedCount.cleaned}, Chunked=${this.processedCount.chunked}, Embedded=${this.processedCount.embedded}`);
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      ...this.processedCount,
      isRunning: this.isRunning,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Graceful shutdown handling
let pipeline: AutoPipeline | null = null;

process.on("SIGINT", () => {
  console.log("\n\n📊 Final Statistics:");
  if (pipeline) {
    const stats = pipeline.getStats();
    console.log(`   Cleaned: ${stats.cleaned}`);
    console.log(`   Chunked: ${stats.chunked}`);
    console.log(`   Embedded: ${stats.embedded}`);
    pipeline.stop();
  }
  process.exit(0);
});

// Main function
async function main() {
  try {
    pipeline = new AutoPipeline();
    await pipeline.start();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}

export default AutoPipeline;
