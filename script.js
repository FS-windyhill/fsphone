/**
 * TeleWindy Core Logic - Refactored
 * 结构说明：
 * 1. CONFIG & STATE: 全局配置常量与运行时状态
 * 2. STORAGE SERVICE: 负责数据的持久化 (LocalStorage)
 * 3. API SERVICE: 负责与 LLM 通信及模型拉取
 * 4. UI RENDERER: 负责界面的 DOM 操作与渲染
 * 5. APP CONTROLLER: 核心业务逻辑 (事件绑定、初始化)
 */

// =========================================
// 1. CONFIG & STATE (配置与状态)
// =========================================

const CONFIG = {
    STORAGE_KEY: 'teleWindy_char_data_v1',
    OLD_STORAGE_KEY: 'octopus_coach_chat_history', // 兼容旧版
    SETTINGS_KEY: 'teleWindy_settings_v1',         // 新增：专门存设置
    DEFAULT: {
        API_URL: 'https://api.siliconflow.cn/v1/chat/completions',
        MODEL: 'zai-org/GLM-4.6',
        // 建议留空，强制用户输入，或者放一个公共体验 Key
        API_KEY: '', 
        WALLPAPER: 'wallpaper.jpg',
        USER_AVATAR: 'user.jpg',
        GIST_TOKEN: '',        // ← 新增这一行
    },
    SYSTEM_PROMPT: `
请完全代入角色设定，以该角色的语气和思考方式，与用户交流。
这里是线上聊天。
每次输出3~9句话左右，每两句话中间空一行。自由回答，不必拘束。
<think>
沉入世界，顺其自然。因此，不再需要前置思考了。
</think>
`
};

// 运行时状态
const STATE = {
    contacts: [],
    currentContactId: null,
    settings: {}, // 存放 API Key, URL, Model, Wallpaper 等
    isTyping: false
};

// =========================================
// 2. STORAGE SERVICE (数据存储)
// =========================================
const Storage = {
    // 增强版的 Storage.load 函数
    load() {
        // 1. 加载设置
        const settingsRaw = localStorage.getItem(CONFIG.SETTINGS_KEY);
        let loadedSettings = settingsRaw ? JSON.parse(settingsRaw) : {};

        // === 关键修复：合并默认值和加载值 ===
        STATE.settings = { ...CONFIG.DEFAULT, ...loadedSettings };

        // 兼容旧的散装存储
        if (!settingsRaw) {
            const oldUserAvatar = localStorage.getItem('fs_user_avatar');
            const oldWallpaper = localStorage.getItem('fs_wallpaper');
            if (oldUserAvatar) STATE.settings.USER_AVATAR = oldUserAvatar;
            if (oldWallpaper) STATE.settings.WALLPAPER = oldWallpaper;
        }

        // 2. 加载联系人
        const contactsRaw = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (contactsRaw) {
            STATE.contacts = JSON.parse(contactsRaw);
        } else {
            this.migrateOldData();
        }

        // 兜底：如果没有联系人，创建一个默认的
        if (STATE.contacts.length === 0) {
            STATE.contacts.push({
                id: Date.now().toString(),
                name: '小真蛸',
                avatar: '😊',
                prompt: '你是一个温柔可爱的助手小真蛸，说话请带上颜文字。',
                history: []
            });
        }
    },

    saveContacts() {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(STATE.contacts));
    },

    saveSettings() {
        localStorage.setItem(CONFIG.SETTINGS_KEY, JSON.stringify(STATE.settings));
    },

    migrateOldData() {
        const oldData = localStorage.getItem(CONFIG.OLD_STORAGE_KEY);
        if (oldData) {
            try {
                const history = JSON.parse(oldData);
                STATE.contacts.push({
                    id: 'legacy_' + Date.now(),
                    name: '小真蛸 (旧版)',
                    avatar: 'char.jpg',
                    prompt: '旧版数据迁移角色',
                    history: history
                });
                localStorage.removeItem(CONFIG.OLD_STORAGE_KEY);
            } catch (e) { console.error('Migration failed', e); }
        }
    }
};

