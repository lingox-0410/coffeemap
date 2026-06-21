/* ============================================================================
 * CoffeeMap · 咖啡知识库 (data.js)
 * 所有标签选项 + 知识卡片文案 + 产区坐标
 * 数据来源参考：SCA 咖啡风味轮、World Coffee Research 品种目录、各产地通识
 * ==========================================================================*/
window.CM = window.CM || {};

/* ---------- 产区 / 国家 ----------
 * key = 与世界地图 topojson 完全一致的英文名（用于地图着色）
 * cn  = 中文名, coord = [经度, 纬度], regions = 知名产区, desc = 知识卡片 */
CM.origins = [
  { key:'Ethiopia', cn:'埃塞俄比亚', coord:[39.6,8.6], continent:'非洲',
    regions:['耶加雪菲 Yirgacheffe','西达摩 Sidamo','古吉 Guji','哈拉 Harrar','利姆 Limu'],
    desc:'阿拉比卡的故乡，拥有数千种未被完全分类的原生种(Heirloom)。水洗带来标志性的柑橘、佛手柑与茉莉花香，日晒则迸发蓝莓、草莓与发酵酒香。' },
  { key:'Kenya', cn:'肯尼亚', coord:[37.9,0.2], continent:'非洲',
    regions:['涅里 Nyeri','基里尼亚加 Kirinyaga','安布 Embu'],
    desc:'以 SL28/SL34 品种与严格的双重水洗分级著称(AA/AB)。酸质浓郁明亮，黑加仑、番茄、莓果般的多汁感，是高酸爱好者的圣杯。' },
  { key:'Colombia', cn:'哥伦比亚', coord:[-73.5,4.6], continent:'美洲',
    regions:['惠兰 Huila','纳里尼奥 Nariño','托利马 Tolima','考卡 Cauca'],
    desc:'安第斯山脉纵贯，全年皆有收成。均衡甜润，焦糖、红苹果与柑橘酸，是精品与商业豆兼备的稳定产地。' },
  { key:'Brazil', cn:'巴西', coord:[-49.5,-16.2], continent:'美洲',
    regions:['喜拉朵 Cerrado','南米纳斯 Sul de Minas','摩吉安娜 Mogiana'],
    desc:'世界第一大咖啡国，以日晒/半日晒为主。低酸、醇厚，坚果、巧克力与花生甜，是意式拼配的基底之选。' },
  { key:'Panama', cn:'巴拿马', coord:[-81.5,8.5], continent:'美洲',
    regions:['博克特 Boquete','沃尔坎 Volcán','翡翠庄园 Esmeralda'],
    desc:'瑰夏(Geisha)成名地。火山土壤与高海拔孕育极致花香与茶感，BOP 竞拍屡创天价，是精品咖啡的奢侈品橱窗。' },
  { key:'Guatemala', cn:'危地马拉', coord:[-90.4,15.6], continent:'美洲',
    regions:['安提瓜 Antigua','薇薇特南果 Huehuetenango','阿蒂特兰 Atitlán'],
    desc:'火山带产区，复杂而饱满。可可、焦糖与明亮果酸，烟熏矿物感是安提瓜的招牌。' },
  { key:'Costa Rica', cn:'哥斯达黎加', coord:[-84.1,9.9], continent:'美洲',
    regions:['塔拉珠 Tarrazú','西部山谷 West Valley','中央山谷'],
    desc:'蜜处理(Honey)的发扬地，微批次(Micro-mill)革命起点。干净甜亮，蜂蜜、柑橘与红色水果。' },
  { key:'Honduras', cn:'洪都拉斯', coord:[-86.9,14.8], continent:'美洲',
    regions:['圣芭芭拉 Santa Bárbara','科潘 Copán'],
    desc:'中美洲产量快速崛起的产地，性价比高。甜感圆润，焦糖、太妃糖与温和果酸。' },
  { key:'El Salvador', cn:'萨尔瓦多', coord:[-88.9,13.8], continent:'美洲',
    regions:['阿帕内卡 Apaneca','圣安娜 Santa Ana','阿瓦查潘 Ahuachapán'],
    desc:'帕卡马拉(Pacamara)品种的发源地。柔和醇厚，焦糖与红苹果，奶油般口感。' },
  { key:'Nicaragua', cn:'尼加拉瓜', coord:[-85.2,12.9], continent:'美洲',
    regions:['新塞哥维亚 Nueva Segovia','希诺特加 Jinotega'],
    desc:'温和均衡，巧克力、焦糖与柔和果酸，常见帕卡马拉与象豆等大颗粒品种。' },
  { key:'Peru', cn:'秘鲁', coord:[-75.0,-9.2], continent:'美洲',
    regions:['卡哈马卡 Cajamarca','库斯科 Cusco'],
    desc:'有机认证大国，海拔高、风味干净。柔和坚果、巧克力与温柔甜感，适合入门。' },
  { key:'Mexico', cn:'墨西哥', coord:[-96.5,17.0], continent:'美洲',
    regions:['恰帕斯 Chiapas','瓦哈卡 Oaxaca','维拉克鲁斯'],
    desc:'轻盈干净，坚果、太妃糖与清淡可可，有机水洗豆产量大。' },
  { key:'Bolivia', cn:'玻利维亚', coord:[-64.0,-16.5], continent:'美洲',
    regions:['卡拉纳维 Caranavi'],
    desc:'产量稀少的精品潜力股，高海拔带来细腻花香、焦糖与温润果酸。' },
  { key:'Ecuador', cn:'厄瓜多尔', coord:[-78.4,-1.5], continent:'美洲',
    regions:['皮钦查 Pichincha','洛贾 Loja'],
    desc:'Sidra、Typica Mejorado 等明星品种崛起，赤道高海拔造就干净花香与柑橘。' },
  { key:'Jamaica', cn:'牙买加', coord:[-77.3,18.1], continent:'美洲',
    regions:['蓝山 Blue Mountain'],
    desc:'蓝山咖啡的故乡，温和无苦、酸甜平衡、口感顺滑，是经典的高价收藏豆。' },
  { key:'Indonesia', cn:'印度尼西亚', coord:[113.9,-0.8], continent:'亚洲',
    regions:['苏门答腊曼特宁 Mandheling','苏拉威西托拉贾 Toraja','爪哇 Java','巴厘 Bali','亚齐盖优'],
    desc:'湿刨法(Wet-hulled)的代表产地。低酸、醇厚饱满，草本、木质、雪松与泥土的沉稳调性，曼特宁是其标志。' },
  { key:'India', cn:'印度', coord:[78.0,13.0], continent:'亚洲',
    regions:['季风马拉巴 Monsooned Malabar','奇库马加卢'],
    desc:'独有的季风处理法：生豆在季风中暴露数月，酸度尽褪。低酸、厚重、辛香与陈木气息。' },
  { key:'Vietnam', cn:'越南', coord:[108.3,13.0], continent:'亚洲',
    regions:['得乐 Đắk Lắk','大叻 Đà Lạt'],
    desc:'世界第二大产国，以罗布斯塔为主，浓苦厚重。滴漏炼乳咖啡(Cà phê sữa đá)是其文化名片。' },
  { key:'China', cn:'中国 · 云南', coord:[101.0,24.5], continent:'亚洲',
    regions:['普洱 Pu\'er','保山 Baoshan','临沧'],
    desc:'云南高原是中国精品咖啡的核心，近年水洗与厌氧处理快速进步，呈现坚果、焦糖与日益清晰的花果酸。' },
  { key:'Papua New Guinea', cn:'巴布亚新几内亚', coord:[145.0,-6.5], continent:'亚洲',
    regions:['西部高地 Western Highlands'],
    desc:'多为小农园(Garden coffee)，醇厚多汁，热带水果与草本，带有印尼般的厚实口感。' },
  { key:'Yemen', cn:'也门', coord:[44.5,15.4], continent:'亚洲',
    regions:['摩卡 Mocha','巴尼马塔尔'],
    desc:'最古老的商业咖啡产地，传统古法日晒。狂野复杂，红酒、巧克力、香料与发酵果干，风味浓郁深邃。' },
  { key:'Rwanda', cn:'卢旺达', coord:[29.9,-1.9], continent:'非洲',
    regions:['西部省','胡耶 Huye'],
    desc:'千丘之国，波旁为主。明亮干净，红茶、橙子与花香，水洗站精细处理。' },
  { key:'Burundi', cn:'布隆迪', coord:[29.9,-3.4], continent:'非洲',
    regions:['卡扬扎 Kayanza'],
    desc:'与卢旺达风味相近，波旁种带来清新的黑醋栗、橙花与红茶感，甜润而细腻。' },
  { key:'Tanzania', cn:'坦桑尼亚', coord:[34.9,-6.4], continent:'非洲',
    regions:['乞力马扎罗','姆贝亚 Mbeya'],
    desc:'乞力马扎罗山脚，明亮活泼。黑加仑、柑橘与花香，常以 AA 分级，被称"非洲咖啡的绅士"。' },
  { key:'Uganda', cn:'乌干达', coord:[32.3,1.3], continent:'非洲',
    regions:['艾尔贡山 Mt. Elgon','鲁文佐里 Rwenzori'],
    desc:'兼产阿拉比卡与本土罗布斯塔，水洗阿拉比卡呈现明亮果酸、葡萄与红茶感。' },
];

