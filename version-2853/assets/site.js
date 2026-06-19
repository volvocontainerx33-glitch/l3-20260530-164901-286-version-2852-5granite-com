(function () {
  var navToggle = document.querySelector('[data-nav-toggle]');
  var siteNav = document.querySelector('[data-site-nav]');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      siteNav.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('[data-carousel]').forEach(function (carousel) {
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-hero-dot]'));
    var index = 0;

    function showSlide(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        showSlide(dotIndex);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(index + 1);
      }, 5200);
    }
  });

  var listPage = document.body.hasAttribute('data-list-page');

  if (listPage) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card]'));
    var emptyState = document.querySelector('[data-empty-state]');
    var searchForm = document.querySelector('.site-search');
    var searchInput = searchForm ? searchForm.querySelector('input[name="q"]') : null;
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';

    if (searchInput && initialQuery) {
      searchInput.value = initialQuery;
    }

    function normalize(value) {
      return (value || '').toString().toLowerCase().replace(/\s+/g, '');
    }

    function activeFilter() {
      var active = document.querySelector('[data-filter].is-active');
      return active ? active.getAttribute('data-filter') : 'all';
    }

    function applyFilters() {
      var query = normalize(searchInput ? searchInput.value : '');
      var filter = normalize(activeFilter());
      var shown = 0;

      cards.forEach(function (card) {
        var text = normalize(card.getAttribute('data-search'));
        var tokens = normalize(card.getAttribute('data-filter-tokens'));
        var matchQuery = !query || text.indexOf(query) !== -1;
        var matchFilter = filter === 'all' || tokens.indexOf(filter) !== -1;
        var visible = matchQuery && matchFilter;

        card.style.display = visible ? '' : 'none';
        if (visible) {
          shown += 1;
        }
      });

      if (emptyState) {
        emptyState.classList.toggle('is-visible', shown === 0);
      }
    }

    filterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        filterButtons.forEach(function (item) {
          item.classList.remove('is-active');
        });
        button.classList.add('is-active');
        applyFilters();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }

    if (searchForm) {
      searchForm.addEventListener('submit', function (event) {
        event.preventDefault();
        applyFilters();
        var value = searchInput ? searchInput.value.trim() : '';
        var nextUrl = window.location.pathname + (value ? '?q=' + encodeURIComponent(value) : '');
        window.history.replaceState(null, '', nextUrl);
      });
    }

    applyFilters();
  }

  document.querySelectorAll('[data-player]').forEach(function (player) {
    var video = player.querySelector('video');
    var overlay = player.querySelector('.player-overlay');
    var source = player.getAttribute('data-video-src');
    var started = false;
    var instance = null;

    function activatePlayer() {
      if (!video || !source) {
        return;
      }

      if (!started) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          instance = new window.Hls({ enableWorker: true });
          instance.loadSource(source);
          instance.attachMedia(video);
        } else {
          video.src = source;
        }
        started = true;
      }

      if (overlay) {
        overlay.classList.add('is-hidden');
      }

      video.controls = true;
      var playPromise = video.play();

      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function () {
          if (overlay) {
            overlay.classList.remove('is-hidden');
          }
        });
      }
    }

    if (overlay) {
      overlay.addEventListener('click', activatePlayer);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (!started) {
          activatePlayer();
        }
      });
    }

    window.addEventListener('beforeunload', function () {
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
    });
  });
})();
