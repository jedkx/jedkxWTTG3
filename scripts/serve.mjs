import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { createServer } from "node:http";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const types = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

function safePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
  const requested = normalize(pathname).replace(/^([/\\])+/, "");
  const target = resolve(root, requested || "index.html");

  if (target !== root && !target.startsWith(`${root}${sep}`)) {
    return null;
  }

  if (!existsSync(target)) {
    return null;
  }

  const stats = statSync(target);
  return stats.isDirectory() ? join(target, "index.html") : target;
}

const server = createServer((request, response) => {
  const target = safePath(request.url || "/");

  if (!target || !existsSync(target)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": types.get(extname(target)) || "application/octet-stream",
  });

  createReadStream(target).pipe(response);
});

server.listen(port, host, () => {
  console.log(`JEDKX WTTG3 running at http://${host}:${port}`);
});
