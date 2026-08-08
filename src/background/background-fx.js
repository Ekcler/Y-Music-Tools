// Firefox-compatible background script (non-module)
// Runs in an Event Page (background page), not a worker, so no importScripts.
// browser-polyfill.min.js is loaded first via manifest "background.scripts".

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const DEFAULT_OPTIONS = {
    isFirstInstall: true,
    strDateInstall: new Date().toUTCString(),
};

async function patchCurrentOptions() {
    const items = await browserAPI.storage.sync.get(null);
    const defaultKeys = Object.keys(DEFAULT_OPTIONS);
    defaultKeys.forEach((key) => {
        if (!items.hasOwnProperty(key) || typeof items[key] !== typeof DEFAULT_OPTIONS[key]) {
            items[key] = DEFAULT_OPTIONS[key];
        }
    });
    await setOptions(items);
}

async function setDefaultOptions() {
    await setOptions(DEFAULT_OPTIONS);
}

async function setOptions(json) {
    await browserAPI.storage.sync.set(json);
}

function onInstalled(details) {
    if (details.reason === 'install') {
        setDefaultOptions();
    } else if (details.reason === 'update') {
        patchCurrentOptions();
    }
}

async function onContentMessage(message, sender, sendResponse) {
    if (message.action === 'resetOptions') {
        await setDefaultOptions();
        return { success: true };
    } else if (message.action === 'requestGET') {
        const response = await requestGET(message.url);
        return response || {};
    } else if (message.action === 'requestPOST') {
        const response = await requestPOST(message.url, message.formData);
        return response || {};
    } else if (message.action === 'downloadTrack') {
        return await handleDownloadTrack(message.payload);
    } else if (message.action === 'downloadPlaylistZip') {
        return await handleDownloadPlaylistZip(message.payload, sender);
    } else if (message.action === 'downloadPlaylistCancel') {
        return handleDownloadPlaylistCancel(message.sessionId);
    }
    return true;
}

function buildID3v2Tag(tags, coverArrayBuffer) {
    const encodeUTF16 = (str) => {
        const buf = new ArrayBuffer(str.length * 2 + 2);
        const view = new Uint8Array(buf);
        view[0] = 0xFF; view[1] = 0xFE;
        const view16 = new Uint16Array(buf, 2);
        for (let i = 0; i < str.length; i++) view16[i] = str.charCodeAt(i);
        return new Uint8Array(buf);
    };

    const createFrame = (id, content) => {
        const frame = new Uint8Array(10 + content.length);
        frame.set([id.charCodeAt(0), id.charCodeAt(1), id.charCodeAt(2), id.charCodeAt(3)], 0);
        frame[4] = (content.length >> 24) & 0xFF; frame[5] = (content.length >> 16) & 0xFF;
        frame[6] = (content.length >> 8) & 0xFF;  frame[7] = content.length & 0xFF;
        frame[8] = 0; frame[9] = 0;
        frame.set(content, 10);
        return frame;
    };

    const frames = [];
    const textFrames = {
        'TIT2': tags.title,
        'TPE1': tags.artist,
        'TALB': tags.album,
        'TYER': tags.year,
        'TCON': tags.genre,
    };

    for (const [id, text] of Object.entries(textFrames)) {
        if (text) {
            const textBytes = encodeUTF16(text);
            const payload = new Uint8Array(1 + textBytes.length);
            payload[0] = 1;
            payload.set(textBytes, 1);
            frames.push(createFrame(id, payload));
        }
    }

    if (coverArrayBuffer) {
        const mime = 'image/jpeg';
        const mimeBytes = new Uint8Array(mime.length + 1);
        for (let i = 0; i < mime.length; i++) mimeBytes[i] = mime.charCodeAt(i);
        mimeBytes[mime.length] = 0;

        const desc = new Uint8Array([0xFF, 0xFE, 0x00, 0x00]);
        const payload = new Uint8Array(1 + mimeBytes.length + 1 + desc.length + coverArrayBuffer.byteLength);
        let offset = 0;
        payload[offset++] = 1;
        payload.set(mimeBytes, offset); offset += mimeBytes.length;
        payload[offset++] = 3;
        payload.set(desc, offset); offset += desc.length;
        payload.set(new Uint8Array(coverArrayBuffer), offset);

        frames.push(createFrame('APIC', payload));
    }

    const totalSize = frames.reduce((acc, f) => acc + f.length, 0);
    const header = new Uint8Array(10);
    header.set([0x49, 0x44, 0x33, 0x03, 0x00, 0x00], 0);
    header[6] = (totalSize >> 21) & 0x7F; header[7] = (totalSize >> 14) & 0x7F;
    header[8] = (totalSize >> 7) & 0x7F;  header[9] = totalSize & 0x7F;

    const id3 = new Uint8Array(10 + totalSize);
    id3.set(header, 0);
    let offset2 = 10;
    for (const f of frames) { id3.set(f, offset2); offset2 += f.length; }
    return id3.buffer;
}

