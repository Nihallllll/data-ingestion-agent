import express from "express"

const app = express()
app.use(express.json())

app.post("/github" ,(req,res)=>{
    console.log("Github send a message")
    const data  = req.body;
    console.log("Repo name :" , data.repository.name)
    console.log("Pushed by :",data.pusher.name )
})

app.listen(3000, ()=> console.log("Server is runnign on port 3000"));