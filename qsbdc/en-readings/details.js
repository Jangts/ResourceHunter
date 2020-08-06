const Crawler = require("crawler")
const { getItemLinksFromTemporary, getCountOfTemporary, insertItemWithUnformattedContent } = require("./sqlite")

const host = 'http://read.qsbdc.com/'
const c = new Crawler({
    maxConnections: 10,
    rateLimit: 300,
    // 这个回调每个爬取到的页面都会触发
    callback: function (error, res, done) {
        if (error) {
            console.log(error)
        }
        done()
    }
})
let count = 0

async function main() {
    const itemCount = await getCountOfTemporary()
    const fragsCount = Math.ceil(itemCount / 100)
    for (let h = 0; h < fragsCount; h++) {
        const items = await getItemLinksFromTemporary(h)
        await fetch(items)
    }
}

async function fetch(items) {
    return new Promise(function (resolve, reject) {
        const taskCTX = {
            rest: items.length,
            done: resolve
        }
        c.queue(items.map((item, i) => ({
            uri: host + item.href,
            jQuery: true,
            callback: articleCallback.bind({ item, taskCTX })
        })))
    })
}

function articleCallback(error, res, done) {
    if (error) {
        console.log('levelCallback error:', this.taskCTX.rest, error)
    } else {
        dealWithItem(this, res.$)
    }
    done()
}

async function dealWithItem(task, $) {
    const paragraphs = $('.wzbox p')
    const tags = $('.jbxz a')
    const content = []
    const cats = []
    const words = []

    for (let index = 0; index < paragraphs.length; index++) {
        const paragraph = paragraphs[index];
        const frags = []
        paragraph.children.forEach(frag=>{
            // console.log(frag.type, frag.name)
            if(frag.type==='text'){
                frags.push(frag.data)
            }
            else if(frag.name==='a') {
                frags.push(frag.children[0].children[0].data)
            }
        })
        content.push(frags)
    }
    // console.log(content)

    for (let index = 0; index < tags.length; index++) {
        if(index>1){
            words.push(tags[index].children[0].data)
        }
        else if(index===1){
            cats.push(tags[index].children[0].data)
        }
    }

    await insertItemWithUnformattedContent(task.item, JSON.stringify(content), cats.join('|'), JSON.stringify(words))
    task.taskCTX.rest--
    count++
    console.log(count, task.item.id, task.item.level, cats, task.item.title, JSON.stringify(words.slice(0, 5)))
    if(task.taskCTX.rest===0){
        task.taskCTX.done()
    }
}

main()