/* ---------- 豆种 / 品种 ---------- */
CM.varieties = [
  { id:'typica', cn:'铁皮卡 Typica',
    desc:'最古老的阿拉比卡栽培种之一，几乎所有品种的"母本"。风味干净、甜感优雅、酒体细腻，但产量低、抗病弱。' },
  { id:'bourbon', cn:'波旁 Bourbon',
    desc:'由铁皮卡突变而来，分红/黄/粉波旁。甜感与醇厚度出色，圆润的焦糖与红色水果，是众多名种的亲本。' },
  { id:'geisha', cn:'瑰夏 Geisha / 藝伎',
    desc:'源自埃塞俄比亚 Gesha 村，因巴拿马翡翠庄园一战成名。极致的茉莉花香、佛手柑、白桃与红茶感，精品塔尖与天价的代名词。' },
  { id:'sl28', cn:'SL28',
    desc:'肯尼亚 Scott Labs 选育，耐旱、深根。标志性的黑加仑、莓果与多汁酸甜，结构感强。' },
  { id:'sl34', cn:'SL34',
    desc:'同为 Scott Labs 选育，适应高海拔与更多降雨。浓郁果汁感与饱满酒体，常与 SL28 同园。' },
  { id:'caturra', cn:'卡杜拉 Caturra',
    desc:'波旁的矮株突变，高产、易管理，中南美主力。明亮酸质与清爽柑橘甜。' },
  { id:'catuai', cn:'卡图艾 Catuai',
    desc:'新世界 × 卡杜拉，植株矮、抗风耐候。均衡温和，甜感稳定，适应性极强。' },
  { id:'catimor', cn:'卡蒂姆 Catimor',
    desc:'卡杜拉 × 提莫(含罗布斯塔血统)，高抗叶锈病、高产。风味较朴实，是抗病育种的重要骨架。' },
  { id:'castillo', cn:'卡斯蒂洛 Castillo',
    desc:'哥伦比亚国家咖啡研究中心选育的抗病种，稳定高产，现代哥伦比亚的主力品种。' },
  { id:'pacamara', cn:'帕卡马拉 Pacamara',
    desc:'帕卡斯 × 象豆，豆粒巨大。风味奔放，草本、热带水果与浓郁甜感兼具，竞赛常客。' },
  { id:'pacas', cn:'帕卡斯 Pacas',
    desc:'波旁在萨尔瓦多的矮株突变，干净甜感与温和酸质。' },
  { id:'maragogipe', cn:'象豆 Maragogipe',
    desc:'铁皮卡的超大豆突变，颗粒硕大。温和柔顺、酒体轻盈、甜感细致。' },
  { id:'mundonovo', cn:'新世界 Mundo Novo',
    desc:'波旁 × 苏门答腊铁皮卡，巴西主力。醇厚高产，坚果与可可甜。' },
  { id:'heirloom', cn:'原生种 Heirloom',
    desc:'埃塞俄比亚未被分类的古老地方种群统称，基因极其多样，是复杂花果香的源头。' },
  { id:'sidra', cn:'希爪 Sidra',
    desc:'厄瓜多尔/哥伦比亚的明星种，疑似波旁×铁皮卡。干净的花香、柑橘与丝滑甜感。' },
  { id:'pinkbourbon', cn:'粉红波旁 Pink Bourbon',
    desc:'红、黄波旁的自然杂交，果实呈粉色。明亮的花香、热带水果与柑橘酸，近年大热。' },
  { id:'wushwush', cn:'瓦旭瓦旭 Wush Wush',
    desc:'源自埃塞的稀有种，浓郁的热带花果与丝滑茶感，常见于高端微批次。' },
  { id:'ruiru11', cn:'Ruiru 11 / Batian',
    desc:'肯尼亚选育的抗病高产新种，在保留肯尼亚风味的同时增强抗病性。' },
];

