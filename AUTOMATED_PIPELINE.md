# 🔄 Automated RAG Pipeline

## Quick Start

### Option 1: Fully Automated (Recommended)

Run this **single command** to automatically process everything:

```bash
cd data-agent
bun run rag-pipeline/auto-pipeline.ts
```

This will:
- ✅ Watch for new data every 10 seconds
- ✅ Auto-clean unprocessed data
- ✅ Auto-chunk cleaned data
- ✅ Auto-embed chunks
- ✅ Keep your RAG system always ready

**Keep this running** in a terminal while your Discord/GitHub servers are ingesting data!

---

## How It Works

```
┌─────────────────────────────────────────────────────┐
│  Discord/GitHub Servers Ingest Raw Data            │
│  → Stored in "Data" table (processed=false)         │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  AUTO-PIPELINE (Polling every 10s)                  │
│                                                     │
│  Step 1: Find unprocessed data                     │
│  Step 2: Clean → Store in "CleanedData"            │
│  Step 3: Chunk → Store in "Chunk"                  │
│  Step 4: Embed → Update "embedding" column         │
│                                                     │
│  → Now ready for RAG queries!                      │
└─────────────────────────────────────────────────────┘
```

---

## Full Setup (3 Terminals)

### Terminal 1: Data Ingestion
```bash
cd data-agent
bun run discord-server.ts
# OR
bun run github-server.ts
```

### Terminal 2: Automated Pipeline (Required)
```bash
cd data-agent
bun run rag-pipeline/auto-pipeline.ts
```

### Terminal 3: Query/Test
```bash
cd data-agent
bun run rag-pipeline/4.rag-query.ts
```

---

## Configuration

Edit `rag-pipeline/auto-pipeline.ts`:

```typescript
const POLL_INTERVAL_MS = 10000;  // Check every 10 seconds
const BATCH_SIZE = 50;           // Process 50 items at a time

// Toggle individual steps
const ENABLE_AUTO_CLEANING = true;
const ENABLE_AUTO_CHUNKING = true;
const ENABLE_AUTO_EMBEDDING = true;
```

---

## Manual Mode (Optional)

If you prefer manual control, run these separately:

```bash
# Step 1: Clean
bun run rag-pipeline/1.cleaning.ts

# Step 2: Chunk
bun run rag-pipeline/2.chunking.ts

# Step 3: Embed
bun run rag-pipeline/3.embedding.ts
```

---

## Monitoring

The auto-pipeline shows real-time status:

```
🤖 AUTOMATED RAG PIPELINE STARTED
✓ Polling interval: 10s
✓ Batch size: 50
✓ Auto-cleaning: ON
✓ Auto-chunking: ON
✓ Auto-embedding: ON

👀 Watching for new data...

🧹 Cleaning 5 new records...
✅ Cleaned 5 records

✂️  Chunking 5 cleaned records...
✅ Chunked 5 records

🧠 Embedding 12 chunks...
✅ Embedded 12 chunks

[10:30:45] 💤 No new data. Total processed: Cleaned=5, Chunked=5, Embedded=12
```

---

## Stopping the Pipeline

Press `Ctrl+C` to gracefully stop:

```
📊 Final Statistics:
   Cleaned: 127
   Chunked: 127
   Embedded: 456
```

---

## Troubleshooting

### Pipeline not processing
- Check if data exists: `bunx prisma studio`
- Verify `processed=false` in Data table
- Check logs for errors

### Slow processing
- Increase `BATCH_SIZE` to 100
- Decrease `POLL_INTERVAL_MS` to 5000 (5s)

### API rate limits (Gemini)
- The embedding step has built-in delays
- Reduce `BATCH_SIZE` if hitting limits

---

## Production Deployment

### Using PM2 (Process Manager)
```bash
# Install PM2
bun add -g pm2

# Start auto-pipeline
pm2 start "bun run rag-pipeline/auto-pipeline.ts" --name "rag-pipeline"

# View logs
pm2 logs rag-pipeline

# Stop
pm2 stop rag-pipeline
```

### Using systemd (Linux)
Create `/etc/systemd/system/rag-pipeline.service`:

```ini
[Unit]
Description=RAG Auto Pipeline
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/data-agent
ExecStart=/usr/bin/bun run rag-pipeline/auto-pipeline.ts
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable rag-pipeline
sudo systemctl start rag-pipeline
sudo systemctl status rag-pipeline
```

---

## Summary

✅ **Recommended**: Run `auto-pipeline.ts` + ingestion servers  
✅ Fully automated - no manual steps needed  
✅ Real-time processing as data arrives  
✅ Always ready for RAG queries  

**Just 2 terminals needed:**
1. Ingestion server (Discord/GitHub)
2. Auto-pipeline (this handles everything else)
