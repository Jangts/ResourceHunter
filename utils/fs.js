const fs = require("fs");
const request = require("request");
const { on } = require("process");

exports.createDirIfNotExist = function createDirIfNotExist(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
        // console.log("文件夹创建成功")
    } else {
        // console.log("文件夹已存在")
    }
    return dirPath
}

//文件下载
exports.downloadFile = function downloadFile(filename, url, mark = '', sleep = 0) {
    let piperr = false
    return new Promise(function (resolve, reject) {
        if (fs.existsSync(filename)) {
            setTimeout(() => resolve(true), sleep)
        }
        else {
            const readStream = request(url)
            const writeStream = fs.createWriteStream(filename)
            
            readStream.on('end', function() {
                // console.log("文件[" + filename + "]下载完毕")
            });
            readStream.on('error', function(err) {
                // console.log('Pipe Error:', url, err)
                piperr = true
            })

            writeStream.on("finish", function() {
                // console.log("文件[" + filename + "]写入成功")
                if (piperr) {
                    console.log('Pipe Error:', mark, url)
                }
                setTimeout(() => resolve(true), sleep)
                writeStream.end()
            })

            readStream.pipe(writeStream)
        }
    })
}