/* ---------- 处理法 ---------- */
CM.processes = [
  { id:'washed', cn:'水洗 Washed', color:'#4A90D9',
    desc:'去除果肉后发酵、洗净再干燥。最能体现产地风土：干净、透明、酸质明亮、风味轮廓清晰。' },
  { id:'natural', cn:'日晒 Natural', color:'#E8743B',
    desc:'带果肉整颗干燥。果香浓郁、甜感饱满、酒体厚实，常有发酵酒香与莓果调，是日晒迷的最爱。' },
  { id:'honey', cn:'蜜处理 Honey', color:'#E0A500',
    desc:'保留部分果胶带壳干燥，介于水洗与日晒之间。甜感圆润、酸度柔和，按果胶保留量分白/黄/红/黑蜜。' },
  { id:'redhoney', cn:'红蜜 Red Honey', color:'#C0392B',
    desc:'保留较多果胶、较慢干燥，发酵更深。更浓的焦糖与红色水果甜，酒体厚于黄蜜。' },
  { id:'blackhoney', cn:'黑蜜 Black Honey', color:'#5B3A1E',
    desc:'果胶保留最多、干燥最慢，风味最接近日晒。浓郁的甜感、发酵果香与厚实酒体。' },
  { id:'wethulled', cn:'湿刨法 Wet-hulled', color:'#6E5B43',
    desc:'印尼传统(Giling Basah)，半干带壳即脱去种壳。低酸、醇厚，草本、木质、雪松与泥土调，曼特宁招牌。' },
  { id:'anaerobic', cn:'厌氧发酵 Anaerobic', color:'#8E44AD',
    desc:'密闭无氧环境控制发酵，强化并创造奇异风味——肉桂、荔枝、酒感、热带水果，现代精品的实验场。' },
  { id:'carbonic', cn:'二氧化碳浸渍 Carbonic', color:'#7E2D86',
    desc:'借鉴葡萄酒酿造，整颗咖啡在充满 CO₂ 的环境中发酵。风味干净却强烈，果味集中。' },
  { id:'doubleferment', cn:'双重发酵 Double Ferment', color:'#9B59B6',
    desc:'经历两段不同条件的发酵，层次更复杂，甜感与发酵香更突出。' },
  { id:'raisin', cn:'葡萄干日晒 Raisin', color:'#7E5109',
    desc:'延长果实在树上或棚架的脱水时间，糖分高度浓缩，呈现葡萄干、红枣般的厚重甜。' },
];

