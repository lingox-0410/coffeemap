/* ============================================================================
 * CoffeeMap · 云端层 (cloud.js) — Supabase 客户端 + 邮箱魔法链接登录 + 同步
 * 未配置(config.js 留空) → enabled=false，应用走本地存储，零影响。
 * ==========================================================================*/
window.CM = window.CM || {};
CM.cloud = (function(){
  let client=null, enabled=false, user=null;
  // 内存串行锁替代 navigator.locks：既避免华为/夸克 webview 上 Web Locks 卡死，又避免“无锁”导致的 auth 并发损坏/卡死
  let _lockChain = Promise.resolve();
  const memLock = (name, acquireTimeout, fn)=>{ const run=_lockChain.then(()=>fn()); _lockChain=run.then(()=>{},()=>{}); return run; };
  // 本地保存凭证(混淆)用于刷新后自动重登——某些 webview 上 SDK 会话不跨刷新，自动重登保证保持登录、写入能同步
  const CRED='coffeemap.cred';
  const _saveCred=(e,p)=>{ try{ localStorage.setItem(CRED, btoa(unescape(encodeURIComponent(JSON.stringify({e,p}))))); }catch(x){} };
  const _getCred =()=>{ try{ const s=localStorage.getItem(CRED); return s?JSON.parse(decodeURIComponent(escape(atob(s)))):null; }catch(x){ return null; } };
  const _clearCred=()=>{ try{ localStorage.removeItem(CRED); }catch(x){} };

  function init(){
    const c = window.CM_CONFIG || {};
    if(!c.SUPABASE_URL || !c.SUPABASE_ANON_KEY) return false;
    if(!window.supabase || !window.supabase.createClient){ console.warn('supabase-js 未加载'); return false; }
    try{
      client = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY, {
        auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true, flowType:'implicit',
          // 用内存串行锁取代默认 navigator.locks（后者在华为/夸克 webview 会卡死 auth 调用）
          lock: memLock }
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
    // 刷新后 SDK 会话丢失时，用本地保存的凭证自动重登（signInWithPassword 稳定、不像 setSession 会卡）
    hasCred(){ return !!_getCred(); },
    async autoLogin(){
      const c=_getCred(); if(!c||!c.e||!c.p) return null;
      try{ const r=await client.auth.signInWithPassword({ email:c.e, password:c.p }); if(r.error) throw r.error; return r.data ? r.data.session : null; }
      catch(e){ console.warn('autoLogin', e); return null; }
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
    // 邮箱 + 密码（最稳：不依赖收邮件、不跨浏览器）；成功即保存凭证供刷新后自动重登
    async signUp(email, password){ const r=await client.auth.signUp({ email, password }); if(!r.error && r.data && r.data.session) _saveCred(email,password); return r; },
    async signInPassword(email, password){ const r=await client.auth.signInWithPassword({ email, password }); if(!r.error) _saveCred(email,password); return r; },
    // 先同步清掉本地会话与凭证(最关键、绝不阻塞)，再尽力调用 SDK(带超时，hang 也不影响)
    async signOut(scope='local'){
      user=null;
      try{
        _clearCred(); localStorage.removeItem('coffeemap.sess');
        [localStorage, sessionStorage].forEach(st=>{
          const ks=[]; for(let i=0;i<st.length;i++){ const k=st.key(i); if(k && /sb-.*-auth-token/.test(k)) ks.push(k); }
          ks.forEach(k=>st.removeItem(k));
        });
      }catch(e){}
      try{ if(client) await Promise.race([ client.auth.signOut({ scope }), new Promise(r=>setTimeout(r,2000)) ]); }catch(e){ console.warn('signOut',e); }
      return { ok:true };
    },

    // 取当前用户全部记录（RLS 保证只返回本人数据）
    async fetchAll(){
      const { data, error } = await client.from('records').select('id,data').order('updated_at',{ascending:false});
      if(error) throw error;
      return (data || []).map(r => ({ ...(r.data||{}), id:r.id }));
    },
    async upsert(rec){
      if(!user) throw new Error('未登录，已暂存待同步');   // 抛错→留在待传队列，登录后自动补传（不可静默吞掉）
      const { error } = await client.from('records').upsert({
        id: rec.id, user_id: user.id, data: rec, updated_at: new Date().toISOString()
      });
      if(error) throw error;
    },
    async remove(id){
      if(!user) throw new Error('未登录，已暂存待同步');
      const { error } = await client.from('records').delete().eq('id', id);
      if(error) throw error;
    },
  };
})();
