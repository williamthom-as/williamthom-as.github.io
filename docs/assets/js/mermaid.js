// Renders ```mermaid fenced code blocks as diagrams.
//
// Rouge has no mermaid lexer, so kramdown emits a bare
// <pre><code class="language-mermaid">SOURCE</code></pre>. We pull out the raw
// source, swap the block for a render host, and lazy-load Mermaid from the CDN
// only when a page actually contains a diagram.
(function () {
  "use strict";

  var MERMAID_SRC =
    "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

  // Replace every mermaid code block with a render host and return the hosts.
  function collectDiagrams() {
    var codes = document.querySelectorAll("code.language-mermaid");
    var nodes = [];

    Array.prototype.forEach.call(codes, function (code) {
      var source = code.textContent.replace(/\n+$/, "");
      if (!source.trim()) {
        return;
      }

      // Block is a bare <pre><code>; if a build ever wraps it in a Rouge
      // <div.highlighter-rouge>, replace that outer wrapper instead.
      var block = (code.closest && code.closest("pre")) || code.parentNode || code;
      var container =
        (block.closest && block.closest("div.highlighter-rouge")) || block;

      var host = document.createElement("div");
      host.className = "mermaid-diagram";

      var graph = document.createElement("div");
      graph.className = "mermaid";
      graph.textContent = source;

      host.appendChild(graph);
      container.parentNode.replaceChild(host, container);
      nodes.push(graph);
    });

    return nodes;
  }

  function render() {
    var nodes = collectDiagrams();
    if (!nodes.length) {
      return; // no diagrams on this page -> never fetch the library
    }

    import(MERMAID_SRC)
      .then(function (mod) {
        var mermaid = mod.default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "strict",
          fontFamily: "'Inter', sans-serif",
          // Render at natural pixel size; CSS scales the SVG up to the
          // container width. Keeping the graph NARROW (vertical TB layout +
          // tight nodeSpacing) means that scale is an UP-scale, so text stays
          // big. rankSpacing gives the vertical edges room for their labels.
          flowchart: {
            useMaxWidth: false,
            padding: 14,
            nodeSpacing: 40,
            rankSpacing: 60
          },
          sequence: { useMaxWidth: false }
        });
        return mermaid.run({ nodes: nodes });
      })
      .catch(function (err) {
        // On failure (or blocked CDN) reveal the raw source so the diagram
        // text is at least readable rather than silently hidden.
        nodes.forEach(function (node) {
          var host = node.parentNode;
          if (host) {
            host.className += " mermaid-error";
          }
        });
        if (window.console && console.error) {
          console.error("Mermaid render failed:", err);
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
