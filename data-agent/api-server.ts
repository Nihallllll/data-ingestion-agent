/**
 * Express API Server for RAG Query System
 * 
 * Provides REST API endpoints for the React frontend to query the RAG system.
 * Supports streaming responses to show progress in real-time.
 */

import express from "express";
import cors from "cors";
import RAGQuery from "./rag-pipeline/4.rag-query";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize RAG system
let ragSystem: RAGQuery;

try {
  ragSystem = new RAGQuery();
  console.log("✅ RAG System initialized");
} catch (error) {
  console.error("❌ Failed to initialize RAG system:", error);
  process.exit(1);
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "RAG API is running" });
});

// Query endpoint with progress updates
app.post("/api/query", async (req, res) => {
  try {
    const { question, source } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log(`\n📝 New query: "${question}"${source ? ` (${source} only)` : ""}`);

    // Set headers for Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send progress updates
    const sendProgress = (step: string, progress: number) => {
      res.write(`data: ${JSON.stringify({ type: "progress", step, progress })}\n\n`);
    };

    try {
      // Step 1: Searching
      sendProgress("Searching knowledge base...", 33);
      await sleep(300); // Small delay for UX

      // Step 2: Retrieving
      sendProgress("Retrieving relevant context...", 66);

      // Execute query
      const result = await ragSystem.query(question, source, 5);

      // Step 3: Generating
      sendProgress("Generating answer...", 100);
      await sleep(200);

      // Send final result
      res.write(
        `data: ${JSON.stringify({
          type: "result",
          answer: result.answer,
          sources: result.sources,
          timestamp: new Date().toISOString(),
        })}\n\n`
      );

      res.write("data: [DONE]\n\n");
      res.end();

      console.log("✅ Query completed successfully\n");
    } catch (error) {
      console.error("❌ Query error:", error);
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        })}\n\n`
      );
      res.end();
    }
  } catch (error) {
    console.error("❌ Request error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

// Simple query endpoint (non-streaming, for compatibility)
app.post("/api/query-simple", async (req, res) => {
  try {
    const { question, source } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log(`\n📝 New query (simple): "${question}"`);

    const result = await ragSystem.query(question, source, 5);

    res.json({
      answer: result.answer,
      sources: result.sources,
      timestamp: new Date().toISOString(),
    });

    console.log("✅ Query completed\n");
  } catch (error) {
    console.error("❌ Query error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

// Get system statistics
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await ragSystem.embedder.searchSimilar("test", 1);
    res.json({
      totalChunks: stats.length > 0 ? "Available" : "No data",
      status: "operational",
    });
  } catch (error) {
    res.json({
      totalChunks: "Unknown",
      status: "error",
    });
  }
});

// Helper function
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Start server
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 RAG API Server Started");
  console.log("=".repeat(60));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🔗 API endpoints:`);
  console.log(`   - POST http://localhost:${PORT}/api/query`);
  console.log(`   - POST http://localhost:${PORT}/api/query-simple`);
  console.log(`   - GET  http://localhost:${PORT}/api/health`);
  console.log("=".repeat(60) + "\n");
});

export default app;
