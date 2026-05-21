# Paperclip 中文化状态与部署计划

**生成日期**: 2026-05-21  
**当前分支**: `feat/i18n`（基于 `master`，已合并 `feat/ready-to-use`）

---

## 一、中文化过程问题总结

### 1.1 遇到的问题

| # | 问题 | 根因 | 状态 |
|---|------|------|------|
| 1 | **语言切换不生效** — 切换到中文后界面仍显示英文 | `i18next` 配置缺少 `partialBundledLanguages: true`，导致 lazy backend 不被触发 | ✅ 已修复 |
| 2 | **Org 页面崩溃** — `Cannot read properties of undefined` | `OrgChart.tsx` 的 `flattenLayout` 普通函数里误调了 `useTranslation` Hook | ✅ 已修复 |
| 3 | **Agent 页面 Symbol 报错** — `Cannot convert a Symbol value to a string` | `agent-config-primitives.tsx` 的 Proxy `get` trap 在接收 Symbol key 时直接做模板字符串拼接 | ✅ 已修复（5/21） |
| 4 | **Agent 详情页 Hooks 顺序错误** — `Rendered more hooks than during the previous render` | `LatestRunCard` 组件在 `if (runs.length === 0) return null` 提前 return 后面还有 `useMemo`，违反 React Hooks 规则 | ✅ 已修复（5/21） |
| 5 | **生产环境 console 被删** — Vite 配置了 `esbuild.drop: ["console"]` | 调试时需要临时移除，调试完恢复 | ✅ 已处理 |
| 6 | **首次加载 3.8MB JS** — 首屏加载极慢 | 所有页面静态打包，无代码分割 | ✅ 已通过 React.lazy + 路由级分割优化至 ~760KB |

### 1.2 问题分类与教训

**类型 A — i18n 集成问题**
- i18next 的 `partialBundledLanguages` 是关键配置，必须显式启用
- 自定义 Proxy/对象要处理 Symbol 类型的 key（`typeof key === "symbol"` 检查）
- **教训**：在涉及 Reflect/Metadata 的场景，Symbol key 是常见的边界情况

**类型 B — React Hooks 误用**
- 在非组件函数中调 Hook（OrgChart）
- 在条件 return 后调 Hook（AgentDetail）
- **教训**：中文化批量添加 `useTranslation` 时要特别注意 Hook 的位置规则，IDE 的 linter 规则应启用 `react-hooks/rules-of-hooks`

**类型 C — 性能问题**
- 首次打包 3.8MB，代码分割后降至 ~760KB
- 预 gzip 压缩进一步减少传输量 70%
- **教训**：大型 React 项目应在架构初期就规划代码分割，而非后期补做

### 1.3 后续中文化建议

1. **未翻译的页面**（约 12 个文件，共 ~10,000 行代码）：
   - `IssueDetail.tsx` (4,192 行) — 最大的未翻译页面
   - `Secrets.tsx` (2,156 行)
   - `ExecutionWorkspaceDetail.tsx` (1,159 行)
   - `CompanyEnvironments.tsx` (815 行)
   - `CompanyAccess.tsx` (679 行)
   - `ProjectWorkspaceDetail.tsx`、`InstanceSettings.tsx` 等
   - 建议：按页面复杂度排优先级，IssueDetail > Secrets > ExecutionWorkspaceDetail

2. **组件级硬编码**：详情页内部的子组件（表格头、状态标签、弹窗文案等）仍有大量硬编码英文

3. **翻译质量审校**：当前中文翻译为 AI 批量生成，需要人工审校专业术语一致性（如 "agent" 统一为"智能体"而非混用"代理"）

4. **添加 ESLint 规则**：`eslint-plugin-react-hooks` 的 `rules-of-hooks` 规则可以防止 Hook 误用问题再次发生

5. **添加更多语言**：架构已就绪，只需在 `locales/` 下添加新目录 + JSON 文件即可

---

## 二、当前部署情况

### 2.1 系统全貌

本机运行着两套独立的系统：

| 系统 | 说明 | 状态 |
|------|------|------|
| **Clawith** | 基于 OpenClaw 的多智能体协作平台（产品化版本） | ✅ Docker 容器化运行中 |
| **Paperclip** | 上游开源项目（Clawith 的上游源码） | ⚠️ 仅开发模式运行 |

### 2.2 Clawith（生产/测试环境）

Clawith 通过 Docker Compose 容器化部署，位于 `/root/Clawith/`：

