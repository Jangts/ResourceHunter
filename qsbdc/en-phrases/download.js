const path = require("path");
const { createDirIfNotExist, downloadFile } = require("../../utils/fs");

//创建文件夹目录
const downloadRoot = createDirIfNotExist(path.join(__dirname, "../audio"))
const phrasesRoot = createDirIfNotExist(path.join(downloadRoot, "en-phrases"))

exports.downloadAudio = function downloadAudio(en, audio) {
    const filename = en.replace(/[\.,]+/g, '.').replace(/[^a-z'()]+/ig, '_').replace(/'/g, '')
    const dir = audio.substr(0, 1)
    const src = `http://sound.yywz123.com/qsbdcword/${dir}/${audio}.mp3`

    return downloadFile(path.join(phrasesRoot, `${filename}.mp3`), src, filename, 0)
}