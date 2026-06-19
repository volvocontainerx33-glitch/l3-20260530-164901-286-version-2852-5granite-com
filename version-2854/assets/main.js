document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dots button'));
  if (slides.length > 1) {
    var active = 0;
    var show = function (index) {
      active = index;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === active);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === active);
      });
    };
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
      });
    });
    window.setInterval(function () {
      show((active + 1) % slides.length);
    }, 5200);
  }

  var searchInput = document.querySelector('[data-search-input]');
  var regionSelect = document.querySelector('[data-region-select]');
  var typeSelect = document.querySelector('[data-type-select]');
  var resultBox = document.querySelector('[data-search-results]');
  if (searchInput && resultBox && Array.isArray(window.searchMovies)) {
    var render = function () {
      var keyword = searchInput.value.trim().toLowerCase();
      var region = regionSelect ? regionSelect.value : '';
      var type = typeSelect ? typeSelect.value : '';
      var results = window.searchMovies.filter(function (movie) {
        var text = [movie.title, movie.genre, movie.tags, movie.year, movie.category].join(' ').toLowerCase();
        var keywordMatched = !keyword || text.indexOf(keyword) !== -1;
        var regionMatched = !region || movie.region === region;
        var typeMatched = !type || movie.type === type;
        return keywordMatched && regionMatched && typeMatched;
      }).slice(0, 120);
      resultBox.innerHTML = results.map(function (movie) {
        return '<article class="movie-card"><a class="poster-link" href="' + movie.href + '"><span class="poster-shell"><img src="' + movie.image + '" alt="' + movie.title.replace(/"/g, '&quot;') + '" loading="lazy" onerror="this.style.opacity=0"><span class="poster-shade"></span><span class="play-badge">▶</span><span class="corner-badge">' + movie.type + '</span></span><h3>' + movie.title + '</h3><p>' + movie.genre + '</p><span class="meta-line">' + movie.year + ' · ' + movie.category + '</span></a></article>';
      }).join('');
    };
    searchInput.addEventListener('input', render);
    if (regionSelect) {
      regionSelect.addEventListener('change', render);
    }
    if (typeSelect) {
      typeSelect.addEventListener('change', render);
    }
    render();
  }
});
