const Crawler = require("crawler")
const { downloadIcon } = require("./download")
const { insertCat, insertWord } = require("./sqlite")
const name = require("../../utils/str")

const c = new Crawler({
    maxConnections: 1,
    rateLimit: 8000,
    // 这个回调每个爬取到的页面都会触发
    callback: function (error, res, done) {
        if (error) {
            console.log(error)
        } else {
            var $ = res.$
            // $默认使用Cheerio
            // 这是为服务端设计的轻量级jQuery核心实现
            console.log($("title").text())
        }
        done()
    }
})

const host = 'https://icooon-mono.com'
const home = '/category/person/'
const store = {}
const words = {}
const items = {}

let count = 0

async function homeCallback(error, res, done) {
    if (error) {
        console.log(error)
    } else {
        await addCats(res.$)
    }
    // console.log('homeCallback done')
    done()
    fetchCats()
}

async function addCats($) {
    const cats = $('#categoryNav li a')
    // console.log(typeof cats, cats instanceof Array, cats.map)
    for (let index = 0; index < cats.length; index++) {
        const cat = cats[index]
        if (cat.attribs.href && cat.children[0].children[0].data) {
            id = index + 1
            const href = cat.attribs.href.replace(host, '').replace('//', '/').replace('//', '/')
            // console.log(href, cat.children[0].children[0].data)
            const name = cat.children[0].children[0].data
            await insertCat(id, name)
            store[name] = {
                id,
                name,
                href,
                uris: [href],
                data: []
            }
        }
    }
    // console.log(store)
}

function fetchCats() {
    Object.keys(store).forEach(catname => {
        const cat = store[catname]
        c.queue([{
            uri: host + cat.href + '?lang=en',
            jQuery: true,
            callback: enCatCallback.bind(cat)
        },
        {
            uri: host + cat.href,
            jQuery: true,
            callback: jpCatCallback.bind(cat)
        }])
    })
}

function enCatCallback(error, res, done) {
    // console.log(host + this.href)
    if (error) {
        console.log(this.href, res.url)
        console.log(error)
    } else {
        addEnWords(res.$, this, this.href + '?lang=en')
    }
    // console.log('catCallback done', this.href)
    done()
}

function jpCatCallback(error, res, done) {
    // console.log(host + this.href)
    if (error) {
        console.log(this.href, res.url)
        console.log(error)
    } else {
        addUris(res.$, this)
        addJpWords(res.$, this, this.href)
    }
    // console.log('catCallback done', this.href)
    done()
    fetchUrisOfCat(this)
}

function addUris($, cat) {
    const maxPage = $('#wp_page_numbers li.first_last_page a').text()
    for (let p = 2; p <= maxPage; p++) {
        cat.uris.push(cat.href + 'page/' + p)
    }
}

function fetchUrisOfCat(cat) {
    cat.uris.forEach((url, index) => {
        if (index) {
            c.queue([{
                uri: host + url + '?lang=en',
                jQuery: true,
                callback: enUriCallback.bind({ cat, index })
            }, {
                uri: host + url,
                jQuery: true,
                callback: jpUriCallback.bind({ cat, index })
            }])
        }
    })
}

function enUriCallback(error, res, done) {
    const { cat, index } = this
    if (error) {
        console.log(cat.uris[index] + '?lang=en', error)
    } else {
        addEnWords(res.$, cat, cat.uris[index] + '?lang=en')
    }
    // console.log(cat)
    // console.log('uriCallback done', cat.uris[index] + '?lang=en')
    done()
}

function jpUriCallback(error, res, done) {
    const { cat, index } = this
    if (error) {
        console.log(cat.uris[index], error)
    } else {
        addJpWords(res.$, cat, cat.uris[index])
    }
    // console.log(cat)
    // console.log('uriCallback done', cat.uris[index])
    done()
}

