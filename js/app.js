// js/app.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration for all searchable modes ---
    const dataSources = {
        commands: { 'Linux': 'data/commands/linux.json', 'PowerShell': 'data/commands/powershell.json', 'Git': 'data/commands/git.json', 'Docker': 'data/commands/docker.json', 'K8S': 'data/commands/k8s.json', 'npm': 'data/commands/npm.json', 'Maven': 'data/commands/maven.json', 'Pip': 'data/commands/pip.json' , 'Scoop': 'data/commands/scoop.json' , 'Sql': 'data/commands/sql.json'  },
        frameworks: { 'SpringBoot': 'data/frameworks/springboot.json','Vue': 'data/frameworks/vue.json','React': 'data/frameworks/react.json','Tailwind': 'data/frameworks/tailwind.json' },
        other: { '设计模式': 'data/other/patterns.json','正则': 'data/other/regex.json' ,'Markdown': 'data/other/markdown.json' ,'Http': 'data/other/http.json'  },
    };

    // --- DOM References (for app logic) ---
    const modeToggles = {
        commands: document.getElementById('mode-toggle-commands'),
        frameworks: document.getElementById('mode-toggle-frameworks'),
        other: document.getElementById('mode-toggle-other'),
        notes: document.getElementById('mode-toggle-notes'),
    };

    // --- State ---
    let currentModeId = 'commands'; // Can be 'commands', 'frameworks', 'other', 'notes'
    const modes = {
        // Configuration for each searchable mode
        commands: { label: '命令', dataSource: dataSources.commands, storageKeyPrefix: 'cmd', defaultSelection: 'Linux', state: { data: [], fuse: null, selectedIndex: -1, currentSelectionName: 'Linux' } },
        frameworks: { label: '框架', dataSource: dataSources.frameworks, storageKeyPrefix: 'framework', defaultSelection: 'SpringBoot', state: { data: [], fuse: null, selectedIndex: -1, currentSelectionName: 'SpringBoot' } },
        other: { label: '其它', dataSource: dataSources.other, storageKeyPrefix: 'other', defaultSelection: '设计模式', state: { data: [], fuse: null, selectedIndex: -1, currentSelectionName: '设计模式' } }
    };

    // --- Initialization ---
    async function initialize() {
        await loadTemplates();
        ui.initTemplates();
        ui.updateThemeIcons();
        await db.initDB();
        notes.init();
        addEventListeners();
        // Initial mode setup. Directly show the view without transition on first load.
        switchMode(currentModeId, true);
    }

    async function loadTemplates() {
        try {
            const response = await fetch('templates.html');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            document.getElementById('template-container').innerHTML = await response.text();
        } catch (error) {
            console.error("Fatal: Could not load UI templates. The app cannot start.", error);
            document.body.innerHTML = '<div class="text-center p-8 text-red-500">Error: UI templates could not be loaded. Please check the console for details.</div>';
        }
    }

    // --- Mode Switching Logic ---
    async function switchMode(newModeId, isInitial = false) {
        if (!isInitial && currentModeId === newModeId) return;

        const prevModeId = currentModeId;
        currentModeId = newModeId;

        // Update active toggle button style
        const activeClasses = 'bg-cyan-600 text-white'.split(' ');
        const inactiveClasses = 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50'.split(' ');
        Object.values(modeToggles).forEach(toggle => {
            toggle.classList.remove(...activeClasses, ...inactiveClasses);
            if (toggle.id === `mode-toggle-${newModeId}`) {
                toggle.classList.add(...activeClasses);
            } else {
                toggle.classList.add(...inactiveClasses);
            }
        });

        // Handle view transitions
        const prevView = prevModeId === 'notes' ? ui.elements.notesView : ui.elements.searchableView;
        const newView = newModeId === 'notes' ? ui.elements.notesView : ui.elements.searchableView;

        if (isInitial) {
            ui.showView(newView);
            if (newModeId === 'notes') {
                await notes.activate();
            } else {
                await activateSearchableMode(newModeId);
            }
        } else {
            // First, fade out the current view
            ui.hideView(prevView);

            // After the old view has faded out, switch content and fade in the new one
            // We wait for the transition to finish before showing the new view
            prevView.addEventListener('transitionend', async function handler() {
                prevView.removeEventListener('transitionend', handler); // Remove listener to prevent multiple calls
                if (newModeId === 'notes') {
                    await notes.activate();
                } else {
                    await activateSearchableMode(newModeId);
                }
                ui.showView(newView);
            }, { once: true });
        }
    }

    async function activateSearchableMode(modeId) {
        const mode = modes[modeId];
        ui.elements.searchInput.value = '';
        ui.elements.searchInput.placeholder = `搜索${mode.label}，如 '${mode.label === '命令' ? 'ls' : mode.label === '框架' ? 'webflux': 'if' }'...`;
        ui.elements.dropdownSelectedText.textContent = mode.state.currentSelectionName;

        // Initialize the custom dropdown for the current mode's data source
        ui.initCustomDropdown(mode.dataSource, (newSelection) => handleSelectionChange(modeId, newSelection), {
            trigger: ui.elements.dropdownTrigger,
            options: ui.elements.dropdownOptions,
            selectedText: ui.elements.dropdownSelectedText
        });

        if (mode.state.data.length === 0) {
            await loadDataForMode(modeId);
        } else {
            // Data is already loaded, just re-display it
            displayResultsForMode(modeId, '');
        }
    }

    // --- Generic Data Loading & Processing ---
    async function loadData(config, currentName, loadingEl, storageKeyPrefix) {
        const dataPath = config[currentName];
        if (!dataPath) {
            ui.showErrorState(loadingEl, `配置中未找到 '${currentName}'。`);
            return [];
        }
        const storageKey = `${storageKeyPrefix}-${dataPath}`;

        // Try to get from IndexedDB cache first
        const cachedData = await db.getCache(storageKey);
        if (cachedData) {
            return cachedData;
        }

        // If not in cache, fetch from network
        try {
            ui.showLoadingState(loadingEl);
            const response = await fetch(dataPath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            await db.setCache(storageKey, data); // Store in IndexedDB cache
            return data;
        } catch (error) {
            ui.showErrorState(loadingEl, `加载 ${currentName} 数据失败。`);
            return [];
        }
    }

    const createFuse = (data) => new Fuse(data, {
        keys: [
            { name: 'name', weight: 0.7 },
            { name: 'summary', weight: 0.3 },
            { name: 'examples.description', weight: 0.1 }, // Also search example descriptions
            { name: 'examples.code', weight: 0.1 },        // And example code
            { name: 'notes', weight: 0.2 },                // Search within notes
            { name: 'shell_type', weight: 0.1 }             // Search within shell_type
        ],
        includeScore: true,
        threshold: 0.4
    });

    async function loadDataForMode(modeId) {
        const mode = modes[modeId];
        const data = await loadData(mode.dataSource, mode.state.currentSelectionName, ui.elements.resultsList, mode.storageKeyPrefix);
        mode.state.data = data;
        mode.state.fuse = createFuse(data);
        displayResultsForMode(modeId, '');
        ui.clearDetailsView(ui.elements.detailsView, `选择一个${mode.label}以查看详细信息`);
    }

    // --- Event Listener Setup ---
    function addEventListeners() {
        ui.elements.themeToggleButton.addEventListener('click', ui.toggleTheme);
        modeToggles.commands.addEventListener('click', () => switchMode('commands'));
        modeToggles.frameworks.addEventListener('click', () => switchMode('frameworks'));
        modeToggles.other.addEventListener('click', () => switchMode('other'));
        modeToggles.notes.addEventListener('click', () => switchMode('notes'));

        ui.elements.searchInput.addEventListener('input', (e) => displayResultsForMode(currentModeId, e.target.value));
        ui.elements.searchInput.addEventListener('keydown', handleKeyDown);

        // Generic searchable dropdown click handler (uses ui.toggleDropdown)
        ui.elements.dropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            ui.toggleDropdown(ui.elements.dropdownTrigger, ui.elements.dropdownOptions);
        });

        // Notes view specific dropdown click handler (uses ui.toggleDropdown)
        ui.elements.noteSetTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            ui.toggleDropdown(ui.elements.noteSetTrigger, ui.elements.noteSetOptions);
        });

        // Global click listener to close any open dropdowns
        document.addEventListener('click', () => {
            // This is handled generically by ui.toggleDropdown now,
            // which closes others when one is opened.
            // But we still need a way to close them if clicked outside without opening another.
            // The logic inside ui.toggleDropdown already handles closing all others.
            // So, just ensure they are all closed if any click happens outside of dropdown triggers/options.
            ui.elements.dropdownOptions.classList.add('hidden');
            const searchDropdownIcon = ui.elements.dropdownTrigger.querySelector('img, svg');
            if (searchDropdownIcon) searchDropdownIcon.classList.remove('rotate-180');

            ui.elements.noteSetOptions.classList.add('hidden');
            const noteDropdownIcon = ui.elements.noteSetTrigger.querySelector('img, svg');
            if (noteDropdownIcon) noteDropdownIcon.classList.remove('rotate-180');
        });


        ui.elements.detailsView.addEventListener('click', handleDetailsViewClick);
    }

    // --- Event Handlers & Display Logic ---
    function handleSelectionChange(modeId, newName) {
        const mode = modes[modeId];
        mode.state.currentSelectionName = newName;
        ui.elements.searchInput.value = '';
        loadDataForMode(modeId);
    }

    function displayResultsForMode(modeId, query) {
        const mode = modes[modeId];
        const results = query.trim() === '' ? mode.state.data : (mode.state.fuse?.search(query).map(r => r.item) || []);
        displayAndResetForMode(modeId, results);
    }

    function displayAndResetForMode(modeId, data) {
        const mode = modes[modeId];
        mode.state.selectedIndex = -1;
        ui.displayResults(data, (index) => {
            mode.state.selectedIndex = index;
            const items = ui.elements.resultsList.querySelectorAll('.result-item');
            ui.updateSelection(items, mode.state.selectedIndex, mode.state.data, ui.displayDetails, ui.elements.detailsView, mode.state.currentSelectionName);
        }, ui.elements.resultsList);
    }

    function handleKeyDown(event) {
        if (currentModeId === 'notes') return; // Let notes view handle its own keys
        const mode = modes[currentModeId];
        const items = ui.elements.resultsList.querySelectorAll('.result-item');

        if (!items.length || !['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
        event.preventDefault();

        if (event.key === 'ArrowDown') mode.state.selectedIndex = Math.min(mode.state.selectedIndex + 1, items.length - 1);
        if (event.key === 'ArrowUp') mode.state.selectedIndex = Math.max(mode.state.selectedIndex - 1, 0);

        ui.updateSelection(items, mode.state.selectedIndex, mode.state.data, ui.displayDetails, ui.elements.detailsView, mode.state.currentSelectionName);

        if (event.key === 'Enter' && mode.state.selectedIndex >= 0) {
            // Simulate click to trigger detail display logic
            items[mode.state.selectedIndex]?.click();
        }
    }

    async function handleDetailsViewClick(event) {
        const copyBtn = event.target.closest('.copy-btn');
        if (!copyBtn) return;
        const codeToCopy = copyBtn.closest('.code-block').querySelector('code').textContent;
        try {
            await navigator.clipboard.writeText(codeToCopy);
            const img = copyBtn.querySelector('img');
            const originalSrc = img.src;
            img.src = 'img/icons/check.svg'; // Switch to check icon
            setTimeout(() => {
                img.src = originalSrc; // Revert to copy icon
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }

    // --- Start the App ---
    initialize();
});