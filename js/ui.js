// js/ui.js
// 封装所有与DOM操作、UI更新和模板相关的函数

const ui = (() => {
    // --- 全局配置 (Markdown渲染器) ---
    // 设置一个全局的marked渲染器，用于为代码块添加复制按钮和样式
    const globalCodeBlockRenderer = new marked.Renderer();
    globalCodeBlockRenderer.code = (code, infostring) => {
        const lang = (infostring || '').match(/\S*/)[0];
        const copyButtonHTML = `<button class="copy-btn absolute top-2 right-2 p-1.5 bg-slate-200/50 dark:bg-slate-700/80 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><img src="img/icons/copy.svg" class="h-5 w-5 pointer-events-none" alt="复制"></button>`;
        return `<div class="code-block relative bg-slate-100 dark:bg-slate-900 rounded-lg group my-4">${copyButtonHTML}<pre class="p-4 text-sm font-mono overflow-x-auto"><code class="language-${lang} text-cyan-600 dark:text-cyan-400">${code}</code></pre></div>`;
    };
    marked.setOptions({ renderer: globalCodeBlockRenderer });

// --- DOM 元素引用 ---
    const elements = {
        // 通用可搜索视图元素
        searchableView: document.getElementById('searchable-view'),
        searchInput: document.getElementById('searchable-input'),
        resultsList: document.getElementById('searchable-results-list'),
        detailsView: document.getElementById('searchable-details-view'),
        dropdownTrigger: document.getElementById('searchable-trigger'),
        dropdownSelectedText: document.getElementById('searchable-selected-text'),
        dropdownOptions: document.getElementById('searchable-options'),
        // 主题切换元素
        themeToggleButton: document.getElementById('theme-toggle'),
        sunIcon: document.getElementById('theme-icon-sun'),
        moonIcon: document.getElementById('theme-icon-moon'),
        // 确认模态框元素
        confirmationModal: document.getElementById('confirmation-modal'),
        modalDialog: document.getElementById('modal-dialog'),
        modalTitle: document.getElementById('modal-title'),
        modalMessage: document.getElementById('modal-message'),
        modalConfirmBtn: document.getElementById('modal-confirm-btn'),
        modalCancelBtn: document.getElementById('modal-cancel-btn'),
        // 输入模态框元素
        inputModal: document.getElementById('input-modal'),
        inputModalDialog: document.getElementById('input-modal-dialog'),
        inputModalTitle: document.getElementById('input-modal-title'),
        inputModalMessage: document.getElementById('input-modal-message'),
        inputModalField: document.getElementById('input-modal-field'),
        inputModalConfirmBtn: document.getElementById('input-modal-confirm-btn'),
        inputModalCancelBtn: document.getElementById('input-modal-cancel-btn'),
        // 笔记视图专用元素
        notesView: document.getElementById('notes-view'),
        notesList: document.getElementById('notesList'),
        noteDetailsView: document.getElementById('noteDetailsView'),
        noteSetTrigger: document.getElementById('note-set-trigger'),
        noteSetSelectedText: document.getElementById('note-set-selected-text'),
        noteSetOptions: document.getElementById('note-set-options'),
        addSetBtn: document.getElementById('add-set-btn'),
        addNoteForm: document.getElementById('addNoteForm'),
        noteQuestion: document.getElementById('noteQuestion'),
        noteSearchInput: document.getElementById('noteSearchInput'),
        addNoteFormTitle: document.getElementById('addNoteFormTitle'),
    };

// --- UI 模板引用 ---
    const templates = {};

    function initTemplates() {
        templates.stateMessage = document.getElementById('state-message-template');
        templates.commandItem = document.getElementById('command-item-template');
        templates.commandDetail = document.getElementById('command-detail-template');
        templates.commandExample = document.getElementById('command-example-template');
        templates.noteItem = document.getElementById('note-item-template');
        templates.noteDetail = document.getElementById('note-detail-template');
    }

// --- 主题切换 ---
    function updateThemeIcons() {
        if (!elements.sunIcon || !elements.moonIcon) return;
        const isDark = document.documentElement.classList.contains('dark');
        elements.sunIcon.classList.toggle('hidden', isDark);
        elements.moonIcon.classList.toggle('hidden', !isDark);
    }

    function toggleTheme() {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        updateThemeIcons();
    }

// --- 可复用事件处理器 ---
// 处理所有代码块的复制按钮点击事件
    async function handleCopyButtonClick(event) {
        const copyBtn = event.target.closest('.copy-btn');
        if (!copyBtn) return;
        const codeToCopy = copyBtn.closest('.code-block').querySelector('code').textContent;
        try {
            await navigator.clipboard.writeText(codeToCopy);
            const img = copyBtn.querySelector('img');
            const originalSrc = img.src;
            img.src = 'img/icons/check.svg'; // 切换为“完成”图标
            copyBtn.disabled = true;
            setTimeout(() => {
                img.src = originalSrc; // 2秒后恢复原图标
                copyBtn.disabled = false;
            }, 2000);
        } catch (err) {
            console.error('复制文本失败: ', err);
            // 可以考虑在此处显示一个错误提示
        }
    }

// --- 下拉菜单逻辑 ---
// 初始化一个自定义下拉菜单
    function initCustomDropdown(dataSource, onSelectionChange, elRefs) {
        const { trigger, options: optionsContainer, selectedText: selectedTextEl } = elRefs;
        optionsContainer.innerHTML = '';
        Object.keys(dataSource).forEach(name => {
            const option = document.createElement('div');
            option.textContent = name;
            option.className = 'px-4 py-3 cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors';
            option.addEventListener('click', () => {
                selectedTextEl.textContent = name;
                onSelectionChange(name);
                closeAllDropdowns(); // 选择后关闭所有下拉菜单
            });
            optionsContainer.appendChild(option);
        });
    }

// 切换指定下拉菜单的显示/隐藏状态，并关闭其他所有下拉菜单
    function toggleDropdown(triggerEl, optionsEl) {
        const isHidden = optionsEl.classList.contains('hidden');
        closeAllDropdowns(); // 先关闭所有
        if (isHidden) { // 如果原来是隐藏的，则现在显示它
            optionsEl.classList.remove('hidden');
            const triggerIcon = triggerEl.querySelector('img, svg');
            if (triggerIcon) triggerIcon.classList.add('rotate-180');
        }
    }

// 关闭所有下拉菜单
    function closeAllDropdowns() {
        document.querySelectorAll('.dropdown-options').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.dropdown-trigger img, .dropdown-trigger svg').forEach(icon => icon.classList.remove('rotate-180'));
    }

// --- 模态框 (Modal) 逻辑 ---
// [私有] 显示模态框的通用动画逻辑
    function _showModal(modalElement, dialogElement) {
        modalElement.classList.remove('hidden');
        requestAnimationFrame(() => {
            modalElement.classList.add('opacity-100');
            dialogElement.classList.remove('scale-95', 'opacity-0');
            dialogElement.classList.add('scale-100', 'opacity-100');
        });
    }

// [私有] 隐藏模态框的通用动画逻辑
    function _hideModal(modalElement, dialogElement, callback) {
        modalElement.classList.remove('opacity-100');
        dialogElement.classList.remove('scale-100', 'opacity-100');
        dialogElement.classList.add('scale-95', 'opacity-0');
        dialogElement.addEventListener('transitionend', function handler() {
            modalElement.classList.add('hidden');
            dialogElement.removeEventListener('transitionend', handler);
            if (callback) callback();
        }, { once: true });
    }

// 显示一个警告/信息模态框
    function showAlertModal(title, message) {
        return new Promise((resolve) => {
            elements.modalTitle.textContent = title;
            elements.modalMessage.textContent = message;
            elements.modalConfirmBtn.textContent = '确定';
            elements.modalCancelBtn.classList.add('hidden'); // 隐藏取消按钮

            _showModal(elements.confirmationModal, elements.modalDialog);

            const handleConfirm = () => {
                cleanup();
                resolve();
            };
            const cleanup = () => {
                elements.modalConfirmBtn.removeEventListener('click', handleConfirm);
                _hideModal(elements.confirmationModal, elements.modalDialog, () => {
                    elements.modalCancelBtn.classList.remove('hidden'); // 恢复取消按钮
                });
            };
            elements.modalConfirmBtn.addEventListener('click', handleConfirm, { once: true });
        });
    }

// 显示一个确认模态框
    function showConfirmationModal(title, message, confirmText = '确认') {
        return new Promise((resolve) => {
            elements.modalTitle.textContent = title;
            elements.modalMessage.textContent = message;
            elements.modalConfirmBtn.textContent = confirmText;
            elements.modalCancelBtn.classList.remove('hidden');

            // 如果是危险操作，高亮确认按钮
            const isDanger = confirmText.includes('删除');
            elements.modalConfirmBtn.classList.toggle('bg-red-600', isDanger);
            elements.modalConfirmBtn.classList.toggle('hover:bg-red-700', isDanger);
            elements.modalConfirmBtn.classList.toggle('bg-cyan-600', !isDanger);
            elements.modalConfirmBtn.classList.toggle('hover:bg-cyan-700', !isDanger);

            _showModal(elements.confirmationModal, elements.modalDialog);

            const handleConfirm = () => { cleanup(); resolve(true); };
            const handleCancel = () => { cleanup(); resolve(false); };
            const cleanup = () => {
                elements.modalConfirmBtn.removeEventListener('click', handleConfirm);
                elements.modalCancelBtn.removeEventListener('click', handleCancel);
                _hideModal(elements.confirmationModal, elements.modalDialog);
            };
            elements.modalConfirmBtn.addEventListener('click', handleConfirm, { once: true });
            elements.modalCancelBtn.addEventListener('click', handleCancel, { once: true });
        });
    }

// 显示一个带输入的模态框
    function showInputModal(title, message, placeholder = '') {
        return new Promise((resolve) => {
            elements.inputModalTitle.textContent = title;
            elements.inputModalMessage.textContent = message;
            elements.inputModalField.value = '';
            elements.inputModalField.placeholder = placeholder;

            _showModal(elements.inputModal, elements.inputModalDialog);
            elements.inputModalField.focus();

            const handleConfirm = () => { cleanup(); resolve(elements.inputModalField.value); };
            const handleCancel = () => { cleanup(); resolve(null); };
            const cleanup = () => {
                elements.inputModalConfirmBtn.removeEventListener('click', handleConfirm);
                elements.inputModalCancelBtn.removeEventListener('click', handleCancel);
                _hideModal(elements.inputModal, elements.inputModalDialog);
            };
            elements.inputModalConfirmBtn.addEventListener('click', handleConfirm, { once: true });
            elements.inputModalCancelBtn.addEventListener('click', handleCancel, { once: true });
        });
    }

// --- 列表与详情视图更新 ---
// 更新列表中的选中项高亮和滚动位置
    function updateSelection(items, selectedIndex, currentData, onSelect, detailsViewEl, selectionName) {
        items.forEach((item, index) => {
            const isActive = index === selectedIndex;
            item.classList.toggle('active', isActive);
            if (isActive) item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
        const activeItem = items[selectedIndex];
        if (activeItem) {
            const commandName = activeItem.dataset.commandName;
            const command = currentData.find(c => c.name === commandName);
            if (command) onSelect(command, detailsViewEl, selectionName);
        }
    }

// 显示搜索结果列表
    function displayResults(results, onItemClick, targetElement) {
        targetElement.innerHTML = '';
        if (!results.length) return showEmptyState(targetElement);

        const fragment = document.createDocumentFragment();
        results.forEach((item, index) => {
            const itemClone = templates.commandItem.content.cloneNode(true);
            const resultItem = itemClone.querySelector('.result-item');
            resultItem.dataset.commandName = item.name;
            resultItem.querySelector('.command-name').textContent = item.name;
            resultItem.querySelector('.command-summary').textContent = item.summary;
            resultItem.addEventListener('click', () => onItemClick(index));
            fragment.appendChild(itemClone);
        });
        targetElement.appendChild(fragment);
    }

// 显示项目详情
    function displayDetails(item, targetElement, selectionName) {
        const detailClone = templates.commandDetail.content.cloneNode(true);
        detailClone.querySelector('.detail-name').textContent = item.name;
        detailClone.querySelector('.detail-summary').textContent = item.summary;

        // 填充“备注”部分
        const notesSection = detailClone.querySelector('.detail-notes-section');
        if (item.notes) {
            detailClone.querySelector('.detail-notes-content').innerHTML = marked.parse(item.notes);
        } else {
            notesSection.classList.add('hidden');
        }

        // 填充“Shell类型”部分
        const shellTypeSection = detailClone.querySelector('.detail-shell-type-section');
        if (item.shell_type) {
            detailClone.querySelector('.detail-shell-type-content').textContent = item.shell_type;
        } else {
            shellTypeSection.classList.add('hidden');
        }

        // 填充“示例”部分
        const examplesContainer = detailClone.querySelector('.examples-container');
        if (item.examples?.length > 0) {
            // 根据selectionName自动判断代码高亮语言
            const name = selectionName.toLowerCase();
            let lang = 'bash';
            if (name === 'powershell') lang = 'powershell';
            else if (['javascript', 'react', 'vue', 'npm'].includes(name)) lang = 'javascript';
            else if (name === 'python' || name === 'pip') lang = 'python';
            else if (name === 'maven') lang = 'xml';
            else if (name === 'sql') lang = 'sql';

            item.examples.forEach(example => {
                const exampleClone = templates.commandExample.content.cloneNode(true);
                exampleClone.querySelector('.example-description').textContent = example.description;
                const codeElement = exampleClone.querySelector('code');
                codeElement.textContent = example.code;
                codeElement.className = `language-${lang}`; // 动态设置高亮语言
                examplesContainer.appendChild(exampleClone);
            });
        } else {
            examplesContainer.classList.add('hidden'); // 没有示例则隐藏整个区域
        }

        targetElement.innerHTML = '';
        targetElement.appendChild(detailClone);
        targetElement.scrollTop = 0;
        // 新增：在内容插入后，调用 Prism 来高亮所有代码块
        if (window.Prism) {
            Prism.highlightAllUnder(targetElement);
        }
    }

// --- 视图状态显示 (加载、空、错误) ---
    function showState(element, message, colorClass = 'text-slate-500') {
        const stateClone = templates.stateMessage.content.cloneNode(true);
        const p = stateClone.querySelector('p');
        p.textContent = message;
        p.className = `text-center ${colorClass}`;
        element.innerHTML = '';
        element.appendChild(stateClone);
    }

    function clearDetailsView(el, message) { showState(el, message); }
    function showLoadingState(el) { showState(el, "正在加载数据..."); }
    function showEmptyState(el) { showState(el, "未找到匹配的项目。"); }
    function showErrorState(el, msg) { showState(el, msg, 'text-red-500 dark:text-red-400'); }

// --- 视图切换动画 ---
    function showView(element) {
        if (!element) return;
        element.classList.remove('hidden');
        requestAnimationFrame(() => { // 确保'hidden'移除后浏览器完成重绘
            element.classList.remove('opacity-0');
            element.classList.add('opacity-100');
        });
    }

    function hideView(element) {
        if (!element) return;
        element.classList.remove('opacity-100');
        element.classList.add('opacity-0');
        // 动画结束后再添加'hidden'，防止元素立即消失
        element.addEventListener('transitionend', () => element.classList.add('hidden'), { once: true });
    }

// --- 导出模块 ---
    return {
        elements, templates,
        initTemplates, updateThemeIcons, toggleTheme,
        handleCopyButtonClick,
        initCustomDropdown, toggleDropdown, closeAllDropdowns,
        showConfirmationModal, showAlertModal, showInputModal,
        updateSelection, displayResults, displayDetails, clearDetailsView,
        showLoadingState, showEmptyState, showErrorState, showState,
        showView, hideView,
    };
})();