function initServicePage(root) {
    root = root || document;

    const $ = (selector) => root.querySelector(selector);
    const $$ = (selector) => [...root.querySelectorAll(selector)];

    const hasGsap = typeof gsap !== 'undefined';
    const hasScrollTrigger = hasGsap && typeof ScrollTrigger !== 'undefined';
    if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    let currentService = SERVICES[0];
    let query = '';
    let toastTimer;
    const scrollTriggers = {};

    const escapeHtml = (text) =>
        text.replace(/[&<>"']/g, (char) => '&#' + char.charCodeAt(0) + ';');

    // Highlights every whitespace-separated search term individually so
    // multi-word queries ("shop tiktok") mark correctly, not just an exact
    // substring match of the whole query.
    const highlight = (text) => {
        const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (!terms.length) return text;

        let result = text;
        terms.forEach((term) => {
            const pattern = new RegExp(
                term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                'ig'
            );
            result = result.replace(pattern, (match) => `<mark>${match}</mark>`);
        });
        return result;
    };

    const findMatches = () => {
        const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
        if (!words.length) return SERVICES;
        return SERVICES.filter((service) => {
            const haystack = (service.name + ' ' + service.cat + ' ' + service.kw).toLowerCase();
            return words.every((word) => haystack.includes(word));
        });
    };

    const dropdown = $('#searchResultsDropdown');
    const setTheme = (theme) => document.documentElement.setAttribute('data-theme', theme);

    // Runs a batched scroll reveal for a group of elements, keyed so repeat
    // calls (switching services) kill the previous triggers before creating
    // new ones instead of stacking duplicates.
    const reveal = (elements, key) => {
        if (!hasScrollTrigger || !elements.length) return;

        (scrollTriggers[key] || []).forEach((trigger) => trigger.kill());
        gsap.set(elements, { opacity: 0, y: 40 });

        scrollTriggers[key] = ScrollTrigger.batch(elements, {
            start: 'top 92%',
            once: true,
            onEnter: (batch) =>
                gsap.to(batch, {
                    opacity: 1,
                    y: 0,
                    duration: 0.7,
                    stagger: 0.12,
                    ease: 'power3.out',
                    overwrite: true
                })
        });

        ScrollTrigger.refresh();
    };

    const renderTabs = (animate) => {
        const matches = findMatches();

        $('#tabContainer').innerHTML = matches.length
            ? matches.map((service) => `
                <button data-svc="${service.id}" class="svc-tab ${service.id === currentService.id ? 'active' : ''}">
                    <i class="${service.icon}"></i>${highlight(service.name)}
                </button>
            `).join('')
            : '<span class="text-sm py-1.5 text-[var(--color-text-muted)]">No services found</span>';

        $('#activeCountBadge').textContent =
            matches.length + ' Service' + (matches.length === 1 ? '' : 's') + ' Available';

        if (animate && hasGsap) {
            gsap.from($$('.svc-tab'), { opacity: 0, y: 10, duration: 0.35, stagger: 0.05, ease: 'power2.out' });
        }
    };

    const renderSearchDropdown = () => {
        const matches = findMatches();

        dropdown.innerHTML = matches.length
            ? matches.map((service) => `
                <button data-svc="${service.id}" class="sr-item">
                    <span class="sr-ic"><i class="${service.icon}"></i></span>
                    <span><b>${highlight(service.name)}</b><small>${service.cat}</small></span>
                </button>
            `).join('')
            : `
                <div class="sr-empty">
                    <i class="fa-regular fa-face-frown"></i>
                    <p>No services found for "<b>${escapeHtml(query)}</b>"</p>
                    <button data-reset class="btn-secondary px-4 py-2 text-xs">Reset search</button>
                </div>
            `;

        dropdown.classList.remove('hidden');
        if (hasGsap) gsap.from(dropdown.children, { opacity: 0, y: 8, duration: 0.25, stagger: 0.04 });
    };

    const renderContent = (animate) => {
        const service = currentService;
        const index = SERVICES.indexOf(service);

        $('#heroBreadcrumb').textContent = service.name;
        $('#heroCategoryBadge').textContent = service.cat;
        $('#heroTitle').textContent = service.title;
        $('#heroDescription').textContent = service.desc;
        $('#heroPrimaryCta').textContent = service.cta;
        $('#whatWeDoHeading').textContent = service.name + ': practical support built around your next move.';

        $('#deliverablesGrid').innerHTML = service.items.map((item) => `
            <div class="custom-card p-6">
                <div class="ic-box"><i class="fa-solid ${item[2] || 'fa-circle-check'}"></i></div>
                <h3 class="text-lg font-bold text-[var(--color-navy)] mb-2">${item[0]}</h3>
                <p class="text-sm text-[var(--color-text-secondary)] leading-relaxed">${item[1]}</p>
            </div>
        `).join('');

        $('#exploreGrid').innerHTML = [1, 2, 3]
            .map((offset) => SERVICES[(index + offset) % SERVICES.length])
            .map((related) => `
                <div class="custom-card p-6 flex flex-col gap-3">
                    <div class="ic-box"><i class="${related.icon}"></i></div>
                    <h3 class="text-lg font-bold text-[var(--color-navy)]">${related.name}</h3>
                    <p class="text-sm text-[var(--color-text-secondary)] flex-1">${related.desc}</p>
                    <button data-svc="${related.id}" class="text-sm font-bold text-[var(--color-primary)] text-left">
                        Explore <i class="fa-solid fa-arrow-right text-xs"></i>
                    </button>
                </div>
            `).join('');

        if (hasGsap && animate) {
            gsap.fromTo(
                [$('#heroTitle'), $('#heroDescription'), $('#heroPrimaryCta').closest('button')],
                { opacity: 0, y: 24 },
                { opacity: 1, y: 0, duration: 0.55, stagger: 0.1, ease: 'power3.out' }
            );
        }

        reveal($$('#deliverablesGrid > div'), 'deliverables');
        reveal($$('#exploreGrid > div'), 'explore');
    };

    const syncSearchInputs = (value) => {
        ['#navSearchInput', '#mobileSearchInput'].forEach((selector) => {
            const input = $(selector);
            if (input && input.value !== value) input.value = value;
        });
        $('#searchClearBtn').classList.toggle('hidden', !value);
    };

    const handleSearchInput = (value) => {
        query = value;
        syncSearchInputs(value);

        const matches = findMatches();
        // Preview the matched service's theme while searching, but only
        // while the dropdown is actually open with a single result. Losing
        // focus without selecting anything restores the real active theme
        // so the page never gets stuck themed for a service that was never
        // actually chosen.
        setTheme(query.trim() && matches.length === 1 ? matches[0].theme : currentService.theme);

        renderTabs(true);
        query.trim() ? renderSearchDropdown() : dropdown.classList.add('hidden');
    };

    const closeSearchDropdown = () => {
        dropdown.classList.add('hidden');
        setTheme(currentService.theme);
    };

    const selectService = (id, shouldScroll) => {
        currentService = SERVICES.find((service) => service.id === id) || currentService;
        query = '';
        syncSearchInputs('');
        closeSearchDropdown();
        renderTabs();
        renderContent(true);

        if (shouldScroll) {
            $('#heroTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const toggleModal = (id, open) => {
        const modal = $('#' + id);
        if (!modal) return;

        if (open) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            if (hasGsap) {
                gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.25 });
                if (modal.firstElementChild) {
                    gsap.fromTo(
                        modal.firstElementChild,
                        { opacity: 0, y: 30, scale: 0.96 },
                        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' }
                    );
                }
            }
        } else {
            const finish = () => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            };
            hasGsap ? gsap.to(modal, { opacity: 0, duration: 0.2, onComplete: finish }) : finish();
        }
    };

    const showToast = (title, message) => {
        $('#toastTitle').textContent = title;
        $('#toastMessage').textContent = message;
        const toast = $('#toastNotification');
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
    };

    const formatCurrency = (amount) => '$' + Math.round(amount).toLocaleString('en-US');

    // Rough revenue-uplift multiplier used for the illustrative ROI slider.
    const ROI_PROJECTED_MULTIPLIER = 1.428;

    const calculateRoi = () => {
        const currentRevenue = +$('#revSlider').value;
        const projectedRevenue = currentRevenue * ROI_PROJECTED_MULTIPLIER;
        $('#revVal').textContent = formatCurrency(currentRevenue);
        $('#estRev').textContent = formatCurrency(projectedRevenue) + '/mo';
        $('#estLift').textContent = '+' + formatCurrency((projectedRevenue - currentRevenue) * 12);
    };

    const API_BASE_URL = (window.TEQVORA_CONFIG && window.TEQVORA_CONFIG.API_BASE_URL) || '';
    const CONTACT_ENDPOINT = API_BASE_URL + '/api/contact';

    const clearFieldErrors = (form) => {
        form.querySelectorAll('.form-group.has-error').forEach((group) => {
            group.classList.remove('has-error');
            const message = group.querySelector('.field-error');
            if (message) message.remove();
        });
    };

    const showFieldErrors = (form, errors) => {
        Object.keys(errors).forEach((fieldName) => {
            const field = form.elements[fieldName];
            const group = field && field.closest ? field.closest('.form-group') : null;
            if (!group) return;

            const message = document.createElement('span');
            message.className = 'field-error';
            message.textContent = errors[fieldName];
            group.classList.add('has-error');
            group.appendChild(message);
        });
    };

    const setStatus = (statusEl, message, kind) => {
        if (!statusEl) return;
        statusEl.textContent = message;
        statusEl.classList.remove('success', 'error');
        if (kind) statusEl.classList.add(kind);
    };

    // Posts a form to /api/contact. Success is only reported after the server
    // answers with a 2xx status; the server's own message is shown either way.
    const submitForm = async (form, statusEl, options) => {
        if (form.dataset.submitting === 'true') return;

        const submitButton = form.querySelector('[type="submit"]');
        const originalLabel = submitButton ? submitButton.innerHTML : '';

        clearFieldErrors(form);
        setStatus(statusEl, '');
        form.dataset.submitting = 'true';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
        }

        try {
            const fields = Object.fromEntries(new FormData(form));
            const response = await fetch(CONTACT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...fields,
                    type: options.type,
                    consent: Boolean(fields.consent),
                    page: window.location.pathname
                })
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (data.errors) showFieldErrors(form, data.errors);
                const message = data.message || 'We could not send your request. Please try again.';
                setStatus(statusEl, message, 'error');
                showToast('Request not sent', message);
                return;
            }

            form.reset();
            setStatus(statusEl, data.message, 'success');
            showToast(options.successTitle, data.message);
            if (options.onSuccess) options.onSuccess();
        } catch (error) {
            console.error('Enquiry request failed:', error);
            const message = 'Could not reach the server. Check your connection and try again.';
            setStatus(statusEl, message, 'error');
            showToast('Request not sent', message);
        } finally {
            delete form.dataset.submitting;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalLabel;
            }
        }
    };

    const api = {
        handleSearchInput,
        handleSearchFocus: () => renderSearchDropdown(),
        clearSearch: () => handleSearchInput(''),

        openBookingModal: () => {
            $('#modalServiceInput').value = currentService.name;
            toggleModal('bookingModal', true);
        },
        closeBookingModal: () => toggleModal('bookingModal', false),

        openRoiModal: () => {
            calculateRoi();
            toggleModal('roiModal', true);
        },
        closeRoiModal: () => toggleModal('roiModal', false),
        calculateRoi,

        handleFormSubmit: (e) => {
            e.preventDefault();
            submitForm(e.target, $('#formStatus'), { type: 'contact', successTitle: 'Enquiry sent' });
        },

        handleModalSubmit: (e) => {
            e.preventDefault();
            submitForm(e.target, $('#modalStatus'), {
                type: 'strategy-audit',
                successTitle: 'Call requested',
                onSuccess: () => toggleModal('bookingModal', false)
            });
        },

        toggleMobileMenu: () => $('#mobileMenu').classList.toggle('hidden')
    };

    Object.assign(window, api);

    const onDocumentClick = (e) => {
        const target = e.target;
        const serviceButton = target.closest('[data-svc]');

        if (serviceButton && root.contains(serviceButton)) {
            selectService(serviceButton.dataset.svc, !serviceButton.classList.contains('svc-tab'));
            return;
        }
        if (target.closest('[data-reset]')) {
            api.clearSearch();
            return;
        }
        if (target.id === 'bookingModal' || target.id === 'roiModal') {
            toggleModal(target.id, false);
        }
        // Both search inputs (desktop nav + mobile) count as "inside" the
        // search UI so tapping into the mobile field doesn't immediately
        // close the dropdown it just opened.
        if (!target.closest('#searchResultsDropdown, #navSearchInput, #mobileSearchInput')) {
            dropdown.classList.add('hidden');
        }
    };

    const onDocumentKeydown = (e) => {
        if (!/SearchInput/.test(e.target.id || '')) return;
        if (e.key === 'Enter' && findMatches()[0]) selectService(findMatches()[0].id, true);
        if (e.key === 'Escape') dropdown.classList.add('hidden');
    };

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);

    setTheme(currentService.theme);
    renderTabs();
    renderContent(false);
    calculateRoi();

    if (hasGsap) {
        gsap.from($$('main > section:first-child .lg\\:col-span-7 > *'), {
            opacity: 0,
            y: 30,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out'
        });
        reveal(
            $$('.text-center.max-w-3xl, #process .custom-card, #difference .custom-card, #metrics .custom-card, main > section:last-child .grid > div'),
            'sections'
        );
    }

    // Teardown: removes listeners, clears the window-level API and kills any
    // live ScrollTriggers. Call this before calling initServicePage() again
    // on the same page (e.g. a re-render or SPA navigation) to avoid
    // duplicate document-level listeners and clobbered globals.
    return () => {
        document.removeEventListener('click', onDocumentClick);
        document.removeEventListener('keydown', onDocumentKeydown);
        Object.keys(api).forEach((key) => delete window[key]);
        Object.values(scrollTriggers).flat().forEach((trigger) => trigger.kill());
        document.documentElement.removeAttribute('data-theme');
    };
}

// Guard against double-initialization if this script is ever injected more
// than once on the same page (duplicate <script> tag, SPA re-navigation).
if (!window.__servicePageCleanup) {
    const start = () => {
        window.__servicePageCleanup = initServicePage();
    };
    document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', start)
        : start();
}
