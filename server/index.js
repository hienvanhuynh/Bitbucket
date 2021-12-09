const http = require("http")
const fs = require("fs")
const FileReader = require("filereader")
const express = require("express")
const route = express.Router()
const server = express()
const formidable = require("formidable")
const csvparse = require('csv-parser');
const APIURL = 'http://localhost:5010'
require('dotenv').config()

const mysql = require('mysql');

const config = { schema: 'trans', table: 'transaction', user: 'root', password: process.env.MYSQL_ROOT_PW }

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.MYSQL_ROOT_PW,
    database: 'trans'
})

connection.connect((error) => {
    if (!!error) {
        console.log('error connecting to db');
    } else {
        console.log('connected to db');
    }
})

server.use(express.json())
server.use(express.urlencoded({
    extended: true
}))

server.get("/", (req, res) => {
    handleWelcome(req, res)
})
server.post("/upload", async(req, res) => {
    await handleUpload(req, res)
})
server.get("/trans", (req, res) => {
    
    query = 'select * from trans.transaction';
    if (req.body.type) {
        if (req.body.type=="daterange") {
            let start = req.body.start
            let end = req.body.end
            console.log(start+" "+end)
            
            query += ' where transactionDate between \''+start+'\' and \''+end+'\'';
            
        }
    }
    let a=''
    console.log(query)
    connection.query(query, (error, rows, fields) => {
        //callback
        if (!!error) {
            console.log('get trans error')
        } else {
            res.send(rows)
        }
    })
    })

//server.use('/', route)

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
        <head><script>\
        </script></head>\
        <body>\
        <h1>Welcome to the Trans Service!<h1>\
        <div><input type='file' id='file-selector' multiple></div>\
        <div><input type='button' id='submit-button' value='submit'></div>\
        <script>\
            var fileList='';"+
            `var apiUrl = '${APIURL}';`
            +"\
            const sendfile = file => {\
                //Ref: https://www.freecodecamp.org/news/formdata-explained/\n\
                const req = new XMLHttpRequest();\
                const form = new FormData();\
                \
                let entrypoint = '/upload';\
                req.open('POST', entrypoint, true);\
                req.onreadystatechange = () => {\
                    //if (req.readyState == 4 && req.status == 200) {\n\
                        console.log(req.responseText);\
                    //}\n\
                };\
                form.append('file', file);\
                req.send(form);\
            };\
            const fileSelector = document.getElementById('file-selector');\
            const submitButton = document.getElementById('submit-button');\
            fileSelector.addEventListener('change', (event) => {\
                fileList = event.target.files;\
                console.log(fileList);\
            });\
            submitButton.addEventListener('click', (event) => {\
                sendfile(fileList[0]);\
                console.log('sent file, waiting for response')\
            });\
        </script>\
        </body>\
        </html>\
    ";

    res.write(html);
    res.end()
}

async function handleUpload(req, res) {
    console.log('received a post request')
    res.writeHead(200, {
            "Context-type":"application/text"
    })
    
    //console.log(Object.keys(req))
    var text=""
    const form = new formidable.IncomingForm()
    form.parse(req, async(err, fields, files) => {
        const thefile = files.file
        //console.log(Object.getOwnPropertyNames(thefile));
        text = JSON.stringify({ "received":thefile})
        console.log(text)
        
        /*let validate = validateCSVFile(thefile.filepath)
        
        text = JSON.stringify({"success":false, 
                    "error":validate
                })
        res.write(text)
        res.end()*/
        fs.readFile(thefile.filepath, async(err, data) => {
            let validate = await validateCSV(data)
            
            if (validate===true) {
                saveCSVToDatabase(data)
                
                text = JSON.stringify({"success":true})
                res.write(text);
            } else {
                text = JSON.stringify({"success":false, 
                    "error":validate
                })
                res.write(text)
            }
            //res.write(data)
            
            res.end()
            return;
        })
    })
    
    //res.write("posted!\n")
    //res.write(text)
    //res.end()
}

function handleGetTrans(req, res) {
    res.writeHead(200, {
            "Context-type":"json/plain"
    })
    
    
    query = 'select * from trans.transaction';
    if (req.body.type) {
        if (req.body.type=="daterange") {
            let start = req.body.start
            let end = req.body.end
            console.log(start+" "+end)
            
            //query += 'where transactionDate between \''+start+'\' and \''+end+'\'';
            
        }
    }
    let a=''
    connection.query(query, (error, rows, fields) => {
        //callback
        if (!!error) {
            console.log('get trans error')
        } else {
            res.send(rows)
        }
    })
    
    //console.log(queryresult)
    //res.write("got trans")
}

function settransres(result)
{
    
}
function validateCSVFile(filepath) {
    console.log("validating...")
    let validate = []
        
    var parser = csvparse({}, function (err, records) {
	    console.log(records);
        validate.push(records)
    })

    fs.createReadStream(filepath)
    .pipe(csvparse({headers: false}))
    .on('data', (data) => {
        console.log(data)
        validate.push(data)
    })
    .on('end', () => {
        console.log(validate)
        console.log('done validation')
    })
    
    console.log(validate)
    

}

async function validateCSV(data) {
    let validateError = []
    console.log("validating...")
    
    let parsedData = data.toString().split(/(?:\r\n|\r|\n)/g)
    for (let i=0; i<parsedData.length; i++) {
        if (parsedData[i].length != 0){
            validateRes = await validateOneCSVLine(parsedData[i])
            if (validateRes !== true) {
                validateError.push(validateRes +': '+ parsedData[i])
            }
        }
    }

    console.log("done validation")    

    if (validateError.length != 0) {
        return validateError;
    }
    return true;
};

