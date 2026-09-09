import { NextRequest, NextResponse } from "next/server";
import { getBucket, getRawDb } from "@/db";
import { isAdminEmail } from "@/db/owner";
const user = (req: NextRequest) =>
  req.headers.get("oai-authenticated-user-id") ||
  (process.env.NODE_ENV === "development" ? "local-user" : null);
const admin=(req:NextRequest)=>process.env.NODE_ENV==="development"||isAdminEmail(req.headers.get("oai-authenticated-user-email"));
const bytes = (n: number) =>
  n < 1048576
    ? `${Math.max(1, Math.round(n / 1024))} KB`
    : `${(n / 1048576).toFixed(1)} MB`;
const shape = (r: Record<string, unknown>) => ({
  ...r,
  size: bytes(Number(r.sizeBytes)),
  icon: String(r.name)
    .split(/\s+/)
    .map((v) => v[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
  downloadUrl: r.saleType === "paid" ? undefined : `/api/download/${r.id}`,
});
export async function GET() {
  try {
    const rows = await getRawDb()
      .prepare(
        "SELECT id,name,description,platform,version,size_bytes AS sizeBytes,category,color,downloads,sale_type AS saleType,price,purchase_note AS purchaseNote FROM applications ORDER BY created_at DESC",
      )
      .all<Record<string, unknown>>();
    return NextResponse.json(rows.results.map(shape));
  } catch {
    return NextResponse.json([]);
  }
}
export async function POST(req: NextRequest) {
  if (!admin(req))
    return NextResponse.json(
      { error: "Không có quyền quản trị." },
      { status: 403 },
    );
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size)
      return NextResponse.json({ error: "Thiếu file." }, { status: 400 });
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["exe", "msi", "zip", "apk", "ipa"].includes(ext))
      return NextResponse.json(
        { error: "Định dạng không hỗ trợ." },
        { status: 400 },
      );
    const id = crypto.randomUUID(),
      safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-"),
      key = `installers/${id}/${safe}`;
    await getBucket().put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
        contentDisposition: `attachment; filename="${safe}"`,
      },
    });
    const name = String(form.get("name") || "").trim(),
      description = String(form.get("description") || "").trim(),
      platform = String(form.get("platform") || "Windows"),
      version = String(form.get("version") || "1.0.0"),
      category = String(form.get("category") || "Tiện ích"),
      color = String(form.get("color") || "#16D9E3"),
      saleType = form.get("saleType") === "paid" ? "paid" : "free",
      price = String(form.get("price") || "").trim(),
      purchaseNote = String(form.get("purchaseNote") || "").trim();
    await getRawDb()
      .prepare(
        "INSERT INTO applications (id,name,description,platform,version,size_bytes,category,color,object_key,downloads,sale_type,price,purchase_note,created_at,uploader_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      )
      .bind(
        id,
        name,
        description,
        platform,
        version,
        file.size,
        category,
        color,
        key,
        0,
        saleType,
        price,
        purchaseNote,
        Date.now(),
        user(req),
      )
      .run();
    return NextResponse.json(
      shape({
        id,
        name,
        description,
        platform,
        version,
        sizeBytes: file.size,
        category,
        color,
        downloads: 0,
        saleType,
        price,
        purchaseNote,
      }),
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Không thể lưu phần mềm." },
      { status: 500 },
    );
  }
}
export async function PATCH(req: NextRequest) {
  if (!admin(req))
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  const b = await req.json();
  await getRawDb()
    .prepare(
      "UPDATE applications SET name=?,description=?,platform=?,version=?,category=?,color=?,sale_type=?,price=?,purchase_note=? WHERE id=?",
    )
    .bind(
      b.name,
      b.description,
      b.platform,
      b.version,
      b.category,
      b.color,
      b.saleType === "paid" ? "paid" : "free",
      b.price || "",
      b.purchaseNote || "",
      b.id,
    )
    .run();
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: NextRequest) {
  if (!admin(req))
    return NextResponse.json({ error: "Không có quyền." }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu mã." }, { status: 400 });
  const row = await getRawDb()
    .prepare("SELECT object_key FROM applications WHERE id=?")
    .bind(id)
    .first<{ object_key: string }>();
  if (row) await getBucket().delete(row.object_key);
  await getRawDb()
    .prepare("DELETE FROM applications WHERE id=?")
    .bind(id)
    .run();
  return NextResponse.json({ ok: true });
}