async function handleDownloadTrack(payload) {
    try {
        const { directUrl, coverUrl, tags, filename } = payload;

        const mp3Res = await fetch(directUrl);
        if (!mp3Res.ok) throw new Error('Сбой при загрузке аудиофайла (' + mp3Res.status + ')');
        const mp3Buffer = await mp3Res.arrayBuffer();

        let coverBuffer = null;
        if (coverUrl) {
            try {
                const coverRes = await fetch(coverUrl);
                if (coverRes.ok) coverBuffer = await coverRes.arrayBuffer();
            } catch (e) {
                console.warn('Y-Music-Tools: cover download failed', e);
            }
        }

        const id3Buffer = buildID3v2Tag(tags, coverBuffer);
        const combined = new Uint8Array(id3Buffer.byteLength + mp3Buffer.byteLength);
        combined.set(new Uint8Array(id3Buffer), 0);
        combined.set(new Uint8Array(mp3Buffer), id3Buffer.byteLength);

        const blob = new Blob([combined], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const downloadId = await browserAPI.downloads.download({
            url: url,
            filename: filename,
            conflictAction: 'uniquify',
            saveAs: false,
        });
        setTimeout(() => URL.revokeObjectURL(url), 60000);

        return { ok: true, id: downloadId };
    } catch (err) {
        console.error('Y-Music-Tools: download failed', err);
        return { ok: false, error: String((err && err.message) || err) };
    }
}

function onTabsUpdated(tabId, changeInfo, tab) {
    if (changeInfo && changeInfo.status === 'complete') {
        browserAPI.tabs.sendMessage(tabId, { status: tab.status }).catch(() => {});
    }
}

// Request functions (from background/request.js)
let countRequest = 0;
let pendingRequests = [];

async function requestOfType(data) {
    if (countRequest > 100) {
        pendingRequests.push(data);
        return;
    }

    countRequest++;
    try {
        let options = { method: data.type, credentials: 'include' };
        if (data.type === 'POST') {
            if (data.jsonBody) {
                options.body = JSON.stringify(data.jsonBody);
                options.headers = { 'Content-Type': 'application/json' };
            } else if (data.type === 'POST' && data.formData) {
                options.body = data.formData;
                options.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            }
        }
        const response = await fetch(data.url, options);
        if (response.status === 412) {
            console.error('Request error 412:', data.url);
            return;
        }
        const text = await response.text();
        try {
            const json = JSON.parse(text);
            data.callback(json);
        } catch (e) {
            console.warn('Non-JSON response for:', data.url, text.substring(0, 200));
            data.callback({});
        }
    } catch (e) {
        console.error('Request failed:', data.url, e);
    } finally {
        countRequest--;
        if (pendingRequests.length > 0 && countRequest <= 100) {
            const next = pendingRequests.shift();
            requestOfType(next);
        }
    }
}

function requestGET(url, callback) {
    return new Promise((resolve) => {
        requestOfType({ type: 'GET', url, formData: null, callback: callback || resolve });
    });
}

function requestPOST(url, formData, callback) {
    return new Promise((resolve) => {
        requestOfType({ type: 'POST', url, formData, callback: callback || resolve });
    });
}

function requestPOSTJSON(url, jsonBody, callback) {
    return new Promise((resolve) => {
        requestOfType({ type: 'POST', url, jsonBody, callback: callback || resolve });
    });
}

// Register listeners
browserAPI.runtime.onInstalled.addListener(onInstalled);
browserAPI.runtime.onMessage.addListener(onContentMessage);
browserAPI.tabs.onUpdated.addListener(onTabsUpdated);