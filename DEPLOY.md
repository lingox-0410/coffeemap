# 部署：一处更新，朋友永远用到最新版

> 目标：你在本地改代码 → 推送一次 → 朋友刷新页面就是最新版（数据各存各的浏览器，互不影响）。

实现这个目标的关键是：**把项目放到一个「连接了 Git 仓库、推送即自动发布」的静态托管上**。下面给一个推荐方案和两个备选。

---

## ✅ 推荐：GitHub + Cloudflare Pages（或 Netlify / Vercel）

一次性配置，之后每次 `git push` 自动重新发布，朋友访问同一个网址永远是最新。

### 1. 本地（已为你初始化好 git）
```bash
cd CoffeeMap
git add -A
git commit -m "update"          # 每次改完代码就提交
```

### 2. 首次：建远程仓库并推送
```bash
# 在 github.com 新建一个空仓库 coffeemap（私有/公开都行），然后：
git remote add origin https://github.com/<你的用户名>/coffeemap.git
git branch -M main
git push -u origin main
```

### 3. 连接托管（任选其一，都免费、都自动发布）
- **Cloudflare Pages**：dash.cloudflare.com → Workers & Pages → Create → Pages → 连接你的 GitHub 仓库 →
  **Framework preset 选 None，Build command 留空，Build output 留空（根目录就是站点）** → Deploy。
- **Netlify**：app.netlify.com → Add new site → Import from Git → 选仓库 → Build command 留空、Publish directory 填 `.` → Deploy。
- **Vercel**：vercel.com → New Project → 选仓库 → Framework 选 Other → Deploy。

完成后你会得到一个网址，例如 `https://coffeemap.pages.dev`，发给朋友即可。

### 4. 以后更新（这就是你要的"一处更新"）
```bash
git add -A && git commit -m "改了xx" && git push
```
推送后约 1 分钟自动上线，朋友**刷新页面**就是最新版。

> 朋友的咖啡记录存在他自己浏览器的 localStorage，你更新代码**不会**动到他的数据。

---

## 备选 A：GitHub Pages（不想用第三方托管）
推送到 GitHub 后：仓库 Settings → Pages → Source 选 `main` 分支 `/ (root)` → Save。
得到 `https://<用户名>.github.io/coffeemap/`。之后 `git push` 即更新。

## 备选 B：Netlify Drop（零命令，但每次更新要手动重传）
把 `CoffeeMap` 文件夹直接拖到 https://app.netlify.com/drop → 立刻得到网址。
缺点：它**不自动更新**——每次你改了代码要重新拖一次。适合临时分享，不适合"持续更新"。

---

## 关于缓存
本项目是纯静态站、未使用 Service Worker，所以不会顽固缓存。更新后朋友正常刷新即可看到最新；
个别浏览器若有强缓存，让其 `Ctrl/Cmd + Shift + R` 硬刷新一次即可。

## 想自定义域名
Cloudflare Pages / Netlify / Vercel 都支持免费绑定你自己的域名（在各自后台 Domains 里添加）。
