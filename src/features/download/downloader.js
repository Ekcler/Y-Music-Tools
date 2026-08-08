var DOWNLOAD_STYLE_ID = 'ymt-dl-style';

function ensureDownloadStyle() {
    if (document.getElementById(DOWNLOAD_STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = DOWNLOAD_STYLE_ID;
    s.textContent = [
        '.ymt-dl-search { width: 100%; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.15); border-radius: 14px; background: rgba(255,255,255,0.06); color: #fff; font-size: 14px; outline: none; box-sizing: border-box; margin-bottom: 10px; }',
        '.ymt-dl-search:focus { border-color: rgba(255,255,255,0.3); }',
        '.ymt-dl-search::placeholder { color: rgba(255,255,255,0.4); }',
        '.ymt-dl-track { display: flex; align-items: center; padding: 6px 8px; border-radius: 12px; transition: background 0.15s; gap: 10px; border: 1px solid transparent; min-width: 0; }',
        '.ymt-dl-track:hover { background: rgba(255,255,255,0.08); }',
        '.ymt-dl-track-cover { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: rgba(255,255,255,0.08); }',
        '.ymt-dl-track-info { overflow: hidden; flex: 1; min-width: 0; }',
        '.ymt-dl-track-title { font-size: 14px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
        '.ymt-dl-track-artist { font-size: 12px; color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
        '.ymt-dl-download { width: 32px; height: 32px; min-width: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: rgba(255,255,255,0.6); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px; transition: all 0.15s; }',
        '.ymt-dl-download:hover { background: rgba(255,255,0,0.2); border-color: #ffff00; color: #ffff00; }',
        '.ymt-dl-download.done { background: #ffff00; border-color: #ffff00; color: #000; }',
        '.ymt-dl-download.error { background: rgba(255,80,80,0.2); border-color: #ff5252; color: #ff5252; }',
        '.ymt-dl-list { max-height: 340px; overflow-y: auto; }',
        '.ymt-dl-list::-webkit-scrollbar { width: 4px; }',
        '.ymt-dl-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }',
        '.ymt-dl-empty { padding: 20px; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px; }',
        '.ymt-dl-zip-bar { height: 10px; border-radius: 5px; background: rgba(255,255,255,0.12); overflow: hidden; margin-bottom: 10px; }',
        '.ymt-dl-zip-fill { height: 100%; width: 0; border-radius: 5px; background: linear-gradient(90deg, #ffdd00, #ffff00); transition: width 0.25s ease; }',
        '.ymt-dl-zip-meta { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: #fff; }',
        '.ymt-dl-zip-err { color: #ff8a80; }',
        '.ymt-dl-zip-current { font-size: 13px; color: rgba(255,255,255,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }',
        '.ymt-dl-zip-spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid rgba(255,255,0,0.3); border-top-color: #ffff00; border-radius: 50%; animation: ymt-dl-spin 0.8s linear infinite; flex-shrink: 0; }',
        '@keyframes ymt-dl-spin { to { transform: rotate(360deg); } }',
        '.ymt-dl-zip-errors { font-size: 12px; color: #ff8a80; max-height: 90px; overflow-y: auto; }',
        '.ymt-dl-zip-errline { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 1px 0; }',
        '.ymt-dl-summary-err-title { margin-top: 8px; color: #ff8a80; font-size: 13px; text-align: left; }',
        '.ymt-dl-summary-err-list { text-align: left; max-height: 150px; overflow-y: auto; margin-top: 4px; font-size: 12px; color: #ff8a80; }',
        '.ymt-dl-summary-err { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 1px 0; }',
    ].join('\n');
    document.head.appendChild(s);
}

var DOWNLOAD_STATE = {
    searchResults: [],
    searchTimeout: null,
    lastQuery: '',
};

var DL_PLAYER_SELECTORS = [
    '[class*="VibePlayerBar_root"]',
    '[class*="PlayerBarDesktopWithBackgroundProgressBar"]',
    '[class*="PlayerBarDesktop"]',
    '[class*="PlayerBar"]',
];

var DOWNLOAD_CURRENT_MENU_ITEM = {
    title: '\u0421\u043a\u0430\u0447\u0430\u0442\u044c \u0442\u0435\u043a\u0443\u0449\u0438\u0439 \u0442\u0440\u0435\u043a',
    handler: onClickDownloadCurrent,
};

var DOWNLOAD_PLAYLIST_MENU_ITEM = {
    title: '\u0421\u043a\u0430\u0447\u0430\u0442\u044c \u0432\u0435\u0441\u044c \u043f\u043b\u0435\u0439\u043b\u0438\u0441\u0442',
    handler: onClickDownloadPlaylist,
};

var DOWNLOAD_SEARCH_MENU_ITEM = {
    title: '\u041d\u0430\u0439\u0442\u0438 \u0438 \u0441\u043a\u0430\u0447\u0430\u0442\u044c \u0442\u0440\u0435\u043a',
    handler: onClickDownloadSearch,
};

function md5(str) {
    function safeAdd(x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }
    function bitRotateLeft(num, cnt) { return (num << cnt) | (num >>> (32 - cnt)); }
    function cmn(q, a, b, x, s, t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }

    var utf = unescape(encodeURIComponent(str));
    var M = [];
    for (var i = 0; i < utf.length; i++) M[i >> 2] |= utf.charCodeAt(i) << ((i % 4) * 8);
    M[utf.length >> 2] |= 0x80 << ((utf.length % 4) * 8);
    M[(((utf.length + 8) >> 6) << 4) + 14] = utf.length * 8;

    var a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
    for (var j = 0; j < M.length; j += 16) {
        var oa = a, ob = b, oc = c, od = d;
        a = ff(a, b, c, d, M[j + 0], 7, -680876936); d = ff(d, a, b, c, M[j + 1], 12, -389564586); c = ff(c, d, a, b, M[j + 2], 17, 606105819); b = ff(b, c, d, a, M[j + 3], 22, -1044525330);
        a = ff(a, b, c, d, M[j + 4], 7, -176418897); d = ff(d, a, b, c, M[j + 5], 12, 1200080426); c = ff(c, d, a, b, M[j + 6], 17, -1473231341); b = ff(b, c, d, a, M[j + 7], 22, -45705983);
        a = ff(a, b, c, d, M[j + 8], 7, 1770035416); d = ff(d, a, b, c, M[j + 9], 12, -1958414417); c = ff(c, d, a, b, M[j + 10], 17, -42063); b = ff(b, c, d, a, M[j + 11], 22, -1990404162);
        a = ff(a, b, c, d, M[j + 12], 7, 1804603682); d = ff(d, a, b, c, M[j + 13], 12, -40341101); c = ff(c, d, a, b, M[j + 14], 17, -1502002290); b = ff(b, c, d, a, M[j + 15], 22, 1236535329);
        a = gg(a, b, c, d, M[j + 1], 5, -165796510); d = gg(d, a, b, c, M[j + 6], 9, -1069501632); c = gg(c, d, a, b, M[j + 11], 14, 643717713); b = gg(b, c, d, a, M[j + 0], 20, -373897302);
        a = gg(a, b, c, d, M[j + 5], 5, -701558691); d = gg(d, a, b, c, M[j + 10], 9, 38016083); c = gg(c, d, a, b, M[j + 15], 14, -660478335); b = gg(b, c, d, a, M[j + 4], 20, -405537848);
        a = gg(a, b, c, d, M[j + 9], 5, 568446438); d = gg(d, a, b, c, M[j + 14], 9, -1019803690); c = gg(c, d, a, b, M[j + 3], 14, -187363961); b = gg(b, c, d, a, M[j + 8], 20, 1163531501);
        a = gg(a, b, c, d, M[j + 13], 5, -1444681467); d = gg(d, a, b, c, M[j + 2], 9, -51403784); c = gg(c, d, a, b, M[j + 7], 14, 1735328473); b = gg(b, c, d, a, M[j + 12], 20, -1926607734);
        a = hh(a, b, c, d, M[j + 5], 4, -378558); d = hh(d, a, b, c, M[j + 8], 11, -2022574463); c = hh(c, d, a, b, M[j + 11], 16, 1839030562); b = hh(b, c, d, a, M[j + 14], 23, -35309556);
        a = hh(a, b, c, d, M[j + 1], 4, -1530992060); d = hh(d, a, b, c, M[j + 4], 11, 1272893353); c = hh(c, d, a, b, M[j + 7], 16, -155497632); b = hh(b, c, d, a, M[j + 10], 23, -1094730640);
        a = hh(a, b, c, d, M[j + 13], 4, 681279174); d = hh(d, a, b, c, M[j + 0], 11, -358537222); c = hh(c, d, a, b, M[j + 3], 16, -722521979); b = hh(b, c, d, a, M[j + 6], 23, 76029189);
        a = hh(a, b, c, d, M[j + 9], 4, -640364487); d = hh(d, a, b, c, M[j + 12], 11, -421815835); c = hh(c, d, a, b, M[j + 15], 16, 530742520); b = hh(b, c, d, a, M[j + 2], 23, -995338651);
        a = ii(a, b, c, d, M[j + 0], 6, -198630844); d = ii(d, a, b, c, M[j + 7], 10, 1126891415); c = ii(c, d, a, b, M[j + 14], 15, -1416354905); b = ii(b, c, d, a, M[j + 5], 21, -57434055);
        a = ii(a, b, c, d, M[j + 12], 6, 1700485571); d = ii(d, a, b, c, M[j + 3], 10, -1894986606); c = ii(c, d, a, b, M[j + 10], 15, -1051523); b = ii(b, c, d, a, M[j + 1], 21, -2054922799);
        a = ii(a, b, c, d, M[j + 8], 6, 1873313359); d = ii(d, a, b, c, M[j + 15], 10, -30611744); c = ii(c, d, a, b, M[j + 6], 15, -1560198380); b = ii(b, c, d, a, M[j + 13], 21, 1309151649);
        a = ii(a, b, c, d, M[j + 4], 6, -145523070); d = ii(d, a, b, c, M[j + 11], 10, -1120210379); c = ii(c, d, a, b, M[j + 2], 15, 718787259); b = ii(b, c, d, a, M[j + 9], 21, -343485551);
        a = safeAdd(a, oa); b = safeAdd(b, ob); c = safeAdd(c, oc); d = safeAdd(d, od);
    }
    var out = [];
    [a, b, c, d].forEach(function (n) {
        for (var k = 0; k < 4; k++) out.push((n >>> (k * 8)) & 0xFF);
    });
    return out.map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
}

function getTrackMeta(trackId) {
    var d = location.hostname.split('.')[2];
    return requestGET('https://api.music.yandex.' + d + '/tracks/' + trackId).then(function (response) {
        var result = response && response.result !== undefined ? response.result : response;
        if (Array.isArray(result)) return result[0] || null;
        return result || null;
    });
}

function getBestDownloadUrl(trackId) {
    var d = location.hostname.split('.')[2];
    return requestGET('https://api.music.yandex.' + d + '/tracks/' + trackId + '/download-info').then(function (response) {
        var variants = (response && response.result) ? response.result : [];
        var pool = variants.filter(function (v) { return v.codec === 'mp3' && !v.preview && v.downloadInfoUrl; });
        pool.sort(function (a, b) { return (b.bitrateInKbps || 0) - (a.bitrateInKbps || 0); });
        if (pool.length === 0) throw new Error('\u041d\u0435\u0442 MP3 \u0432\u0430\u0440\u0438\u0430\u043d\u0442\u0430 \u0434\u043b\u044f \u0442\u0440\u0435\u043a\u0430');
        var best = pool[0];
        return fetch(best.downloadInfoUrl).then(function (r) {
            if (!r.ok) throw new Error('\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u044f \u0441\u0441\u044b\u043b\u043a\u0438');
            return r.text();
        }).then(function (text) {
            var doc = new DOMParser().parseFromString(text, 'text/xml');
            function txt(tag) {
                var el = doc.getElementsByTagName(tag)[0];
                return el ? (el.textContent || '') : '';
            }
            var host = txt('host'), path = txt('path'), ts = txt('ts'), s = txt('s');
            if (!host || !path || !ts || !s) throw new Error('\u041e\u0448\u0438\u0431\u043a\u0430 \u0440\u0430\u0437\u0431\u043e\u0440\u0430 \u0441\u0441\u044b\u043b\u043a\u0438');
            var sign = md5('XGRlBW9FXlekgbPrRHuSiA' + path.substring(1) + s);
            return {
                url: 'https://' + host + '/get-mp3/' + sign + '/' + ts + path,
                bitrate: best.bitrateInKbps,
            };
        });
    });
}

function buildTrackTags(meta) {
    var artists = [];
    if (meta.artists) {
        for (var i = 0; i < meta.artists.length; i++) if (meta.artists[i].name) artists.push(meta.artists[i].name);
    }
    var version = meta.version ? ' (' + meta.version + ')' : '';
    var title = (meta.title || 'Unknown Title') + version;
    var album = null, year = null, genre = null;
    if (meta.albums && meta.albums.length > 0) {
        album = meta.albums[0].title || null;
        year = meta.albums[0].year ? String(meta.albums[0].year) : null;
        genre = meta.albums[0].genre ? String(meta.albums[0].genre) : null;
    }
    var coverUrl = '';
    if (meta.coverUri) coverUrl = 'https://' + meta.coverUri.replace('%%', '400x400');
    else if (meta.albums && meta.albums[0] && meta.albums[0].coverUri) coverUrl = 'https://' + meta.albums[0].coverUri.replace('%%', '400x400');
    return {
        artist: artists.join(', ') || 'Unknown Artist',
        title: title,
        album: album,
        year: year,
        genre: genre,
        coverUrl: coverUrl,
        fileName: (artists.join(', ') || 'Unknown Artist') + ' - ' + title,
    };
}

function sanitizeDownloadFileName(name) {
    return String(name || 'track').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 150);
}

function sendDownloadToBackground(payload) {
    return API.runtime.sendMessage({ action: 'downloadTrack', payload: payload }).then(function (resp) {
        if (resp && resp.ok) return resp;
        throw new Error(resp && resp.error ? resp.error : '\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u044f');
    });
}

function downloadSingleTrack(trackId) {
    return Promise.all([getTrackMeta(trackId), getBestDownloadUrl(trackId)]).then(function (arr) {
        var meta = arr[0];
        var info = arr[1];
        if (!meta) throw new Error('\u0422\u0440\u0435\u043a \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d');
        var tags = buildTrackTags(meta);
        var filename = sanitizeDownloadFileName(tags.fileName) + '.mp3';
        return sendDownloadToBackground({
            directUrl: info.url,
            coverUrl: tags.coverUrl,
            tags: { title: tags.title, artist: tags.artist, album: tags.album, year: tags.year, genre: tags.genre },
            filename: filename,
        }).then(function () { return filename; });
    });
}

function getVisiblePlayerBar() {
    for (var i = 0; i < DL_PLAYER_SELECTORS.length; i++) {
        var els = document.querySelectorAll(DL_PLAYER_SELECTORS[i]);
        for (var j = 0; j < els.length; j++) {
            if (els[j].getBoundingClientRect().width > 0) return els[j];
        }
    }
    return null;
}

function extractTrackIdFromElement(el) {
    if (!el) return null;
    var link = el.querySelector('a[href*="/track/"]');
    if (link) {
        var m = link.href.match(/\/track\/(\d+)/);
        if (m) return m[1];
    }
    var node = el.closest('[data-track-id]') || el.querySelector('[data-track-id]');
    if (node && node.getAttribute('data-track-id')) return node.getAttribute('data-track-id');
    var m2 = location.href.match(/\/track\/(\d+)/);
    return m2 ? m2[1] : null;
}

function getCurrentTrackId(callback) {
    var bar = getVisiblePlayerBar();
    var id = extractTrackIdFromElement(bar);
    if (id) { callback(id); return; }

    var title = '', artist = '';
    if (bar) {
        var trackLink = bar.querySelector('a[href*="/track/"]');
        var artistLink = bar.querySelector('a[href*="/artist/"]');
        if (trackLink) title = trackLink.textContent.trim();
        if (artistLink) artist = artistLink.textContent.trim();
        if (!title) {
            var titleEl = bar.querySelector('[class*="trackNameText"], [class*="trackName"], [class*="d-track__name"]');
            if (titleEl) title = titleEl.textContent.trim();
        }
    }
    if (!title && !artist) { callback(null); return; }
    searchGlobalDownloadTracks((artist + ' ' + title).trim(), function (tracks) {
        callback(tracks && tracks.length > 0 ? String(tracks[0].id) : null);
    });
}

function searchGlobalDownloadTracks(query, callback) {
    var d = location.hostname.split('.')[2];
    var url = 'https://api.music.yandex.' + d + '/search?type=track&text=' + encodeURIComponent(query) + '&page=0&nocorrect=false';

    requestGET(url, function (response) {
        var tracks = [];
        try {
            var raw = response.result.tracks.results;
            for (var i = 0; i < Math.min(raw.length, 20); i++) {
                var t = raw[i];
                var artists = [];
                if (t.artists) {
                    for (var j = 0; j < t.artists.length; j++) artists.push(t.artists[j].name || '');
                }
                tracks.push({ id: t.id, title: t.title || '', artists: artists, coverUrl: getTrackCoverUrl(t) });
            }
        } catch (e) {}
        callback(tracks);
    });
}

function onClickDownloadCurrent() {
    toggleDropdown('menuPlaylistMain');
    ensureDownloadStyle();
    fireLoadingSwal(null, '\u041f\u043e\u0438\u0441\u043a \u0442\u0440\u0435\u043a\u0430...');
    getCurrentTrackId(function (id) {
        if (!id) {
            Swal.close();
            fireErrorSwal('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u044c \u0442\u0440\u0435\u043a. \u041f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0438\u0442\u0435 \u0442\u0440\u0435\u043a \u0438 \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0441\u043d\u043e\u0432\u0430.');
            return;
        }
        downloadSingleTrack(id).then(function (filename) {
            Swal.close();
            fireInfoSwal('\u0421\u043a\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044f: ' + filename);
        }).catch(function (e) {
            Swal.close();
            console.error('Y-Music-Tools: download current failed', e);
            fireErrorSwal('\u041e\u0448\u0438\u0431\u043a\u0430: ' + (e.message || '\u043d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u0430\u044f'));
        });
    });
}

function onClickDownloadSearch() {
    toggleDropdown('menuPlaylistMain');
    ensureDownloadStyle();
    DOWNLOAD_STATE.searchResults = [];
    DOWNLOAD_STATE.lastQuery = '';
    Swal.fire({
        title: '\u041d\u0430\u0439\u0442\u0438 \u0438 \u0441\u043a\u0430\u0447\u0430\u0442\u044c \u0442\u0440\u0435\u043a',
        html: '<div id="ymt-dl-root" style="text-align:left;"></div>',
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: '\u0417\u0430\u043a\u0440\u044b\u0442\u044c',
        width: 480,
        didOpen: function () { renderDownloadSearch(); },
    });
}

function renderDownloadSearch() {
    var root = document.getElementById('ymt-dl-root');
    if (!root) return;
    root.innerHTML = '<input id="ymt-dl-search" class="ymt-dl-search" placeholder="\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0438\u043b\u0438 \u0438\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c..." autocomplete="off"><div id="ymt-dl-results" class="ymt-dl-list"></div>';
    renderDownloadResults(document.getElementById('ymt-dl-results'));
    var input = document.getElementById('ymt-dl-search');
    input.addEventListener('input', function () {
        clearTimeout(DOWNLOAD_STATE.searchTimeout);
        var q = input.value.trim();
        DOWNLOAD_STATE.lastQuery = q;
        if (q.length < 2) {
            DOWNLOAD_STATE.searchResults = [];
            renderDownloadResults(document.getElementById('ymt-dl-results'));
            return;
        }
        DOWNLOAD_STATE.searchTimeout = setTimeout(function () {
            searchGlobalDownloadTracks(q, function (tracks) {
                DOWNLOAD_STATE.searchResults = tracks;
                renderDownloadResults(document.getElementById('ymt-dl-results'));
            });
        }, 300);
    });
}

function renderDownloadResults(container) {
    if (!container) return;
    var tracks = DOWNLOAD_STATE.searchResults;

    if (tracks.length === 0) {
        container.innerHTML = DOWNLOAD_STATE.lastQuery.length >= 2
            ? '<div class="ymt-dl-empty">\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e</div>'
            : '<div class="ymt-dl-empty">\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0442\u0440\u0435\u043a\u0430 \u0438\u043b\u0438 \u0430\u0440\u0442\u0438\u0441\u0442\u0430</div>';
        return;
    }

    var html = '';
    for (var i = 0; i < tracks.length; i++) {
        var t = tracks[i];
        var artist = t.artists.join(', ');
        var coverImg = t.coverUrl
            ? '<img class="ymt-dl-track-cover" src="' + escapeAttr(t.coverUrl) + '">'
            : '<div class="ymt-dl-track-cover"></div>';
        html += '<div class="ymt-dl-track" data-id="' + t.id + '">'
            + coverImg
            + '<div class="ymt-dl-track-info">'
            + '<div class="ymt-dl-track-title">' + escapeHtml(t.title) + '</div>'
            + '<div class="ymt-dl-track-artist">' + escapeHtml(artist) + '</div>'
            + '</div>'
            + '<button class="ymt-dl-download" data-id="' + t.id + '" title="\u0421\u043a\u0430\u0447\u0430\u0442\u044c">\u2193</button>'
            + '</div>';
    }
    container.innerHTML = html;

    container.onclick = function (e) {
        var btn = e.target.closest('.ymt-dl-download');
        if (btn) {
            var id = btn.getAttribute('data-id');
            btn.disabled = true;
            btn.innerHTML = '...';
            downloadSingleTrack(id).then(function (filename) {
                btn.className = 'ymt-dl-download done';
                btn.innerHTML = '\u2713';
                btn.title = '\u0421\u043a\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044f: ' + filename;
            }).catch(function (err) {
                btn.className = 'ymt-dl-download error';
                btn.innerHTML = '!';
                btn.title = '\u041e\u0448\u0438\u0431\u043a\u0430: ' + ((err && err.message) || '');
            });
        }
    };
}

function onClickDownloadPlaylist() {
    toggleDropdown('menuPlaylistMain');
    ensureDownloadStyle();
    ensurePlaylistData(function (data) {
        if (!data || data.tracks.length === 0) {
            fireErrorSwal('\u0414\u0430\u043d\u043d\u044b\u0435 \u043f\u043b\u0435\u0439\u043b\u0438\u0441\u0442\u0430 \u043d\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d\u044b. \u041e\u0431\u043d\u043e\u0432\u0438\u0442\u0435 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0443.');
            return;
        }
        var count = data.tracks.length;
        Swal.fire({
            title: '\u0421\u043a\u0430\u0447\u0430\u0442\u044c \u043f\u043b\u0435\u0439\u043b\u0438\u0441\u0442',
            html: '\u0422\u0440\u0435\u043a\u043e\u0432: <b>' + count + '</b><br><br>\u0421\u043a\u0430\u0447\u0430\u0442\u044c \u0432\u0441\u0435 \u0432 MP3 (\u043c\u0430\u043a\u0441. \u0431\u0438\u0442\u0440\u0435\u0439\u0442) \u0438 \u0443\u043f\u0430\u043a\u043e\u0432\u0430\u0442\u044c \u0432 ZIP?<br><span style="font-size:12px;color:rgba(255,255,255,0.4)">\u041d\u0443\u0436\u043d\u0430 \u043f\u043e\u0434\u043f\u0438\u0441\u043a\u0430 Plus/\u041f\u0440\u0435\u043c\u0438\u0443\u043c \u0434\u043b\u044f \u043f\u043e\u043b\u043d\u044b\u0445 \u0432\u0435\u0440\u0441\u0438\u0439.</span>',
            showCancelButton: true,
            confirmButtonText: '\u0421\u043a\u0430\u0447\u0430\u0442\u044c ZIP',
            cancelButtonText: '\u041e\u0442\u043c\u0435\u043d\u0430',
        }).then(function (action) {
            if (action.isConfirmed) {
                downloadPlaylistZip(data);
            }
        });
    });
}

function downloadPlaylistZip(data) {
    var tracks = [];
    for (var i = 0; i < data.tracks.length; i++) {
        var t = data.tracks[i];
        tracks.push({ id: t.id, title: t.title || '' });
    }
    var domain = location.hostname.split('.')[2];
    var title = data.title || 'playlist';
    var total = tracks.length;
    var sessionId = 'zip' + Date.now() + Math.floor(Math.random() * 1e6);

    var session = DOWNLOAD_STATE.zipUi = {
        sessionId: sessionId,
        total: total,
        done: 0,
        failed: 0,
        errors: [],
        currentTitle: '',
        active: true,
    };

    Swal.fire({
        title: '\u0421\u043a\u0430\u0447\u0438\u0432\u0430\u043d\u0438\u0435 \u043f\u043b\u0435\u0439\u043b\u0438\u0441\u0442\u0430',
        html: '<div id="ymt-dl-zip-ui">' + zipUiMarkup() + '</div>'
            + '<div style="margin-top:10px;font-size:12px;color:rgba(255,255,255,0.35)">Esc \u2014 \u043e\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c</div>',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: function () { renderZipUi(); },
    });

    API.runtime.sendMessage({
        action: 'downloadPlaylistZip',
        payload: { domain: domain, playlistTitle: title, tracks: tracks, sessionId: sessionId },
    }).then(function (resp) {
        session.active = false;
        if (Swal.isVisible()) Swal.close();
        showZipSummary(resp, session);
    }).catch(function (e) {
        session.active = false;
        if (Swal.isVisible()) Swal.close();
        console.error('Y-Music-Tools: playlist zip failed', e);
        showZipSummary({ ok: false, cancelled: true, downloaded: session.done, failed: session.failed, error: (e && e.message) || '\u043d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u0430\u044f' }, session);
    });
}

function zipUiMarkup() {
    return '<div class="ymt-dl-zip-bar"><div class="ymt-dl-zip-fill"></div></div>'
        + '<div class="ymt-dl-zip-meta"><span class="ymt-dl-zip-count">\u0421\u043a\u0430\u0447\u0430\u043d\u043e: 0 \u0438\u0437 0</span><span class="ymt-dl-zip-err">\u041e\u0448\u0438\u0431\u043a\u0438: 0</span></div>'
        + '<div class="ymt-dl-zip-current"><span class="ymt-dl-zip-spinner"></span><span>\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430...</span></div>'
        + '<div class="ymt-dl-zip-errors"></div>';
}

function renderZipUi() {
    var s = DOWNLOAD_STATE.zipUi;
    var el = document.getElementById('ymt-dl-zip-ui');
    if (!el || !s) return;

    var pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
    var fill = el.querySelector('.ymt-dl-zip-fill');
    if (fill) fill.style.width = pct + '%';

    var countEl = el.querySelector('.ymt-dl-zip-count');
    if (countEl) countEl.textContent = '\u0421\u043a\u0430\u0447\u0430\u043d\u043e: ' + s.done + ' \u0438\u0437 ' + s.total;

    var errEl = el.querySelector('.ymt-dl-zip-err');
    if (errEl) errEl.textContent = '\u041e\u0448\u0438\u0431\u043a\u0438: ' + s.failed;

    var curEl = el.querySelector('.ymt-dl-zip-current');
    if (curEl) {
        curEl.innerHTML = s.currentTitle
            ? '<span class="ymt-dl-zip-spinner"></span><span style="overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(s.currentTitle) + '</span>'
            : '<span class="ymt-dl-zip-spinner"></span><span style="color:rgba(255,255,255,0.4)">\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430...</span>';
    }

    var errsEl = el.querySelector('.ymt-dl-zip-errors');
    if (errsEl) {
        var list = s.errors.slice(-5);
        errsEl.innerHTML = list.length ? list.map(function (e) {
            return '<div class="ymt-dl-zip-errline">' + escapeHtml(e.title || '') + ' \u2014 ' + escapeHtml(e.message) + '</div>';
        }).join('') : '';
    }
}

function showZipSummary(resp, session) {
    var lines = [];
    if (resp && resp.error && !resp.cancelled) {
        lines.push('\u041e\u0448\u0438\u0431\u043a\u0430: <b>' + escapeHtml(resp.error) + '</b>');
    }
    lines.push('\u0421\u043a\u0430\u0447\u0430\u043d\u043e: <b>' + (resp && resp.downloaded !== undefined ? resp.downloaded : session.done) + '</b> \u0438\u0437 ' + session.total);
    if (resp && resp.failed > 0) {
        lines.push('\u041e\u0448\u0438\u0431\u043e\u043a: <b>' + resp.failed + '</b>');
    }
    if (resp && resp.cancelled) {
        lines.push('<span style="color:#ffb300">\u041e\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u043e \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u0435\u043c (Esc)</span>');
    }
    if (resp && resp.zipName) {
        lines.push('\u0424\u0430\u0439\u043b: <b>' + escapeHtml(resp.zipName) + '</b>');
    }
    if (session.errors.length > 0) {
        var max = Math.min(session.errors.length, 15);
        var errHtml = '';
        for (var i = 0; i < max; i++) {
            var e = session.errors[i];
            errHtml += '<div class="ymt-dl-summary-err">' + escapeHtml(e.title || '\u0422\u0440\u0435\u043a') + ' \u2014 ' + escapeHtml(e.message) + '</div>';
        }
        if (session.errors.length > max) {
            errHtml += '<div class="ymt-dl-summary-err">...\u0438 \u0435\u0449\u0451 ' + (session.errors.length - max) + '</div>';
        }
        lines.push('<div class="ymt-dl-summary-err-title">\u041e\u0448\u0438\u0431\u043a\u0438:</div><div class="ymt-dl-summary-err-list">' + errHtml + '</div>');
    }
    Swal.fire({
        title: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430',
        html: lines.join('<br>'),
        confirmButtonText: '\u041e\u041a',
        width: 480,
    });
}

document.addEventListener('keydown', function (e) {
    var s = DOWNLOAD_STATE.zipUi;
    if (e.key === 'Escape' && s && s.active) {
        e.preventDefault();
        e.stopPropagation();
        s.active = false;
        s.currentTitle = '';
        renderZipUi();
        API.runtime.sendMessage({ action: 'downloadPlaylistCancel', sessionId: s.sessionId }).catch(function () {});
    }
}, true);

API.runtime.onMessage.addListener(function (msg) {
    if (msg && msg.action === 'ymtDlProgress') {
        var s = DOWNLOAD_STATE.zipUi;
        if (!s || !s.active || (s.sessionId && msg.sessionId && s.sessionId !== msg.sessionId)) return false;
        s.total = msg.total;
        s.done = msg.done;
        s.failed = msg.failed;
        s.currentTitle = msg.currentTitle || '';
        if (msg.lastError) s.errors.push(msg.lastError);
        renderZipUi();
    }
    return false;
});
