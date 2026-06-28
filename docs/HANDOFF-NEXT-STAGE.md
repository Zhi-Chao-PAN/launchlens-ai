# LaunchLens 跨项目 Handoff 契约（现状文档）

> **本文档记录 research-studio → launchlens-ai 的 brief handoff 真实状态。**
> 代码是唯一事实来源——本文档由统筹 agent 基于代码核实编写，动手前先读代码。
> 最近更新：2026-06-28，对应 research-studio `7e7f304` / launchlens-ai `3b7aa9e`。

---

## 1. Handoff 的三条通路（均已实现）

用户从 research-studio 把 brief 送到 launchlens-ai 有三条入口，**全部走同一个 `briefFromJson` 解析 + 同一个预览确认流程**：

| 通路 | 触发 | 数据载体 | 实现位置 |
|---|---|---|---|
| **A. 一键跳转（主路径）** | research-studio "Send to LaunchLens AI" 按钮 | URL hash `#brief=<base64url-JSON>` | studio: `ExportActions.tsx` `handleSendToLaunchLensAi`；ai: `launch-workspace.tsx` 挂载 useEffect + `brief-fragment.ts` |
| **B. 文件上传（兜底）** | launchlens-ai 工具栏 "Research Studio" 按钮 | `.json` 文件 | ai: `launch-workspace.tsx` `handleBriefImportFile` → `briefFromFile` |
| **C. 粘贴 JSON（兜底）** | launchlens-ai 工具栏 "粘贴 JSON" 按钮 | textarea 文本 | ai: `launch-workspace.tsx` `applyBriefPaste` → `briefFromJson` |

通路 A 失败时（弹窗被拦、URL 过长），用户降级到 B 或 C。三条通路下游完全一致：解析 → 预览对话框（展示 5 字段 + 警告）→ 确认 → `applyBriefImportResult`。

---

## 2. Brief 信封契约（跨项目，不可单方面改）

research-studio 的 `brief-mapper.ts::toLaunchLensBrief` 导出，launchlens-ai 的 `brief-from-json.ts::briefFromJson` 解析。形状：

```typescript
{
  schemaVersion: "1.0.0",
  source: "launchlens-research-studio",
  exportedAt: "<ISO 8601>",
  sessionId: "<session id>",
  query: "<原始查询>",
  reportUrl: "<research-studio 公网报告页 URL>",  // R231 加入，ai 侧溯源回链用
  input: {
    idea: string,        // ≤500 字符(advisory)/1200(server gate)，≥12 字符
    audience: string,    // ≤240 advisory
    market: string,      // ≤120 advisory
    tone: string,        // 固定占位 "Practical, crisp, and founder-friendly"
    constraints: string, // ≤320 advisory
  },
  meta: {
    opportunityScore: number | null,
    riskScore: number | null,
    completedAgents: AgentId[],
    truncated: (keyof LaunchLensInput)[],
    toneDefault: true,   // R254 加入：标记 tone 是非研究的固定占位
  }
}
```

**字段语义约束**：
- `reportUrl`（R231）：可选。ai 侧 `source-brief.ts` 读取，渲染成 "View full report" 回链。旧版导出无此字段，ai 侧忽略。
- `meta.toneDefault`（R254）：可选，布尔。为 `true` 时 ai 侧 `applyBriefImportResult` **保留用户当前 tone**，不覆盖。旧版导出无此字段，ai 侧按"tone 是有意 authored"处理（覆盖）。
- `tone` 字段本身始终是 "Practical, crisp, and founder-friendly"（research-studio 无 tone/style agent）。`toneDefault` 标记的存在让 ai 侧能区分"这是占位"vs"用户有意传入"。

**任何对信封形状的改动都必须同步两个仓库**，且两侧的契约测试会拦截静默漂移（见第 4 节）。

---

## 3. URL Hash 编解码契约（对称）

通路 A 用 URL hash 携带 brief。编解码两端必须严格对称：

**编码（research-studio `base64url.ts`）**：
1. `JSON.stringify(brief)`（紧凑模式，无缩进，缩短 URL）
2. UTF-8 字节 → `String.fromCharCode` 包装为二进制串
3. `btoa()` → 标准 base64
4. 字母表替换：`+`→`-`，`/`→`_`，去掉 `=` 填充
5. 前缀 `#brief=` 拼接

**解码（launchlens-ai `brief-fragment.ts`）**：
1. 检查 hash 以 `#brief=` 开头
2. 切出编码部分
3. 字母表还原：`-`→`+`，`_`→`/`
4. 补 `=` 填充至 4 的倍数
5. `atob()` → 二进制串
6. `Uint8Array` + `TextDecoder` → UTF-8 字符串
7. `JSON.parse` → `briefFromJson`

**关键不变量**：
- 前缀常量 `BRIEF_HASH_PREFIX = "#brief="` 两端必须一致
- base64url 字母表只有 `A-Za-z0-9-_`（无 `+/=`），可安全嵌入 URL hash
- UTF-8 round-trip 必须无损（中文、emoji 不乱码）——契约测试覆盖

---

## 4. 契约测试（防静默漂移）

两个仓库各有一份对称的契约测试，任何一端改了信封形状/编解码，对应测试会失败：

