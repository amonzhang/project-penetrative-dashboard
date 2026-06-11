"use client";
import React, { useState, useMemo } from 'react';
import {
  BUDGET_STRUCTURE, TOTAL_REVENUE_BUDGET,
  SEGMENT_KEYS, COST_KEYS, NAMES, COLORS, ANCHORS,
  SUPPLIERS,
  SegmentKey, SnapshotState, Transaction,
} from './project-data';
import {
  BulletTrack,
  ActualBar,
  CashFlowBar,
  BudgetMarker,
  VarianceTag,
  RowLabel,
  ExpandConnector,
  SectionDivider,
} from './PenetrativeGraphicEngine';

// ── Types ──────────────────────────────────────────

interface Props {
  currentData: SnapshotState;
  totalRevenue: number;
  totalCollection: number;
  isLoss: boolean;
  isFundingGap: boolean;
  transactions: Transaction[];
  currentDate: string;
}

type SortMode = 'budget' | 'firstAct';

// ── Main Chart Component ───────────────────────────

export default function PenetrativeBarChart({
  currentData, totalRevenue, totalCollection,
  isLoss, isFundingGap,
  transactions, currentDate,
}: Props) {

  // ── States ──
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [supplierSort, setSupplierSort] = useState<SortMode>('budget');
  const [hoveredRowKey, setHoveredRowKey] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    title: string;
    budget: number;
    actual: number;
    cash: number;
    rateLabel: string;
    rateVal: string;
  } | null>(null);

  const toggle = (key: string) =>
    setExpanded(prev => {
      const newSet = new Set(prev);
      newSet.has(key) ? newSet.delete(key) : newSet.add(key);
      return newSet;
    });

  // ── Cutoff for active transactions based on current date ──
  const cutoff = useMemo(() => new Date(currentDate).getTime(), [currentDate]);

  const activeTxs = useMemo(
    () => transactions.filter(t => new Date(t.date).getTime() <= cutoff),
    [transactions, cutoff],
  );

  // ── Revenue EVM confirmations ──
  const revActs = useMemo(
    () => activeTxs.filter(t => t.type === 'rev_act'),
    [activeTxs],
  );

  // ── Collections / cash in ──
  const revCashes = useMemo(
    () => activeTxs.filter(t => t.type === 'rev_cash'),
    [activeTxs],
  );

  // Group collections under their linked EVM confirmation
  const revCashGroups = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    revCashes.forEach(c => {
      const k = c.linkedTxId || '__none';
      if (!map[k]) map[k] = [];
      map[k].push(c);
    });
    return map;
  }, [revCashes]);

  // ── Supplier Actual Cost summaries ──
  const supActMap = useMemo(() => {
    const m: Record<string, number> = {};
    activeTxs.filter(t => t.type === 'cost_act' && t.supplierId)
      .forEach(t => { m[t.supplierId!] = (m[t.supplierId!] || 0) + t.amount; });
    return m;
  }, [activeTxs]);

  const supCashMap = useMemo(() => {
    const m: Record<string, number> = {};
    activeTxs.filter(t => t.type === 'cost_cash' && t.supplierId)
      .forEach(t => { m[t.supplierId!] = (m[t.supplierId!] || 0) + t.amount; });
    return m;
  }, [activeTxs]);

  // Supplier cash payment lists
  const supCashTxs = useMemo(() => {
    const m: Record<string, Transaction[]> = {};
    activeTxs.filter(t => t.type === 'cost_cash' && t.supplierId)
      .forEach(t => {
        if (!m[t.supplierId!]) m[t.supplierId!] = [];
        m[t.supplierId!].push(t);
      });
    return m;
  }, [activeTxs]);

  // ── Supplier Sorting Logic ──
  const sortSuppliers = (cat: SegmentKey) => {
    const sups = [...(SUPPLIERS[cat] || [])];
    if (supplierSort === 'firstAct') {
      return sups.sort((a, b) => {
        const af = activeTxs.find(t => t.type === 'cost_act' && t.supplierId === a.id);
        const bf = activeTxs.find(t => t.type === 'cost_act' && t.supplierId === b.id);
        return (af ? new Date(af.date).getTime() : 1e15) - (bf ? new Date(bf.date).getTime() : 1e15);
      });
    }
    return sups.sort((a, b) => b.budgetShare - a.budgetShare);
  };

  const supAnchors = (cat: SegmentKey): Record<string, number> => {
    const sorted = sortSuppliers(cat);
    const base = ANCHORS[cat];
    const catPct = (BUDGET_STRUCTURE[cat] / TOTAL_REVENUE_BUDGET) * 100;
    const res: Record<string, number> = {};
    let cum = 0;
    sorted.forEach(s => {
      res[s.id] = base + cum * catPct;
      cum += s.budgetShare;
    });
    return res;
  };

  // ── Percentage calculators ──
  const pct = (v: number) => (v / TOTAL_REVENUE_BUDGET) * 100;

  const cRate = useMemo(() => {
    if (totalRevenue > 0) {
      const ratio = totalCollection / totalRevenue;
      return ratio > 0 ? ratio : 0.85;
    }
    return 0.85;
  }, [totalCollection, totalRevenue]);

  const getCorrespondingActAmount = (amount: number, category?: SegmentKey) => {
    if (category === 'mat') return amount / 0.6;
    if (category === 'sub') return amount / 0.7;
    return amount;
  };

  // ── Micro-Tooltip hover tracker ──
  const handleBarMouseMove = (
    e: React.MouseEvent,
    title: string,
    budget: number,
    actual: number,
    cash: number,
    rateLabel: string,
    rateVal: string
  ) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left + 15;
    const y = e.clientY - bounds.top - 80;
    setTooltipData({ x, y, title, budget, actual, cash, rateLabel, rateVal });
  };

  const actualProfit = totalRevenue - COST_KEYS.reduce((sum, k) => sum + currentData.act[k], 0);

  // Ruler axis points
  const RULER_POINTS = [
    { val: 0, label: '0' },
    { val: 300, label: '300万 (材料)' },
    { val: 700, label: '700万 (分包)' },
    { val: 800, label: '800万 (其他)' },
    { val: 1000, label: '1000万 (合同额)' }
  ];

  return (
    <div className="mb-8 space-y-4 select-none relative">
      
      {/* ── Dynamic Floating Micro-Tooltip ── */}
      {tooltipData && (
        <div
          className="absolute z-50 pointer-events-none bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-2xl text-[10px] text-slate-600 font-normal min-w-[170px] backdrop-blur-md transition-all duration-75 border-t-slate-100"
          style={{ 
            left: `${tooltipData.x}px`, 
            top: `${tooltipData.y}px`,
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 16px -6px rgba(15, 23, 42, 0.08)'
          }}
        >
          <div className="font-black text-slate-900 border-b border-slate-100 pb-1.5 mb-2">{tooltipData.title}</div>
          <div className="flex justify-between mb-1"><span>控制预算</span><span className="font-mono text-slate-700 font-bold">{tooltipData.budget.toFixed(0)}万</span></div>
          <div className="flex justify-between mb-1"><span className="text-blue-600 font-semibold">实际发生</span><span className="font-mono text-blue-700 font-extrabold">{tooltipData.actual.toFixed(0)}万</span></div>
          <div className="flex justify-between mb-2"><span className="text-emerald-600 font-semibold">现金流</span><span className="font-mono text-emerald-700 font-extrabold">{tooltipData.cash.toFixed(0)}万</span></div>
          <div className="border-t border-slate-100 pt-1.5 mt-1 flex justify-between text-[9px]"><span className="text-amber-600 font-extrabold">{tooltipData.rateLabel}</span><span className="font-mono font-black text-amber-700">{tooltipData.rateVal}</span></div>
        </div>
      )}

      {/* ═══ Unified Board Chart (merged co-axial visualization) ═══ */}
      <div className="glass-card overflow-hidden border border-slate-200 bg-white rounded-2xl shadow-sm">

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-slate-800 shadow-[0_0_8px_rgba(30,41,59,0.3)]" />
            <span className="text-xs font-black text-slate-800 tracking-wider">穿透式工程管理一览图</span>
          </div>
          
          <div className="flex gap-2 text-[10px] font-bold font-mono">
            {isLoss && <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-lg border border-rose-100">⚠️ 项目亏损</span>}
            {isFundingGap && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-100">📉 资金垫付</span>}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-bold select-none">供应商排序:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {([['budget', '预算占比'], ['firstAct', '首次发生']] as [SortMode, string][]).map(
                ([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setSupplierSort(mode)}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
                      supplierSort === mode
                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50 font-black'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >{label}</button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Unified Ruler Scale Axis */}
        <div className="px-5 pt-4 pb-2 border-b border-slate-100 bg-slate-50/[0.1]">
          <div className="relative h-6 ml-48">
            {RULER_POINTS.map((pt, i) => (
              <div
                key={i}
                className="absolute top-0 flex flex-col items-center -translate-x-1/2"
                style={{ left: `${pct(pt.val)}%` }}
              >
                <span className="text-[9px] font-mono font-black text-slate-400">{pt.label}</span>
                <div className="w-px h-1.5 bg-slate-300 mt-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Main Display Area */}
        <div className="px-5 py-5 space-y-4">

          {/* ── SECTION 1: 收入与收款 ── */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 mb-2.5 uppercase tracking-widest">业主视角（收入与回款）</div>
            
            {(() => {
              const rowKey = 'rev-main';
              const isHovered = hoveredRowKey === rowKey;
              return (
                <div className="space-y-1">
                  <div 
                    className={`flex items-center min-h-[44px] gap-4 p-1 rounded-xl transition-all duration-300 ${isHovered ? 'bg-slate-50' : ''}`}
                    onMouseEnter={() => setHoveredRowKey(rowKey)}
                    onMouseLeave={() => { setHoveredRowKey(null); setTooltipData(null); }}
                  >
                    <RowLabel
                      title="工程总承包确权"
                      actual={totalRevenue}
                      budget={TOTAL_REVENUE_BUDGET}
                      isBold={true}
                      hasChildren={true}
                      isExpanded={expanded.has(rowKey)}
                      onClickToggle={() => toggle(rowKey)}
                      colorIndicator="#2563eb"
                    />

                    {/* Progress Bar Container */}
                    <div 
                      className="flex-1 relative h-8 cursor-pointer"
                      onMouseMove={(e) => handleBarMouseMove(
                        e, '合同总盘 (收入确权与收款)', TOTAL_REVENUE_BUDGET, totalRevenue, totalCollection, 
                        '总产值回笼比例', totalRevenue > 0 ? `${(totalCollection/totalRevenue*100).toFixed(1)}%` : '--'
                      )}
                    >
                      {/* Budget background track */}
                      <BulletTrack left={0} width={100} />
                      {/* Actual confirms */}
                      <ActualBar
                        left={0}
                        width={pct(totalRevenue)}
                        budgetWidth={100}
                        colorClass="bg-gradient-to-r from-blue-500 to-indigo-600 shadow-indigo-500/10"
                      />
                      {/* Cash collection */}
                      <CashFlowBar left={0} width={pct(totalCollection)} />
                      {/* Budget boundary limit */}
                      <BudgetMarker position={100} />
                    </div>

                    <div className="w-28 flex justify-end flex-shrink-0">
                      <VarianceTag actual={totalRevenue} budget={TOTAL_REVENUE_BUDGET} type="revenue" />
                    </div>
                  </div>

                  {/* Level 2: Confirmations Waterfall */}
                  {expanded.has(rowKey) && (() => {
                    let cum = 0;
                    return (
                      <div className="ml-6 pl-6 py-2 space-y-2 bg-slate-50/40 rounded-r-2xl border border-slate-200/50 shadow-inner relative">
                        {revActs.map((tx, i) => {
                          const left = pct(cum);
                          const w = pct(tx.amount);
                          cum += tx.amount;

                          const linkedColls = revCashGroups[tx.txId] || [];
                          const linkedCashAmt = linkedColls.reduce((s, c) => s + c.amount, 0);

                          const childRowKey = `act-${tx.txId}`;
                          const isChildHovered = hoveredRowKey === childRowKey;

                          return (
                            <div key={tx.txId} className="space-y-1 relative">
                              <ExpandConnector isLast={i === revActs.length - 1} color="#cbd5e1" />
                              
                              <div
                                className={`flex items-center min-h-[38px] gap-4 p-0.5 rounded-lg transition-all duration-300 ${isChildHovered ? 'bg-white shadow-sm border border-slate-100' : ''}`}
                                onMouseEnter={() => setHoveredRowKey(childRowKey)}
                                onMouseLeave={() => { setHoveredRowKey(null); setTooltipData(null); }}
                              >
                                <RowLabel
                                  title={tx.desc}
                                  actual={tx.amount}
                                  showBudget={false}
                                  hasChildren={linkedColls.length > 0}
                                  isExpanded={expanded.has(`act-child-${tx.txId}`)}
                                  onClickToggle={() => toggle(`act-child-${tx.txId}`)}
                                />

                                <div 
                                  className="flex-1 relative h-7 cursor-pointer"
                                  onMouseMove={(e) => handleBarMouseMove(
                                    e, tx.desc, tx.amount, tx.amount, linkedCashAmt, 
                                    '单笔确权回款率', tx.amount > 0 ? `${(linkedCashAmt/tx.amount*100).toFixed(1)}%` : '--'
                                  )}
                                >
                                  <BulletTrack left={left} width={w} />
                                  <ActualBar
                                    left={left}
                                    width={w}
                                    budgetWidth={w}
                                    colorClass="bg-blue-400 shadow-blue-400/10"
                                  />
                                  <CashFlowBar left={left} width={pct(linkedCashAmt)} />
                                  <BudgetMarker position={left + w} />
                                </div>

                                <div className="w-28 flex justify-end flex-shrink-0">
                                  <VarianceTag actual={linkedCashAmt} budget={tx.amount} type="revenue" />
                                </div>
                              </div>

                              {/* Level 3: Individual Collections */}
                              {expanded.has(`act-child-${tx.txId}`) && (
                                <div className="ml-4 pl-6 py-1.5 space-y-1 bg-white border border-slate-200/60 shadow-sm rounded-xl p-2 relative">
                                  {linkedColls.map((rc, ci) => {
                                    const actAmt = rc.amount / cRate;
                                    const leftPos = left; 
                                    const cW = pct(actAmt);

                                    const grandChildRowKey = `rc-${rc.txId}`;
                                    const isGrandHovered = hoveredRowKey === grandChildRowKey;

                                    return (
                                      <div key={rc.txId} className="relative flex items-center min-h-[30px] gap-4 p-0.5 rounded transition-all">
                                        <ExpandConnector isLast={ci === linkedColls.length - 1} color="#a7f3d0" />
                                        
                                        <div 
                                          className={`w-[166px] flex-shrink-0 flex items-center justify-between text-[10px] pr-2 text-slate-500 ${isGrandHovered ? 'text-slate-800' : ''}`}
                                          onMouseEnter={() => setHoveredRowKey(grandChildRowKey)}
                                          onMouseLeave={() => setHoveredRowKey(null)}
                                        >
                                          <span className="font-mono truncate">{rc.date.slice(5)} {rc.desc}</span>
                                          <span className="text-emerald-600 font-mono font-black">{rc.amount.toFixed(0)}万</span>
                                        </div>

                                        <div 
                                          className="flex-1 relative h-5 cursor-pointer"
                                          onMouseMove={(e) => handleBarMouseMove(
                                            e, rc.desc, actAmt, actAmt, rc.amount, 
                                            '收款流速比', `${(cRate*100).toFixed(0)}%`
                                          )}
                                          onMouseEnter={() => setHoveredRowKey(grandChildRowKey)}
                                          onMouseLeave={() => { setHoveredRowKey(null); setTooltipData(null); }}
                                        >
                                          <BulletTrack left={leftPos} width={cW} className="opacity-40" />
                                          <CashFlowBar left={leftPos} width={pct(rc.amount)} className="opacity-90" />
                                        </div>

                                        <div className="w-28 flex-shrink-0" />
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
          </div>

          <SectionDivider />

          {/* ── SECTION 2: 内部经营成本 ── */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 mb-2.5 uppercase tracking-widest">内部经营（成本与付款）</div>
            
            <div className="space-y-3">
              {COST_KEYS.map(key => {
                const val = currentData.act[key];
                const cash = currentData.cash[key];
                const budget = BUDGET_STRUCTURE[key];
                const isOver = val > budget;
                const anchor = ANCHORS[key];
                const catPct = (budget / TOTAL_REVENUE_BUDGET) * 100;

                const colorClass = 
                  key === 'mat' ? 'bg-sky-500 shadow-sky-500/10' : 
                  key === 'sub' ? 'bg-indigo-500 shadow-indigo-500/10' : 
                  'bg-violet-500 shadow-violet-500/10';

                const rowKey = `cat-${key}`;
                const isHovered = hoveredRowKey === rowKey;

                return (
                  <div key={key} className="space-y-1">
                    {/* Main Category Row */}
                    <div 
                      className={`flex items-center min-h-[44px] gap-4 p-1 rounded-xl transition-all duration-300 ${isHovered ? 'bg-slate-50' : ''}`}
                      onMouseEnter={() => setHoveredRowKey(rowKey)}
                      onMouseLeave={() => { setHoveredRowKey(null); setTooltipData(null); }}
                    >
                      <RowLabel
                        title={NAMES[key]}
                        actual={val}
                        budget={budget}
                        hasChildren={true}
                        isExpanded={expanded.has(rowKey)}
                        onClickToggle={() => toggle(rowKey)}
                        colorIndicator={COLORS.cool[key]}
                      />

                      <div 
                        className="flex-1 relative h-8 cursor-pointer"
                        onMouseMove={(e) => handleBarMouseMove(
                          e, NAMES[key], budget, val, cash, 
                          '累计预算发生率', `${(val/budget*100).toFixed(1)}%`
                        )}
                      >
                        {/* Budget Slot */}
                        <BulletTrack left={anchor} width={catPct} />
                        {/* Actual expenditure */}
                        <ActualBar
                          left={anchor}
                          width={pct(val)}
                          budgetWidth={catPct}
                          colorClass={colorClass}
                        />
                        {/* Cash payments */}
                        {cash > 0 && (
                          <CashFlowBar left={anchor} width={pct(cash)} />
                        )}
                        {/* Budget boundary mark */}
                        <BudgetMarker position={anchor + catPct} />
                      </div>

                      <div className="w-28 flex justify-end flex-shrink-0">
                        <VarianceTag actual={val} budget={budget} type="cost" />
                      </div>
                    </div>

                    {/* Level 2: Suppliers List */}
                    {expanded.has(rowKey) && (() => {
                      const sorted = sortSuppliers(key);
                      const anchors = supAnchors(key);

                      return (
                        <div className="ml-6 pl-6 py-2 space-y-2 bg-slate-50/40 rounded-r-2xl border border-slate-200/50 shadow-inner relative">
                          {sorted.map((sup, si) => {
                            const sAct = supActMap[sup.id] || 0;
                            const sCash = supCashMap[sup.id] || 0;
                            const sAnchor = anchors[sup.id];
                            const sBudPct = (sup.budgetAmount / TOTAL_REVENUE_BUDGET) * 100;
                            const sOver = sAct > sup.budgetAmount;
                            const childRowKey = `${rowKey}-${sup.id}`;
                            const isChildHovered = hoveredRowKey === childRowKey;

                            const sColorClass = sOver 
                              ? 'bg-rose-400 shadow-rose-400/10'
                              : key === 'mat' ? 'bg-sky-400 shadow-sky-400/10' : 'bg-indigo-400 shadow-indigo-400/10';

                            return (
                              <div key={sup.id} className="space-y-1 relative">
                                <ExpandConnector isLast={si === sorted.length - 1} color="#cbd5e1" />
                                
                                <div
                                  className={`flex items-center min-h-[38px] gap-4 p-0.5 rounded-lg transition-all duration-300 ${isChildHovered ? 'bg-white shadow-sm border border-slate-100' : ''}`}
                                  onMouseEnter={() => setHoveredRowKey(childRowKey)}
                                  onMouseLeave={() => { setHoveredRowKey(null); setTooltipData(null); }}
                                >
                                  <RowLabel
                                    title={sup.name}
                                    actual={sAct}
                                    budget={sup.budgetAmount}
                                    hasChildren={true}
                                    isExpanded={expanded.has(`pay-${sup.id}`)}
                                    onClickToggle={() => toggle(`pay-${sup.id}`)}
                                  />

                                  <div 
                                    className="flex-1 relative h-7 cursor-pointer"
                                    onMouseMove={(e) => handleBarMouseMove(
                                      e, sup.name, sup.budgetAmount, sAct, sCash, 
                                      '采购预算使用率', `${(sAct/sup.budgetAmount*100).toFixed(1)}%`
                                    )}
                                  >
                                    <BulletTrack left={sAnchor} width={sBudPct} />
                                    <ActualBar
                                      left={sAnchor}
                                      width={pct(sAct)}
                                      budgetWidth={sBudPct}
                                      colorClass={sColorClass}
                                    />
                                    {sCash > 0 && (
                                      <CashFlowBar left={sAnchor} width={pct(sCash)} />
                                    )}
                                    <BudgetMarker position={sAnchor + sBudPct} />
                                  </div>

                                  <div className="w-28 flex justify-end flex-shrink-0">
                                    <VarianceTag actual={sAct} budget={sup.budgetAmount} type="cost" />
                                  </div>
                                </div>

                                {/* Level 3: Supplier Payments */}
                                {expanded.has(`pay-${sup.id}`) && (() => {
                                  const payments = supCashTxs[sup.id] || [];
                                  let cumPay = 0;
                                  return (
                                    <div className="ml-4 pl-6 py-1.5 space-y-1 bg-white border border-slate-200/60 shadow-sm rounded-xl p-2 relative">
                                      {payments.map((pay, pi) => {
                                        const payLeft = sAnchor + pct(cumPay);
                                        cumPay += pay.amount;

                                        const actAmount = getCorrespondingActAmount(pay.amount, key);
                                        const actW = pct(actAmount);

                                        const grandChildRowKey = `paytx-${pay.txId}`;
                                        const isGrandHovered = hoveredRowKey === grandChildRowKey;

                                        return (
                                          <div key={pay.txId} className="relative flex items-center min-h-[30px] gap-4 p-0.5 rounded transition-all">
                                            <ExpandConnector isLast={pi === payments.length - 1} color="#cbd5e1" />
                                            
                                            <div 
                                              className={`w-[166px] flex-shrink-0 flex items-center justify-between text-[10px] pr-2 text-slate-500 ${isGrandHovered ? 'text-slate-800' : ''}`}
                                              onMouseEnter={() => setHoveredRowKey(grandChildRowKey)}
                                              onMouseLeave={() => setHoveredRowKey(null)}
                                            >
                                              <span className="font-mono truncate">{pay.date.slice(5)} {pay.desc}</span>
                                              <span className="text-slate-800 font-mono font-black">{pay.amount.toFixed(0)}万</span>
                                            </div>

                                            <div 
                                              className="flex-1 relative h-5 cursor-pointer"
                                              onMouseMove={(e) => handleBarMouseMove(
                                                e, pay.desc, actAmount, actAmount, pay.amount, 
                                                '账款支付比率', `${key === 'mat' ? '60%' : key === 'sub' ? '70%' : '100%'}`
                                              )}
                                              onMouseEnter={() => setHoveredRowKey(grandChildRowKey)}
                                              onMouseLeave={() => { setHoveredRowKey(null); setTooltipData(null); }}
                                            >
                                              <BulletTrack left={payLeft} width={actW} className="opacity-40" />
                                              <CashFlowBar left={payLeft} width={pct(pay.amount)} className="opacity-90" />
                                            </div>

                                            <div className="w-28 flex-shrink-0" />
                                          </div>
                                        );
                                      })}
                                      {payments.length === 0 && (
                                        <div className="text-[9px] text-slate-400 pl-2 py-1 italic select-none">暂无付款交易记录</div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>

          <SectionDivider />

          {/* ── SECTION 3: 经营结果 ── */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 mb-2.5 uppercase tracking-widest">经营结果（项目收益状况）</div>
            
            {(() => {
              const rowKey = 'profit-main';
              const isHovered = hoveredRowKey === rowKey;
              const proBudget = BUDGET_STRUCTURE.pro;
              const anchor = ANCHORS.pro;
              const proPct = (proBudget / TOTAL_REVENUE_BUDGET) * 100;
              const actualWidth = pct(Math.max(0, actualProfit));

              return (
                <div 
                  className={`flex items-center min-h-[44px] gap-4 p-1 rounded-xl transition-all duration-300 ${isHovered ? 'bg-slate-50' : ''}`}
                  onMouseEnter={() => setHoveredRowKey(rowKey)}
                  onMouseLeave={() => { setHoveredRowKey(null); setTooltipData(null); }}
                >
                  <RowLabel
                    title="项目实际利润"
                    actual={actualProfit}
                    budget={proBudget}
                    isBold={true}
                    colorIndicator={isLoss ? COLORS.warm.loss : COLORS.cool.pro}
                  />

                  <div 
                    className="flex-1 relative h-8 cursor-pointer"
                    onMouseMove={(e) => handleBarMouseMove(
                      e, '项目利润率核算', proBudget, actualProfit, 0, 
                      '目标利润达成率', `${(actualProfit/proBudget*100).toFixed(1)}%`
                    )}
                  >
                    {/* Budget Slot */}
                    <BulletTrack left={anchor} width={proPct} />
                    {/* Profit bar */}
                    {actualProfit > 0 && (
                      <ActualBar
                        left={anchor}
                        width={actualWidth}
                        budgetWidth={proPct}
                        colorClass="bg-teal-500 shadow-teal-500/10"
                      />
                    )}
                    {/* Budget boundary limit */}
                    <BudgetMarker position={100} />
                  </div>

                  <div className="w-28 flex justify-end flex-shrink-0">
                    <VarianceTag actual={actualProfit} budget={proBudget} type="profit" />
                  </div>
                </div>
              );
            })()}
          </div>

        </div>

        {/* Legend Panel */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex flex-wrap gap-5 justify-center text-[10px] text-slate-500 font-bold bg-slate-50/50">
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-2 rounded border border-slate-200 bg-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]" /> 预算背景导轨</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-2 rounded bg-gradient-to-r from-blue-500 to-indigo-600 shadow-indigo-500/10" /> 确权产值 (实际值)</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-2 rounded bg-sky-500 shadow-sky-500/10" /> 实际成本 (材料/分包/其他)</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-2 rounded border border-emerald-500/40 bg-emerald-500/70 shadow-sm" style={{ backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 4px, transparent 4px, transparent 8px)` }} /> 现金收付 (回款/付款流)</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-2 rounded bg-teal-500 shadow-teal-500/10" /> 实际利润</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-2 rounded bg-rose-500 shadow-rose-500/10" /> 超支 / 亏损溢出</span>
        </div>
      </div>
    </div>
  );
}
