var DATE_KEY = 'showTrackDates';
var DATE_CURRENT_STATE = true;

function isDatesEnabled(callback) {
    var val = localStorage.getItem(DATE_KEY);
    callback(val !== 'false');
}

function setDatesEnabled(val, callback) {
    localStorage.setItem(DATE_KEY, val ? 'true' : 'false');
    if (callback) callback();
}

function onClickDatesToggle() {
    var newState = !DATE_CURRENT_STATE;
    DATE_CURRENT_STATE = newState;
    setMenuItemToggle('ymt-dates-title', newState);
    if (newState) {
        startTrackDateInjection();
    } else {
        stopTrackDateInjection();
        document.querySelectorAll('.ymt-release-date').forEach(function(el){el.remove();});
    }
    setDatesEnabled(newState);
}

document.addEventListener('click', onClickOutsideDropdown);

let lastUrl = location.href;

let _savedOrigPush = null;
let _savedOrigReplace = null;

injectSwalDarkTheme();
injectUIFixes();
initUrlObserver();
fillContent('complete');

var _lastPlaylistMeta = null;

setInterval(function () {
    var currentMeta = document.documentElement.getAttribute('data-ymt-playlist-meta') || '';
    if (_lastPlaylistMeta === null) {
        _lastPlaylistMeta = currentMeta;
        return;
    }
    if (currentMeta && currentMeta !== _lastPlaylistMeta) {
        _lastPlaylistMeta = currentMeta;
        _ymtCachedPlaylistData = null;
        document.documentElement.removeAttribute('data-ymt-playlist');
        fetchPlaylistDataForCurrentPage(function () {});
        if (DATE_CURRENT_STATE) {
            stopTrackDateInjection();
            startTrackDateInjection();
        }
    }
}, 700);

function injectSwalDarkTheme() {
    if (document.getElementById('ymt-swal-dark')) return;
    var s = document.createElement('style');
    s.id = 'ymt-swal-dark';
    s.textContent = [
        '.swal2-popup { background: #1d1d1d !important; color: #fff !important; }',
        '.swal2-title { color: #fff !important; }',
        '.swal2-html-container { color: rgba(255,255,255,0.85) !important; }',
        '.swal2-html-container p { color: rgba(255,255,255,0.85) !important; }',
        '.swal2-html-container b { color: #fff !important; }',
        '.swal2-html-container hr { border-color: rgba(255,255,255,0.1) !important; }',
        '.swal2-html-container ol { color: rgba(255,255,255,0.85) !important; }',
        '.swal2-html-container li { color: rgba(255,255,255,0.85) !important; }',
        '.swal2-actions { gap: 8px !important; }',
        '.swal2-styled { border-radius: 8px !important; }',
        '.swal2-confirm { background: #ffff00 !important; color: #000 !important; }',
        '.swal2-confirm:hover { background: #e6e600 !important; }',
        '.swal2-cancel { background: transparent !important; color: rgba(255,255,255,0.7) !important; border: 1px solid rgba(255,255,255,0.15) !important; }',
        '.swal2-cancel:hover { background: rgba(255,255,255,0.08) !important; }',
        '.swal2-input, .swal2-select, .swal2-textarea { background: #282828 !important; color: #fff !important; border: 1px solid rgba(255,255,255,0.15) !important; }',
        '.swal2-input:focus, .swal2-select:focus, .swal2-textarea:focus { border-color: #ffff00 !important; box-shadow: 0 0 0 2px rgba(255,255,0,0.25) !important; }',
        '.swal2-close { color: rgba(255,255,255,0.5) !important; }',
        '.swal2-close:hover { color: #fff !important; }',
        '.swal2-icon { margin-top: 8px !important; }',
        '.swal2-icon.swal2-info { border-color: rgba(255,255,255,0.2) !important; color: #3085d6 !important; }',
        '.swal2-icon.swal2-error { border-color: rgba(255,255,255,0.2) !important; }',
    ].join('\n');
    document.head.appendChild(s);
}

function injectUIFixes() {
    if (document.getElementById('ymt-ui-fixes')) return;
    var s = document.createElement('style');
    s.id = 'ymt-ui-fixes';
    s.textContent = 'footer[class*="Footer_root"]{display:none!important}';
    document.head.appendChild(s);
}

function initUrlObserver() {
    hookHistoryMethods();
    window.addEventListener('popstate', onUrlChange);

    setInterval(function () {
        if (location.href !== lastUrl) {
            onUrlChange();
        }
    }, 500);
}