/* ---------- 烘焙度 ---------- */
CM.roasts = [
  { id:'light', cn:'浅焙 Light', agtron:'#85-95', level:1, color:'#C99B6A',
    desc:'酸质明亮、风味清晰、花果香突出，最大程度保留产地特征。精品手冲的主流取向。' },
  { id:'mediumlight', cn:'中浅焙 Medium-Light', agtron:'#65-75', level:2, color:'#A9733F',
    desc:'酸甜平衡、甜感开始显现，兼顾产地风味与醇厚度，最百搭的烘焙度。' },
  { id:'medium', cn:'中焙 Medium', agtron:'#55-65', level:3, color:'#8A5A2B',
    desc:'焦糖甜上升、酸度收敛，均衡圆润，坚果与可可调开始主导。' },
  { id:'mediumdark', cn:'中深焙 Medium-Dark', agtron:'#45-50', level:4, color:'#5E3A1E',
    desc:'醇厚饱满，巧克力、坚果与微苦甜，油脂初现，常见于意式与拿铁基底。' },
  { id:'dark', cn:'深焙 Dark', agtron:'#25-40', level:5, color:'#3A241A',
    desc:'烟熏、可可与焦香主导，低酸、油脂明显、苦甜浓烈，是传统意式浓缩的经典风格。' },
];

