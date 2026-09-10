"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, ShieldCheck } from "lucide-react";
import { ADMIN_EMAIL } from "@/app/supabase-config";
import { getSupabaseBrowserClient } from "@/app/supabase-browser";
import AdminPanel from "./panel";

type AdminSession = { email: string; accessToken: string };

export default function AdminGate() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [foreignEmail, setForeignEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      const active = data.session;
      if (!active) {
        setSession(null);
        setForeignEmail("");
        setLoading(false);
        return;
      }
      const { data: verified, error } = await supabase.auth.getUser(active.access_token);
      const email = verified.user?.email?.trim().toLowerCase() || "";
      if (error || !verified.user) {
        await supabase.auth.signOut();
        setSession(null);
      } else if (email !== ADMIN_EMAIL) {
        setForeignEmail(email);
        setSession(null);
      } else {
        setForeignEmail("");
        setSession({ email, accessToken: active.access_token });
      }
      setLoading(false);
    };
    void syncSession();
    const { data: listener } = supabase.auth.onAuthStateChange(() => void syncSession());
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn() {
    setMessage("");
    const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setMessage("Không thể mở đăng nhập Google. Vui lòng thử lại.");
  }

  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut();
    setSession(null);
    setForeignEmail("");
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-[#071126] p-6 text-white"><p className="font-bold text-cyan-200">Đang kiểm tra phiên đăng nhập…</p></main>;
  }
  if (session) {
    return <AdminPanel email={session.email} accessToken={session.accessToken} onSignOut={signOut} />;
  }
  return (
    <main className="grid min-h-screen place-items-center bg-[#071126] p-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-cyan-300/15 bg-white/[.055] p-7 text-center shadow-2xl sm:p-9">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-300"><ShieldCheck size={31} /></span>
        <h1 className="mt-5 text-2xl font-black">Quản trị Hugo Cyberx</h1>
        <p className="mt-3 leading-7 text-slate-400">Đăng nhập bằng Google để thêm, sửa hoặc xóa phần mềm trên website.</p>
        {foreignEmail && <p className="mt-4 rounded-xl bg-rose-400/10 p-3 text-sm font-bold text-rose-200">Tài khoản {foreignEmail} không có quyền quản trị.</p>}
        {message && <p className="mt-4 rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100">{message}</p>}
        <button onClick={signIn} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-[#071126]"><LogIn size={19} /> Đăng nhập bằng Google</button>
        {foreignEmail && <button onClick={signOut} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-slate-400"><LogOut size={16} /> Đăng xuất tài khoản hiện tại</button>}
        <a href="/" className="mt-5 block text-sm font-bold text-cyan-300">← Quay lại trang chủ</a>
      </section>
    </main>
  );
}
