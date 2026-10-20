import { NextRequest, NextResponse } from "next/server";
import { ensureApplicationsHiddenColumn, getRawDb } from "@/db";

const bytes = (n: number) =>
  n < 1048576 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1048576).toFixed(1)} MB`;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await ensureApplicationsHiddenColumn();
    const row = await getRawDb()
      .prepare(
        `SELECT id,name,description,platform,version,size_bytes AS sizeBytes,category,color,downloads,
                sale_type AS saleType,price,purchase_note AS purchaseNote,created_at AS updatedAt
         FROM applications WHERE id = ? AND hidden = 0`,
      )
      .bind(id)
      .first<Record<string, unknown>>();
    if (!row) return NextResponse.json({ error: "Không tìm thấy phần mềm." }, { status: 404 });
    return NextResponse.json({
      ...row,
      size: bytes(Number(row.sizeBytes)),
      logoUrl: `/api/apps/logo?id=${encodeURIComponent(String(row.id))}`,
      icon: String(row.name).split(/\s+/).map((value) => value[0]).join("").slice(0, 2).toUpperCase(),
      downloadUrl: `/api/download/${row.id}`,
      hidden: false,
    });
  } catch (error) {
    console.error("Unable to load product detail", error);
    return NextResponse.json({ error: "Không thể tải thông tin phần mềm." }, { status: 500 });
  }
}
