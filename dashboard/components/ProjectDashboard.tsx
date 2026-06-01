"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
    INITIAL_DATA, STATIC_MILESTONES,
    TOTAL_REVENUE_BUDGET, TOTAL_COST_BUDGET, COST_KEYS,
    generateRandomData, generateMonthPoints, 
    Transaction, TimePoint, SnapshotState, SegmentKey
} from './project-data';
import PenetrativeBarChart from './PenetrativeBarChart';
import ProjectDataTable from './ProjectDataTable';
import ProjectTrendCharts from './ProjectTrendCharts';
import KpiCards from './KpiCards';
import RiskAlertPanel from './RiskAlertPanel';
import ProjectSelector from './ProjectSelector';

export default function ProjectDashboard() {
  const [controlMode, setControlMode] = useState<'months' | 'milestones' | 'events'>('months');
  const [currentDate, setCurrentDate] = useState<string>('2025-06-30');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('normal');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_DATA);

  const handleScenarioChange = (id: string) => {
    setIsPlaying(false);
    setSelectedScenarioId(id);
    const newData = generateRandomData(id);
    setTransactions(newData);
    setCurrentDate('2025-06-30');
  };

  const handleRegenerate = () => {
    setIsPlaying(false);
    const newData = generateRandomData(selectedScenarioId);
    setTransactions(newData);
    setCurrentDate('2025-06-30');
  };

  const activeTimePoints = useMemo((): TimePoint[] => {
    if (controlMode === 'months') return generateMonthPoints();
    if (controlMode === 'milestones') return STATIC_MILESTONES;
    if (controlMode === 'events') {
      return transactions
        .filter(t => t.amount > 40)
        .slice(-15)
        .map(t => ({ label: t.date.slice(5), date: t.date, desc: t.desc }));
    }
    return [];
  }, [controlMode, transactions]);

  const currentData = useMemo((): SnapshotState => {
    const logs = transactions.filter(t => new Date(t.date) <= new Date(currentDate));
    const state: SnapshotState = {
      act: { mat: 0, sub: 0, oth: 0, pro: 0 },
      cash: { mat: 0, sub: 0, oth: 0, pro: 0 },
      ev: 0, in: 0  
    };
    logs.forEach(t => {
      if (t.type === 'rev_act') state.ev += t.amount;
      if (t.type === 'rev_cash') state.in += t.amount;
      if (t.type === 'cost_act' && t.category) state.act[t.category] += t.amount;
      if (t.type === 'cost_cash' && t.category) state.cash[t.category] += t.amount;
    });
    return state;
  }, [currentDate, transactions]);

  const totalCostAct = COST_KEYS.reduce((sum, k) => sum + currentData.act[k], 0);
  const totalCostCash = COST_KEYS.reduce((sum, k) => sum + currentData.cash[k], 0);
  const totalRevenue = currentData.ev;
  const totalCollection = currentData.in;
  const contractProgress = (totalRevenue / TOTAL_REVENUE_BUDGET) * 100;
  const collectionRate = totalRevenue > 0 ? (totalCollection / totalRevenue) * 100 : 0;
  const actualProfit = totalRevenue - totalCostAct;
  const netCashFlow = totalCollection - totalCostCash;
  const isLoss = actualProfit < 0; 
  const isCostOverrun = totalCostAct > TOTAL_COST_BUDGET;
  const isFundingGap = netCashFlow < 0;
  const isCollectionLagging = collectionRate < 80;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      const points = activeTimePoints;
      let idx = points.findIndex(p => p.date >= currentDate);
      if (idx === -1) idx = 0;
      
      timer = setInterval(() => {
        idx++;
        if (idx >= points.length) setIsPlaying(false);
        else setCurrentDate(points[idx].date);
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentDate, activeTimePoints]);

  const getCurrentDesc = () => {
    const point = activeTimePoints.find(p => p.date === currentDate);
    if (point) return point.desc;
    return currentDate;
  };

  const handleExportCSV = () => {
    const logs = transactions.filter(t => new Date(t.date) <= new Date(currentDate));
    const header = '日期,类型,分类,金额,描述\n';
    const rows = logs.map(t => `${t.date},${t.type},${t.category || ''},${t.amount},${t.desc}`).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `穿透式管理数据_${currentDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full animate-slide-up text-slate-800">
      
      {/* Header & Controls */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6 w-full lg:w-auto">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">项目穿透视图</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 select-none">动态仿真</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>截止日期:</span>
                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded select-all">{currentDate}</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-500 truncate max-w-[200px]">{getCurrentDesc()}</span>
              </div>
            </div>
            
            <div className="hidden md:block h-10 w-px bg-slate-200" />
            
            <ProjectSelector 
              selectedScenarioId={selectedScenarioId} 
              onScenarioChange={handleScenarioChange} 
            />
          </div>
          
          <div className="flex gap-2 flex-wrap items-center">
            <button onClick={handleRegenerate} 
              className="px-3 py-2 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer">
              🎲 重新仿真
            </button>
            <button onClick={handleExportCSV}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-1.5 cursor-pointer">
              📥 导出CSV
            </button>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button onClick={() => {setControlMode('months'); setIsPlaying(false)}} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${controlMode==='months' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50 font-black' : 'text-slate-500 hover:text-slate-700'}`}>
                月度
              </button>
              <button onClick={() => {setControlMode('milestones'); setIsPlaying(false)}} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${controlMode==='milestones' ? 'bg-white text-amber-600 shadow-sm border border-slate-200/50 font-black' : 'text-slate-500 hover:text-slate-700'}`}>
                里程碑
              </button>
              <button onClick={() => {setControlMode('events'); setIsPlaying(false)}} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${controlMode==='events' ? 'bg-white text-purple-600 shadow-sm border border-slate-200/50 font-black' : 'text-slate-500 hover:text-slate-700'}`}>
                业务事件
              </button>
            </div>
          </div>
        </div>
        
        {/* Time Slider */}
        <div className="sticky top-4 z-40 flex items-center gap-3 glass-card p-3 overflow-x-auto shadow-xl backdrop-blur-md bg-white/90 border border-slate-200 transition-all">
          <button onClick={() => setIsPlaying(!isPlaying)} 
            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              isPlaying 
                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
                : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
            }`}>
            {isPlaying ? '⏸ 暂停' : '▶ 演练'}
          </button>
          <div className="flex gap-1.5">
            {activeTimePoints.map((p, i) => (
              <button key={i} onClick={() => setCurrentDate(p.date)} 
                className={`flex-shrink-0 flex flex-col items-center px-2.5 py-1.5 rounded-lg border transition-all min-w-[70px] cursor-pointer
                  ${currentDate === p.date 
                    ? 'bg-blue-50 border-blue-300 text-blue-600 font-extrabold shadow-sm' 
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'}`}>
                <span className={`text-[11px] font-bold truncate max-w-[80px] ${currentDate === p.date ? 'text-blue-600 font-black' : ''}`}>
                  {controlMode === 'events' ? p.desc : p.label}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">{p.date.slice(2)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards 
        totalRevenue={totalRevenue}
        totalCollection={totalCollection}
        totalCostAct={totalCostAct}
        totalCostCash={totalCostCash}
        actualProfit={actualProfit}
        netCashFlow={netCashFlow}
        contractProgress={contractProgress}
        collectionRate={collectionRate}
        isLoss={isLoss}
        isFundingGap={isFundingGap}
        isCostOverrun={isCostOverrun}
      />

      {/* Risk Alerts */}
      <RiskAlertPanel 
        isLoss={isLoss}
        isFundingGap={isFundingGap}
        isCostOverrun={isCostOverrun}
        isCollectionLagging={isCollectionLagging}
        actualProfit={actualProfit}
        netCashFlow={netCashFlow}
        totalCostAct={totalCostAct}
        totalCostBudget={TOTAL_COST_BUDGET}
        collectionRate={collectionRate}
      />

      {/* Penetrative Bar Chart */}
      <PenetrativeBarChart 
        currentData={currentData} 
        totalRevenue={totalRevenue} 
        totalCollection={totalCollection}
        isLoss={isLoss}
        isFundingGap={isFundingGap}
        transactions={transactions}
        currentDate={currentDate}
      />

      {/* Data Table */}
      <ProjectDataTable 
        currentData={currentData}
        totalRevenue={totalRevenue}
        totalCollection={totalCollection}
        totalCostAct={totalCostAct}
        totalCostCash={totalCostCash}
        actualProfit={actualProfit}
        netCashFlow={netCashFlow}
        contractProgress={contractProgress}
        collectionRate={collectionRate}
        isLoss={isLoss}
        isFundingGap={isFundingGap}
        isCostOverrun={isCostOverrun}
        isCollectionLagging={isCollectionLagging}
      />

      {/* Trend Charts */}
      <ProjectTrendCharts currentDate={currentDate} transactions={transactions} />

    </div>
  );
}
