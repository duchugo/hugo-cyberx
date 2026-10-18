import { NextRequest, NextResponse } from "next/server";
import { getBucket, getRawDb } from "@/db";
import { sanitizeFilename } from "@/app/api/r2-presign";

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

async function recordCompletedDownload(
  db: D1Database,
  req: NextRequest,
  id: string,
  row: { objectKey: string; version: string },
) {
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

  const object = await bucket.get(row.objectKey);
  if (!object) {
    return NextResponse.json({ error: "File không tồn tại." }, { status: 404 });
  }
  const headers = new Headers();
  const streamObject = object as unknown as {
    body: ReadableStream;
    httpEtag: string;
    httpMetadata?: { contentType?: string };
  };
  if (streamObject.httpMetadata?.contentType) {
    headers.set("content-type", streamObject.httpMetadata.contentType);
  }
  headers.set("etag", streamObject.httpEtag);
  headers.set("content-length", String(head.size));
  headers.set("cache-control", "no-store");
  headers.set(
    "content-disposition",
    `attachment; filename="${sanitizeFilename(row.objectKey.split("/").pop() || "")}"`,
  );
  const trackedBody = streamObject.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
      async flush() {
        await recordCompletedDownload(db, req, id, row);
      },
    }),
  );
  return new Response(trackedBody, { headers });
}
