import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Hugo Cyberx — Technology Without Limits",description:"Phần mềm miễn phí, nhận lập trình và sản xuất video AI theo yêu cầu.",icons:{icon:"/hugo-cyberx-main-logo.webp",shortcut:"/hugo-cyberx-main-logo.webp"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}
