/* ============================================================================
 * CoffeeMap · 云端层 (cloud.js) — 直连 Supabase REST（不依赖官方 SDK 的会话/锁机制）
 *
 * 为什么不用 supabase-js 的 auth：它的会话持久化 + Web Locks 在华为/夸克/部分电脑
 * webview 上会【卡死不返回】（登录卡在“登录中”、拿着失效会话反复重试导致记录传不上去）。
 * 这里改为浏览器原生 fetch 直连 /auth /rest /storage，自己管令牌（带超时、自动续期、
 * 凭证兜底重登），彻底甩开会卡死的 SDK 会话层。
 * 未配置(config.js 留空) → configured()=false，应用走纯本地，零影响。
 * ==========================================================================*/
window.CM = window.CM || {};
CM.cloud = (function(){
  const C   = ()=> window.CM_CONFIG || {};
  const BASE= ()=> (C().SUPABASE_URL||'').replace(/\/+$/,'');
  const ANON= ()=> C().SUPABASE_ANON_KEY || '';
  let user=null, _onChange=null, _reauthing=null;

  const TOK='coffeemap.tok', CRED='coffeemap.cred';
  const _saveTok = t =>{ try{ localStorage.setItem(TOK, JSON.stringify(t)); }catch(e){} };
  const _getTok  = ()=>{ try{ return JSON.parse(localStorage.getItem(TOK)||'null'); }catch(e){ return null; } };
  const _clearTok= ()=>{ try{ localStorage.removeItem(TOK); }catch(e){} };
  const _saveCred= (e,p)=>{ try{ localStorage.setItem(CRED, btoa(unescape(encodeURIComponent(JSON.stringify({e,p}))))); }catch(x){} };
  const _getCred = ()=>{ try{ const s=localStorage.getItem(CRED); return s?JSON.parse(decodeURIComponent(escape(atob(s)))):null; }catch(x){ return null; } };
  const _clearCred=()=>{ try{ localStorage.removeItem(CRED); }catch(x){} };

  function configured(){ return !!(BASE() && ANON()); }
  function _emit(){ if(_onChange){ try{ _onChange(user?{user}:null); }catch(e){} } }

  // 带超时的 fetch —— 杜绝任何“永不返回”导致的卡死
  async function _fetch(path, opts, ms){
    opts=opts||{}; ms=ms||15000;
    const ctrl = ('AbortController' in window) ? new AbortController() : null;
    const timer = setTimeout(()=>{ try{ ctrl && ctrl.abort(); }catch(e){} }, ms);
    try{ return await fetch(BASE()+path, ctrl ? Object.assign({}, opts, {signal:ctrl.signal}) : opts); }
    finally{ clearTimeout(timer); }
  }

  /* ---------------- 鉴权 ---------------- */
  async function _tokenReq(grant, body){
    const r = await _fetch('/auth/v1/token?grant_type='+grant, {
      method:'POST', headers:{ apikey:ANON(), 'Content-Type':'application/json' }, body:JSON.stringify(body)
    });
    const j = await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(j.error_description || j.msg || j.error || ('登录失败('+r.status+')'));
    return j;   // { access_token, refresh_token, expires_in, user }
  }
  function _store(j, email){
    const u = j.user ? { id:j.user.id, email:(j.user.email||email||'') } : null;
    _saveTok({ access_token:j.access_token, refresh_token:j.refresh_token,
               expires_at: Date.now() + ((j.expires_in||3600)*1000), user:u });
    user = u; return u;
  }
  async function signInPassword(email, password){
    try{ const j=await _tokenReq('password', {email, password}); const u=_store(j,email); _saveCred(email,password); _emit(); return { data:{ user:u, session:j } }; }
    catch(e){ return { error:{ message:e.message } }; }
  }
  async function signUp(email, password){
    try{
      const r=await _fetch('/auth/v1/signup', { method:'POST', headers:{ apikey:ANON(), 'Content-Type':'application/json' }, body:JSON.stringify({email,password}) });
      const j=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(j.error_description || j.msg || j.error || ('注册失败('+r.status+')'));
      if(j.access_token){ const u=_store(j,email); _saveCred(email,password); _emit(); return { data:{ user:u, session:j } }; }
      return { data:{ user:(j.user||null), session:null } };   // 开了“邮箱确认”→无 session
    }catch(e){ return { error:{ message:e.message } }; }
  }
  // 用 refresh_token 续期（不需要密码）；失败再用本地存的账号密码重登。并发去重。
  function _reauth(){
    if(_reauthing) return _reauthing;
    _reauthing = (async ()=>{
      const t=_getTok();
      if(t && t.refresh_token){ try{ const j=await _tokenReq('refresh_token', { refresh_token:t.refresh_token }); _store(j, t.user&&t.user.email); _emit(); return user; }catch(e){} }
      const c=_getCred(); if(c && c.e && c.p){ try{ const j=await _tokenReq('password', {email:c.e, password:c.p}); _store(j,c.e); _emit(); return user; }catch(e){} }
      return null;
    })().finally(()=>{ _reauthing=null; });
    return _reauthing;
  }
  async function autoLogin(){ const u=await _reauth(); return u ? { user:u } : null; }
  // 返回可用的 access_token（临近过期先续期）
  async function _accessToken(){
    let t=_getTok(); if(!t) return null;
    if(!t.expires_at || (t.expires_at - Date.now()) < 60000){ await _reauth(); t=_getTok(); }
    return t ? t.access_token : null;
  }
  async function getSession(){ const t=_getTok(); if(t && t.user){ user=t.user; return { user:t.user }; } return null; }

  /* ---------------- 数据（PostgREST，RLS 按 Bearer 令牌） ---------------- */
  function _hdr(token){ return { apikey:ANON(), Authorization:'Bearer '+(token||ANON()), 'Content-Type':'application/json' }; }
  async function _db(path, opts, retried){
    const token = await _accessToken();
    const r = await _fetch('/rest/v1'+path, Object.assign({}, opts, { headers: Object.assign(_hdr(token), opts.headers||{}) }));
    if(r.status===401 && !retried){ const u=await _reauth(); if(u) return _db(path, opts, true); }   // 令牌失效→重登再试一次
    return r;
  }
  async function fetchAll(){
    const r=await _db('/records?select=id,data&order=updated_at.desc', { method:'GET' });
    if(!r.ok){ const j=await r.json().catch(()=>({})); throw new Error(j.message || j.error || ('读取失败('+r.status+')')); }
    const rows=await r.json().catch(()=>[]);
    return (rows||[]).map(x => ({ ...(x.data||{}), id:x.id }));
  }
  async function upsert(rec){
    if(!user) throw new Error('未登录，已暂存待同步');
    const r=await _db('/records', { method:'POST', headers:{ Prefer:'resolution=merge-duplicates,return=minimal' },
      body:JSON.stringify({ id:rec.id, user_id:user.id, data:rec, updated_at:new Date().toISOString() }) });
    if(!r.ok){ const j=await r.json().catch(()=>({})); throw new Error(j.message || j.error || ('上传失败('+r.status+')')); }
  }
  async function remove(id){
    if(!user) throw new Error('未登录，已暂存待同步');
    const r=await _db('/records?id=eq.'+encodeURIComponent(id), { method:'DELETE', headers:{ Prefer:'return=minimal' } });
    if(!r.ok && r.status!==404){ const j=await r.json().catch(()=>({})); throw new Error(j.message || ('删除失败('+r.status+')')); }
  }

  /* ---------------- 照片（Storage 桶 photos） ---------------- */
  async function uploadPhoto(dataUrl){
    if(!user) throw new Error('未登录');
    const blob = await (await fetch(dataUrl)).blob();
    const ext  = ((blob.type.split('/')[1]) || 'jpg').replace('jpeg','jpg');
    const path = user.id + '/' + Date.now().toString(36) + Math.random().toString(36).slice(2,8) + '.' + ext;
    const token= await _accessToken();
    const r = await _fetch('/storage/v1/object/photos/'+path, {
      method:'POST', headers:{ apikey:ANON(), Authorization:'Bearer '+(token||ANON()), 'Content-Type':(blob.type||'image/jpeg'), 'x-upsert':'false' }, body:blob
    }, 30000);
    if(!r.ok){ const j=await r.json().catch(()=>({})); throw new Error(j.message || j.error || ('上传失败('+r.status+')')); }
    return BASE() + '/storage/v1/object/public/photos/' + path;
  }

  async function signOut(){ user=null; _clearTok(); _clearCred(); _emit(); return { ok:true }; }

  // 启动即从本地令牌恢复登录态（同步，立即知道是否登录，不卡）
  (function(){ const t=_getTok(); if(t && t.user) user=t.user; })();

  return {
    configured, init:()=>configured(), ensureReady: async ()=> configured(),
    get enabled(){ return configured(); },
    get user(){ return user; },
    setUser(u){ user = u; },
    onChange(cb){ _onChange = cb; },
    hasCred(){ const t=_getTok(); return !!(_getCred() || (t && t.refresh_token)); },
    getSession, autoLogin,
    signInPassword, signUp, signOut,
    fetchAll, upsert, remove, uploadPhoto,
    // 兼容旧接口（已停用 OTP）
    signIn: async ()=> ({ error:{ message:'请使用邮箱+密码登录' } }),
    verifyCode: async ()=> ({ error:{ message:'请使用邮箱+密码登录' } }),
  };
})();
