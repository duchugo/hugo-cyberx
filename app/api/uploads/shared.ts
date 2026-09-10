import { NextRequest, NextResponse } from "next/server";
import { getAdminIdentity } from "@/app/api/admin-auth";

export const authorized = (req: NextRequest) => getAdminIdentity(req);
export const denied = () =>
  NextResponse.json(
    { error: "Phiên đăng nhập không có quyền quản trị. Hãy đăng nhập lại bằng duc.lanrung@gmail.com." },
    { status: 403 },
  );
export const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "-");
