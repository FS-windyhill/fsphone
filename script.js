// --- 配置区 ---
const API_KEY = 'sk-zjrwnikmirbgzteakyyrqtlwmkglwpapqcgpmgjbyupxhwzd';
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
const chatWindow = document.getElementById('chat-window');
const typingStatus = document.getElementById('typing-status');  // 新增：正在输入状态
const clearButton = document.getElementById('clear-button');

const messageHistory = [{ role: "system", content: COACH_PROMPT }];
const STORAGE_KEY = 'octopus_coach_chat_history';

// ============= 核心改动开始：彻底删除所有思考气泡相关代码 =============

// 删掉这些全局变量（再也不用了）
// let thinkingMessageWrapper = null;
// let currentRequestTask = null;

// 删掉整个 addThinkingBubble() 函数！！！
// 删掉 loadingIndicator 相关所有代码！！！

// ============= 你原来的函数保留但精简 =============
function addMessage(message, sender) {
    if (!message || message.trim() === '') return;

    if (sender === 'user') {
        const msgWrapper = createSingleMessageWrapper(message.trim(), 'user');
        chatMessages.appendChild(msgWrapper);
    } else {
        const paragraphs = message.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
        if (paragraphs.length === 0) return;

        paragraphs.forEach(paragraph => {
            const text = paragraph.split('\n').map(line => line.trim()).filter(Boolean).join('\n');
            const msgWrapper = createSingleMessageWrapper(text, 'ai');
            chatMessages.appendChild(msgWrapper);
        });
    }
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function createSingleMessageWrapper(text, sender) {
    const msgWrapper = document.createElement('div');
    msgWrapper.className = `message-wrapper ${sender}`;

    const avatar = document.createElement('img');
    avatar.className = 'avatar';
    avatar.src = sender === 'ai' ? 'char.jpg' : 'user.jpg';
    avatar.alt = sender === 'ai' ? '章鱼教练' : '你';

    const contentContainer = document.createElement('div');
    contentContainer.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerText = text;

    contentContainer.appendChild(bubble);
    msgWrapper.appendChild(avatar);
    msgWrapper.appendChild(contentContainer);

    return msgWrapper;
}

// ============= 瀑布流显示（保留你最爱的打字机节奏）=============
async function addAiWaterfallMessage(fullText) {
    const paragraphs = fullText
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    for (let i = 0; i < paragraphs.length; i++) {
        if (i > 0) {
            await new Promise(r => setTimeout(r, 500 + Math.random() * 300));
        }

        const text = paragraphs[i].split('\n').map(l => l.trim()).filter(Boolean).join('\n');
        const msgWrapper = createSingleMessageWrapper(text, 'ai');

        // 已经没有 reroll 按钮了！干净！
        chatMessages.appendChild(msgWrapper);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
}

// ===== 终极发送函数（带你最爱的彩虹 log 版）=====
async function handleSendTask(isReroll = false) {
    let userText = taskInput.value.trim();

    if (isReroll) {
        const lastUserMsg = [...messageHistory].reverse().find(m => m.role === "user");
        if (!lastUserMsg) return;
        userText = lastUserMsg.content;
        console.log('%c✨ 重roll 模式启动！准备复读姐姐的话：', 'color: #cba6f7; font-weight: bold;', userText);
    } else {
        if (!userText) return;
        addMessage(userText, 'user');
        taskInput.value = '';
        console.log('%c📤 姐姐说：', 'color: #89b4fa; font-weight: bold;', userText);
    }

    document.getElementById('typing-status').textContent = '对方正在输入';
    document.getElementById('typing-status').classList.add('typing');;

    console.log('%c🫧 小真蛸正在拼命想台词…', 'color: #f9e2af; font-size: 14px;');

    if (isReroll) {
        while (chatMessages.lastElementChild?.classList.contains('ai')) {
            chatMessages.removeChild(chatMessages.lastElementChild);
        }
        while (messageHistory[messageHistory.length-1]?.role === "assistant") {
            messageHistory.pop();
        }
        console.log('%c🗑️ 已删除上一轮AI回复，准备重新写作', 'color: #f38baa;');
    }

    if (!isReroll) {
        messageHistory.push({ role: "user", content: userText });
        saveHistory();
    }

    sendButton.disabled = true;
    taskInput.disabled = true;

    // 你最爱的超级详细请求日志
    // 你最魂牵梦绕的那个 array log！！！
    console.log('%c发给硅基流动的干净上下文（已过滤非法消息）：', 'color: #a6e3a1; font-weight: bold', messageHistory.slice(-20));

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: messageHistory.slice(-20),
                temperature: 0.8,
                max_tokens: 1024
            })
        });

        if (!response.ok) throw new Error(`API错误 ${response.status}`);

        const data = await response.json();
        const aiText = data.choices[0].message.content.trim();

        messageHistory.push({ role: "assistant", content: aiText });
        saveHistory();

        console.log('%c❤️ 小真蛸想好要说什么啦！', 'color: #f2cdcd; font-size: 16px; font-weight: bold;');
        console.log('%c🦑 回复内容：', 'color: #94e2d5;', aiText);

        document.getElementById('typing-status').textContent = '在线';
        document.getElementById('typing-status').classList.remove('typing');

        await addAiWaterfallMessage(aiText);

    } catch (err) {
        console.error('%c💔 硅基流动它又鸽我了！', 'color: #f38baa; font-size: 18px;', err);
        typingStatus.textContent = '出错了…';
        addMessage('小真蛸被硅基流动拒绝了…再试一次吧', 'ai');
    } finally {
        sendButton.disabled = false;
        taskInput.disabled = false;
        taskInput.focus();
        updateRerollButtonState();
        console.log('%c✅ 本轮结束，输入框已释放～', 'color: #a6e3a1;');
    }
}

