(function () {
  var hlsUrl = "https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js";
  var hlsLoading;

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function loadHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (hlsLoading) {
      return hlsLoading;
    }
    hlsLoading = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = hlsUrl;
      script.async = true;
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return hlsLoading;
  }

  function bindMenu() {
    var button = qs("[data-menu-toggle]");
    if (!button) {
      return;
    }
    button.addEventListener("click", function () {
      document.body.classList.toggle("menu-open");
    });
  }

  function bindHero() {
    var slides = qsa(".hero-slide");
    var tabs = qsa(".hero-tab");
    if (!slides.length || !tabs.length) {
      return;
    }
    var index = 0;
    var timer;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("active", i === index);
      });
      tabs.forEach(function (tab, i) {
        tab.classList.toggle("active", i === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        window.clearInterval(timer);
        show(i);
        start();
      });
    });

    show(0);
    start();
  }

  function bindSearch() {
    var input = qs("[data-search-input]");
    var cards = qsa("[data-search-card]");
    var empty = qs("[data-empty]");
    if (!input || !cards.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var preset = params.get("q") || "";
    if (preset) {
      input.value = preset;
    }

    function normalize(value) {
      return String(value || "").toLowerCase().trim();
    }

    function filter() {
      var keyword = normalize(input.value);
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = normalize(card.getAttribute("data-keywords"));
        var ok = !keyword || haystack.indexOf(keyword) >= 0;
        card.style.display = ok ? "" : "none";
        if (ok) {
          visible += 1;
        }
      });
      if (empty) {
        empty.style.display = visible ? "none" : "block";
      }
    }

    input.addEventListener("input", filter);
    filter();
  }

  function attachVideo(box, video, src) {
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return Promise.resolve();
    }
    return loadHls().then(function (Hls) {
      if (Hls && Hls.isSupported()) {
        if (video._hls) {
          video._hls.destroy();
        }
        var hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        video._hls = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        return;
      }
      video.src = src;
    });
  }

  function bindPlayers() {
    qsa(".player-box[data-play]").forEach(function (box) {
      var video = qs("video", box);
      var button = qs(".player-start", box);
      var src = box.getAttribute("data-play");
      var started = false;

      function start() {
        if (!src || !video) {
          return;
        }
        box.classList.add("is-playing");
        var ready = started ? Promise.resolve() : attachVideo(box, video, src);
        started = true;
        ready.then(function () {
          var playPromise = video.play();
          if (playPromise && playPromise.catch) {
            playPromise.catch(function () {});
          }
        }).catch(function () {
          video.src = src;
          var playPromise = video.play();
          if (playPromise && playPromise.catch) {
            playPromise.catch(function () {});
          }
        });
      }

      if (button) {
        button.addEventListener("click", start);
      }
      if (video) {
        video.addEventListener("click", function () {
          if (video.paused) {
            start();
          }
        });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindMenu();
    bindHero();
    bindSearch();
    bindPlayers();
  });
})();
