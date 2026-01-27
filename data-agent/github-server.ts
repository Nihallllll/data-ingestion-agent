import { file } from "bun"
import express from "express"
import prisma from "./db-client"

const app = express()
app.use(express.json())

app.post("/github", async (req,res)=>{
const data = req.body;

    // 1. Get the list of modified files
    const modifiedFiles = data.head_commit.modified; // This is an array like ["README.md"]

    if (modifiedFiles.length > 0) {
        for (const filePath of modifiedFiles) {
            console.log(`--- Reading file: ${filePath} ---`);

            // 2. Construct the URL to get the "Raw" content
            // Format: https://raw.githubusercontent.com/OWNER/REPO/BRANCH/PATH
            const owner = data.repository.owner.login;
            const repo = data.repository.name;
            const branch = data.ref.replace("refs/heads/", ""); // Extracts 'main'
            
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;

            try {
                // 3. Fetch the actual content
                const response = await fetch(rawUrl);
                const content = await response.text();

                console.log(`Content of ${filePath}:`);
                console.log(content); // <--- THIS IS YOUR README TEXT!
                
                //DB call

                await prisma.data.create({
                    data :{
                        data :{
                            CONTENT : content,
                            FILENAME : filePath
                        },
                        source : 'Github' 
                    }
                })
                
            } catch (error) {
                console.error("Error fetching file content:", error);
            }
        }
    }

    res.status(200).send("Processed");
})

app.listen(3000, ()=> console.log("Server is runnign on port 3000"));