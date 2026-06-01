"use client";
import React, { useState, useMemo } from 'react';
import {
  BUDGET_STRUCTURE, TOTAL_REVENUE_BUDGET,
  SEGMENT_KEYS, COST_KEYS, NAMES, COLORS, ANCHORS,
  SUPPLIERS, hexToRgba,
  SegmentKey, SnapshotState, Transaction,
} from './project-data';
import {
  BudgetSlot,
  CylinderCapsule,
  HatchedFlow,
  GlowingLabelBadge,
  CapsuleColorType,
  getHatchPattern,
  TreePipeConnector,
  PenetrativeGraphicStyles
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

  // ── Hierarchical indicator arrow ──
  const Tri = ({ k, color }: { k: string; color?: string }) => (
    <button
      onClick={e => { e.stopPropagation(); toggle(k); }}
      className="w-4 h-4 flex items-center justify-center text-[9px] transition-transform duration-200 cursor-pointer select-none flex-shrink-0"
      style={{
        transform: expanded.has(k) ? 'rotate(90deg)' : 'rotate(0deg)',
        color: color || 'rgba(100,116,139,0.8)',
      }}
    >▶</button>
  );

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

  return (
    <div className="mb-8 space-y-4 select-none relative">
      
      {/* Load custom keyframe animations inside graph components */}
      <PenetrativeGraphicStyles />

      {/* ── Dynamic Floating Micro-Tooltip ── */}
      {tooltipData && (
        <div
          className="absolute z-50 pointer-events-none bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-2xl text-[10px] text-slate-600 font-normal min-w-[170px] backdrop-blur-md transition-all duration-75 animate-fade-in border-t-slate-100"
          style={{ 
            left: `${tooltipData.x}px`, 
            top: `${tooltipData.y}px`,
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 16px -6px rgba(15, 23, 42, 0.08)'
          }}
        >
          <div className="font-black text-slate-900 border-b border-slate-100 pb-1.5 mb-2">{tooltipData.title}</div>
          <div className="flex justify-between mb-1"><span>控制预算</span><span className="font-mono text-slate-700 font-bold">{tooltipData.budget.toFixed(0)}万</span></div>
          <div className="flex justify-between mb-1"><span className="text-blue-600 font-semibold">实际确权</span><span className="font-mono text-blue-700 font-extrabold">{tooltipData.actual.toFixed(0)}万</span></div>
          <div className="flex justify-between mb-2"><span className="text-emerald-600 font-semibold">现金流</span><span className="font-mono text-emerald-700 font-extrabold">{tooltipData.cash.toFixed(0)}万</span></div>
          <div className="border-t border-slate-100 pt-1.5 mt-1 flex justify-between text-[9px]"><span className="text-amber-600 font-extrabold">{tooltipData.rateLabel}</span><span className="font-mono font-black text-amber-700">{tooltipData.rateVal}</span></div>
        </div>
      )}

      {/* ═══ Track A: 收入与回款视角 ═══ */}
      <div className="glass-card overflow-hidden border border-slate-200 bg-white rounded-2xl shadow-sm">

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />
            <span className="text-xs font-black text-slate-800 tracking-wider">Track A · 收入与回款（业主视角）</span>
          </div>
          <div className="flex gap-2 text-[10px] font-bold font-mono">
            {isLoss && <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-lg border border-rose-100">⚠️ 项目亏损</span>}
            {isFundingGap && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-100">📉 资金垫付</span>}
          </div>
        </div>

        <div className="px-5 py-5 space-y-1.5">

          {/* ── Co-axial merge row ── */}
          {(() => {
            const rowKey = 'rev-main';
            const isHovered = hoveredRowKey === rowKey;
            return (
              <div 
                className={`flex items-center min-h-[48px] gap-4 p-1 rounded-xl transition-all duration-300 ${isHovered ? 'bg-slate-50' : ''}`}
                onMouseEnter={() => setHoveredRowKey(rowKey)}
                onMouseLeave={() => { setHoveredRowKey(null); setTooltipData(null); }}
              >
                {/* Label */}
                <div className="w-48 flex-shrink-0 flex items-center justify-between pr-2">
                  <div className="flex items-center gap-2">
                    <Tri k={rowKey} color="#2563eb" />
                    <span className={`text-xs font-black tracking-wide transition-colors ${isHovered ? 'text-blue-600' : 'text-slate-800'}`}>工程总承包确权</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GlowingLabelBadge 
                      show={isHovered} 
                      text={`回款 ${(totalRevenue > 0 ? (totalCollection/totalRevenue * 100) : 0).toFixed(0)}%`} 
                      type="emerald"
                    />
                    {!isHovered && (
                      <div className="text-[10px] font-mono font-black flex items-baseline text-slate-500">
                        <span className="text-blue-600 font-extrabold">{totalRevenue.toFixed(0)}</span>
                        <span className="text-slate-300 px-0.5">/</span>
                        <span className="text-emerald-600 font-extrabold">{totalCollection.toFixed(0)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Co-axial 3D Capsule */}
                <div 
                  className={`flex-1 relative h-9 transition-all duration-300 ${isHovered ? 'scale-[1.001]' : ''}`}
                  onMouseMove={(e) => handleBarMouseMove(
                    e, '合同总盘 (收入确权与收款)', TOTAL_REVENUE_BUDGET, totalRevenue, totalCollection, 
                    '总产值回笼比例', totalRevenue > 0 ? `${(totalCollection/totalRevenue*100).toFixed(1)}%` : '--'
                  )}
                >
                  {/* 3D recess slot */}
                  <BudgetSlot isHovered={isHovered} />

                  {/* 3D actual EVM cylinder capsule */}
                  {totalRevenue > 0 && (
                    <CylinderCapsule
                      left={0.5}
                      width={Math.min(99.0, pct(totalRevenue))}
                      colorType={isLoss ? 'rose' : 'blue'}
                      isHovered={isHovered}
                    >
                      {/* 3D nested scrolling cash liquid */}
                      {totalCollection > 0 && (
                        <HatchedFlow
                          width={Math.min(100, (totalCollection / totalRevenue) * 100)}
                          color="#ffffff"
                          glowColor="#10b981"
                        />
                      )}
                    </CylinderCapsule>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── First-level Cascade: EVM confirmation waterfall (Soft Grey Nesting box) ── */}
          {expanded.has('rev-main') && (() => {
            let cum = 0;
            return (
              <div className="ml-6 pl-6 py-2.5 space-y-1.5 bg-slate-50/40 rounded-r-2xl border border-slate-200/50 shadow-inner relative">
                {revActs.map((tx, i) => {
                  const left = pct(cum);
                  const w = pct(tx.amount);
                  cum += tx.amount;

                  const linkedColls = revCashGroups[tx.txId] || [];
                  const linkedCashAmt = linkedColls.reduce((s, c) => s + c.amount, 0);

                  const rowKey = `act-${tx.txId}`;
                  const isHovered = hoveredRowKey === rowKey;

                  return (
                    <div key={tx.txId} className="space-y-0.5 relative">
                      
                      {/* 3D connection piping branch line */}
                      <TreePipeConnector isLast={i === revActs.length - 1} color="#cbd5e1" glowColor="#3b82f6" />

                      {/* Confirmation row */}
                      <div 
                        className={`flex items-center min-h-[38px] gap-4 p-0.5 rounded-lg transition-all duration-300 ${isHovered ? 'bg-white shadow-sm border border-slate-100' : ''}`}
                        onMouseEnter={() => setHoveredRowKey(rowKey)}
                        onMouseLeave={() => { setHoveredRowKey(null); setTooltipData(null); }}
                      >
                        {/* Label */}
                        <div className="w-[166px] flex-shrink-0 flex items-center justify-between pr-2 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <Tri k={`act-child-${tx.txId}`} color="#3b82f6" />
                            <span className="text-slate-400 font-mono w-4">#{i + 1}</span>
                            <span className="text-slate-700 font-extrabold truncate max-w-[80px]">{tx.desc.slice(5)}</span>
                          </div>
                          <GlowingLabelBadge 
                            show={isHovered} 
                            text={`收回 ${tx.amount > 0 ? (linkedCashAmt/tx.amount*100).toFixed(0) : 0}%`} 
                            type="blue"
                          />
                          {!isHovered && (
                            <span className="text-slate-800 font-mono font-black">{tx.amount.toFixed(0)}万</span>
                          )}
                        </div>

                        {/* Slide track */}
                        <div 
                          className="flex-1 relative h-7"
                          onMouseMove={(e) => handleBarMouseMove(
                            e, tx.desc, tx.amount, tx.amount, linkedCashAmt, 
                            '单笔确权回款率', tx.amount > 0 ? `${(linkedCashAmt/tx.amount*100).toFixed(1)}%` : '--'
                          )}
                        >
                          {/* 3D slot */}
                          <BudgetSlot isHovered={isHovered} borderColor="rgba(226, 232, 240, 0.5)" backgroundColor="#f8fafc" />
                          
                          {/* 3D cylinder capsule */}
                          <CylinderCapsule
                            left={left}
                            width={Math.max(0.4, w)}
                            colorType="blue"
                            heightClass="inset-y-1.5"
                            isHovered={isHovered}
                          >
                            {linkedCashAmt > 0 && (
                              <HatchedFlow
                                width={Math.min(100, (linkedCashAmt / tx.amount) * 100)}
                                color="#ffffff"
                                glowColor="#10b981"
                              />
                            )}
                          </CylinderCapsule>
                        </div>
                      </div>

                      {/* ── Second-level Cascade: Linked collections detail (Pure White Capsule Box) ── */}
                      {expanded.has(`act-child-${tx.txId}`) && (
                        <div className="ml-4 pl-6 py-1.5 space-y-1 bg-white border border-slate-200 shadow-sm rounded-xl p-2 relative">
                          {linkedColls.map((rc, ci) => {
                            const actAmt = rc.amount / cRate;
                            const leftPos = left; 
                            const cW = pct(actAmt);

                            const childRowKey = `rc-${rc.txId}`;
                            const isChildHovered = hoveredRowKey === childRowKey;

                            return (
                              <div key={rc.txId} className="relative">
                                
                                {/* 3D nested green pipe line */}
                                <TreePipeConnector isLast={ci === linkedColls.length - 1} color="#a7f3d0" glowColor="#10b981" />

                                <div 
                                  className={`flex items-center h-7.5 gap-4 p-0.5 rounded transition-all ${isChildHovered ? 'bg-slate-50/80' : ''}`}
                                  onMouseEnter={() => setHoveredRowKey(childRowKey)}
                                  onMouseLeave={() => { setHoveredRowKey(null); setTooltipData(null); }}
                                >
                                  {/* Label */}
                                  <div className="w-[130px] flex-shrink-0 flex items-center justify-between text-[9px] pr-2 text-slate-500">
                                    <span className="font-mono">{rc.date.slice(5)} {rc.desc}</span>
                                    <span className="text-emerald-700 font-mono font-extrabold">{rc.amount.toFixed(0)}万</span>
                                  </div>

                                  {/* Slide track */}
                                  <div 
                                    className="flex-1 relative h-5"
                                    onMouseMove={(e) => handleBarMouseMove(
                                      e, rc.desc, actAmt, actAmt, rc.amount, 
                                      '收付款流速比', `${(cRate*100).toFixed(0)}%`
                                    )}
                                  >
                                    <BudgetSlot className="opacity-60" />

                                    {/* 3D actual confirm capsule */}
                                    {actAmt > 0 && (
                                      <CylinderCapsule
                                        left={leftPos}
                                        width={Math.max(0.4, cW)}
                                        colorType="blue"
                                        heightClass="inset-y-0.5"
                                        opacity={0.4}
                                        isHovered={isChildHovered}
                                      >
                                        {/* Nested 3D fluid */}
                                        <HatchedFlow
                                          width={cRate * 100}
                                          color="#059669"
                                          glowColor="#10b981"
                                        />
                                      </CylinderCapsule>
                                    )}
                                  </div>
                                </div>
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
      </div>

      {/* ═══ Track B: 内部经营视角 ═══ */}
      <div className="glass-card overflow-hidden border border-slate-200 bg-white rounded-2xl shadow-sm">

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
            <span className="text-xs font-black text-slate-800 tracking-wider">Track B · 内部经营与成本（穿透控制）</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-bold select-none">供应商按:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {([['budget', '预算占比'], ['firstAct', '首次确权']] as [SortMode, string][]).map(
                ([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setSupplierSort(mode)}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
                      supplierSort === mode
                        ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50 font-black'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >{label}</button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Ruler Axis */}
        <div className="px-5 pt-3 pb-1 border-b border-slate-100 bg-slate-50/[0.1]">
          <div className="relative h-5 ml-48">
            {SEGMENT_KEYS.map(key => (
              <div
                key={`ax-${key}`}
                className="absolute top-0 h-full flex items-center border-l border-slate-200"
                style={{
                  left: `${ANCHORS[key]}%`,
                  width: `${(BUDGET_STRUCTURE[key] / TOTAL_REVENUE_BUDGET) * 100}%`,
                }}
              >
                <span className="text-[9px] font-mono text-slate-400 px-2 truncate font-medium">
                  {NAMES[key]} ({BUDGET_STRUCTURE[key]}万)
                </span>
              </div>
            ))}
            <div className="absolute top-0 h-full right-0 border-r border-slate-200" />
          </div>
        </div>

        {/* Category Rows */}
        <div className="px-5 py-4 space-y-2">
          {SEGMENT_KEYS.map(key => {
            const val = currentData.act[key];
            const cash = currentData.cash[key];
            const budget = BUDGET_STRUCTURE[key];
            const expandable = key !== 'pro';
            const isOver = key !== 'pro' && val > budget;
            const anchor = ANCHORS[key];
            const catPct = (budget / TOTAL_REVENUE_BUDGET) * 100;

            const capsuleColor: CapsuleColorType = 
              key === 'pro' ? (isLoss ? 'rose' : 'teal') : 
              isOver ? 'orange' : 
              key === 'mat' ? 'blue' : 'indigo';

            const catKey = `cat-${key}`;
            const isCatHovered = hoveredRowKey === catKey;

            return (
              <div key={key} className="border-t border-slate-100 first:border-t-0 pt-2 first:pt-0">

                {/* Category summary row */}
                <div 
                  className={`flex items-center min-h-[44px] gap-4 p-1 rounded-xl transition-all duration-300 ${isCatHovered ? 'bg-slate-50' : ''}`}
                  onMouseEnter={() => setHoveredRowKey(catKey)}
                  onMouseLeave={() => { setHoveredRowKey(null); setTooltipData(null); }}
                >
                  {/* Label */}
                  <div className="w-48 flex-shrink-0 flex items-center justify-between pr-2">
                    <div className="flex items-center gap-2">
                      {expandable ? <Tri k={catKey} color={COLORS.cool[key]} /> : <div className="w-4" />}
                      <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse-glow" style={{ backgroundColor: COLORS.cool[key], '--glow-color': COLORS.cool[key] } as React.CSSProperties} />
                      <span className="text-xs font-extrabold text-slate-800">{NAMES[key]}</span>
                    </div>
                    <GlowingLabelBadge 
                      show={isCatHovered} 
                      text={`已用比 ${(val/budget*100).toFixed(0)}%`} 
                      type={isOver ? 'rose' : (key==='pro'?'emerald':'blue')}
                    />
                    {!isCatHovered && (
                      <span className={`text-[10px] font-mono font-black ${isOver ? 'text-orange-600' : 'text-slate-800'}`}>
                        {val.toFixed(0)}<span className="text-slate-300 text-[9px]">/{budget}</span>
                      </span>
                    )}
                  </div>

                  {/* 3D Bar */}
                  <div 
                    className="flex-1 relative h-8"
                    onMouseMove={(e) => handleBarMouseMove(
                      e, NAMES[key], budget, val, cash, 
                      '累计预算使用率', `${(val/budget*100).toFixed(1)}%`
                    )}
                  >
                    {/* 3D control guide rail */}
                    <BudgetSlot
                      left={anchor}
                      width={catPct}
                      isHovered={isCatHovered}
                    />

                    {/* 3D actual cost cylinder */}
                    {val > 0 && (
                      <CylinderCapsule
                        left={anchor}
                        width={pct(val)}
                        colorType={capsuleColor}
                        isHovered={isCatHovered}
                      >
                        {/* 3D nested stripe liquid */}
                        {cash > 0 && key !== 'pro' && (
                          <HatchedFlow
                            width={(cash / val) * 100}
                            glowColor={key === 'mat' ? '#38bdf8' : '#6366f1'}
                          />
                        )}
                      </CylinderCapsule>
                    )}
                    
                    {/* Overflow warning line */}
                    {isOver && (
                      <div
                        className="absolute top-0 bottom-0 border-l-2 border-dotted z-10"
                        style={{
                          left: `${anchor + catPct}%`,
                          borderColor: '#ef4444',
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* ── First-level Cascade: Suppliers list (Soft Grey Nesting Box) ── */}
                {expandable && expanded.has(catKey) && (() => {
                  const sorted = sortSuppliers(key);
                  const anchors = supAnchors(key);

                  return (
                    <div className="ml-6 pl-6 py-2.5 space-y-1.5 bg-slate-50/40 rounded-r-2xl border border-slate-200/50 shadow-inner relative">
                      {sorted.map((sup, si) => {
                        const sAct = supActMap[sup.id] || 0;
                        const sCash = supCashMap[sup.id] || 0;
                        const sAnchor = anchors[sup.id];
                        const sBudPct = (sup.budgetAmount / TOTAL_REVENUE_BUDGET) * 100;
                        const sOver = sAct > sup.budgetAmount;
                        const supKey = `${catKey}-${sup.id}`;
                        
                        const sCapsuleColor: CapsuleColorType = 
                          sOver ? 'orange' : (key === 'mat' ? 'blue' : 'indigo');

                        const isSupHovered = hoveredRowKey === supKey;

                        return (
                          <div key={sup.id} className="space-y-0.5 relative">
                            
                            {/* 3D cascade pipeline */}
                            <TreePipeConnector isLast={si === sorted.length - 1} color="#cbd5e1" glowColor={COLORS.cool[key]} />

                            {/* Supplier row */}
                            <div 
                              className={`flex items-center min-h-[34px] gap-4 p-0.5 rounded-lg transition-all duration-300 ${isSupHovered ? 'bg-white shadow-sm border border-slate-100' : ''}`}
                              onMouseEnter={() => setHoveredRowKey(supKey)}
                              onMouseLeave={() => { setHoveredRowKey(null); setTooltipData(null); }}
                            >
                              {/* Label */}
                              <div className="w-[166px] flex-shrink-0 flex items-center justify-between pr-2 text-[10px]">
                                <div className="flex items-center gap-1.5">
                                  <Tri k={supKey} color={hexToRgba(COLORS.cool[key], 0.9)} />
                                  <span className={`font-black truncate max-w-[85px] ${isSupHovered ? 'text-slate-900' : 'text-slate-600'}`}>
                                    {sup.name}
                                  </span>
                                </div>
                                <GlowingLabelBadge 
                                  show={isSupHovered} 
                                  text={`用毕比 ${(sAct/sup.budgetAmount*100).toFixed(0)}%`} 
                                  type={sOver ? 'rose' : 'blue'}
                                />
                                {!isSupHovered && (
                                  <span className="font-mono text-slate-800 font-extrabold">{sAct.toFixed(0)}万</span>
                                )}
                              </div>

                              {/* slide track */}
                              <div 
                                className="flex-1 relative h-6"
                                onMouseMove={(e) => handleBarMouseMove(
                                  e, sup.name, sup.budgetAmount, sAct, sCash, 
                                  '对应采购使用率', `${(sAct/sup.budgetAmount*100).toFixed(1)}%`
                                )}
                              >
                                <BudgetSlot
                                  left={anchor}
                                  width={catPct}
                                  className="opacity-80"
                                />
                                {/* Supplier slot sub-boundaries */}
                                <div
                                  className="absolute top-0 bottom-0 border border-dashed border-slate-300/35 pointer-events-none"
                                  style={{ left: `${sAnchor}%`, width: `${sBudPct}%` }}
                                />

                                {/* 3D supplier cost capsule */}
                                {sAct > 0 && (
                                  <CylinderCapsule
                                    left={sAnchor}
                                    width={pct(sAct)}
                                    colorType={sCapsuleColor}
                                    heightClass="inset-y-1"
                                    isHovered={isSupHovered}
                                  >
                                    {/* 3D payment nested stripes */}
                                    {sCash > 0 && (
                                      <HatchedFlow
                                        width={(sCash / sAct) * 100}
                                        glowColor={key === 'mat' ? '#38bdf8' : '#818cf8'}
                                      />
                                    )}
                                  </CylinderCapsule>
                                )}
                              </div>
                            </div>

                            {/* ── Second-level Cascade: Supplier Payments list (Pure White Capsule Box) ── */}
                            {expanded.has(supKey) && (() => {
                              const payments = supCashTxs[sup.id] || [];
                              let cumPay = 0;
                              return (
                                <div
                                  className="ml-5 pl-6 py-1.5 space-y-1 bg-white border border-slate-200 shadow-sm rounded-xl p-2 relative"
                                >
                                  {payments.map((pay, pi) => {
                                    const payLeft = sAnchor + pct(cumPay);
                                    cumPay += pay.amount;

                                    const actAmount = getCorrespondingActAmount(pay.amount, key);
                                    const actW = pct(actAmount);

                                    const txRowKey = `cc-${pay.txId}`;
                                    const isTxHovered = hoveredRowKey === txRowKey;

                                    return (
                                      <div key={pay.txId} className="relative">
                                        
                                        {/* 3D nested cost pipe connector */}
                                        <TreePipeConnector isLast={pi === payments.length - 1} color="#e2e8f0" glowColor="#818cf8" />

                                        <div 
                                          className={`flex items-center h-7.5 gap-4 p-0.5 rounded transition-all ${isTxHovered ? 'bg-slate-50/80' : ''}`}
                                          onMouseEnter={() => setHoveredRowKey(txRowKey)}
                                          onMouseLeave={() => { setHoveredRowKey(null); setTooltipData(null); }}
                                        >
                                          {/* Label */}
                                          <div className="w-[141px] flex-shrink-0 flex items-center justify-between text-[9px] text-slate-500">
                                            <span className="font-mono">{pay.date.slice(5)} {pay.desc}</span>
                                            <span className="text-slate-800 font-mono font-extrabold">{pay.amount.toFixed(0)}万</span>
                                          </div>

                                          {/* Slide track */}
                                          <div 
                                            className="flex-1 relative h-5"
                                            onMouseMove={(e) => handleBarMouseMove(
                                              e, pay.desc, actAmount, actAmount, pay.amount, 
                                              '对应履约付款率', `${key === 'mat' ? '60%' : key === 'sub' ? '70%' : '100%'}`
                                            )}
                                          >
                                            <BudgetSlot
                                              left={anchor}
                                              width={catPct}
                                              className="opacity-50"
                                            />
                                            {/* 3D cost container */}
                                            {actAmount > 0 && (
                                              <CylinderCapsule
                                                left={payLeft}
                                                width={Math.max(0.4, actW)}
                                                colorType={key === 'mat' ? 'blue' : 'indigo'}
                                                heightClass="inset-y-0.5"
                                                opacity={0.45}
                                                isHovered={isTxHovered}
                                              >
                                                {/* 3D inner cash flow stripes */}
                                                <HatchedFlow
                                                  width={(pay.amount / actAmount) * 100}
                                                  color="#ffffff"
                                                  glowColor={key === 'mat' ? '#38bdf8' : '#818cf8'}
                                                />
                                              </CylinderCapsule>
                                            )}
                                          </div>
                                        </div>
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

        {/* Legend Panel */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex flex-wrap gap-5 justify-center text-[9px] text-slate-500 font-semibold bg-slate-50/50">
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-2 rounded border border-slate-200 bg-slate-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]" /> 预算控制导轨</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-2 rounded-full bg-gradient-to-b from-sky-400 to-blue-600 border border-blue-400/20" /> EVM 实际确权 / 实际成本</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-2 rounded-full border border-emerald-600/20 shadow-[0_0_4px_#10b981]" style={{ backgroundImage: getHatchPattern('#059669', 0.25, 0.65, 4) }} /> 现金流回款 / 资金支出（液态流动）</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-2 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 border border-orange-400/20" /> 实际成本超支</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-2 rounded-full bg-gradient-to-b from-rose-500 to-rose-600 border border-red-400/20" /> 项目亏损状态</span>
        </div>
      </div>
    </div>
  );
}
