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

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/_next/static/")) {
      return env.ASSETS.fetch(request);
    }
    return app.fetch(request, env, ctx);
  },
};
`,
);
// The generated SSR module dynamically imports `../index.js`, so the
// original server entrypoint must remain beside the Pages wrapper.
await rm(join(clientDir, "wrangler.json"), { force: true });