// =========================================
// 3. API SERVICE (网络请求)
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

        // --- 构建请求体 ---
        if (provider === 'claude') {
            options.headers['x-api-key'] = API_KEY;
            options.headers['anthropic-version'] = '2023-06-01';
            options.body = JSON.stringify({
                model: MODEL,
                system: sysPrompts,
                messages: [{ role: "user", content: lastUserMsg }],
                max_tokens: 4096,
                temperature: 1.1
            });
        } else if (provider === 'gemini') {
            fetchUrl = API_URL.endsWith(':generateContent') ? API_URL : `${API_URL}/${MODEL}:generateContent?key=${API_KEY}`;
            options.body = JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: lastUserMsg }] }],
                system_instruction: { parts: [{ text: sysPrompts }] },
                generationConfig: { temperature: 1.1, maxOutputTokens: 4096 }
            });
        } else {
            // OpenAI Standard
            options.headers['Authorization'] = `Bearer ${API_KEY}`;
            options.body = JSON.stringify({
                model: MODEL,
                messages: messages,
                temperature: 1.1,
                max_tokens: 4096
            });
        }

        // ==========================================================
        // ★★★ 你的 Log 回来啦！ ★★★
        // ==========================================================
        console.log(`👇👇👇 === [${provider.toUpperCase()}] 真实发送给 AI 的请求体 (Raw Body) === 👇👇👇`);
        try {
            console.log(JSON.parse(options.body)); 
        } catch(e) {
            console.log(options.body); 
        }
        console.log('👆👆👆 ========================================================== 👆👆👆');

        // --- 发送请求 ---
        const response = await fetch(fetchUrl, options);
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }
        
        const data = await response.json();
        
        // --- 解析响应 ---
        if (provider === 'claude') return data.content[0].text.trim();
        if (provider === 'gemini') return data.candidates[0].content.parts[0].text.trim();
        return data.choices[0].message.content.trim();
    }
};

