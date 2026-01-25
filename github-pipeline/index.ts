import { file } from "bun"
import express from "express"

const app = express()
app.use(express.json())

app.post("/github", async (req,res)=>{
    console.log("Github send a message")
    const data  = req.body;
    
    const filesModified = data.head_commit.modified;

    if (filesModified.length > 0){
        for(const file in filesModified){
            console.log("reading files")

            const owner = data.repository.owner.login;
            const repo = data.repository.name;
            const branch = data.ref.replace("refs/heads/", "")

            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file}`;
            try  {
                const response = await fetch(rawUrl)
                const text = await response.text()

                console.log("file data :" , text)

            }catch{
                console.log("get some help")
            }    
        }
    }
    res.send("OK")
})

app.listen(3000, ()=> console.log("Server is runnign on port 3000"));