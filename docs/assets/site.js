(function () {
  var ORDER = ["logistic", "random_forest_classifier", "ridge", "query_ranking", "random"];
  var SHARED_AXIS_MIN = -0.03;
  var SHARED_AXIS_MAX = 0.03;
  var data = null;
  var fraction = "0.10";
  var showAll = false;

  function round4(text) {
    var raw = String(text);
    var sign = "";
    if (raw.charAt(0) === "-" || raw.charAt(0) === "−") {
      sign = "−";
      raw = raw.slice(1);
    } else if (raw.charAt(0) === "+") {
      raw = raw.slice(1);
    }
    var bits = raw.split(".");
    var whole = bits[0] || "0";
    var frac = (bits[1] || "") + "00000";
    var keep = frac.slice(0, 4).split("");
    if (frac.charAt(4) >= "5") {
      var index = 3;
      while (index >= 0) {
        if (keep[index] !== "9") {
          keep[index] = String(Number(keep[index]) + 1);
          break;
        }
        keep[index] = "0";
        index -= 1;
      }
      if (index < 0) whole = String(Number(whole) + 1);
    }
    var body = whole + "." + keep.join("");
    return sign && body !== "0.0000" ? sign + body : body;
  }

  function direction(text) {
    var value = Number(text);
    if (value > 0) return "higher";
    if (value < 0) return "lower";
    return "unchanged";
  }

  function selectedMethod() {
    return document.getElementById("strategy").value;
  }

  function rowsFor(list, current) {
    return ORDER.map(function (method) {
      return list.find(function (row) {
        return row.fraction === current && row.method === method;
      });
    }).filter(Boolean);
  }

  function currentRow() {
    return data.budget.find(function (row) {
      return row.fraction === fraction && row.method === selectedMethod();
    });
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function svgEl(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }

  function svgText(x, y, content, size, anchor) {
    var node = svgEl("text");
    node.setAttribute("x", x);
    node.setAttribute("y", y);
    node.setAttribute("font-size", Math.max(12, size));
    if (anchor) node.setAttribute("text-anchor", anchor);
    node.textContent = content;
    return node;
  }

  function textLines(content, size, maxWidth) {
    var words = String(content).split(" ");
    var lines = [];
    var current = "";
    words.forEach(function (word) {
      var next = current ? current + " " + word : word;
      if (current && next.length * size * 0.56 > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    });
    if (current) lines.push(current);
    return lines;
  }

  function addLines(svg, x, y, content, size, maxWidth) {
    var step = size + 5;
    textLines(content, size, maxWidth).forEach(function (line, index) {
      svg.appendChild(svgText(x, y + index * step, line, size));
    });
    return y + textLines(content, size, maxWidth).length * step;
  }

  function chartWidth(svg) {
    return Math.max(280, Math.floor(svg.parentElement.getBoundingClientRect().width));
  }

  function prepare(svg, label, width, height) {
    clear(svg);
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.style.height = height + "px";
    svg.setAttribute("aria-label", label);
    var title = svgEl("title");
    title.textContent = label;
    svg.appendChild(title);
  }

  function tickValues(minValue, maxValue) {
    var span = maxValue - minValue;
    var rough = span / 4;
    var magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
    var fractionOfStep = rough / magnitude;
    var nice = fractionOfStep >= 5 ? 5 : fractionOfStep >= 2 ? 2 : 1;
    var step = nice * magnitude;
    var start = Math.ceil((minValue - step * 0.001) / step) * step;
    var values = [];
    for (var value = start; value <= maxValue + step * 0.001; value += step) {
      values.push(Number(value.toFixed(6)));
    }
    return values;
  }

  function formatTick(value) {
    var rounded = Math.round(value * 1000) / 1000;
    if (Object.is(rounded, -0)) rounded = 0;
    return rounded.toFixed(Math.abs(rounded) >= 0.1 || rounded === 0 ? 1 : 3);
  }

  function drawHorizontal(svg, title, unit, guideLine, items, minValue, maxValue, guide) {
    var width = chartWidth(svg);
    var narrow = width < 420;
    var rowHeight = narrow ? 78 : 52;
    var maxText = width - 32;
    var top = 18 + textLines(title, 16, maxText).length * 21 + textLines(unit, 13, maxText).length * 18;
    if (guideLine) top += textLines(guideLine, 13, maxText).length * 18;
    top += 8;
    var height = top + items.length * rowHeight + 28;
    prepare(svg, title, width, height);
    var cursor = addLines(svg, 16, 22, title, 16, maxText);
    cursor = addLines(svg, 16, cursor, unit, 13, maxText);
    if (guideLine) addLines(svg, 16, cursor, guideLine, 13, maxText);
    var left = 16;
    var plotWidth = width - 32;
    function xOf(value) {
      return left + (value - minValue) / (maxValue - minValue) * plotWidth;
    }
    items.forEach(function (item, index) {
      var y = top + index * rowHeight;
      svg.appendChild(svgText(left, y + 16, item.label, 13));
      svg.appendChild(svgText(width - 16, y + (narrow ? 36 : 16), item.display, 13, "end"));
      var track = svgEl("rect");
      track.setAttribute("x", left);
      track.setAttribute("y", y + (narrow ? 46 : 24));
      track.setAttribute("width", plotWidth);
      track.setAttribute("height", 10);
      track.setAttribute("fill", "#e3e9ef");
      svg.appendChild(track);
      var start = xOf(Math.max(minValue, Math.min(item.value, 0)));
      var end = xOf(item.value);
      if (item.value >= 0) start = xOf(Math.max(minValue, 0));
      var bar = svgEl("rect");
      bar.setAttribute("x", Math.min(start, end));
      bar.setAttribute("y", y + (narrow ? 46 : 24));
      bar.setAttribute("width", Math.max(1, Math.abs(end - start)));
      bar.setAttribute("height", 10);
      bar.setAttribute("fill", item.value < 0 ? "#b55454" : "#168a81");
      svg.appendChild(bar);
    });
    if (guide !== null) {
      var guideX = xOf(guide);
      var line = svgEl("line");
      line.setAttribute("x1", guideX);
      line.setAttribute("x2", guideX);
      line.setAttribute("y1", top);
      line.setAttribute("y2", top + items.length * rowHeight - 8);
      line.setAttribute("stroke", "#185e72");
      line.setAttribute("stroke-dasharray", "4 3");
      svg.appendChild(line);
    }
    tickValues(minValue, maxValue).forEach(function (tick) {
      var x = xOf(tick);
      var anchor = "middle";
      if (x < 28) {
        x = 8;
        anchor = "start";
      } else if (x > width - 28) {
        x = width - 8;
        anchor = "end";
      }
      svg.appendChild(svgText(x, height - 8, formatTick(tick), 12, anchor));
    });
  }

  function intervalScale() {
    var low = SHARED_AXIS_MIN;
    var high = SHARED_AXIS_MAX;
    data.budget.forEach(function (row) {
      low = Math.min(low, Number(row.interval_low), Number(row.delta_ndcg));
      high = Math.max(high, Number(row.interval_high), Number(row.delta_ndcg));
    });
    return { min: low, max: high };
  }

  function drawIntervals(rows) {
    var svg = document.getElementById("interval-chart");
    var width = chartWidth(svg);
    var budgetLabel = rows[0].fraction_label;
    var title = "Retrieval gain at a " + budgetLabel + " budget";
    var narrow = width < 420;
    var rowHeight = narrow ? 78 : 58;
    var maxText = width - 32;
    var top = 18 + textLines(title, 16, maxText).length * 21 + textLines("Change in macro nDCG@10", 13, maxText).length * 18 + 78;
    var height = top + rows.length * rowHeight + 36;
    prepare(svg, title, width, height);
    var cursor = addLines(svg, 16, 22, title, 16, maxText);
    cursor = addLines(svg, 16, cursor, "Change in macro nDCG@10", 13, maxText);
    svg.appendChild(svgText(16, cursor, "Solid line, filled circle:", 13));
    svg.appendChild(svgText(16, cursor + 18, "query-resampling interval", 13));
    svg.appendChild(svgText(16, cursor + 42, "Dashed line, open square:", 13));
    svg.appendChild(svgText(16, cursor + 60, "random-selection range", 13));
    var scale = intervalScale();
    var left = 36;
    var plotWidth = width - 72;
    function xOf(value) {
      return left + (value - scale.min) / (scale.max - scale.min) * plotWidth;
    }
    var zero = svgEl("line");
    zero.setAttribute("x1", xOf(0));
    zero.setAttribute("x2", xOf(0));
    zero.setAttribute("y1", top);
    zero.setAttribute("y2", top + rows.length * rowHeight);
    zero.setAttribute("stroke", "#152438");
    svg.appendChild(zero);
    rows.forEach(function (row, index) {
      var y = top + index * rowHeight + (narrow ? 52 : 36);
      svg.appendChild(svgText(16, y - (narrow ? 32 : 16), row.label, 13));
      svg.appendChild(svgText(width - 16, y - (narrow ? 14 : 16), row.delta_display, 13, "end"));
      var line = svgEl("line");
      line.setAttribute("x1", xOf(Number(row.interval_low)));
      line.setAttribute("x2", xOf(Number(row.interval_high)));
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      line.setAttribute("stroke", "#185e72");
      line.setAttribute("stroke-width", "2");
      if (row.interval_kind === "random_subset") line.setAttribute("stroke-dasharray", "5 4");
      svg.appendChild(line);
      [-1, 1].forEach(function (side) {
        var cap = svgEl("line");
        var x = xOf(side < 0 ? Number(row.interval_low) : Number(row.interval_high));
        cap.setAttribute("x1", x);
        cap.setAttribute("x2", x);
        cap.setAttribute("y1", y - 6);
        cap.setAttribute("y2", y + 6);
        cap.setAttribute("stroke", "#185e72");
        svg.appendChild(cap);
      });
      var point = xOf(Number(row.delta_ndcg));
      var mark = svgEl(row.interval_kind === "random_subset" ? "rect" : "circle");
      if (row.interval_kind === "random_subset") {
        mark.setAttribute("x", point - 5);
        mark.setAttribute("y", y - 5);
        mark.setAttribute("width", "10");
        mark.setAttribute("height", "10");
        mark.setAttribute("fill", "#ffffff");
        mark.setAttribute("stroke", "#185e72");
        mark.setAttribute("stroke-width", "2");
      } else {
        mark.setAttribute("cx", point);
        mark.setAttribute("cy", y);
        mark.setAttribute("r", "5");
        mark.setAttribute("fill", "#185e72");
      }
      svg.appendChild(mark);
    });
    [-0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03].forEach(function (tick) {
      if (tick < scale.min - 0.0001 || tick > scale.max + 0.0001) return;
      var x = xOf(tick);
      var anchor = "middle";
      if (x < 36) {
        x = 8;
        anchor = "start";
      } else if (x > width - 36) {
        x = width - 8;
        anchor = "end";
      }
      svg.appendChild(svgText(x, height - 10, formatTick(tick), 12, anchor));
    });
  }

  function renderCharts() {
    drawHorizontal(
      document.getElementById("ap-chart"),
      "Positive-gain ranking",
      "Average precision (AP)",
      "Positive-class prevalence: 37/297",
      data.ranking.map(function (row) {
        return { label: row.label, value: Number(row.ap), display: row.ap_display };
      }),
      0,
      0.5,
      37 / 297
    );
    var gains = rowsFor(data.budget, fraction);
    var values = gains.map(function (row) { return Number(row.delta_ndcg); });
    var minValue = Math.min(0, Math.min.apply(null, values));
    var maxValue = Math.max(0, Math.max.apply(null, values));
    var pad = Math.max(maxValue - minValue, 0.001) * 0.15;
    var budgetLabel = gains[0].fraction_label;
    drawHorizontal(
      document.getElementById("gain-chart"),
      "Retrieval gain at a " + budgetLabel + " budget",
      "Change in macro nDCG@10",
      "",
      gains.map(function (row) {
        return { label: row.label, value: Number(row.delta_ndcg), display: row.delta_display };
      }),
      minValue - pad,
      maxValue + pad,
      null
    );
    document.getElementById("gain-caption").textContent = "The horizontal axis is the change in macro nDCG@10 at a " + budgetLabel + " budget. Random selection is a comparison only and has no per-query results.";
    drawIntervals(gains);
  }

  function renderSummary() {
    var row = currentRow();
    var kind = row.interval_kind === "random_subset" ? "Random-selection range" : "Query-resampling interval";
    document.getElementById("condition").textContent = row.fraction_label + " budget · " + row.actual_k + " replacements · Sequence weight " + data.weight;
    var headline = document.getElementById("headline");
    headline.textContent = row.delta_display;
    headline.className = "headline " + (Number(row.delta_ndcg) < 0 ? "down" : Number(row.delta_ndcg) > 0 ? "up" : "");
    document.getElementById("baseline-line").textContent = "No-replacement baseline: " + round4(data.baseline_ndcg);
    document.getElementById("before-ndcg").textContent = round4(data.baseline_ndcg);
    document.getElementById("after-ndcg").textContent = round4(row.ndcg);
    document.getElementById("interval-kind").textContent = kind;
    document.getElementById("interval-text").textContent = row.interval_low_display + " to " + row.interval_high_display;
    document.getElementById("macro-note").textContent = "The macro-average gain for the current strategy and budget is " + row.delta_display + " (" + direction(row.delta_ndcg) + ", " + row.fraction_label + ", " + row.label + "). Search filters the displayed rows only. The macro average is always calculated across all 28 queries for the current strategy and budget.";
  }

  function countText(count) {
    if (count === 0) return "No queries found.";
    if (count === 1) return "Showing 1 query.";
    return "Showing " + count + " queries.";
  }

  function renderQueries() {
    var method = selectedMethod();
    var query = document.getElementById("query-search").value.trim().toLowerCase();
    var matches = data.per_query.filter(function (row) {
      if (row.fraction !== fraction || row.method !== method) return false;
      if (!query) return true;
      return row.go_id.toLowerCase().indexOf(query) !== -1 || row.name.toLowerCase().indexOf(query) !== -1;
    });
    var visible = query || showAll ? matches : matches.slice(0, 10);
    var list = document.getElementById("query-list");
    clear(list);
    visible.forEach(function (row) {
      var card = document.createElement("article");
      card.className = "query-card";
      var title = document.createElement("div");
      title.className = "query-title";
      var heading = document.createElement("h3");
      heading.textContent = row.go_id;
      var name = document.createElement("p");
      name.textContent = row.name;
      title.appendChild(heading);
      title.appendChild(name);
      var metrics = document.createElement("dl");
      metrics.className = "query-metrics";
      [
        ["Before", row.baseline_display, ""],
        ["After", row.ndcg_display, ""],
        ["Gain", row.delta_display, Number(row.delta_ndcg) < 0 ? "down" : Number(row.delta_ndcg) > 0 ? "up" : ""]
      ].forEach(function (item) {
        var cell = document.createElement("div");
        var term = document.createElement("dt");
        term.textContent = item[0];
        var value = document.createElement("dd");
        value.textContent = item[1];
        if (item[2]) value.className = item[2];
        cell.appendChild(term);
        cell.appendChild(value);
        metrics.appendChild(cell);
      });
      card.appendChild(title);
      card.appendChild(metrics);
      list.appendChild(card);
    });
    document.getElementById("query-empty").hidden = matches.length !== 0;
    document.getElementById("query-count").textContent = countText(visible.length);
    var button = document.getElementById("show-all");
    button.hidden = Boolean(query) || matches.length <= 10;
    button.textContent = showAll ? "Show fewer" : "Show all 28 queries";
  }

  function renderDownloads() {
    var box = document.getElementById("download-actions");
    clear(box);
    if (!data.report_pdf && !data.analysis_pack) return;
    if (data.report_pdf) addDownload(box, data.report_pdf, "Download Report");
    if (data.analysis_pack) addDownload(box, data.analysis_pack, "Download Analysis Package");
    document.getElementById("download-note").textContent = "Only files already included on this page are listed.";
  }

  function addDownload(box, href, text) {
    var link = document.createElement("a");
    link.className = "button";
    link.href = href;
    link.textContent = text;
    box.appendChild(link);
  }

  function redraw() {
    if (!data) return;
    renderCharts();
  }

  document.querySelectorAll(".budget-switch button").forEach(function (button) {
    button.addEventListener("click", function () {
      fraction = button.getAttribute("data-fraction");
      document.querySelectorAll(".budget-switch button").forEach(function (item) {
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      if (!data) return;
      renderSummary();
      renderCharts();
      renderQueries();
    });
  });
  document.getElementById("strategy").addEventListener("change", function () {
    if (!data) return;
    renderSummary();
    renderQueries();
  });
  document.getElementById("query-search").addEventListener("input", function () {
    if (!data) return;
    renderQueries();
  });
  document.getElementById("show-all").addEventListener("click", function () {
    showAll = !showAll;
    if (data) renderQueries();
  });
  window.addEventListener("resize", function () {
    window.clearTimeout(redraw.timer);
    redraw.timer = window.setTimeout(redraw, 120);
  });

  fetch("data/site_data.json")
    .then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    })
    .then(function (payload) {
      data = payload;
      document.getElementById("data-status").textContent = "";
      renderSummary();
      renderQueries();
      renderDownloads();
      window.requestAnimationFrame(renderCharts);
    })
    .catch(function (error) {
      console.error(error);
      document.getElementById("data-status").textContent = "Results could not be loaded. Please try again later.";
    });
})();
