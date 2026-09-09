import { NextRequest,NextResponse } from "next/server";
import { isAdminEmail } from "@/db/owner";
export const authorized=(req:NextRequest)=>process.env.NODE_ENV==="development"||isAdminEmail(req.headers.get("oai-authenticated-user-email"));
export const denied=()=>NextResponse.json({error:"Phiên đăng nhập không có quyền quản trị. Hãy đăng nhập lại bằng duc.lanrung@gmail.com."},{status:403});
export const safeName=(name:string)=>name.replace(/[^a-zA-Z0-9._-]/g,"-");
