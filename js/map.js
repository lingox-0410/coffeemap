/* ============================================================================
 * CoffeeMap · 世界地图 (map.js) — D3 + TopoJSON 等值着色 + 产区下钻
 * ==========================================================================*/
window.CM = window.CM || {};
CM.map = (function(){
  const W=960, H=500;
  const interp = d3.interpolateRgbBasis(['#f3ecdf','#e7c879','#cf9a4e','#a9733f','#5e3a1e']);

  function statsByCountry(records){
    const m=new Map();
    records.forEach(r=>{
      if(!r.origin) return;
      if(!m.has(r.origin)) m.set(r.origin,{count:0,sum:0,n:0});
      const o=m.get(r.origin); o.count++; if(r.score){o.sum+=r.score;o.n++;}
    });
    m.forEach(o=> o.avg = o.n? o.sum/o.n : 0);
    return m;
  }

  function render(container, records, opts={}){
    const metric = opts.metric || 'count';
    const onSelect = opts.onSelect || (()=>{});
    container.innerHTML='';
    const wrap=document.createElement('div'); wrap.className='map-wrap';
    const tip=document.createElement('div'); tip.className='map-tip';
    wrap.appendChild(tip); container.appendChild(wrap);

    const stats=statsByCountry(records);
    const maxCount=Math.max(1,...[...stats.values()].map(s=>s.count));
    const val = s => metric==='avg' ? (s.avg/5) : (s.count/maxCount);

    const proj=d3.geoNaturalEarth1().fitExtent([[8,8],[W-8,H-30]],
      {type:'Sphere'});
    const path=d3.geoPath(proj);
    const svg=d3.select(wrap).append('svg').attr('viewBox',`0 0 ${W} ${H}`);

    // ocean sphere
    svg.append('path').attr('d',path({type:'Sphere'})).attr('fill','#fbfbfd');
    svg.append('path').attr('d',d3.geoPath(proj)(d3.geoGraticule10())).attr('fill','none')
       .attr('stroke','#eef0f2').attr('stroke-width',.5);

    const feats=topojson.feature(window.WORLD_TOPO, window.WORLD_TOPO.objects.countries).features;
    const originKeys=new Set(CM.origins.map(o=>o.key));

    svg.append('g').selectAll('path').data(feats).join('path')
      .attr('d',path)
      .attr('class',d=> originKeys.has(d.properties.name)?'country coffee':'country')
      .attr('fill',d=>{
        const s=stats.get(d.properties.name);
        if(s) return interp(Math.max(.12,val(s)));
        return originKeys.has(d.properties.name) ? '#eceae4' : '#ececf0';
      })
      .on('mousemove',function(ev,d){
        const o=CM.find.origin(d.properties.name); if(!o) { tip.style.opacity=0; return; }
        const s=stats.get(d.properties.name);
        const rect=wrap.getBoundingClientRect();
        tip.style.left=(ev.clientX-rect.left)+'px'; tip.style.top=(ev.clientY-rect.top)+'px';
        tip.innerHTML=`<div class="t">${CM.flag(o.key)} ${o.cn}</div>`+
          (s?`记录 ${s.count} 杯 · 均分 ${s.avg.toFixed(1)} 分`:'点击探索产地知识');
        tip.style.opacity=1;
      })
      .on('mouseleave',()=> tip.style.opacity=0)
      .on('click',(ev,d)=>{ const o=CM.find.origin(d.properties.name); if(o) onSelect(o.key); });

    // origin pins
    const g=svg.append('g');
    CM.origins.forEach(o=>{
      const p=proj(o.coord); if(!p) return;
      const s=stats.get(o.key);
      const rad=s? 4+Math.sqrt(s.count)*2.4 : 2.6;
      g.append('circle').attr('class','origin-dot').attr('cx',p[0]).attr('cy',p[1]).attr('r',rad)
        .attr('fill', s? '#3a241a' : 'rgba(138,90,43,.35)')
        .attr('stroke','#fff').attr('stroke-width',1.2)
        .style('cursor','pointer')
        .on('mousemove',function(ev){
          const rect=wrap.getBoundingClientRect();
          tip.style.left=(ev.clientX-rect.left)+'px'; tip.style.top=(ev.clientY-rect.top)+'px';
          tip.innerHTML=`<div class="t">${CM.flag(o.key)} ${o.cn}</div>`+(s?`记录 ${s.count} 杯 · 均分 ${s.avg.toFixed(1)} 分`:'尚无记录 · 点击了解');
          tip.style.opacity=1;
        })
        .on('mouseleave',()=>tip.style.opacity=0)
        .on('click',()=> onSelect(o.key));
      if(s && s.count>0){
        g.append('circle').attr('cx',p[0]).attr('cy',p[1]).attr('r',rad).attr('fill','none')
          .attr('stroke','#3a241a').attr('stroke-width',1).attr('opacity',.4)
          .append('animate').attr('attributeName','r').attr('from',rad).attr('to',rad+9)
          .attr('dur','2.4s').attr('repeatCount','indefinite');
      }
    });

    // legend
    const leg=document.createElement('div'); leg.className='map-legend';
    leg.innerHTML=`<div>${metric==='avg'?'平均风味评分':'品鉴杯数'}</div>
      <div class="bar"></div><div class="ends"><span>少 / 低</span><span>多 / 高</span></div>`;
    wrap.appendChild(leg);
    return wrap;
  }

  /* 知识卡片用：聚焦某产地的迷你地图 hero */
  function mini(originKey, w=560, h=200){
    const o=CM.find.origin(originKey); if(!o) return null;
    const feats=topojson.feature(window.WORLD_TOPO, window.WORLD_TOPO.objects.countries).features;
    const target=feats.find(f=>f.properties.name===originKey);
    const wrap=document.createElement('div'); wrap.style.cssText=`position:relative;width:100%;height:${h}px;border-radius:20px;overflow:hidden;background:linear-gradient(180deg,#eaf0f4,#dfe7ee)`;
    const svg=d3.select(wrap).append('svg').attr('viewBox',`0 0 ${w} ${h}`).style('width','100%').style('height','100%');
    const proj=d3.geoMercator();
    if(target){
      proj.fitExtent([[24,24],[w-24,h-24]], target);
      const s=proj.scale()*0.5, c=d3.geoCentroid(target);
      proj.scale(s).center(c).translate([w/2,h/2]);
    } else { proj.scale(90).center(o.coord).translate([w/2,h/2]); }
    const path=d3.geoPath(proj);
    svg.append('g').selectAll('path').data(feats).join('path').attr('d',path)
       .attr('fill',d=> d.properties.name===originKey ? '#8a5a2b' : '#cdd6dd')
       .attr('stroke','#fff').attr('stroke-width',.5);
    const p=proj(o.coord);
    if(p){
      svg.append('circle').attr('cx',p[0]).attr('cy',p[1]).attr('r',6).attr('fill','#3a241a').attr('stroke','#fff').attr('stroke-width',2);
      svg.append('circle').attr('cx',p[0]).attr('cy',p[1]).attr('r',6).attr('fill','none').attr('stroke','#3a241a').attr('stroke-width',1.5).attr('opacity',.5)
         .append('animate').attr('attributeName','r').attr('from',6).attr('to',16).attr('dur','2s').attr('repeatCount','indefinite');
    }
    const tag=document.createElement('div');
    tag.style.cssText='position:absolute;left:14px;bottom:12px;background:rgba(255,255,255,.85);backdrop-filter:blur(8px);padding:5px 12px;border-radius:980px;font-size:13px;font-weight:600;display:flex;align-items:center;gap:7px';
    tag.innerHTML=`${CM.flag(o.key)} ${o.cn}`;
    wrap.appendChild(tag);
    return wrap;
  }

  return { render, statsByCountry, mini };
})();
