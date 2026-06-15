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
        auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true, flowType:'pkce' }
      });
      enabled = true;
    }catch(e){ console.error('supabase init 失败', e); enabled=false; }
    return enabled;
  }

  return {
    init,
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
        options:{ emailRedirectTo: location.href.split('#')[0].split('?')[0] }
      });
    },
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