function hookHistoryMethods() {
    if (!_savedOrigPush) {
        _savedOrigPush = history.pushState;
        _savedOrigReplace = history.replaceState;
    }

    history.pushState = function () {
        _savedOrigPush.apply(this, arguments);
        onUrlChange();
    };
    history.replaceState = function () {
        _savedOrigReplace.apply(this, arguments);
        onUrlChange();
    };
}

function onUrlChange() {
    setTimeout(function () {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            removeDropdown();
            stopTrackDateInjection();
            (function(){var e=document.querySelector('.ymt-jump-arrowbar');if(e)e.style.display='none';var w=document.querySelector('.ymt-jump-wrap');if(w)w.style.display='none';document.querySelectorAll('[class*="SearchPlaylist"]').forEach(function(el){el.style.display='';})})();
            _ymtCachedPlaylistData = null;
            document.documentElement.removeAttribute('data-ymt-playlist');
            fillContent('complete');
        }
    }, 300);
}

function fillContent(message) {
    let response = getAvailableModify();
    if (!response.available) return;

    if (message == 'complete') {
        waitForElementWithObserver(response.key, response.method);
    } else {
        waitElementByKey(response.key, response.method);
    }
}

function waitForElementWithObserver(key, callback) {
    if (findElement(key)) {
        callback(key);
        return;
    }

    let tryCount = 0;
    let observer = new MutationObserver(function () {
        if (findElement(key)) {
            observer.disconnect();
            callback(key);
            return;
        }
        if (++tryCount > 15) {
            observer.disconnect();
        }
    });

    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
    });
}

function waitElementByKey(key, callback) {
    let tryCount = 0;
    let timerId = setInterval(function () {
        if (findElement(key)) {
            clearInterval(timerId);
            callback(key);
        }
        if (++tryCount > 10) {
            clearInterval(timerId);
        }
    }, 1000);
}

function findElement(key) {
    if (typeof key === 'function') return key();
    return document.querySelector(key);
}

var _trackDateTimerId = null;

function startTrackDateInjection() {
    stopTrackDateInjection();
    var tryCount = 0;
    _trackDateTimerId = setInterval(function () {
        if (injectTrackDates()) {
            stopTrackDateInjection();
            return;
        }
        if (++tryCount > 30) {
            stopTrackDateInjection();
        }
    }, 500);
}

function stopTrackDateInjection() {
    if (_trackDateTimerId) {
        clearInterval(_trackDateTimerId);
        _trackDateTimerId = null;
    }
}

function formatAddedDate(ts) {
    if (!ts) return '';
    var d = new Date(ts * 1000);
    var day = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    return (day < 10 ? '0' : '') + day + '.' + (month < 10 ? '0' : '') + month + '.' + year;
}

function injectTrackDates() {
    if (!DATE_CURRENT_STATE) return false;
    var data = readInterceptedData();
    if (!data || !data.tracks || data.tracks.length === 0) return false;

    var injected = 0;
    var trackRows = document.querySelectorAll('[class*="CommonTrack_root"], [class*="d-track"], [class*="TrackList"] > div > div, [class*="playlist__tracks"] > div');
    if (trackRows.length === 0) return false;

    for (var i = 0; i < Math.min(trackRows.length, data.tracks.length); i++) {
        var row = trackRows[i];
        var track = data.tracks[i];

        var dateText = (track.releaseDate || '').split('T')[0];
if (!dateText && track.trackAddedAt) {
    var ts = track.trackAddedAt;
    if (typeof ts === 'string') dateText = ts.split('T')[0];
    else if (typeof ts === 'number') dateText = formatAddedDate(ts);
}
        if (!dateText) continue;
        if (row.querySelector('.ymt-release-date')) { injected++; continue; }

        var likeBtn = row.querySelector('button[aria-label="\u041d\u0440\u0430\u0432\u0438\u0442\u0441\u044f"], [class*="Like"], [class*="like"], [class*="Heart"], [class*="heart"]');
        if (!likeBtn) continue;

        var dateEl = document.createElement('span');
        dateEl.className = 'ymt-release-date';
        dateEl.textContent = dateText;
        dateEl.style.cssText = 'font-size:14px; color:rgba(255,255,255,0.5); white-space:nowrap; margin-right:8px;';

        var actionsContainer = likeBtn.parentElement;
        if (actionsContainer) {
            actionsContainer.insertBefore(dateEl, likeBtn);
            injected++;
        }
    }

    return injected > 0;
}
