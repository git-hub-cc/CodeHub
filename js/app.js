
document.addEventListener('DOMContentLoaded', () => {

    // --- 全局配置 ---
    const dataSources = {
        commands: { 'Linux': 'data/commands/linux.json', 'PowerShell': 'data/commands/powershell.json', 'Git': 'data/commands/git.json', 'Docker': 'data/commands/docker.json', 'K8S': 'data/commands/k8s.json', 'npm': 'data/commands/npm.json', 'Maven': 'data/commands/maven.json', 'Pip': 'data/commands/pip.json' , 'Scoop': 'data/commands/scoop.json' , 'Sql': 'data/commands/sql.json'  },
        frameworks: { 'SpringBoot': 'data/frameworks/springboot.json','Vue': 'data/frameworks/vue.json','React': 'data/frameworks/react.json','Tailwind': 'data/frameworks/tailwind.json' },
        other: { '设计模式': 'data/other/patterns.json','正则': 'data/other/regex.json' ,'Markdown': 'data/other/markdown.json' ,'Http': 'data/other/http.json' ,'数据结构': 'data/other/structures.json','算法': 'data/other/algorithms.json'  },
    };

    // --- DOM 引用 ---
    const modeToggles = {
        commands: document.getElementById('mode-toggle-commands'),
        frameworks: document.getElementById('mode-toggle-frameworks'),
        other: document.getElementById('mode-toggle-other'),
        notes: document.getElementById('mode-toggle-notes'),
    };

    // --- 应用状态 ---
    let currentModeId = 'commands'; // 当前模式ID: 'commands', 'frameworks', 'other', 'notes'
    const modes = {
        // 每个可搜索模式的配置
        commands: { label: '命令', dataSource: dataSources.commands, storageKeyPrefix: 'cmd', defaultSelection: 'Linux', state: { data: [], fuse: null, selectedIndex: -1, currentSelectionName: 'Linux' } },
        frameworks: { label: '框架', dataSource: dataSources.frameworks, storageKeyPrefix: 'framework', defaultSelection: 'SpringBoot', state: { data: [], fuse: null, selectedIndex: -1, currentSelectionName: 'SpringBoot' } },
        other: { label: '其它', dataSource: dataSources.other, storageKeyPrefix: 'other', defaultSelection: '设计模式', state: { data: [], fuse: null, selectedIndex: -1, currentSelectionName: '设计模式' } }
    };

    // --- 初始化 ---
    async function initialize() {
        await loadTemplates();
        ui.initTemplates();
        ui.updateThemeIcons();
        await db.initDB();
        notes.init();
        addEventListeners();
        // 初始加载时直接显示视图，无切换动画
        switchMode(currentModeId, true);
    }

    // 加载HTML模板文件
    async function loadTemplates() {
        try {
            const response = await fetch('templates.html');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            document.getElementById('template-container').innerHTML = await response.text();
        } catch (error) {
            console.error("致命错误: 无法加载UI模板，应用无法启动。", error);
            document.body.innerHTML = '<div class="text-center p-8 text-red-500">错误: UI模板加载失败，请检查控制台获取详细信息。</div>';
        }
    }

    // --- 模式切换逻辑 ---
    async function switchMode(newModeId, isInitial = false) {
        if (!isInitial && currentModeId === newModeId) return;

        const prevModeId = currentModeId;
        currentModeId = newModeId;

        // 更新模式切换按钮的激活样式
        const activeClasses = 'bg-cyan-600 text-white'.split(' ');
        const inactiveClasses = 'text-slate-600 dark:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-700/50'.split(' ');
        Object.values(modeToggles).forEach(toggle => {
            toggle.classList.remove(...activeClasses, ...inactiveClasses);
            toggle.classList.add(...(toggle.id === `mode-toggle-${newModeId}` ? activeClasses : inactiveClasses));
        });

        // 处理视图切换动画
        const prevView = prevModeId === 'notes' ? ui.elements.notesView : ui.elements.searchableView;
        const newView = newModeId === 'notes' ? ui.elements.notesView : ui.elements.searchableView;

        if (isInitial) {
            ui.showView(newView);
        } else {
            ui.hideView(prevView);
            // 等待旧视图淡出动画结束后，再显示新视图
            prevView.addEventListener('transitionend', () => ui.showView(newView), { once: true });
        }

        // 激活新模式所需的数据和视图
        if (newModeId === 'notes') {
            await notes.activate();
        } else {
            await activateSearchableMode(newModeId);
        }
    }

    // 激活一个可搜索的模式（命令、框架、其它）
    async function activateSearchableMode(modeId) {
        const mode = modes[modeId];
        ui.elements.searchInput.value = '';
        ui.elements.searchInput.placeholder = `搜索${mode.label}，如 '${mode.label === '命令' ? 'ls' : mode.label === '框架' ? 'webflux': '单例模式' }'...`;
        ui.elements.dropdownSelectedText.textContent = mode.state.currentSelectionName;

        // 初始化当前模式的下拉选择菜单
        ui.initCustomDropdown(mode.dataSource, (newSelection) => handleSelectionChange(modeId, newSelection), {
            trigger: ui.elements.dropdownTrigger,
            options: ui.elements.dropdownOptions,
            selectedText: ui.elements.dropdownSelectedText
        });

        // 如果数据未加载，则加载；否则直接显示
        if (mode.state.data.length === 0) {
            await loadDataForMode(modeId);
        } else {
            displayResultsForMode(modeId, '');
        }
    }

    // --- 数据加载与处理 ---
    // 从缓存（IndexedDB）或网络加载数据
    async function loadData(config, currentName, loadingEl, storageKeyPrefix) {
        const dataPath = config[currentName];
        if (!dataPath) {
            ui.showErrorState(loadingEl, `配置中未找到 '${currentName}'。`);
            return [];
        }
        const storageKey = `${storageKeyPrefix}-${dataPath}`;

        // 优先从IndexedDB缓存中读取
        const cachedData = await db.getCache(storageKey);
        if (cachedData) return cachedData;

        // 缓存未命中，从网络获取
        try {
            ui.showLoadingState(loadingEl);
            const response = await fetch(dataPath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            await db.setCache(storageKey, data); // 存入IndexedDB缓存
            return data;
        } catch (error) {
            ui.showErrorState(loadingEl, `加载 ${currentName} 数据失败。`);
            return [];
        }
    }

    // 创建Fuse.js实例用于模糊搜索
    const createFuse = (data) => new Fuse(data, {
        keys: [
            { name: 'name', weight: 0.7 },
            { name: 'summary', weight: 0.3 },
            { name: 'examples.description', weight: 0.1 },
            { name: 'examples.code', weight: 0.1 },
            { name: 'notes', weight: 0.2 },
            { name: 'shell_type', weight: 0.1 }
        ],
        includeScore: true,
        threshold: 0.4
    });

    // 为指定模式加载数据
    async function loadDataForMode(modeId) {
        const mode = modes[modeId];
        const data = await loadData(mode.dataSource, mode.state.currentSelectionName, ui.elements.resultsList, mode.storageKeyPrefix);
        mode.state.data = data;
        mode.state.fuse = createFuse(data);
        displayResultsForMode(modeId, '');
        ui.clearDetailsView(ui.elements.detailsView, `选择一个${mode.label}以查看详细信息`);
    }

    // --- 事件监听器设置 ---
    function addEventListeners() {
        // 主题切换
        ui.elements.themeToggleButton.addEventListener('click', ui.toggleTheme);

        // 模式切换
        modeToggles.commands.addEventListener('click', () => switchMode('commands'));
        modeToggles.frameworks.addEventListener('click', () => switchMode('frameworks'));
        modeToggles.other.addEventListener('click', () => switchMode('other'));
        modeToggles.notes.addEventListener('click', () => switchMode('notes'));

        // 搜索输入框
        ui.elements.searchInput.addEventListener('input', (e) => displayResultsForMode(currentModeId, e.target.value));
        ui.elements.searchInput.addEventListener('keydown', handleKeyDown);

        // 下拉菜单触发
        ui.elements.dropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            ui.toggleDropdown(ui.elements.dropdownTrigger, ui.elements.dropdownOptions);
        });
        ui.elements.noteSetTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            ui.toggleDropdown(ui.elements.noteSetTrigger, ui.elements.noteSetOptions);
        });

        // 全局点击，用于关闭打开的下拉菜单
        document.addEventListener('click', () => {
            ui.closeAllDropdowns();
        });

        // 详情视图中的事件（如代码复制）
        ui.elements.detailsView.addEventListener('click', ui.handleCopyButtonClick);
    }

    // --- 事件处理器与显示逻辑 ---
    // 处理下拉菜单选项变更
    function handleSelectionChange(modeId, newName) {
        const mode = modes[modeId];
        mode.state.currentSelectionName = newName;
        ui.elements.searchInput.value = '';
        loadDataForMode(modeId);
    }

    // 根据查询显示搜索结果
    function displayResultsForMode(modeId, query) {
        const mode = modes[modeId];
        const results = query.trim() === '' ? mode.state.data : (mode.state.fuse?.search(query).map(r => r.item) || []);
        displayAndResetForMode(modeId, results);
    }

    // 重置状态并显示数据
    function displayAndResetForMode(modeId, data) {
        const mode = modes[modeId];
        mode.state.selectedIndex = -1; // 重置选中项
        ui.displayResults(data, (index) => {
            mode.state.selectedIndex = index;
            const items = ui.elements.resultsList.querySelectorAll('.result-item');
            ui.updateSelection(items, mode.state.selectedIndex, mode.state.data, ui.displayDetails, ui.elements.detailsView, mode.state.currentSelectionName);
        }, ui.elements.resultsList);
    }

    // 处理键盘上下键和回车键
    function handleKeyDown(event) {
        if (currentModeId === 'notes') return; // 笔记模式有自己的键盘处理
        const mode = modes[currentModeId];
        const items = ui.elements.resultsList.querySelectorAll('.result-item');

        if (!items.length || !['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
        event.preventDefault();

        if (event.key === 'ArrowDown') mode.state.selectedIndex = Math.min(mode.state.selectedIndex + 1, items.length - 1);
        if (event.key === 'ArrowUp') mode.state.selectedIndex = Math.max(mode.state.selectedIndex - 1, 0);

        ui.updateSelection(items, mode.state.selectedIndex, mode.state.data, ui.displayDetails, ui.elements.detailsView, mode.state.currentSelectionName);

        if (event.key === 'Enter' && mode.state.selectedIndex >= 0) {
            // 模拟点击以触发详情显示
            items[mode.state.selectedIndex]?.click();
        }
    }

    // --- 启动应用 ---
    initialize();
});