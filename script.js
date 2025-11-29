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

/*// --- 配置区 ---
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions  https://geminipolling-gv1p.onrender.com/v1/chat/completions';
const MODEL = "zai-org/GLM-4.6"; 

const API_KEYS = [
    'sk-zjrwnikmirbgzteakyyrqtlwmkglwpapqcgpmgjbyupxhwzd', 
    */

    
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
        USER_AVATAR: 'char.jpg'
    },
    SYSTEM_PROMPT: `
请完全代入用户给你的角色，以该角色的语气和思考方式，与用户交流。
人类说话是不会带括号和动作描写的。所以你应该的输出应该贴合人类的说话方式，直接输出说话的内容。
你想说啥就说啥，不必拘束。
每次输出3~9句话左右，每两句话中间空一行。
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
    load() {
        // 1. 加载设置
        const settingsRaw = localStorage.getItem(CONFIG.SETTINGS_KEY);
        STATE.settings = settingsRaw ? JSON.parse(settingsRaw) : { ...CONFIG.DEFAULT };
        
        // 兼容旧的散装存储 (如果是老用户)
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
                avatar: '🦑',
                prompt: '你是一个温柔可爱的助手小真蛸，说话请带上“🦑”及颜文字。',
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
                    avatar: '🦑',
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
                max_tokens: 1024,
                temperature: 0.8
            });
        } else if (provider === 'gemini') {
            fetchUrl = API_URL.endsWith(':generateContent') ? API_URL : `${API_URL}/${MODEL}:generateContent?key=${API_KEY}`;
            options.body = JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: lastUserMsg }] }],
                system_instruction: { parts: [{ text: sysPrompts }] },
                generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
            });
        } else {
            // OpenAI Standard
            options.headers['Authorization'] = `Bearer ${API_KEY}`;
            options.body = JSON.stringify({
                model: MODEL,
                messages: messages,
                temperature: 0.8,
                max_tokens: 1024
            });
        }

        // ==========================================================
        // ★★★ 你的 Log 回来啦！ ★★★
        // ==========================================================
        console.log(`👇👇👇 === [${provider.toUpperCase()}] 真实发送给 AI 的请求体 (Raw Body) === 👇👇👇`);
        try {
            console.log(JSON.parse(options.body)); // 解析后再打印，格式更美观
        } catch(e) {
            console.log(options.body); // 如果解析失败直接打印字符串
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
        mainModal: document.getElementById('main-modal'), // 设置弹窗
        
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
            let avatarHtml = `<div class="contact-avatar">${c.avatar || '🤔'}</div>`;
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
            
            // 分段渲染逻辑
            const paragraphs = msg.content.split(/\n\s*\n/).filter(p => p.trim());
            if (paragraphs.length > 0) {
                paragraphs.forEach(p => this.appendMessageBubble(p, sender, contact.avatar));
            } else {
                this.appendMessageBubble(msg.content, sender, contact.avatar);
            }
        });
        this.scrollToBottom();
        this.updateRerollState(contact);
    },

    // ★★★ 新增：精准移除底部的 AI 气泡，不重绘整个页面
    removeLatestAiBubbles() {
        const container = this.els.chatMsgs;
        // 循环检查：只要最后一个元素是 AI 发的，就把它移除
        // 这样可以同时处理掉 AI 分段发出的多个气泡，直到遇到用户发的气泡为止
        while (container.lastElementChild && container.lastElementChild.classList.contains('ai')) {
            container.removeChild(container.lastElementChild);
        }
    },


    appendMessageBubble(text, sender, aiAvatarUrl) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;

        let avatarHtml;
        if (sender === 'user') {
            const userAv = STATE.settings.USER_AVATAR;
            avatarHtml = `<img class="avatar" src="${userAv}" onerror="this.src='char.jpg'">`;
        } else {
            if (aiAvatarUrl && (aiAvatarUrl.startsWith('http') || aiAvatarUrl.startsWith('data:'))) {
                avatarHtml = `<img class="avatar" src="${aiAvatarUrl}" onerror="this.style.display='none'">`;
            } else {
                avatarHtml = `<div class="avatar" style="background:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;">${aiAvatarUrl || '🤖'}</div>`;
            }
        }

        wrapper.innerHTML = `${avatarHtml}<div class="message-content"><div class="message-bubble">${text}</div></div>`;
        this.els.chatMsgs.appendChild(wrapper);
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

    // 瀑布流打字机效果
    async playWaterfall(fullText, avatar) {
        const paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim());
        for (let i = 0; i < paragraphs.length; i++) {
            if (i > 0) await new Promise(r => setTimeout(r, 400));
            this.appendMessageBubble(paragraphs[i], 'ai', avatar);
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
        
        // 检查配置
        const { API_URL, API_KEY, MODEL } = STATE.settings;
        if (!API_URL || !API_KEY || !MODEL) {
            alert('请先点击右上角的设置按钮，配置 API 地址、密钥和模型！');
            return;
        }

        let userText = UI.els.input.value.trim();

        // 1. 处理消息历史
        const sysMsg = { role: 'system', content: contact.prompt };
        // 确保 System Prompt 始终在第一位
        if (contact.history.length === 0 || contact.history[0].role !== 'system') {
            contact.history.unshift(sysMsg);
        } else {
            contact.history[0] = sysMsg; // 更新 Prompt
        }

        if (isReroll) {
            // Reroll 逻辑：找到上一条用户消息
            const lastUserMsg = [...contact.history].reverse().find(m => m.role === 'user');
            if (!lastUserMsg) return;
            userText = lastUserMsg.content;
            
            // 1. 数据层清理：移除内存中最后的 assistant 消息
            while(contact.history.length > 0 && contact.history[contact.history.length-1].role === 'assistant') {
                contact.history.pop();
            }

            // 2. 界面层清理：只移除底部的 AI 气泡，保持上方历史不动
            // ★★★ 这里改成了调用新方法，而不是 renderChatHistory
            UI.removeLatestAiBubbles(); 
            
        } else {
            // 正常发送
            if (!userText) return;
            UI.appendMessageBubble(userText, 'user');
            contact.history.push({ role: 'user', content: userText });
            UI.els.input.value = '';
            UI.els.input.blur();
        }        

        Storage.saveContacts();
        UI.setLoading(true);

        // 2. 准备发送给 API 的消息
        const recentHistory = contact.history.filter(m => m.role !== 'system').slice(-20);
        const messagesToSend = [
            { role: 'system', content: CONFIG.SYSTEM_PROMPT }, // 全局设定
            { role: 'system', content: `=== 角色设定 ===\n${contact.prompt}` }, // 角色设定
            ...recentHistory
        ];

        try {
            const aiText = await API.chat(messagesToSend, STATE.settings);
            
            contact.history.push({ role: 'assistant', content: aiText });
            Storage.saveContacts();
            
            UI.setLoading(false);
            await UI.playWaterfall(aiText, contact.avatar);

        } catch (error) {
            console.error(error);
            UI.setLoading(false);
            UI.appendMessageBubble(`(发送失败: ${error.message})`, 'ai', contact.avatar);
        } finally {
            UI.updateRerollState(contact);
            UI.els.input.focus();
        }
    },

    // --- 设置相关的逻辑 ---
    openSettings() {
        UI.els.mainModal.classList.remove('hidden');
        // 回显数据
        const s = STATE.settings;
        UI.els.settingUrl.value = s.API_URL || '';
        UI.els.settingKey.value = s.API_KEY || '';
        
        // 回显模型 (需要特殊处理，因为 Select 选项可能还没加载)
        // 简单的做法：先放一个当前选中的 option
        if (s.MODEL) {
            UI.els.settingModel.innerHTML = `<option value="${s.MODEL}">${s.MODEL}</option>`;
        }
        
        // 预览壁纸
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
            
            // 注意：这里改成了操作 datalist
            const datalist = document.getElementById('model-options');
            datalist.innerHTML = ''; // 清空旧选项
            
            if (data.data && Array.isArray(data.data)) {
                data.data.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.id; // datalist 的 option 是不需要闭合标签内容的
                    datalist.appendChild(opt);
                });
                
                // 拉取成功后，自动填入第一个模型到输入框，方便用户
                if (data.data.length > 0) {
                    UI.els.settingModel.value = data.data[0].id;
                    // 同时也更新一下 settings 状态
                    STATE.settings.MODEL = data.data[0].id; 
                }
                
                alert(`成功拉取 ${data.data.length} 个模型！\n点击输入框右侧的小箭头即可选择。`);
            } else {
                alert('连接成功，但对方没有返回有效的模型列表。\n请直接在输入框里手动填写模型名称。');
            }
        } catch (e) {
            console.error(e);
            alert('拉取失败（可能是CORS跨域限制或API不支持列表查询）。\n\n别担心！你可以直接在输入框里手动输入模型名（例如 gemini-1.5-flash）并保存。');
        } finally {
            btn.textContent = '拉取模型';
            btn.disabled = false;
        }
    },

    saveSettingsFromUI() {
        // 1. 获取用户输入并去除首尾空格
        let rawUrl = UI.els.settingUrl.value.trim();
        
        // 2. 去除末尾的斜杠 (防止拼接出 //v1 这种丑陋的链接)
        rawUrl = rawUrl.replace(/\/+$/, '');

        // 3. 智能补全逻辑
        // 如果不是 Claude 或 Gemini (这俩有特殊的地址规则)，则默认按 OpenAI 格式补全
        if (!rawUrl.includes('anthropic') && !rawUrl.includes('googleapis')) {
            
            // 情况 A: 用户不小心写成了单数 /completion (帮你自动修)
            if (rawUrl.endsWith('/chat/completion')) {
                rawUrl += 's'; 
            }
            // 情况 B: 用户完全没写路径，只写了域名或 /v1
            else if (!rawUrl.includes('/chat/completions')) {
                if (rawUrl.endsWith('/v1')) {
                    // 用户写了 https://api.xxx.com/v1 -> 补上 /chat/completions
                    rawUrl += '/chat/completions';
                } else {
                    // 用户只写了 https://api.xxx.com -> 补上 /v1/chat/completions
                    rawUrl += '/v1/chat/completions';
                }
            }
        }

        // 将修正后的 URL 写回输入框，让用户也能看到（可选，这样用户知道发生了什么）
        UI.els.settingUrl.value = rawUrl;

        // --- 保存逻辑 ---
        STATE.settings.API_URL = rawUrl;
        STATE.settings.API_KEY = UI.els.settingKey.value.trim();
        STATE.settings.MODEL = UI.els.settingModel.value;

        // 壁纸处理逻辑 (保持不变)
        const wallpaperPreview = document.getElementById('wallpaper-preview-img').src;
        if(wallpaperPreview && wallpaperPreview.startsWith('data:')) {
            STATE.settings.WALLPAPER = wallpaperPreview;
        } else if (!STATE.settings.WALLPAPER) {
            STATE.settings.WALLPAPER = 'wallpaper.jpg';
        }

        Storage.saveSettings();
        UI.applyTheme(); 
        UI.els.mainModal.classList.add('hidden');
        
        // 给个提示
        alert(`设置已保存！\nAPI 地址已自动规范化为：\n${rawUrl}`);
    },

    // --- 文件读取辅助 ---
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    bindEvents() {
        // 1. 聊天输入
        UI.els.sendBtn.onclick = () => this.handleSend(false);
        UI.els.input.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();App.handleSend(false)}};
        UI.els.rerollBtn.onclick = () => this.handleSend(true);
        document.getElementById('back-btn').onclick = () => UI.switchView('list');

        // 2. 主页设置 (API + 壁纸)
        document.getElementById('main-settings-btn').onclick = () => this.openSettings();
        document.getElementById('main-cancel').onclick = () => UI.els.mainModal.classList.add('hidden');
        document.getElementById('main-confirm').onclick = () => this.saveSettingsFromUI();
        UI.els.fetchBtn.onclick = () => this.fetchModelsForUI();

        // 3. 壁纸预览
        document.getElementById('wallpaper-file-input').onchange = async (e) => {
            if(e.target.files[0]) {
                const base64 = await this.readFile(e.target.files[0]);
                document.getElementById('wallpaper-preview-img').src = base64;
                document.getElementById('wallpaper-preview').classList.remove('hidden');
            }
        };

        // 4. 角色编辑弹窗 (复用你原来的逻辑，这里简化绑定)
        const modal = document.getElementById('modal-overlay');
        document.getElementById('add-contact-btn').onclick = () => this.openEditModal(null);
        document.getElementById('chat-settings-btn').onclick = () => this.openEditModal(STATE.currentContactId);
        document.getElementById('modal-cancel').onclick = () => modal.classList.add('hidden');
        
        document.getElementById('modal-save').onclick = () => {
            this.saveContactFromModal();
            modal.classList.add('hidden');
        };
        
        // ... (删除/清空历史的按钮绑定类似，为节省篇幅略过，逻辑与你原代码一致，只需调用 Storage.saveContacts 和 UI.renderContacts)
        
        // 绑定删除和清空
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

        // 绑定头像上传预览
        this.bindImageUpload('edit-avatar-file', 'edit-avatar-preview', 'edit-avatar'); // 角色头像
        this.bindImageUpload('user-avatar-file', 'user-avatar-preview', null, (base64) => {
            STATE.settings.USER_AVATAR = base64;
            Storage.saveSettings();
            // 如果正在聊天，刷新一下界面以显示新头像
            if(STATE.currentContactId) {
                const c = STATE.contacts.find(x => x.id === STATE.currentContactId);
                if(c) UI.renderChatHistory(c);
            }
        });
        
        // 绑定按钮点击触发 input file
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
        
        // 设置用户头像预览
        userPreview.src = STATE.settings.USER_AVATAR || 'char.jpg';

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
        
        // 优先使用预览图 src (如果是 base64)
        const previewSrc = document.getElementById('edit-avatar-preview').src;
        if(previewSrc.startsWith('data:')) avatar = previewSrc;

        if (this.editingId) {
            const c = STATE.contacts.find(x => x.id === this.editingId);
            if (c) {
                c.name = name;
                c.avatar = avatar;
                c.prompt = prompt;
            }
        } else {
            STATE.contacts.push({
                id: Date.now().toString(),
                name, avatar, prompt, history: []
            });
        }
        Storage.saveContacts();
        UI.renderContacts();
        
        // 如果正在编辑当前聊天的角色，刷新标题
        if (STATE.currentContactId === this.editingId) {
            document.getElementById('chat-title').innerText = name;
            // 刷新当前聊天记录以更新头像
            const c = STATE.contacts.find(x => x.id === this.editingId);
            UI.renderChatHistory(c);
        }
    }
};

// =========================================
// 6. BOOTSTRAP (启动)
// =========================================
window.onload = () => App.init();

// 全局导出，方便 HTML onclick (如导出按钮)
window.exportData = () => {
    const data = JSON.stringify(localStorage, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    // —— 这里是改好的时间戳 ——
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_` +
                      `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    a.download = `TeleWindy-Backup-${timestamp}.json`;
    // ————————————————

    a.click();
    URL.revokeObjectURL(url); // 顺手清理一下内存
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
