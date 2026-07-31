function getPageType() {
    let p = location.pathname;
    let segments = p.split('/').filter(Boolean);
    if (segments.length === 0) return 'wave';
    if (p.includes('/playlists/') || p.includes('/album/') || p.includes('/users/')) return 'playlist';
    return null;
}

function getAvailableModify() {
    let pageType = getPageType();
    if (!pageType) return { available: false, key: null, method: null };
    if (pageType === 'wave') return { available: true, key: findInsertionKey, method: modifyWavePage };
    return { available: true, key: findInsertionKey, method: modifyPlaylistPage };
}

function findInsertionKey() {
    for (let i = 0; i < INSERTION_TARGETS.length; i++) {
        if (document.querySelector(INSERTION_TARGETS[i])) return true;
    }
    if (document.querySelector('button[class*="cpeagBA1"]')) return true;
    return false;
}

function modifyPlaylistPage() {
    console.log('[Y-Music-Tools] modifyPlaylistPage called, pathname:', location.pathname);
    isJumpTrackEnabled(function (enabled) {
        JUMP_TRACK_CURRENT_STATE = enabled;
        _ymtCachedPlaylistData = null;
        addMenuPlaylist();
        isDatesEnabled(function (enabledDates) {
            DATE_CURRENT_STATE = enabledDates;
            setMenuItemToggle('ymt-dates-title', enabledDates);
            if (enabledDates) startTrackDateInjection();
        });
        initJumpToTrack();
        fetchPlaylistDataForCurrentPage(function () {});
    });
}

function modifyWavePage() {
    console.log('[Y-Music-Tools] modifyWavePage called');
    isDatesEnabled(function (enabledDates) {
        DATE_CURRENT_STATE = enabledDates;
        if (enabledDates) {
            fetchPlaylistDataForCurrentPage(function () {});
            startTrackDateInjection();
        }
    });
}
