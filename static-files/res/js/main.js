const API_URL = 'https://ffffffffff.execute-api.eu-west-1.amazonaws.com/';

let eventAdded = false;

let content = document.querySelector('.content');

let selectFileBtn = document.getElementById('select-file-btn');

let linkForm = document.getElementById('linkForm');
let linkInput = document.getElementById('linkInput');

let resetBtn = document.getElementById('reset-btn');

let compressBox = document.getElementById('compress');
let compressName = document.getElementById('compress-name');
let compressContent = compressBox.querySelector('.step-action-content');
let cutBox = document.getElementById('extract');
let cutName = document.getElementById('extract-name');
let cutContent = cutBox.querySelector('.step-action-content');
let audioBox = document.getElementById('audio');
let audioName = document.getElementById('audio-name');
let audioContent = audioBox.querySelector('.step-action-content');
let stabilizeBox = document.getElementById('stabilize');
let stabilizeName = document.getElementById('stabilize-name');
let converttomp4Box = document.getElementById('converttomp4');
let converttomp4Name = document.getElementById('converttomp4-name');
let converttomp4Content = converttomp4Box.querySelector('.step-action-content');

let pathArray = [];


let applyChangesBtn = document.getElementById('apply-btn');

let responseBg = document.createElement('div');
responseBg.classList.add('response-bg');

let responseWindow = document.createElement('div');
responseWindow.classList.add('response-window');

let responseWindowTextBox = document.createElement('div');

let responseWindowButtonBox = document.createElement('div');
responseWindowButtonBox.classList.add('response-window-button');

responseWindow.appendChild(responseWindowTextBox);

responseBg.appendChild(responseWindow);
content.appendChild(responseBg);

//RESPONSE-WINDOWS 
let RWLoad = (obj) => {
    responseWindowTextBox.innerHTML = '';

    let header = document.createElement('div');
    header.classList.add('rw-header', 'one');

    let headerText = document.createElement('div');
    headerText.classList.add('rw-header-text');

    let headerTextMain = document.createElement('p');
    headerTextMain.classList.add('rw-header-text-main');
    headerTextMain.innerText = obj.headerMain;

    let headerTextSub = document.createElement('p');
    headerTextSub.classList.add('rw-header-text-sub');
    headerTextSub.innerText = obj.headerSub;

    let loadBar = document.createElement('div');
    loadBar.classList.add('rw-loadbar');

    headerText.appendChild(headerTextMain);
    headerText.appendChild(headerTextSub);
    header.appendChild(headerText);

    responseWindowTextBox.appendChild(header);

    responseWindowTextBox.appendChild(loadBar);

    responseBg.style.display = 'grid';
}

let RWComplete = (obj) => {
    responseWindowTextBox.innerHTML = '';

    let header = document.createElement('div');
    header.classList.add('rw-header', 'two');

    let headerText = document.createElement('div');
    headerText.classList.add('rw-header-text');

    let headerTextMain = document.createElement('p');
    headerTextMain.classList.add('rw-header-text-main');
    headerTextMain.innerText = obj.headerMain;

    let headerTextSub = document.createElement('p');
    headerTextSub.classList.add('rw-header-text-sub');
    headerTextSub.innerText = obj.headerSub;

    let headerCloseBtnDiv = document.createElement('div');
    headerCloseBtnDiv.classList.add('rw-header-close');

    headerCloseBtnDiv.innerHTML = '&times;';
    headerCloseBtnDiv.addEventListener('click', () => {
        responseWindowTextBox.innerHTML = '';
        responseBg.style.display = 'none';
    });

    headerText.appendChild(headerTextMain);
    headerText.appendChild(headerTextSub);
    header.appendChild(headerText);
    header.appendChild(headerCloseBtnDiv);

    let main = document.createElement('div');
    main.classList.add('rw-main');

    for (let item of obj.mainContent) {
        if (item.list) {
            let mainList = document.createElement('div');
            mainList.classList.add('rw-main-list');
        
            let mainListUl = document.createElement('ul');
        
            for (let prop in item.list) {
                let mainListLi = document.createElement('li');
                mainListLi.innerHTML = prop + ': ' +
                '<b>' + item.list[prop] + '</b>';
                mainListUl.appendChild(mainListLi);
            }
        
            mainList.appendChild(mainListUl);
            main.appendChild(mainList);
        } else if (item.link) {
            let mainText = document.createElement('div');
            mainText.classList.add('rw-main-text');
    
            let mainTextA = document.createElement('a');
            mainTextA.setAttribute('target', '_blank');
            mainTextA.setAttribute('href', item.link.url);
            mainTextA.innerText = item.link.text;
    
            mainText.appendChild(mainTextA);
            main.appendChild(mainText);
        } else if (item.textHtml) {
            let mainText = document.createElement('div');
            mainText.classList.add('rw-main-text');
    
            let mainTextP = document.createElement('p');
            mainTextP.innerHTML = item.textHtml.content;
    
            mainText.appendChild(mainTextP);
            main.appendChild(mainText);
        } else if (item.html) {
            let mainHtml = document.createElement('div');
            mainHtml.classList.add('rw-main-html');
            mainHtml.innerHTML = item.html.content;

            main.appendChild(mainHtml);
        }
    }

    if (obj.buttonContent) {
        let mainBtns = document.createElement('div');
        mainBtns.classList.add('rw-main-btns');
    
        let mainBtnsPKBtn = document.createElement('a');
        mainBtnsPKBtn.setAttribute('href', obj.buttonContent.url);
        mainBtnsPKBtn.innerText = obj.buttonContent.text;
    
        mainBtns.appendChild(mainBtnsPKBtn);
    
        main.appendChild(mainBtns);
    }

    responseWindowTextBox.appendChild(header);

    responseWindowTextBox.appendChild(main);

    responseBg.style.display = 'grid';
}

