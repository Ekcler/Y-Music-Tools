var ADD_STYLE_ID = 'ymt-add-style';

function ensureAddStyle() {
    if (document.getElementById(ADD_STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = ADD_STYLE_ID;
    s.textContent = [
        '.ymt-add-search { width: 100%; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.15); border-radius: 14px; background: rgba(255,255,255,0.06); color: #fff; font-size: 14px; outline: none; box-sizing: border-box; margin-bottom: 10px; }',
        '.ymt-add-search:focus { border-color: rgba(255,255,255,0.3); }',
        '.ymt-add-search::placeholder { color: rgba(255,255,255,0.4); }',
        '.ymt-add-track { display: flex; align-items: center; padding: 6px 8px; border-radius: 12px; transition: background 0.15s; gap: 10px; border: 1px solid transparent; min-width: 0; }',
        '.ymt-add-track:hover { background: rgba(255,255,255,0.08); }',
        '.ymt-add-track.selected { background: rgba(255,255,0,0.12); border-color: rgba(255,255,0,0.3); }',
        '.ymt-add-track-cover { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: rgba(255,255,255,0.08); }',
        '.ymt-add-track-info { overflow: hidden; flex: 1; min-width: 0; }',
        '.ymt-add-track-title { font-size: 14px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
        '.ymt-add-track-artist { font-size: 12px; color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
        '.ymt-add-track-add { width: 32px; height: 32px; min-width: 32px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: rgba(255,255,255,0.6); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px; transition: all 0.15s; }',
        '.ymt-add-track-add:hover { background: rgba(255,255,0,0.2); border-color: #ffff00; color: #ffff00; }',
        '.ymt-add-track-add.added { background: #ffff00; border-color: #ffff00; color: #000; }',
        '.ymt-add-playlist { display: flex; align-items: center; padding: 10px 12px; border-radius: 12px; cursor: pointer; transition: background 0.15s; gap: 10px; }',
        '.ymt-add-playlist:hover { background: rgba(255,255,255,0.08); }',
        '.ymt-add-playlist-cover { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: rgba(255,255,255,0.08); }',
        '.ymt-add-playlist-info { overflow: hidden; flex: 1; min-width: 0; }',
        '.ymt-add-playlist-title { font-size: 14px; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
        '.ymt-add-playlist-count { font-size: 12px; color: rgba(255,255,255,0.4); flex-shrink: 0; }',
        '.ymt-add-list { max-height: 340px; overflow-y: auto; }',
        '.ymt-add-existing { max-height: 400px; overflow-y: auto; }',
        '.ymt-add-empty { padding: 20px; text-align: center; color: rgba(255,255,255,0.4); font-size: 13px; }',
        '.ymt-add-submit { width: 100%; padding: 10px; border-radius: 12px; border: none; background: #ffff00; color: #000; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 10px; transition: background 0.15s; }',
        '.ymt-add-submit:hover { background: #e6e600; }',
        '.ymt-add-submit:disabled { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); cursor: default; }',
        '.ymt-add-section-label { font-size: 11px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 4px 4px; margin-top: 4px; }',
        '.ymt-add-track-existing { cursor: default; opacity: 0.7; }',
        '.ymt-add-track-num { font-size: 12px; color: rgba(255,255,255,0.3); width: 20px; text-align: right; flex-shrink: 0; }',
        '.ymt-add-back { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; color: rgba(255,255,255,0.6); font-size: 13px; margin-bottom: 8px; background: none; border: none; padding: 0; }',
        '.ymt-add-back:hover { color: #fff; }',
        '.ymt-add-list::-webkit-scrollbar { width: 4px; }',
        '.ymt-add-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }',
        '.ymt-add-playlist-overlap { font-size: 11px; color: #ffff00; white-space: nowrap; flex-shrink: 0; display: flex; align-items: center; gap: 3px; }',
        '.ymt-add-playlist-overlap-check { font-size: 14px; }',
    ].join('\n');
    document.head.appendChild(s);
}

var ADD_STATE = {
    mode: 'browse',
    playlists: [],
    currentPlaylist: null,
    searchResults: [],
    selectedTrackIds: {},
    searchTimeout: null,
    lastQuery: '',
    existingTracks: [],
    playlistTrackCache: {},
    playlistOverlap: {},
};

function getCurrentPagePlaylist() {
    try {
        var metaRaw = document.documentElement.getAttribute('data-ymt-playlist-meta');
        if (metaRaw) {
            var meta = JSON.parse(metaRaw);
            if (meta.kind && meta.ownerUid && !isUuidKind(String(meta.kind))) {
                return { owner: meta.ownerUid, kind: meta.kind, title: meta.title || '' };
            }
        }
    } catch (e) {}

    var args = getArgsByLocation();
    if (!args.owner && !args.kind) return null;
    var kindVal = args.kind;
    if (!kindVal) return null;

    if (isUuidKind(String(kindVal))) return null;

    var ownerVal = args.owner || uid;
    return { owner: ownerVal, kind: kindVal, title: '' };
}

function onClickAddToPlaylist() {
    closeDropdownAll();
    ensureAddStyle();

    var targetPlaylist = getCurrentPagePlaylist();

    if (targetPlaylist) {
        startAddFlow(targetPlaylist);
        return;
    }

    var args = getArgsByLocation();
    if (!uid) {
        refreshSign(function () { resolveAndStart(args); });
    } else {
        resolveAndStart(args);
    }
}

function resolveAndStart(args) {
    var domain = location.hostname.split('.')[2];
    var pageTitle = document.title.replace(/\s*[-–—]\s*Яндекс\s*Музыка\s*$/i, '').trim();

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
            startAddFlow(matched);
        } else {
            fireErrorSwal('\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u044c \u043f\u043b\u0435\u0439\u0431\u043b\u0438\u0441\u0442');
        }
    });
}

