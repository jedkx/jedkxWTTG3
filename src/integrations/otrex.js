const guideBase = "https://otrexdev.github.io/wttg3-assistant/Clickpoint%20Guides/";
const guideUrlCache = new Map();

function guidePageId(site, pageIndex) {
  return Number(site.id) + Number(pageIndex);
}

function guideUrl(site, pageIndex) {
  const pageId = guidePageId(site, pageIndex);
  if (!guideUrlCache.has(pageId)) {
    guideUrlCache.set(pageId, `${guideBase}${pageId}.html`);
  }

  return guideUrlCache.get(pageId);
}

function clearCache() {
  guideUrlCache.clear();
}

export const OTREX = Object.freeze({
  clearCache,
  guideBase,
  guidePageId,
  guideUrl,
});
