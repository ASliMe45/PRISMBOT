const pending = new Map();

function makeKey(chatId, initiator) {
    // initiator can be full JID
    return `${chatId}:${initiator}`;
}

function create(chatId, initiator, action, botTextSnippet, ttlMs = 30 * 1000) {
    const key = makeKey(chatId, initiator);
    const expiresAt = Date.now() + ttlMs;
    const entry = { action, botTextSnippet, expiresAt };
    pending.set(key, entry);
    entry._timer = setTimeout(() => pending.delete(key), ttlMs);
    return entry;
}

function get(chatId, initiator) {
    return pending.get(makeKey(chatId, initiator));
}

function remove(chatId, initiator) {
    const key = makeKey(chatId, initiator);
    const e = pending.get(key);
    if (e && e._timer) clearTimeout(e._timer);
    pending.delete(key);
}

module.exports = { create, get, remove };