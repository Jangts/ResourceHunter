const Crawler = require("crawler")
const { downloadAudio } = require("./download")
const { insertItem } = require("./sqlite")

const host = 'http://de.qsbdc.com/'
const words = {}
const c = new Crawler({
    maxConnections: 10,
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
    c.queue([...new Array(29)].map((_, i) => i + 1).filter(i => [24, 25, 27, 28].indexOf(i) === -1).map(i => ({
        uri: host + 'deword/word_list.php?letter_id=' + i,
        jQuery: true,
        callback: groupCallback.bind({
            letterID: i,
            total: 0,
            pages: []
        })
    })))
}

async function groupCallback(error, res, done) {
    if (error) {
        console.log('groupCallback error:', this.letterID, error)
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
                group: this
            })
        })))
    }

}

function analyseLevel(group, $) {
    const pageSelect = $('.table_solid tr td select')[0]
    // console.log(pageSelect.children.length)
    if (pageSelect) {
        group.pages = [...new Array(pageSelect.children.length)].map((_, i) => ({
            uri: `deword/word_list.php?letter_id=${group.letterID}}&&tag=all&&page_id=${i + 1}`,
            items: []
        }))
    }
    else {
        console.log('Scan Group Error', group)
    }
}

function pageCallback(error, res, done) {
    const { index, group } = this
    if (error) {
        console.log('pageCallback error:', group.letterID, index, error)
    } else {
        group.pages[index].items = getItemsByRows(res.$)
    }
    done()
    group.pages[index].items.forEach((item, itemIndex) => dealWithItem(item, itemIndex, index, group))
}

function getItemsByRows($) {
    const rows = $('.table_solid tr'), items = []
    for (let i = 2; i < rows.length - 1; i++) {
        row = rows[i]
        const deWordSpan = $('.hidden_1_1', row)[0]
        const phWordSpan = $('.hidden_2_1', row)[0]
        const cnWordSpan = $('.hidden_3_1', row)[0]
        const audioAnchor = $('a[title="听读音"]', row)[0]
        const sampleAnchor = $('.mytitle', row)[0]

        if (deWordSpan && deWordSpan.children[0] && deWordSpan.children[0].data) {
            items.push({
                de: deWordSpan.children[0].data.trim(),
                ph: phWordSpan && phWordSpan.children[0] && phWordSpan.children[0].data ? phWordSpan.children[0].data.trim() : '',
                cn: cnWordSpan && cnWordSpan.children[0] && cnWordSpan.children[0].data ? cnWordSpan.children[0].data.trim() : '',
                audio: audioAnchor && audioAnchor.attribs.name ? audioAnchor.attribs.name.trim() : null,
                sentences: sampleAnchor && sampleAnchor.attribs.title && sampleAnchor.attribs.title.trim ? sampleAnchor.attribs.title
                    .trim()
                    .split('||||')
                    .filter((s, i) => !!i)
                    .map(s => {
                        s = s.trim()
                        const matches = s.match(/^([\x00-\xFFÄäÖöÜüẞß]+)([^\x00-\xFFÄäÖöÜüẞß][\s\S]+)$/)
                        if (matches) {
                            const [m, de, cn] = matches
                            // console.log(de, cn)
                            return { de, cn }
                        }
                        else {
                            // console.log('----------------------------------------', s)
                            return { s }
                        }
                    }) : []
            })
        }
        else {
            console.log('Word Span Error:', deWordSpan.children[0].data, !phWordSpan, !cnWordSpan, !audioAnchor, !sampleAnchor)
        }
    }
    return items
}

async function dealWithItem(item, itemIndex, pageIndex, group) {
    await insertItem(item.de, item.ph, item.cn, JSON.stringify(item.sentences))
    if (item.audio) await downloadAudio(item.de, item.audio)
    words[item.de] = item
    group.total++
    count++
    console.log(count, group.total, item.de, '[', item.ph, ']', item.cn, 'level:', group.letterID, 'page:', pageIndex, 'index:', itemIndex)
}

main()