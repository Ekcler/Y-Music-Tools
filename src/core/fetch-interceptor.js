(function () {
    'use strict';

    window.__ymtFetchInt = true;

    var API_HOST_RE = /^api\.music\.yandex\.(ru|net|kz|by|com|uz|ua)$/i;
    var WAVE_FILTER_KEY = 'ymtWaveFilterLiked';
    var WAVE_SESSION_KEY = 'ymtWaveSid';
    var SESSION_NEW = '/rotor/session/new';
    var SESSION_TRACKS_RE = /^\/rotor\/session\/([^\/]+)\/tracks$/;
    var WAVE_MARKER = 'onyourwave';
    var LIKES_TTL_MS = 10 * 60 * 1000;
    var LIKES_PAGE_SIZE = 100;
    var LIKES_MAX_PAGES = 30;
    var ANTISKIP_KEY = 'ymtAntiSkip';
    var PLAY_LOG_KEY = 'ymtPlayedLog';
    var PLAY_TTL_MS = 48 * 60 * 60 * 1000;
    var PLAY_LOG_MAX = 500;

    var _waveSessionId = null;
    var _uid = null;
    var _likedSet = null;
    var _likedTs = 0;
    var _likesLoading = null;
    var _likesFailTs = 0;
    var LIKES_RETRY_MS = 30 * 1000;

    function apiBase() {
        try {
            return 'https://api.music.yandex.' + location.hostname.split('.')[2];
        } catch (e) {
            return 'https://api.music.yandex.ru';
        }
    }

    function loadWaveSid() {
        try {
            return localStorage.getItem(WAVE_SESSION_KEY) || null;
        } catch (e) {
            return null;
        }
    }

    _waveSessionId = loadWaveSid();

    function isPlaylistUrl(u) {
        try {
            var url = new URL(u, location.href);
            return API_HOST_RE.test(url.hostname) && url.pathname.indexOf('/playlist') !== -1;
        } catch (e) {
            return false;
        }
    }

    function ensureRichTracks(u) {
        try {
            var url = new URL(u, location.href);
            url.searchParams.set('richTracks', 'true');
            return url.toString();
        } catch (e) {
            return u;
        }
    }

    function extractMeta(text) {
        try {
            var json = JSON.parse(text);
            var data = json.result || json;
            if (data && data.kind && typeof data.kind === 'number') {
                var ownerUid = data.owner && data.owner.uid ? data.owner.uid : null;
                if (ownerUid) {
                    document.documentElement.setAttribute('data-ymt-playlist-meta', JSON.stringify({
                        kind: data.kind,
                        ownerUid: ownerUid,
                        title: data.title || '',
                    }));
                }
            }
        } catch (e) {}
    }

    function waveFilterEnabled() {
        try {
            return localStorage.getItem(WAVE_FILTER_KEY) !== 'false';
        } catch (e) {
            return true;
        }
    }

    function antiSkipEnabled() {
        try {
            return localStorage.getItem(ANTISKIP_KEY) !== 'false';
        } catch (e) {
            return true;
        }
    }

    function parseSessionNew(text) {
        try {
            var json = JSON.parse(text);
            var isWave = false;
            var seeds = json.acceptedSeeds || [];
            for (var i = 0; i < seeds.length; i++) {
                if (seeds[i] && seeds[i].tag === WAVE_MARKER) {
                    isWave = true;
                    break;
                }
            }
            if (!isWave && json.descriptionSeed && json.descriptionSeed.tag === WAVE_MARKER) isWave = true;
            return {
                isWave: isWave,
                sessionId: json.radioSessionId || null,
            };
        } catch (e) {
            return {
                isWave: false,
                sessionId: null,
            };
        }
    }

    function getUid() {
        if (_uid) return Promise.resolve(_uid);
        return fetch(apiBase() + '/account/status', { credentials: 'include' })
            .then(function (r) {
                return r.json();
            })
            .then(function (json) {
                try {
                    _uid = json.result.account.uid || json.account.uid || (json.result && json.result.uid) || null;
                } catch (e) {}
                if (!_uid) console.log('[ymt-wave] status resp: ' + JSON.stringify(json).slice(0, 300));
                return _uid;
            })
            .catch(function (err) {
                console.log('[ymt-wave] status failed: ' + (err && err.message));
                return null;
            });
    }

    function collectLikedIds(arr, ids) {
        for (var i = 0; i < arr.length; i++) {
            var t = arr[i];
            if (t && t.id !== undefined && t.id !== null) ids.add(String(t.id));
        }
    }

    function loadLikedTracks(uid) {
        var ids = new Set();
        var page = 0;
        function next() {
            return fetch(apiBase() + '/users/' + uid + '/likes/tracks?page=' + page + '&pageSize=' + LIKES_PAGE_SIZE, { credentials: 'include' })
                .then(function (r) {
                    if (!r.ok) throw new Error('likes http ' + r.status);
                    return r.json();
                })
                .then(function (json) {
                    var arr = [];
                    try {
                        arr = json.result.library.tracks || [];
                    } catch (e) {}
                    collectLikedIds(arr, ids);
                    if (arr.length === 0 || page >= LIKES_MAX_PAGES) return ids;
                    page++;
                    return next();
                });
        }
        return next();
    }

    function ensureLikedSet() {
        if (!waveFilterEnabled()) return Promise.resolve(null);
        if (_likedSet && (Date.now() - _likedTs) < LIKES_TTL_MS) return Promise.resolve(_likedSet);
        if (_likesLoading) return _likesLoading;
        if (_likesFailTs && (Date.now() - _likesFailTs) < LIKES_RETRY_MS) return Promise.resolve(null);
        _likesLoading = getUid().then(function (uid) {
            if (!uid) throw new Error('no uid');
            return loadLikedTracks(uid);
        }).then(function (set) {
            _likedSet = set;
            _likedTs = Date.now();
            _likesLoading = null;
            _likesFailTs = 0;
            return set;
        }, function (err) {
            _likesLoading = null;
            _likesFailTs = Date.now();
            console.log('[ymt-wave] likes load failed: ' + (err && err.message));
            return null;
        });
        return _likesLoading;
    }

    function feedLikedSetFromResponse(text) {
        try {
            var json = JSON.parse(text);
            var arr = json.result && json.result.library && json.result.library.tracks;
            if (!arr || !arr.length) return;
            if (!_likedSet) {
                _likedSet = new Set();
                _likedTs = Date.now();
            }
            var added = 0;
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] && arr[i].id !== undefined && arr[i].id !== null && !_likedSet.has(String(arr[i].id))) {
                    _likedSet.add(String(arr[i].id));
                    added++;
                }
            }
        } catch (e) {}
    }

    function loadPlayLog() {
        try {
            var arr = JSON.parse(localStorage.getItem(PLAY_LOG_KEY) || '[]');
            return Array.isArray(arr) ? arr : [];
        } catch (e) {
            return [];
        }
    }

    function savePlayLog(arr) {
        try {
            localStorage.setItem(PLAY_LOG_KEY, JSON.stringify(arr));
        } catch (e) {}
    }

    function touchPlayLog(ids) {
        if (!ids || !ids.size) return;
        var now = Date.now();
        var map = {};
        var arr = loadPlayLog();
        for (var i = 0; i < arr.length; i++) {
            var e = arr[i];
            if (e && e.id && now - e.ts < PLAY_TTL_MS) map[e.id] = Math.max(map[e.id] || 0, e.ts);
        }
        ids.forEach(function (id) {
            map[id] = now;
        });
        var out = Object.keys(map).map(function (id) {
            return { id: id, ts: map[id] };
        });
        out.sort(function (a, b) {
            return b.ts - a.ts;
        });
        if (out.length > PLAY_LOG_MAX) out = out.slice(0, PLAY_LOG_MAX);
        savePlayLog(out);
    }

    function isRecentlyPlayed(playedLog, id, now) {
        for (var i = 0; i < playedLog.length; i++) {
            if (playedLog[i].id === id && now - playedLog[i].ts < PLAY_TTL_MS) return true;
        }
        return false;
    }

    function bodyToDebug(init) {
        try {
            if (!init || init.body === undefined || init.body === null) return { raw: '', desc: '(no body)' };
            var b = init.body;
            if (typeof b === 'string') return { raw: b, desc: 'string len=' + b.length + ' body=' + b };
            if (b instanceof URLSearchParams) {
                var s = b.toString();
                return { raw: s, desc: 'URLSearchParams len=' + s.length + ' body=' + s };
            }
            if (b instanceof FormData) {
                var entries = [];
                b.forEach(function (v, k) {
                    entries.push(k + '=' + (typeof v === 'string' ? v : (v && v.name) || typeof v));
                });
                var fs = entries.join('&');
                return { raw: fs, desc: 'FormData body=' + fs };
            }
            if (b instanceof Blob) {
                return b.text().then(function (txt) {
                    return { raw: txt, desc: 'Blob len=' + txt.length + ' body=' + txt };
                });
            }
            if (b instanceof Request) {
                return b.clone().text().then(function (txt) {
                    return { raw: txt, desc: 'Request len=' + txt.length + ' body=' + txt };
                }).catch(function (e) {
                    return { raw: '', desc: 'Request-err=' + (e && e.message) };
                });
            }
            if (typeof ReadableStream !== 'undefined' && b instanceof ReadableStream) {
                return b.getReader().read().then(function (res) {
                    var txt = res && res.value ? new TextDecoder().decode(res.value) : '';
                    return { raw: txt, desc: 'Stream len=' + txt.length + ' body=' + txt };
                });
            }
            if (typeof Uint8Array !== 'undefined' && b instanceof Uint8Array) {
                var txt = new TextDecoder().decode(b);
                return { raw: txt, desc: 'Uint8Array len=' + txt.length + ' body=' + txt };
            }
            if (b instanceof ArrayBuffer) {
                var str = String.fromCharCode.apply(null, new Uint8Array(b));
                return { raw: str, desc: 'ArrayBuffer len=' + str.length + ' body=' + str };
            }
            return { raw: '', desc: 'type=' + (b && b.constructor ? b.constructor.name : typeof b) };
        } catch (e) {
            return { raw: '', desc: 'err=' + (e && e.message) };
        }
    }

    function collectPlayedIds(text) {
        var ids = new Set();
        if (!text) return ids;
        try {
            var data = JSON.parse(text);
            var arr = Array.isArray(data) ? data : (data.plays || data.events || [data]);
            for (var i = 0; i < arr.length; i++) {
                var ev = arr[i] || {};
                var tid = ev.trackId !== undefined ? ev.trackId : (ev.id !== undefined ? ev.id : null);
                if (tid === null || tid === undefined) continue;
                var m = String(tid).match(/\d+/);
                if (m) ids.add(m[0]);
            }
        } catch (e) {}
        return ids;
    }

    function filterWaveResponse(text, tag) {
        var likeEnabled = waveFilterEnabled();
        var skipEnabled = antiSkipEnabled();
        if (!likeEnabled && !skipEnabled) return null;
        var json = null;
        try {
            json = JSON.parse(text);
        } catch (e) {
            return null;
        }
        var seq = json && json.sequence;
        if (!Array.isArray(seq) || seq.length === 0) return null;
        var now = Date.now();
        var playedLog = skipEnabled ? loadPlayLog() : null;
        var keep = [];
        var removed = 0;
        var removedSkip = 0;
        for (var i = 0; i < seq.length; i++) {
            var item = seq[i] || {};
            var id = item.track && item.track.id;
            var isLiked = likeEnabled && _likedSet && (item.liked === true || (id !== undefined && id !== null && _likedSet.has(String(id))));
            var isRecent = false;
            if (playedLog && id !== undefined && id !== null) {
                isRecent = isRecentlyPlayed(playedLog, String(id), now);
            }
            if (isLiked || isRecent) {
                removed++;
                if (isRecent) removedSkip++;
                continue;
            }
            keep.push(item);
        }
        if (keep.length === 0) keep = seq.slice(0, 1);
        if (keep.length === seq.length) return null;
        json.sequence = keep;
        return JSON.stringify(json);
    }

    function rebuildResponse(response, text) {
        return new Response(text, {
            status: response.status,
            statusText: response.statusText,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
    }

    function watchResponse(response, path) {
        if (!response || !response.ok) return response;
        if (path.indexOf('/account/status') !== -1) {
            response.clone().text().then(function (text) {
                try {
                    var j = JSON.parse(text);
                    _uid = j.result.account.uid || j.account.uid || (j.result && j.result.uid) || _uid;
                } catch (e) {}
            }).catch(function () {});
        } else if (path.indexOf('/users/') !== -1 && path.indexOf('/likes/tracks') !== -1) {
            var m = path.match(/^\/users\/(\d+)\/likes\/tracks/);
            if (m && m[1] && !_uid) _uid = m[1];
            response.clone().text().then(function (text) {
                feedLikedSetFromResponse(text);
            }).catch(function () {});
        }
        return response;
    }

    ensureLikedSet();

    var origFetch = window.fetch;

    window.fetch = function (input, init) {
        var urlStr = '';
        var method = 'GET';
        try {
            if (typeof input === 'string') urlStr = input;
            else if (input instanceof Request) {
                urlStr = input.url;
                method = input.method || 'GET';
            }
            if (init && init.method) method = init.method.toUpperCase();
        } catch (e) {}

        var path = '';
        var isPlaylist = false;
        var isSessionNew = false;
        var isSessionTracks = false;
        var isPlayEvent = false;
        try {
            path = new URL(urlStr, location.href).pathname;
            isPlaylist = isPlaylistUrl(urlStr) && method === 'GET';
            isSessionNew = path === SESSION_NEW;
            isSessionTracks = !!path.match(SESSION_TRACKS_RE);
            isPlayEvent = method === 'POST' && /\/play/i.test(path) && path.indexOf('/likes') === -1 && path.indexOf('/dislikes') === -1;
        } catch (e) {}

        if (isPlaylist) {
            var newUrl = ensureRichTracks(urlStr);

            if (typeof input === 'string') {
                input = newUrl;
            } else if (input instanceof Request) {
                input = new Request(newUrl, input);
            }

            return origFetch.call(this, input, init).then(function (response) {
                var clone = response.clone();
                clone.text().then(function (text) {
                    extractMeta(text);
                }).catch(function () {});
                return response;
            });
        }

        if (isSessionNew) {
            return origFetch.apply(this, arguments).then(function (response) {
                if (!response || !response.ok) return response;
                return response.clone().text().then(function (text) {
                    var info = parseSessionNew(text);
                    if (info.isWave) {
                        _waveSessionId = info.sessionId;
                        try {
                            localStorage.setItem(WAVE_SESSION_KEY, info.sessionId || '');
                        } catch (e) {}
                    }
                    if (!waveFilterEnabled()) return response;
                    return ensureLikedSet().then(function () {
                        var out = filterWaveResponse(text, 'first');
                        if (!out) return response;
                        return rebuildResponse(response, out);
                    });
                }).catch(function () {
                    return response;
                });
            });
        }

        if (isSessionTracks) {
            return origFetch.apply(this, arguments).then(function (response) {
                if (!response || !response.ok) return response;
                return response.clone().text().then(function (text) {
                    return ensureLikedSet().then(function () {
                        var out = filterWaveResponse(text, 'batch');
                        if (!out) return response;
                        return rebuildResponse(response, out);
                    });
                }).catch(function () {
                    return response;
                });
            });
        }

        if (isPlayEvent) {
            var bodyInfo = bodyToDebug(init);
            var isNoBody = !bodyInfo || (typeof bodyInfo.desc === 'string' && bodyInfo.desc.indexOf('(no body)') !== -1);
            if (isNoBody && input instanceof Request) bodyInfo = bodyToDebug({ body: input });
            return origFetch.apply(this, arguments).then(function (response) {
                var after = function (info) {
                    if (info && info.raw) {
                        var playedIds = collectPlayedIds(info.raw);
                        if (playedIds.size) {
                            touchPlayLog(playedIds);
                        }
                    }
                };
                if (bodyInfo && bodyInfo.then) bodyInfo.then(after);
                else after(bodyInfo);
                return response;
            });
        }

        return origFetch.apply(this, arguments).then(function (response) {
            return watchResponse(response, path);
        });
    };
})();
