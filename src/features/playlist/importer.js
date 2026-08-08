var IMPORT_STYLE_ID = 'ymt-import-style';

function ensureImportStyle() {
    if (document.getElementById(IMPORT_STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = IMPORT_STYLE_ID;
    s.textContent = [
        '.ymt-import-drop { border: 2px dashed rgba(255,255,255,0.2); border-radius: 14px; padding: 30px 20px; text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 12px; }',
        '.ymt-import-drop:hover, .ymt-import-drop.dragover { border-color: #ffff00; background: rgba(255,255,0,0.05); }',
        '.ymt-import-drop-text { color: rgba(255,255,255,0.5); font-size: 13px; }',
        '.ymt-import-drop-icon { font-size: 28px; margin-bottom: 6px; color: rgba(255,255,255,0.3); }',
        '.ymt-import-result { display: flex; align-items: center; padding: 6px 8px; border-radius: 10px; gap: 10px; border: 1px solid transparent; min-width: 0; }',
        '.ymt-import-result:hover { background: rgba(255,255,255,0.06); }',
        '.ymt-import-result.found { opacity: 1; }',
        '.ymt-import-result.notfound { opacity: 0.5; }',
        '.ymt-import-result-cover { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; flex-shrink: 0; background: rgba(255,255,255,0.08); }',
        '.ymt-import-result-info { overflow: hidden; flex: 1; min-width: 0; }',
        '.ymt-import-result-title { font-size: 13px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
        '.ymt-import-result-artist { font-size: 11px; color: rgba(255,255,255,0.45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
        '.ymt-import-result-query { font-size: 11px; color: rgba(255,255,255,0.3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
        '.ymt-import-result-status { font-size: 16px; flex-shrink: 0; width: 24px; text-align: center; }',
        '.ymt-import-result-status.ok { color: #4caf50; }',
        '.ymt-import-result-status.no { color: rgba(255,255,255,0.25); }',
        '.ymt-import-list { max-height: 340px; overflow-y: auto; }',
        '.ymt-import-list::-webkit-scrollbar { width: 4px; }',
        '.ymt-import-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }',
        '.ymt-import-actions { display: flex; gap: 8px; margin-top: 10px; }',
        '.ymt-import-submit { flex: 1; padding: 10px; border-radius: 12px; border: none; background: #ffff00; color: #000; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }',
        '.ymt-import-submit:hover { background: #e6e600; }',
        '.ymt-import-submit:disabled { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); cursor: default; }',
        '.ymt-import-clear { padding: 10px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: rgba(255,255,255,0.6); font-size: 14px; cursor: pointer; transition: all 0.15s; }',
        '.ymt-import-clear:hover { background: rgba(255,255,255,0.08); color: #fff; }',
        '.ymt-import-stats { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 8px; }',
    ].join('\n');
    document.head.appendChild(s);
}

var IMPORT_STATE = {
    parsedTracks: [],
    searchResults: {},
    targetPlaylist: null,
    searching: false,
};

var IMPORT_MENU_ITEM = {
    title: '\u0418\u043c\u043f\u043e\u0440\u0442 \u0438\u0437 \u0444\u0430\u0439\u043b\u0430',
    handler: onClickImportFromFile,
};

function onClickImportFromFile() {
    toggleDropdown('menuPlaylistMain');
    ensureImportStyle();

    var targetPlaylist = getCurrentPagePlaylist();
    if (!targetPlaylist) {
        var args = getArgsByLocation();
        if (!uid) {
            refreshSign(function () { resolveAndStartImport(args); });
        } else {
            resolveAndStartImport(args);
        }
        return;
    }
    startImportFlow(targetPlaylist);
}

function resolveAndStartImport(args) {
    var domain = location.hostname.split('.')[2];
    var pageTitle = document.title.replace(/\s*[\u2013\u2014\u2015]\s*\u042f\u043d\u0434\u0435\u043d\u043a\u0441\s*\u041c\u0443\u0437\u044b\u043a\u0430\s*$/i, '').trim();

    requestGET('https://api.music.yandex.' + domain + '/users/' + uid + '/playlists/list', function (response) {
        var items = (response && response.result) ? response.result : [];
        var matched = null;
        for (var i = 0; i < items.length; i++) {
            var pl = items[i];
            if (pl.kind == 3) continue;
            if (pl.title === pageTitle) {
                matched = { owner: pl.owner && pl.owner.uid ? pl.owner.uid : uid, kind: pl.kind, title: pl.title };
                break;
            }
        }
        if (matched) {
            startImportFlow(matched);
        } else {
            fireErrorSwal('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u044c \u043f\u043b\u0435\u0439\u0431\u043b\u0438\u0441\u0442');
        }
    });
}

function startImportFlow(targetPlaylist) {
    IMPORT_STATE.parsedTracks = [];
    IMPORT_STATE.searchResults = {};
    IMPORT_STATE.targetPlaylist = targetPlaylist;
    IMPORT_STATE.searching = false;
    showImportModal();
}

function showImportModal() {
    var target = IMPORT_STATE.targetPlaylist;
    IMPORT_STATE.modalTitle = '\u0418\u043c\u043f\u043e\u0440\u0442 \u0438\u0437 \u0444\u0430\u0439\u043b\u0430';
    Swal.fire({
        title: IMPORT_STATE.modalTitle,
        html: '<div id="ymt-import-root" style="text-align:left;"></div>',
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: '\u0417\u0430\u043a\u0440\u044b\u0442\u044c',
        width: 520,
        didOpen: function () {
            renderImportView();
        },
    });
}

function renderImportView() {
    var root = document.getElementById('ymt-import-root');
    if (!root) return;

    var html = '';
    html += '<div class="ymt-import-drop" id="ymt-import-drop">';
    html += '<div class="ymt-import-drop-icon">\ud83d\udcc1</div>';
    html += '<div class="ymt-import-drop-text">\u041f\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0444\u0430\u0439\u043b \u0438\u043b\u0438 <b>\u043d\u0430\u0436\u043c\u0438\u0442\u0435</b> \u0434\u043b\u044f \u0432\u044b\u0431\u043e\u0440\u0430</div>';
    html += '<div class="ymt-import-drop-text" style="margin-top:4px;">.txt, .csv, .m3u, .m3u8</div>';
    html += '<input type="file" id="ymt-import-file" accept=".txt,.csv,.m3u,.m3u8,text/plain" style="display:none;">';
    html += '</div>';
    html += '<div id="ymt-import-stats" class="ymt-import-stats"></div>';
    html += '<div id="ymt-import-results" class="ymt-import-list"></div>';
    html += '<div class="ymt-import-actions">';
    html += '<button class="ymt-import-clear" id="ymt-import-clear">\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c</button>';
    html += '<button class="ymt-import-submit" id="ymt-import-submit" disabled>\u0418\u043c\u043f\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c</button>';
    html += '</div>';
    setInnerHTML(root, html);

    var drop = document.getElementById('ymt-import-drop');
    var fileInput = document.getElementById('ymt-import-file');

    drop.addEventListener('click', function () { fileInput.click(); });
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('dragover'); });
    drop.addEventListener('drop', function (e) {
        e.preventDefault();
        drop.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleImportFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', function () {
        if (fileInput.files.length > 0) handleImportFile(fileInput.files[0]);
    });

    document.getElementById('ymt-import-clear').addEventListener('click', function () {
        IMPORT_STATE.parsedTracks = [];
        IMPORT_STATE.searchResults = {};
        IMPORT_STATE.searching = false;
        renderImportView();
    });

    document.getElementById('ymt-import-submit').addEventListener('click', function () {
        importSelectedTracks();
    });

    renderImportResults();
}

