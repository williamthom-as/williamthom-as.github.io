(function () {
  "use strict";

  var list = document.getElementById("articles-list");
  if (!list) {
    return; // not on the articles page
  }

  var cards = Array.prototype.slice.call(list.querySelectorAll(".article-card"));
  var tagButtons = document.querySelectorAll("[data-filter-tag]");
  var monthButtons = document.querySelectorAll("[data-filter-month]");
  var countEl = document.getElementById("article-count");
  var emptyEl = document.getElementById("articles-empty");
  var clearBtn = document.getElementById("filter-clear");

  var activeTags = [];   // OR within tags
  var activeMonth = null; // AND with tags

  sizeTagCloud();
  bindFilters();
  apply();

  function sizeTagCloud() {
    var counts = Array.prototype.map.call(tagButtons, readCount);
    if (!counts.length) {
      return;
    }
    var min = Math.min.apply(null, counts);
    var max = Math.max.apply(null, counts);
    var minSize = 0.85;
    var maxSize = 1.5;
    Array.prototype.forEach.call(tagButtons, function (btn) {
      var ratio = max === min ? 0.5 : (readCount(btn) - min) / (max - min);
      btn.style.fontSize = (minSize + ratio * (maxSize - minSize)).toFixed(2) + "rem";
    });
  }

  function readCount(btn) {
    return parseInt(btn.getAttribute("data-count"), 10) || 0;
  }

  function bindFilters() {
    Array.prototype.forEach.call(tagButtons, function (btn) {
      btn.addEventListener("click", function () {
        var tag = btn.getAttribute("data-filter-tag");
        var index = activeTags.indexOf(tag);
        if (index === -1) {
          activeTags.push(tag);
          btn.classList.add("is-active");
        } else {
          activeTags.splice(index, 1);
          btn.classList.remove("is-active");
        }
        apply();
      });
    });

    Array.prototype.forEach.call(monthButtons, function (btn) {
      btn.addEventListener("click", function () {
        var month = btn.getAttribute("data-filter-month");
        activeMonth = activeMonth === month ? null : month;
        Array.prototype.forEach.call(monthButtons, function (other) {
          other.classList.toggle(
            "is-active",
            other.getAttribute("data-filter-month") === activeMonth
          );
        });
        apply();
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", reset);
    }
  }

  function reset() {
    activeTags = [];
    activeMonth = null;
    Array.prototype.forEach.call(tagButtons, function (btn) {
      btn.classList.remove("is-active");
    });
    Array.prototype.forEach.call(monthButtons, function (btn) {
      btn.classList.remove("is-active");
    });
    apply();
  }

  function matches(card) {
    var tags = (card.getAttribute("data-tags") || "").split(" ");
    var tagOk = !activeTags.length || activeTags.some(function (tag) {
      return tags.indexOf(tag) !== -1;
    });
    var monthOk = !activeMonth || card.getAttribute("data-month") === activeMonth;
    return tagOk && monthOk;
  }

  function apply() {
    var visible = 0;
    cards.forEach(function (card) {
      var ok = matches(card);
      card.hidden = !ok;
      if (ok) {
        visible++;
      }
    });
    if (countEl) {
      countEl.textContent = visible;
    }
    if (emptyEl) {
      emptyEl.hidden = visible !== 0;
    }
    if (clearBtn) {
      clearBtn.hidden = !activeTags.length && !activeMonth;
    }
  }
})();
