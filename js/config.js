/* ============================================================================
 * CoffeeMap · 云端配置 (config.js)
 * 把你 Supabase 项目里的两个公开值填进来即可开启「线上账号 + 多设备同步」。
 * 留空时，应用自动使用本地浏览器存储（访客模式），与之前行为一致。
 *
 * 在哪找这两个值：Supabase 项目 → Settings → API
 *   - SUPABASE_URL      = Project URL（形如 https://xxxx.supabase.co）
 *   - SUPABASE_ANON_KEY = Project API keys 里的 anon / public 这一串
 * 这两个值本就是给前端用的公开值，可以放进公开仓库，安全由「行级权限(RLS)」保证。
 * ==========================================================================*/
window.CM_CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
};
