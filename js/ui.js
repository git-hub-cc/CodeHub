// js/ui.js

const ui = (() => {
    // Set up a global renderer for Markdown processing (for code blocks with copy buttons)
    // This will apply to any marked.parse() call that doesn't specify a local renderer.
    const globalCodeBlockRenderer = new marked.Renderer();
    globalCodeBlockRenderer.code = (code, infostring, escaped) => {
        const lang = (infostring || '').match(/\S*/)[0];
        const copyButtonHTML = `<button class="copy-btn absolute top-2 right-2 p-1.5 bg-slate-200/50 dark:bg-slate-700/80 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><img src="img/icons/copy.svg" class="h-5 w-5" alt="Copy"></button>`;
        return `<div class="code-block relative bg-slate-100 dark:bg-slate-900 rounded-lg group my-4">${copyButtonHTML}<pre class="p-4 text-sm font-mono overflow-x-auto"><code class="language-${lang} text-cyan-600 dark:text-cyan-400">${code}</code></pre></div>`;
    };
    marked.setOptions({ renderer: globalCodeBlockRenderer }); // This sets the default renderer

    // --- DOM Element References ---
    const elements = {
        // --- Generic Searchable View Elements ---
        searchableView: document.getElementById('searchable-view'),
        searchInput: document.getElementById('searchable-input'),
        resultsList: document.getElementById('searchable-results-list'),
        detailsView: document.getElementById('searchable-details-view'),
        dropdownTrigger: document.getElementById('searchable-trigger'),
        dropdownSelectedText: document.getElementById('searchable-selected-text'),
        dropdownOptions: document.getElementById('searchable-options'),

        // --- Theme elements ---
        themeToggleButton: document.getElementById('theme-toggle'),
        sunIcon: document.getElementById('theme-icon-sun'),
        moonIcon: document.getElementById('theme-icon-moon'),

        // --- Confirmation Modal elements ---
        confirmationModal: document.getElementById('confirmation-modal'),
        modalDialog: document.getElementById('modal-dialog'),
        modalTitle: document.getElementById('modal-title'),
        modalMessage: document.getElementById('modal-message'),
        modalConfirmBtn: document.getElementById('modal-confirm-btn'),
        modalCancelBtn: document.getElementById('modal-cancel-btn'),

        // --- Input Modal elements ---
        inputModal: document.getElementById('input-modal'),
        inputModalDialog: document.getElementById('input-modal-dialog'),
        inputModalTitle: document.getElementById('input-modal-title'),
        inputModalMessage: document.getElementById('input-modal-message'),
        inputModalField: document.getElementById('input-modal-field'),
        inputModalConfirmBtn: document.getElementById('input-modal-confirm-btn'),
        inputModalCancelBtn: document.getElementById('input-modal-cancel-btn'),

        // --- Notes View Elements (Remain Specific) ---
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

    // --- UI Templates (will be populated by initTemplates) ---
    const templates = {};

    function initTemplates() {
        templates.stateMessage = document.getElementById('state-message-template');
        templates.commandItem = document.getElementById('command-item-template');
        templates.commandDetail = document.getElementById('command-detail-template');
        templates.commandExample = document.getElementById('command-example-template');
        templates.noteItem = document.getElementById('note-item-template');
        templates.noteDetail = document.getElementById('note-detail-template');
    }

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

    /**
     * Initializes a custom dropdown menu.
     * @param {Object} dataSource - An object mapping names to data paths (e.g., { 'Linux': 'data/linux.json' }).
     * @param {Function} onSelectionChange - Callback function when a new item is selected.
     * @param {Object} [elRefs] - Optional custom element references for trigger, options, and selected text.
     */
    function initCustomDropdown(dataSource, onSelectionChange, elRefs = {}) {
        const trigger = elRefs.trigger || elements.dropdownTrigger;
        const optionsContainer = elRefs.options || elements.dropdownOptions;
        const selectedTextEl = elRefs.selectedText || elements.dropdownSelectedText;

        optionsContainer.innerHTML = '';
        Object.keys(dataSource).forEach(name => {
            const option = document.createElement('div');
            option.textContent = name;
            option.dataset.value = name;
            option.className = 'px-4 py-3 cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors';
            option.addEventListener('click', () => {
                selectedTextEl.textContent = name;
                onSelectionChange(name);
                optionsContainer.classList.add('hidden');
                // Ensure the trigger icon rotates back
                const triggerIcon = trigger.querySelector('img, svg');
                if (triggerIcon) triggerIcon.classList.remove('rotate-180');
            });
            optionsContainer.appendChild(option);
        });
    }

    /**
     * Handles opening/closing of a dropdown, ensuring other dropdowns are closed.
     * @param {HTMLElement} triggerEl - The button/element that triggers the dropdown.
     * @param {HTMLElement} optionsEl - The container for dropdown options.
     */
    function toggleDropdown(triggerEl, optionsEl) {
        const triggerIcon = triggerEl.querySelector('img, svg');
        const isHidden = optionsEl.classList.contains('hidden');

        // Close all other dropdowns
        document.querySelectorAll('.absolute.top-full').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('#searchable-trigger img, #note-set-trigger img').forEach(s => s.classList.remove('rotate-180'));

        if (isHidden) {
            optionsEl.classList.remove('hidden');
            if(triggerIcon) triggerIcon.classList.add('rotate-180');
        } else {
            optionsEl.classList.add('hidden');
            if(triggerIcon) triggerIcon.classList.remove('rotate-180');
        }
    }

    function showAlertModal(title, message) {
        return new Promise((resolve) => {
            elements.modalTitle.textContent = title;
            elements.modalMessage.textContent = message;
            elements.modalConfirmBtn.textContent = '确定';
            elements.modalCancelBtn.classList.add('hidden');

            const baseButtonClasses = 'px-4 py-2 rounded-lg border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
            const cyanButtonClasses = 'bg-cyan-600 border-transparent text-white hover:bg-cyan-700 focus:ring-cyan-500';
            elements.modalConfirmBtn.className = `${baseButtonClasses} ${cyanButtonClasses}`;

            elements.confirmationModal.classList.remove('hidden');
            // Force reflow for transition
            requestAnimationFrame(() => {
                elements.confirmationModal.classList.add('opacity-100');
                elements.modalDialog.classList.remove('scale-95', 'opacity-0');
                elements.modalDialog.classList.add('scale-100', 'opacity-100');
            });

            const handleConfirm = () => { cleanup(); resolve(); };

            const cleanup = () => {
                elements.modalConfirmBtn.removeEventListener('click', handleConfirm);
                elements.confirmationModal.classList.remove('opacity-100');
                elements.modalDialog.classList.remove('scale-100', 'opacity-100');
                elements.modalDialog.classList.add('scale-95', 'opacity-0');
                // Wait for transition to finish before hiding
                elements.modalDialog.addEventListener('transitionend', () => {
                    elements.confirmationModal.classList.add('hidden');
                    elements.modalCancelBtn.classList.remove('hidden'); // Reset for next use
                }, { once: true });
            };
            elements.modalConfirmBtn.addEventListener('click', handleConfirm, { once: true });
        });
    }

    function showConfirmationModal(title, message, confirmText = '确认') {
        return new Promise((resolve) => {
            elements.modalTitle.textContent = title;
            elements.modalMessage.textContent = message;
            elements.modalConfirmBtn.textContent = confirmText;
            elements.modalCancelBtn.classList.remove('hidden'); // Ensure cancel button is visible

            const baseButtonClasses = 'px-4 py-2 rounded-lg border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
            const redButtonClasses = 'bg-red-600 border-transparent text-white hover:bg-red-700 focus:ring-red-500';
            const cyanButtonClasses = 'bg-cyan-600 border-transparent text-white hover:bg-cyan-700 focus:ring-cyan-500';
            elements.modalConfirmBtn.className = `${baseButtonClasses} ${confirmText.includes('删除') ? redButtonClasses : cyanButtonClasses}`;

            elements.confirmationModal.classList.remove('hidden');
            // Force reflow for transition
            requestAnimationFrame(() => {
                elements.confirmationModal.classList.add('opacity-100');
                elements.modalDialog.classList.remove('scale-95', 'opacity-0');
                elements.modalDialog.classList.add('scale-100', 'opacity-100');
            });

            const handleConfirm = () => { cleanup(); resolve(true); };
            const handleCancel = () => { cleanup(); resolve(false); };

            const cleanup = () => {
                elements.modalConfirmBtn.removeEventListener('click', handleConfirm);
                elements.modalCancelBtn.removeEventListener('click', handleCancel);
                elements.confirmationModal.classList.remove('opacity-100');
                elements.modalDialog.classList.remove('scale-100', 'opacity-100');
                elements.modalDialog.classList.add('scale-95', 'opacity-0');
                // Wait for transition to finish before hiding
                elements.modalDialog.addEventListener('transitionend', () => {
                    elements.confirmationModal.classList.add('hidden');
                }, { once: true });
            };
            elements.modalConfirmBtn.addEventListener('click', handleConfirm, { once: true });
            elements.modalCancelBtn.addEventListener('click', handleCancel, { once: true });
        });
    }

    function showInputModal(title, message, placeholder = '') {
        return new Promise((resolve) => {
            elements.inputModalTitle.textContent = title;
            elements.inputModalMessage.textContent = message;
            elements.inputModalField.value = '';
            elements.inputModalField.placeholder = placeholder;

            elements.inputModal.classList.remove('hidden');
            // Force reflow for transition
            requestAnimationFrame(() => {
                elements.inputModal.classList.add('opacity-100');
                elements.inputModalDialog.classList.remove('scale-95', 'opacity-0');
                elements.inputModalDialog.classList.add('scale-100', 'opacity-100');
                elements.inputModalField.focus();
            });

            const handleConfirm = () => { cleanup(); resolve(elements.inputModalField.value); };
            const handleCancel = () => { cleanup(); resolve(null); };

            const cleanup = () => {
                elements.inputModalConfirmBtn.removeEventListener('click', handleConfirm);
                elements.inputModalCancelBtn.removeEventListener('click', handleCancel);
                elements.inputModal.classList.remove('opacity-100');
                elements.inputModalDialog.classList.remove('scale-100', 'opacity-100');
                elements.inputModalDialog.classList.add('scale-95', 'opacity-0');
                // Wait for transition to finish before hiding
                elements.inputModalDialog.addEventListener('transitionend', () => {
                    elements.inputModal.classList.add('hidden');
                }, { once: true });
            };

            elements.inputModalConfirmBtn.addEventListener('click', handleConfirm, { once: true });
            elements.inputModalCancelBtn.addEventListener('click', handleCancel, { once: true });
        });
    }

    function updateSelection(items, selectedIndex, currentData, onSelect, detailsViewEl = elements.detailsView, selectionName) {
        items.forEach((item, index) => {
            const isActive = index === selectedIndex;
            item.classList.toggle('active', isActive);
            if (isActive) item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
        const activeItem = items[selectedIndex];
        if (activeItem) {
            let identifier;
            if(activeItem.dataset.commandName) {
                identifier = activeItem.dataset.commandName;
                const command = currentData.find(c => c.name === identifier);
                if (command) onSelect(command, detailsViewEl, selectionName);
            } else if (activeItem.dataset.noteId) {
                identifier = parseInt(activeItem.dataset.noteId, 10);
                // The `onSelect` for notes is handled in `notes.js` directly,
                // so we don't need to re-find the note here.
                // This `updateSelection` is more about visual highlighting and scrolling for notes.
                // The actual detail rendering for notes happens when a note item is clicked.
            }
        }
    }

    function displayResults(results, onItemClick, targetElement = elements.resultsList) {
        targetElement.innerHTML = '';
        if (!results.length) return showEmptyState(targetElement);

        const fragment = document.createDocumentFragment();
        results.forEach((command, index) => { // 'command' here refers to a generic item (command, framework, other)
            const itemClone = templates.commandItem.content.cloneNode(true);
            const item = itemClone.querySelector('.result-item');
            item.dataset.commandName = command.name; // Use commandName for generic searchable items
            item.querySelector('.command-name').textContent = command.name;
            item.querySelector('.command-summary').textContent = command.summary;
            item.addEventListener('click', () => onItemClick(index));
            fragment.appendChild(itemClone);
        });
        targetElement.appendChild(fragment);
    }

    function displayDetails(item, targetElement = elements.detailsView, selectionName) {
        const detailClone = templates.commandDetail.content.cloneNode(true);
        detailClone.querySelector('.detail-name').textContent = item.name;
        detailClone.querySelector('.detail-summary').textContent = item.summary;

        // Populate Notes section
        const notesSection = detailClone.querySelector('.detail-notes-section');
        const notesContent = detailClone.querySelector('.detail-notes-content');
        if (item.notes) {
            notesContent.innerHTML = marked.parse(item.notes); // Use global renderer
        } else {
            notesSection.classList.add('hidden');
        }

        // Populate Shell Type section
        const shellTypeSection = detailClone.querySelector('.detail-shell-type-section');
        const shellTypeContent = detailClone.querySelector('.detail-shell-type-content');
        if (item.shell_type) {
            shellTypeContent.textContent = item.shell_type;
        } else {
            shellTypeSection.classList.add('hidden');
        }

        const examplesContainer = detailClone.querySelector('.examples-container');
        // The "示例" heading is part of the template. Hide the whole container if no examples.
        if (item.examples && item.examples.length > 0) {
            let lang = 'plaintext'; // Default language
            const name = selectionName ? selectionName.toLowerCase() : '';
            if (['linux', 'docker', 'k8s', 'git'].includes(name)) {
                lang = 'shell';
            } else if (name === 'powershell') {
                lang = 'powershell';
            } else if (['javascript', 'react', 'vue', 'npm'].includes(name)) {
                lang = 'javascript';
            } else if (name === 'python' || name === 'pip') {
                lang = 'python';
            } else if (name === 'maven') {
                lang = 'xml';
            }

            item.examples.forEach(example => {
                const exampleClone = templates.commandExample.content.cloneNode(true);
                exampleClone.querySelector('.example-description').textContent = example.description;

                const codeElement = exampleClone.querySelector('code');
                codeElement.textContent = example.code;
                codeElement.classList.add(`language-${lang}`);

                examplesContainer.appendChild(exampleClone);
            });
        } else {
            // If there are no examples, hide the section entirely
            examplesContainer.classList.add('hidden');
        }

        targetElement.innerHTML = '';
        targetElement.appendChild(detailClone);
        targetElement.scrollTop = 0;
    }

    function showState(element, message, colorClass = 'text-slate-500') {
        const stateClone = templates.stateMessage.content.cloneNode(true);
        const p = stateClone.querySelector('p');
        p.textContent = message;
        p.className = `text-center ${colorClass}`;
        element.innerHTML = '';
        element.appendChild(stateClone);
    }

    function clearDetailsView(el = elements.detailsView, message = "选择一个项目以查看详细信息") {
        showState(el, message);
    }

    function showLoadingState(el) { showState(el, "正在加载数据..."); }
    function showEmptyState(el) { showState(el, "未找到匹配的项目。"); }
    function showErrorState(el, msg) { showState(el, msg, 'text-red-500 dark:text-red-400'); }

    /**
     * Smoothly shows a DOM element.
     * Removes 'hidden' and then adds 'opacity-100' after a slight delay for transition.
     * @param {HTMLElement} element - The DOM element to show.
     */
    function showView(element) {
        if (!element) return;
        element.classList.remove('hidden');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { // Double rAF to ensure repaint
                element.classList.remove('opacity-0');
                element.classList.add('opacity-100');
            });
        });
    }

    /**
     * Smoothly hides a DOM element.
     * Adds 'opacity-0' and then adds 'hidden' after transition ends.
     * @param {HTMLElement} element - The DOM element to hide.
     */
    function hideView(element) {
        if (!element) return;
        element.classList.remove('opacity-100');
        element.classList.add('opacity-0');
        element.addEventListener('transitionend', function handler() {
            element.classList.add('hidden');
            element.removeEventListener('transitionend', handler);
        }, { once: true });
    }

    return {
        elements,
        templates,
        initTemplates,
        updateThemeIcons,
        toggleTheme,
        initCustomDropdown,
        toggleDropdown, // Export the new toggleDropdown function
        showConfirmationModal,
        showAlertModal,
        showInputModal,
        updateSelection,
        displayResults,
        displayDetails,
        clearDetailsView,
        showLoadingState,
        showEmptyState,
        showErrorState,
        showState,
        showView,     // Export showView
        hideView,     // Export hideView
    };
})();