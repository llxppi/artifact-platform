# 物语 ArtiFact

**物语 ArtiFact** 是一个 AI 驱动的中华文化遗产互动平台。平台收录 73+ 件跨越六千年的中华文物，借助 Claude AI，让每件文物"开口说话"——用户可以与文物第一人称对话、让专家深度讲解，或沉浸式穿越历史现场，还能生成专属的历史情景故事。

> 技术栈：Next.js 15 · TypeScript · Tailwind CSS · Claude API (claude-sonnet-4-6) · Prisma · SQLite

## 功能开发情况

### 文物探索
| 页面 | 路由 | 功能 | 状态 |
|------|------|------|------|
| 发现广场 | `/` | 73+ 件文物，按朝代 / 材质筛选，卡片网格布局 | ✅ 已完成 |
| 文物详情 | `/artifact/[id]` | 文物档案、知识要点、图片展示，跳转对话 / 故事 | ✅ 已完成 |

### AI 互动
| 页面 | 路由 | 功能 | 状态 |
|------|------|------|------|
| 文物对话 | `/chat/[id]` | 三种对话模式 + 流式输出 + 知识点解锁 + 智能建议问题 | ✅ 已完成 |
| 情景故事 | `/scene/[id]` | 定制化故事生成 + 分支叙事 + 史实核查报告 | ✅ 已完成 |

### 用户系统
| 页面 | 路由 | 功能 | 状态 |
|------|------|------|------|
| 登录 | `/login` | 邮箱密码登录 | ✅ 已完成 |
| 注册 | `/register` | 账号注册 | ✅ 已完成 |
| 个人中心 | `/profile` | 概览 / 收藏 / 历史三标签 | 🚧 UI 完成，数据待接入 |

---

## 文物数据库

73+ 件文物，覆盖六大历史时期：

| 朝代 | 代表文物 |
|------|---------|
| 新石器 | 仰韶彩陶、良渚玉琮 |
| 商周 | 司母戊鼎、四羊方尊、越王勾践剑 |
| 秦汉 | 秦始皇兵马俑、马踏飞燕、素纱单衣 |
| 隋唐 | 唐三彩、昭陵六骏 |
| 宋元 | 清明上河图、汝窑天青釉碗 |
| 明清 | 翠玉白菜、永乐大典 |

---

## AI 功能设计

### 文物对话（三模式）
- **文物模式** — 文物第一人称，情感互动
- **专家视角** — 严谨学术风格，深度知识讲解
- **穿越旅行者** — 沉浸式历史体验

支持：流式打字机输出、智能建议追问、知识点标签解锁、词汇表悬浮解释、每日对话配额

### 情景故事生成
- 4 种场景模板 × 4 种艺术风格 × 3 档故事长度（短/中/长篇）
- 专属绑定：昵称 + 身份 + 与文物关系
- **分支叙事**：每幕后可选择故事走向，AI 动态续写
- 史实核查报告：已核验 / 合理推测 / 艺术虚构三色标注

---

## 快速启动

```bash
npm install
cp .env.local.example .env.local
# 填入 OPENAI_API_KEY（支持 Kimi / OpenAI 等兼容接口）
npm run dev
# 访问 http://localhost:3000
```

---

## 技术架构

```
src/
├── app/
│   ├── page.tsx                    # 发现广场
│   ├── artifact/[id]/              # 文物详情
│   ├── chat/[id]/                  # AI 对话
│   ├── scene/[id]/                 # 情景故事
│   ├── login/ register/ profile/   # 用户系统
│   └── api/
│       ├── chat/          # SSE 流式对话 + 建议问题
│       ├── scene/         # SSE 故事生成 + 分支 + 续写
│       ├── auth/          # 登录 / 注册
│       ├── favorites/     # 收藏
│       └── search/        # 搜索
├── components/
│   ├── TopNav / SideNavNew / BottomNav   # 响应式导航
│   ├── GlossaryText                      # 词汇表悬浮注释
│   └── QuotaWarning / ReportButton       # 配额 / 举报
├── data/
│   └── artifacts/         # 73+ 件文物数据（按朝代分文件）
└── lib/
    ├── quota.ts            # 每日使用配额
    ├── glossary.ts         # 历史词汇解释库
    ├── qa-cache.ts         # 问答缓存
    └── auth.ts             # JWT 认证
```

---

## 环境变量

| 变量 | 说明 |
|------|------|
| `OPENAI_API_KEY` | 主对话 API 密钥（必填） |
| `OPENAI_BASE_URL` | 主对话 API 地址（`https://deeprouter.top/v1`）|
| `MODEL` | 主对话模型（`gpt-4o-mini`）|
| `BRANCH_BASE_URL` | 分支/故事 API 地址（`https://api.qnaigc.com/v1`）|
| `BRANCH_MODEL` | 分支/故事模型（`moonshotai/kimi-k2.5`）|

> 数据库无需配置，SQLite 文件已内置（`prisma/dev.db`）。

---

## 数据存储现状

> ⚠️ 当前为 MVP 原型阶段，**尚未接入 MySQL**，数据存储方式如下：

| 数据类型 | 当前方案 | 待替换方案 |
|---------|---------|-----------|
| 文物数据 | 硬编码 TypeScript 文件（`src/data/artifacts/`）| MySQL + 后台管理 |
| 用户账号 | SQLite（Prisma，`prisma/dev.db`）| MySQL |
| 收藏 / 历史 | SQLite（接口已定义，UI 未完全接入）| MySQL |
| 对话配额 | localStorage（客户端）| MySQL / Redis |
| 问答缓存 | 内存缓存（`lib/qa-cache.ts`）| Redis |

---

## 移动端适配

- 响应式布局：桌面侧边栏导航 / 移动底部 Tab 导航
- 适配断点：所有页面均完成 `sm` / `md` / `lg` 三档适配
- 触摸友好的按钮尺寸与间距
