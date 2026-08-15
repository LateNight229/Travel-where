# Hotel Search Worker

Worker này giữ `SERPAPI_KEY` ở phía server và chuẩn hóa kết quả Google Hotels cho frontend.

```bash
npm install
npx wrangler secret put SERPAPI_KEY
npm run deploy
```

Trước khi deploy, đổi `ALLOWED_ORIGIN` trong `wrangler.toml` thành origin GitHub Pages chính xác. Không đưa SerpAPI key vào GitHub Secrets có tiền tố `VITE_`, vì mọi biến Vite đều xuất hiện trong bundle trình duyệt.