let extractVideo = async (url) => {
    let response;
    await fetch(API_URL + 'extractvideo', {
        method: 'POST',
        body: JSON.stringify({
            url: url
        })
    }).then(async(res) => {
        if (res.ok) {
            await res.json().then((data) => {
                response = data;
            })
        }
    }).catch((err) => {
        console.log(err);
        selectFileBtn.innerText = 'Select videos';
    });
    return response;
}

linkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    selectFileBtn.innerText = 'Uploading...';
    linkInput.blur();
    let link = linkInput.value;
    pathArray = await extractVideo(link);
    if (pathArray.length > 0) {
        changeBtns();

        for (let path of pathArray) {
            let pathSplit = path.split('/');
            let filename = pathSplit[pathSplit.length - 1];
            let p = document.createElement('p');
            p.innerText = filename + ' selected';
            let previewBtn = document.createElement('a');
            previewBtn.target = '_blank';
            previewBtn.id = 'previewBtn';
            let src = btoa(path);
            previewBtn.href = 'http://video.rs1.es/?src=' + src;
            previewBtn.innerText = '(Preview)';
            p.appendChild(previewBtn);
            document.querySelector('.filename').appendChild(p);
        }

        console.log(pathArray);
    } else {
        console.log(pathArray);
        RWComplete({
            headerMain: 'ERROR',
            headerSub: 'There is an error with the request',
            mainContent: [
                {
                    textHtml: {
                        content: 'We cannot find any videos'
                    }
                }
            ]
        });
        selectFileBtn.innerText = 'Select videos';
    }
    
});

let previewVideo = (path) => {
    let video = document.createElement('video');
    video.classList.add('video-js');
    video.id = 'preview-video';
    video.setAttribute('controls', true);
    video.setAttribute('autoplay', true);
    let box = document.createElement('div');
    box.appendChild(video);

    RWComplete({
        headerMain: 'Video Preview',
        headerSub: 'You can check selected video is the right one.',
        mainContent: [{
            html: {
                content: box.innerHTML
            }
        }]
    })
    let myVideo = videojs(document.querySelector('.video-js'));
    myVideo.src({
        src: path
    });
    myVideo.aspectRatio('16:9');
}

let uploadFiles = async (params) => {
    let paths = [];
    for (let file of params.inputData.files) {
        await fetch(API_URL + 'uploadfile', {
            method: 'POST',
            body: JSON.stringify({
                filename: file.name,
                filetype: file.type,
                filesize: file.size
            })
        }).then(async (res) => {
            if (res.ok) {
                await res.json().then(async (data) => {
                    let form = new FormData();
                    Object.keys(data.fields).forEach(key => {
                        form.append(key, data.fields[key]);
                    });
                    form.append('file', file);
                    await fetch(data.url, {
                        method: 'POST',
                        body: form
                    }).then((resUpload) => {
                        if(resUpload.ok) {
                            paths.push(data.fields.key);
                            let p = document.createElement('p');
                            p.innerText = file.name + ' selected';
                            let previewBtn = document.createElement('a');
                            previewBtn.target = '_blank';
                            let src = btoa('https://videoeditor.rs1.es/' + data.fields.key);
                            previewBtn.href = 'http://video.rs1.es/?src=' + src;
                            previewBtn.id = 'previewBtn';
                            previewBtn.innerText = '(Preview)';
                            p.appendChild(previewBtn);
                            document.querySelector('.filename').appendChild(p);
                            
                        }
                    })
                })
            } else {
                res.json().then((err) => {
                    RWComplete({
                        headerMain: 'ERROR',
                        headerSub: 'There is an error with the request',
                        mainContent: [
                            {
                                list: err
                            }
                        ]
                    });
                    selectFileBtn.innerText = 'Select video';
                })
            }
        });
    }
    

    return paths;
}