/* ---------- 海拔 ---------- */
CM.altitudes = [
  { id:'a1', cn:'< 1000m', range:[0,1000], desc:'低海拔，豆质较软，风味温和、酒体偏轻，多见于罗布斯塔或商业级。' },
  { id:'a2', cn:'1000–1200m', range:[1000,1200], desc:'中低海拔，平衡温和，常见 MHB 等级。' },
  { id:'a3', cn:'1200–1500m', range:[1200,1500], desc:'精品常见高度，酸甜与复杂度俱佳，HB/SHB 区间。' },
  { id:'a4', cn:'1500–1800m', range:[1500,1800], desc:'高海拔慢熟，豆质坚硬密度高，酸质明亮、风味集中(SHB/SHG)。' },
  { id:'a5', cn:'1800–2000m', range:[1800,2000], desc:'高海拔精品带，复杂花果香与紧致结构。' },
  { id:'a6', cn:'> 2000m', range:[2000,3000], desc:'极高海拔，风味极度集中、酸质凌厉，多为竞赛与微批次。' },
];

/* ---------- 风味（按 SCA 风味轮分组，每组带颜色）---------- */
CM.flavorGroups = [
  { id:'floral',     cn:'花香',     color:'#D98BB0',
    items:['茉莉','玫瑰','洋甘菊','橙花','木槿','薰衣草'],
    desc:'花香系来自高海拔与精细处理，常见于瑰夏、埃塞水洗。代表优雅与高级感。' },
  { id:'berry',      cn:'莓果',     color:'#C0392B',
    items:['草莓','蓝莓','黑莓','覆盆子','黑加仑','蔓越莓'],
    desc:'莓果调是日晒与肯尼亚豆的招牌，明亮的酸甜与多汁感令人愉悦。' },
  { id:'citrus',     cn:'柑橘',     color:'#F2A900',
    items:['柠檬','橙子','葡萄柚','青柠','佛手柑','金桔'],
    desc:'柑橘酸清爽明快，是水洗豆活泼酸质的核心，常与花香相伴。' },
  { id:'stonefruit', cn:'核果',     color:'#E8743B',
    items:['白桃','黄桃','杏','油桃','樱桃','李子'],
    desc:'核果调甜润多汁，质地圆润，常见于优质水洗与蜜处理。' },
  { id:'tropical',   cn:'热带水果', color:'#F1C40F',
    items:['芒果','菠萝','百香果','荔枝','番石榴','哈密瓜'],
    desc:'热带水果常源自厌氧与日晒，奔放浓烈、辨识度极高。' },
  { id:'driedfruit', cn:'果干',     color:'#7E5109',
    items:['葡萄干','西梅','红枣','无花果','蜜饯'],
    desc:'果干调来自深度脱水与发酵，厚重浓缩的甜，是日晒与也门豆的特征。' },
  { id:'caramel',    cn:'焦糖甜',   color:'#B9770E',
    items:['焦糖','红糖','蜂蜜','枫糖','太妃糖','黑糖'],
    desc:'糖类甜感是烘焙梅纳反应的产物，构成咖啡的"骨架甜"，中焙尤为突出。' },
  { id:'chocolate',  cn:'巧克力',   color:'#5B3A1E',
    items:['黑巧克力','牛奶巧克力','可可','摩卡'],
    desc:'巧克力/可可调温暖醇厚，是巴西、中深焙与意式拼配的标志性余韵。' },
  { id:'nutty',      cn:'坚果',     color:'#8B6B3E',
    items:['杏仁','榛子','花生','核桃','腰果'],
    desc:'坚果调干香温润，常与可可、焦糖结伴，构成顺口的均衡感。' },
  { id:'spice',      cn:'香料',     color:'#A0522D',
    items:['肉桂','丁香','黑胡椒','豆蔻','茴香','姜'],
    desc:'香料调增添复杂度与异域感，常见于印度、也门与厌氧处理。' },
  { id:'fermented',  cn:'发酵酒香', color:'#6C3483',
    items:['红酒','威士忌','朗姆','发酵感','白兰地'],
    desc:'酒香来自发酵处理，恰当时迷人复杂，过度则成瑕疵，是厌氧豆的双刃剑。' },
  { id:'herbal',     cn:'草本茶感', color:'#4E944F',
    items:['绿茶','红茶','青草','香草','薄荷'],
    desc:'草本与茶感清雅干净，是瑰夏与高海拔水洗的优雅尾韵。' },
  { id:'roasted',    cn:'焙烤谷物', color:'#4D4D4D',
    items:['烟草','烟熏','麦芽','谷物','烤面包'],
    desc:'焙烤调来自深烘，烟熏与谷物香，是深焙与意式风格的底色。' },
];

