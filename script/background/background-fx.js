// Firefox-compatible background script (non-module)
// Uses browser.* API directly (polyfill maps chrome.* to browser.*)

// Import polyfill first (maps chrome.* to browser.*)
importScripts('/script/lib/browser-polyfill.min.js');

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
    }
    return true;
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