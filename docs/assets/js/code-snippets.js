(function () {
  "use strict";

  var DIRECTIVE = /^\s*(?:#|\/\/|--|;|%|\/\*|<!--)?\s*(file|hl):\s*(.+?)\s*(?:\*\/|-->)?\s*$/i;

  function debounce(fn, ms) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  function detectLanguage(container, code) {
    if (code.dataset && code.dataset.lang) {
      return code.dataset.lang;
    }
    var match = (container.className + " " + code.className)
      .match(/language-([\w-]+)/);
    var lang = match ? match[1] : "";
    return lang === "plaintext" ? "" : lang;
  }

  function parseRanges(spec) {
    var lines = [];
    spec.split(",").forEach(function (part) {
      var range = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        for (var i = +range[1]; i <= +range[2]; i++) {
          lines.push(i);
        }
      } else if (/^\d+$/.test(part.trim())) {
        lines.push(+part.trim());
      }
    });
    return lines;
  }

  function removeFirstLine(code) {
    var node = code.firstChild;
    while (node) {
      var next = node.nextSibling;
      var nl = node.textContent.indexOf("\n");
      if (nl === -1) {
        code.removeChild(node);
        node = next;
      } else {
        node.textContent = node.textContent.slice(nl + 1);
        return;
      }
    }
  }

  function extractDirectives(code) {
    var result = { filename: "", highlights: [] };
    for (;;) {
      var text = code.textContent;
      var nl = text.indexOf("\n");
      var firstLine = nl === -1 ? text : text.slice(0, nl);
      var match = firstLine.match(DIRECTIVE);
      if (!match) {
        break;
      }
      if (match[1].toLowerCase() === "file") {
        result.filename = match[2];
      } else {
        result.highlights = parseRanges(match[2]);
      }
      removeFirstLine(code);
      if (nl === -1) {
        break;
      }
    }
    return result;
  }

  function copyText(text, button) {
    function flash() {
      button.textContent = "Copied!";
      button.classList.add("is-copied");
      setTimeout(function () {
        button.textContent = "Copy";
        button.classList.remove("is-copied");
      }, 1600);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(flash, function () {});
    } else {
      var area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(area);
      flash();
    }
  }

  function makeButton(className, label, ariaLabel) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "cs-btn " + className;
    button.textContent = label;
    if (ariaLabel) {
      button.setAttribute("aria-label", ariaLabel);
    }
    return button;
  }

  function buildHeader(filename, lang, text, pre) {
    var header = document.createElement("div");
    header.className = "cs-header";

    var name = document.createElement("span");
    name.className = filename ? "cs-name" : "cs-lang";
    name.textContent = filename || lang || "code";

    var actions = document.createElement("div");
    actions.className = "cs-actions";

    var wrap = makeButton("cs-wrap", "Wrap", "Toggle line wrapping");
    wrap.setAttribute("aria-pressed", "false");
    wrap.addEventListener("click", function () {
      var on = pre.classList.toggle("cs-wrapped");
      wrap.setAttribute("aria-pressed", String(on));
      wrap.classList.toggle("is-active", on);
    });

    var copy = makeButton("cs-copy", "Copy", "Copy code to clipboard");
    copy.setAttribute("aria-live", "polite");
    copy.addEventListener("click", function () {
      copyText(text, copy);
    });

    actions.appendChild(wrap);
    actions.appendChild(copy);
    header.appendChild(name);
    header.appendChild(actions);
    return header;
  }

  function lineCount(code) {
    return code.textContent.replace(/\n$/, "").split("\n").length;
  }

  function addLineNumbers(pre, code) {
    var count = lineCount(code);
    if (count < 2) {
      return;
    }
    var numbers = [];
    for (var i = 1; i <= count; i++) {
      numbers.push(i);
    }
    var gutter = document.createElement("span");
    gutter.className = "cs-gutter";
    gutter.setAttribute("aria-hidden", "true");
    gutter.textContent = numbers.join("\n");
    pre.insertBefore(gutter, code);
  }

  function setupLineHighlights(pre, code, lines) {
    function render() {
      var old = pre.querySelectorAll(".cs-hl-line");
      Array.prototype.forEach.call(old, function (el) {
        pre.removeChild(el);
      });
      var count = lineCount(code);
      var height = code.getBoundingClientRect().height / count;
      if (!height || !isFinite(height)) {
        return;
      }
      var top = code.offsetTop;
      lines.forEach(function (n) {
        if (n < 1 || n > count) {
          return;
        }
        var band = document.createElement("div");
        band.className = "cs-hl-line";
        band.style.top = top + (n - 1) * height + "px";
        band.style.height = height + "px";
        pre.appendChild(band);
      });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(render);
    } else {
      render();
    }
    window.addEventListener("resize", debounce(render, 150));
  }

  function enhance(container) {
    if (container.classList.contains("cs-ready")) {
      return;
    }
    var pre = container.querySelector("pre");
    var code = pre && pre.querySelector("code");
    if (!pre || !code) {
      return;
    }
    container.classList.add("cs-ready");

    var directives = extractDirectives(code);
    var lang = detectLanguage(container, code);
    var text = code.textContent.replace(/\n$/, "");

    container.insertBefore(
      buildHeader(directives.filename, lang, text, pre),
      container.firstChild
    );
    addLineNumbers(pre, code);

    if (directives.highlights.length) {
      setupLineHighlights(pre, code, directives.highlights);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var blocks = document.querySelectorAll(
      "div.highlighter-rouge, figure.highlight"
    );
    Array.prototype.forEach.call(blocks, enhance);
  });
})();
