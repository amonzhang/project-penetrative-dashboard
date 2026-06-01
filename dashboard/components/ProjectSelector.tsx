"use client";
import React from 'react';
import { PROJECT_SCENARIOS } from './project-data';

interface Props {
  selectedScenarioId: string;
  onScenarioChange: (id: string) => void;
}

export default function ProjectSelector({ selectedScenarioId, onScenarioChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">选择项目场景</label>
      <div className="flex gap-2 flex-wrap">
        {PROJECT_SCENARIOS.map(s => {
          const isActive = s.id === selectedScenarioId;
          const activeStyles: Record<string, string> = {
            normal: 'bg-emerald-50 border-emerald-300 text-emerald-700 font-black shadow-sm shadow-emerald-100/30',
            overrun: 'bg-amber-50 border-amber-300 text-amber-700 font-black shadow-sm shadow-amber-100/30',
            loss: 'bg-rose-50 border-rose-300 text-rose-700 font-black shadow-sm shadow-rose-100/30',
            cashgap: 'bg-indigo-50 border-indigo-300 text-indigo-700 font-black shadow-sm shadow-indigo-100/30',
          };

          return (
            <button
              key={s.id}
              onClick={() => onScenarioChange(s.id)}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs transition-all duration-300 hover:scale-[1.02] cursor-pointer
                ${isActive ? activeStyles[s.id] : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50/80 shadow-sm shadow-slate-100/30'}`}
            >
              <span className="text-base select-none">{s.icon}</span>
              <div className="text-left">
                <div className="font-extrabold leading-tight">{s.name}</div>
                <div className="text-[9px] text-slate-400 font-medium mt-0.5">{s.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
