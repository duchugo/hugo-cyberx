# HƯỚNG DẪN UI/UX HIỆU ỨNG HUGO CYBERX

> Áp dụng cho **mọi trang công khai mới** (như `/`, `/phan-mem-tra-phi`, `/dich-vu`, `/gemini-watermark`).
> Toàn bộ hiệu ứng là CSS thuần trong `app/globals.css` (không cần cài thêm thư viện).
> Trang `/admin` cố ý giữ đơn giản để tập trung thao tác — không áp các hiệu ứng trang trí.

## 1. Khung trang chuẩn cho tab mới

```jsx
// app/<ten-tab>/page.tsx
"use client";
return <main className="min-h-screen text-white">   {/* KHÔNG đặt bg màu đặc — để lớp aurora lộ phía sau */}
  <div className="cyber-aurora" aria-hidden />       {/* BẮT BUỘC: quầng sáng nền toàn trang */}
  <header className="relative border-b border-cyan-300/10">
    ...
    <div className="cyber-beam absolute inset-x-0 bottom-[-1px]" aria-hidden />  {/* vạch sáng chạy dưới header */}
  </header>
  ...nội dung...
</main>;
```

## 2. Thư viện class hiệu ứng (định nghĩa trong `app/globals.css`)

| Class | Tác dụng | Dùng ở đâu |
|---|---|---|
| `cyber-aurora` | Lớp quầng sáng xanh ngọc/tím trôi chậm phía sau TOÀN bộ trang (`position:fixed; z-index:-1`). Phần tử con `::before/::after` là 2 quầng | 1 div duy nhất ngay sau `<main>` |
| `cyber-beam` | Vạch sáng 2px phát sáng chạy qua lại. **Đặt NGAY DƯỚI dòng chữ cần nhấn mạnh như đường gạch chân (thành phần trong luồng, ví dụ `<div className="cyber-beam mt-6 w-56" />` sau `<h1>`).** Duy nhất ở header mới dùng `absolute inset-x-0 bottom-[-1px]`. Không thả lơ lửng ngoài nội dung | Gạch chân tiêu đề hero, header |
| `glass-sheen` | Bóng đèn phản chiếu vát góc trên panel kính (luôn hiện). Cần phần tử có `border-radius` | Card phần mềm, card dịch vụ, card Zalo, khung công cụ |
| `cyber-shine-soft` | **Ánh sáng lướt chéo qua card khi rê chuột** (bản mềm cho card lớn). Card cần `overflow:hidden` (class tự có) | Mọi card nội dung |
| `cyber-shine` | Vệt sáng chạy qua nút khi hover (mạnh hơn) | Nút gradient/CTA |
| `cyber-breathe` | Nút "thở" sáng nhẹ liên tục — chỉ dùng 1–2 nút quan trọng nhất mỗi màn hình | "Xem dịch vụ" (thanh nổi), "Mở nhóm Zalo" |
| `cyber-glow-badge` | Badge pill phát sáng "thở" | Badge nhỏ trên tiêu đề hero |
| `cyber-text` | Chữ gradient (đã có sẵn) + animation chuyển màu | Câu thứ hai của tiêu đề hero |
| `cyber-float` | Trôi lên xuống nhẹ | Logo hero |
| `cyber-stars` | Container sao nhấp nháy (con là `<span>` định vị `%`, có `animationDelay` lệch nhau) | Hero mỗi trang |
| `cyber-grid` | Nền lưới kỹ thuật + quằng tĩnh | Section hero |
| `[data-reveal]` | Phần tử trượt lên khi cuộn tới. **Yêu cầu**: trang phải chạy observer (mục 4) | Mỗi khối section lớn, không gắn vào phần tử lọc/re-render liên tục |

## 3. Công thức card chuẩn (khung gương)

```jsx
<article className="cyber-shine-soft glass-sheen rounded-3xl border border-white/10 bg-white/[.045] p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-300/40 hover:shadow-[0_24px_70px_-20px_rgba(34,211,238,.45)]">
  ...nội dung, mô tả dùng line-clamp-3 để card ngắn gọn...
  <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-4">
    <span className="text-[11px] font-black uppercase tracking-[.18em] text-slate-500">DANH MỤC</span>
    <button className="cyber-shine rounded-xl bg-cyan-300 px-3.5 py-2 text-[13px] font-black text-[#071126]">Hành động</button>
  </div>
</article>
```

- Card phải là `flex flex-col` + chân card `mt-auto` để các card trong lưới cao bằng nhau.
- Mô tả dài: `line-clamp-3 text-[13px] leading-5 text-slate-400` — nội dung đầy đủ để trong modal chi tiết.
- Modal chi tiết chuẩn: dùng component `Modal` trong `app/catalog.tsx`; hiển thị nền tảng, phiên bản và **"Cập nhật phiên bản: <giờ dd/mm/yyyy>"** từ `updatedAt` (API `/api/apps` trả sẵn — trường này tự refresh mỗi khi thay phiên bản qua admin).

## 4. Bắt buộc khi trang có dùng `[data-reveal]`

Thêm observer vào component chính của trang (chạy 1 lần sau mount):

```tsx
useEffect(() => {
  const targets = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("revealed"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
    },
    { threshold: 0.12 },
  );
  targets.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}, []);
```

## 5. Widget dùng chung (hiện tại nằm trong `app/catalog.tsx`)

- **Thanh thông báo nổi** (đáy màn hình, có nút đóng) và **nút "Hỗ trợ Zalo" nổi** (góc phải, chấm nhấp nháy): khi tách thành component riêng, đặt ở `app/floating-widgets.tsx` và include trong mọi trang công khai mới.
- **`Counter`**: số liệu đếm tăng trong hero.
- Quy ước màu: nền `#050A18`, panel `bg-white/[.045]`, viền `border-white/10`, nhấn cyan `#22d3ee`/`bg-cyan-300`, phụ fuchsia, chữ mờ `text-slate-400`.

## 6. Nguyên tắc

- Mọi animation chỉ dùng `transform`/`opacity`/`background-position` để giữ 60fps.
- Tôn trọng `prefers-reduced-motion` — đã có media query tắt toàn bộ trong `globals.css`; hiệu ứng mới PHẢI thêm vào media query đó.
- Không thêm thư viện animation ngoài; chỉ CSS + IntersectionObserver.