// =========================================
// 4. UI RENDERER (DOM 操作)
// =========================================
const UI = {
    // 缓存常用 DOM
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
        
        // Settings Inputs
        settingUrl: document.getElementById('custom-api-url'),
        settingKey: document.getElementById('custom-api-key'),
        settingModel: document.getElementById('custom-model-select'),
        fetchBtn: document.getElementById('fetch-models-btn')
    },

    init() {
        this.applyTheme();
        this.renderContacts();
    },

    applyTheme() {
        const { WALLPAPER } = STATE.settings;
        document.body.style.backgroundImage = `url('${WALLPAPER}')`;
        if (WALLPAPER === 'wallpaper.jpg') {
            document.body.style.backgroundColor = '#f2f2f2';
        }
    },

    switchView(viewName) {
        if (viewName === 'chat') {
            this.els.viewList.classList.add('hidden');
            this.els.viewChat.classList.remove('hidden');
        } else {
            this.els.viewChat.classList.add('hidden');
            this.els.viewList.classList.remove('hidden');
            STATE.currentContactId = null;
            this.renderContacts(); // 刷新列表最新消息
        }
    },

    renderContacts() {
        this.els.contactContainer.innerHTML = '';
        STATE.contacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'contact-item';
            
            // 头像处理
            let avatarHtml = `<div class="contact-avatar">${c.avatar || '🌼'}</div>`;
            if (c.avatar.startsWith('data:') || c.avatar.startsWith('http')) {
                avatarHtml = `<img src="${c.avatar}" class="contact-avatar" onerror="this.style.display='none'">`;
            }

            // 预览消息
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

    renderChatHistory(contact) {
        this.els.chatMsgs.innerHTML = '';
        this.els.chatTitle.innerText = contact.name;
        
        contact.history.forEach(msg => {
            if (msg.role === 'system') return;
            const sender = msg.role === 'assistant' ? 'ai' : 'user';

            const cleanText = typeof msg === 'string' ? msg : msg.content || '';
            const msgTime = typeof msg === 'string' ? null : msg.timestamp;
            
            // 分段渲染逻辑
            const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim());
            if (paragraphs.length > 0) {
                paragraphs.forEach(p => this.appendMessageBubble(p.trim(), sender, contact.avatar, msgTime));
            } else if (cleanText.trim()) {
                this.appendMessageBubble(cleanText.trim(), sender, contact.avatar, msgTime);
            }
        });

        this.scrollToBottom();
        this.updateRerollState(contact);
    },

    removeLatestAiBubbles() {
        const container = this.els.chatMsgs;
        while (container.lastElementChild && container.lastElementChild.classList.contains('ai')) {
            container.removeChild(container.lastElementChild);
        }
    },

    appendMessageBubble(text, sender, aiAvatarUrl, timestampRaw) {
        const template = document.getElementById('msg-template');
        const clone = template.content.cloneNode(true);
        
        const wrapper = clone.querySelector('.message-wrapper');
        const bubble = clone.querySelector('.message-bubble');
        const timeSpan = clone.querySelector('.msg-time');
        const avatarImg = clone.querySelector('.avatar-img');
        const avatarText = clone.querySelector('.avatar-text');

        wrapper.classList.add(sender);
        bubble.innerText = text;

        let timeStr = "";
        if (timestampRaw && timestampRaw.includes(' ')) {
            timeStr = timestampRaw.split(' ')[1]; 
        } else {
            const n = new Date();
            timeStr = `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
        }
        timeSpan.innerText = timeStr;

        let currentAvatar = '';
        if (sender === 'user') {
            currentAvatar = STATE.settings.USER_AVATAR || 'user.jpg';
        } else {
            currentAvatar = aiAvatarUrl || '🌸';
        }

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

        this.els.chatMsgs.appendChild(clone);
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
    }
};
// =========================================
// 5. APP CONTROLLER (核心逻辑与事件)
// =========================================
const App = {
    init() {
        Storage.load();
        UI.init();
        this.bindEvents();
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

        // 1. 处理消息历史
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
            // 正常发送
            if (!userText) return;
            
            // UI上拆分显示气泡
            const paragraphs = userText.split(/\n\s*\n/).filter(p => p.trim());
            if (paragraphs.length > 0) {
                paragraphs.forEach(p => UI.appendMessageBubble(p.trim(), 'user', null, timestamp));
            } else {
                UI.appendMessageBubble(userText, 'user', null, timestamp);
            }

            // 数据层：存完整的
            contact.history.push({ 
                role: 'user', 
                content: userText,
                timestamp: timestamp 
            });
            
            // === 发送后清理 ===
            UI.els.input.value = '';            // 清空内容
            UI.els.input.style.height = '38px'; // ★★★ 强制回弹高度 ★★★
            
            // 移动端发送后通常希望收起键盘看消息，PC端通常希望保持焦点
            const isMobile = window.innerWidth < 800;
            if (isMobile) {
                UI.els.input.blur();
            } else {
                UI.els.input.focus(); 
            }
        }        

        Storage.saveContacts();
        UI.setLoading(true);

        // 2. 准备发送给 API 的消息
        const recentHistory = contact.history
            .filter(m => m.role !== 'system')
            .slice(-30)
            .map(msg => {
                let content = msg.content || msg;
                if (msg.role === 'user') {
                    let time = msg.timestamp || formatTimestamp(); 
                    return { role: 'user', content: `[${time}] ${content}` };
                } else {
                    return { role: 'assistant', content: content };
                }
            });
        
        const messagesToSend = [
            { role: 'system', content: CONFIG.SYSTEM_PROMPT }, 
            { role: 'system', content: `=== 角色设定 ===\n${contact.prompt}` },
            ...recentHistory
        ];

        try {
            const aiText = await API.chat(messagesToSend, STATE.settings);
           
            const aiTimestamp = formatTimestamp();
            contact.history.push({ 
                role: 'assistant', 
                content: aiText,
                timestamp: aiTimestamp
            });
            Storage.saveContacts();
            
            UI.setLoading(false);
            await UI.playWaterfall(aiText, contact.avatar, aiTimestamp)

        } catch (error) {
            console.error(error);
            UI.setLoading(false);
            UI.appendMessageBubble(`(发送失败: ${error.message})`, 'ai', contact.avatar);
        } finally {
            UI.updateRerollState(contact);
            // 如果是 PC，发送完 AI 回复后再次聚焦输入框
            if (window.innerWidth >= 800) UI.els.input.focus();
        }
    },

    // --- 设置相关的逻辑 (保持不变) ---
    openSettings() {
        UI.els.mainModal.classList.remove('hidden');
        const s = STATE.settings;
        UI.els.settingUrl.value = s.API_URL || '';
        UI.els.settingKey.value = s.API_KEY || '';
        UI.els.settingModel.value = STATE.settings.MODEL || 'zai-org/GLM-4.6';
        document.getElementById('gist-token').value = STATE.settings.GIST_TOKEN || '';
        if (s.MODEL) UI.els.settingModel.innerHTML = `<option value="${s.MODEL}">${s.MODEL}</option>`;
        const previewImg = document.getElementById('wallpaper-preview-img');
        if (s.WALLPAPER && s.WALLPAPER.startsWith('data:')) {
            previewImg.src = s.WALLPAPER;
            document.getElementById('wallpaper-preview').classList.remove('hidden');
        }
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
            datalist.innerHTML = '';
            if (data.data && Array.isArray(data.data)) {
                data.data.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.id;
                    datalist.appendChild(opt);
                });
                if (data.data.length > 0) {
                    UI.els.settingModel.value = data.data[0].id;
                    STATE.settings.MODEL = data.data[0].id; 
                }
                alert(`成功拉取 ${data.data.length} 个模型！`);
            } else {
                alert('连接成功，但对方没有返回有效的模型列表。');
            }
        } catch (e) {
            console.error(e);
            alert('拉取失败，请手动输入模型名。');
        } finally {
            btn.textContent = '拉取模型';
            btn.disabled = false;
        }
    },

    saveSettingsFromUI() {
        let rawUrl = UI.els.settingUrl.value.trim().replace(/\/+$/, '');
        if (!rawUrl.includes('anthropic') && !rawUrl.includes('googleapis')) {
            if (rawUrl.endsWith('/chat/completion')) rawUrl += 's'; 
            else if (!rawUrl.includes('/chat/completions')) {
                rawUrl += rawUrl.endsWith('/v1') ? '/chat/completions' : '/v1/chat/completions';
            }
        }
        UI.els.settingUrl.value = rawUrl;
        STATE.settings.API_URL = rawUrl;
        STATE.settings.API_KEY = UI.els.settingKey.value.trim();
        STATE.settings.MODEL = UI.els.settingModel.value;
        STATE.settings.GIST_TOKEN = document.getElementById('gist-token').value.trim() || ''; 

        const wallpaperPreview = document.getElementById('wallpaper-preview-img').src;
        if(wallpaperPreview && wallpaperPreview.startsWith('data:')) {
            STATE.settings.WALLPAPER = wallpaperPreview;
        } else if (!STATE.settings.WALLPAPER) {
            STATE.settings.WALLPAPER = 'wallpaper.jpg';
        }
        Storage.saveSettings();
        UI.applyTheme(); 
        UI.els.mainModal.classList.add('hidden');
        alert(`设置已保存！\nAPI 地址已自动规范化为：\n${rawUrl}`);
    },

    readFile(file) {
        return new Promise((r, j) => {
            const reader = new FileReader();
            reader.onload = e => r(e.target.result);
            reader.onerror = j;
            reader.readAsDataURL(file);
        });
    },

    bindEvents() {
        // === 1. 初始化输入框样式 ===
        UI.els.input.style.overflowY = 'hidden'; 
        UI.els.input.style.resize = 'none';      
        UI.els.input.style.height = '38px';      

        // === 2. 监听输入，实现自动增高 ===
        UI.els.input.addEventListener('input', function() {
            this.style.height = 'auto'; 
            this.style.height = (this.scrollHeight) + 'px';
            if (this.value === '') this.style.height = '38px';
        });

        // === 3. 聊天发送逻辑 ===
        UI.els.sendBtn.onclick = () => this.handleSend(false);
        
        UI.els.input.onkeydown = (e) => {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 800;
            // PC端：Enter 发送，Shift+Enter 换行
            // 移动端：Enter 换行 (默认)，点击按钮发送
            if (e.key === "Enter" && !e.shiftKey && !isMobile) {
                e.preventDefault(); 
                App.handleSend(false);
            }
        };

        UI.els.rerollBtn.onclick = () => this.handleSend(true);
        document.getElementById('back-btn').onclick = () => UI.switchView('list');

        // === 4. 设置与弹窗逻辑 ===
        document.getElementById('main-settings-btn').onclick = () => this.openSettings();
        document.getElementById('main-cancel').onclick = () => UI.els.mainModal.classList.add('hidden');
        document.getElementById('main-confirm').onclick = () => this.saveSettingsFromUI();
        UI.els.fetchBtn.onclick = () => this.fetchModelsForUI();

        document.getElementById('wallpaper-file-input').onchange = async (e) => {
            if(e.target.files[0]) {
                const base64 = await this.readFile(e.target.files[0]);
                document.getElementById('wallpaper-preview-img').src = base64;
                document.getElementById('wallpaper-preview').classList.remove('hidden');
            }
        };

        const modal = document.getElementById('modal-overlay');
        document.getElementById('add-contact-btn').onclick = () => this.openEditModal(null);
        document.getElementById('chat-settings-btn').onclick = () => this.openEditModal(STATE.currentContactId);
        document.getElementById('modal-cancel').onclick = () => modal.classList.add('hidden');
        document.getElementById('modal-save').onclick = () => { this.saveContactFromModal(); modal.classList.add('hidden'); };
        
        document.getElementById('modal-delete').onclick = () => {
             if (confirm('删除角色？')) {
                 STATE.contacts = STATE.contacts.filter(c => c.id !== this.editingId);
                 Storage.saveContacts();
                 modal.classList.add('hidden');
                 if(STATE.currentContactId === this.editingId) document.getElementById('back-btn').click();
                 else UI.renderContacts();
             }
        };
        document.getElementById('modal-clear-history').onclick = () => {
            if(confirm('清空聊天记录？')) {
                const c = STATE.contacts.find(x => x.id === this.editingId);
                if(c) { c.history = []; Storage.saveContacts(); }
                modal.classList.add('hidden');
                if(STATE.currentContactId === this.editingId) UI.renderChatHistory(c);
            }
        };

        this.bindImageUpload('edit-avatar-file', 'edit-avatar-preview', 'edit-avatar'); 
        this.bindImageUpload('user-avatar-file', 'user-avatar-preview', null, (base64) => {
            STATE.settings.USER_AVATAR = base64;
            Storage.saveSettings();
            if(STATE.currentContactId) {
                const c = STATE.contacts.find(x => x.id === STATE.currentContactId);
                if(c) UI.renderChatHistory(c);
            }
        });
        document.getElementById('edit-avatar-upload-btn').onclick = () => document.getElementById('edit-avatar-file').click();
        document.getElementById('user-avatar-upload-btn').onclick = () => document.getElementById('user-avatar-file').click();
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
        userPreview.src = STATE.settings.USER_AVATAR || 'user.jpg';

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

    saveContactFromModal() {
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
        Storage.saveContacts();
        UI.renderContacts();
        if (STATE.currentContactId === this.editingId) {
            document.getElementById('chat-title').innerText = name;
            const c = STATE.contacts.find(x => x.id === this.editingId);
            UI.renderChatHistory(c);
        }
    }
};


// =========================================
// 6. BOOTSTRAP (启动)
// =========================================
window.onload = () => App.init();

window.exportData = () => {
    const data = JSON.stringify(localStorage, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_` +
                      `${pad(now.getHours())}`;
    a.download = `TeleWindy-Backup-${timestamp}.json`;

    a.click();
    URL.revokeObjectURL(url); 
};

window.importData = (input) => {
    if (!input.files || !input.files[0]) return;
    if (!confirm('导入将覆盖当前所有设置，确定吗？')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
            alert('导入成功，页面将刷新');
            location.reload();
        } catch(err) { alert('文件格式错误'); }
    };
    reader.readAsText(input.files[0]);
};

