var HIDE_ITEMS = [
    { key: 'ymtHideConcerts', title: '\u041a\u043e\u043d\u0446\u0435\u0440\u0442\u044b', mode: 'nav' },
    { key: 'ymtHideBooksPodcasts', title: '\u041a\u043d\u0438\u0433\u0438 \u0438 \u043f\u043e\u0434\u043a\u0430\u0441\u0442\u044b', mode: 'nav' },
    { key: 'ymtHidePlus', title: '\u0412\u0430\u0448 \u041f\u043b\u044e\u0441', mode: 'nav' },
    { key: 'ymtHideVibeRooms', title: '\u041c\u043e\u044f \u0432\u043e\u043b\u043d\u0430 \u043d\u0430 \u0434\u0432\u043e\u0438\u0445', mode: 'block' },
    { key: 'ymtHideLikedAlbums', title: '\u041b\u044e\u0431\u0438\u043c\u044b\u0435 \u0430\u043b\u044c\u0431\u043e\u043c\u044b', mode: 'block' },
    { key: 'ymtHideCollectionPodcasts', title: '\u041f\u043e\u0434\u043a\u0430\u0441\u0442\u044b \u0438 \u043a\u043d\u0438\u0433\u0438', mode: 'block' },
    { key: 'ymtHideClips', title: '\u041a\u043b\u0438\u043f\u044b \u0432 \u043a\u043e\u043b\u043b\u0435\u043a\u0446\u0438\u0438', mode: 'block' },
    { key: 'ymtHideDislikes', title: '\u041c\u043e\u0438 \u0434\u0438\u0437\u043b\u0430\u0439\u043a\u0438', mode: 'block' },
    { key: 'ymtHideFooter', title: '\u042e\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f', mode: 'footer' },
];

function isHideEnabled(key) {
    return localStorage.getItem(key) === 'true';
}

function setHideEnabled(key, val) {
    localStorage.setItem(key, val ? 'true' : 'false');
}

function onClickHideToggle(key) {
    var next = !isHideEnabled(key);
    setHideEnabled(key, next);
    if (next) {
        document.documentElement.classList.add('ymt-hide-' + key);
    } else {
        document.documentElement.classList.remove('ymt-hide-' + key);
    }
    applyHideRules();
    setMenuItemToggle(key, next);
}

function hideExactText(el, text) {
    var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    return t === text;
}

function hideClimbTo(el, classToken) {
    var cur = el;
    while (cur && cur !== document.body) {
        if (typeof cur.className === 'string' && cur.className.indexOf(classToken) !== -1) return cur;
        cur = cur.parentElement;
    }
    return null;
}

function hideTag(rule, key) {
    var node = null;
    if (rule.mode === 'nav') {
        var navLinks = document.querySelectorAll('a[class*="buOTZq_TKQOVyjMLrXvB"]');
        for (var i = 0; i < navLinks.length; i++) {
            if (hideExactText(navLinks[i], rule.title)) {
                node = navLinks[i];
                break;
            }
        }
    } else if (rule.mode === 'block') {
        var headers = document.querySelectorAll('a[class*="BlockHeader_title"]');
        for (var j = 0; j < headers.length; j++) {
            if (hideExactText(headers[j], rule.title)) {
                node = hideClimbTo(headers[j], 'VirtualizedSkeletonBlock_root');
                break;
            }
        }
    } else if (rule.mode === 'footer') {
        node = document.querySelector('footer[class*="Footer_root"]');
    }
    if (node && rule.mode === 'block') {
        node.setAttribute('data-ymt-block', rule.title);
    } else if (node && !node.classList.contains('ymt-hide-' + key)) {
        node.classList.add('ymt-hide-' + key);
    }
}

function applyHideRules() {
    for (var i = 0; i < HIDE_ITEMS.length; i++) {
        var rule = HIDE_ITEMS[i];
        if (isHideEnabled(rule.key)) {
            hideTag(rule, rule.key);
        } else if (rule.mode !== 'block') {
            document.querySelectorAll('.ymt-hide-' + rule.key).forEach(function (el) {
                el.classList.remove('ymt-hide-' + rule.key);
            });
        }
    }
}

(function () {
    var css = '';
    var blockSel = [];
    for (var i = 0; i < HIDE_ITEMS.length; i++) {
        var rule = HIDE_ITEMS[i];
        if (rule.mode === 'block') {
            blockSel.push('html.ymt-hide-' + rule.key);
            css += 'html.ymt-hide-' + rule.key + ' [data-ymt-block="' + rule.title.replace(/"/g, '&quot;') + '"]{display:none!important}';
        } else {
            css += 'html.ymt-hide-' + rule.key + ' .ymt-hide-' + rule.key + '{display:none!important}';
        }
    }
    if (blockSel.length) {
        var sel = blockSel.join(', ');
        css += sel + ' div[class*="Skeleton_root"]{height:auto!important}';
        css += sel + ' div[class*="Skeleton_root"] > div[class*="VirtualizedSkeletonBlock_root"]{position:static!important;transform:none!important}';
    }
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var rafId = null;
    new MutationObserver(function () {
        if (rafId) return;
        rafId = requestAnimationFrame(function () {
            rafId = null;
            applyHideRules();
        });
    }).observe(document.body || document.documentElement, { childList: true, subtree: true });

    for (var j = 0; j < HIDE_ITEMS.length; j++) {
        if (isHideEnabled(HIDE_ITEMS[j].key)) {
            document.documentElement.classList.add('ymt-hide-' + HIDE_ITEMS[j].key);
        }
    }
    applyHideRules();
})();
