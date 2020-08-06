const sqlite3 = require("sqlite3");
const path = require("path");
const { createDirIfNotExist } = require("../../utils/fs");

const datapath = createDirIfNotExist(path.join(__dirname, "../db"))
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
CREATE TABLE IF NOT EXISTS roots_and_affixes (
    id          INTEGER     PRIMARY KEY AUTOINCREMENT     NOT NULL,
    type        INT                                       NOT NULL,
    item        CHAR(512)                                 NOT NULL,
    explain    TEXT                                      NOT NULL,
    words       JSON                                      NOT NULL
);`, function (err) {
    if (err) {
        console.log('table roots_and_affixes create error:', err)
    }
    else {
        console.log('table roots_and_affixes created or existed')
        database.run(`
CREATE UNIQUE INDEX IF NOT EXISTS roots_and_affixes_index
ON roots_and_affixes(
    type ASC,
    item ASC
);`, function (err) {
            if (err) {
                console.log('index roots_and_affixes_index create error:', err)
            }
            else {
                console.log('index roots_and_affixes_index created or existed')
            }
        })
    }
})



exports.insertItem = function insertItem(type, item, explain, words) {
    return new Promise(function (resolve, reject) {
        database.run(`INSERT OR IGNORE INTO roots_and_affixes (type, item, explain, words) VALUES (?, ?, ?, ?);`, 
        type, item, explain, words, function (err) {
            if (err) {
                console.log(`insert item ${item} error:`, err)
                resolve(false)
            }
            else {
                // console.log(`insert item ${item} successfully!`)
                resolve(true)
            }
        })
    })
}