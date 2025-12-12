const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// 【配置】保留多少份备份
const MAX_BACKUPS = 20;
// 【配置】文件名前缀
const FILE_PREFIX = 'telewindy-data';
// 【配置】用来记录当前存到第几个的计数小文件
const INDEX_FILE = path.join(__dirname, 'current_index.txt');

// 【重要】你的密码
const MY_SECRET_KEY = "szlszz0304"; 

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '100mb' }));

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token === MY_SECRET_KEY) {
        next();
    } else {
        res.status(403).json({ error: '密码错误' });
    }
};

// --- 核心工具函数 ---

// 1. 获取下一个要保存的文件名
function getNextFilePath() {
    let currentIndex = 0;
    
    // 尝试读取上一次存的序号
    if (fs.existsSync(INDEX_FILE)) {
        try {
            currentIndex = parseInt(fs.readFileSync(INDEX_FILE, 'utf8')) || 0;
        } catch (e) {}
    }

    // 序号 +1
    let nextIndex = currentIndex + 1;
    // 如果超过最大限制（20），回到 1
    if (nextIndex > MAX_BACKUPS) {
        nextIndex = 1;
    }

    // 保存新的序号，供下次使用
    fs.writeFileSync(INDEX_FILE, nextIndex.toString());

    console.log(`正在写入第 [ ${nextIndex} / ${MAX_BACKUPS} ] 个备份槽位`);
    return path.join(__dirname, `${FILE_PREFIX}${nextIndex}.json`);
}

// 2. 查找【最新】的一个备份文件（用于恢复）
function getLatestFilePath() {
    let latestFile = null;
    let latestTime = 0;

    // 遍历 1 到 20 号文件
    for (let i = 1; i <= MAX_BACKUPS; i++) {
        const filePath = path.join(__dirname, `${FILE_PREFIX}${i}.json`);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            // 比较修改时间，找最新的
            if (stats.mtimeMs > latestTime) {
                latestTime = stats.mtimeMs;
                latestFile = filePath;
            }
        }
    }
    return latestFile;
}

// --- 路由 ---

// 1. 获取数据 (自动找最新的那个文件)
app.get('/api/data', authenticate, (req, res) => {
    const latestFile = getLatestFilePath();

    if (latestFile && fs.existsSync(latestFile)) {
        console.log(`正在读取最新备份：${latestFile}`);
        const data = fs.readFileSync(latestFile, 'utf8');
        res.json(JSON.parse(data));
    } else {
        res.status(404).json({ error: '服务器上还没有任何备份文件' });
    }
});

// 2. 保存数据 (轮询写入 1-20)
app.post('/api/data', authenticate, (req, res) => {
    try {
        const dataToSave = req.body;
        
        // 获取下一个文件的路径
        const targetFile = getNextFilePath();
        
        fs.writeFileSync(targetFile, JSON.stringify(dataToSave, null, 2));
        
        res.json({ success: true, message: '保存成功！备份已轮换。' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '服务器写入出错' });
    }
});

app.listen(PORT, () => {
    console.log(`后端服务已启动：http://localhost:${PORT}`);
    console.log(`模式：${MAX_BACKUPS} 个文件轮询备份`);
});