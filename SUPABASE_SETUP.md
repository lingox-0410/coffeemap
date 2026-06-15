# 开启「线上账号 + 多设备同步」· Supabase 设置（约 10 分钟）

你需要做的：创建一个免费的 Supabase 项目、跑一段建表 SQL、配一个回跳地址，然后把 **2 个值** 发我。我来把它们填进 `js/config.js` 并推送，云端功能即生效。

> 为什么要你来建：创建账号/项目需要你本人登录，我无法替你注册。建好后日常使用、同步都自动，无需再碰后台。

---

## 1. 创建项目
1. 打开 https://supabase.com → 右上角 **Sign in**（用 GitHub 登录最快）。
2. **New project** → 选一个组织 → 填：
   - **Name**：`coffeemap`
   - **Database Password**：点 Generate 生成一个并**自己存好**（日常用不到，但别丢）
   - **Region**：选离你近的（如 `Southeast Asia (Singapore)` 或 `Northeast Asia (Tokyo)`）
   - Plan：**Free**
3. **Create new project**，等 1–2 分钟初始化完成。

## 2. 建表 + 权限（复制粘贴跑一次 SQL）
左侧 **SQL Editor** → **New query** → 粘贴下面全部 → 右下 **Run**（出现 Success 即可）：

```sql
-- 每条咖啡记录一行，整条记录以 JSON 存在 data 里
create table if not exists public.records (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- 开启行级安全：保证每个人只能读写自己的数据
alter table public.records enable row level security;

create policy "records_select_own" on public.records
  for select using (auth.uid() = user_id);
create policy "records_insert_own" on public.records
  for insert with check (auth.uid() = user_id);
create policy "records_update_own" on public.records
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "records_delete_own" on public.records
  for delete using (auth.uid() = user_id);

create index if not exists records_user_idx on public.records (user_id, updated_at desc);
```

## 3. 配置登录回跳地址（很重要，否则点邮件链接回不来）
左侧 **Authentication** → **URL Configuration**：
- **Site URL** 填：`https://lingox-0410.github.io/coffeemap/`
- **Redirect URLs** 里 **Add URL** 再加一条：`https://lingox-0410.github.io/coffeemap/`
  （如果你也想在本机调试，再加一条 `http://localhost:4178/`）
- 保存。

> 邮箱登录(Email)默认就是开启的，无需额外操作。免费版用 Supabase 自带邮件发送，**有频率限制、可能进垃圾箱**——个人使用够用；将来量大可在 Authentication → Emails 里接自己的 SMTP。

## 4. 复制两个值发我
左侧 **Settings**（齿轮）→ **API Keys**：
- **Project URL**（形如 `https://<ref>.supabase.co`；也可从浏览器地址栏的 `project/<ref>` 推出）
- **Publishable key**（新版密钥，`sb_publishable_...` 开头，标注「safe to use in a browser / can be safely shared publicly」）
  - 若你的项目是旧版，则用 `Legacy anon, service_role API keys` 标签页里的 **anon**（`eyJ...` 开头），效果一样。

把这两个发我即可。⚠️ **只发 Publishable / anon 这把**；标着 `sb_secret_...` / `service_role` 的那把**千万别发、别放进前端**。

---

## 我收到后会做什么
1. 填进 [js/config.js](js/config.js) 并 `git push`；
2. 约 1 分钟后线上版生效：右上角出现「登录」按钮；
3. 你点登录 → 输邮箱 → 点邮件链接回来即登录；首次登录会问你是否把本地已有记录上传到云端；
4. 之后换任何设备/浏览器登录同一邮箱，记录都在。

> 没填配置时（现在的线上版），应用照常用本地存储，不受影响。
