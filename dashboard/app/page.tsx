"use client";
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the dashboard with SSR disabled to prevent hydration errors from random simulation data
const ProjectDashboard = dynamic(() => import('../components/ProjectDashboard'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="text-sm font-bold animate-pulse">正在加载穿透式决策系统...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Visual Header */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 bg-clip-text select-none">
            穿透式工程项目管理驾驶舱
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl font-normal leading-relaxed">
            基于挣值分析 (EVM) 与价值-资金三维双轨模型，实现“预算-实际成本-现金流”三行对齐的高级穿透式项目健康度监控系统。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">系统版本</span>
            <span className="text-sm font-black text-slate-700 font-mono mt-1">v2.6.0-PRO</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
        </div>
      </header>

      {/* Main Dashboard Component */}
      <ProjectDashboard />

      {/* Footer / Metainfo */}
      <footer className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 select-none">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-mono">Next.js 16</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-mono">React 19</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-mono">Tailwind v4</span>
        </div>
        <div className="font-normal select-none">
          © 2026 穿透式项目管理决策系统. 台州通服交付穿透式管理训战营专供.
        </div>
      </footer>
    </main>
  );
}
