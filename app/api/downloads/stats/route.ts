import { NextRequest, NextResponse } from "next/server";
import { getAdminIdentity } from "@/app/api/admin-auth";
import { getRawDb } from "@/db";

const DAY = 86_400_000;

const num = (value: unknown) => Number(value) || 0;

export async function GET(req: NextRequest) {
  if (!(await getAdminIdentity(req))) {
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  }
  const db = getRawDb();
  const now = Date.now();
  const startOfToday = new Date().setUTCHours(0, 0, 0, 0);
  const from7 = now - 7 * DAY;
  const from30 = now - 30 * DAY;
  try {
    const totals = await db
      .prepare(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN downloaded_at >= ? THEN 1 ELSE 0 END) AS today,
                SUM(CASE WHEN downloaded_at >= ? THEN 1 ELSE 0 END) AS last7,
                SUM(CASE WHEN downloaded_at >= ? THEN 1 ELSE 0 END) AS last30,
                MAX(downloaded_at) AS lastDownloadAt
         FROM software_downloads`,
      )
      .bind(startOfToday, from7, from30)
      .first<Record<string, unknown>>();
    const perApp = await db
      .prepare(
        `SELECT a.id, a.name, a.version, a.downloads AS totalAllTime,
                COUNT(d.id) AS total,
                SUM(CASE WHEN d.downloaded_at >= ? THEN 1 ELSE 0 END) AS today,
                SUM(CASE WHEN d.downloaded_at >= ? THEN 1 ELSE 0 END) AS last7,
                SUM(CASE WHEN d.downloaded_at >= ? THEN 1 ELSE 0 END) AS last30,
                MAX(d.downloaded_at) AS lastDownloadAt
         FROM applications a JOIN software_downloads d ON d.software_id = a.id
         GROUP BY a.id ORDER BY COUNT(d.id) DESC`,
      )
      .bind(startOfToday, from7, from30)
      .all<Record<string, unknown>>();
    const recent = await db
      .prepare(
        `SELECT d.version, d.file_name AS fileName, d.downloaded_at AS downloadedAt, d.user_agent AS userAgent,
                a.name
         FROM software_downloads d JOIN applications a ON a.id = d.software_id
         ORDER BY d.downloaded_at DESC LIMIT 10`,
      )
      .all<Record<string, unknown>>();
    const daily = await db
      .prepare(
        `SELECT downloaded_at / 86400000 AS day, COUNT(*) AS count
         FROM software_downloads WHERE downloaded_at >= ?
         GROUP BY day ORDER BY day`,
      )
      .bind(from30)
      .all<Record<string, unknown>>();
    return NextResponse.json({
      totals: {
        total: num(totals?.total),
        today: num(totals?.today),
        last7: num(totals?.last7),
        last30: num(totals?.last30),
        lastDownloadAt: totals?.lastDownloadAt ? Number(totals.lastDownloadAt) : null,
      },
      perApp: perApp.results.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        version: String(r.version),
        totalAllTime: num(r.totalAllTime),
        total: num(r.total),
        today: num(r.today),
        last7: num(r.last7),
        last30: num(r.last30),
        lastDownloadAt: r.lastDownloadAt ? Number(r.lastDownloadAt) : null,
      })),
      recent: recent.results.map((r) => ({
        name: String(r.name),
        version: String(r.version),
        fileName: String(r.fileName),
        downloadedAt: Number(r.downloadedAt),
        userAgent: r.userAgent ? String(r.userAgent) : "",
      })),
      daily: daily.results.map((r) => ({ day: Number(r.day), count: num(r.count) })),
    });
  } catch (error) {
    // Table not migrated yet or D1 hiccup: report empty stats instead of
    // breaking the admin page.
    console.error("Download stats unavailable", error);
    return NextResponse.json({
      totals: { total: 0, today: 0, last7: 0, last30: 0, lastDownloadAt: null },
      perApp: [],
      recent: [],
      daily: [],
    });
  }
}
