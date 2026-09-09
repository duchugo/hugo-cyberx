import { NextResponse } from "next/server";
import { getBucket,getRawDb } from "@/db";
export async function GET(){const row=await getRawDb().prepare("SELECT qr_object_key FROM site_settings WHERE id=1").first<{qr_object_key:string|null}>();if(!row?.qr_object_key)return NextResponse.json({error:"Chưa có mã QR."},{status:404});const o=await getBucket().get(row.qr_object_key);if(!o)return NextResponse.json({error:"Không tìm thấy QR."},{status:404});const h=new Headers();o.writeHttpMetadata(h);h.set("cache-control","public, max-age=3600");return new Response(o.body,{headers:h})}