async function validateOneCSVLine(line) {
    let parsedLine = splitCSV(line);
    //let parsedLine = line.toString().split(/(?:,)/g)
    let result=true;
    if (parsedLine.length!=5) {
        console.log("so luong: "+parsedLine.length)
        result='Invalid set of parameters'
    } else if (parsedLine[0].length >50) {
        return 'Invalid ID length';
    } else if (isNaN(parsedLine[1].split(',').join(''))) {
        return 'Invalid amount, must be a number'
    }
    else if (await checkIfExistsTransID(parsedLine[0])==true) {
        result = 'Transaction ID existed'
        console.log('id existed')
        return result;
    }
    else if (parsedLine[2].length != 3) {
        result = 'Invalid currency code'
        return result;
    }
    result = checkInvalidDatetime(parsedLine[3])
    
    if (result!=true) {
        return result
    }
    if (parsedLine[4]!='Approved' && parsedLine[4]!='Failed' && parsedLine[4]!='Finished') {
        return 'Invalid status';
    }
    return result;
};

function splitCSV(line) {
    let parenthesesStack = 0
    tokens=[]
    token=''
    for (let i=0; i<line.length; i++) {
        if (line.charCodeAt(i)==34 || line.charCodeAt(i)==226 || line.charCodeAt(i)==8220 || line.charCodeAt(i)==8221) {
            parenthesesStack = 1-parenthesesStack;
            continue;
        }
        if (line.charAt(i)==',') {
            if (parenthesesStack==0){
                tokens.push(token)
                token=''
                continue;
            }
        }
        if (line.charAt(i)==' ' && parenthesesStack==0) {
            continue;
        }
        token += line.charAt(i)
    }
    if (token.length!=0) {
        tokens.push(token)
    }
    return tokens
}

//return true: exists
//       false: doesn't exist
async function checkIfExistsTransID(transID) {
    let query = 'select ID from trans.transaction where ID=\''+transID+'\'';
    let res = await connection.query(query, (error, rows, fields) => {
        //callback
        if (!!error) {
            console.log('checkIfExistsTransID error')
            res = true;
            return true;
        } else {
            if (rows.length != 0) {
                res = true;
                return true;
            } else {
                res = false;
                return false;
            }
        }
    })
    console.log(res)
    console.log('checkid: '+res)
    return false;   
}

function checkInvalidDatetime(datetimeStr) {
    if(!/^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{1,2}:\d{1,2}$/.test(datetimeStr) && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(datetimeStr))
        return 'Invalid datetime format';

    // Parse the date parts to integers
    //var parts = datetimeStr.split(" |\/|:");
    var parts = datetimeStr.split(/:|\/| /);

    let day = parseInt(parts[2], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[0], 10);
    
    if (datetimeStr[2]=='/') {
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
    }
    
    let hour = parseInt(parts[3])
    let minute = parseInt(parts[4])
    let second=parseInt(parts[5])
    
    // Check the ranges of month and year
    if(year < 1000 || year > 3000)
        return 'Invalid year range';
    if (month == 0 || month > 12)
        return 'Invalid month range';
    let monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

    // Adjust for leap years
    if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
        monthLength[1] = 29;

    // Check the range of the day
    if (day <= 0 && day > monthLength[month - 1])
        return 'Invalid day range';
        
    if (hour <0 || hour > 23) 
        return 'Invalid hour range';
    if (minute<0|| minute>59)
        return 'Invalid minute range';
    if (second<0||second>59)
        return 'Invalid second range';
    return true;
}


function reformatDatetime(datetimeStr) {
    if(!/^\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{1,2}:\d{1,2}$/.test(datetimeStr) && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(datetimeStr))
        return 'Invalid datetime format';
    if (datetimeStr[2]!='/') {
        return datetimeStr;
    }
    // Parse the date parts to integers

    var parts = datetimeStr.split(/:|\/| /);

    let day = parts[0];
    let month = parts[1];
    let year = parts[2];
    
    let hour = parts[3]
    let minute = parts[4]
    let second=parts[5]
    
    console.log(day)
    console.log(hour)
    datetimeStr = year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second;
    return datetimeStr;
}


function parseOneCSVLine(line) {
    let parsedLine = splitCSV(line);
    parsedLine[1] = parsedLine[1].split(',').join('')
    parsedLine[3] = reformatDatetime(parsedLine[3])
    
    return parsedLine
}

function saveCSVToDatabase(data) {
    let parsedData = data.toString().split(/(?:\r\n|\r|\n)/g)
    for (let i=0; i<parsedData.length; i++) {
        if (parsedData[i].length != 0){
            newRecord = parseOneCSVLine(parsedData[i])
            
            if (newRecord.length!=0) {
                //query db
                query = 'insert into trans.transaction value(\''+
                newRecord[0]+'\','+newRecord[1]+',\''+newRecord[2]+'\',\''+newRecord[3]+'\',\''+newRecord[4]+'\')'
                queryMySQLDB(query)               
            }
        }
    }
   
}
function queryMySQLDB(query) {
    console.log(query)
    connection.query(query, (error, rows, fields) => {
        //callback
        if (!!error) {
            console.log('query error')
            return true;
        } else {
            console.log('query ok')
        }
    })   
}
