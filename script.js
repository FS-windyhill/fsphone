/*
 * TeleWindy 项目代码目录结构（树状注释版）
 * 
 * ├─ 1. CONFIG & STATE (配置与状态)
 * │   ├─ CONFIG                // 全局常量配置（键名、默认值、系统提示等）
 * │   └─ STATE                 // 运行时状态（联系人、当前书、设置等）
 * │
 * ├─ 1.5. DB UTILS (IndexedDB 简易封装)
 * │   ├─ open()                // 打开数据库
 * │   ├─ get(key)              // 读取单条数据
 * │   ├─ set(key, value)       // 写入单条数据
 * │   ├─ remove(key)           // 删除单条数据
 * │   ├─ clear()               // 清空整个数据库
 * │   └─ exportAll()           // 导出所有数据（使用游标遍历）
 * │
 * ├─ 2. STORAGE SERVICE (本地持久化 - IndexedDB 版)
 * │   ├─ load()                // 初始化加载（设置、联系人、世界书，含数据迁移）
 * │   ├─ saveContacts()        // 保存联系人
 * │   ├─ saveSettings()        // 保存设置
 * │   ├─ saveWorldInfo()       // 保存世界书
 * │   ├─ exportAllForBackup()  // 导出备份（含 Token 加密）
 * │   └─ importFromBackup(data)// 导入备份（含 Token 解密）
 * │
 * ├─ 3. WORLD INFO ENGINE (世界书引擎)
 * │   ├─ importFromST(jsonString, fileName) // 从 SillyTavern 格式导入书
 * │   ├─ exportToST(book)      // 导出为 SillyTavern 兼容格式
 * │   └─ scan(userText, history, currentContactId, currentContactName)
 * │                            // 扫描触发世界书条目并返回注入提示
 * │
 * ├─ 4. API SERVICE (LLM 通信)
 * │   ├─ getProvider(url)      // 判断 API 提供商（openai/claude/gemini）
 * │   ├─ fetchModels(url, key) // 拉取模型列表
 * │   └─ chat(messages, settings) // 发送聊天请求（兼容多种接口）
 * │
 * ├─ 5. CLOUD SYNC (云同步 - Gist 与自定义服务器混合版)
 * │   ├─ init()                // 初始化 UI 与恢复上次模式
 * │   ├─ toggleMode()          // 切换同步方式（Gist / 自定义）
 * │   ├─ showStatus(msg, isError) // 显示同步状态
 * │   ├─ getAuth()             // 获取 Token/密码（带兼容旧加密）
 * │   ├─ _maskToken() / _unmaskToken() // Token 混淆/反混淆（防泄露）
 * │   ├─ _preparePayload()     // 准备上传数据（含 Token 混淆）
 * │   ├─ updateBackup()        // 主入口：根据模式选择上传
 * │   ├─ findBackup()          // 自动查找 GitHub 上已有备份
 * │   ├─ restoreBackup()       // 恢复备份
 * │   ├─ _safeRestore(data)    // 安全恢复（防空间不足）
 * │   ├─ _uploadToCustom()     // 自定义服务器上传
 * │   ├─ _fetchFromCustom()    // 自定义服务器下载
 * │   ├─ _uploadToGist()       // Gist 上传（创建或更新）
 * │   └─ _fetchFromGist()      // Gist 下载
 * │
 * ├─ 6. UI RENDERER (DOM 操作与渲染)
 * │   ├─ init()                // 初始化外观与联系人列表
 * │   ├─ applyAppearance()     // 应用主题与壁纸
 * │   ├─ toggleTheme(newTheme) // 切换日夜模式
 * │   ├─ switchView(viewName)  // 切换列表/聊天视图
 * │   ├─ renderContacts()      // 渲染联系人列表
 * │   ├─ renderBookSelect()    // 渲染世界书下拉框
 * │   ├─ updateCurrentBookSettingsUI() // 更新当前书绑定角色 UI
 * │   ├─ renderWorldInfoList() // 渲染世界书条目列表（显示 comment）
 * │   ├─ initWorldInfoTab()    // 初始化世界书 Tab
 * │   ├─ createSingleBubble(...) // 创建单个消息气泡
 * │   ├─ renderChatHistory(contact) // 渲染完整聊天记录（带消息分组）
 * │   ├─ appendMessageBubble(...) // 追加单条气泡（支持分组）
 * │   ├─ removeLatestAiBubbles() // 删除最近 AI 消息（用于 reroll）
 * │   ├─ scrollToBottom()      // 滚动到底部
 * │   ├─ setLoading(isLoading) // 设置“正在输入”状态
 * │   ├─ updateRerollState(contact) // 更新 reroll 按钮状态
 * │   ├─ playWaterfall(fullText, avatar, timestamp) // 瀑布流显示 AI 回复
 * │   └─ renderPresetMenu()    // 渲染 API 预设下拉菜单
 * │
 * ├─ 7. APP CONTROLLER (主业务逻辑)
 * │   ├─ init()                // 应用启动入口（加载数据 → 初始化 UI → 绑定事件）
 * │   ├─ enterChat(id)         // 进入聊天界面
 * │   ├─ handleSend(isReroll)  // 发送消息 / 重滚
 * │   ├─ openSettings()        // 打开主设置弹窗
 * │   ├─ switchWorldInfoBook(bookId) // 切换当前世界书
 * │   ├─ bindCurrentBookToChar(charId) // 绑定当前书到角色
 * │   ├─ loadWorldInfoEntry(uid) // 加载条目到编辑区
 * │   ├─ saveWorldInfoEntry()  // 保存世界书条目
 * │   ├─ deleteWorldInfoEntry() // 删除条目
 * │   ├─ clearWorldInfoEditor() // 清空编辑区
 * │   ├─ createNewBook()       // 新建世界书
 * │   ├─ renameCurrentBook()   // 重命名当前书
 * │   ├─ deleteCurrentBook()   // 删除当前书
 * │   ├─ exportCurrentBook()   // 导出当前书
 * │   ├─ handleImportWorldInfo(file) // 导入世界书
 * │   ├─ handleSavePreset()    // 保存 API 预设
 * │   ├─ handleLoadPreset(index) // 加载 API 预设
 * │   ├─ handleDeletePreset()  // 删除 API 预设
 * │   ├─ saveSettingsFromUI()  // 从设置弹窗保存配置
 * │   ├─ handleMessageAction(action) // 长按菜单：复制/编辑/删除消息
 * │   ├─ showMessageContextMenu(...) // 显示长按上下文菜单
 * │   ├─ hideMessageContextMenu() // 隐藏上下文菜单
 * │   ├─ bindEvents()          // 绑定所有 DOM 事件（按钮、输入、长按等）
 * │   ├─ readFile(file)        // 读取文件为 base64
 * │   ├─ fetchModelsForUI()    // UI 中拉取模型列表
 * │   ├─ bindImageUpload(...)  // 绑定图片上传逻辑
 * │   ├─ openEditModal(id)     // 打开角色编辑弹窗
 * │   └─ saveContactFromModal() // 保存角色信息
 * │
 * └─ 8. UTILS & EXPORTS (工具函数与全局导出)
 *     ├─ formatTimestamp()     // 格式化时间戳
 *     ├─ window.exportData()   // 全局导出备份函数
 *     └─ window.importData(input) // 全局导入备份函数
 * 
 * 启动入口：window.onload = () => App.init();
 */


// =========================================
// 1. CONFIG & STATE (配置与状态)
// =========================================

const CONFIG = {
    STORAGE_KEY: 'teleWindy_char_data_v1',
    SETTINGS_KEY: 'teleWindy_settings_v1', 
    WORLD_INFO_KEY: 'teleWindy_world_info_v2', // ★★★ Key升级到v2以示区别
    GIST_ID_KEY: 'telewindy-gist-id',
    DEFAULT: {
        API_URL: 'https://api.siliconflow.cn/v1/chat/completions',
        MODEL: 'zai-org/GLM-4.6',
        API_KEY: '', 
        WALLPAPER: 'wallpaper.jpg',
        USER_AVATAR: 'user.jpg',
        GIST_TOKEN: '',
        THEME: 'light',
        API_PRESETS: [] 
    },
    SYSTEM_PROMPT: `
请完全代入角色设定，以该角色的语气和思考方式，与用户交流。
这里是线上聊天。
每次输出若干句话，每两句话中间空一行。自由回答，不必拘束。
重要：输出时，顺其自然代入情境即可，无需使用<think>模式，以节省算力，助力节能。
无需输出时间戳。
`
};

// 运行时状态
const STATE = {
    contacts: [],
    worldInfoBooks: [], // ★★★ 改名：这里存放“书”的数组
    currentContactId: null,
    currentBookId: null, // ★★★ 新增：当前正在编辑哪本书
    settings: {}, 
    isTyping: false
};

