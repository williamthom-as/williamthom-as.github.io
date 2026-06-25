(function () {
  "use strict";

  // Wrap a standalone post image (the sole content of its paragraph) in a
  // <figure>, lifting its title/alt into a caption. Inline images are left be.
  function buildFigure(img) {
    var p = img.parentNode;
    var isBlock = p && p.tagName === "P" &&
      p.querySelectorAll("img").length === 1 &&
      p.textContent.trim() === "";
    if (!isBlock) {
      return;
    }

    var figure = document.createElement("figure");
    figure.className = "post-figure";
    p.parentNode.insertBefore(figure, p);
    figure.appendChild(img);
    p.parentNode.removeChild(p);

    var caption = img.getAttribute("title") || img.getAttribute("alt");
    if (caption) {
      var figcaption = document.createElement("figcaption");
      figcaption.textContent = caption;
      figure.appendChild(figcaption);
      img.removeAttribute("title"); // avoid a duplicate native tooltip
    }
  }

  function createLightbox() {
    var overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Image preview");
    overlay.hidden = true;

    var img = document.createElement("img");
    img.className = "lightbox__img";
    img.alt = "";
    overlay.appendChild(img);
    document.body.appendChild(overlay);

    function close() {
      overlay.classList.remove("is-open");
      document.body.classList.remove("lightbox-open");
      setTimeout(function () {
        if (!overlay.classList.contains("is-open")) {
          overlay.hidden = true;
        }
      }, 200);
    }

    function open(src, alt) {
      img.src = src;
      img.alt = alt || "";
      overlay.hidden = false;
      document.body.classList.add("lightbox-open");
      requestAnimationFrame(function () {
        overlay.classList.add("is-open");
      });
    }

    overlay.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !overlay.hidden) {
        close();
      }
    });

    return open;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var content = document.querySelector(".post-content");
    if (!content) {
      return;
    }
    var images = content.querySelectorAll("img");
    if (!images.length) {
      return;
    }

    var openLightbox = createLightbox();
    Array.prototype.forEach.call(images, function (img) {
      buildFigure(img);
      img.classList.add("is-zoomable");
      img.addEventListener("click", function () {
        openLightbox(img.currentSrc || img.src, img.alt);
      });
    });
  });
})();
