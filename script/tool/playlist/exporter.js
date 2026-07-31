var _ymtCachedPlaylistData = null;

function getPlaylistKey() {
    var args = getArgsByLocation();
    return args.kind ? String(args.kind) : '';
}

function readInterceptedData() {
    if (_ymtCachedPlaylistData) {
        if (_ymtCachedPlaylistData._playlistKey === getPlaylistKey()) {
            return _ymtCachedPlaylistData;
        }
        _ymtCachedPlaylistData = null;
    }
    try {
        var raw = document.documentElement.getAttribute('data-ymt-playlist');
        if (raw) {
            var parsed = JSON.parse(raw);
            if (parsed._playlistKey === getPlaylistKey()) {
                _ymtCachedPlaylistData = parsed;
                return parsed;
            }
        }
    } catch (e) {}
    return null;
}

function ensurePlaylistData(callback) {
    var data = readInterceptedData();
    if (data && data.tracks && data.tracks.length > 0) {
        callback(data);
        return;
    }
    fetchPlaylistDataForCurrentPage(function (result) {
        if (result && result.tracks && result.tracks.length > 0) {
            callback(result);
        } else {
            callback(null);
        }
    });
}

function fetchPlaylistDataForCurrentPage(callback) {
    var meta;
    var args = getArgsByLocation();
    if (args.owner && args.kind) {
        meta = { ownerUid: args.owner, kind: args.kind, title: '' };
    } else if (args.kind && String(args.kind).indexOf('-') === -1) {
        meta = { ownerUid: typeof uid !== 'undefined' ? uid : null, kind: args.kind, title: '' };
    } else {
        try {
            var metaRaw = document.documentElement.getAttribute('data-ymt-playlist-meta');
            if (metaRaw) meta = JSON.parse(metaRaw);
        } catch (e) {}
    }

    if (!meta || !meta.kind) { callback(null); return; }

    var d = location.hostname.split('.')[2];
    var isUuid = String(meta.kind).indexOf('-') !== -1;
    var url = isUuid
        ? 'https://api.music.yandex.' + d + '/playlists/' + meta.kind
        : 'https://api.music.yandex.' + d + '/users/' + meta.ownerUid + '/playlists/' + meta.kind;

    url += (url.indexOf('?') === -1 ? '?' : '&') + 'richTracks=true';

    requestGET(url, function (response) {
        try {
            var data = response.result || response;
            if (!data || !data.tracks) { callback(null); return; }
            var tracks = [];
            for (var i = 0; i < data.tracks.length; i++) {
                var pos = data.tracks[i];
                var t = pos.track || pos;
                if (!t || !t.id) continue;
                var artists = [];
                if (t.artists) {
                    for (var j = 0; j < t.artists.length; j++) {
                        if (t.artists[j].name) artists.push(t.artists[j].name);
                    }
                }
                var coverUri = '';
                if (t.albums && t.albums.length > 0 && t.albums[0].coverUri) {
                    coverUri = t.albums[0].coverUri;
                }
                tracks.push({
                    id: t.id,
                    title: t.title || '',
                    artists: artists,
                    coverUri: coverUri,
                    durationMs: t.durationMs || 0,
                    releaseDate: t.releaseDate || (t.albums && t.albums[0] && t.albums[0].releaseDate) || '',
                    trackAddedAt: pos.trackAddedAt || 0,
                });
            }
            var result = { title: data.title || meta.title || '', tracks: tracks, _playlistKey: getPlaylistKey() };
            _ymtCachedPlaylistData = result;
            document.documentElement.setAttribute('data-ymt-playlist', JSON.stringify(result));
            callback(result);
        } catch (e) {
            callback(null);
        }
    });
}

