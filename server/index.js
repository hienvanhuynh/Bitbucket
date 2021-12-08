const http = require("http")
const fs = require("fs")
const express = require("express")
const route = express.Router()
const server = express()
const formidable = require("formidable")


server.use(express.json())
server.use(express.urlencoded({
    extended: true
}))

route.get("/", (req, res) => {
    handleWelcome(req, res)
})
route.post("/upload", (req, res) => {
    handleUpload(req, res)
})
route.get("/trans", (req, res) => {
    handleGetTrans(req, res)
})

server.use('/', route)

server.listen(5010, () => {
    console.log("Server is listening on port 5010...");
})



function handleWelcome(req, res) {
    res.writeHead(200, {
            "Context-type":"application/text"
    })

    res.write("Welcome to Trans server!");
    res.end()
}

function handleUpload(req, res) {
    res.writeHead(200, {
            "Context-type":"json/plain"
    })
    
    //console.log(Object.keys(req))
    const form = new formidable.IncomingForm()
    form.parse(req, (err, fields, files) => {
        const thefile = files.file
        console.log(thefile)
    })
    
    res.write("posted!\n")
    res.end()
}

function handleGetTrans(req, res) {
    res.writeHead(200, {
            "Context-type":"json/plain"
    })
        
    res.write("Got trans!\n")
    res.end()
}
