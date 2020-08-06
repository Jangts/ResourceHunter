const Crawler = require("crawler")
const { insertItemTemporary } = require("./sqlite")

const host = 'http://read.qsbdc.com/'
const c = new Crawler({
    maxConnections: 5,
    rateLimit: 1000,
    // 这个回调每个爬取到的页面都会触发
    callback: function (error, res, done) {
        if (error) {
            console.log(error)
        }
        done()
    }
})
let count = 0

function main() {
    c.queue([...new Array(11)].map((_, i) => ({
        uri: host + 'html/' + (i + 2) + '/',
        jQuery: true,
        callback: levelCallback.bind({
            level: i + 2,
            total: 0,
            pages: []
        })
    })))
}

async function levelCallback(error, res, done) {
    if (error) {
        console.log('levelCallback error:', this.level, error)
    } else {
        analyseLevel(this, res.$)
        addItemLinksFromList(res.$, this.level)
    }
    done()
    // console.log(this.pages)
    if (this.pages.length > 0) {
        c.queue(this.pages.filter((_, i) => !!i).map((uri, index) => ({
            uri: host + uri,
            jQuery: true,
            callback: pageCallback.bind({
                index,
                levelObj: this
            })
        })))
    }
}

function analyseLevel(levelObj, $) {
    const pageSelect = $('.pager_last a')[0]
    // console.log(pageSelect)
    if (pageSelect) {
        // console.log(pageSelect.attribs.href)
        const last_page = pageSelect.attribs.href.replace(/[\D]+/g, '')
        // console.log(last_page)
        levelObj.pages = [...new Array(Number(last_page))].map((_, i) => `html/${levelObj.level}/list_${i + 1}.html`)
    }
}

function pageCallback(error, res, done) {
    const { index, levelObj } = this
    if (error) {
        console.log('pageCallback error:', levelObj.level, index, error)
    } else {
        addItemLinksFromList(res.$, levelObj.level)
    }
    done()
}

async function addItemLinksFromList($, level) {
    const list = $('.list_lb ul li a')
    for (let index = 0; index < list.length; index++) {
        const element = list[index];
        // console.log(element.attribs)
        if (!element.attribs.title) {
            element.attribs.title = element.children[0].data
        }
        await insertItemTemporary(level, element.attribs)
        count++
        console.log(count, element.attribs.href, level, element.attribs.title)
    }
}

main()