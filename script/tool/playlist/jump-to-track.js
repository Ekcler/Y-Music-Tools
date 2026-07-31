var JUMP_TRACK_KEY = 'jumpToTrack';
var JUMP_TRACK_HIGHLIGHT_CLASS = 'ymt-jump-highlight';
var JUMP_TRACK_CURRENT_STATE = false;

var JUMP_TRACK_STYLE_ID = 'ymt-jump-style';

function ensureJumpTrackStyle() {
    if (document.getElementById(JUMP_TRACK_STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = JUMP_TRACK_STYLE_ID;
    s.textContent = '@keyframes ymt-jump-pulse{0%{background:rgba(255,210,0,0.35)}100%{background:transparent}}.'
        + JUMP_TRACK_HIGHLIGHT_CLASS + '{animation:ymt-jump-pulse 2s ease-out!important;border-radius:10px!important;background:rgba(255,210,0,0.2)!important;}'
        + '.ymt-jump-wrap{display:flex;flex-direction:row;align-items:center;gap:8px;}'
        + '.ymt-jump-arrowbar{position:fixed;top:80px;right:24px;z-index:99999;display:flex;flex-direction:column;align-items:stretch;gap:3px;background:rgba(20,20,25,0.95);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:10px 10px;backdrop-filter:blur(8px);box-shadow:0 4px 16px rgba(0,0,0,0.4);min-width:200px;}'
        + '.ymt-jump-results{max-height:300px;overflow-y:auto;width:100%;margin-top:8px;border-top:1px solid rgba(255,255,255,0.08);padding-top:6px;}'
        + '.ymt-jump-result-row{display:flex;align-items:center;gap:6px;padding:4px 6px;cursor:pointer;border-radius:8px;color:rgba(255,255,255,0.85);font-size:13px;line-height:1.3;transition:background .1s;}'
        + '.ymt-jump-result-row:hover{background:rgba(255,255,255,0.08)}'
        + '.ymt-jump-result-cover{flex-shrink:0;width:32px;height:32px;border-radius:4px;object-fit:cover;}'
        + '.ymt-jump-result-arrow{flex-shrink:0;width:18px;height:18px;object-fit:contain;opacity:0.6;transform:rotate(90deg);}'
        + '.ymt-jump-result-info{flex:1;overflow:hidden;text-overflow:ellipsis;min-width:0;padding:0 4px;white-space:nowrap;}'
        + '.ymt-jump-result-artist{color:rgba(255,255,255,0.45);font-size:11px;}'
        + '.ymt-jump-wrap input::placeholder{color:rgb(128,128,128);opacity:1;}';
    document.head.appendChild(s);
}

function isJumpTrackEnabled(callback) {
    var val = localStorage.getItem(JUMP_TRACK_KEY);
    callback(val === 'true');
}

function setJumpTrackEnabled(val, callback) {
    localStorage.setItem(JUMP_TRACK_KEY, val ? 'true' : 'false');
    if (callback) callback();
}

function updateJumpTrackToggle() {
    setMenuItemToggle('ymt-jump-track-title', JUMP_TRACK_CURRENT_STATE);
}

function onClickJumpTrackToggle() {
    var newState = !JUMP_TRACK_CURRENT_STATE;
    JUMP_TRACK_CURRENT_STATE = newState;
    updateJumpTrackToggle();

    if (newState) {
        ensureJumpTrackStyle();
        initJumpToTrack();
    } else {
        cleanupSearchNav();
    }

    setJumpTrackEnabled(newState);
}

function normalizeText(s) {
    return (s || '').toLowerCase().replace(/[\s\u00a0]+/g, ' ').replace(/["""\u00ab\u00bb]/g, '').trim();
}

var _searchNavSeq = 0;

var _searchNav = {
    matches: [],
    currentIndex: -1,
    closeBtn: null,
    searchContainer: null,
    yandexInput: null,
    container: null,
    input: null,
    arrowContainer: null,
    upBtn: null,
    downBtn: null,
    counterEl: null,
    resultsList: null,
    observer: null,
    survivalTimer: null,
};

function initJumpToTrack() {
    console.log('[Y-Music-Tools Jump] initJumpToTrack called, state:', JUMP_TRACK_CURRENT_STATE);
    if (!JUMP_TRACK_CURRENT_STATE) return;
    var args = getArgsByLocation();
    if (!args.kind || args.kind === '7') return;
    ensureJumpTrackStyle();
    startSearchWatcher();
}

function startSearchWatcher() {
    document.querySelectorAll('.ymt-jump-arrowbar, .ymt-jump-wrap, .ymt-jump-results, .ymt-jump-arrowbar').forEach(function(el){
        if (el.parentElement) el.remove();
    });
    cleanupSearchNav();

    var btn = document.querySelector('button[aria-label="\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u043f\u043e\u0438\u0441\u043a"]');
    if (btn) {
        setupSearchNav(btn);
        return;
    }

    _searchNav.observer = new MutationObserver(function () {
        var btn = document.querySelector('button[aria-label="\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c \u043f\u043e\u0438\u0441\u043a"]');
        if (btn && !_searchNav.closeBtn) {
            setupSearchNav(btn);
        }
        if (!document.querySelector('[class*="SearchPlaylist"]') && _searchNav.closeBtn) {
            cleanupSearchNav();
        }
    });
    _searchNav.observer.observe(document.body, { childList: true, subtree: true });
}

var UP_ARROW_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAuUlEQVR4nO3XTQrCMBCG4bmExdz/KkJBXdlFj/NKoSgWhWr+ZvB7VyEhkIesxkwppZRSSilVIGAATsBlWVvEgANw49kMJAv4E9MKmDbrIeJPzMDxzV4Kh7DPZykcIgyGHQj3GL5AuMXwA8IdhgyEGwwFEN0xFER0w1AB0RxDRUQzDA0Q1TE0RFTD9EAUx/REFMN4QGRjPCGyMOt87W6a43XqPO+5MAJXT4gNZnnb+NhUSimllFLq77oDYPHP2YLmYzwAAAAASUVORK5CYII=';

function setupSearchNav(closeBtn) {
    _searchNav.closeBtn = closeBtn;

    var searchContainer = closeBtn.closest('[class*="SearchPlaylist"]');
    if (!searchContainer) return;
    _searchNav.searchContainer = searchContainer;

    var yInput = searchContainer.querySelector('input[type="search"]');
    if (!yInput) return;
    _searchNav.yandexInput = yInput;

    var inputCs = getComputedStyle(yInput);
    var containerCs = getComputedStyle(searchContainer);

    var containerHeight = searchContainer.offsetHeight;
    searchContainer.style.display = 'none';

    var ourContainer = document.createElement('div');
    ourContainer.className = 'ymt-jump-wrap';
    ourContainer.style.cssText = [
        'background:' + containerCs.getPropertyValue('background'),
        'border:none',
        'border-radius:' + containerCs.getPropertyValue('border-radius'),
        'box-shadow:' + containerCs.getPropertyValue('box-shadow'),
        'padding-top:' + containerCs.getPropertyValue('padding-top'),
        'padding-right:' + containerCs.getPropertyValue('padding-right'),
        'padding-bottom:' + containerCs.getPropertyValue('padding-bottom'),
        'padding-left:' + containerCs.getPropertyValue('padding-left'),
        'flex:' + containerCs.getPropertyValue('flex'),
        'margin:' + containerCs.getPropertyValue('margin'),
        'min-height:' + containerHeight + 'px',
    ].join(';');
    searchContainer.parentElement.insertBefore(ourContainer, searchContainer.nextSibling);
    _searchNav.container = ourContainer;

    var searchIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    searchIcon.setAttribute('viewBox', '0 0 24 24');
    searchIcon.setAttribute('width', '31');
    searchIcon.setAttribute('height', '31');
    searchIcon.setAttribute('fill', 'none');
    searchIcon.style.cssText = 'flex-shrink:0;color:rgb(77,77,77)';
    var iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    iconPath.setAttribute('fill-rule', 'evenodd');
    iconPath.setAttribute('clip-rule', 'evenodd');
    iconPath.setAttribute('d', 'M4.65002 10.5C4.65002 7.18629 7.33632 4.5 10.65 4.5C13.9637 4.5 16.65 7.18629 16.65 10.5C16.65 12.1352 15.9972 13.6159 14.9358 14.6991C13.8456 15.8116 12.3291 16.5 10.65 16.5C7.33632 16.5 4.65002 13.8137 4.65002 10.5ZM10.65 2.5C6.23175 2.5 2.65002 6.08172 2.65002 10.5C2.65002 14.9183 6.23175 18.5 10.65 18.5C12.315 18.5 13.862 17.9906 15.1425 17.1203C15.2816 17.4317 15.4597 17.771 15.6873 18.1201C16.5716 19.4763 18.1686 20.923 20.9539 21.48L21.3461 19.5189C19.1314 19.076 17.9784 17.9722 17.3627 17.0278C17.0474 16.5443 16.8642 16.0877 16.7608 15.7566C16.7534 15.7331 16.7464 15.7102 16.7399 15.688C17.9303 14.2918 18.65 12.4791 18.65 10.5C18.65 6.08172 15.0683 2.5 10.65 2.5Z');
    iconPath.setAttribute('fill', 'currentColor');
    searchIcon.appendChild(iconPath);
    ourContainer.appendChild(searchIcon);

    var input = document.createElement('input');
    input.type = 'text';
    input.style.cssText = [
        'font-size:' + inputCs.getPropertyValue('font-size'),
        'color:' + inputCs.getPropertyValue('color'),
        'background:transparent',
        'border:none',
        'outline:none',
        'padding-top:' + inputCs.getPropertyValue('padding-top'),
        'padding-bottom:' + inputCs.getPropertyValue('padding-bottom'),
        'padding-left:' + inputCs.getPropertyValue('padding-left'),
        'padding-right:' + inputCs.getPropertyValue('padding-right'),
        'margin:0',
        'flex:1',
        'box-sizing:border-box',
        'font-family:' + inputCs.getPropertyValue('font-family'),
        'font-weight:' + inputCs.getPropertyValue('font-weight'),
        'line-height:' + inputCs.getPropertyValue('line-height'),
        'caret-color:' + inputCs.getPropertyValue('caret-color'),
    ].join(';');
    input.placeholder = yInput.placeholder || '\u041f\u043e\u0438\u0441\u043a \u0432 \u043f\u043b\u0435\u0439\u043b\u0438\u0441\u0442\u0435';
    ourContainer.appendChild(input);
    _searchNav.input = input;

    var arrowBar = document.createElement('div');
    arrowBar.className = 'ymt-jump-arrowbar';
    arrowBar.style.display = 'none';
    document.body.appendChild(arrowBar);
    _searchNav.arrowContainer = arrowBar;

    var navRow = document.createElement('div');
    navRow.style.cssText = 'display:flex;flex-direction:row;align-items:center;gap:3px;';
    arrowBar.appendChild(navRow);

    var upBtn = createArrowImgButton(UP_ARROW_IMG, '\u041f\u0440\u0435\u0434\u044b\u0434\u0443\u0449\u0438\u0439 \u0442\u0440\u0435\u043a', navigatePrevMatch, false);
    navRow.appendChild(upBtn);
    _searchNav.upBtn = upBtn;

    var counterEl = createCounterElement();
    navRow.appendChild(counterEl);
    _searchNav.counterEl = counterEl;

    var downBtn = createArrowImgButton(UP_ARROW_IMG, '\u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0442\u0440\u0435\u043a', navigateNextMatch, true);
    navRow.appendChild(downBtn);
    _searchNav.downBtn = downBtn;

    var resultsList = document.createElement('div');
    resultsList.className = 'ymt-jump-results';
    arrowBar.appendChild(resultsList);
    _searchNav.resultsList = resultsList;

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            onSearchQueryChanged(input.value);
        }
    });
}

function createArrowImgButton(src, label, handler, rotated) {
    var btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', label);
    btn.style.cssText = [
        'border:none',
        'background:transparent',
        'cursor:pointer',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'width:40px',
        'height:40px',
        'padding:0',
        'margin:0',
        'border-radius:50%',
        'transition:background .15s',
    ].join(';');
    var img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'width:28px;height:28px;pointer-events:none;display:block;' + (rotated ? 'transform:rotate(180deg);' : '');
    btn.appendChild(img);
    btn.addEventListener('mouseenter', function () { btn.style.background = 'rgba(255,255,255,0.1)'; });
    btn.addEventListener('mouseleave', function () { btn.style.background = 'transparent'; });
    btn.addEventListener('click', function (e) { e.stopPropagation(); handler(); });
    return btn;
}

function createCounterElement() {
    var span = document.createElement('span');
    span.style.cssText = 'color:rgba(255,255,255,0.6);font-size:15px;font-weight:600;line-height:1;text-align:center;padding:0 4px;white-space:nowrap;font-variant-numeric:tabular-nums;';
    span.textContent = '0';
    return span;
}

function onSearchQueryChanged(query) {
    if (!query || query.trim().length === 0) {
        _searchNav.matches = [];
        _searchNav.currentIndex = -1;
        updateNavDisplay();
        return;
    }

    var normQuery = normalizeText(query.trim());
    var seq = ++_searchNavSeq;

    ensurePlaylistData(function (data) {
        if (seq !== _searchNavSeq) return;
        if (data && data.tracks && data.tracks.length > 0) {
            _searchNav.matches = findSearchMatchesInData(data.tracks, normQuery);
        } else {
            _searchNav.matches = [];
        }

        _searchNav.currentIndex = _searchNav.matches.length > 0 ? 0 : -1;
        updateNavDisplay();

        if (_searchNav.matches.length > 0) {
            jumpToTrackByIndex(0);
        }
    });
}

function findSearchMatchesInData(tracks, normQuery) {
    var matches = [];
    for (var i = 0; i < tracks.length; i++) {
        var t = tracks[i];
        var searchText = t.title || '';
        if (normalizeText(searchText).indexOf(normQuery) !== -1) {
            matches.push({ index: i, element: null, track: t });
        }
    }
    console.log('[Y-Music-Tools Jump] Found', matches.length, 'matches for:', normQuery);
    return matches;
}

function jumpToTrackByIndex(matchPos) {
    console.log('[Y-Music-Tools Jump] jumpToTrackByIndex called, matchPos:', matchPos, 'matches:', _searchNav.matches.length);
    if (matchPos < 0 || matchPos >= _searchNav.matches.length) {
        console.log('[Y-Music-Tools Jump] jumpToTrackByIndex: out of range, returning false');
        return false;
    }

    var prevMatch = _searchNav.matches[_searchNav.currentIndex];
    if (prevMatch && prevMatch.element) {
        prevMatch.element.classList.remove(JUMP_TRACK_HIGHLIGHT_CLASS);
        prevMatch.element.style.background = '';
        prevMatch.element.style.borderRadius = '';
        prevMatch.element.removeAttribute('data-ymt-highlight');
        prevMatch.element = null;
    }

    _searchNav.currentIndex = matchPos;
    updateCounterText();

    var match = _searchNav.matches[matchPos];
    var trackIndex = match.index;

    var el = findTrackElementByIndex(trackIndex);
    console.log('[Y-Music-Tools Jump] findTrackElementByIndex(', trackIndex, ') returned:', !!el, el);
    if (el) {
        match.element = el;
        doHighlight(el);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        reapplyHighlightRetry(trackIndex, 15);
        return true;
    }

    var container = findScrollContainer();
    if (!container) {
        console.log('[Y-Music-Tools Jump] findScrollContainer returned null, aborting');
        return false;
    }
    console.log('[Y-Music-Tools Jump] findScrollContainer:', container, 'scrollHeight:', container.scrollHeight, 'clientHeight:', container.clientHeight);

    var trackHeight = estimateTrackHeight();
    var maxScroll = container.scrollHeight - container.clientHeight;
    var targetScrollTop = trackIndex * trackHeight - Math.floor((container.clientHeight - trackHeight) / 2);
    targetScrollTop = Math.max(0, Math.min(targetScrollTop, maxScroll));
    console.log('[Y-Music-Tools Jump] trackHeight:', trackHeight, 'targetScrollTop:', targetScrollTop, 'currentScrollTop:', container.scrollTop, 'maxScroll:', maxScroll);
    container.scrollTop = targetScrollTop;

    console.log('[Y-Music-Tools Jump] after scroll, scrollTop:', container.scrollTop, 'rows in DOM:', document.querySelectorAll('[class*="CommonTrack_root"]').length);

    waitForTrackElement(trackIndex, function (el) {
        match.element = el;
        doHighlight(el);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        reapplyHighlightRetry(trackIndex, 15);
    });

    return true;
}

function findTrackElementByIndex(dataIndex) {
    var rows = document.querySelectorAll('[class*="CommonTrack_root"]');
    if (rows[dataIndex]) return rows[dataIndex];
    if (!rows.length) return null;

    var matchTrack = null;
    for (var mi = 0; mi < _searchNav.matches.length; mi++) {
        if (_searchNav.matches[mi].index === dataIndex) {
            matchTrack = _searchNav.matches[mi].track;
            break;
        }
    }
    if (!matchTrack) return null;

    var searchTitle = normalizeText(matchTrack.title || '');
    if (!searchTitle) return null;

    var searchArtists = [];
    if (matchTrack.artists && matchTrack.artists.length > 0) {
        for (var ai = 0; ai < matchTrack.artists.length; ai++) {
            searchArtists.push(normalizeText(matchTrack.artists[ai]));
        }
    }

    for (var i = 0; i < rows.length; i++) {
        var rowText = normalizeText(rows[i].textContent || '');
        if (rowText.indexOf(searchTitle) === -1) continue;
        if (searchArtists.length > 0) {
            for (var ai2 = 0; ai2 < searchArtists.length; ai2++) {
                if (rowText.indexOf(searchArtists[ai2]) !== -1) {
                    return rows[i];
                }
            }
        } else {
            return rows[i];
        }
    }
    return null;
}

function findScrollContainer() {
    var row = document.querySelector('[class*="CommonTrack_root"]');
    if (!row) return null;
    var el = row.parentElement;
    while (el) {
        if (getComputedStyle(el).overflowY === 'scroll' || getComputedStyle(el).overflowY === 'auto') return el;
        el = el.parentElement;
    }
    return null;
}

function estimateTrackHeight() {
    var row = document.querySelector('[class*="CommonTrack_root"]');
    return row ? row.offsetHeight : 56;
}

function waitForTrackElement(index, callback, maxAttempts) {
    if (maxAttempts === undefined) maxAttempts = 30;
    var attempts = 0;
    console.log('[Y-Music-Tools Jump] waitForTrackElement started for index:', index, 'maxAttempts:', maxAttempts);
    var timer = setInterval(function () {
        var el = findTrackElementByIndex(index);
        console.log('[Y-Music-Tools Jump] waitForTrackElement attempt', attempts + 1, '/', maxAttempts, 'el:', !!el);
        if (el) {
            clearInterval(timer);
            callback(el);
            return;
        }
        if (++attempts >= maxAttempts) {
            console.log('[Y-Music-Tools Jump] waitForTrackElement: max attempts reached for index:', index);
            clearInterval(timer);
        }
    }, 100);
}

function doHighlight(el) {
    console.log('[Y-Music-Tools Jump] doHighlight called, el:', el, 'highlight class:', JUMP_TRACK_HIGHLIGHT_CLASS);
    el.classList.remove(JUMP_TRACK_HIGHLIGHT_CLASS);
    void el.offsetWidth;
    el.classList.add(JUMP_TRACK_HIGHLIGHT_CLASS);
    el.style.background = 'rgba(255,210,0,0.2)';
    el.style.borderRadius = '10px';
    el.setAttribute('data-ymt-highlight', '');
}

function reapplyHighlightRetry(trackIndex, maxAttempts) {
    var attempts = 0;
    var timer = setInterval(function () {
        attempts++;
        var el = findTrackElementByIndex(trackIndex);
        console.log('[Y-Music-Tools Jump] reapplyHighlightRetry attempt', attempts, '/', maxAttempts, 'trackIndex:', trackIndex, 'found:', !!el, 'hasHighlight:', el ? el.hasAttribute('data-ymt-highlight') : 'N/A');
        if (el && !el.hasAttribute('data-ymt-highlight')) {
            doHighlight(el);
        }
        if (!el || el.hasAttribute('data-ymt-highlight') || attempts >= maxAttempts) {
            console.log('[Y-Music-Tools Jump] reapplyHighlightRetry stopping, reason:', !el ? 'no element' : el.hasAttribute('data-ymt-highlight') ? 'highlight present' : 'max attempts');
            clearInterval(timer);
        }
    }, 200);
}

function updateCounterText() {
    if (!_searchNav.counterEl) return;
    _searchNav.counterEl.textContent = (_searchNav.currentIndex + 1) + '/' + _searchNav.matches.length;
}

function navigatePrevMatch() {
    if (_searchNav.matches.length === 0) return;
    var idx = _searchNav.currentIndex - 1;
    if (idx < 0) idx = _searchNav.matches.length - 1;
    jumpToTrackByIndex(idx);
}

function navigateNextMatch() {
    if (_searchNav.matches.length === 0) return;
    var idx = _searchNav.currentIndex + 1;
    if (idx >= _searchNav.matches.length) idx = 0;
    jumpToTrackByIndex(idx);
}

function updateNavDisplay() {
    var show = _searchNav.matches.length > 0;
    if (_searchNav.arrowContainer) {
        _searchNav.arrowContainer.style.display = show ? 'flex' : 'none';
    }
    if (_searchNav.counterEl) {
        if (show) updateCounterText();
    }
    populateResultsList();
}

function populateResultsList() {
    if (!_searchNav.resultsList) return;
    _searchNav.resultsList.innerHTML = '';
    if (_searchNav.matches.length === 0) return;
    for (var i = 0; i < _searchNav.matches.length; i++) {
        (function (matchIdx) {
            var match = _searchNav.matches[matchIdx];
            var row = document.createElement('div');
            row.className = 'ymt-jump-result-row';

            var arrowBtn = document.createElement('img');
            arrowBtn.className = 'ymt-jump-result-arrow';
            arrowBtn.src = UP_ARROW_IMG;
            row.appendChild(arrowBtn);

            var cover = document.createElement('img');
            cover.className = 'ymt-jump-result-cover';
            if (match.track.coverUri) {
                cover.src = 'https://' + match.track.coverUri.replace('%%', '40x40');
            } else {
                cover.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22%3E%3Crect width=%2232%22 height=%2232%22 fill=%22rgba(255,255,255,0.1)%22/%3E%3C/svg%3E';
            }
            cover.setAttribute('loading', 'lazy');
            row.appendChild(cover);

            var wrap = document.createElement('div');
            wrap.style.cssText = 'flex:1;overflow:hidden;min-width:0;display:flex;flex-direction:column;gap:1px;';

            var titleEl = document.createElement('div');
            titleEl.className = 'ymt-jump-result-info';
            titleEl.textContent = match.track.title || '';
            wrap.appendChild(titleEl);

            var artist = match.track.artists && match.track.artists.length > 0 ? match.track.artists.join(', ') : '';
            if (artist) {
                var artistEl = document.createElement('div');
                artistEl.className = 'ymt-jump-result-artist';
                artistEl.textContent = artist;
                wrap.appendChild(artistEl);
            }

            row.appendChild(wrap);

            row.addEventListener('click', function () {
                if (_searchNav.currentIndex !== matchIdx) {
                    _searchNav.currentIndex = matchIdx;
                    updateCounterText();
                }
                jumpToTrackByIndex(matchIdx);
            });

            _searchNav.resultsList.appendChild(row);
        })(i);
    }
}

function cleanupSearchNav() {
    if (_searchNav.survivalTimer) {
        clearInterval(_searchNav.survivalTimer);
    }
    if (_searchNav.observer) {
        _searchNav.observer.disconnect();
    }
    if (_searchNav.arrowContainer && _searchNav.arrowContainer.parentElement) {
        _searchNav.arrowContainer.remove();
    }
    if (_searchNav.container && _searchNav.container.parentElement) {
        _searchNav.container.remove();
    }
    var allSearch = document.querySelectorAll('[class*="SearchPlaylist"]');
    for (var si = 0; si < allSearch.length; si++) {
        allSearch[si].style.display = '';
    }
    _searchNav.closeBtn = null;
    _searchNav.searchContainer = null;
    _searchNav.yandexInput = null;
    _searchNav.container = null;
    _searchNav.input = null;
    _searchNav.arrowContainer = null;
    _searchNav.upBtn = null;
    _searchNav.downBtn = null;
    _searchNav.counterEl = null;
    _searchNav.resultsList = null;
    _searchNav.observer = null;
    _searchNav.survivalTimer = null;
    _searchNav.matches = [];
    _searchNav.currentIndex = -1;
}
