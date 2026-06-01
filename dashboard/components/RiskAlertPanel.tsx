"use client";
import React from 'react';

interface Props {
  isLoss: boolean;
  isFundingGap: boolean;
  isCostOverrun: boolean;
  isCollectionLagging: boolean;
  actualProfit: number;
  netCashFlow: number;
  totalCostAct: number;
  totalCostBudget: number;
  collectionRate: number;
}

interface RiskItem {
  level: 'info' | 'warn' | 'danger' | 'critical';
  title: string;
  desc: string;
  action: string;
  icon: string;
}

export default function RiskAlertPanel(props: Props) {
  const { isLoss, isFundingGap, isCostOverrun, isCollectionLagging,
    actualProfit, netCashFlow, totalCostAct, totalCostBudget, collectionRate } = props;

  const risks: RiskItem[] = [];

  if (isLoss) {
    risks.push({
      level: 'critical', icon: '🔴',
      title: '项目亏损预警',
      desc: `当前利润 ${actualProfit.toFixed(0)} 万元，项目已进入亏损状态`,
      action: '建议立即启动成本审计，评估变更索赔可能性'
    });
  }

  if (isFundingGap) {
    risks.push({
      level: 'danger', icon: '💸',
      title: '资金垫付风险',
      desc: `净现金流 ${netCashFlow.toFixed(0)} 万元，付款已超过收款`,
      action: '建议加速催收应收款项，协调付款节奏'
    });
  }

  if (isCostOverrun) {
    risks.push({
      level: 'warn', icon: '⚠️',
      title: '成本超支预警',
      desc: `实际成本 ${totalCostAct.toFixed(0)} 万元，超出预算 ${(totalCostAct - totalCostBudget).toFixed(0)} 万元`,
      action: '建议逐项排查超支原因，制定纠偏措施'
    });
  }

  if (isCollectionLagging) {
    risks.push({
      level: 'warn', icon: '🐢',
      title: '收款滞后',
      desc: `收款率仅 ${collectionRate.toFixed(0)}%，低于 80% 安全线`,
      action: '建议核实合同收款条件，推动业主审批流程'
    });
  }

  if (risks.length === 0) {
    risks.push({
      level: 'info', icon: '✅',
      title: '项目运行正常',
      desc: '各项指标处于安全区间，继续保持当前管理节奏',
      action: '建议关注下一里程碑节点的资源准备'
    });
  }

  const levelStyles: Record<string, string> = {
    info: 'border-emerald-200 bg-emerald-50/50 shadow-sm shadow-emerald-50/30',
    warn: 'border-amber-200 bg-amber-50/50 shadow-sm shadow-amber-50/30',
    danger: 'border-rose-200 bg-rose-50/50 shadow-sm shadow-rose-50/30',
    critical: 'border-red-200 bg-red-50/50 ring-1 ring-red-200 shadow-md shadow-red-50/30',
  };
  const levelTextColors: Record<string, string> = {
    info: 'text-emerald-800',
    warn: 'text-amber-800',
    danger: 'text-rose-800',
    critical: 'text-red-900',
  };

  return (
    <div className="mb-8">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-rose-500 rounded-full shadow-sm"></span>
        风险预警
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {risks.map((risk, i) => (
          <div key={i} className={`rounded-xl border p-4 transition-all duration-300 hover:scale-[1.01] ${levelStyles[risk.level]}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0 mt-0.5">{risk.icon}</span>
              <div className="min-w-0">
                <div className={`text-sm font-black mb-1 ${levelTextColors[risk.level]}`}>{risk.title}</div>
                <div className="text-xs text-slate-600 mb-2 font-medium">{risk.desc}</div>
                <div className="text-xs text-slate-500 italic">💡 {risk.action}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
