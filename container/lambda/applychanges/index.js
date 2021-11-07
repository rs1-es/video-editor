const AWS = require('aws-sdk');
let fs = require('fs');
let s3 = new AWS.S3();
let randomNumber = Math.floor((Math.random() * 1000));
const BUCKETNAME = '';

function makeResponse(statusCode, body) {
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

let searchQuality = (item) => {
    return item.name == 'quality';
}

let searchCut = (item) => {
    return item.name == 'cut';
}

let searchAudio = (item) => {
    return item.name == 'audio';
}

let searchStabilize = (item) => {
    return item.name == 'stabilize';
}

let searchConverttomp4 = (item) => {
    return item.name == 'converttomp4';
}

let getFile = async (key) => {
    let response;

    await s3.getObject({
        Key: key,
        Bucket: BUCKETNAME
    }).promise()
        .then((data) => {
            response = data;
        }).catch((error) => {
            console.log(error);
        })

    return response;
}

let downloadToTemp = async (inputPath, fileContent) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(inputPath, fileContent.Body, (fserr) => {
            if (fserr) {
                console.log(fserr);
                reject(fserr)
            } else {
                resolve();
            }
        })
    });
}

let downloadYoutube = async (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        let exec = require('child_process').exec, child;

        let command = 'youtube-dl -f "bestvideo[height<=1080,ext=webm]+bestaudio[ext=webm]" ' + inputPath + ' -o ' + outputPath;

        console.log(command);
        child = exec(command, {
            maxBuffer: 3 * 1024 * 1024 * 1024,
            encoding: 'buffer'
        }, (err, stdout, stderr) => {
            if (err != null) {
                console.log(err);
                console.log(stderr);
                let response = makeResponse(502, JSON.stringify({ message: 'Error with exec' }));
                reject(response);
            } else {
                //console.log(stderr);
                resolve();
            }
        })

    })
}

let stabilizeVideo1 = async (inputPath) => {
    return new Promise((resolve, reject) => {
        let spawn = require('child_process').spawn;

        let cmd = 'sh';

        let args = [
            '-c',
            'cd /tmp/ && ffmpeg -i "' + inputPath + '" -protocol_whitelist file,http,https,tcp,tls -vf vidstabdetect -f null -'
        ];

        let proc = spawn(cmd, args);

        let errorResponse = '';

        proc.stderr.setEncoding('utf8');
        proc.stderr.on('data', (data) => {
            errorResponse += data;
        });

        proc.stdout.on('data', (data) => {
            //console.log(data);
        });

        proc.on('close', (code) => {
            if (code != 0) {
                reject(errorResponse);
            }
            resolve();
        });
    })
}

let stabilizeVideo2 = async (inputPath) => {
    return new Promise((resolve, reject) => {
        let exec = require('child_process').exec, child;

        let command = 'cd /tmp/ && ffmpeg -y -i "' + inputPath + '"';

        command += ' -protocol_whitelist file,http,https,tcp,tls,pipe';
        command += ' -vf vidstabtransform=smoothing=5:input="transforms.trf" -f webm -c:v libvpx';
        command += ' -deadline realtime -cpu-used 0 -b:v 3000000 -c:a libvorbis -crf 20';
        command += ' pipe:1';
        console.log(command);
        child = exec(command, {
            maxBuffer: 3 * 1024 * 1024 * 1024,
            encoding: 'buffer'
        }, (err, stdout, stderr) => {
            if (err != null) {
                console.log(err);
                console.log(stderr);
                let response = makeResponse(502, JSON.stringify({ message: 'Error with exec' }));
                reject(response);
            } else {
                //console.log(stderr);
                resolve(stdout);
            }
        })

    })
}

let stabilizeVideo2mp4 = async (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        let exec = require('child_process').exec, child;

        let command = 'cd /tmp/ && ffmpeg -y -i "' + inputPath + '"';

        command += ' -protocol_whitelist file,http,https,tcp,tls,pipe';
        command += ' -vf vidstabtransform=smoothing=5:input="transforms.trf" -c:v libx264';
        command += ' -preset veryfast -crf 20';
        command += ' ' + outputPath;
        console.log(command);
        child = exec(command, {
            maxBuffer: 3 * 1024 * 1024 * 1024,
            encoding: 'buffer'
        }, (err, stdout, stderr) => {
            if (err != null) {
                console.log(err);
                console.log(stderr);
                let response = makeResponse(502, JSON.stringify({ message: 'Error with exec' }));
                reject(response);
            } else {
                //console.log(stderr);
                resolve();
            }
        })

    })
}


