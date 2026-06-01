import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "穿透式管理驾驶舱 — 工程项目价值-资金一体化",
  description: "工程项目穿透式管理可视化驾驶舱：预算/实际/现金流三维穿透，EVM挣值分析，蒙特卡洛仿真推演",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="antialiased bg-grid min-h-screen">
        {children}
      </body>
    </html>
  );
}
