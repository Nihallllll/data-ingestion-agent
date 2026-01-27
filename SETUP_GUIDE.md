# 🚀 Data Ingestion Agent - Complete Setup Guide

## 📋 Overview

This is a **RAG (Retrieval Augmented Generation) system** that:
1. **Ingests data** from Discord servers and GitHub repositories
2. **Cleans and structures** the raw data
3. **Chunks** it into meaningful pieces
4. **Embeds** chunks into 768-dimensional vectors using Google's text-embedding-004
5. **Stores** everything in Neon PostgreSQL with pgvector
6. **Retrieves** relevant context and generates answers using Gemini 2.5

---

## 🏗️ Architecture & Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                            │
├─────────────────────┬───────────────────────────────────────┤
│   Discord Server    │        GitHub Repos                   │
│   (messages, code)  │    (code, docs, READMEs)             │
└──────────┬──────────┴───────────────┬─────────────────────┘
           │                          │
           v                          v
    ┌──────────────────────────────────────┐
    │     1. DATA INGESTION (Raw Data)     │
    │  discord-pipeline/ | github-pipeline/│
    │  Stores in: Data table (JSON)        │
    └──────────────────┬───────────────────┘
                       │
                       v
    ┌──────────────────────────────────────┐
    │   2. CLEANING (rag-pipeline/1.*.ts)  │
    │  - Remove noise, extract metadata    │
    │  - Stores in: CleanedData table      │
    └──────────────────┬───────────────────┘
                       │
                       v
    ┌──────────────────────────────────────┐
    │  3. CHUNKING (rag-pipeline/2.*.ts)   │
    │  - Split into semantic chunks        │
    │  - Add context metadata              │
    │  - Stores in: Chunk table            │
    └──────────────────┬───────────────────┘
                       │
                       v
    ┌──────────────────────────────────────┐
    │  4. EMBEDDING (rag-pipeline/3.*.ts)  │
    │  - Convert to 768-dim vectors        │
    │  - Google text-embedding-004         │
    │  - Stores: embedding column (vector) │
    └──────────────────┬───────────────────┘
                       │
                       v
    ┌──────────────────────────────────────┐
    │        NEON DB (PostgreSQL)          │
    │         with pgvector                │
    │  - Fast cosine similarity search     │
    │  - HNSW indexing                     │
    └──────────────────┬───────────────────┘
                       │
                       v
    ┌──────────────────────────────────────┐
    │   5. RAG QUERY (rag-pipeline/4.*.ts) │
    │  - User asks question                │
    │  - Retrieve top-K similar chunks     │
    │  - Generate answer with Gemini 2.5   │
    └──────────────────────────────────────┘
```

---

## 🔧 Prerequisites

1. **Node.js/Bun** installed
2. **PostgreSQL database** (Neon recommended) with **pgvector** enabled
3. **Google Gemini API Key** ([Get it here](https://makersuite.google.com/app/apikey))
4. **Discord Bot Token** (optional, for Discord ingestion)
5. **GitHub Personal Access Token** (optional, for GitHub ingestion)

---

## ⚙️ Setup Instructions

### Step 1: Install Dependencies

```bash
cd data-agent
bun install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the `data-agent/` folder:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@your-neon-host/neondb?sslmode=require"

# Google Gemini API Key (REQUIRED for embeddings & RAG)
GEMINI_API_KEY="your-gemini-api-key-here"

# Discord Bot Token (optional, only if using Discord ingestion)
DISCORD_TOKEN="your-discord-bot-token"

# GitHub Token (optional, only if using GitHub ingestion)
GITHUB_TOKEN="your-github-personal-access-token"
```

### Step 3: Run Database Migrations

```bash
cd data-agent
bunx prisma migrate dev
bunx prisma generate
```

### Step 4: Enable pgvector Extension

Run this SQL in your Neon SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 🎯 How to Use the System

### **Pipeline Order (Run these in sequence):**

#### Terminal 1: Start Data Ingestion Server(s)

**For Discord:**
```bash
cd data-agent
bun run discord-server.ts
```

**For GitHub:**
```bash
cd data-agent
bun run github-server.ts
```

These servers listen for incoming data and store raw data in the database.

---

#### Terminal 2: Run the RAG Pipeline

After data is ingested, run these steps **in order**:

**Step 1: Clean the raw data**
```bash
cd data-agent
bun run rag-pipeline/1.cleaning.ts
```

**Step 2: Chunk the cleaned data**
```bash
cd data-agent
bun run rag-pipeline/2.chunking.ts
```

**Step 3: Embed the chunks**
```bash
cd data-agent
bun run rag-pipeline/3.embedding.ts
```

**Step 4 (Optional): Create HNSW index for faster search**

After embeddings are created, run this SQL in Neon:

```sql
CREATE INDEX IF NOT EXISTS chunk_embedding_idx 
ON "Chunk" 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

