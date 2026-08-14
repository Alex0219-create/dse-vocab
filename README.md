---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 6666ae8b6db9897c83ea6e116f7bc243_a089416897e911f1a98a525400f8a581
    ReservedCode1: z5OVEwDTMuwg9hH12ipV6US8FBrBavCzuopvADQe8R4JRjUrwDlS1jC9lT5LJFM3xFk6XPs5G7gDuv0H8FQ9df5KXNMdbXHMi3m+tZolFHe0PcQfXXgxfKzjcB/9GjALHlSSNHKoD5cNnuuXYS6H/pSl8HDUEvUChuE1oNzy57762LA5rZK+r3TSq7o=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 6666ae8b6db9897c83ea6e116f7bc243_a089416897e911f1a98a525400f8a581
    ReservedCode2: z5OVEwDTMuwg9hH12ipV6US8FBrBavCzuopvADQe8R4JRjUrwDlS1jC9lT5LJFM3xFk6XPs5G7gDuv0H8FQ9df5KXNMdbXHMi3m+tZolFHe0PcQfXXgxfKzjcB/9GjALHlSSNHKoD5cNnuuXYS6H/pSl8HDUEvUChuE1oNzy57762LA5rZK+r3TSq7o=
---

# DSE Vocab 網站版部署教學

## 檔案清單
- `index.html` — 主程式（V4.4，內嵌全部 9551 詞，唔可以改檔名）
- `dse_vocab_data.json` — 完整詞庫數據（可選，有佢載入會更快）

## 方法一：GitHub Pages（推薦，最簡單）

1. 去 https://github.com 註冊帳號（如果未註冊）
2. 登入後按右上角「+」→ **New repository**
3. Repository name 隨意填，例如 `dse-vocab`，揀 **Public**，按 **Create repository**
4. 入到新 repo 頁面，按 **uploading an existing file**（上傳現有檔案）
5. 將 `index.html` 同 `dse_vocab_data.json` 拖入去，按 **Commit changes**
6. 去 **Settings** → 左邊 **Pages**
7. Source 揀 **Deploy from a branch**，Branch 揀 `main` / `master`，按 **Save**
8. 等 1-2 分鐘，頁面頂部會出現網址：`https://你的用戶名.github.io/dse-vocab/`
9. 用手機 Chrome 打開呢個網址，搞掂！

## 方法二：Cloudflare Pages

1. 去 https://dash.cloudflare.com 註冊帳號
2. 登入後揀 **Workers & Pages** → **Create** → **Pages** → **Direct Upload**
3. 將 `index.html` 同 `dse_vocab_data.json` 拖入去，按 **Deploy**
4. 等幾十秒，攞到網址：`https://xxxxx.pages.dev`
5. 用手機 Chrome 打開，搞掂！

## 注意事項
- 以後要更新版本：喺 GitHub 直接上傳覆蓋 `index.html` 就得
- 手機 Chrome 開網址後，建議加到書籤/主畫面，方便日常用
- 網站版同離線版數據係分開儲存（瀏覽器 localStorage），唔會互相影響進度
*（内容由AI生成，仅供参考）*
