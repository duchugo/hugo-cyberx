"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Apple, Download, Monitor, Smartphone } from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string;
  platform: "Windows" | "Android" | "iOS";
  version: string;
  size: string;
  category: string;
  downloads: number;
  saleType: "free" | "paid";
  price?: string;
  purchaseNote?: string;
  logoUrl?: string;
  icon: string;
  downloadUrl?: string;
  updatedAt?: number;
  status?: string;
  features?: string;
  screenshots?: string;
  requirements?: string;
  license?: string;
  installationGuide?: string;
  changelog?: string;
};

const platformIcon = (platform: Product["platform"]) =>
  platform === "Windows" ? <Monitor size={16} /> : platform === "Android" ? <Smartphone size={16} /> : <Apple size={16} />;
const lines = (value?: string) => (value || "").split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
const statusLabel = (value?: string) => value === "beta" ? "Beta" : value === "development" ? "Đang phát triển" : "Đã phát hành";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/apps/${encodeURIComponent(params.id)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không tìm thấy phần mềm.");
        if (active) setProduct(data as Product);
      })
      .catch((reason) => active && setError(reason instanceof Error ? reason.message : "Không thể tải thông tin phần mềm."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [params.id]);

  return (
    <main className="min-h-screen bg-[#050A18] px-5 py-8 text-white sm:py-12">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200"><ArrowLeft size={16} /> Quay lại danh sách phần mềm</a>
        {loading ? <div className="mt-10 rounded-3xl border border-white/10 bg-white/[.04] p-8 text-slate-400">Đang tải thông tin phần mềm...</div> : error ? <div className="mt-10 rounded-3xl border border-rose-300/20 bg-rose-400/10 p-8 text-rose-100">{error}</div> : product ? (
          <article className="mt-8 rounded-3xl border border-cyan-300/20 bg-[#0B1730]/90 p-6 shadow-2xl sm:p-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                {product.logoUrl ? <img src={product.logoUrl} alt={`Logo ${product.name}`} className="size-20 rounded-2xl object-cover" /> : <span className="grid size-20 place-items-center rounded-2xl bg-cyan-300 text-2xl font-black text-[#071126]">{product.icon}</span>}
                <div>
                  <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">{product.category}</p>
                  <h1 className="mt-2 text-3xl font-black sm:text-4xl">{product.name}</h1>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">{platformIcon(product.platform)} {product.platform} · Phiên bản {product.version}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2"><span className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${product.saleType === "paid" ? "bg-fuchsia-400/15 text-fuchsia-200" : "bg-emerald-400/15 text-emerald-200"}`}>{product.saleType === "paid" ? "Sản phẩm thương mại" : "Miễn phí"}</span><span className="w-fit rounded-full bg-cyan-400/15 px-3 py-1.5 text-xs font-black text-cyan-200">{statusLabel(product.status)}</span></div>
            </div>
            <p className="mt-8 whitespace-pre-line leading-7 text-slate-300">{product.description}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/[.06] p-4"><small className="text-slate-500">Dung lượng</small><strong className="mt-1 block">{product.size}</strong></div>
              <div className="rounded-2xl bg-white/[.06] p-4"><small className="text-slate-500">Lượt tải</small><strong className="mt-1 block">{Number(product.downloads || 0).toLocaleString("vi-VN")}</strong></div>
              <div className="rounded-2xl bg-white/[.06] p-4"><small className="text-slate-500">Cập nhật</small><strong className="mt-1 block">{product.updatedAt ? new Date(product.updatedAt).toLocaleDateString("vi-VN") : "Đang cập nhật"}</strong></div>
            </div>
            {lines(product.features).length > 0 && <section className="mt-8"><h2 className="text-xl font-black">Tính năng chính</h2><ul className="mt-3 grid gap-2 sm:grid-cols-2">{lines(product.features).map((item) => <li key={item} className="rounded-xl bg-white/[.06] p-3 text-slate-300">✓ {item}</li>)}</ul></section>}
            {(product.requirements || product.license || product.installationGuide || product.changelog) && <section className="mt-8 grid gap-4 sm:grid-cols-2">{product.requirements && <Info title="Yêu cầu hệ thống" value={product.requirements} />}{product.license && <Info title="Giấy phép" value={product.license} />}{product.installationGuide && <Info title="Hướng dẫn cài đặt" value={product.installationGuide} />}{product.changelog && <Info title="Lịch sử cập nhật" value={product.changelog} />}</section>}
            {lines(product.screenshots).length > 0 && <section className="mt-8"><h2 className="text-xl font-black">Hình ảnh</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{lines(product.screenshots).map((src) => <img key={src} src={src} alt={`Ảnh ${product.name}`} className="max-h-72 w-full rounded-2xl object-cover" />)}</div></section>}
            {product.saleType === "paid" ? <div className="mt-8 rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/[.08] p-5"><strong className="text-fuchsia-100">Sản phẩm thương mại đang được hoàn thiện.</strong><p className="mt-2 leading-6 text-slate-300">{product.purchaseNote || "Thông tin phát hành sẽ được cập nhật sau."}</p></div> : product.downloadUrl ? <a href={product.downloadUrl} className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-black text-[#071126] hover:bg-cyan-200"><Download size={19} /> Tải xuống miễn phí</a> : <div className="mt-8 rounded-2xl bg-white/[.06] p-4 text-center text-slate-400">Link tải sẽ được cập nhật.</div>}
            <div className="mt-8 border-t border-white/10 pt-6 text-sm leading-6 text-slate-400"><strong className="text-white">Hướng dẫn an toàn</strong><p className="mt-1">Hãy kiểm tra đúng hệ điều hành, quét virus và sao lưu dữ liệu trước khi cài đặt.</p></div>
          </article>
        ) : null}
      </div>
    </main>
  );
}

function Info({ title, value }: { title: string; value: string }) { return <div className="rounded-2xl bg-white/[.06] p-4"><h3 className="font-bold text-white">{title}</h3><p className="mt-2 whitespace-pre-line leading-6 text-slate-300">{value}</p></div>; }
