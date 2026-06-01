"use client";
import React, { useState, useCallback } from 'react';
import { TOTAL_REVENUE_BUDGET, Transaction, generateMonthPoints, STATIC_MILESTONES } from './project-data';

interface Props {
    currentDate: string;
    transactions: Transaction[];
}

interface SeriesPoint {
    date: string;
    label: string;
    pv: number;
    ev: number;
    ac: number;
    cashIn: number;
    cashOut: number;
    netCash: number;
}

export default function ProjectTrendCharts({ currentDate, transactions }: Props) {
    const [hoveredPoint, setHoveredPoint] = useState<{ idx: number; chart: 'evm' | 'cash' } | null>(null);
    
    const monthPoints = generateMonthPoints();

    const historySeries: SeriesPoint[] = monthPoints.map((point, idx) => {
        const logs = transactions.filter(t => new Date(t.date) <= new Date(point.date));
        let ev = 0, ac = 0, cashIn = 0, cashOut = 0;
        logs.forEach(t => {
            if (t.type === 'rev_act') ev += t.amount;
            if (t.type === 'cost_act') ac += t.amount;
            if (t.type === 'rev_cash') cashIn += t.amount;
            if (t.type === 'cost_cash') cashOut += t.amount;
        });
        
        const totalMonths = monthPoints.length - 1;
        const progress = idx / totalMonths;
        const ease = (t: number) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const pv = TOTAL_REVENUE_BUDGET * ease(progress);

        return { date: point.date, label: point.label, pv, ev, ac, cashIn, cashOut, netCash: cashIn - cashOut };
    });

    const CHART_PADDING = { top: 30, right: 40, bottom: 40, left: 55 };
    const CHART_WIDTH = 1000;
    const CHART_HEIGHT = 250;
    const MAX_Y_VAL = Math.max(1200, ...historySeries.map(p => Math.max(p.pv, p.ev, p.ac, p.cashIn, p.cashOut))) * 1.1;

    const getX = useCallback((dateStr: string) => {
        const start = new Date(monthPoints[0].date).getTime();
        const end = new Date(monthPoints[monthPoints.length-1].date).getTime();
        const current = new Date(dateStr).getTime();
        const percent = (current - start) / (end - start);
        return CHART_PADDING.left + percent * (CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right);
    }, [monthPoints]);

    const getY = useCallback((val: number, isNetCash = false) => {
        if (isNetCash) {
            const midY = CHART_PADDING.top + (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) / 2;
            const scale = (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) / 1200; 
            return midY - val * scale;
        }
        const height = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
        return (CHART_HEIGHT - CHART_PADDING.bottom) - (val / MAX_Y_VAL) * height;
    }, [MAX_Y_VAL]);

    const generateSmoothPath = useCallback((key: keyof SeriesPoint) => {
        const points = historySeries.map(pt => ({
            x: getX(pt.date),
            y: getY(pt[key] as number, key === 'netCash')
        }));

        if (points.length < 2) return '';
        
        let d = `M${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
            const cpx2 = curr.x - (curr.x - prev.x) * 0.4;
            d += ` C${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`;
        }
        return d;
    }, [historySeries, getX, getY]);

    const generateAreaPath = useCallback((key: keyof SeriesPoint) => {
        const linePath = generateSmoothPath(key);
        if (!linePath) return '';
        const points = historySeries.map(pt => ({ x: getX(pt.date) }));
        const lastX = points[points.length - 1].x;
        const firstX = points[0].x;
        const bottomY = CHART_HEIGHT - CHART_PADDING.bottom;
        return `${linePath} L${lastX},${bottomY} L${firstX},${bottomY} Z`;
    }, [generateSmoothPath, historySeries, getX]);

    const cursorX = getX(currentDate);

    // Find nearest point for tooltip
    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>, chart: 'evm' | 'cash') => {
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * CHART_WIDTH;
        
        let nearest = 0;
        let nearestDist = Infinity;
        historySeries.forEach((pt, i) => {
            const ptX = getX(pt.date);
            const dist = Math.abs(ptX - mouseX);
            if (dist < nearestDist) { nearest = i; nearestDist = dist; }
        });
        
        if (nearestDist < 30) {
            setHoveredPoint({ idx: nearest, chart });
        } else {
            setHoveredPoint(null);
        }
    }, [historySeries, getX]);

    const yGridValues = [0, 200, 400, 600, 800, 1000, 1200];
    const cashYValues = [600, 300, 0, -300];

    const renderTooltip = (chart: 'evm' | 'cash') => {
        if (!hoveredPoint || hoveredPoint.chart !== chart) return null;
        const pt = historySeries[hoveredPoint.idx];
        const hoverX = getX(pt.date);
        const tooltipX = hoverX > CHART_WIDTH / 2 ? hoverX - 150 : hoverX + 15;

        return (
            <g>
                <line x1={hoverX} y1={CHART_PADDING.top} x2={hoverX} y2={CHART_HEIGHT - CHART_PADDING.bottom} stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="3 3" />
                <foreignObject x={tooltipX} y={CHART_PADDING.top + 5} width="140" height="100">
                    <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg border border-white/20 p-2 text-[10px] shadow-xl">
                        <div className="font-bold text-white mb-1">{pt.label} ({pt.date.slice(2)})</div>
                        {chart === 'evm' ? (
                            <>
                                <div className="flex justify-between"><span className="text-slate-400">计划 PV</span><span className="text-slate-300 font-mono">{pt.pv.toFixed(0)}</span></div>
                                <div className="flex justify-between"><span className="text-blue-400">挣值 EV</span><span className="text-blue-300 font-mono">{pt.ev.toFixed(0)}</span></div>
                                <div className="flex justify-between"><span className="text-rose-400">成本 AC</span><span className="text-rose-300 font-mono">{pt.ac.toFixed(0)}</span></div>
                                <div className="border-t border-white/10 mt-1 pt-1 flex justify-between"><span className="text-amber-400">CPI</span><span className="font-mono text-amber-300">{pt.ac > 0 ? (pt.ev/pt.ac).toFixed(2) : '--'}</span></div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between"><span className="text-blue-400">收款</span><span className="text-blue-300 font-mono">{pt.cashIn.toFixed(0)}</span></div>
                                <div className="flex justify-between"><span className="text-amber-400">付款</span><span className="text-amber-300 font-mono">{pt.cashOut.toFixed(0)}</span></div>
                                <div className="flex justify-between"><span className="text-emerald-400">净现金</span><span className={`font-mono ${pt.netCash >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{pt.netCash.toFixed(0)}</span></div>
                            </>
                        )}
                    </div>
                </foreignObject>
                {/* Data point dots */}
                {chart === 'evm' ? (
                    <>
                        <circle cx={hoverX} cy={getY(pt.pv)} r="3.5" fill="#94a3b8" stroke="#0f172a" strokeWidth="1.5" />
                        <circle cx={hoverX} cy={getY(pt.ev)} r="3.5" fill="#3b82f6" stroke="#0f172a" strokeWidth="1.5" />
                        <circle cx={hoverX} cy={getY(pt.ac)} r="3.5" fill="#f43f5e" stroke="#0f172a" strokeWidth="1.5" />
                    </>
                ) : (
                    <>
                        <circle cx={hoverX} cy={getY(pt.cashIn, true)} r="3.5" fill="#3b82f6" stroke="#0f172a" strokeWidth="1.5" />
                        <circle cx={hoverX} cy={getY(pt.cashOut, true)} r="3.5" fill="#f59e0b" stroke="#0f172a" strokeWidth="1.5" />
                        <circle cx={hoverX} cy={getY(pt.netCash, true)} r="3.5" fill="#10b981" stroke="#0f172a" strokeWidth="1.5" />
                    </>
                )}
            </g>
        );
    };

    return (
        <div className="flex flex-col gap-4 select-none">
            {/* EVM Chart */}
            <div className="glass-card p-5 relative">
               <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                       <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                       <h3 className="text-sm font-bold text-white">EVM 价值趋势</h3>
                   </div>
                   <div className="flex gap-5 text-xs">
                       <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-slate-400 rounded" style={{backgroundImage:'repeating-linear-gradient(90deg,#94a3b8 0,#94a3b8 4px,transparent 4px,transparent 8px)'}}></span><span className="text-slate-500">计划 PV</span></span>
                       <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-blue-500 rounded"></span><span className="text-slate-500">挣值 EV</span></span>
                       <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-rose-500 rounded"></span><span className="text-slate-500">成本 AC</span></span>
                   </div>
               </div>
               <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-64 overflow-visible"
                    onMouseMove={(e) => handleMouseMove(e, 'evm')}
                    onMouseLeave={() => setHoveredPoint(null)}>
                   <defs>
                       <linearGradient id="evGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                           <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                       </linearGradient>
                   </defs>
                   
                   {/* Grid */}
                   {yGridValues.map(val => (
                       <React.Fragment key={val}>
                           <line x1={CHART_PADDING.left} y1={getY(val)} x2={CHART_WIDTH - CHART_PADDING.right} y2={getY(val)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                           <text x={CHART_PADDING.left - 8} y={getY(val) + 4} textAnchor="end" fontSize="10" fill="#475569" fontFamily="JetBrains Mono, monospace">{val}</text>
                       </React.Fragment>
                   ))}
                   {/* X-axis labels */}
                   {historySeries.filter((_, i) => i % 6 === 0).map(pt => (
                       <text key={pt.date} x={getX(pt.date)} y={CHART_HEIGHT - CHART_PADDING.bottom + 18} textAnchor="middle" fontSize="10" fill="#475569">{pt.label}</text>
                   ))}
                   {/* Axes */}
                   <line x1={CHART_PADDING.left} y1={CHART_PADDING.top} x2={CHART_PADDING.left} y2={CHART_HEIGHT - CHART_PADDING.bottom} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                   <line x1={CHART_PADDING.left} y1={CHART_HEIGHT - CHART_PADDING.bottom} x2={CHART_WIDTH - CHART_PADDING.right} y2={CHART_HEIGHT - CHART_PADDING.bottom} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                   {/* Milestone markers */}
                   {STATIC_MILESTONES.map(ms => {
                       const msX = getX(ms.date);
                       if (msX < CHART_PADDING.left || msX > CHART_WIDTH - CHART_PADDING.right) return null;
                       return (
                           <g key={ms.date}>
                               <line x1={msX} y1={CHART_PADDING.top} x2={msX} y2={CHART_HEIGHT - CHART_PADDING.bottom} stroke="rgba(251,191,36,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                               <text x={msX} y={CHART_HEIGHT - CHART_PADDING.bottom + 30} textAnchor="middle" fontSize="8" fill="#92400e">{ms.label}</text>
                           </g>
                       );
                   })}

                   {/* Area fill for EV */}
                   <path d={generateAreaPath('ev')} fill="url(#evGradient)" />

                   {/* Lines */}
                   <path d={generateSmoothPath('pv')} fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.6" />
                   <path d={generateSmoothPath('ev')} fill="none" stroke="#3b82f6" strokeWidth="2" />
                   <path d={generateSmoothPath('ac')} fill="none" stroke="#f43f5e" strokeWidth="2" />

                   {/* Current time cursor */}
                   <g transform={`translate(${cursorX}, 0)`}>
                       <line y1={CHART_PADDING.top} y2={CHART_HEIGHT - CHART_PADDING.bottom} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
                       <circle cy={CHART_PADDING.top - 5} r="3" fill="#3b82f6" />
                   </g>

                   {/* Tooltip */}
                   {renderTooltip('evm')}
               </svg>
            </div>

            {/* Cash Flow Chart */}
            <div className="glass-card p-5 relative">
               <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                       <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                       <h3 className="text-sm font-bold text-white">现金流趋势</h3>
                   </div>
                   <div className="flex gap-5 text-xs">
                       <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-blue-500 rounded"></span><span className="text-slate-500">收款</span></span>
                       <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-amber-500 rounded"></span><span className="text-slate-500">付款</span></span>
                       <span className="flex items-center gap-1.5"><span className="w-4 h-[2px] bg-emerald-500 rounded"></span><span className="text-slate-500">净现金</span></span>
                   </div>
               </div>
               <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-64 overflow-visible"
                    onMouseMove={(e) => handleMouseMove(e, 'cash')}
                    onMouseLeave={() => setHoveredPoint(null)}>
                   <defs>
                       <linearGradient id="netCashGradient" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="0%" stopColor="#10b981" stopOpacity="0.15"/>
                           <stop offset="50%" stopColor="#10b981" stopOpacity="0"/>
                           <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1"/>
                       </linearGradient>
                   </defs>

                   {/* Grid */}
                   {cashYValues.map(val => (
                       <React.Fragment key={val}>
                           <line x1={CHART_PADDING.left} y1={getY(val, true)} x2={CHART_WIDTH - CHART_PADDING.right} y2={getY(val, true)} 
                                 stroke={val === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)"} 
                                 strokeWidth={val === 0 ? "1" : "1"} />
                           <text x={CHART_PADDING.left - 8} y={getY(val, true) + 4} textAnchor="end" fontSize="10" fill="#475569" fontFamily="JetBrains Mono, monospace">{val}</text>
                       </React.Fragment>
                   ))}
                   {historySeries.filter((_, i) => i % 6 === 0).map(pt => (
                       <text key={pt.date} x={getX(pt.date)} y={CHART_HEIGHT - CHART_PADDING.bottom + 18} textAnchor="middle" fontSize="10" fill="#475569">{pt.label}</text>
                   ))}
                   <line x1={CHART_PADDING.left} y1={CHART_PADDING.top} x2={CHART_PADDING.left} y2={CHART_HEIGHT - CHART_PADDING.bottom} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                   {/* Zero line highlight */}
                   <line x1={CHART_PADDING.left} y1={getY(0, true)} x2={CHART_WIDTH - CHART_PADDING.right} y2={getY(0, true)} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                   {/* Lines */}
                   <path d={generateSmoothPath('cashIn')} fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.7" />
                   <path d={generateSmoothPath('cashOut')} fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.7" />
                   <path d={generateSmoothPath('netCash')} fill="none" stroke="#10b981" strokeWidth="2.5" />

                   {/* Current time cursor */}
                   <g transform={`translate(${cursorX}, 0)`}>
                       <line y1={CHART_PADDING.top} y2={CHART_HEIGHT - CHART_PADDING.bottom} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
                       <circle cy={CHART_PADDING.top - 5} r="3" fill="#10b981" />
                   </g>

                   {/* Tooltip */}
                   {renderTooltip('cash')}
               </svg>
            </div>
        </div>
    );
}
