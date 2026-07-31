const KIND_PLAYLIST_MYLIKES = 3;

const INSERTION_TARGETS = [
    '[class*="PageHeaderPlaylist_mainControls"]',
    '[class*="PageHeaderPlaylist_controls"]',
    '[class*="CommonPageHeader_playControl"]',
    '[class*="InnerHeader_actions"]',
    '[class*="NavigationControls_root"]',
    '[class*="CommonControlsBar"]',
];

const DEFAULT_INSERTION_POSITION = 'beforeend';

let navTabs, indexNavTabs;

function isOwnerPage() {
    let args = getArgsByLocation();
    if (!args.owner && args.kind) return true;
    return args.owner === owner && args.kind != KIND_PLAYLIST_MYLIKES;
}

function disableFlexAttribute() {
    document.querySelectorAll('[class*="InnerHeader_actions"], [class*="MainActions"]').forEach(function (el) {
        el.style.flex = '0 1 auto';
    });
}

function getAvailablePosition() {
    for (let i = 0; i < INSERTION_TARGETS.length; i++) {
        let parent = document.querySelector(INSERTION_TARGETS[i]);
        if (parent) {
            return { element: parent, where: DEFAULT_INSERTION_POSITION, query: INSERTION_TARGETS[i] };
        }
    }
    return findFallbackPosition();
}

function findFallbackPosition() {
    let buttons = document.querySelectorAll('button[class*="cpeagBA1"]');
    if (buttons.length > 0) {
        let lastBtn = buttons[buttons.length - 1];
        let parent = lastBtn.closest('[class*="controls"], [class*="Controls"], [class*="actions"], [class*="Actions"]') || lastBtn.parentElement;
        if (parent) {
            return { element: parent, where: 'beforeend', query: 'fallback' };
        }
    }
    let header = document.querySelector('[class*="CommonPageHeader"], [class*="PageHeader"], [class*="playlist-header"]');
    if (header) {
        return { element: header, where: 'beforeend', query: 'header-fallback' };
    }
    return null;
}

function insertButton(data) {
    insert(data, createButton);
    disableFlexAttribute();
}

function insertDropdown(data) {
    insert(data, createDropdown);
    disableFlexAttribute();
}

function insert(data, creatorMethod) {
    if (!document.getElementById(data.id)) {
        let position = getAvailablePosition();
        if (position) {
            position.element.insertAdjacentElement(position.where, creatorMethod(data));
        }
    }
}

function removeById(id) {
    let element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

function removeDropdown() {
    let element = document.querySelector('.ymt_dropdown');
    if (element) {
        element.parentElement.remove();
    }
}

function updateNavTabs() {
    navTabs = document.querySelectorAll('[class*="NavTab"], [class*="nav-tab"], [class*="nav__tab"], .nav-kids__tab');
    navTabs = Array.from(navTabs);
    updateIndexOfNavTabs();
}

function updateIndexOfNavTabs() {
    indexNavTabs = {};
    for (let i = 0; i < navTabs.length; i++) {
        let name = navTabs[i].getAttribute('data-name');
        if (name) {
            indexNavTabs[name] = i;
        }
    }
}
