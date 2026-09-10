import { NextRequest, NextResponse } from "next/server";
import { getBucket } from "@/db";
import { authorized, denied } from "../shared";

export async function PUT(req: NextRequest) {
  if (!(await authorized(req))) return denied();
  try {
    const u = new URL(req.url);
    const key = u.searchParams.get("key") || "";
    const uploadId = u.searchParams.get("uploadId") || "";
    const partNumber = Number(u.searchParams.get("partNumber"));
    if (!key.startsWith("installers/") || !uploadId || !Number.isInteger(partNumber) || partNumber < 1) {
      return NextResponse.json({ error: "Thông tin phần tải không hợp lệ." }, { status: 400 });
    }
    const part = await getBucket().resumeMultipartUpload(key, uploadId).uploadPart(partNumber, req.body!);
    return NextResponse.json({ partNumber: part.partNumber, etag: part.etag });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Một phần của file tải lên thất bại." }, { status: 500 });
  }
}
