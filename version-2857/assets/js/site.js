document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.querySelector("[data-menu-toggle]");
    var mobileNav = document.querySelector("[data-mobile-nav]");

    if (toggle && mobileNav) {
        toggle.addEventListener("click", function () {
            mobileNav.classList.toggle("is-open");
        });
    }

    var hero = document.querySelector("[data-hero]");
    if (hero) {
        var track = hero.querySelector("[data-hero-track]");
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var index = 0;

        function go(nextIndex) {
            if (!track || dots.length === 0) {
                return;
            }

            index = (nextIndex + dots.length) % dots.length;
            track.style.transform = "translateX(-" + (index * (100 / dots.length)) + "%)";

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === index);
            });
        }

        dots.forEach(function (dot, dotIndex) {
            dot.addEventListener("click", function () {
                go(dotIndex);
            });
        });

        setInterval(function () {
            go(index + 1);
        }, 5200);
    }

    var filterForms = document.querySelectorAll("[data-filter-form]");
    filterForms.forEach(function (form) {
        var keyword = form.querySelector("[data-filter-keyword]");
        var year = form.querySelector("[data-filter-year]");
        var region = form.querySelector("[data-filter-region]");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter-card]"));
        var empty = document.querySelector("[data-search-empty]");

        function applyFilter() {
            var q = keyword ? keyword.value.trim().toLowerCase() : "";
            var y = year ? year.value : "";
            var r = region ? region.value : "";
            var visible = 0;

            cards.forEach(function (card) {
                var title = (card.getAttribute("data-title") || "").toLowerCase();
                var genre = (card.getAttribute("data-genre") || "").toLowerCase();
                var cardYear = card.getAttribute("data-year") || "";
                var cardRegion = card.getAttribute("data-region") || "";
                var matched = true;

                if (q && title.indexOf(q) === -1 && genre.indexOf(q) === -1) {
                    matched = false;
                }

                if (y && cardYear !== y) {
                    matched = false;
                }

                if (r && cardRegion.indexOf(r) === -1) {
                    matched = false;
                }

                card.style.display = matched ? "" : "none";

                if (matched) {
                    visible += 1;
                }
            });

            if (empty) {
                empty.style.display = visible === 0 ? "block" : "none";
            }
        }

        [keyword, year, region].forEach(function (field) {
            if (field) {
                field.addEventListener("input", applyFilter);
                field.addEventListener("change", applyFilter);
            }
        });

        applyFilter();
    });

    var searchApp = document.querySelector("[data-search-app]");
    if (searchApp && window.MOVIE_SEARCH_INDEX) {
        var input = searchApp.querySelector("[data-search-input]");
        var yearSelect = searchApp.querySelector("[data-search-year]");
        var regionSelect = searchApp.querySelector("[data-search-region]");
        var result = searchApp.querySelector("[data-search-result]");
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get("q") || "";

        if (input) {
            input.value = initialQuery;
        }

        function escapeHtml(value) {
            return String(value || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function render() {
            var q = input ? input.value.trim().toLowerCase() : "";
            var year = yearSelect ? yearSelect.value : "";
            var region = regionSelect ? regionSelect.value : "";
            var matched = window.MOVIE_SEARCH_INDEX.filter(function (item) {
                var haystack = [item.title, item.region, item.genre, item.tags, item.year].join(" ").toLowerCase();
                if (q && haystack.indexOf(q) === -1) {
                    return false;
                }
                if (year && String(item.year) !== year) {
                    return false;
                }
                if (region && item.region.indexOf(region) === -1) {
                    return false;
                }
                return true;
            }).slice(0, 120);

            if (!result) {
                return;
            }

            if (matched.length === 0) {
                result.innerHTML = '<div class="search-empty" style="display:block;">没有找到匹配影片，请尝试其他关键词。</div>';
                return;
            }

            result.innerHTML = matched.map(function (item) {
                return [
                    '<article class="rank-item">',
                    '    <a class="rank-num" href="' + escapeHtml(item.href) + '">' + escapeHtml(item.id) + '</a>',
                    '    <a class="rank-cover" href="' + escapeHtml(item.href) + '">',
                    '        <img src="' + escapeHtml(item.cover) + '" alt="' + escapeHtml(item.title) + '" loading="lazy">',
                    '    </a>',
                    '    <div>',
                    '        <h3><a href="' + escapeHtml(item.href) + '">' + escapeHtml(item.title) + '</a></h3>',
                    '        <p>' + escapeHtml(item.oneLine) + '</p>',
                    '        <span>' + escapeHtml(item.year) + ' · ' + escapeHtml(item.region) + ' · ' + escapeHtml(item.genre) + '</span>',
                    '    </div>',
                    '</article>'
                ].join("");
            }).join("");
        }

        [input, yearSelect, regionSelect].forEach(function (field) {
            if (field) {
                field.addEventListener("input", render);
                field.addEventListener("change", render);
            }
        });

        render();
    }
});
