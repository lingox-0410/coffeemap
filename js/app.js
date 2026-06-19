/* ============================================================================
 * CoffeeMap · 主应用 (app.js)
 * ==========================================================================*/
window.CM = window.CM || {};
CM.app = (function(){
  let state = { view:'map', search:'', filter:null, mapMetric:'count', selectedOrigin:null, blind:null };

  /* ---------------- 选项表 ---------------- */
  const OPT = {
    origin:   CM.origins.map(o=>({value:o.key,label:o.cn,flag:o.key,desc:o.continent})),
    region:   [...new Set(CM.origins.flatMap(o=>o.regions))].map(r=>({value:r,label:r,icon:'pin'})),
    variety:  CM.varieties.map(v=>({value:v.id,label:v.cn})),
    process:  CM.processes.map(p=>({value:p.id,label:p.cn,color:p.color})),
    roast:    CM.roasts.map(r=>({value:r.id,label:r.cn,color:r.color})),
    altitude: CM.altitudes.map(a=>({value:a.id,label:a.cn,icon:'mountain'})),
    brew:     CM.brews.map(b=>({value:b.id,label:b.cn,icon:'cup'})),
    flavor:   CM.flavorFlat.map(f=>({value:f.leaf,label:f.leaf,color:f.color,group:f.cn})),
  };
  /* 选项/标签的前置小图：国旗 / 色点 / 线性图标 */
  function optVis(o){
    if(o.flag) return CM.flag(o.flag);
    if(o.color) return CM.dot(o.color);
    if(o.icon)  return CM.icon(o.icon,{size:15});
    return '';
  }
  function typeVis(type,key,color){
    if(type==='origin')   return CM.flag(key);
    if(type==='brew')     return CM.icon('cup',{size:14});
    if(type==='altitude') return CM.icon('mountain',{size:14});
    return color?CM.dot(color):'';
  }

  /* ================= 通用 UI ================= */
  function toast(msg){
    let t=document.querySelector('.toast'); if(!t){ t=document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
    t.textContent=msg; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2200);
  }
  const modalStack=[];
  function openModal(title, bodyHTML, opts={}){
    const scrim=document.createElement('div'); scrim.className='scrim';
    scrim.innerHTML=`<div class="modal ${opts.wide?'wide':''}">
      <div class="mhead"><h3>${title}</h3><button class="x" aria-label="关闭">${CM.icon('x',{size:16,stroke:2})}</button></div>
      <div class="mbody">${bodyHTML}</div></div>`;
    document.body.appendChild(scrim);
    const close=()=>{ scrim.classList.remove('show'); setTimeout(()=>scrim.remove(),250); const i=modalStack.indexOf(scrim); if(i>=0)modalStack.splice(i,1); document.querySelectorAll('.suggest').forEach(s=>s.remove()); };
    scrim.querySelector('.x').onclick=close;
    scrim.addEventListener('mousedown',e=>{ if(e.target===scrim) close(); });
    modalStack.push(scrim); requestAnimationFrame(()=>scrim.classList.add('show'));
    if(opts.onMount) opts.onMount(scrim.querySelector('.mbody'), close);
    return { el:scrim, body:scrim.querySelector('.mbody'), close };
  }
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&modalStack.length){ const s=modalStack.pop(); s.classList.remove('show'); setTimeout(()=>s.remove(),250); document.querySelectorAll('.suggest').forEach(x=>x.remove()); }});

  /* ================= 标签输入组件 ================= */
  /* 选择面板：点按弹出（不自动聚焦搜索→不弹软键盘），选项大目标、可滚动；长列表/可自定义才显示顶部搜索框 */
  function openPicker({title, options=[], multi=false, selected=[], allowCustom=false, onChange}){
    let sel = new Set(selected);
    const needSearch = options.length>12 || allowCustom;
    const body = `
      ${needSearch?`<input class="input pk-q" id="pk-q" placeholder="搜索…" autocomplete="off">`:''}
      <div class="picker-list" id="pk-list"></div>
      ${multi?`<button class="btn dark" id="pk-done" style="width:100%;justify-content:center;margin-top:14px">完成 · 已选 <span id="pk-n">${sel.size}</span></button>`:''}`;
    openModal(title, body, { onMount:(b, close)=>{
      const q=b.querySelector('#pk-q'), list=b.querySelector('#pk-list');
      const commit=()=>{ if(onChange) onChange([...sel]); };
      function render(){
        const kw=(q&&q.value.trim().toLowerCase())||'';
        const groups={};
        options.filter(o=> !kw || o.label.toLowerCase().includes(kw) || (o.group||'').toLowerCase().includes(kw))
          .forEach(o=>{ (groups[o.group||'']=groups[o.group||'']||[]).push(o); });
        let html='';
        Object.keys(groups).forEach(g=>{ if(g) html+=`<div class="picker-grp">${CM.esc(g)}</div>`;
          groups[g].forEach(o=>{ const on=sel.has(o.value);
            html+=`<div class="picker-opt${on?' on':''}" data-v="${CM.esc(o.value)}">${optVis(o)}<span class="pk-label">${CM.esc(o.label)}</span>${on?CM.icon('check',{size:16,cls:'pk-ck'}):''}</div>`; });
        });
        const cv=q&&q.value.trim();
        if(allowCustom && cv && !options.some(o=>o.label.toLowerCase()===cv.toLowerCase()))
          html+=`<div class="picker-opt" data-v="${CM.esc(cv)}">${CM.icon('plus',{size:15})}<span class="pk-label">添加 “${CM.esc(cv)}”</span></div>`;
        list.innerHTML = html || '<p class="muted center" style="padding:24px 0">无匹配项</p>';
        list.querySelectorAll('.picker-opt').forEach(op=> op.onclick=()=>{
          const v=op.dataset.v;
          if(multi){ if(sel.has(v)) sel.delete(v); else sel.add(v); const n=b.querySelector('#pk-n'); if(n) n.textContent=sel.size; commit(); render(); }
          else { sel=new Set([v]); commit(); close(); }
        });
      }
      if(q) q.addEventListener('input', render);
      const done=b.querySelector('#pk-done'); if(done) done.onclick=()=>close();
      render();
    }});
  }

  function tagInput({options=[], value=[], placeholder='', single=false, allowCustom=true, label=''}){
    const el=document.createElement('div'); el.className='taginput picker-trigger'; el.tabIndex=0;
    let vals=[...value];
    const findOpt=v=>options.find(o=>o.value===v)||{value:v,label:v};
    function chip(v){
      const o=findOpt(v);
      const c=document.createElement('span'); c.className='chip';
      c.innerHTML=`${optVis(o)}${CM.esc(o.label)}<span class="rm">${CM.icon('x',{size:11,stroke:2.4})}</span>`;
      c.querySelector('.rm').onclick=ev=>{ ev.stopPropagation(); vals=vals.filter(x=>x!==v); paint(); };
      return c;
    }
    function paint(){
      el.innerHTML='';
      vals.forEach(v=> el.appendChild(chip(v)));
      if(!vals.length){ const ph=document.createElement('span'); ph.className='ti-ph'; ph.textContent=placeholder||'点击选择'; el.appendChild(ph); }
      const car=document.createElement('span'); car.className='ti-caret'; car.innerHTML=CM.icon('chevronDown',{size:16}); el.appendChild(car);
    }
    el.onclick=(e)=>{ if(e.target.closest('.rm')) return;
      openPicker({ title: label?('选择 '+label):'选择', options, multi:!single, selected:vals, allowCustom,
        onChange:(v)=>{ vals = single ? v.slice(0,1) : v; paint(); } });
    };
    paint();
    return { el, get:()=>vals.slice(), set:v=>{ vals=[...v]; paint(); } };
  }

  /* ================= 标签渲染（可点击→知识卡）================= */
  function ktag(type,key,label,color){
    return `<span class="tag clickable" data-kt="${type}" data-kk="${CM.esc(key)}">${typeVis(type,key,color)}${CM.esc(label)}</span>`;
  }
  function originTag(key){ const o=CM.find.origin(key); return o?ktag('origin',key,o.cn):''; }

  /* ================= 记录卡片 ================= */
  function tgRow(label, html){ return html?`<div class="tg"><span class="tg-lab">${label}</span><span class="tg-tags">${html}</span></div>`:''; }
  function recCard(r){
    const o=CM.find.origin(r.origin)||{};
    const photo=(r.photos&&r.photos[0]);
    const brew=CM.find.brew(r.brew), roast=CM.find.roast(r.roast);
    const vTags=(r.varieties||[]).slice(0,3).map(v=>{const x=CM.find.variety(v);return ktag('variety',v,x?x.cn.split(' ')[0]:v);}).join('');
    const pTags=(r.processes||[]).slice(0,3).map(p=>{const x=CM.find.process(p);return ktag('process',p,x?x.cn.split(' ')[0]:p,x&&x.color);}).join('');
    const rTag = roast?ktag('roast',r.roast,roast.cn.split(' ')[0],roast.color):'';
    const fTags=(r.flavors||[]).slice(0,4).map(f=>{const g=CM.find.flavorOf(f);return ktag('flavor',f,f,g&&g.color);}).join('');
    const groups = tgRow('豆种',vTags)+tgRow('处理',pTags)+tgRow('烘焙',rTag)+tgRow('风味',fTags);
    const brewName = brew?brew.cn.split('·').pop().trim():'';
    return `<div class="card rec" data-rec="${r.id}">
      <div class="photo ${photo?'':'placeholder'}" style="${photo?`background-image:url('${photo}')`:''}">
        ${photo?'':`<div class="emoji" style="color:var(--accent)">${CM.icon('cup',{size:50,stroke:1.4})}</div>`}
        <span class="flag">${CM.flag(o.key)} ${CM.esc(o.cn||'自定义')}</span>
        <span class="score">${(r.score||0).toFixed(1)} ${CM.starSVG('#ffce63',12)}</span>
      </div>
      <div class="body">
        <div class="title">${CM.esc(r.name||o.cn||'一杯咖啡')}</div>
        <div class="meta">${r.estate?CM.esc(r.estate)+' · ':''}${(r.regions||[])[0]?CM.esc(r.regions[0]):'—'}</div>
        <div class="tg-list">${groups||'<span class="muted" style="font-size:12px">暂无标签</span>'}</div>
        <div class="foot"><span class="flex" style="align-items:center;gap:5px">${brew?CM.icon('cup',{size:13}):''}${brewName?' '+CM.esc(brewName):''} · ${CM.esc(r.shop||'—')}</span><span>${CM.fmtDate(r.tastedAt)}</span></div>
      </div></div>`;
  }

  /* ================= 视图：地图 ================= */
  function renderMap(){
    const c=document.getElementById('view-map'); const recs=CM.store.all();
    c.innerHTML=`
      <div class="hero"><h1>你的 <span class="grad">咖啡风味地图</span></h1>
        <p>已经品鉴 ${recs.length} 杯，足迹遍及 ${new Set(recs.map(r=>r.origin)).size} 个产地</p></div>
      <div class="section-head">
        <div class="seg" id="mapSeg">
          <button data-m="count" class="${state.mapMetric==='count'?'active':''}">按数量</button>
          <button data-m="avg" class="${state.mapMetric==='avg'?'active':''}">按评分</button>
        </div>
        <div class="sub">点击国家或圆点，下钻产地知识与记录</div>
      </div>
      <div id="mapHolder"></div>
      <div id="mapDetail" class="mt24"></div>`;
    CM.map.render(document.getElementById('mapHolder'), recs, {metric:state.mapMetric, onSelect:selectOrigin});
    c.querySelector('#mapSeg').onclick=e=>{ const b=e.target.closest('button'); if(!b)return; state.mapMetric=b.dataset.m; renderMap(); if(state.selectedOrigin) selectOrigin(state.selectedOrigin); };
    if(state.selectedOrigin) selectOrigin(state.selectedOrigin);
  }
  function selectOrigin(key){
    state.selectedOrigin=key;
    const o=CM.find.origin(key); const recs=CM.store.all().filter(r=>r.origin===key);
    const d=document.getElementById('mapDetail'); if(!d) return;
    d.innerHTML=`<div class="card" style="padding:24px">
      <div class="flex gap12" style="justify-content:space-between;align-items:flex-start;flex-wrap:wrap">
        <div><div class="kkicker" style="color:var(--accent)">产地下钻 · ORIGIN</div>
          <h2 style="font-size:26px;margin:4px 0;display:flex;align-items:center;gap:10px">${CM.flag(o.key,'flag-lg')} ${o.cn}</h2></div>
        <button class="btn dark sm" onclick="CM.app.openForm({origin:'${key}'})">${CM.icon('plus',{size:15})} 在此产地记一杯</button>
      </div>
      <p class="kdesc" style="margin-top:10px">${CM.esc(o.desc)}</p>
      <div class="wrap-tags mt16">${o.regions.map(r=>`<span class="tag ghost">${CM.icon('pin',{size:13})} ${CM.esc(r)}</span>`).join('')}</div>
      <div class="divider"></div>
      <h4 class="muted" style="margin-bottom:14px">这里的 ${recs.length} 杯记录</h4>
      ${recs.length?`<div class="grid cards">${recs.map(recCard).join('')}</div>`:'<p class="muted">还没有该产地的记录，点上方按钮记录第一杯。</p>'}
    </div>`;
    d.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  /* ================= 视图：卡片墙 ================= */
  function renderCards(){
    const c=document.getElementById('view-cards');
    let recs=applySearch(CM.store.all());
    c.innerHTML=`
      <div class="section-head"><h2>卡片墙</h2>
        <div class="sub">${recs.length} 条记录 · 点击卡片看明细，点击标签看知识</div></div>
      ${filterBanner()}
      ${recs.length?`<div class="grid cards">${recs.map(recCard).join('')}</div>`:emptyState()}`;
  }

  /* ================= 视图：明细表 ================= */
  let sortKey='tastedAt', sortDir=-1;
  function renderTable(){
    const c=document.getElementById('view-table');
    let recs=applySearch(applyFilter(CM.store.all()));
    recs.sort((a,b)=>{
      const get=r=>({tastedAt:r.tastedAt,score:r.score||0,origin:(CM.find.origin(r.origin)||{}).cn||'',name:r.name||'',shop:r.shop||''}[sortKey]);
      const x=get(a),y=get(b); return (x>y?1:x<y?-1:0)*sortDir;
    });
    const cols=[['name','咖啡'],['origin','产区'],['varieties','豆种'],['processes','处理法'],['roast','烘焙'],['flavors','风味'],['shop','咖啡店'],['brew','冲煮'],['score','评分'],['tastedAt','时间']];
    c.innerHTML=`<div class="section-head"><h2>明细表</h2><div class="sub">所有字段的底层数据 · 共 ${recs.length} 行 · 点表头排序</div></div>
      ${filterBanner()}
      <div class="table-wrap"><table class="detail"><thead><tr>${cols.map(([k,l])=>`<th data-k="${k}">${l}${sortKey===k?CM.icon(sortDir<0?'chevronDown':'chevronUp',{size:12,stroke:2.4,cls:'th-sort'}):''}</th>`).join('')}<th></th></tr></thead>
      <tbody>${recs.map(rowHTML).join('')||`<tr><td colspan="11" class="center muted" style="padding:40px">无数据</td></tr>`}</tbody></table></div>`;
    c.querySelectorAll('th[data-k]').forEach(th=> th.onclick=()=>{ const k=th.dataset.k; if(sortKey===k)sortDir*=-1; else{sortKey=k;sortDir=k==='score'||k==='tastedAt'?-1:1;} renderTable(); });
  }
  function rowHTML(r){
    const o=CM.find.origin(r.origin)||{}; const roast=CM.find.roast(r.roast); const brew=CM.find.brew(r.brew);
    const mt=(arr,type,mapper)=>`<div class="mini-tags">${(arr||[]).slice(0,3).map(mapper).join('')||'—'}</div>`;
    return `<tr data-rec="${r.id}" style="cursor:pointer">
      <td><b>${CM.esc(r.name||'—')}</b></td>
      <td><span class="flex" style="align-items:center;gap:6px">${CM.flag(r.origin)} ${o.cn||'—'}</span></td>
      <td>${mt(r.varieties,'variety',v=>{const x=CM.find.variety(v);return ktag('variety',v,x?x.cn.split(' ')[0]:v);})}</td>
      <td>${mt(r.processes,'process',p=>{const x=CM.find.process(p);return ktag('process',p,x?x.cn.split(' ')[0]:p,x&&x.color);})}</td>
      <td>${roast?ktag('roast',r.roast,roast.cn.split(' ')[0],roast.color):'—'}</td>
      <td>${mt(r.flavors,'flavor',f=>{const g=CM.find.flavorOf(f);return ktag('flavor',f,f,g&&g.color);})}</td>
      <td>${CM.esc(r.shop||'—')}</td>
      <td>${brew?brew.cn.split(' ')[0]:'—'}</td>
      <td style="white-space:nowrap">${CM.starHTML(r.score)} <b>${(r.score||0).toFixed(1)}</b></td>
      <td>${CM.fmtDate(r.tastedAt)}</td>
      <td><button class="x" onclick="event.stopPropagation();CM.app.openRecord('${r.id}')">${CM.icon('chevronRight',{size:15})}</button></td></tr>`;
  }

  /* ================= 视图：统计 ================= */
  function renderStats(){
    const c=document.getElementById('view-stats'); const recs=CM.store.all();
    if(!recs.length){ c.innerHTML=emptyState(); return; }
    const scored=recs.filter(r=>r.score);
    const avg=scored.reduce((s,r)=>s+r.score,0)/(scored.length||1);
    const byOrigin=CM.aggregate(recs,r=>r.origin);
    const best=byOrigin.slice().sort((a,b)=>b.avg-a.avg)[0];
    c.innerHTML=`
      <div class="section-head"><h2>统计</h2><div class="sub">多维度数量与评分</div></div>
      <div class="grid stat-grid">
        <div class="stat"><div class="k">总品鉴</div><div class="v">${recs.length}<small>杯</small></div><div class="foot">含 ${scored.length} 杯评分</div></div>
        <div class="stat"><div class="k">覆盖产地</div><div class="v">${new Set(recs.map(r=>r.origin)).size}<small>国</small></div><div class="foot">共 ${CM.origins.length} 个咖啡产地</div></div>
        <div class="stat"><div class="k">平均风味分</div><div class="v">${avg.toFixed(2)}<small>分</small></div><div class="foot">${CM.starHTML(Math.round(avg*2)/2)}</div></div>
        <div class="stat"><div class="k">最爱产地</div><div class="v" style="font-size:24px;margin-top:12px;display:flex;align-items:center;gap:8px">${best?(CM.flag(best.key,'flag-lg')+' '+CM.find.origin(best.key).cn):'—'}</div><div class="foot">${best?'均分 '+best.avg.toFixed(1)+' · '+best.count+' 杯':''}</div></div>
      </div>

      <div class="grid mt40" style="grid-template-columns:repeat(auto-fit,minmax(330px,1fr))">
        <div class="card" style="padding:22px"><h4 class="muted" style="margin-bottom:14px">产地 · 杯数 Top</h4><div id="ch-origin"></div></div>
        <div class="card" style="padding:22px"><h4 class="muted" style="margin-bottom:14px">处理法分布</h4><div id="ch-process"></div></div>
        <div class="card" style="padding:22px"><h4 class="muted" style="margin-bottom:14px">烘焙度分布</h4><div id="ch-roast"></div></div>
        <div class="card" style="padding:22px"><h4 class="muted" style="margin-bottom:14px">冲煮方法</h4><div id="ch-brew"></div></div>
        <div class="card" style="padding:22px"><h4 class="muted" style="margin-bottom:14px">产地 · 平均评分</h4><div id="ch-score"></div></div>
        <div class="card" style="padding:22px"><h4 class="muted" style="margin-bottom:14px">风味 DNA 雷达</h4><div id="ch-radar" class="center"></div></div>
      </div>

      <div class="section-head mt40"><h2>风味热力图</h2><div class="sub">13 大风味类别的偏好强度 · 点击看知识</div></div>
      <div class="card" style="padding:24px"><div class="heat" id="heat"></div></div>`;

    // bars: origin count
    document.getElementById('ch-origin').appendChild(CM.charts.bars(byOrigin.slice(0,8).map(d=>{
      const o=CM.find.origin(d.key); return {key:d.key,label:o.cn,emoji:CM.flag(d.key),value:d.count,display:d.count+' 杯',onClick:()=>filterBy('origin',d.key)};
    })));
    // donut process
    const byProc=CM.aggregate(recs,r=>r.processes||[]);
    document.getElementById('ch-process').appendChild(CM.charts.donut(byProc.map(d=>{const p=CM.find.process(d.key);return{key:d.key,label:p?p.cn:d.key,value:d.count,color:p?p.color:'#ccc'};}),{centerSub:'记录',onClick:k=>openKnowledge('process',k)}));
    // donut roast
    const byRoast=CM.aggregate(recs,r=>r.roast);
    document.getElementById('ch-roast').appendChild(CM.charts.donut(byRoast.map(d=>{const x=CM.find.roast(d.key);return{key:d.key,label:x?x.cn:d.key,value:d.count,color:x?x.color:'#ccc'};}),{centerSub:'记录',onClick:k=>openKnowledge('roast',k)}));
    // bars brew
    const byBrew=CM.aggregate(recs,r=>r.brew);
    document.getElementById('ch-brew').appendChild(CM.charts.bars(byBrew.map(d=>{const b=CM.find.brew(d.key);return{label:b?b.cn:d.key,emoji:CM.icon('cup',{size:14}),value:d.count,display:d.count};})));
    // bars score by origin
    document.getElementById('ch-score').appendChild(CM.charts.bars(byOrigin.filter(d=>d.avg).slice(0,8).map(d=>{const o=CM.find.origin(d.key);return{label:o.cn,emoji:CM.flag(d.key),value:+d.avg.toFixed(2),display:d.avg.toFixed(1),color:'#e0a73a'};})));
    // radar flavor groups
    const fg=flavorGroupCounts(recs); const maxg=Math.max(1,...fg.map(g=>g.count));
    const axes=CM.flavorGroups.map(g=>({label:g.cn,color:g.color,emoji:''}));
    const series=[{name:'你',color:'#8a5a2b',values:CM.flavorGroups.map(g=>(fg.find(x=>x.id===g.id)?.count||0)/maxg)}];
    document.getElementById('ch-radar').appendChild(CM.charts.radar(axes,series,300));
    // heatmap
    const heat=document.getElementById('heat'); const fc=flavorGroupCounts(recs); const maxc=Math.max(1,...fc.map(g=>g.count));
    heat.innerHTML=CM.flavorGroups.map(g=>{ const ct=fc.find(x=>x.id===g.id)?.count||0; const a=ct?(.2+.8*ct/maxc):0;
      return `<div class="cell" data-kt="flavor" data-kk="${g.id}" title="${g.cn} · ${ct}" style="background:${ct?hexA(g.color,a):'var(--bg-2)'};color:${a>.55?'#fff':'var(--ink-2)'}">
        <b style="font-size:16px">${ct}</b>${g.cn}</div>`;
    }).join('');
  }
  function flavorGroupCounts(recs){
    const m={}; CM.flavorGroups.forEach(g=>m[g.id]={id:g.id,count:0});
    recs.forEach(r=>(r.flavors||[]).forEach(f=>{const g=CM.find.flavorOf(f); if(g)m[g.id].count++;}));
    return Object.values(m);
  }
  function hexA(hex,a){ const n=parseInt(hex.slice(1),16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; }

  /* ================= 视图：相册 ================= */
  function renderAlbum(){
    const c=document.getElementById('view-album');
    const pics=CM.store.all().flatMap(r=>(r.photos||[]).map(p=>({src:p,r})));
    c.innerHTML=`<div class="section-head"><h2>咖啡相册</h2><div class="sub">${pics.length} 张照片 · 自动汇总自每条记录</div></div>
      ${pics.length?`<div class="album">${pics.map((p,i)=>`<img class="pic" src="${p.src}" data-i="${i}" loading="lazy">`).join('')}</div>`:
        `<div class="empty"><div class="ic">${CM.icon('camera',{size:46,stroke:1.4})}</div><h3>相册还是空的</h3><p>在记录里上传照片，会自动汇总到这里</p></div>`}`;
    c.querySelectorAll('.pic').forEach(img=> img.onclick=()=>{ const p=pics[+img.dataset.i];
      openModal(p.r.name||'照片',`<img src="${p.src}" style="width:100%;border-radius:14px">
        <div class="mt16 flex gap8" style="justify-content:space-between;align-items:center">
        <span class="muted">${originTag(p.r.origin)} · ${CM.fmtDate(p.r.tastedAt)}</span>
        <button class="btn ghost sm" onclick="CM.app.openRecord('${p.r.id}')">查看记录 →</button></div>`,{wide:true}); });
  }

  /* ================= 视图：护照 ================= */
  function renderPassport(){
    const c=document.getElementById('view-passport'); const recs=CM.store.all();
    const got=new Set(recs.map(r=>r.origin));
    const ach=achievements(recs);
    c.innerHTML=`
      <div class="hero"><h1>咖啡 <span class="grad">护照</span></h1><p>你已集齐 ${got.size} / ${CM.origins.length} 个产地印章</p></div>
      <div class="flex gap12 mt16" style="justify-content:center;flex-wrap:wrap">
        <button class="btn dark" onclick="CM.app.openWrapped()">${CM.icon('award',{size:16})} 生成年度报告</button>
        <button class="btn ghost" onclick="CM.app.openBlind()">${CM.icon('target',{size:16})} 盲品猜产地</button>
      </div>
      <div class="section-head mt40"><h2>世界产地印章</h2><div class="sub">点亮你喝过的每一个国家</div></div>
      <div class="grid stamp-grid">${CM.origins.map(o=>{const g=got.has(o.key);const ct=recs.filter(r=>r.origin===o.key).length;
        return `<div class="stamp ${g?'got':''}" ${g?`onclick="CM.app.openKnowledge('origin','${o.key}')" style="cursor:pointer"`:''}>
          <span class="em">${CM.flag(o.key,'flag-lg')}</span><span class="nm">${o.cn}</span><span class="ct">${g?ct+' 杯':'未解锁'}</span></div>`;}).join('')}</div>
      <div class="section-head mt40"><h2>成就</h2><div class="sub">${ach.filter(a=>a.got).length} / ${ach.length} 已达成</div></div>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))">
        ${ach.map(a=>`<div class="ach ${a.got?'':'locked'}"><div class="ic" style="color:var(--accent)">${CM.icon(a.icon,{size:24})}</div><div class="meta"><div class="t">${a.title}</div><div class="d">${a.desc}</div></div></div>`).join('')}</div>`;
  }
  function achievements(recs){
    const origins=new Set(recs.map(r=>r.origin));
    const procs=new Set(recs.flatMap(r=>r.processes||[]));
    const flavs=new Set(recs.flatMap(r=>r.flavors||[]));
    const has=fn=>recs.some(fn);
    return [
      {icon:'globe',title:'环球咖啡客',desc:`品鉴 ${origins.size} 个产地（目标 10）`,got:origins.size>=10},
      {icon:'flower',title:'瑰夏猎人',desc:'品鉴过瑰夏 Geisha',got:has(r=>(r.varieties||[]).includes('geisha'))},
      {icon:'flask',title:'厌氧实验家',desc:'尝试过厌氧/CM 处理',got:[...procs].some(p=>['anaerobic','carbonic','doubleferment'].includes(p))},
      {icon:'sparkle',title:'五星时刻',desc:'给出过一杯满分',got:has(r=>r.score>=5)},
      {icon:'palette',title:'风味广度',desc:`记录 ${flavs.size} 种风味（目标 15）`,got:flavs.size>=15},
      {icon:'cup',title:'十杯达成',desc:`累计 ${recs.length} 杯（目标 10）`,got:recs.length>=10},
      {icon:'flame',title:'深烘也懂',desc:'记录过中深/深烘',got:has(r=>['mediumdark','dark'].includes(r.roast))},
      {icon:'droplet',title:'水洗纯粹党',desc:'记录过 5 杯水洗',got:recs.filter(r=>(r.processes||[]).includes('washed')).length>=5},
    ];
  }

  /* ================= 记录表单（创建/编辑）================= */
  function openForm(prefill={}, editId=null){
    const r=editId?CM.store.get(editId):prefill;
    const m=openModal(editId?'编辑记录':'记录一杯咖啡',`
      <div class="field"><label>咖啡名称 / 豆名 <span class="opt">选填</span></label><input class="input" id="f-name" placeholder="如：耶加雪菲 科契尔" value="${CM.esc(r.name||'')}"></div>
      <div class="row2">
        <div class="field"><label>国家 / 产区</label><div id="f-origin"></div></div>
        <div class="field"><label>庄园 / 地块 <span class="opt">选填</span></label><input class="input" id="f-estate" placeholder="如：翡翠庄园 / Lot 18" value="${CM.esc(r.estate||'')}"></div>
      </div>
      <div class="field"><label>子产区 <span class="opt">可多选/自定义</span></label><div id="f-region"></div></div>
      <div class="row2">
        <div class="field"><label>豆种 <span class="opt">可多选</span></label><div id="f-variety"></div></div>
        <div class="field"><label>处理法 <span class="opt">可多选</span></label><div id="f-process"></div></div>
      </div>
      <div class="row2">
        <div class="field"><label>烘焙度</label><div id="f-roast"></div></div>
        <div class="field"><label>海拔</label><div id="f-altitude"></div></div>
      </div>
      <div class="field"><label>风味 <span class="opt">SCA 风味轮，可多选/自定义</span></label><div id="f-flavor"></div></div>
      <div class="divider"></div>
      <div class="row2">
        <div class="field"><label>咖啡店</label><input class="input" id="f-shop" placeholder="如：Blue Bottle" value="${CM.esc(r.shop||'')}"></div>
        <div class="field"><label>鉴赏时间</label><input class="input" type="date" id="f-date" value="${r.tastedAt||new Date().toISOString().slice(0,10)}"></div>
      </div>
      <div class="row2">
        <div class="field"><label>冲煮方法</label><div id="f-brew"></div></div>
        <div class="field"><label>价格 <span class="opt">选填，元</span></label><input class="input" type="number" id="f-price" placeholder="如：42" value="${r.price||''}"></div>
      </div>
      <div class="field"><label>风味打分（5 分制）</label><div id="f-rate"></div></div>
      <div class="field"><label>品鉴笔记 <span class="opt">选填</span></label><textarea class="input" id="f-notes" rows="3" placeholder="记录此刻的味觉旅程…">${CM.esc(r.notes||'')}</textarea></div>
      <div class="field"><label>照片 <span class="opt">可拖拽多张</span></label>
        <div class="drop" id="f-drop"><div class="ic">${CM.icon('camera',{size:30,stroke:1.5})}</div><div>点击或拖拽上传照片</div></div>
        <div class="thumb-row" id="f-thumbs"></div>
        <input type="file" id="f-file" accept="image/*" multiple hidden></div>
      <div class="flex gap12 mt24" style="justify-content:flex-end">
        ${editId?`<button class="btn ghost" onclick="CM.app.deleteRecord('${editId}')">删除</button>`:''}
        <button class="btn primary" id="f-save">保存记录</button></div>
    `,{wide:true});

    const inputs={
      origin:tagInput({options:OPT.origin,value:r.origin?[r.origin]:[],single:true,allowCustom:true,label:'国家/产区',placeholder:'点击选择国家/产区'}),
      region:tagInput({options:OPT.region,value:r.regions||[],allowCustom:true,label:'子产区',placeholder:'点击选择/添加子产区'}),
      variety:tagInput({options:OPT.variety,value:r.varieties||[],allowCustom:true,label:'豆种',placeholder:'点击选择豆种'}),
      process:tagInput({options:OPT.process,value:r.processes||[],allowCustom:true,label:'处理法',placeholder:'点击选择处理法'}),
      roast:tagInput({options:OPT.roast,value:r.roast?[r.roast]:[],single:true,allowCustom:false,label:'烘焙度',placeholder:'点击选择烘焙度'}),
      altitude:tagInput({options:OPT.altitude,value:r.altitude?[r.altitude]:[],single:true,allowCustom:false,label:'海拔',placeholder:'点击选择海拔'}),
      brew:tagInput({options:OPT.brew,value:r.brew?[r.brew]:[],single:true,allowCustom:true,label:'冲煮',placeholder:'点击选择冲煮方法'}),
      flavor:tagInput({options:OPT.flavor,value:r.flavors||[],allowCustom:true,label:'风味',placeholder:'点击选择/添加风味'}),
    };
    Object.entries(inputs).forEach(([k,v])=> m.body.querySelector('#f-'+k).appendChild(v.el));

    // rating（SVG 星，支持半星）
    let score=r.score||0; const rate=m.body.querySelector('#f-rate'); const RS=30;
    function drawRate(v){
      rate.innerHTML=Array.from({length:5},(_,i)=>{const idx=i+1; const w=v>=idx?100:(v>=idx-0.5?50:0);
        return `<span class="rstar" data-i="${idx}"><span class="rbg">${CM.starSVG('#e3e3e6',RS)}</span><span class="rfg" style="width:${w}%">${CM.starSVG('#e0a73a',RS)}</span></span>`;}).join('')
        +`<span class="rlab">${v?v.toFixed(1):''}</span>`;
      rate.querySelectorAll('.rstar').forEach(st=>{ const idx=+st.dataset.i;
        st.onmousemove=e=>{const half=e.offsetX<st.offsetWidth/2; preview(half?idx-0.5:idx);};
        st.onclick=e=>{const half=e.offsetX<st.offsetWidth/2; score=half?idx-0.5:idx; drawRate(score);};
      });
    }
    function preview(v){ rate.querySelectorAll('.rstar').forEach(st=>{const idx=+st.dataset.i; st.querySelector('.rfg').style.width=(v>=idx?100:(v>=idx-0.5?50:0))+'%';}); }
    rate.onmouseleave=()=>drawRate(score); drawRate(score);

    // photos
    let photos=[...(r.photos||[])]; const thumbs=m.body.querySelector('#f-thumbs');
    function paintThumbs(){ thumbs.innerHTML=photos.map((p,i)=>`<div class="thumb-wrap"><img class="thumb" src="${p}"><span class="rm" data-i="${i}">${CM.icon('x',{size:12,stroke:2.4})}</span></div>`).join('');
      thumbs.querySelectorAll('.rm').forEach(b=>b.onclick=()=>{photos.splice(+b.dataset.i,1);paintThumbs();}); }
    paintThumbs();
    const drop=m.body.querySelector('#f-drop'), file=m.body.querySelector('#f-file');
    drop.onclick=()=>file.click();
    file.onchange=async()=>{ for(const f of file.files){ photos.push(await CM.resizeImage(f)); } paintThumbs(); file.value=''; };
    ['dragover','dragenter'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over');}));
    ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over');}));
    drop.addEventListener('drop',async e=>{ for(const f of e.dataTransfer.files){ if(f.type.startsWith('image/')) photos.push(await CM.resizeImage(f)); } paintThumbs(); });

    const saveBtn=m.body.querySelector('#f-save');
    saveBtn.onclick=async()=>{
      const rec={
        id:editId||undefined, createdAt:editId?r.createdAt:Date.now(),
        name:m.body.querySelector('#f-name').value.trim(),
        origin:inputs.origin.get()[0]||'',
        estate:m.body.querySelector('#f-estate').value.trim(),
        regions:inputs.region.get(), varieties:inputs.variety.get(), processes:inputs.process.get(),
        roast:inputs.roast.get()[0]||'', altitude:inputs.altitude.get()[0]||'',
        flavors:inputs.flavor.get(),
        shop:m.body.querySelector('#f-shop').value.trim(),
        tastedAt:m.body.querySelector('#f-date').value,
        brew:inputs.brew.get()[0]||'',
        price:parseFloat(m.body.querySelector('#f-price').value)||undefined,
        score, notes:m.body.querySelector('#f-notes').value.trim(), photos,
      };
      if(!rec.origin){ toast('请选择国家/产区'); return; }
      saveBtn.disabled=true; saveBtn.textContent='保存中…';
      try{ rec.photos = await uploadPhotos(photos); }catch(e){ console.warn('photos',e); }  // 登录态把照片传存储桶→只存URL；失败退回原样不丢
      if(editId) CM.store.update(editId,rec); else CM.store.add(rec);
      m.close(); refresh(); toast(editId?'已更新':'已记录 · 干得漂亮');
    };
  }

  /* ================= 记录明细弹窗 ================= */
  function openRecord(id){
    const r=CM.store.get(id); if(!r) return; const o=CM.find.origin(r.origin)||{};
    const sec=(label,html)=>html?`<div class="field"><label>${label}</label><div class="wrap-tags">${html}</div></div>`:'';
    const roast=CM.find.roast(r.roast), brew=CM.find.brew(r.brew), alt=CM.altitudes.find(a=>a.id===r.altitude);
    const body=`
      ${r.photos&&r.photos.length?`<div class="flex gap8" style="overflow:auto;margin-bottom:18px">${r.photos.map(p=>`<img src="${p}" style="height:170px;border-radius:14px">`).join('')}</div>`:''}
      <div class="flex" style="justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
        <div><h2 style="font-size:24px">${CM.esc(r.name||o.cn||'一杯咖啡')}</h2>
          <div class="muted mt8">${CM.fmtDate(r.tastedAt)} · ${CM.esc(r.shop||'—')}${r.price?' · ¥'+r.price:''}</div></div>
        <div class="score-pill" style="font-size:20px">${CM.starHTML(r.score)} <b>${(r.score||0).toFixed(1)}</b></div>
      </div>
      <div class="divider"></div>
      ${sec('国家 / 产区', originTag(r.origin)+(r.estate?` <span class="tag ghost">${CM.icon('building',{size:13})} ${CM.esc(r.estate)}</span>`:''))}
      ${sec('子产区',(r.regions||[]).map(x=>`<span class="tag ghost">${CM.icon('pin',{size:13})} ${CM.esc(x)}</span>`).join(''))}
      ${sec('豆种',(r.varieties||[]).map(v=>{const x=CM.find.variety(v);return ktag('variety',v,x?x.cn:v);}).join(''))}
      ${sec('处理法',(r.processes||[]).map(p=>{const x=CM.find.process(p);return ktag('process',p,x?x.cn:p,x&&x.color);}).join(''))}
      ${sec('烘焙度 / 海拔',(roast?ktag('roast',r.roast,roast.cn,roast.color):'')+(alt?` ${ktag('altitude',r.altitude,alt.cn)}`:''))}
      ${sec('风味',(r.flavors||[]).map(f=>{const g=CM.find.flavorOf(f);return ktag('flavor',f,f,g&&g.color);}).join(''))}
      ${sec('冲煮方法',brew?ktag('brew',r.brew,brew.cn):'')}
      ${r.notes?`<div class="field"><label>品鉴笔记</label><p class="kdesc">${CM.esc(r.notes)}</p></div>`:''}
      <div class="flex gap12 mt24" style="justify-content:flex-end">
        <button class="btn ghost" onclick="CM.app.shareRecord('${r.id}')">${CM.icon('image',{size:15})} 生成分享图</button>
        <button class="btn dark" onclick="CM.app.editRecord('${r.id}')">编辑</button></div>`;
    openModal('品鉴明细',body,{wide:true});
  }

  /* ================= 知识卡片弹窗 ================= */
  function openKnowledge(type,key){ const k=CM.knowledge.render(type,key,CM.store.all()); openModal(k.title,k.html,{onMount:(body)=>{ if(k.mount) k.mount(body); }}); }

  /* ================= 生成分享图 ================= */
  async function shareRecord(id){
    const r=CM.store.get(id); const o=CM.find.origin(r.origin)||{};
    const card=document.createElement('div'); card.className='share-card';
    card.style.cssText+=';position:fixed;left:-9999px;top:0';
    const flavs=(r.flavors||[]).slice(0,6).map(f=>{const g=CM.find.flavorOf(f);return `<span class="tag" style="background:${g?hexA(g.color,.16):'#eee'};color:${g?g.color:'#333'}">${CM.esc(f)}</span>`;}).join('');
    const flagBig=CM.flagSrc(o.key)?`<img src="${CM.flagSrc(o.key)}" style="width:58px;height:43px;border-radius:7px;object-fit:cover;box-shadow:0 0 0 1px rgba(0,0,0,.1)">`:CM.icon('cup',{size:44});
    card.innerHTML=`<div class="sc-flag">${flagBig}</div>
      <div class="sc-title">${CM.esc(r.name||o.cn||'一杯咖啡')}</div>
      <div class="sc-sub">${o.cn||''} ${r.estate?'· '+CM.esc(r.estate):''}</div>
      <div style="margin-top:14px;display:flex;align-items:center;gap:8px">${CM.starHTML(r.score,22)} <b style="font-size:20px">${(r.score||0).toFixed(1)}</b></div>
      <div class="sc-tags">${flavs}</div>
      ${r.notes?`<p style="color:#3a3a3c;font-size:15px;line-height:1.6">“${CM.esc(r.notes)}”</p>`:''}
      <div class="sc-foot"><span>${CM.fmtDate(r.tastedAt)} · ${CM.esc(r.shop||'')}</span><span class="sc-brand" style="display:inline-flex;align-items:center;gap:6px">${CM.icon('cup',{size:16})} CoffeeMap</span></div>`;
    document.body.appendChild(card);
    try{
      const canvas=await html2canvas(card,{backgroundColor:null,scale:2});
      const url=canvas.toDataURL('image/png');
      openModal('分享图',`<img src="${url}" style="width:100%;border-radius:18px;box-shadow:var(--shadow)">
        <div class="center mt16"><a class="btn primary" href="${url}" download="coffeemap-${r.id}.png">${CM.icon('download',{size:15})} 下载图片</a></div>`);
    }catch(e){ toast('生成失败：'+e.message); }
    finally{ card.remove(); }
  }

  /* ================= 年度报告 Wrapped ================= */
  function openWrapped(){
    const recs=CM.store.all(); if(!recs.length){ toast('还没有记录'); return; }
    const year=(recs[0].tastedAt||'').slice(0,4)||new Date().getFullYear();
    const yr=recs.filter(r=>(r.tastedAt||'').startsWith(year));
    const list=yr.length?yr:recs;
    const byOrigin=CM.aggregate(list,r=>r.origin);
    const byFlavor=CM.aggregate(list,r=>r.flavors||[]);
    const best=list.slice().sort((a,b)=>(b.score||0)-(a.score||0))[0];
    const o=CM.find.origin((byOrigin[0]||{}).key)||{};
    const bo=CM.find.origin(best.origin)||{};
    openModal(`${year} 年度咖啡报告`,`
      <div style="background:linear-gradient(165deg,#2a1d12,#5e3a1e);border-radius:20px;padding:30px;color:#fff;margin-bottom:20px">
        <div style="font-size:13px;letter-spacing:.1em;opacity:.7">YOUR ${year} IN COFFEE</div>
        <div style="font-size:46px;font-weight:700;margin:6px 0">${list.length} 杯</div>
        <div style="opacity:.85">跨越 ${new Set(list.map(r=>r.origin)).size} 个产地 · ${new Set(list.flatMap(r=>r.flavors||[])).size} 种风味</div>
      </div>
      <div class="grid stat-grid">
        <div class="stat"><div class="k">最常喝产地</div><div class="v" style="font-size:22px;margin-top:10px;display:flex;align-items:center;gap:8px">${CM.flag(o.key,'flag-lg')} ${o.cn||'—'}</div><div class="foot">${(byOrigin[0]||{}).count||0} 杯</div></div>
        <div class="stat"><div class="k">最爱风味</div><div class="v" style="font-size:24px;margin-top:10px">${(byFlavor[0]||{}).key||'—'}</div><div class="foot">出现 ${(byFlavor[0]||{}).count||0} 次</div></div>
        <div class="stat"><div class="k">年度之杯</div><div class="v" style="font-size:19px;margin-top:10px;display:flex;align-items:center;gap:8px">${CM.flag(best.origin,'flag-lg')} ${CM.esc(best.name||bo.cn||'')}</div><div class="foot">${(best.score||0).toFixed(1)} 分</div></div>
        <div class="stat"><div class="k">平均分</div><div class="v">${(list.filter(r=>r.score).reduce((s,r)=>s+r.score,0)/(list.filter(r=>r.score).length||1)).toFixed(2)}<small>分</small></div></div>
      </div>
      <p class="muted center mt24" style="font-size:13px">继续探索，明年的地图会更精彩</p>`,{wide:true});
  }

  /* ================= 盲品猜产地 ================= */
  function openBlind(){
    const recs=CM.store.all().filter(r=>r.origin&&(r.flavors||[]).length);
    if(recs.length<4){ toast('记录满 4 条带风味的咖啡后开启盲品'); return; }
    state.blind={score:0,round:0};
    const m=openModal(CM.icon('target',{size:18})+' 盲品猜产地',`<div id="blind"></div>`);
    nextBlind(m.body.querySelector('#blind'));
  }
  function nextBlind(holder){
    const recs=CM.store.all().filter(r=>r.origin&&(r.flavors||[]).length);
    const pick=recs[Math.floor((performance.now()*7)%recs.length)];
    const others=[...new Set(recs.map(r=>r.origin))].filter(k=>k!==pick.origin);
    shuffle(others); const opts=shuffle([pick.origin,...others.slice(0,3)]);
    const roast=CM.find.roast(pick.roast);
    holder.innerHTML=`
      <div class="muted" style="font-size:13px">第 ${state.blind.round+1} 题 · 当前得分 ${state.blind.score}</div>
      <p class="mt8">根据下列线索，猜猜它来自哪个产地：</p>
      <div class="wrap-tags mt8">${(pick.flavors||[]).map(f=>{const g=CM.find.flavorOf(f);return `<span class="tag" style="background:${g?hexA(g.color,.16):'#eee'}">${CM.esc(f)}</span>`;}).join('')}</div>
      <div class="muted mt8" style="font-size:13px">处理法：${(pick.processes||[]).map(p=>(CM.find.process(p)||{}).cn||p).join('、')||'未知'} · 烘焙：${roast?roast.cn:'未知'}</div>
      <div class="grid mt24" style="grid-template-columns:1fr 1fr;gap:12px" id="blind-opts">
        ${opts.map(k=>{const o=CM.find.origin(k);return `<button class="btn ghost" data-k="${k}" style="justify-content:flex-start;padding:14px;gap:8px">${CM.flag(k)} ${o.cn}</button>`;}).join('')}</div>`;
    holder.querySelectorAll('#blind-opts button').forEach(b=> b.onclick=()=>{
      const correct=b.dataset.k===pick.origin;
      holder.querySelectorAll('#blind-opts button').forEach(x=>{ x.disabled=true;
        if(x.dataset.k===pick.origin) x.style.cssText+=';background:#e9f7ee;border-color:#34c759;color:#1d7d3f';
        else if(x===b) x.style.cssText+=';background:#fdecec;border-color:#ff3b30;color:#c0392b'; });
      if(correct) state.blind.score++;
      state.blind.round++;
      const o=CM.find.origin(pick.origin);
      const fb=document.createElement('div'); fb.className='center mt24';
      fb.innerHTML=`<div style="font-size:15px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:7px">${correct?`<span style="color:var(--good)">${CM.icon('check',{size:18,stroke:2.4})}</span> 答对了！`:`<span style="color:#ff3b30">${CM.icon('x',{size:18,stroke:2.4})}</span> 正确答案：${CM.flag(pick.origin)} ${o.cn}`}</div>
        <div class="flex gap12 mt16" style="justify-content:center">
          <button class="btn ghost sm" onclick="CM.app.openKnowledge('origin','${pick.origin}')">了解 ${o.cn} ${CM.icon('arrowRight',{size:14})}</button>
          <button class="btn dark sm" id="blind-next">下一题</button></div>`;
      holder.appendChild(fb);
      fb.querySelector('#blind-next').onclick=()=>nextBlind(holder);
    });
  }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor((performance.now()*13+i)% (i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

  /* ================= 搜索 / 筛选 ================= */
  function applySearch(recs){ const q=state.search.trim().toLowerCase(); return q?recs.filter(r=>CM.recordText(r).includes(q)):recs; }
  function applyFilter(recs){ if(!state.filter)return recs; const{type,key}=state.filter;
    return recs.filter(r=>CM.knowledge.relatedStats(type,key,[r]).count>0); }
  function filterBanner(){ if(!state.filter)return ''; const{type,key}=state.filter; const k=CM.knowledge.resolve(type,key);
    return `<div class="flex gap8" style="align-items:center;margin-bottom:16px"><span class="muted" style="font-size:13px">筛选：</span>
      <span class="tag solid">${typeVis(type,key,k&&k.color)} ${CM.esc(k?k.title:key)} <span style="margin-left:4px;cursor:pointer;display:inline-flex" onclick="CM.app.clearFilter()">${CM.icon('x',{size:12,stroke:2.4})}</span></span></div>`; }
  function filterBy(type,key){ state.filter={type,key}; while(modalStack.length){const s=modalStack.pop();s.classList.remove('show');setTimeout(()=>s.remove(),250);} switchView('table'); }
  function clearFilter(){ state.filter=null; renderTable(); }

  /* ================= 视图切换 / 刷新 ================= */
  const RENDER={map:renderMap,cards:renderCards,table:renderTable,stats:renderStats,album:renderAlbum,passport:renderPassport};
  function switchView(v){
    document.querySelectorAll('.suggest').forEach(s=>s.remove());   // 兜底：清掉任何残留下拉浮层
    state.view=v;
    document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.v===v));
    document.querySelectorAll('.view').forEach(s=>s.classList.toggle('active',s.id==='view-'+v));
    RENDER[v]&&RENDER[v]();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function refresh(){ RENDER[state.view]&&RENDER[state.view](); updateCounts(); }
  function updateCounts(){ const n=CM.store.all().length; const b=document.getElementById('navCount'); if(b)b.textContent=n; }

  function emptyState(){ return `<div class="empty"><div class="ic" style="color:var(--accent)">${CM.icon('cup',{size:50,stroke:1.4})}</div><h3>开始你的咖啡风味之旅</h3>
    <p>记录第一杯，地图、统计与护照都会随之点亮</p>
    <button class="btn dark mt16" onclick="CM.app.openForm()">${CM.icon('plus',{size:15})} 记录一杯</button></div>`; }

  /* ================= 数据导入/导出 ================= */
  function exportData(){ const blob=new Blob([JSON.stringify(CM.store.all(),null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='coffeemap-data.json'; a.click(); toast('已导出 JSON'); }
  function importData(){
    const inp=document.createElement('input'); inp.type='file'; inp.accept='application/json,.json';
    inp.onchange=()=>{ const f=inp.files[0]; if(!f) return; const rd=new FileReader();
      rd.onload=()=>{ try{ const arr=JSON.parse(rd.result);
        if(!Array.isArray(arr)) throw new Error('格式应为记录数组');
        if(!confirm(`导入 ${arr.length} 条记录？将覆盖当前数据（建议先导出备份）。`)) return;
        arr.forEach(r=>{ r.id=r.id||CM.uid(); r.createdAt=r.createdAt||Date.now(); });
        CM.store.replaceAll(arr); state.selectedOrigin=null; refresh(); toast(`已导入 ${arr.length} 条`);
      }catch(e){ toast('导入失败：'+e.message); } };
      rd.readAsText(f); };
    inp.click();
  }
  function clearAll(){ if(confirm('确定清空所有记录？此操作不可撤销。')){ CM.store.clear(); state.selectedOrigin=null; refresh(); toast('已清空'); } }

  /* ================= 初始化 ================= */
  let booted=false;
  function init(){
    // 移动端底部导航（与顶部共用 .tab/data-v，switchView 自动同步高亮）
    const BN=[['map','地图','map'],['cards','卡片','grid'],['table','明细','list'],['stats','统计','chart'],['album','相册','image'],['passport','护照','book']];
    document.getElementById('botnav').innerHTML=BN.map(([v,label,ic])=>`<button class="tab ${v==='map'?'active':''}" data-v="${v}">${CM.icon(ic,{size:22})}<span>${label}</span></button>`).join('');
    document.getElementById('fabAdd').onclick=()=>openForm();
    // 全局委托：标签→知识卡，卡片/行→明细
    document.addEventListener('click',e=>{
      const kt=e.target.closest('[data-kt]'); if(kt){ e.stopPropagation(); openKnowledge(kt.dataset.kt,kt.dataset.kk); return; }
      const rec=e.target.closest('[data-rec]'); if(rec && !e.target.closest('button')){ openRecord(rec.dataset.rec); }
    });
    // 搜索
    const si=document.getElementById('searchInput');
    si.addEventListener('input',()=>{ state.search=si.value; if(state.view==='cards')renderCards(); else if(state.view==='table')renderTable(); else if(state.view==='album')renderAlbum(); else switchView('cards'); });
    // 导航
    document.querySelectorAll('.tab').forEach(t=> t.onclick=()=>switchView(t.dataset.v));
    document.getElementById('addBtn').onclick=()=>openForm();
    document.addEventListener('cm:changed',updateCounts);
    let _ceT=0; document.addEventListener('cm:cloudError',()=>{ const n=Date.now(); if(n-_ceT>8000){ _ceT=n; toast('网络波动，已暂存本地，联网后自动同步'); } });
    window.addEventListener('online', async ()=>{
      if(CM.cloud && CM.cloud.configured() && !CM.cloud.user){
        let s=null; try{ s=await CM.cloud.autoLogin(); }catch(e){}
        if(s && s.user){ await onAuth(s); return; }     // 联网后自动重登→onAuth 会 flushQueue 补传
      }
      try{ CM.store.flushQueue(); }catch(e){}
    });
    const ab=document.getElementById('acctBtn'); if(ab) ab.onclick=async()=>{
      if(CM.cloud && CM.cloud.configured() && !CM.cloud.enabled){
        const ok=await CM.cloud.ensureReady();
        if(!ok){ toast('云端组件未就绪，请检查网络后重试'); return; }
        CM.cloud.onChange((session)=> onAuth(session));
        let s=null; try{ s=await CM.cloud.getSession(); }catch(e){}
        await onAuth(s);
      }
      const u=CM.cloud&&CM.cloud.user; if(u) openAccount(u); else openSignIn();
    };
    bootstrap();
  }

  /* ===== 启动：有云端配置→走账号/同步；否则→本地存储 ===== */
  async function bootstrap(){
    if(!(CM.cloud && CM.cloud.configured())){       // 未配置云端 → 纯本地访客
      renderAccount(null); CM.store.seedIfEmpty(CM.seed); finishBoot(); return;
    }
    renderAccount(null);                            // 先把"登录"入口显示出来
    let ok = CM.cloud.init();
    if(!ok){ try{ ok = await CM.cloud.ensureReady(); }catch(e){} }
    if(ok){
      CM.cloud.onChange((session)=> onAuth(session));
      let session=null; try{ session=await CM.cloud.getSession(); }catch(e){}
      if(!(session && session.user)){ try{ session=await CM.cloud.autoLogin(); }catch(e){} }   // SDK 会话刷新后丢失→用本地凭证自动重登，保证保持登录、写入能同步
      if(session && session.user){ await onAuth(session); return; }
    }
    // 无有效会话（或 SDK 没起来）：若曾登录过，回放该用户的本地镜像——绝不退回示例数据，绝不丢数据
    const last = CM.store.lastUser();
    if(last){
      CM.store.setMode('cloud', last); CM.store.loadMirror();
      renderAccount(null);
      toast('已显示本地备份，登录后自动云端同步');
      booted=true; updateCounts(); switchView('map'); return;
    }
    await onAuth(null);                             // 从未登录 → 访客本地 + 示例
  }
  let _authUid='__init__';
  function onAuth(session){
    const newUid = (session && session.user) ? session.user.id : null;
    if(booted && newUid===_authUid) return Promise.resolve();   // 去重：初始化时 INITIAL_SESSION 与显式 getSession 各触发一次
    _authUid = newUid;
    return _onAuthImpl(session);
  }
  async function _onAuthImpl(session){
    const user = session && session.user;
    if(user){
      CM.cloud.setUser(user);
      CM.store.setMode('cloud', user.id);
      CM.store.loadMirror();                        // 先秒显本地镜像（绝不空屏）
      renderAccount(user); finishBoot();            // 立即出 UI
      try{ const remote=await CM.cloud.fetchAll(); CM.store.mergeRemote(remote); refresh(); }
      catch(e){ toast('云端读取失败，已显示本地备份'); }   // 失败不清空
      try{ await maybeMigrate(); }catch(e){}
      try{ await CM.store.flushQueue(); }catch(e){}  // 补传离线期间未同步的记录
      // 登录后自动把历史 base64 照片迁入 Storage（幂等、零丢失；迁完后续登录无 base64 即跳过）
      try{ if(_legacyPhotoCount()){ const mr=await migrateLegacyPhotos(); if(mr && mr.migratedPhotos) toast(`已把 ${mr.migratedPhotos} 张历史照片迁入云端存储`); } }catch(e){}
      refresh();
      return;
    }
    CM.cloud.setUser(null);
    CM.store.setMode('local'); CM.store.loadLocal(); CM.store.seedIfEmpty(CM.seed);
    renderAccount(null); finishBoot();
  }
  function finishBoot(){ updateCounts(); if(!booted){ booted=true; switchView('map'); } else refresh(); }

  function localGuestRecords(){
    let local=[]; try{ local=JSON.parse(localStorage.getItem('coffeemap.records.v1')||'[]'); }catch(e){}
    return local.filter(r=> r&&r.id && !/^s\d+$/.test(String(r.id)));   // 排除示例数据 s1..s11
  }
  function pendingLocal(){
    const cloudIds=new Set(CM.store.all().map(r=>r.id));
    return localGuestRecords().filter(r=> !cloudIds.has(r.id));
  }
  async function uploadPhotos(photos){
    if(!(CM.cloud && CM.cloud.user)) return photos;            // 未登录：照片保持 base64(本地)
    const out=[];
    for(const p of (photos||[])){
      if(typeof p==='string' && p.startsWith('data:')){
        try{ out.push(await CM.cloud.uploadPhoto(p)); }catch(e){ console.warn('uploadPhoto',e); out.push(p); }   // 失败退回 base64，不丢
      } else out.push(p);                                       // 已是 URL → 原样保留
    }
    return out;
  }
  async function uploadRecords(records){
    let ok=0; for(const r of records){ try{ await CM.cloud.upsert(r); ok++; }catch(e){ console.error('upload',e); } }
    try{ const remote=await CM.cloud.fetchAll(); CM.store.mergeRemote(remote); }catch(e){}
    refresh(); return ok;
  }

  /* ===== 历史照片迁移：把老记录 data 里的 base64 照片搬进 Storage 存储桶 =====
   * 绝对零丢失原则：①只从云端 fetchAll() 取【权威数据】(本地镜像已剥离 base64，绝不拿它当源)；
   * ②先上传成功拿到 URL，再整条 upsert 回写、只换 photos 字段其余原样；③上传或回写任一步失败，
   * 都把这张照片保留为原 base64，云端记录维持原样，下次再迁；④幂等：只处理 data: 开头的照片，
   * 已是 URL 的跳过，重复运行安全。 */
  const _isB64 = p => typeof p==='string' && p.startsWith('data:');
  function _legacyPhotoCount(){
    let n=0; CM.store.all().forEach(r=>{ if(Array.isArray(r.photos)) n+=r.photos.filter(_isB64).length; }); return n;
  }
  async function migrateLegacyPhotos(opts){
    opts = opts || {};
    if(!(CM.cloud && CM.cloud.user)) return { skipped:true };
    let cloudRecs;
    try{ cloudRecs = await CM.cloud.fetchAll(); }       // 权威数据(含 base64)
    catch(e){ return { error:'fetch' }; }
    const targets = cloudRecs.filter(r => Array.isArray(r.photos) && r.photos.some(_isB64));
    const totalPhotos = targets.reduce((n,r)=> n + r.photos.filter(_isB64).length, 0);
    if(!targets.length) return { migratedRecs:0, migratedPhotos:0, failedPhotos:0, failedRecs:0, totalPhotos:0 };
    let migratedRecs=0, migratedPhotos=0, failedPhotos=0, failedRecs=0, done=0;
    for(const r of targets){
      const newPhotos=[]; let changed=false;
      for(const p of r.photos){
        if(_isB64(p)){
          try{ const url=await CM.cloud.uploadPhoto(p); newPhotos.push(url); changed=true; migratedPhotos++; }
          catch(e){ newPhotos.push(p); failedPhotos++; console.warn('migrate upload',e); }   // 失败保留 base64，零丢失
          if(opts.onProgress) opts.onProgress(++done, totalPhotos);
        } else newPhotos.push(p);
      }
      if(changed){
        try{ await CM.cloud.upsert({ ...r, photos:newPhotos }); migratedRecs++; }   // 整条写回，只换 photos
        catch(e){ failedRecs++; console.warn('migrate upsert',e); }                 // 写回失败→云端仍是原 base64，零丢失
      }
    }
    try{ const fresh=await CM.cloud.fetchAll(); CM.store.mergeRemote(fresh); refresh(); }catch(e){}
    return { migratedRecs, migratedPhotos, failedPhotos, failedRecs, totalPhotos, targets:targets.length };
  }
  async function maybeMigrate(){
    const pending=pendingLocal();                 // 本地(访客期)未同步的记录，登录后自动上云，不用弹窗打断
    if(pending.length){ const n=await uploadRecords(pending); if(n) toast(`已把本地 ${n} 条记录同步到云端`); }
  }
  async function syncLocal(){
    if(!(CM.cloud&&CM.cloud.user)){ toast('请先登录'); return; }
    const pending=pendingLocal();
    if(!pending.length){ toast('本地没有需要上传的记录'); return; }
    const n=await uploadRecords(pending); refresh(); toast(`已上传 ${n} 条到云端`);
  }

  /* ===== 账号 UI ===== */
  function renderAccount(user){
    const b=document.getElementById('acctBtn'); if(!b) return;
    if(!(CM.cloud&&CM.cloud.configured())){ b.style.display='none'; return; }  // 只要配置了云端就常显（不依赖 SDK 是否已加载）
    b.style.display='';
    b.classList.toggle('on', !!user);
    b.innerHTML = user ? `${CM.icon('user',{size:16})}<span class="acct-label">${CM.esc((user.email||'账号').split('@')[0])}</span>`
                       : `${CM.icon('user',{size:15})}<span class="acct-label">登录</span>`;
    b.title = user ? (user.email||'我的账号') : '登录以云端同步';
  }
  function openSignIn(){
    openModal('登录 / 注册', `
      <p class="muted" style="font-size:14px;line-height:1.6;margin-bottom:18px">用<b>邮箱 + 密码</b>登录，换任何设备/浏览器用同一组邮箱密码即可同步。<b>第一次用请点「注册」</b>设置密码；之后用「登录」。</p>
      <div class="field"><label>邮箱</label><input class="input" id="si-email" type="email" placeholder="you@example.com" autocomplete="email"></div>
      <div class="field"><label>密码（至少 6 位）</label><input class="input" id="si-pw" type="password" placeholder="设置或输入密码" autocomplete="current-password"></div>
      <div class="flex gap12">
        <button class="btn primary" id="si-login" style="flex:1;justify-content:center">登录</button>
        <button class="btn ghost" id="si-reg" style="flex:1;justify-content:center">注册</button>
      </div>
      <div id="si-msg" class="center mt16" style="font-size:13px;color:var(--ink-2)"></div>
    `,{onMount:(body, close)=>{
      const email=body.querySelector('#si-email'), pw=body.querySelector('#si-pw'),
            loginBtn=body.querySelector('#si-login'), regBtn=body.querySelector('#si-reg'),
            msg=body.querySelector('#si-msg');
      const valid=()=> /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim()) && pw.value.length>=6;
      function humanize(e){ const m=(e&&e.message)||String(e);
        if(/already registered|exists/i.test(m)) return '该邮箱已注册，请直接「登录」';
        if(/invalid login|credentials/i.test(m)) return '邮箱或密码不正确';
        if(/at least 6/i.test(m)) return '密码至少 6 位';
        return m; }
      async function login(){ if(!valid()){ msg.textContent='请输入邮箱和至少 6 位密码'; return; }
        loginBtn.disabled=true; loginBtn.textContent='登录中…';
        try{ const {error}=await CM.cloud.signInPassword(email.value.trim(), pw.value); if(error) throw error; close(); toast('登录成功'); }
        catch(e){ msg.textContent='登录失败：'+humanize(e)+'（没有账号请点「注册」）'; loginBtn.disabled=false; loginBtn.textContent='登录'; }
      }
      async function register(){ if(!valid()){ msg.textContent='请输入邮箱和至少 6 位密码'; return; }
        regBtn.disabled=true; regBtn.textContent='注册中…';
        try{ const {data,error}=await CM.cloud.signUp(email.value.trim(), pw.value); if(error) throw error;
          if(data && data.session){ close(); toast('注册成功，已登录'); }
          else { msg.textContent='注册成功，但项目仍开着「邮箱确认」。请到 Supabase 关闭 Confirm email 后，再点「登录」。'; regBtn.disabled=false; regBtn.textContent='注册'; }
        }catch(e){ msg.textContent='注册失败：'+humanize(e); regBtn.disabled=false; regBtn.textContent='注册'; }
      }
      loginBtn.onclick=login; regBtn.onclick=register;
      pw.addEventListener('keydown',ev=>{ if(ev.key==='Enter') login(); });
      email.focus();
    }});
  }
  function openAccount(user){
    const pend=pendingLocal().length;
    const legacy=_legacyPhotoCount();
    openModal('我的账号', `
      <div class="flex gap12" style="align-items:center;margin-bottom:20px">
        <div style="width:48px;height:48px;border-radius:50%;background:var(--bg-2);display:flex;align-items:center;justify-content:center;color:var(--accent)">${CM.icon('user',{size:24})}</div>
        <div><div style="font-weight:600">${CM.esc(user.email||'已登录')}</div>
          <div class="muted" style="font-size:12.5px;display:flex;align-items:center;gap:5px;margin-top:2px">${CM.icon('cloud',{size:13})} 云端同步中 · ${CM.store.all().length} 条记录</div></div>
      </div>
      ${pend ? `<button class="btn primary" id="ac-sync" style="width:100%;justify-content:center;margin-bottom:10px">${CM.icon('cloud',{size:15})} 上传本地 ${pend} 条未同步记录</button>`
             : `<button class="btn ghost" id="ac-sync" style="width:100%;justify-content:center;margin-bottom:10px">${CM.icon('cloud',{size:15})} 同步本地记录到云端</button>`}
      ${legacy ? `<button class="btn ghost" id="ac-mig" style="width:100%;justify-content:center;margin-bottom:10px">${CM.icon('image',{size:15})} 把 ${legacy} 张历史照片迁入云端存储</button>` : ''}
      <button class="btn ghost" id="ac-out" style="width:100%;justify-content:center">${CM.icon('logout',{size:15})} 退出登录</button>
    `,{onMount:(body,close)=>{
      body.querySelector('#ac-sync').onclick=async()=>{ await syncLocal(); close(); };
      const mig=body.querySelector('#ac-mig');
      if(mig) mig.onclick=async()=>{
        mig.disabled=true;
        const r=await migrateLegacyPhotos({ onProgress:(d,t)=>{ mig.textContent=`迁移中… ${d}/${t}`; } });
        if(r && r.error){ mig.disabled=false; mig.innerHTML=`${CM.icon('image',{size:15})} 重试：把历史照片迁入云端`; toast('云端读取失败，请检查网络后重试'); return; }
        const okP=r.migratedPhotos||0, failP=(r.failedPhotos||0)+(r.failedRecs||0);
        close();
        toast(failP ? `已迁移 ${okP} 张，${failP} 张未成功已保留原图，可再点一次` : `已把 ${okP} 张历史照片全部迁入云端存储`);
      };
      const out=body.querySelector('#ac-out');
      out.onclick=()=>{
        // 立即本地登出并重置 UI —— 不 await 任何 SDK/网络调用，绝不会卡在"退出中"
        _authUid=null;
        CM.cloud.setUser(null);
        CM.store.setMode('local'); CM.store.setUserId(null); CM.store.loadLocal(); CM.store.seedIfEmpty(CM.seed);
        renderAccount(null); close(); switchView('map'); toast('已退出登录');
        try{ CM.cloud.signOut('local'); }catch(e){}   // 后台尽力注销(同步清 token 已在其内完成)，不阻塞
      };
    }});
  }

  return { init, switchView, openForm, openRecord, editRecord:id=>openForm({},id), deleteRecord:id=>{ if(confirm('删除这条记录？')){CM.store.remove(id); while(modalStack.length){const s=modalStack.pop();s.classList.remove('show');setTimeout(()=>s.remove(),250);} refresh(); toast('已删除');} },
    openKnowledge, filterBy, clearFilter, shareRecord, openWrapped, openBlind, exportData, importData, clearAll, refresh,
    migrateLegacyPhotos, legacyPhotoCount:_legacyPhotoCount };
})();
document.addEventListener('DOMContentLoaded',CM.app.init);
