(function () {
    function $(selector, root) {
        return (root || document).querySelector(selector);
    }

    function $all(selector, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }

    function setupMobileMenu() {
        var button = $("[data-menu-button]");
        var panel = $("[data-mobile-panel]");
        if (!button || !panel) {
            return;
        }
        button.addEventListener("click", function () {
            panel.classList.toggle("is-open");
            button.classList.toggle("is-open");
        });
    }

    function setupHero() {
        var stage = $("[data-hero]");
        if (!stage) {
            return;
        }
        var slides = $all("[data-hero-slide]", stage);
        var dots = $all("[data-hero-dot]", stage);
        if (!slides.length) {
            return;
        }
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("is-active", i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("is-active", i === current);
            });
        }

        function start() {
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener("click", function () {
                if (timer) {
                    window.clearInterval(timer);
                }
                show(i);
                start();
            });
        });

        show(0);
        start();
    }

    function normalize(value) {
        return (value || "").toString().trim().toLowerCase();
    }

    function setupFilters() {
        var blocks = $all("[data-filter-block]");
        blocks.forEach(function (block) {
            var input = $("[data-filter-input]", block);
            var region = $("[data-filter-region]", block);
            var year = $("[data-filter-year]", block);
            var cards = $all("[data-movie-card]", block);
            var empty = $("[data-empty-state]", block);

            function apply() {
                var q = normalize(input && input.value);
                var r = normalize(region && region.value);
                var y = normalize(year && year.value);
                var visible = 0;

                cards.forEach(function (card) {
                    var text = normalize(card.getAttribute("data-search"));
                    var cardRegion = normalize(card.getAttribute("data-region"));
                    var cardYear = normalize(card.getAttribute("data-year"));
                    var matched = true;

                    if (q && text.indexOf(q) === -1) {
                        matched = false;
                    }
                    if (r && cardRegion !== r) {
                        matched = false;
                    }
                    if (y && cardYear !== y) {
                        matched = false;
                    }

                    card.style.display = matched ? "" : "none";
                    if (matched) {
                        visible += 1;
                    }
                });

                if (empty) {
                    empty.classList.toggle("is-visible", visible === 0);
                }
            }

            if (input) {
                input.addEventListener("input", apply);
            }
            if (region) {
                region.addEventListener("change", apply);
            }
            if (year) {
                year.addEventListener("change", apply);
            }

            var params = new URLSearchParams(window.location.search);
            var query = params.get("q");
            if (query && input) {
                input.value = query;
            }
            apply();
        });
    }

    function initMoviePlayer(src) {
        var shell = document.querySelector("[data-player]");
        if (!shell) {
            return;
        }
        var video = shell.querySelector("video");
        var cover = shell.querySelector(".player-cover");
        var started = false;
        var hls = null;

        function attachAndPlay() {
            if (!video) {
                return;
            }

            if (!started) {
                started = true;
                if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hls.loadSource(src);
                    hls.attachMedia(video);
                    hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        video.play().catch(function () {});
                    });
                    hls.on(window.Hls.Events.ERROR, function (eventName, data) {
                        if (data && data.fatal && hls) {
                            hls.destroy();
                            hls = null;
                            video.src = src;
                            video.play().catch(function () {});
                        }
                    });
                } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = src;
                    video.addEventListener("loadedmetadata", function () {
                        video.play().catch(function () {});
                    }, { once: true });
                } else {
                    video.src = src;
                    video.play().catch(function () {});
                }
            } else {
                video.play().catch(function () {});
            }

            shell.classList.add("is-playing");
        }

        if (cover) {
            cover.addEventListener("click", attachAndPlay);
        }

        if (video) {
            video.addEventListener("play", function () {
                shell.classList.add("is-playing");
            });
            video.addEventListener("click", function () {
                if (video.paused) {
                    attachAndPlay();
                }
            });
        }
    }

    window.initMoviePlayer = initMoviePlayer;

    document.addEventListener("DOMContentLoaded", function () {
        setupMobileMenu();
        setupHero();
        setupFilters();
    });
})();
