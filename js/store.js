/* ============================================================================
 * CoffeeMap · 数据层 (store.js) — localStorage 持久化 + 通用助手
 * ==========================================================================*/
window.CM = window.CM || {};

CM.store = (function(){
  const KEY = 'coffeemap.records.v1';
  let cache = null;

  function _read(){
    if(cache) return cache;
    try{ cache = JSON.parse(localStorage.getItem(KEY)) || []; }
    catch(e){ cache = []; }
    return cache;
  }
  function _write(){
    cache.sort((a,b)=> (b.tastedAt||'').localeCompare(a.tastedAt||'') || (b.createdAt-a.createdAt));
    localStorage.setItem(KEY, JSON.stringify(cache));
    document.dispatchEvent(new CustomEvent('cm:changed'));
  }
  return {
    all(){ return _read().slice(); },
    get(id){ return _read().find(r=>r.id===id); },
    add(rec){
      rec.id = rec.id || CM.uid();
      rec.createdAt = rec.createdAt || Date.now();
      _read().push(rec); _write(); return rec;
    },
    update(id, patch){
      const r = _read().find(x=>x.id===id); if(!r) return;
      Object.assign(r, patch); _write(); return r;
    },
    remove(id){ cache = _read().filter(r=>r.id!==id); _write(); },
    replaceAll(arr){ cache = arr.slice(); _write(); },
    clear(){ cache=[]; localStorage.removeItem(KEY); document.dispatchEvent(new CustomEvent('cm:changed')); },
    seedIfEmpty(seed){ if(_read().length===0 && seed && seed.length){ cache = seed.slice(); _write(); } }
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