// =========================================
// 新增各种小工具
// =========================================

function formatTimestamp() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[now.getMonth()];
    const day = now.getDate();
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    return `${month}.${day} ${hour}:${minute}`;
}


// ==================== GitHub Gist 同步功能 (升级版) ====================
const gistTokenInput = document.getElementById('gist-token'); 
const gistIdInput    = document.getElementById('gist-id-input'); 
const gistStatusDiv  = document.getElementById('gist-status');

let currentGistId = localStorage.getItem('telewindy-gist-id') || null;

if (currentGistId) {
    gistIdInput.value = currentGistId;
    showGistStatus(`已从本地加载备份 ID: ${currentGistId.slice(0, 8)}...`, false);
}

function updateGistId(newId) {
    if (newId && typeof newId === 'string' && newId.trim() !== '') {
        currentGistId = newId.trim();
        gistIdInput.value = currentGistId; 
        localStorage.setItem('telewindy-gist-id', currentGistId); 
        return true;
    }
    return false;
}

gistIdInput.addEventListener('change', () => {
    if (updateGistId(gistIdInput.value)) {
        showGistStatus('Gist ID 已手动更新。现在可以恢复了。');
    }
});

function showGistStatus(msg, isError = false) {
    gistStatusDiv.textContent = msg;
    gistStatusDiv.style.color = isError ? '#d32f2f' : '#2e7d32';
}

