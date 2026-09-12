import { NextRequest, NextResponse } from "next/server";
import { getBucket, getRawDb } from "@/db";
import { authorized, denied } from "../shared";

export async function POST(req: NextRequest) {
  const identity = await authorized(req);
  if (!identity) return denied();
  try {
    const b = await req.json();
    if (!String(b.key || "").startsWith("installers/") || !b.uploadId || !Array.isArray(b.parts)) {
      return NextResponse.json({ error: "Thông tin hoàn tất không hợp lệ." }, { status: 400 });
    }
    const replaceId = String(b.replaceId || "").trim();
    const old = replaceId
      ? await getRawDb()
          .prepare("SELECT object_key FROM applications WHERE id=?")
          .bind(replaceId)
          .first<{ object_key: string }>()
      : null;
    if (replaceId && !old) {
      return NextResponse.json({ error: "Không tìm thấy phần mềm cần cập nhật." }, { status: 404 });
    }
    await getBucket().resumeMultipartUpload(b.key, b.uploadId).complete(b.parts);
    if (replaceId && old) {
      const version = String(b.version || "").trim();
      if (!version) {
        return NextResponse.json({ error: "Vui lòng nhập phiên bản mới." }, { status: 400 });
      }
      await getRawDb()
        .prepare("UPDATE applications SET version=?,size_bytes=?,object_key=?,created_at=?,uploader_id=? WHERE id=?")
        .bind(version, Number(b.size) || 0, b.key, Date.now(), identity.id, replaceId)
        .run();
      if (old.object_key !== b.key) {
        try {
          await getBucket().delete(old.object_key);
        } catch (error) {
          console.error("Unable to remove replaced installer", error);
        }
      }
      return NextResponse.json({ ok: true, updated: true });
    }
    const saleType = b.saleType === "paid" ? "paid" : "free";
    await getRawDb()
      .prepare("INSERT INTO applications (id,name,description,platform,version,size_bytes,category,color,object_key,downloads,sale_type,price,purchase_note,created_at,uploader_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(
        b.id, String(b.name || "").trim(), String(b.description || "").trim(),
        b.platform || "Windows", b.version || "1.0.0", Number(b.size) || 0,
        b.category || "Tiện ích", b.color || "#16D9E3", b.key, 0, saleType,
        String(b.price || ""), String(b.purchaseNote || ""), Date.now(), identity.id,
      )
      .run();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "File đã tải nhưng không thể hoàn tất lưu phần mềm. Vui lòng thử lại." }, { status: 500 });
  }
}
