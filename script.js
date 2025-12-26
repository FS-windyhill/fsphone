/*
// =========================================
// 中文的树状代码目录
// =========================================
// 注意：这是一个树状结构，展示代码的组织架构。每个章节对应代码中的主要部分，每个函数/对象后附带简要描述（这是干啥的）。
// 
// - 1. CONFIG & STATE (配置与状态)
//   - CONFIG: 常量配置对象，包含存储键、默认设置和系统提示等，用于全局配置。
//     - STORAGE_KEY: 'teleWindy_char_data_v1' // 联系人数据存储键
//     - SETTINGS_KEY: 'teleWindy_settings_v1' // 设置存储键
//     - WORLD_INFO_KEY: 'teleWindy_world_info_v2' // 世界信息存储键（升级到v2）
//     - CHAT_PAGE_SIZE: 15 // 每次加载的聊天条数
//     - GIST_ID_KEY: 'telewindy-gist-id' // Gist ID存储键
//     - DEFAULT: 默认配置对象，包括API_URL、MODEL等默认值
//     - SYSTEM_PROMPT: 系统提示字符串，用于指导AI行为
//   - STATE: 运行时状态对象，存储动态数据，如联系人列表、当前ID等。
//     - contacts: [] // 联系人数组
//     - worldInfoBooks: [] // 世界信息书籍数组
//     - currentContactId: null // 当前联系人ID
//     - currentBookId: null // 当前世界信息书籍ID
//     - settings: {} // 当前设置
//     - typingContactId: null // 正在输入的联系人ID
//     - visibleMsgCount: 15 // 当前显示的消息条数
// 
// - 1.5. DB UTILS (IndexedDB 简易封装)
//   - DB: IndexedDB操作对象，提供数据库交互方法。
//     - dbName: 'TeleWindyDB' // 数据库名称
//     - storeName: 'store' // 对象存储名称
//     - version: 1 // 数据库版本
//     - open(): 打开数据库，返回Promise // 异步打开IndexedDB数据库，处理升级。
//     - get(key): 获取指定键的值，返回Promise // 从数据库读取数据。
//     - set(key, value): 设置指定键的值，返回Promise // 向数据库写入数据。
//     - remove(key): 删除指定键，返回Promise // 从数据库删除数据。
//     - clear(): 清空存储，返回Promise // 清空整个对象存储。
//     - exportAll(): 导出所有数据，返回Promise // 使用游标遍历并导出所有键值对。
// 
// - 2. STORAGE SERVICE (本地持久化 - IndexedDB 版)
//   - Storage: 存储服务对象，处理数据加载和保存，包括迁移逻辑。
//     - load(): 加载所有数据，包括设置、联系人和世界信息 // 从IndexedDB或LocalStorage加载数据，进行迁移和默认处理。
//     - saveContacts(): 保存联系人数据 // 将STATE.contacts保存到IndexedDB。
//     - saveSettings(): 保存设置数据 // 将STATE.settings保存到IndexedDB。
//     - saveWorldInfo(): 保存世界信息数据 // 将STATE.worldInfoBooks保存到IndexedDB。
//     - exportAllForBackup(): 导出所有数据用于备份 // 从DB导出数据，加密Token，返回对象。
//     - importFromBackup(data): 导入备份数据 // 清空DB，解密Token，写入新数据。
// 
// - 3. WORLD INFO ENGINE (世界信息引擎，已修正)
//   - WorldInfoEngine: 世界信息处理对象，管理导入、导出和扫描。
//     - importFromST(jsonString, fileName): 从SillyTavern格式导入世界信息 // 解析JSON，创建新书籍条目，兼容旧格式。
//     - exportToST(book): 导出世界信息到SillyTavern格式 // 将书籍条目转换为JSON字符串。
//     - scan(userText, history, currentContactId, currentContactName): 扫描上下文触发世界信息 // 检查关键词或常量，返回触发的世界信息内容。
// 
// - 4. API SERVICE (LLM通信)
//   - API: API服务对象，处理模型获取和聊天请求。
//     - getProvider(url): 根据URL获取提供商类型 // 判断API是Claude、Gemini还是OpenAI。
//     - fetchModels(url, key): 获取模型列表 // 发送GET请求到/models端点，返回JSON。
//     - estimateTokens(text): 估算Token数量 // 根据字符类型粗略计算Token消耗。
//     - chat(messages, settings): 发送聊天请求 // 构建请求体，调用API，处理不同提供商，返回AI响应。
// 
// - 5. CLOUD SYNC (云同步，终极混合版 - 含安全防御)
//   - CloudSync: 云同步对象，处理Gist或自定义服务器备份。
//     - els: DOM元素对象 // 元素引用集合
//     - init(): 初始化同步界面 // 恢复保存的模式、URL等，调用toggleMode。
//     - toggleMode(): 切换同步模式 // 根据选择显示/隐藏URL或Gist ID输入。
//     - showStatus(msg, isError): 显示状态消息 // 更新状态文本和颜色。
//     - getAuth(): 获取认证Token或密码 // 从输入或设置读取Token，处理加密。
//     - _maskToken(token): 混淆Token // 反转并base64编码Token以防扫描。
//     - _unmaskToken(maskedToken): 解混淆Token // base64解码并反转Token。
//     - _preparePayload(): 准备上传负载 // 导出数据，混淆Token，添加元信息。
//     - updateBackup(): 更新备份 // 根据模式调用自定义或Gist上传。
//     - findBackup(): 查找Gist备份 // 请求Gist列表，匹配描述，更新ID。
//     - restoreBackup(): 恢复备份 // 确认后从云端拉取数据，调用_safeRestore。
//     - _safeRestore(data): 安全恢复数据 // 解混淆Token，清空旧数据，导入新数据，处理Quota错误。
//     - _uploadToCustom(): 上传到自定义服务器 // POST负载到自定义URL，使用密码认证。
//     - _fetchFromCustom(password): 从自定义服务器拉取 // GET请求，使用密码认证，返回JSON。
//     - _uploadToGist(): 上传到Gist // POST或PATCH到Gist API，创建或更新备份。
//     - _fetchFromGist(token): 从Gist拉取 // GET Gist内容，处理截断，返回JSON。
// 
// - 6. UI RENDERER (DOM 操作)
//   - UI: UI渲染对象，处理界面更新和事件。
//     - els: DOM元素对象 // 元素引用集合
//     - init(): 初始化UI // 应用外观，渲染联系人，初始化CloudSync。
//     - applyAppearance(): 应用外观设置 // 设置背景、主题。
//     - toggleTheme(newTheme): 切换主题 // 更新设置，应用外观。
//     - switchView(viewName): 切换视图 // 显示/隐藏联系人列表或聊天视图。
//     - renderContacts(): 渲染联系人列表 // 使用模板克隆填充联系人数据，包括预览和红点。
//     - renderBookSelect(): 渲染世界书选择下拉 // 填充书籍选项，更新UI。
//     - updateCurrentBookSettingsUI(): 更新当前书设置UI // 设置书籍绑定角色选择。
//     - renderWorldInfoList(): 渲染世界信息条目列表 // 填充条目，高亮当前编辑。
//     - initWorldInfoTab(): 初始化世界信息Tab // 填充角色选择，渲染书籍和列表。
//     - showEditModal(oldText, onConfirmCallback): 显示编辑弹窗 // 填充旧文本，绑定确认回调。
//     - removeLatestAiBubbles(): 移除最新AI气泡 // 删除聊天中最后一个AI消息组。
//     - renderChatHistory(contact, isLoadMore, keepScrollPosition): 渲染聊天历史 // 渲染消息，支持分页加载，控制滚动。
//     - appendMessageBubble(text, sender, aiAvatarUrl, timestampRaw, historyIndex): 添加消息气泡 // 创建并追加气泡到组，支持动画。
//     - appendSeparator(shouldAnimate): 添加分割线 // 创建并追加分割线，支持动画。
//     - scrollToBottom(): 滚动到底部 // 将聊天容器滚动到最底。
//     - setLoading(isLoading, contactId): 设置加载状态 // 更新“正在输入”状态，仅针对当前联系人。
//     - updateRerollState(contact): 更新重滚按钮状态 // 根据历史启用/禁用重滚按钮。
//     - playWaterfall(fullText, avatar, timestamp): 播放瀑布式动画 // 逐段渲染AI响应，支持分割线和动画。
//     - initStatusBar(): 初始化状态栏 // 更新时间、电量显示，绑定事件。
//     - renderPresetMenu(): 渲染API预设菜单 // 填充预设选项，绑定事件。
// 
// - 7. APP CONTROLLER (业务逻辑)
//   - App: 应用控制器对象，管理事件和逻辑。
//     - els: DOM元素引用 // 来自UI.els
//     - init(): 初始化应用 // 加载存储，初始化UI，绑定事件，渲染联系人。
//     - enterChat(id): 进入聊天 // 设置当前ID，切换视图，渲染历史，更新状态。
//     - handleSend(isReroll): 处理发送消息 // 构建消息，调用API，渲染响应，处理重滚。
//     - openSettings(): 打开设置弹窗 // 填充设置值，渲染预设，初始化世界信息Tab。
//     - switchWorldInfoBook(bookId): 切换世界书 // 更新当前ID，刷新UI。
//     - bindCurrentBookToChar(charId): 绑定书籍到角色 // 更新书籍characterId，保存。
//     - loadWorldInfoEntry(uid): 加载世界信息条目 // 填充编辑器输入框，刷新列表。
//     - saveWorldInfoEntry(): 保存世界信息条目 // 更新或新建条目，保存，刷新UI。
//     - deleteWorldInfoEntry(): 删除世界信息条目 // 移除条目，保存，清空编辑器，刷新列表。
//     - clearWorldInfoEditor(): 清空编辑器 // 重置输入框，刷新列表。
//     - createNewBook(): 创建新书 // 提示名称，添加新书，保存，刷新UI。
//     - renameCurrentBook(): 重命名当前书 // 提示新名，更新，保存，刷新选择。
//     - deleteCurrentBook(): 删除当前书 // 确认后移除书，切换到第一本，保存，刷新UI。
//     - exportCurrentBook(): 导出当前书 // 转换为JSON，下载文件。
//     - handleImportWorldInfo(file): 处理导入世界信息 // 读取文件，导入新书，保存，刷新UI。
//     - handleSavePreset(): 保存API预设 // 提示名称，添加预设，保存，刷新菜单。
//     - handleLoadPreset(index): 加载API预设 // 填充URL、Key、Model。
//     - handleDeletePreset(): 删除API预设 // 确认后移除预设，保存，刷新菜单。
//     - saveSettingsFromUI(): 从UI保存设置 // 更新设置，处理URL，保存，应用外观。
//     - handleMessageAction(action): 处理消息动作 // 根据动作编辑/删除/复制消息，保存，刷新历史。
//     - hideMessageContextMenu(): 隐藏上下文菜单 // 设置display none，重置索引。
//     - showMessageContextMenu(msgIndex, rect): 显示上下文菜单 // 设置索引，绑定事件，防误触锁定。
//     - bindEvents(): 绑定事件 // 绑定所有点击、输入、触摸事件。
//     - readFile(file): 读取文件为Base64 // 返回Promise，读取DataURL。
//     - fetchModelsForUI(): 从UI获取模型 // 调用API.fetchModels，填充选项。
//     - bindImageUpload(inputId, imgId, inputUrlId, callback): 绑定图片上传 // 监听change，读取Base64，更新预览，调用回调。
//     - openEditModal(id): 打开编辑弹窗 // 设置编辑ID，填充值，显示/隐藏按钮。
//     - saveContactFromModal(): 从弹窗保存联系人 // 更新或新建联系人，保存，刷新UI。
// 
// - 8. UTILS & EXPORTS (工具与启动)
//   - formatTimestamp(): 格式化时间戳 // 返回如"Dec.26 14:30"的字符串。
//   - window.exportData(): 全局导出函数 // 异步导出备份JSON文件。
//   - window.importData(input): 全局导入函数 // 读取文件，确认覆盖，导入数据，处理Quota错误。
//   - renderer: marked.Renderer对象 // 自定义Markdown渲染器，处理表格。
//   - parseCustomMarkdown(text): 解析自定义Markdown // 使用marked解析，DOMPurify净化，返回HTML。
//   - cleanMarkdownForCopy(text): 清洗Markdown为纯文本 // 去除符号，适合复制。
//   - window.onload: 启动应用 // 调用App.init()。
*/



