# Cấu hình Hotel Finder bằng SerpAPI

SerpAPI key phải nằm ở backend. Dự án đã kèm một Cloudflare Worker trong `workers/hotel-search` để tránh lộ key trong mã JavaScript công khai trên GitHub Pages.

## Deploy Worker

```bash
cd workers/hotel-search
npm install
npx wrangler login
npx wrangler secret put SERPAPI_KEY
npm run deploy
```

Khi được hỏi secret, dán SerpAPI key. Không commit key vào repository.

Trước khi deploy, sửa `ALLOWED_ORIGIN` trong `wrangler.toml` thành origin thật, ví dụ:

```toml
ALLOWED_ORIGIN = "https://ten-github.github.io"
```

Lưu ý origin không chứa đường dẫn repository. Sau khi deploy, lấy URL dạng `https://di-dau-day-hotel-search.<subdomain>.workers.dev` và dùng làm `VITE_HOTEL_API_URL`.

## Luồng dữ liệu

1. Trình duyệt gửi tiêu chí tìm tới `POST /search`.
2. Worker gắn SerpAPI key và gọi Google Hotels engine.
3. Worker lọc giá, sao, rating và hủy miễn phí; tính điểm “đáng tiền”.
4. Frontend chỉ nhận dữ liệu đã chuẩn hóa, không bao giờ nhận key.

## Chi phí và giới hạn

Mỗi lần bấm tìm có thể tiêu tốn một lượt SerpAPI. Khi chưa cấu hình Worker, app tự chuyển sang sáu khách sạn mẫu và có nhãn “Dữ liệu minh họa”. Bạn có thể thêm Cloudflare Rate Limiting sau này nếu chia sẻ app cho nhiều người.
