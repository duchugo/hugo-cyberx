"use client";

import { useRef, useState } from "react";
import { ArrowLeft, Download, ImagePlus, ShieldCheck } from "lucide-react";
import { createWatermarkEngine, removeWatermarkFromImage } from "@pilio/gemini-watermark-remover/browser";

type Preview = { file: File; url: string; output?: string };
const VIDEO_HANDOFF_DB = "gwr-debug-file-handoff";
const VIDEO_HANDOFF_STORE = "files";

async function handoffVideo(file: File) {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(VIDEO_HANDOFF_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(VIDEO_HANDOFF_STORE)) request.result.createObjectStore(VIDEO_HANDOFF_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Không mở được bộ nhớ video cục bộ."));
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(VIDEO_HANDOFF_STORE, "readwrite");
      transaction.objectStore(VIDEO_HANDOFF_STORE).put({ id: "latest", kind: "video", file, name: file.name, type: file.type, size: file.size, updatedAt: Date.now() });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Không lưu được video cục bộ."));
      transaction.onabort = () => reject(transaction.error || new Error("Lưu video đã bị hủy."));
    });
  } finally {
    database.close();
  }
}

export default function GeminiWatermarkPage() {
  const [item, setItem] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [videoSession, setVideoSession] = useState(0);
  const engine = useRef<Awaited<ReturnType<typeof createWatermarkEngine>> | null>(null);

  async function choose(file?: File) {
    if (!file) return;
    const image = /^(image\/jpeg|image\/png|image\/webp)$/i.test(file.type);
    const video = /^video\/(mp4|quicktime|webm)$/i.test(file.type) || /\.(mp4|mov|webm)$/i.test(file.name);
    if (!image && !video) { setMessage("Chỉ hỗ trợ JPG, JPEG, PNG, WEBP hoặc MP4, MOV, WEBM."); return; }
    setBusy(true);
    try {
      if (video) await handoffVideo(file);
      setItem((current) => {
        if (current) { URL.revokeObjectURL(current.url); if (current.output) URL.revokeObjectURL(current.output); }
        return { file, url: URL.createObjectURL(file) };
      });
      if (video) {
        setVideoSession(Date.now());
        setMessage("Đã chuyển video sang engine WebCodecs chính thức. Engine tự nhận diện logo Gemini và chữ Veo.");
      } else setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không chuẩn bị được video.");
    } finally {
      setBusy(false);
    }
  }

  async function processImage() {
    if (!item || !item.file.type.startsWith("image/") || busy) return;
    setBusy(true); setMessage("Đang nhận diện và phục hồi logo Gemini trên thiết bị của bạn…");
    try {
      const image = new Image(); image.src = item.url; await image.decode();
      engine.current ??= await createWatermarkEngine();
      const result = await removeWatermarkFromImage(image, { engine: engine.current, adaptiveMode: "auto" });
      const outputBlob = "convertToBlob" in result.canvas
        ? await result.canvas.convertToBlob({ type: item.file.type || "image/png" })
        : await new Promise<Blob>((resolve, reject) => (result.canvas as HTMLCanvasElement).toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error("Không tạo được ảnh kết quả.")), item.file.type || "image/png", 0.98));
      const output = URL.createObjectURL(outputBlob);
      setItem((current) => current ? { ...current, output } : current);
      setMessage(result.meta?.applied === false ? "Không xác định chắc chắn logo Gemini; ảnh gốc được giữ nguyên." : "Đã xử lý xong. File chưa được tải lên máy chủ.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể xử lý ảnh.");
    } finally {
      setBusy(false);
    }
  }

  const isImage = item?.file.type.startsWith("image/");
  const isVideo = item && !isImage;
  return <main className="min-h-screen bg-[#050A18] text-white">
    <header className="border-b border-cyan-300/10"><div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 lg:px-8"><a href="/" className="inline-flex items-center gap-2 font-bold text-cyan-300"><ArrowLeft size={18}/> Hugo Cyberx</a><span className="font-black">Gemini Watermark Remover</span></div></header>
    <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
      <p className="text-sm font-black uppercase text-cyan-300">Công cụ xử lý local</p><h1 className="mt-3 text-balance text-4xl font-black">Xóa logo Gemini</h1><p className="mt-3 max-w-3xl text-pretty leading-7 text-slate-400">Ảnh và video được xử lý trực tiếp trên trình duyệt. File không được tải lên máy chủ.</p>
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[.055] p-6">
        {!item && <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-300/25 text-center hover:bg-cyan-300/5"><ImagePlus size={38} className="text-cyan-300"/><strong className="mt-3">{busy ? "Đang chuẩn bị file…" : "Kéo thả hoặc chọn ảnh/video"}</strong><span className="mt-2 text-sm text-slate-500">JPG, PNG, WEBP, MP4, MOV, WEBM</span><input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" disabled={busy} onChange={(event) => void choose(event.currentTarget.files?.[0])}/></label>}
        {item && isImage && <div className="mt-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{item.file.name}</strong><p className="text-sm text-slate-500">{(item.file.size / 1048576).toFixed(2)} MB</p></div><button onClick={processImage} disabled={busy} className="rounded-xl bg-cyan-300 px-5 py-3 font-black text-[#071126]">{busy ? "Đang xử lý…" : "Xóa logo Gemini"}</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="mb-2 text-xs font-bold uppercase text-slate-500">File gốc</p><img src={item.url} alt="Ảnh gốc" className="max-h-[460px] w-full rounded-2xl bg-black object-contain"/></div>{item.output && <div><p className="mb-2 text-xs font-bold uppercase text-slate-500">File đã xử lý</p><img src={item.output} alt="Ảnh đã xử lý" className="max-h-[460px] w-full rounded-2xl bg-black object-contain"/><a download={`${item.file.name.replace(/\.[^.]+$/, "")}_hugo_clean.png`} href={item.output} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-fuchsia-400 px-4 py-2.5 font-black text-[#071126]"><Download size={17}/> Tải file đã xử lý</a></div>}</div></div>}
        {isVideo && <div><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><strong className="block truncate">{item.file.name}</strong><p className="text-sm text-slate-500">{(item.file.size / 1048576).toFixed(2)} MB · Giữ nguyên FPS, thời lượng và âm thanh</p></div><label className="cursor-pointer rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-white/5">Chọn video khác<input type="file" className="hidden" accept="video/mp4,video/quicktime,video/webm" disabled={busy} onChange={(event) => void choose(event.currentTarget.files?.[0])}/></label></div><iframe key={videoSession} src={`/gwr-video/index.html?fileHandoff=1&embedded=1&session=${videoSession}`} title="Xử lý watermark video bằng WebCodecs" className="h-[760px] w-full border-0 bg-transparent md:h-[520px]"/></div>}
        {message && <p className="mt-5 rounded-xl bg-cyan-300/10 p-4 text-sm leading-6 text-cyan-100">{message}</p>}
      </div>
      <div className="mt-6 flex items-center gap-3 text-sm text-slate-400"><ShieldCheck size={18} className="text-emerald-300"/> Video dùng runtime WebCodecs/Mediabunny chính thức của @pilio/gemini-watermark-remover 1.0.34.</div>
    </section>
  </main>;
}
