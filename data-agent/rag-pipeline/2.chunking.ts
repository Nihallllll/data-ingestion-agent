import prisma from "../db-client";

// Types for chunks
type ChunkData = {
  content: string;
  chunkIndex: number;
  tokenCount: number;
  chunkType: string;
  contextMetadata: string;
  messageCount?: number;
  participants?: string[];
  functionName?: string;
  headerPath?: string;
};

// Estimate token count (rough: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Discord Chunker: Group by conversation threads or time windows
async function chunkDiscordMessages(
  cleanedDataRecords: any[]
): Promise<{ cleanedDataId: string; chunks: ChunkData[] }[]> {
  const results: { cleanedDataId: string; chunks: ChunkData[] }[] = [];

  // For Discord, we'll treat each message as its own "chunk" 
  // since messages are typically short and self-contained
  // BUT we'll enrich the context with metadata
  for (const record of cleanedDataRecords) {
    const chunks: ChunkData[] = [];

    // Main message chunk
    const mainContent = record.cleanedContent;
    const contextMetadata = `Discord message from @${record.username} on ${
      record.timestamp.toISOString().split("T")[0]
    } in channel ${record.channelId}: ${mainContent}`;

    chunks.push({
      content: mainContent,
      chunkIndex: 0,
      tokenCount: estimateTokens(mainContent),
      chunkType: "discord_message",
      contextMetadata,
      messageCount: 1,
      participants: [record.username],
    });

    // If there are code blocks, create separate chunks for them
    if (record.codeBlocks && record.codeBlocks.length > 0) {
      record.codeBlocks.forEach((codeBlock: string, idx: number) => {
        const codeContext = `Code block from @${record.username}'s message on ${
          record.timestamp.toISOString().split("T")[0]
        }: ${codeBlock}`;

        chunks.push({
          content: codeBlock,
          chunkIndex: idx + 1,
          tokenCount: estimateTokens(codeBlock),
          chunkType: "discord_code_block",
          contextMetadata: codeContext,
          messageCount: 1,
          participants: [record.username],
        });
      });
    }

    results.push({
      cleanedDataId: record.id,
      chunks,
    });
  }

  return results;
}

// GitHub Code Chunker: Split by functions/classes using simple heuristics
function chunkCodeFile(content: string, filename: string, language: string): ChunkData[] {
  const chunks: ChunkData[] = [];

  // Simple function detection (works for TS/JS/Python/etc.)
  const functionRegex = /(?:function|def|const|let|var|class|interface|type)\s+(\w+)/g;
  const lines = content.split("\n");

  let currentChunk: string[] = [];
  let currentFunctionName = "";
  let chunkIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const functionMatch = line!.match(functionRegex);

    // If we find a new function/class definition
    if (functionMatch && currentChunk.length > 0) {
      // Save previous chunk
      const chunkContent = currentChunk.join("\n");
      const contextMetadata = `Function '${currentFunctionName}' from ${filename} (${language}): ${chunkContent.slice(
        0,
        200
      )}...`;

      chunks.push({
        content: chunkContent,
        chunkIndex: chunkIndex++,
        tokenCount: estimateTokens(chunkContent),
        chunkType: "code_function",
        contextMetadata,
        functionName: currentFunctionName,
      });

      // Start new chunk
      currentChunk = [line!];
      currentFunctionName = functionMatch[0];
    } else {
      currentChunk.push(line!);
      if (!currentFunctionName && functionMatch) {
        currentFunctionName = functionMatch[0];
      }
    }

    // If chunk gets too large (>800 tokens), split it
    if (estimateTokens(currentChunk.join("\n")) > 800 && currentChunk.length > 10) {
      const chunkContent = currentChunk.join("\n");
      const contextMetadata = `Code section from ${filename} (${language}): ${chunkContent.slice(
        0,
        200
      )}...`;

      chunks.push({
        content: chunkContent,
        chunkIndex: chunkIndex++,
        tokenCount: estimateTokens(chunkContent),
        chunkType: "code_block",
        contextMetadata,
      });

      currentChunk = [];
      currentFunctionName = "";
    }
  }

  // Don't forget the last chunk
  if (currentChunk.length > 0) {
    const chunkContent = currentChunk.join("\n");
    const contextMetadata = `${
      currentFunctionName ? `Function '${currentFunctionName}'` : "Code section"
    } from ${filename} (${language}): ${chunkContent.slice(0, 200)}...`;

    chunks.push({
      content: chunkContent,
      chunkIndex: chunkIndex++,
      tokenCount: estimateTokens(chunkContent),
      chunkType: currentFunctionName ? "code_function" : "code_block",
      contextMetadata,
      functionName: currentFunctionName || undefined,
    });
  }

  return chunks;
}

