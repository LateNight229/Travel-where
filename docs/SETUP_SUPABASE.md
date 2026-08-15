# Cấu hình Supabase riêng tư

## 1. Tạo project và database

1. Tạo một Supabase project.
2. Mở **SQL Editor**.
3. Dán toàn bộ nội dung `supabase/schema.sql`, rồi bấm **Run**.

Script tạo hai bảng `trips`, `trip_documents`, bucket `trip-photos` và Row Level Security. Mọi policy đều so sánh `auth.uid()` với chủ sở hữu, nên tài khoản khác không đọc được chuyến đi.

## 2. Bật đăng nhập magic link

Trong **Authentication → Providers → Email**, bật Email/Magic Link. Có thể tắt tạo tài khoản mới sau khi email của bạn đã đăng ký nếu muốn app chỉ dành cho một người.

Trong **Authentication → URL Configuration**:

- Site URL: `https://TEN_GITHUB.github.io/TEN_REPO/`
- Redirect URL: thêm đúng URL trên và URL local `http://localhost:5173/`.

Nếu dùng custom domain, thêm origin của domain đó.

## 3. Lấy khóa frontend

Trong **Project Settings → API**, lấy:

- Project URL → `VITE_SUPABASE_URL`
- Publishable key hoặc anon key → `VITE_SUPABASE_ANON_KEY`

Publishable/anon key được thiết kế để dùng ở trình duyệt; quyền riêng tư đến từ RLS. Không bao giờ đưa `service_role` key vào frontend hoặc GitHub Actions variables có tiền tố `VITE_`.

## 4. Ảnh riêng tư

Bucket `trip-photos` là private. App tạo URL ký có thời hạn một năm sau khi tải ảnh lên. Policy chỉ cho phép tài khoản đọc/ghi đường dẫn bắt đầu bằng chính user ID của tài khoản đó.