async function addEnWords($, cat, url) {
    const list = $('#topMaincolumn li a')
    for (let index = 0; index < list.length; index++) {
        // console.log('addWords loop', url, index)
        const children = list[index].children
        // console.log(children[0].attribs.src, children[1].children[0].data)
        if (children[0].attribs.src && children[1].children[0].data) {
            let item, word = children[1].children[0].data
            if (word.indexOf('Mao Zedong') > -1) {
                console.warn('addWords loop ignore', url, index)
                continue;
            }
            word = name.en(word)

            if (!words[word]) {
                words[word] = {
                    word,
                    cat: cat.name,
                    items: [],
                    imgIndexs: {}
                }
            }

            const id = children[0].attribs.src
            const imgIndex = words[word].items.length + 1
            if (items[id]) {
                item = items[id]
                item.en = word
                item.imgIndex = imgIndex
                item.filename = word.replace(/\s+/g, '_') + imgIndex + '.png'
            }
            else {
                item = items[id] = {
                    en: word,
                    jp: '',
                    imgSrc: host + id.replace('_64.png', '_512.png'),
                    imgIndex,
                    filename: word.replace(/\s+/g, '_') + '_' + imgIndex + '.png',
                    downloaded: false,
                    recordState: 0
                }
            }
            words[word].items.push(item)

            try {
                item.downloaded = await downloadIcon(cat, item)
                // if (item.downloaded == false) {
                //     item.filename = item.filename.replace('.png', '_256.png')
                //     item.imgSrc = item.imgSrc.replace('_512.png', '_256.png')
                //     item.downloaded = await downloadIcon(cat, item)
                // }
                if (item.downloaded == true) {
                    if (item.recordState === 0 && item.jp) {
                        item.recordState = 1
                        if (await addWordToDB(cat, item)) {
                            item.recordState = 2
                        }
                    }
                } else {
                    count++
                    console.log(count, item.downloaded, `${cat.name}/${item.en}/${item.filename}`, item.imgSrc)
                }
            } catch (error) {
                console.warn('Download Error:', `${cat.name}/${item.en}/${item.filename}`, item.imgSrc, error)
            }
        }
        else {
            console.warn('Query Error:', '#topMaincolumn li a', index)
        }
        // console.log('addWords loop complish', url, index)
    }
    // console.log('addWords end', url)
}

async function addJpWords($, cat, url) {
    const list = $('#topMaincolumn li a')
    for (let index = 0; index < list.length; index++) {
        // console.log('addWords loop', url, index)
        const children = list[index].children
        // console.log(children[0].attribs.src, children[1].children[0].data)
        if (children[0].attribs.src && children[1].children[0].data) {
            let item, word = children[1].children[0].data
            if (word.indexOf('毛沢東') > -1) {
                console.warn('addWords loop ignore', url, index)
                continue;
            }
            word = name.jp(word)

            const id = children[0].attribs.src

            if (items[id]) {
                item = items[id]
                item.jp = word

                if (item.downloaded == true && item.recordState === 0 && item.en) {
                    item.recordState = 1
                    if (await addWordToDB(cat, item)) {
                        item.recordState = 2
                    }
                }
            }
            else {
                item = items[id] = {
                    jp: word,
                    imgSrc: host + id.replace('_64.png', '_512.png'),
                    downloaded: false,
                    recordState: 0
                }
            }
        }
        else {
            console.warn('Query Error:', '#topMaincolumn li a', index)
        }
    }
    // console.log('addWords end', url)
}

async function addWordToDB(cat, item) {
    if (words[item.en].imgIndexs[item.jp]) {
        words[item.en].imgIndexs[item.jp].push(item.imgIndex)
    }
    else {
        words[item.en].imgIndexs[item.jp] = [item.imgIndex]
    }
    try {
        await insertWord(cat.id, item, words[item.en].imgIndexs[item.jp])
        cat.data.push(item)
        count++
        console.log(count, item.downloaded, `${cat.name}/${item.en}/${item.filename}`, item.imgSrc)
        return true
    } catch (error) {
        console.warn('Insert Word Error:', `${cat.name}/${item.en}/${item.filename}`, item.imgSrc, error)
        return false
    }
}

c.queue([{
    uri: host + home,
    jQuery: true,
    callback: homeCallback
}])