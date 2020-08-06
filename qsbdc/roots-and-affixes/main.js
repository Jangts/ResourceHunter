const Crawler = require("crawler")
const { insertItem } = require("./sqlite")

const host = 'http://root.qsbdc.com//'
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
    c.queue([...new Array(3)].map((_, i) => ({
        uri: host + 'root_list.php?type=' + (i + 1),
        jQuery: true,
        callback: typeCallback.bind({
            type: i + 1,
            total: 0,
            pages: []
        })
    })))
}

async function typeCallback(error, res, done) {
    if (error) {
        console.log('typeCallback error:', this.type, error)
    } else {
        analysetype(this, res.$)
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
                typeObj: this
            })
        })))
    }

}

function analysetype(typeObj, $) {
    const pageSelect = $('.table_solid tr td select')[0]
    // console.log(pageSelect.children.length)
    typeObj.pages = [...new Array(pageSelect.children.length)].map((_, i) => ({
        uri: `root_list.php?type=${typeObj.type}}&&tag=all&&page_id=${i + 1}`,
        items: []
    }))
}

function pageCallback(error, res, done) {
    const { index, typeObj } = this
    if (error) {
        console.log('pageCallback error:', typeObj.type, index, error)
    } else {
        typeObj.pages[index].items = getItemsByRows(res.$)
    }
    done()
    typeObj.pages[index].items.forEach((item, itemIndex) => dealWithItem(item, itemIndex, index, typeObj))
}

function getItemsByRows($) {
    const rows = $('.table_solid tr'), items = []
    for (let i = 2; i < rows.length - 1; i++) {
        row = rows[i]
        const enWordSpan = $('.hidden_1_1', row)[0]
        const cnWordSpan = $('.hidden_3_1', row)[0]
        const sampleAnchor = $('.mytitle', row)[0]

        if (enWordSpan && enWordSpan.children[0] && enWordSpan.children[0].data) {
            items.push({
                en: enWordSpan.children[0].data.trim(),
                cn: cnWordSpan && cnWordSpan.children[0] ? cnWordSpan.children[0].data.trim() : '',
                words: sampleAnchor && sampleAnchor.attribs.title && sampleAnchor.attribs.title.trim ? sampleAnchor.attribs.title
                    .trim()
                    .split('||||')
                    .filter((s, i) => !!i)
                    .map(s => {
                        const words = {
                            index: '',
                            words: []
                        }
                        s = s.trim().replace(/（/g, '(').replace(/）/g, ')')
                        while (s) {
                            const matches = s
                                .match(/^([^\x00-\xFF])?(([\x00-\xFF]+)([^\x00-\xFF][^(]+)(\(([^(]+)\))?)/)
                            if (matches) {
                                const [m, n, _1, en, cn, x, desc] = matches
                                // console.log(n, en, cn, desc)
                                if (n) {
                                    // console.log(matches)
                                    words.index = n
                                }
                                if (m === s) {
                                    words.words.push({
                                        en,
                                        cn,
                                        desc
                                    })
                                }

                                s = s.replace(m, '')
                            }
                            else {
                                // console.log('----------------------------------------', s)
                                words.words.push({ s })
                                s = ''
                            }
                        }
                        return words
                    }) : []
            })
        }
    }
    return items
}

async function dealWithItem(item, itemIndex, pageIndex, typeObj) {
    await insertItem(typeObj.type, item.en, item.cn, JSON.stringify(item.words))
    words[item.en] = item
    typeObj.total++
    count++
    console.log(count, typeObj.total, '[', item.en, '] type:', typeObj.type, 'page:', pageIndex, 'index:', itemIndex)
}

main()