| 容器 | 镜像 | 状态 | 端口 | 说明 |
|------|------|------|------|------|
| `clawith-frontend-1` | clawith-frontend (Nginx) | Up 6 days | **3008→3000** | 前端，对外服务端口 |
| `clawith-backend-1` | clawith-backend (Python) | Up 6 days (healthy) | 8000 | 后端 API（容器内部） |
| `clawith-postgres-1` | postgres:15-alpine | Up 6 days (healthy) | 5432 | Clawith 专用数据库 |
| `clawith-redis-1` | redis:7-alpine | Up 6 days (healthy) | 6379 | Redis 缓存 |

- **对外访问**: `http://<host>:3008`
- **运行稳定**，已经跑了 6 天无异常
- 前端 Nginx 反代 `/api/` 到后端 `backend:8000`

### 2.3 Paperclip（开发环境）

Paperclip 是上游开源项目，当前在 `feat/i18n` 分支上做中文化开发。**没有容器化部署**，以开发模式直接运行：

| 服务 | 运行方式 | 端口 | 状态 |
|------|----------|------|------|
| **后端 API** | `pnpm --filter @paperclipai/server dev` | **3101**（dev）| ✅ 运行中 |
| **后端 API（备用）** | 同上，另一个进程 | **3200**（127.0.0.1 only）| ✅ 运行中 |
| **前端 UI** | `pnpm --filter @paperclipai/ui dev` (Vite) | 5173（已停）| ⚠️ 进程在但未监听 |
| **数据库** | Docker `docker-db-1` (postgres:17) | **5433→5432** | ✅ 运行中 |

**注意**：
- `docker/docker-compose.yml` 定义了 `server` service（端口 3100），但 **从未启动过**——只有数据库容器在跑
- 后端跑在 3101 而非 3100，是为了避免和 compose 里定义的 3100 端口冲突
- 还有一个 3200 端口的备用后端进程（仅监听 localhost）
- 前端 Vite dev server 进程还在但没有在监听端口，可能已失效

### 2.4 其他服务

| 服务 | 端口 | 说明 |
|------|------|------|
| Outline Wiki | 3001 | 知识库 |
| Cloudreve | 5212-5213 | 网盘 |
| Mattermost | 8065 | 团队沟通 |
| digital-worker-platform | 3000 | 数字员工平台 |

### 2.5 未提交的修改

Paperclip 工作区有 **79 个文件**未提交，包含：
- 今日 Bug 修复（agent-config-primitives Symbol 问题、AgentDetail Hooks 问题）
- 更多页面的 i18n 迁移（Activity, CommandPalette, CommentThread, IssueDetail 等）
- 新增的翻译文件（activity, inbox, routines, search 的 en/zh-CN JSON）
- 性能优化（vite.config.ts, server/src/app.ts 预压缩）

---

## 三、系统测试与生产部署前的待办事项

### 3.1 代码质量

- [ ] **提交并整理当前工作区** — 79 个文件的未提交改动需要分类提交
- [ ] **代码审查** — 中文化改动涉及 222 个文件，需审查翻译 key 的命名一致性
- [ ] **ESLint 启用 hooks 规则** — 防止类似 Hooks 误用问题再次出现
- [ ] **移除调试代码** — 确认 console drop 配置已恢复、无遗留调试日志

### 3.2 测试

- [ ] **全页面手动测试** — 逐页检查中英文切换是否正常
- [ ] **回归测试** — 确保中文化未破坏原有功能逻辑
- [ ] **重点测试页面**：
  - Agent 详情页（刚修了 Hooks bug）
  - Agent 配置表单（刚修了 Symbol bug）
  - Org 页面（之前修过 Hook 崩溃）
  - 所有带表单的页面（翻译变量替换是否正确）
- [ ] **性能测试** — 验证代码分割和 gzip 在生产构建中生效
- [ ] **单元测试更新** — 已有 `.test.tsx` 文件可能因 i18n 引入而需要更新
- [ ] **浏览器兼容性测试** — lazy import + dynamic `import()` 需要在目标浏览器验证

### 3.3 生产环境准备

- [ ] **环境变量配置** — `.env` 中的 `BETTER_AUTH_SECRET`、API Key 等需使用生产值
- [ ] **数据库迁移** — 确认 schema migration 已执行
- [ ] **HTTPS / 反向代理** — 生产环境需配置 TLS（当前 http only）
- [ ] **域名和 CORS** — `PAPERCLIP_PUBLIC_URL`、`PAPERCLIP_ALLOWED_HOSTNAMES` 需更新为生产域名
- [ ] **Docker 构建** — 使用 `docker/docker-compose.yml` 或 `quickstart.yml` 构建生产镜像
- [ ] **备份策略** — PostgreSQL 数据备份、volume 备份
- [ ] **日志与监控** — 生产环境错误追踪（Sentry 或类似方案）