function startAddFlow(targetPlaylist) {
    ADD_STATE.mode = 'browse';
    ADD_STATE.playlists = [];
    ADD_STATE.currentPlaylist = null;
    ADD_STATE.searchResults = [];
    ADD_STATE.selectedTrackIds = {};
    ADD_STATE.lastQuery = '';
    ADD_STATE.existingTracks = [];

    function go() {
        ADD_STATE.targetPlaylist = targetPlaylist;
        loadPlaylistTitle(targetPlaylist, function (title) {
            targetPlaylist.title = title;
            loadPlaylists(function (playlists) {
                ADD_STATE.playlists = playlists;
                showAddModal();
            });
        });
    }

    if (!uid) {
        refreshSign(go);
    } else {
        go();
    }
}

function loadPlaylistTitle(pl, callback) {
    var domain = location.hostname.split('.')[2];
    var url = getPlaylistApiBase(domain, pl.owner, pl.kind);
    requestGET(url, function (response) {
        var title = '';
        try {
            var result = response.result || response;
            title = result.title || '';
        } catch (e) {}
        callback(title || '\u041f\u043b\u0435\u0439\u043b\u0438\u0441\u0442');
    });
}

function loadPlaylists(callback) {
    var domain = location.hostname.split('.')[2];
    var url = 'https://api.music.yandex.' + domain + '/users/' + uid + '/playlists/list';

    requestGET(url, function (response) {
        var playlists = [];
        if (response && response.result) {
            var items = response.result;
            for (var i = 0; i < items.length; i++) {
                var pl = items[i];
                if (pl.kind == 3) continue;
                if (pl.title === '\u041d\u043e\u0432\u044b\u0439 \u043f\u043b\u0435\u0439\u043b\u0438\u0441\u0442') continue;
                var coverUrl = '';
                if (pl.cover && pl.cover.uri) {
                    coverUrl = makeCoverUrlSize(pl.cover.uri, '200x200');
                } else if (pl.ogImage) {
                    coverUrl = makeCoverUrlSize(pl.ogImage, '200x200');
                }
                playlists.push({
                    owner: pl.owner && pl.owner.uid ? pl.owner.uid : uid,
                    kind: pl.kind,
                    title: pl.title || '\u041f\u043b\u0435\u0439\u043b\u0438\u0441\u0442',
                    trackCount: pl.trackCount || 0,
                    coverUrl: coverUrl,
                });
            }
        }
        callback(playlists);
    });
}

function showAddModal() {
    var target = ADD_STATE.targetPlaylist;
    Swal.fire({
        title: target.title,
        html: '<div id="ymt-add-root" style="text-align:left;"></div>',
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: '\u0417\u0430\u043a\u0440\u044b\u0442\u044c',
        width: 500,
        didOpen: function () {
            renderAddView();
        },
    });
}

