function requestGET(url, callback) {
    return new Promise(function (resolve) {
        let data = {
            type: 'GET',
            url: url,
            formData: null,
        };
        data.callback = callback ? callback : resolve;
        requestOfType(data);
    });
}

function requestPOST(url, formData, callback) {
    return new Promise(function (resolve) {
        let data = {
            type: 'POST',
            url: url,
            formData: formData,
            callback: callback,
        };
        data.callback = callback ? callback : resolve;
        requestOfType(data);
    });
}

function requestPOSTJSON(url, jsonBody, callback) {
    return new Promise(function (resolve) {
        let data = {
            type: 'POST',
            url: url,
            jsonBody: jsonBody,
            callback: callback ? callback : resolve,
        };
        requestOfType(data);
    });
}

function backgroundGET(url, callback) {
    backgroundRequest('requestGET', { url: url }, function (response) { callback(response); });
}

function backgroundPOST(url, formData, callback) {
    backgroundRequest('requestPOST', { url: url, formData: formData }, function (response) { callback(response); });
}

var API = typeof browser !== 'undefined' ? browser : chrome;

function backgroundRequest(action, data, callback) {
    API.runtime.sendMessage(Object.assign({ action: action }, data)).then(function (response) { callback(response || {}); }).catch(function (e) { console.error('Background message failed:', e); callback({}); });
}

async function requestFileGET(url, callback) {
    try {
        let r = await fetch(url);
        if (!r.ok) {
            callback();
            return;
        }
        let blob = await r.blob();
        callback(blob);
    } catch (e) {
        callback();
    }
}

function requestFilePOST(url, formData, callback) {
    fetch(url, { method: 'POST', body: formData })
        .then(function (r) { return r.json(); })
        .then(function (json) { callback(json); })
        .catch(function () { callback({ error: true }); });
}

let countRequest = 0;
let pendingRequests = [];

function requestOfType(data) {
    if (countRequest > 100) {
        pendingRequests.push(data);
        return;
    }

    countRequest++;
    let fetchOptions = { method: data.type, credentials: 'include' };
    if (data.jsonBody) {
        fetchOptions.body = JSON.stringify(data.jsonBody);
        fetchOptions.headers = { 'Content-Type': 'application/json' };
    } else if (data.type === 'POST' && data.formData) {
        fetchOptions.body = data.formData;
        fetchOptions.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    }
    fetch(data.url, fetchOptions)
        .then(function (response) {
            if (response.status === 412) {
                console.error('Request error 412:', data.url);
                fireErrorSwal('Подробности выведены в консоль (Ctrl + Shift + J)', 'Произошла ошибка 412');
                return;
            }
            return response.text().then(function (text) {
                try {
                    var json = JSON.parse(text);
                    data.callback(json);
                } catch (e) {
                    console.warn('Non-JSON response for:', data.url, text.substring(0, 200));
                    data.callback({});
                }
            });
        })
        .catch(function (e) {
            console.error('Request failed:', data.url, e);
        })
        .finally(function () {
            countRequest--;
            if (pendingRequests.length > 0 && countRequest <= 100) {
                let next = pendingRequests.shift();
                requestOfType(next);
            }
        });
}

function sendQueuePOST(url, arrayFormData, callback) {
    let completeCount = 0;

    function sendNext() {
        if (completeCount >= arrayFormData.length) {
            callback();
            return;
        }
        requestPOST(url, arrayFormData[completeCount], function () {
            completeCount++;
            sendNext();
        });
    }

    sendNext();
}

function promisify(f) {
    return function (...args) {
        return new Promise(function (resolve, reject) {
            function callback(result, err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            }
            args.push(callback);
            f.apply(this, args);
        });
    };
}
