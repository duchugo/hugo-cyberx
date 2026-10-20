"use client";

import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const pathname = usePathname();
  const tab = (href: string) => pathname === href ? "whitespace-nowrap rounded-lg px-3 py-2 text-cyan-300" : "whitespace-nowrap rounded-lg px-3 py-2 hover:bg-white/10 hover:text-white";
  return <header className="sticky top-0 z-40 border-b border-cyan-300/10 bg-[#050A18]/90 px-5 py-4 text-white backdrop-blur-xl"><div className="mx-auto flex h-[76px] max-w-[1240px] flex-wrap items-center gap-4 px-0 lg:px-3"><a href="/" className="flex items-center gap-3"><img src="/hugo-cyberx-main-logo.webp" alt="Hugo Cyberx" className="size-10 rounded-xl object-contain" /><span><span className="block text-lg font-black tracking-tight">HUGO <span className="text-cyan-300">CYBERX</span></span><small className="block text-[10px] font-bold tracking-[.16em] text-slate-500">TECHNOLOGY WITHOUT LIMITS</small></span></a><nav className="order-3 flex w-full items-center gap-2 overflow-x-auto text-sm font-bold text-slate-300 sm:order-2 sm:ml-auto sm:w-auto"><a href="/" className={tab("/")} >Phần mềm</a><a href="/phan-mem-tra-phi" className={tab("/phan-mem-tra-phi")} >Trả phí</a><a href="/dich-vu" className={tab("/dich-vu")} >Dịch vụ</a><a href="/ho-tro" className={tab("/ho-tro")} >Hỗ trợ</a><a href="/gioi-thieu" className={tab("/gioi-thieu")} >Giới thiệu</a><a href="/gemini-watermark" className="whitespace-nowrap rounded-lg px-3 py-2 text-emerald-300 hover:bg-white/10">Xóa logo Gemini</a></nav></div></header>;
}
