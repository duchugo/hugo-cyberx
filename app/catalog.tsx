"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Apple,
  CheckCircle2,
  Code2,
  Download,
  Gift,
  Menu,
  Monitor,
  Phone,
  Search,
  ShieldCheck,
  Smartphone,
  Video,
  X,
} from "lucide-react";
type Platform = "Windows" | "Android" | "iOS";
type App = {
  id: string;
  name: string;
  description: string;
  platform: Platform;
  version: string;
  size: string;
  category: string;
  downloads: number;
  color: string;
  icon: string;
  downloadUrl?: string;
  saleType: "free" | "paid";
  price?: string;
  purchaseNote?: string;
};
type Settings = {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  thankYouText?: string;
  qrUrl?: string | null;
};
const samples: App[] = [];
const picon = (p: Platform, s = 18) =>
  p === "Windows" ? (
    <Monitor size={s} />
  ) : p === "Android" ? (
    <Smartphone size={s} />
  ) : (
    <Apple size={s} />
  );
export default function Catalog({mode="free"}:{mode?:"free"|"paid"|"services"}) {
  const [q, setQ] = useState(""),
    [platform, setPlatform] = useState<"Tất cả" | Platform>("Tất cả"),
    [apps, setApps] = useState<App[]>(samples),
    [thanks, setThanks] = useState(false),
    [detail, setDetail] = useState<App | null>(null),
    [menu, setMenu] = useState(false),
    [settings, setSettings] = useState<Settings>({
      bankName: "ACB",
      accountNumber: "365123456",
      accountName: "NGUYEN VAN DUC",
      thankYouText: "Cảm ơn bạn đã đồng hành cùng Hugo Cyberx!",
      qrUrl: "/hugo-cyberx-acb-qr.png",
    });
  useEffect(() => {
    fetch("/api/apps")
      .then((r) => r.json())
      .then((x: App[]) => setApps(x))
      .catch(() => {});
    fetch("/api/settings")
      .then((r) => r.json())
      .then((x: Settings) =>
        setSettings((s) => ({
          bankName: x.bankName || s.bankName,
          accountNumber: x.accountNumber || s.accountNumber,
          accountName: x.accountName || s.accountName,
          thankYouText: x.thankYouText || s.thankYouText,
          qrUrl: x.qrUrl || s.qrUrl,
        })),
      )
      .catch(() => {});
  }, []);
  const filtered = useMemo(
    () =>
      apps.filter(
        (a) =>
          (platform === "Tất cả" || a.platform === platform) &&
          (mode === "services" || a.saleType === mode) &&
          `${a.name} ${a.description} ${a.category}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      ),
    [apps, platform, mode, q],
  );
  return (
    <main className="min-h-screen bg-[#050A18] text-white">
      <header className="sticky top-0 z-40 border-b border-cyan-300/10 bg-[#050A18]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between px-5 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/hugo-cyberx-main-logo.webp"
              alt="Logo Hugo Cyberx"
              className="h-11 w-11 rounded-xl"
            />
            <span>
              <strong className="block text-lg tracking-[.04em]">
                HUGO <i className="not-italic text-cyan-300">CYBERX</i>
              </strong>
              <small className="text-[11px] font-bold tracking-[.18em] text-slate-400">
                TECHNOLOGY WITHOUT LIMITS
              </small>
            </span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-bold text-slate-300 md:flex">
            <a href="/" className={mode === "free" ? "text-cyan-300" : ""}>Miễn phí</a>
            <a href="/phan-mem-tra-phi" className={mode === "paid" ? "text-fuchsia-300" : ""}>Trả phí</a>
            <a href="/dich-vu" className={mode === "services" ? "text-cyan-300" : ""}>Dịch vụ</a>
          </nav>
          {mode === "free" && <button
            onClick={() => setThanks(true)}
            className="hidden items-center gap-2 rounded-xl border border-fuchsia-400/40 bg-fuchsia-400/10 px-4 py-2.5 text-sm font-extrabold text-fuchsia-200 sm:flex"
          >
            <Gift size={17} /> Cảm ơn tác giả
          </button>}
          <button
            onClick={() => setMenu((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 md:hidden"
          >
            <Menu />
          </button>
        </div>
        {menu && (
          <div className="space-y-2 border-t border-white/10 p-4 md:hidden">
            <a href="/" className="block rounded-xl bg-white/5 px-4 py-3 font-bold">Phần mềm miễn phí</a>
            <a href="/phan-mem-tra-phi" className="block rounded-xl bg-white/5 px-4 py-3 font-bold">Phần mềm trả phí</a>
            <a href="/dich-vu" className="block rounded-xl bg-white/5 px-4 py-3 font-bold">Dịch vụ</a>
            {mode === "free" && <button
              onClick={() => setThanks(true)}
              className="w-full rounded-xl bg-fuchsia-500 py-3 font-bold"
            >
              Cảm ơn tác giả
            </button>}
          </div>
        )}
      </header>
      <section
        id="thuong-hieu"
        className="cyber-grid relative overflow-hidden border-b border-cyan-300/10"
      >
        <div className="mx-auto grid max-w-[1240px] items-center gap-9 px-5 py-14 lg:grid-cols-[1fr_500px] lg:px-8 lg:py-20">
          <div>
            <span className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-sm font-bold text-cyan-200">
              {mode === "free" ? "Công cụ miễn phí từ Hugo Cyberx" : mode === "paid" ? "Phần mềm bản quyền & cao cấp" : "Dịch vụ công nghệ Hugo Cyberx"}
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.06] tracking-[-.04em] sm:text-6xl">
              {mode === "services" ? "Công nghệ theo yêu cầu." : mode === "paid" ? "Công cụ chuyên nghiệp." : "Công nghệ dễ dùng."}
              <br />
              <span className="cyber-text">{mode === "services" ? "Hiện thực hóa ý tưởng." : mode === "paid" ? "Giá trị xứng đáng." : "Trao giá trị thật."}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              {mode === "services" ? "Nhận lập trình website, phần mềm, công cụ tự động hóa và sản xuất video AI theo yêu cầu." : mode === "paid" ? "Các sản phẩm trả phí dành cho nhu cầu chuyên sâu, có thông tin giá và hướng dẫn mua rõ ràng." : "Kho ứng dụng Windows, Android và iOS do Hugo Cyberx phát triển hoặc tuyển chọn. Tải miễn phí, thông tin rõ ràng."}
            </p>
          </div>
          <div className="relative flex min-h-[330px] items-center justify-center">
            <div className="absolute h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <img
              src="/hugo-cyberx-main-logo.webp"
              alt="Logo chính Hugo Cyberx"
              className="relative w-full max-w-[430px] rounded-[2rem] shadow-[0_25px_80px_rgba(22,217,227,.2)]"
            />
          </div>
        </div>
      </section>
      {mode !== "services" && <section
        id="san-pham"
        className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8"
      >
        <div className="rounded-2xl border border-white/10 bg-white/[.06] p-3 shadow-2xl sm:flex">
          <label className="flex min-h-14 flex-1 items-center gap-3 px-3">
            <Search className="text-cyan-300" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-transparent text-base outline-none placeholder:text-slate-500"
              placeholder="Tìm phần mềm Hugo..."
            />
          </label>
          <div className="flex gap-2 overflow-x-auto">
            {(["Tất cả", "Windows", "Android", "iOS"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold ${platform === p ? "bg-cyan-300 text-[#071126]" : "bg-white/5 text-slate-300"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-7 mt-12">
          <p className="text-sm font-black uppercase tracking-[.2em] text-fuchsia-400">
            Hugo Software
          </p>
          <h2 className="mt-2 text-3xl font-black">{mode === "paid" ? "Phần mềm trả phí" : "Phần mềm miễn phí"}</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <article
              key={a.id}
              className="group rounded-3xl border border-white/10 bg-white/[.055] p-5 transition hover:-translate-y-1 hover:border-cyan-300/35"
            >
              <div className="flex items-start justify-between">
                <span
                  className="grid h-16 w-16 place-items-center rounded-[19px] text-xl font-black text-[#061126] shadow-lg"
                  style={{ background: a.color }}
                >
                  {a.icon}
                </span>
                <span className="flex items-center gap-2 rounded-full bg-white/[.07] px-3 py-1.5 text-xs font-bold text-slate-300">
                  {picon(a.platform, 15)}
                  {a.platform}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-black">{a.name}</h3>
              <p className={`mt-2 text-sm font-black ${a.saleType === "paid" ? "text-fuchsia-300" : "text-emerald-300"}`}>{a.saleType === "paid" ? (a.price || "Liên hệ báo giá") : "Miễn phí"}</p>
              <p className="mt-3 min-h-[72px] text-[15px] leading-6 text-slate-400">
                {a.description}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <button
                  onClick={() => setDetail(a)}
                  className="text-sm font-bold text-cyan-300"
                >
                  Xem chi tiết
                </button>
                {a.saleType === "paid" ? (
                  <a href="tel:0978395539" className="flex items-center gap-2 rounded-xl bg-fuchsia-400 px-4 py-2.5 text-sm font-black text-[#071126]"><Phone size={16}/> Liên hệ mua</a>
                ) : a.downloadUrl ? (
                  <a
                    href={a.downloadUrl}
                    className="flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-[#071126]"
                  >
                    <Download size={16} /> Tải miễn phí
                  </a>
                ) : (
                  <span className="rounded-xl bg-white/5 px-3 py-2 text-xs font-bold text-slate-500">
                    Sắp phát hành
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>}
      {mode === "free" && <section id="an-toan" className="border-y border-white/10 bg-white/[.03]">
        <div className="mx-auto grid max-w-[1240px] gap-6 px-5 py-10 sm:grid-cols-3 lg:px-8">
          <Trust
            icon={<ShieldCheck />}
            title="Thông tin rõ ràng"
            text="Nền tảng, phiên bản và dung lượng được công bố trước khi tải."
          />
          <Trust
            icon={<CheckCircle2 />}
            title="Tải đúng nhu cầu"
            text="EXE/MSI cho Windows, APK cho Android và hướng dẫn iOS phù hợp."
          />
          <Trust
            icon={<Gift />}
            title="Miễn phí thực sự"
            text="Ủng hộ hoàn toàn tự nguyện, không ảnh hưởng quyền tải phần mềm."
          />
        </div>
      </section>}
      {mode === "services" && <Services />}
      {mode === "free" && <section className="mx-auto max-w-4xl px-5 py-14 text-center">
        <h2 className="text-3xl font-black">Bạn thấy phần mềm hữu ích?</h2>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-400">
          Một lời chia sẻ hoặc khoản cảm ơn tùy tâm sẽ giúp Hugo Cyberx tiếp tục
          hoàn thiện các công cụ miễn phí.
        </p>
        <button
          onClick={() => setThanks(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-fuchsia-500 px-6 py-3 font-black text-[#071126]"
        >
          <Gift size={19} /> Gửi lời cảm ơn
        </button>
      </section>}
      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-slate-500">
        <p>© 2026 Hugo Cyberx · Technology Without Limits</p>
        <div className="mt-3 flex justify-center gap-4">
          <button
            onClick={() =>
              alert(
                "Hugo Cyberx chỉ phân phối phần mềm có quyền chia sẻ. Người dùng cần tự kiểm tra tính phù hợp trước khi cài đặt.",
              )
            }
          >
            Điều khoản sử dụng
          </button>
          <button
            onClick={() =>
              alert(
                "Chỉ tải file từ trang chính thức. Luôn quét virus và sao lưu dữ liệu trước khi cài đặt.",
              )
            }
          >
            Cảnh báo an toàn
          </button>
          <a href="/admin" className="opacity-40">
            Quản trị
          </a>
        </div>
      </footer>
      {mode === "free" && thanks && (
        <Modal close={() => setThanks(false)}>
          <div className="text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-fuchsia-400/15 text-fuchsia-300">
              <Gift size={27} />
            </span>
            <h2 className="mt-4 text-2xl font-black">Cảm ơn từ Hugo Cyberx</h2>
            <p className="mt-2 leading-6 text-slate-400">
              {settings.thankYouText ||
                "Phần mềm luôn miễn phí. Nếu thấy hữu ích, bạn có thể ủng hộ một khoản tùy ý."}
            </p>
            {settings.qrUrl ? (
              <img
                src={settings.qrUrl}
                alt="Mã QR chuyển khoản cảm ơn"
                className="mx-auto mt-5 max-h-64 rounded-2xl bg-white p-3"
              />
            ) : (
              <div className="mx-auto mt-5 grid h-52 w-52 place-items-center rounded-2xl border border-dashed border-cyan-300/30 bg-white/5 px-6 text-sm text-slate-500">
                Mã QR sẽ được cập nhật trong trang quản trị
              </div>
            )}
            {settings.bankName && (
              <div className="mt-5 rounded-xl bg-white/5 p-4 text-sm leading-6">
                <strong>{settings.bankName}</strong>
                <br />
                {settings.accountNumber}
                <br />
                {settings.accountName}
              </div>
            )}
            <p className="mt-4 text-xs text-slate-500">
              Ủng hộ hoàn toàn tự nguyện và không phải điều kiện để tải phần
              mềm.
            </p>
          </div>
        </Modal>
      )}
      {detail && (
        <Modal close={() => setDetail(null)}>
          <div className="flex items-center gap-4">
            <span
              className="grid h-16 w-16 place-items-center rounded-2xl text-xl font-black text-[#071126]"
              style={{ background: detail.color }}
            >
              {detail.icon}
            </span>
            <div>
              <h2 className="text-2xl font-black">{detail.name}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                {picon(detail.platform, 15)} {detail.platform} · Phiên bản{" "}
                {detail.version}
              </p>
            </div>
          </div>
          <p className="mt-6 leading-7 text-slate-300">{detail.description}</p>
          {detail.saleType === "paid" && <div className="mt-5 rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/[.08] p-4"><strong className="text-fuchsia-200">Giá: {detail.price || "Liên hệ báo giá"}</strong><p className="mt-2 text-sm leading-6 text-slate-300">{detail.purchaseNote || "Liên hệ Nguyễn Văn Đức qua số 0978.39.55.39 để mua và nhận phần mềm."}</p></div>}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat label="Dung lượng" value={detail.size} />
            <Stat label="Danh mục" value={detail.category} />
          </div>
          <div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[.06] p-4 text-sm leading-6 text-amber-100/80">
            Hãy quét virus, sao lưu dữ liệu và xác nhận đúng hệ điều hành trước
            khi cài đặt.
          </div>
          {detail.saleType === "paid" ? <a href="tel:0978395539" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-400 py-3 font-black text-[#071126]"><Phone size={18}/> Liên hệ mua: 0978.39.55.39</a> : detail.downloadUrl && (
            <a
              href={detail.downloadUrl}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 py-3 font-black text-[#071126]"
            >
              <Download size={18} /> Tải xuống miễn phí
            </a>
          )}
        </Modal>
      )}
    </main>
  );
}
function Services(){return <section id="dich-vu" className="border-y border-cyan-300/10 bg-gradient-to-b from-cyan-300/[.04] to-fuchsia-500/[.04]"><div className="mx-auto max-w-[1240px] px-5 py-16 lg:px-8"><div className="max-w-2xl"><p className="text-sm font-black uppercase tracking-[.2em] text-cyan-300">Dịch vụ Hugo Cyberx</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">Biến ý tưởng thành sản phẩm</h2><p className="mt-4 leading-7 text-slate-400">Nhận tư vấn và thực hiện giải pháp công nghệ theo nhu cầu cá nhân, cửa hàng và doanh nghiệp.</p></div><div className="mt-8 grid gap-5 md:grid-cols-2"><article className="rounded-3xl border border-white/10 bg-white/[.055] p-6"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300/15 text-cyan-300"><Code2 /></span><h3 className="mt-5 text-xl font-black">Lập trình theo yêu cầu</h3><p className="mt-3 leading-7 text-slate-400">Website, công cụ nội bộ, tự động hóa quy trình và phần mềm phù hợp với nhu cầu thực tế.</p></article><article className="rounded-3xl border border-white/10 bg-white/[.055] p-6"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-fuchsia-400/15 text-fuchsia-300"><Video /></span><h3 className="mt-5 text-xl font-black">Sản xuất video AI</h3><p className="mt-3 leading-7 text-slate-400">Video quảng cáo, giới thiệu sản phẩm và nội dung truyền thông được thiết kế theo yêu cầu.</p></article></div><div id="lien-he" className="mt-6 flex flex-col gap-5 rounded-3xl border border-cyan-300/20 bg-[#08142b] p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-slate-400">Trao đổi trực tiếp với</p><h3 className="mt-1 text-xl font-black">Nguyễn Văn Đức</h3><p className="mt-1 font-bold text-cyan-300">0978.39.55.39</p></div><a href="tel:0978395539" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 py-3 font-black text-[#071126]"><Phone size={18}/> Gọi tư vấn</a></div></div></section>}
function Modal({
  children,
  close,
}: {
  children: React.ReactNode;
  close: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#0B1730] p-6 shadow-2xl sm:p-8">
        <button
          onClick={close}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-slate-400"
          aria-label="Đóng"
        >
          <X size={19} />
        </button>
        {children}
      </div>
    </div>
  );
}
function Trust({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 text-cyan-300">
      {icon}
      <div>
        <h3 className="font-black text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
      </div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-4">
      <small className="text-slate-500">{label}</small>
      <strong className="mt-1 block">{value}</strong>
    </div>
  );
}
