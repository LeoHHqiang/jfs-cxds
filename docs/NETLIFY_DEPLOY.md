# Netlify 发布步骤（演示环境）

## 1. 推送代码到 GitHub

```bash
git add .
git commit -m "chore: add supabase demo api and docs"
git push
```

## 2. 在 Netlify 新建站点

- 登录 Netlify
- `Add new site` -> `Import an existing project`
- 选择你的 GitHub 仓库

## 3. 配置构建参数

- Build command: `npm run build`
- Publish directory: `dist`

## 4. 配置环境变量（非常关键）

在 Netlify 的 Site settings -> Environment variables 添加：

- `VUE_APP_SUPABASE_URL`
- `VUE_APP_SUPABASE_ANON_KEY`

值与本地 `.env.local` 保持一致。

## 5. 首次部署后验证

- 打开站点 URL
- 检查页面是否能读取 Supabase 数据
- 在 `基础项录入` 新增一条，刷新页面仍存在

## 6. 演示数据初始化（SQL Editor）

每次需要重置演示数据时，在 Supabase SQL Editor 执行：

- `docs/DEMO_INIT.sql`

## 7. 可选：避免被误操作

- 暂时隐藏批量删除按钮
- 新增二次确认弹窗（已在页面中实现）
- 演示前执行一次 `docs/DEMO_INIT.sql` 还原数据