function renderAddView() {
    var root = document.getElementById('ymt-add-root');
    if (!root) return;
    if (ADD_STATE.mode === 'browse') {
        renderBrowseMode(root);
    } else {
        renderPlaylistMode(root);
    }
}

function renderBrowseMode(root) {
    var html = '';
    html += '<input id="ymt-add-search" class="ymt-add-search" placeholder="\u041f\u043e\u0438\u0441\u043a \u0442\u0440\u0435\u043a\u043e\u0432..." autocomplete="off">';
    html += '<div id="ymt-add-results" class="ymt-add-list"></div>';

    var selectedCount = Object.keys(ADD_STATE.selectedTrackIds).length;
    var btnDisabled = selectedCount === 0 ? ' disabled' : '';
    html += '<button class="ymt-add-submit" id="ymt-add-submit"' + btnDisabled + '>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c' + (selectedCount > 0 ? ' (' + selectedCount + ')' : '') + '</button>';

    html += '<div class="ymt-add-section-label">\u041f\u043b\u0435\u0439\u043b\u0438\u0441\u0442\u044b</div>';
    html += '<div id="ymt-add-playlists" class="ymt-add-list"></div>';
    setInnerHTML(root, html);

    renderSearchResults(document.getElementById('ymt-add-results'));
    renderPlaylistsList(document.getElementById('ymt-add-playlists'));

    var searchInput = document.getElementById('ymt-add-search');
    searchInput.addEventListener('input', function () {
        clearTimeout(ADD_STATE.searchTimeout);
        var q = searchInput.value.trim();
        ADD_STATE.lastQuery = q;
        if (q.length < 2) {
            ADD_STATE.searchResults = [];
            renderSearchResults(document.getElementById('ymt-add-results'));
            return;
        }
        ADD_STATE.searchTimeout = setTimeout(function () {
            searchGlobalTracks(q);
        }, 300);
    });

    var submitBtn = document.getElementById('ymt-add-submit');
    if (submitBtn) {
        submitBtn.addEventListener('click', function () {
            var ids = Object.keys(ADD_STATE.selectedTrackIds).map(Number);
            if (ids.length === 0) return;
            var target = ADD_STATE.targetPlaylist;
            addTracksToPlaylist(target, ids, function () {
                ADD_STATE.selectedTrackIds = {};
                renderSearchResults(document.getElementById('ymt-add-results'));
                var btn = document.getElementById('ymt-add-submit');
                if (btn) {
                    btn.textContent = '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c';
                    btn.disabled = true;
                }
            });
        });
    }
}

