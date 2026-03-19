# HỆ THỐNG QUẢN LÝ SHOP THỜI TRANG
### Đồ án Cơ sở Ngành CNTT — Trường ĐH Nam Cần Thơ

---

## HƯỚNG DẪN CHẠY DỰ ÁN TRÊN MÁY KHÁC — VISUAL STUDIO 2022

> **Hướng dẫn từ A-Z cho người nhận code từ GitHub, chạy trên Visual Studio 2022.**

---

### Bước 1: Cài đặt phần mềm (2 thứ)

#### 1.1. Cài Visual Studio 2022
1. Vào: https://visualstudio.microsoft.com/downloads/ → Tải bản **Community** (Free)
2. Trong **Visual Studio Installer**, chọn workload:
   - ✅ **Node.js development** (hoặc **ASP.NET and web development**)
3. Nhấn **Install** → Chờ cài xong

> ✅ Khi cài VS 2022, máy đã có sẵn **SQL Server LocalDB** — không cần cài SQL Server riêng.

#### 1.2. Cài Node.js
1. Vào: https://nodejs.org → Tải bản **LTS** (nút xanh lá)
2. Chạy file cài đặt → Nhấn **Next** cho đến khi xong
3. Sau khi cài, **đóng rồi mở lại Visual Studio 2022** để VS nhận Node.js

---

### Bước 2: Tải code từ GitHub

**Cách A — Clone trực tiếp trong VS 2022:**
1. Mở **Visual Studio 2022**
2. Chọn **Clone a repository**
3. Dán link:
   ```
   https://github.com/phamvy301104-star/Shopthoitrang.git
   ```
4. Chọn thư mục lưu (ví dụ `C:\`) → Nhấn **Clone**
5. VS 2022 sẽ tự mở thư mục dự án

**Cách B — Tải file ZIP:**
1. Vào: https://github.com/phamvy301104-star/Shopthoitrang
2. Nhấn nút **Code** (xanh lá) → **Download ZIP**
3. Giải nén ra 1 thư mục (ví dụ `C:\ShopThoiTrang`)
4. Mở VS 2022 → **File** → **Open** → **Folder...** → Chọn thư mục vừa giải nén

> ⚠️ **LƯU Ý:** Nếu giải nén ra có 2 thư mục lồng nhau (ví dụ `Shopthoitrang-main\ShopThoiTrang`), hãy mở thư mục **bên trong** — thư mục chứa file `app.js`.

---

### Bước 3: Tạo Cơ sở dữ liệu

1. Trong VS 2022, mở Terminal: **View** → **Terminal** (hoặc nhấn **Ctrl + `**)
2. Gõ lệnh sau:

```
sqlcmd -S "(localdb)\MSSQLLocalDB" -E -C -i database/schema.sql
```

3. Chờ chạy xong — nếu **không có dòng lỗi đỏ** là thành công

> ✅ Database `shop_thoi_trang` đã được tạo với 12 bảng và dữ liệu mẫu.

#### ⚠️ Nếu gõ `sqlcmd` báo "không tìm thấy lệnh"

Dùng đường dẫn đầy đủ:
```
& "C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\SQLCMD.EXE" -S "(localdb)\MSSQLLocalDB" -E -C -i database/schema.sql
```

Hoặc tạo database qua **SQL Server Object Explorer** (xem phần bên dưới).

#### 💡 Cách thay thế: Dùng SQL Server Object Explorer

1. Trong VS 2022: **View** → **SQL Server Object Explorer**
2. Nhấn nút **Add SQL Server** (biểu tượng máy chủ có dấu +)
3. Server Name: `(localdb)\MSSQLLocalDB`
4. **✅ QUAN TRỌNG: Tick vào ô "Trust Server Certificate"**
5. Nhấn **Connect**
6. Nhấn chuột phải vào server → **New Query**
7. Mở file `database/schema.sql` bằng Notepad → **Copy toàn bộ** → **Paste** vào cửa sổ Query
8. Nhấn **Execute** (▶ xanh lá) hoặc **Ctrl + Shift + E**

---

### Bước 4: Cấu hình kết nối Database

Trong VS 2022, mở file `config/database.js` (nhấn đúp trong Solution Explorer bên phải).

**Sửa dòng `Server=localhost` thành `Server=(localdb)\\MSSQLLocalDB`:**