function exportAllData() {
    const data = {};
    const settingsKey = 'teleWindy_settings_v1'; 
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        if (key === settingsKey) {
            try {
                let settings = JSON.parse(value);
                let target = Array.isArray(settings) ? settings[0] : settings;
                if (target && target.GIST_TOKEN && !target.GIST_TOKEN.startsWith('ENC_')) {
                    const safeSettings = JSON.parse(JSON.stringify(settings));
                    const safeTarget = Array.isArray(safeSettings) ? safeSettings[0] : safeSettings;
                    safeTarget.GIST_TOKEN = 'ENC_' + btoa(safeTarget.GIST_TOKEN);
                    data[key] = JSON.stringify(safeSettings);
                } else { data[key] = value; }
            } catch (e) { console.warn('导出时解析设置失败，原样备份', e); data[key] = value; }
        } else { data[key] = value; }
    }
    return data;
}

function importAllData(data) {
    localStorage.clear();
    Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
}


document.getElementById('gist-find').addEventListener('click', async () => {
    const token = STATE.settings.GIST_TOKEN;
    if (!token) return showGistStatus('请先在设置中填写并保存 Token', true);

    showGistStatus('正在云端查找 TeleWindy 备份...');

    try {
        const res = await fetch('https://api.github.com/gists', {
            headers: { Authorization: `token ${token}` }
        });

        if (!res.ok) throw new Error(`查找失败 (${res.status})，请检查 Token 权限`);

        const gists = await res.json();
        
        const backupGist = gists.find(gist => 
            gist.description === "TeleWindy 聊天记录与配置自动备份" &&
            gist.files['telewindy-backup.json']
        );

        if (backupGist) {
            updateGistId(backupGist.id);
            showGistStatus(`查找成功！已自动填入备份 ID: ${backupGist.id.slice(0, 8)}...`);
        } else {
            showGistStatus('未在你的 GitHub 账户下找到匹配的备份 Gist。', true);
        }

    } catch (e) {
        showGistStatus('查找出错：' + e.message, true);
    }
});