/* ---------- 冲煮方法 ---------- */
CM.brews = [
  { id:'v60', cn:'手冲 · V60', desc:'锥形滤杯，螺旋导流肋骨，流速快。能凸显明亮酸质与层次，是精品手冲的代表。' },
  { id:'kalita', cn:'手冲 · Kalita Wave', desc:'平底三孔滤杯，萃取均匀稳定、容错率高，风味干净饱满。' },
  { id:'chemex', cn:'手冲 · Chemex', desc:'厚滤纸过滤油脂，咖啡极致干净透亮，口感顺滑、酸质柔和。' },
  { id:'origami', cn:'手冲 · Origami', desc:'折纸滤杯，可搭配锥形或波浪滤纸，兼具 V60 的层次与 Kalita 的均匀。' },
  { id:'aeropress', cn:'爱乐压 Aeropress', desc:'气压辅助浸泡萃取，便携多变、容错高，可做出浓郁或清爽的多种风格。' },
  { id:'frenchpress', cn:'法压壶 French Press', desc:'金属滤网全浸泡，保留油脂与微粉，醇厚饱满、口感厚重。' },
  { id:'espresso', cn:'意式浓缩 Espresso', desc:'9 bar 高压萃取，浓缩咖啡油脂(Crema)丰富，是拿铁、卡布的灵魂基底。' },
  { id:'moka', cn:'摩卡壶 Moka Pot', desc:'炉上蒸汽压力萃取，浓郁醇厚、近似浓缩，意式家庭经典。' },
  { id:'coldbrew', cn:'冷萃 Cold Brew', desc:'冷水长时间(12–24h)浸泡，低酸顺滑、甜感突出，夏日宠儿。' },
  { id:'siphon', cn:'虹吸 Siphon', desc:'蒸汽与负压循环萃取，仪式感十足，风味干净、香气张扬。' },
  { id:'clever', cn:'聪明杯 Clever', desc:'浸泡 + 过滤结合，操作简单稳定，风味饱满干净，新手友好。' },
];

