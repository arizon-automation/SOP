import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arizon SOP System - AI驱动的SOP管理系统",
  description: "全球化AI驱动的SOP管理与优化系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

