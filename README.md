# 穿透式工程项目管理图形化建模与价值—资金一体化驾驶舱 (V0.2)

> **基于“价值—资金一体化”管理理念构建的极简 3D 穿透式项目管理决策驾驶舱。**
> 本项目已全面升级为 **V0.2 3D 柱体引擎版本**。在上一版的基础上，我们彻底重构了底层图形渲染，引入了 **Next.js 16 (Webpack) + React 19 + TypeScript + 3D Capsule 极简图形引擎**，将挣值管理（EVM）与实际资金收付口径在统一视域中完成了极致的 3D 物理对齐与瀑布式穿透下钻。

系统内置 **极简里程碑仿真引擎**，支持对项目生命周期进行动态推演，帮助管理者一眼洞穿隐性债务与资金垫资风险。

---

## ✨ 核心特性 (Key Features)

在保留原有“双轨穿透”与“同轴叠加”宪法的基础上，V0.2 版本进行了重大的视觉与功能升级：

### 1. 双轨穿透视角 (Dual-Track View) ── [升级]
系统将复杂的工程财务数据解构为两条平行的穿透下钻轨道：
- **Track A (宏观/收支视角) · 单轴同轴对齐**：关注资金安全性。我们将业主视角的 **产出确权 (EV)** 与 **回款现金流 (In)** 合并到同一根 3D 柱轴中，并支持以下三层直角管道瀑布穿透：
  $$\text{合同总盘} \longrightarrow \text{阶段确权瀑布明细} \longrightarrow \text{关联单笔收款凭证}$$
- **Track B (微观/经营视角) · 级联穿透控制**：关注成本可控性。将成本拆解为 `材料`、`分包`、`其他`、`利润` 四大要素，并支持：
  $$\text{成本大类分类} \longrightarrow \text{对应供应商预算占比 (限制在3个以内)} \longrightarrow \text{供应商付款凭证}$$
  *支持排序切换*：可一键选择“按预算占比”或“按首次确权时间”对供应商进行瀑布展开与横向对齐排序。

### 2. 3D 同轴叠加可视化 (3D Coaxial Overlay) ── [重塑]
利用全新的极简 3D 柱体引擎与 Z-Index 层级策略，实现了物理反光级曲率圆柱体的同轴叠加渲染：
- **底槽 (Layer 0):** **预算控制槽 (`BudgetSlot`)**。代表授权边界，采用物理切削凹陷的 3D 沟槽质感。
- **中体 (Layer 1):** **物理进度确权/实际成本 (`CylinderCapsule`)**。代表实际完成工作量，呈现镜面光泽的 3D 半透明玻璃滑柱体。
- **顶层 (Layer 2):** **资金流向 (`HatchedFlow`)**。代表实际支付，白色斜线以**无限循环向右流动的液态微动画**形式叠加于实色条内部，完美呈现“资金被实框包着”的穿透美学。
> **视觉隐喻:** 当流动的“资金液体”短于“进度实柱”时，裸露的部分极为直观地呈现出 **“资金缺口 (Funding Gap / 垫资区)”**。

### 3. 极简里程碑仿真引擎 (Sparse Simulation Engine) ── [优化]
为了避免多余数据的视觉干扰，仿真引擎从 30 个月琐碎流水精简为**精准适配三大项目里程碑**的清爽数据流：
- **三大阶段:** 精确对接 `正负零地下室完工 (30%)`、`主体结构封顶 (50%)`、`竣工验收 (20%)`。
- **供应商控制:** 每个大类项下的供应商严格限制在 3 家以内。
- **财务联动:** 自动生成与这三大里程碑节点时间、金额、收付率严格对应的 3 次确权与最多 3 次收付款流水。

### 4. 深度交互设计与浮动时间机器 ── [新增]
- **自适应悬浮演练条 (`Sticky Slider Bar`)**：演练控制面板升级为 `sticky top-4 z-40` 的高档毛玻璃玻片。向下滚动页面时，进度条会轻盈滑行并吸附在视口顶部，极易随时点按。
- **浮动微型玻片 Tooltip**：鼠标在 Bar 上滑动时，高光双边框的悬浮 Tooltip 紧密跟随指针，瞬时展示该节点的控制预算、实际确权、现金流和对应占比。
- **滑入高亮徽章 (`Glowing Label Badge`)**：鼠标移入行时，左侧 label 文字亮起，并平滑展现发光的马卡龙色状态标签（如 `回笼 85%`、`用毕 105%`）。

---

## 🎨 3D Minimalist Graphic Engine (三维极简图形引擎) ── [V0.2 新增]