/* ---------- 评分维度（可点开做小评分，可选）---------- */
CM.scoreAspects = [
  { id:'aroma', cn:'香气' }, { id:'acidity', cn:'酸质' }, { id:'sweetness', cn:'甜感' },
  { id:'body', cn:'醇厚' }, { id:'aftertaste', cn:'余韵' },
];

/* ---------- 萃取自检：风味→欠/过萃信号（启发式，按子串匹配，含自定义词）---------- */
CM.extractSignal = {
  under: ['尖酸','酸涩','涩酸','青草','草','咸','生青','番茄','尖锐','刺激','水感'],   // 欠萃倾向
  over:  ['苦','发苦','焦','焦苦','烟熏','烟','木','雪松','空洞','干涩','灰','谷物','烤糊','涩'], // 过萃倾向
};

/* ---------- 产地典型风味组（用于"下一支推荐"的吻合度）---------- */
CM.originFlavorHint = {
  Ethiopia:['floral','berry','citrus'], Kenya:['berry','citrus','tropical'], Rwanda:['floral','citrus','berry'],
  Burundi:['berry','citrus','floral'], Tanzania:['berry','citrus','chocolate'], Uganda:['chocolate','nutty','caramel'],
  Colombia:['caramel','chocolate','stonefruit'], Brazil:['nutty','chocolate','caramel'], Panama:['floral','citrus','stonefruit'],
  Guatemala:['chocolate','caramel','spice'], 'Costa Rica':['citrus','caramel','stonefruit'], Honduras:['caramel','nutty','stonefruit'],
  'El Salvador':['caramel','stonefruit','chocolate'], Nicaragua:['nutty','caramel','chocolate'], Peru:['nutty','chocolate','caramel'],
  Mexico:['nutty','chocolate','caramel'], Bolivia:['floral','stonefruit','caramel'], Ecuador:['floral','stonefruit','chocolate'],
  Jamaica:['nutty','chocolate','caramel'], Indonesia:['chocolate','spice','herbal'], India:['spice','chocolate','nutty'],
  Vietnam:['chocolate','nutty','roasted'], China:['nutty','chocolate','caramel'], 'Papua New Guinea':['chocolate','tropical','herbal'],
  Yemen:['driedfruit','chocolate','fermented'],
};

/* ---------- 查找助手 ---------- */
CM.find = {
  origin: k => CM.origins.find(o => o.key===k || o.cn===k),
  variety: k => CM.varieties.find(o => o.id===k || o.cn===k),
  process: k => CM.processes.find(o => o.id===k || o.cn===k),
  roast: k => CM.roasts.find(o => o.id===k || o.cn===k),
  brew: k => CM.brews.find(o => o.id===k || o.cn===k),
  flavorGroup: k => CM.flavorGroups.find(o => o.id===k || o.cn===k),
  // 给定一个风味叶子词，返回其所属分组（用于上色）
  flavorOf: leaf => CM.flavorGroups.find(g => g.cn===leaf || g.id===leaf || (g.items||[]).includes(leaf)),
};

/* 扁平风味词表（标签输入用） */
CM.flavorFlat = CM.flavorGroups.flatMap(g => g.items.map(i => ({ leaf:i, group:g.id, cn:g.cn, color:g.color, emoji:g.emoji })));