let applyChanges = async (inputPath, outputPath, transformations) => {
    return new Promise((resolve, reject) => {
        let spawn = require('child_process').spawn;

        let cmd = 'ffmpeg';

        let args = [
            '-y',
            '-i', inputPath,
            '-protocol_whitelist', 'file,http,https,tcp,tls',
            '-c:v', 'libx264',
            '-preset', 'veryfast',
        ];



        let min = 5;
        let max = 50;
        let def = 23;

        if (transformations.find(searchQuality) != undefined) {
            let qualityParams = transformations.find(searchQuality);
            let crfValue = parseInt(max - ((qualityParams.value) / 10 * (max - min)));
            args.push('-crf');
            args.push(crfValue);
        } else {
            args.push('-crf');
            args.push(def);
        }
        if (transformations.find(searchCut) != undefined) {
            let cutParams = transformations.find(searchCut);
            if (cutParams.value.start != '') {
                args.push('-ss');
                args.push(cutParams.value.start);
            }
            if (cutParams.value.end != '') {
                args.push('-to');
                args.push(cutParams.value.end);
            }
        }

        args.push(outputPath);

        console.log(cmd, args);

        let proc = spawn(cmd, args);

        let errorResponse = '';

        proc.stderr.setEncoding('utf8');
        proc.stderr.on('data', (data) => {
            errorResponse += data;
        });

        proc.stdout.on('data', (data) => {
            //console.log(data);
        });

        proc.on('close', (code) => {
            if (code != 0) {
                reject(errorResponse);
            }
            resolve();
        });
    })

}

let applyChangesStream = async (inputPath, transformations) => {
    return new Promise((resolve, reject) => {
        let exec = require('child_process').exec, child;

        let command = 'ffmpeg -y -i "' + inputPath + '"';

        command += ' -protocol_whitelist file,http,https,tcp,tls,pipe';
        command += ' -f webm -c:v libvpx -deadline realtime -cpu-used 0 -b:v 3000000 -c:a libvorbis';
        let min = 5;
        let max = 50;
        let def = 23;
        if (transformations.find(searchQuality) != undefined) {
            let qualityParams = transformations.find(searchQuality);
            let crfValue = parseInt(max - ((qualityParams.value) / 10 * (max - min)));
            command += ' -crf ' + crfValue;
        } else {
            command += ' -crf ' + def;
        }
        if (transformations.find(searchCut) != undefined) {
            let cutParams = transformations.find(searchCut);
            if (cutParams.value.start != '') {
                command += ' -ss ' + cutParams.value.start;
            }
            if (cutParams.value.end != '') {
                command += ' -to ' + cutParams.value.end;
            }
        }

        if (transformations.find(searchAudio) != undefined) {
            let qualityParams = transformations.find(searchAudio);
            command = 'sh -c ffmpeg -y -i "' + inputPath + '"';

            command += ' -protocol_whitelist file,http,https,tcp,tls,pipe' +
                ' -f mp3 -b:a ' + qualityParams.value * 1000;

        }

        command += ' pipe:1';
        console.log(command);
        child = exec(command, {
            maxBuffer: 3 * 1024 * 1024 * 1024,
            encoding: 'buffer'
        }, (err, stdout, stderr) => {
            if (err != null) {
                console.log(err);
                console.log(stderr);
                let response = makeResponse(502, JSON.stringify({ message: 'Error with exec' }));
                reject(response);
            } else {
                //console.log(stderr);
                resolve(stdout);
            }
        })

    })

}

let uploadFile = async (filename, outputPath, contentType) => {
    let response;
    let folder = parseInt(Math.random() * 100000, 10);
    let newkey = 'files/output/' + folder.toString() + '/' + filename;
    await s3.putObject({
        Bucket: BUCKETNAME,
        Key: newkey,
        Body: fs.createReadStream(outputPath),
        ContentType: contentType
    }).promise()
        .then((data) => {
            response = makeResponse(200, JSON.stringify({
                newkey: newkey
            }))
        })
        .catch((err) => {
            response = makeResponse(500, JSON.stringify({
                message: 'Error with s3'
            }))
        })
    return response;
}

let uploadFileStream = async (filename, stream, contentType) => {
    let response;
    let folder = parseInt(Math.random() * 100000, 10);
    let newkey = 'files/output/' + folder.toString() + '/' + filename;
    await s3.putObject({
        Bucket: BUCKETNAME,
        Key: newkey,
        Body: stream,
        ContentType: contentType
    }).promise()
        .then((data) => {
            response = makeResponse(200, JSON.stringify({
                newkey: newkey
            }))
        })
        .catch((err) => {
            response = makeResponse(500, JSON.stringify({
                message: 'Error with s3'
            }))
        })
    return response;
}

let removeLocalFiles = async (outputPath) => {
    return new Promise((resolve, reject) => {
        let exec = require('child_process').exec, child;
        let command = 'rm "' + outputPath + '"';
        child = exec(command, (err, stdout, stderr) => {
            if (err != null) {
                console.log(err);
                console.log(stderr);
                let response = makeResponse(502, JSON.stringify({ message: 'Error with exec' }));
                reject(response);
            } else {
                //console.log(stdout);
                resolve();
            }
        })
    })
}

