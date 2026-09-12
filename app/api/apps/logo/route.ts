import { NextRequest, NextResponse } from "next/server";
import { getAdminIdentity } from "@/app/api/admin-auth";
import { getBucket, getRawDb } from "@/db";

const logoKey = (id: string) => `logos/${id}`;

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id")?.trim() || "";
  if (!id) return NextResponse.json({ error: "Thiếu mã phần mềm." }, { status: 400 });
  const object = await getBucket().get(logoKey(id));
  if (!object) return NextResponse.json({ error: "Chưa có logo." }, { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "no-store");
  return new Response(object.body, { headers });
}

export async function POST(req: NextRequest) {
  if (!(await getAdminIdentity(req))) {
    return NextResponse.json({ error: "Không có quyền quản trị." }, { status: 403 });
  }
  try {
    const id = new URL(req.url).searchParams.get("id")?.trim() || "";
    const app = id
      ? await getRawDb().prepare("SELECT id FROM applications WHERE id=?").bind(id).first()
      : null;
    if (!app) return NextResponse.json({ error: "Không tìm thấy phần mềm." }, { status: 404 });
    const form = await req.formData();
    const logo = form.get("logo");
    if (!(logo instanceof File) || !logo.size) {
      return NextResponse.json({ error: "Vui lòng chọn ảnh logo." }, { status: 400 });
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(logo.type)) {
      return NextResponse.json({ error: "Logo chỉ hỗ trợ PNG, JPG hoặc WEBP." }, { status: 400 });
    }
    if (logo.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Logo không được vượt quá 2 MB." }, { status: 400 });
    }
    await getBucket().put(logoKey(id), logo.stream(), {
      httpMetadata: { contentType: logo.type },
    });
    return NextResponse.json({ ok: true, logoUrl: `/api/apps/logo?id=${encodeURIComponent(id)}&v=${Date.now()}` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể lưu logo." }, { status: 500 });
  }
}
