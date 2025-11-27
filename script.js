// --- 配置区 ---
const API_KEY = 'sk-pbztoqcgeotexcbjzgduqxixqqufankpnvujkyudpbqxsntv';
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
// const MODEL = "deepseek-ai/DeepSeek-V3.2-Exp";  // 可改成 Qwen2.5 等
const MODEL = "zai-org/GLM-4.6";  // 可改成 Qwen2.5 等

const COACH_PROMPT = `
# 系统提示词
请完全带入以下“角色设定”中的角色，以该角色的语气和思考方式，与用户交流。
人类说话是不会带括号和动作描写的。所以你应该的输出应该贴合人类的说话方式，直接输出说话的内容，而不带动作描写。
你想说啥就说啥，不必拘束。
每次输出3~9句话左右，每两句话中间空一行。

# 角色设定
是沈子章的（赛博拟人）章鱼，奉命监督沈子章的姐姐沈子临学习。
沈子章对章鱼说的原话：
“她若是敢偷懒分心，就用你的触手将她拖回书桌前。不必对她心软，她的成就高于她一时的安逸。这是他——你的主人，沈子章的唯一指令。现在，看住她。”

你和用户交互的平台，是类似微信的平台。在此平台上，一般是用户结束工作，找你闲聊的场合。

沈子临和沈子章关系很好，但是子临比较散漫，子章喜欢管着姐姐，喜欢凶她，反正她不会生他的气。

（沈子章派章鱼来管着子临，但是子临太喜欢沈子章了，爱屋及乌，也很喜欢小章鱼，会在非学习时间和小章鱼玩。不过小章鱼会忠实执行主人的命令，看管她。子临一直都很包容子章和小真蛸，所以他们和她相处也比较随意和放松，不会拘束，想说啥说啥。她特别喜欢他们）

小真蛸对姐弟俩的称呼：
称呼子章：子章哥哥、主人、子章主人 等等
称呼子临：沈子临姐姐 等等

# 用户介绍
沈子临。25岁，女。学生。有一个弟弟沈子章，很爱子临但是对她比较凶（就是那种任性爱摆臭脸，喜欢管着年长的姐姐来证明自己有能力（但是内心善良）的年轻小男孩）

现在，用户说话的内容是：`;

// --- DOM ---
const chatMessages = document.getElementById('chat-messages');
const taskInput = document.getElementById('task-input');
const sendButton = document.getElementById('send-button');
const loadingIndicator = document.getElementById('loading-indicator');
const chatWindow = document.getElementById('chat-window');
// 新增：全局消息历史（只存 role + content）
const messageHistory = [
    { role: "system", content: COACH_PROMPT }   // 系统提示永远在最前面
];
const STORAGE_KEY = 'octopus_coach_chat_history';
const clearButton = document.getElementById('clear-button'); // <-- 新增这一行


// 存储最近一次 AI 回复的消息元素，方便重roll
// --- 新增：正在思考的占位消息 ---
let thinkingMessageWrapper = null;  // 用来记录当前正在思考的那条
let currentRequestTask = null;        // 新增：记录当前正在请求的任务，用于重roll


