(function() {
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }
  function parseQuery() {
    return new URLSearchParams(window.location.search);
  }
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function cardHtml(m) {
    var bucket = Number(m.bucket || 0);
    var tags = (m.tags || []).slice(0, 3).map(function(t) {
      return '<span class="tag">' + escapeHtml(t) + '</span>';
    }).join('');
    var base = document.body.getAttribute('data-base') || '';
    return [
      '<a class="movie-card bucket-' + bucket + '" href="' + base + m.url + '">',
      '  <div class="movie-card__cover">',
      '    <span class="movie-card__badge">NO.' + String(m.id).padStart(4, '0') + '</span>',
      '    <span class="movie-card__year">' + escapeHtml(m.year) + '</span>',
      '  </div>',
      '  <div class="movie-card__body">',
      '    <h3>' + escapeHtml(m.title) + '</h3>',
      '    <div class="meta-row"><span>' + escapeHtml(m.type) + '</span><span>' + escapeHtml(m.region) + '</span><span>' + escapeHtml((m.genres || []).slice(0, 2).join(' · ')) + '</span></div>',
      '    <p>' + escapeHtml(m.one_line || m.summary || '') + '</p>',
      '    <div class="tag-row">' + tags + '</div>',
      '  </div>',
      '</a>'
    ].join('');
  }
  function initMobileMenu() {
    var btn = $('[data-menu-btn]');
    var drawer = $('[data-mobile-drawer]');
    if (!btn || !drawer) return;
    btn.addEventListener('click', function() {
      drawer.classList.toggle('is-open');
    });
    document.addEventListener('click', function(e) {
      if (!drawer.contains(e.target) && !btn.contains(e.target)) {
        drawer.classList.remove('is-open');
      }
    });
  }
  function initGlobalSearch() {
    $all('form[data-global-search]').forEach(function(form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var q = new FormData(form).get('q') || '';
        var base = document.body.getAttribute('data-base') || '';
        window.location.href = base + 'search.html?q=' + encodeURIComponent(String(q).trim());
      });
    });
  }
  function setActiveNav() {
    var path = location.pathname.replace(/\/+/g, '/');
    $all('.header-nav a').forEach(function(a) {
      var href = a.getAttribute('href') || '';
      if ((path === '/' && href.endsWith('/index.html')) || path.endsWith(href.replace(/^[.]/, ''))) {
        a.classList.add('active');
      }
    });
  }

  function initSearchPage() {
    var root = $('[data-search-page]');
    if (!root || !window.MOVIE_DATA) return;

    var params = parseQuery();
    var input = $('[data-search-input]', root);
    var typeSel = $('[data-search-type]', root);
    var regionSel = $('[data-search-region]', root);
    var yearSel = $('[data-search-year]', root);
    var genreSel = $('[data-search-genre]', root);
    var resultCount = $('[data-result-count]', root);
    var results = $('[data-results]', root);

    function render(list) {
      resultCount.textContent = String(list.length);
      if (!list.length) {
        results.innerHTML = '<div class="section-card"><p class="muted">没有找到匹配影片，请尝试更换关键词或清空筛选条件。</p></div>';
        return;
      }
      results.innerHTML = list.map(cardHtml).join('');
    }

    function filter() {
      var q = String(input.value || '').trim().toLowerCase();
      var typeVal = typeSel.value;
      var regionVal = regionSel.value;
      var yearVal = yearSel.value;
      var genreVal = genreSel.value;

      var list = window.MOVIE_DATA.filter(function(m) {
        var hay = [
          m.title, m.region, m.type, m.year, (m.genres || []).join(' '),
          (m.tags || []).join(' '), m.one_line, m.summary, m.review
        ].join(' ').toLowerCase();
        if (q && hay.indexOf(q) === -1) return false;
        if (typeVal && m.type !== typeVal) return false;
        if (regionVal && m.region !== regionVal) return false;
        if (yearVal && String(m.year) !== yearVal) return false;
        if (genreVal && (m.genres || []).indexOf(genreVal) === -1) return false;
        return true;
      });
      list.sort(function(a, b) {
        return (b.score || 0) - (a.score || 0);
      });
      render(list);
    }

    input.value = params.get('q') || '';
    input.addEventListener('input', filter);
    [typeSel, regionSel, yearSel, genreSel].forEach(function(sel) {
      sel.addEventListener('change', filter);
    });
    filter();
  }

  function initPlayer() {
    var root = $('[data-player]');
    if (!root) return;
    var video = $('video', root);
    var playBtn = $('[data-play-btn]', root);
    var sourceBtns = $all('[data-source-btn]', root);
    var status = $('[data-source-status]', root);
    var mp4 = root.getAttribute('data-mp4');
    var m3u8 = root.getAttribute('data-m3u8');
    var active = 'hls';

    function setBtnActive(kind) {
      active = kind;
      sourceBtns.forEach(function(btn) {
        btn.classList.toggle('active', btn.getAttribute('data-source-btn') === kind);
      });
      if (status) {
        status.textContent = kind === 'hls' ? '当前线路：HLS（如浏览器支持）' : '当前线路：MP4 备用';
      }
    }

    function load(kind) {
      var useHls = kind === 'hls' && video.canPlayType('application/vnd.apple.mpegurl');
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.src = useHls ? m3u8 : mp4;
      video.load();
      setBtnActive(useHls ? 'hls' : 'mp4');
    }

    sourceBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        load(btn.getAttribute('data-source-btn'));
        video.play().catch(function() {});
      });
    });

    playBtn.addEventListener('click', function() {
      if (!video.getAttribute('src')) load(active);
      video.play().catch(function() {});
    });

    video.addEventListener('play', function() {
      root.classList.add('is-playing');
    });

    load('hls');
  }

  document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    initGlobalSearch();
    setActiveNav();
    initSearchPage();
    initPlayer();
  });
})();
