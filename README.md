# 115年超級獎勵專案 個人業績暨增員獎金試算系統

富邦人壽竹耀通訊處內部工具，依「115年超級獎勵專案辦法」（8/13修訂版，115富壽業企發字第108號）試算：

- 季超級個人獎金
- 超級全壘打獎金
- 年度增員加碼獎金（含新版有效定著積分表）
- 第三、四季增員績效獎金

## 放上 GitHub 並開啟 GitHub Pages（用網址打開）

### 步驟 1：建立 GitHub Repo

1. 到 [github.com/new](https://github.com/new) 建立一個新 repo，例如命名 `fubon-incentive-calculator`
2. 設為 Public（GitHub Pages 免費方案需要 Public repo，除非你有 GitHub 付費方案）
3. 不要勾選「Add a README」等選項（本專案已經有檔案了）

> ⚠️ 如果你的 repo 名稱不是 `fubon-incentive-calculator`，記得打開 `vite.config.js`，把 `base` 那一行改成 `/你的repo名稱/`

### 步驟 2：把程式碼推上 GitHub

在這個資料夾內執行：

```bash
git init
git add .
git commit -m "初版：獎金試算系統"
git branch -M main
git remote add origin https://github.com/你的帳號/fubon-incentive-calculator.git
git push -u origin main
```

### 步驟 3：開啟 GitHub Pages（用 GitHub Actions 自動部署）

1. 到 repo 頁面 → **Settings** → 左側選單 **Pages**
2. 在「Build and deployment」的 **Source**，選擇 **GitHub Actions**
3. 存檔後，回到 **Actions** 分頁，會看到剛剛 push 觸發的 workflow 正在跑
4. 跑完（約1~2分鐘）之後，回到 **Settings → Pages**，上方會出現網址，格式類似：

```
https://你的帳號.github.io/fubon-incentive-calculator/
```

之後每次 `git push` 到 `main` 分支，網站都會自動重新部署，不用手動操作。

## 本機測試（選用）

```bash
npm install
npm run dev
```

會啟動本機開發伺服器，瀏覽器打開終端機顯示的網址即可預覽。

## 檔案結構

```
├── src/
│   ├── App.jsx        # 主要試算邏輯與畫面
│   └── main.jsx        # React 進入點
├── index.html
├── vite.config.js      # 記得改 base 路徑
└── .github/workflows/deploy.yml   # 自動部署設定
```

## 修改獎金級距或積分表

所有數值都集中在 `src/App.jsx` 最上方的常數區：

- `CA_TABLE` / `SUP_TABLE`：季超級個人獎金級距
- `DEDICATION_MATRIX`：有效定著積分表（調整後）
- `POINT_BANDS`：增員積分對應的年度加碼倍率

之後公司若再修訂辦法，只要改這幾個表格即可，不用動計算邏輯。
