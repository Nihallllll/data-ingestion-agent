-- Create HNSW index for fast vector similarity search
-- This dramatically improves search performance for large datasets

-- HNSW (Hierarchical Navigable Small World) index
-- - m: maximum number of connections per layer (16 is good default)
-- - ef_construction: size of dynamic candidate list (64 is good default)
-- Higher values = better recall but slower index build time

CREATE INDEX IF NOT EXISTS chunk_embedding_idx 
ON "Chunk" 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- This index enables:
-- 1. Sub-millisecond similarity searches even with millions of vectors
-- 2. Approximate nearest neighbor (ANN) search with high accuracy
-- 3. Much lower memory usage than IVFFlat indexes

-- Run this in your Neon SQL Editor after embeddings are created
-- Or run via: psql -f create-index.sql

-- Note: Only create the index AFTER you have embedded your chunks
-- Creating it on an empty table and then adding vectors is slower