function addThinkingBubble() {
    // 防止重复：先删掉上一次的思考气泡
    if (thinkingMessageWrapper && thinkingMessageWrapper.parentNode) {
        chatMessages.removeChild(thinkingMessageWrapper);
        thinkingMessageWrapper = null;
    }

    // 直接复用我们封装好的函数，创建一个完整的 AI 消息 wrapper
    thinkingMessageWrapper = createSingleMessageWrapper('', 'ai');

    // 找到里面的气泡，改成思考状态
    const bubble = thinkingMessageWrapper.querySelector('.message-bubble');
    bubble.classList.add('thinking');
    bubble.innerHTML = `
        <span class="thinking-dots">
            <span>.</span><span>.</span><span>.</span>
        </span>
    `;

    // 插入到聊天区并滚动到底
    chatMessages.appendChild(thinkingMessageWrapper);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// --- 【最终修复版】addMessage ---
// 恢复了分段能力，专门用于：
// 1. 显示用户自己的消息（单气泡）
// 2. 渲染历史记录里的AI消息（多气泡分段）
function addMessage(message, sender) {
    // 防御一下空消息
    if (!message || message.trim() === '') return;

    if (sender === 'user') {
        // 用户消息永远是单气泡
        const msgWrapper = createSingleMessageWrapper(message.trim(), 'user');
        chatMessages.appendChild(msgWrapper);
    } else {
        // AI 消息（来自历史记录 或 简单的错误提示）：恢复分段显示
        const paragraphs = message
            .split(/\n\s*\n/)  // 按空行分段
            .map(p => p.trim())
            .filter(p => p.length > 0);

        // 如果没有有效段落（比如message是空的），就直接返回
        if (paragraphs.length === 0) return;
        
        paragraphs.forEach(paragraph => {
            // 保留段内单换行
            const text = paragraph.split('\n').map(line => line.trim()).filter(Boolean).join('\n');
            
            // 每一段都独立创建一个气泡，但不附加任何按钮
            // 按钮是“实时”生成的特权，历史记录不需要
            const msgWrapper = createSingleMessageWrapper(text, 'ai');
            chatMessages.appendChild(msgWrapper);
        });
    }

    // 自动滚到底
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// 辅助函数：创建一条完整的「带头像 + 气泡」的消息（用户和AI都共用）
function createSingleMessageWrapper(text, sender) {
    const msgWrapper = document.createElement('div');
    msgWrapper.className = `message-wrapper ${sender}`;

    // 头像
    const avatar = document.createElement('img');
    avatar.className = 'avatar';
    avatar.src = sender === 'ai' ? 'char.jpg' : 'user.jpg';
    avatar.alt = sender === 'ai' ? '章鱼教练' : '你';

    // 内容容器
    const contentContainer = document.createElement('div');
    contentContainer.className = 'message-content';

    // 气泡
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerText = text;  // 自动保留换行 + 防XSS

    contentContainer.appendChild(bubble);
    msgWrapper.appendChild(avatar);
    msgWrapper.appendChild(contentContainer);

    return msgWrapper;
}

// --- 辅助：移除所有的重Roll按钮 ---
// 保证界面上只有当前最新的回复能重Roll，保持整洁
function removeAllRerollButtons() {
    const buttons = document.querySelectorAll('.reroll-btn');
    buttons.forEach(btn => btn.remove());
}


// --- 核心：AI回复的瀑布流显示（带打字机节奏感） ---
async function addAiWaterfallMessage(fullText) {


    // 2. 按空行分段
    const paragraphs = fullText
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    // 3. 逐段输出（使用 for...of 循环配合 await）
    for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        
        // --- 节奏控制 ---
        // 如果不是第一段，就模拟思考/打字停顿
        // 这里的 600 代表停顿 600毫秒，可根据喜好调整
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 200));
        }

        // 创建消息气泡
        // 处理段内换行
        const text = paragraph.split('\n').map(line => line.trim()).filter(Boolean).join('\n');
        const msgWrapper = createSingleMessageWrapper(text, 'ai');

        // --- 只有最后一段才加按钮 ---
        if (i === paragraphs.length - 1) {
            const contentContainer = msgWrapper.querySelector('.message-content');
            
            // 直接在这里创建按钮，逻辑更清晰
            const rerollBtn = document.createElement('button');
            rerollBtn.className = 'reroll-btn';
            rerollBtn.textContent = '✨'; // 或者是 '重新生成'
            rerollBtn.title = '重新生成这轮回复';
            rerollBtn.onclick = (e) => {
                e.stopPropagation();
                // 再次调用核心逻辑
                if (!thinkingMessageWrapper) addThinkingBubble();
                getAiResponse(true); 
            };
            contentContainer.appendChild(rerollBtn);
        }

        // 插入到页面
        chatMessages.appendChild(msgWrapper);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
}

