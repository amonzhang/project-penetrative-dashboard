# 穿透式工程项目管理图形化建模与价值—资金一体化驾驶舱 (V0.3)

> **基于“价值—资金一体化”管理理念构建的极简、对齐、穿透式项目管理决策驾驶舱。**
> 本项目已全面升级为 **V0.3 统一轴线对齐单图版**。在上一版的基础上，我们彻底重构了图表排版，将业主视角（收入）与内部经营视角（成本）合并进**同一张图表并共享唯一水平坐标轴 (0 ~ 1000万)**。
> 同时，我们引入了精密的 **w-72 绝对宽度标签列 + 绝对定位树连线** 的高质感布局，彻底解决了一至三级树状展开后进度条错位对不齐的顽疾，实现了像素级的垂直线绝对对齐。

系统内置 **极简里程碑仿真引擎**，支持对项目生命周期进行动态推演，帮助管理者一眼洞穿隐性债务与资金垫资风险。

---

## ✨ 核心特性 (Key Features)

在保留原有“同轴叠加”和“三级穿透”的管理逻辑基础上，V0.3 版本进行了重大重构与体验优化：

### 1. 统一水平标尺单图 (Unified Single-Scale Axis View) ── [重构]
我们将 Track A（业主确权与回款）和 Track B（内部经营成本与付款）合并为同一张图，共享顶层 `0 — 300万 — 700万 — 800万 — 1000万` 的标尺刻度：
*   **材料成本**：对齐在 `0 ~ 300万` 的区间轨道（占 30% 预算）。
*   **分包成本**：对齐在 `300 ~ 700万` 的区间轨道（占 40% 预算）。
*   **其他成本**：对齐在 `700 ~ 800万` 的区间轨道（占 10% 预算）。
*   **项目实际利润**：对齐在 `800 ~ 1000万` 的区间轨道（占 20% 预算）。
*   **业主总确权与回款**：在 `0 ~ 1000万` 的全量区间中平铺展示。
> **管理价值**：任何人都能通过在任意点画一条垂直竖线，直接看清这一时间点上确权收入与各项成本支出、付款进度的对比，轻松发现问题。

### 2. 现代极简图形引擎 (Minimalist Graphic Engine) ── [升级]
删除了旧版复杂的 3D 圆柱与闪烁，代之以更符合扁平微质感、数据清晰易读的现代组件库 (`PenetrativeGraphicEngine.tsx`)：
*   **底座槽轨道 (`BulletTrack`)**：代表授权预算边界，采用柔和的浅灰色（`#f1f5f9`）与细致内阴影。
*   **实际值进度条 (`ActualBar`)**：代表实际完成产值或发生成本。在预算正常范围内呈现对应类别色，一旦超出预算，**溢出部分会自动呈呼吸脉冲红色**，直观显示超支。
*   **资金收付流 (`CashFlowBar`)**：代表实际回款或付款。以高度 60% 的绿色半透明流体叠放在实际条上方，内置流速斜纹，动态体现真金白银的液态流动。
*   **预算控制卡点 (`BudgetMarker`)**：在各个预算交界处绘制刚性刻度虚线。
*   **常驻差异标签 (`VarianceTag`)**：在行右侧永久展示“超支/节省/缺口”红绿药丸状态，直观计算。

### 3. 三级瀑布式穿透下钻 (3-Level Deep Drill-Down)
*   **业主收入链条**：`工程总承包确权 ──> 里程碑确权瀑布明细 ──> 关联单笔收款凭证`
*   **内部成本链条**：`大类成本 (材料/分包/其他) ──> 供应商预算占比 ──> 供应商付款凭证`
*   *供应商排序*：支持“按预算占比”或“按首次发生先后”进行瀑布横向对齐排序。

### 4. 像素级垂直对齐机制 (Pixel-Perfect Alignment) ── [新增]
*   **固定宽度标签列**：所有层级的行标签强制设置为 `w-72`（288px），将子级缩进限定在标签内部（Level 2 `pl-6`，Level 3 `pl-12`），使得进度条容器起点不受行内收缩影响，全屏绝对对准。
*   **绝对定位连接线 (`ExpandConnector`)**：树形分支线改在标签列内部绝对定位（Level 2 位于 `left={16}`，Level 3 位于 `left={32}`），并在未闭合节点上补全父级垂直连线，还原精密美观的管线系统。

---

## 🛠 技术栈 (Tech Stack)

*   **Core Framework:** [Next.js 16](https://nextjs.org/) (App Router)
*   **React Version:** React 19
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Theme:** Premium Light Mode (浅色极简画卷模式)
*   **Graphics Engine:** Custom Custom CSS/SVG Engine (`PenetrativeGraphicEngine.tsx`)

---

## 📂 项目结构 (Project Structure)

```text
dashboard/
├── app/
│   ├── globals.css         # 全局 Light Mode 变量与 thin 滚动条定制
│   ├── layout.tsx          # HTML 骨架与 Google FontsOutfit 字体预载
│   └── page.tsx            # dynamic(ssr: false) 安全水合防护网
├── components/
│   ├── project-data.ts     # [Model] 3 Milestone 仿真数据与供应商关系
│   ├── PenetrativeGraphicEngine.tsx # [Engine] 图形库 (底槽/实际条/现金流/树线)
│   ├── PenetrativeBarChart.tsx      # [View] 核心统一标尺同轴对齐一览图表
│   ├── KpiCards.tsx        # [View] 核心 KPI 看板 (CPI/SPI/净现金)
│   ├── RiskAlertPanel.tsx  # [View] 智能穿透风险告警面板
│   ├── ProjectSelector.tsx # [View] 仿真场景切换器
│   ├── ProjectTrendCharts.tsx     # [View] EVM 与现金流趋势 SVG 绘制
│   └── ProjectDataTable.tsx       # [View] 详细数据表格网格
├── package.json
└── tsconfig.json
```

---

## 🧠 核心业务指标计算 (Metrics)

| 指标名称 | 计算公式 | 触发警示 |
| :--- | :--- | :--- |
| **实际利润** | `Total Revenue (EV) - Total Actual Cost` | **< 0** 触发亏损告警 |
| **净现金流** | `Total Collection - Total Payment` | **< 0** 触发垫资预警 |
| **成本偏差** | `Actual Cost [item] - Budget [item]` | **> 0** 触发超支警告 |
| **收款率** | `(Collection / Revenue) * 100` | **< 80%** 提示回款滞后 |

---

## 🚀 快速开始 (Getting Started)

### 安装依赖
在 `dashboard` 目录下安装所有 npm 依赖包：
```bash
cd dashboard
npm install
```

### 启动开发服务器
使用 Webpack 稳定编译启动开发服务器：
```bash
npm run dev
```

### 生产环境构建验证
打包生成高度优化的静态分发生产包：
```bash
npm run build
```

---

© 2026 Project Penetrative Dashboard. All Rights Reserved.