function renderPlaylistMode(root) {
    var pl = ADD_STATE.currentPlaylist;
    var html = '';
    html += '<button class="ymt-add-back" id="ymt-add-back-btn">\u2190 \u041d\u0430\u0437\u0430\u0434</button>';
    html += '<div style="font-size:15px;color:#fff;margin-bottom:8px;font-weight:600;">' + escapeHtml(pl.title) + '</div>';
    html += '<div id="ymt-add-existing" class="ymt-add-existing"></div>';
    html += '<div class="ymt-add-section-label">\u041f\u043e\u0438\u0441\u043a \u0432 \u043f\u043b\u0435\u0439\u043b\u0438\u0441\u0442\u0435</div>';
    html += '<input id="ymt-add-search" class="ymt-add-search" placeholder="\u041f\u043e\u0438\u0441\u043a \u0442\u0440\u0435\u043a\u043e\u0432..." autocomplete="off">';
    html += '<div id="ymt-add-results" class="ymt-add-list"></div>';

    var selectedCount = Object.keys(ADD_STATE.selectedTrackIds).length;
    var btnDisabled = selectedCount === 0 ? ' disabled' : '';
    html += '<button class="ymt-add-submit" id="ymt-add-submit"' + btnDisabled + '>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c' + (selectedCount > 0 ? ' (' + selectedCount + ')' : '') + '</button>';
    setInnerHTML(root, html);

    loadPlaylistTracks(pl, function (tracks) {
        ADD_STATE.existingTracks = tracks;
        renderExistingTracks(document.getElementById('ymt-add-existing'), tracks);
    });

    renderSearchResults(document.getElementById('ymt-add-results'));

    document.getElementById('ymt-add-back-btn').addEventListener('click', function () {
        ADD_STATE.mode = 'browse';
        ADD_STATE.currentPlaylist = null;
        ADD_STATE.searchResults = [];
        ADD_STATE.lastQuery = '';
        renderAddView();
    });

    var searchInput = document.getElementById('ymt-add-search');
    searchInput.addEventListener('input', function () {
        clearTimeout(ADD_STATE.searchTimeout);
        var q = searchInput.value.trim();
        ADD_STATE.lastQuery = q;
        if (q.length < 2) {
            ADD_STATE.searchResults = [];
            renderSearchResults(document.getElementById('ymt-add-results'));
            return;
        }
        ADD_STATE.searchTimeout = setTimeout(function () {
            searchPlaylistTracks(pl, q);
        }, 300);
    });

    var submitBtn = document.getElementById('ymt-add-submit');
    if (submitBtn) {
        submitBtn.addEventListener('click', function () {
            var ids = Object.keys(ADD_STATE.selectedTrackIds).map(Number);
            if (ids.length === 0) return;
            var target = ADD_STATE.targetPlaylist;
            addTracksToPlaylist(target, ids, function () {
                ADD_STATE.selectedTrackIds = {};
                ADD_STATE.searchResults = [];
                ADD_STATE.lastQuery = '';
                searchInput.value = '';
                renderSearchResults(document.getElementById('ymt-add-results'));
                loadPlaylistTracks(pl, function (tracks) {
                    ADD_STATE.existingTracks = tracks;
                    renderExistingTracks(document.getElementById('ymt-add-existing'), tracks);
                });
                var btn = document.getElementById('ymt-add-submit');
                if (btn) {
                    btn.textContent = '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c';
                    btn.disabled = true;
                }
            });
        });
    }
}

function renderPlaylistsList(container) {
    if (!container) return;
    var playlists = ADD_STATE.playlists;

    if (playlists.length === 0) {
        container.innerHTML = '<div class="ymt-add-empty">\u041d\u0435\u0442 \u043f\u043b\u0435\u0439\u043b\u0438\u0441\u0442\u043e\u0432</div>';
        return;
    }

    var html = '';
    for (var i = 0; i < playlists.length; i++) {
        var pl = playlists[i];
        var coverImg = pl.coverUrl
            ? '<img class="ymt-add-playlist-cover" src="' + escapeAttr(pl.coverUrl) + '">'
            : '<div class="ymt-add-playlist-cover"></div>';
        var overlapCount = ADD_STATE.playlistOverlap[pl.owner + ':' + pl.kind] || 0;
        var selectedCount = Object.keys(ADD_STATE.selectedTrackIds).length;
        var overlapHtml = '';
        if (overlapCount > 0 && selectedCount > 0) {
            overlapHtml = '<div class="ymt-add-playlist-overlap"><span class="ymt-add-playlist-overlap-check">\u2713</span>' + overlapCount + '/' + selectedCount + '</div>';
        }
        html += '<div class="ymt-add-playlist" data-index="' + i + '">'
            + coverImg
            + '<div class="ymt-add-playlist-info">'
            + '<div class="ymt-add-playlist-title">' + escapeHtml(pl.title) + '</div>'
            + '</div>'
            + overlapHtml
            + '<div class="ymt-add-playlist-count">' + pl.trackCount + '</div>'
            + '</div>';
    }
    container.innerHTML = html;

    container.onclick = function (e) {
        var el = e.target.closest('.ymt-add-playlist');
        if (el) {
            var idx = parseInt(el.getAttribute('data-index'), 10);
            ADD_STATE.mode = 'playlist';
            ADD_STATE.currentPlaylist = playlists[idx];
            ADD_STATE.searchResults = [];
            ADD_STATE.lastQuery = '';
            renderAddView();
        }
    };
}

