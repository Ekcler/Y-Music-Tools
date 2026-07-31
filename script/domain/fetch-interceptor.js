(function () {
    'use strict';

    var API_HOST_RE = /^api\.music\.yandex\.(ru|net|kz|by|com|uz|ua)$/i;

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

    var origFetch = window.fetch;

    window.fetch = function (input, init) {
        var urlStr = '';
        var method = 'GET';
        try {
            if (typeof input === 'string') urlStr = input;
            else if (input instanceof Request) { urlStr = input.url; method = input.method || 'GET'; }
            if (init && init.method) method = init.method.toUpperCase();
        } catch (e) {}

        var isMatch = false;
        try {
            isMatch = isPlaylistUrl(urlStr) && method === 'GET';
        } catch (e) {}

        if (!isMatch) {
            return origFetch.apply(this, arguments);
        }

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
    };
})();
