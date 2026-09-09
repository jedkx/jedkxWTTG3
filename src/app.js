(function bootConsole(global, document) {
  const uptimeGroups = ["Always", ":00 - :14", ":00 - :29", ":15 - :29", ":30 - :44", ":30 - :59", ":45 - :59"];
  const otrex = global.JEDKX_WTTG3_OTREX || {
    guideUrl: (site, pageIndex) => `https://otrexdev.github.io/wttg3-assistant/Clickpoint%20Guides/${Number(site.id) + Number(pageIndex)}.html`,
  };
  const sites = global.JEDKX_WTTG3_SITES || [];
  const miners = global.JEDKX_WTTG3_MINERS || [];
  const splitConfig = {
    key: "jedkx:wttg3:left-pane",
    minPercent: 35,
    maxPercent: 72,
    minLeftPx: 420,
    minRightPx: 460,
    keyboardStep: 2,
  };

  let activeSite = sites[0];
  let activePage = 0;
  let activeTier = "1";
  let activeSplitPercent = 50;
  let isResizing = false;

  const dom = {
    alwaysList: document.querySelector("#alwaysList"),
    timedList: document.querySelector("#timedList"),
    siteSearch: document.querySelector("#siteSearch"),
    siteCount: document.querySelector("#siteCount"),
    viewerTitle: document.querySelector("#viewerTitle"),
    viewerTime: document.querySelector("#viewerTime"),
    subpages: document.querySelector("#subpages"),
    clickFrame: document.querySelector("#clickFrame"),
    openExternal: document.querySelector("#openExternal"),
    minerList: document.querySelector("#minerList"),
    station: document.querySelector(".station"),
    splitter: document.querySelector("#splitter"),
    toggleViewer: document.querySelector("#toggleViewer"),
    helpButton: document.querySelector("#helpButton"),
    helpDialog: document.querySelector("#helpDialog"),
  };

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function readStoredSplit() {
    try {
      const value = Number(global.localStorage?.getItem(splitConfig.key));
      return Number.isFinite(value) ? value : activeSplitPercent;
    } catch {
      return activeSplitPercent;
    }
  }

  function writeStoredSplit(value) {
    try {
      global.localStorage?.setItem(splitConfig.key, String(Math.round(value)));
    } catch {
      // Layout preference is optional; blocked storage should not break the console.
    }
  }

  function splitBounds() {
    const width = dom.station.clientWidth;
    if (!width) {
      return { min: splitConfig.minPercent, max: splitConfig.maxPercent };
    }

    const minFromPx = (splitConfig.minLeftPx / width) * 100;
    const maxFromPx = 100 - (splitConfig.minRightPx / width) * 100;
    const min = Math.max(splitConfig.minPercent, minFromPx);
    const max = Math.min(splitConfig.maxPercent, maxFromPx);

    if (min > max) {
      return { min: 35, max: 65 };
    }

    return { min, max };
  }

  function setSplitPercent(value, options = {}) {
    const { min, max } = splitBounds();
    activeSplitPercent = clamp(value, min, max);
    dom.station.style.setProperty("--left-pane", `${activeSplitPercent.toFixed(2)}%`);

    if (dom.splitter) {
      dom.splitter.setAttribute("aria-valuemin", String(Math.round(min)));
      dom.splitter.setAttribute("aria-valuemax", String(Math.round(max)));
      dom.splitter.setAttribute("aria-valuenow", String(Math.round(activeSplitPercent)));
    }

    if (options.persist) {
      writeStoredSplit(activeSplitPercent);
    }
  }

  function pointerPercent(event) {
    const rect = dom.station.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * 100;
  }

  function bindSplitter() {
    if (!dom.splitter) return;

    setSplitPercent(readStoredSplit());

    function stopResize(event) {
      if (!isResizing) return;
      isResizing = false;
      dom.splitter.classList.remove("dragging");
      document.body.classList.remove("resizing");
      if (event?.pointerId && dom.splitter.hasPointerCapture(event.pointerId)) {
        dom.splitter.releasePointerCapture(event.pointerId);
      }
      writeStoredSplit(activeSplitPercent);
    }

    dom.splitter.addEventListener("pointerdown", (event) => {
      if (dom.station.classList.contains("full-left")) return;
      isResizing = true;
      dom.splitter.classList.add("dragging");
      document.body.classList.add("resizing");
      dom.splitter.setPointerCapture(event.pointerId);
      setSplitPercent(pointerPercent(event), { persist: true });
    });

    dom.splitter.addEventListener("pointermove", (event) => {
      if (!isResizing) return;
      setSplitPercent(pointerPercent(event), { persist: true });
    });

    dom.splitter.addEventListener("pointerup", stopResize);
    dom.splitter.addEventListener("pointercancel", stopResize);
    dom.splitter.addEventListener("lostpointercapture", stopResize);

    dom.splitter.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") {
        setSplitPercent(splitBounds().min, { persist: true });
        return;
      }
      if (event.key === "End") {
        setSplitPercent(splitBounds().max, { persist: true });
        return;
      }
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      setSplitPercent(activeSplitPercent + direction * splitConfig.keyboardStep, { persist: true });
    });

    global.addEventListener("resize", () => setSplitPercent(activeSplitPercent));
  }

  function visibleSites() {
    const query = dom.siteSearch.value.trim().toLowerCase();
    return sites.filter((site) => site.name.toLowerCase().includes(query));
  }

  function renderSites() {
    const visible = visibleSites();
    dom.siteCount.textContent = String(visible.length);
    if (!visible.includes(activeSite) && visible[0]) {
      activeSite = visible[0];
      activePage = 0;
    }

    dom.alwaysList.innerHTML = renderRows(visible.filter((site) => site.time === "Always"));
    dom.timedList.innerHTML = uptimeGroups
      .filter((group) => group !== "Always")
      .map((group) => renderGroup(group, visible.filter((site) => site.time === group)))
      .join("");

    renderViewer();
  }

  function renderGroup(group, rows) {
    if (!rows.length) return "";
    return `<div class="group-title">${group}</div>${renderRows(rows)}`;
  }

  function renderRows(rows) {
    return rows
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((site) => {
      const label = site.forceHack ? `${site.time} <span class="force-hack">FH ${site.forceHack}</span>` : site.time;
      const classes = ["site-row", site.key === activeSite.key ? "active" : "", site.risk ? "risk" : ""].filter(Boolean).join(" ");
      return `
        <button class="${classes}" data-site="${site.key}" type="button" title="Open ${site.name} clickpoint guide">
          <span class="site-name">${site.name}</span>
            <span class="site-time">${label}</span>
          </button>
        `;
      })
      .join("");
  }

  function pageLabel(site, index) {
    return index === 0 ? "main" : site.sub[index - 1];
  }

  function renderViewer() {
    if (!activeSite) return;
    dom.viewerTitle.textContent = activeSite.name;
    dom.viewerTime.textContent = activeSite.forceHack ? `${activeSite.time} / force hack ${activeSite.forceHack}` : activeSite.time;
    const totalPages = (activeSite.sub?.length || 0) + 1;
    dom.subpages.innerHTML = Array.from({ length: totalPages }, (_, index) => {
      return `<button class="${index === activePage ? "active" : ""}" data-page="${index}" type="button">${pageLabel(activeSite, index)}</button>`;
    }).join("");
    const url = otrex.guideUrl(activeSite, activePage);
    dom.clickFrame.src = url;
    dom.openExternal.href = url;
  }

  function renderMiners() {
    dom.minerList.innerHTML = miners
      .filter((miner) => String(miner.tier) === activeTier)
      .map(
        (miner, index) => `
          <div class="miner-row">
            <span class="rank">${index + 1}</span>
            <div class="miner-name">${miner.name}</div>
            <div class="rate">${miner.rate.toFixed(2)}/min</div>
          </div>
        `,
      )
      .join("");
  }

  function selectSite(key) {
    activeSite = sites.find((site) => site.key === key) || activeSite;
    activePage = 0;
    renderSites();
  }

  document.querySelector(".uptime").addEventListener("click", (event) => {
    const row = event.target.closest(".site-row");
    if (row) selectSite(row.dataset.site);
  });

  dom.subpages.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page]");
    if (!button) return;
    activePage = Number(button.dataset.page);
    renderViewer();
  });

  dom.siteSearch.addEventListener("input", renderSites);

  document.querySelectorAll(".tier-tab").forEach((button) => {
    button.addEventListener("click", () => {
      activeTier = button.dataset.tier;
      document.querySelector(".tier-tab.active").classList.remove("active");
      button.classList.add("active");
      renderMiners();
    });
  });

  dom.toggleViewer.addEventListener("click", () => {
    dom.station.classList.toggle("full-left");
    dom.toggleViewer.textContent = dom.station.classList.contains("full-left") ? "Show viewer" : "Hide viewer";
  });

  dom.openExternal.addEventListener("click", () => {
    dom.station.classList.add("full-left");
    dom.toggleViewer.textContent = "Show viewer";
  });

  dom.helpButton.addEventListener("click", () => {
    if (typeof dom.helpDialog.showModal === "function") {
      dom.helpDialog.showModal();
    }
  });

  bindSplitter();
  renderSites();
  renderMiners();
})(window, document);
