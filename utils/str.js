const jpkeywords = ['無料アイコン', 'フリーアイコン', 'アイコン', 'ピクトグラム']
const enkeywords = ['pictogram']

function formatNumberWitchLessThan100(num) {
    if (num > 9) {
        return num.toString()
    }
    return '0' + num
}

function repeatString(target, n) {
    let s = target,
        total = "";
    // let times = 0
    while (n > 0) {
        // times++
        if (n % 2 == 1) {
            total += s;
        }
        if (n == 1) {
            break;
        }
        s += s;
        n = n >> 1; // 相当于将n除以2取其商
    }
    // console.log('times:', times)
    return total;
}

exports.formatNumeric = function formatNumeric(num, len = 2) {
    if (num === 0 || (num && num.toString())) {
        if (len === 2) return formatNumberWitchLessThan100(num)
        num = num.toString()
        if (len > num.length) return repeatString('0', len - num.length) + num
        return num
    }
    return ''
}

exports.jp = function (word) {
    if (jpkeywords.indexOf(word) == -1) {
        word = word
            // .trim()
            .replace(/\s+/g, '')
            .replace(/[１２３４５６７８９０\d]$/, '')
            .replace(/[１２３４５６７８９０\d]\.$/, '')
            .replace(/！/, '')
            .replace('。', '')
            .replace('のフリーアイコン', '')
            .replace('フリーアイコン', '')
            .replace('の無料アイコン', '')
            .replace('無料アイコン', '')
            .replace('のアイコン素材', '')
            .replace('のフリー素材', '')
            .replace('の無料素材', '')
            .replace('無料素材', '')
            .replace('の無料', '')
            .replace('無料の', '')
            .replace('無料', '')
            .replace('の素材', '')
            .replace('の人物素材', '')
            .replace('の人物その', '')
            .replace('その', '')
            .replace('の人物', '')
            .replace('素材', '')
            .replace('のアイコン', '')
            .replace('アイコン', '')
            .replace('のイラスト', '')
            .replace('イラスト', '')
            .replace('のピクトアイコン', '')
            .replace('ピクトアイコン', '')
            .replace('のピクトグラム', '')
            .replace('ピクトグラム', '')
            .replace('のピクト', '')
            .replace('ピクト', '')
            .replace('無料で使える', '')
            .replace(/[a-z\d]+$/i, '') || 'ピクトアイコン'
    }
    return word
}


exports.en = function (word) {
    if (enkeywords.indexOf(word) == -1) {
        word = word
            .trim()
            .replace(/[１２３４５６７８９０\d]+\.$/, '')
            .replace(/(part)*\s*[１２３４５６７８９０\d]+(frame)*$/, '')
            .replace('sign remake', '')
            .replace('[ remake ]', '')
            .replace('illustration', '')
            .replace('pictogram', '')
            .replace('picture', '')
            .replace('free icon', '')
            .replace('icon circle', '')
            .replace('ｆ', 'f')
            .trim()
            .replace(/image$/i, ' ')
            .replace(/sign$/i, ' ')
            .replace(/icon$/i, ' ')
            .replace(/^icon of/i, ' ')
            .replace(/[^a-z\)]+$/i, ' ')
            .replace(/\s+/g, ' ')
            .trim().toLowerCase() || 'pictogram'
    }
    return word
}