为了在浅色大屏模式下实现精致的物理触感，V0.2 引入了 **3D 极简图形引擎 (`PenetrativeGraphicEngine.tsx`)**。它利用纯 CSS/Tailwind 配合曲面反射公式，在 2D 页面上重塑了 3D 工业滑轨的美学：

*   **物理切削凹槽卡槽 (`BudgetSlot`)**：使用 `rounded-full` 胶囊倒角与双层内阴影（`shadow-[inset_0_3px_5px_rgba(15,23,42,0.08)]`），配合亮白反射 Bevel 边缘，呈现出在实体面板上物理刻入的凹陷轨道。
*   **3D 半透明玻璃滑柱 (`CylinderCapsule`)**：两端采用球形胶囊过渡。内置圆柱面渐变遮罩 `CYLINDER_REFLECTION` 与 upper edge `bg-white/45 blur-[0.5px]`Specularity 高光亮丝，极具半透明圆柱玻璃体的漫反射质感。
*   **斜纹液态流动 3D 条 (`HatchedFlow`)**：对现金流斜线层注入 CSS `flowStripes` 动画，展现**资金在管道内缓缓流动的滑润微动画**；同时在其最右侧边缘设有呼吸发光的**荧光激光端点指示灯**。
*   **工业管路直角接线器 (`TreePipeConnector`)**：采用直角反光金属管道连线，并在直角折弯处镶嵌了一枚**微光 LED 状态指示圆珠**，强化多级穿透时的“通电导通感”。

---

## 🛠 技术栈 (Tech Stack)

