// TEQVORA admin dashboard. Talks to the /api/admin/* routes.
(function () {
    'use strict';

    const TOKEN_KEY = 'teqvoraAdminToken';
    const PAGE_SIZE = 15;
    const SEARCH_DELAY_MS = 300;
    const apiBase = (window.TEQVORA_CONFIG && window.TEQVORA_CONFIG.API_BASE_URL) || '';

    const loginView = document.getElementById('loginView');
    const dashboardView = document.getElementById('dashboardView');
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    const loginButton = document.getElementById('loginButton');
    const dashboardMessage = document.getElementById('dashboardMessage');
    const inquiryRows = document.getElementById('inquiryRows');
    const inquiryState = document.getElementById('inquiryState');
    const pageLabel = document.getElementById('pageLabel');
    const previousPage = document.getElementById('previousPage');
    const nextPage = document.getElementById('nextPage');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const typeFilter = document.getElementById('typeFilter');

    const state = { page: 1, pages: 1 };

    /* ---------- token and API helper ---------- */

    function getToken() {
        try {
            return sessionStorage.getItem(TOKEN_KEY);
        } catch (error) {
            return null;
        }
    }

    function setToken(token) {
        try {
            if (token) sessionStorage.setItem(TOKEN_KEY, token);
            else sessionStorage.removeItem(TOKEN_KEY);
        } catch (error) {
            // Without storage the admin simply signs in again after a reload.
        }
    }

    class SessionExpiredError extends Error {}

    async function api(path, options) {
        const settings = options || {};
        const headers = { Authorization: 'Bearer ' + getToken() };
        if (settings.body) headers['Content-Type'] = 'application/json';

        const response = await fetch(apiBase + '/api/admin' + path, {
            method: settings.method || 'GET',
            headers: headers,
            body: settings.body ? JSON.stringify(settings.body) : undefined
        });
        const data = await response.json().catch(function () { return {}; });

        if (response.status === 401) throw new SessionExpiredError(data.message);
        if (!response.ok) throw new Error(data.message || 'Request failed (HTTP ' + response.status + ').');
        return data;
    }

    /* ---------- views ---------- */

    function showLogin(message) {
        setToken(null);
        dashboardView.hidden = true;
        loginView.hidden = false;
        loginMessage.textContent = message || '';
        document.getElementById('passwordInput').focus();
    }

    function showDashboard() {
        loginView.hidden = true;
        dashboardView.hidden = false;
        loadStats();
        loadInquiries();
    }

    function showDashboardError(error) {
        if (error instanceof SessionExpiredError) {
            showLogin('Your session has ended. Please sign in again.');
            return;
        }
        dashboardMessage.textContent = error.message;
        dashboardMessage.hidden = false;
    }

    function clearDashboardError() {
        dashboardMessage.hidden = true;
    }

    /* ---------- sign in ---------- */

    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const password = loginForm.elements.password.value;
        if (!password) {
            loginMessage.textContent = 'Please enter the password.';
            return;
        }

        loginButton.disabled = true;
        loginMessage.textContent = '';

        try {
            const response = await fetch(apiBase + '/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password })
            });
            const data = await response.json().catch(function () { return {}; });

            if (!response.ok) {
                loginMessage.textContent = data.message || 'Could not sign in. Please try again.';
                return;
            }

            loginForm.reset();
            setToken(data.token);
            showDashboard();
        } catch (error) {
            console.error('Admin sign-in failed:', error);
            loginMessage.textContent = 'Could not reach the server.';
        } finally {
            loginButton.disabled = false;
        }
    });

    document.getElementById('signOutButton').addEventListener('click', function () {
        showLogin('');
    });

    /* ---------- summary and traffic ---------- */

    function setText(id, value) {
        document.getElementById(id).textContent = Number(value).toLocaleString();
    }

    function renderChart(daily) {
        const chart = document.getElementById('visitsChart');
        chart.replaceChildren();

        const highest = Math.max.apply(null, daily.map(function (day) { return day.visits; }).concat(1));

        daily.forEach(function (day) {
            const column = document.createElement('div');
            column.className = 'chart-bar';
            column.title = day.day + ': ' + day.visits + ' visits';

            const bar = document.createElement('span');
            bar.style.height = Math.round((day.visits / highest) * 100) + '%';

            const label = document.createElement('small');
            label.textContent = day.day.slice(8);

            column.append(bar, label);
            chart.appendChild(column);
        });
    }

    function renderTopPages(pages) {
        const list = document.getElementById('topPages');
        list.replaceChildren();

        if (pages.length === 0) {
            const item = document.createElement('li');
            item.textContent = 'No visits recorded yet.';
            list.appendChild(item);
            return;
        }

        pages.forEach(function (page) {
            const item = document.createElement('li');
            const path = document.createElement('span');
            const count = document.createElement('strong');
            path.textContent = page.path;
            count.textContent = page.visits.toLocaleString();
            item.append(path, count);
            list.appendChild(item);
        });
    }

    async function loadStats() {
        try {
            const data = await api('/stats');
            clearDashboardError();
            setText('statTotal', data.inquiries.total);
            setText('statNew', data.inquiries.byStatus.new);
            setText('statAudits', data.inquiries.strategyAudits);
            setText('statToday', data.visits.today);
            setText('stat7Days', data.visits.last7Days);
            setText('statVisits', data.visits.total);
            renderChart(data.visits.daily);
            renderTopPages(data.visits.topPages);
        } catch (error) {
            showDashboardError(error);
        }
    }

    /* ---------- enquiries ---------- */

    function createCell(label) {
        const cell = document.createElement('td');
        cell.dataset.label = label;
        return cell;
    }

    function createTextBlock(main, secondary) {
        const fragment = document.createDocumentFragment();
        const strong = document.createElement('strong');
        const small = document.createElement('small');
        strong.textContent = main;
        small.textContent = secondary;
        fragment.append(strong, small);
        return fragment;
    }

    function formatDate(value) {
        return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }

    function createMessageCell(inquiry) {
        const cell = createCell('Message');
        cell.classList.add('message-cell');

        if (!inquiry.message) {
            cell.textContent = '-';
            return cell;
        }

        const details = document.createElement('details');
        const summary = document.createElement('summary');
        const full = document.createElement('p');
        const preview = inquiry.message.length > 60 ? inquiry.message.slice(0, 60) + '...' : inquiry.message;

        summary.textContent = inquiry.subject || preview;
        full.textContent = inquiry.message;
        details.append(summary, full);
        cell.appendChild(details);
        return cell;
    }

    function createStatusCell(inquiry) {
        const cell = createCell('Status');
        const select = document.createElement('select');
        select.className = 'status-select ' + inquiry.status;
        select.setAttribute('aria-label', 'Status for ' + inquiry.name);

        ['new', 'contacted', 'closed'].forEach(function (status) {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            option.selected = status === inquiry.status;
            select.appendChild(option);
        });

        select.addEventListener('change', async function () {
            const previousStatus = inquiry.status;
            select.disabled = true;
            try {
                const data = await api('/inquiries/' + inquiry.id, { method: 'PATCH', body: { status: select.value } });
                inquiry.status = data.inquiry.status;
                select.className = 'status-select ' + inquiry.status;
                clearDashboardError();
                loadStats();
            } catch (error) {
                select.value = previousStatus;
                showDashboardError(error);
            } finally {
                select.disabled = false;
            }
        });

        cell.appendChild(select);
        return cell;
    }

    function createActionCell(inquiry) {
        const cell = createCell('Actions');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'delete-button';
        button.textContent = 'Delete';

        button.addEventListener('click', async function () {
            if (!window.confirm('Delete the enquiry from ' + inquiry.name + '? This cannot be undone.')) return;

            button.disabled = true;
            try {
                await api('/inquiries/' + inquiry.id, { method: 'DELETE' });
                clearDashboardError();
                loadStats();
                // Step back a page if the last row of a later page was removed.
                if (inquiryRows.children.length === 1 && state.page > 1) state.page -= 1;
                loadInquiries();
            } catch (error) {
                button.disabled = false;
                showDashboardError(error);
            }
        });

        cell.appendChild(button);
        return cell;
    }

    function renderInquiryRow(inquiry) {
        const row = document.createElement('tr');

        const dateCell = createCell('Received');
        dateCell.textContent = formatDate(inquiry.createdAt);

        const contactCell = createCell('Contact');
        contactCell.appendChild(createTextBlock(inquiry.name, inquiry.email));

        const requestCell = createCell('Request');
        requestCell.appendChild(createTextBlock(inquiry.service, inquiry.page || ''));
        const tag = document.createElement('span');
        tag.className = 'type-tag';
        tag.textContent = inquiry.type === 'strategy-audit' ? 'Strategy audit' : 'Contact form';
        requestCell.appendChild(tag);

        row.append(
            dateCell,
            contactCell,
            requestCell,
            createMessageCell(inquiry),
            createStatusCell(inquiry),
            createActionCell(inquiry)
        );
        return row;
    }

    async function loadInquiries() {
        const params = new URLSearchParams({ page: state.page, limit: PAGE_SIZE });
        if (searchInput.value.trim()) params.set('q', searchInput.value.trim());
        if (statusFilter.value) params.set('status', statusFilter.value);
        if (typeFilter.value) params.set('type', typeFilter.value);

        inquiryState.textContent = 'Loading enquiries...';

        try {
            const data = await api('/inquiries?' + params.toString());
            clearDashboardError();

            state.page = data.page;
            state.pages = data.pages;

            inquiryRows.replaceChildren.apply(inquiryRows, data.items.map(renderInquiryRow));
            inquiryState.textContent = data.items.length === 0 ? 'No enquiries match these filters yet.' : '';
            pageLabel.textContent = 'Page ' + data.page + ' of ' + data.pages + ' (' + data.total + ' total)';
            previousPage.disabled = data.page <= 1;
            nextPage.disabled = data.page >= data.pages;
        } catch (error) {
            inquiryState.textContent = '';
            showDashboardError(error);
        }
    }

    function reloadFromFirstPage() {
        state.page = 1;
        loadInquiries();
    }

    let searchTimer;
    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(reloadFromFirstPage, SEARCH_DELAY_MS);
    });
    statusFilter.addEventListener('change', reloadFromFirstPage);
    typeFilter.addEventListener('change', reloadFromFirstPage);

    previousPage.addEventListener('click', function () {
        state.page -= 1;
        loadInquiries();
    });
    nextPage.addEventListener('click', function () {
        state.page += 1;
        loadInquiries();
    });

    /* ---------- start ---------- */

    if (getToken()) showDashboard();
    else showLogin('');
})();
