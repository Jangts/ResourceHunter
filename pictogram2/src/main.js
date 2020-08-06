const Crawler = require("crawler")
const { downloadIcons } = require("./download")
const { insertCat, insertWord } = require("./sqlite")
const name = require("../../utils/str")

const c = new Crawler({
    maxConnections: 10,
    rateLimit: 2000,
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

const host = 'http://pictogram2.com/'
const cats = []
const words = {}
let count = 0

async function listCallback(error, res, done) {
    done()
    if (error) {
        console.log(error)
    } else {
        await analyseList(res.$)
    }
}

async function analyseList($) {
    const pics = $('#gallery ul.ul_gallery li.over')
    for (let index = 0; index < pics.length; index++) {
        const [i, a] = pics[index].children
        // console.log(a.attribs.href, a.children[0].data)
        if (a.attribs.href && a.children[0].data) {
            const item = await createWord(
                name.jp(a.children[0].data),
                a.attribs.href.replace(host, '').replace('//', '/').replace('//', '/'))
            // console.log(word)
            if (item.en) {
                // console.log(item.cat, item.en, item.jp, item.imgs[0].src)
                let catid = cats.indexOf(item.cat) + 1
                if (catid === 0) {
                    cats.push(item.cat)
                    catid = cats.length
                    await insertCat(catid, item.cat)
                }
                if (words[item.en]) {
                    words[item.en].imgs.push(item.imgs[0])
                    if(words[item.en].tags[item.jp]){
                        item.tags.forEach(tag => {
                            if (words[item.en].tags[item.jp].indexOf(tag) === -1) {
                                words[item.en].tags[item.jp].push(tag)
                            }
                        })
                    }
                    else {
                        words[item.en].tags[item.jp] = item.tags
                    }
                    words[item.en].items.push(item)
                } else {
                    words[item.en] = {
                        imgs: item.imgs,
                        tags: {
                            [item.jp]: item.tags
                        },
                        items: [item]
                    }
                }
                try {
                    await downloadIcons(catid, item, item.imgs[0], words[item.en].imgs.length)
                    await insertWord(catid, item, words[item.en].tags[item.jp], words[item.en].imgs.length, item.imgs[0].length)
                    count++
                    console.log(count, item.en, item.jp, item.imgs[0].src, item.imgs[0].length)
                } catch (error) {
                    console.warn('Download Error:', item.en, item.jp, item.imgs[0].src, error)
                }
            } else {
                console.warn('Word Error:', item.jp)
            }
        }
        else {
            console.warn('Query Error:', '#gallery ul.ul_gallery li.over', index)
        }
    }
}

async function createWord(jp, href) {
    return new Promise(function (resolve) {
        // console.log(host + href + '&lang=en')
        c.queue([{
            uri: host + href + '&lang=en',
            jQuery: true,
            callback: function (error, res, done) {
                if (error) {
                    console.log(error)
                    resolve({ jp })
                } else {
                    resolve(analyseWord(res.$, jp))
                }
                done()
            }
        }])
    })
}

function analyseWord($, jp) {
    // console.log($('#imgBtnPop')[0])
    try {
        const img = $('#imgBtnPop')[0]
        const en = name.en(img.attribs.alt)
        const imgs = [{ src: host + name.en(img.attribs.src) }]

        const info = $('#single .entryInfo li')
        const cat = info[0].children[1].children[0].data
        const tags = info[1].children.filter(el => (el.type === 'tag' && el.name === 'a')).map(a => a.children[0].data)

        const pics = $('#variContent li')
        imgs[0].length = pics.length + 1
        // console.log(en, imgSrc)
        // console.log(cat, tags)
        return { jp, en, cat, tags, imgs }
    } catch (error) {
        console.warn('Analyse Word Error:', error)
    }
}

c.queue([...new Array(40)].map((u, i) => ({
    uri: host + '?paged=' + (i + 1),
    jQuery: true,
    callback: listCallback
})))