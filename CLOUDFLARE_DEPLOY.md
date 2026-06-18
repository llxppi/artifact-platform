# Cloudflare Pages 部署指南

## 第一步：创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** > **D1 SQL Database**
3. 点击 **Create database**
4. 数据库名称输入：`artifact-platform-db`
5. 点击 **Create**
6. 创建后，复制 **Database ID**（稍后需要）

## 第二步：初始化数据库

在数据库详情页，点击 **Console** 标签，执行以下 SQL：

```sql
CREATE TABLE User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  avatar TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE Favorite (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  artifactId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(userId, artifactId)
);

CREATE TABLE ChatHistory (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  artifactId TEXT NOT NULL,
  messages TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE TABLE GameScore (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  artifactId TEXT NOT NULL,
  score INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);
```

## 第三步：部署 Pages 项目

1. 进入 **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**
2. 选择你的 GitHub 仓库（llxppi/artifact-platform）
3. 配置构建设置：
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: `prototype`

4. 添加环境变量：
   ```
   NODE_VERSION=18
   OPENAI_API_KEY=sk-40e3d6bb1bf14acf54b7f51dac4c26a5e2d2da77bff8e9c33467cea663ac2a24
   OPENAI_BASE_URL=https://api.qnaigc.com/v1
   MODEL=moonshotai/kimi-k2.5
   JWT_SECRET=生成的强密钥
   ```

5. 点击 **Save and Deploy**

## 第四步：绑定 D1 数据库

1. 部署完成后，进入项目的 **Settings** > **Functions**
2. 找到 **D1 database bindings**
3. 点击 **Add binding**：
   - Variable name: `DB`
   - D1 database: 选择 `artifact-platform-db`
4. 点击 **Save**
5. 重新部署项目（Settings > Deployments > Retry deployment）

## 方式二：使用 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
npx wrangler pages deploy .next --project-name=artifact-platform
```

## 注意事项

- Cloudflare Pages 对 Next.js 的支持有限制，某些功能可能需要调整
- API routes 会作为 Cloudflare Workers 运行
- 数据库连接需要使用 Cloudflare D1 或外部数据库
- 图片优化已禁用（`unoptimized: true`）
