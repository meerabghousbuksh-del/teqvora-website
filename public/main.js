/* =============================================================
   TEQVORA — main.js
   Navigation, loader, scroll animations (GSAP + ScrollTrigger),
   testimonial slider (Swiper) and the desktop cursor trail.

   Libraries are loaded from CDN before this file, in this order:
   Swiper -> GSAP -> ScrollTrigger -> main.js
============================================================= */

(function () {
    'use strict';

    // Guard against the script being included twice on a page.
    if (window.__teqvoraMainLoaded) return;
    window.__teqvoraMainLoaded = true;

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

    const hasGsap = typeof window.gsap !== 'undefined';
    const hasScrollTrigger = hasGsap && typeof window.ScrollTrigger !== 'undefined';

    if (hasScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        // Mobile browsers resize the viewport when the address bar hides;
        // ignoring that avoids a refresh (and visible jump) on every scroll.
        ScrollTrigger.config({ ignoreMobileResize: true });
    }

    function debounce(callback, wait) {
        let timer;
        return function () {
            clearTimeout(timer);
            timer = setTimeout(callback, wait);
        };
    }

    const refreshScrollTriggers = debounce(function () {
        if (hasScrollTrigger) ScrollTrigger.refresh();
    }, 150);


    /* ---------------------------------------------------------
       Images: hide a broken image once, without retrying
    --------------------------------------------------------- */

    function initImageFallbacks() {
        document.querySelectorAll('img').forEach(function (img) {
            const markBroken = function () {
                img.classList.add('img-fallback');
            };

            // The error event may already have fired before this script ran.
            if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) {
                markBroken();
                return;
            }
            img.addEventListener('error', markBroken, { once: true });
        });
    }


    /* ---------------------------------------------------------
       Loader (first visit of a session only)
    --------------------------------------------------------- */

    const LOADER_VISIBLE_MS = 500;

    function initLoader() {
        const loader = document.getElementById('siteLoader');

        return new Promise(function (resolve) {
            if (!loader) {
                resolve();
                return;
            }

            try {
                sessionStorage.setItem('teqvoraLoaderShown', '1');
            } catch (error) {
                // Storage can be blocked (private mode); the loader just shows again next time.
            }

            const hide = function () {
                loader.classList.add('is-hidden');
                resolve();
                setTimeout(function () { loader.remove(); }, 450);
            };

            if (reduceMotionQuery.matches || document.documentElement.classList.contains('skip-loader')) {
                hide();
                return;
            }
            setTimeout(hide, LOADER_VISIBLE_MS);
        });
    }


    /* ---------------------------------------------------------
       Header, back-to-top button
    --------------------------------------------------------- */

    function initScrollState() {
        const header = document.querySelector('.site-header');
        const backToTop = document.getElementById('backToTop');
        let frameRequested = false;

        function update() {
            frameRequested = false;
            const scrolled = window.scrollY;
            if (header) header.classList.toggle('is-scrolled', scrolled > 20);
            if (backToTop) backToTop.classList.toggle('is-visible', scrolled > 700);
        }

        window.addEventListener('scroll', function () {
            if (frameRequested) return;
            frameRequested = true;
            window.requestAnimationFrame(update);
        }, { passive: true });

        if (backToTop) {
            backToTop.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: reduceMotionQuery.matches ? 'auto' : 'smooth' });
            });
        }

        update();
    }


    /* ---------------------------------------------------------
       Services dropdown
    --------------------------------------------------------- */

    function initServicesDropdown() {
        const dropdown = document.querySelector('.nav-dropdown');
        const button = document.querySelector('.nav-dropdown-btn');
        if (!dropdown || !button) return;

        function setOpen(open) {
            dropdown.classList.toggle('is-open', open);
            button.setAttribute('aria-expanded', String(open));
        }

        button.addEventListener('click', function (event) {
            event.stopPropagation();
            setOpen(!dropdown.classList.contains('is-open'));
        });

        document.addEventListener('click', function (event) {
            if (!dropdown.contains(event.target)) setOpen(false);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') setOpen(false);
        });
    }


    /* ---------------------------------------------------------
       Mobile drawer
    --------------------------------------------------------- */

    function initMobileDrawer() {
        const menuToggle = document.getElementById('menuToggle');
        const drawer = document.getElementById('mobileDrawer');
        const closeButton = document.getElementById('drawerClose');
        const overlay = document.getElementById('drawerOverlay');
        if (!menuToggle || !drawer) return;

        function setOpen(open) {
            drawer.classList.toggle('is-open', open);
            drawer.setAttribute('aria-hidden', String(!open));
            menuToggle.setAttribute('aria-expanded', String(open));
            if (overlay) overlay.classList.toggle('is-active', open);
            document.body.classList.toggle('drawer-open', open);

            if (open && hasGsap && !reduceMotionQuery.matches) {
                gsap.fromTo('.mobile-nav a',
                    { opacity: 0, x: 24 },
                    { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: 'power3.out', clearProps: 'transform,opacity' }
                );
            }
        }

        menuToggle.addEventListener('click', function () { setOpen(true); });
        if (closeButton) closeButton.addEventListener('click', function () { setOpen(false); });
        if (overlay) overlay.addEventListener('click', function () { setOpen(false); });

        drawer.querySelectorAll('.mobile-nav a').forEach(function (link) {
            link.addEventListener('click', function () { setOpen(false); });
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && drawer.classList.contains('is-open')) setOpen(false);
        });

        // Leaving the mobile layout while the drawer is open would leave the page locked.
        window.matchMedia('(min-width: 1100px)').addEventListener('change', function (event) {
            if (event.matches) setOpen(false);
        });
    }


    /* ---------------------------------------------------------
       Active navigation item (scroll spy)
    --------------------------------------------------------- */

    function initNavSpy() {
        const links = Array.from(document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-nav a[href^="#"]'));
        const servicesButton = document.querySelector('.nav-dropdown-btn');
        const sections = [
            'home', 'about', 'leadership', 'services', 'process', 'technologies',
            'portfolio', 'testimonials', 'packages', 'faq', 'contact'
        ].map(function (id) { return document.getElementById(id); }).filter(Boolean);

        if (!links.length || !sections.length) return;

        // Right after a nav click the page is still scrolling past other
        // sections; ignore the observer until it settles.
        let ignoreObserverUntil = 0;

        function setActive(id) {
            links.forEach(function (link) {
                const isActive = link.getAttribute('href') === '#' + id;
                link.classList.toggle('active', isActive);
                if (isActive) {
                    link.setAttribute('aria-current', 'true');
                } else {
                    link.removeAttribute('aria-current');
                }
            });
            if (servicesButton) servicesButton.classList.toggle('is-current', id === 'services');
        }

        links.forEach(function (link) {
            link.addEventListener('click', function () {
                ignoreObserverUntil = performance.now() + 900;
                setActive(link.getAttribute('href').slice(1));
            });
        });

        if (!('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver(function (entries) {
            if (performance.now() < ignoreObserverUntil) return;
            entries.forEach(function (entry) {
                if (entry.isIntersecting) setActive(entry.target.id);
            });
        }, { rootMargin: '-45% 0px -50% 0px' });

        sections.forEach(function (section) { observer.observe(section); });
    }


    /* ---------------------------------------------------------
       FAQ accordion
    --------------------------------------------------------- */

    function initFaq() {
        const items = document.querySelectorAll('.faq-item');

        function setAnswerHeight(item, open) {
            const answer = item.querySelector('.faq-answer');
            const question = item.querySelector('.faq-question');
            if (!answer) return;

            item.classList.toggle('is-open', open);
            if (question) question.setAttribute('aria-expanded', String(open));

            if (!hasGsap || reduceMotionQuery.matches) {
                answer.style.height = open ? 'auto' : '0px';
                refreshScrollTriggers();
                return;
            }

            gsap.to(answer, {
                height: open ? answer.scrollHeight : 0,
                duration: 0.35,
                ease: 'power2.inOut',
                overwrite: true,
                onComplete: function () {
                    // 'auto' keeps the answer correct if the viewport is resized while open.
                    if (open) answer.style.height = 'auto';
                    refreshScrollTriggers();
                }
            });
        }

        items.forEach(function (item) {
            const question = item.querySelector('.faq-question');
            if (!question || !item.querySelector('.faq-answer')) return;

            question.setAttribute('aria-expanded', 'false');
            question.addEventListener('click', function () {
                const willOpen = !item.classList.contains('is-open');
                items.forEach(function (other) {
                    if (other !== item && other.classList.contains('is-open')) setAnswerHeight(other, false);
                });
                setAnswerHeight(item, willOpen);
            });
        });
    }


    /* ---------------------------------------------------------
       Testimonial slider (Swiper)
    --------------------------------------------------------- */

    function initTestimonialSwiper() {
        const container = document.querySelector('.testimonial-swiper');
        if (!container) return;

        if (typeof window.Swiper === 'undefined') {
            console.warn('Swiper is not loaded. Check the Swiper script tag.');
            return;
        }

        new Swiper(container, {
            slidesPerView: 1,
            spaceBetween: 24,
            speed: 700,
            loop: true,
            grabCursor: true,
            autoplay: reduceMotionQuery.matches ? false : {
                delay: 4500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true
            },
            navigation: {
                nextEl: '.testimonial-next',
                prevEl: '.testimonial-prev'
            },
            pagination: {
                el: '.testimonial-pagination',
                clickable: true
            },
            breakpoints: {
                0: { slidesPerView: 1, spaceBetween: 18 },
                768: { slidesPerView: 2, spaceBetween: 24 },
                1100: { slidesPerView: 3, spaceBetween: 28 }
            }
        });
    }


    /* ---------------------------------------------------------
       Scroll animations
    --------------------------------------------------------- */

    // The cards have CSS transitions on transform (for hover). Those would
    // fight GSAP while it animates, so they are switched off for the reveal
    // and restored afterwards.
    function suspendTransitions(elements) {
        elements.forEach(function (element) { element.style.transition = 'none'; });
    }

    function restoreTransitions(elements) {
        elements.forEach(function (element) { element.style.transition = ''; });
    }

    // Reveals elements when `trigger` scrolls into view. Elements stay in
    // their hidden state until then and animate once.
    function revealOnScroll(targets, options) {
        const elements = gsap.utils.toArray(targets);
        if (!elements.length) return [];

        const settings = Object.assign({
            trigger: elements[0],
            start: 'top 85%',
            x: 0,
            y: 32,
            duration: 0.8,
            stagger: 0.12
        }, options);

        suspendTransitions(elements);

        gsap.from(elements, {
            x: settings.x,
            y: settings.y,
            opacity: 0,
            duration: settings.duration,
            stagger: settings.stagger,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: settings.trigger, start: settings.start, once: true },
            onComplete: function () { restoreTransitions(elements); }
        });

        return elements;
    }

    function revealSectionHeadings() {
        const touched = [];
        gsap.utils.toArray('.section-heading, .section-heading-row').forEach(function (heading) {
            touched.push.apply(touched, revealOnScroll(heading, { y: 26, start: 'top 88%' }));
        });
        return touched;
    }

    function revealCardGroups() {
        const touched = [];
        const groups = [
            '.about-highlights',
            '.services-grid',
            '.why-features',
            '.portfolio-grid',
            '.packages-grid',
            '.leadership-grid'
        ];

        groups.forEach(function (selector) {
            const group = document.querySelector(selector);
            if (!group) return;
            touched.push.apply(touched, revealOnScroll(group.children, {
                trigger: group,
                start: 'top 85%',
                stagger: 0.1
            }));
        });
        return touched;
    }

    function revealImages() {
        const touched = [];

        // About: the image settles in from the right.
        touched.push.apply(touched, revealOnScroll('.about-image', {
            trigger: '.about-visual',
            start: 'top 82%',
            x: 44,
            y: 0,
            duration: 0.9
        }));

        // Success / reviews section: the visual enters from the right too.
        touched.push.apply(touched, revealOnScroll('.success-visual', {
            trigger: '.success-grid',
            start: 'top 80%',
            x: 44,
            y: 0,
            duration: 0.9
        }));

        // Testimonials: only the avatars move. The Swiper container and slides
        // are left alone so Swiper keeps full control of its own transforms.
        touched.push.apply(touched, revealOnScroll('.testimonial-person img, .testimonial-person .avatar-initials', {
            trigger: '.testimonial-slider-wrapper',
            start: 'top 82%',
            x: -28,
            y: 0,
            duration: 0.7,
            stagger: 0.06
        }));

        return touched;
    }

    function setUpProcessTimeline(isDesktop) {
        const timeline = document.querySelector('.process-timeline');
        const items = gsap.utils.toArray('.timeline-item');
        if (!timeline || !items.length) return;

        // Progress line drawn over the grey track as the section is scrolled.
        const progress = document.createElement('span');
        progress.className = 'timeline-progress';
        progress.setAttribute('aria-hidden', 'true');
        timeline.appendChild(progress);

        gsap.fromTo(progress, { scaleY: 0 }, {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
                trigger: timeline,
                start: 'top 70%',
                end: 'bottom 70%',
                scrub: 0.5
            }
        });

        items.forEach(function (item, index) {
            const marker = item.querySelector('.timeline-marker');
            const content = item.querySelector('.timeline-content');
            if (!marker || !content) return;

            // .timeline-item uses display: contents, so it has no box of its
            // own; the marker is the element that gets scrolled into view.
            const sideOffset = isDesktop ? (index % 2 === 0 ? -32 : 32) : 0;

            gsap.timeline({
                defaults: { ease: 'power3.out' },
                scrollTrigger: { trigger: marker, start: 'top 86%', once: true }
            })
                .from(marker, { scale: 0.6, opacity: 0, duration: 0.4, clearProps: 'transform,opacity' })
                .from(content, {
                    x: sideOffset,
                    y: isDesktop ? 12 : 22,
                    opacity: 0,
                    duration: 0.6,
                    clearProps: 'transform,opacity'
                }, '-=0.2');
        });

        return function removeProgress() { progress.remove(); };
    }

    // Hero metric cards float gently, but only while the hero is on screen.
    function setUpHeroFloat() {
        const cards = gsap.utils.toArray('.metric-card');
        const hero = document.querySelector('.hero-section');
        if (!cards.length || !hero) return;

        const tweens = cards.map(function (card, index) {
            return gsap.to(card, {
                y: index % 2 === 0 ? -14 : 14,
                duration: 3 + index * 0.6,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut'
            });
        });

        ScrollTrigger.create({
            trigger: hero,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: function (self) {
                tweens.forEach(function (tween) {
                    if (self.isActive) tween.play(); else tween.pause();
                });
            }
        });
    }

    function createHeroIntro() {
        const timeline = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
        const buttons = gsap.utils.toArray('.hero-actions .btn');
        suspendTransitions(buttons);

        timeline
            .from('.site-header', { y: -24, opacity: 0, duration: 0.5, clearProps: 'transform,opacity' }, 0)
            .from('.hero-content .eyebrow', { y: 18, opacity: 0, duration: 0.5, clearProps: 'transform,opacity' }, 0.1)
            .from('.hero-content h1', { y: 28, opacity: 0, duration: 0.7, clearProps: 'transform,opacity' }, 0.2)
            .from('.hero-description', { y: 18, opacity: 0, duration: 0.6, clearProps: 'transform,opacity' }, 0.4)
            .from('.hero-actions .btn', { y: 16, opacity: 0, duration: 0.5, stagger: 0.08, clearProps: 'transform,opacity' }, 0.5)
            .from('.hero-image-wrap', { y: 20, scale: 0.97, opacity: 0, duration: 0.9, ease: 'expo.out', clearProps: 'transform,opacity' }, 0.25)
            .from('.metric-card', { opacity: 0, duration: 0.5, stagger: 0.1, clearProps: 'opacity' }, 0.8)
            .add(function () { restoreTransitions(buttons); });

        return timeline;
    }

    function initScrollAnimations(loaderDone) {
        if (!hasGsap || !hasScrollTrigger || reduceMotionQuery.matches) {
            document.body.classList.add('no-gsap');
            return;
        }

        // The hero intro plays once, after the loader. Everything else is
        // scroll-driven and stays hidden until its trigger is reached.
        const heroIntro = createHeroIntro();
        loaderDone.then(function () { heroIntro.play(); });

        const mediaQueries = gsap.matchMedia();

        mediaQueries.add({
            isDesktop: '(min-width: 768px)',
            isSmallMobile: '(max-width: 575px)',
            reduceMotion: '(prefers-reduced-motion: reduce)'
        }, function (context) {
            const conditions = context.conditions;
            if (conditions.reduceMotion) return;

            const touchedElements = [];
            touchedElements.push.apply(touchedElements, revealSectionHeadings());
            touchedElements.push.apply(touchedElements, revealCardGroups());
            touchedElements.push.apply(touchedElements, revealImages());
            touchedElements.push.apply(touchedElements, revealOnScroll('.about-content', {
                trigger: '.about-grid', start: 'top 80%', y: 28
            }));
            touchedElements.push.apply(touchedElements, revealOnScroll('.contact-grid > *', {
                trigger: '.contact-grid', start: 'top 82%', y: 30, stagger: 0.15
            }));

            const removeProgress = setUpProcessTimeline(conditions.isDesktop);
            if (!conditions.isSmallMobile) setUpHeroFloat();

            // Runs when the media query stops matching or the page is torn down.
            return function cleanup() {
                restoreTransitions(touchedElements);
                if (removeProgress) removeProgress();
            };
        });

        // Trigger positions depend on image and font sizes, so recalculate once
        // everything has loaded. ScrollTrigger handles window resizes itself.
        window.addEventListener('load', function () { ScrollTrigger.refresh(); }, { once: true });
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(refreshScrollTriggers);
        }
    }


    /* ---------------------------------------------------------
       Cursor trail (desktop pointers only)
    --------------------------------------------------------- */

    function initCursorTrail() {
        if (!finePointerQuery.matches || reduceMotionQuery.matches) return;

        const TRAIL_LIFETIME_MS = 420;
        const FOLLOW_EASING = 0.26;
        const MAX_ALPHA = 0.5;
        const LINE_WIDTH = 1.6;

        const canvas = document.createElement('canvas');
        canvas.className = 'cursor-trail';
        canvas.setAttribute('aria-hidden', 'true');
        document.body.appendChild(canvas);

        const context = canvas.getContext('2d');
        if (!context) return;

        // Use the site's primary colour so the trail follows the theme.
        const primary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#FF4D00';
        const rgb = hexToRgb(primary);

        const points = [];
        const pointer = { x: 0, y: 0 };
        const head = { x: 0, y: 0 };
        let hasPointer = false;
        let frameId = null;

        function hexToRgb(hex) {
            const value = hex.replace('#', '');
            const full = value.length === 3
                ? value.split('').map(function (char) { return char + char; }).join('')
                : value;
            return {
                r: parseInt(full.slice(0, 2), 16) || 255,
                g: parseInt(full.slice(2, 4), 16) || 77,
                b: parseInt(full.slice(4, 6), 16) || 0
            };
        }

        function resize() {
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(window.innerWidth * ratio);
            canvas.height = Math.round(window.innerHeight * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
        }

        function draw(now) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.lineCap = 'round';

            for (let i = 1; i < points.length; i++) {
                const life = 1 - (now - points[i].time) / TRAIL_LIFETIME_MS;
                if (life <= 0) continue;

                context.strokeStyle = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (life * life * MAX_ALPHA) + ')';
                context.lineWidth = LINE_WIDTH * (0.4 + 0.6 * life);
                context.beginPath();
                context.moveTo(points[i - 1].x, points[i - 1].y);
                context.lineTo(points[i].x, points[i].y);
                context.stroke();
            }
        }

        function tick(now) {
            // The trail head eases toward the pointer, which gives the slight lag.
            head.x += (pointer.x - head.x) * FOLLOW_EASING;
            head.y += (pointer.y - head.y) * FOLLOW_EASING;

            const last = points[points.length - 1];
            if (!last || Math.hypot(head.x - last.x, head.y - last.y) > 0.4) {
                points.push({ x: head.x, y: head.y, time: now });
            }

            while (points.length && now - points[0].time > TRAIL_LIFETIME_MS) points.shift();

            draw(now);

            // Stop the loop once the trail has faded completely.
            if (points.length > 1) {
                frameId = requestAnimationFrame(tick);
            } else {
                context.clearRect(0, 0, canvas.width, canvas.height);
                points.length = 0;
                frameId = null;
            }
        }

        function onPointerMove(event) {
            if (event.pointerType && event.pointerType !== 'mouse') return;

            pointer.x = event.clientX;
            pointer.y = event.clientY;
            if (!hasPointer) {
                head.x = pointer.x;
                head.y = pointer.y;
                hasPointer = true;
            }
            if (frameId === null) frameId = requestAnimationFrame(tick);
        }

        resize();
        window.addEventListener('resize', debounce(resize, 150), { passive: true });
        window.addEventListener('pointermove', onPointerMove, { passive: true });
    }


    /* ---------------------------------------------------------
       Start
    --------------------------------------------------------- */

    function start() {
        initImageFallbacks();
        initScrollState();
        initServicesDropdown();
        initMobileDrawer();
        initNavSpy();
        initFaq();
        initTestimonialSwiper();

        const loaderDone = initLoader();
        initScrollAnimations(loaderDone);
        initCursorTrail();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