// GitHub Markdown Chunker: Split by sections (headers)
function chunkMarkdownFile(
  content: string,
  sections: { header: string; content: string }[],
  filename: string
): ChunkData[] {
  const chunks: ChunkData[] = [];

  if (sections && sections.length > 0) {
    // Use parsed sections
    sections.forEach((section, idx) => {
      const fullContent = `# ${section.header}\n\n${section.content}`;
      const contextMetadata = `Markdown section "${section.header}" from ${filename}: ${fullContent.slice(
        0,
        200
      )}...`;

      chunks.push({
        content: fullContent,
        chunkIndex: idx,
        tokenCount: estimateTokens(fullContent),
        chunkType: "markdown_section",
        contextMetadata,
        headerPath: section.header,
      });
    });
  } else {
    // Fallback: split by paragraphs if no sections found
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);

    let currentChunk: string[] = [];
    let chunkIndex = 0;

    for (const para of paragraphs) {
      currentChunk.push(para);

      // If chunk exceeds 800 tokens, save and start new chunk
      if (estimateTokens(currentChunk.join("\n\n")) > 800) {
        const chunkContent = currentChunk.join("\n\n");
        const contextMetadata = `Text from ${filename}: ${chunkContent.slice(0, 200)}...`;

        chunks.push({
          content: chunkContent,
          chunkIndex: chunkIndex++,
          tokenCount: estimateTokens(chunkContent),
          chunkType: "markdown_paragraph",
          contextMetadata,
        });

        currentChunk = [];
      }
    }

    // Last chunk
    if (currentChunk.length > 0) {
      const chunkContent = currentChunk.join("\n\n");
      const contextMetadata = `Text from ${filename}: ${chunkContent.slice(0, 200)}...`;

      chunks.push({
        content: chunkContent,
        chunkIndex: chunkIndex++,
        tokenCount: estimateTokens(chunkContent),
        chunkType: "markdown_paragraph",
        contextMetadata,
      });
    }
  }

  return chunks;
}

