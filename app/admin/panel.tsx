"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Gift,
  ImageUp,
  LogOut,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
type App = {
  id: string;
  name: string;
  platform: string;
  version: string;
  size: string;
  downloads: number;
  description: string;
  category: string;
  color: string;
  saleType: "free" | "paid";
  price: string;
  purchaseNote: string;
  logoUrl?: string;
};
type BankSettings = {
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  thankYouText?: string | null;
};
type DownloadStats = {
  totals: { total: number; today: number; last7: number; last30: number; lastDownloadAt: number | null };
  perApp: {
    id: string;
    name: string;
    version: string;
    totalAllTime: number;
    total: number;
    today: number;
    last7: number;
    last30: number;
    lastDownloadAt: number | null;
  }[];
  recent: { name: string; version: string; fileName: string; downloadedAt: number; userAgent: string }[];
  daily: { day: number; count: number }[];
};
const DAY_MS = 86_400_000;
const formatDateTime = (ms: number) =>
  new Date(ms).toLocaleString("vi-VN", { hour12: false, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const detectBrowser = (ua: string) =>
  /edg/i.test(ua) ? "Edge" : /coccoc/i.test(ua) ? "Cốc Cốc" : /opr/i.test(ua) ? "Opera" : /firefox/i.test(ua) ? "Firefox" : /chrome/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : "Trình duyệt khác";
const detectPlatform = (ua: string) =>
  /windows/i.test(ua) ? "Windows" : /android/i.test(ua) ? "Android" : /iphone|ipad/i.test(ua) ? "iOS" : /mac os/i.test(ua) ? "macOS" : /linux/i.test(ua) ? "Linux" : "Khác";
export default function AdminPanel({
  email,
  accessToken,
  onSignOut,
}: {
  email: string;
  accessToken: string;
  onSignOut: () => void;
}) {
  const [apps, setApps] = useState<App[]>([]),
    [note, setNote] = useState("");
  const [bank, setBank] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    thankYouText: "Cảm ơn bạn đã đồng hành cùng Hugo Cyberx!",
  });
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const authorization = { Authorization: `Bearer ${accessToken}` };
  const load = () =>
    fetch("/api/apps")
      .then((r) => r.json())
      .then(setApps);
  useEffect(load, []);
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json() as Promise<BankSettings>)
      .then((s) =>
        setBank({
          bankName: s.bankName || "",
          accountNumber: s.accountNumber || "",
          accountName: s.accountName || "",
          thankYouText: s.thankYouText || "Cảm ơn bạn đã đồng hành cùng Hugo Cyberx!",
        }),
      )
      .catch(() => {});
  }, []);
  useEffect(() => {
    fetch("/api/downloads/stats", { headers: authorization })
      .then((r) => (r.ok ? (r.json() as Promise<DownloadStats>) : null))
      .then((s) => s && setStats(s))
      .catch(() => {});
  }, []);
  const bankField = (name: keyof typeof bank) => ({
    value: bank[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setBank((current) => ({ ...current, [name]: e.target.value })),
  });
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form=e.currentTarget,fd=new FormData(form),file=fd.get("file");
    if(!(file instanceof File)||!file.size){setNote("Vui lòng chọn file cài đặt.");return}
    try{
      setNote("Đang chuẩn bị tải file...");
      const logo=fd.get("logo");
      const meta=Object.fromEntries([...fd.entries()].filter(([k])=>k!=="file"&&k!=="logo").map(([k,v])=>[k,String(v)]));
      const init=await fetch("/api/uploads/init",{method:"POST",headers:{...authorization,"content-type":"application/json"},body:JSON.stringify({fileName:file.name,contentType:file.type})});
      const job=await init.json();if(!init.ok)throw new Error(job.error||"Không thể bắt đầu tải file.");
      const chunkSize=8*1024*1024,parts:{partNumber:number;etag:string}[]=[];
      for(let start=0,partNumber=1;start<file.size;start+=chunkSize,partNumber++){
        const end=Math.min(start+chunkSize,file.size);setNote(`Đang tải lên ${Math.round(start/file.size*100)}%...`);
        const r=await fetch(`/api/uploads/part?key=${encodeURIComponent(job.key)}&uploadId=${encodeURIComponent(job.uploadId)}&partNumber=${partNumber}`,{method:"PUT",headers:authorization,body:file.slice(start,end)});
        const p=await r.json();if(!r.ok)throw new Error(p.error||`Lỗi tại phần ${partNumber}.`);parts.push(p);
      }
      setNote("Đang hoàn tất...");
      const done=await fetch("/api/uploads/complete",{method:"POST",headers:{...authorization,"content-type":"application/json"},body:JSON.stringify({...meta,...job,size:file.size,parts})});
      const result=await done.json();if(!done.ok)throw new Error(result.error||"Không thể hoàn tất.");
      let logoWarning = "";
      if (logo instanceof File && logo.size) {
        try {
          await uploadLogo(job.id, logo);
        } catch (error) {
          logoWarning = error instanceof Error ? error.message : "Không thể lưu logo.";
        }
      }
      setNote(logoWarning ? `Phần mềm đã đăng, nhưng logo chưa lưu được: ${logoWarning}` : "Đã tải lên và đăng phần mềm thành công.");
      form.reset();
      load();
    }catch(err){setNote(err instanceof Error?err.message:"Không thể đăng phần mềm.")}
  }
  async function uploadLogo(id: string, logo: File) {
    const data = new FormData();
    data.set("logo", logo);
    const response = await fetch(`/api/apps/logo?id=${encodeURIComponent(id)}`, {
      method: "POST",
      headers: authorization,
      body: data,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Không thể lưu logo.");
    setApps((current) => current.map((app) => app.id === id ? { ...app, logoUrl: result.logoUrl } : app));
  }
  async function edit(a: App) {
    const name = prompt("Tên phần mềm", a.name);
    if (!name) return;
    const version = prompt("Phiên bản mới", a.version);
    if (!version) return;
    const description = prompt("Mô tả", a.description);
    if (!description) return;
    const price = a.saleType === "paid" ? prompt("Giá bán", a.price) ?? a.price : "";
    const r = await fetch("/api/apps", {
      method: "PATCH",
      headers: { ...authorization, "content-type": "application/json" },
      body: JSON.stringify({ ...a, name, version, description, price }),
    });
    setNote(r.ok ? "Đã cập nhật phần mềm." : "Không thể cập nhật.");
    if (r.ok) load();
  }
  async function replaceVersion(a: App, file: File) {
    const version = prompt("Nhập số phiên bản mới", a.version);
    if (!version?.trim()) return;
    if (!confirm(`Cập nhật ${a.name} lên phiên bản ${version.trim()}?`)) return;
    try {
      setNote(`Đang chuẩn bị phiên bản ${version.trim()}...`);
      const init = await fetch("/api/uploads/init", {
        method: "POST",
        headers: { ...authorization, "content-type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      const job = await init.json();
      if (!init.ok) throw new Error(job.error || "Không thể bắt đầu tải file.");
      const chunkSize = 8 * 1024 * 1024;
      const parts: { partNumber: number; etag: string }[] = [];
      for (let start = 0, partNumber = 1; start < file.size; start += chunkSize, partNumber++) {
        const end = Math.min(start + chunkSize, file.size);
        setNote(`Đang tải phiên bản mới ${Math.round((start / file.size) * 100)}%...`);
        const response = await fetch(
          `/api/uploads/part?key=${encodeURIComponent(job.key)}&uploadId=${encodeURIComponent(job.uploadId)}&partNumber=${partNumber}`,
          { method: "PUT", headers: authorization, body: file.slice(start, end) },
        );
        const part = await response.json();
        if (!response.ok) throw new Error(part.error || `Lỗi tại phần ${partNumber}.`);
        parts.push(part);
      }
      setNote("Đang chuyển sang phiên bản mới...");
      const done = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { ...authorization, "content-type": "application/json" },
        body: JSON.stringify({ ...job, replaceId: a.id, version: version.trim(), size: file.size, parts }),
      });
      const result = await done.json();
      if (!done.ok) throw new Error(result.error || "Không thể hoàn tất cập nhật.");
      setNote(`Đã cập nhật ${a.name} lên phiên bản ${version.trim()}. Lượt tải cũ được giữ nguyên.`);
      load();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Không thể cập nhật phiên bản.");
    }
  }
  async function remove(id: string) {
    if (!confirm("Xóa phần mềm và file cài đặt này?")) return;
    await fetch(`/api/apps?id=${id}`, { method: "DELETE", headers: authorization });
    load();
  }
  async function saveBank(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const r = await fetch("/api/settings", {
      method: "POST",
      headers: authorization,
      body: new FormData(e.currentTarget),
    });
    setNote(r.ok ? "Đã lưu thông tin cảm ơn." : "Không thể lưu.");
  }
  return (
    <main className="min-h-screen bg-[#071126] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <a
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-cyan-300"
          >
            <ArrowLeft size={17} /> Hugo Cyberx
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:inline">{email}</span>
            <button onClick={onSignOut} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-slate-300 hover:bg-white/5">
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[1.15fr_.85fr]">
        <section>
          <h1 className="text-3xl font-black">Quản trị phần mềm</h1>
          <p className="mt-2 text-slate-400">
            Chỉ tài khoản chủ sở hữu truy cập được khu vực này.
          </p>
          <form onSubmit={add} className="admin-card mt-7 space-y-4">
            <h2 className="flex items-center gap-2 text-xl font-extrabold">
              <Upload className="text-cyan-300" /> Đăng phần mềm mới
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên phần mềm">
                <input name="name" required />
              </Field>
              <Field label="Phiên bản">
                <input name="version" required placeholder="1.0.0" />
              </Field>
              <Field label="Nền tảng">
                <select name="platform">
                  <option>Windows</option>
                  <option>Android</option>
                  <option>iOS</option>
                </select>
              </Field>
              <Field label="Danh mục">
                <input name="category" required placeholder="Tiện ích" />
              </Field>
              <Field label="Hình thức">
                <select name="saleType" defaultValue="free">
                  <option value="free">Miễn phí</option>
                  <option value="paid">Trả phí</option>
                </select>
              </Field>
              <Field label="Giá bán (nếu trả phí)">
                <input name="price" placeholder="Ví dụ: 299.000đ" />
              </Field>
            </div>
            <Field label="Mô tả">
              <textarea name="description" required rows={3} />
            </Field>
            <Field label="Hướng dẫn mua (nếu trả phí)">
              <textarea name="purchaseNote" rows={2} placeholder="Ví dụ: Liên hệ 0978.39.55.39 để thanh toán và nhận phần mềm" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
              <Field label="Màu logo">
                <input name="color" type="color" defaultValue="#16D9E3" />
              </Field>
              <Field label="File cài đặt">
                <input
                  name="file"
                  required
                  type="file"
                  accept=".exe,.msi,.zip,.apk,.ipa"
                />
              </Field>
            </div>
            <Field label="Logo ứng dụng (PNG, JPG hoặc WEBP; tối đa 2 MB)">
              <input name="logo" type="file" accept="image/png,image/jpeg,image/webp" />
            </Field>
            <button className="admin-button">
              <Upload size={17} /> Tải lên và đăng
            </button>
          </form>
          <div className="mt-6 space-y-3">
            {apps.map((a) => (
              <div key={a.id} className="admin-card flex items-center gap-3">
                <AdminLogo app={a} />
                <div className="min-w-0 flex-1">
                  <strong className="block truncate">{a.name}</strong>
                  <span className="text-sm text-slate-400">
                    {a.platform} · v{a.version} · {a.size} · {a.saleType === "paid" ? `Trả phí ${a.price}` : "Miễn phí"}
                  </span>
                </div>
                <button
                  onClick={() => edit(a)}
                  className="rounded-lg p-2 text-cyan-300 hover:bg-cyan-300/10"
                  aria-label="Sửa"
                >
                  <Pencil size={18} />
                </button>
                <label
                  className="cursor-pointer rounded-lg p-2 text-fuchsia-300 hover:bg-fuchsia-300/10"
                  title="Tải lên hoặc thay logo"
                >
                  <ImageUp size={18} />
                  <span className="sr-only">Thay logo {a.name}</span>
                  <input
                    className="hidden"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const logo = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (logo) void uploadLogo(a.id, logo).then(() => setNote(`Đã cập nhật logo ${a.name}.`)).catch((error) => setNote(error.message));
                    }}
                  />
                </label>
                <label
                  className="cursor-pointer rounded-lg p-2 text-emerald-300 hover:bg-emerald-300/10"
                  title="Thay file và cập nhật phiên bản"
                >
                  <RefreshCw size={18} />
                  <span className="sr-only">Cập nhật phiên bản {a.name}</span>
                  <input
                    className="hidden"
                    type="file"
                    accept=".exe,.msi,.zip,.apk,.ipa"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (file) void replaceVersion(a, file);
                    }}
                  />
                </label>
                <button
                  onClick={() => remove(a.id)}
                  className="rounded-lg p-2 text-rose-400 hover:bg-rose-400/10"
                  aria-label="Xóa"
                >
                  <Trash2 size={19} />
                </button>
              </div>
            ))}
          </div>
        </section>
        <aside>
          <form
            onSubmit={saveBank}
            className="admin-card space-y-4 lg:sticky lg:top-6"
          >
            <h2 className="flex items-center gap-2 text-xl font-extrabold">
              <Gift className="text-fuchsia-400" /> Mã QR cảm ơn
            </h2>
            <p className="text-sm leading-6 text-slate-400">
              Người dùng có thể ủng hộ tùy tâm; phần mềm vẫn hoàn toàn miễn phí.
            </p>
            <Field label="Ngân hàng">
              <input name="bankName" placeholder="Ví dụ: Vietcombank" {...bankField("bankName")} />
            </Field>
            <Field label="Số tài khoản">
              <input name="accountNumber" {...bankField("accountNumber")} />
            </Field>
            <Field label="Tên chủ tài khoản">
              <input name="accountName" {...bankField("accountName")} />
            </Field>
            <Field label="Lời cảm ơn">
              <textarea
                name="thankYouText"
                rows={3}
                {...bankField("thankYouText")}
              />
            </Field>
            <Field label="Ảnh mã QR">
              <input name="qr" type="file" accept="image/png,image/jpeg" />
            </Field>
            <button className="admin-button">
              <Save size={17} /> Lưu thông tin
            </button>
            {note && (
              <p className="rounded-xl bg-cyan-300/10 p-3 text-sm font-bold text-cyan-200">
                {note}
              </p>
            )}
          </form>
        </aside>
      </div>
      <section className="mx-auto max-w-6xl px-5 pb-14">
        <h2 className="flex items-center gap-2 text-2xl font-black">
          <BarChart3 className="text-cyan-300" size={24} /> Thống kê tải xuống
        </h2>
        {stats ? (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Tổng lượt tải", value: stats.totals.total },
                { label: "Hôm nay", value: stats.totals.today },
                { label: "7 ngày gần nhất", value: stats.totals.last7 },
                { label: "30 ngày gần nhất", value: stats.totals.last30 },
              ].map((card) => (
                <div key={card.label} className="admin-card">
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className="mt-1 text-3xl font-black text-cyan-200">{card.value}</p>
                </div>
              ))}
            </div>
            <div className="admin-card mt-6">
              <h3 className="font-bold">Lượt tải theo ngày (30 ngày gần nhất)</h3>
              <DailyChart daily={stats.daily} />
              <p className="mt-1 text-xs text-slate-500">
                {formatDateTime((stats.daily[0]?.day || Math.floor(Date.now() / DAY_MS) - 29) * DAY_MS)} → hôm nay
              </p>
            </div>
            <div className="admin-card mt-6 overflow-x-auto">
              <h3 className="font-bold">Lượt tải theo phần mềm</h3>
              <table className="mt-3 w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-2 pr-4">Phần mềm</th>
                    <th className="py-2 pr-4">Phiên bản</th>
                    <th className="py-2 pr-4">Tổng</th>
                    <th className="py-2 pr-4">Hôm nay</th>
                    <th className="py-2 pr-4">7 ngày</th>
                    <th className="py-2 pr-4">30 ngày</th>
                    <th className="py-2">Lần tải gần nhất</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.perApp.map((app) => (
                    <tr key={app.id} className="border-t border-white/10">
                      <td className="py-2 pr-4 font-bold">{app.name}</td>
                      <td className="py-2 pr-4">{app.version}</td>
                      <td className="py-2 pr-4 font-bold text-cyan-200">{app.totalAllTime}</td>
                      <td className="py-2 pr-4">{app.today}</td>
                      <td className="py-2 pr-4">{app.last7}</td>
                      <td className="py-2 pr-4">{app.last30}</td>
                      <td className="py-2">{app.lastDownloadAt ? formatDateTime(app.lastDownloadAt) : "—"}</td>
                    </tr>
                  ))}
                  {stats.perApp.length === 0 && (
                    <tr><td colSpan={7} className="py-3 text-slate-500">Chưa có lượt tải nào được ghi nhận.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="admin-card mt-6">
              <h3 className="font-bold">Lượt tải gần nhất</h3>
              <ul className="mt-3 max-h-[40rem] space-y-2 overflow-y-auto pr-2 text-sm">
                {stats.recent.map((item, index) => (
                  <li key={`${item.downloadedAt}-${index}`} className="grid gap-1 border-b border-white/5 pb-2 sm:grid-cols-3 sm:items-center sm:gap-4">
                    <span className="min-w-0 truncate font-bold">{item.name} <span className="font-normal text-slate-400">v{item.version}</span></span>
                    <time className="whitespace-nowrap tabular-nums text-slate-400 sm:text-center" dateTime={new Date(item.downloadedAt).toISOString()}>{formatDateTime(item.downloadedAt)}</time>
                    <span className="truncate text-slate-500 sm:text-right">{detectBrowser(item.userAgent)} · {detectPlatform(item.userAgent)}</span>
                  </li>
                ))}
                {stats.recent.length === 0 && <li className="text-slate-500">Chưa có dữ liệu.</li>}
              </ul>
            </div>
          </>
        ) : (
          <p className="mt-4 text-slate-400">Đang tải thống kê…</p>
        )}
      </section>
    </main>
  );
}
function DailyChart({ daily }: { daily: { day: number; count: number }[] }) {
  const today = Math.floor(Date.now() / DAY_MS);
  const counts = new Map(daily.map((d) => [d.day, d.count]));
  const points = Array.from({ length: 30 }, (_, i) => today - 29 + i).map((day) => ({
    day,
    count: counts.get(day) || 0,
  }));
  const max = Math.max(1, ...points.map((p) => p.count));
  return (
    <svg viewBox="0 0 300 80" className="mt-3 w-full" role="img" aria-label="Lượt tải theo ngày">
      {points.map((point, index) => {
        const height = (point.count / max) * 64;
        return (
          <rect
            key={point.day}
            x={index * 10 + 1}
            y={74 - height}
            width={8}
            height={height}
            rx={1}
            fill={point.count ? "#22d3ee" : "rgba(148,163,184,.25)"}
          >
            <title>{`${new Date(point.day * DAY_MS).toLocaleDateString("vi-VN")}: ${point.count} lượt`}</title>
          </rect>
        );
      })}
    </svg>
  );
}
function AdminLogo({ app }: { app: App }) {
  const [failedUrl, setFailedUrl] = useState("");
  if (!app.logoUrl || failedUrl === app.logoUrl) {
    return <span className="grid h-11 w-11 place-items-center rounded-xl font-black text-slate-950" style={{ background: app.color }}>{app.name.slice(0, 2).toUpperCase()}</span>;
  }
  return <span className="h-11 w-11 overflow-hidden rounded-xl bg-white/5"><img src={app.logoUrl} alt={`Logo ${app.name}`} className="h-full w-full object-contain p-1" onError={() => setFailedUrl(app.logoUrl || "")} /></span>;
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