// ============= 清空聊天 =============
function clearChatHistory() {
    if (confirm('确定要清空所有聊天记录吗？')) {
        chatMessages.innerHTML = '';
        localStorage.removeItem(STORAGE_KEY);
        messageHistory.length = 1;
        addMessage('今天要搞定什么呀～', 'ai');
    }
}

// ============= 事件绑定 =============
sendButton.addEventListener('click', () => handleSendTask());
taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendTask();
    }
});
clearButton.addEventListener('click', clearChatHistory);

// ====== 新增：底部固定重roll按钮（左边那个✨）======
document.getElementById('reroll-footer-btn').addEventListener('click', () => {
    // 如果根本没聊天记录，就不让点
    if (messageHistory.length <= 1 || !messageHistory.some(m => m.role === 'assistant')) {
        console.log('%c还没聊天呢，姐姐别乱戳我呀～', 'color: #cba6f7;');
        return;
    }
    
    console.log('%c✨ 姐姐戳了底部小星星！小真蛸立刻重roll！', 'color: #cba6f7; font-weight: bold;');
    handleSendTask(true);  // 复用你原来超级完善的重roll逻辑
});

// ============= 加载历史 =============
window.addEventListener('load', () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            messageHistory.push(...parsed);
            parsed.forEach(msg => {
                addMessage(msg.content, msg.role === 'assistant' ? 'ai' : 'user');
            });
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }
    if (!saved || JSON.parse(saved || '[]').length === 0) {
        addMessage('今天要搞定什么呀～', 'ai');
    }
    chatWindow.scrollTop = chatWindow.scrollHeight;
});

function saveHistory() {
    const toSave = messageHistory.filter(m => m.role !== "system");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    console.log('%c聊天记录已保存到 localStorage', 'color: #a6e3a1;');
}

// ============= 重roll =============
// ====== 额外优化：没聊天记录时禁用底部重roll按钮 ======
function updateRerollButtonState() {
    const hasHistory = messageHistory.some(m => m.role === 'assistant');
    const btn = document.getElementById('reroll-footer-btn');
    btn.disabled = !hasHistory;
    btn.style.opacity = hasHistory ? '1' : '0.4';
    btn.style.cursor = hasHistory ? 'pointer' : 'not-allowed';
}

// 页面加载时执行一次
window.addEventListener('load', () => {
    // 你原来的 load 代码……
    updateRerollButtonState();
});