---

#### Terminal 3: Query the System (RAG)

**Run the RAG query system:**
```bash
cd data-agent
bun run rag-pipeline/4.rag-query.ts
```

Or use it programmatically:

```typescript
import RAGQuery from "./rag-pipeline/4.rag-query";

const rag = new RAGQuery();

// Ask a question
const result = await rag.query("How do I set up TypeScript with Prisma?");

console.log(result.answer);
console.log("Sources:", result.sources);
```

---

## 📁 File Structure

```
data-agent/
├── rag-pipeline/
│   ├── 1.cleaning.ts          # Cleans raw data
│   ├── 2.chunking.ts          # Chunks cleaned data
│   ├── 3.embedding.ts         # Embeds chunks (Google)
│   ├── 4.rag-query.ts         # LangChain RAG with Gemini 2.5
│   └── create-index.sql       # SQL for HNSW index
│
├── discord-server.ts          # Discord MCP server
├── github-server.ts           # GitHub MCP server
├── db-client.ts               # Prisma client
├── prisma.config.ts           # Prisma config
│
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
│
└── package.json
```

---

## 🔄 Complete Workflow Example

### Scenario: You want to ingest Discord messages and query them

**Terminal 1: Start Discord Server**
```bash
cd data-agent
bun run discord-server.ts
```

**Terminal 2: Process Data**
```bash
# Wait for some messages to be ingested, then run:

cd data-agent

# Step 1: Clean
bun run rag-pipeline/1.cleaning.ts

# Step 2: Chunk
bun run rag-pipeline/2.chunking.ts

# Step 3: Embed
bun run rag-pipeline/3.embedding.ts
```

**Terminal 3: Query**
```bash
cd data-agent
bun run rag-pipeline/4.rag-query.ts
```

Or create your own query script:

```typescript
// my-query.ts
import RAGQuery from "./rag-pipeline/4.rag-query";

async function askQuestion() {
  const rag = new RAGQuery();
  
  const result = await rag.query(
    "What did users say about TypeScript?",
    "Discord", // Only search Discord messages
    5 // Top 5 results
  );
  
  console.log("\n📝 Answer:\n", result.answer);
  console.log("\n📚 Sources:\n", result.sources);
}

askQuestion();
```

---

## 🚨 Troubleshooting

### "GEMINI_API_KEY not found"
- Make sure you have a `.env` file in `data-agent/` folder
- Add `GEMINI_API_KEY="your-key-here"`

### "No embedded chunks found"
- Run the embedding pipeline: `bun run rag-pipeline/3.embedding.ts`
- Make sure chunks exist: Check your database `Chunk` table

### "Error: relation 'vector' does not exist"
- Enable pgvector in Neon: `CREATE EXTENSION IF NOT EXISTS vector;`
- Run migrations: `bunx prisma migrate dev`

### Slow search performance
- Create the HNSW index (see Step 4 above)
- Only create index AFTER embeddings are generated

---

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| **Data** | Raw ingested data (JSON) |
| **CleanedData** | Cleaned, structured data |
| **Chunk** | Semantic chunks with embeddings (vector) |

---

## 🎓 Key Concepts

- **RAG**: Retrieval Augmented Generation - Retrieve relevant context before generating
- **Embedding**: Converting text to numerical vectors (768 dimensions)
- **pgvector**: PostgreSQL extension for vector similarity search
- **Cosine Similarity**: Measure of how similar two vectors are (0-1)
- **HNSW**: Fast approximate nearest neighbor search algorithm

---

## 🔗 Useful Links

- [Neon Database](https://neon.tech)
- [Google Gemini API](https://ai.google.dev)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [LangChain Documentation](https://js.langchain.com)

---

## 📝 Next Steps

1. ✅ Set up your `.env` file
2. ✅ Run migrations
3. ✅ Ingest some data (Discord/GitHub)
4. ✅ Run the RAG pipeline (clean → chunk → embed)
5. ✅ Create HNSW index
6. ✅ Start querying with Gemini 2.5!

Happy building! 🚀
