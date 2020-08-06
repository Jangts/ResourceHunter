const Crawler = require("crawler")
const { downloadAudio } = require("./download")
const { insertItem } = require("./sqlite")

const host = 'http://phrase.qsbdc.com/'
const words = {}
const c = new Crawler({
    maxConnections: 2,
    rateLimit: 2000,
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
    c.queue([...new Array(10)].map((_, i) => ({
        uri: host + 'wl.php?level=' + (i + 1),
        jQuery: true,
        callback: levelCallback.bind({
            level: i + 1,
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
        if (this.pages.length > 0) {
            this.pages[0].items = getItemsByRows(res.$)
        }
    }
    done()
    if (this.pages.length > 0) {
        this.pages[0].items.forEach((item, itemIndex) => dealWithItem(item, itemIndex, 0, this))
        c.queue(this.pages.filter((_, i) => !!i).map((p, index) => ({
            uri: host + p.uri,
            jQuery: true,
            callback: pageCallback.bind({
                index,
                levelObj: this
            })
        })))
    }

}

function analyseLevel(levelObj, $) {
    const pageSelect = $('.table_solid tr td select')[0]
    // console.log(pageSelect.children.length)
    levelObj.pages = [...new Array(pageSelect.children.length)].map((_, i) => ({
        uri: `wl.php?level=${levelObj.level}}&&tag=all&&page_id=${i + 1}`,
        items: []
    }))
}

function pageCallback(error, res, done) {
    const { index, levelObj } = this
    if (error) {
        console.log('pageCallback error:', levelObj.level, index, error)
    } else {
        levelObj.pages[index].items = getItemsByRows(res.$)
    }
    done()
    levelObj.pages[index].items.forEach((item, itemIndex) => dealWithItem(item, itemIndex, index, levelObj))
}

function getItemsByRows($) {
    const rows = $('.table_solid tr'), items = []
    for (let i = 2; i < rows.length - 1; i++) {
        row = rows[i]
        const enWordSpan = $('.hidden_1_1', row)[0]
        const cnWordSpan = $('.hidden_3_1', row)[0]
        const audioAnchor = $('a[title="听读音"]', row)[0]
        const sampleAnchor = $('.mytitle', row)[0]

        if (enWordSpan && enWordSpan.children[0] && enWordSpan.children[0].data) {
            items.push({
                en: enWordSpan.children[0].data.trim(),
                cn: cnWordSpan && cnWordSpan.children[0] ? cnWordSpan.children[0].data.trim() : '',
                audio: audioAnchor && audioAnchor.attribs.name ? audioAnchor.attribs.name.trim() : null,
                sentences: sampleAnchor && sampleAnchor.attribs.title && sampleAnchor.attribs.title.trim ? sampleAnchor.attribs.title
                    .trim()
                    .split('||||')
                    .filter((s, i) => !!i)
                    .map(s => {
                        s = s.trim()
                        const matches = s.match(/^([\x00-\xFF]+)([^\x00-\xFF][\s\S]+)$/)
                        if (matches) {
                            const [m, en, cn] = matches
                            // console.log(en, cn)
                            return { en, cn }
                        }
                        else {
                            // console.log('----------------------------------------', s)
                            return { s }
                        }
                    }) : []
            })
        }
    }
    return items
}

async function dealWithItem(item, itemIndex, pageIndex, levelObj) {
    await insertItem(levelObj.level, item.en, item.cn, JSON.stringify(item.sentences))
    if (item.audio) await downloadAudio(item.en, item.audio)
    words[item.en] = item
    levelObj.total++
    count++
    console.log(count, levelObj.total, '[', item.en, '] level:', levelObj.level, 'page:', pageIndex, 'index:', itemIndex)
}

main()