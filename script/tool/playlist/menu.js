const MENU_PLAYLIST = {
    id: 'menuPlaylistYMusicTools',
    width: 260,
    button: {
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAB3ElEQVR4nO2Xu0oDURCGF1NYSGzVmEIIKIi+QQr7eGnyDpZaJLGzUTvfwT4PoDYRtBQba8VOiJVX8NJ8MvgvDrrZnGguCP6wkP3P3PbMzDmTKPrHXwTQ5Dua/XKepzUm+xHAipztO+5A3HI/AtiVsx3H7Yjb7ZaTKeAM2ASmxc0DJ267y06+7PhjkxU/LRtma6qTAOpfcnsOPOv3BbAGjDj5EXG2hmRNx6Me6nxBCvfAHnCr9zegAgyl6A5JxmSR7p5sGRbaOc+4yGvihlV4xQ52sCidYb3X3E5m0hRX3dfmU+QWgQbwBDzqd6lN68a7spoWwAxw5XJdSJDZTjkHthLkC642zPZMywAMwBhwKoWbuAvclxtelOsJPVVx+J1QF5gNZHMsCgEfVX0txVnHH4mrJOjEeW44blbcte+a0CDupJx1nOXbMJ4gP661B8dlxd115DwlgAdxEzHn1ibj9nXc6I8CoHUKrNoN1QSdja6kgPQiLLkitJzn9Jjz14QiLHRUhIS14VbP2pDwg6ikdDx2+yDKDPQoDriMqgGXUe3Hl1HgdXwJrCdcx+ta+9113GYgsWEjZCCZ+9VAMvCRLA02eMrZgeMOxS1FvQafR24Scj0PYOB/TP4RdRnvzC3zDl1J4PUAAAAASUVORK5CYII=',
        handler: () => onClickButtonDropdown('menuPlaylistMain'),
    },
    secondaryButton: {
        icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xOS45NzUxIDIwTDIwIDE5Ljk3NTFDMjAuMDA4MyAxOS45ODM0IDIwLjAxNjYgMTkuOTkxNyAyMC4wMjQ5IDIwQzIwLjAxNjYgMjAuMDA4MyAyMC4wMDgzIDIwLjAxNjYgMjAgMjAuMDI0OUMxOS45OTE3IDIwLjAxNjYgMTkuOTgzNCAyMC4wMDgzIDE5Ljk3NTEgMjBaTTIxLjcwODMgMjcuNVYzNUgxOC4yOTE3TDE4LjI5MTcgMjcuNUwxOC4yOTE3IDI3LjQxNDdDMTguMjkxNiAyNS44NjE2IDE4LjI4NzggMjQuODIyMSAxOC4yMDIxIDI0LjAzMTdDMTguMTE4NCAyMy4yNTkgMTcuOTczMiAyMi45Mjk2IDE3LjgyMjIgMjIuNzIxN0MxNy42NzA1IDIyLjUxMyAxNy40ODcgMjIuMzI5NSAxNy4yNzgzIDIyLjE3NzhDMTcuMDcwNCAyMi4wMjY4IDE2Ljc0MSAyMS44ODE2IDE1Ljk2ODMgMjEuNzk3OUMxNS4xNjM2IDIxLjcxMDcgMTQuMTAwNCAyMS43MDgzIDEyLjUgMjEuNzA4M0g1VjE4LjI5MTdMMTIuNSAxOC4yOTE3TDEyLjU1ODMgMTguMjkxN0MxNC4xMjYzIDE4LjI5MTYgMTUuMTczNCAxOC4yODgzIDE1Ljk2ODMgMTguMjAyMUMxNi43NDEgMTguMTE4NCAxNy4wNzA0IDE3Ljk3MzIgMTcuMjc4MyAxNy44MjIyQzE3LjQ4NyAxNy42NzA1IDE3LjY3MDUgMTcuNDg3IDE3LjgyMjIgMTcuMjc4M0MxNy45NzMyIDE3LjA3MDQgMTguMTE4NCAxNi43NDEgMTguMjAyMSAxNS45NjgzQzE4LjI4ODIgMTUuMTczNSAxOC4yOTE2IDE0LjEyNjggMTguMjkxNyAxMi41NTkzTDE4LjI5MTcgMTIuNUwxOC4yOTE3IDVIMjEuNzA4M1YxMi41TDIxLjcwODMgMTIuNTkyMVYxMi42MjAzQzIxLjcwODUgMTQuMTU0IDIxLjcxMjkgMTUuMTgzOSAyMS43OTc5IDE1Ljk2ODNDMjEuODgxNiAxNi43NDEgMjIuMDI2OCAxNy4wNzA0IDIyLjE3NzggMTcuMjc4M0MyMi4zMjk1IDE3LjQ4NyAyMi41MTMgMTcuNjcwNSAyMi43MjE3IDE3LjgyMjJDMjIuOTI5NiAxNy45NzMyIDIzLjI1OSAxOC4xMTg0IDI0LjAzMTcgMTguMjAyMUMyNC44MjY2IDE4LjI4ODMgMjUuODczNyAxOC4yOTE2IDI3LjQ0MTcgMTguMjkxN0MyNy40NjEgMTguMjkxNyAyNy40ODA1IDE4LjI5MTcgMjcuNSAxOC4yOTE3TDM1IDE4LjI5MTdWMjEuNzA4M0gyNy41QzI1Ljg5OTYgMjEuNzA4MyAyNC44MzY1IDIxLjcxMDcgMjQuMDMxNyAyMS43OTc5QzIzLjI1OSAyMS44ODE2IDIyLjkyOTYgMjIuMDI2OCAyMi43MjE3IDIyLjE3NzhDMjIuNTEzIDIyLjMyOTUgMjIuMzI5NSAyMi41MTMgMjIuMTc3OCAyMi43MjE3QzIyLjAyNjggMjIuOTI5NiAyMS44ODE2IDIzLjI1OSAyMS43OTc5IDI0LjAzMTdDMjEuNzEwNyAyNC44MzY1IDIxLjcwODMgMjUuODk5NiAyMS43MDgzIDI3LjVaIi8+PC9zdmc+',
        handler: onClickAddToPlaylist,
    },
    menus: [],
};