### 3.4 部署架构建议

```
推荐生产部署架构：

用户 → Nginx/Caddy（HTTPS 终端）→ Paperclip Server（:3100, Docker）
                                      ├── 静态资源（预 gzip，长缓存）
                                      ├── API 路由
                                      └── PostgreSQL（独立容器或托管 RDS）
```

---

## 四、分支与修改情况详述

### 4.1 分支结构

```
master
  └── feat/ready-to-use (1 commit, 已合并到 feat/i18n)
        └── feat/i18n (当前分支, 5 commits + 未提交改动)
```

### 4.2 提交历史

| Commit | 日期 | 说明 |
|--------|------|------|
| `c774ed3d` | 05-17 19:47 | feat(i18n): add i18next infrastructure with en/zh-CN translations |
| `0d555829` | 05-17 19:57 | feat(i18n): add useTranslation to 180 component/page files |
| `0cd4050c` | 05-17 20:10 | feat(i18n): replace hardcoded strings in adapters, common patterns, NotFound |
| `6a8c6048` | 05-17 20:41 | feat(i18n): migrate core pages - Auth, Dashboard, InviteLanding, OnboardingWizard |
| `b194da90` | 05-17 20:46 | feat(i18n): migrate remaining core pages and components |
| *(未提交)* | 05-19~21 | Bug 修复 + 更多页面 i18n + 性能优化 + 翻译补充 |

### 4.3 修改统计

**已提交（vs master）**：
- 222 files changed, +2,171 / -255

**未提交（工作区）**：
- 79 files changed, +3,700 / -1,280
- 含今日 2 个 Bug 修复 + 进一步 i18n 迁移

### 4.4 测试情况

| 测试类型 | 状态 | 说明 |
|----------|------|------|
| 语言切换 | ✅ 已验证 | en ↔ zh-CN 切换正常，localStorage 持久化 |
| 首屏加载 | ✅ 已验证 | 代码分割生效，~760KB 首屏 |
| Agent 配置 | ✅ 已修复 | Symbol bug 已修 |
| Agent 详情 | ✅ 已修复 | Hooks 顺序 bug 已修 |
| Org 页面 | ✅ 已修复 | Hook 误用已修 |
| 未翻译页面 | ⚠️ 部分 | IssueDetail、Secrets 等约 12 个页面未完成 i18n |
| 自动化测试 | ❌ 未执行 | 现有 `.test.tsx` 文件未运行 |

### 4.5 当前部署

- **Clawith（产品）**：Docker 容器化，端口 3008，已稳定运行 6 天
- **Paperclip（上游开发）**：开发模式，后端 3101 + 3200（双进程），数据库 Docker 5433
- **Paperclip docker-compose 的 server service**：定义了但未启动（端口 3100 空置）
- **前端 Vite dev server**：进程存在但未监听端口，可能需要重启

### 4.6 未来环境部署建议

**Paperclip → Clawith 集成流程**：
1. 在 Paperclip `feat/i18n` 上完成中文化和 bug 修复
2. 构建 Paperclip 生产镜像验证功能
3. 将经过验证的改动移植到 Clawith
4. 重新构建 Clawith Docker 镜像并部署

**短期（Paperclip 测试环境）**：
1. 整理提交当前工作区到 `feat/i18n`
2. 使用 `docker/docker-compose.yml` 启动完整的 Paperclip 容器（server + db，端口 3100）
3. 停掉当前的开发模式进程（3101/3200）
4. 配置 HTTPS（Caddy 自动证书）

**中期（Clawith 生产升级）**：
1. `feat/i18n` 改动 review 后合并到 `master`
2. 将中文化改动同步到 Clawith 的前端代码
3. 重新构建 Clawith Docker 镜像
4. 滚动更新 Clawith 容器（`docker compose up -d --build`）

**长期（规模化）**：
1. 数据库迁移到托管 RDS
2. 静态资源上 CDN
3. 多实例 + 负载均衡
4. 容器编排（K8s 或 Docker Swarm）

---

*本文档由东京喵 🐱 生成，基于 2026-05-21 的代码库状态*