let changeBtns = () => {
    selectFileBtn.innerText = 'Video uploaded';
    selectFileBtn.classList.remove('enabled');
    selectFileBtn.classList.add('disabled');
    selectFileBtn.setAttribute('disabled', true);
    linkInput.setAttribute('disabled', true);
    resetBtn.classList.remove('disabled');
    resetBtn.classList.add('enabled');
    resetBtn.removeAttribute('disabled');

    applyChangesBtn.removeAttribute('disabled');
    applyChangesBtn.classList.remove('disabled');
    applyChangesBtn.classList.add('enabled');
}


let selectInput = document.createElement('input');
selectInput.setAttribute('type', 'file');
selectInput.setAttribute('accept', 'video/*');
selectInput.setAttribute('multiple', 'true');

selectFileBtn.addEventListener('click', () => {
    selectInput.click();
    if (!eventAdded) {
        eventAdded = true;
        selectInput.addEventListener('change', async () => {
            selectFileBtn.innerText = 'Uploading...';
            pathArray = await uploadFiles({
                inputData: selectInput
            });
            if (pathArray.length > 0) {
                changeBtns();   
            }

            console.log(pathArray);
        })
    }
});

let dropFileBox = document.getElementById('dropFileHere');
dropFileBox.addEventListener('drop', async (e) => {
    e.preventDefault();
    console.log('File dropped');
    //console.log(e.dataTransfer);
    selectFileBtn.innerText = 'Uploading...';
    pathArray = await uploadFiles({
        inputData: e.dataTransfer
    });
    if (pathArray.length > 0) {
        changeBtns();   
    }

    console.log(pathArray);
});

dropFileBox.addEventListener('dragover', (e) => {
    e.preventDefault();
});



resetBtn.addEventListener('click', () => {
    selectFileBtn.innerText = 'Select videos';
    selectFileBtn.classList.remove('disabled');
    selectFileBtn.classList.add('enabled');
    selectFileBtn.removeAttribute('disabled');
    linkInput.removeAttribute('disabled');
    linkInput.value = '';
    resetBtn.classList.remove('enabled');
    resetBtn.classList.add('disabled');
    resetBtn.setAttribute('disabled', true);
    applyChangesBtn.setAttribute('disabled', true);

    applyChangesBtn.setAttribute('disabled', true);
    applyChangesBtn.classList.remove('enabled');
    applyChangesBtn.classList.add('disabled');

    document.querySelector('.filename').innerHTML = '';

    pathArray = [];
})

compressName.addEventListener('click', () => {
    if (compressBox.classList.contains('action-disabled')) {
        compressBox.classList.remove('action-disabled');
        compressBox.classList.add('action-enabled');
        compressContent.classList.remove('action-content-disabled');
        compressContent.classList.add('action-content-enabled');

        audioBox.classList.remove('action-enabled');
        audioBox.classList.add('action-disabled');
        audioContent.classList.remove('action-content-enabled');
        audioContent.classList.add('action-content-disabled');
        stabilizeBox.classList.remove('action-enabled');
        stabilizeBox.classList.add('action-disabled');



    } else {
        compressBox.classList.remove('action-enabled');
        compressBox.classList.add('action-disabled');
        compressContent.classList.remove('action-content-enabled')
        compressContent.classList.add('action-content-disabled');
    }
});


cutName.addEventListener('click', () => {
    if (cutBox.classList.contains('action-disabled')) {
        cutBox.classList.remove('action-disabled');
        cutBox.classList.add('action-enabled');
        cutContent.classList.remove('action-content-disabled');
        cutContent.classList.add('action-content-enabled');
        stabilizeBox.classList.remove('action-enabled');
        stabilizeBox.classList.add('action-disabled');


    } else {
        cutBox.classList.remove('action-enabled');
        cutBox.classList.add('action-disabled');
        cutContent.classList.remove('action-content-enabled');
        cutContent.classList.add('action-content-disabled');
    }
});

audioName.addEventListener('click', () => {
    if (audioBox.classList.contains('action-disabled')) {
        audioBox.classList.remove('action-disabled');
        audioBox.classList.add('action-enabled');
        audioContent.classList.remove('action-content-disabled');
        audioContent.classList.add('action-content-enabled');

        compressBox.classList.remove('action-enabled');
        compressBox.classList.add('action-disabled');
        compressContent.classList.remove('action-content-enabled');
        compressContent.classList.add('action-content-disabled');

        stabilizeBox.classList.remove('action-enabled');
        stabilizeBox.classList.add('action-disabled');

        converttomp4Box.classList.remove('action-enabled');
        converttomp4Box.classList.add('action-disabled');
        converttomp4Content.classList.remove('action-content-enabled');
        converttomp4Content.classList.add('action-content-disabled');

    } else {
        audioBox.classList.remove('action-enabled');
        audioBox.classList.add('action-disabled');
        audioContent.classList.remove('action-content-enabled');
        audioContent.classList.add('action-content-disabled');
    }
});

