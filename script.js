// ============================================
// script.js - Vue 逻辑（提取功能修复版）
// ============================================

const { createApp, ref, computed, reactive, onBeforeUnmount } = Vue;

createApp({
    setup() {
        // ==================== Toast ====================
        const toast = reactive({
            show: false,
            message: '',
            type: 'info',
            icon: 'fa-solid fa-info-circle'
        });

        let toastTimer = null;

        const showToast = (message, type = 'info') => {
            if (toastTimer) clearTimeout(toastTimer);
            const icons = {
                success: 'fa-solid fa-check-circle',
                error: 'fa-solid fa-exclamation-circle',
                info: 'fa-solid fa-info-circle'
            };
            toast.message = message;
            toast.type = type;
            toast.icon = icons[type] || icons.info;
            toast.show = true;
            toastTimer = setTimeout(() => {
                toast.show = false;
            }, 2500);
        };

        // ==================== 自定义确认对话框 ====================
        const confirm = reactive({
            show: false,
            title: '',
            message: '',
            icon: '⚠️',
            confirmText: '确定',
            cancelText: '取消',
            onConfirm: null
        });

        // ==================== 统一匹配函数 ====================
        const checkMatch = (input, keyword) => {
            if (!input || !keyword) return { status: 'none', score: 0 };

            if (input.includes(keyword)) {
                return { status: 'full', score: 1 };
            }

            const synList = synonyms[keyword] || [];
            for (const syn of synList) {
                if (input.includes(syn)) {
                    return { status: 'full', score: 1 };
                }
            }

            let matchSet = new Set();
            for (let i = 0; i < keyword.length - 1; i++) {
                const sub = keyword.substring(i, i + 2);
                if (sub.length === 2 && input.includes(sub)) {
                    matchSet.add(sub);
                }
            }
            for (const syn of synList) {
                for (let i = 0; i < syn.length - 1; i++) {
                    const sub = syn.substring(i, i + 2);
                    if (sub.length === 2 && input.includes(sub)) {
                        matchSet.add(sub);
                    }
                }
            }

            if (matchSet.size >= 2) {
                return { status: 'partial', score: 0.3 };
            }
            if (matchSet.size >= 1) {
                return { status: 'weak', score: 0.1 };
            }

            return { status: 'none', score: 0 };
        };

        // ==================== 同义词词典 ====================
        const synonyms = {
            '母亲送伞': ['妈妈送伞', '母亲拿伞', '母亲带伞', '送伞'],
            '打扮寒酸': ['穿着简陋', '穿着朴素', '破旧衣服'],
            '丢脸': ['难为情', '羞愧', '没面子', '丢人'],
            '厌烦': ['反感', '不耐烦', '讨厌', '烦躁'],
            '拒绝': ['推开', '不要', '不接受', '不肯', '拒绝'],
            '没拿伞': ['不带伞', '不要伞', '不接伞'],
            '冲入雨中': ['跑进雨里', '冲进雨帘', '跑进雨帘'],
            '大雨': ['暴雨', '倾盆大雨', '滂沱大雨'],
            '被困': ['困住', '被堵', '无法走', '困在'],
            '湿透': ['全身湿了', '淋湿', '湿漉漉'],
            '懊悔': ['后悔', '自责', '懊恼'],
            '母亲追来': ['妈妈追来', '母亲赶来', '冒雨追来'],
            '撑伞': ['遮雨', '打伞', '挡雨', '举伞'],
            '湿透受冻': ['浑身湿透', '湿冷', '受冻'],
            '感动': ['触动', '动容', '感激'],
            '落泪': ['流泪', '掉泪', '眼泪', '泪水'],
            '体会母爱': ['理解母爱', '明白母爱', '感受母爱'],
            '愧疚': ['惭愧', '内疚', '自责'],
            '感激': ['感恩', '感谢', '感动'],
            '挑选': ['选择', '选', '挑'],
            '原藤': ['藤条', '藤材', '原料藤'],
            '削去': ['刮去', '去掉', '去除'],
            '表皮': ['外皮', '皮', '表层'],
            '刺': ['利刺', '尖刺', '刺'],
            '浸泡': ['泡', '浸', '泡水'],
            '活水': ['流动水', '清水'],
            '软化': ['变软', '软化', '柔软'],
            '柔韧': ['韧性', '柔软', '有韧性'],
            '高温熏蒸': ['熏蒸', '蒸', '高温蒸'],
            '弯折': ['弯曲', '折弯', '弯'],
            '主框架': ['框架', '骨架', '架子'],
            '固定': ['绑紧', '固定', '固定好'],
            '剖成窄条': ['剖条', '切成条', '窄条'],
            '十字交错': ['交错', '交叉', '十字'],
            '编织': ['编', '织', '编制'],
            '坐垫靠背': ['坐垫', '靠背', '坐位'],
            '火烘烤': ['烘烤', '烤', '火烤'],
            '烧去毛刺': ['去毛刺', '烧毛刺', '除刺'],
            '涂刷生漆': ['涂漆', '刷漆', '上漆'],
            '风干': ['晾干', '干', '风干'],
            '碎片化': ['碎片', '零碎', '分散'],
            '感官刺激': ['刺激', '感官', '视觉刺激'],
            '分散': ['分心', '散', '不集中'],
            '专注力': ['注意力', '专注', '集中力'],
            '应试导向': ['应试', '考试导向', '功利'],
            '功利性阅读': ['功利阅读', '功利', '应试阅读'],
            '缺乏探究': ['缺乏探究', '不探究', '表面'],
            '缺乏': ['缺少', '没有', '不足'],
            '安静环境': ['安静', '安静空间', '无干扰'],
            '电子产品干扰': ['电子产品', '干扰', '手机干扰'],
            '无电子设备': ['无电子', '不用电子', '脱离电子'],
            '静读时段': ['静读', '安静阅读', '阅读时段'],
            '修复专注力': ['修复', '专注', '恢复专注'],
            '批注': ['批注', '标注', '划线'],
            '拆解': ['拆解', '分解', '分析'],
            '讨论': ['讨论', '交流', '分享'],
            '思辨能力': ['思辨', '思考', '逻辑'],
            '弱化功利': ['弱化功利', '功利', '去功利'],
            '整本书阅读': ['整本书', '全书阅读', '整本'],
            '好奇心': ['好奇', '兴趣', '求知欲'],
            '上海牌手表': ['上海手表', '旧手表', '老手表', '手表'],
            '表盘泛黄': ['表盘发黄', '表盘旧了', '泛黄'],
            '磨损': ['磨坏', '破旧', '老旧'],
            '指针走': ['指针走', '走时', '滴答'],
            '祖父': ['爷爷', '外公', '老人家'],
            '上发条': ['上弦', '上链', '拧发条'],
            '守信守时': ['守信用', '准时', '守信'],
            '从不迟到': ['不迟到', '准时', '守时'],
            '农民': ['种田人', '农户', '庄稼人'],
            '丈量': ['衡量', '度量', '测量'],
            '分寸': ['尺度', '尺度', '度'],
            '做人的规矩': ['规矩', '做人道理', '原则'],
            '信用': ['信誉', '诚信', '信用'],
            '品格': ['品德', '品质', '人格'],
            '不会褪色': ['不褪色', '永存', '持久'],
            '永恒': ['永远', '恒久', '永恒'],
            '书桌': ['书桌上', '桌上', '案头'],
            '走走停停': ['停停走走', '走停', '时走时停'],
            '没有修': ['不修', '未修', '没修'],
            '善待时间': ['珍惜时间', '善待时光', '珍惜'],
            '善待人': ['善待他人', '善待每个人', '善待'],
            '选豆': ['选黄豆', '挑豆', '选豆子'],
            '颗粒饱满': ['饱满', '圆润', '充实'],
            '金黄': ['黄色', '金黄', '亮黄'],
            '剔除': ['去掉', '去除', '挑出'],
            '清水': ['干净水', '水', '清水'],
            '膨胀': ['涨大', '发胀', '吸饱水'],
            '捏碎': ['捏碎', '掐碎', '碾碎'],
            '石磨': ['石磨', '磨', '石磨子'],
            '磨浆': ['磨豆浆', '研磨', '磨'],
            '细水长流': ['水流细', '慢流', '细水'],
            '生豆浆': ['豆浆', '生浆', '豆汁'],
            '滤渣': ['过滤', '滤豆渣', '去渣'],
            '布袋': ['布袋子', '滤布', '布'],
            '纯净': ['干净', '清澈', '纯'],
            '煮浆': ['煮豆浆', '加热', '煮沸'],
            '铁锅': ['大锅', '铁锅', '锅'],
            '煮沸': ['煮开', '沸', '烧开'],
            '撇去浮沫': ['去泡沫', '撇沫', '去浮沫'],
            '火候': ['火候', '火力', '火'],
            '点卤': ['加卤', '点卤水', '下卤'],
            '卤水': ['卤水', '卤汁', '盐卤'],
            '凝固': ['结块', '成块', '凝结'],
            '豆花': ['豆腐花', '豆花', '絮状'],
            '压制成形': ['压制', '压模', '压'],
            '纱布': ['纱布', '布', '滤布'],
            '木格': ['木格子', '模具', '格子'],
            '压榨': ['压', '挤压', '去水'],
            '网络社交': ['网上社交', '线上社交', '社交媒体'],
            '虚拟化': ['虚拟', '不真实', '虚幻'],
            '表面化': ['表面', '肤浅', '浅层'],
            '孤独': ['孤单', '寂寞', '孤独感'],
            '表情符号': ['表情', '表情包', 'emoji'],
            '替代': ['代替', '取代', '取代了'],
            '微笑': ['笑', '笑容', '微笑'],
            '拥抱': ['抱', '拥抱', '相拥'],
            '比较': ['攀比', '对比', '比较'],
            '焦虑': ['焦虑', '不安', '紧张'],
            '精心设计': ['精心', '设计', '修饰'],
            '点赞': ['点赞', '赞', 'like'],
            '面对面': ['当面', '面对面', '当面交流'],
            '表情': ['表情', '神情', '脸'],
            '语气': ['语气', '语调', '声音'],
            '肢体动作': ['肢体', '动作', '身体语言'],
            '抑郁': ['抑郁', '消沉', '低落'],
            '深度交流': ['深入交流', '深度对话', '认真交谈'],
            '无屏幕时间': ['无屏幕', '离开手机', '不看屏幕'],
            '延伸': ['延伸', '扩展', '补充']
        };

        // ==================== SPM字数计算 ====================
        const removeWordDeclaration = (text) => {
            if (!text) return '';
            return text.replace(/[（(]\s*共?\s*\d+\s*字\s*[）)]\s*$|共?\s*\d+\s*字\s*$/g, '').trim();
        };

        const countSPMWords = (text) => {
            if (!text) return 0;
            const cleanText = removeWordDeclaration(text);
            if (!cleanText) return 0;
            const cleaned = cleanText.replace(/[\u3000\s.,;:!?'"()\-—，。、；：！？""''（）《》【】……\u3000]/g, '');
            return cleaned.length;
        };

        const countPunctuation = (text) => {
            if (!text) return 0;
            const cleanText = removeWordDeclaration(text);
            if (!cleanText) return 0;
            const punct = cleanText.match(/[，。、；：！？""''（）《》【】……！？；：＂＇（），．：；？！\s.,;:!?'"()\-—]/g);
            return punct ? punct.length : 0;
        };

        const detectDeclaredWordCount = (text) => {
            if (!text) return 0;
            const match = text.match(/[（(]\s*共?\s*(\d+)\s*字\s*[）)]\s*$|共?\s*(\d+)\s*字\s*$/);
            if (match) {
                return parseInt(match[1] || match[2]);
            }
            return 0;
        };

        // ==================== 题库 ====================
        const questions = [{
            id: 'SPM-01',
            short_title: '送伞',
            category: '记叙文',
            prompt: '概述作者从厌烦到理解并感激母亲送伞的经过。',
            word_limit: 130,
            passage: [
                "那是一个骤雨初歇的午后，天空阴沉得仿佛要压下来。放学铃声刚响，校门口便挤满了接孩子的家长。我在人群中一眼就看到了母亲，她穿着一件洗得发白的旧外套，手里紧紧攥着一把褪色的碎花雨伞，焦急地朝校门内张望。",
                "周围同学投来异样的目光，窃语纷纷。我顿觉脸上火辣辣的，心里涌起一阵莫名的烦躁与羞耻，觉得母亲这副打扮和寒酸的雨伞让我丢尽了脸面。我故意低下头，装作没看见她，快步从她身边绕过去。母亲察觉到了我，小跑着追上来，气喘吁吁地把伞递给我，关切地说：\"天气预报说待会儿还有大暴雨，带上伞，别淋湿了。\"我一把推开她的手，没好气地嚷道：\"烦死了，谁要你的破伞！\"说完便头也不回地冲进了雨帘中。",
                "没走多远，豆大的雨点便倾盆而下。我被困在沿街一家店铺狭窄的屋檐下，浑身湿透，冷得瑟瑟发抖。冰冷的雨水顺着发梢滑进脖颈，我抱着双臂，心里满是懊悔与无助。就在这时，一把熟悉的碎花伞悄然遮在了我的头顶。",
                "我猛地抬头，只见母亲浑身早已湿透，额前的头发贴在苍白的脸上，嘴唇冻得发紫。她费力地将伞全撑在我这边，喘着粗气笑着说：\"快打着，别着凉了。\"那一刻，看着母亲颤抖的双手和被雨水浸湿的双肩，我的眼泪夺眶而出。我终于明白，那把看似寒酸的雨伞下，藏着母亲毫无保留、沉甸甸的爱，过去的任性与虚荣在这一刻化作了深深的愧疚与感激。"
            ],
            rubrics: [
                { point_id: 1, score: 4, keywords: ["母亲送伞", "打扮寒酸", "丢脸", "厌烦"],
                display: "母亲送伞 / 打扮寒酸 / 丢脸 / 厌烦" },
                { point_id: 2, score: 3, keywords: ["拒绝", "没拿伞", "冲入雨中"],
                display: "拒绝拿伞 / 冲入雨中" },
                { point_id: 3, score: 3, keywords: ["大雨", "被困", "湿透", "懊悔"],
                display: "大雨被困 / 湿透 / 懊悔" },
                { point_id: 4, score: 4, keywords: ["母亲追来", "撑伞", "湿透受冻"],
                display: "母亲追来 / 撑伞 / 湿透受冻" },
                { point_id: 5, score: 3, keywords: ["感动", "落泪"], display: "感动落泪" },
                { point_id: 6, score: 3, keywords: ["体会母爱", "愧疚", "感激"],
                display: "体会母爱 / 愧疚 / 感激" }
            ],
            standard_summary: "母亲到校送伞，作者因母亲打扮寒酸且伞褪色而觉得丢脸与厌烦，便拒绝拿伞并冲入雨中。随后下起大雨，作者被困屋檐下，浑身湿透且懊悔无助。母亲冒雨追来为作者遮雨，自己却湿透受冻。作者感动落泪，深刻体会到母爱的无私，由任性转为愧疚与感激。"
        }, {
            id: 'SPM-02',
            short_title: '编藤椅',
            category: '说明文',
            prompt: '概述编藤艺人制作一把坚固藤椅的具体工序。',
            word_limit: 125,
            passage: [
                "在传统手工艺逐渐式微的今天，老林依然守着他的藤器作坊。一把看似朴实无华的藤椅，背后却凝聚着极其严苛的繁复工序。",
                "选材是第一步。老林清晨便要进入山林挑选生长期在五年以上、粗细均匀且无虫蛀的原藤。将原藤运回作坊后，首先要用特制的刮刀细致地削去藤皮上的利刺与外层粗糙的表皮，使其表面平滑。紧接着，必须将清理干净的藤条浸泡在活水池中整整三天，让纤维充分吸水软化，以增强其柔韧度，否则后续弯曲时极易折断。",
                "浸泡充分的粗藤随后被送入高温蒸汽箱进行熏蒸。在藤条受热变软的极短时间内，老林凭借老练的手劲与模具迅速将其弯折成椅子所需的弧形主框架，并用麻绳牢牢固定定型。框架晾干硬化后，便进入最耗费心力的编织阶段。老林将浸软的细藤皮剖成厚薄一致的窄条，采用传统的十字交错法，在框架的坐垫与靠背部分密密麻麻地穿引编织，期间必须保持每一道藤条的拉力均匀，确保紧实平整。",
                "最后，整把藤椅还要经过明火快速烘烤，烧去表面残留的微小毛刺，并均匀涂刷两遍天然生漆。待生漆完全风干后，一把防潮防蛀、结实耐用的传统藤椅才算真正大功告成。"
            ],
            rubrics: [
                { point_id: 1, score: 4, keywords: ["挑选", "原藤", "削去", "表皮", "刺"],
                display: "挑选原藤 / 削去表皮刺杂" },
                { point_id: 2, score: 3, keywords: ["浸泡", "活水", "软化", "柔韧"],
                display: "浸泡软化" },
                { point_id: 3, score: 4, keywords: ["高温熏蒸", "弯折", "主框架", "固定"],
                display: "高温熏蒸 / 弯折固定主框架" },
                { point_id: 4, score: 4, keywords: ["剖成窄条", "十字交错", "编织", "坐垫靠背"],
                display: "剖条 / 十字交错编织 / 坐垫靠背" },
                { point_id: 5, score: 2, keywords: ["火烘烤", "烧去毛刺"],
                display: "火烘烤烧毛刺" },
                { point_id: 6, score: 3, keywords: ["涂刷生漆", "风干"],
                display: "涂刷生漆风干" }
            ],
            standard_summary: "制作藤椅需先选无虫蛀原藤并削去表皮刺杂；接着浸水数日软化纤维；随后高温熏蒸粗藤，趁热弯折固定成主框架；再将细藤剖条，以十字交错法紧密编织坐垫与靠背；最后用火烤除毛刺，涂刷生漆并风干，一把坚固耐用的藤椅便告完成。"
        }, {
            id: 'SPM-03',
            short_title: '阅读障碍',
            category: '议论文',
            prompt: '概述数字时代青少年产生深度阅读障碍的原因及应对策略。',
            word_limit: 130,
            passage: [
                "随着移动互联网与智能设备的全面普及，青少年的阅读生态发生了翻天覆地的变化。然而，越来越多的教育学者担忧：年轻一代正逐渐丧失沉浸于长篇文字的\"深度阅读能力\"。",
                "造成这一现象的根源是多维度的。首先，短视频与即时社交软件以高频、碎片化的感官刺激为主，导致大脑习惯了瞬时多巴胺的奖赏反馈，青少年的专注力被严重撕裂，难以忍受长文本带来的认知延迟满足。其次，快节奏的应试导向使功利性阅读盛行，许多学生将阅读局限于提取标准答案与考试考点，缺乏对文本内涵、结构与思想脉络的主动探究。此外，家庭与校园中普遍缺乏沉浸式的安静阅读场域，电子产品的无序介入随时打断思考，进一步加剧了阅读的浅表化。",
                "要重塑青少年的深度阅读习惯，必须多管齐下。学校与家庭应当积极推行\"无电子设备阅读时间\"，每天设立固定的静读时段，营造零干扰的环境以逐步修复专注力。同时，教师应引导学生由浅入深，采用批注阅读、思维导图拆解与同伴读书会讨论等深度加工方法，提升逻辑思辨能力。最后，家长与教育者应弱化功利目的，鼓励跨学科与整本书阅读，激发青少年对文本知识本身的内在好奇心。"
            ],
            rubrics: [
                { point_id: 1, score: 4, keywords: ["碎片化", "感官刺激", "分散", "专注力"],
                display: "碎片化媒体 / 分散专注力" },
                { point_id: 2, score: 3, keywords: ["应试导向", "功利性阅读", "缺乏探究"],
                display: "应试导向 / 功利阅读 / 缺乏探究" },
                { point_id: 3, score: 3, keywords: ["缺乏", "安静环境", "电子产品干扰"],
                display: "缺乏安静环境 / 电子产品干扰" },
                { point_id: 4, score: 4, keywords: ["无电子设备", "静读时段", "修复专注力"],
                display: "无电子设备 / 静读时段 / 修复专注力" },
                { point_id: 5, score: 3, keywords: ["批注", "拆解", "讨论", "思辨能力"],
                display: "批注 / 拆解 / 讨论 / 思辨能力" },
                { point_id: 6, score: 3, keywords: ["弱化功利", "整本书阅读", "好奇心"],
                display: "弱化功利 / 整本书阅读 / 激发好奇心" }
            ],
            standard_summary: "阅读障碍源于碎片化媒体分散专注力、应试导向造成功利阅读，以及缺乏安静无干扰的环境。应对策略包括：设立无电子设备的固定静读时段以重塑专注力；采用批注、思维拆解与读书讨论等方法强化思辨；弱化功利目的并提倡整本书阅读，激发内在好奇心。"
        }, {
            id: 'SPM-04',
            short_title: '爷爷的旧手表',
            category: '记叙文',
            prompt: '概述作者对爷爷旧手表的回忆，以及从中领悟到的人生道理。',
            word_limit: 125,
            passage: [
                "祖父去世后，父亲把那块老旧的上海牌手表留给了我。表盘已经泛黄，玻璃面上有几道细细的划痕，皮表带也磨损得厉害，边缘都起了毛。但指针还在走，滴答滴答，像祖父的心脏还在跳动。",
                "我把它贴在耳边，那熟悉的声响一下子把我拉回了童年。祖父每天清晨都会给手表上发条，那动作不紧不慢，仿佛是在完成一种仪式。他常说：\"表要准，人要真。\"他一生守信守时，从不迟到，也从不食言。村里谁家有红白喜事，总请他帮忙记账、操持，因为他办事最牢靠。",
                "祖父当了一辈子农民，没有大富大贵，但他用这块表丈量了一生的分寸。他教我认时间，也教我守时间：\"答应别人的事，比黄金还重。\"后来我才明白，他说的不只是时间，更是做人的规矩。那块表走得再准，也终究会停；但一个人留下的信用和品格，却不会因为光阴流逝而褪色。",
                "如今我把这块表放在书桌上，每天路过都能看到它。它走走停停，我却再也没有拿去修——不是因为它坏了，而是因为有些东西，走不动了，反而更像永恒。祖父教会我的，不是如何追赶时间，而是如何善待时间里的每一个人。"
            ],
            rubrics: [
                { point_id: 1, score: 3, keywords: ["上海牌手表", "表盘泛黄", "磨损", "指针走"],
                display: "旧手表 / 表盘泛黄磨损 / 指针在走" },
                { point_id: 2, score: 4, keywords: ["祖父", "上发条", "守信守时", "从不迟到"],
                display: "祖父上发条 / 守信守时 / 从不迟到" },
                { point_id: 3, score: 3, keywords: ["农民", "丈量", "分寸", "做人的规矩"],
                display: "丈量分寸 / 做人的规矩" },
                { point_id: 4, score: 4, keywords: ["信用", "品格", "不会褪色", "永恒"],
                display: "信用品格 / 不会褪色 / 永恒" },
                { point_id: 5, score: 3, keywords: ["书桌", "走走停停", "没有修", "永恒"],
                display: "放在书桌 / 走走停停 / 没有修" },
                { point_id: 6, score: 3, keywords: ["善待时间", "善待人", "领悟"],
                display: "善待时间 / 善待每一个人" }
            ],
            standard_summary: "祖父去世后留下旧上海牌手表，表盘泛黄、表带磨损，但指针仍在走。祖父每天清晨上发条，一生守信守时，从未迟到。他虽为农民，却用这块表丈量做人的分寸，教会作者守信用。如今手表放在书桌上走走停停，作者没有拿去修，因为有些东西不动了反而更像永恒。祖父教他的不是追赶时间，而是善待时间里的每个人。"
        }, {
            id: 'SPM-05',
            short_title: '传统豆腐制作',
            category: '说明文',
            prompt: '概述传统手工豆腐从选豆到成品的完整制作工序。',
            word_limit: 125,
            passage: [
                "传统手工豆腐的工序看似简单，实则每一步都需要经验和耐心。天还没亮，做豆腐的老师傅就已经开始忙活了。",
                "首先是选豆。要挑选颗粒饱满、色泽金黄的优质黄豆，剔除霉变和破碎的豆子。将选好的黄豆用清水浸泡，夏天约需四到六小时，冬天则要十到十二小时，直到豆子完全吸水膨胀，用手一捏就能碾碎。",
                "浸泡好的黄豆加水后用石磨磨成生豆浆。磨浆讲究\"细水长流\"，水多了豆浆太稀，水少了磨不细。磨好的生豆浆倒入布袋中用力挤压，滤出豆渣，留下纯净的豆浆。接着把豆浆倒入大铁锅中煮沸，一边煮一边撇去浮沫——这一步骤叫做\"煮浆\"，火候至关重要，火太旺会烧焦，火太小则煮不透。",
                "煮好的豆浆稍稍放凉后，最关键的一步来了：点卤。老师傅用勺子缓缓倒入卤水，同时轻轻搅拌。豆浆在卤水的作用下慢慢凝结成絮状，再聚集成大块的豆花。最后把豆花舀入铺有纱布的木格中，盖上盖子，用重物压制约半小时，挤出多余水分。打开纱布，一块白嫩绵密、散发着豆香的豆腐就做好了。"
            ],
            rubrics: [
                { point_id: 1, score: 3, keywords: ["选豆", "颗粒饱满", "金黄", "剔除"],
                display: "选豆 / 颗粒饱满 / 剔除劣豆" },
                { point_id: 2, score: 3, keywords: ["浸泡", "清水", "膨胀", "捏碎"],
                display: "浸泡黄豆 / 吸水膨胀" },
                { point_id: 3, score: 3, keywords: ["石磨", "磨浆", "细水长流", "生豆浆"],
                display: "石磨磨浆 / 细水长流" },
                { point_id: 4, score: 3, keywords: ["滤渣", "布袋", "纯净", "豆浆"],
                display: "布袋滤渣 / 纯净豆浆" },
                { point_id: 5, score: 3, keywords: ["煮浆", "铁锅", "煮沸", "撇去浮沫", "火候"],
                display: "铁锅煮浆 / 撇去浮沫 / 火候" },
                { point_id: 6, score: 3, keywords: ["点卤", "卤水", "凝固", "豆花"],
                display: "点卤凝固 / 形成豆花" },
                { point_id: 7, score: 2, keywords: ["压制成形", "纱布", "木格", "压榨"],
                display: "纱布木格 / 压榨成形" }
            ],
            standard_summary: "传统豆腐制作需先选颗粒饱满的黄豆，剔除劣豆；用清水浸泡至吸水膨胀。以石磨细水长流磨出生豆浆，以布袋滤去豆渣。将纯净豆浆倒入铁锅煮沸并撇去浮沫，火候是关键。稍放凉后以卤水点卤，豆浆凝固成豆花。最后将豆花舀入纱布木格，盖重物压榨半小时，取出即成白嫩绵密的豆腐。"
        }, {
            id: 'SPM-06',
            short_title: '网络社交与真实社交',
            category: '议论文',
            prompt: '概述网络社交对真实人际关系的冲击，并提出平衡两者的建议。',
            word_limit: 130,
            passage: [
                "智能手机和社交媒体的普及，让人们的社交方式发生了根本性的变化。今天，我们可以同时与上百个\"朋友\"保持联系，却常常忽略了身边最亲近的人。这种改变究竟是进步，还是隐忧？",
                "网络社交最大的问题是\"虚拟化\"。一个表情符号可以替代微笑，一句文字可以替代拥抱。人们习惯于在朋友圈分享生活，却在真实生活中沉默寡言。美国社会学家曾指出，持续使用社交媒体的人，对孤独感的体验反而更强——因为他们看到别人精心设计的生活片段，容易产生比较和焦虑。另一方面，网络社交的\"表面化\"也值得警惕：点赞代替了关心，转发代替了陪伴，人际关系变得越来越浅。",
                "然而，真实社交正在流失的代价是巨大的。面对面的交谈中，我们能从对方的表情、语气、肢体动作中捕捉到丰富的情感信息，这些是文字和表情包永远无法替代的。心理学家发现，缺乏深度真实交流的人，更容易产生抑郁和焦虑。",
                "因此，我们必须主动找回真实社交的价值。首先，每天留出一段\"无屏幕时间\"，专注于与家人朋友的面对面交流。其次，社交媒体应当作为真实社交的延伸，而不是替代。最好的状态是：线上沟通让线下相见更有温度，而非让线下相见变得多余。"
            ],
            rubrics: [
                { point_id: 1, score: 3, keywords: ["网络社交", "虚拟化", "表面化", "孤独"],
                display: "网络社交 / 虚拟化表面化 / 孤独焦虑" },
                { point_id: 2, score: 3, keywords: ["表情符号", "替代", "微笑", "拥抱"],
                display: "表情符号替代真实情感" },
                { point_id: 3, score: 4, keywords: ["比较", "焦虑", "精心设计", "点赞"],
                display: "比较焦虑 / 点赞代替关心" },
                { point_id: 4, score: 3, keywords: ["面对面", "表情", "语气", "肢体动作"],
                display: "面对面交流 / 表情语气肢体" },
                { point_id: 5, score: 3, keywords: ["抑郁", "焦虑", "缺乏", "深度交流"],
                display: "缺乏深度交流 / 抑郁焦虑" },
                { point_id: 6, score: 4, keywords: ["无屏幕时间", "面对面", "延伸", "替代"],
                display: "无屏幕时间 / 真实交流 / 延伸而非替代" }
            ],
            standard_summary: "网络社交带来虚拟化和表面化的问题，表情符号替代真实情感，点赞代替关心，导致人们更孤独焦虑。真实社交能通过表情、语气、肢体传递丰富情感，缺乏深度交流易引发心理问题。建议每天留出无屏幕时间专注面对面交流，让社交媒体成为真实社交的延伸而非替代，使线上沟通让线下相见更有温度。"
        }];

        // ==================== 获取动态标语 ====================
        const getSlogan = () => {
            const category = currentQuestion.value.category;
            const map = {
                '记叙文': '📖 理清情节 · 概括经过',
                '说明文': '🔧 抓住工序 · 捋清顺序',
                '议论文': '💡 提炼观点 · 概括论据'
            };
            return map[category] || '📝 概述练习';
        };

        // ==================== 状态 ====================
        const currentQIndex = ref(0);
        const userInput = ref('');
        const extractedPoints = ref([]);
        const submitted = ref(false);
        const showSample = ref(false);
        const isExamMode = ref(false);
        const timerSeconds = ref(1200);
        let timerInterval = null;

        const showFloatBtn = ref(false);
        const floatBtnStyle = ref({ top: '0px', left: '0px' });
        let selectedText = '';

        const currentQuestion = computed(() => questions[currentQIndex.value]);

        // ==================== 自评清单 ====================
        const selfCheckItems = ref([
            { id: 1, label: '已覆盖所有主要情节/要点', done: false },
            { id: 2, label: '字数在宽限区内（≤+4字）', done: false },
            { id: 3, label: '语言通顺，无重大语病', done: false },
            { id: 4, label: '已在文末注明确实字数', done: false }
        ]);

        // ==================== 计算属性 ====================
        const actualWordCount = computed(() => countSPMWords(userInput.value));
        const punctuationCount = computed(() => countPunctuation(userInput.value));
        const declaredWordCount = computed(() => detectDeclaredWordCount(userInput.value));

        const graceLimit = computed(() => currentQuestion.value.word_limit + 4);

        const wordStatus = computed(() => {
            if (actualWordCount.value <= currentQuestion.value.word_limit) return 'safe';
            if (actualWordCount.value <= graceLimit.value) return 'grace';
            return 'penalty';
        });

        const excessWords = computed(() => {
            if (actualWordCount.value <= graceLimit.value) return 0;
            return actualWordCount.value - graceLimit.value;
        });

        const wordPenalty = computed(() => {
            if (excessWords.value <= 0) return 0;
            return Math.min(Math.ceil(excessWords.value / 5), 5);
        });

        const wordProgress = computed(() => {
            return Math.min((actualWordCount.value / currentQuestion.value.word_limit) * 100, 100);
        });

        const wordCountClass = computed(() => {
            if (actualWordCount.value === 0) return 'bg-slate-100 text-slate-600';
            if (wordStatus.value === 'safe') return 'bg-emerald-100 text-emerald-700';
            if (wordStatus.value === 'grace') return 'bg-amber-100 text-amber-700';
            return 'bg-rose-100 text-rose-700 font-bold';
        });

        // ==================== 提取要点验证统计 ====================
        const validCount = computed(() => {
            return extractedPoints.value.filter(p => p.verified === true).length;
        });

        const invalidCount = computed(() => {
            return extractedPoints.value.filter(p => p.verified === false).length;
        });

        const pendingCount = computed(() => {
            return extractedPoints.value.filter(p => p.verified === undefined || p.verified === null).length;
        });

        // ==================== 关键词状态 ====================
        const getAllKeywords = () => {
            const all = [];
            if (!currentQuestion.value || !currentQuestion.value.rubrics) return all;
            currentQuestion.value.rubrics.forEach(r => {
                if (r.keywords) {
                    r.keywords.forEach(kw => {
                        if (!all.includes(kw)) all.push(kw);
                    });
                }
            });
            return all;
        };

        const totalKeywords = computed(() => getAllKeywords().length);

        const keywordSlots = computed(() => {
            const all = getAllKeywords();
            const input = userInput.value;
            return all.map(kw => {
                const result = checkMatch(input, kw);
                let status = 'empty';
                if (result.status === 'full') status = 'hit';
                else if (result.status === 'partial' || result.status === 'weak') status = 'partial';
                else status = 'miss';
                return {
                    label: kw,
                    status: status,
                    raw: kw
                };
            });
        });

        const keywordHitCount = computed(() => {
            return keywordSlots.value.filter(s => s.status === 'hit' || s.status === 'partial').length;
        });

        const keywordHitRate = computed(() => {
            const total = keywordSlots.value.length;
            if (total === 0) return 0;
            const hits = keywordSlots.value.filter(s => s.status === 'hit').length;
            const partials = keywordSlots.value.filter(s => s.status === 'partial').length;
            return Math.round(((hits + partials * 0.5) / total) * 100);
        });

        // ==================== 验证函数 ====================
        const verifyPoint = (idx) => {
            const point = extractedPoints.value[idx];
            if (!point) return;

            const text = point.text;
            const allKeywords = getAllKeywords();

            let isMatch = false;
            for (const kw of allKeywords) {
                const result = checkMatch(text, kw);
                if (result.status === 'full' || result.status === 'partial' || result.status === 'weak') {
                    isMatch = true;
                    break;
                }
            }

            point.verified = isMatch;

            if (isMatch) {
                showToast(`✅ "${text}" 是有效要点！`, 'success');
            } else {
                showToast(`❌ "${text}" 不是要点，重新提取吧`, 'error');
            }
        };

        const verifyAllPoints = () => {
            if (extractedPoints.value.length === 0) {
                showToast('没有要点需要验证', 'info');
                return;
            }
            let valid = 0;
            let invalid = 0;
            extractedPoints.value.forEach((point) => {
                const text = point.text;
                const allKeywords = getAllKeywords();
                let isMatch = false;
                for (const kw of allKeywords) {
                    const result = checkMatch(text, kw);
                    if (result.status === 'full' || result.status === 'partial' || result.status === 'weak') {
                        isMatch = true;
                        break;
                    }
                }
                point.verified = isMatch;
                if (isMatch) valid++;
                else invalid++;
            });
            showToast(`✅ 验证完成：${valid} 个有效，${invalid} 个非要点`, 'success');
        };

        const removePoint = (idx) => {
            const text = extractedPoints.value[idx].text;
            extractedPoints.value.splice(idx, 1);
            showToast(`已移除 "${text}"`, 'info');
        };

        const clearAllExtracted = async () => {
            if (extractedPoints.value.length === 0) {
                showToast('没有要点需要清空', 'info');
                return;
            }

            const confirmed = await new Promise((resolve) => {
                confirm.show = true;
                confirm.title = '🗑️ 清空全部要点';
                confirm.message =
                    `确定要清空全部 ${extractedPoints.value.length} 个提取的要点吗？此操作不可撤销。`;
                confirm.icon = '⚠️';
                confirm.confirmText = '是的，清空全部';
                confirm.cancelText = '取消';
                confirm.onConfirm = () => {
                    confirm.show = false;
                    resolve(true);
                };
                const checkCancel = setInterval(() => {
                    if (!confirm.show) {
                        clearInterval(checkCancel);
                        resolve(false);
                    }
                }, 100);
                confirm.onCancel = () => {
                    confirm.show = false;
                    clearInterval(checkCancel);
                    resolve(false);
                };
            });

            if (confirmed) {
                extractedPoints.value = [];
                showToast('✅ 已清空所有提取的要点', 'success');
            }
        };

        // ==================== 脚手架功能 ====================
        const getParagraphPoints = () => {
            const passage = currentQuestion.value.passage;
            const q = currentQuestion.value;
            const points = [];
            passage.forEach((p, idx) => {
                let summary = '';
                if (q.category === '记叙文') {
                    if (idx === 0) summary = '引入：物品/场景';
                    else if (idx === 1) summary = '回忆：人物与事件';
                    else if (idx === 2) summary = '感悟：道理与体会';
                    else if (idx === 3) summary = '升华：现在与永恒';
                } else if (q.category === '说明文') {
                    if (idx === 0) summary = '总说：工序概述';
                    else if (idx === 1) summary = '第一步：原料准备';
                    else if (idx === 2) summary = '第二步：核心工艺';
                    else if (idx === 3) summary = '第三步：收尾完成';
                } else if (q.category === '议论文') {
                    if (idx === 0) summary = '提出问题：现象+疑问';
                    else if (idx === 1) summary = '分析问题：原因与影响';
                    else if (idx === 2) summary = '论证：正反对比';
                    else if (idx === 3) summary = '提出对策：解决方案';
                } else {
                    summary = `第${idx+1}段内容`;
                }
                points.push(summary);
            });
            return points;
        };

        const getStructureTemplate = () => {
            const q = currentQuestion.value;
            const templates = {
                '记叙文': {
                    '送伞': [
                        '母亲送伞，作者嫌丢脸',
                        '拒绝拿伞，冲入雨中',
                        '大雨被困，懊悔无助',
                        '母亲追来遮雨，作者感动'
                    ],
                    '爷爷的旧手表': [
                        '祖父留下旧手表',
                        '回忆祖父守信守时',
                        '领悟做人规矩比时间永恒',
                        '善待时间里的每一个人'
                    ]
                },
                '说明文': {
                    '编藤椅': [
                        '选材削皮去刺',
                        '浸泡软化纤维',
                        '熏蒸弯折固定',
                        '十字交错编织',
                        '烘烤涂漆风干'
                    ],
                    '传统豆腐制作': [
                        '选豆剔除劣豆',
                        '浸泡黄豆至膨胀',
                        '石磨磨浆、布袋滤渣',
                        '铁锅煮浆、撇去浮沫',
                        '点卤凝固成豆花',
                        '纱布木格压榨成形'
                    ]
                },
                '议论文': {
                    '阅读障碍': [
                        '问题：深度阅读能力丧失',
                        '原因：碎片化、应试化、环境干扰',
                        '对策：无电子设备、批注阅读、弱化功利'
                    ],
                    '网络社交与真实社交': [
                        '问题：网络社交虚拟化表面化',
                        '影响：点赞代替关心、真实情感流失',
                        '论证：面对面交流不可替代',
                        '对策：无屏幕时间、线上延伸线下'
                    ]
                }
            };

            const title = q.short_title;
            const category = q.category;
            const categoryTemplates = templates[category] || {};
            return categoryTemplates[title] || ['总说', '分述', '总结'];
        };

        const getSampleStructure = () => {
            const text = currentQuestion.value.standard_summary;
            if (!text) return [];
            const parts = text.split(/[，。；、]/).filter(p => p.trim().length > 0);
            return parts.slice(0, 8).map(p => p.trim() + '。');
        };

        // ==================== 评估 ====================
        const evaluation = reactive({ contentScore: 0, penalty: 0, finalScore: 0, details: [] });
        const history = ref([]);

        const evaluateAnswer = () => {
            if (!userInput.value.trim()) { alert('请先输入你的答案！'); return; }

            let totalScore = 0;
            const details = [];
            const input = userInput.value;

            currentQuestion.value.rubrics.forEach(rubric => {
                let hitScore = 0;
                let matchedKeywords = [];
                let missedKeywords = [];
                let partialCount = 0;

                rubric.keywords.forEach(kw => {
                    const result = checkMatch(input, kw);
                    if (result.status === 'full') {
                        hitScore += 1;
                        matchedKeywords.push(kw);
                    } else if (result.status === 'partial') {
                        hitScore += 0.3;
                        matchedKeywords.push(kw + '⚡');
                        partialCount++;
                    } else if (result.status === 'weak') {
                        hitScore += 0.1;
                        matchedKeywords.push(kw + '·');
                        partialCount++;
                    } else {
                        missedKeywords.push(kw);
                    }
                });

                const requiredHits = Math.max(1, Math.ceil(rubric.keywords.length * 0.7));
                const isHit = hitScore >= requiredHits;
                const earnedScore = isHit ? rubric.score : 0;
                totalScore += earnedScore;

                details.push({
                    point_id: rubric.point_id,
                    keyword_display: rubric.display,
                    score: rubric.score,
                    hit: isHit,
                    matched_keywords: matchedKeywords,
                    missed_keywords: missedKeywords,
                    partial_count: partialCount,
                    hit_ratio: Math.round((hitScore / rubric.keywords.length) * 100)
                });
            });

            let penalty = wordPenalty.value;
            if (declaredWordCount.value > 0 && declaredWordCount.value !== actualWordCount.value) {
                penalty += 2;
            }

            evaluation.contentScore = Math.round(totalScore);
            evaluation.penalty = Math.min(penalty, 5);
            evaluation.finalScore = Math.max(0, Math.round(totalScore - penalty));
            evaluation.details = details;

            history.value.push({
                score: evaluation.finalScore,
                wordCount: actualWordCount.value,
                date: new Date().toLocaleString()
            });

            try {
                localStorage.setItem(`history_${currentQuestion.value.id}`, JSON.stringify(history.value));
            } catch (e) {}

            submitted.value = true;
            try {
                localStorage.removeItem(`draft_${currentQuestion.value.id}`);
            } catch (e) {}
            showToast('✅ 评估完成！', 'success');
        };

        // ==================== 🛠️ 修复：提取要点（使用正确版本逻辑） ====================
        const handleTextSelection = (event) => {
            if (isExamMode.value) return;

            const selection = window.getSelection();
            if (!selection || selection.isCollapsed) {
                showFloatBtn.value = false;
                return;
            }

            const text = selection.toString().trim();
            if (text.length > 1 && text.length < 50) {
                selectedText = text;
                showFloatBtn.value = true;

                try {
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    const container = event.currentTarget;
                    if (container) {
                        const containerRect = container.getBoundingClientRect();
                        floatBtnStyle.value = {
                            top: (rect.top - containerRect.top - 30) + 'px',
                            left: (rect.left - containerRect.left + rect.width / 2 - 40) + 'px'
                        };
                    }
                } catch (e) {
                    floatBtnStyle.value = {
                        top: '30px',
                        left: '50%',
                        transform: 'translateX(-50%)'
                    };
                }
            } else {
                showFloatBtn.value = false;
            }
        };

        const extractSelection = () => {
            if (selectedText && selectedText.trim().length > 0) {
                const exists = extractedPoints.value.some(p => p.text === selectedText);
                if (!exists) {
                    extractedPoints.value.push({
                        text: selectedText,
                        verified: undefined
                    });
                    showToast(`📌 已提取："${selectedText}"`, 'success');
                } else {
                    showToast('⚠️ 已存在相同要点', 'info');
                }
            } else {
                showToast('⚠️ 请先选择文字', 'info');
            }
            showFloatBtn.value = false;
            window.getSelection().removeAllRanges();
        };

        // ==================== 插入要点到书写区 ====================
        const insertPoint = (text) => {
            const textarea = document.querySelector('textarea');
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const current = userInput.value;
                if (start === current.length) {
                    userInput.value = current + text;
                } else {
                    userInput.value = current.substring(0, start) + text + current.substring(end);
                }
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = start + text.length;
                showToast(`📝 已插入 "${text}"`, 'info');
            }
        };

        // ==================== 其他函数 ====================
        const getTagClass = (category) => {
            const map = {
                '记叙文': 'tag-narrative',
                '说明文': 'tag-expository',
                '议论文': 'tag-argumentative'
            };
            return map[category] || 'bg-slate-100 text-slate-600';
        };

        const highlightParagraph = (paragraph) => {
            let html = paragraph;
            const sortedPoints = [...extractedPoints.value].sort((a, b) => b.text.length - a.text.length);
            sortedPoints.forEach(point => {
                const text = point.text;
                if (text && html.includes(text)) {
                    html = html.replaceAll(text, `<mark class="highlight-text">${text}</mark>`);
                }
            });
            return html;
        };

        const getSampleText = () => currentQuestion.value.standard_summary || '';
        const getSampleWordCount = () => countSPMWords(currentQuestion.value.standard_summary || '');

        const selectQuestion = (index) => {
            currentQIndex.value = index;
            userInput.value = '';
            extractedPoints.value = [];
            submitted.value = false;
            showSample.value = false;
            showFloatBtn.value = false;
            selfCheckItems.value.forEach(item => item.done = false);

            try {
                const saved = localStorage.getItem(`history_${currentQuestion.value.id}`);
                if (saved) history.value = JSON.parse(saved);
            } catch (e) {}

            try {
                const draft = localStorage.getItem(`draft_${currentQuestion.value.id}`);
                if (draft) userInput.value = draft;
            } catch (e) {}

            if (isExamMode.value) {
                clearInterval(timerInterval);
                timerSeconds.value = 1200;
                timerInterval = setInterval(() => {
                    if (timerSeconds.value > 0) timerSeconds.value--;
                    else {
                        clearInterval(timerInterval);
                        alert('考场时间到！已自动提交。');
                        evaluateAnswer();
                    }
                }, 1000);
            }
            showToast(`📖 切换到：${currentQuestion.value.short_title}`, 'info');
        };

        const autoSave = () => {
            if (!submitted.value) {
                try {
                    localStorage.setItem(`draft_${currentQuestion.value.id}`, userInput.value);
                } catch (e) {}
            }
        };

        const toggleMode = () => {
            isExamMode.value = !isExamMode.value;
            if (isExamMode.value) {
                timerSeconds.value = 1200;
                if (timerInterval) clearInterval(timerInterval);
                timerInterval = setInterval(() => {
                    if (timerSeconds.value > 0) timerSeconds.value--;
                    else {
                        clearInterval(timerInterval);
                        alert('考场时间到！已自动提交。');
                        evaluateAnswer();
                    }
                }, 1000);
                showToast('🔒 已进入考场模式（所有辅助已隐藏）', 'info');
            } else {
                if (timerInterval) clearInterval(timerInterval);
                showToast('💡 已进入学习模式', 'info');
            }
        };

        const formattedTime = computed(() => {
            const m = String(Math.floor(timerSeconds.value / 60)).padStart(2, '0');
            const s = String(timerSeconds.value % 60).padStart(2, '0');
            return `${m}:${s}`;
        });

        const resetAnswer = () => {
            submitted.value = false;
            showSample.value = false;
            userInput.value = '';
            selfCheckItems.value.forEach(item => item.done = false);
            try {
                localStorage.removeItem(`draft_${currentQuestion.value.id}`);
            } catch (e) {}
            showToast('🔄 已重置，可重新作答', 'info');
        };

        const clearHistory = () => {
            if (history.value.length === 0) {
                showToast('没有历史记录', 'info');
                return;
            }
            if (confirm('确定要清除此题的练习历史吗？')) {
                history.value = [];
                try {
                    localStorage.removeItem(`history_${currentQuestion.value.id}`);
                } catch (e) {}
                showToast('🗑️ 已清除历史记录', 'info');
            }
        };

        // ==================== 初始化 ====================
        const init = () => {
            try {
                const saved = localStorage.getItem(`history_${currentQuestion.value.id}`);
                if (saved) history.value = JSON.parse(saved);
                const draft = localStorage.getItem(`draft_${currentQuestion.value.id}`);
                if (draft) userInput.value = draft;
            } catch (e) {}
            // 确保已提取要点为空数组
            extractedPoints.value = [];
        };
        init();

        onBeforeUnmount(() => {
            if (timerInterval) clearInterval(timerInterval);
        });

        return {
            questions,
            currentQIndex,
            currentQuestion,
            userInput,
            extractedPoints,
            submitted,
            showSample,
            isExamMode,
            formattedTime,
            actualWordCount,
            punctuationCount,
            declaredWordCount,
            graceLimit,
            wordStatus,
            excessWords,
            wordPenalty,
            wordProgress,
            wordCountClass,
            evaluation,
            history,
            selfCheckItems,
            showFloatBtn,
            floatBtnStyle,
            toast,
            confirm,
            keywordSlots,
            totalKeywords,
            keywordHitCount,
            keywordHitRate,
            validCount,
            invalidCount,
            pendingCount,
            getSlogan,
            getStructureTemplate,
            verifyPoint,
            verifyAllPoints,
            removePoint,
            clearAllExtracted,
            getTagClass,
            highlightParagraph,
            handleTextSelection,
            extractSelection,
            insertPoint,
            selectQuestion,
            autoSave,
            toggleMode,
            evaluateAnswer,
            resetAnswer,
            clearHistory,
            getParagraphPoints,
            getAllKeywords,
            getSampleText,
            getSampleWordCount,
            getSampleStructure
        };
    }
}).mount('#app');