// =========================================
// 1. CONFIG & STATE (配置与状态)
// =========================================

const CONFIG = {
    STORAGE_KEY: 'teleWindy_char_data_v1',
    SETTINGS_KEY: 'teleWindy_settings_v1', 
    WORLD_INFO_KEY: 'teleWindy_world_info_v2', // ★★★ Key升级到v2以示区别
    CHAT_PAGE_SIZE: 15, // ★★★ 新增：每次加载的条数
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
    typingContactId: null, // ★★★ 新增：用于追踪哪个联系人正在输入，null表示无人输入
    visibleMsgCount: 15 // ★★★ 新增：当前聊天窗口显示的条数，默认为15
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

    // 在 API 类内部添加一个估算 Token 的辅助函数
// 1. 新增：放在 API 类里面的辅助函数，用来估算 Token
    estimateTokens(text) {
        if (!text) return 0;
        // 简单粗暴的估算公式：
        // 中文/日文/韩文 (CJK) 算 1.8 个 Token
        // 英文/数字/符号 算 0.35 个 Token (约3个字母=1Token)
        const cjkCount = (text.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
        const otherCount = text.length - cjkCount;
        return Math.ceil(cjkCount * 1.8 + otherCount * 0.35);
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
                max_tokens: 60000,
                temperature: 1.1
            });
        } else if (provider === 'gemini') {
            fetchUrl = API_URL.endsWith(':generateContent') ? API_URL : `${API_URL}/${MODEL}:generateContent?key=${API_KEY}`;
            options.body = JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: lastUserMsg }] }],
                system_instruction: { parts: [{ text: sysPrompts }] },
                generationConfig: { temperature: 1.1, maxOutputTokens: 60000 }
            });
        } else {
            // OpenAI Standard (SiliconFlow, DeepSeek, etc.)
            options.headers['Authorization'] = `Bearer ${API_KEY}`;
            options.body = JSON.stringify({
                model: MODEL,
                messages: messages,
                temperature: 1.1,
                max_tokens: 60000
            });
        }

            
        // ==========================================
        //  核心修改在这里：同时保留 Console 和 UI 日志
        // ==========================================
        

        try {
            // 我们“尝试”执行这些可能会出错的代码
            let requestBodyObject = options.body; // 默认它就是个对象

            // ★ 关键检查：如果它是个字符串，我们才需要 parse
            if (typeof options.body === 'string') {
                requestBodyObject = JSON.parse(options.body);
            }
            
            // 1.【你的功能】：F12 控制台打印
            // 现在我们打印的是确认过的、绝对是对象的 requestBodyObject
            console.log(`[${provider}] Sending...`, requestBodyObject);

            // 2.【新增功能】：格式化并保存到全局变量
            const jsonStr = JSON.stringify(requestBodyObject, null, 2);
            window.LAST_API_LOG = {
                content: jsonStr,
                tokens: this.estimateTokens(jsonStr)
            };

        } catch (error) {
            // 如果 try 代码块里任何一行出错了，程序会跳到这里，而不会崩溃！
            
            // ★ 在F12里打印一个更明确的错误信息，帮助我们调试
            console.error("【API日志记录失败】", error);
            
            // ★ 同时，把当时出问题的原始数据也打印出来，看看它到底长啥样
            console.log("【出问题的原始 options.body】:", options.body);

            // （可选）即使出错了，也可以给一个默认值，防止其他地方用到 window.LAST_API_LOG 时出错
            window.LAST_API_LOG = {
                content: '记录API日志时发生错误，请查看控制台详情。',
                tokens: 0
            };
        }

        // ==========================================


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
            const backup = gists.find(g => g.description === "TeleWindy Backup");

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

        // --- 1. 在这里插入防手抖代码 ---
        if (!confirm('即将从云端拉取旧数据覆盖当前数据，确认覆盖吗？')) {
            this.showStatus('操作已取消');
            return;
        }
        // -----------------------------

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
                this.showStatus('GitHub 同步成功！'+ new Date().toLocaleTimeString());
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

    // 【6. UI RENDERER】
    renderContacts() {
        if(!this.els.contactContainer) return;
        this.els.contactContainer.innerHTML = ''; // 清空列表

        // 1. 获取 HTML 里的模板
        const template = document.getElementById('tpl-contact-item');
        if (!template) {
            console.error("未找到模板: tpl-contact-item");
            return;
        }

        STATE.contacts.forEach(c => {
            // 2. 克隆模板 (cloneNode(true) 表示深拷贝)
            const clone = template.content.cloneNode(true);

            // 3. 填充数据
            
            // --- A. 填充名字 ---
            clone.querySelector('.contact-name').textContent = c.name;

            // --- B. 处理头像 ---
            const avatarWrapper = clone.querySelector('.avatar-wrapper');
            // 简单判断：如果是 base64 或 http 开头，就是图片，否则是 emoji/文字
            if (c.avatar && (c.avatar.startsWith('data:') || c.avatar.startsWith('http'))) {
                const img = document.createElement('img');
                img.src = c.avatar;
                img.className = 'contact-avatar';
                img.onerror = function() { this.style.display = 'none'; }; // 图片坏了就隐藏
                avatarWrapper.appendChild(img);
            } else {
                const div = document.createElement('div');
                div.className = 'contact-avatar';
                div.textContent = c.avatar || '🌼'; // 默认头像
                avatarWrapper.appendChild(div);
            }

            // --- C. 处理消息预览和红点逻辑 (原逻辑保持不变) ---
            let previewText = "暂无消息";
            let msgCount = 0;
            let showRedDot = false;
            
            const validMsgs = c.history.filter(m => m.role !== 'system');
            if (validMsgs.length > 0) {
                const lastMsgObj = validMsgs[validMsgs.length - 1];
                let content = lastMsgObj.content || '';
                
                // 正则去时间戳
                content = content.replace(/^\[[A-Z][a-z]{2}\.\d{1,2}\s\d{2}:\d{2}\]\s/, '');

                // ==========================================================
                // ★ 新增代码：在这里添加一行，用正则去除Markdown符号 ★
                // 这个表达式会移除星号、井号、下划线、反引号等常见Markdown标记
                content = content.replace(/(\*\*|__|\*|_|#|`|>{1,}\s|- |\d+\.\s|\[(.*?)\]\((.*?)\)|!\[(.*?)\]\((.*?)\))/g, '');
                // ==========================================================

                // 拆分段落
                const chunks = content.split(/\n\s*\n/).filter(p => p.trim());

                if (chunks.length > 0) {
                    let lastChunk = chunks[chunks.length - 1];
                    previewText = lastChunk.length > 30 ? lastChunk.slice(0, 30) + '…' : lastChunk;
                    msgCount = chunks.length;
                    
                    // ★ 修改逻辑：
                    // 必须同时满足两个条件：
                    // 1. 最后一条是 AI 发的
                    // 2. 角色身上有 "hasNewMsg" 标记
                    if (lastMsgObj.role === 'assistant' && c.hasNewMsg === true) {
                        showRedDot = true;
                    }
                }
            }

            // 填入预览文字
            clone.querySelector('.contact-preview').textContent = previewText;

            // --- D. 处理红点显示 ---
            const badge = clone.querySelector('.badge-count');
            if (showRedDot && msgCount > 0) {
                badge.textContent = msgCount;
                badge.style.display = 'block'; // 显示
            } else {
                badge.style.display = 'none'; // 隐藏
            }

            // --- E. 绑定点击事件 ---
            // 注意：clone 是一个 DocumentFragment，不能直接加 onclick
            // 我们需要给里面的 .contact-item 元素加事件
            const itemDiv = clone.querySelector('.contact-item');
            itemDiv.onclick = () => App.enterChat(c.id);

            // 4. 将填好数据的克隆体加入页面
            this.els.contactContainer.appendChild(clone);
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

    // ★★★ 渲染世界书：条目列表（纯逻辑版）★★★
    renderWorldInfoList() {
        const container = this.els.wiList;
        if (!container) return;
        container.innerHTML = '';

        const currentBook = STATE.worldInfoBooks.find(b => b.id === STATE.currentBookId);
        if (!currentBook) return;

        const currentEditingUid = document.getElementById('wi-edit-uid') 
            ? document.getElementById('wi-edit-uid').value 
            : null;

        currentBook.entries.forEach((entry) => {
            const item = document.createElement('div');
            item.classList.add('wi-list-item');

            // 高亮当前编辑中的条目
            if (entry.uid === currentEditingUid) {
                item.classList.add('wi-list-item-active');
            }

            // ★★★ 核心显示逻辑 ★★★
            let displayName = entry.comment || 
                (Array.isArray(entry.keys) && entry.keys.length > 0 ? entry.keys[0] : '未命名条目');

            const typeEmoji = entry.constant ? '📌' : '🔎';
            item.textContent = `${typeEmoji} ${displayName}`;

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

    createSingleBubble(text, sender, aiAvatarUrl, timestampRaw, historyIndex, shouldAnimate = true) {
        const template = document.getElementById('msg-template');
        const clone = template.content.cloneNode(true);
        
        const wrapper = clone.querySelector('.message-wrapper');
        const bubble = clone.querySelector('.message-bubble');
        const timeSpan = clone.querySelector('.msg-time');
        const avatarImg = clone.querySelector('.avatar-img');
        const avatarText = clone.querySelector('.avatar-text');

        wrapper.classList.add(sender);

        // ★★★ 核心修复：统一使用 innerHTML ★★★
        // 既然我们有 parseCustomMarkdown (含 DOMPurify 防御 XSS)，
        // 那么无论是 User 还是 AI，我们都应该先解析 MD，再安全地放入 innerHTML。
        // 这样用户的 **加粗** 和表格也能显示了。
        
        // 如果外部已经调用过 parseCustomMarkdown，text 就是 HTML 字符串
        // 如果外部传的是纯文本，我们在这里统一解析一下，防止漏网
        let htmlContent = text;
        
        // 简单判断一下：如果 text 里没有 HTML 标签，说明可能还没解析，我们解析它
        // (或者你也可以约定：调用 createSingleBubble 前必须先解析，这取决于你的 handleSend)
        // 最稳妥的方式是：假设传入的已经是处理好的 HTML（因为我们在 handleSend 里改过了）
        bubble.innerHTML = htmlContent; 
        
        // ★★★ 动效控制 ★★★
        if (shouldAnimate) {
            // 这里用你 CSS 里定义的类名，比如 'bubble-enter'
            // 确保你的 CSS 里有 .bubble-enter { animation: ... }
            wrapper.classList.add('bubble-enter'); 
        }

        bubble.dataset.msgIndex = historyIndex;
        bubble.className += ' selectable-message';

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

        return clone;
    },

    // 【6. UI RENDERER】
    showEditModal(oldText, onConfirmCallback) {
        const modal = document.getElementById('msg-edit-modal');
        const textarea = document.getElementById('edit-msg-textarea');
        const btnCancel = document.getElementById('btn-edit-cancel');
        const btnConfirm = document.getElementById('btn-edit-confirm');

        // 1. 填入旧内容
        textarea.value = oldText;

        // 2. 显示弹窗
        modal.style.display = 'flex';
        textarea.focus(); // 自动聚焦

        // 3. 定义关闭函数
        const closeModal = () => {
            modal.style.display = 'none';
            // 清理事件，防止多次绑定导致重复触发
            btnConfirm.onclick = null;
            btnCancel.onclick = null;
        };

        // 4. 绑定按钮事件
        btnCancel.onclick = () => {
            closeModal();
        };

        btnConfirm.onclick = () => {
            const newText = textarea.value;
            // 调用回调函数，把新文本传回去
            if (onConfirmCallback) onConfirmCallback(newText);
            closeModal();
        };
    },

    // 【6. UI RENDERER】
    removeLatestAiBubbles() {
        const container = this.els.chatMsgs;
        
        // 获取最后一个元素
        const lastEl = container.lastElementChild;
        if (!lastEl) return;

        // 判断身份
        const isAiGroup = lastEl.dataset.sender === 'ai'; 
        const isAiBubble = lastEl.classList.contains('ai'); // 兼容旧代码

        // 只要最后一个是 AI 发的，就删掉这一个（因为这一个里面包含了整组切分后的句子）
        if (isAiGroup || isAiBubble) {
            lastEl.remove();
            // 关键：不要用 while 循环，删一次就够了！
        }
    },


    // 渲染历史记录
// 渲染历史记录
    renderChatHistory(contact, isLoadMore = false, keepScrollPosition = false) {
        const chatMsgs = this.els.chatMsgs;
        const scrollContainer = chatMsgs.parentElement; 

        // ★★★ 1. 只有在“首次完全加载”时，才隐藏界面，防止闪烁 ★★★
        // 如果是加载更多或删除消息，不要隐藏，否则体验不好
        if (!isLoadMore && !keepScrollPosition) {
            chatMsgs.style.opacity = '0'; 
        }

        let previousScrollHeight = 0;
        if (isLoadMore) {
            previousScrollHeight = scrollContainer.scrollHeight;
        }

        chatMsgs.innerHTML = '';
        this.els.chatTitle.innerText = contact.name;

        const totalMsgs = contact.history.length;
        let startIndex = totalMsgs - STATE.visibleMsgCount;
        if (startIndex < 0) startIndex = 0;

        // 渲染“加载更多”按钮
        if (startIndex > 0) {
            const loadMoreBtn = document.createElement('div');
            loadMoreBtn.className = 'load-more-btn';
            loadMoreBtn.innerText = '点击加载更多消息';
            loadMoreBtn.onclick = () => {
                STATE.visibleMsgCount += CONFIG.CHAT_PAGE_SIZE;
                this.renderChatHistory(contact, true);
            };
            chatMsgs.appendChild(loadMoreBtn);
        }

        // 遍历并渲染消息
        for (let i = startIndex; i < totalMsgs; i++) {
            const msg = contact.history[i];
            const historyIndex = i; 

            if (msg.role === 'system') continue;
            
            const sender = msg.role === 'assistant' ? 'ai' : 'user';
            let cleanText = typeof msg === 'string' ? msg : msg.content || '';
            if (sender === 'user') {
                cleanText = cleanText.replace(/^\[[A-Z][a-z]{2}\.\d{1,2}\s\d{2}:\d{2}\]\s/, '');
            }

            if (sender === 'ai') {
                 cleanText = cleanText.replace(/(^|\n)>\s*/g, '\n\n');
            }

            const msgTime = typeof msg === 'string' ? null : msg.timestamp;
            const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim());
            if (paragraphs.length === 0 && !cleanText.trim()) continue;

            const group = document.createElement('div');
            group.className = 'message-group';
            group.dataset.msgIndex = historyIndex;
            group.dataset.sender = sender;

            if (paragraphs.length > 0) {
                paragraphs.forEach(p => {
                    const trimmedP = p.trim();
                    if (trimmedP === '---') {
                        const separator = document.createElement('div');
                        separator.className = 'chat-separator'; 
                        group.appendChild(separator);
                    } else {
                        const formattedContent = parseCustomMarkdown(trimmedP);
                        const bubbleClone = this.createSingleBubble(formattedContent, sender, contact.avatar, msgTime, historyIndex, false);
                        group.appendChild(bubbleClone);
                    }
                });
            } else {
                const formattedContent = parseCustomMarkdown(cleanText.trim());
                const bubbleClone = this.createSingleBubble(formattedContent, sender, contact.avatar, msgTime, historyIndex, false);
                group.appendChild(bubbleClone);
            }

            chatMsgs.appendChild(group);
        }

        // ★★★ 2. 滚动与显形处理 ★★★
        if (isLoadMore) {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = newScrollHeight - previousScrollHeight;
        } else if (keepScrollPosition) {
            // 保持不动
        } else {
            // 首次加载
            // 先立即滚一次（虽然可能不准，但先滚了再说）
            this.scrollToBottom();

            // 使用 requestAnimationFrame 在下一帧恢复显示
            // 这样用户看到界面的时候，已经是在底部了
            requestAnimationFrame(() => {
                this.scrollToBottom(); // 双重保险，再滚一次
                chatMsgs.style.opacity = '1'; // 瞬间显示，用户感觉不到闪烁
            });
        }

        this.updateRerollState(contact);
    },


/* 1212 - Fixed */
    appendMessageBubble(text, sender, aiAvatarUrl, timestampRaw, historyIndex = null) {
        if (historyIndex === null || historyIndex === undefined) {
            const contact = STATE.contacts.find(c => c.id === STATE.currentContactId);
            if (contact && contact.history.length > 0) {
                historyIndex = contact.history.length - 1; 
            } else {
                historyIndex = 0;
            }
        }

        // ★★★ 修改：最后一个参数传 true，表示新消息需要动画 ★★★
        const clone = this.createSingleBubble(text, sender, aiAvatarUrl, timestampRaw, historyIndex, true);

        const existingGroup = Array.from(this.els.chatMsgs.children)
            .reverse()
            .find(group => group.classList.contains('message-group') && 
                        parseInt(group.dataset.msgIndex) === historyIndex);

        if (existingGroup) {
            existingGroup.appendChild(clone);
        } else {
            const group = document.createElement('div');
            group.className = 'message-group';
            group.dataset.msgIndex = historyIndex; 
            group.dataset.sender = sender;
            group.appendChild(clone);
            this.els.chatMsgs.appendChild(group);
        }

        this.scrollToBottom();
    },

    // 【修改后】插入分割线，支持动效参数
    appendSeparator(shouldAnimate = false) {
        const separator = document.createElement('div');
        separator.className = 'chat-separator';
        
        // 如果需要动画，就加上这个类
        if (shouldAnimate) {
            separator.classList.add('animate');
        }
        
        this.els.chatMsgs.appendChild(separator);
        this.scrollToBottom();
    },

    scrollToBottom() {
        this.els.chatMsgs.parentElement.scrollTop = this.els.chatMsgs.parentElement.scrollHeight;
    },

    // UI渲染：对方正在输入
    setLoading(isLoading, contactId) { // ★★★ 参数 contactId 依然是必需的
        // 1. 更新全局状态，让程序知道“谁”在输入
        STATE.typingContactId = isLoading ? contactId : null;
        
        // 2. 关键检查：只有当这个状态更新是针对“当前打开的”聊天窗口时，才刷新UI
        if (contactId === STATE.currentContactId) {
            this.els.sendBtn.disabled = isLoading;

            if (isLoading) {
                // ★★★ 恢复您原来的文本
                this.els.status.innerText = '对方正在输入'; 
                this.els.status.classList.add('typing');
            } else {
                // ★★★ 恢复您原来的文本
                this.els.status.innerText = '在线';
                this.els.status.classList.remove('typing');
            }
        }
    },

    updateRerollState(contact) {
        const hasHistory = contact.history.some(m => m.role === 'assistant');
        this.els.rerollBtn.style.opacity = hasHistory ? '1' : '0.5';
        this.els.rerollBtn.disabled = !hasHistory;
    },


    // 在 UI 对象中
    async playWaterfall(fullText, avatar, timestamp, historyIndex) { // <-- 接受新参数
        // 1. Pre-process text
        const processedText = fullText.replace(/(^|\n)>\s*/g, '\n\n');
        const paragraphs = processedText.split(/\n\s*\n/).filter(p => p.trim());

        // 2. Create the container group
        const group = document.createElement('div');
        group.className = 'message-group';
        group.dataset.sender = 'ai';
        
        // ★★★ 核心修复 (Part 3): 将接收到的索引应用到 group 上 ★★★
        group.dataset.msgIndex = historyIndex;

        this.els.chatMsgs.appendChild(group);
        
        // 3. Loop through paragraphs and add content to the new group
        for (let i = 0; i < paragraphs.length; i++) {
            if (i > 0) await new Promise(r => setTimeout(r, 400));
            
            const p = paragraphs[i].trim();

            if (p === '---') {
                const separator = document.createElement('div');
                separator.className = 'chat-separator animate';
                group.appendChild(separator);
            } else {
                const htmlContent = parseCustomMarkdown(p);
                // It's also good practice to pass the correct index down
                const bubbleClone = this.createSingleBubble(htmlContent, 'ai', avatar, timestamp, historyIndex, true);
                group.appendChild(bubbleClone);
            }
            
            this.scrollToBottom();
        }
    },

    // ================顶栏状态栏-------------------
    initStatusBar() { 
        // 1. 时间显示逻辑
        const timeEl = document.getElementById('sb-time');
        const updateTime = () => {
            const now = new Date();
            // 获取 HH:mm 格式
            const timeStr = now.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
            });
            if (timeEl) timeEl.textContent = timeStr;
        };
        updateTime(); 
        setInterval(updateTime, 1000); 

        // 2. 电量显示逻辑
        const batTextEl = document.getElementById('sb-battery-text');
        const batLevelEl = document.getElementById('sb-battery-level');
        
        const updateBatteryUI = (level, isCharging) => {
            const percentage = Math.round(level * 100);
            if(batTextEl) batTextEl.textContent = `${percentage}%`;
            if(batLevelEl) {
                batLevelEl.style.width = `${percentage}%`;
                if (isCharging) {
                    batLevelEl.style.backgroundColor = '#a8d94c85';
                } else if (level < 0.2) {
                    batLevelEl.style.backgroundColor = '#ff3b3085';
                } else {
                    batLevelEl.style.backgroundColor = '#4cd96485'; 
                }
            }
        };

        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                updateBatteryUI(battery.level, battery.charging);
                battery.addEventListener('levelchange', () => {
                    updateBatteryUI(battery.level, battery.charging);
                });
                battery.addEventListener('chargingchange', () => {
                    updateBatteryUI(battery.level, battery.charging);
                });
            }).catch(err => {
                console.log('Battery API failed:', err);
            });
        } else {
            console.log('Battery API not supported.');
        }
    }, // <--- 别忘了这里的逗号，因为下面还有 renderPresetMenu

    // ================顶栏状态栏结束-------------------

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

        // ★ 建议加这一句，确保 App.els 拿到的是初始化后的最新 DOM 元素
        this.els = UI.els; 
        
        // [关键点 3] 绑定点击事件
        this.bindEvents();
        
        // [关键点 4] ★★★ 新增：数据加载好了，必须手动让 UI 渲染出联系人列表
        // 假设你的 UI 对象里有一个叫 renderContacts 或 renderSidebar 的方法用来画列表
        // 如果你的 UI.init() 里已经包含渲染逻辑，这行也可以省略，但显式调用更保险
        if (typeof UI.renderContacts === 'function') {
            UI.renderContacts();
        }
        
        UI.initStatusBar();
        
        console.log("App initialized, contacts loaded:", STATE.contacts.length);
    },

    // APP CONTROLLER.enterChat
    enterChat(id) {
        const contact = STATE.contacts.find(c => c.id === id);
        if (!contact) return;
        
        STATE.currentContactId = id;
        STATE.visibleMsgCount = CONFIG.CHAT_PAGE_SIZE;

        UI.switchView('chat');

        // ★★★ 新增：进入聊天时，根据全局状态，正确设置顶部的“正在输入”或“在线”状态
        // 检查当前是不是应该显示“正在输入”
        const isLoading = STATE.typingContactId === id;
        // 更新UI（即使isLoading是false，也需要调用一次来把状态文字设置为当前联系人名）
        UI.setLoading(isLoading, id);


        if (contact.hasNewMsg) {
            contact.hasNewMsg = false; 
            Storage.saveContacts(); 
        }

        UI.renderChatHistory(contact);
        UI.renderContacts(); 
    },

// APP CONTROLLER.handleSend
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
            // 存入历史记录的是原始文本（保留Markdown符号）
            const newUserMsg = { role: 'user', content: `[${timestamp}] ${userText}`, timestamp: timestamp };
            contact.history.push(newUserMsg);
            const currentMsgIndex = contact.history.length - 1;

            // ★★★ 修改开始：用户消息渲染逻辑 ★★★
            const paragraphs = userText.split(/\n\s*\n/).filter(p => p.trim());
            
            // 1. 创建用户消息的“容器”组
            const group = document.createElement('div');
            group.className = 'message-group';
            group.dataset.msgIndex = currentMsgIndex;
            group.dataset.sender = 'user';
            
            // 2. 遍历段落，将内容添加到新建的 group 中
            if (paragraphs.length > 0) {
                paragraphs.forEach(p => {
                    const trimmedP = p.trim();
                    if (trimmedP === '---') {
                        // 创建分割线并添加到 group
                        const separator = document.createElement('div');
                        separator.className = 'chat-separator animate';
                        group.appendChild(separator);
                    } else {
                        // 创建气泡并添加到 group
                        const formattedContent = parseCustomMarkdown(trimmedP);
                        const bubble = UI.createSingleBubble(formattedContent, 'user', null, timestamp, currentMsgIndex, true);
                        group.appendChild(bubble);
                    }
                });
            } else {
                 const formattedContent = parseCustomMarkdown(userText);
                 const bubble = UI.createSingleBubble(formattedContent, 'user', null, timestamp, currentMsgIndex, true);
                 group.appendChild(bubble);
            }

            // 3. 把完整构建好的 group 一次性添加到聊天界面
            UI.els.chatMsgs.appendChild(group);
            UI.scrollToBottom();

            UI.els.input.value = '';            
            UI.els.input.style.height = '38px'; 
            if (window.innerWidth < 800) UI.els.input.blur();
            else UI.els.input.focus(); 
        }

        await Storage.saveContacts();
        
        UI.setLoading(true, contact.id);

        const recentHistory = contact.history.filter(m => m.role !== 'system').slice(-30).map(msg => {
            let content = msg.content || msg;
            if (msg.role === 'user') {
                // 去除可能存在的时间戳前缀，发给API纯净文本
                if(content.startsWith('[')) {
                     content = content.replace(/^\[.*?\]\s/, '');
                }
                return { role: 'user', content: content };
            } else {
                return { role: 'assistant', content: content };
            }
        });

        const worldInfoPrompt = WorldInfoEngine.scan(userText, recentHistory, contact.id, contact.name);
        const messagesToSend = [
            { role: 'system', content: CONFIG.SYSTEM_PROMPT }, 
            { role: 'system', content: `=== 角色设定 ===\n${contact.prompt}` }
        ];
        if (worldInfoPrompt) {
            messagesToSend.push({ role: 'system', content: `=== 世界知识/环境信息 ===\n${worldInfoPrompt}` });
            console.log("【World Info Injected】", worldInfoPrompt);
        }
        recentHistory.forEach(h => messagesToSend.push(h));

        try {
            const aiText = await API.chat(messagesToSend, STATE.settings);
            const aiTimestamp = formatTimestamp();
            
            contact.history.push({ role: 'assistant', content: aiText, timestamp: aiTimestamp });

            // ★★★ 核心修复 (Part 1): 获取新消息的索引 ★★★
            const newAiMessageIndex = contact.history.length - 1;
            
            if (STATE.currentContactId !== contact.id) {
                STATE.typingContactId = null; 
                contact.hasNewMsg = true;
                await Storage.saveContacts();
                UI.renderContacts(); 
                return; 
            }

            await Storage.saveContacts();
            UI.renderContacts(); 

            // ★★★ 核心修复 (Part 2): 将索引传递给 playWaterfall ★★★
            await UI.playWaterfall(aiText, contact.avatar, aiTimestamp, newAiMessageIndex); 
            
            UI.setLoading(false, contact.id);
            
        } catch (error) {
            console.error(error);
            if (STATE.currentContactId === contact.id) {
                UI.setLoading(false, contact.id);
                const errorIndex = contact.history.length > 0 ? contact.history.length - 1 : 0;
                UI.appendMessageBubble(`(发送失败: ${error.message})`, 'ai', contact.avatar, null, errorIndex);
            } else {
                STATE.typingContactId = null;
            }
        } finally {
            if (STATE.currentContactId === contact.id) {
                UI.updateRerollState(contact);
            }
            if (window.innerWidth >= 800 && UI.els.input) UI.els.input.focus();
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

        // ★★★ 新增的提示代码就在这里！ ★★★
        alert(`条目 [${entry.comment}] 已保存成功！`); 
        
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
    },

    /*1212*/
    // 【7. APP CONTROLLER】
    handleMessageAction(action) {
        // 1. 获取选中索引
        const msgIndex = STATE.selectedMessageIndex;

        // 2. 获取当前角色
        const currentId = STATE.currentContactId;
        const currentContact = STATE.contacts.find(c => c.id === currentId);

        if (!currentContact) {
            console.error("错误：找不到当前角色");
            return;
        }

        // --- 核心数据获取 ---
        const msgData = currentContact.history[msgIndex]; 

        if (!msgData) {
            console.error("找不到该条消息，索引:", msgIndex);
            return;
        }

        // 定义时间戳正则（Edit和Copy公用）
        const timestampRegex = /^\[[A-Z][a-z]{2}\.\d{1,2}\s\d{2}:\d{2}\]\s/;

        // 3. 执行动作
        if (action === 'edit') {
            let originalContent = msgData.content;
            let timestampPart = ''; // 用于暂存时间戳头
            let cleanContent = originalContent;

            const match = originalContent.match(timestampRegex);
            if (match) {
                timestampPart = match[0]; // 比如 "[Dec.14 16:39] "
                cleanContent = originalContent.replace(timestampRegex, ''); // 去掉时间戳
            }

            // 传入干净的文本给弹窗
            UI.showEditModal(cleanContent, (newText) => {
                // 如果文本有变化
                if (newText && newText !== cleanContent) {
                    // ★ 核心：保存时把原时间戳拼回去
                    msgData.content = timestampPart + newText;
                    
                    Storage.saveContacts(); 

                    // ★★★ 核心修复：加上 (..., false, true) ★★★
                    // 告诉渲染函数：“不要加载更多，但要保持滚动位置”
                    UI.renderChatHistory(currentContact, false, true);
                }
            });
        } 
        else if (action === 'delete') {
            if (confirm("确定要删除这条消息吗？")) {

                // 1. 获取当前滚动条位置（保险起见，虽然通常不需要手动恢复）
                const scrollContainer = UI.els.chatMsgs.parentElement;
                const currentScrollTop = scrollContainer.scrollTop;

                // 2. 执行删除数据
                currentContact.history.splice(msgIndex, 1);

                // 3. 保存
                Storage.saveContacts();

                // 4. ★★★ 重新渲染，并传入 true (keepScrollPosition) ★★★
                // 这样 UI 就不会自动滚到底部了
                UI.renderChatHistory(currentContact, false, true); 
            }
        }
        else if (action === 'copy') {
            // ★★★ 修改：复制逻辑 ★★★
            let contentToCopy = msgData.content;
            
            // 1. 先去除时间戳 (保留纯内容)
            if (timestampRegex.test(contentToCopy)) {
                contentToCopy = contentToCopy.replace(timestampRegex, '');
            }

            // 2. 清洗 Markdown 符号 (调用我们在 Utils 里写的新函数)
            // 这样剪贴板里就是纯纯的文本了，保留了换行，但没有 * # >
            contentToCopy = cleanMarkdownForCopy(contentToCopy);

            navigator.clipboard.writeText(contentToCopy)
                // .then(() => {
                //     alert("已复制纯文本"); 
                // })
                // .catch(err => {
                //     console.error("复制失败:", err);
                // });
        }
    },

    hideMessageContextMenu() {
        if (this.els.msgContextMenu) {
            this.els.msgContextMenu.style.display = 'none';
        }
        STATE.selectedMessageIndex = null;
    },


    // 【7. APP CONTROLLER】
    showMessageContextMenu(msgIndex, rect) {
        STATE.selectedMessageIndex = msgIndex;

        const menu = document.getElementById('msg-context-menu');

        // --- 事件绑定区域 (保持你原有的逻辑不变，只绑定一次) ---
        if (!menu.dataset.initialized) {
            menu.dataset.initialized = 'true';
            menu.addEventListener('click', e => {
                const btn = e.target.closest('button');
                if (!btn) return;
                const action = btn.dataset.action;
                // 如果处于防误触锁定状态，直接无视点击
                if (menu.classList.contains('locked')) return; 

                if (action === 'cancel') {
                    this.hideMessageContextMenu();
                    return;
                }
                // 这里的 this 需要确保指向 Controller 实例
                // 如果是在回调里，可能需要用 App.handleMessageAction 或箭头函数上下文
                this.handleMessageAction(action); 
                this.hideMessageContextMenu();
            });
            menu.querySelector('.menu-backdrop').addEventListener('click', () => {
                this.hideMessageContextMenu();
            });
        }

        // --- ★★★★★ 核心修改：防误触锁 ★★★★★ ---
        
        // 1. 先加上锁定 class (或者直接用 style)
        menu.classList.add('locked');
        menu.style.pointerEvents = 'none'; // 物理禁用点击
        menu.style.display = 'flex';       // 显示出来
        
        // 2. 300毫秒后解锁
        setTimeout(() => {
            menu.classList.remove('locked');
            menu.style.pointerEvents = 'auto'; // 恢复点击
        }, 300);
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


        // --- 长按相关变量 (优化版) ---
        let longPressTimer = null;
        let startX = 0;
        let startY = 0;
        const LONG_PRESS_DURATION = 380;

        // 1. 触摸开始
        UI.els.chatMsgs.addEventListener('touchstart', e => {
            // ★★★ 核心修改：同时获取 group 和 bubble ★★★
            const bubble = e.target.closest('.message-bubble'); // 用于定位
            const group = e.target.closest('.message-group');   // 用于获取索引

            // 如果点的不是一个消息组，或者用户正在选词，则不触发
            if (!group || window.getSelection().toString().length > 0) return;
            
            // 从 group 获取索引
            const msgIndex = parseInt(group.dataset.msgIndex);
            if (isNaN(msgIndex)) return;

            // 记录起始坐标
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            
            longPressTimer = setTimeout(() => {
                e.preventDefault();
                if (window.getSelection().toString().length > 0) return;
                
                // ★★★ 使用 bubble 的位置来弹出菜单，如果 bubble 存在的话 ★★★
                // 这样即使用户按在分割线上，也能在 group 的位置弹出菜单
                const rect = bubble ? bubble.getBoundingClientRect() : group.getBoundingClientRect();
                App.showMessageContextMenu(msgIndex, rect);

            }, LONG_PRESS_DURATION);

        }, { passive: false });

        // 2. 触摸移动 (这段逻辑不用改)
        UI.els.chatMsgs.addEventListener('touchmove', e => {
            if (!longPressTimer) return;
            const moveX = e.touches[0].clientX;
            const moveY = e.touches[0].clientY;
            if (Math.abs(moveX - startX) > 10 || Math.abs(moveY - startY) > 10) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }, { passive: true });

        // 3. 触摸结束 (这段逻辑不用改)
        UI.els.chatMsgs.addEventListener('touchend', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }, { passive: true });

        // 4. 桌面端鼠标长按 (应用相同的修改逻辑)
        UI.els.chatMsgs.addEventListener('mousedown', e => {
            if (e.button !== 0) return; 
            // ★★★ 核心修改：同时获取 group 和 bubble ★★★
            const bubble = e.target.closest('.message-bubble'); // 用于定位
            const group = e.target.closest('.message-group');   // 用于获取索引

            if (!group) return;
            
            const msgIndex = parseInt(group.dataset.msgIndex);
            if (isNaN(msgIndex)) return;

            longPressTimer = setTimeout(() => {
                if (window.getSelection().toString().length > 0) return;
                
                // ★★★ 使用 bubble 或 group 的位置来弹出菜单 ★★★
                const rect = bubble ? bubble.getBoundingClientRect() : group.getBoundingClientRect();
                App.showMessageContextMenu(msgIndex, rect);
            }, LONG_PRESS_DURATION);
        });

        // 这两行不用改
        UI.els.chatMsgs.addEventListener('mouseup', () => clearTimeout(longPressTimer));
        UI.els.chatMsgs.addEventListener('mouseleave', () => clearTimeout(longPressTimer));


        // 日志
        // 1. 打开日志弹窗的按钮
        document.getElementById('btn-show-log').addEventListener('click', () => {
            const logModal = document.getElementById('log-display-modal');
            const logContent = document.getElementById('log-content');
            const logToken = document.getElementById('log-token-count');
            
            // 从全局变量读取刚才 API 存进去的数据
            if (window.LAST_API_LOG) {
                logContent.innerText = window.LAST_API_LOG.content;
                logToken.innerText = `(估算 Tokens: ${window.LAST_API_LOG.tokens})`;
            } else {
                logContent.innerText = "本次会话尚未发送过消息，暂无日志。";
                logToken.innerText = "(Token: 0)";
            }
            
            logModal.classList.remove('hidden');
        });

        // 2. 关闭日志弹窗的按钮 (右上角 X)
        document.getElementById('btn-close-log').addEventListener('click', () => {
            document.getElementById('log-display-modal').classList.add('hidden');
        });

        // 3. (可选) 点击遮罩层也可以关闭
        document.getElementById('log-display-modal').addEventListener('click', (e) => {
            if (e.target.id === 'log-display-modal') {
                e.target.classList.add('hidden');
            }
        });

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

        // 获取新增的日志区域元素
        const logSection = document.getElementById('log-section');

        if (id) {
            // === 编辑模式 (在聊天界面打开) ===
            const c = STATE.contacts.find(x => x.id === id);
            title.innerText = '聊天菜单'; // 你说你想改成聊天菜单
            iName.value = c.name;
            iAvatar.value = c.avatar;
            iPrompt.value = c.prompt;
            preview.src = (c.avatar.startsWith('data:') || c.avatar.startsWith('http')) ? c.avatar : '';
            
            // 显示危险区域
            document.getElementById('modal-delete').style.display = 'block';
            document.getElementById('modal-clear-history').style.display = 'block';

            // 【新增】：显示日志按钮
            if (logSection) logSection.style.display = 'block';

        } else {
            // === 新建模式 ===
            title.innerText = '新建角色';
            iName.value = '';
            iAvatar.value = '🙂';
            iPrompt.value = '你是一个...';
            preview.src = '';
            
            // 隐藏危险区域
            document.getElementById('modal-delete').style.display = 'none';
            document.getElementById('modal-clear-history').style.display = 'none';

            // 【新增】：隐藏日志按钮 (新建时没有日志可看)
            if (logSection) logSection.style.display = 'none';
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


// ==============mrakdown=================

// 在你的 JS 文件顶部，或使用前
const renderer = new marked.Renderer();

// 重写 table 的渲染逻辑
renderer.table = function (header, body) {
    // 为生成的 table 包裹一个 div 容器，方便添加滚动样式
    return `
        <div class="table-container">
            <table>
                <thead>${header}</thead>
                <tbody>${body}</tbody>
            </table>
        </div>
    `;
};

// 在 parseCustomMarkdown 中使用这个自定义的 renderer
function parseCustomMarkdown(text) {
    // ... (之前的代码) ...
    
    // 使用自定义渲染器
    let rawHtml = marked.parse(processedText, { renderer: renderer }); 
    
    let sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        // 允许 div 标签和 class 属性，以便我们的滚动容器生效
        ADD_TAGS: ['div'],
        ADD_ATTR: ['class'] 
    });

    return sanitizedHtml;
}

