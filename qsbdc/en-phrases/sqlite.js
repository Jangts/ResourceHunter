const sqlite3 = require("sqlite3");
const path = require("path");
const { createDirIfNotExist } = require("../../utils/fs");

const datapath = createDirIfNotExist(path.join(__dirname, "../data"))
const filename = path.join(datapath, "data.db")

const database = new sqlite3.Database(filename, function (err) {
    if (err) {
        console.log('database create or opene error:', err)
    }
    else {
        console.log('database created or opened')
    }
})

database.run(`
CREATE TABLE IF NOT EXISTS en_phrases(
    id          INTEGER     PRIMARY KEY AUTOINCREMENT     NOT NULL,
    level       INT                                       NOT NULL,
    phrase      CHAR(512)                                 NOT NULL,
    explain     TEXT                                      NOT NULL,
    sentences   JSON                                      NOT NULL
);`, function (err) {
    if (err) {
        console.log('table en_phrases create error:', err)
    }
    else {
        console.log('table en_phrases created or existed')
        database.run(`
CREATE UNIQUE INDEX IF NOT EXISTS en_phrases_index
ON en_phrases(
    phrase ASC,
    explain ASC
);`, function (err) {
            if (err) {
                console.log('index en_phrases_index create error:', err)
            }
            else {
                console.log('index en_phrases_index created or existed')
            }
        })
    }
})

exports.insertItem = function insertItem(level, phrase, explain, sentences) {
    return new Promise(function (resolve, reject) {
        database.run(`INSERT OR IGNORE INTO en_phrases (level, phrase, explain, sentences) VALUES (?, ?, ?, ?);`, 
        level, phrase, explain, sentences, function (err) {
            if (err) {
                console.log(`insert phrase ${phrase} error:`, err)
                resolve(false)
            }
            else {
                // console.log(`insert phrase ${phrase} successfully!`)
                resolve(true)
            }
        })
    })
}