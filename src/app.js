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
    activeToolKey: "jedkx:wttg3:active-tool",
    defaults: {
      cos: { label: "CoS", name: "Codex of Silence", raw: "", siteKeys: [] },
      td: { label: "TD", name: "Toxic Delights", raw: "", siteKeys: [] },
      trm: { label: "TRM", name: "The Red Mirror", raw: "", siteKeys: [] },
    },
  };
  const splitConfig = {
    key: "jedkx:wttg3:left-pane",
    minPercent: 35,
    maxPercent: 72,
    minLeftPx: 420,
    minRightPx: 460,
    keyboardStep: 2,
  };
  const toolHeightConfig = {
    key: "jedkx:wttg3:tool-panel-height",
    defaultPx: 220,
    minPx: 150,
    maxPx: 420,
    minUptimePx: 220,
    keyboardStep: 12,
  };
  const sourceScanConfig = {
    numberedKeyPattern: /\b([1-8])[ \t]*-[ \t]*([a-z0-9][a-z0-9_-]{3,127})\b/gi,
    fetchFilePattern: /\bfile:\/\/[a-z0-9._~:/?#[\]@!$&'()*+,;=%-]{4,180}\.fetch\b/gi,
    fetchAssignmentPattern: /\b(?:fetchurl|fetch_url|fetch-url|shadowfetch|download|file)\b[\s:_-]*(?:=|:|is|=>)?\s*["'`]?([a-z0-9._~:/?#[\]@!$&'()*+,;=%-]{5,180})/gi,
    explicitPattern: /\b(?:key|hash|fragment|piece|code|token)\b[\s:_-]*(?:=|:|is|=>)?\s*["'`]?([a-z0-9][a-z0-9._~:/?#[\]@!$&'()*+,;=%-]{5,180})/gi,
    fetchPattern: /\bfetch\s*\(\s*["'`]([^"'`]+)["'`]/gi,
    urlPattern: /(?:https?:\/\/[a-z0-9._~:/?#[\]@!$&'()*+,;=%-]+|\/[a-z0-9._~:/?#[\]@!$&'()*+,;=%-]{4,})/gi,
    hashPattern: /\b[a-f0-9]{32,64}\b/gi,
    compactTokenPattern: /\b(?=[a-z0-9_-]*[a-z])(?=[a-z0-9_-]*\d)[a-z0-9][a-z0-9_-]{9,63}\b/gi,
    contextPattern: /.{0,42}\b(?:key|hash|fragment|piece|code|token|fetch|url)\b.{0,100}/gi,
  };
  const notesConfig = {
    fontKey: "jedkx:wttg3:notes-font-size",
    defaultText: "Wiki\n\nKey\n\nFetch",
    headings: ["Wiki", "Key", "Fetch"],
    defaultFontSize: 13,
    minFontSize: 10,
    maxFontSize: 22,
  };

  let activeSite = sites[0];
  let activePage = 0;
  let activeTier = "1";
  let activeWiki = "cos";
  let activeTool = "wiki";
  let sourceScan = emptySourceScan();
  let wikiRuns = readStoredWikiRuns();
  let isWikiCollapsed = readStoredWikiCollapsed();
  let activeSplitPercent = 50;
  let activeToolPanelHeight = toolHeightConfig.defaultPx;
  let activeNotesFontSize = notesConfig.defaultFontSize;
  let isResizing = false;
  let isToolResizing = false;
  let sourceActionTimer = 0;

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
    minerSummary: document.querySelector("#minerSummary"),
    left: document.querySelector(".left"),
    station: document.querySelector(".station"),
    splitter: document.querySelector("#splitter"),
    toggleViewer: document.querySelector("#toggleViewer"),
    helpButton: document.querySelector("#helpButton"),
    helpDialog: document.querySelector("#helpDialog"),
    toolPanel: document.querySelector("#toolPanel"),
    toolToggle: document.querySelector("#toolToggle"),
    toolTabs: document.querySelector("#toolTabs"),
    toolBody: document.querySelector("#toolBody"),
    toolSplitter: document.querySelector("#toolSplitter"),
    wikiBody: document.querySelector("#wikiBody"),
    minerBody: document.querySelector("#minerBody"),
    sourceBody: document.querySelector("#sourceBody"),
    notesBody: document.querySelector("#notesBody"),
    wikiSummary: document.querySelector("#wikiSummary"),
    wikiName: document.querySelector("#wikiName"),
    wikiTabs: document.querySelector("#wikiTabs"),
    wikiPaste: document.querySelector("#wikiPaste"),
    wikiCount: document.querySelector("#wikiCount"),
    wikiHint: document.querySelector("#wikiHint"),
    wikiReset: document.querySelector("#wikiReset"),
    sourcePaste: document.querySelector("#sourcePaste"),
    sourceSummary: document.querySelector("#sourceSummary"),
    sourceActionStatus: document.querySelector("#sourceActionStatus"),
    sourceFindings: document.querySelector("#sourceFindings"),
    sourceClear: document.querySelector("#sourceClear"),
    notesText: document.querySelector("#notesText"),
    notesClear: document.querySelector("#notesClear"),
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

  function readStoredToolPanelHeight() {
    try {
      const value = Number(global.localStorage?.getItem(toolHeightConfig.key));
      return Number.isFinite(value) ? value : activeToolPanelHeight;
    } catch {
      return activeToolPanelHeight;
    }
  }

  function writeStoredToolPanelHeight(value) {
    try {
      global.localStorage?.setItem(toolHeightConfig.key, String(Math.round(value)));
    } catch {
      // Layout preference is optional; blocked storage should not break the console.
    }
  }

  function readStoredNotesFontSize() {
    try {
      const value = Number(global.localStorage?.getItem(notesConfig.fontKey));
      return Number.isFinite(value) ? value : activeNotesFontSize;
    } catch {
      return activeNotesFontSize;
    }
  }

  function writeStoredNotesFontSize(value) {
    try {
      global.localStorage?.setItem(notesConfig.fontKey, String(Math.round(value)));
    } catch {
      // Notes font size is only a local UI preference.
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

  function readStoredActiveTool() {
    try {
      const stored = global.localStorage?.getItem(wikiConfig.activeToolKey);
      return ["wiki", "miners", "source", "notes"].includes(stored) ? stored : activeTool;
    } catch {
      return activeTool;
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

  function writeStoredActiveTool() {
    try {
      global.localStorage?.setItem(wikiConfig.activeToolKey, activeTool);
    } catch {
      // Active run-tool tab is only a local UI preference.
    }
  }

  function writeStoredWikiCollapsed() {
    try {
      global.localStorage?.setItem(wikiConfig.collapseKey, String(isWikiCollapsed));
    } catch {
      // Collapsed state is only a local UI preference.
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

  function emptySourceScan() {
    return {
      keys: [],
      fetches: [],
      urls: [],
      suspects: [],
      contexts: [],
    };
  }

  function decodeHtml(value) {
    const element = document.createElement("textarea");
    element.innerHTML = String(value);
    return element.value;
  }

  function decodeEscapes(value) {
    return String(value)
      .replace(/\\x([0-9a-f]{2})/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
      .replace(/\\u([0-9a-f]{4})/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
      .replace(/\\\//g, "/");
  }

  function sourceVariants(value) {
    const raw = String(value);
    const htmlDecoded = decodeHtml(raw);
    const escaped = decodeEscapes(htmlDecoded);
    const collapsed = escaped.replace(/<[^>]+>/g, " ");
    return [...new Set([raw, htmlDecoded, escaped, collapsed])].join("\n");
  }

  function sourceInlineVariants(value) {
    const raw = String(value);
    const htmlDecoded = decodeHtml(raw);
    const escaped = decodeEscapes(htmlDecoded);
    return [...new Set([raw, htmlDecoded, escaped])].join("\n");
  }

  function normalizeFinding(value) {
    return String(value)
      .replace(/^["'`(<[{]+|["'`)>}\],.;]+$/g, "")
      .trim();
  }

  function looksUsefulSourceToken(value) {
    const token = normalizeFinding(value);
    if (token.length < 6 || token.length > 180) return false;
    if (/@/.test(token)) return false;
    if (/^#[0-9a-f]{3,8}$/i.test(token)) return false;
    if (/^\/(?:a|body|button|div|form|head|html|input|script|span|style|textarea)$/i.test(token)) return false;
    if (/^(true|false|null|undefined|return|function|window|document)$/i.test(token)) return false;
    if (/^(?:width|height|color|display|content|script|style|class|href|src)$/i.test(token)) return false;
    if (/^[0-9.]+$/.test(token)) return false;
    return true;
  }

  function addFinding(target, value, kind, context = "") {
    const text = normalizeFinding(value);
    if (!looksUsefulSourceToken(text)) return;
    if (context && /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(context) && context.toLowerCase().includes(text.toLowerCase())) return;
    const duplicate = target.some((item) => item.text.toLowerCase() === text.toLowerCase());
    if (duplicate) return;
    target.push({ text, kind, context: context.trim().replace(/\s+/g, " ").slice(0, 160) });
  }

  function collectMatches(text, pattern, target, kind, groupIndex = 0) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const value = match[groupIndex];
      const index = match.index || 0;
      const context = text.slice(Math.max(0, index - 80), index + match[0].length + 80);
      addFinding(target, value, kind, context || match[0]);
    }
  }

  function collectNumberedKeys(text, target) {
    sourceScanConfig.numberedKeyPattern.lastIndex = 0;
    for (const match of text.matchAll(sourceScanConfig.numberedKeyPattern)) {
      addFinding(target, `${match[1]} - ${match[2]}`, "numbered-key", match[0]);
    }
  }

  function scanSource(value) {
    const text = sourceVariants(value);
    const inlineText = sourceInlineVariants(value);
    const result = emptySourceScan();
    if (!text.trim()) return result;

    collectNumberedKeys(inlineText, result.keys);
    collectMatches(text, sourceScanConfig.fetchFilePattern, result.fetches, "fetch-file");
    collectMatches(text, sourceScanConfig.fetchAssignmentPattern, result.urls, "fetch-reference", 1);
    collectMatches(text, sourceScanConfig.fetchPattern, result.urls, "fetch-call", 1);
    collectMatches(text, sourceScanConfig.urlPattern, result.urls, "url");
    collectMatches(text, sourceScanConfig.explicitPattern, result.keys, "explicit", 1);
    collectMatches(text, sourceScanConfig.hashPattern, result.keys, "hash");
    collectMatches(text, sourceScanConfig.compactTokenPattern, result.suspects, "token");
    collectMatches(text, sourceScanConfig.contextPattern, result.contexts, "context");

    result.urls = result.urls.filter((item) => !/\.fetch\b/i.test(item.text));
    result.keys = result.keys.filter((item) => !result.fetches.some((fetch) => fetch.text.toLowerCase().includes(item.text.toLowerCase())));

    const known = new Set([...result.keys, ...result.fetches, ...result.urls].map((item) => item.text.toLowerCase()));
    result.suspects = result.suspects.filter((item) => !known.has(item.text.toLowerCase())).slice(0, 12);
    result.contexts = result.contexts
      .filter((item) => ![...known].some((knownText) => item.text.toLowerCase().includes(knownText)))
      .slice(0, 8);

    return result;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
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

  function toolPanelHeightBounds() {
    const leftHeight = dom.left.clientHeight;
    if (!leftHeight) {
      return { min: toolHeightConfig.minPx, max: toolHeightConfig.maxPx };
    }

    const titleHeight = document.querySelector(".titlebar")?.offsetHeight || 42;
    const splitterHeight = dom.toolSplitter?.offsetHeight || 6;
    const gaps = 24;
    const available = leftHeight - titleHeight - splitterHeight - gaps - toolHeightConfig.minUptimePx;
    const max = Math.max(toolHeightConfig.minPx, Math.min(toolHeightConfig.maxPx, available));
    return { min: toolHeightConfig.minPx, max };
  }

  function setToolPanelHeight(value, options = {}) {
    const { min, max } = toolPanelHeightBounds();
    activeToolPanelHeight = clamp(value, min, max);
    dom.station.style.setProperty("--tool-panel-height", `${Math.round(activeToolPanelHeight)}px`);

    if (dom.toolSplitter) {
      dom.toolSplitter.setAttribute("aria-valuemin", String(Math.round(min)));
      dom.toolSplitter.setAttribute("aria-valuemax", String(Math.round(max)));
      dom.toolSplitter.setAttribute("aria-valuenow", String(Math.round(activeToolPanelHeight)));
    }

    if (options.persist) {
      writeStoredToolPanelHeight(activeToolPanelHeight);
    }
  }

  function pointerToolPanelHeight(event) {
    const rect = dom.toolPanel.getBoundingClientRect();
    return event.clientY - rect.top;
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

  function bindToolSplitter() {
    if (!dom.toolSplitter) return;

    setToolPanelHeight(readStoredToolPanelHeight());

    function stopToolResize(event, options = {}) {
      if (!isToolResizing && !options.force) return;
      isToolResizing = false;
      dom.toolSplitter.classList.remove("dragging");
      document.body.classList.remove("tool-resizing");
      if (event?.pointerId && dom.toolSplitter.hasPointerCapture(event.pointerId)) {
        dom.toolSplitter.releasePointerCapture(event.pointerId);
      }
      writeStoredToolPanelHeight(activeToolPanelHeight);
    }

    dom.toolSplitter.addEventListener("pointerdown", (event) => {
      if (isWikiCollapsed) return;
      isToolResizing = true;
      dom.toolSplitter.classList.add("dragging");
      document.body.classList.add("tool-resizing");
      dom.toolSplitter.setPointerCapture(event.pointerId);
      setToolPanelHeight(pointerToolPanelHeight(event), { persist: true });
    });

    dom.toolSplitter.addEventListener("pointermove", (event) => {
      if (!isToolResizing) return;
      setToolPanelHeight(pointerToolPanelHeight(event), { persist: true });
    });

    dom.toolSplitter.addEventListener("pointerup", stopToolResize);
    dom.toolSplitter.addEventListener("pointercancel", stopToolResize);
    dom.toolSplitter.addEventListener("lostpointercapture", stopToolResize);
    global.addEventListener("pointerup", stopToolResize);
    global.addEventListener("blur", () => stopToolResize(null, { force: true }));
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopToolResize(null, { force: true });
    });

    dom.toolSplitter.addEventListener("keydown", (event) => {
      if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") {
        setToolPanelHeight(toolPanelHeightBounds().min, { persist: true });
        return;
      }
      if (event.key === "End") {
        setToolPanelHeight(toolPanelHeightBounds().max, { persist: true });
        return;
      }
      const direction = event.key === "ArrowUp" ? -1 : 1;
      setToolPanelHeight(activeToolPanelHeight + direction * toolHeightConfig.keyboardStep, { persist: true });
    });

    global.addEventListener("resize", () => setToolPanelHeight(activeToolPanelHeight));
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
    const visibleMiners = miners.filter((miner) => String(miner.tier) === activeTier);
    dom.minerSummary.textContent = `${visibleMiners.length} PCs`;
    dom.minerList.innerHTML = visibleMiners
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

  function renderSourceScan() {
    const hasSource = Boolean(dom.sourcePaste.value.trim());
    const findings = [
      ...sourceScan.keys.map((item) => ({ ...item, noteKind: "Key" })),
      ...sourceScan.fetches.map((item) => ({ ...item, noteKind: "Fetch" })),
    ];
    dom.sourceSummary.textContent = dom.sourcePaste.value.trim()
      ? findings.length ? `${findings.length} found` : "NONE"
      : "No source pasted";
    dom.sourceFindings.innerHTML = hasSource
      ? findings.length
        ? `<div class="source-items result-only">
            ${findings.map((item) => `
              <div class="source-item" data-note-kind="${item.noteKind}" data-note-value="${escapeAttribute(item.text)}" title="Double-click to add to Notes">
                <code>${escapeHtml(item.text)}</code>
              </div>
            `).join("")}
          </div>`
        : `<div class="source-none">NONE</div>`
      : `<div class="source-empty">Paste source and check the right side.</div>`;
  }

  function ensureNoteTemplate() {
    if (dom.notesText.value.trim()) return;
    dom.notesText.value = notesConfig.defaultText;
  }

  function sortKeySection(lines, headingNames) {
    const keyIndex = lines.findIndex((line) => line.trim().toLowerCase() === "key");
    if (keyIndex === -1) return lines;
    const nextHeadingIndex = lines.findIndex((line, index) => index > keyIndex && headingNames.has(line.trim().toLowerCase()));
    const endIndex = nextHeadingIndex === -1 ? lines.length : nextHeadingIndex;
    const section = lines.slice(keyIndex + 1, endIndex);
    const numbered = section
      .map((line, index) => ({ line, index, match: line.trim().match(/^([1-8])\s*-\s+(.+)$/i) }))
      .filter((item) => item.match)
      .sort((a, b) => Number(a.match[1]) - Number(b.match[1]) || a.index - b.index);
    let cursor = 0;
    const sortedSection = section.map((line) => {
      if (!line.trim().match(/^([1-8])\s*-\s+(.+)$/i)) return line;
      const next = numbered[cursor];
      cursor += 1;
      return next.line;
    });
    return [...lines.slice(0, keyIndex + 1), ...sortedSection, ...lines.slice(endIndex)];
  }

  function addFindingToNotes(kind, value) {
    const text = String(value || "").trim();
    if (!text) return false;
    ensureNoteTemplate();
    const existing = new Set(
      dom.notesText.value
        .split(/\r?\n/)
        .map((line) => line.trim().toLowerCase())
        .filter(Boolean),
    );
    if (existing.has(text.toLowerCase())) return false;

    const heading = kind === "Fetch" ? "Fetch" : kind === "Wiki" ? "Wiki" : "Key";
    const headingNames = new Set(notesConfig.headings.map((item) => item.toLowerCase()));
    const lines = dom.notesText.value.split(/\r?\n/);
    let headingIndex = lines.findIndex((line) => line.trim().toLowerCase() === heading.toLowerCase());

    if (headingIndex === -1) {
      if (lines.length && lines.at(-1).trim()) lines.push("");
      lines.push(heading, text);
      dom.notesText.value = sortKeySection(lines, headingNames).join("\n");
      renderNotes();
      return true;
    }

    let insertIndex = lines.findIndex((line, index) => index > headingIndex && headingNames.has(line.trim().toLowerCase()));
    if (insertIndex === -1) insertIndex = lines.length;

    while (insertIndex > headingIndex + 1 && !lines[insertIndex - 1].trim()) {
      lines.splice(insertIndex - 1, 1);
      insertIndex -= 1;
    }

    const insertLines = [text];
    if (insertIndex < lines.length && lines[insertIndex].trim()) insertLines.push("");
    lines.splice(insertIndex, 0, ...insertLines);
    dom.notesText.value = sortKeySection(lines, headingNames).join("\n");
    renderNotes();
    return true;
  }

  function showSourceAction(message) {
    global.clearTimeout(sourceActionTimer);
    dom.sourceActionStatus.textContent = message;
    sourceActionTimer = global.setTimeout(() => {
      dom.sourceActionStatus.textContent = "";
    }, 1100);
  }

  function renderNotes() {
    // Notes are free-form; the header intentionally stays minimal.
  }

  function setNotesFontSize(value, options = {}) {
    activeNotesFontSize = clamp(value, notesConfig.minFontSize, notesConfig.maxFontSize);
    dom.notesBody.style.setProperty("--notes-font-size", `${Math.round(activeNotesFontSize)}px`);
    if (options.persist) {
      writeStoredNotesFontSize(activeNotesFontSize);
    }
  }

  function renderToolsPanel() {
    if (!dom.toolPanel) return;
    const run = activeWikiRun();
    const savedCount = run.siteKeys.length;
    const hasRaw = Boolean(run.raw.trim());
    dom.toolPanel.classList.toggle("collapsed", isWikiCollapsed);
    dom.left.classList.toggle("tools-collapsed", isWikiCollapsed);
    dom.toolToggle.setAttribute("aria-expanded", String(!isWikiCollapsed));
    dom.toolToggle.setAttribute("aria-label", isWikiCollapsed ? "Expand run tools" : "Collapse run tools");
    dom.toolToggle.title = isWikiCollapsed ? "Expand run tools" : "Collapse run tools";
    dom.wikiSummary.textContent = activeTool === "wiki" && hasActiveWikiFilter()
      ? `${run.label}: ${savedCount} ${savedCount === 1 ? "site" : "sites"}`
      : activeTool === "miners" ? "Mining rates" : activeTool === "source" ? "Source parser" : activeTool === "notes" ? "Run notes" : "All sites";
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

    dom.toolTabs.querySelectorAll(".tool-tab").forEach((button) => {
      const isActive = button.dataset.tool === activeTool;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    const isWikiTool = activeTool === "wiki";
    const isMinerTool = activeTool === "miners";
    const isSourceTool = activeTool === "source";
    const isNotesTool = activeTool === "notes";
    dom.wikiBody.classList.toggle("active", isWikiTool);
    dom.minerBody.classList.toggle("active", isMinerTool);
    dom.sourceBody.classList.toggle("active", isSourceTool);
    dom.notesBody.classList.toggle("active", isNotesTool);
    dom.wikiBody.hidden = !isWikiTool;
    dom.minerBody.hidden = !isMinerTool;
    dom.sourceBody.hidden = !isSourceTool;
    dom.notesBody.hidden = !isNotesTool;
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

  dom.toolToggle.addEventListener("click", () => {
    isWikiCollapsed = !isWikiCollapsed;
    writeStoredWikiCollapsed();
    renderToolsPanel();
  });

  dom.toolTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-tool]");
    if (!button) return;
    activeTool = button.dataset.tool;
    writeStoredActiveTool();
    renderToolsPanel();
  });

  dom.wikiTabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-wiki]");
    if (!button) return;
    activeWiki = button.dataset.wiki;
    writeStoredActiveWiki();
    activePage = 0;
    renderToolsPanel();
    renderSites();
  });

  dom.wikiName.addEventListener("input", () => {
    activeWikiRun().name = dom.wikiName.value.trim().slice(0, 24) || wikiConfig.defaults[activeWiki].name;
    writeStoredWikiRuns();
    renderToolsPanel();
  });

  dom.wikiPaste.addEventListener("input", () => {
    const run = activeWikiRun();
    run.raw = dom.wikiPaste.value;
    run.siteKeys = parseWikiSites(run.raw);
    writeStoredWikiRuns();
    activePage = 0;
    renderToolsPanel();
    renderSites();
  });

  dom.wikiReset.addEventListener("click", () => {
    const run = activeWikiRun();
    const hasSave = run.raw.trim() || run.siteKeys.length || run.name !== wikiConfig.defaults[activeWiki].name;
    if (hasSave && !global.confirm(`Reset ${run.label} for a new save?`)) return;
    wikiRuns[activeWiki] = { ...wikiConfig.defaults[activeWiki], siteKeys: [] };
    writeStoredWikiRuns();
    activePage = 0;
    renderToolsPanel();
    renderSites();
  });

  dom.sourcePaste.addEventListener("input", () => {
    sourceScan = scanSource(dom.sourcePaste.value);
    renderSourceScan();
    renderToolsPanel();
  });

  dom.sourceFindings.addEventListener("dblclick", (event) => {
    const item = event.target.closest(".source-item[data-note-kind]");
    if (!item) return;
    const added = addFindingToNotes(item.dataset.noteKind, item.dataset.noteValue);
    item.classList.remove("added", "duplicate");
    void item.offsetWidth;
    item.classList.add(added ? "added" : "duplicate");
    showSourceAction(added ? `Added to ${item.dataset.noteKind}` : "Already in Notes");
  });

  dom.sourceClear.addEventListener("click", () => {
    dom.sourcePaste.value = "";
    sourceScan = emptySourceScan();
    renderSourceScan();
    renderToolsPanel();
  });

  dom.notesText.addEventListener("input", renderNotes);

  dom.notesText.addEventListener("wheel", (event) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    setNotesFontSize(activeNotesFontSize + direction, { persist: true });
  }, { passive: false });

  dom.notesClear.addEventListener("click", () => {
    dom.notesText.value = "";
    renderNotes();
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
  activeTool = readStoredActiveTool();
  activeNotesFontSize = readStoredNotesFontSize();
  bindSplitter();
  bindToolSplitter();
  renderMiners();
  renderSourceScan();
  ensureNoteTemplate();
  setNotesFontSize(activeNotesFontSize);
  renderNotes();
  renderToolsPanel();
  renderSites();
})(window, document);