function handleImportFile(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
        var text = e.target.result || '';
        var lines = text.split(/\r?\n/);
        var tracks = [];
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;
            var parsed = parseTrackLine(line);
            if (parsed) tracks.push(parsed);
        }
        if (tracks.length === 0) {
            fireErrorSwal('\u0422\u0440\u0435\u043a\u0438 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u044b. \u0424\u043e\u0440\u043c\u0430\u003a "Artist - Title"');
            return;
        }
        IMPORT_STATE.modalTitle = '\u0418\u043c\u043f\u043e\u0440\u0442 \u0438\u0437 \u00ab' + file.name + '\u00bb';
        var titleEl = document.querySelector('.swal2-title');
        if (titleEl) titleEl.textContent = IMPORT_STATE.modalTitle;
        IMPORT_STATE.parsedTracks = tracks;
        IMPORT_STATE.searchResults = {};
        IMPORT_STATE.searching = false;
        renderImportResults();
        searchImportTracks();
    };
    reader.readAsText(file);
}

function parseTrackLine(line) {
    line = line.replace(/^\d+[\.\)]\s*/, '').trim();
    if (!line) return null;

    var separators = [' \u2014 ', ' \u2013 ', ' - ', ' \u2015 ', ' — ', ' – '];
    for (var i = 0; i < separators.length; i++) {
        var idx = line.indexOf(separators[i]);
        if (idx > 0) {
            return {
                artist: line.substring(0, idx).trim(),
                title: line.substring(idx + separators[i].length).trim(),
                query: line,
            };
        }
    }

    var dashIdx = line.indexOf('-');
    if (dashIdx > 0) {
        return {
            artist: line.substring(0, dashIdx).trim(),
            title: line.substring(dashIdx + 1).trim(),
            query: line,
        };
    }

    return { artist: '', title: line, query: line };
}

