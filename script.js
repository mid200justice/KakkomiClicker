let gameState = {
    score: 0,
    cps: 0
};

let items = []; // CSVから読み込んだデータを格納する配列

const scoreDisplay = document.getElementById('score');
const cpsDisplay = document.getElementById('cps');
const shopList = document.getElementById('shop-list');

// --- 1. CSVを読み込む関数 ---
async function loadGameData() {
    try {
        const response = await fetch('assets/data.csv'); // CSVファイルの取得
        const csvText = await response.text();
        
        // CSVを1行ずつ分割し、オブジェクトの配列に変換
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) continue;
            const values = lines[i].split(',');
            const item = {
                id: values[0],
                name: values[1],
                cost: parseInt(values[2]),
                power: parseInt(values[3]),
                description: values[4],
                count: 0 // 所持数は最初は0
            };
            items.push(item);
        }

        // データ読み込み完了後にショップを表示
        initShop();
    } catch (error) {
        console.error("CSVの読み込みに失敗しました:", error);
    }
}

// --- 2. ショップの表示 ---
function initShop() {
    shopList.innerHTML = ''; // 一旦クリア
    items.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.className = 'shop-item';
        btn.innerHTML = `
            <strong>${item.name}</strong><br>
            コスト: <span id="cost-${item.id}">${item.cost}</span><br>
            <small>${item.description}</small>
        `;
        btn.onclick = () => buyItem(index);
        shopList.appendChild(btn);
    });
}

// --- 3. 購入処理 ---
function buyItem(index) {
    const item = items[index];
    if (gameState.score >= item.cost) {
        gameState.score -= item.cost;
        item.count++;
        item.cost = Math.floor(item.cost * 1.15); // 15%値上がり
        
        document.getElementById(`cost-${item.id}`).innerText = item.cost;
        calculateCPS();
        updateDisplay();
    }
}

function calculateCPS() {
    gameState.cps = items.reduce((acc, item) => acc + (item.count * item.power), 0);
}

function updateDisplay() {
    scoreDisplay.innerText = Math.floor(gameState.score);
    cpsDisplay.innerText = gameState.cps.toFixed(1);
}

// クリックイベント（HTML側のIDに合わせる）
document.getElementById('cookie-btn').onclick = () => {
    gameState.score++;
    updateDisplay();
};

// 自動加算ループ
setInterval(() => {
    gameState.score += gameState.cps / 10;
    updateDisplay();
}, 100);

// ゲーム開始時にCSVを読み込む
loadGameData();