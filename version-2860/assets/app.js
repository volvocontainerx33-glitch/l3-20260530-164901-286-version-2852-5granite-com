(function () {
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

  function initNav() {
    const btn = qs("[data-nav-toggle]");
    const nav = qs("[data-nav]");
    if (!btn || !nav) return;
    btn.addEventListener("click", () => {
      nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");
    });
  }

  function normalize(text) {
    return (text || "").toString().toLowerCase().replace(/\s+/g, " ").trim();
  }

  function initSearch() {
    qsa("[data-filter-input]").forEach((input) => {
      const targetSel = input.getAttribute("data-filter-target");
      const target = targetSel ? qs(targetSel) : null;
      if (!target) return;
      const cards = () => qsa("[data-card]", target);
      const chips = qsa("[data-filter-chip]");
      const apply = () => {
        const q = normalize(input.value);
        cards().forEach((card) => {
          const text = normalize(card.getAttribute("data-search") || card.textContent);
          card.classList.toggle("hidden", q && !text.includes(q));
        });
        chips.forEach((chip) => {
          chip.classList.toggle("active", normalize(chip.textContent) === q);
        });
      };
      input.addEventListener("input", apply);
      apply();
    });

    qsa("[data-filter-chip]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const targetSel = chip.getAttribute("data-filter-target");
        const input = targetSel ? qs(targetSel) : null;
        if (!input) return;
        input.value = chip.textContent.trim();
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });
  }

  function parseAttr(line) {
    const attrs = {};
    line.replace(/([A-Z0-9\-]+)=(".*?"|[^,]*)/g, (_, k, v) => {
      attrs[k] = v.replace(/^"|"$/g, "");
      return "";
    });
    return attrs;
  }

  async function playHls(video, url) {
    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({ enableWorker: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      return hls;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      return null;
    }

    const res = await fetch(url);
    const text = await res.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let initURI = null;
    const segments = [];
    let codecs = 'avc1.42E01E';

    for (const line of lines) {
      if (line.startsWith("#EXT-X-MAP:")) {
        const attrs = parseAttr(line.slice("#EXT-X-MAP:".length));
        initURI = attrs.URI || null;
      } else if (line.startsWith("#EXT-X-STREAM-INF:")) {
        const attrs = parseAttr(line.slice("#EXT-X-STREAM-INF:".length));
        if (attrs.CODECS) codecs = attrs.CODECS.replace(/"/g, "");
      } else if (!line.startsWith("#")) {
        segments.push(line);
      }
    }

    const mediaSource = new MediaSource();
    const objectURL = URL.createObjectURL(mediaSource);
    video.src = objectURL;

    await new Promise((resolve, reject) => {
      mediaSource.addEventListener("sourceopen", async () => {
        try {
          const sb = mediaSource.addSourceBuffer(`video/mp4; codecs="${codecs}"`);
          sb.mode = "segments";

          const appendBuffer = (buf) => new Promise((res, rej) => {
            const onEnd = () => res();
            const onErr = () => rej(new Error("append failed"));
            sb.addEventListener("updateend", onEnd, { once: true });
            sb.addEventListener("error", onErr, { once: true });
            sb.appendBuffer(buf);
          });

          if (initURI) {
            const initBuf = await (await fetch(new URL(initURI, url))).arrayBuffer();
            await appendBuffer(initBuf);
          }

          for (const seg of segments) {
            const buf = await (await fetch(new URL(seg, url))).arrayBuffer();
            await appendBuffer(buf);
          }

          mediaSource.endOfStream();
          resolve();
        } catch (err) {
          try { mediaSource.endOfStream("network"); } catch (_) {}
          reject(err);
        }
      }, { once: true });
    });

    return null;
  }

  function initPlayer() {
    qsa("[data-player]").forEach((wrap) => {
      const video = qs("video", wrap);
      if (!video) return;
      const sources = JSON.parse(wrap.getAttribute("data-sources") || "{}");
      const buttons = qsa("[data-source-btn]", wrap);

      async function activate(key) {
        buttons.forEach((b) => b.classList.toggle("active", b.getAttribute("data-source-btn") === key));
        const src = sources[key];
        if (!src) return;
        video.removeAttribute("src");
        video.load();
        try {
          if (key === "hls") {
            await playHls(video, src);
          } else {
            video.src = src;
          }
        } catch (err) {
          console.warn("player source error", err);
          if (sources.mp4 && key !== "mp4") {
            video.src = sources.mp4;
          }
        }
      }

      buttons.forEach((btn) => btn.addEventListener("click", () => activate(btn.getAttribute("data-source-btn"))));
      const defaultKey = sources.hls ? "hls" : (sources.mp4 ? "mp4" : Object.keys(sources)[0]);
      if (defaultKey) activate(defaultKey);
    });
  }

  function initTabs() {
    qsa("[data-tab-target]").forEach((tabBtn) => {
      tabBtn.addEventListener("click", () => {
        const target = tabBtn.getAttribute("data-tab-target");
        qsa("[data-tab-target]").forEach((b) => b.classList.toggle("active", b === tabBtn));
        qsa("[data-tab-panel]").forEach((panel) => panel.classList.toggle("hidden", panel.getAttribute("data-tab-panel") !== target));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initSearch();
    initPlayer();
    initTabs();
  });
})();