function sanitizeFileName(name) {
    return String(name || 'playlist').replace(/[\\/:*?"<>|]/g, '_').slice(0, 100);
}

function downloadBlob(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
}

var EXPORTER_MENU_ITEM = {
    title: 'Копировать названия треков',
    handler: onClickCopyTracks,
};

var STATS_MENU_ITEM = {
    title: 'Статистика',
    handler: onClickStats,
};

var EXPORT_TXT_MENU_ITEM = {
    title: 'Скачать .txt',
    handler: onClickExportTxt,
};

var EXPORT_CSV_MENU_ITEM = {
    title: 'Скачать .csv',
    handler: onClickExportCsv,
};

function onClickCopyTracks() {
    toggleDropdown('menuPlaylistMain');

    ensurePlaylistData(function (data) {
        if (!data || data.tracks.length === 0) {
            fireErrorSwal('Данные плейлиста не загружены. Обновите страницу.');
            return;
        }

        copyTracksToClipboard(data.tracks).then(function () {
            fireInfoSwal('Скопировано ' + data.tracks.length + ' треков в буфер обмена');
        }, function (e) {
            console.error(e);
            fireErrorSwal('Ошибка при копировании');
        });
    });
}

function copyTracksToClipboard(source) {
    var lines = [];
    for (var i = 0; i < source.length; i++) {
        var t = source[i];
        var artist = t.artists ? t.artists.join(', ') : '';
        var line = artist ? (artist + ' - ' + t.title) : t.title;
        lines.push(line);
    }
    return navigator.clipboard.writeText(lines.join('\n'));
}

function onClickStats() {
    toggleDropdown('menuPlaylistMain');

    ensurePlaylistData(function (data) {
        if (!data || data.tracks.length === 0) {
            fireErrorSwal('Данные плейлиста не загружены. Обновите страницу.');
            return;
        }

        var tracks = data.tracks;
        var totalDurationMs = 0;
        var artistCount = {};

        for (var i = 0; i < tracks.length; i++) {
            var t = tracks[i];

            if (t.durationMs) {
                totalDurationMs += t.durationMs;
            }

            if (t.artists) {
                for (var j = 0; j < t.artists.length; j++) {
                    var name = t.artists[j];
                    artistCount[name] = (artistCount[name] || 0) + 1;
                }
            }
        }

        var totalMinutes = Math.round(totalDurationMs / 60000);
        var hours = Math.floor(totalMinutes / 60);
        var minutes = totalMinutes % 60;

        var topArtists = Object.entries(artistCount)
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, 10);

        var html = '<div style="text-align:left;font-size:14px;">';
        html += '<p><b>Треков:</b> ' + tracks.length + '</p>';
        if (totalDurationMs > 0) {
            html += '<p><b>Длительность:</b> ' + hours + ' ч ' + minutes + ' мин</p>';
        }
        html += '<p><b>Уникальных артистов:</b> ' + Object.keys(artistCount).length + '</p>';

        if (topArtists.length > 0) {
            html += '<hr><p><b>Топ артистов:</b></p><ol style="margin:0;padding-left:20px;">';
            for (var i = 0; i < topArtists.length; i++) {
                html += '<li>' + topArtists[i][0] + ' <span style="color:rgba(255,255,255,0.4);">(' + topArtists[i][1] + ')</span></li>';
            }
            html += '</ol>';
        }

        html += '</div>';

        Swal.fire({
            title: data.title,
            html: html,
            width: 500,
        });
    });
}

function onClickExportTxt() {
    toggleDropdown('menuPlaylistMain');

    ensurePlaylistData(function (data) {
        if (!data || data.tracks.length === 0) {
            fireErrorSwal('Данные плейлиста не загружены. Обновите страницу.');
            return;
        }

        var lines = [];
        for (var i = 0; i < data.tracks.length; i++) {
            var t = data.tracks[i];
            var artist = t.artists ? t.artists.join(', ') : '';
            lines.push(artist ? (artist + ' - ' + t.title) : t.title);
        }

        var fileName = sanitizeFileName(data.title) + '.txt';
        downloadBlob(lines.join('\n'), fileName, 'text/plain;charset=utf-8');
        fireInfoSwal('Скачано ' + data.tracks.length + ' треков');
    });
}

function onClickExportCsv() {
    toggleDropdown('menuPlaylistMain');

    ensurePlaylistData(function (data) {
        if (!data || data.tracks.length === 0) {
            fireErrorSwal('Данные плейлиста не загружены. Обновите страницу.');
            return;
        }

        function csvEscape(s) {
            s = String(s || '');
            if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
                return '"' + s.replace(/"/g, '""') + '"';
            }
            return s;
        }

        var rows = ['Artist,Title,Duration'];
        for (var i = 0; i < data.tracks.length; i++) {
            var t = data.tracks[i];
            var artist = t.artists ? t.artists.join(', ') : '';
            var dur = '';
            if (t.durationMs) {
                var totalSec = Math.floor(t.durationMs / 1000);
                var min = Math.floor(totalSec / 60);
                var sec = totalSec % 60;
                dur = min + ':' + (sec < 10 ? '0' : '') + sec;
            }
            rows.push(csvEscape(artist) + ',' + csvEscape(t.title) + ',' + dur);
        }

        var fileName = sanitizeFileName(data.title) + '.csv';
        downloadBlob(rows.join('\n'), fileName, 'text/csv;charset=utf-8');
        fireInfoSwal('Скачано ' + data.tracks.length + ' треков');
    });
}
