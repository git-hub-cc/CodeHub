// js/db.js
// 一个封装了IndexedDB操作的模块

const db = (() => {
    // --- 数据库配置 ---
    const DB_NAME = 'CommandX_NotesDB';
    const NOTES_STORE_NAME = 'notes';
    const SET_STORE_NAME = 'noteSets';
    const CACHE_STORE_NAME = 'dataCache'; // 用于缓存JSON数据的对象仓库
    const DB_VERSION = 3; // 数据库版本
    let dbInstance = null; // 数据库实例的单例引用

    // --- 数据库初始化与版本升级 ---
    async function initDB() {
        return new Promise((resolve, reject) => {
            if (dbInstance) {
                return resolve(dbInstance);
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("数据库错误:", event.target.error);
                reject("数据库错误");
            };

            // 当数据库版本需要升级或首次创建时调用
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const transaction = event.target.transaction;

                // 版本 1-2: 创建笔记和笔记集相关的仓库和索引
                if (event.oldVersion < 2) {
                    if (!db.objectStoreNames.contains(SET_STORE_NAME)) {
                        const setStore = db.createObjectStore(SET_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                        setStore.createIndex('name', 'name', { unique: true });
                    }
                    if (!db.objectStoreNames.contains(NOTES_STORE_NAME)) {
                        const noteStore = db.createObjectStore(NOTES_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                        noteStore.createIndex('setId', 'setId', { unique: false });
                        noteStore.createIndex('createdAt', 'createdAt', { unique: false });
                    }
                }

                // 版本 3: 新增数据缓存仓库
                if (event.oldVersion < 3) {
                    if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
                        db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'id' });
                    }
                }
            };

            // 数据库成功打开
            request.onsuccess = async (event) => {
                dbInstance = event.target.result;

                // 确保至少存在一个"默认"笔记集
                const tx = dbInstance.transaction(SET_STORE_NAME, 'readonly');
                const store = tx.objectStore(SET_STORE_NAME);
                const countReq = store.count();
                countReq.onsuccess = async () => {
                    if (countReq.result === 0) {
                        try {
                            await addNoteSet('默认');
                        } catch(e) {
                            // 如果因竞态条件导致已存在，则忽略错误
                        }
                    }
                    resolve(dbInstance);
                }
                countReq.onerror = () => resolve(dbInstance); // 即使检查失败，也继续执行
            };
        });
    }

    // --- 通用事务工具 ---
    async function getTransaction(storeNames, mode) {
        const db = await initDB();
        return db.transaction(storeNames, mode);
    }

    // --- 笔记 (Notes) 操作 ---
    // 添加一条新笔记
    async function addNote(question, setId) {
        const transaction = await getTransaction(NOTES_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        return new Promise((resolve, reject) => {
            const note = { question, answer: '', createdAt: new Date().getTime(), setId };
            const request = store.add(note);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // 更新一条笔记
    async function updateNote(note) {
        const transaction = await getTransaction(NOTES_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.put(note);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // 删除一条笔记
    async function deleteNote(id) {
        const transaction = await getTransaction(NOTES_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // 根据笔记集ID获取所有笔记
    async function getNotes(setId) {
        const transaction = await getTransaction(NOTES_STORE_NAME, 'readonly');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        const index = store.index('setId');
        return new Promise((resolve, reject) => {
            const request = index.getAll(setId);
            request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt - a.createdAt)); // 按创建时间降序排序
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // 获取所有笔记（用于统计等）
    async function getAllNotes() {
        const transaction = await getTransaction(NOTES_STORE_NAME, 'readonly');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // 根据ID获取单条笔记
    async function getNoteById(id) {
        const transaction = await getTransaction(NOTES_STORE_NAME, 'readonly');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // --- 笔记集 (Note Sets) 操作 ---
    // 添加一个新笔记集
    async function addNoteSet(name) {
        const transaction = await getTransaction(SET_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(SET_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.add({ name });
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // 获取所有笔记集
    async function getNoteSets() {
        const transaction = await getTransaction(SET_STORE_NAME, 'readonly');
        const store = transaction.objectStore(SET_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // 删除一个笔记集及其包含的所有笔记
    async function deleteNoteSet(setId) {
        // ID为1的默认笔记集不可删除
        if (setId === 1) {
            return Promise.reject("不能删除默认笔记集。");
        }
        const transaction = await getTransaction([NOTES_STORE_NAME, SET_STORE_NAME], 'readwrite');
        const noteStore = transaction.objectStore(NOTES_STORE_NAME);
        const setStore = transaction.objectStore(SET_STORE_NAME);
        const noteIndex = noteStore.index('setId');

        return new Promise((resolve, reject) => {
            // 1. 删除该笔记集下的所有笔记
            const cursorRequest = noteIndex.openCursor(IDBKeyRange.only(setId));
            cursorRequest.onsuccess = e => {
                const cursor = e.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    // 2. 所有笔记删除完毕后，删除笔记集本身
                    setStore.delete(setId).onsuccess = resolve;
                }
            };
            cursorRequest.onerror = e => reject(e.target.error);
            transaction.onerror = e => reject(e.target.error);
        });
    }

    // --- 数据缓存 (Cache) 操作 ---
    // 根据ID获取缓存数据
    async function getCache(id) {
        const transaction = await getTransaction(CACHE_STORE_NAME, 'readonly');
        const store = transaction.objectStore(CACHE_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result ? request.result.data : null);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // 设置缓存数据
    async function setCache(id, data) {
        const transaction = await getTransaction(CACHE_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CACHE_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.put({ id, data });
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // --- 导出模块 ---
    return {
        initDB, addNote, updateNote, deleteNote, getNotes, getAllNotes, getNoteById,
        addNoteSet, getNoteSets, deleteNoteSet,
        getCache, setCache
    };
})();