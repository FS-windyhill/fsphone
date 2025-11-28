// --- 配置区 ---
const API_URL = 'https://geminipolling-gv1p.onrender.com/v1/chat/completions';
const MODEL = "gemini-2.5-pro"; 

const API_KEYS = [
    'geminiyl',
    // 想加多少加多少，随便复制粘贴
];

// ★★★ 新增：全局系统提示词 (后台隐藏指令) ★★★
const GLOBAL_SYSTEM_PROMPT = `
请完全代入用户给你的角色，以该角色的语气和思考方式，与用户交流。
人类说话是不会带括号和动作描写的。所以你应该的输出应该贴合人类的说话方式，直接输出说话的内容，而不带动作描写。
你想说啥就说啥，不必拘束。
每次输出3~9句话左右，每两句话中间空一行。
`; 
// <--- 这里你可以随意修改你的后台指令

const STORAGE_KEY = 'teleWindy_char_data_v1';
const OLD_STORAGE_KEY = 'octopus_coach_chat_history'; 

// ★★★ 新增：用户头像 + 壁纸持久化 ★★★
let userAvatar = localStorage.getItem('fs_user_avatar') || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'; // 默认用户头像
let currentWallpaper = localStorage.getItem('fs_wallpaper') || 'wallpaper.jpg'; // 默认壁纸


// --- 全局变量 ---
let contacts = [];           
let currentContactId = null; 

// --- DOM 元素 ---
const viewList = document.getElementById('view-contact-list');
const viewChat = document.getElementById('view-chat');
const contactListContainer = document.getElementById('contact-list-container');
const chatWindow = document.getElementById('chat-window');
const chatMessages = document.getElementById('chat-messages');
const chatTitle = document.getElementById('chat-title');
const taskInput = document.getElementById('task-input');
const sendButton = document.getElementById('send-button');
const rerollBtn = document.getElementById('reroll-footer-btn');

const modalOverlay = document.getElementById('modal-overlay');
const inputName = document.getElementById('edit-name');
const inputAvatar = document.getElementById('edit-avatar');
const inputPrompt = document.getElementById('edit-prompt');
let editingId = null; 

// ===========================
// 1. 初始化与数据迁移 (保持不变)
// ===========================
function init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        contacts = JSON.parse(raw);
    } else {
        const oldData = localStorage.getItem(OLD_STORAGE_KEY);
        if (oldData) {
            console.log('检测到旧版数据，正在迁移...');
            try {
                const history = JSON.parse(oldData);
                contacts.push({
                    id: 'legacy_' + Date.now(),
                    name: '小真蛸 (旧版)',
                    avatar: '🦑',
                    prompt: '你是一个温柔可爱的助手小真蛸，说话请带上“🦑”。',
                    history: history
                });
                localStorage.removeItem(OLD_STORAGE_KEY); 
            } catch (e) { console.error('迁移失败', e); }
        }
    }

    if (contacts.length === 0) {
        contacts.push({
            id: Date.now().toString(),
            name: '小真蛸',
            avatar: '🦑',
            prompt: '你是一个温柔可爱的助手小真蛸，说话请带上“🦑”及颜文字。',
            history: [] 
        });
    }

    saveData();
    renderContactList();
    // ★★★ 初始化用户头像和壁纸 ★★★
    applyUserAvatar();
    applyWallpaper();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

// ===========================
// 2. 视图渲染 (保持不变)
// ===========================
function renderContactList() {
    contactListContainer.innerHTML = '';
    contacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'contact-item';
        
        let avatarHtml = '';
        if (contact.avatar.startsWith('data:') || contact.avatar.startsWith('http')) {
            avatarHtml = `<img src="${contact.avatar}" class="contact-avatar" onerror="this.src=''; this.outerHTML='<div class=contact-avatar>${contact.avatar}</div>'">`;
        } else {
            avatarHtml = `<div class="contact-avatar">${contact.avatar || '🤔'}</div>`;
        }

        let lastMsg = "暂无消息";
        const realMsgs = contact.history.filter(m => m.role !== 'system');
        if (realMsgs.length > 0) {
            const last = realMsgs[realMsgs.length - 1];
            lastMsg = last.content.length > 30 ? last.content.slice(0, 30) + '…' : last.content;
        }

        item.innerHTML = `
            ${avatarHtml}
            <div class="contact-info">
                <h3>${contact.name}</h3>
                <p>${lastMsg}</p>
            </div>
        `;

        item.onclick = () => enterChat(contact.id);
        contactListContainer.appendChild(item);
    });
}

