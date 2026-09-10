import { NextRequest, NextResponse } from "next/server";
import { getBucket } from "@/db";
import { authorized, denied, safeName } from "../shared";

export async function POST(req: NextRequest) {
  if (!(await authorized(req))) return denied();
  try {
    const b = await req.json();
    const ext = String(b.fileName || "").split(".").pop()?.toLowerCase() || "";
    if (!["exe", "msi", "zip", "apk", "ipa"].includes(ext)) {
      return NextResponse.json({ error: "Chỉ hỗ trợ file EXE, MSI, ZIP, APK hoặc IPA." }, { status: 400 });
    }
    const id = crypto.randomUUID();
    const name = safeName(String(b.fileName));
    const key = `installers/${id}/${name}`;
    const upload = await getBucket().createMultipartUpload(key, {
      httpMetadata: {
        contentType: String(b.contentType || "application/octet-stream"),
        contentDisposition: `attachment; filename="${name}"`,
      },
    });
    return NextResponse.json({ id, key, uploadId: upload.uploadId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Không thể khởi tạo lượt tải. Vui lòng thử lại." }, { status: 500 });
  }
}
