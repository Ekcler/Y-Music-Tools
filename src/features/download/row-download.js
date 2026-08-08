var ROW_DOWNLOAD_STYLE_ID = 'ymt-row-dl-style';
var ROW_DOWNLOAD_TIMER = null;

function ensureRowDownloadStyle() {
    if (document.getElementById(ROW_DOWNLOAD_STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = ROW_DOWNLOAD_STYLE_ID;
    s.textContent = [
        '.ymt-row-download { width: 32px; height: 32px; min-width: 32px; border-radius: 50%; border: 1px solid transparent; background: transparent; color: rgba(255,255,255,0.6); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 16px; line-height: 1; padding: 0; margin-right: 4px; opacity: 0; transition: opacity 0.15s, color 0.15s, border-color 0.15s; }',
        '[class*="CommonTrack_root"]:hover .ymt-row-download { opacity: 1; }',
        '.ymt-row-download:hover { border-color: rgba(255,255,255,0.3); color: #fff; }',
        '.ymt-row-download.busy, .ymt-row-download.done, .ymt-row-download.error { opacity: 1; }',
        '.ymt-row-download.done { color: #ffff00; }',
        '.ymt-row-download.error { color: #ff5252; }',
    ].join('\n');
    document.head.appendChild(s);
}

function startRowDownloadInjection() {
    stopRowDownloadInjection();
    ensureRowDownloadStyle();
    injectRowDownloadButtons();
    ROW_DOWNLOAD_TIMER = setInterval(injectRowDownloadButtons, 500);
}

function stopRowDownloadInjection() {
    if (ROW_DOWNLOAD_TIMER) {
        clearInterval(ROW_DOWNLOAD_TIMER);
        ROW_DOWNLOAD_TIMER = null;
    }
}

function injectRowDownloadButtons() {
    var rows = document.querySelectorAll('[class*="CommonTrack_root"]');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (row.querySelector('.ymt-row-download')) continue;
        var id = extractTrackIdFromElement(row);
        if (!id) continue;

        var anchor = row.querySelector('button[aria-label="\u0414\u0440\u0443\u0433\u0438\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f"]')
            || row.querySelector('button[aria-label="\u041d\u0440\u0430\u0432\u0438\u0442\u0441\u044f"], [class*="Like"], [class*="like"], [class*="Heart"], [class*="heart"]');

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ymt-row-download';
        btn.dataset.trackId = id;
        btn.title = '\u0421\u043a\u0430\u0447\u0430\u0442\u044c';
        btn.textContent = '\u2193';
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            handleRowDownloadClick(this);
        });

        if (anchor && anchor.parentElement) {
            anchor.parentElement.insertBefore(btn, anchor);
        } else {
            row.appendChild(btn);
        }
    }
}

function handleRowDownloadClick(btn) {
    if (btn.classList.contains('busy')) return;
    var id = btn.dataset.trackId;
    btn.classList.add('busy');
    btn.textContent = '...';
    downloadSingleTrack(id).then(function (filename) {
        btn.classList.remove('busy');
        btn.classList.add('done');
        btn.textContent = '\u2713';
        btn.title = '\u0421\u043a\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044f: ' + filename;
        setTimeout(function () { resetRowDownloadButton(btn); }, 2500);
    }).catch(function (err) {
        btn.classList.remove('busy');
        btn.classList.add('error');
        btn.textContent = '!';
        btn.title = '\u041e\u0448\u0438\u0431\u043a\u0430: ' + ((err && err.message) || '\u043d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u0430\u044f');
        setTimeout(function () { resetRowDownloadButton(btn); }, 3500);
    });
}

function resetRowDownloadButton(btn) {
    btn.classList.remove('busy', 'done', 'error');
    btn.textContent = '\u2193';
    btn.title = '\u0421\u043a\u0430\u0447\u0430\u0442\u044c';
}