*   **Core Framework:** [Next.js 16](https://nextjs.org/) (App Router) ── **[升级]**
*   **React Version:** React 19 ── **[升级]**
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Theme:** Premium Light Mode (浅色极简画卷模式) ── **[重构]**
*   **3D Graphics:** Custom 3D CSS-based Graphics Engine (`PenetrativeGraphicEngine.tsx`) ── **[新增]**

---

## 📂 项目结构 (Project Structure) ── [更新]

```text
dashboard/
├── app/
│   ├── globals.css         # 全局 Light Mode 变量与 thin 滚动条定制
│   ├── layout.tsx          # HTML 骨架与 Google Fonts Outfit 字体预加载
│   └── page.tsx            # dynamic(ssr: false) 安全水合防护网（规避 React 19 水合死穴）
├── components/
│   ├── project-data.ts     # [Model] 3 Milestone 极简仿真引擎、供应商定义
│   ├── PenetrativeGraphicEngine.tsx # [Engine] 3D 图形引擎 (凹槽/胶囊/管线/LED珠)
│   ├── PenetrativeBarChart.tsx      # [View] 核心 3D 双轴对齐下钻穿透瀑布图表
│   ├── KpiCards.tsx        # [View] 核心 KPI 看板 (CPI/SPI/净现金)
│   ├── RiskAlertPanel.tsx  # [View] 智能穿透风险告警面板
│   ├── ProjectSelector.tsx # [View] 场景切换器 (标准/超支/亏损/资金紧张)
│   ├── ProjectTrendCharts.tsx     # [View] EVM 与现金流趋势 SVG 绘制
│   └── ProjectDataTable.tsx       # [View] 详细数据网格与指标计算
├── package.json
└── tsconfig.json
```

---

## 🧠 核心逻辑与算法 (Core Logic)

### 1. 视觉层级宪法 (Z-Index & Nesting Hierarchy) ── [优化]
为了在 2D 平面上处理深度的嵌套与遮挡关系，`PenetrativeBarChart.tsx` 协同 3D 引擎定义了严格的 3D 嵌套秩序：

| 层级 (Layer) | 嵌套卡片 / 组件 | Base Z-Index | 视觉隐喻与 3D 质感表现 |
| :--- | :--- | :--- | :--- |
| **Hover Active** | **悬浮 Micro-Tooltip 玻片** | **50** | 双层边框毛玻璃高反光悬浮卡片，跟随指针 |
| **LED Junction** | **管路接线器 LED 珠** | **40** | 直角折线转弯处的状态发光点，强化导通感 |
| **L2 Flow** | **现金流流动液 (`HatchedFlow`)** | **30** | 无限滚动斜纹流体，右边缘伴随脉冲呼吸光 |
| **L1 Capsule** | **实际确权柱 (`CylinderCapsule`)** | **10** | 3D 圆柱漫反射实体，滑入触发 `scale-y-[1.08]` |
| **L0 Slot** | **预算控制槽 (`BudgetSlot`)** | **0** | 背景双内阴影凹陷卡槽，内置虚线金属滑道 |
| **Level 2 Box** | **付款交易级卡片** | **-** | 包裹于软灰卡内部的**纯白圆角胶囊卡片**，配合呼吸留白 |
| **Level 1 Box** | **一阶供应商级卡片** | **-** | 包裹于顶层下方的**软灰内凹卡片** (`bg-slate-50 border-dashed`) |

### 2. 关键经营指标计算 (Metrics)

| 指标名称 | 变量名 | 计算公式 | 触发警示 |
| :--- | :--- | :--- | :--- |
| **实际利润** | `actualProfit` | `Total Revenue (EV) - Total Actual Cost` | **< 0** 触发全红亏损告警 |
| **净现金流** | `netCashFlow` | `Total Collection - Total Payment` | **< 0** 触发黑色垫资预警 |
| **成本偏差** | `variance` | `Actual Cost [item] - Budget [item]` | **> 0** 触发橙色超支警告 |
| **收款率** | `collectionRate` | `(Collection / Revenue) * 100` | **< 80%** 提示回款滞后 |

---

## 🚀 快速开始 (Getting Started)

### 安装依赖

```bash
git clone https://github.com/amonzhang/project-penetrative-dashboard.git
cd project-penetrative-dashboard/dashboard
npm install
```

### 启动开发服务器 (推荐使用 Webpack 稳定编译)

```bash
npm run dev
```

打开浏览器访问 `http://localhost:3000` 即可看到驾驶舱界面。

### 操作指南
1.  **里程碑演练**: 点击顶部 **"▶ 演练"** 按钮，启动 3 Milestone 动态演练。
2.  **向下滚动页面**: 观察时间机器控制条优雅地吸附悬浮在顶部 `sticky` 区域。
3.  **多级展开穿透**: 
    *   点击 Track A 的 "确权与收款"，向下展开 3 个里程碑确权条，进一步点击折角箭头，直角管道与 LED 珠自动导通，展现单笔收款明细。
    *   点击 Track B 的 "材料成本"，展开看 3 家供应商，进一步展开看付款凭证，观察“纯白 row $\rightarrow$ 软灰卡 $\rightarrow$ 纯白胶囊”的套盒嵌套留白美学。
4.  **排序推演**: 切换 Track B 右上角排序按钮，观察供应商依“预算占比”或“首次确权先后”发生的瀑布对齐变化。

---

## 🔭 下一步开发计划 (Roadmap)

基于目前的 **3D Capsule 极简图形引擎** 核心架构与 **里程碑仿真 (Simulation)** 能力，后续开发将聚焦于从“演示原型”向“企业级实战工具”的演进。

### 1. 数据接入与后端集成 (Data Integration)
- [ ] **Excel/CSV 导入适配器**: 允许用户直接上传标准的《工程进度确权表》与《财务收支明细表》，自动解析并清洗数据。
- [ ] **ERP 接口对接**: 开发 RESTful API，对接系统，实时同步 `transactions` 流水。
- [ ] **自定义预算结构 (WBS)**: 将目前固定的 `mat/sub/oth` 预算结构改为动态配置，支持多级 WBS 的无限下钻。

### 2. AI 预测与智能预警 (AI & Predictive Analytics)
- [ ] **现金流压力测试 (Stress Test)**: 基于历史回款账期（如平均滞后 2.5 个月），预测未来 3 个月的资金缺口，提前 90 天发出“黑色纹理”垫资预警。
- [ ] **成本完工预测 (EAC)**: 根据当前的 CPI (成本绩效指数)，动态预测项目完工时的最终成本，判断是否会击穿 `TOTAL_COST_BUDGET`。
- [ ] **智能归因分析**: 当利润条变红时，AI 自动分析是哪一类材料（如电缆价格波动）还是哪一家分包商导致了亏损。

### 3. 交互深度拓展 (Advanced Interaction)
- [ ] **单据溯源**: 点击半透明的“资金纹理条”，弹窗展示构成该笔付款的具体财务凭证或发票扫描件。
- [ ] **沙盘推演模式 (What-if Analysis)**: 允许管理者手动调整参数（例如：“如果下个月电缆涨价 10%，利润会剩多少？”），实时重绘图表。

### 4. 企业级功能 (Enterprise Features)
- [ ] **多项目看板 (Portfolio View)**: 增加“地图模式”，在一个屏幕上监控集团下属多个项目的健康度（通过颜色红/绿/黑快速筛选）。
- [ ] **协作批注**: 支持在时间轴的特定节点（如“资金断裂点”）添加注释并 @相关责任人。
  
---

© 2026 Project Penetrative Dashboard. All Rights Reserved.
