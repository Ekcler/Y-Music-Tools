var API = typeof browser !== 'undefined' ? browser : chrome;

function getMessage(key, data) {
    return API.i18n.getMessage(key, data);
}
