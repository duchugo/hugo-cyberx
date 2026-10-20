import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { const base = "https://hugocyberx.pages.dev"; return ["/", "/phan-mem-tra-phi", "/dich-vu", "/gioi-thieu", "/ho-tro", "/chinh-sach-bao-mat", "/dieu-khoan-su-dung", "/gemini-watermark"].map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly", priority: path === "/" ? 1 : 0.7 })); }
