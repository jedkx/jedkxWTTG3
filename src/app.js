import { SITES } from "./data/sites.js";
import { MINERS } from "./data/miners.js";
import { OTREX } from "./integrations/otrex.js";

(function bootConsole(global, document) {
  const uptimeGroups = ["Always", ":00 - :14", ":00 - :29", ":15 - :29", ":30 - :44", ":30 - :59", ":45 - :59"];
  const otrex = OTREX;
  const sites = SITES;
  const miners = MINERS;
  const wikiConfig = {
    key: "jedkx:wttg3:wiki-runs",
    collapseKey: "jedkx:wttg3:wiki-runs-collapsed",
    activeKey: "jedkx:wttg3:active-wiki",
    defaults: {
      cos: { label: "CoS", name: "Codex of Silence", raw: "", siteKeys: [] },
      td: { label: "TD", name: "Toxic Delights", raw: "", siteKeys: [] },
      trm: { label: "TRM", name: "The Red Mirror", raw: "", siteKeys: [] },
    },
  };
  const minerPanelConfig = {
    collapseKey: "jedkx:wttg3:virtmesh-collapsed",
  };
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
  let activeWiki = "cos";
  let wikiRuns = readStoredWikiRuns();
  let isWikiCollapsed = readStoredWikiCollapsed();
  let isMinerCollapsed = readStoredMinerCollapsed();
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
    miners: document.querySelector(".miners"),
    minerToggle: document.querySelector("#minerToggle"),
    left: document.querySelector(".left"),
    station: document.querySelector(".station"),
    splitter: document.querySelector("#splitter"),
    toggleViewer: document.querySelector("#toggleViewer"),
    helpButton: document.querySelector("#helpButton"),
    helpDialog: document.querySelector("#helpDialog"),
    wikiPanel: document.querySelector("#wikiPanel"),
    wikiToggle: document.querySelector("#wikiToggle"),
    wikiBody: document.querySelector("#wikiBody"),
    wikiSummary: document.querySelector("#wikiSummary"),
    wikiName: document.querySelector("#wikiName"),
    wikiTabs: document.querySelector("#wikiTabs"),
    wikiPaste: document.querySelector("#wikiPaste"),
    wikiCount: document.querySelector("#wikiCount"),
    wikiHint: document.querySelector("#wikiHint"),
    wikiReset: document.querySelector("#wikiReset"),
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

  function normalizeSiteName(value) {
    return String(value)
      .toLowerCase()
      .replace(/\[censored\]/g, "shit")
      .replace(/[^a-z0-9]/g, "");
  }

  function defaultWikiRuns() {
    return Object.fromEntries(
      Object.entries(wikiConfig.defaults).map(([key, value]) => [key, { ...value, siteKeys: [...value.siteKeys] }]),
    );
  }

  function readStoredWikiRuns() {
    try {
      const parsed = JSON.parse(global.localStorage?.getItem(wikiConfig.key) || "");
      const runs = defaultWikiRuns();
      for (const key of Object.keys(runs)) {
        if (!parsed?.[key]) continue;
        const run = parsed[key];
        runs[key] = {
          ...runs[key],
          name: typeof run.name === "string" ? run.name.slice(0, 24) : runs[key].name,
          raw: typeof run.raw === "string" ? run.raw : "",
          siteKeys: Array.isArray(run.siteKeys) ? run.siteKeys.filter((siteKey) => sites.some((site) => site.key === siteKey)) : [],
        };
      }
      return runs;
    } catch {
      return defaultWikiRuns();
    }
  }

  function readStoredWikiCollapsed() {
    try {
      return global.localStorage?.getItem(wikiConfig.collapseKey) === "true";
    } catch {
      return true;
    }
  }

  function readStoredActiveWiki() {
    try {
      const stored = global.localStorage?.getItem(wikiConfig.activeKey);
      return stored && wikiRuns[stored] ? stored : activeWiki;
    } catch {
      return activeWiki;
    }
  }

  function writeStoredWikiRuns() {
    try {
      global.localStorage?.setItem(wikiConfig.key, JSON.stringify(wikiRuns));
    } catch {
      // Wiki run slots are optional local convenience state.
    }
  }

  function writeStoredActiveWiki() {
    try {
      global.localStorage?.setItem(wikiConfig.activeKey, activeWiki);
    } catch {
      // The console can keep working without stored UI state.
    }
  }

  function writeStoredWikiCollapsed() {
    try {
      global.localStorage?.setItem(wikiConfig.collapseKey, String(isWikiCollapsed));
    } catch {
      // Collapsed state is only a local UI preference.
    }
  }

  function readStoredMinerCollapsed() {
    try {
      return global.localStorage?.getItem(minerPanelConfig.collapseKey) === "true";
    } catch {
      return false;
    }
  }

  function writeStoredMinerCollapsed() {
    try {
      global.localStorage?.setItem(minerPanelConfig.collapseKey, String(isMinerCollapsed));
    } catch {
      // VirtMesh collapsed state is only a local UI preference.
    }
  }

  function parseWikiSites(value) {
    const found = [];
    const seen = new Set();
    const chunks = String(value)
      .split(/[\n,;]+/)
      .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)])\s*/, "").trim())
      .filter(Boolean);

    for (const chunk of chunks) {
      const normalized = normalizeSiteName(chunk);
      const site = sites.find((candidate) => {
        const siteName = normalizeSiteName(candidate.name);
        const siteKey = normalizeSiteName(candidate.key);
        return normalized === siteName || normalized === siteKey || normalized.includes(siteName) || normalized.includes(siteKey);
      });

      if (site && !seen.has(site.key)) {
        seen.add(site.key);
        found.push(site.key);
      }
    }

    return found;
  }

  function activeWikiRun() {
    return wikiRuns[activeWiki];
  }

  function hasActiveWikiFilter() {
    const run = activeWikiRun();
    return Boolean(run.raw.trim() || run.siteKeys.length);
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

    function stopResize(event, options = {}) {
      if (!isResizing && !options.force) return;
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
    global.addEventListener("pointerup", stopResize);
    global.addEventListener("blur", () => stopResize(null, { force: true }));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopResize(null, { force: true });
    });

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
    const activeKeys = new Set(activeWikiRun().siteKeys);
    return sites.filter((site) => {
      if (hasActiveWikiFilter() && !activeKeys.has(site.key)) return false;
      return site.name.toLowerCase().includes(query);
    });
  }

  function renderSites() {
    const visible = visibleSites();
    dom.siteCount.textContent = String(visible.length);
    if (!visible.includes(activeSite) && visible[0]) {
      activeSite = visible[0];
      activePage = 0;
    }

    const alwaysRows = visible.filter((site) => site.time === "Always");
    const timedRows = uptimeGroups
      .filter((group) => group !== "Always")
      .map((group) => renderGroup(group, visible.filter((site) => site.time === group)))
      .join("");

    dom.alwaysList.innerHTML = visible.length ? renderRows(alwaysRows) : renderEmptySites();
    dom.timedList.innerHTML = visible.length ? timedRows : "";

    renderViewer();
  }

  function renderEmptySites() {
    const label = activeWikiRun().label;
    return `<div class="empty-sites">Paste site names into ${label} to build this run.</div>`;
  }

  function renderGroup(group, rows) {
    if (!rows.length) return "";
    return `<div class="group-title">${group}</div>${renderRows(rows)}`;
  }

  function renderRows(rows) {
    return rows
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((site) => {
      const classes = ["site-row", site.key === activeSite.key ? "active" : "", site.risk ? "risk" : ""].filter(Boolean).join(" ");
      const pageCount = (site.sub?.length || 0) + 1;
      return `
        <button class="${classes}" data-site="${site.key}" type="button" title="Open ${site.name} clickpoint guide">
          <span class="site-name">${site.name}</span>
          <span class="site-pages" aria-label="${pageCount} pages">${pageCount}</span>
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

  function renderMinerPanel() {
    dom.miners.classList.toggle("collapsed", isMinerCollapsed);
    dom.left.classList.toggle("miners-collapsed", isMinerCollapsed);
    dom.minerToggle.setAttribute("aria-expanded", String(!isMinerCollapsed));
    dom.minerToggle.setAttribute("aria-label", isMinerCollapsed ? "Expand VirtMesh" : "Collapse VirtMesh");
    dom.minerToggle.title = isMinerCollapsed ? "Expand VirtMesh" : "Collapse VirtMesh";
  }

  function renderWikiPanel() {
    if (!dom.wikiPanel) return;
    const run = activeWikiRun();
    const savedCount = run.siteKeys.length;
    const hasRaw = Boolean(run.raw.trim());
    dom.wikiPanel.classList.toggle("collapsed", isWikiCollapsed);
    dom.wikiToggle.setAttribute("aria-expanded", String(!isWikiCollapsed));
    dom.wikiToggle.setAttribute("aria-label", isWikiCollapsed ? "Expand Wiki Runs" : "Collapse Wiki Runs");
    dom.wikiToggle.title = isWikiCollapsed ? "Expand Wiki Runs" : "Collapse Wiki Runs";
    dom.wikiSummary.textContent = hasActiveWikiFilter()
      ? `${run.label}: ${savedCount} ${savedCount === 1 ? "site" : "sites"}`
      : "All sites";
    dom.wikiName.value = run.name;
    dom.wikiPaste.value = run.raw;
    dom.wikiCount.textContent = `${savedCount} ${savedCount === 1 ? "site" : "sites"} saved`;
    dom.wikiHint.textContent = hasRaw && !savedCount ? "No known WTTG3 sites matched yet." : "Matches are saved on this device.";

    dom.wikiTabs.querySelectorAll(".wiki-tab").forEach((button) => {
      const isActive = button.dataset.wiki === activeWiki;
      const buttonRun = wikiRuns[button.dataset.wiki];
      button.classList.toggle("active", isActive);
      button.textContent = buttonRun?.label || button.textContent;
      button.title = buttonRun?.name || "";
      button.setAttribute("aria-pressed", String(isActive));
    });

    renderSites();
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

  dom.minerToggle.addEventListener("click", () => {
    isMinerCollapsed = !isMinerCollapsed;
    writeStoredMinerCollapsed();
    renderMinerPanel();
  });

  dom.wikiToggle.addEventListener("click", () => {
    isWikiCollapsed = !isWikiCollapsed;
    writeStoredWikiCollapsed();
    renderWikiPanel();
  });

  dom.wikiTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-wiki]");
    if (!button) return;
    activeWiki = button.dataset.wiki;
    writeStoredActiveWiki();
    activePage = 0;
    renderWikiPanel();
  });

  dom.wikiName.addEventListener("input", () => {
    activeWikiRun().name = dom.wikiName.value.trim().slice(0, 24) || wikiConfig.defaults[activeWiki].name;
    writeStoredWikiRuns();
    renderWikiPanel();
  });

  dom.wikiPaste.addEventListener("input", () => {
    const run = activeWikiRun();
    run.raw = dom.wikiPaste.value;
    run.siteKeys = parseWikiSites(run.raw);
    writeStoredWikiRuns();
    activePage = 0;
    renderWikiPanel();
  });

  dom.wikiReset.addEventListener("click", () => {
    const run = activeWikiRun();
    const hasSave = run.raw.trim() || run.siteKeys.length || run.name !== wikiConfig.defaults[activeWiki].name;
    if (hasSave && !global.confirm(`Reset ${run.label} for a new save?`)) return;
    wikiRuns[activeWiki] = { ...wikiConfig.defaults[activeWiki], siteKeys: [] };
    writeStoredWikiRuns();
    activePage = 0;
    renderWikiPanel();
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

  activeWiki = readStoredActiveWiki();
  bindSplitter();
  renderWikiPanel();
  renderMinerPanel();
  renderMiners();
})(window, document);
