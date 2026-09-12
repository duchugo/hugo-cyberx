"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Gift,
  LogOut,
  Package,
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
};
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
  const authorization = { Authorization: `Bearer ${accessToken}` };
  const load = () =>
    fetch("/api/apps")
      .then((r) => r.json())
      .then(setApps);
  useEffect(load, []);
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form=e.currentTarget,fd=new FormData(form),file=fd.get("file");
    if(!(file instanceof File)||!file.size){setNote("Vui lòng chọn file cài đặt.");return}
    try{
      setNote("Đang chuẩn bị tải file...");
      const meta=Object.fromEntries([...fd.entries()].filter(([k])=>k!=="file").map(([k,v])=>[k,String(v)]));
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
      setNote("Đã tải lên và đăng phần mềm thành công.");
      form.reset();
      load();
    }catch(err){setNote(err instanceof Error?err.message:"Không thể đăng phần mềm.")}
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
            <button className="admin-button">
              <Upload size={17} /> Tải lên và đăng
            </button>
          </form>
          <div className="mt-6 space-y-3">
            {apps.map((a) => (
              <div key={a.id} className="admin-card flex items-center gap-3">
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl font-black text-slate-950"
                  style={{ background: a.color }}
                >
                  {a.name.slice(0, 2).toUpperCase()}
                </span>
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
              <input name="bankName" placeholder="Ví dụ: Vietcombank" />
            </Field>
            <Field label="Số tài khoản">
              <input name="accountNumber" />
            </Field>
            <Field label="Tên chủ tài khoản">
              <input name="accountName" />
            </Field>
            <Field label="Lời cảm ơn">
              <textarea
                name="thankYouText"
                rows={3}
                defaultValue="Cảm ơn bạn đã đồng hành cùng Hugo Cyberx!"
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
          <div className="admin-card mt-6">
            <h3 className="flex items-center gap-2 font-bold">
              <Package size={18} /> Lưu ý xuất bản
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Chỉ đăng phần mềm bạn sở hữu hoặc được phép phân phối. Kiểm tra
              file sạch trước khi công khai.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
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
