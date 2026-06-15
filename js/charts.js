/* ============================================================================
 * CoffeeMap · 图表 (charts.js) — 纯 SVG/DOM，无第三方图表库
 * ==========================================================================*/
window.CM = window.CM || {};
CM.charts = (function(){

  /* 水平条形榜单：rows = [{label, value, sub, color, emoji, onClick}] */
  function bars(rows, opts={}){
    const max = Math.max(1, ...rows.map(r=>r.value));
    const el = document.createElement('div');
    el.innerHTML = rows.map(r=>{
      const w = (r.value/max*100).toFixed(1);
      const col = r.color ? `style="background:${r.color}"` : '';
      return `<div class="bar-row" data-k="${CM.esc(r.key??r.label)}" ${r.onClick?'role="button"':''} style="cursor:${r.onClick?'pointer':'default'}">
        <div class="lab" title="${CM.esc(r.label)}">${r.emoji?`<span>${r.emoji}</span>`:''}${CM.esc(r.label)}</div>
        <div class="bar-track"><div class="bar-fill" ${col} data-w="${w}"></div></div>
        <div class="val">${r.display ?? r.value}</div>
      </div>`;
    }).join('');
    // animate
    requestAnimationFrame(()=> el.querySelectorAll('.bar-fill').forEach(f=> f.style.width=f.dataset.w+'%'));
    if(rows.some(r=>r.onClick)){
      el.querySelectorAll('.bar-row').forEach((row,i)=>{ if(rows[i].onClick) row.onclick=()=>rows[i].onClick(rows[i]); });
    }
    return el;
  }

  /* 甜甜圈 + 图例：segs = [{label, value, color}] */
  function donut(segs, opts={}){
    const total = segs.reduce((s,x)=>s+x.value,0) || 1;
    const R=72, r=46, C=2*Math.PI*R, cx=90, cy=90;
    let off=0;
    const arcs = segs.map(s=>{
      const frac=s.value/total, len=frac*C;
      const dash=`${len} ${C-len}`, rot=off; off+=frac*360;
      return `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${s.color}" stroke-width="${R-r}"
        stroke-dasharray="${dash}" stroke-dashoffset="0" transform="rotate(${rot-90} ${cx} ${cy})">
        <animate attributeName="stroke-dasharray" from="0 ${C}" to="${dash}" dur=".8s" fill="freeze" calcMode="spline" keySplines="0.2 0.8 0.2 1" keyTimes="0;1"/>
      </circle>`;
    }).join('');
    const wrap=document.createElement('div'); wrap.className='donut-wrap';
    wrap.innerHTML = `
      <svg width="180" height="180" viewBox="0 0 180 180" style="flex:none">
        ${arcs}
        <text x="90" y="84" text-anchor="middle" font-size="30" font-weight="600" fill="#1d1d1f">${opts.center??total}</text>
        <text x="90" y="106" text-anchor="middle" font-size="12" fill="#6e6e73">${opts.centerSub??'杯'}</text>
      </svg>
      <div class="legend-list">${segs.map(s=>`<div class="li" data-k="${CM.esc(s.key??s.label)}" style="cursor:${opts.onClick?'pointer':'default'}">
        <span class="sw" style="background:${s.color}"></span><span>${CM.esc(s.label)}</span>
        <span class="n">${s.value} · ${Math.round(s.value/total*100)}%</span></div>`).join('')}</div>`;
    if(opts.onClick) wrap.querySelectorAll('.legend-list .li').forEach(li=> li.onclick=()=>opts.onClick(li.dataset.k));
    return wrap;
  }

  /* 雷达图：axes = [{label,color}], series = [{name,values:[0..1],color}] */
  function radar(axes, series, size=300){
    const cx=size/2, cy=size/2, R=size/2-44, n=axes.length;
    const pt=(i,rad)=>{ const a=-Math.PI/2 + i*2*Math.PI/n; return [cx+Math.cos(a)*rad, cy+Math.sin(a)*rad]; };
    let grid='';
    [.25,.5,.75,1].forEach(g=>{
      const pts=axes.map((_,i)=>pt(i,R*g).join(',')).join(' ');
      grid+=`<polygon points="${pts}" fill="none" stroke="#e3e3e6" stroke-width="1"/>`;
    });
    axes.forEach((_,i)=>{ const [x,y]=pt(i,R); grid+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#ececef"/>`; });
    const labels=axes.map((ax,i)=>{ const [x,y]=pt(i,R+22);
      return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="600" fill="${ax.color||'#6e6e73'}">${ax.emoji||''}${CM.esc(ax.label)}</text>`; }).join('');
    const polys=series.map(s=>{
      const pts=s.values.map((v,i)=>pt(i,R*Math.max(.02,v)).join(',')).join(' ');
      return `<polygon points="${pts}" fill="${s.color}22" stroke="${s.color}" stroke-width="2">
        <animate attributeName="points" from="${axes.map(()=>cx+','+cy).join(' ')}" to="${pts}" dur=".7s" fill="freeze" calcMode="spline" keySplines="0.2 0.8 0.2 1" keyTimes="0;1"/></polygon>`;
    }).join('');
    const dots=series.map(s=> s.values.map((v,i)=>{const[x,y]=pt(i,R*Math.max(.02,v)); return `<circle cx="${x}" cy="${y}" r="3" fill="${s.color}"/>`;}).join('')).join('');
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox',`0 0 ${size} ${size}`); svg.setAttribute('width',size); svg.setAttribute('height',size);
    svg.innerHTML=grid+polys+dots+labels;
    return svg;
  }

  return { bars, donut, radar };
})();
