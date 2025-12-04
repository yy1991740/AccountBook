# 📱 记账App 云部署指南

本指南将帮助您将记账App部署到云端，实现：
- ✅ 前端托管在 GitHub Pages 或 Vercel
- ✅ 后端 API 托管在 Vercel Serverless
- ✅ 数据存储在 Vercel Postgres
- ✅ PWA 支持，可添加到手机主屏幕

---

## 📋 前置准备

1. **GitHub 账号** - 用于代码托管和前端部署
2. **Vercel 账号** - 用于后端和数据库托管（免费版足够个人使用）

---

## 🗄️ 第一步：部署数据库（Vercel Postgres）

### 1.1 创建 Vercel 数据库

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击顶部导航的 **Storage**
3. 点击 **Create Database** → 选择 **Postgres**
4. 选择区域（建议选择 `Singapore` 或 `Hong Kong` 以获得更好的延迟）
5. 创建完成后，进入数据库详情页
6. 点击 **.env.local** 标签，复制以下变量：
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

### 1.2 记录数据库连接字符串

将上述变量保存到安全的地方，稍后部署后端时需要使用。

---

## 🖥️ 第二步：部署后端（Vercel Serverless）

### 2.1 推送代码到 GitHub

```bash
# 在项目根目录执行
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/AccountBook.git
git push -u origin main
```

### 2.2 在 Vercel 导入项目

1. 在 Vercel Dashboard 点击 **Add New...** → **Project**
2. 选择您的 GitHub 仓库 `AccountBook`
3. **重要配置**：
   - **Root Directory**: `server`
   - **Framework Preset**: `Other`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: 留空

### 2.3 配置环境变量

在 Vercel 项目设置 → **Environment Variables** 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgres://...?pgbouncer=true&connect_timeout=15` | Vercel Postgres 连接字符串（使用 POSTGRES_PRISMA_URL） |
| `DIRECT_URL` | `postgres://...` | 直接连接字符串（使用 POSTGRES_URL_NON_POOLING） |
| `JWT_SECRET` | `your-super-secret-key-at-least-32-chars` | JWT 密钥（请使用强随机字符串） |
| `JWT_EXPIRES_IN` | `15m` | Token 过期时间 |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh Token 过期时间 |

### 2.4 部署并初始化数据库

1. 点击 **Deploy** 开始部署
2. 部署完成后，进入 **Deployments** → 选择最新部署 → **Functions** 标签
3. 在本地运行以下命令推送数据库 Schema：

```bash
cd server
# 设置环境变量（替换为您的实际值）
export DATABASE_URL="your-postgres-url"
export DIRECT_URL="your-direct-url"

# 推送 Schema 到数据库
npx prisma db push
```

### 2.5 验证后端部署

访问 `https://your-backend.vercel.app/api/health`，应返回：
```json
{"status":"ok","timestamp":"2024-..."}
```

---

## 🌐 第三步：部署前端

### 方案A：使用 Vercel 部署（推荐）

1. 在 Vercel Dashboard 再次点击 **Add New...** → **Project**
2. 选择同一个 GitHub 仓库 `AccountBook`
3. **配置**：
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
4. **环境变量**：

| 变量名 | 值 |
|--------|-----|
| `VITE_API_URL` | `https://your-backend.vercel.app/api` |

5. 点击 **Deploy**

### 方案B：使用 GitHub Pages 部署

1. 在 GitHub 仓库设置 → **Secrets and variables** → **Actions** 中添加：
   - `VITE_API_URL`: `https://your-backend.vercel.app/api`

2. 在仓库设置 → **Pages** 中：
   - **Source**: `GitHub Actions`

3. 推送代码后，GitHub Actions 会自动构建并部署

---

## 📱 第四步：安装 PWA

### iOS 设备

1. 使用 Safari 访问您的前端地址
2. 点击底部分享按钮 📤
3. 选择 **添加到主屏幕**
4. 输入名称，点击 **添加**

### Android 设备

1. 使用 Chrome 访问您的前端地址
2. 点击右上角菜单 ⋮
3. 选择 **添加到主屏幕** 或 **安装应用**

---

## 🔧 常见问题

### Q: 部署后无法登录？
A: 检查以下几点：
1. 后端 `CORS` 是否允许前端域名
2. 环境变量 `VITE_API_URL` 是否正确
3. 数据库 Schema 是否已推送

### Q: 数据库连接失败？
A: 确保使用正确的连接字符串：
- `DATABASE_URL` 使用带 `pgbouncer=true` 的 URL
- `DIRECT_URL` 使用直接连接 URL

### Q: PWA 安装后图标不显示？
A: 确保 `public/manifest.json` 中的图标路径正确，且图标文件存在。

---

## 📊 资源限制（Vercel 免费版）

| 资源 | 限制 |
|------|------|
| Serverless 函数执行 | 100GB-小时/月 |
| 带宽 | 100GB/月 |
| Postgres 存储 | 256MB |
| Postgres 计算 | 60小时/月 |

对于个人记账应用，免费额度完全足够。

---

## 🔐 安全建议

1. **JWT_SECRET**: 使用至少 32 位的随机字符串
2. **数据库**: 定期备份重要数据
3. **HTTPS**: Vercel 默认启用 HTTPS，无需额外配置

---

祝您部署顺利！🎉
