# RAG Query System 🚀

A modern RAG (Retrieval Augmented Generation) system that allows you to query your Discord conversations and GitHub repositories using Gemini 2.5 Flash LLM.

## ✨ Features

- 🤖 **Intelligent Q&A**: Ask questions about your Discord & GitHub data
- 🎨 **Modern UI**: Beautiful React interface with dark/light mode
- ⚡ **Real-time Streaming**: See the AI thinking process in real-time
- 🔍 **Smart Search**: Vector-based semantic search with pgvector
- 📊 **Source Attribution**: View relevant sources with similarity scores
- 🐳 **Docker Support**: One-command deployment

## 🚀 Quick Start with Docker

### Prerequisites
- Docker & Docker Compose installed
- Neon PostgreSQL database (with pgvector extension)
- Google Gemini API key

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd data-ingetion-agent
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   DATABASE_URL=your_neon_postgresql_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Run with Docker**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:3001

That's it! 🎉

## 🛠️ Manual Setup (Without Docker)

### Backend Setup

```bash
cd data-agent

# Install dependencies
bun install

# Generate Prisma client
bunx prisma generate

# Run migrations
bunx prisma migrate deploy

# Start API server
bun api-server.ts
```

### Frontend Setup

```bash
cd rag-frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

## 📖 Usage

### 1. Ingest Data

First, populate your database with Discord and GitHub data:

```bash
cd data-agent

# Ingest Discord data
bun discord-server.ts

# Ingest GitHub data
bun github-server.ts
```

### 2. Process Data Pipeline

Run the automated pipeline to clean, chunk, and embed your data:

```bash
# Clean raw data
bun rag-pipeline/1.cleaning.ts

# Chunk into semantic pieces
bun rag-pipeline/2.chunking.ts

# Generate embeddings
bun rag-pipeline/3.embedding.ts

# Or run auto-pipeline (processes continuously)
bun rag-pipeline/auto-pipeline.ts
```

### 3. Query Your Data

Via Web Interface:
- Open http://localhost (or http://localhost:5174 in dev mode)
- Ask questions in natural language

Via Terminal:
```bash
bun rag-pipeline/4.rag-query.ts
```

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │  (Vite + TypeScript + Tailwind v4)
└────────┬────────┘
         │ HTTP/SSE
┌────────┴────────┐
│  Express API    │  (Bun runtime)
└────────┬────────┘
         │
┌────────┴────────┐
│   RAG Pipeline  │  (LangChain + Gemini 2.5)
└────────┬────────┘
         │
┌────────┴────────────┐
│  PostgreSQL + Vector│  (Neon + pgvector)
└─────────────────────┘
```

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS v4
- Server-Sent Events (SSE)

**Backend:**
- Bun runtime
- Express.js
- Prisma ORM
- LangChain
- Google Gemini 2.5 Flash
- Google text-embedding-004

**Database:**
- Neon PostgreSQL
- pgvector extension (768-dim vectors)
- HNSW indexing

## 🔧 Configuration

### Similarity Threshold

Adjust the relevance threshold in `rag-pipeline/4.rag-query.ts`:

```typescript
const SIMILARITY_THRESHOLD = 0.75; // 75% minimum similarity
```

### Top K Results

Change the number of sources retrieved:

```typescript
const TOP_K_RESULTS = 3; // Number of sources
```

### API Endpoint

Update frontend API URL in `rag-frontend/src/components/Chat.tsx`:

```typescript
const API_URL = 'http://localhost:3001';
```

## 📁 Project Structure

```
data-ingetion-agent/
├── data-agent/                 # Backend code
│   ├── rag-pipeline/          # RAG processing pipeline
│   │   ├── 1.cleaning.ts      # Data cleaning
│   │   ├── 2.chunking.ts      # Text chunking
│   │   ├── 3.embedding.ts     # Vector embeddings
│   │   ├── 4.rag-query.ts     # RAG query system
│   │   └── auto-pipeline.ts   # Automated processing
│   ├── api-server.ts          # Express API server
│   ├── prisma/                # Database schema
│   └── package.json
├── rag-frontend/              # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/            # Custom hooks
│   │   └── types.ts          # TypeScript types
│   └── package.json
├── docker-compose.yml         # Docker orchestration
├── Dockerfile.backend         # Backend Dockerfile
├── Dockerfile.frontend        # Frontend Dockerfile
└── .env.example              # Environment template
```

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild images
docker-compose build --no-cache

# View running containers
docker-compose ps
```

## 🔍 API Endpoints

- `POST /api/query` - Query with SSE streaming
- `POST /api/query-simple` - Simple query (no streaming)
- `GET /api/health` - Health check
- `GET /api/stats` - Database statistics

## 🎨 UI Features

- **Dark/Light Mode**: Persistent theme toggle
- **Source Filtering**: Filter by Discord or GitHub
- **Real-time Progress**: Visual progress bar during query
- **Source Cards**: View relevant sources with similarity scores
- **File Paths**: GitHub sources show file names
- **Copy to Clipboard**: Copy AI responses
- **Chat History**: Session-based conversation history

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `DISCORD_BOT_TOKEN` | Discord bot token (for ingestion) | No |
| `GITHUB_TOKEN` | GitHub PAT (for ingestion) | No |
| `PORT` | API server port (default: 3001) | No |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for your own purposes!

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh/)
- Powered by [Google Gemini](https://ai.google.dev/)
- Vector search by [pgvector](https://github.com/pgvector/pgvector)
- UI components inspired by modern design patterns

---

Made with ❤️ using Gemini 2.5 Flash
