// components/project-data.ts
// ───────────────────────────────────────────────────
// 穿透式项目管理 — 数据模型 + 仿真引擎
// ───────────────────────────────────────────────────

// ── 基础类型 ──────────────────────────────────────

export type SegmentKey = 'mat' | 'sub' | 'oth' | 'pro';
export const COST_KEYS: SegmentKey[] = ['mat', 'sub', 'oth'];
export const SEGMENT_KEYS: SegmentKey[] = ['mat', 'sub', 'oth', 'pro'];

export const BUDGET_STRUCTURE: Record<SegmentKey, number> = {
  mat: 300, sub: 400, oth: 100, pro: 200,
};

export const TOTAL_COST_BUDGET = COST_KEYS.reduce((s, k) => s + BUDGET_STRUCTURE[k], 0);
export const TOTAL_REVENUE_BUDGET = 1000;

export const NAMES: Record<SegmentKey, string> = {
  mat: '材料成本', sub: '分包成本', oth: '其他成本', pro: '内部利润',
};

// 每个成本段在全轴上的起始锚点 (百分比)
let _pos = 0;
export const ANCHORS: Record<string, number> = {};
SEGMENT_KEYS.forEach(k => {
  ANCHORS[k] = (_pos / TOTAL_REVENUE_BUDGET) * 100;
  _pos += BUDGET_STRUCTURE[k];
});

export const COLORS = {
  cool: { mat: '#38bdf8', sub: '#4f46e5', oth: '#818cf8', pro: '#0d9488' } as Record<string, string>,
  warm: { overrun: '#f97316', loss: '#e11d48' } as Record<string, string>,
  dark: { revenue: '#1e3a8a', fundingGap: '#334155' },
};

export const hexToRgba = (hex: string, alpha: number) => {
  if (!hex) return 'rgba(0,0,0,0)';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

// ── 项目场景 ──────────────────────────────────────

export interface ProjectScenario {
  id: string;
  name: string;
  desc: string;
  icon: string;
  budgetStructure: Record<SegmentKey, number>;
  totalRevenue: number;
  costFactor: [number, number];
  revFactor: [number, number];
}

export const PROJECT_SCENARIOS: ProjectScenario[] = [
  { id: 'normal',  name: '标准项目', desc: '成本可控、回款正常', icon: '🏗️',
    budgetStructure: { mat: 300, sub: 400, oth: 100, pro: 200 }, totalRevenue: 1000,
    costFactor: [0.85, 0.95], revFactor: [0.95, 1.02] },
  { id: 'overrun', name: '超支项目', desc: '材料涨价导致成本超支', icon: '⚠️',
    budgetStructure: { mat: 300, sub: 400, oth: 100, pro: 200 }, totalRevenue: 1000,
    costFactor: [1.15, 1.25], revFactor: [0.90, 0.98] },
  { id: 'loss',    name: '亏损项目', desc: '严重超支+收入缩水', icon: '🔴',
    budgetStructure: { mat: 300, sub: 400, oth: 100, pro: 200 }, totalRevenue: 1000,
    costFactor: [1.30, 1.45], revFactor: [0.75, 0.82] },
  { id: 'cashgap', name: '资金紧张', desc: '回款严重滞后', icon: '💸',
    budgetStructure: { mat: 300, sub: 400, oth: 100, pro: 200 }, totalRevenue: 1000,
    costFactor: [0.90, 1.05], revFactor: [0.60, 0.70] },
];

// ── 供应商定义 (控制在最多3家供应商以内) ────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  category: SegmentKey;
  budgetShare: number;    // 占该类别预算比例 (0~1)
  budgetAmount: number;   // = budgetShare × BUDGET_STRUCTURE[category]
}

const mkSup = (
  cat: SegmentKey,
  defs: { id: string; name: string; share: number }[],
): Supplier[] =>
  defs.map(d => ({
    id: d.id,
    name: d.name,
    category: cat,
    budgetShare: d.share,
    budgetAmount: Math.round(d.share * BUDGET_STRUCTURE[cat]),
  }));

export const SUPPLIERS: Record<SegmentKey, Supplier[]> = {
  mat: mkSup('mat', [
    { id: 'mat-1', name: '光缆/线材厂', share: 0.45 },
    { id: 'mat-2', name: '设备供应商', share: 0.35 },
    { id: 'mat-3', name: '辅材贸易商', share: 0.20 },
  ]),
  sub: mkSup('sub', [
    { id: 'sub-1', name: '管道工程队', share: 0.40 },
    { id: 'sub-2', name: '设备安装商', share: 0.35 },
    { id: 'sub-3', name: '机电调试商', share: 0.25 },
  ]),
  oth: mkSup('oth', [
    { id: 'oth-1', name: '迁改补偿办', share: 0.50 },
    { id: 'oth-2', name: '劳务分包社', share: 0.30 },
    { id: 'oth-3', name: '现场杂项部', share: 0.20 },
  ]),
  pro: [],
};

// ── 交易 & 快照类型 ──────────────────────────────

export type TxType = 'cost_act' | 'cost_cash' | 'rev_act' | 'rev_cash';

export interface Transaction {
  txId: string;
  date: string;
  type: TxType;
  category?: SegmentKey;
  amount: number;
  desc: string;
  supplierId?: string;   // cost 交易所属供应商
  linkedTxId?: string;    // rev_cash → 关联 of rev_act txId
}

export interface SnapshotState {
  act: Record<SegmentKey, number>;
  cash: Record<SegmentKey, number>;
  ev: number;
  in: number;
}

// ── 仿真引擎 (确权与收款限制在最多3次以内) ─────────────────────────────────────

