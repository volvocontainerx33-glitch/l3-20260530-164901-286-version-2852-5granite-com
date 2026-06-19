(function () {
    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    ready(function () {
        var toggle = document.querySelector('.mobile-toggle');
        var mobileNav = document.querySelector('.mobile-nav');

        if (toggle && mobileNav) {
            toggle.addEventListener('click', function () {
                var open = mobileNav.classList.toggle('is-open');
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                toggle.textContent = open ? '×' : '☰';
            });
        }

        var hero = document.querySelector('[data-hero]');
        if (hero) {
            var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
            var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
            var prev = hero.querySelector('[data-hero-prev]');
            var next = hero.querySelector('[data-hero-next]');
            var active = 0;
            var timer = null;

            function show(index) {
                if (!slides.length) {
                    return;
                }
                active = (index + slides.length) % slides.length;
                slides.forEach(function (slide, i) {
                    slide.classList.toggle('is-active', i === active);
                });
                dots.forEach(function (dot, i) {
                    dot.classList.toggle('is-active', i === active);
                });
            }

            function restart() {
                if (timer) {
                    clearInterval(timer);
                }
                timer = setInterval(function () {
                    show(active + 1);
                }, 5200);
            }

            if (prev) {
                prev.addEventListener('click', function () {
                    show(active - 1);
                    restart();
                });
            }

            if (next) {
                next.addEventListener('click', function () {
                    show(active + 1);
                    restart();
                });
            }

            dots.forEach(function (dot, index) {
                dot.addEventListener('click', function () {
                    show(index);
                    restart();
                });
            });

            show(0);
            restart();
        }

        var filterBar = document.querySelector('[data-filter-bar]');
        if (filterBar) {
            var textInput = filterBar.querySelector('[data-filter-text]');
            var yearSelect = filterBar.querySelector('[data-filter-year]');
            var regionSelect = filterBar.querySelector('[data-filter-region]');
            var cards = Array.prototype.slice.call(document.querySelectorAll('[data-search-item]'));

            function applyFilters() {
                var query = textInput ? textInput.value.trim().toLowerCase() : '';
                var year = yearSelect ? yearSelect.value : '';
                var region = regionSelect ? regionSelect.value : '';

                cards.forEach(function (card) {
                    var haystack = [
                        card.getAttribute('data-title') || '',
                        card.getAttribute('data-region') || '',
                        card.getAttribute('data-year') || '',
                        card.getAttribute('data-genre') || ''
                    ].join(' ').toLowerCase();
                    var okText = !query || haystack.indexOf(query) !== -1;
                    var okYear = !year || (card.getAttribute('data-year') || '') === year;
                    var okRegion = !region || (card.getAttribute('data-region') || '') === region;
                    card.classList.toggle('is-filter-hidden', !(okText && okYear && okRegion));
                });
            }

            [textInput, yearSelect, regionSelect].forEach(function (node) {
                if (node) {
                    node.addEventListener('input', applyFilters);
                    node.addEventListener('change', applyFilters);
                }
            });
        }

        var searchForm = document.querySelector('[data-search-page]');
        var searchResults = document.querySelector('[data-search-results]');
        if (searchForm && searchResults && Array.isArray(window.SEARCH_MOVIES)) {
            var input = searchForm.querySelector('input[name="q"]');
            var params = new URLSearchParams(window.location.search);
            var initial = params.get('q') || '';
            input.value = initial;

            function card(movie) {
                return [
                    '<article class="movie-card">',
                    '<a class="poster-link" href="./' + movie.file + '" aria-label="' + movie.title + '">',
                    '<img src="./' + movie.cover + '.jpg" alt="' + movie.title + '" loading="lazy">',
                    '<span class="poster-badge">' + movie.year + '</span>',
                    '</a>',
                    '<div class="movie-card-body">',
                    '<a class="movie-title" href="./' + movie.file + '">' + movie.title + '</a>',
                    '<p class="movie-meta">' + movie.region + ' · ' + movie.type + ' · ' + movie.genre + '</p>',
                    '<p class="movie-line">' + movie.line + '</p>',
                    '</div>',
                    '</article>'
                ].join('');
            }

            function runSearch(query) {
                var q = query.trim().toLowerCase();
                var pool = window.SEARCH_MOVIES;
                var matches = q ? pool.filter(function (movie) {
                    return movie.text.indexOf(q) !== -1;
                }) : pool.slice(0, 24);
                searchResults.innerHTML = matches.slice(0, 120).map(card).join('');
            }

            searchForm.addEventListener('submit', function (event) {
                event.preventDefault();
                runSearch(input.value);
                var url = new URL(window.location.href);
                if (input.value.trim()) {
                    url.searchParams.set('q', input.value.trim());
                } else {
                    url.searchParams.delete('q');
                }
                window.history.replaceState({}, '', url.toString());
            });

            input.addEventListener('input', function () {
                runSearch(input.value);
            });

            runSearch(initial);
        }

        var video = document.getElementById('video-player');
        var mask = document.querySelector('[data-play-mask]');
        if (video && mask && window.PAGE_STREAM) {
            var attached = false;
            var hlsInstance = null;

            function attach() {
                if (attached) {
                    return;
                }
                attached = true;
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = window.PAGE_STREAM;
                } else if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({ enableWorker: true });
                    hlsInstance.loadSource(window.PAGE_STREAM);
                    hlsInstance.attachMedia(video);
                } else {
                    video.src = window.PAGE_STREAM;
                }
            }

            function play() {
                attach();
                mask.classList.add('is-hidden');
                video.setAttribute('controls', 'controls');
                var result = video.play();
                if (result && typeof result.catch === 'function') {
                    result.catch(function () {});
                }
            }

            mask.addEventListener('click', play);
            video.addEventListener('click', function () {
                if (video.paused) {
                    play();
                }
            });
            window.addEventListener('beforeunload', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        }
    });
})();