function checkPlaylistsOverlap() {
    var selectedIds = Object.keys(ADD_STATE.selectedTrackIds).map(Number);
    if (selectedIds.length === 0) {
        ADD_STATE.playlistOverlap = {};
        var plContainer = document.getElementById('ymt-add-playlists');
        if (plContainer) renderPlaylistsList(plContainer);
        return;
    }
    var selectedSet = {};
    for (var i = 0; i < selectedIds.length; i++) selectedSet[selectedIds[i]] = true;

    var playlists = ADD_STATE.playlists;
    var pending = 0;
    var anyLoaded = false;

    for (var p = 0; p < playlists.length; p++) {
        (function (pl) {
            var key = pl.owner + ':' + pl.kind;
            if (ADD_STATE.playlistTrackCache[key]) {
                computeOverlap(key, selectedSet, selectedIds.length);
                anyLoaded = true;
                return;
            }
            pending++;
            loadPlaylistTracks(pl, function (tracks) {
                var idSet = {};
                for (var i = 0; i < tracks.length; i++) idSet[tracks[i].id] = true;
                ADD_STATE.playlistTrackCache[key] = idSet;
                computeOverlap(key, selectedSet, selectedIds.length);
                pending--;
                if (pending === 0) {
                    var plContainer = document.getElementById('ymt-add-playlists');
                    if (plContainer) renderPlaylistsList(plContainer);
                }
            });
        })(playlists[p]);
    }

    if (pending === 0) {
        var plContainer = document.getElementById('ymt-add-playlists');
        if (plContainer) renderPlaylistsList(plContainer);
    }
}

function computeOverlap(cacheKey, selectedSet, totalSelected) {
    var cached = ADD_STATE.playlistTrackCache[cacheKey];
    if (!cached) { ADD_STATE.playlistOverlap[cacheKey] = 0; return; }
    var count = 0;
    var ids = Object.keys(selectedSet);
    for (var i = 0; i < ids.length; i++) {
        if (cached[ids[i]]) count++;
    }
    ADD_STATE.playlistOverlap[cacheKey] = count;
}

function renderSearchResults(container) {
    if (!container) return;
    var tracks = ADD_STATE.searchResults;

    if (tracks.length === 0) {
        if (ADD_STATE.lastQuery.length >= 2) {
            container.innerHTML = '<div class="ymt-add-empty">\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u043e</div>';
        } else {
            container.innerHTML = ADD_STATE.mode === 'browse'
                ? '<div class="ymt-add-empty">\u041d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0442\u0440\u0435\u043a\u0430 \u0438\u043b\u0438 \u0430\u0440\u0442\u0438\u0441\u0442\u0430</div>'
                : '';
        }
        return;
    }

    var html = '';
    for (var i = 0; i < tracks.length; i++) {
        var t = tracks[i];
        var artist = t.artists.join(', ');
        var coverImg = t.coverUrl
            ? '<img class="ymt-add-track-cover" src="' + escapeAttr(t.coverUrl) + '">'
            : '<div class="ymt-add-track-cover"></div>';
        var isAdded = ADD_STATE.selectedTrackIds[t.id];
        var btnClass = 'ymt-add-track-add' + (isAdded ? ' added' : '');
        var btnText = isAdded ? '\u2713' : '+';
        html += '<div class="ymt-add-track' + (isAdded ? ' selected' : '') + '" data-id="' + t.id + '">'
            + coverImg
            + '<div class="ymt-add-track-info">'
            + '<div class="ymt-add-track-title">' + escapeHtml(t.title) + '</div>'
            + '<div class="ymt-add-track-artist">' + escapeHtml(artist) + '</div>'
            + '</div>'
            + '<button class="' + btnClass + '" data-id="' + t.id + '">' + btnText + '</button>'
            + '</div>';
    }
    container.innerHTML = html;

    container.onclick = function (e) {
        var btn = e.target.closest('.ymt-add-track-add');
        if (btn) {
            var id = parseInt(btn.getAttribute('data-id'), 10);
            if (ADD_STATE.selectedTrackIds[id]) {
                delete ADD_STATE.selectedTrackIds[id];
            } else {
                ADD_STATE.selectedTrackIds[id] = true;
            }
            renderSearchResults(container);
            if (ADD_STATE.mode === 'browse') checkPlaylistsOverlap();
            var selectedCount = Object.keys(ADD_STATE.selectedTrackIds).length;
            var submitBtn = document.getElementById('ymt-add-submit');
            if (submitBtn) {
                submitBtn.textContent = '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c' + (selectedCount > 0 ? ' (' + selectedCount + ')' : '');
                submitBtn.disabled = selectedCount === 0;
            }
        }
    };
}