export const generateRandomData = (scenarioId: string = 'normal'): Transaction[] => {
  let txSeq = 0;
  const nextId = (prefix: string) => `${prefix}-${String(++txSeq).padStart(4, '0')}`;

  const scen = PROJECT_SCENARIOS.find(s => s.id === scenarioId) || PROJECT_SCENARIOS[0];
  const costFactor = scen.costFactor[0] + Math.random() * (scen.costFactor[1] - scen.costFactor[0]);
  const revFactor  = scen.revFactor[0]  + Math.random() * (scen.revFactor[1]  - scen.revFactor[0]);
  const collectRate = scenarioId === 'cashgap' ? 0.50 : 0.85;

  const list: Transaction[] = [];

  // ── 1. 确权 & 收款：精确限定为 3 次 ──
  // 确权 1: 正负零 (30%)
  const revAmt1 = 300 * revFactor;
  const ra1Id = nextId('ra');
  list.push({
    txId: ra1Id,
    date: '2024-06-30',
    type: 'rev_act',
    amount: revAmt1,
    desc: '一期确权 (正负零阶段)',
  });

  // 收款 1: 正负零回款
  const rc1Id = nextId('rc');
  list.push({
    txId: rc1Id,
    date: '2024-08-20',
    type: 'rev_cash',
    amount: revAmt1 * collectRate,
    desc: '一期工程款回笼',
    linkedTxId: ra1Id,
  });

  // 确权 2: 主体封顶 (50%)
  const revAmt2 = 500 * revFactor;
  const ra2Id = nextId('ra');
  list.push({
    txId: ra2Id,
    date: '2025-06-30',
    type: 'rev_act',
    amount: revAmt2,
    desc: '二期确权 (主体封顶阶段)',
  });

  // 收款 2: 封顶回款
  const rc2Id = nextId('rc');
  list.push({
    txId: rc2Id,
    date: '2025-08-20',
    type: 'rev_cash',
    amount: revAmt2 * collectRate,
    desc: '二期工程款回笼',
    linkedTxId: ra2Id,
  });

  // 确权 3: 竣工验收 (20%)
  const revAmt3 = 200 * revFactor;
  const ra3Id = nextId('ra');
  list.push({
    txId: ra3Id,
    date: '2026-06-30',
    type: 'rev_act',
    amount: revAmt3,
    desc: '三期确权 (竣工验收阶段)',
  });

  // 收款 3: 结算尾款
  const rc3Id = nextId('rc');
  list.push({
    txId: rc3Id,
    date: '2026-11-20',
    type: 'rev_cash',
    amount: revAmt3 * collectRate,
    desc: '竣工尾款清算',
    linkedTxId: ra3Id,
  });


  // ── 2. 成本端：供应商同样精确限制在 3 个阶段 ──
  // 阶段权重
  const phaseWeights = [0.3, 0.5, 0.2];
  const phaseDates = [
    { act: '2024-05-15', cash: '2024-07-10' }, // 对应一期
    { act: '2025-05-15', cash: '2025-07-10' }, // 对应二期
    { act: '2026-05-15', cash: '2026-07-10' }, // 对应三期
  ];

  COST_KEYS.forEach(cat => {
    const sups = SUPPLIERS[cat] || [];
    const paymentRatio = cat === 'mat' ? 0.6 : cat === 'sub' ? 0.7 : 1.0;

    sups.forEach(sup => {
      // 供应商总预算
      const supBudget = sup.budgetAmount * costFactor;

      // 分成3期产生实际成本与现金付款
      phaseWeights.forEach((weight, pi) => {
        const actAmt = supBudget * weight;
        const payAmt = actAmt * paymentRatio;
        const dateConf = phaseDates[pi];

        const phaseNames = ['首期', '中期', '尾款'];

        // 实际成本发生 (实框)
        list.push({
          txId: nextId('ca'),
          date: dateConf.act,
          type: 'cost_act',
          category: cat,
          amount: actAmt,
          desc: `${phaseNames[pi]}成本-${sup.name}`,
          supplierId: sup.id,
        });

        // 现金付款发生 (阴影框)
        if (payAmt > 0) {
          list.push({
            txId: nextId('cc'),
            date: dateConf.cash,
            type: 'cost_cash',
            category: cat,
            amount: payAmt,
            desc: `付-${phaseNames[pi]}${sup.name}`,
            supplierId: sup.id,
          });
        }
      });
    });
  });

  // 按日期排序
  return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const INITIAL_DATA = generateRandomData();

// ── 时间轴 ───────────────────────────────────────

export interface TimePoint {
  label: string;
  date: string;
  desc: string;
}

export const generateMonthPoints = (): TimePoint[] => {
  const arr: TimePoint[] = [];
  for (let i = 0; i < 36; i++) {
    const d = new Date(2024, i, 1);
    const y = d.getFullYear();
    const mo = d.getMonth() + 1;
    const last = new Date(y, mo, 0).getDate();
    const ds = `${y}-${String(mo).padStart(2, '0')}-${last}`;
    let label = `${mo}月`;
    if (i === 0) label = '开工前';
    else if (mo === 1) label = `${y}年`;
    arr.push({ label, date: ds, desc: `${y}年${mo}月` });
  }
  return arr;
};

export const STATIC_MILESTONES: TimePoint[] = [
  { label: '🏁 开工',   date: '2024-01-01', desc: '项目启动' },
  { label: '🚩 正负零', date: '2024-06-30', desc: '地下室完工' },
  { label: '🚩 中期',   date: '2025-03-31', desc: '工程过半' },
  { label: '🏠 封顶',   date: '2025-09-30', desc: '主体完工' },
  { label: '✅ 验收',   date: '2026-06-30', desc: '竣工验收' },
  { label: '💰 结算',   date: '2026-12-31', desc: '审计定稿' },
];
