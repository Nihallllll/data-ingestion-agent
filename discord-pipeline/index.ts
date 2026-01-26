import { Client, GatewayIntentBits } from 'discord.js';

// Create a new listener (Client)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,           // To know which server it's in
        GatewayIntentBits.GuildMessages,    // To hear when a message is sent
        GatewayIntentBits.MessageContent,   // To actually read the text!
    ],
});

client.once('clientReady', () => {
    console.log(`✅ Logged in as ${client.user?.tag}!`);
    console.log("👂 Listening for messages...");
});

// This is the "Ear" that catches every message
client.on('messageCreate', async (message) => {
    // 1. Ignore messages from other bots (or itself) to avoid infinite loops
    if (message.author.bot) return;

    // 2. Filter for a specific channel (Optional)
    // You can get the Channel ID by right-clicking a channel in Discord -> Copy ID
    const TARGET_CHANNEL_ID = "";
    if (message.channelId !== TARGET_CHANNEL_ID) return;
    console.log("message : " , message)
    console.log(`📩 New message from ${message.author.username}:`);
    console.log(`Content: "${message.content}"`);

    // --- THIS IS WHERE YOU UPDATE YOUR DATABASE ---
    // Example: 
    // await db.insertInto('logs').values({ 
    //    source: 'discord', 
    //    data: message.content, 
    //    user: message.author.username 
    // });
    
    console.log("🗄️ Database updated with Discord info!");
});

client.login(process.env.DISCORD);