function renderExistingTracks(container, tracks) {
    if (!container) return;

    if (tracks.length === 0) {
        container.innerHTML = '<div class="ymt-add-empty">\u041f\u043b\u0435\u0439\u0431\u043b\u0438\u0441\u0442 \u043f\u0443\u0441\u0442</div>';
        return;
    }

    var html = '';
    for (var i = 0; i < tracks.length; i++) {
        var t = tracks[i];
        var artist = t.artists.join(', ');
        var coverImg = t.coverUrl
            ? '<img class="ymt-add-track-cover" src="' + escapeAttr(t.coverUrl) + '">'
            : '<div class="ymt-add-track-cover"></div>';
        var isAdded = ADD_STATE.selectedTrackIds[t.id];
        var btnClass = 'ymt-add-track-add' + (isAdded ? ' added' : '');
        var btnText = isAdded ? '\u2713' : '+';
        html += '<div class="ymt-add-track' + (isAdded ? ' selected' : '') + '" data-id="' + t.id + '">'
            + '<span class="ymt-add-track-num">' + (i + 1) + '</span>'
            + coverImg
            + '<div class="ymt-add-track-info">'
            + '<div class="ymt-add-track-title">' + escapeHtml(t.title) + '</div>'
            + '<div class="ymt-add-track-artist">' + escapeHtml(artist) + '</div>'
            + '</div>'
            + '<button class="' + btnClass + '" data-id="' + t.id + '">' + btnText + '</button>'
            + '</div>';
    }
    container.innerHTML = html;

    container.onclick = function (e) {
        var btn = e.target.closest('.ymt-add-track-add');
        if (btn) {
            var id = parseInt(btn.getAttribute('data-id'), 10);
            if (ADD_STATE.selectedTrackIds[id]) {
                delete ADD_STATE.selectedTrackIds[id];
            } else {
                ADD_STATE.selectedTrackIds[id] = true;
            }
            renderExistingTracks(container, tracks);
            var selectedCount = Object.keys(ADD_STATE.selectedTrackIds).length;
            var submitBtn = document.getElementById('ymt-add-submit');
            if (submitBtn) {
                submitBtn.textContent = '\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c' + (selectedCount > 0 ? ' (' + selectedCount + ')' : '');
                submitBtn.disabled = selectedCount === 0;
            }
        }
    };
}

function searchGlobalTracks(query) {
    var domain = location.hostname.split('.')[2];
    var url = 'https://api.music.yandex.' + domain + '/search?type=track&text=' + encodeURIComponent(query) + '&page=0&nocorrect=false';

    requestGET(url, function (response) {
        var tracks = [];
        try {
            var raw = response.result.tracks.results;
            for (var i = 0; i < Math.min(raw.length, 20); i++) {
                var t = raw[i];
                var artists = [];
                if (t.artists) {
                    for (var j = 0; j < t.artists.length; j++) {
                        artists.push(t.artists[j].name || '');
                    }
                }
                tracks.push({
                    id: t.id,
                    title: t.title || '',
                    artists: artists,
                    coverUrl: getTrackCoverUrl(t),
                });
            }
        } catch (e) {}

        ADD_STATE.searchResults = tracks;
        var container = document.getElementById('ymt-add-results');
        if (container) renderSearchResults(container);
    });
}

function searchPlaylistTracks(pl, query) {
    var domain = location.hostname.split('.')[2];
    var url = getPlaylistApiBase(domain, pl.owner, pl.kind) + '?richTracks=true';

    requestGET(url, function (response) {
        var tracks = [];
        var q = query.toLowerCase();
        try {
            var result = response.result || response;
            if (result.tracks) {
                for (var i = 0; i < result.tracks.length; i++) {
                    var t = result.tracks[i].track || result.tracks[i];
                    var artists = [];
                    if (t.artists) {
                        for (var j = 0; j < t.artists.length; j++) {
                            artists.push(t.artists[j].name || '');
                        }
                    }
                    var artistStr = artists.join(', ').toLowerCase();
                    var titleStr = (t.title || '').toLowerCase();
                    if (titleStr.indexOf(q) !== -1 || artistStr.indexOf(q) !== -1) {
                        tracks.push({
                            id: t.id,
                            title: t.title || '',
                            artists: artists,
                            coverUrl: getTrackCoverUrl(t),
                        });
                    }
                }
            }
        } catch (e) {}

        ADD_STATE.searchResults = tracks;
        var container = document.getElementById('ymt-add-results');
        if (container) renderSearchResults(container);
    });
}