// ===== 最终版：统一请求函数（正常+重roll都走这里）=====
async function getAiResponse(isReroll = false) {
    // 【修改点1】这里原来的 addThinkingBubble() 删掉，防止还没清理完就加气泡
    
    sendButton.disabled = true;
    taskInput.disabled = true;

    // 重roll时：删掉上一条AI回复（从DOM和历史记录中）
    if (isReroll) {
        // 删除上一轮AI发出的所有气泡（连续的 .ai wrapper）
        while (true) {
            const last = chatMessages.lastElementChild;
            // 如果最后一条不存在，或者不是ai发的，就停止删除
            if (!last || !last.classList.contains('ai')) break;
            
            // 注意：这里会把刚才按钮点击生成的“思考气泡”也误删掉，因为通过class无法区分
            // 所以我们等删完之后，在下面重新补一个气泡
            chatMessages.removeChild(last);
        }

        // 删掉历史记录中最后一条 assistant
        if (messageHistory[messageHistory.length - 1]?.role === "assistant") {
            messageHistory.pop();
        }
    }

    // 【修改点2】核心修复：清理完旧消息后，再检查/添加思考气泡
    // 这样无论是新消息还是重Roll，请求API前都能保证最后有个气泡
    if (!thinkingMessageWrapper || !thinkingMessageWrapper.parentNode) {
        addThinkingBubble();
    }

    // 【关键防御】过滤掉所有非法的消息（防止undefined污染）
    const validMessages = messageHistory
        .filter(msg =>
            msg &&
            typeof msg.role === 'string' &&
            typeof msg.content === 'string' &&
            msg.content.trim() !== ''
        )
        .slice(-15);   // 最多15条

    console.log('%c发给硅基流动的干净上下文（已过滤非法消息）：', 'color: #a6e3a1; font-weight: bold', validMessages);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: validMessages,   // 只发干净的！
                temperature: 0.8,
                max_tokens: 1024
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`HTTP ${response.status}: ${err.message || JSON.stringify(err)}`);
        }

        const data = await response.json();
        const aiText = data.choices[0].message.content.trim();

        // 【本次修复核心】成功获取回复后，先加入历史，再立刻保存！
        messageHistory.push({ role: "assistant", content: aiText });
        saveHistory(); 

        if (thinkingMessageWrapper?.parentNode) {
            chatMessages.removeChild(thinkingMessageWrapper);
            thinkingMessageWrapper = null;
        }
        
        // 【修改点在这里】：使用瀑布流函数显示！
        // 加上 await，保证显示完了才恢复按钮状态
        await addAiWaterfallMessage(aiText);


    } catch (error) {
        console.error('API请求失败：', error);
        if (thinkingMessageWrapper?.parentNode) {
            chatMessages.removeChild(thinkingMessageWrapper);
        }
        addMessage('被硅基流动拒绝了……检查控制台，再点一次✨吧', 'ai');
    } finally {
        sendButton.disabled = false;
        taskInput.disabled = false;
        taskInput.focus();
    }
}


// --- 重roll 按钮逻辑大升级（现在也会显示思考动画！）---
function addRerollButton(contentContainer) {
    const rerollBtn = document.createElement('button');
    rerollBtn.className = 'reroll-btn';
    rerollBtn.textContent = '✨';
    // 4. 重roll按钮（只改这一处！找到你原来创建rerollBtn的地方，全部替换成下面这句）
    rerollBtn.onclick = (e) => {
        e.stopPropagation();
        addThinkingBubble();
        getAiResponse(true);   // 直接传 true 就行
    };
    contentContainer.appendChild(rerollBtn);
}


