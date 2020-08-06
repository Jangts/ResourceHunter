const request = require('request');
const url = require('url');
const util = require('util');

const requestData = {

}

const options = {
    url: 'https://fanyi.baidu.com/v2transapi?from=jp&to=en',
    method: "POST",
    json: true,
    headers: {
        "content-type": "application/json",
    },
    body: JSON.stringify(requestData)
}

exports.getTrans = function getTrans(word) {
    return new Promise(function (resolve, reject) {
        

        request({
            ...options,
            body: JSON.stringify({
                ...requestData
            })
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body) // 请求成功的处理逻辑
                resolve(true)
            } else {
                resolve({
                    en:'',
                    cd:''
                })
            }
        })
    })
}

// download('test', {
//     word: 'test',
//     filename: 'test2',
//     url: 'https://icooon-mono.com/i/icon_10119/icon_101191_512.png'
// })