document.getElementById('gist-create-and-backup').addEventListener('click', async () => {
    const token = STATE.settings.GIST_TOKEN;
    if (!token) return showGistStatus('填写Token→点保存→再开始备份或恢复', true);

    showGistStatus('正在创建 gist 并备份...');
    const allData = exportAllData();
    const payload = {
        description: "TeleWindy 聊天记录与配置自动备份", 
        public: false,
        files: { "telewindy-backup.json": { content: JSON.stringify({ backup_at: new Date().toISOString(), app: "TeleWindy", data: allData }, null, 2) } }
    };

    try {
        const res = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const json = await res.json();
            if (json && json.id) {
                updateGistId(json.id);
                showGistStatus(`创建及备份成功！Gist ID: ${json.id}`);
            } else {
                throw new Error('未获取到有效 ID，请检查网络');
            }
        } else {
            const err = await res.json().catch(() => ({}));
            showGistStatus('创建失败：' + (err.message || res.status), true);
        }
    } catch (e) {
        console.error(e);
        showGistStatus('网络错误：' + e.message, true);
    }
});


document.getElementById('gist-backup').addEventListener('click', async () => {
    const gistIdToUse = gistIdInput.value.trim(); 
    if (!gistIdToUse) return showGistStatus('Gist ID 为空。请先创建、查找或手动输入。', true);

    const token = STATE.settings.GIST_TOKEN;
    if (!token) return showGistStatus('请填写 Token', true);

    showGistStatus('正在更新备份...');
    const allData = exportAllData();
    const payload = { files: { "telewindy-backup.json": { content: JSON.stringify({ backup_at: new Date().toISOString(), app: "TeleWindy", data: allData }, null, 2) } } };

    try {
        const res = await fetch(`https://api.github.com/gists/${gistIdToUse}`, { 
            method: 'PATCH',
            headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showGistStatus('备份更新成功！' + new Date().toLocaleTimeString());
        } else {
            if (res.status === 404) {
                localStorage.removeItem('telewindy-gist-id'); 
                gistIdInput.value = ''; 
                currentGistId = null;
                showGistStatus('原备份 ID 失效（已自动清除），请重新「创建」或「查找」', true);
            } else {
                const err = await res.json().catch(() => ({}));
                showGistStatus('备份失败：' + (err.message || res.status), true);
            }
        }
    } catch (e) {
        showGistStatus('网络错误：' + e.message, true);
    }
});


document.getElementById('gist-restore').addEventListener('click', async () => {
    const gistIdToUse = gistIdInput.value.trim(); 
    if (!gistIdToUse) return showGistStatus('Gist ID 为空。请先「查找」或「手动输入」。', true);
    
    const token = STATE.settings.GIST_TOKEN;
    if (!token) return showGistStatus('请填写 Token', true);

    showGistStatus('正在从云端拉取数据...');

    try {
        const res = await fetch(`https://api.github.com/gists/${gistIdToUse}`, { 
            headers: { Authorization: `token ${token}` }
        });

        if (!res.ok) {
            if (res.status === 404) {
                localStorage.removeItem('telewindy-gist-id');
                gistIdInput.value = '';
                currentGistId = null;
                throw new Error('找不到该备份（ID失效），已重置状态。');
            }
            throw new Error(`Gist 获取失败 (${res.status})`);
        }

        const json = await res.json();
        const file = json.files['telewindy-backup.json'];
        if (!file) return showGistStatus('备份文件不存在', true);
        let content = file.content;
        if (file.truncated) {
            const rawRes = await fetch(file.raw_url);
            content = await rawRes.text();
        }
        let backupData;
        try { backupData = JSON.parse(content); } 
        catch (e) {
            showGistStatus('JSON 解析失败，正在尝试修复...');
            const cleaned = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
            backupData = JSON.parse(cleaned);
        }
        if (backupData && backupData.data) {
            const settingsKey = 'teleWindy_settings_v1';
            Object.keys(backupData.data).forEach(key => {
                let value = backupData.data[key];
                if (key === settingsKey) {
                    try {
                        let settings = JSON.parse(value);
                        let target = Array.isArray(settings) ? settings[0] : settings;
                        if (target && target.GIST_TOKEN && target.GIST_TOKEN.startsWith('ENC_')) {
                            const rawBase64 = target.GIST_TOKEN.replace('ENC_', '');
                            target.GIST_TOKEN = atob(rawBase64);
                            value = JSON.stringify(settings);
                        }
                    } catch (e) { console.error('Token 还原失败', e); }
                }
                localStorage.setItem(key, value);
            });
            showGistStatus('恢复成功！3秒后自动刷新页面');
            setTimeout(() => location.reload(), 3000);
        } else { showGistStatus('备份格式错误', true); }

    } catch (e) {
        showGistStatus('恢复失败：' + e.message, true);
    }
});

