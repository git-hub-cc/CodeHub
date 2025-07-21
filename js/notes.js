
// js/notes.js
// 负责"笔记"模式下的所有UI交互和数据逻辑

const notes = ((db, ui) => {

    const escapeHtmlInCodeBlocks = (text) => {
        if (!text) return text;
        const codeBlockRegex = /(```[\s\S]*?```)/g;
        return text.replace(codeBlockRegex, (codeBlock) => {
            return codeBlock.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        });
    };

    // --- 模块状态 ---
    const elements = ui.elements;
    let currentSetId = null;    // 当前选中的笔记集ID
    let selectedNoteId = null;  // 当前选中的笔记ID
    let notesFuse = null;       // 当前笔记集的Fuse.js搜索实例
    let currentNotesInSet = []; // 当前笔记集中的所有笔记
    let allSets = [];           // 所有的笔记集

    // --- 初始化 ---
    function init() {
        // 为笔记模式下的各个按钮和表单绑定事件监听器
        elements.addSetBtn.addEventListener('click', handleAddSet);
        elements.addNoteForm.addEventListener('submit', handleAddNote);
        elements.notesList.addEventListener('click', handleNoteListClick);
        elements.noteDetailsView.addEventListener('click', handleNoteDetailViewClick);
        elements.noteSearchInput.addEventListener('input', (e) => renderNotesList(e.target.value));
    }

    // --- 核心激活与渲染 ---
    // 当切换到笔记模式时被调用
    async function activate() {
        // 如果是首次进入，确保currentSetId有初始值
        if (!currentSetId) {
            let sets = await db.getNoteSets();
            // 如果数据库为空，强制重新初始化以创建默认集
            if (sets.length === 0) {
                await db.initDB();
                sets = await db.getNoteSets();
            }
            currentSetId = sets.length > 0 ? sets[0].id : 1; // 默认为第一个或ID为1的集
        }
        await renderAll(); // 渲染整个笔记视图
    }

    // 统一渲染函数，负责更新所有UI组件
    async function renderAll() {
        await renderSetDropdown();
        await renderNotesList(elements.noteSearchInput.value);
        if (selectedNoteId) {
            await renderNoteDetail(selectedNoteId);
        } else {
            ui.clearDetailsView(elements.noteDetailsView, '选择一个笔记以查看详情');
        }
    }

    // --- 渲染函数 ---
    // 渲染笔记集下拉菜单
    async function renderSetDropdown() {
        const sets = await db.getNoteSets();
        const allNotes = await db.getAllNotes(); // 获取所有笔记以计算每个集的数量
        allSets = sets.map(set => ({
            ...set,
            count: allNotes.filter(note => note.setId === set.id).length
        })).sort((a, b) => a.id - b.id); // 按ID排序

        const activeSet = allSets.find(s => s.id === currentSetId) || allSets[0];
        if (activeSet) {
            elements.noteSetSelectedText.textContent = activeSet.name;
            elements.addNoteFormTitle.textContent = `向 "${activeSet.name}" 添加笔记`;
        }

        elements.noteSetOptions.innerHTML = '';
        const fragment = document.createDocumentFragment();
        allSets.forEach(set => {
            const option = document.createElement('div');
            option.className = 'note-set-item group flex items-center justify-between p-2.5 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all duration-200 border border-transparent';
            option.dataset.setId = set.id;

            // 动态生成每个选项的内容，默认笔记集(id=1)不能删除
            const content = `
            <div class="flex items-center gap-3">
                <span class="set-name font-medium text-slate-700 dark:text-slate-300">${set.name}</span>
            </div>
            <div class="flex items-center gap-1">
                <span class="note-count text-xs font-mono bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">${set.count}</span>
                ${set.id !== 1 ? `<button data-set-id-delete="${set.id}" data-set-name-delete="${set.name}" class="delete-set-btn p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <img src="img/icons/trash.svg" class="h-4 w-4 pointer-events-none" alt="删除笔记集">
                                </button>` : ''}
            </div>`;
            option.innerHTML = content;

            // 使用事件委托处理点击事件
            option.addEventListener('click', (e) => {
                const deleteBtn = e.target.closest('.delete-set-btn');
                if (deleteBtn) { // 点击了删除按钮
                    const setId = deleteBtn.dataset.setIdDelete;
                    const setName = deleteBtn.dataset.setNameDelete;
                    handleDeleteSet(parseInt(setId), setName);
                } else { // 点击了选项本身
                    handleSetClick(set.id);
                    ui.closeAllDropdowns(); // 选择后关闭下拉菜单
                }
            });

            if (set.id === currentSetId) {
                option.classList.add('is-active', 'bg-slate-100', 'dark:bg-slate-700/60');
            }
            fragment.appendChild(option);
        });
        elements.noteSetOptions.appendChild(fragment);
    }

    // 渲染笔记列表
    async function renderNotesList(searchQuery = '') {
        currentNotesInSet = await db.getNotes(currentSetId);

        // 初始化或更新Fuse.js实例
        if (!notesFuse) {
            notesFuse = new Fuse([], { keys: ['question', 'answer'], threshold: 0.4, includeScore: true });
        }
        notesFuse.setCollection(currentNotesInSet);

        const results = searchQuery.trim() === ''
            ? currentNotesInSet
            : notesFuse.search(searchQuery).map(r => r.item);

        elements.notesList.innerHTML = '';
        if (results.length === 0) {
            const message = searchQuery ? "在当前笔记集中未找到匹配项。" : "这个笔记集还没有笔记。";
            ui.showState(elements.notesList, message);
            return;
        }

        const fragment = document.createDocumentFragment();
        results.forEach(note => {
            const itemClone = ui.templates.noteItem.content.cloneNode(true);
            const item = itemClone.querySelector('.result-item');
            item.dataset.noteId = note.id;
            item.querySelector('.note-question').textContent = note.question;

            if (note.id === selectedNoteId) {
                item.classList.add('active'); // 高亮当前选中的笔记
            }
            fragment.appendChild(itemClone);
        });
        elements.notesList.appendChild(fragment);
    }

    // 渲染笔记详情
    async function renderNoteDetail(noteId) {
        const note = await db.getNoteById(noteId);
        if (!note) {
            selectedNoteId = null;
            ui.clearDetailsView(elements.noteDetailsView, '无法找到该笔记，可能已被删除。');
            return;
        }

        const detailClone = ui.templates.noteDetail.content.cloneNode(true);
        const noteCard = detailClone.querySelector('.note-card');

        noteCard.dataset.id = note.id;
        noteCard.querySelector('.question-text').textContent = note.question;
        noteCard.querySelector('.question-input').value = note.question;

        const answerContent = noteCard.querySelector('.answer-content');
        if (note.answer) {
            answerContent.innerHTML = marked.parse(note.answer); // 使用全局marked渲染器
            answerContent.classList.remove('hidden');
            noteCard.querySelector('.answer-placeholder').classList.add('hidden');
            noteCard.querySelector('.edit-answer-btn').textContent = '编辑答案';
        } else {
            answerContent.classList.add('hidden');
            noteCard.querySelector('.answer-placeholder').classList.remove('hidden');
            noteCard.querySelector('.edit-answer-btn').textContent = '添加答案';
        }
        noteCard.querySelector('.answer-textarea').value = note.answer || '';

        elements.noteDetailsView.innerHTML = '';
        elements.noteDetailsView.appendChild(detailClone);


        // 新增：在内容插入后，调用 Prism 来高亮所有代码块
        if (window.Prism) {
            Prism.highlightAllUnder(elements.noteDetailsView);
        }
    }

    // --- 事件处理器 ---
    // 处理添加笔记集
    async function handleAddSet(event) {
        event.preventDefault();
        const name = await ui.showInputModal('新建笔记集', '请输入新笔记集的名称：', '例如：我的项目笔记');
        if (!name || name.trim() === '') return;

        try {
            const newId = await db.addNoteSet(name.trim());
            currentSetId = newId; // 切换到新创建的笔记集
            selectedNoteId = null;
            await renderAll();
        } catch (error) {
            console.error("添加笔记集失败:", error);
            await ui.showAlertModal('操作失败', '无法添加笔记集，可能名称已存在。');
        }
    }

    // 处理添加新笔记
    async function handleAddNote(event) {
        event.preventDefault();
        const question = elements.noteQuestion.value.trim();
        if (!question || !currentSetId) return;
        try {
            const newNoteId = await db.addNote(question.replace(/</g, "&lt;").replace(/>/g, "&gt;"), currentSetId);
            elements.noteQuestion.value = ''; // 清空输入框
            selectedNoteId = newNoteId; // 选中新创建的笔记
            await renderAll();
        } catch (error) {
            console.error("添加笔记失败:", error);
        }
    }

    // 处理笔记列表项的点击事件
    function handleNoteListClick(event) {
        const targetItem = event.target.closest('.result-item');
        if (targetItem) {
            const noteId = parseInt(targetItem.dataset.noteId, 10);
            if(selectedNoteId !== noteId) {
                selectedNoteId = noteId;
                renderNotesList(elements.noteSearchInput.value); // 重绘列表以更新高亮
                renderNoteDetail(noteId); // 显示详情
            }
        }
    }

    // 处理笔记集下拉选项的点击
    async function handleSetClick(setId) {
        if (currentSetId === setId) return;
        currentSetId = setId;
        selectedNoteId = null; // 切换笔记集后清空选中笔记
        elements.noteSearchInput.value = ''; // 清空搜索框
        await renderAll();
    }

    // 处理删除笔记集
    async function handleDeleteSet(setId, setName) {
        const confirmed = await ui.showConfirmationModal(
            '删除笔记集',
            `你确定要删除 "${setName}" 吗？其中包含的所有笔记也将被永久删除。此操作无法撤销。`,
            '确认删除'
        );
        if (confirmed) {
            await db.deleteNoteSet(setId);
            currentSetId = 1; // 切换回默认笔记集
            selectedNoteId = null;
            await renderAll();
        }
    }

    // 处理笔记详情视图中的所有点击事件（编辑、保存、删除等）
    async function handleNoteDetailViewClick(event) {
        const target = event.target;
        const noteCard = target.closest('.note-card');
        if (!noteCard) return;
        const noteId = parseInt(noteCard.dataset.id, 10);

        // **代码复制**：调用ui模块的通用处理函数
        if (target.closest('.copy-btn')) {
            ui.handleCopyButtonClick(event);
            return;
        }

        // **问题编辑/保存/取消**
        if (target.closest('.edit-question-btn')) {
            noteCard.querySelector('.question-display').classList.add('hidden');
            noteCard.querySelector('.question-edit-form').classList.remove('hidden');
            noteCard.querySelector('.question-input').focus();
        } else if (target.closest('.cancel-edit-question-btn')) {
            noteCard.querySelector('.question-display').classList.remove('hidden');
            noteCard.querySelector('.question-edit-form').classList.add('hidden');
        } else if (target.closest('.save-question-btn')) {
            const newQuestionText = noteCard.querySelector('.question-input').value.trim();
            if (newQuestionText) {
                const note = await db.getNoteById(noteId);
                note.question = newQuestionText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                await db.updateNote(note);
                await renderAll(); // 重绘所有，确保列表和详情都更新
            }
        }

        // **答案编辑/保存**
        else if (target.closest('.edit-answer-btn')) {
            noteCard.querySelector('.answer-display').classList.toggle('hidden');
            noteCard.querySelector('.answer-form').classList.toggle('hidden');
            if (!noteCard.querySelector('.answer-form').classList.contains('hidden')) {
                noteCard.querySelector('textarea').focus();
            }
        } else if (target.closest('.save-answer-btn')) {
            const note = await db.getNoteById(noteId);
            const rawAnswer = noteCard.querySelector('.answer-textarea').value;
            note.answer = escapeHtmlInCodeBlocks(rawAnswer);
            await db.updateNote(note);
            await renderNoteDetail(noteId); // 只重绘详情
        }

        // **删除笔记**
        else if (target.closest('.delete-note-btn')) {
            const confirmed = await ui.showConfirmationModal('删除笔记','你确定要删除这条笔记吗？此操作无法撤销。','确认删除');
            if (confirmed) {
                await db.deleteNote(noteId);
                selectedNoteId = null;
                await renderAll();
            }
        }
    }

    // --- 导出模块 ---
    return { init, activate };

})(db, ui);