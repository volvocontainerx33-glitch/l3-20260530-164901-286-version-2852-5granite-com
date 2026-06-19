document.addEventListener("DOMContentLoaded", function () {
    var players = document.querySelectorAll("[data-player]");

    players.forEach(function (box) {
        var video = box.querySelector("video");
        var cover = box.querySelector("[data-player-cover]");
        var button = box.querySelector("[data-player-button]");
        var source = box.getAttribute("data-src");

        function startPlayer() {
            if (!video || !source) {
                return;
            }

            if (cover) {
                cover.classList.add("is-hidden");
            }

            if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });

                hls.loadSource(source);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    video.play().catch(function () {
                        video.controls = true;
                    });
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
                video.addEventListener("loadedmetadata", function () {
                    video.play().catch(function () {
                        video.controls = true;
                    });
                });
            } else {
                video.src = source;
                video.play().catch(function () {
                    video.controls = true;
                });
            }

            video.controls = true;
        }

        if (button) {
            button.addEventListener("click", startPlayer);
        }

        if (cover) {
            cover.addEventListener("click", function (event) {
                if (event.target === cover) {
                    startPlayer();
                }
            });
        }
    });
});
