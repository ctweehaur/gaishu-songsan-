// ============================================
// script.js - Vue 逻辑（修复版）
// ============================================

const { createApp, ref, computed, reactive, onBeforeUnmount, nextTick } = Vue;

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

        // ==================== 动态标语 ====================
        const getSlogan = () => {
            return getSloganByCategory(currentQuestion.value.category);
        };

        // ==================== 结构模板 ====================
        const getStructureTemplate = () => {
            return getStructureTemplateByQuestion(
                currentQuestion.value.short_title,
                currentQuestion.value.category
            );
        };

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

        // ==================== 🛠️ 修复：浮动提取按钮 ====================
        const handleTextSelection = (event) => {
            if (isExamMode.value) return;

            // 使用 nextTick 确保选择完成
            nextTick(() => {
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
                        const container = document.querySelector('.scroll-area');
                        if (container) {
                            const containerRect = container.getBoundingClientRect();
                            floatBtnStyle.value = {
                                top: (rect.top - containerRect.top - 30) + 'px',
                                left: (rect.left - containerRect.left + rect.width / 2 - 40) + 'px'
                            };
                        }
                    } catch (e) {
                        // 如果获取位置失败，使用默认位置
                        floatBtnStyle.value = {
                            top: '30px',
                            left: '50%',
                            transform: 'translateX(-50%)'
                        };
                    }
                } else {
                    showFloatBtn.value = false;
                }
            });
        };

        const extractSelection = () => {
            if (selectedText) {
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

        const selfCheckItems = ref([
            { id: 1, label: '已覆盖所有主要情节/要点', done: false },
            { id: 2, label: '字数在宽限区内（≤+4字）', done: false },
            { id: 3, label: '语言通顺，无重大语病', done: false },
            { id: 4, label: '已在文末注明确实字数', done: false }
        ]);

        // ==================== 初始化 ====================
        const init = () => {
            try {
                const saved = localStorage.getItem(`history_${currentQuestion.value.id}`);
                if (saved) history.value = JSON.parse(saved);
                const draft = localStorage.getItem(`draft_${currentQuestion.value.id}`);
                if (draft) userInput.value = draft;
            } catch (e) {}
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
