const http = require("http")
const fs = require("fs")
const express = require("express")
const route = express.Router()
const server = express()

//server.use(bodyParser());


/*const server = http.createServer((req, res) => {

    //console.log(req.url)
    if (req.url=="/") {
        handleWelcome(req, res)
    } else if (req.url=='/upload') {
        handleUpload(req, res)
    } else if (req.url=='/trans') {
        handleGetTrans(req, res)
    }
    
})*/

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
    //req.pipe(req.busyboy)
    console.log(req.body)
    /*req.busyboy.on('file', (fieldname, file, filename) => {
        var buf = '';
        file.on('data', function(d) {
            buf += d;
        }).on('end', function() {
            var val = JSON.parse(buf);
            // use `val` here ...
        }).setEncoding('utf8');
    })*/ 
    console.log(req.body.data)
    console.log(req.query)
    console.log(Object.keys(req))
    
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
