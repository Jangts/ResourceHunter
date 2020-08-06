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
CREATE TABLE IF NOT EXISTS cats(
    id          INT         PRIMARY KEY     NOT NULL,
    name        CHAR(255)                   NOT NULL,
    trans_jp    TEXT                        NOT NULL,
    trans_cn    TEXT                        NOT NULL
);`, function (err) {
    if (err) {
        console.log('table cats create error:', err)
    }
    else {
        console.log('table cats created or existed')
    }
})

database.run(`
CREATE TABLE IF NOT EXISTS words(
    id          INTEGER     PRIMARY KEY AUTOINCREMENT     NOT NULL,
    word        CHAR(255)                                 NOT NULL,
    trans_jp    TEXT                                      NOT NULL,
    trans_cn    TEXT                                      NOT NULL,
    cat         INT                                       NOT NULL,
    tags        TEXT                                      NOT NULL,
    img_dir   INT                                       NOT NULL  DEFAULT 1,
    img_count   INT                                       NOT NULL  DEFAULT 0
);`, function (err) {
    if (err) {
        console.log('table words create error:', err)
    }
    else {
        console.log('table words created or existed')
        database.run(`
CREATE UNIQUE INDEX IF NOT EXISTS words_pair
ON words(
    word ASC,
    trans_jp ASC
);`, function (err) {
            if (err) {
                console.log('index words_pair create error:', err)
            }
            else {
                console.log('index words_pair created or existed')
            }
        })
    }
})



exports.insertCat = function insertCat(id, name) {
    return new Promise(function (resolve, reject) {
        database.run(`INSERT OR IGNORE INTO cats (id, name, trans_jp, trans_cn) VALUES (?, ?, '', '');`, id, name, function (err) {
            if (err) {
                console.log(`insert cat ${name} error:`, err)
                resolve(false)
            }
            else {
                // console.log(`insert cat ${name} successfully!`)
                resolve(true)
            }
        })
    })
}

exports.insertWord = function insertWord(catid, item, tags, index, length) {
    const { en, jp } = item
    return new Promise(function (resolve, reject) {
        database.run(`
        INSERT OR REPLACE INTO words (cat, word, trans_jp, trans_cn, img_dir, img_count, tags)
        VALUES (?, ?, ?, '', ?, ?, ?);`, catid, en, jp, index, length, tags.join('|'), function (err) {
            if (err) {
                console.log(`insert word ${en} error:`, err)
                resolve(false)
            }
            else {
                // console.log(`insert word ${word} successfully!`)
                resolve(true)
            }
        })
    })
}