/**
 * 1. 升级版 Markdown 解析器 (用于气泡渲染)
 *    - 使用 marked.js 解析 Markdown 为 HTML
 *    - 使用 DOMPurify 净化 HTML 防止 XSS
 */
function parseCustomMarkdown(text) {
    if (!text) return '';

    // 预处理：保留你对引用 `>` 的特殊处理逻辑（如果需要的话）
    // 如果你希望 `>` 仍然是换行，可以在这里处理
    let processedText = text.replace(/^>\s*/gm, '\n\n'); 

    // 配置 marked.js
    // gfm: true 启用 GitHub Flavored Markdown，支持表格等
    // breaks: true 将单个换行符也渲染为 <br>，符合聊天习惯
    marked.setOptions({
        gfm: true,
        breaks: true, 
        mangle: false,
        headerIds: false,
    });

    // 1. 使用 marked 将 Markdown 文本解析为 HTML 字符串
    let rawHtml = marked.parse(processedText);

    // 2. 使用 DOMPurify 清理生成的 HTML，防止任何潜在的 XSS 攻击
    //    这是替代你手动替换 < > & 的更安全、更全面的方法
    let sanitizedHtml = DOMPurify.sanitize(rawHtml);

    return sanitizedHtml;
}

/**
 * 2. 纯文本清洗器 (用于复制)
 *    这个函数基本可以保持不变，因为它就是为了去除格式
 */
function cleanMarkdownForCopy(text) {
    if (!text) return '';
    let clean = text;
    clean = clean.replace(/^>\s*/gm, '');      // 去引用
    clean = clean.replace(/^#+\s+/gm, '');     // 去标题
    clean = clean.replace(/^\*\s+/gm, '');     // 去列表头的 *
    clean = clean.replace(/[*_~`#|]/g, '');    // 去除所有常见的 Markdown 符号
    
    // 对于表格，可能需要更复杂的逻辑来格式化为纯文本，但简单去除符号通常也够用
    // 例如，将 | 替换为空格或 tab
    clean = clean.replace(/\|/g, '  ');

    return clean;
}


// 启动应用
window.onload = () => App.init();