function loadPlaylistTracks(pl, callback) {
    var domain = location.hostname.split('.')[2];
    var url = getPlaylistApiBase(domain, pl.owner, pl.kind) + '?richTracks=true';

    requestGET(url, function (response) {
        var tracks = [];
        try {
            var result = response.result || response;
            if (result.tracks) {
                for (var i = 0; i < result.tracks.length; i++) {
                    var t = result.tracks[i].track || result.tracks[i];
                    var artists = [];
                    if (t.artists) {
                        for (var j = 0; j < t.artists.length; j++) {
                            artists.push(t.artists[j].name || '');
                        }
                    }
                    tracks.push({
                        id: t.id,
                        title: t.title || '',
                        artists: artists,
                        coverUrl: getTrackCoverUrl(t),
                    });
                }
            }
        } catch (e) {}
        callback(tracks);
    });
}

function isUuidKind(kind) {
    return typeof kind === 'string' && kind.indexOf('-') !== -1;
}

function getPlaylistApiBase(domain, owner, kind) {
    if (isUuidKind(kind)) {
        return 'https://api.music.yandex.' + domain + '/playlists/' + kind;
    }
    return 'https://api.music.yandex.' + domain + '/users/' + owner + '/playlists/' + kind;
}

function addTracksToPlaylist(playlist, trackIds, callback) {
    var domain = location.hostname.split('.')[2];
    var baseUrl = getPlaylistApiBase(domain, playlist.owner, playlist.kind);

    requestGET(baseUrl, function (playlistData) {
        var revision = 0;
        var existingCount = playlist.trackCount || 0;
        try {
            var result = playlistData.result || playlistData;
            if (typeof result.revision === 'number') revision = result.revision;
            if (result.tracks) existingCount = result.tracks.length;
            else if (typeof result.trackCount === 'number') existingCount = result.trackCount;
        } catch (e) { console.error('Y-Music-Tools: failed to read playlist data', e); }

        var tracks = [];
        for (var i = 0; i < trackIds.length; i++) {
            tracks.push({ id: trackIds[i] });
        }
        var diff = [{ op: 'insert', at: existingCount, tracks: tracks }];
        var body = 'diff=' + encodeURIComponent(JSON.stringify(diff)) + '&revision=' + revision;

        var postUrl = baseUrl + '/change-relative';
        requestPOST(postUrl, body, function (response) {
            if (response && response.result) {
                fireInfoSwal('\u0422\u0440\u0435\u043a\u0438 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u044b \u0432 \u00ab' + playlist.title + '\u00bb');
                if (callback) callback();
            } else {
                console.error('Y-Music-Tools: addTracksToPlaylist failed', response);
                fireErrorSwal('\u041e\u0448\u0438\u0431\u043a\u0430 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u0438\u044f');
            }
        });
    });
}

function makeCoverUrl(uri) {
    if (!uri) return '';
    if (uri.startsWith('//')) return 'https:' + uri;
    if (uri.startsWith('http')) return uri;
    return 'https://' + uri;
}

function makeCoverUrlSize(uri, size) {
    var url = makeCoverUrl(uri);
    if (url && size) {
        url = url.replace('%%', size);
    }
    return url;
}

function getTrackCoverUrl(track) {
    if (track.albums && track.albums.length > 0) {
        var album = track.albums[0];
        if (album.coverUri) return makeCoverUrlSize(album.coverUri, '200x200');
        if (album.cover && album.cover.uri) return makeCoverUrlSize(album.cover.uri, '200x200');
    }
    if (track.album && track.album.coverUri) return makeCoverUrlSize(track.album.coverUri, '200x200');
    if (track.album && track.album.cover && track.album.cover.uri) return makeCoverUrlSize(track.album.cover.uri, '200x200');
    if (track.cover && track.cover.uri) return makeCoverUrlSize(track.cover.uri, '200x200');
    return '';
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
