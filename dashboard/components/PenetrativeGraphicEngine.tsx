"use client";
import React from 'react';

// 1. BulletTrack (浅灰预算背景轨道)
export function BulletTrack({
  left,
  width,
  className = '',
  roundedClass = 'rounded-full',
}: {
  left: number;
  width: number;
  className?: string;
  roundedClass?: string;
}) {
  return (
    <div
      className={`absolute inset-y-1 bg-slate-100 border border-slate-200/60 shadow-inner ${roundedClass} ${className}`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
      }}
    />
  );
}

// 2. ActualBar (实际值条，若超出预算，超出部分变红/橙)
export function ActualBar({
  left,
  width,
  budgetWidth,
  colorClass = 'bg-blue-500 shadow-blue-500/10',
  overrunColorClass = 'bg-rose-500 shadow-rose-500/10',
  roundedClass = 'rounded-full',
}: {
  left: number;
  width: number;
  budgetWidth: number;
  colorClass?: string;
  overrunColorClass?: string;
  roundedClass?: string;
}) {
  const isOverrun = width > budgetWidth;
  const normalWidth = isOverrun ? budgetWidth : width;
  const overrunWidth = isOverrun ? width - budgetWidth : 0;

  return (
    <>
      {/* 正常范围内实际值 */}
      {normalWidth > 0 && (
        <div
          className={`absolute inset-y-1.5 shadow-sm transition-all duration-500 ${roundedClass} ${colorClass}`}
          style={{
            left: `${left}%`,
            width: `${normalWidth}%`,
          }}
        />
      )}
      {/* 超出预算的实际值 */}
      {overrunWidth > 0 && (
        <div
          className={`absolute inset-y-1.5 shadow-sm transition-all duration-500 ${roundedClass} ${overrunColorClass} animate-pulse-glow`}
          style={{
            left: `${left + budgetWidth}%`,
            width: `${overrunWidth}%`,
          }}
        />
      )}
    </>
  );
}

// 3. CashFlowBar (现金流条：回款或付款，绿色半透明，高度 60%)
export function CashFlowBar({
  left,
  width,
  className = '',
  roundedClass = 'rounded-full',
}: {
  left: number;
  width: number;
  className?: string;
  roundedClass?: string;
}) {
  return (
    <div
      className={`absolute inset-y-2.5 bg-emerald-500/70 border border-emerald-400/40 shadow-sm transition-all duration-500 ${roundedClass} ${className}`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
      }}
    >
      {/* 滚动的斜条纹背景突出流动感 */}
      <div
        className={`absolute inset-0 pointer-events-none opacity-35 ${roundedClass}`}
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.25) 0px,
            rgba(255, 255, 255, 0.25) 6px,
            rgba(255, 255, 255, 0) 6px,
            rgba(255, 255, 255, 0) 12px
          )`,
          backgroundSize: '24px 100%',
        }}
      />
    </div>
  );
}

// 4. BudgetMarker (预算位置标记线 + 小标签)
export function BudgetMarker({
  position,
  label,
  className = '',
}: {
  position: number;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`absolute top-0 bottom-0 z-20 flex flex-col items-center pointer-events-none ${className}`}
      style={{ left: `${position}%` }}
    >
      <div className="w-[1.5px] h-full bg-slate-400/80 border-l border-white/50" />
      {label && (
        <div className="absolute -top-3.5 -translate-x-1/2 bg-slate-800 text-white text-[8px] font-black px-1 rounded shadow-sm whitespace-nowrap">
          {label}
        </div>
      )}
    </div>
  );
}

// 5. VarianceTag (红/绿药丸，常驻显示在行右侧)
export function VarianceTag({
  actual,
  budget,
  type,
}: {
  actual: number;
  budget: number;
  type: 'revenue' | 'cost' | 'profit';
}) {
  const diff = actual - budget;
  let text = '';
  let isGood = true;

  if (type === 'cost') {
    isGood = diff <= 0;
    text = isGood
      ? `节省 ${Math.abs(diff).toFixed(0)}万 ✓`
      : `超支 ${diff.toFixed(0)}万 ▲`;
  } else if (type === 'revenue') {
    isGood = diff >= 0;
    text = isGood
      ? `超额 ${diff.toFixed(0)}万 ✓`
      : `缺款 ${Math.abs(diff).toFixed(0)}万 ▼`;
  } else {
    // profit
    isGood = diff >= 0;
    text = isGood
      ? `超额 ${diff.toFixed(0)}万 ✓`
      : `缺口 ${Math.abs(diff).toFixed(0)}万 ▼`;
  }

  const colors = isGood
    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-sm shadow-emerald-100/30'
    : 'bg-rose-50 text-rose-600 border border-rose-200/80 shadow-sm shadow-rose-100/30';

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-all ${colors}`}
    >
      {text}
    </span>
  );
}