// =========================================
// 1.5. DB UTILS (IndexedDB 简易封装)
// =========================================
const DB = {
    dbName: 'TeleWindyDB',
    storeName: 'store',
    version: 1,
    
    open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async get(key) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    async set(key, value) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const req = store.put(value, key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },

    async remove(key) {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const req = store.delete(key);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },
    
    async clear() {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },

    // 导出所有数据用于备份 (修复版：使用游标一次性读取)
    async exportAll() {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            // 打开游标遍历所有数据
            const request = store.openCursor();
            
            const data = {};

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    // cursor.key 是键名 (如 'contacts')
                    // cursor.value 是存的数据 (如 [...数组])
                    data[cursor.key] = cursor.value; 
                    cursor.continue(); // 继续读下一条
                } else {
                    // 游标为空说明读完了，此时 data 已经装满了
                    resolve(data); 
                }
            };
            
            request.onerror = (e) => reject(e.target.error);
        });
    }
    
};
// =========================================
// 2. STORAGE SERVICE (本地持久化 - IndexedDB 版)
// =========================================
const Storage = {
    // 初始化/加载数据
    async load() {
        // ------------------------------------------------
        // 1. 加载设置 (Settings)
        // ------------------------------------------------
        // 优先从 IDB 读取
        let loadedSettings = await DB.get(CONFIG.SETTINGS_KEY);

        // [数据迁移]: 如果 IDB 为空，尝试从 LocalStorage 读取旧数据
        if (!loadedSettings) {
            const lsSettings = localStorage.getItem(CONFIG.SETTINGS_KEY);
            if (lsSettings) {
                try { loadedSettings = JSON.parse(lsSettings); } catch (e) {}
            }
        }
        loadedSettings = loadedSettings || {};

        // 兼容旧版 Theme (检查 LocalStorage，因为这是历史遗留位置)
        const legacyTheme = localStorage.getItem('appTheme');
        if (legacyTheme) {
            loadedSettings.THEME = legacyTheme;
            localStorage.removeItem('appTheme');
        }

        STATE.settings = { ...CONFIG.DEFAULT, ...loadedSettings };
        if (!Array.isArray(STATE.settings.API_PRESETS)) {
            STATE.settings.API_PRESETS = [];
        }

        // 兼容旧头像壁纸 (同样检查 LocalStorage)
        // 注意：一旦保存过一次新版，这些旧数据其实就不需要了，但为了安全保留检查
        if (Object.keys(loadedSettings).length === 0) {
            const oldUserAvatar = localStorage.getItem('fs_user_avatar');
            const oldWallpaper = localStorage.getItem('fs_wallpaper');
            if (oldUserAvatar) STATE.settings.USER_AVATAR = oldUserAvatar;
            if (oldWallpaper) STATE.settings.WALLPAPER = oldWallpaper;
        }

        // ------------------------------------------------
        // 2. 加载联系人 (Contacts)
        // ------------------------------------------------
        let contactsData = await DB.get(CONFIG.STORAGE_KEY);
        
        // [数据迁移]: IDB 无数据，尝试读取 LS
        if (!contactsData) {
            const lsContacts = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (lsContacts) {
                try { contactsData = JSON.parse(lsContacts); } catch (e) {}
            }
        }

        if (Array.isArray(contactsData)) {
            STATE.contacts = contactsData;
        } else {
            STATE.contacts = [];
        }

        // 兜底默认联系人
        if (STATE.contacts.length === 0) {
            STATE.contacts.push({
                id: Date.now().toString(),
                name: '小真蛸',
                avatar: '😊',
                prompt: '你是一个温柔可爱的助手小真蛸，说话请带上颜文字。',
                history: []
            });
        }

        // ------------------------------------------------
        // 3. ★★★ 加载世界书 (World Info)
        // ------------------------------------------------
        let wiData = await DB.get(CONFIG.WORLD_INFO_KEY);

        // [数据迁移]: IDB 无数据，尝试读取 LS 的 V2 数据
        if (!wiData) {
            const lsWiV2 = localStorage.getItem(CONFIG.WORLD_INFO_KEY);
            if (lsWiV2) {
                try { wiData = JSON.parse(lsWiV2); } catch (e) {}
            }
        }

        if (wiData) {
            STATE.worldInfoBooks = wiData;
        } else {
            // [旧版迁移]: 检查 LS 中的 V1 数据 (散乱条目)
            const wiRawV1 = localStorage.getItem('teleWindy_world_info_v1');
            STATE.worldInfoBooks = [];
            
            if (wiRawV1) {
                try {
                    const oldEntries = JSON.parse(wiRawV1);
                    if (Array.isArray(oldEntries) && oldEntries.length > 0) {
                        console.log("Detecting old WI format in LS, migrating to DB...");
                        const defaultBook = {
                            id: 'book_default_' + Date.now(),
                            name: '默认世界书 (旧数据迁移)',
                            characterId: '', 
                            entries: oldEntries
                        };
                        STATE.worldInfoBooks.push(defaultBook);
                        // 立即保存到 IDB 以完成迁移
                        await this.saveWorldInfo();
                    }
                } catch (e) {
                    console.error("Migration failed", e);
                }
            }
        }

        // 确保至少有一本书
        if (STATE.worldInfoBooks.length === 0) {
            STATE.worldInfoBooks.push({
                id: 'book_' + Date.now(),
                name: '新建世界书',
                characterId: '',
                entries: []
            });
        }
        
        // 默认选中第一本
        STATE.currentBookId = STATE.worldInfoBooks[0].id;
        
        console.log('Storage loaded via IndexedDB.');
    },

    // 保存联系人
    async saveContacts() {
        // IndexedDB 可以直接存对象，不需要 JSON.stringify
        await DB.set(CONFIG.STORAGE_KEY, STATE.contacts);
    },

    // 保存设置
    async saveSettings() {
        await DB.set(CONFIG.SETTINGS_KEY, STATE.settings);
    },

    // 保存世界书
    async saveWorldInfo() {
        await DB.set(CONFIG.WORLD_INFO_KEY, STATE.worldInfoBooks);
    },
    
    // 导出备份逻辑 (改为从 DB 获取)
    async exportAllForBackup() {
        // 1. 获取 DB 中所有数据
        const data = await DB.exportAll(); // 使用 1.5 中定义的 exportAll

        // 2. 特殊处理：Token 加密 (为了安全)
        if (data[CONFIG.SETTINGS_KEY]) {
            // 注意：从 DB 拿出来的是对象，不是字符串
            let settings = data[CONFIG.SETTINGS_KEY]; 
            
            // 为了不修改原始对象引用，我们浅拷贝一份
            const safeSettings = { ...settings };

            if (safeSettings.GIST_TOKEN && !safeSettings.GIST_TOKEN.startsWith('ENC_')) {
                safeSettings.GIST_TOKEN = 'ENC_' + btoa(safeSettings.GIST_TOKEN);
                // 替换掉原数据中的设置对象
                data[CONFIG.SETTINGS_KEY] = safeSettings;
            }
        }
        
        // 3. (可选) 导出时将对象转为 JSON 字符串，方便保存为文件
        // 如果你的 import 逻辑 期望的是 value 为字符串，这里需要 stringify
        // 通常为了保持原来的行为一致性，我们在这里把对象转回字符串给下载文件用
        const exportData = {};
        for (const [key, val] of Object.entries(data)) {
            exportData[key] = (typeof val === 'object') ? JSON.stringify(val) : val;
        }

        return exportData;
    },

    // 导入备份逻辑
    async importFromBackup(data) {
        // 1. 清空当前数据库
        await DB.clear();
        
        // 2. 遍历导入
        const promises = Object.keys(data).map(async (key) => {
            let value = data[key];
            
            // 尝试解析 JSON 字符串回对象 (因为 export 时我们转成了字符串)
            try {
                if (typeof value === 'string') {
                    value = JSON.parse(value);
                }
            } catch (e) {
                // 如果不是 JSON，保持原样
            }

            // 解密 Token
            if (key === CONFIG.SETTINGS_KEY && value && typeof value === 'object') {
                if (value.GIST_TOKEN && value.GIST_TOKEN.startsWith('ENC_')) {
                    try {
                        value.GIST_TOKEN = atob(value.GIST_TOKEN.replace('ENC_', ''));
                    } catch (e) { console.error('Token decrypt failed', e); }
                }
            }
            
            // 写入 DB
            await DB.set(key, value);
        });

        await Promise.all(promises);
        console.log('Import finished.');
    }
};

// =========================================
// 3. WORLD INFO ENGINE (已修正)
// =========================================
const WorldInfoEngine = {
    // 1. 导入逻辑：增加对 ST 各种怪异格式的兼容
    importFromST(jsonString, fileName) {
        try {
            const data = JSON.parse(jsonString);
            const entriesObj = data.entries || {}; 
            const newEntries = [];

            // 既支持数组格式，也支持对象格式 {"0":{}, "1":{}}
            const entriesList = Array.isArray(entriesObj) ? entriesObj : Object.values(entriesObj);

            entriesList.forEach(entry => {
                // 修正：ST 的 key 可能是 "a,b,c" 字符串，也可能是 ["a","b"] 数组
                let safeKeys = [];
                if (Array.isArray(entry.key)) {
                    safeKeys = entry.key;
                } else if (typeof entry.key === 'string') {
                    safeKeys = entry.key.split(',').map(k => k.trim()).filter(k => k);
                }

                // 修正：如果导入时没有 comment，尝试用第一个关键词代替，还没有就叫“未命名”
                let safeComment = entry.comment || '';
                if (!safeComment && safeKeys.length > 0) safeComment = safeKeys[0];
                if (!safeComment) safeComment = '未命名条目';

                newEntries.push({
                    uid: Date.now() + Math.random().toString(36).substr(2, 9),
                    keys: safeKeys, 
                    content: entry.content || '',
                    constant: !!entry.constant, 
                    // ★★★ 核心：确保这里读到了名字
                    comment: safeComment 
                });
            });
            
            const bookName = fileName ? fileName.replace(/\.[^/.]+$/, "") : ('导入书 ' + new Date().toLocaleTimeString());
            
            return {
                id: 'book_' + Date.now() + Math.random().toString(36).substr(2, 5),
                name: bookName,
                characterId: '', 
                entries: newEntries
            };

        } catch (e) {
            console.error("Import Failed:", e);
            alert("导入失败：请确认是有效的 JSON 文件");
            throw e;
        }
    },

    // 2. 导出逻辑：确保 comment 被写回 JSON
    exportToST(book) {
        if (!book) return "{}";
        
        const exportObj = { entries: {} };
        book.entries.forEach((entry, index) => {
            // 使用 index 作为 key，符合 ST 标准
            exportObj.entries[index] = {
                uid: index, 
                key: entry.keys,
                // ★★★ 核心：导出时要把名字写回去
                comment: entry.comment || entry.keys[0] || "未命名",
                content: entry.content,
                constant: entry.constant,
                selective: true,
                order: 100,
                position: 0,
                disable: false,
                excludeRecursion: false,
                probability: 100,
                useProbability: true
            };
        });
        
        return JSON.stringify(exportObj, null, 2);
    },

    // 3. 扫描逻辑 (保持你修改后的版本，这部分没问题)
    scan(userText, history, currentContactId, currentContactName) {
        if (!STATE.worldInfoBooks || STATE.worldInfoBooks.length === 0) return null;
        const relevantHistory = history.slice(-2); 
        const contextText = (userText + '\n' + relevantHistory.map(m => m.content).join('\n')).toLowerCase();
        const triggeredContent = [];

        STATE.worldInfoBooks.forEach(book => {
            const isGlobalBook = !book.characterId || book.characterId === "";
            const isBoundBook = book.characterId === currentContactId;
            if (!isGlobalBook && !isBoundBook) return;

            book.entries.forEach(entry => {
                let triggered = false;
                if (entry.constant) {
                    triggered = true;
                } else if (entry.keys && Array.isArray(entry.keys)) {
                    triggered = entry.keys.some(k => {
                        const keyLower = k.toLowerCase().trim();
                        return keyLower && contextText.includes(keyLower);
                    });
                }
                if (triggered && entry.content) {
                    let finalContent = entry.content
                        .replace(/\{\{user\}\}/gi, '用户') 
                        .replace(/\{\{char\}\}/gi, currentContactName || '角色');
                    triggeredContent.push(finalContent);
                }
            });
        });

        if (triggeredContent.length === 0) return null;
        return triggeredContent.join('\n\n');
    }
};


