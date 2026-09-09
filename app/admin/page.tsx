import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { ADMIN_EMAIL,isAdminEmail } from "@/db/owner";
import AdminPanel from "./panel";
export const dynamic="force-dynamic";
export default async function Admin(){
 const u=await requireChatGPTUser("/admin");
 if(!isAdminEmail(u.email))return <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white"><div className="max-w-md text-center"><h1 className="text-2xl font-black">Khu vực quản trị riêng</h1><p className="mt-3 text-slate-400">Chỉ tài khoản {ADMIN_EMAIL} được phép quản trị Hugo Cyberx.</p><a href="/signout-with-chatgpt?return_to=/admin" className="mt-6 inline-block rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950">Đăng xuất và đổi tài khoản</a></div></main>;
 return <AdminPanel email={u.email}/>
}
