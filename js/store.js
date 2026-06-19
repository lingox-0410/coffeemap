/* ============================================================================
 * CoffeeMap · 数据层 (store.js) — localStorage 持久化 + 通用助手
 * ==========================================================================*/
window.CM = window.CM || {};

/* 离线优先数据层：本地镜像(按账号隔离) + 云端同步 + 失败入队补传。
 * 三道防线保证“登录态新增的数据绝不丢”：①每次写操作返回前先把整份 cache 同步落地到
 * 本地镜像(不依赖网络/会话)；②云端写失败入待传队列、联网/重登时自动补传；③读取失败
 * 只提示不清空，刷新优先秒显本地镜像。 */
CM.store = (function(){
  const LKEY = 'coffeemap.records.v1';          // 访客/本地（含示例数据）
  const LAST = 'coffeemap.lastUser';            // 上次登录用户 id（会话丢失时回放镜像）
  let cache = null, mode = 'local', uid = null;

  const mirrorKey = ()=> (mode==='cloud' && uid) ? ('coffeemap.records.cloud.'+uid) : LKEY;
  const queueKey  = ()=> 'coffeemap.unsync.'+(uid||'guest');
  function _read(k){ try{ return JSON.parse(localStorage.getItem(k)) || []; }catch(e){ return []; } }
  function _write(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

  function _ensure(){ if(cache===null) cache=_read(mirrorKey()); return cache; }
  function _sortDispatch(){
    cache.sort((a,b)=> (b.tastedAt||'').localeCompare(a.tastedAt||'') || ((b.createdAt||0)-(a.createdAt||0)));
    document.dispatchEvent(new CustomEvent('cm:changed'));
  }
  // 镜像里只丢掉大体积的 base64 照片，保留已上传的照片 URL(很小)——这样卡片本地也能显示照片
  const _stripPhotos = r => {
    if(!r || !r.photos || !r.photos.length) return r;
    const kept = r.photos.filter(p => typeof p==='string' && !p.startsWith('data:'));
    return { ...r, photos: kept };
  };
  // 本地镜像【不存 base64 照片】——否则几十张照片就撑爆 localStorage 配额(手机 webview 常只有 2.5~5MB)，导致“只能存十几条”。
  // 照片保存在：内存(当前会话显示) + 云端 data(跨浏览器) + 待传队列(未同步时)。
  function _saveMirror(){ _write(mirrorKey(), cache.map(_stripPhotos)); }

  // ---- 待同步队列 ----
  const _queue = ()=> _read(queueKey());
  function _enqueue(op){ const q=_queue().filter(x=>x.id!==op.id); q.push(op); _write(queueKey(), q); }
  function _dequeue(id){ _write(queueKey(), _queue().filter(x=>x.id!==id)); }
  let _flushT=null;
  function _scheduleFlush(){ if(_flushT) return; _flushT=setTimeout(()=>{ _flushT=null; flushQueue(); }, 8000); }

  const _synced = ()=> document.dispatchEvent(new CustomEvent('cm:synced'));
  function _cloudUpsert(rec){
    Promise.resolve(CM.cloud.upsert(rec)).then(()=>{ _dequeue(rec.id); _synced(); })
      .catch(e=>{ document.dispatchEvent(new CustomEvent('cm:cloudError',{detail:e})); _scheduleFlush(); });
  }
  function _cloudRemove(id){
    Promise.resolve(CM.cloud.remove(id)).then(()=>{ _dequeue(id); _synced(); })
      .catch(e=>{ document.dispatchEvent(new CustomEvent('cm:cloudError',{detail:e})); _scheduleFlush(); });
  }
  function _persistUpsert(rec){ _saveMirror(); if(mode==='cloud'){ _enqueue({op:'upsert',id:rec.id,rec}); _cloudUpsert(rec); } }
  function _persistRemove(id){ _saveMirror(); if(mode==='cloud'){ _enqueue({op:'remove',id}); _cloudRemove(id); } }

  async function flushQueue(){
    if(mode!=='cloud' || !(CM.cloud && CM.cloud.user)) return { skipped:true };
    const q=_queue(); if(!q.length) return { done:0, failed:0 };
    document.dispatchEvent(new CustomEvent('cm:syncstart'));
    let done=0, failed=0, lastError=null;
    for(const item of q){
      try{ if(item.op==='remove') await CM.cloud.remove(item.id); else await CM.cloud.upsert(item.rec); _dequeue(item.id); done++; }
      catch(e){ failed++; lastError=e; }   // 保留，下次再试
    }
    _synced();
    if(failed) document.dispatchEvent(new CustomEvent('cm:cloudError',{detail:lastError}));   // 把真实失败暴露出来，不再假装"同步中"
    return { done, failed, lastError: lastError && (lastError.message||String(lastError)) };
  }

  return {
    get mode(){ return mode; },
    getUserId(){ return uid; },
    lastUser(){ try{ return localStorage.getItem(LAST); }catch(e){ return null; } },   // 纯字符串，勿 JSON
    setMode(m, userId){ mode=m; if(m==='cloud'){ if(userId) uid=userId; if(uid){ try{ localStorage.setItem(LAST, uid); }catch(e){} } } else uid=null; cache=null; },
    setUserId(id){ uid=id; try{ id ? localStorage.setItem(LAST,id) : localStorage.removeItem(LAST); }catch(e){} },

    loadMirror(){                                                   // 从当前镜像键秒显
      const arr=_read(mirrorKey()); const byId=new Map(arr.map(r=>[r.id,r]));
      _queue().forEach(it=>{ if(it.op==='upsert' && it.rec) byId.set(it.rec.id, it.rec); });   // 未同步记录的完整数据(含照片)从队列回放，照片不丢
      cache=[...byId.values()]; _sortDispatch();
    },
    loadLocal(){ cache=_read(LKEY); },                              // 访客本地
    setCache(arr){ cache=(arr||[]).slice(); _sortDispatch(); _saveMirror(); },
    mergeRemote(remote){
      // 跨端收敛：以【远端为权威全集】，只额外保留本地【尚未同步】的改动（待传队列里的）。
      // → 别处的删除/编辑会传播过来（本地已同步但远端已没有的记录会被移除）；本地没传上去的新增/编辑不丢。
      const list = remote || [];
      const q = _queue();
      const pendingUpserts = new Map(q.filter(it=>it.op==='upsert' && it.rec).map(it=>[it.id, it.rec]));
      const pendingRemoves = new Set(q.filter(it=>it.op==='remove').map(it=>it.id));
      // 安全阀：远端返回空、但本地有数据且没有任何"待删"——疑似异常空响应，保守保留本地（下次正确拉取自愈），绝不"全部消失"
      if(list.length===0 && _ensure().length>0 && pendingRemoves.size===0){
        _sortDispatch(); _saveMirror(); return;
      }
      const byId = new Map();
      list.forEach(r=>{ if(!pendingRemoves.has(r.id)) byId.set(r.id, r); });            // 远端全集（本地待删的先不显示）
      pendingUpserts.forEach((rec,id)=>{ if(!pendingRemoves.has(id)) byId.set(id, rec); }); // 本地未同步的新增/编辑覆盖/补充
      cache=[...byId.values()]; _sortDispatch(); _saveMirror();
    },
    flushQueue,
    pendingSync(){ return _queue().length; },

    all(){ return _ensure().slice(); },
    get(id){ return _ensure().find(r=>r.id===id); },
    add(rec){ rec.id=rec.id||CM.uid(); rec.createdAt=rec.createdAt||Date.now(); _ensure().push(rec); _sortDispatch(); _persistUpsert(rec); return rec; },
    update(id,patch){ const r=_ensure().find(x=>x.id===id); if(!r) return; Object.assign(r,patch); _sortDispatch(); _persistUpsert(r); return r; },
    remove(id){ cache=_ensure().filter(r=>r.id!==id); _sortDispatch(); _persistRemove(id); },
    replaceAll(arr){ cache=arr.slice(); _sortDispatch(); _saveMirror(); if(mode==='cloud') cache.forEach(r=>{ _enqueue({op:'upsert',id:r.id,rec:r}); _cloudUpsert(r); }); },
    clear(){ const ids=_ensure().map(r=>r.id); cache=[]; _sortDispatch(); _saveMirror(); if(mode==='cloud') ids.forEach(id=>{ _enqueue({op:'remove',id}); _cloudRemove(id); }); },
    seedIfEmpty(seed){ if(mode==='local' && _ensure().length===0 && seed && seed.length){ cache=seed.slice(); _sortDispatch(); _saveMirror(); } }
  };
})();

/* ---------- 通用助手 ---------- */
CM.uid = () => 'r' + Math.abs(Date.now() ^ (performance.now()*1000|0)).toString(36) + (CM._n=(CM._n||0)+1);

CM.esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

CM.STAR_PATH = 'M12 2.4l2.9 6.1 6.7.9-4.9 4.7 1.2 6.7L12 18.5l-5.9 3.3 1.2-6.7L2.4 9.4l6.7-.9z';
CM.starSVG = (color, size)=> `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" aria-hidden="true"><path d="${CM.STAR_PATH}"/></svg>`;
CM.starHTML = (score, size=15)=>{
  const pct = Math.max(0, Math.min(1, (+score||0)/5))*100;
  return `<span class="stars" style="height:${size}px">`+
    `<span class="stars-bg">${CM.starSVG('#e3e3e6',size).repeat(5)}</span>`+
    `<span class="stars-fg" style="width:${pct}%">${CM.starSVG('#e0a73a',size).repeat(5)}</span>`+
  `</span>`;
};

CM.fmtDate = d => { if(!d) return '—'; const x=new Date(d); return isNaN(x)? d : `${x.getFullYear()}.${String(x.getMonth()+1).padStart(2,'0')}.${String(x.getDate()).padStart(2,'0')}`; };

/* 读取图片文件并压缩为 dataURL（限制 localStorage 体积） */
CM.resizeImage = (file, max=960)=> new Promise((res,rej)=>{
  const rd=new FileReader();
  rd.onload=()=>{ const img=new Image();
    img.onload=()=>{ let w=img.width,h=img.height; const sc=Math.min(1,max/Math.max(w,h)); w=Math.round(w*sc); h=Math.round(h*sc);
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
      cv.getContext('2d').drawImage(img,0,0,w,h);
      try{ res(cv.toDataURL('image/jpeg',.82)); }catch(e){ res(rd.result); } };
    img.onerror=rej; img.src=rd.result; };
  rd.onerror=rej; rd.readAsDataURL(file);
});

/* 把一条记录里所有"标签型"字段拼成可搜索文本 */
CM.recordText = r => [
  r.name, r.estate, r.shop, r.notes,
  (CM.find.origin(r.origin)||{}).cn, r.origin,
  ...(r.regions||[]),
  ...(r.varieties||[]).map(v=>(CM.find.variety(v)||{}).cn||v),
  ...(r.processes||[]).map(p=>(CM.find.process(p)||{}).cn||p),
  (CM.find.roast(r.roast)||{}).cn,
  (CM.find.brew(r.brew)||{}).cn,
  ...(r.flavors||[]),
].filter(Boolean).join(' ').toLowerCase();

/* 平均分 / 计数统计：按某个维度聚合 */
CM.aggregate = (records, dimFn)=>{
  const m = new Map();
  records.forEach(r=>{
    const keys = dimFn(r); // 可能返回数组或单值
    (Array.isArray(keys)?keys:[keys]).filter(k=>k!=null && k!=='').forEach(k=>{
      if(!m.has(k)) m.set(k,{key:k, count:0, scoreSum:0, scoreN:0});
      const o=m.get(k); o.count++; if(r.score){ o.scoreSum+=r.score; o.scoreN++; }
    });
  });
  return [...m.values()].map(o=>({...o, avg: o.scoreN? o.scoreSum/o.scoreN : 0}))
                        .sort((a,b)=> b.count-a.count || b.avg-a.avg);
};
