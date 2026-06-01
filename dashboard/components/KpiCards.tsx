"use client";
import React from 'react';
import { TOTAL_REVENUE_BUDGET, TOTAL_COST_BUDGET, BUDGET_STRUCTURE } from './project-data';

interface Props {
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
}

function AnimatedValue({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  return (
    <span className="font-mono tabular-nums">
      {prefix}{value.toFixed(0)}{suffix}
    </span>
  );
}

function KpiCard({ title, value, subtitle, status, icon }: {
  title: string;
  value: React.ReactNode;
  subtitle: string;
  status: 'good' | 'warn' | 'danger' | 'neutral';
  icon: string;
}) {
  const statusColors = {
    good: 'bg-emerald-50/60 border-emerald-200/80 shadow-sm shadow-emerald-100/40',
    warn: 'bg-amber-50/60 border-amber-200/80 shadow-sm shadow-amber-100/40',
    danger: 'bg-rose-50/60 border-rose-200/80 shadow-sm shadow-rose-100/40',
    neutral: 'bg-slate-50/60 border-slate-200/80 shadow-sm shadow-slate-100/40',
  };
  const valueColors = {
    good: 'text-emerald-700',
    warn: 'text-amber-700',
    danger: 'text-rose-700',
    neutral: 'text-slate-800',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${statusColors[status]}`}>
      <div className="absolute -right-2 -top-2 text-4xl opacity-15 select-none">{icon}</div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</div>
      <div className={`text-2xl font-black mb-1 ${valueColors[status]}`}>{value}</div>
      <div className="text-[10px] text-slate-500 font-medium">{subtitle}</div>
    </div>
  );
}

export default function KpiCards(props: Props) {
  const { totalRevenue, totalCollection, totalCostAct, actualProfit, netCashFlow,
    contractProgress, collectionRate, isLoss, isFundingGap, isCostOverrun } = props;

  const cpi = totalCostAct > 0 ? totalRevenue / totalCostAct : 0;
  const costVariance = totalCostAct - TOTAL_COST_BUDGET;
  const profitVariance = actualProfit - BUDGET_STRUCTURE.pro;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      <KpiCard
        title="产值进度"
        value={<AnimatedValue value={contractProgress} suffix="%" />}
        subtitle={`确权 ${totalRevenue.toFixed(0)} / 合同 ${TOTAL_REVENUE_BUDGET}`}
        status={contractProgress >= 80 ? 'good' : contractProgress >= 50 ? 'neutral' : 'warn'}
        icon="📊"
      />
      <KpiCard
        title="收款率"
        value={<AnimatedValue value={collectionRate} suffix="%" />}
        subtitle={`已收 ${totalCollection.toFixed(0)} / 确权 ${totalRevenue.toFixed(0)}`}
        status={collectionRate >= 80 ? 'good' : collectionRate >= 60 ? 'warn' : 'danger'}
        icon="💰"
      />
      <KpiCard
        title="成本偏差"
        value={<AnimatedValue value={costVariance} prefix={costVariance >= 0 ? '+' : ''} />}
        subtitle={`实际 ${totalCostAct.toFixed(0)} / 预算 ${TOTAL_COST_BUDGET}`}
        status={isCostOverrun ? 'danger' : costVariance > -20 ? 'warn' : 'good'}
        icon="📉"
      />
      <KpiCard
        title="利润状态"
        value={<AnimatedValue value={actualProfit} />}
        subtitle={`${isLoss ? '亏损' : '盈利'} ${profitVariance >= 0 ? '+' : ''}${profitVariance.toFixed(0)}`}
        status={isLoss ? 'danger' : actualProfit < BUDGET_STRUCTURE.pro * 0.5 ? 'warn' : 'good'}
        icon={isLoss ? '🔴' : '✅'}
      />
      <KpiCard
        title="净现金流"
        value={<AnimatedValue value={netCashFlow} />}
        subtitle={isFundingGap ? '⚠ 资金垫付中' : '资金正常'}
        status={isFundingGap ? 'danger' : netCashFlow < 50 ? 'warn' : 'good'}
        icon={isFundingGap ? '📉' : '💎'}
      />
      <KpiCard
        title="CPI 成本绩效"
        value={<AnimatedValue value={cpi * 100} suffix="%" />}
        subtitle={cpi >= 1 ? '成本效率良好' : '成本超支'}
        status={cpi >= 1 ? 'good' : cpi >= 0.9 ? 'warn' : 'danger'}
        icon="⚡"
      />
    </div>
  );
}
