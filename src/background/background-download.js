// Firefox-compatible background download logic (non-module)
// Runs in the same Event Page as background-fx.js; uses its buildID3v2Tag, requestGET, browserAPI.
// Reuses Yandex Music sign/md5 logic mirrored from the content-side downloader.

function md5BG(str) {
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

function crc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
        crc ^= bytes[i];
        for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

async function getTrackMetaBG(domain, trackId) {
    const response = await requestGET('https://api.music.yandex.' + domain + '/tracks/' + trackId);
    const result = response && response.result !== undefined ? response.result : response;
    if (Array.isArray(result)) return result[0] || null;
    return result || null;
}

async function getBestDownloadUrlBG(domain, trackId) {
    const response = await requestGET('https://api.music.yandex.' + domain + '/tracks/' + trackId + '/download-info');
    const variants = (response && response.result) ? response.result : [];
    const pool = variants.filter((v) => v.codec === 'mp3' && !v.preview && v.downloadInfoUrl);
    pool.sort((a, b) => (b.bitrateInKbps || 0) - (a.bitrateInKbps || 0));
    if (pool.length === 0) throw new Error('Нет MP3 варианта для трека');
    const best = pool[0];

    const res = await fetch(best.downloadInfoUrl);
    if (!res.ok) throw new Error('Ошибка получения ссылки');
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    const txt = (tag) => { const el = doc.getElementsByTagName(tag)[0]; return el ? (el.textContent || '') : ''; };
    const host = txt('host'), path = txt('path'), ts = txt('ts'), s = txt('s');
    if (!host || !path || !ts || !s) throw new Error('Ошибка разбора ссылки');
    const sign = md5BG('XGRlBW9FXlekgbPrRHuSiA' + path.substring(1) + s);
    return { url: 'https://' + host + '/get-mp3/' + sign + '/' + ts + path, bitrate: best.bitrateInKbps };
}

function buildTrackTagsBG(meta) {
    const artists = [];
    if (meta.artists) {
        for (const a of meta.artists) if (a.name) artists.push(a.name);
    }
    const version = meta.version ? ' (' + meta.version + ')' : '';
    const title = (meta.title || 'Unknown Title') + version;
    let album = null, year = null, genre = null;
    if (meta.albums && meta.albums.length > 0) {
        album = meta.albums[0].title || null;
        year = meta.albums[0].year ? String(meta.albums[0].year) : null;
        genre = meta.albums[0].genre ? String(meta.albums[0].genre) : null;
    }
    let coverUrl = '';
    if (meta.coverUri) coverUrl = 'https://' + meta.coverUri.replace('%%', '400x400');
    else if (meta.albums && meta.albums[0] && meta.albums[0].coverUri) coverUrl = 'https://' + meta.albums[0].coverUri.replace('%%', '400x400');
    return {
        fileName: (artists.join(', ') || 'Unknown Artist') + ' - ' + title,
        coverUrl: coverUrl,
        id3: { title, artist: artists.join(', ') || 'Unknown Artist', album, year, genre },
    };
}

function sanitizeZipName(name) {
    return String(name || 'track').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 150);
}

function dedupeZipName(name, used) {
    if (!used.has(name)) { used.add(name); return name; }
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    let i = 1;
    while (used.has(base + ' (' + i + ')' + ext)) i++;
    const out = base + ' (' + i + ')' + ext;
    used.add(out);
    return out;
}

function buildZipEntry(fileName, dataArrayBuffer, localOffset) {
    const name = new TextEncoder().encode(fileName);
    const data = new Uint8Array(dataArrayBuffer);
    const crc = crc32(data);
    const size = data.length;

    const local = new Uint8Array(30 + name.length);
    const dv = new DataView(local.buffer);
    dv.setUint32(0, 0x04034b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 0x0800, true);
    dv.setUint16(8, 0, true);
    dv.setUint16(10, 0, true);
    dv.setUint16(12, 0, true);
    dv.setUint32(14, crc, true);
    dv.setUint32(18, size, true);
    dv.setUint32(22, size, true);
    dv.setUint16(26, name.length, true);
    dv.setUint16(28, 0, true);
    local.set(name, 30);

    const central = new Uint8Array(46 + name.length);
    const dv2 = new DataView(central.buffer);
    dv2.setUint32(0, 0x02014b50, true);
    dv2.setUint16(4, 20, true);
    dv2.setUint16(6, 20, true);
    dv2.setUint16(8, 0x0800, true);
    dv2.setUint16(10, 0, true);
    dv2.setUint16(12, 0, true);
    dv2.setUint16(14, 0, true);
    dv2.setUint32(16, crc, true);
    dv2.setUint32(20, size, true);
    dv2.setUint32(24, size, true);
    dv2.setUint16(28, name.length, true);
    dv2.setUint16(30, 0, true);
    dv2.setUint16(32, 0, true);
    dv2.setUint16(34, 0, true);
    dv2.setUint16(36, 0, true);
    dv2.setUint32(38, 0, true);
    dv2.setUint32(42, localOffset, true);
    central.set(name, 46);

    return { local, data, central };
}

