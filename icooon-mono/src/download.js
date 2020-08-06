const path = require("path")
const { createDirIfNotExist, downloadFile } = require("../../utils/fs")
const { formatNumeric } = require("../../utils/str")

//创建文件夹目录
const downloadRoot = createDirIfNotExist(path.join(__dirname, "../icons"))

exports.downloadIcon = function downloadIcon(cat, item) {
    const { en, filename, imgSrc } = item
    const parentDir = createDirIfNotExist(path.join(downloadRoot, formatNumeric(cat.id) + '.' + cat.name))
    const dirPath = createDirIfNotExist(path.join(parentDir, en))

    return downloadFile(path.join(dirPath, filename), imgSrc, `[${cat.name}/${en}]`, 250)
}