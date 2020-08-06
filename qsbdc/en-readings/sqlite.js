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
CREATE TABLE IF NOT EXISTS en_articles_tmp(
    id              INTEGER     PRIMARY KEY AUTOINCREMENT     NOT NULL,
    level           INT                                       NOT NULL,
    href            CHAR(512)                                 NOT NULL,
    title           CHAR(512)                                 NOT NULL
);`, function (err) {
    if (err) {
        console.log('table en_articles_tmp create error:', err)
    }
    else {
        console.log('table en_articles_tmp created or existed')
        database.run(`
CREATE UNIQUE INDEX IF NOT EXISTS en_articles_tmp_index
ON en_articles_tmp(href ASC);`, function (err) {
            if (err) {
                console.log('index en_articles_tmp_index create error:', err)
            }
            else {
                console.log('index en_articles_tmp_index created or existed')
            }
        })
    }
})

database.run(`
CREATE TABLE IF NOT EXISTS en_articles(
    id          INTEGER     PRIMARY KEY     NOT NULL,
    level       INT                         NOT NULL,
    title       CHAR(512)                   NOT NULL,
    tags        CHAR(512)                   NOT NULL,
    words       TEXT                        NOT NULL,
    content     JSON                        NOT NULL
);`, function (err) {
    if (err) {
        console.log('table en_articles create error:', err)
    }
    else {
        console.log('table en_articles created or existed')
    }
})

exports.insertItemTemporary = function insertItem(level, {href, title}) {
    return new Promise(function (resolve, reject) {
        database.run(`INSERT OR IGNORE INTO en_articles_tmp (level, href, title) VALUES (?, ?, ?);`, 
        level, href, title, function (err) {
            if (err) {
                console.log(`insert link ${href} error:`, err)
                resolve(false)
            }
            else {
                // console.log(`insert link ${href} successfully!`)
                resolve(true)
            }
        })
    })
}

exports.getCountOfTemporary = function getCountOfTemporary() {
    return new Promise(function (resolve, reject) {
        database.get(`SELECT COUNT(*) AS count FROM en_articles_tmp;`, function (err, row) {
            if (!err) {
                resolve(row.count)
            }
            resolve(0)
        })
    })
}

exports.getItemLinksFromTemporary = function getItemLinksFromTemporary(hundreds = 0) {
    return new Promise(function (resolve, reject) {
        database.all(`SELECT * FROM en_articles_tmp LIMIT ?, 100;`, 100 * hundreds, function (err, rows) {
            if (!err) {
                // console.log(rows)
                resolve(rows)
            }
            resolve([])
        })
    })
}

exports.insertItemWithUnformattedContent = function insertItem({level, id, href, title}, content, tags, words) {
    return new Promise(function (resolve, reject) {
        database.run(`INSERT OR IGNORE INTO en_articles (id, title, content, level, tags, words)
        VALUES (?, ?, ?, ?, ?, ?);`, 
        id, title, content, level, tags, words, function (err) {
            if (err) {
                console.log(`insert article ${id} error:`, err)
                resolve(false)
            }
            else {
                // console.log(`insert article ${id} successfully!`)
                resolve(true)
            }
        })
    })
}