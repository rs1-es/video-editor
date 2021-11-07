const AWS = require('aws-sdk');
const BUCKETNAME = '';

exports.handler = async (event) => {
    function makeResponse(statusCode, body) {
        const response = {
            statusCode: statusCode,
            isBase64Encoded: false,
            headers: {
                'Access-Control-Allow-Origin':'*'
            },
            body: body
        };
        return response;
    }
    
    return new Promise((resolve, reject) => {
        let event_body = JSON.parse(event.body);

        let bucket = BUCKETNAME;
        let folder = parseInt(Math.random() * 100000, 10);
        let key = 'files/input/' + folder.toString()  + '/' + event_body.filename;
        let type = event_body.filetype;
        let size = parseInt(event_body.filesize, 10);
        let params_presign = '';
          
        let s3 = new AWS.S3();
        
        let maxsize = 1024 * 1024 * 1024;  //1GB
        
        if(size > maxsize) {
            let body = {
                message: 'File is too big'
            };
            let response = makeResponse(501, JSON.stringify(body));
            console.log(response);
            resolve(response);
        }
        
        if(type.indexOf('video') == -1){
            let response = makeResponse(502, JSON.stringify({message: 'File is not a video'}));
            console.log(response);
            resolve(response);
        } else {
            params_presign = {
                Bucket: bucket,
                Fields: {
                    key: key,
                    'content-type': type
                }
            };
        } 
        s3.createPresignedPost(params_presign, (err_cpp, data_cpp) => {
            if (err_cpp) {
                let response = makeResponse(503, JSON.stringify(err_cpp));
                console.log(response);
                resolve(response);
            } else {
                let response = makeResponse(200, JSON.stringify(data_cpp));
                resolve(response);
                  
            }
        });  
        
    });
};
