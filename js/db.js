// js/db.js
// A simple IndexedDB helper library
const db = (() => {
    const DB_NAME = 'CommandX_NotesDB';
    const NOTES_STORE_NAME = 'notes';
    const SET_STORE_NAME = 'noteSets';
    const CACHE_STORE_NAME = 'dataCache'; // New store for caching JSON data
    const DB_VERSION = 3; // Incremented version
    let dbInstance = null;

    async function initDB() {
        return new Promise((resolve, reject) => {
            if (dbInstance) {
                return resolve(dbInstance);
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Database error:", event.target.error);
                reject("Database error");
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const transaction = event.target.transaction;

                // --- Notes and Sets Stores (from previous versions) ---
                // Create Note Sets store if it doesn't exist
                if (!db.objectStoreNames.contains(SET_STORE_NAME)) {
                    const setStore = db.createObjectStore(SET_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    setStore.createIndex('name', 'name', { unique: true });
                }
                // Create or get Notes store
                let noteStore;
                if (!db.objectStoreNames.contains(NOTES_STORE_NAME)) {
                    noteStore = db.createObjectStore(NOTES_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                } else {
                    noteStore = transaction.objectStore(NOTES_STORE_NAME);
                }
                // Add indices if they don't exist
                if (!noteStore.indexNames.contains('setId')) {
                    noteStore.createIndex('setId', 'setId', { unique: false });
                }
                if (!noteStore.indexNames.contains('createdAt')) {
                    noteStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
                // Migration for versions before 2
                if (event.oldVersion < 2) {
                    const setStore = transaction.objectStore(SET_STORE_NAME);
                    // Add a default set on first creation
                    setStore.add({ name: '默认' }).onsuccess = (e) => {
                        const defaultSetId = e.target.result;
                        // If there were any old notes, migrate them to the default set
                        const noteStoreForMigration = transaction.objectStore(NOTES_STORE_NAME);
                        const cursorRequest = noteStoreForMigration.openCursor();
                        cursorRequest.onsuccess = (cursorEvent) => {
                            const cursor = cursorEvent.target.result;
                            if (cursor) {
                                const note = cursor.value;
                                if (!note.setId) {
                                    note.setId = defaultSetId;
                                    cursor.update(note);
                                }
                                cursor.continue();
                            }
                        };
                    };
                }

                // --- Data Cache Store (new in version 3) ---
                if (event.oldVersion < 3) {
                    if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
                        db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'id' });
                    }
                }
            };

            // This handles the case for first-time database creation as well
            request.onsuccess = async (event) => {
                dbInstance = event.target.result;

                // Ensure default set exists on first run after setup
                const tx = dbInstance.transaction(SET_STORE_NAME, 'readonly');
                const store = tx.objectStore(SET_STORE_NAME);
                const countReq = store.count();
                countReq.onsuccess = async () => {
                    if (countReq.result === 0) {
                        try {
                            await addNoteSet('默认');
                        } catch(e) {
                            // Ignore if it already exists (race condition)
                        }
                    }
                    resolve(dbInstance);
                }
                countReq.onerror = () => resolve(dbInstance); // Resolve anyway
            };
        });
    }

    async function getTransaction(storeNames, mode) {
        const db = await initDB();
        return db.transaction(storeNames, mode);
    }

    // --- Note Functions ---
    async function addNote(question, setId) {
        const transaction = await getTransaction(NOTES_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        return new Promise((resolve, reject) => {
            const note = {
                question: question,
                answer: '',
                createdAt: new Date().getTime(),
                setId: setId
            };
            const request = store.add(note);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function updateNote(note) {
        const transaction = await getTransaction(NOTES_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.put(note);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function deleteNote(id) {
        const transaction = await getTransaction(NOTES_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function getNotes(setId) {
        const transaction = await getTransaction(NOTES_STORE_NAME, 'readonly');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        const index = store.index('setId');
        return new Promise((resolve, reject) => {
            const request = index.getAll(setId);
            request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt - a.createdAt));
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function getAllNotes() {
        const transaction = await getTransaction(NOTES_STORE_NAME, 'readonly');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function getNoteById(id) {
        const transaction = await getTransaction(NOTES_STORE_NAME, 'readonly');
        const store = transaction.objectStore(NOTES_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    // --- Note Set Functions ---
    async function addNoteSet(name) {
        const transaction = await getTransaction(SET_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(SET_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.add({ name });
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function getNoteSets() {
        const transaction = await getTransaction(SET_STORE_NAME, 'readonly');
        const store = transaction.objectStore(SET_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function deleteNoteSet(setId) {
        // Cannot delete the default set (ID 1)
        if (setId === 1) {
            return Promise.reject("Cannot delete the default note set.");
        }
        const transaction = await getTransaction([NOTES_STORE_NAME, SET_STORE_NAME], 'readwrite');
        const noteStore = transaction.objectStore(NOTES_STORE_NAME);
        const setStore = transaction.objectStore(SET_STORE_NAME);
        const noteIndex = noteStore.index('setId');

        return new Promise((resolve, reject) => {
            const cursorRequest = noteIndex.openCursor(IDBKeyRange.only(setId));
            cursorRequest.onsuccess = e => {
                const cursor = e.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    setStore.delete(setId).onsuccess = resolve;
                }
            };
            cursorRequest.onerror = e => reject(e.target.error);
            transaction.onerror = e => reject(e.target.error);
        });
    }

    // --- Data Cache Functions ---
    async function getCache(id) {
        const transaction = await getTransaction(CACHE_STORE_NAME, 'readonly');
        const store = transaction.objectStore(CACHE_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            // If the item is found, return its `data` property, otherwise return null
            request.onsuccess = () => resolve(request.result ? request.result.data : null);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    async function setCache(id, data) {
        const transaction = await getTransaction(CACHE_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CACHE_STORE_NAME);
        return new Promise((resolve, reject) => {
            const request = store.put({ id, data });
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    return {
        initDB, addNote, updateNote, deleteNote, getNotes, getAllNotes, getNoteById,
        addNoteSet, getNoteSets, deleteNoteSet,
        getCache, setCache // Export new functions
    };
})();