let main = async (key, transformations) => {
    let response;
    let key_split = key.split('/');
    let filename = key_split[key_split.length - 1];
    let filename_split = filename.split('.');
    let filename_wo_suffix = filename_split[0];
    let suffix = filename_split[filename_split.length - 1];
    let inputPath;
    let linkExpression = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi;
    let linksRegex = new RegExp(linkExpression);
    if (linksRegex.test(key)) {
        inputPath = encodeURI(key);
    } else {
        let signedURL = s3.getSignedUrl('getObject', {
            Bucket: BUCKETNAME,
            Key: key,
            Expires: 120
        })
        inputPath = signedURL;
    }
    let youtubeExpression = /(youtube.com\/watch)|(youtu.be)/;
    let youtubeRegex = new RegExp(youtubeExpression);
    let m3u8Expression = /(.m3u8)/;
    let m3u8Regex = new RegExp(m3u8Expression);

    if (youtubeRegex.test(key)) {
        let outputYT = '/tmp/temp' + randomNumber + '.webm';
        await downloadYoutube(inputPath, outputYT);

        console.log('Procesado');
        if (transformations.find(searchAudio) != undefined) {
            let streamBody = await applyChangesStream(outputYT, transformations);
            response = await uploadFileStream('audio' + '.mp3', streamBody, 'audio/mpeg');
        } else if (transformations.find(searchStabilize) != undefined) {
            await stabilizeVideo1(outputYT);
            if (transformations.find(searchConverttomp4) != undefined) {
                let outputPath = '/tmp/' + 'video' + '.mp4';
                await stabilizeVideo2mp4(outputYT, outputPath);
                console.log('Procesado');
                response = await uploadFile('video' + '.mp4', outputPath, 'video/mp4');
                console.log('Subido');
                await removeLocalFiles(outputPath);
                return response;
            }
            let streamBody = await stabilizeVideo2(inputPath);
            console.log('Procesado');
            response = await uploadFileStream('video' + '.webm', streamBody, 'video/webm');
            console.log('Subido');
            await removeLocalFiles('/tmp/transforms.trf');
            return response;
        } else if (transformations.find(searchConverttomp4) != undefined) {
            let outputPath = '/tmp/video.mp4'
            await applyChanges(outputYT, outputPath, transformations);
            console.log('Procesado');
            response = await uploadFile('video' + '.mp4', outputPath, 'video/mp4');
            console.log('Subido');
            await removeLocalFiles(outputYT);
            await removeLocalFiles(outputPath);
            return response;
        }
        let streamBody = await applyChangesStream(outputYT, transformations);
        await removeLocalFiles(outputYT);
        response = await uploadFileStream('video' + '.webm', streamBody, 'video/webm');
        console.log('Subido');
        return response;
    }

    if (transformations.find(searchStabilize) != undefined) {
        await stabilizeVideo1(inputPath);
        if (transformations.find(searchConverttomp4) != undefined) {
            let outputPath = '/tmp/' + filename_wo_suffix + '.mp4';
            await stabilizeVideo2mp4(inputPath, outputPath);
            console.log('Procesado');
            response = await uploadFile(filename_wo_suffix + '.mp4', outputPath, 'video/mp4');
            console.log('Subido');
            await removeLocalFiles(outputPath);
            return response;
        }
        let streamBody = await stabilizeVideo2(inputPath);
        console.log('Procesado');
        response = await uploadFileStream(filename_wo_suffix + '.webm', streamBody, 'video/webm');
        console.log('Subido');
        await removeLocalFiles('/tmp/transforms.trf');
        return response;
    }

    if (transformations.find(searchAudio) != undefined) {
        let streamBody = await applyChangesStream(inputPath, transformations);
        console.log('Procesado');
        response = await uploadFileStream(filename_wo_suffix + '.mp3', streamBody, 'audio/mpeg');
        console.log('Subido');
    } else if (transformations.find(searchConverttomp4) != undefined) {
        let outputPath = '/tmp/video.mp4'
        await applyChanges(inputPath, outputPath, transformations);
        console.log('Procesado');
        response = await uploadFile(filename_wo_suffix + '.mp4', outputPath, 'video/mp4');
        console.log('Subido');
        await removeLocalFiles(outputPath);
    } else {
        let streamBody = await applyChangesStream(inputPath, transformations);
        console.log('Procesado');
        response = await uploadFileStream(filename_wo_suffix + '.webm', streamBody, 'video/webm');
        console.log('Subido');
    }

    return response;
}

exports.handler = async (event) => {
    let event_body = JSON.parse(event.body);
    let key = event_body.key;
    let transformations = event_body.transformations;
    return await main(key, transformations);
};
