# Paperclip 前端优化总结

**日期**: 2026-05-18  
**范围**: i18n 国际化 + 前端性能优化 + Bug 修复

---

## 一、Bug 修复

### 1. i18n 语言切换不生效

**问题**: 底部切换到中文后，界面仍然显示英文。

**根因**: `i18next` 配置中设置了 `resources`（静态导入了英文翻译），但没有设置 `partialBundledLanguages: true`。i18next 认为"资源已经全部提供"，`changeLanguage` 时跳过了 backend 加载，`lazyBackend.read()` 从未被调用。

**修复**: 在 `src/locales/index.ts` 中添加：
```ts
partialBundledLanguages: true,
```

### 2. Org 页面崩溃

**问题**: 点击 Org 菜单，页面空白，Console 报 `Cannot read properties of undefined (reading 'length')`。

**根因**: `OrgChart.tsx` 的 `flattenLayout` 函数中误粘贴了一行 `const { t } = useTranslation("company")`——在普通函数里调 React Hook，违反 Hook 规则。

**修复**: 删除该行。

### 3. 生产构建删除 console 日志

**问题**: 调试时添加的 `console.log` 在生产环境不显示。

**根因**: `vite.config.ts` 配置了 `esbuild.drop: ["console", "debugger"]`。

**修复**: 调试时临时移除 `"console"`，调试完成后恢复。

---

## 二、全站国际化 (i18n)

### 架构

```
src/locales/
├── index.ts          # i18next 初始化 + lazyBackend
├── en/               # 英文翻译（静态导入，预打包）
│   ├── common.json
│   ├── nav.json
│   ├── dashboard.json
│   ├── inbox.json
│   ├── issues.json
│   ├── agents.json
│   └── ...
└── zh-CN/            # 中文翻译（lazy load，按需加载）
    ├── common.json
    ├── nav.json
    ├── dashboard.json
    └── ...
```

### 关键配置

- **`partialBundledLanguages: true`** — 允许 en 预打包 + zh-CN 懒加载共存
- **`lazyBackend`** — 自定义 i18next backend，用 `import()` 动态加载翻译文件
- **`LanguageDetector`** — 检测顺序: querystring (`?lang=`) → localStorage (`paperclip-lang`) → navigator
- **底部语言切换器** — `LanguageSwitcher` 组件，支持 🇺🇸 English / 🇨🇳 简体中文

### 新增 Namespace

原有 15 个 namespace，新增 4 个：
- `activity` — 活动页
- `inbox` — 收件箱
- `routines` — 例程
- `search` — 搜索页

### 已覆盖页面

Dashboard, DashboardLive, Inbox, Issues, Routines, Goals, Agents, NewAgent, Org, OrgChart, Projects, ProjectDetail, Costs, Activity, Secrets, Search, Workspaces, ProfileSettings, CompanySettings, CompanyAccess, CompanySkills, CompanyEnvironments, CompanyInvites, InstanceSettings, InstanceGeneralSettings, InstanceAccess, InstanceExperimentalSettings, AdapterManager, PluginManager, NotFound

### 待完善

部分深层组件（IssueDetail 详情页、AgentDetail 详情页、ProjectDetail tabs 等）仍有硬编码英文，需继续处理。

---

## 三、前端性能优化

### 问题

首次加载单个 JS 文件 **3.8MB**，加载耗时 5-6 分钟。

### 优化方案

#### 1. 路由级代码分割（React.lazy）

**修改文件**: `src/App.tsx`

将所有页面从静态 import 改为 `React.lazy()` 动态导入：

```ts
// 之前：静态导入（所有页面打包在一起）
import { Dashboard } from "./pages/Dashboard";
import { Inbox } from "./pages/Inbox";
// ... 50+ 个页面

// 之后：懒加载（每个页面独立 chunk）
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Inbox = lazy(() => import("./pages/Inbox").then(m => ({ default: m.Inbox })));
```

配合 `<Suspense fallback={<PageSkeleton />}>` 提供加载状态。

**效果**:

| 文件 | 大小 | 说明 |
|------|------|------|
| `index.js` (共享) | 2.4MB | React + 组件库 + vendor |
| `Dashboard.js` | 9KB | 首页 |
| `Agents.js` | 9KB | 智能体列表 |
| `OrgChart.js` | 9.5KB | 组织架构图 |
| `IssueDetail.js` | 190KB | 任务详情 |
| `mermaid.core.js` | 487KB | 仅 OrgChart 用 |
| `cytoscape.js` | 431KB | 仅 OrgChart 用 |

#### 2. 静态资源预压缩（Pre-gzip）

**修改文件**: `server/src/app.ts`

- 构建后对所有 JS/CSS 文件生成 `.gz` 预压缩文件
- Express 中间件检测 `Accept-Encoding: gzip`，优先返回 `.gz` 文件
- 保留 `Cache-Control: public, max-age=31536000, immutable` 长缓存

**效果**:

| 资源 | 原始大小 | gzip 后 | 压缩率 |
|------|----------|---------|--------|
| `index.js` | 2.4MB | 729KB | 70% |
| `mermaid.core.js` | 487KB | 136KB | 72% |
| `cytoscape.js` | 443KB | 138KB | 69% |

### 首屏加载对比

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 首屏需加载的 JS | 3.8MB（全部页面） | ~760KB（共享 + Dashboard） |
| 传输大小（gzip） | 3.8MB | ~760KB |
| 非首屏页面 | 同步加载 | 按需懒加载 |
| 静态资源缓存 | 1 年（immutable） | 1 年（immutable） |

---

## 四、文件变更清单

### 核心修改
- `ui/src/App.tsx` — 路由懒加载重构
- `ui/src/locales/index.ts` — i18n 配置修复 + 新 namespace
- `ui/src/components/LanguageSwitcher.tsx` — 语言切换器
- `ui/src/pages/OrgChart.tsx` — Hook 误用修复
- `ui/vite.config.ts` — 恢复 console drop
- `server/src/app.ts` — 预压缩静态文件支持

### 国际化文件
- `ui/src/locales/en/*.json` — 新增/更新 19 个英文翻译文件
- `ui/src/locales/zh-CN/*.json` — 新增/更新 19 个中文翻译文件

### 页面组件
- 27+ 个页面文件添加 `useTranslation` + `t()` 替换硬编码英文

---

## 五、后续建议

1. **继续完善 i18n** — IssueDetail、AgentDetail、ProjectDetail 等详情页仍有硬编码英文
2. **添加更多语言** — 架构已支持，添加新语言只需在 `locales/` 下加目录
3. **服务端渲染 (SSR)** — 如需进一步优化首屏，可考虑 SSR 方案
4. **HTTP/2** — 多 chunk 在 HTTP/2 下可并行加载，效果更好
5. **CDN** — 静态资源托管到 CDN 可大幅降低延迟
