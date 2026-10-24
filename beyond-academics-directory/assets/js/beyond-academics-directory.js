(function () {
    const root = document.getElementById('beyond-academics-directory');
    if (!root) {
        return;
    }

    function setupFilters(prefix, selector, total) {
        const form = root.querySelector('[data-filter-form="' + prefix + '"]');
        if (!form) {
            return;
        }

        const items = Array.from(root.querySelectorAll(selector));
        const search = root.querySelector('#' + prefix + '-search');
        const fields = {
            domain: root.querySelector('#' + prefix + '-domain'),
            grade: root.querySelector('#' + prefix + '-grade'),
            scope: root.querySelector('#' + prefix + '-scope'),
            format: root.querySelector('#' + prefix + '-format'),
            difficulty: root.querySelector('#' + prefix + '-difficulty')
        };
        const count = root.querySelector('#' + prefix + '-count');
        const empty = root.querySelector('#' + prefix + '-empty');

        const allGradeOptions = Array.from(fields.grade.options);

        function syncGradeOptions() {
            const domain = fields.domain.value;
            const available = new Set();
            items.forEach(function (item) {
                if (domain !== 'all' && !(item.dataset.domains || '').split('|').includes(domain)) {
                    return;
                }
                (item.dataset.grades || '').split('|').forEach(function (grade) {
                    available.add(grade);
                });
            });
            const current = fields.grade.value;
            fields.grade.replaceChildren.apply(fields.grade, allGradeOptions.filter(function (option) {
                return option.value === 'all' || available.has(option.value);
            }));
            fields.grade.value = Array.from(fields.grade.options).some(function (option) {
                return option.value === current;
            }) ? current : 'all';
        }

        function minStars(item) {
            const values = (item.dataset.difficulties || '').split('|').map(Number).filter(function (n) {
                return n > 0;
            });
            return values.length ? Math.min.apply(null, values) : Infinity;
        }

        function sortByDifficulty() {
            const body = items[0] && items[0].parentNode;
            if (!body) {
                return;
            }
            items.slice().sort(function (a, b) {
                return minStars(a) - minStars(b);
            }).forEach(function (item) {
                body.appendChild(item);
            });
        }

        function applyFilters() {
            syncGradeOptions();
            const query = (search.value || '').trim().toLowerCase();
            let visible = 0;

            items.forEach(function (item) {
                const domains = (item.dataset.domains || '').split('|');
                const grades = (item.dataset.grades || '').split('|');
                const scopes = (item.dataset.scopes || '').split('|');
                const formats = (item.dataset.formats || '').split('|');
                const difficulties = (item.dataset.difficulties || '').split('|');
                const matches = (!query || (item.dataset.search || '').includes(query))
                    && (fields.domain.value === 'all' || domains.includes(fields.domain.value))
                    && (fields.grade.value === 'all' || grades.includes(fields.grade.value))
                    && (fields.scope.value === 'all' || scopes.includes(fields.scope.value))
                    && (fields.format.value === 'all' || formats.includes(fields.format.value))
                    && (fields.difficulty.value === 'all' || difficulties.includes(fields.difficulty.value));

                item.classList.toggle('beyond-academics-hidden', !matches);
                if (matches) {
                    visible += 1;
                }
            });

            sortByDifficulty();
            if (count) {
                count.textContent = visible + ' of ' + total + ' competitions';
            }
            if (empty) {
                empty.hidden = visible !== 0;
            }
        }

        form.addEventListener('input', applyFilters);
        form.addEventListener('change', applyFilters);
        form.querySelector('[data-clear-filters="' + prefix + '"]').addEventListener('click', function () {
            form.querySelectorAll('input').forEach(function (input) {
                input.value = '';
            });
            form.querySelectorAll('select').forEach(function (select) {
                select.value = 'all';
            });
            applyFilters();
        });
        applyFilters();
    }

    function setContentsMode(contents, mediaQuery) {
        contents.open = !mediaQuery.matches;
    }

    function setupSpotlight() {
        root.querySelectorAll('.beyond-academics-spotlight').forEach(setupSpotlightSection);
    }

    function setupSpotlightSection(section) {
        section.classList.add('is-enhanced');
        const pins = Array.from(section.querySelectorAll('[data-hotspot]'));
        const items = Array.from(section.querySelectorAll('[data-hotspot-panel]'));
        let timer = null;
        let current = 0;

        function activate(index) {
            pins.forEach(function (pin) {
                const on = pin.dataset.hotspot === index;
                pin.classList.toggle('is-active', on);
                pin.setAttribute('aria-pressed', String(on));
            });
            items.forEach(function (item) {
                item.classList.toggle('is-active', item.dataset.hotspotPanel === index);
            });
        }

        function choose(index) {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
            activate(index);
        }

        pins.forEach(function (pin) {
            ['click', 'mouseenter', 'focus'].forEach(function (type) {
                pin.addEventListener(type, function () {
                    choose(pin.dataset.hotspot);
                });
            });
        });
        items.forEach(function (item) {
            item.addEventListener('click', function () {
                choose(item.dataset.hotspotPanel);
            });
        });

        activate('0');
        if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
            timer = setInterval(function () {
                current = (current + 1) % pins.length;
                activate(String(current));
            }, 3800);
        }
    }

    function setupTilt() {
        root.querySelectorAll('[data-tilt]').forEach(setupTiltPhoto);
    }

    function setupTiltPhoto(photo) {
        if (!window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
            return;
        }

        function reset() {
            photo.style.setProperty('--tilt-x', '0deg');
            photo.style.setProperty('--tilt-y', '0deg');
        }

        photo.addEventListener('pointermove', function (event) {
            const rect = photo.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            photo.style.setProperty('--tilt-x', (-y * 7).toFixed(2) + 'deg');
            photo.style.setProperty('--tilt-y', (x * 9).toFixed(2) + 'deg');
            photo.style.setProperty('--glare-x', ((x + 0.5) * 100).toFixed(0) + '%');
            photo.style.setProperty('--glare-y', ((y + 0.5) * 100).toFixed(0) + '%');
        });
        photo.addEventListener('pointerleave', reset);
    }

    function initialize() {
        setupSpotlight();
        setupTilt();
        // Setup master directory collapse/expand
        const masterToggle = root.querySelector('#master-toggle');
        const masterContent = root.querySelector('#master-content');
        if (masterToggle && masterContent) {
            masterToggle.addEventListener('click', function(e) {
                e.preventDefault();
                const isExpanded = masterToggle.getAttribute('aria-expanded') === 'true';
                masterToggle.setAttribute('aria-expanded', !isExpanded);
                masterContent.classList.toggle('is-collapsed');
                masterToggle.textContent = isExpanded ? '+' : '−';
            });
        }
        const uniqueCount = root.querySelectorAll('#master-directory tbody tr').length;
        setupFilters('master', '#master-directory tbody tr', uniqueCount);

        const contents = root.querySelector('#handbook-directory');
        const compactContents = window.matchMedia('(max-width: 760px)');
        if (contents) {
            setContentsMode(contents, compactContents);
            compactContents.addEventListener('change', function () {
                setContentsMode(contents, compactContents);
            });
        }

        root.addEventListener('click', function (event) {
            const link = event.target.closest('a[href^="#"]');
            if (!link) {
                return;
            }

            const domain = link.dataset.domainFilter;
            if (domain) {
                const domainFilter = root.querySelector('#master-domain');
                if (domainFilter) {
                    domainFilter.value = domain;
                    domainFilter.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }

            const target = root.querySelector(link.getAttribute('href'));
            if (!target) {
                return;
            }

            event.preventDefault();
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
            window.history.replaceState(null, '', link.getAttribute('href'));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
})();
