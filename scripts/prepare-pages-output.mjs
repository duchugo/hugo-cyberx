import { cp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const serverDir = join(process.cwd(), "dist", "server");
const clientDir = join(process.cwd(), "dist", "client");

// Cloudflare Pages advanced mode expects the Worker entrypoint to be named
// `_worker.js` inside the configured output directory. Keep the generated
// server modules beside it so its relative imports continue to resolve.
await rm(join(clientDir, "_worker.js"), { force: true });
await cp(serverDir, clientDir, { recursive: true, force: true });
await writeFile(
  join(clientDir, "_worker.js"),
  `import app from "./index.js";

const STATIC_PREFIXES = ["/_next/static/", "/gwr-video/"];

// Serve static prefixes straight from Pages assets so they never reach the
// app router (which would answer with the Next 404 page). Follow at most one
// pretty-URL redirect from the asset layer, keeping the query string so the
// video engine keeps its handoff parameters.
async function serveAsset(request, url) {
  let response = await env.ASSETS.fetch(new Request(url, request));
  if (
    (response.status === 301 || response.status === 307 || response.status === 308) &&
    response.headers.get("location")
  ) {
    const redirectUrl = new URL(response.headers.get("location"), url);
    redirectUrl.search = url.search;
    response = await env.ASSETS.fetch(new Request(redirectUrl, request));
  }
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (STATIC_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
      return serveAsset(request, url);
    }
    return app.fetch(request, env, ctx);
  },
};
`,
);
// The generated SSR module dynamically imports `../index.js`, so the
// original server entrypoint must remain beside the Pages wrapper.
await rm(join(clientDir, "wrangler.json"), { force: true });