converttomp4Name.addEventListener('click', () => {
    if (converttomp4Box.classList.contains('action-disabled')) {
        converttomp4Box.classList.remove('action-disabled');
        converttomp4Box.classList.add('action-enabled');
        converttomp4Content.classList.remove('action-content-disabled');
        converttomp4Content.classList.add('action-content-enabled');

        audioBox.classList.remove('action-enabled');
        audioBox.classList.add('action-disabled');
        audioContent.classList.remove('action-content-enabled');
        audioContent.classList.add('action-content-disabled');


    } else {
        converttomp4Box.classList.remove('action-enabled');
        converttomp4Box.classList.add('action-disabled');
        converttomp4Content.classList.remove('action-content-enabled');
        converttomp4Content.classList.add('action-content-disabled');
    }
});

stabilizeName.addEventListener('click', () => {
    if (stabilizeBox.classList.contains('action-disabled')) {
        stabilizeBox.classList.remove('action-disabled');
        stabilizeBox.classList.add('action-enabled');

        compressBox.classList.remove('action-enabled');
        compressBox.classList.add('action-disabled');
        compressContent.classList.remove('action-content-enabled');
        compressContent.classList.add('action-content-disabled');

        audioBox.classList.remove('action-enabled');
        audioBox.classList.add('action-disabled');
        audioContent.classList.remove('action-content-enabled');
        audioContent.classList.add('action-content-disabled');

    } else {
        stabilizeBox.classList.remove('action-enabled');
        stabilizeBox.classList.add('action-disabled');
    }
});

let applyChanges = async (pathArray) => {
    AWS.config.region = 'eu-west-1';
    AWS.config.credentials = new AWS.Credentials({
        accessKeyId: '',
        secretAccessKey: ''
    });
    AWS.config.update({
        maxRetries: 0,
        httpOptions: {
            timeout: 600000,
            connectTimeout: 5000
        }
    });
    let lambda = new AWS.Lambda();
    let transformsArray = [];

    if (compressBox.classList.contains('action-enabled')) {
        let bitrate = document.getElementById('quality-input').value;
        transformsArray.push({
            name: 'quality',
            value: parseInt(bitrate, 10)
        });
    }

    if (cutBox.classList.contains('action-enabled')) {
        let startTime = document.getElementById('start-input').value;
        let endTime = document.getElementById('end-input').value;
        transformsArray.push({
            name: 'cut',
            value: {
                start: startTime,
                end: endTime
            }
        });
    }

    if (audioBox.classList.contains('action-enabled')) {
        let audioBitrate = document.getElementById('quality-audio-input').value;
        transformsArray.push({
            name: 'audio',
            value: parseInt(audioBitrate, 10)
        });
    }

    if (stabilizeBox.classList.contains('action-enabled')) {
        transformsArray.push({
            name: 'stabilize'
        });
    }

    if (converttomp4Box.classList.contains('action-enabled')) {
        transformsArray.push({
            name: 'converttomp4'
        });
    }
    
    let newPaths = [];
    for (let path of pathArray) {
        await lambda.invoke({
            FunctionName: 'video-editor-prod-applychanges',
            Payload: JSON.stringify({
                body: JSON.stringify({
                    key: path,
                    transformations: transformsArray
                })
            })
        })
        .promise()
        .then((response) => {
            let payload = JSON.parse(response.Payload);
            let payloadBody = JSON.parse(payload.body);
            let newpath = payloadBody.newkey;
            newPaths.push(newpath);
        }).catch((err) => {
            RWComplete({
                headerMain: 'ERROR',
                headerSub: 'There is an error with the request',
                mainContent: [
                    {
                        list: err
                    }
                ]
            });
        });
    }
    let RWParams = {
        headerMain: 'Processing completed',
        headerSub: 'Links to the processed videos:',
        mainContent: []
    }
    if (newPaths.length == 0) {
        RWComplete({
            headerMain: 'ERROR',
            headerSub: 'There is an error with the request',
            mainContent: []
        });
    } else {
        for (let newPath of newPaths) {
            RWParams.mainContent.push({
                link: {
                    url: 'https://videoeditor.rs1.es/' + encodeURI(newPath),
                    text: 'https://videoeditor.rs1.es/' + newPath
                }
            })
        }
        RWComplete(RWParams);
    }
    
    
}

applyChangesBtn.addEventListener('click', async () => {
    RWLoad({
        headerMain: 'Processing the file, please wait...',
        headerSub: ''
    })
    
    await applyChanges(pathArray);   
});
