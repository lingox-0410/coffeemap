/* ============================================================================
 * CoffeeMap · 图标系统 (icons.js)
 * 线性 SVG 图标（stroke=currentColor）+ 真实国旗，彻底取代 emoji
 * ==========================================================================*/
window.CM = window.CM || {};

CM.ICONS = {
  plus:'<path d="M12 5v14M5 12h14"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  chevronRight:'<path d="M9 6l6 6-6 6"/>',
  chevronDown:'<path d="M6 9l6 6 6-6"/>',
  chevronUp:'<path d="M6 15l6-6 6 6"/>',
  arrowRight:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  camera:'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  pin:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  mountain:'<path d="M3 20h18L12 4 8 12l-2-2-3 6z"/>',
  building:'<path d="M3 21h18"/><path d="M6 21V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v15"/><path d="M10 8h0M14 8h0M10 12h0M14 12h0M10 16h0M14 16h0"/>',
  bean:'<g transform="rotate(28 12 12)"><ellipse cx="12" cy="12" rx="6.2" ry="9"/><path d="M12 3.4C9.2 8 9.2 16 12 20.6"/></g>',
  cup:'<path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z"/><path d="M17 9h2a3 3 0 0 1 0 6h-2"/><path d="M7 2.6c-.6 1-.6 2 0 3M11 2.6c-.6 1-.6 2 0 3"/>',
  map:'<path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><path d="M9 3v15M15 6v15"/>',
  grid:'<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  chart:'<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-4"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  award:'<circle cx="12" cy="8" r="6"/><path d="M8.2 13.4 7 22l5-3 5 3-1.2-8.6"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
  flower:'<circle cx="12" cy="12" r="2.4"/><path d="M12 9.6C12 6 10.4 4.2 12 4.2s0 5.4 0 5.4M12 14.4c0 3.6 1.6 5.4 0 5.4s0-5.4 0-5.4M9.6 12C6 12 4.2 13.6 4.2 12s5.4 0 5.4 0M14.4 12c3.6 0 5.4-1.6 5.4 0s-5.4 0-5.4 0"/>',
  flask:'<path d="M9 3h6M10 3v6l-4.6 8.4A2 2 0 0 0 7.2 20.4h9.6a2 2 0 0 0 1.8-3L14 9V3"/><path d="M7.7 14h8.6"/>',
  palette:'<path d="M12 3a9 9 0 1 0 0 18c1.4 0 1.9-1 1.4-1.9-.5-1 0-2 1.4-2H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.6" r="1"/>',
  flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  droplet:'<path d="M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0z"/>',
  sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  store:'<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5h16V20H4z"/><path d="M9 20v-5h6v5"/>',
  share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
  bulb:'<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  cloud:'<path d="M17.5 19a4.5 4.5 0 0 0 .5-9 6 6 0 0 0-11.7-1.3A4 4 0 0 0 6.5 19z"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
};

/* 渲染一个图标 → SVG 字符串 */
CM.icon = (name, opts={})=>{
  const p=CM.ICONS[name]; if(!p) return '';
  const s=opts.size||18, sw=opts.stroke||1.8, cls=opts.cls?(' '+opts.cls):'';
  const st=opts.style?` style="${opts.style}"`:'';
  return `<svg class="ic${cls}" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${st}>${p}</svg>`;
};

/* 实心圆点（处理法/烘焙/风味用） */
CM.dot = (color)=> `<span class="cdot" style="background:${color||'#c9c9cf'}"></span>`;

/* ---------- 国旗（真实 SVG，本地离线）---------- */
CM.FLAG = {
  Ethiopia:'et', Kenya:'ke', Colombia:'co', Brazil:'br', Panama:'pa', Guatemala:'gt',
  'Costa Rica':'cr', Honduras:'hn', 'El Salvador':'sv', Nicaragua:'ni', Peru:'pe', Mexico:'mx',
  Bolivia:'bo', Ecuador:'ec', Jamaica:'jm', Indonesia:'id', India:'in', Vietnam:'vn', China:'cn',
  'Papua New Guinea':'pg', Yemen:'ye', Rwanda:'rw', Burundi:'bi', Tanzania:'tz', Uganda:'ug',
};
CM.flagSrc = key => CM.FLAG[key] ? `assets/flags/${CM.FLAG[key]}.svg` : '';
CM.flag = (key, cls='')=>{ const src=CM.flagSrc(key); return src
  ? `<img class="flag-ic ${cls}" src="${src}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''; };