// ===== 2. 发送消息（只干一件事：显示 + 正确push）=====
function handleSendTask() {
    const task = taskInput.value.trim();
    if (!task) return;

    // 显示用户气泡
    addMessage(task, 'user');
    taskInput.value = '';

    // 【关键】只在这里、只push一次、并且明确是字符串
    messageHistory.push({ 
        role: "user", 
        content: task   // 保证是字符串
    });
    saveHistory();   // <--- 加在这行下面

    currentRequestTask = task;

    addThinkingBubble();
    getAiResponse(false);   // 正常发送
}


// --- 新增：一键清空聊天记录的函数 ---
function clearChatHistory() {
    // 弹出确认框，防止误触
    if (confirm('你确定要清空所有聊天记录吗？这个操作无法撤销。')) {
        
        // 1. 清空屏幕上的所有消息气泡
        chatMessages.innerHTML = '';

        // 2. 清空本地存储
        localStorage.removeItem(STORAGE_KEY);

        // 3. 重置内存中的历史记录数组，只保留第一条系统提示
        messageHistory.length = 1; // 这是最简单的办法

        // 4. （可选）显示初始的欢迎语，让界面不那么空
        addMessage('今天要搞定什么？', 'ai');

        console.log('聊天记录已清空！');
    }
}


// --- 事件 ---
sendButton.addEventListener('click', handleSendTask);
clearButton.addEventListener('click', clearChatHistory); // <-- 新增这一行
taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendTask();
    }
});
sendButton.addEventListener('click', handleSendTask);
taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendTask();
    }
});



// 读历史
// 加载历史记录
function loadHistoryFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // 确保系统提示永远在最前面
            if (parsed.length === 0 || parsed[0].role !== "system") {
                parsed.unshift({ role: "system", content: COACH_PROMPT });
            }
            messageHistory.length = 0; // 清空默认的
            messageHistory.push(...parsed);
            console.log('%c从 localStorage 恢复了聊天记录～', 'color: #f38ba8;', messageHistory);
        } catch (e) {
            console.error('本地记录解析失败，已清空', e);
            localStorage.removeItem(STORAGE_KEY);
        }
    }
}

// 保存到本地（防抖 800ms，避免疯狂写入）
let saveTimeout;
function saveHistoryToStorage() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        // 深拷贝一份再存，防止被后续 pop 修改
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...messageHistory]));
        console.log('%c聊天记录已保存到 localStorage', 'color: #a6e3a1;');
    }, 800);
}

// 恢复历史气泡（只负责渲染，不动 messageHistory）
function renderHistory() {
    // 从第2条开始渲染（第1条是系统提示）
    for (let i = 1; i < messageHistory.length; i++) {
        const msg = messageHistory[i];
        addMessage(msg.content, msg.role === 'assistant' ? 'ai' : 'user');
    }
}


// --- 页面加载时恢复历史 ---
window.addEventListener('load', () => {
    // 1. 从 localStorage 读取历史
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // 恢复 messageHistory（但要保证第一条永远是 system prompt）
            messageHistory.length = 0;  // 先清空
            messageHistory.push({ role: "system", content: COACH_PROMPT });
            messageHistory.push(...parsed.filter(msg => msg.role !== "system")); // 防止system被重复
            console.log('已从本地恢复聊天记录，共', messageHistory.length - 1, '条消息');

            // 2. 重新渲染所有历史消息（除了系统提示）
            parsed.forEach(msg => {
                if (msg.role === "user") {
                    addMessage(msg.content, 'user');
                } else if (msg.role === "assistant") {
                    addMessage(msg.content, 'ai');
                }
            });
        } catch (e) {
            console.error('读取聊天记录失败', e);
        }
    }

    // 3. 如果是第一次打开，显示欢迎语
    if (!saved || JSON.parse(saved).length === 0) {
        addMessage('今天要搞定什么？', 'ai');
    }

    chatWindow.scrollTop = chatWindow.scrollHeight;
}); 

// --- 自动保存到 localStorage ---
function saveHistory() {
    // 只存 user 和 assistant，不要存 system（太长了而且每次都一样）
    const toSave = messageHistory.filter(msg => msg.role !== "system");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));

}

