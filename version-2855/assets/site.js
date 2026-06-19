(function () {
  var menuButton = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.mobile-nav');

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', function () {
      var opened = mobileNav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', opened ? 'true' : 'false');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
  var prev = document.querySelector('[data-hero-prev]');
  var next = document.querySelector('[data-hero-next]');
  var heroIndex = 0;
  var heroTimer = null;

  function showHero(index) {
    if (!slides.length) {
      return;
    }

    heroIndex = (index + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('active', slideIndex === heroIndex);
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('active', dotIndex === heroIndex);
    });
  }

  function scheduleHero() {
    if (!slides.length) {
      return;
    }

    clearInterval(heroTimer);
    heroTimer = setInterval(function () {
      showHero(heroIndex + 1);
    }, 5200);
  }

  if (slides.length) {
    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        showHero(dotIndex);
        scheduleHero();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        showHero(heroIndex - 1);
        scheduleHero();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showHero(heroIndex + 1);
        scheduleHero();
      });
    }

    scheduleHero();
  }

  var filterInput = document.querySelector('[data-filter-input]');
  var filterType = document.querySelector('[data-filter-type]');
  var filterYear = document.querySelector('[data-filter-year]');
  var filterRegion = document.querySelector('[data-filter-region]');
  var filterStatus = document.querySelector('[data-filter-status]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card]'));

  function textOf(card) {
    return [
      card.getAttribute('data-title') || '',
      card.getAttribute('data-region') || '',
      card.getAttribute('data-genre') || '',
      card.getAttribute('data-year') || '',
      card.getAttribute('data-type') || '',
      card.textContent || ''
    ].join(' ').toLowerCase();
  }

  function applyFilter() {
    if (!cards.length) {
      return;
    }

    var keyword = filterInput ? filterInput.value.trim().toLowerCase() : '';
    var typeValue = filterType ? filterType.value.trim().toLowerCase() : '';
    var yearValue = filterYear ? filterYear.value.trim() : '';
    var regionValue = filterRegion ? filterRegion.value.trim().toLowerCase() : '';
    var hasVisible = false;

    cards.forEach(function (card) {
      var haystack = textOf(card);
      var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
      var matchType = !typeValue || haystack.indexOf(typeValue) !== -1;
      var matchYear = !yearValue || (card.getAttribute('data-year') || '').indexOf(yearValue) !== -1;
      var matchRegion = !regionValue || (card.getAttribute('data-region') || '').toLowerCase().indexOf(regionValue) !== -1;
      var visible = matchKeyword && matchType && matchYear && matchRegion;

      card.hidden = !visible;

      if (visible) {
        hasVisible = true;
      }
    });

    if (filterStatus) {
      filterStatus.textContent = hasVisible ? '已按当前条件更新影片列表。' : '没有找到匹配影片，可尝试减少筛选条件。';
    }
  }

  [filterInput, filterType, filterYear, filterRegion].forEach(function (control) {
    if (control) {
      control.addEventListener('input', applyFilter);
      control.addEventListener('change', applyFilter);
    }
  });

  var player = document.getElementById('movie-player');
  var startButton = document.querySelector('.player-start');

  function playWithStream(video, stream) {
    if (!video || !stream) {
      return;
    }

    var card = video.closest('.player-card');

    if (card) {
      card.classList.add('playing');
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream;
      video.play().catch(function () {});
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      if (window.__activeHls) {
        window.__activeHls.destroy();
      }

      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      window.__activeHls = hls;
      hls.loadSource(stream);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        video.play().catch(function () {});
      });
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (!data || !data.fatal) {
          return;
        }

        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
        }
      });
      return;
    }

    video.src = stream;
    video.play().catch(function () {});
  }

  if (player && startButton) {
    startButton.addEventListener('click', function () {
      playWithStream(player, startButton.getAttribute('data-stream'));
    });

    player.addEventListener('play', function () {
      var card = player.closest('.player-card');

      if (card) {
        card.classList.add('playing');
      }
    });

    document.addEventListener('keydown', function (event) {
      if (!player || document.activeElement && /input|select|textarea/i.test(document.activeElement.tagName)) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        if (player.paused) {
          player.play().catch(function () {});
        } else {
          player.pause();
        }
      }

      if (event.key && event.key.toLowerCase() === 'f') {
        if (player.requestFullscreen) {
          player.requestFullscreen();
        }
      }

      if (event.key && event.key.toLowerCase() === 'm') {
        player.muted = !player.muted;
      }

      if (event.key === 'ArrowRight') {
        player.currentTime = Math.min(player.duration || player.currentTime + 5, player.currentTime + 5);
      }

      if (event.key === 'ArrowLeft') {
        player.currentTime = Math.max(0, player.currentTime - 5);
      }
    });
  }
})();