// =========================================
// 4. API SERVICE (LLM通信)
// =========================================
const API = {
    getProvider(url) {
        if (url.includes('anthropic')) return 'claude';
        if (url.includes('googleapis')) return 'gemini';
        return 'openai'; 
    },

    async fetchModels(url, key) {
        const modelsUrl = url.replace(/\/chat\/completions$/, '/models');
        const res = await fetch(modelsUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${key}` }
        });
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return await res.json();
    },

    async chat(messages, settings) {
        const { API_URL, API_KEY, MODEL } = settings;
        const provider = this.getProvider(API_URL);
        
        let fetchUrl = API_URL;
        let options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
        const sysPrompts = messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');

        // 构建请求体
        if (provider === 'claude') {
            options.headers['x-api-key'] = API_KEY;
            options.headers['anthropic-version'] = '2023-06-01';
            options.body = JSON.stringify({
                model: MODEL,
                system: sysPrompts,
                messages: [{ role: "user", content: lastUserMsg }],
                max_tokens: 10000,
                temperature: 1.1
            });
        } else if (provider === 'gemini') {
            fetchUrl = API_URL.endsWith(':generateContent') ? API_URL : `${API_URL}/${MODEL}:generateContent?key=${API_KEY}`;
            options.body = JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: lastUserMsg }] }],
                system_instruction: { parts: [{ text: sysPrompts }] },
                generationConfig: { temperature: 1.1, maxOutputTokens: 10000 }
            });
        } else {
            // OpenAI Standard (SiliconFlow, DeepSeek, etc.)
            options.headers['Authorization'] = `Bearer ${API_KEY}`;
            options.body = JSON.stringify({
                model: MODEL,
                messages: messages,
                temperature: 1.1,
                max_tokens: 10000
            });
        }

        console.log(`[${provider}] Sending...`, JSON.parse(options.body));

        const response = await fetch(fetchUrl, options);
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }
        
        const data = await response.json();
        
        if (provider === 'claude') return data.content[0].text.trim();
        if (provider === 'gemini') return data.candidates[0].content.parts[0].text.trim();
        return data.choices[0].message.content.trim();
    }
};

// =========================================
// 5. CLOUD SYNC (终极混合版 - 含安全防御)
// =========================================
const CloudSync = {
    els: {
        provider: document.getElementById('sync-provider'),
        urlInput: document.getElementById('custom-url'),
        gistIdInput: document.getElementById('gist-id-input'),
        token: document.getElementById('gist-token'), // 这里填密码/Token
        status: document.getElementById('gist-status'),
        groupUrl: document.getElementById('group-custom-url'),
        groupGistId: document.getElementById('group-gist-id'),
        authLabel: document.getElementById('auth-label')
    },

    init() {
        // 恢复上次的选择
        const savedMode = localStorage.getItem('SYNC_MODE') || 'custom';
        if(this.els.provider) this.els.provider.value = savedMode;

        const savedUrl = localStorage.getItem('SYNC_CUSTOM_URL');
        if(savedUrl && this.els.urlInput) this.els.urlInput.value = savedUrl;

        const savedGistId = localStorage.getItem(CONFIG.GIST_ID_KEY);
        if(savedGistId && this.els.gistIdInput) this.els.gistIdInput.value = savedGistId;

        this.toggleMode();
    },

    toggleMode() {
        const mode = this.els.provider.value;
        localStorage.setItem('SYNC_MODE', mode);

        if (mode === 'custom') {
            this.els.groupUrl.style.display = 'flex';
            this.els.groupGistId.style.display = 'none';
            this.els.authLabel.textContent = '服务器访问密码 (Secret Key)';
        } else {
            this.els.groupUrl.style.display = 'none';
            this.els.groupGistId.style.display = 'flex';
            this.els.authLabel.textContent = 'GitHub Token';
        }
    },

    showStatus(msg, isError = false) {
        if(!this.els.status) return;
        this.els.status.textContent = msg;
        this.els.status.style.color = isError ? '#f92f2fff' : '#3ec444ff';
    },

    getAuth() {
        // 1. 优先读取输入框里当前填写的密码
        let val = this.els.token ? this.els.token.value.trim() : '';

        // 2. 如果输入框是空的，再去读取之前保存的设置
        if (!val) {
            val = STATE.settings.GIST_TOKEN || '';
        }

        // 3. 还是空的？那就报错
        if (!val) {
            this.showStatus('请填写访问密码 (Secret Key)', true);
            return null;
        }
        
        // --- 兼容旧版加密 Token (保持不变) ---
        if (val.startsWith('ENC_')) {
            try { val = atob(val.slice(4)); } catch (e) { return null; }
        }
        return val;
    },

    // --- 逻辑补充：混淆工具 (防GitHub扫描) ---
    _maskToken(token) {
        if (!token) return token;
        try { return btoa(token.split('').reverse().join('')); } catch (e) { return token; }
    },

    _unmaskToken(maskedToken) {
        if (!maskedToken) return maskedToken;
        if (maskedToken.startsWith('ghp_') || maskedToken.startsWith('github_pat_')) return maskedToken;
        try { return atob(maskedToken).split('').reverse().join(''); } catch (e) { return maskedToken; }
    },
    // ---------------------------------------

    // 辅助：准备上传的数据
    async _preparePayload() {
        const originalData = await Storage.exportAllForBackup();
        const dataToUpload = JSON.parse(JSON.stringify(originalData));

        // 如果设置里存了 Token/密码，先混淆它，防止明文泄露
        if (dataToUpload.settings && dataToUpload.settings.GIST_TOKEN) {
            dataToUpload.settings.GIST_TOKEN = this._maskToken(dataToUpload.settings.GIST_TOKEN);
        }

        return {
            backup_at: new Date().toISOString(),
            app: "TeleWindy",
            data: dataToUpload
        };
    },

    // --- 主入口 ---
    async updateBackup() {
        const mode = this.els.provider.value;
        if (mode === 'custom') await this._uploadToCustom();
        else await this._uploadToGist();
    },

    // ==========================================
    // 🔍 伟大的自动查找功能 (Gist 专用)
    // ==========================================
    async findBackup() {
        // 1. 获取 Token (复用现有的安全获取逻辑)
        const token = this.getAuth();
        if (!token) return; // 如果没填 Token，getAuth 会自动提示

        this.showStatus('🔍 正在去 GitHub 翻箱倒柜...');
        
        try {
            // 2. 请求 Gist 列表
            const res = await fetch('https://api.github.com/gists', {
                headers: { Authorization: `token ${token}` }
            });
            
            if (!res.ok) throw new Error(`连接 GitHub 失败 (${res.status})`);

            const gists = await res.json();
            
            // 3. 匹配描述 (这是识别是不是 TeleWindy 备份的关键)
            const backup = gists.find(g => g.description === "TeleWindy 聊天记录与配置自动备份");

            if (backup) {
                // 4. 找到了！填入 ID 并保存
                this.els.gistIdInput.value = backup.id;
                localStorage.setItem(CONFIG.GIST_ID_KEY, backup.id);
                this.showStatus(`✅ 找到啦！ID: ${backup.id.slice(0, 8)}...`);
            } else {
                // 5. 没找到
                this.showStatus('⚠️ 没找到名为 "TeleWindy..." 的备份', true);
            }
        } catch (e) {
            this.showStatus('❌ 查找出错: ' + e.message, true);
        }
    },

    async restoreBackup() {
        // 恢复前先尝试获取密码，避免空密码去请求
        const auth = this.getAuth();
        if(!auth) return;

        const mode = this.els.provider.value;
        let backupDataJSON = null;

        try {
            if (mode === 'custom') {
                backupDataJSON = await this._fetchFromCustom(auth);
            } else {
                backupDataJSON = await this._fetchFromGist(auth);
            }

            if (backupDataJSON && backupDataJSON.data) {
                this._safeRestore(backupDataJSON.data);
            } else {
                throw new Error('数据格式不正确');
            }
        } catch (e) {
            this.showStatus('恢复出错: ' + e.message, true);
        }
    },

    // --- 逻辑补充：安全恢复 (防内存溢出) ---
    async _safeRestore(data) {
        // 1. 解密配置里的 Token
        if (data.settings && data.settings.GIST_TOKEN) {
            data.settings.GIST_TOKEN = this._unmaskToken(data.settings.GIST_TOKEN);
        }

        // 2. 临时备份关键设置 (因为下面要清空 LocalStorage)
        const savedMode = localStorage.getItem('SYNC_MODE');
        const savedUrl = localStorage.getItem('SYNC_CUSTOM_URL');
        const savedGistId = localStorage.getItem(CONFIG.GIST_ID_KEY);

        try {
            console.log('执行清空策略...');
            // localStorage.clear(); // 不再需要清空 LocalStorage (除非你想删配置)

            // 3. 恢复关键设置 (否则刷新页面后就忘了连哪里了)
            if(savedMode) localStorage.setItem('SYNC_MODE', savedMode);
            if(savedUrl) localStorage.setItem('SYNC_CUSTOM_URL', savedUrl);
            if(savedGistId) localStorage.setItem(CONFIG.GIST_ID_KEY, savedGistId);

            // 4. 写入数据
            await Storage.importFromBackup(data);
            
            this.showStatus('恢复成功！3秒后刷新');
            setTimeout(() => location.reload(), 3000);

        } catch (e) {
            console.error(e);
            if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
                alert('❌ 空间不足：即使清空了本地数据，备份文件依然太大，无法写入手机浏览器。');
            } else {
                alert('恢复时发生未知错误: ' + e.message);
            }
        }
    },

    // ==========================================
    // 具体的网络请求逻辑
    // ==========================================
    
    // 1. 自定义服务器上传
    async _uploadToCustom() {
        const password = this.getAuth();
        const url = this.els.urlInput.value.trim();
        if (!url) return this.showStatus('请输入服务器地址', true);

        localStorage.setItem('SYNC_CUSTOM_URL', url);
        this.showStatus('正在上传到私有云...');

        const payload = await this._preparePayload(); // 使用混淆过的数据

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${password}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) this.showStatus('私有云同步成功！' + new Date().toLocaleTimeString());
            else throw new Error((await res.json()).error || '上传失败');
        } catch (e) {
            this.showStatus(e.message, true);
        }
    },

    // 2. 自定义服务器下载
    async _fetchFromCustom(password) {
        const url = this.els.urlInput.value.trim();
        this.showStatus('正在从私有云拉取...');
        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${password}` }
        });
        if (!res.ok) throw new Error('拉取失败');
        return await res.json();
    },

    // 3. Gist 上传
    async _uploadToGist() {
        const token = this.getAuth();
        const gistId = this.els.gistIdInput.value.trim();
        this.showStatus('正在连接 GitHub...');

        const contentData = await this._preparePayload(); // 使用混淆过的数据
        const payload = {
            description: "TeleWindy Backup", 
            files: { "telewindy-backup.json": { content: JSON.stringify(contentData) } }
        };

        let url = 'https://api.github.com/gists';
        let method = 'POST';
        if (gistId) { url += `/${gistId}`; method = 'PATCH'; }

        try {
            const res = await fetch(url, {
                method: method,
                headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const json = await res.json();
                if (json.id) {
                    this.els.gistIdInput.value = json.id;
                    localStorage.setItem(CONFIG.GIST_ID_KEY, json.id);
                }
                this.showStatus('GitHub 同步成功！');
            } else throw new Error('Gist 请求失败');
        } catch (e) {
            this.showStatus(e.message, true);
        }
    },

    // 4. Gist 下载
    async _fetchFromGist(token) {
        const gistId = this.els.gistIdInput.value.trim();
        if (!gistId) throw new Error('需填写 Gist ID');
        
        this.showStatus('正在从 GitHub 拉取...');
        const res = await fetch(`https://api.github.com/gists/${gistId}`, { 
            headers: { Authorization: `token ${token}` }
        });
        if (!res.ok) throw new Error('Gist 未找到');

        const json = await res.json();
        const file = json.files['telewindy-backup.json'];
        
        let content = file.content;
        if (file.truncated) content = await (await fetch(file.raw_url)).text();
        
        return JSON.parse(content);
    }
};

