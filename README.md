# Đi Đâu Đây

Web lên lịch du lịch riêng tư, ưu tiên trải nghiệm điện thoại. Bạn có thể thêm địa điểm kèm ảnh, chia lịch theo ngày, đánh dấu đã đến, mở tuyến đường Google Maps và tìm khách sạn theo giá bằng SerpAPI.

## Tính năng đã có

- Lịch trình nhiều ngày với ảnh lớn, giờ đi, thời lượng và ghi chú.
- Thêm, xem chi tiết, chỉnh sửa, xóa và lưu yêu thích địa điểm.
- Tải ảnh trực tiếp từ điện thoại; ảnh được lưu trong Supabase Storage riêng tư.
- Chế độ “Đang đi” với nút chỉ đường và đánh dấu đã đến.
- Hotel Finder: điểm đến, ngày ở, số khách, khoảng giá, hạng sao, hủy miễn phí và sắp xếp.
- Xem ảnh/giá/đánh giá/tiện nghi, mở trang đặt phòng và thêm khách sạn vào hành trình.
- Đăng nhập Supabase bằng magic link, Row Level Security và tự động lưu.
- PWA cơ bản, responsive, triển khai tự động lên GitHub Pages.
- Chế độ demo khi chưa cấu hình Supabase/SerpAPI; dữ liệu lưu trong trình duyệt.

## Chạy thử

Yêu cầu Node.js 22 trở lên.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Nếu để trống biến môi trường, app chạy với dữ liệu mẫu và lưu cục bộ. Hotel Finder cũng trả kết quả minh họa để bạn kiểm tra giao diện mà chưa tốn lượt SerpAPI.

## Cấu hình bản riêng tư

1. Chạy [`supabase/schema.sql`](supabase/schema.sql) trong Supabase SQL Editor.
2. Cấu hình magic-link Auth và URL chuyển hướng theo [`docs/SETUP_SUPABASE.md`](docs/SETUP_SUPABASE.md).
3. Deploy backend SerpAPI theo [`docs/SETUP_SERPAPI.md`](docs/SETUP_SERPAPI.md).
4. Thêm ba GitHub Actions secrets và bật Pages theo [`docs/DEPLOY_GITHUB.md`](docs/DEPLOY_GITHUB.md).

## Lệnh chính

```bash
npm run dev           # chạy app trong máy
npm run lint          # kiểm tra mã nguồn
npm run build:github  # tạo bản tĩnh trong dist-github
```

## Cấu trúc quan trọng

| Thư mục | Mục đích |
|---|---|
| `app/` | Giao diện, đăng nhập, thêm địa điểm và Hotel Finder |
| `lib/` | Supabase client, model dữ liệu, adapter Hotel API |
| `supabase/` | Schema, RLS và policy ảnh riêng tư |
| `workers/hotel-search/` | Cloudflare Worker giữ bí mật SerpAPI key |
| `.github/workflows/` | Tự động build/deploy GitHub Pages |
| `docs/` | Hướng dẫn triển khai và kiến trúc |

## Lưu ý giá khách sạn

Giá chỉ là giá tìm thấy ở thời điểm truy vấn và có thể thay đổi khi mở nhà cung cấp. App không tự đặt phòng và không thu tiền; nút “Xem giá & đặt” chuyển sang Google Hotels hoặc trang nhà cung cấp.
