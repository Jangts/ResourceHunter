const sqlite3 = require("sqlite3");
const path = require("path");
const { createDirIfNotExist } = require("../../../utils/fs");

const datapath = createDirIfNotExist(path.join(__dirname, "../../data"))
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
CREATE TABLE IF NOT EXISTS en_words(
    id              INTEGER     PRIMARY KEY AUTOINCREMENT     NOT NULL,
    level           INT                                       NOT NULL,
    word            CHAR(512)                                 NOT NULL,
    pronunciation   CHAR(512)                                 NOT NULL,
    explain         TEXT                                      NOT NULL,
    sentences       JSON                                      NOT NULL
);`, function (err) {
    if (err) {
        console.log('table en_words create error:', err)
    }
    else {
        console.log('table en_words created or existed')
        database.run(`
CREATE UNIQUE INDEX IF NOT EXISTS en_words_index
ON en_words(
    word ASC,
    explain ASC
);`, function (err) {
            if (err) {
                console.log('index en_words_index create error:', err)
            }
            else {
                console.log('index en_words_index created or existed')
            }
        })
    }
})

exports.insertItem = function insertItem(level, word, pronunciation, explain, sentences) {
    return new Promise(function (resolve, reject) {
        database.run(`INSERT OR IGNORE INTO en_words (level, word, pronunciation, explain, sentences) VALUES (?, ?, ?, ?, ?);`, 
        level, word, pronunciation, explain, sentences, function (err) {
            if (err) {
                console.log(`insert word ${word} error:`, err)
                resolve(false)
            }
            else {
                // console.log(`insert word ${word} successfully!`)
                resolve(true)
            }
        })
    })
}