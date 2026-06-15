/* ============================================================================
 * CoffeeMap · 示例数据 (seed.js) — 首次打开自动填充，可一键清空
 * ==========================================================================*/
window.CM = window.CM || {};

/* 用渐变 SVG 生成一张占位"照片"(dataURL)，让相册/卡片首屏即有内容（无 emoji，用咖啡杯线描）*/
CM.makePhoto = (c1, c2, label)=>{
  const cup = (window.CM && CM.ICONS && CM.ICONS.cup) || '';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>
    <rect width='640' height='480' fill='url(#g)'/>
    <circle cx='500' cy='110' r='150' fill='rgba(255,255,255,.10)'/>
    <circle cx='120' cy='400' r='110' fill='rgba(0,0,0,.06)'/>
    <g transform='translate(236 150) scale(7)' fill='none' stroke='rgba(255,255,255,.92)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>${cup}</g>
    <text x='50%' y='84%' font-size='30' fill='rgba(255,255,255,.95)' text-anchor='middle' font-family='-apple-system,sans-serif' font-weight='600'>${label||''}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
};

CM.seed = [
  { id:'s1', tastedAt:'2026-06-08', createdAt:1, name:'耶加雪菲 科契尔', origin:'Ethiopia',
    regions:['耶加雪菲 Yirgacheffe'], estate:'Kochere · 水洗站', varieties:['heirloom'], processes:['washed'],
    roast:'light', altitude:'a5', flavors:['茉莉','柠檬','佛手柑','红茶'], shop:'Seesaw 咖啡', brew:'v60', score:4.5,
    notes:'透亮的柑橘酸，尾段红茶感悠长，温度下降后茉莉花香愈发明显。', price:42,
    photos:[CM.makePhoto('#e9b8cf','#c97fa3','Yirgacheffe')] },

  { id:'s2', tastedAt:'2026-05-30', createdAt:2, name:'古吉 日晒 罕贝拉', origin:'Ethiopia',
    regions:['古吉 Guji'], estate:'Hambela', varieties:['heirloom'], processes:['natural'],
    roast:'light', altitude:'a5', flavors:['蓝莓','草莓','发酵感'], shop:'% Arabica', brew:'v60', score:4.5,
    notes:'浓郁的蓝莓果酱，发酵感恰到好处，甜如果汁。',
    photos:[CM.makePhoto('#8fa9d6','#3f5ea8','Guji Natural')] },

  { id:'s3', tastedAt:'2026-05-18', createdAt:3, name:'肯尼亚 AA Nyeri', origin:'Kenya',
    regions:['涅里 Nyeri'], estate:'Gatomboya', varieties:['sl28','sl34'], processes:['washed'],
    roast:'mediumlight', altitude:'a4', flavors:['黑加仑','葡萄柚','番茄'], shop:'Manner 咖啡', brew:'kalita', score:4,
    notes:'标志性的黑加仑酸甜，结构感很强，多汁。',
    photos:[CM.makePhoto('#c46b5a','#8a3324','Kenya AA')] },

  { id:'s4', tastedAt:'2026-05-05', createdAt:4, name:'翡翠庄园 瑰夏 红标', origin:'Panama',
    regions:['博克特 Boquete','翡翠庄园 Esmeralda'], estate:'Hacienda La Esmeralda', varieties:['geisha'], processes:['washed'],
    roast:'light', altitude:'a5', flavors:['茉莉','佛手柑','白桃','红茶'], shop:'Blue Bottle', brew:'v60', score:5,
    notes:'此生难忘。入口即是花园，佛手柑与白桃层层展开，干净到极致。', price:120,
    photos:[CM.makePhoto('#d9b3e0','#9b59b6','Geisha Esmeralda')] },

  { id:'s5', tastedAt:'2026-04-22', createdAt:5, name:'惠兰 粉红波旁 厌氧', origin:'Colombia',
    regions:['惠兰 Huila'], estate:'El Paraíso', varieties:['pinkbourbon'], processes:['anaerobic','washed'],
    roast:'mediumlight', altitude:'a4', flavors:['荔枝','百香果','玫瑰'], shop:'M Stand', brew:'origami', score:4.5,
    notes:'厌氧带来奔放的荔枝与百香果，玫瑰收尾，辨识度极高。',
    photos:[CM.makePhoto('#f2cd6b','#e0922f','Pink Bourbon')] },

  { id:'s6', tastedAt:'2026-04-10', createdAt:6, name:'巴西 喜拉朵 日晒', origin:'Brazil',
    regions:['喜拉朵 Cerrado'], estate:'Daterra', varieties:['mundonovo','catuai'], processes:['natural'],
    roast:'mediumdark', altitude:'a3', flavors:['黑巧克力','坚果','焦糖'], shop:'Luckin 瑞幸', brew:'espresso', score:3.5,
    notes:'做意式基底很稳，巧克力与坚果，奶咖友好。',
    photos:[CM.makePhoto('#9c7a55','#5b3a1e','Brazil Natural')] },

  { id:'s7', tastedAt:'2026-03-28', createdAt:7, name:'塔拉珠 红蜜', origin:'Costa Rica',
    regions:['塔拉珠 Tarrazú'], estate:'La Pastora', varieties:['caturra'], processes:['redhoney'],
    roast:'medium', altitude:'a4', flavors:['蜂蜜','红苹果','焦糖'], shop:'独立咖啡馆', brew:'clever', score:4,
    notes:'蜜处理的圆润甜感，红苹果与蜂蜜，平衡讨喜。' },

  { id:'s8', tastedAt:'2026-03-12', createdAt:8, name:'黄金曼特宁 湿刨', origin:'Indonesia',
    regions:['苏门答腊曼特宁 Mandheling'], estate:'林东 Lintong', varieties:['typica'], processes:['wethulled'],
    roast:'mediumdark', altitude:'a3', flavors:['雪松','黑巧克力','草本'], shop:'老字号烘焙', brew:'frenchpress', score:3.5,
    notes:'醇厚低酸，木质与草本，下雨天的味道。' },

  { id:'s9', tastedAt:'2026-02-20', createdAt:9, name:'也门 摩卡 玛塔莉', origin:'Yemen',
    regions:['摩卡 Mocha'], estate:'Bani Matar', varieties:['heirloom'], processes:['natural'],
    roast:'medium', altitude:'a5', flavors:['红酒','香料','果干','巧克力'], shop:'精品自烘', brew:'aeropress', score:4,
    notes:'狂野复杂，红酒与香料交织，古老而深邃。', price:88 },

  { id:'s10', tastedAt:'2026-02-02', createdAt:10, name:'云南 普洱 水洗', origin:'China',
    regions:['普洱 Pu\'er'], estate:'孟连庄园', varieties:['catimor'], processes:['washed'],
    roast:'mediumlight', altitude:'a3', flavors:['坚果','焦糖','柑橘'], shop:'本地烘焙工作室', brew:'v60', score:3.5,
    notes:'国产豆进步明显，干净的坚果焦糖，柑橘酸渐显。',
    photos:[CM.makePhoto('#c98f5a','#8a5a2b','Yunnan')] },

  { id:'s11', tastedAt:'2026-01-15', createdAt:11, name:'安提瓜 水洗', origin:'Guatemala',
    regions:['安提瓜 Antigua'], estate:'La Tacita', varieties:['bourbon'], processes:['washed'],
    roast:'medium', altitude:'a4', flavors:['巧克力','焦糖','橙子'], shop:'连锁精品', brew:'chemex', score:4,
    notes:'经典中美洲均衡，巧克力配橙子，烟熏矿物的尾韵。' },
];
