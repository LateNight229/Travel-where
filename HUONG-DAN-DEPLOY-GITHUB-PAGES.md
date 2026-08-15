# Hướng dẫn triển khai Đi Đâu Đây lên GitHub Pages

Tài liệu này áp dụng cho gói mã nguồn:

```text
Di-Dau-Day-Full-Source.zip
```

Ứng dụng sử dụng:

- **GitHub Pages** để chạy giao diện web.
- **Supabase Auth** để đăng nhập bằng Magic Link.
- **Supabase Database + Storage** để lưu lịch trình và ảnh riêng tư.
- **Cloudflare Worker** để bảo vệ SerpAPI key.
- **SerpAPI Google Hotels** để tìm khách sạn và giá tham khảo.

> Quan trọng: Trong GitHub Pages, phải chọn **GitHub Actions**, không chọn **Deploy from a branch**.

## Mục lục

1. [Chuẩn bị](#1-chuẩn-bị)
2. [Tạo repository GitHub](#2-tạo-repository-github)
3. [Xác định các URL](#3-xác-định-các-url)
4. [Cấu hình Supabase](#4-cấu-hình-supabase)
5. [Deploy SerpAPI Worker](#5-deploy-serpapi-worker)
6. [Thêm GitHub Actions secrets](#6-thêm-github-actions-secrets)
7. [Bật GitHub Pages](#7-bật-github-pages)
8. [Chạy workflow](#8-chạy-workflow)
9. [Đăng nhập lần đầu và khóa đăng ký](#9-đăng-nhập-lần-đầu-và-khóa-đăng-ký)
10. [Checklist kiểm tra](#10-checklist-kiểm-tra)
11. [Xử lý lỗi](#11-xử-lý-lỗi-thường-gặp)

---

## 1. Chuẩn bị

Bạn cần có:

- Tài khoản GitHub.
- Tài khoản Supabase.
- Tài khoản Cloudflare.
- Tài khoản SerpAPI và API key.
- Node.js 22 trở lên.
- Git.

Tải và cài đặt:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/downloads)

Mở PowerShell và kiểm tra:

```powershell
node --version
npm --version
git --version
```

Node nên hiển thị phiên bản dạng:

```text
v22.x.x
```

---

## 2. Tạo repository GitHub

### 2.1. Tạo repository

Truy cập GitHub và chọn **New repository**.

Điền:

- **Repository name:** `di-dau-day`
- **Visibility:**
  - Chọn **Public** nếu dùng GitHub Free.
  - Chọn **Private** nếu gói GitHub của bạn hỗ trợ Pages cho repository private.

Không chọn:

- Add README.
- Add `.gitignore`.
- Add license.

Bấm **Create repository**.

> GitHub Pages là website truy cập công khai. Tính riêng tư của ứng dụng đến từ màn hình đăng nhập Supabase và Row Level Security bảo vệ dữ liệu.

Tham khảo: [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

### 2.2. Giải nén source

Giải nén:

```text
Di-Dau-Day-Full-Source.zip
```

Thư mục đúng phải có trực tiếp:

```text
app/
lib/
supabase/
workers/
.github/
package.json
README.md
```

Không push một thư mục cha rỗng khiến source bị lồng thêm một cấp.

### 2.3. Cập nhật GitHub Action

Mở file:

```text
.github/workflows/deploy-pages.yml
```

Tìm:

```yaml
uses: actions/upload-pages-artifact@v3
```

Đổi thành:

```yaml
uses: actions/upload-pages-artifact@v4
```

Các action triển khai Pages nên là:

```yaml
actions/configure-pages@v5
actions/upload-pages-artifact@v4
actions/deploy-pages@v4
```

Tham khảo: [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

### 2.4. Push source

Mở PowerShell tại thư mục vừa giải nén:

```powershell
cd "D:\DUONG-DAN\Di-Dau-Day-Full-Source"
```

Chạy lần lượt:

```powershell
git init
git add .
git commit -m "Initial Đi Đâu Đây"
git branch -M main
git remote add origin https://github.com/TEN_GITHUB/di-dau-day.git
git push -u origin main
```

Thay `TEN_GITHUB` bằng username GitHub thật.

Ví dụ:

```powershell
git remote add origin https://github.com/ducnguyen/di-dau-day.git
```

Nếu GitHub yêu cầu đăng nhập, chọn đăng nhập bằng trình duyệt.

---

## 3. Xác định các URL

Giả sử:

```text
GitHub username: ducnguyen
Repository: di-dau-day
```

Các URL tương ứng:

| Mục đích | Giá trị |
|---|---|
| Website | `https://ducnguyen.github.io/di-dau-day/` |
| Supabase Site URL | `https://ducnguyen.github.io/di-dau-day/` |
| Supabase Redirect URL | `https://ducnguyen.github.io/di-dau-day/` |
| Cloudflare `ALLOWED_ORIGIN` | `https://ducnguyen.github.io` |

### Khác biệt cần nhớ

- Supabase URL **có** `/di-dau-day/`.
- Cloudflare origin **không có** `/di-dau-day/`.
- Cloudflare origin **không có** dấu `/` cuối.

---

## 4. Cấu hình Supabase

### 4.1. Tạo project

Truy cập [Supabase Dashboard](https://supabase.com/dashboard) và chọn **New project**.

Nên chọn region gần Việt Nam, ví dụ Singapore.

Chờ project được tạo hoàn tất.

### 4.2. Tạo database và bucket ảnh

Trong source, mở file:

```text
supabase/schema.sql
```

Copy toàn bộ nội dung.

Trong Supabase:

```text
SQL Editor
→ New query
→ Dán nội dung schema.sql
→ Run
```

Sau khi chạy thành công, kiểm tra **Table Editor** phải có:

```text
trips
trip_documents
```

Kiểm tra **Storage** phải có bucket:

```text
trip-photos
```

Bucket phải ở trạng thái private.

Schema đã bao gồm Row Level Security. Mỗi tài khoản chỉ được đọc và ghi dữ liệu thuộc về chính tài khoản đó.

### 4.3. Lấy Supabase URL và key

Vào:

```text
Project Settings
→ API hoặc API Keys
```

Copy:

- **Project URL**.
- **Publishable key** dạng `sb_publishable_...`, hoặc legacy `anon` key.

Hai giá trị này sẽ được dùng cho:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Tuyệt đối không sử dụng các key sau trong frontend:

```text
service_role
secret key
```

### 4.4. Cấu hình Magic Link

Vào:

```text
Authentication
→ URL Configuration
```

Điền **Site URL**:

```text
https://TEN_GITHUB.github.io/di-dau-day/
```

Thêm vào **Redirect URLs**:

```text
https://TEN_GITHUB.github.io/di-dau-day/
http://localhost:5173/
```

URL phải đúng repository path và dấu `/` cuối.

Vào tiếp:

```text
Authentication
→ Providers
→ Email
```

Đảm bảo Email/Magic Link đang được bật.

Tham khảo: [Supabase Magic Link](https://supabase.com/docs/guides/auth/auth-email-passwordless)

---

## 5. Deploy SerpAPI Worker

SerpAPI key không được đặt trong frontend vì mã JavaScript của GitHub Pages có thể được xem công khai. Cloudflare Worker đi kèm source sẽ giữ key ở phía server.

### 5.1. Lấy SerpAPI key

Đăng nhập [SerpAPI](https://serpapi.com/), mở Dashboard và copy API key.

Worker sử dụng Google Hotels API với ngày nhận phòng, ngày trả phòng, số khách và tiền tệ VND.

Tham khảo: [SerpAPI Google Hotels API](https://serpapi.com/google-hotels-api)

### 5.2. Sửa Allowed Origin

Mở file:

```text
workers/hotel-search/wrangler.toml
```

Tìm:

```toml
ALLOWED_ORIGIN = "http://localhost:5173"
```

Đổi thành:

```toml
ALLOWED_ORIGIN = "https://TEN_GITHUB.github.io"
```

Ví dụ:

```toml
ALLOWED_ORIGIN = "https://ducnguyen.github.io"
```

Không thêm `/di-dau-day/` vào giá trị này.

### 5.3. Deploy Worker

Mở PowerShell:

```powershell
cd "D:\DUONG-DAN\Di-Dau-Day-Full-Source\workers\hotel-search"
npm install
npx wrangler login
```

Trình duyệt sẽ mở để bạn đăng nhập Cloudflare.

Deploy lần đầu:

```powershell
npm run deploy
```

Sau khi Worker được tạo, thêm SerpAPI key:

```powershell
npx wrangler secret put SERPAPI_KEY
```

Khi PowerShell yêu cầu giá trị, dán SerpAPI key rồi bấm Enter.

`wrangler secret put` lưu key dưới dạng secret và triển khai một version Worker mới.

Tham khảo: [Cloudflare Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

Sau khi hoàn tất, ghi lại URL dạng:

```text
https://di-dau-day-hotel-search.TEN_SUBDOMAIN.workers.dev
```

### 5.4. Test Worker

Chạy trong PowerShell:

```powershell
$worker = "https://di-dau-day-hotel-search.TEN_SUBDOMAIN.workers.dev"

$body = @{
    destination      = "Đà Nẵng"
    checkIn          = "2026-10-16"
    checkOut         = "2026-10-19"
    adults           = 2
    children         = 0
    minPrice         = 500000
    maxPrice         = 3000000
    rating           = 4
    hotelClass       = @(3, 4, 5)
    freeCancellation = $false
    sort             = "value"
} | ConvertTo-Json

Invoke-RestMethod `
    -Method Post `
    -Uri "$worker/search" `
    -ContentType "application/json" `
    -Body $body
```

Nếu đúng, PowerShell sẽ trả về danh sách `hotels`.

---

## 6. Thêm GitHub Actions secrets

Trong repository GitHub, vào:

```text
Settings
→ Secrets and variables
→ Actions
→ New repository secret
```

Tạo đúng ba secret sau.

### `VITE_SUPABASE_URL`

Ví dụ:

```text
https://abcdefgh.supabase.co
```

### `VITE_SUPABASE_ANON_KEY`

Ví dụ:

```text
sb_publishable_xxxxxxxxx
```

### `VITE_HOTEL_API_URL`

Ví dụ:

```text
https://di-dau-day-hotel-search.xxxxx.workers.dev
```

Không thêm `/search` vào cuối `VITE_HOTEL_API_URL`.

Không tạo `SERPAPI_KEY` trên GitHub. Key này chỉ được lưu trong Cloudflare Worker.

---

## 7. Bật GitHub Pages

Trong repository, vào:

```text
Settings
→ Pages
→ Build and deployment
→ Source
→ GitHub Actions
```

Không chọn **Deploy from a branch**.

Workflow có sẵn sẽ:

1. Cài Node.js.
2. Chạy `npm ci`.
3. Build frontend vào `dist-github`.
4. Upload Pages artifact.
5. Deploy lên GitHub Pages.

---

## 8. Chạy workflow

Vào:

```text
Repository
→ Actions
→ Deploy Đi Đâu Đây to GitHub Pages
→ Run workflow
→ Branch: main
→ Run workflow
```

Chờ cả hai job chuyển sang màu xanh:

```text
build
deploy
```

Sau khi hoàn tất, website sẽ có URL:

```text
https://TEN_GITHUB.github.io/di-dau-day/
```

Nếu không thấy nút **Run workflow**, chạy:

```powershell
git commit --allow-empty -m "Deploy production settings"
git push
```

---

## 9. Đăng nhập lần đầu và khóa đăng ký

Mở website GitHub Pages.

Nếu cấu hình đúng, website phải hiện:

```text
Không gian riêng tư
Chào mừng trở lại
```

Nhập email của bạn, mở email nhận được và bấm Magic Link.

Supabase mặc định có thể tự tạo user mới nếu email chưa tồn tại. Vì vậy, sau lần đăng nhập đầu tiên:

1. Vào Supabase.
2. Mở `Authentication → Users`.
3. Kiểm tra email của bạn đã được tạo.
4. Xóa user không mong muốn nếu có.

Để ngăn người khác tự tạo tài khoản, mở:

```text
lib/supabase-client.ts
```

Tìm:

```ts
options: { emailRedirectTo: redirectTo }
```

Đổi thành:

```ts
options: {
  emailRedirectTo: redirectTo,
  shouldCreateUser: false,
}
```

Push thay đổi:

```powershell
git add lib/supabase-client.ts
git commit -m "Disable public account creation"
git push
```

Sau thay đổi này:

- Email đã tồn tại vẫn đăng nhập được.
- Email chưa tồn tại sẽ không tự tạo tài khoản.

---

## 10. Checklist kiểm tra

Sau khi triển khai, kiểm tra lần lượt:

- [ ] Mở website bằng cửa sổ ẩn danh.
- [ ] Website hiển thị màn hình đăng nhập.
- [ ] Đăng nhập thành công bằng Magic Link.
- [ ] Thêm được một địa điểm mới.
- [ ] Tải được ảnh từ điện thoại hoặc máy tính.
- [ ] Refresh trang và địa điểm vẫn còn.
- [ ] Mở được Hotel Finder.
- [ ] Chọn ngày lưu trú trong tương lai.
- [ ] Kết quả không còn nhãn `Dữ liệu minh họa`.
- [ ] Lưu được khách sạn vào shortlist.
- [ ] Thêm được khách sạn vào lịch trình.
- [ ] Mở được chỉ đường Google Maps.

---

## 11. Xử lý lỗi thường gặp

| Hiện tượng | Nguyên nhân và cách sửa |
|---|---|
| Website hiện `Demo cục bộ` | GitHub secrets chưa đúng hoặc workflow chưa chạy lại sau khi thêm secret. |
| Magic Link quay về localhost | Supabase Site URL hoặc Redirect URL đang sai. |
| Magic Link mở trang 404 | Redirect URL thiếu `/di-dau-day/`. |
| Worker trả `403 Origin` | `ALLOWED_ORIGIN` phải là `https://TEN_GITHUB.github.io`, không chứa repository path. |
| Worker báo thiếu `SERPAPI_KEY` | Chạy lại `npx wrangler secret put SERPAPI_KEY`. |
| Hotel Finder vẫn dùng dữ liệu mẫu | Thiếu `VITE_HOTEL_API_URL` hoặc chưa chạy lại GitHub Action. |
| Không tìm thấy khách sạn | Mở rộng giá lên `0–5.000.000`, bỏ hủy miễn phí hoặc giảm rating. |
| Tải ảnh thất bại | Chưa chạy `supabase/schema.sql` hoặc chưa có bucket `trip-photos`. |
| GitHub Pages báo 404 | Pages Source chưa chọn GitHub Actions hoặc job deploy chưa thành công. |
| Actions báo lỗi artifact | Đổi `actions/upload-pages-artifact@v3` thành `@v4`. |
| Email chưa đến | Kiểm tra Spam và Supabase Auth logs; không gửi yêu cầu Magic Link liên tục. |

---

## 12. Cập nhật website sau này

Mỗi lần chỉnh sửa source, chạy:

```powershell
git add .
git commit -m "Update website"
git push
```

GitHub Actions sẽ tự build và cập nhật website.

Dữ liệu lịch trình được lưu trong Supabase nên không mất khi cập nhật giao diện.

---

## 13. Thông tin cần gửi khi nhờ kiểm tra lỗi

Nếu triển khai thất bại, chuẩn bị:

1. URL repository GitHub.
2. Ảnh màn hình tab **Actions**.
3. Nội dung bước màu đỏ trong job `build` hoặc `deploy`.
4. URL GitHub Pages.
5. URL Cloudflare Worker, nhưng không gửi SerpAPI key.
6. Ảnh cấu hình Supabase Redirect URLs nếu lỗi đăng nhập.

Không gửi các thông tin bí mật sau:

```text
SERPAPI_KEY
Supabase service_role key
Cloudflare API token
Mật khẩu GitHub hoặc Supabase
```