// 启动初始化
setTimeout(() => CloudSync.init(), 500);


// =========================================
// 6. UI RENDERER (DOM 操作)
// =========================================
const UI = {
    els: {
        viewList: document.getElementById('view-contact-list'),
        viewChat: document.getElementById('view-chat'),
        contactContainer: document.getElementById('contact-list-container'),
        chatMsgs: document.getElementById('chat-messages'),
        chatTitle: document.getElementById('chat-title'),
        status: document.getElementById('typing-status'),
        input: document.getElementById('task-input'),
        sendBtn: document.getElementById('send-button'),
        rerollBtn: document.getElementById('reroll-footer-btn'),
        modalOverlay: document.getElementById('modal-overlay'),
        mainModal: document.getElementById('main-modal'), 
        
        // World Info Elements
        wiModal: document.getElementById('world-info-modal'),
        wiList: document.getElementById('wi-list-container'),
        wiBookSelect: document.getElementById('wi-book-select'), // ★★★ 新增：大分类选择
        wiBookCharSelect: document.getElementById('wi-book-char-select'), // ★★★ 新增：大分类绑定角色
        
        settingUrl: document.getElementById('custom-api-url'),
        settingKey: document.getElementById('custom-api-key'),
        settingModel: document.getElementById('custom-model-select'),
        fetchBtn: document.getElementById('fetch-models-btn'),
        themeLight: document.getElementById('theme-light'),
        themeDark: document.getElementById('theme-dark')
    },

    init() {
        this.applyAppearance();
        this.renderContacts();
        CloudSync.init();
    },

    applyAppearance() {
        const { WALLPAPER, THEME } = STATE.settings;
        document.body.style.backgroundImage = `url('${WALLPAPER}')`;
        if (WALLPAPER === 'wallpaper.jpg' && THEME !== 'dark') {
            document.body.style.backgroundColor = '#f2f2f2';
        }
        if (THEME === 'dark') {
            document.body.classList.add('dark-mode');
            if(this.els.themeDark) this.els.themeDark.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            if(this.els.themeLight) this.els.themeLight.checked = true;
        }
    },

    async toggleTheme(newTheme) {
        STATE.settings.THEME = newTheme;
        await Storage.saveSettings();
        this.applyAppearance();
    },

    switchView(viewName) {
        if (viewName === 'chat') {
            this.els.viewList.classList.add('hidden');
            this.els.viewChat.classList.remove('hidden');
        } else {
            this.els.viewChat.classList.add('hidden');
            this.els.viewList.classList.remove('hidden');
            STATE.currentContactId = null;
            this.renderContacts(); 
        }
    },

    renderContacts() {
        if(!this.els.contactContainer) return;
        this.els.contactContainer.innerHTML = '';
        STATE.contacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'contact-item';
            
            let avatarHtml = `<div class="contact-avatar">${c.avatar || '🌼'}</div>`;
            if (c.avatar.startsWith('data:') || c.avatar.startsWith('http')) {
                avatarHtml = `<img src="${c.avatar}" class="contact-avatar" onerror="this.style.display='none'">`;
            }

            let lastMsg = "暂无消息";
            const validMsgs = c.history.filter(m => m.role !== 'system');
            if (validMsgs.length > 0) {
                const content = validMsgs[validMsgs.length - 1].content;
                lastMsg = content.length > 30 ? content.slice(0, 30) + '…' : content;
            }

            item.innerHTML = `
                ${avatarHtml}
                <div class="contact-info">
                    <h3>${c.name}</h3>
                    <p>${lastMsg}</p>
                </div>
            `;
            item.onclick = () => App.enterChat(c.id);
            this.els.contactContainer.appendChild(item);
        });
    },

    // ★★★ 渲染世界书：大分类下拉框 ★★★
    renderBookSelect() {
        if (!this.els.wiBookSelect) return;
        this.els.wiBookSelect.innerHTML = '';
        STATE.worldInfoBooks.forEach(book => {
            const opt = document.createElement('option');
            opt.value = book.id;
            opt.innerText = book.name;
            this.els.wiBookSelect.appendChild(opt);
        });
        this.els.wiBookSelect.value = STATE.currentBookId;
        
        // 更新当前书的全局绑定状态
        this.updateCurrentBookSettingsUI();
    },

    updateCurrentBookSettingsUI() {
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (book && this.els.wiBookCharSelect) {
            this.els.wiBookCharSelect.value = book.characterId || "";
        }
    },

    // ★★★ 渲染世界书：条目列表（修复显示版）★★★
    renderWorldInfoList() {
        const container = this.els.wiList;
        if (!container) return;
        container.innerHTML = '';

        const currentBook = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!currentBook) return;

        currentBook.entries.forEach((entry, index) => {
            const item = document.createElement('div');
            item.style.padding = '8px';
            item.style.borderBottom = '1px solid #eee';
            item.style.cursor = 'pointer';
            item.style.fontSize = '14px';
            item.style.whiteSpace = 'nowrap';      // 防止文字换行太丑
            item.style.overflow = 'hidden';        // 超出隐藏
            item.style.textOverflow = 'ellipsis';  // 显示省略号
            
            // 高亮当前选中的条目
            const currentEditingUid = document.getElementById('wi-edit-uid') ? document.getElementById('wi-edit-uid').value : null;
            if (entry.uid === currentEditingUid) {
                item.style.backgroundColor = 'rgba(0,0,0,0.05)';
                item.style.fontWeight = 'bold';
            }

            // ★★★ 核心显示逻辑 ★★★
            // 1. 优先显示 comment (名字)
            // 2. 没有名字显示第一个 Key
            // 3. 还没有就显示 "未命名"
            let displayName = entry.comment;
            
            if (!displayName) {
                if (Array.isArray(entry.keys) && entry.keys.length > 0) {
                    displayName = entry.keys[0];
                } else {
                    displayName = '未命名条目';
                }
            }

            const typeEmoji = entry.constant ? '📌' : '🔎';
            item.innerText = `${typeEmoji} ${displayName}`;
            
            item.onclick = () => App.loadWorldInfoEntry(entry.uid);
            container.appendChild(item);
        });
    },

    // ★★★ 初始化世界书 Tab 的数据 ★★★
    initWorldInfoTab() {
        // 1. 填充书的全局绑定角色下拉框
        const charSelect = this.els.wiBookCharSelect;
        if (charSelect) {
            charSelect.innerHTML = '<option value="">全局 (对所有角色生效)</option>';
            STATE.contacts.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.innerText = c.name;
                charSelect.appendChild(opt);
            });
        }
        
        // 2. 渲染大分类，并触发一次列表渲染
        this.renderBookSelect();
        this.renderWorldInfoList();
        App.clearWorldInfoEditor(); 
    },

    // renderChatHistory(contact) {
    //     this.els.chatMsgs.innerHTML = '';
    //     this.els.chatTitle.innerText = contact.name;
        
    //     contact.history.forEach((msg, historyIndex) => {  // ← 新增 historyIndex
    //         if (msg.role === 'system') return;
    //         const sender = msg.role === 'assistant' ? 'ai' : 'user';

    //         let cleanText = typeof msg === 'string' ? msg : msg.content || '';
            
    //         if (sender === 'user') {
    //             cleanText = cleanText.replace(/^\[[A-Z][a-z]{2}\.\d{1,2}\s\d{2}:\d{2}\]\s/, '');
    //         }

    //         const msgTime = typeof msg === 'string' ? null : msg.timestamp;
            
    //         const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim());
            
    //         if (paragraphs.length === 0 && !cleanText.trim()) return;

    //         // ★★★ 新增：创建消息组容器 ★★★
    //         const group = document.createElement('div');
    //         group.className = 'message-group';
    //         group.dataset.msgIndex = historyIndex;  // 关键：标记属于 history 的第几条
    //         group.dataset.sender = sender;

    //         if (paragraphs.length > 0) {
    //             paragraphs.forEach(p => {
    //                 const bubbleClone = this.createSingleBubble(p.trim(), sender, contact.avatar, msgTime, historyIndex);
    //                 group.appendChild(bubbleClone);
    //             });
    //         } else {
    //             const bubbleClone = this.createSingleBubble(cleanText.trim(), sender, contact.avatar, msgTime, historyIndex);
    //             group.appendChild(bubbleClone);
    //         }

    //         this.els.chatMsgs.appendChild(group);
    //     });

    //     this.scrollToBottom();
    //     this.updateRerollState(contact);
    // },

    createSingleBubble(text, sender, aiAvatarUrl, timestampRaw, historyIndex) {
        const template = document.getElementById('msg-template');
        const clone = template.content.cloneNode(true);
        
        const wrapper = clone.querySelector('.message-wrapper');
        const bubble = clone.querySelector('.message-bubble');
        const timeSpan = clone.querySelector('.msg-time');
        const avatarImg = clone.querySelector('.avatar-img');
        const avatarText = clone.querySelector('.avatar-text');

        wrapper.classList.add(sender);
        bubble.innerText = text;
        
        // ★★★ 新增：给 bubble 也加 data-msg-index，方便事件委托 ★★★
        bubble.dataset.msgIndex = historyIndex;
        bubble.className += ' selectable-message';  // 可选：加个 class 方便样式

        let timeStr = "";
        if (timestampRaw && timestampRaw.includes(' ')) {
            timeStr = timestampRaw.split(' ')[1]; 
        } else {
            const n = new Date();
            timeStr = `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
        }
        timeSpan.innerText = timeStr;

        let currentAvatar = sender === 'user' ? (STATE.settings.USER_AVATAR || 'user.jpg') : (aiAvatarUrl || '🌸');
        const isImage = currentAvatar.startsWith('http') || currentAvatar.startsWith('data:');

        if (isImage) {
            avatarImg.src = currentAvatar;
            avatarImg.onerror = () => { avatarImg.style.display='none'; avatarText.style.display='flex'; avatarText.innerText='?'; };
            avatarText.style.display = 'none';
        } else {
            avatarImg.style.display = 'none';
            avatarText.style.display = 'flex'; 
            avatarText.innerText = currentAvatar;
        }

        return clone;  // 返回 clone（已包含 .message-wrapper 等）
    },

    removeLatestAiBubbles() {
        const container = this.els.chatMsgs;
        while (container.lastElementChild && container.lastElementChild.classList.contains('ai')) {
            container.removeChild(container.lastElementChild);
        }
    },

    /*新增1212*/
    renderChatHistory(contact) {
        this.els.chatMsgs.innerHTML = '';
        this.els.chatTitle.innerText = contact.name;
        
        contact.history.forEach((msg, historyIndex) => {  // ← 新增 historyIndex
            if (msg.role === 'system') return;
            const sender = msg.role === 'assistant' ? 'ai' : 'user';

            let cleanText = typeof msg === 'string' ? msg : msg.content || '';
            
            if (sender === 'user') {
                cleanText = cleanText.replace(/^\[[A-Z][a-z]{2}\.\d{1,2}\s\d{2}:\d{2}\]\s/, '');
            }

            const msgTime = typeof msg === 'string' ? null : msg.timestamp;
            
            const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim());
            
            if (paragraphs.length === 0 && !cleanText.trim()) return;

            // ★★★ 新增：创建消息组容器 ★★★
            const group = document.createElement('div');
            group.className = 'message-group';
            group.dataset.msgIndex = historyIndex;  // 关键：标记属于 history 的第几条
            group.dataset.sender = sender;

            if (paragraphs.length > 0) {
                paragraphs.forEach(p => {
                    const bubbleClone = this.createSingleBubble(p.trim(), sender, contact.avatar, msgTime, historyIndex);
                    group.appendChild(bubbleClone);
                });
            } else {
                const bubbleClone = this.createSingleBubble(cleanText.trim(), sender, contact.avatar, msgTime, historyIndex);
                group.appendChild(bubbleClone);
            }

            this.els.chatMsgs.appendChild(group);
        });

        this.scrollToBottom();
        this.updateRerollState(contact);
    },

/* 1212*/
    appendMessageBubble(text, sender, aiAvatarUrl, timestampRaw, historyIndex = null) {
        // 如果没传 historyIndex，就尝试自动获取（用于实时发送新消息）
        if (historyIndex === null) {
            const contact = STATE.contacts.find(c => c.id === STATE.currentContactId);
            if (contact && contact.history.length > 0) {
                historyIndex = contact.history.length - 1;  // 最后一条
            } else {
                historyIndex = -1;
            }
        }

        // 创建单个气泡（核心逻辑已提取）
        const clone = this.createSingleBubble(text, sender, aiAvatarUrl, timestampRaw, historyIndex);

        // 查找是否已有同一个消息的 group
        const existingGroup = Array.from(this.els.chatMsgs.children)
            .reverse()
            .find(group => group.classList.contains('message-group') && 
                        parseInt(group.dataset.msgIndex) === historyIndex);

        if (existingGroup) {
            // 如果已经存在 group，直接追加到里面（同一个消息的后续段落）
            existingGroup.appendChild(clone);
        } else {
            // 否则新建一个 group
            const group = document.createElement('div');
            group.className = 'message-group';
            group.dataset.msgIndex = historyIndex;
            group.dataset.sender = sender;
            group.appendChild(clone);
            this.els.chatMsgs.appendChild(group);
        }

        this.scrollToBottom();
    },

    scrollToBottom() {
        this.els.chatMsgs.parentElement.scrollTop = this.els.chatMsgs.parentElement.scrollHeight;
    },

    setLoading(isLoading) {
        STATE.isTyping = isLoading;
        this.els.sendBtn.disabled = isLoading;
        if (isLoading) {
            this.els.status.innerText = '对方正在输入';
            this.els.status.classList.add('typing');
        } else {
            this.els.status.innerText = '在线';
            this.els.status.classList.remove('typing');
        }
    },

    updateRerollState(contact) {
        const hasHistory = contact.history.some(m => m.role === 'assistant');
        this.els.rerollBtn.style.opacity = hasHistory ? '1' : '0.5';
        this.els.rerollBtn.disabled = !hasHistory;
    },

    async playWaterfall(fullText, avatar, timestamp) {
        const paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim());
        for (let i = 0; i < paragraphs.length; i++) {
            if (i > 0) await new Promise(r => setTimeout(r, 400));
            this.appendMessageBubble(paragraphs[i], 'ai', avatar, timestamp);
        }
    },

    // ★★★ API 预设菜单 UI (逻辑修正版) ★★★
    renderPresetMenu() {
        const containerId = 'api-preset-container';
        let container = document.getElementById(containerId);

        if (container) {
            const saveBtn = document.getElementById('save-preset-btn');
            const delBtn = document.getElementById('del-preset-btn');
            const select = document.getElementById('preset-select');

            if(saveBtn) saveBtn.onclick = () => App.handleSavePreset();
            if(delBtn) delBtn.onclick = () => App.handleDeletePreset();
            if(select) select.onchange = (e) => App.handleLoadPreset(e.target.value);

            select.innerHTML = '<option value="">-- 选择 API 预设 --</option>';
            if (STATE.settings.API_PRESETS && Array.isArray(STATE.settings.API_PRESETS)) {
                STATE.settings.API_PRESETS.forEach((p, index) => {
                    const opt = document.createElement('option');
                    opt.value = index;
                    opt.innerText = p.name;
                    select.appendChild(opt);
                });
            }
        }
    }
};

// =========================================
// 7. APP CONTROLLER (业务逻辑)
// =========================================
const App = {
    els: UI.els,
    // 1. 初始化入口
    async init() {
        // [关键点 1] 加上 await，程序会在这里暂停，直到数据库加载完毕
        await Storage.load();
        
        // [关键点 2] 初始化界面元素（绑定 DOM 节点）
        UI.init();
        
        // [关键点 3] 绑定点击事件
        this.bindEvents();
        
        // [关键点 4] ★★★ 新增：数据加载好了，必须手动让 UI 渲染出联系人列表
        // 假设你的 UI 对象里有一个叫 renderContacts 或 renderSidebar 的方法用来画列表
        // 如果你的 UI.init() 里已经包含渲染逻辑，这行也可以省略，但显式调用更保险
        if (typeof UI.renderContacts === 'function') {
            UI.renderContacts();
        }
        
        console.log("App initialized, contacts loaded:", STATE.contacts.length);
    },

    enterChat(id) {
        const contact = STATE.contacts.find(c => c.id === id);
        if (!contact) return;
        STATE.currentContactId = id;
        UI.switchView('chat');
        UI.renderChatHistory(contact);
    },

    async handleSend(isReroll = false) {
        const contact = STATE.contacts.find(c => c.id === STATE.currentContactId);
        if (!contact) return;
        
        const { API_URL, API_KEY, MODEL } = STATE.settings;
        if (!API_URL || !API_KEY || !MODEL) {
            alert('请先点击右上角的设置按钮，配置 API 地址、密钥和模型！');
            return;
        }

        let userText = UI.els.input.value.trim();
        const timestamp = formatTimestamp();

        // 历史记录处理
        const sysMsg = { role: 'system', content: contact.prompt };
        if (contact.history.length === 0 || contact.history[0].role !== 'system') {
            contact.history.unshift(sysMsg);
        } else {
            contact.history[0] = sysMsg; 
        }

        if (isReroll) {
            const lastUserMsg = [...contact.history].reverse().find(m => m.role === 'user');
            if (!lastUserMsg) return;
            userText = lastUserMsg.content;
            
            while(contact.history.length > 0 && contact.history[contact.history.length-1].role === 'assistant') {
                contact.history.pop();
            }
            UI.removeLatestAiBubbles(); 
        } else {
            if (!userText) return;
            
            const paragraphs = userText.split(/\n\s*\n/).filter(p => p.trim());
            if (paragraphs.length > 0) {
                paragraphs.forEach(p => UI.appendMessageBubble(p.trim(), 'user', null, timestamp));
            } else {
                UI.appendMessageBubble(userText, 'user', null, timestamp);
            }

            contact.history.push({ role: 'user', content: `[${timestamp}] ${userText}`, timestamp: timestamp });
            UI.els.input.value = '';            
            UI.els.input.style.height = '38px'; 
            
            if (window.innerWidth < 800) UI.els.input.blur();
            else UI.els.input.focus(); 
        }        

        await Storage.saveContacts();
        UI.setLoading(true);

        const recentHistory = contact.history
            .filter(m => m.role !== 'system')
            .slice(-30)
            .map(msg => {
                let content = msg.content || msg;
                if (msg.role === 'user') {
                    if(content.startsWith('[Dec')) {
                        // 兼容旧格式，不做处理
                    }
                    return { role: 'user', content: content };
                } else {
                    return { role: 'assistant', content: content };
                }
            });
        
        // ★★★ 世界书注入逻辑 ★★★
        const worldInfoPrompt = WorldInfoEngine.scan(userText, recentHistory, contact.id, contact.name);
        
        const messagesToSend = [
            { role: 'system', content: CONFIG.SYSTEM_PROMPT }, 
            { role: 'system', content: `=== 角色设定 ===\n${contact.prompt}` }
        ];

        if (worldInfoPrompt) {
            messagesToSend.push({ 
                role: 'system', 
                content: `=== 世界知识/环境信息 ===\n${worldInfoPrompt}` 
            });
            console.log("【World Info Injected】", worldInfoPrompt);
        }

        recentHistory.forEach(h => messagesToSend.push(h));

        try {
            const aiText = await API.chat(messagesToSend, STATE.settings);
            const aiTimestamp = formatTimestamp();
            contact.history.push({ role: 'assistant', content: aiText, timestamp: aiTimestamp });
            await Storage.saveContacts();
            UI.setLoading(false);
            await UI.playWaterfall(aiText, contact.avatar, aiTimestamp)
        } catch (error) {
            console.error(error);
            UI.setLoading(false);
            UI.appendMessageBubble(`(发送失败: ${error.message})`, 'ai', contact.avatar);
        } finally {
            UI.updateRerollState(contact);
            if (window.innerWidth >= 800) UI.els.input.focus();
        }
    },

    openSettings() {
        UI.els.mainModal.classList.remove('hidden');
        const s = STATE.settings;
        UI.els.settingUrl.value = s.API_URL || '';
        UI.els.settingKey.value = s.API_KEY || '';
        UI.els.settingModel.value = s.MODEL || 'zai-org/GLM-4.6';
        if (document.getElementById('gist-token')) document.getElementById('gist-token').value = s.GIST_TOKEN || ''; 
        
        if (s.MODEL) UI.els.settingModel.innerHTML = `<option value="${s.MODEL}">${s.MODEL}</option>`;
        
        const previewImg = document.getElementById('wallpaper-preview-img');
        if (s.WALLPAPER && s.WALLPAPER.startsWith('data:')) {
            previewImg.src = s.WALLPAPER;
            document.getElementById('wallpaper-preview').classList.remove('hidden');
        }

        UI.renderPresetMenu();
        // ★★★ 世界书初始化 ★★★
        UI.initWorldInfoTab();
    },

    // --- 世界书相关操作 ---

    // 切换当前书
    switchWorldInfoBook(bookId) {
        STATE.currentBookId = bookId;
        UI.updateCurrentBookSettingsUI();
        UI.renderWorldInfoList();
        this.clearWorldInfoEditor();
    },

    // 绑定当前书的角色
    async bindCurrentBookToChar(charId) {
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (book) {
            book.characterId = charId;
            await Storage.saveWorldInfo();
            // 不需刷新列表，因为内容没变
        }
    },
    
    loadWorldInfoEntry(uid) {
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!book) return;

        const entry = book.entries.find(e => e.uid === uid);
        if (!entry) return;

        document.getElementById('wi-edit-uid').value = entry.uid;
        document.getElementById('wi-edit-keys').value = entry.keys.join(', ');
        document.getElementById('wi-edit-content').value = entry.content;
        document.getElementById('wi-edit-constant').checked = entry.constant;

        // ★★★ 核心修改：把内存里的名字填进输入框
        const commentInput = document.getElementById('wi-edit-comment');
        if (commentInput) {
            commentInput.value = entry.comment || ''; 
        }
        
        // 顺便刷新一下列表高亮
        UI.renderWorldInfoList(); 
    },

    async saveWorldInfoEntry() {
        // 1. 获取当前书
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!book) return alert("请先新建或选择一本世界书");

        // 2. 获取所有输入框的值
        const uid = document.getElementById('wi-edit-uid').value;
        const keysStr = document.getElementById('wi-edit-keys').value || ""; // 防止 null
        const content = document.getElementById('wi-edit-content').value || "";
        const constant = document.getElementById('wi-edit-constant').checked;
        
        // ★★★ 关键：获取名称输入框 ★★★
        const commentInput = document.getElementById('wi-edit-comment');
        // 如果输入框存在，就取值；不存在（比如界面没渲染对）就给 null
        let userComment = commentInput ? commentInput.value.trim() : null;

        // 3. 处理 Key (把字符串转成数组)
        const keys = keysStr.split(/[,，]/).map(k => k.trim()).filter(k => k);

        if (!content && !keys.length) {
            alert('请至少填写内容或关键词');
            return;
        }

        // 4. 查找或新建条目
        let entry = book.entries.find(e => e.uid === uid);
        
        if (entry) {
            // === 更新逻辑 ===
            entry.keys = keys;
            entry.content = content;
            entry.constant = constant;

            // ★★★ 核心修复：优先使用用户输入的名字 ★★★
            if (userComment !== null && userComment !== "") {
                // 如果用户填了字，就用用户的
                entry.comment = userComment;
            } else if (!entry.comment && keys.length > 0) {
                // 只有当“用户没填”且“原先也没名字”时，才用 Key 兜底
                entry.comment = keys[0];
            }
            // 如果用户清空了输入框，且没有Key，那就让它空着或者叫未命名
            if (!entry.comment) entry.comment = '未命名条目';
            
        } else {
            // === 新建逻辑 ===
            entry = {
                uid: Date.now().toString(),
                keys: keys,
                content: content,
                constant: constant,
                // ★★★ 新建时也是一样：优先用输入框的值
                comment: userComment || keys[0] || '新建条目'
            };
            book.entries.push(entry);
        }

        // 5. 保存到数据库
        await Storage.saveWorldInfo();
        
        // 6. 强制刷新列表 (解决左侧不更新的问题)
        UI.renderWorldInfoList(); 
        
        // 7. 重新加载当前条目 (让输入框里的值保持同步)
        this.loadWorldInfoEntry(entry.uid);
        
        console.log("已保存条目:", entry.comment); // 调试用，看控制台有没有打印名字
    },

    async deleteWorldInfoEntry() {
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!book) return;

        const uid = document.getElementById('wi-edit-uid').value;
        if (!uid) return;
        if (confirm('确定删除此条目吗？')) {
            book.entries = book.entries.filter(e => e.uid !== uid);
            await Storage.saveWorldInfo();
            this.clearWorldInfoEditor();
            UI.renderWorldInfoList();
        }
    },

    clearWorldInfoEditor() {
        document.getElementById('wi-edit-uid').value = '';
        document.getElementById('wi-edit-keys').value = '';
        
        // ★★★ 新增：清空名称输入框
        const commentInput = document.getElementById('wi-edit-comment');
        if (commentInput) commentInput.value = '';

        document.getElementById('wi-edit-content').value = '';
        document.getElementById('wi-edit-constant').checked = false;
        UI.renderWorldInfoList();
    },

    // ★★★ 大分类（书）的操作 ★★★
    async createNewBook() {
        const name = prompt("请输入新世界书的名称：", "新世界书");
        if (name) {
            const newBook = {
                id: 'book_' + Date.now(),
                name: name,
                characterId: '', // 默认全局
                entries: []
            };
            STATE.worldInfoBooks.push(newBook);
            STATE.currentBookId = newBook.id;
            await Storage.saveWorldInfo();
            UI.renderBookSelect();
            UI.renderWorldInfoList();
        }
    },

    async renameCurrentBook() {
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!book) return;
        const newName = prompt("重命名世界书：", book.name);
        if (newName) {
            book.name = newName;
            await Storage.saveWorldInfo();
            UI.renderBookSelect();
        }
    },

    async deleteCurrentBook() {
        if (STATE.worldInfoBooks.length <= 1) {
            return alert("至少保留一本世界书");
        }
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!book) return;
        
        if (confirm(`确定要彻底删除整本《${book.name}》吗？\n里面的所有条目都会消失，不可恢复。`)) {
            STATE.worldInfoBooks = STATE.worldInfoBooks.filter(b => b.id !== STATE.currentBookId);
            STATE.currentBookId = STATE.worldInfoBooks[0].id; // 切换到第一本
            await Storage.saveWorldInfo();
            UI.renderBookSelect();
            UI.renderWorldInfoList();
        }
    },

    exportCurrentBook() {
        const book = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!book) return;

        const jsonStr = WorldInfoEngine.exportToST(book);
        const blob = new Blob([jsonStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.name}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    async handleImportWorldInfo(file) {
        if (!file) return;

        try {
            // 1. 直接等待文件读取为文本，不用写 reader.onload 了
            const content = await file.text(); 
            
            // 2. 剩下的逻辑像流水账一样写下来
            const newBook = WorldInfoEngine.importFromST(content, file.name);
            STATE.worldInfoBooks.push(newBook);
            STATE.currentBookId = newBook.id; 
            
            // 3. 等待数据库保存
            await Storage.saveWorldInfo();
            
            // 4. 刷新界面
            UI.renderBookSelect();
            UI.renderWorldInfoList();
            
            alert(`成功导入《${newBook.name}》，包含 ${newBook.entries.length} 个条目！`);
            
        } catch (err) {
            alert(err.message);
        }
    },

    // ----------------------

    async handleSavePreset() {
        const name = prompt("请为当前配置输入一个预设名称 (如: Gemini Pro)");
        if (!name) return;

        const preset = {
            name: name,
            url: UI.els.settingUrl.value.trim(),
            key: UI.els.settingKey.value.trim(),
            model: UI.els.settingModel.value
        };

        if(!preset.url || !preset.key) return alert("请先填好 API 地址和密钥！");

        STATE.settings.API_PRESETS.push(preset);
        await Storage.saveSettings();
        UI.renderPresetMenu(); 
    },

    handleLoadPreset(index) {
        if (index === "") return;
        const preset = STATE.settings.API_PRESETS[index];
        if (preset) {
            UI.els.settingUrl.value = preset.url;
            UI.els.settingKey.value = preset.key;
            // 更新模型Select
            UI.els.settingModel.innerHTML = `<option value="${preset.model}">${preset.model}</option>`;
            UI.els.settingModel.value = preset.model;
        }
    },

    async handleDeletePreset() {
        const select = document.getElementById('preset-select');
        const index = select.value;
        if (index === "") return alert("请先选择一个预设");
        
        if (confirm(`确定删除 "${STATE.settings.API_PRESETS[index].name}" 吗？`)) {
            STATE.settings.API_PRESETS.splice(index, 1);
            await Storage.saveSettings();
            UI.renderPresetMenu();
        }
    },

    async saveSettingsFromUI() {
        let rawUrl = UI.els.settingUrl.value.trim().replace(/\/+$/, '');
        if (!rawUrl.includes('anthropic') && !rawUrl.includes('googleapis')) {
            if (rawUrl.endsWith('/chat/completion')) rawUrl += 's'; 
            else if (!rawUrl.includes('/chat/completions')) {
                rawUrl += rawUrl.endsWith('/v1') ? '/chat/completions' : '/v1/chat/completions';
            }
        }
        
        const s = STATE.settings;
        s.API_URL = rawUrl;
        s.API_KEY = UI.els.settingKey.value.trim();
        s.MODEL = UI.els.settingModel.value;
        const tEl = document.getElementById('gist-token');
        if(tEl) s.GIST_TOKEN = tEl.value.trim() || ''; 

        const wallpaperPreview = document.getElementById('wallpaper-preview-img').src;
        if(wallpaperPreview && wallpaperPreview.startsWith('data:')) {
            s.WALLPAPER = wallpaperPreview;
        } else if (!s.WALLPAPER) {
            s.WALLPAPER = 'wallpaper.jpg';
        }

        await Storage.saveSettings();
        UI.applyAppearance(); 
        UI.els.mainModal.classList.add('hidden');
        alert(`设置已保存！`);
    },

/*1212*/
    handleMessageAction(action) {
        const index = STATE.selectedMessageIndex;
        if (index === null || index < 0) return;

        const contact = STATE.contacts.find(c => c.id === STATE.currentContactId);
        if (!contact || !contact.history[index]) return;

        const msg = contact.history[index];

        if (action === 'copy') {
            navigator.clipboard.writeText(msg.content.replace(/^\[[^\]]+\]\s*/, '')).then(() => {
                alert('已复制到剪贴板');
            });
        } 
        else if (action === 'delete') {
            if (confirm('确定删除这条消息吗？')) {
                contact.history.splice(index, 1);
                Storage.saveContacts();
                UI.renderChatHistory(contact);
                this.hideMessageContextMenu();
            }
        } 
        else if (action === 'edit') {
            const cleanContent = msg.content.replace(/^\[[^\]]+\]\s*/, '');  // 去掉时间戳
            const newText = prompt('编辑消息内容：', cleanContent);
            if (newText !== null && newText.trim() !== cleanContent) {
                // 如果是用户消息，保留时间戳；AI 消息直接改
                if (msg.role === 'user') {
                    const timestampMatch = msg.content.match(/^\[([^\]]+)\]/);
                    const timestamp = timestampMatch ? timestampMatch[0] : formatTimestamp();
                    msg.content = `[${timestamp.slice(1, -1)}] ${newText.trim()}`;
                } else {
                    msg.content = newText.trim();
                }
                Storage.saveContacts();
                UI.renderChatHistory(contact);
            }
            this.hideMessageContextMenu();
        }
    },

    hideMessageContextMenu() {
        if (this.els.msgContextMenu) {
            this.els.msgContextMenu.style.display = 'none';
        }
        STATE.selectedMessageIndex = null;
    },


    showMessageContextMenu(msgIndex, rect) {
        STATE.selectedMessageIndex = msgIndex;

        const menu = document.getElementById('msg-context-menu');

        // 事件绑定（保持不变）
        if (!menu.dataset.initialized) {
            menu.dataset.initialized = 'true';
            menu.addEventListener('click', e => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const action = btn.dataset.action;
                if (action === 'cancel') {
                    this.hideMessageContextMenu();
                    return;
                }
                this.handleMessageAction(action);
                this.hideMessageContextMenu();
            });
            menu.querySelector('.menu-backdrop').addEventListener('click', () => {
                this.hideMessageContextMenu();
            });
        }

        

        // ★★★★★ 关键三行：显示 + 可点 + 最顶级 ★★★★★
        menu.style.display = 'flex';

        // 可选：如果你想更保险，可以再加背景（测试用）
        // menu.querySelector('.menu-backdrop').style.background = 'rgba(0,0,0,0.6)';
    },

    // 隐藏方法
    hideMessageContextMenu() {
        const menu = document.getElementById('msg-context-menu');
        if (menu) menu.style.display = 'none';
    },

    bindEvents() {
        // --- Tab 切换 (便签切换小工具) ---
        // 移到这里是为了确保 DOM 元素已经存在，并且逻辑统一管理
        document.querySelectorAll('.tab-item').forEach(item => {
            item.addEventListener('click', () => {
                const target = item.dataset.target;
                document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                item.classList.add('active');
                const pane = document.getElementById(target);
                if(pane) pane.classList.add('active');
            });
        });

        // --- 输入与发送 ---
        if(UI.els.input) {
            UI.els.input.style.overflowY = 'hidden'; 
            UI.els.input.addEventListener('input', function() {
                this.style.height = 'auto'; 
                this.style.height = (this.scrollHeight) + 'px';
                if (this.value === '') this.style.height = '38px';
            });
            UI.els.input.onkeydown = (e) => {
                const isMobile = window.innerWidth < 800;
                if (e.key === "Enter" && !e.shiftKey && !isMobile) {
                    e.preventDefault(); 
                    App.handleSend(false);
                }
            };
        }

        if(UI.els.sendBtn) UI.els.sendBtn.onclick = () => this.handleSend(false);
        if(UI.els.rerollBtn) UI.els.rerollBtn.onclick = () => this.handleSend(true);
        const backBtn = document.getElementById('back-btn');
        if(backBtn) backBtn.onclick = () => UI.switchView('list');

        // --- 主设置弹窗 ---
        const mainSetBtn = document.getElementById('main-settings-btn');
        if(mainSetBtn) mainSetBtn.onclick = () => this.openSettings();
        const mainCancel = document.getElementById('main-cancel');
        if(mainCancel) mainCancel.onclick = () => UI.els.mainModal.classList.add('hidden');
        const mainConfirm = document.getElementById('main-confirm');
        if(mainConfirm) mainConfirm.onclick = () => this.saveSettingsFromUI();
        if(UI.els.fetchBtn) UI.els.fetchBtn.onclick = () => this.fetchModelsForUI();

        // --- ★★★ 世界书弹窗事件绑定 ★★★ --
        const wiClose = document.getElementById('wi-close-btn');
        if(wiClose) wiClose.onclick = () => UI.els.wiModal.classList.add('hidden');
        
        const wiSave = document.getElementById('wi-save-btn');
        if(wiSave) wiSave.onclick = () => this.saveWorldInfoEntry();
        
        const wiDel = document.getElementById('wi-delete-btn');
        if(wiDel) wiDel.onclick = () => this.deleteWorldInfoEntry();

        const wiAdd = document.getElementById('wi-add-btn');
        if(wiAdd) wiAdd.onclick = () => this.clearWorldInfoEditor();

        // 书本操作
        const wiBookSel = document.getElementById('wi-book-select');
        if(wiBookSel) wiBookSel.onchange = (e) => this.switchWorldInfoBook(e.target.value);
        
        const wiBookCharSel = document.getElementById('wi-book-char-select');
        if(wiBookCharSel) wiBookCharSel.onchange = (e) => this.bindCurrentBookToChar(e.target.value);

        const wiNewBook = document.getElementById('wi-new-book-btn');
        if(wiNewBook) wiNewBook.onclick = () => this.createNewBook();

        const wiRenameBook = document.getElementById('wi-rename-book-btn');
        if(wiRenameBook) wiRenameBook.onclick = () => this.renameCurrentBook();

        const wiDelBook = document.getElementById('wi-delete-book-btn');
        if(wiDelBook) wiDelBook.onclick = () => this.deleteCurrentBook();
        
        const wiExportBook = document.getElementById('wi-export-book-btn');
        if(wiExportBook) wiExportBook.onclick = () => this.exportCurrentBook();

        const wiImportBtn = document.getElementById('wi-import-btn');
        const wiFileInput = document.getElementById('wi-file-input');
        if (wiImportBtn && wiFileInput) {
            wiImportBtn.onclick = () => wiFileInput.click();
            wiFileInput.onchange = (e) => this.handleImportWorldInfo(e.target.files[0]);
        }

        // 日夜模式
        if (UI.els.themeLight) UI.els.themeLight.addEventListener('change', () => UI.toggleTheme('light'));
        if (UI.els.themeDark) UI.els.themeDark.addEventListener('change', () => UI.toggleTheme('dark'));

        // 壁纸
        const wpInput = document.getElementById('wallpaper-file-input');
        if(wpInput) {
            wpInput.onchange = async (e) => {
                if(e.target.files[0]) {
                    const base64 = await this.readFile(e.target.files[0]);
                    document.getElementById('wallpaper-preview-img').src = base64;
                    document.getElementById('wallpaper-preview').classList.remove('hidden');
                }
            };
        }

        // 角色编辑
        const addBtn = document.getElementById('add-contact-btn');
        if(addBtn) addBtn.onclick = () => this.openEditModal(null);
        const chatSetBtn = document.getElementById('chat-settings-btn');
        if(chatSetBtn) chatSetBtn.onclick = () => this.openEditModal(STATE.currentContactId);
        
        const modalCancel = document.getElementById('modal-cancel');
        if(modalCancel) modalCancel.onclick = () => document.getElementById('modal-overlay').classList.add('hidden');
        const modalSave = document.getElementById('modal-save');
        if(modalSave) modalSave.onclick = () => { this.saveContactFromModal(); document.getElementById('modal-overlay').classList.add('hidden'); };
        
        const modalDel = document.getElementById('modal-delete');
        if(modalDel) modalDel.onclick = async () => {
             if (confirm('删除角色？')) {
                 STATE.contacts = STATE.contacts.filter(c => c.id !== this.editingId);
                 await Storage.saveContacts();
                 document.getElementById('modal-overlay').classList.add('hidden');
                 if(STATE.currentContactId === this.editingId) document.getElementById('back-btn').click();
                 else UI.renderContacts();
             }
        };
        const modalClear = document.getElementById('modal-clear-history');
        if(modalClear) modalClear.onclick = async () => {
            if(confirm('清空聊天记录？')) {
                const c = STATE.contacts.find(x => x.id === this.editingId);
                if(c) { c.history = []; await Storage.saveContacts(); }
                document.getElementById('modal-overlay').classList.add('hidden');
                if(STATE.currentContactId === this.editingId) UI.renderChatHistory(c);
            }
        };

        // 头像上传
        this.bindImageUpload('edit-avatar-file', 'edit-avatar-preview', 'edit-avatar'); 
        this.bindImageUpload('user-avatar-file', 'user-avatar-preview', null, async (base64) => {
            STATE.settings.USER_AVATAR = base64;
            await Storage.saveSettings();
            if(STATE.currentContactId) {
                const c = STATE.contacts.find(x => x.id === STATE.currentContactId);
                if(c) UI.renderChatHistory(c);
            }
        });
        const editUpBtn = document.getElementById('edit-avatar-upload-btn');
        if(editUpBtn) editUpBtn.onclick = () => document.getElementById('edit-avatar-file').click();
        const userUpBtn = document.getElementById('user-avatar-upload-btn');
        if(userUpBtn) userUpBtn.onclick = () => document.getElementById('user-avatar-file').click();

        // 长按相关变量
        let longPressTimer = null;
        const LONG_PRESS_DURATION = 600;

        UI.els.chatMsgs.addEventListener('touchstart', e => {
            const bubble = e.target.closest('.message-bubble');
            if (!bubble) return;
            
            const msgIndex = parseInt(bubble.dataset.msgIndex);
            if (isNaN(msgIndex)) return;

            e.preventDefault(); // 这里必须 preventDefault，防止长按选中文字
            longPressTimer = setTimeout(() => {
                App.showMessageContextMenu(msgIndex, bubble.getBoundingClientRect());  // 注意：这里要用 App.
            }, LONG_PRESS_DURATION);
        }, { passive: false });  // ← 明确告诉浏览器：这个会 preventDefault

        UI.els.chatMsgs.addEventListener('touchend', () => clearTimeout(longPressTimer), { passive: true });
        UI.els.chatMsgs.addEventListener('touchmove', () => clearTimeout(longPressTimer), { passive: true });  // ← 这个可以 passive

        // 桌面鼠标模拟长按
        UI.els.chatMsgs.addEventListener('mousedown', e => {
            if (e.button !== 0) return; // 只左键
            const bubble = e.target.closest('.message-bubble');
            if (!bubble) return;
            
            const msgIndex = parseInt(bubble.dataset.msgIndex);
            if (isNaN(msgIndex)) return;

            longPressTimer = setTimeout(() => {
                App.showMessageContextMenu(msgIndex, bubble.getBoundingClientRect());
            }, LONG_PRESS_DURATION);
            
        });

        UI.els.chatMsgs.addEventListener('mouseup', () => clearTimeout(longPressTimer));
        UI.els.chatMsgs.addEventListener('mouseleave', () => clearTimeout(longPressTimer));

        // Gist Events
        const gistFind = document.getElementById('gist-find');
        if(gistFind) gistFind.onclick = () => CloudSync.findBackup();
        const gistCreate = document.getElementById('gist-create-and-backup');
        if(gistCreate) gistCreate.onclick = () => CloudSync.createBackup();
        const gistBackup = document.getElementById('gist-backup');
        if(gistBackup) gistBackup.onclick = () => CloudSync.updateBackup();
        const gistRestore = document.getElementById('gist-restore');
        if(gistRestore) gistRestore.onclick = () => CloudSync.restoreBackup();
        const gistIdInput = document.getElementById('gist-id-input');
        if(gistIdInput) gistIdInput.onchange = (e) => CloudSync.updateGistId(e.target.value);
    },

    readFile(file) {
        return new Promise((r, j) => {
            const reader = new FileReader();
            reader.onload = e => r(e.target.result);
            reader.onerror = j;
            reader.readAsDataURL(file);
        });
    },

    async fetchModelsForUI() {
        const url = UI.els.settingUrl.value.trim();
        const key = UI.els.settingKey.value.trim();
        if(!url || !key) return alert('请先填写地址和密钥');
        const btn = UI.els.fetchBtn;
        btn.textContent = '获取中...';
        btn.disabled = true;
        try {
            const data = await API.fetchModels(url, key);
            const datalist = document.getElementById('model-options');
            if(datalist) datalist.innerHTML = '';
            if (data.data && Array.isArray(data.data)) {
                data.data.forEach(m => {
                    if(datalist) {
                        const opt = document.createElement('option');
                        opt.value = m.id;
                        datalist.appendChild(opt);
                    }
                });
                if (data.data.length > 0) {
                    UI.els.settingModel.value = data.data[0].id;
                }
                alert(`成功拉取 ${data.data.length} 个模型！`);
            } else {
                alert('连接成功，但对方没有返回有效的模型列表，请手动输入。');
            }
        } catch (e) {
            console.error(e);
            alert('拉取失败，请手动输入模型名。');
        } finally {
            btn.textContent = '拉取模型';
            btn.disabled = false;
        }
    },

    bindImageUpload(inputId, imgId, inputUrlId, callback) {
        const el = document.getElementById(inputId);
        if(!el) return;
        el.onchange = async (e) => {
            if(e.target.files[0]) {
                const base64 = await this.readFile(e.target.files[0]);
                document.getElementById(imgId).src = base64;
                if(inputUrlId) document.getElementById(inputUrlId).value = base64;
                if(callback) callback(base64);
            }
        };
    },
    
    openEditModal(id) {
        this.editingId = id;
        const modal = document.getElementById('modal-overlay');
        modal.classList.remove('hidden');
        const title = document.getElementById('modal-title');
        const iName = document.getElementById('edit-name');
        const iAvatar = document.getElementById('edit-avatar');
        const iPrompt = document.getElementById('edit-prompt');
        const preview = document.getElementById('edit-avatar-preview');
        const userPreview = document.getElementById('user-avatar-preview');
        if(userPreview) userPreview.src = STATE.settings.USER_AVATAR || 'user.jpg';

        if (id) {
            const c = STATE.contacts.find(x => x.id === id);
            title.innerText = '编辑角色';
            iName.value = c.name;
            iAvatar.value = c.avatar;
            iPrompt.value = c.prompt;
            preview.src = (c.avatar.startsWith('data:') || c.avatar.startsWith('http')) ? c.avatar : '';
            document.getElementById('modal-delete').style.display = 'block';
            document.getElementById('modal-clear-history').style.display = 'block';
        } else {
            title.innerText = '新建角色';
            iName.value = '';
            iAvatar.value = '🙂';
            iPrompt.value = '你是一个...';
            preview.src = '';
            document.getElementById('modal-delete').style.display = 'none';
            document.getElementById('modal-clear-history').style.display = 'none';
        }
    },

    async saveContactFromModal() {
        const name = document.getElementById('edit-name').value.trim() || '未命名';
        let avatar = document.getElementById('edit-avatar').value.trim();
        const prompt = document.getElementById('edit-prompt').value.trim();
        const previewSrc = document.getElementById('edit-avatar-preview').src;
        if(previewSrc.startsWith('data:')) avatar = previewSrc;

        if (this.editingId) {
            const c = STATE.contacts.find(x => x.id === this.editingId);
            if (c) { c.name = name; c.avatar = avatar; c.prompt = prompt; }
        } else {
            STATE.contacts.push({ id: Date.now().toString(), name, avatar, prompt, history: [] });
        }
        await Storage.saveContacts();
        UI.renderContacts();
        if (STATE.currentContactId === this.editingId) {
            document.getElementById('chat-title').innerText = name;
            const c = STATE.contacts.find(x => x.id === this.editingId);
            UI.renderChatHistory(c);
        }
    }
};

// =========================================
// 8. UTILS & EXPORTS (工具与启动)
// =========================================
function formatTimestamp() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[now.getMonth()]}.${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

// 供HTML按钮直接调用的全局函数
// 1. 在这里加上 async
window.exportData = async () => {
    try {
        console.log("正在导出数据...");
        
        // 2. 在这里加上 await，一定要等数据取回来！
        const rawData = await Storage.exportAllForBackup();
        
        // 3. 拿到真实数据后再转字符串
        const data = JSON.stringify(rawData, null, 2);
        
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
        a.download = `TeleWindy-Backup-${ts}.json`;
        a.click();
        URL.revokeObjectURL(url); 
        
        console.log("导出成功！");
    } catch (e) {
        console.error("导出失败", e);
        alert("导出失败，请检查控制台报错");
    }
};

window.importData = (input) => {
    if (!input.files || !input.files[0]) return;
    
    // 1. 提示更加明确
    if (!confirm('【警告】\n恢复将清空当前所有数据！\n\n注意：如果备份文件超过 2.5MB，手机可能无法恢复。确定继续吗？')) {
        input.value = ''; // 清空选择，方便下次重选
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const jsonStr = e.target.result;
            const data = JSON.parse(jsonStr);

            // 2. 关键步骤：计算预计大小，提前预警
            // 简单估算：字符串长度 * 2 = 大致的 LocalStorage 占用字节数
            const estimatedSize = jsonStr.length * 2;
            const limit = 5 * 1024 * 1024; // 5MB

            console.log(`文件字符数: ${jsonStr.length}, 预计内存占用: ${(estimatedSize/1024/1024).toFixed(2)} MB`);

            if (estimatedSize > limit) {
                alert(`【风险提示】\n备份数据解压后约 ${(estimatedSize/1024/1024).toFixed(2)} MB。\n超过了手机 5MB 的限制，极大概率会失败！\n\n建议：在电脑端删除部分聊天记录后重新备份。`);
                // 虽然超标，但还是尝试往下走，万一浏览器也是 UTF-8 存储呢（极少见）
            }

            // 3. 核心修复：在写入前，必须先腾出空间！
            // 如果不先 clear，旧数据 + 新数据 肯定瞬间爆炸
            localStorage.clear(); 
            
            // 4. 开始写入
            Storage.importFromBackup(data);
            
            alert('✅ 恢复成功！页面将刷新');
            location.reload();

        } catch(err) { 
            // 5. 捕获真实的错误原因
            console.error(err);
            if (err.name === 'QuotaExceededError' || err.message.toLowerCase().includes('quota')) {
                alert('❌ 恢复失败：存储空间不足！\n\n原因：你的备份数据太大（超过手机 5MB 限制）。\n\n解决方法：\n1. 请在电脑端导入此备份。\n2. 删除一些带图片的对话或长对话。\n3. 重新导出后再发给手机。');
            } else {
                alert('❌ 恢复失败：文件格式错误或数据损坏。\n' + err.message);
            }
            
            // 恢复失败了，但刚才把 localStorage 清空了，由于是 SPA 可能不需要回滚，
            // 但用户现在的状态是空白的，建议刷新让用户重新初始化
            location.reload(); 
        }
    };
    reader.readAsText(input.files[0]);
};
// 启动应用
window.onload = () => App.init();