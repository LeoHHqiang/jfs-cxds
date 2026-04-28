# Netlify 部署步骤（生产可用）

## 1) 本地构建与推送

```bash
npm install
npm run build
git add .
git commit -m "chore: prepare netlify deploy"
git push origin main
```

## 2) 在 Netlify 导入仓库

1. 登录 Netlify
2. 点击 `Add new site` -> `Import an existing project`
3. 选择 GitHub 并授权仓库
4. 选择仓库 `jfs-cxds`

## 3) 构建参数

- Build command: `npm run build`
- Publish directory: `dist`

本项目已包含：

- `netlify.toml`（构建配置 + SPA 重定向）
- `public/_redirects`（前端路由刷新不 404）

## 4) 环境变量（Supabase）

在 Netlify 的 `Site settings -> Environment variables` 添加：

- `VUE_APP_SUPABASE_URL` = `https://<project-ref>.supabase.co`
- `VUE_APP_SUPABASE_ANON_KEY` = `sb_publishable_xxx`

注意：

- 只使用 publishable/anon key
- 不要填写 secret / service_role key

## 5) 首次部署验证

1. 打开 Netlify 分配的站点地址
2. 登录页可正常显示
3. 业务页面可读取 Supabase 数据
4. 新增一条记录并刷新，确认数据持久化

## 6) 后续代码更新发布

后续每次更新只需要：

```bash
git add .
git commit -m "feat: xxx"
git push origin main
```

Netlify 会自动触发新部署，无需手动上传文件。