function searchImportTracks() {
    if (IMPORT_STATE.searching) return;
    IMPORT_STATE.searching = true;

    var tracks = IMPORT_STATE.parsedTracks;
    var idx = 0;

    function searchNext() {
        if (idx >= tracks.length) {
            IMPORT_STATE.searching = false;
            renderImportResults();
            updateImportSubmitState();
            return;
        }

        var track = tracks[idx];
        var query = track.artist ? (track.artist + ' ' + track.title) : track.title;
        var domain = location.hostname.split('.')[2];
        var url = 'https://api.music.yandex.' + domain + '/search?type=track&text=' + encodeURIComponent(query) + '&page=0&nocorrect=false';

        renderImportResults();

        requestGET(url, function (response) {
            try {
                var results = response.result.tracks.results;
                if (results && results.length > 0) {
                    var best = results[0];
                    var artists = [];
                    if (best.artists) {
                        for (var j = 0; j < best.artists.length; j++) {
                            if (best.artists[j].name) artists.push(best.artists[j].name);
                        }
                    }
                    IMPORT_STATE.searchResults[idx] = {
                        found: true,
                        id: best.id,
                        title: best.title || '',
                        artists: artists,
                        coverUrl: getTrackCoverUrl(best),
                    };
                } else {
                    IMPORT_STATE.searchResults[idx] = { found: false };
                }
            } catch (e) {
                IMPORT_STATE.searchResults[idx] = { found: false };
            }
            idx++;
            renderImportResults();
            updateImportSubmitState();
            setTimeout(searchNext, 100);
        });
    }

    searchNext();
}

function renderImportResults() {
    var container = document.getElementById('ymt-import-results');
    if (!container) return;

    var tracks = IMPORT_STATE.parsedTracks;
    var statsEl = document.getElementById('ymt-import-stats');

    if (tracks.length === 0) {
        container.innerHTML = '';
        if (statsEl) statsEl.textContent = '';
        return;
    }

    var foundCount = 0;
    var html = '';
    for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        var result = IMPORT_STATE.searchResults[i];
        var isFound = result && result.found;
        if (isFound) foundCount++;

        var statusClass = isFound ? 'ok' : (result ? 'no' : '');
        var statusIcon = isFound ? '\u2713' : (result ? '\u2717' : '<span style="display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,0.2);border-top-color:#ffff00;border-radius:50%;animation:ymt-spin .6s linear infinite;"></span>');

        var coverHtml = '';
        if (isFound && result.coverUrl) {
            coverHtml = '<img class="ymt-import-result-cover" src="' + escapeAttr(result.coverUrl) + '">';
        } else {
            coverHtml = '<div class="ymt-import-result-cover"></div>';
        }

        var titleText = isFound ? result.title : track.title;
        var artistText = isFound ? result.artists.join(', ') : track.artist;
        var queryText = isFound ? '' : '<div class="ymt-import-result-query">' + escapeHtml(track.query) + '</div>';

        html += '<div class="ymt-import-result' + (isFound ? ' found' : ' notfound') + '" data-index="' + i + '">';
        html += coverHtml;
        html += '<div class="ymt-import-result-info">';
        html += '<div class="ymt-import-result-title">' + escapeHtml(titleText) + '</div>';
        html += '<div class="ymt-import-result-artist">' + escapeHtml(artistText) + '</div>';
        html += queryText;
        html += '</div>';
        html += '<div class="ymt-import-result-status ' + statusClass + '">' + statusIcon + '</div>';
        html += '</div>';
    }
    setInnerHTML(container, html);

    if (statsEl) {
        if (IMPORT_STATE.searching) {
            statsEl.textContent = '\u041f\u043e\u0438\u0441\u043a... ' + foundCount + '/' + tracks.length + ' \u043d\u0430\u0439\u0434\u0435\u043d\u043e';
        } else {
            statsEl.textContent = '\u041d\u0430\u0439\u0434\u0435\u043d\u043e: ' + foundCount + ' \u0438\u0437 ' + tracks.length;
        }
    }
}

function updateImportSubmitState() {
    var btn = document.getElementById('ymt-import-submit');
    if (!btn) return;
    var foundCount = 0;
    var keys = Object.keys(IMPORT_STATE.searchResults);
    for (var i = 0; i < keys.length; i++) {
        if (IMPORT_STATE.searchResults[keys[i]].found) foundCount++;
    }
    btn.disabled = foundCount === 0;
    btn.textContent = foundCount > 0
        ? '\u0418\u043c\u043f\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c (' + foundCount + ')'
        : '\u0418\u043c\u043f\u043e\u0440\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c';
}

function importSelectedTracks() {
    var trackIds = [];
    var keys = Object.keys(IMPORT_STATE.searchResults);
    for (var i = 0; i < keys.length; i++) {
        var idx = parseInt(keys[i], 10);
        var result = IMPORT_STATE.searchResults[idx];
        if (result && result.found && result.id) {
            trackIds.push(result.id);
        }
    }
    if (trackIds.length === 0) return;

    var target = IMPORT_STATE.targetPlaylist;
    addTracksToPlaylist(target, trackIds, function () {
        IMPORT_STATE.parsedTracks = [];
        IMPORT_STATE.searchResults = {};
        IMPORT_STATE.searching = false;
        Swal.close();
        setTimeout(function () { location.reload(); }, 500);
    });
}
