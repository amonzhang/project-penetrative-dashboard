"use client";
import React from 'react';
import { 
    BUDGET_STRUCTURE, TOTAL_REVENUE_BUDGET, TOTAL_COST_BUDGET,
    COST_KEYS, NAMES, COLORS, hexToRgba, SnapshotState
} from './project-data';

interface Props {
    currentData: SnapshotState;
    totalRevenue: number;
    totalCollection: number;
    totalCostAct: number;
    totalCostCash: number;
    actualProfit: number;
    netCashFlow: number;
    contractProgress: number;
    collectionRate: number;
    isLoss: boolean;
    isFundingGap: boolean;
    isCostOverrun: boolean;
    isCollectionLagging: boolean;
}

export default function ProjectDataTable({
    currentData, totalRevenue, totalCollection, totalCostAct, totalCostCash,
    actualProfit, netCashFlow, contractProgress, collectionRate,
    isLoss, isFundingGap, isCostOverrun
}: Props) {
    return (
        <div className="mb-8 glass-card overflow-hidden border border-slate-200 bg-white">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                    项目数据总表
                </h3>
                <span className="text-xs text-slate-400 font-mono">单位：万元</span>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="text-[11px] text-slate-500 uppercase bg-slate-50/30">
                    <tr className="border-b border-slate-100">
                        <th className="px-6 py-3 font-bold">指标</th>
                        <th className="px-6 py-3 font-bold text-right">预算</th>
                        <th className="px-6 py-3 font-bold text-right">实际确权</th>
                        <th className="px-6 py-3 font-bold text-center">进度</th>
                        <th className="px-6 py-3 font-bold text-right">资金流收付</th>
                        <th className="px-6 py-3 font-bold text-center">收付率</th>
                        <th className="px-6 py-3 font-bold text-right">收支净差</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Revenue row */}
                    <tr className={`border-b border-slate-100 ${isLoss ? 'bg-rose-50/30' : 'bg-blue-50/30'} transition-colors`}>
                        <td className={`px-6 py-4 font-bold flex items-center gap-2 ${isLoss ? 'text-rose-700' : 'text-blue-700'}`}>
                            <span className={`w-2 h-2 rounded-full ${isLoss ? 'bg-rose-600' : 'bg-blue-600'}`}></span>
                            总收入 (Track A)
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-500">{TOTAL_REVENUE_BUDGET}</td>
                        <td className={`px-6 py-4 text-right font-mono font-black ${isLoss ? 'text-rose-700' : 'text-blue-700'}`}>{totalRevenue.toFixed(0)}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-600">{contractProgress.toFixed(0)}%</td>
                        <td className="px-6 py-4 text-right font-mono font-black text-emerald-700">{totalCollection.toFixed(0)}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-600">{collectionRate.toFixed(0)}%</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-500">{(totalRevenue - totalCollection).toFixed(0)}</td>
                    </tr>
                    <tr><td colSpan={7} className="bg-slate-100/50 h-1"></td></tr>
                    
                    {/* Cost detail rows */}
                    {COST_KEYS.map(key => {
                        const budget = BUDGET_STRUCTURE[key];
                        const actual = currentData.act[key];
                        const cash = currentData.cash[key];
                        const variance = actual - budget;
                        const isBad = variance > 0;
                        const rowBg = isBad ? 'rgba(249, 115, 22, 0.04)' : hexToRgba(COLORS.cool[key], 0.05);

                        return (
                            <tr key={key} style={{ backgroundColor: rowBg }} className="border-b border-slate-100 transition-colors hover:bg-slate-50">
                                <td className="px-6 py-3 font-bold text-slate-800 flex items-center gap-2 pl-8">
                                    <span className="w-1.5 h-1.5 rounded-full opacity-90" style={{ backgroundColor: isBad ? COLORS.warm.overrun : COLORS.cool[key] }}></span>
                                    {NAMES[key]}
                                </td>
                                <td className="px-6 py-3 text-right font-mono text-slate-400 text-xs">{budget}</td>
                                <td className={`px-6 py-3 text-right font-mono ${isBad ? 'font-black text-orange-600' : 'text-slate-800 font-bold'}`}>{actual.toFixed(0)}</td>
                                <td className="px-6 py-3 text-center text-xs text-slate-500 font-bold">{(actual / budget * 100).toFixed(0)}%</td>
                                <td className="px-6 py-3 text-right font-mono text-slate-600 font-semibold">{cash.toFixed(0)}</td>
                                <td className="px-6 py-3 text-center text-xs text-slate-500 font-bold">{(actual > 0 ? cash / actual * 100 : 0).toFixed(0)}%</td>
                                <td className={`px-6 py-3 text-right font-mono ${isBad ? 'text-orange-600 font-black' : 'text-slate-400 text-xs'}`}>{variance > 0 ? '+' : ''}{variance.toFixed(0)}</td>
                            </tr>
                        )
                    })}

                    {/* Cost total */}
                    <tr className={`border-y border-slate-200 ${isCostOverrun ? 'bg-orange-50' : 'bg-slate-50/50'} font-bold`}>
                        <td className={`px-6 py-3 flex items-center gap-2 pl-8 ${isCostOverrun ? 'text-orange-600' : 'text-slate-700'}`}><span>∑</span> 成本合计</td>
                        <td className="px-6 py-3 text-right font-mono text-slate-400">{TOTAL_COST_BUDGET}</td>
                        <td className={`px-6 py-3 text-right font-mono ${isCostOverrun ? 'text-orange-600 font-black' : 'text-slate-800 font-black'}`}>{totalCostAct.toFixed(0)}</td>
                        <td className="px-6 py-3 text-center text-slate-600 font-bold">{(totalCostAct / TOTAL_COST_BUDGET * 100).toFixed(0)}%</td>
                        <td className="px-6 py-3 text-right font-mono text-slate-700">{totalCostCash.toFixed(0)}</td>
                        <td className="px-6 py-3 text-center text-slate-600 font-bold">{(totalCostAct > 0 ? totalCostCash / totalCostAct * 100 : 0).toFixed(0)}%</td>
                        <td className={`px-6 py-3 text-right font-mono ${isCostOverrun ? 'text-orange-600 font-black' : 'text-slate-500'}`}>{(totalCostAct - TOTAL_COST_BUDGET).toFixed(0)}</td>
                    </tr>

                    {/* Profit row */}
                    <tr className={`border-b border-slate-100 ${isLoss ? 'bg-rose-50/50' : (isFundingGap ? 'bg-slate-50' : 'bg-emerald-50/40')}`}>
                        <td className={`px-6 py-3 font-bold flex items-center gap-2 pl-8 ${isLoss ? 'text-rose-700' : 'text-emerald-700'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            {NAMES.pro}
                            {isLoss && <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded border border-rose-200 ml-2 font-bold">亏损</span>}
                        </td>
                        <td className="px-6 py-3 text-right font-mono text-slate-400 text-xs">{BUDGET_STRUCTURE.pro}</td>
                        <td className={`px-6 py-3 text-right font-mono font-black ${isLoss ? 'text-rose-700' : 'text-emerald-700'}`}>{actualProfit.toFixed(0)}</td>
                        <td className="px-6 py-3 text-center text-xs text-slate-400">--</td>
                        <td className={`px-6 py-3 text-right font-mono font-black ${isFundingGap ? 'text-slate-600' : 'text-emerald-700'}`}>{netCashFlow.toFixed(0)}</td>
                        <td className="px-6 py-3 text-center text-xs text-slate-400">--</td>
                        <td className="px-6 py-3 text-right font-mono font-bold text-slate-500">{(actualProfit - BUDGET_STRUCTURE.pro).toFixed(0)}</td>
                    </tr>
                </tbody>
            </table>
            </div>
        </div>
    );
}
