document.addEventListener("DOMContentLoaded", function () {
    const poster = new Image();
    poster.src = "images/bg.png";

    poster.onload = function () {
        document.querySelector(".preloader").style.display = "none";
    };
});

window.addEventListener("load", function () {
    const video = document.getElementById("background-video");
    if (video) {
        const source = document.createElement("source");
        source.src = video.getAttribute("data-src");
        source.type = "video/mp4";
        video.appendChild(source);
        video.load();
    }
});