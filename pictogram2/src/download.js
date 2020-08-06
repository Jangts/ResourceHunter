const path = require("path");
const { createDirIfNotExist, downloadFile } = require("../../utils/fs");
const { formatNumeric } = require("../../utils/str");

//创建文件夹目录
const downloadRoot = createDirIfNotExist(path.join(__dirname, "../icons"))

exports.downloadIcons = function downloadIcons(catid, item, {src, length}, index) {
    const { cat, en, jp } = item
    const parentDir = createDirIfNotExist(path.join(downloadRoot, formatNumeric(catid) + '.' + cat))
    const wordDir = createDirIfNotExist(path.join(parentDir, en))
    const mainPath = createDirIfNotExist(path.join(wordDir, formatNumeric(index) + '.' + jp))
    const morePath = createDirIfNotExist(path.join(mainPath, '500'))
    const srcPath = src.replace('/i/m.png', '')

    const tasks = [...new Array(length)].map((_, i) => {
        if(i){
            return downloadFile(path.join(morePath, `${i}.png`), `${srcPath}/${i}.png`, `[${cat.name}/${en}]/${i}`)
        } else {
            return downloadFile(path.join(mainPath, `300.png`), src, `[${cat.name}/${en}]/m`)
        }
    })

    return Promise.all(tasks)
}