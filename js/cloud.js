/* ============================================================================
 * CoffeeMap · 云端层 (cloud.js) — Supabase 客户端 + 邮箱魔法链接登录 + 同步
 * 未配置(config.js 留空) → enabled=false，应用走本地存储，零影响。
 * ==========================================================================*/
window.CM = window.CM || {};
CM.cloud = (function(){
  let client=null, enabled=false, user=null;

  function init(){
    const c = window.CM_CONFIG || {};
    if(!c.SUPABASE_URL || !c.SUPABASE_ANON_KEY) return false;
    if(!window.supabase || !window.supabase.createClient){ console.warn('supabase-js 未加载'); return false; }
    try{
      client = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY, {
        auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true, flowType:'implicit' }
      });
      enabled = true;
    }catch(e){ console.error('supabase init 失败', e); enabled=false; }
    return enabled;
  }

  // 是否已配置云端（与 SDK 是否加载成功无关）
  function configured(){ const c=window.CM_CONFIG||{}; return !!(c.SUPABASE_URL && c.SUPABASE_ANON_KEY); }
  // 按需懒加载 supabase SDK（带缓存绕过重试），解决某些浏览器重进时本地脚本未加载的问题
  function loadSdk(){
    return new Promise(res=>{
      if(window.supabase && window.supabase.createClient) return res(true);
      const s=document.createElement('script');
      s.src='js/vendor/supabase.min.js?r='+Date.now();
      s.onload=()=>res(!!(window.supabase && window.supabase.createClient));
      s.onerror=()=>res(false);
      (document.head||document.documentElement).appendChild(s);
    });
  }
  async function ensureReady(){
    if(enabled) return true;
    if(!(window.supabase && window.supabase.createClient)) await loadSdk();
    return init();
  }

  return {
    init, configured, ensureReady,
    get enabled(){ return enabled; },
    get user(){ return user; },
    setUser(u){ user = u; },

    async getSession(){
      if(!client) return null;
      const { data } = await client.auth.getSession();
      return data ? data.session : null;
    },
    onChange(cb){ if(client) client.auth.onAuthStateChange((_evt, session)=> cb(session)); },

    async signIn(email){
      return client.auth.signInWithOtp({
        email,
        options:{ emailRedirectTo: location.href.split('#')[0].split('?')[0], shouldCreateUser:true }
      });
    },
    // 6 位验证码登录（需自定义 SMTP 才能在邮件里显示验证码）
    async verifyCode(email, token){
      return client.auth.verifyOtp({ email, token, type:'email' });
    },
    // 邮箱 + 密码（最稳：不依赖收邮件、不跨浏览器）
    async signUp(email, password){ return client.auth.signUp({ email, password }); },
    async signInPassword(email, password){ return client.auth.signInWithPassword({ email, password }); },
    async signOut(){ return client.auth.signOut(); },

    // 取当前用户全部记录（RLS 保证只返回本人数据）
    async fetchAll(){
      const { data, error } = await client.from('records').select('id,data').order('updated_at',{ascending:false});
      if(error) throw error;
      return (data || []).map(r => ({ ...(r.data||{}), id:r.id }));
    },
    async upsert(rec){
      if(!user) return;
      const { error } = await client.from('records').upsert({
        id: rec.id, user_id: user.id, data: rec, updated_at: new Date().toISOString()
      });
      if(error) throw error;
    },
    async remove(id){
      const { error } = await client.from('records').delete().eq('id', id);
      if(error) throw error;
    },
  };
})();