function addMenuPlaylist() {
    removeDropdown();
    let menu = buildMenuPlaylist();
    if (menu) {
        var savedSecondary = menu.secondaryButton;
        if (location.pathname === '/' || location.pathname === '') {
            delete menu.secondaryButton;
        }
        insertDropdown(menu);
        if (savedSecondary) {
            menu.secondaryButton = savedSecondary;
        }
        stabilizeMenuPosition();
    }
}

var _menuStabilizeTimer = null;

function stabilizeMenuPosition() {
    if (_menuStabilizeTimer) clearInterval(_menuStabilizeTimer);
    var attempts = 0;
    _menuStabilizeTimer = setInterval(function () {
        attempts++;
        if (getAvailablePosition()) {
            var root = document.getElementById(MENU_PLAYLIST.id);
            if (root) {
                removeDropdown();
            }
            var menu = buildMenuPlaylist();
            if (menu) {
                var savedSecondary = menu.secondaryButton;
                if (location.pathname === '/' || location.pathname === '') {
                    delete menu.secondaryButton;
                }
                insertDropdown(menu);
                if (savedSecondary) menu.secondaryButton = savedSecondary;
            }
            var after = document.getElementById(MENU_PLAYLIST.id);
            if (after && after.isConnected) {
                clearInterval(_menuStabilizeTimer);
                _menuStabilizeTimer = null;
                return;
            }
        }
        if (attempts > 9) {
            clearInterval(_menuStabilizeTimer);
            _menuStabilizeTimer = null;
        }
    }, 300);
}

function buildMenuPlaylist() {
    MENU_PLAYLIST.menus = [{
        id: 'menuPlaylistMain',
        items: [
            STATS_MENU_ITEM,
            EXPORTER_MENU_ITEM,
            {
                title: '\u0421\u043a\u0430\u0447\u0430\u0442\u044c',
                children: [
                    EXPORT_TXT_MENU_ITEM,
                    EXPORT_CSV_MENU_ITEM,
                ],
            },
            IMPORT_MENU_ITEM,
            {
                title: '\u041f\u0435\u0440\u0435\u0439\u0442\u0438 \u043a \u0442\u0440\u0435\u043a\u0443',
                titleId: 'ymt-jump-track-title',
                toggle: true,
                defaultState: JUMP_TRACK_CURRENT_STATE,
                handler: onClickJumpTrackToggle,
            },
            {
                title: '\u0414\u0430\u0442\u044b \u0442\u0440\u0435\u043a\u043e\u0432',
                titleId: 'ymt-dates-title',
                toggle: true,
                defaultState: DATE_CURRENT_STATE,
                handler: onClickDatesToggle,
            },
        ],
    }];
    return MENU_PLAYLIST;
}