let activeZipSessionId = null;
let zipCancelRequested = false;

function handleDownloadPlaylistCancel(sessionId) {
    if (activeZipSessionId && sessionId && activeZipSessionId === sessionId) {
        zipCancelRequested = true;
    }
    return { success: true };
}

async function handleDownloadPlaylistZip(payload, sender) {
    const { domain, playlistTitle, tracks, sessionId } = payload || {};
    const list = Array.isArray(tracks) ? tracks : [];
    const total = list.length;
    if (!domain || total === 0) return { ok: false, error: 'Нет данных плейлиста' };

    activeZipSessionId = sessionId || String(Date.now());
    zipCancelRequested = false;

    const usedNames = new Set();
    const zipParts = [];
    const centralParts = [];
    let localOffset = 0;
    let done = 0, failed = 0;

    const sendProgress = (currentTitle, lastError) => {
        if (!sender || !sender.tab) return;
        browserAPI.tabs.sendMessage(sender.tab.id, {
            action: 'ymtDlProgress',
            sessionId: activeZipSessionId,
            done,
            total,
            failed,
            currentTitle: currentTitle || '',
            lastError: lastError || null,
        }).catch(() => {});
    };

    for (let i = 0; i < total; i++) {
        if (zipCancelRequested) break;
        const t = list[i] || {};
        const trackId = String(t.id);
        sendProgress(t.title || '');
        try {
            const meta = await getTrackMetaBG(domain, trackId);
            if (!meta) throw new Error('Трек не найден');
            const info = await getBestDownloadUrlBG(domain, trackId);
            const tags = buildTrackTagsBG(meta);

            const mp3Res = await fetch(info.url);
            if (!mp3Res.ok) throw new Error('Сбой загрузки (' + mp3Res.status + ')');
            const mp3Buffer = await mp3Res.arrayBuffer();

            let coverBuffer = null;
            if (tags.coverUrl) {
                try {
                    const coverRes = await fetch(tags.coverUrl);
                    if (coverRes.ok) coverBuffer = await coverRes.arrayBuffer();
                } catch (e) {}
            }

            const id3Buffer = buildID3v2Tag(tags.id3, coverBuffer);
            const combined = new Uint8Array(id3Buffer.byteLength + mp3Buffer.byteLength);
            combined.set(new Uint8Array(id3Buffer), 0);
            combined.set(new Uint8Array(mp3Buffer), id3Buffer.byteLength);

            const fileName = dedupeZipName(sanitizeZipName(tags.fileName) + '.mp3', usedNames);
            const entry = buildZipEntry(fileName, combined.buffer, localOffset);
            zipParts.push(entry.local, entry.data);
            centralParts.push(entry.central);
            localOffset += entry.local.length + entry.data.length;
            done++;
        } catch (e) {
            failed++;
            const errMsg = (e && e.message) ? e.message : String(e);
            console.error('Y-Music-Tools: playlist zip track failed', trackId, e);
            sendProgress(t.title || '', { title: t.title || '', message: errMsg });
        }
    }

    const cancelled = zipCancelRequested;
    activeZipSessionId = null;
    zipCancelRequested = false;

    if (done === 0) {
        return { ok: false, cancelled, error: cancelled ? 'Отменено' : 'Не удалось скачать ни одного трека' };
    }

    const centralOffset = localOffset;
    let cdLength = 0;
    for (const c of centralParts) { zipParts.push(c); cdLength += c.length; }

    const eocd = new Uint8Array(22);
    const dve = new DataView(eocd.buffer);
    dve.setUint32(0, 0x06054b50, true);
    dve.setUint16(4, 0, true);
    dve.setUint16(6, 0, true);
    dve.setUint16(8, done, true);
    dve.setUint16(10, done, true);
    dve.setUint32(12, cdLength, true);
    dve.setUint32(16, centralOffset, true);
    dve.setUint16(20, 0, true);
    zipParts.push(eocd);

    const blob = new Blob(zipParts, { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const zipName = sanitizeZipName(playlistTitle || 'playlist') + '.zip';

    let downloadId;
    try {
        downloadId = await browserAPI.downloads.download({
            url,
            filename: zipName,
            conflictAction: 'uniquify',
            saveAs: false,
        });
    } catch (e) {
        URL.revokeObjectURL(url);
        throw e;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);

    return { ok: true, downloaded: done, failed, zipName, cancelled };
}
