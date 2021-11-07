const AWS = require('aws-sdk');
const https = require('https');
const http = require('http');
let s3 = new AWS.S3();
const BUCKETNAME= '';

let makeResponse = (statusCode, body) => {
    const response = {
        statusCode: statusCode,
        isBase64Encoded: false,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: body
    };
    return response;
}

let downloadHTML = async (url, isHttps) => {
    let response;
    return new Promise((resolve, reject) => {
        if (isHttps) {
            https.get(encodeURI(url), res => {
                console.log('Descargando...');
                res.setEncoding('utf8');
                let full = '';
                res.on('data', data => {
                    full += data;
                });
                res.on('end', () => {
                    response = full;
                    resolve(response);
                });
            });
        } else {
            http.get(encodeURI(url), res => {
                console.log('Descargando...');
                res.setEncoding('utf8');
                let full = '';
                res.on('data', data => {
                    full += data;
                });
                res.on('end', () => {
                    response = full;
                    resolve(response);
                });
            });
        }

    });
}

let searchVideoLink = (htmlResponse) => {
    let linkExpression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi;
    let linksRegex = new RegExp(linkExpression);
    let linksList = htmlResponse.match(linksRegex);
    console.log(linksList);
    let videosList = [];
    if (linksList != null) {
        let youtubeExpression = /(youtube.com\/watch)|(youtu.be)/;
        let videoExpression = /(.*\.m3u8)|(.*\.mp4)|(.*\.webm)|(.*\.mkv)|(.*\.mov)|(.*\.avi)/gi;
        let videoRegex = new RegExp(videoExpression);
        let youtubeRegex = new RegExp(youtubeExpression);
        
        for (let link of linksList) {
            if (youtubeRegex.test(link) || videoRegex.test(link)) {
                console.log(link);
                videosList.push(link);
            }
        }
    }
    return videosList;
}

let uploadFile = async (params) => {
    let response;
    let folder = parseInt(Math.random() * 100000, 10);
    let key = 'files/input/' + folder + '/' + params.filename;
    await s3.upload({
        Bucket: BUCKETNAME,
        Key: key,
        Body: params.body,
        ContentType: params.contentType
    }).promise()
        .then((res) => {
            response = key;
        }).catch((error) => {
            response = makeResponse(500, JSON.stringify(error));
            console.log(response);
        });
    return response;
}

let main = async (params) => {
    let httpsExpression = /https/;
    let regex = new RegExp(httpsExpression);
    let responseArray = [];
    if (searchVideoLink(params.url).length > 0) {
        responseArray.push(params.url);
        let isVideoResponse = makeResponse(200, JSON.stringify(responseArray));
        return isVideoResponse;
    }
    if (params.url)
        if (regex.test(params.url)) {
            htmlResponse = await downloadHTML(params.url, true);
        } else {
            htmlResponse = await downloadHTML(params.url, false);
        }
    let videoLinks = searchVideoLink(htmlResponse);
    let videoLinksUnique = [...new Set(videoLinks)];

    for (let video of videoLinksUnique) {
        responseArray.push(video);
    }
    let response = makeResponse(200, JSON.stringify(responseArray));
    return response;
}

exports.handler = async (event) => {
    let eventBody = JSON.parse(event.body);
    let url = eventBody.url;
    return await main({
        url: url
    });
}
