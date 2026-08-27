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

// --- セーブデータの書き出し (Export) ---
function exportSave() {
    const saveData = {
        version: "1.0", // バージョン管理用
        score: gameState.score,
        // アイテムはIDと個数だけを保存する（これがバージョンアップ耐性の秘訣）
        inventory: items.map(item => ({
            id: item.id,
            count: item.count
        }))
    };

    // JSONを文字列にして、本家っぽくBase64でエンコードする
    const jsonString = JSON.stringify(saveData);
    const encodedSave = btoa(unescape(encodeURIComponent(jsonString)));

    // ファイルとしてダウンロード
    const blob = new Blob([encodedSave], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kakkomi_save_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
}

// --- セーブデータの読み込み (Import) ---
function importSave() {
    // ファイル選択ダイアログを開く
    document.getElementById('save-upload').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const encodedData = e.target.result;
            // Base64をデコードしてJSONに戻す
            const jsonString = decodeURIComponent(escape(atob(encodedData)));
            const loadedData = JSON.parse(jsonString);

            applySaveData(loadedData);
        } catch (err) {
            alert("セーブデータが壊れているか、形式が正しくありません。");
            console.error(err);
        }
    };
    reader.readAsText(file);
}

// --- 読み込んだデータをゲームに反映 ---
function applySaveData(data) {
    // スコアの復元
    gameState.score = data.score || 0;

    // 所持数の復元（IDを照合して一致するものだけ入れる）
    if (data.inventory) {
        data.inventory.forEach(saveItem => {
            const item = items.find(i => i.id === saveItem.id);
            if (item) {
                item.count = saveItem.count;
                // コストの再計算（(初期コスト) * 1.15^所持数）
                const initialCost = item.cost; // 注意：ここを初期値にする工夫が必要（後述）
                // 簡易版として、今のCSVのコストをベースに計算し直す
                // 実際にはCSVに「初期コスト」の列を作っておくと完璧です
            }
        });
    }

    calculateCPS();
    updateDisplay();
    initShop(); // ショップ画面を更新
    alert("セーブデータを読み込みました！");
}
