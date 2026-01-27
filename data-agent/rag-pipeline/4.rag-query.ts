/**
 * LangChain RAG (Retrieval Augmented Generation) with Gemini 2.5
 * 
 * This module provides a complete RAG pipeline that:
 * 1. Takes a user query
 * 2. Embeds the query using Google's text-embedding-004
 * 3. Searches for relevant chunks from the vector database
 * 4. Constructs a prompt with retrieved context
 * 5. Generates an answer using Gemini 2.5 Flash
 * 
 * Usage:
 *   const rag = new RAGQuery();
 *   const answer = await rag.query("How do I set up TypeScript?");
 */

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import GeminiEmbedder from "./3.embedding";

// Configuration
const LLM_MODEL = "gemini-2.5-flash"; // or "gemini-1.5-pro" for better quality
const TEMPERATURE = 0.7;
const MAX_TOKENS = 2048;
const TOP_K_RESULTS = 5; // Number of similar chunks to retrieve

export class RAGQuery {
  private embedder: GeminiEmbedder;
  private llm: ChatGoogleGenerativeAI;
  private chain: RunnableSequence;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;

    if (!key) {
      throw new Error(
        "GEMINI_API_KEY not found. Please set it in your .env file."
      );
    }

    // Initialize embedder for semantic search
    this.embedder = new GeminiEmbedder(key);

    // Initialize Gemini LLM
    this.llm = new ChatGoogleGenerativeAI({
      model: LLM_MODEL,
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_TOKENS,
      apiKey: key,
    });

    // Create the RAG chain
    this.chain = this.createRAGChain();

    console.log(`✓ RAG Query System initialized with ${LLM_MODEL}\n`);
  }

  /**
   * Create the LangChain RAG pipeline
   */
  private createRAGChain(): RunnableSequence {
    // Define the prompt template
    const promptTemplate = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a helpful AI assistant with access to a knowledge base of Discord conversations and GitHub repositories.

Your task is to answer questions based ONLY on the provided context. If the context doesn't contain enough information to answer the question, say so honestly.

Key guidelines:
- Be accurate and cite specific information from the context
- If you're referencing code, mention the source (Discord message or GitHub file)
- If the context doesn't answer the question, say "I don't have enough information in the context to answer that"
- Be concise but thorough
- Use markdown formatting for better readability`,
      ],
      [
        "user",
        `Context from knowledge base:
{context}

Question: {question}

Answer:`,
      ],
    ]);

    // Create the chain: prompt -> LLM -> output parser
    return RunnableSequence.from([
      promptTemplate,
      this.llm,
      new StringOutputParser(),
    ]);
  }

  /**
   * Query the RAG system with a question
   * 
   * @param question - User's question
   * @param source - Optional filter (Discord/Github)
   * @param topK - Number of chunks to retrieve (default: 5)
   * @returns Generated answer with sources
   */
  async query(
    question: string,
    source?: "Discord" | "Github",
    topK: number = TOP_K_RESULTS
  ): Promise<{
    answer: string;
    sources: Array<{ content: string; similarity: number; type: string }>;
  }> {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🤔 Question: ${question}`);
    console.log(`${"=".repeat(60)}\n`);

    // Step 1: Retrieve relevant chunks using semantic search
    console.log("📚 Retrieving relevant context...\n");
    const searchResults = await this.embedder.searchSimilar(
      question,
      topK,
      source
    );

    if (searchResults.length === 0) {
      return {
        answer:
          "I don't have any relevant information in my knowledge base to answer this question. Please make sure data has been ingested and embedded.",
        sources: [],
      };
    }

    // Step 2: Format context for the prompt
    const context = searchResults
      .map((result, index) => {
        const sourceType = result.chunk.source;
        const metadata =
          sourceType === "Discord"
            ? `From Discord (@${result.chunk.cleanedData.username} on ${result.chunk.cleanedData.timestamp?.toISOString().split("T")[0]})`
            : `From GitHub (${result.chunk.cleanedData.filename})`;

        return `[Source ${index + 1}] ${metadata}
Relevance: ${(result.similarity * 100).toFixed(1)}%
Content: ${result.chunk.content}
---`;
      })
      .join("\n\n");

    console.log("🤖 Generating answer with Gemini 2.5...\n");

    // Step 3: Generate answer using LLM
    const answer = await this.chain.invoke({
      context,
      question,
    });

    // Step 4: Format sources for output
    const sources = searchResults.map((result) => ({
      content: result.chunk.content.substring(0, 200) + "...",
      similarity: result.similarity,
      type: result.chunk.chunkType,
      source: result.chunk.source,
    }));

    console.log(`\n${"=".repeat(60)}`);
    console.log("✅ Answer Generated!");
    console.log(`${"=".repeat(60)}\n`);
    console.log(`${answer}\n`);
    console.log(`${"─".repeat(60)}`);
    console.log(`📖 Sources: ${sources.length} chunks used\n`);

    return { answer, sources };
  }

  /**
   * Interactive chat mode - maintains conversation history
   */
  async chat(question: string, conversationHistory: string[] = []): Promise<string> {
    // For chat mode, you can extend this to maintain conversation context
    // For now, we'll keep it simple with single-turn queries
    const result = await this.query(question);
    return result.answer;
  }

  /**
   * Batch query multiple questions
   */
  async batchQuery(questions: string[]): Promise<Array<{ question: string; answer: string }>> {
    const results = [];

    for (const question of questions) {
      const result = await this.query(question);
      results.push({
        question,
        answer: result.answer,
      });

      // Small delay to avoid rate limiting
      await this.sleep(500);
    }

    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Interactive terminal query mode
async function main() {
  try {
    const rag = new RAGQuery();

    console.log("\n" + "=".repeat(60));
    console.log("🤖 INTERACTIVE RAG QUERY MODE");
    console.log("=".repeat(60));
    console.log("Ask questions about your Discord/GitHub data!");
    console.log("Commands:");
    console.log("  - Type your question and press Enter");
    console.log("  - Type 'exit' or 'quit' to stop");
    console.log("  - Type 'discord:' before question for Discord-only search");
    console.log("  - Type 'github:' before question for GitHub-only search");
    console.log("=".repeat(60) + "\n");

    // Interactive loop
    while (true) {
      // Prompt user for input
      process.stdout.write("❓ Your question: ");
      
      // Read user input
      const input = await new Promise<string>((resolve) => {
        process.stdin.once("data", (data) => {
          resolve(data.toString().trim());
        });
      });

      // Exit conditions
      if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
        console.log("\n👋 Goodbye!\n");
        process.exit(0);
      }

      // Skip empty input
      if (!input) {
        continue;
      }

      // Parse source filter
      let question = input;
      let source: "Discord" | "Github" | undefined;

      if (input.toLowerCase().startsWith("discord:")) {
        question = input.substring(8).trim();
        source = "Discord";
      } else if (input.toLowerCase().startsWith("github:")) {
        question = input.substring(7).trim();
        source = "Github";
      }

      // Query the RAG system
      await rag.query(question, source);
    }

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}

export default RAGQuery;
