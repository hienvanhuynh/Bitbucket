const http = require("http")
const fs = require("fs")
const FileReader = require("filereader")
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
            "Context-type":"application/html"
    })

    html = "\
        <!DOCTYPE html>\
        <html>\
        <body>\
        Welcome to the Trans Service!\
        <input type='file' id='file-selector' multiple>\
        <script>\
            const fileSelector = document.getElementById('file-selector');\
            fileSelector.addEventListener('change', (event) => {\
                const fileList = event.target.files;\
                console.log(fileList);\
            });\
        </script>\
        </body>\
        </html>\
    "

    res.write(html);
    res.end()
}

function handleUpload(req, res) {
    res.writeHead(200, {
            "Context-type":"application/text"
    })
    
    //console.log(Object.keys(req))
    var text=""
    const form = new formidable.IncomingForm()
    form.parse(req, (err, fields, files) => {
        const thefile = files.file
        //console.log(Object.getOwnPropertyNames(thefile));
        text = JSON.stringify({ "received":thefile})
        console.log(text)
        
        fs.readFile(thefile.filepath, (err, data) => {
            res.write(data)
            res.end()
            return;
        })
    })
    
    //res.write("posted!\n")
    //res.end()
    //res.write(text)
    //res.end()
}

function handleGetTrans(req, res) {
    res.writeHead(200, {
            "Context-type":"json/plain"
    })
        
    res.write("Got trans!\n")
    res.end()
}
