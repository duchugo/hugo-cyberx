import { access, mkdir, readFile, writeFile } from "node:fs/promises";

await mkdir("public", { recursive: true });
for (const [source, target] of [
  ["cloudflare-assets/hugo-cyberx-main-logo.webp.base64", "public/hugo-cyberx-main-logo.webp"],
  ["cloudflare-assets/hugo-cyberx-acb-qr.png.base64", "public/hugo-cyberx-acb-qr.png"],
]) {
  try {
    const encoded = await readFile(source, "utf8");
    await writeFile(target, Buffer.from(encoded, "base64"));
  } catch {
    await access(target);
  }
}
