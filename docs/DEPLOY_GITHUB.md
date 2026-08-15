# Deploy lên GitHub Pages

## 1. Đưa source lên GitHub

Tạo repository mới, giải nén source vào đó rồi chạy:

```bash
git init
git add .
git commit -m "Initial Đi Đâu Đây"
git branch -M main
git remote add origin https://github.com/TEN_GITHUB/TEN_REPO.git
git push -u origin main
```

## 2. Thêm GitHub Actions secrets

Vào **Repository Settings → Secrets and variables → Actions**, tạo:

| Secret | Giá trị |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Publishable hoặc anon key |
| `VITE_HOTEL_API_URL` | URL Cloudflare Worker, không thêm `/search` |

Không thêm `SERPAPI_KEY` vào các secret `VITE_`. SerpAPI key chỉ nằm trong Cloudflare Worker secret.

## 3. Bật Pages

Vào **Settings → Pages**, chọn **Source: GitHub Actions**. Workflow `.github/workflows/deploy-pages.yml` tự chạy sau mỗi lần push lên `main`.

Sau khi job hoàn tất, app có URL:

```text
https://TEN_GITHUB.github.io/TEN_REPO/
```

Nhớ thêm URL này vào Supabase Auth Redirect URLs. Nếu đăng nhập magic link quay về sai trang, đây là nơi cần kiểm tra đầu tiên.

## 4. Cập nhật

Chỉnh source, commit và push. GitHub Actions sẽ build và thay bản đang chạy. Dữ liệu chuyến đi ở Supabase nên không mất khi cập nhật giao diện.

## Custom domain

Nếu gắn domain riêng, cập nhật đồng thời:

- Supabase Site URL và Redirect URLs.
- `ALLOWED_ORIGIN` của Cloudflare Worker.
- Cấu hình domain trong GitHub Pages.