```javascript
const config = {
    connectionString: 'Driver={ODBC Driver 18 for SQL Server};Server=(localdb)\\MSSQLLocalDB;Database=shop_thoi_trang;Trusted_Connection=yes;TrustServerCertificate=yes;'
};
```

> ⚠️ Nhớ dùng **2 dấu gạch chéo** `\\` trước `MSSQLLocalDB`

**Nhấn Ctrl + S để lưu file.**

---

### Bước 5: Cài thư viện và chạy

Trong Terminal của Visual Studio (**View** → **Terminal**):

**1. Cài thư viện:**
```
npm install
```
Chờ đến khi thấy "added xxx packages" là xong.

**2. Chạy ứng dụng:**
```
node app.js
```

> ⚠️ **KHÔNG nhấn nút ▶ (Run) màu xanh trên thanh công cụ** — nút đó dùng cho C#/.NET. Phải gõ `node app.js` trong Terminal.

**3. Khi thấy dòng này là thành công:**
```
========================================
  SHOP THỜI TRANG - HỆ THỐNG QUẢN LÝ
  Server đang chạy tại: http://localhost:3000
  Tài khoản Admin: Lan123 / Lan123
========================================
```

**4. Mở trình duyệt** (Chrome/Edge), vào:
```
http://localhost:3000
```

---

### Bước 6: Đăng nhập

| Tài khoản | Tên đăng nhập | Mật khẩu |
|---|---|---|
| **Admin** | `Lan123` | `Lan123` |
| **Người dùng** | Tự đăng ký tại trang Đăng ký |  |

---

### ⚡ Tóm tắt nhanh (4 lệnh)

Mở VS 2022 → Clone repo → Mở Terminal (`View → Terminal`):
```
sqlcmd -S "(localdb)\MSSQLLocalDB" -E -C -i database/schema.sql
```
Sửa `config/database.js`: đổi `Server=localhost` thành `Server=(localdb)\\MSSQLLocalDB`
```
npm install
node app.js
```
Mở trình duyệt → `http://localhost:3000` → Đăng nhập: **Lan123 / Lan123**

---

### 🔧 Xử lý lỗi thường gặp

#### ❌ Lỗi "Cannot find module 'express'"
**Sửa:** Gõ `npm install` trong Terminal rồi chạy lại `node app.js`.

#### ❌ Lỗi "ConnectionError: Failed to connect"
**Sửa:**
1. Kiểm tra đã sửa `config/database.js` chưa (phải có `(localdb)\\MSSQLLocalDB`)
2. Kiểm tra LocalDB đang chạy:
   ```
   sqllocaldb info MSSQLLocalDB
   ```
   Nếu State không phải **Running**, gõ:
   ```
   sqllocaldb start MSSQLLocalDB
   ```

#### ❌ Lỗi "EADDRINUSE: address already in use :::3000"
**Sửa:** Gõ trong Terminal:
```
taskkill /f /im node.exe
```
Rồi chạy lại `node app.js`

#### ❌ Lỗi SSL: "The certificate chain was issued by an authority that is not trusted"
**Sửa:**
- Kiểm tra `config/database.js` có `TrustServerCertificate=yes;`
- Khi dùng SQL Server Object Explorer, tick ô **"Trust Server Certificate"**
- Khi dùng sqlcmd, thêm `-C`: `sqlcmd -S ... -E -C -i ...`

#### ❌ Nhấn nút ▶ (Run) bị lỗi "Unable to start debugging"
**Sửa:** Không dùng nút ▶. Mở **View** → **Terminal** rồi gõ `node app.js`.

#### ❌ Lỗi "sqlcmd: command not found"
**Sửa:** Dùng đường dẫn đầy đủ (xem Bước 3) hoặc dùng SQL Server Object Explorer.

#### ❌ Trang trắng / không hiển thị
**Sửa:** Nhấn F12 trong trình duyệt → xem tab Console. Kiểm tra Terminal có log lỗi.

---

## Công nghệ sử dụng
| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js + Express.js |
| Database | Microsoft SQL Server 2022 / LocalDB |
| Template Engine | EJS + express-ejs-layouts |
| Frontend | Bootstrap 5 + Font Awesome 6 |
| Biểu đồ | Chart.js |
| Xác thực | bcryptjs + express-session |
| Upload file | Multer |
| AI Chatbot | Tự code (Rule-based NLP) |
