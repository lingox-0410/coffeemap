/* ============================================================================
 * CoffeeMap · 知识卡片 (knowledge.js)
 * 点击任意标签 → 该豆种/产区/处理法/风味…的知识介绍
 * ==========================================================================*/
window.CM = window.CM || {};
CM.knowledge = (function(){

  function resolve(type, key){
    switch(type){
      case 'origin':{ const o=CM.find.origin(key); if(!o) return null;
        return { kicker:'产区 · ORIGIN', title:o.cn, emoji:o.emoji, color:'#8a5a2b',
          desc:o.desc, chips:o.regions, chipLabel:'知名产区',
          header:`linear-gradient(140deg,#f3ead9,#e7d3b0)` }; }
      case 'variety':{ const v=CM.find.variety(key); if(!v) return null;
        return { kicker:'豆种 · VARIETY', title:v.cn, emoji:v.emoji, color:'#4E944F',
          desc:v.desc, header:`linear-gradient(140deg,#eaf3ea,#d4e8d4)` }; }
      case 'process':{ const p=CM.find.process(key); if(!p) return null;
        return { kicker:'处理法 · PROCESS', title:p.cn, emoji:p.emoji, color:p.color,
          desc:p.desc, header:`linear-gradient(140deg,${p.color}22,${p.color}44)` }; }
      case 'roast':{ const r=CM.find.roast(key); if(!r) return null;
        return { kicker:'烘焙度 · ROAST', title:r.cn, emoji:r.emoji, color:r.color,
          desc:r.desc, chips:['Agtron '+r.agtron], chipLabel:'烘焙参考',
          header:`linear-gradient(140deg,${r.color}22,${r.color}55)` }; }
      case 'brew':{ const b=CM.find.brew(key); if(!b) return null;
        return { kicker:'冲煮 · BREW', title:b.cn, emoji:b.emoji, color:'#0071e3',
          desc:b.desc, header:`linear-gradient(140deg,#e8f1fd,#d2e4fb)` }; }
      case 'altitude':{ const a=CM.altitudes.find(x=>x.id===key||x.cn===key); if(!a) return null;
        return { kicker:'海拔 · ALTITUDE', title:a.cn, emoji:'⛰️', color:'#5b7c99',
          desc:a.desc, header:`linear-gradient(140deg,#e9eef2,#d4dde6)` }; }
      case 'flavor':{
        const g=CM.find.flavorOf(key)||CM.find.flavorGroup(key); if(!g) return null;
        return { kicker:'风味 · FLAVOR', title:g.cn, color:g.color,
          desc:g.desc, chips:g.items, chipLabel:'常见描述词',
          header:`linear-gradient(140deg,${g.color}22,${g.color}55)` }; }
    }
    return null;
  }

  /* 在用户记录中与该标签相关的统计 */
  function relatedStats(type, key, records){
    const match = r=>{
      switch(type){
        case 'origin': return CM.listOf(r,'origins','origin').includes(key);
        case 'variety': return (r.varieties||[]).includes(key);
        case 'process': return (r.processes||[]).includes(key);
        case 'roast': return CM.listOf(r,'roasts','roast').includes(key);
        case 'brew': return CM.listOf(r,'brews','brew').includes(key);
        case 'altitude': return CM.listOf(r,'altitudes','altitude').includes(key);
        case 'flavor':{ const g=CM.find.flavorOf(key)||CM.find.flavorGroup(key);
          return (r.flavors||[]).some(f=> f===key || (g&&g.items.includes(f))); }
      }
      return false;
    };
    const hit=records.filter(match);
    const avg=hit.filter(r=>r.score).reduce((s,r)=>s+r.score,0)/(hit.filter(r=>r.score).length||1);
    return { count:hit.length, avg, records:hit };
  }

  const imgKey = (type,key)=> type+'_'+key;
  const hasImg = (type,key)=> window.CM_IMG && window.CM_IMG[imgKey(type,key)];

  function render(type, key, records){
    const e=resolve(type,key);
    if(!e) return { title:'未知', html:'<p class="muted">暂无该项的知识卡片。</p>' };
    const ek=imgKey(type,key);
    const extra=(CM.extra&&CM.extra[ek])||{};
    const st=relatedStats(type,key,records);

    // ---- hero（产区=迷你地图 / 其它=真实图片 / 兜底=线性图标）----
    const ICO={origin:'pin',variety:'bean',process:'droplet',roast:'flame',brew:'cup',altitude:'mountain',flavor:'sparkle'};
    const fbIcon = CM.icon(ICO[type]||'cup',{size:58,stroke:1.3});
    let hero, mount=null;
    if(type==='origin'){
      hero=`<div id="know-hero" class="know-hero" style="background:${e.header}"></div>`;
      mount=(container)=>{ const ph=container.querySelector('#know-hero'); const mm=CM.map.mini&&CM.map.mini(key); if(ph&&mm) ph.replaceWith(mm); };
    } else if(hasImg(type,key)){
      const credit=(window.CM_IMG[ek].credit||'Wikimedia Commons');
      hero=`<div class="khead khead-img" style="background:${e.header}">
        <img src="assets/knowledge/${ek}.jpg" loading="lazy" alt="${CM.esc(e.title)}" onerror="this.closest('.khead').classList.add('noimg');this.remove()">
        <span class="khead-emoji" style="color:${e.color}">${fbIcon}</span></div>
        <div class="kcredit">${CM.icon('camera',{size:12})} ${CM.esc(credit)} · Wikimedia Commons</div>`;
    } else {
      hero=`<div class="khead" style="background:${e.header};color:${e.color}">${fbIcon}</div>`;
    }

    const taste = extra.taste ? `<div class="ktaste"><span class="lbl">典型风味</span><span>${CM.esc(extra.taste)}</span></div>` : '';
    const tip   = extra.tip   ? `<div class="ktip">${CM.icon('bulb',{size:14})} ${CM.esc(extra.tip)}</div>` : '';
    const facts = (extra.facts&&extra.facts.length) ? `
      <div class="krelated"><h4>要点 · 小知识</h4>
        <ul class="kfacts">${extra.facts.map(f=>`<li>${CM.esc(f)}</li>`).join('')}</ul></div>` : '';
    const chips = e.chips&&e.chips.length ? `
      <div class="krelated"><h4>${e.chipLabel||''}</h4>
        <div class="wrap-tags">${e.chips.map(c=>`<span class="tag ghost">${CM.esc(c)}</span>`).join('')}</div></div>` : '';
    const mine = st.count ? `
      <div class="krelated"><h4>在你的记录中</h4>
        <div class="flex gap12" style="align-items:center;flex-wrap:wrap">
          <div class="stat" style="padding:14px 18px;box-shadow:none;background:var(--bg-2)">
            <div class="k">品鉴</div><div class="v" style="font-size:30px">${st.count}<small>杯</small></div></div>
          <div class="stat" style="padding:14px 18px;box-shadow:none;background:var(--bg-2)">
            <div class="k">均分</div><div class="v" style="font-size:30px;display:flex;align-items:center;gap:3px">${st.avg.toFixed(1)} ${CM.starSVG('#e0a73a',18)}</div></div>
          <button class="btn ghost" onclick="CM.app.filterBy('${type}','${CM.esc(key)}')">在明细中筛选 →</button>
        </div>
        <div class="wrap-tags mt16">${st.records.slice(0,8).map(r=>`<span class="tag clickable" onclick="CM.app.openRecord('${r.id}')">${CM.esc(r.name||CM.find.origin(r.origin)?.cn||'记录')}</span>`).join('')}</div>
      </div>` : `<p class="muted mt16" style="font-size:13px">你还没有这一项的品鉴记录，去录入第一杯吧。</p>`;

    const html = `<div class="know">
      ${hero}
      <div class="kkicker" style="color:${e.color}">${e.kicker}</div>
      <h2>${CM.esc(e.title)}</h2>
      <p class="kdesc">${CM.esc(e.desc)}</p>
      ${taste}${tip}${facts}${chips}${mine}
    </div>`;
    return { title:e.title, html, mount };
  }

  return { resolve, render, relatedStats };
})();