// 6. RowLabel (行标签，左侧名称 + 实际/预算值数值，默认 w-72 宽度)
export function RowLabel({
  title,
  actual,
  budget,
  showBudget = true,
  isBold = false,
  onClickToggle,
  isExpanded = false,
  hasChildren = false,
  colorIndicator,
  className = 'w-72',
  plClass = 'pl-2',
}: {
  title: string;
  actual: number;
  budget?: number;
  showBudget?: boolean;
  isBold?: boolean;
  onClickToggle?: () => void;
  isExpanded?: boolean;
  hasChildren?: boolean;
  colorIndicator?: string;
  className?: string;
  plClass?: string;
}) {
  return (
    <div
      className={`${className} flex-shrink-0 flex items-center justify-between pr-2 select-none relative ${plClass}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClickToggle?.();
            }}
            className="w-4 h-4 flex items-center justify-center text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all cursor-pointer flex-shrink-0"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▶
          </button>
        ) : (
          <div className="w-4 flex-shrink-0" />
        )}
        {colorIndicator && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: colorIndicator }}
          />
        )}
        <span
          className={`text-xs truncate ${
            isBold ? 'font-black text-slate-800' : 'text-slate-600 font-bold'
          }`}
        >
          {title}
        </span>
      </div>
      <div className="text-[10px] font-mono font-bold text-slate-400 flex-shrink-0">
        <span className="text-slate-800 font-extrabold">{actual.toFixed(0)}万</span>
        {showBudget && budget !== undefined && (
          <>
            <span className="text-slate-300 mx-0.5">/</span>
            <span className="text-slate-500 font-medium">{budget.toFixed(0)}万</span>
          </>
        )}
      </div>
    </div>
  );
}

// 7. ExpandConnector (展开连接树状细线，支持指定绝对 left 位置)
export function ExpandConnector({
  isLast = false,
  color = '#cbd5e1',
  left = 16,
}: {
  isLast?: boolean;
  color?: string;
  left?: number;
}) {
  return (
    <div
      className="absolute top-0 bottom-0 w-4 pointer-events-none select-none"
      style={{ left: `${left - 8}px` }}
    >
      {/* 垂直主干 */}
      <div
        className="absolute left-1/2 top-0 w-[1px]"
        style={{
          backgroundColor: color,
          bottom: isLast ? '50%' : '0%',
        }}
      />
      {/* 水平分支 */}
      <div
        className="absolute left-1/2 top-[50%] w-[10px] h-[1px]"
        style={{
          backgroundColor: color,
        }}
      />
      {/* 分支末梢圆点 */}
      <div
        className="absolute left-[calc(50%+8px)] top-[calc(50%-1.5px)] w-[3px] h-[3px] rounded-full"
        style={{
          backgroundColor: color,
        }}
      />
    </div>
  );
}

// 8. SectionDivider (区域分隔线)
export function SectionDivider({ className = '' }: { className?: string }) {
  return <div className={`border-t border-slate-100 my-4 ${className}`} />;
}
