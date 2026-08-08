const domain = location.hostname.split('.')[2];
const API_BASE = 'https://api.music.yandex.' + domain;

let sign, owner, uid;

refreshSign();

function refreshSign(callback) {
    requestGET(API_BASE + '/account/status', function (responseJSON) {
        try {
            var account = responseJSON.result.account;
            uid = account.uid;
            owner = account.login;
        } catch (e) {}
        if (callback) {
            callback();
        }
    });
}

function getArgsByLocation() {
    let path = location.pathname.split('/').filter(Boolean);

    if (path[0] === 'playlists' && path[1]) {
        return { owner: null, kind: path[1] };
    }

    if (path[0] === 'users' && path.length >= 4 && path[2] === 'playlists') {
        return { owner: path[1], page: path[2], kind: path[3] };
    }

    if (path[0] === 'users') {
        return { owner: path[1], page: path[2], kind: path[3] };
    }

    return {};
}