// Main chunking process
async function chunkData() {
  console.log("✂️  Starting chunking process...\n");

  // Fetch cleaned data that hasn't been chunked yet
  const unprocessedCleaned = await prisma.cleanedData.findMany({
    where: {
      chunks: {
        none: {}, // No chunks exist for this cleaned data
      },
    },
    include: {
      data: true,
    },
  });

  console.log(`Found ${unprocessedCleaned.length} cleaned records to chunk\n`);

  let discordChunked = 0;
  let githubChunked = 0;
  let totalChunks = 0;

  for (const record of unprocessedCleaned) {
    console.log(`Processing ${record.source} record: ${record.id}`);

    let chunks: ChunkData[] = [];

    if (record.source === "Discord") {
      const discordChunks = await chunkDiscordMessages([record]);
      chunks = discordChunks[0]?.chunks || [];
      discordChunked++;
      console.log(`  ✅ Created ${chunks.length} Discord chunks`);
    } else if (record.source === "Github") {
      if (record.isCode && record.language) {
        // Code file
        chunks = chunkCodeFile(record.cleanedContent, record.filename!, record.language);
        console.log(`  ✅ Created ${chunks.length} code chunks from ${record.filename}`);
      } else if (record.fileType === "markdown") {
        // Markdown file
        const sections = record.sections as { header: string; content: string }[] | null;
        chunks = chunkMarkdownFile(record.cleanedContent, sections || [], record.filename!);
        console.log(`  ✅ Created ${chunks.length} markdown chunks from ${record.filename}`);
      } else {
        // Generic text file - simple paragraph splitting
        const paragraphs = record.cleanedContent.split(/\n\n+/).filter((p) => p.trim().length > 0);
        chunks = paragraphs.map((para, idx) => ({
          content: para,
          chunkIndex: idx,
          tokenCount: estimateTokens(para),
          chunkType: "text_block",
          contextMetadata: `Text from ${record.filename}: ${para.slice(0, 200)}...`,
        }));
        console.log(`  ✅ Created ${chunks.length} text chunks from ${record.filename}`);
      }
      githubChunked++;
    }

    // Save chunks to database
    for (const chunk of chunks) {
      await prisma.chunk.create({
        data: {
          cleanedDataId: record.id,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          tokenCount: chunk.tokenCount,
          source: record.source,
          chunkType: chunk.chunkType,
          contextMetadata: chunk.contextMetadata,
          messageCount: chunk.messageCount,
          participants: chunk.participants || [],
          functionName: chunk.functionName,
          headerPath: chunk.headerPath,
        },
      });
    }

    totalChunks += chunks.length;
    console.log("");
  }

  console.log("\n📊 Chunking Summary:");
  console.log(`   Discord records chunked: ${discordChunked}`);
  console.log(`   GitHub files chunked: ${githubChunked}`);
  console.log(`   Total chunks created: ${totalChunks}`);
  console.log(`   Average chunks per record: ${(totalChunks / (discordChunked + githubChunked)).toFixed(2)}`);
}

// Export for use in auto-pipeline
export async function processUnchunkedData(limit?: number): Promise<number> {
  const unchunkedData = await prisma.cleanedData.findMany({
    where: {
      chunks: {
        none: {},
      },
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  });

  if (unchunkedData.length === 0) {
    return 0;
  }

  let processedCount = 0;

  for (const record of unchunkedData) {
    let chunks: ChunkData[] = [];

    if (record.source === "Discord") {
      const result = await chunkDiscordMessages([record]);
      chunks = result[0]?.chunks || [];
    } else if (record.source === "Github") {
      // Handle different GitHub file types
      if (record.isCode && record.language) {
        chunks = chunkCodeFile(record.cleanedContent, record.filename!, record.language);
      } else if (record.fileType === "markdown") {
        const sections = record.sections as { header: string; content: string }[] | null;
        chunks = chunkMarkdownFile(record.cleanedContent, sections || [], record.filename!);
      } else {
        const paragraphs = record.cleanedContent.split(/\n\n+/).filter((p) => p.trim().length > 0);
        chunks = paragraphs.map((para, idx) => ({
          content: para,
          chunkIndex: idx,
          tokenCount: estimateTokens(para),
          chunkType: "text_block",
          contextMetadata: `Text from ${record.filename}: ${para.slice(0, 200)}...`,
        }));
      }
    }

    for (const chunk of chunks) {
      await prisma.chunk.create({
        data: {
          cleanedDataId: record.id,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          tokenCount: chunk.tokenCount,
          source: record.source,
          chunkType: chunk.chunkType,
          contextMetadata: chunk.contextMetadata,
          messageCount: chunk.messageCount,
          participants: chunk.participants || [],
          functionName: chunk.functionName,
          headerPath: chunk.headerPath,
        },
      });
    }

    processedCount++;
  }

  return processedCount;
}

// Run the chunking process only if executed directly
if (import.meta.main) {
  chunkData()
    .then(() => {
      console.log("\n✨ Chunking process completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error during chunking:", error);
      process.exit(1);
    });
}
