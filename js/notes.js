// js/notes.js

// The marked.Renderer setup is now handled globally in ui.js.
// This file will now rely on that global configuration for Markdown parsing.

const notes = ((db, ui) => {

    const elements = ui.elements;
    let currentSetId = null;
    let selectedNoteId = null;
    let notesFuse = null;
    let currentNotesInSet = [];
    let allSets = [];

    function init() {
        elements.addSetBtn.addEventListener('click', handleAddSet);
        elements.addNoteForm.addEventListener('submit', handleAddNote);
        elements.notesList.addEventListener('click', handleNoteListClick);
        elements.noteDetailsView.addEventListener('click', handleNoteDetailViewClick);
        elements.noteSearchInput.addEventListener('input', (e) => renderNotesList(e.target.value));
        // Removed the duplicate event listener for elements.noteSetTrigger here.
        // It's now handled centrally in app.js using ui.toggleDropdown.
    }

    async function activate() {
        if (!currentSetId) {
            let sets = await db.getNoteSets();
            if (sets.length === 0) {
                await db.initDB();
                sets = await db.getNoteSets();
            }
            currentSetId = sets.length > 0 ? sets[0].id : 1;
        }
        await renderAll();
    }

    async function renderAll() {
        await renderSetDropdown();
        await renderNotesList(elements.noteSearchInput.value);
        if (selectedNoteId) {
            await renderNoteDetail(selectedNoteId);
        } else {
            ui.clearDetailsView(elements.noteDetailsView, '选择一个笔记以查看详情');
        }
    }

    async function renderSetDropdown() {
        const sets = await db.getNoteSets();
        const allNotes = await db.getAllNotes();
        allSets = sets.map(set => ({
            ...set,
            count: allNotes.filter(note => note.setId === set.id).length
        })).sort((a, b) => a.id - b.id);

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

            const content = `
                <div class="flex items-center gap-3">
                    <span class="set-name font-medium text-slate-700 dark:text-slate-300">${set.name}</span>
                </div>
                <div class="flex items-center gap-1">
                    <span class="note-count text-xs font-mono bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">${set.count}</span>
                    ${set.id !== 1 ? `<button data-set-id-delete="${set.id}" data-set-name-delete="${set.name}" class="delete-set-btn p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <img src="img/icons/trash.svg" class="h-4 w-4 pointer-events-none" alt="Delete Set">
                    </button>` : ''}
                </div>`;
            option.innerHTML = content;

            option.addEventListener('click', (e) => {
                if (e.target.closest('.delete-set-btn')) {
                    const setId = e.target.closest('.delete-set-btn').dataset.setIdDelete;
                    const setName = e.target.closest('.delete-set-btn').dataset.setNameDelete;
                    handleDeleteSet(parseInt(setId), setName);
                } else {
                    handleSetClick(set.id);
                    // Manually close the dropdown after selection for better UX
                    elements.noteSetOptions.classList.add('hidden');
                    const icon = elements.noteSetTrigger.querySelector('img, svg');
                    if (icon) icon.classList.remove('rotate-180');
                }
            });

            if (set.id === currentSetId) {
                option.classList.add('is-active', 'bg-slate-100', 'dark:bg-slate-700/60');
            }
            fragment.appendChild(option);
        });
        elements.noteSetOptions.appendChild(fragment);
    }

    async function renderNotesList(searchQuery = '') {
        currentNotesInSet = await db.getNotes(currentSetId);

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
                item.classList.add('active');
            }
            fragment.appendChild(itemClone);
        });
        elements.notesList.appendChild(fragment);
    }

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
        const answerPlaceholder = noteCard.querySelector('.answer-placeholder');
        const editAnswerBtn = noteCard.querySelector('.edit-answer-btn');

        if (note.answer) {
            answerContent.innerHTML = marked.parse(note.answer); // Use global renderer
            answerPlaceholder.classList.add('hidden');
            editAnswerBtn.textContent = '编辑答案';
        } else {
            answerContent.innerHTML = '';
            answerPlaceholder.textContent = '尚未添加答案。';
            answerPlaceholder.classList.remove('hidden');
            editAnswerBtn.textContent = '添加答案';
        }
        noteCard.querySelector('.answer-textarea').value = note.answer || '';

        elements.noteDetailsView.innerHTML = '';
        elements.noteDetailsView.appendChild(detailClone);
    }

    async function handleAddSet(event) {
        event.preventDefault();
        const name = await ui.showInputModal('新建笔记集', '请输入新笔记集的名称：', '例如：我的项目笔记');
        if (!name || name.trim() === '') return;

        try {
            const newId = await db.addNoteSet(name.trim());
            currentSetId = newId;
            selectedNoteId = null;
            await renderAll();
        } catch (error) {
            console.error("Failed to add note set:", error);
            await ui.showAlertModal('操作失败', '无法添加笔记集，可能名称已存在。');
        }
    }

    function handleNoteListClick(event) {
        const targetItem = event.target.closest('.result-item');
        if (targetItem) {
            const noteId = parseInt(targetItem.dataset.noteId, 10);
            if(selectedNoteId !== noteId) {
                selectedNoteId = noteId;
                renderNotesList(elements.noteSearchInput.value); // Re-render list to show active state
                renderNoteDetail(noteId);
            }
        }
    }

    async function handleSetClick(setId) {
        if (currentSetId === setId) return;
        currentSetId = setId;
        selectedNoteId = null;
        elements.noteSearchInput.value = '';
        await renderAll();
    }

    async function handleDeleteSet(setId, setName) {
        const confirmed = await ui.showConfirmationModal(
            '删除笔记集',
            `你确定要删除 "${setName}" 吗？其中包含的所有笔记也将被永久删除。此操作无法撤销。`,
            '确认删除'
        );
        if (confirmed) {
            await db.deleteNoteSet(setId);
            currentSetId = 1;
            selectedNoteId = null;
            await renderAll();
        }
    }

    async function handleAddNote(event) {
        event.preventDefault();
        const question = elements.noteQuestion.value.trim();
        if (!question || !currentSetId) return;
        try {
            const newNoteId = await db.addNote(question, currentSetId);
            elements.noteQuestion.value = '';
            selectedNoteId = newNoteId;
            await renderAll();
        } catch (error) {
            console.error("Failed to add note:", error);
        }
    }

    async function handleNoteDetailViewClick(event) {
        const target = event.target;
        const noteCard = target.closest('.note-card');
        if (!noteCard) return;
        const noteId = parseInt(noteCard.dataset.id, 10);

        const copyBtn = target.closest('.copy-btn');
        if (copyBtn) {
            const codeToCopy = copyBtn.closest('.code-block').querySelector('code').textContent;
            try {
                await navigator.clipboard.writeText(codeToCopy);
                const img = copyBtn.querySelector('img');
                const originalSrc = img.src;
                img.src = 'img/icons/check.svg';
                setTimeout(() => { img.src = originalSrc; }, 2000);
            } catch (err) {
                console.error('Failed to copy text from note: ', err);
            }
            return;
        }

        if (target.closest('.edit-question-btn')) {
            noteCard.querySelector('.question-display').classList.add('hidden');
            noteCard.querySelector('.question-edit-form').classList.remove('hidden');
            noteCard.querySelector('.question-input').focus();
        }

        if (target.closest('.cancel-edit-question-btn')) {
            noteCard.querySelector('.question-display').classList.remove('hidden');
            noteCard.querySelector('.question-edit-form').classList.add('hidden');
        }

        if (target.closest('.save-question-btn')) {
            const questionInput = noteCard.querySelector('.question-input');
            const newQuestionText = questionInput.value.trim();
            if (newQuestionText) {
                const note = await db.getNoteById(noteId);
                note.question = newQuestionText;
                await db.updateNote(note);
                await renderAll();
            }
        }

        if (target.closest('.delete-note-btn')) {
            const confirmed = await ui.showConfirmationModal('删除笔记','你确定要删除这条笔记吗？此操作无法撤销。','确认删除');
            if (confirmed) {
                await db.deleteNote(noteId);
                selectedNoteId = null;
                await renderAll();
            }
        }

        if (target.closest('.save-answer-btn')) {
            const answerTextarea = noteCard.querySelector('.answer-textarea');
            const note = await db.getNoteById(noteId);
            note.answer = answerTextarea.value;
            await db.updateNote(note);
            await renderNoteDetail(noteId);
        }

        if (target.closest('.edit-answer-btn')) {
            const answerDisplay = noteCard.querySelector('.answer-display');
            const answerForm = noteCard.querySelector('.answer-form');
            answerDisplay.classList.toggle('hidden');
            answerForm.classList.toggle('hidden');
            if (!answerForm.classList.contains('hidden')) {
                answerForm.querySelector('textarea').focus();
            }
        }
    }

    return { init, activate };

})(db, ui);