**research-studio `brief-mapper.test.ts`（"handoff contract" describe 块）**：
- `meta.toneDefault` 必须为 `true`
- hash 以 `#brief=` 开头
- base64url round-trip 无损（encode → 模拟 ai 侧 decode → JSON.parse → 断言字段）
- 紧凑 JSON 长度 < 8000 字符（URL 安全预算）

**launchlens-ai `brief-from-json.test.ts`（"Research Studio handoff contract" describe 块）**：
- 完整 envelope round-trip：5 个 input 字段逐字断言
- 溯源链完整：sessionId / reportUrl / opportunityScore / riskScore
- `meta.toneDefault: true` 时 `result.toneIsDefault` 为 `true`
- 旧版 envelope（无 toneDefault）不误报 `toneIsDefault`

---

## 5. Handoff 回执握手（R253）

通路 A 原先是 fire-and-forget——studio toast "Opened" 后不知道 ai 侧是否真预填成功。R253 升级为双向握手：

1. studio `handleSendToLaunchLensAi` **预埋** `window.addEventListener("message", ...)` 监听 `{type: "launchlens:brief-applied"}`
2. `window.open(targetUrl, "_blank", "noreferrer")`（**故意去掉 `noopener`**，保留 opener 引用）
3. ai 侧 `applyBriefImportResult` 成功后 `window.opener.postMessage({type: "launchlens:brief-applied"}, "*")`
4. studio 收到回执 → toast "Brief applied"；6 秒无回执 → 降级 toast "Opened"（兼容旧版 ai / 跨域 opener 不可用）
5. 弹窗被拦（`window.open` 返回 null）→ 清理监听器 + toast "Popup blocked"

**降级保证**：握手是 best-effort，任何一环失败都不阻塞导入——ai 侧的预填已成功，studio 侧只是少一个确认 toast。

---

## 6. Tone 保留语义（R254）

research-studio 没有 tone/style agent，`tone` 字段是固定占位 "Practical, crisp, and founder-friendly"。R254 之前，导入 brief 会无条件覆盖用户在 launchlens-ai 设的 tone。

R254 行为：
- studio 侧 `brief-mapper.ts` 在 `meta.toneDefault: true` 标记 tone 是占位
- ai 侧 `brief-from-json.ts` 透传 `result.toneIsDefault`
- ai 侧 `applyBriefImportResult`：`result.toneIsDefault` 为真时，`mergedInput = { ...nextInput, tone: input.tone }`（保留用户当前 tone）
- 其余 4 字段（idea/audience/market/constraints）始终取自 brief

**向后兼容**：旧版 envelope 无 `toneDefault` → `toneIsDefault` 不为 true → 按原行为覆盖（不破坏存量导入）。

---

## 7. 关键文件索引

### research-studio（`launchlens-research-studio`）
| 文件 | 作用 |
|---|---|
| `src/lib/export/brief-mapper.ts` | `toLaunchLensBrief(session)` 派生 5 字段 + envelope；`meta.toneDefault`；`getLaunchLensAiUrl` |
| `src/lib/export/base64url.ts` | `encodeBase64UrlUtf8` + `briefHashFor`；`BRIEF_HASH_PREFIX` |
| `src/components/report/ExportActions.tsx` | Copy/Send/Export 三按钮（统一走 envelope）；postMessage 握手监听 |
| `src/app/api/research/[sessionId]/brief/route.ts` | `GET` 程序化取 brief（curl/自动化用） |

### launchlens-ai（`launchlens-ai`）
| 文件 | 作用 |
|---|---|
| `src/lib/launchlens/brief-from-json.ts` | `briefFromJson` / `briefFromFile`；识别信封/裸输入/旧式文本；`toneIsDefault` 透传 |
| `src/lib/launchlens/brief-fragment.ts` | `briefFromHashFragment` / `decodeBase64UrlUtf8`；hash 解码 |
| `src/lib/launchlens/source-brief.ts` | `sourceBriefFromResearchStudioEnvelope` / `normalizeWorkspaceSourceBrief`；溯源元数据解析 |
| `src/lib/launchlens/types.ts` | `LaunchLensInput` / `LaunchLensWorkspaceSourceBrief` 类型 |
| `src/components/launch-workspace.tsx` | hash 预填 useEffect + postMessage 回执；粘贴入口；`applyBriefImportResult`（tone 保留）；预览对话框 |
| `src/app/api/generate/route.ts` | `POST /api/generate`，接收 `sourceBrief` 透传到 workspace |

---

## 8. 演进历史

| 日期 | 标记 | 改动 |
|---|---|---|
| 2026-06-28（早） | R231 | 一键跳转通路（URL hash）+ `reportUrl` 溯源回链 |
| 2026-06-28（早） | — | sourceBrief schema v2 migration + UI 溯源条 |
| 2026-06-28（晚） | R252 | 统一 Copy/Send/Export 三按钮数据源（全走 envelope） |
| 2026-06-28（晚） | R253 | postMessage 回执握手（fire-and-forget → confirmed） |
| 2026-06-28（晚） | R254 | `meta.toneDefault` + tone 保留（不覆盖用户 tone） |

---

_代码是唯一事实来源。本文档由统筹 agent 基于代码核实编写，如与代码冲突以代码为准。_