// 进入聊天页面
function enterChat(id) {
    currentContactId = id;
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;

    // 切换视图
    viewList.classList.add('hidden');
    viewChat.classList.remove('hidden');

    // 设置 Header
    chatTitle.innerText = contact.name;
    document.getElementById('typing-status').innerText = '在线';
    document.getElementById('typing-status').classList.remove('typing');

    // 渲染历史记录
    chatMessages.innerHTML = '';
    
    contact.history.forEach(msg => {
        if (msg.role === 'system') return; // 跳过系统提示
        
        const sender = msg.role === 'assistant' ? 'ai' : 'user';
        
        // ★★★ 修复核心：这里加了分割逻辑 ★★★
        // 如果内容里有空行（\n\n），就拆分成多个气泡显示，和生成时保持一致
        const paragraphs = msg.content.split(/\n\s*\n/).filter(p => p.trim());
        
        if (paragraphs.length > 0) {
            paragraphs.forEach(p => addMessageToUI(p, sender, contact.avatar));
        } else {
            // 防止极端情况（比如全是空行），至少显示原本的内容
            addMessageToUI(msg.content, sender, contact.avatar);
        }
    });

    chatWindow.scrollTop = chatWindow.scrollHeight;
    updateRerollButton();
}

document.getElementById('back-btn').addEventListener('click', () => {
    viewChat.classList.add('hidden');
    viewList.classList.remove('hidden');
    currentContactId = null;
    renderContactList(); 
});

// ===========================
// 3. 聊天核心逻辑 (★ 重点修改区域 ★)
// ===========================

// key轮询
// 持久化当前使用的 key 索引（从0开始）
function getCurrentKeyIndex() {
    return parseInt(localStorage.getItem('current_api_key_index') || '0');
}
function saveCurrentKeyIndex(idx) {
    localStorage.setItem('current_api_key_index', idx % API_KEYS.length);
}

// 获取当前要用的 key（每次发送消息时调用）
function getNextKey() {
    let idx = getCurrentKeyIndex();
    const key = API_KEYS[idx];
    // 用完就切换到下一个
    saveCurrentKeyIndex(idx + 1);
    console.log(`[轮询] 当前使用第 ${idx + 1}/${API_KEYS.length} 个 key`);
    return key;
}


