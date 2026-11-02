// Records one page view per page per browser session with POST /api/analytics/visit.
(function () {
    'use strict';

    const apiBase = (window.TEQVORA_CONFIG && window.TEQVORA_CONFIG.API_BASE_URL) || '';
    const SESSION_KEY = 'teqvoraSessionId';
    const SEEN_PAGES_KEY = 'teqvoraSeenPages';

    function readStorage(key) {
        try {
            return sessionStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function writeStorage(key, value) {
        try {
            sessionStorage.setItem(key, value);
        } catch (error) {
            // Storage can be blocked; the visit is then simply counted again on reload.
        }
    }

    function createSessionId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
    }

    function getSessionId() {
        let sessionId = readStorage(SESSION_KEY);
        if (!sessionId) {
            sessionId = createSessionId();
            writeStorage(SESSION_KEY, sessionId);
        }
        return sessionId;
    }

    function hasRecordedPage(path) {
        const seenPages = (readStorage(SEEN_PAGES_KEY) || '').split('|');
        return seenPages.indexOf(path) !== -1;
    }

    function rememberPage(path) {
        const seenPages = (readStorage(SEEN_PAGES_KEY) || '').split('|').filter(Boolean);
        seenPages.push(path);
        writeStorage(SEEN_PAGES_KEY, seenPages.join('|'));
    }

    async function recordVisit() {
        const path = window.location.pathname;
        if (hasRecordedPage(path)) return;

        try {
            const response = await fetch(apiBase + '/api/analytics/visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: path,
                    sessionId: getSessionId(),
                    referrer: document.referrer
                }),
                keepalive: true
            });

            if (!response.ok) {
                console.warn('Analytics: the server rejected the visit (HTTP ' + response.status + ').');
                return;
            }
            rememberPage(path);
        } catch (error) {
            console.warn('Analytics: could not reach the server.', error);
        }
    }

    recordVisit();
})();
