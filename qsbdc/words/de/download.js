const path = require("path");
const { createDirIfNotExist, downloadFile } = require("../../../utils/fs");

//创建文件夹目录
const downloadRoot = createDirIfNotExist(path.join(__dirname, "../../audio"))
const phrasesRoot = createDirIfNotExist(path.join(downloadRoot, "de-words"))

exports.downloadAudio = function downloadAudio(word, audio) {
    const filename = word.replace(/[\.,]+/g, '.').replace(/[^a-zÄäÖöÜüẞß'()]+/ig, '_').replace(/'/g, '').replace(/(^\.|\.$)/g, '')
    const dir_1 = audio.substr(0, 1)
    const dir_2 = audio.substr(1, 1)
    const src = `http://sound.yywz123.com/qsbdcdeword/${dir_1}/${dir_2}/${audio}.mp3`

    return downloadFile(path.join(phrasesRoot, `${filename}.mp3`), src, filename, 30)
}