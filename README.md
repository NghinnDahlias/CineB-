# CineB — Hệ thống quản lý rạp chiếu phim (BTL2 môn Cơ sở dữ liệu)

Dự án gồm thiết kế CSDL (SQL Server), thủ tục / truy vấn, và ứng dụng web (React + API Node) để demo CRUD. Phần đã triển khai rõ ràng nhất là **Page 1 — quản lý đơn hàng (`ORDER`)** khớp thủ tục task 2.1. Page 2 / Page 3 trong `frontend` là placeholder để nhóm mở rộng.

## Cấu trúc trong thư mục `CineB-`

| Thư mục / file | Mô tả |
|----------------|--------|
| `frontend/` | SPA React (Vite). **`src/page1/`**: bảng đơn hàng, modal INSERT/UPDATE/DELETE, `orderApi.js` gọi `/api/orders`, `page1.css`. `App.jsx` mount tab Page 1 qua `Page1OrderView`. |
| `backend/` | Express + `mssql`. **`page1/`**: `orderRoutes.js` (REST `/api/orders`), `orderService.js` gọi `sp_ThemOrder`, `sp_CapNhatOrder`, `sp_XoaOrder` + đọc danh sách `ORDER`. `server.js` chỉ cấu hình chung và `app.use("/api/orders", …)`. `db.js`: pool kết nối dùng chung. |
| `backend/CineB.sql` | Tạo / reset database, bảng, dữ liệu mẫu (chạy trên **SQL Server**). |
| `backend/2_1.sql` | Định nghĩa procedure task 2.1 (sau khi đã có CSDL từ `CineB.sql`). |

Mở rộng Page 2 / Page 3: tạo `frontend/src/page2/` và `backend/page2/` theo mẫu `page1/`, đăng ký trong `App.jsx` và `server.js` — hạn chế sửa `page1/` nếu không làm phần đơn hàng.

## Công nghệ

- Frontend: React, Vite, CSS (`frontend/src/styles/global.css` + CSS theo page).
- Backend: Node.js, Express, `mssql`.
- Database: SQL Server (khuyến nghị 2019+ / 2022).

## Cài đặt và chạy

Cần **Node.js**, **npm**, và SQL Server đã chạy, đã tạo user có quyền trên database `CineB` (hoặc tên bạn đặt trong `.env`).

### 1. Database (SQL Server)

1. Mở SSMS (hoặc công cụ tương đương), kết nối instance SQL Server.
2. Chạy `backend/CineB.sql` để tạo / nạp lại schema + seed.
3. Chạy `backend/2_1.sql` để tạo / cập nhật các procedure task 2.1.
4. (Tùy nhóm) chạy thêm script task 2.2, 2.3… nếu đã có trong repo.

### 2. Backend

```bash
cd backend
npm install
copy .env.example .env
```

Chỉnh `backend/.env`: `DB_HOST`, `DB_PORT` (thường **1433**), `DB_USER`, `DB_PASS`, `DB_NAME=CineB`, v.v.

```bash
npm run test-db
npm start
```

API mặc định: `http://localhost:3000`

- `GET /api/health` — kiểm tra kết nối DB.
- `GET|POST /api/orders`, `PATCH|DELETE /api/orders/:orderId` — Page 1 (lỗi từ SQL / `RAISERROR` trả trong JSON).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite mặc định proxy `/api` → `localhost:3000`. Nếu lỗi proxy, tạo `frontend/.env`:

```text
VITE_API_BASE=http://127.0.0.1:3000/api
```

Mở trình duyệt theo URL Vite in ra (thường `http://localhost:5173`), chọn tab **Page 1** để thao tác đơn hàng.

## Ghi chú

- Chỉ nên có **một** tiến trình backend lắng nghe cổng 3000 khi dùng chung với frontend dev server.
- Test procedure thuần SQL có thể chạy trong SSMS (ví dụ file test case nằm ngoài thư mục `CineB-` ở repo cha, nếu nhóm đặt chung workspace).