// 替换你原来的整个 addMessageToUI 函数
function addMessageToUI(text, sender, avatarUrl) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${sender}`;

    let avatarHtml;
    if (sender === 'user') {
        // 使用全局 userAvatar（支持 base64 和 url）
        avatarHtml = `<img class="avatar" src="${userAvatar}" alt="User" onerror="this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=user'">`;
    } else {
        // AI 角色头像
        if (avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:'))) {
            avatarHtml = `<img class="avatar" src="${avatarUrl}" onerror="this.src='🦑'; this.style.fontSize='24px'; this.style.background='#fff'; this.style.display='flex'; this.style.alignItems='center'; this.style.justifyContent='center';">`;
        } else {
            avatarHtml = `<div class="avatar" style="background:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;">${avatarUrl || '🤖'}</div>`;
        }
    }

    const content = document.createElement('div');
    content.className = 'message-content';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerText = text;

    content.appendChild(bubble);
    wrapper.innerHTML = avatarHtml;
    wrapper.appendChild(content);

    chatMessages.appendChild(wrapper);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function addAiWaterfallMessage(fullText, avatarUrl) {
    const paragraphs = fullText.split(/\n\s*\n/).filter(p => p.trim());
    for (let i = 0; i < paragraphs.length; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 400));
        addMessageToUI(paragraphs[i], 'ai', avatarUrl);
    }
}

async function handleSend(isReroll = false) {
    const contact = contacts.find(c => c.id === currentContactId);
    if (!contact) return;

    let userText = taskInput.value.trim();

    // 1. 维护历史 (只存纯人设，不存指令，保持数据干净)
    const sysMsg = { role: 'system', content: contact.prompt };
    if (contact.history.length === 0 || contact.history[0].role !== 'system') {
        contact.history.unshift(sysMsg);
    } else {
        contact.history[0] = sysMsg;
    }

    // 2. 重发逻辑 (Reroll)
    if (isReroll) {
        const lastUserMsg = [...contact.history].reverse().find(m => m.role === 'user');
        if (!lastUserMsg) return; 
        userText = lastUserMsg.content;
        
        while (chatMessages.lastElementChild?.classList.contains('ai')) {
            chatMessages.removeChild(chatMessages.lastElementChild);
        }
        while(contact.history.length > 0 && contact.history[contact.history.length-1].role === 'assistant') {
            contact.history.pop();
        }
        console.log('✨ 重roll模式启动');
    } else {
        if (!userText) return;
        addMessageToUI(userText, 'user', null); 
        contact.history.push({ role: 'user', content: userText }); 
        taskInput.value = '';
    }
    
    saveData();

    // 3. 准备发送
    sendButton.disabled = true;
    const statusEl = document.getElementById('typing-status');
    statusEl.innerText = '对方正在输入';
    statusEl.classList.add('typing');

    try {
        // ==========================================
        // ★★★ 核心修改：拆分为两条 System 消息 ★★★
        // ==========================================
        
        // 1. 提取聊天记录 (去掉旧的 system，只取最近对话)
        const recentChatHistory = contact.history
            .filter(m => m.role !== 'system') 
            .slice(-20); 

        // 2. 组装最终数组
        // 这里我们把 "全局指令" 和 "角色人设" 作为两条独立的消息发送
        const messagesToSend = [
            // 第一条：系统强制指令 (System Prompt)
            { 
                role: 'system', 
                content: GLOBAL_SYSTEM_PROMPT 
            },
            // 第二条：角色设定 (Character Description)
            // 虽然role还是叫system，但在AI眼里这就是独立的第二段输入
            { 
                role: 'system', 
                content: `=== 角色设定 ===\n${contact.prompt}` 
            },
            // 第三部分：对话历史
            ...recentChatHistory
        ];

        // 打印日志：你会看到现在是一个清晰的数组列表
        console.log('👇👇👇 === 真实发送给AI的完整Prompt (Raw Data) === 👇👇👇');
        console.log(JSON.stringify(messagesToSend, null, 2)); 
        console.log('👆👆👆 ========================================== 👆👆👆');
        
        const API_KEY = getNextKey();
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
            body: JSON.stringify({
                model: MODEL,
                messages: messagesToSend, 
                temperature: 0.8,
                max_tokens: 1024
            })
        });

        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        const aiText = data.choices[0].message.content.trim();

        contact.history.push({ role: 'assistant', content: aiText });
        saveData();
        
        statusEl.innerText = '在线';
        statusEl.classList.remove('typing');
        
        await addAiWaterfallMessage(aiText, contact.avatar);

    } catch (e) {
        console.error(e);
        statusEl.innerText = '连接中断';
        addMessageToUI('(发送失败，请检查网络或Key)', 'ai', contact.avatar);
    } finally {
        sendButton.disabled = false;
        taskInput.focus();
        updateRerollButton();
    }
}

function updateRerollButton() {
    const contact = contacts.find(c => c.id === currentContactId);
    if (!contact) return;
    const hasHistory = contact.history.some(m => m.role === 'assistant');
    rerollBtn.style.opacity = hasHistory ? '1' : '0.5';
    rerollBtn.disabled = !hasHistory;
}

// ★★★ 新增：应用用户头像
function applyUserAvatar() {
    const preview = document.getElementById('user-avatar-preview');
    if (preview) {
        if (userAvatar.startsWith('data:') || userAvatar.startsWith('http')) {
            preview.src = userAvatar;
        } else {
            preview.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=user';
            preview.alt = userAvatar; // 显示 emoji
            preview.style.fontSize = '36px';
            preview.style.background = '#eee';
        }
    }
}

// ★★★ 新增：应用壁纸
function applyWallpaper() {
    document.body.style.backgroundImage = `url('${currentWallpaper}')`;
    if (currentWallpaper === 'wallpaper.jpg') {
        document.body.style.backgroundColor = '#f2f2f2'; // 备用色
    }
}

// ★★★ 新增：读取文件为 base64
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


// ===========================
// 4. 弹窗与角色管理 (保持不变)
// ===========================

function openModal(contactId) {
    editingId = contactId;
    modalOverlay.classList.remove('hidden');

    // ★★★ 修复 Bug 3：JS 强制设置滚动条 ★★★
    // 假设 modal-overlay 里的第一个子元素就是你的弹窗白框
    // 如果你的结构不一样，可能需要把 .firstElementChild 改成具体的 ID
    const modalContent = modalOverlay.firstElementChild;
    if (modalContent) {
        modalContent.style.maxHeight = '85vh'; // 限制最大高度为屏幕的 85%
        modalContent.style.overflowY = 'auto'; // 内容超长时显示滚动条
        modalContent.style.borderRadius = '12px'; // 顺手加个圆角，好看点
    }
    // ★★★ 修复结束 ★★★
    
    const delBtn = document.getElementById('modal-delete');
    const clearBtn = document.getElementById('modal-clear-history');

    if (contactId) {
        const c = contacts.find(x => x.id === contactId);
        document.getElementById('modal-title').innerText = '设置角色';
        inputName.value = c.name;
        inputAvatar.value = c.avatar;
        const preview = document.getElementById('edit-avatar-preview');
        if (c.avatar.startsWith('data:') || c.avatar.startsWith('http')) {
            preview.src = c.avatar;
        } else {
            preview.src = '';
            preview.alt = c.avatar;
            preview.style.fontSize = '36px';
            preview.style.background = '#eee';
        }
        inputPrompt.value = c.prompt;
        
        delBtn.style.display = 'block';
        clearBtn.style.display = 'block';
    } else {
        document.getElementById('modal-title').innerText = '新建角色';
        inputName.value = '';
        inputAvatar.value = '🙂'; 
        inputPrompt.value = '你是一个乐于助人的助手。';
        
        delBtn.style.display = 'none';
        clearBtn.style.display = 'none';
    }
}

document.getElementById('modal-save').addEventListener('click', () => {
    const name = inputName.value.trim() || '未命名';
    let avatar = inputAvatar.value.trim();
    
    // 优先使用预览图的 base64（即使用户没改文本框）
    const previewEl = document.getElementById('edit-avatar-preview');
    if (previewEl && previewEl.src && previewEl.src.startsWith('data:')) {
        avatar = previewEl.src;
    }
    if (!avatar || avatar === '🦑') avatar = '🙂';

    const prompt = inputPrompt.value.trim();

    if (editingId) {
        const c = contacts.find(x => x.id === editingId);
        if (c) {
            c.name = name;
            c.avatar = avatar;
            c.prompt = prompt;
            
            // 立即刷新标题
            if (currentContactId === editingId) {
                chatTitle.innerText = name;
            }
        }
    } else {
        contacts.push({
            id: Date.now().toString(),
            name: name,
            avatar: avatar,
            prompt: prompt,
            history: []
        });
    }
    
    saveData();
    modalOverlay.classList.add('hidden');
    
    // ★★★ 关键修复：保存后立刻刷新 UI ★★★
    renderContactList();
    if (currentContactId) {
        enterChat(currentContactId); // 强制刷新当前聊天（头像立刻更新！）
    }
});

document.getElementById('modal-delete').addEventListener('click', () => {
    if (confirm('确定要删除这个角色吗？聊天记录也会消失。')) {
        contacts = contacts.filter(c => c.id !== editingId);
        saveData();
        modalOverlay.classList.add('hidden');
        
        if (currentContactId === editingId) {
            document.getElementById('back-btn').click();
        } else {
            renderContactList();
        }
    }
});

document.getElementById('modal-clear-history').addEventListener('click', () => {
    if (confirm('确定要清空与该角色的聊天记录吗？')) {
        const c = contacts.find(x => x.id === editingId);
        if (c) {
            c.history = []; 
            saveData();
            modalOverlay.classList.add('hidden');
            if (currentContactId === editingId) {
                chatMessages.innerHTML = ''; 
            }
        }
    }
});

document.getElementById('modal-cancel').addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
});

document.getElementById('add-contact-btn').addEventListener('click', () => openModal(null));
document.getElementById('chat-settings-btn').addEventListener('click', () => openModal(currentContactId));

sendButton.addEventListener('click', () => handleSend(false));
taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend(false);
});
rerollBtn.addEventListener('click', () => handleSend(true));

// ===========================
// 头像上传 + 壁纸设置逻辑
// ===========================

// 角色头像上传
document.getElementById('edit-avatar-upload-btn')?.addEventListener('click', () => {
    document.getElementById('edit-avatar-file').click();
});

document.getElementById('edit-avatar-file')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const dataUrl = await readFileAsDataURL(file);
        document.getElementById('edit-avatar-preview').src = dataUrl;
        document.getElementById('edit-avatar').value = dataUrl; // 同步到文本框
    } catch (err) {
        alert('图片读取失败');
    }
});

// 用户头像上传
document.getElementById('user-avatar-upload-btn')?.addEventListener('click', () => {
    document.getElementById('user-avatar-file').click();
});

document.getElementById('user-avatar-file')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const dataUrl = await readFileAsDataURL(file);
        userAvatar = dataUrl;
        localStorage.setItem('fs_user_avatar', dataUrl);
        document.getElementById('user-avatar-preview').src = dataUrl;
        applyUserAvatar();
        // 刷新当前聊天中的用户头像
        if (currentContactId) {
            enterChat(currentContactId);
        }
    } catch (err) {
        alert('图片读取失败');
    }
});

// 1. 绑定主页的设置按钮 (请确认你的HTML里主页那个齿轮按钮ID是不是 'main-settings-btn')
// 如果你的按钮叫其他名字，请修改下面这行
const mainSettingsBtn = document.getElementById('main-settings-btn'); 
if (mainSettingsBtn) {
    mainSettingsBtn.addEventListener('click', () => {
        openMainModal(); // 主页直接点，直接开壁纸弹窗
    });
}

// 2. 这是一个专门打开壁纸弹窗的函数
function openMainModal() {
    document.getElementById('main-modal').classList.remove('hidden');
}


// 主页设置按钮（齿轮）
document.getElementById('main-settings-btn').addEventListener('click', openMainModal);


// 关闭全局壁纸设置
function closeMainModal() {
    document.getElementById('main-modal').classList.add('hidden');
    document.getElementById('wallpaper-preview').classList.add('hidden');
    document.getElementById('wallpaper-file-input').value = '';
}

// 选择图片后预览
document.getElementById('wallpaper-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const dataUrl = await readFileAsDataURL(file);
        document.getElementById('wallpaper-preview-img').src = dataUrl;
        document.getElementById('wallpaper-preview').classList.remove('hidden');
    } catch (err) {
        alert('图片读取失败');
    }
});

// 壁纸确认按钮
document.getElementById('main-confirm').addEventListener('click', () => {
    const fileInput = document.getElementById('wallpaper-file-input');
    if (fileInput.files && fileInput.files[0]) {
        const dataUrl = document.getElementById('wallpaper-preview-img').src;
        currentWallpaper = dataUrl;
        localStorage.setItem('fs_wallpaper', dataUrl);
    } else {
        currentWallpaper = 'wallpaper.jpg';
        localStorage.setItem('fs_wallpaper', 'wallpaper.jpg');
    }
    applyWallpaper();
    closeMainModal();
});

// 取消壁纸设置
document.getElementById('main-cancel').addEventListener('click', closeMainModal);

// 导入导出
function exportData() {
  const data = JSON.stringify(localStorage, null, 2);
  const filename = `TeleWindy-Backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.json`;
  // 结果：TeleWindy-Backup-2025-11-28T15-30-22Z.json → 改成 TeleWindy-Backup-2025-11-28T15-30-22.json
  
  const blob = new Blob([data], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

function importData(input) {
  // 如果没选文件，直接返回（防止误触）
  if (!input.files || input.files.length === 0) {
    alert('请选择一个备份文件哦～');
    return;
  return;
  }

  const file = input.files[0];

  // 关键：加一个确认弹窗
  const confirmImport = confirm(
    `⚠️  即将导入配置文件：${file.name}\n\n` +
    `导入后会完全覆盖当前所有设置（包括壁纸、书签、待办等）\n\n` +
    `确定要继续吗？`
  );

  if (!confirmImport) {
    // 用户点取消，就清空输入框，防止重复触发
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);

      // 可选：再加一层保险，防止导入一堆乱七八糟的东西
      if (typeof data !== 'object' || data === null) {
        alert('文件格式不对哦，这不是一个有效的备份文件');
        return;
      }

      // 开始覆盖 localStorage
      Object.keys(data).forEach(key => {
        localStorage.setItem(key, data[key]);
      });

      // 成功提示 + 刷新
      alert('导入成功！页面即将刷新～');
      location.reload();
    } catch (err) {
      alert('文件损坏或格式错误，导入失败了');
      console.error(err);
    }
  };

  reader.readAsText(file);
}

window.addEventListener('load', init);