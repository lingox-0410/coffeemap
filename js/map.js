/* ============================================================================
 * CoffeeMap · 世界地图 (map.js) — D3 + TopoJSON 等值着色 + 产区下钻
 * ==========================================================================*/
window.CM = window.CM || {};
CM.map = (function(){
  const W=960;
  // 每个产地一种低饱和、协调的颜色（按大洲分组：非洲=暖棕橙 / 美洲=绿松 / 亚洲=紫蓝）
  const COUNTRY_COLOR = {
    Ethiopia:'#C2683F', Kenya:'#A8452B', Yemen:'#8C4A39',
    Rwanda:'#D49A57', Burundi:'#C3873F', Tanzania:'#B07C3C', Uganda:'#9A6A38',
    Colombia:'#4F8C6A', Brazil:'#3F6E54', Peru:'#5E9B86', Bolivia:'#4E8C7A', Ecuador:'#63A074',
    Panama:'#4FA08C', 'Costa Rica':'#5BA89A', Guatemala:'#6E8E4E', Honduras:'#86A05A',
    'El Salvador':'#9AA95E', Nicaragua:'#5E8C66', Mexico:'#B0934E', Jamaica:'#7FB0A0',
    Indonesia:'#6B5B95', India:'#9A6AA0', Vietnam:'#5A6FA0', China:'#7E6BA8', 'Papua New Guinea':'#5E7BA0',
  };
  const _h = h => { const n=parseInt(h.slice(1),16); return [n>>16&255, n>>8&255, n&255]; };
  const mix = (a,b,t)=>{ const x=_h(a),y=_h(b),c=i=>Math.round(x[i]+(y[i]-x[i])*t); return `rgb(${c(0)},${c(1)},${c(2)})`; };

  function statsByCountry(records){
    const m=new Map();
    records.forEach(r=>{
      CM.listOf(r,'origins','origin').forEach(key=>{                 // 拼配豆：每个产地都计入
        if(!m.has(key)) m.set(key,{count:0,sum:0,n:0});
        const o=m.get(key); o.count++; if(r.score){o.sum+=r.score;o.n++;}
      });
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
    const feats=topojson.feature(window.WORLD_TOPO, window.WORLD_TOPO.objects.countries).features;
    const originKeys=new Set(CM.origins.map(o=>o.key));

    // 投影：等距圆柱 + 裁切到咖啡带（按产地坐标拟合，集中赤道附近）
    const pts={type:'FeatureCollection',features:CM.origins.map(o=>({type:'Feature',geometry:{type:'Point',coordinates:o.coord}}))};
    const proj=d3.geoEquirectangular(); proj.fitWidth(W, pts);
    const path=d3.geoPath(proj);
    const pb=path.bounds(pts); const padTop=66, padBot=58;
    const vbY=Math.floor(pb[0][1]-padTop), vbH=Math.ceil((pb[1][1]-pb[0][1])+padTop+padBot);
    const svg=d3.select(wrap).append('svg').attr('viewBox',`0 ${vbY} ${W} ${vbH}`).style('width','100%').style('height','auto');

    svg.append('path').attr('d',path(d3.geoGraticule10())).attr('fill','none').attr('stroke','#eef0f2').attr('stroke-width',.5);

    function fillFor(key){
      const base=COUNTRY_COLOR[key]; if(!base) return '#edeef1';
      const s=stats.get(key); if(!s) return mix('#ffffff', base, .16);   // 咖啡产地·无记录：极淡底色
      const ratio = metric==='avg' ? (s.avg/5) : (s.count/maxCount);
      return mix(base, '#241812', .50*Math.sqrt(Math.max(.0001,ratio)));  // 有记录=整片本色；越多/越高→越深
    }

    svg.append('g').selectAll('path').data(feats).join('path')
      .attr('d',path)
      .attr('class',d=> originKeys.has(d.properties.name)?'country coffee':'country')
      .attr('fill',d=> fillFor(d.properties.name))
      .on('mousemove',function(ev,d){
        const o=CM.find.origin(d.properties.name); if(!o){ tip.style.opacity=0; return; }
        const s=stats.get(d.properties.name); const rect=wrap.getBoundingClientRect();
        tip.style.left=(ev.clientX-rect.left)+'px'; tip.style.top=(ev.clientY-rect.top)+'px';
        tip.innerHTML=`<div class="t">${CM.flag(o.key)} ${o.cn}</div>`+(s?`记录 ${s.count} 杯 · 均分 ${s.avg.toFixed(1)} 分`:'点击探索产地知识');
        tip.style.opacity=1;
      })
      .on('mouseleave',()=> tip.style.opacity=0)
      .on('click',(ev,d)=>{ const o=CM.find.origin(d.properties.name); if(o) onSelect(o.key); });

    // 产地圆点（小，作定位/点击；有记录略深）
    const g=svg.append('g');
    CM.origins.forEach(o=>{
      const p=proj(o.coord); if(!p) return; const s=stats.get(o.key);
      const rad=s? 2.6+Math.sqrt(s.count)*1.2 : 2;
      g.append('circle').attr('class','origin-dot').attr('cx',p[0]).attr('cy',p[1]).attr('r',rad)
        .attr('fill', s? mix(COUNTRY_COLOR[o.key]||'#5e3a1e','#000',.28) : 'rgba(120,90,60,.45)')
        .attr('stroke','#fff').attr('stroke-width',1).style('cursor','pointer')
        .on('mousemove',function(ev){ const rect=wrap.getBoundingClientRect();
          tip.style.left=(ev.clientX-rect.left)+'px'; tip.style.top=(ev.clientY-rect.top)+'px';
          tip.innerHTML=`<div class="t">${CM.flag(o.key)} ${o.cn}</div>`+(s?`记录 ${s.count} 杯 · 均分 ${s.avg.toFixed(1)} 分`:'尚无记录 · 点击了解');
          tip.style.opacity=1; })
        .on('mouseleave',()=>tip.style.opacity=0)
        .on('click',()=> onSelect(o.key));
    });

    // 图例：移到地图外、缩小
    const leg=document.createElement('div'); leg.className='map-legend-out';
    leg.innerHTML=`<span>每个产地一种颜色</span><span class="bar2"></span><span>深浅 = ${metric==='avg'?'评分':'杯数'}（越深越多）</span>`;
    container.appendChild(leg);
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
