import prisma from "../db-client";

// Types for cleaned data
type CleanedDiscordData = {
  content: string;
  username: string;
  userId: string;
  channelId: string;
  timestamp: string;
  urls: string[];
  codeBlocks: string[];
  hasMedia: boolean;
};

type CleanedGithubData = {
  content: string;
  filename: string;
  fileType: string;
  extension: string;
  isCode: boolean;
  language?: string;
  sections?: { header: string; content: string }[];
};

// Clean Discord messages
function cleanDiscordData(rawData: any): CleanedDiscordData | null {
  try {
    // Extract URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = rawData.content?.match(urlRegex) || [];

    // Extract code blocks
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks = rawData.content?.match(codeBlockRegex) || [];

    // Remove code blocks from content temporarily
    let cleanedContent = rawData.content || "";
    codeBlocks.forEach((block: string) => {
      cleanedContent = cleanedContent.replace(block, "[CODE_BLOCK]");
    });

    // Remove URLs from content
    urls.forEach((url: string) => {
      cleanedContent = cleanedContent.replace(url, "[URL]");
    });

    // Remove bot mentions (@bot)
    cleanedContent = cleanedContent.replace(/<@!?\d+>/g, "@user");

    // Remove channel mentions (#channel)
    cleanedContent = cleanedContent.replace(/<#\d+>/g, "#channel");

    // Remove role mentions (@role)
    cleanedContent = cleanedContent.replace(/<@&\d+>/g, "@role");

    // Remove excessive emojis (custom Discord emojis)
    cleanedContent = cleanedContent.replace(/<a?:[\w]+:\d+>/g, "");

    // Remove excessive whitespace
    cleanedContent = cleanedContent.replace(/\s+/g, " ").trim();

    // Filter out empty or spam messages
    if (cleanedContent.length < 3 || cleanedContent === "[CODE_BLOCK]" || cleanedContent === "[URL]") {
      return null; // Skip this message
    }

    // Normalize timestamp
    const timestamp = rawData.timestamp || new Date().toISOString();

    return {
      content: cleanedContent,
      username: rawData.username || "unknown",
      userId: rawData.userId || "unknown",
      channelId: rawData.channelId || "unknown",
      timestamp,
      urls,
      codeBlocks: codeBlocks.map((block: string) => block.replace(/```\w*\n?/g, "").trim()),
      hasMedia: urls.some((url : string)  => /\.(jpg|jpeg|png|gif|mp4|webm)/i.test(url))
    };
  } catch (error) {
    console.error("Error cleaning Discord data:", error);
    return null;
  }
}

// Clean GitHub file content
function cleanGithubData(rawData: any): CleanedGithubData | null {
  try {
    const filename = rawData.FILENAME || "unknown";
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    
    // Detect file type
    const codeExtensions = ["ts", "js", "py", "java", "cpp", "c", "go", "rs", "rb", "php"];
    const isCode = codeExtensions.includes(extension);
    
    let content = rawData.CONTENT || "";
    let sections: { header: string; content: string }[] | undefined;

    // Handle Markdown files
    if (extension === "md") {
      // Parse markdown sections by headers
      const headerRegex = /^(#{1,6})\s+(.+)$/gm;
      const matches = [...content.matchAll(headerRegex)];
      
      sections = [];
      for (let i = 0; i < matches.length; i++) {
        const currentMatch = matches[i];
        const nextMatch = matches[i + 1];
        
        const headerLevel = currentMatch[1].length;
        const headerText = currentMatch[2];
        const startIndex = currentMatch.index! + currentMatch[0].length;
        const endIndex = nextMatch ? nextMatch.index! : content.length;
        
        const sectionContent = content.slice(startIndex, endIndex).trim();
        
        sections.push({
          header: `${"".repeat(headerLevel - 1)}${headerText}`,
          content: sectionContent
        });
      }
    }

    // Handle code files - strip comments and boilerplate
    if (isCode) {
      // Remove single-line comments
      content = content.replace(/\/\/.*$/gm, "");
      
      // Remove multi-line comments
      content = content.replace(/\/\*[\s\S]*?\*\//g, "");
      
      // Remove excessive empty lines
      content = content.replace(/\n{3,}/g, "\n\n");
    }

    // Remove excessive whitespace
    content = content.replace(/[ \t]+$/gm, "").trim();

    // Skip empty files
    if (content.length < 10) {
      return null;
    }

    return {
      content,
      filename,
      fileType: extension === "md" ? "markdown" : isCode ? "code" : "text",
      extension,
      isCode,
      language: isCode ? extension : undefined,
      sections
    };
  } catch (error) {
    console.error("Error cleaning GitHub data:", error);
    return null;
  }
}

// Main cleaning process
async function cleanData() {
  console.log("🧹 Starting data cleaning process...\n");

  // Fetch unprocessed data
  const unprocessedData = await prisma.data.findMany({
    where: {
      processed: false,
      deletedAt: null
    }
  });

  console.log(`Found ${unprocessedData.length} unprocessed records\n`);

  let discordCleaned = 0;
  let githubCleaned = 0;
  let skipped = 0;

  for (const record of unprocessedData) {
    console.log(`Processing ${record.source} record: ${record.id}`);

    let cleanedData: CleanedDiscordData | CleanedGithubData | null = null;

    if (record.source === "Discord") {
      cleanedData = cleanDiscordData(record.data);
      if (cleanedData) {
        discordCleaned++;
        console.log(`✅ Discord message cleaned: "${(cleanedData as CleanedDiscordData).content.slice(0, 50)}..."`);
      }
    } else if (record.source === "Github") {
      cleanedData = cleanGithubData(record.data);
      if (cleanedData) {
        githubCleaned++;
        console.log(`✅ GitHub file cleaned: ${(cleanedData as CleanedGithubData).filename} (${(cleanedData as CleanedGithubData).fileType})`);
      }
    }

    if (cleanedData) {
      // Store cleaned data in the CleanedData table
      if (record.source === "Discord") {
        const discordData = cleanedData as CleanedDiscordData;
        await prisma.cleanedData.create({
          data: {
            dataId: record.id,
            source: "Discord",
            cleanedContent: discordData.content,
            timestamp: new Date(discordData.timestamp),
            username: discordData.username,
            userId: discordData.userId,
            channelId: discordData.channelId,
            urls: discordData.urls,
            codeBlocks: discordData.codeBlocks,
            hasMedia: discordData.hasMedia
          }
        });
      } else if (record.source === "Github") {
        const githubData = cleanedData as CleanedGithubData;
        await prisma.cleanedData.create({
          data: {
            dataId: record.id,
            source: "Github",
            cleanedContent: githubData.content,
            timestamp: new Date(),
            filename: githubData.filename,
            fileType: githubData.fileType,
            extension: githubData.extension,
            isCode: githubData.isCode,
            language: githubData.language,
            sections: githubData.sections as any
          }
        });
      }

      // Mark original record as processed
      await prisma.data.update({
        where: { id: record.id },
        data: {
          processed: true,
          lastProcessedAt: new Date()
        }
      });
    } else {
      skipped++;
      console.log(`⚠️  Skipped (empty or invalid content)`);
    }
    
    console.log("");
  }

  console.log("\n📊 Cleaning Summary:");
  console.log(`   Discord messages cleaned: ${discordCleaned}`);
  console.log(`   GitHub files cleaned: ${githubCleaned}`);
  console.log(`   Skipped (invalid): ${skipped}`);
  console.log(`   Total processed: ${discordCleaned + githubCleaned}`);
}

// Export for use in auto-pipeline
export async function processUncleanedData(limit?: number): Promise<number> {
  const unprocessedData = await prisma.data.findMany({
    where: {
      processed: false,
      deletedAt: null
    },
    take: limit,
    orderBy: { createdAt: "asc" }
  });

  if (unprocessedData.length === 0) {
    return 0;
  }

  let processedCount = 0;

  for (const record of unprocessedData) {
    const rawData = record.data as any;
    const cleanedData = record.source === "Discord" 
      ? cleanDiscordData(rawData)
      : cleanGithubData(rawData);

    if (cleanedData) {
      if (record.source === "Discord") {
        const discordData = cleanedData as CleanedDiscordData;
        await prisma.cleanedData.create({
          data: {
            dataId: record.id,
            source: "Discord",
            cleanedContent: discordData.content,
            timestamp: new Date(discordData.timestamp),
            username: discordData.username,
            userId: discordData.userId,
            channelId: discordData.channelId,
            urls: discordData.urls,
            codeBlocks: discordData.codeBlocks,
            hasMedia: discordData.hasMedia
          }
        });
      } else if (record.source === "Github") {
        const githubData = cleanedData as CleanedGithubData;
        await prisma.cleanedData.create({
          data: {
            dataId: record.id,
            source: "Github",
            cleanedContent: githubData.content,
            timestamp: new Date(),
            filename: githubData.filename,
            fileType: githubData.fileType,
            extension: githubData.extension,
            isCode: githubData.isCode,
            language: githubData.language,
            sections: githubData.sections as any
          }
        });
      }

      await prisma.data.update({
        where: { id: record.id },
        data: {
          processed: true,
          lastProcessedAt: new Date()
        }
      });

      processedCount++;
    }
  }

  return processedCount;
}

// Run the cleaning process only if executed directly
if (import.meta.main) {
  cleanData()
    .then(() => {
      console.log("\n✨ Cleaning process completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error during cleaning:", error);
      process.exit(1);
    });
}