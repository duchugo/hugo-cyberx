import { NextRequest, NextResponse } from "next/server";
import { getBucket, getRawDb } from "@/db";
import {
  presignR2GetDownload,
  readPresignCredentials,
  sanitizeFilename,
} from "@/app/api/r2-presign";

// Analytics must never block a download, so the table is also created on
// demand here — production D1 self-heals even before the migration runs.
let analyticsSchemaReady = false;
async function ensureAnalyticsTable(db: D1Database) {
  if (analyticsSchemaReady) return;
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS software_downloads (id text PRIMARY KEY NOT NULL, software_id text NOT NULL, version text NOT NULL DEFAULT '', file_name text NOT NULL DEFAULT '', downloaded_at integer NOT NULL, ip_hash text, user_agent text, country text)",
    )
    .run();
  await db
    .prepare(
      "CREATE INDEX IF NOT EXISTS idx_software_downloads_software_date ON software_downloads (software_id, downloaded_at)",
    )
    .run();
  analyticsSchemaReady = true;
}

async function hashIp(ip: string) {
  const salt = process.env.IP_SALT || "hugo-cyberx-download-salt";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ip));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getRawDb();
  const row = await db
    .prepare(
      "SELECT object_key AS objectKey, sale_type AS saleType, name, version FROM applications WHERE id = ?",
    )
    .bind(id)
    .first<{ objectKey: string; saleType: string; name: string; version: string }>();
  if (!row) {
    return NextResponse.json({ error: "Không tìm thấy file." }, { status: 404 });
  }
  if (row.saleType === "paid") {
    return NextResponse.json(
      { error: "Phần mềm trả phí. Vui lòng liên hệ để mua." },
      { status: 403 },
    );
  }
  if (!row.objectKey) {
    return NextResponse.json({ error: "File không tồn tại." }, { status: 404 });
  }

  const bucket = getBucket();
  const head = await bucket.head(row.objectKey);
  if (!head) {
    return NextResponse.json({ error: "File không tồn tại." }, { status: 404 });
  }

  // Pick a delivery channel: direct R2 download via presigned URL first, then
  // the R2 binding's own signer if the runtime exposes one, then the legacy
  // stream through the Worker so downloads keep working in every environment.
  const credentials = readPresignCredentials(process.env as Record<string, string | undefined>);
  type Delivery =
    | { kind: "redirect"; url: string }
    | { kind: "stream"; object: NonNullable<Awaited<ReturnType<typeof bucket.get>>> };
  let delivery: Delivery;
  try {
    if (credentials) {
      const url = await presignR2GetDownload(
        credentials,
        row.objectKey,
        sanitizeFilename(row.objectKey.split("/").pop() || `${row.name}.bin`),
      );
      delivery = { kind: "redirect", url };
    } else if (typeof (bucket as { createSignedUrl?: unknown }).createSignedUrl === "function") {
      const signed = await (
        bucket as unknown as {
          createSignedUrl: (key: string, options: { expiresIn: number }) => Promise<{ url: string }>;
        }
      ).createSignedUrl(row.objectKey, { expiresIn: 600 });
      delivery = { kind: "redirect", url: signed.url };
    } else {
      throw new Error("no presign channel available");
    }
  } catch (error) {
    console.error("Presigned download unavailable, falling back to stream", error);
    const object = await bucket.get(row.objectKey);
    if (!object) {
      return NextResponse.json({ error: "File không tồn tại." }, { status: 404 });
    }
    delivery = { kind: "stream", object };
  }

  // Count the download only once the delivery channel is confirmed. A failed
  // analytics write must not stop the user from downloading.
  try {
    await ensureAnalyticsTable(db);
    const ip = req.headers.get("cf-connecting-ip") || "";
    const userAgent = (req.headers.get("user-agent") || "").slice(0, 200);
    const ipHash = ip ? await hashIp(ip) : null;
    const now = Date.now();
    const duplicate = ipHash
      ? await db
          .prepare(
            "SELECT 1 FROM software_downloads WHERE software_id = ? AND ip_hash = ? AND downloaded_at > ? LIMIT 1",
          )
          .bind(id, ipHash, now - 60_000)
          .first()
      : null;
    if (!duplicate) {
      await db
        .prepare(
          "INSERT INTO software_downloads (id, software_id, version, file_name, downloaded_at, ip_hash, user_agent, country) VALUES (?,?,?,?,?,?,?,?)",
        )
        .bind(
          crypto.randomUUID(),
          id,
          row.version,
          row.objectKey.split("/").pop() || "",
          now,
          ipHash,
          userAgent,
          (req as unknown as { cf?: { country?: string } }).cf?.country || null,
        )
        .run();
      await db.prepare("UPDATE applications SET downloads = downloads + 1 WHERE id = ?").bind(id).run();
    }
  } catch (error) {
    console.error("Download analytics failed", error);
  }

  if (delivery.kind === "redirect") {
    return new Response(null, {
      status: 302,
      headers: { location: delivery.url, "cache-control": "no-store" },
    });
  }
  const headers = new Headers();
  const streamObject = delivery.object as unknown as {
    body: ReadableStream;
    httpEtag: string;
    httpMetadata?: { contentType?: string };
  };
  if (streamObject.httpMetadata?.contentType) {
    headers.set("content-type", streamObject.httpMetadata.contentType);
  }
  headers.set("etag", streamObject.httpEtag);
  headers.set(
    "content-disposition",
    `attachment; filename="${sanitizeFilename(row.objectKey.split("/").pop() || "")}"`,
  );
  return new Response(streamObject.body, { headers });
}
