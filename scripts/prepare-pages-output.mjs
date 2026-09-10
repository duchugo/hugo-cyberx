import { cp, copyFile, rm } from "node:fs/promises";
import { join } from "node:path";

const serverDir = join(process.cwd(), "dist", "server");
const clientDir = join(process.cwd(), "dist", "client");

// Cloudflare Pages advanced mode expects the Worker entrypoint to be named
// `_worker.js` inside the configured output directory. Keep the generated
// server modules beside it so its relative imports continue to resolve.
await rm(join(clientDir, "_worker.js"), { force: true });
await cp(serverDir, clientDir, { recursive: true, force: true });
await copyFile(join(serverDir, "index.js"), join(clientDir, "_worker.js"));
await rm(join(clientDir, "index.js"), { force: true });
