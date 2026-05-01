# 📋 TÓM GỌN BÀI TẬP LỚN #2 - HỆ CSDL

## 📌 TỔNG QUAN

Tạo hệ thống database hoàn chỉnh **(10 điểm)**:

- **Phần 1**: Tạo bảng + dữ liệu (3đ)
- **Phần 2**: Viết trigger, thủ tục, hàm (4đ)
- **Phần 3**: Ứng dụng kết nối DB (3đ)

---

## 🎯 PHẦN 1: CƠSỞ DỮ LIỆU (3 điểm)

### ✅ 1.1 Tạo bảng (2 điểm)

- [x] Tạo tất cả bảng từ design ở BTL1
- [x] Thêm **khóa chính** (Primary Key)
- [x] Thêm **khóa ngoại** (Foreign Key)
- [x] Thêm **Check constraints** (kiểm tra dữ liệu hợp lệ)
- [x] Thêm **Trigger** (nếu ràng buộc không thể làm bằng CHECK)
- [x] Lưu file SQL tạo bảng

### ✅ 1.2 Nhập dữ liệu mẫu (1 điểm)

- [x] Mỗi bảng **≥ 5 hàng dữ liệu**
- [x] Dữ liệu phải **có ý nghĩa** (không random)
- [x] Viết SQL INSERT hoặc nhập giao diện
- [x] Lưu file SQL INSERT hoặc screenshots

---

## 🔧 PHẦN 2: SQL - TRIGGERS / PROCEDURES / FUNCTIONS (4 điểm)

### ✅ 2.1 Thủ tục THÊM/SỬA/XÓA (1 điểm) - Chọn 1 bảng

#### Thủ tục INSERT (Thêm)

- [x] Kiểm tra **tất cả ràng buộc** (tuổi > 18, email hợp lệ, v.v.)
- [x] Xuất **thông báo lỗi cụ thể** (không chung chung)
- [x] Ví dụ: `"Lỗi: Tuổi nhân viên phải > 18 tuổi"`

#### Thủ tục UPDATE (Sửa)

- [x] Kiểm tra ràng buộc khi update
- [x] Xuất thông báo lỗi cụ thể
- [x] Xác định điều kiện cập nhật

#### Thủ tục DELETE (Xóa)

- [x] **Rõ ràng**: Khi nào được xóa, khi nào không?
- [x] **Giải thích**: Tại sao cần xóa? (vd: xóa đơn hàng hủy)
- [x] Kiểm tra ràng buộc (vd: không xóa có khóa ngoại)

#### Chuẩn bị

- [x] Viết **3 thủ tục**
- [x] Chuẩn bị **test case** gọi thủ tục

---

### ✅ 2.2 Trigger (1 điểm) - Viết 2 trigger

#### Trigger #1: Kiểm tra ràng buộc nghiệp vụ

- [x] Xác định **ràng buộc gì** cần kiểm tra
- [x] Xác định **thao tác nào** gây vi phạm (INSERT/UPDATE/DELETE)
- [x] Viết trigger kiểm tra + thông báo lỗi
- [x] Ví dụ: `"Lương nhân viên không được > lương giám đốc"`

#### Trigger #2: Tính thuộc tính dẫn xuất

- [x] Chọn **1 thuộc tính dẫn xuất** (vd: tổng doanh thu, số lượng)
- [x] Xác định **thao tác nào** làm thay đổi nó
- [x] Viết trigger **tự động tính** giá trị này
- [x] ⚠️ **Nếu cần dùng thuộc tính dẫn xuất khác, phải tính cái kia trước!**
- [x] Ví dụ: Cập nhật `"Tổng doanh thu shop"` từ `"Tổng giá trị đơn hàng"`

#### Chuẩn bị

- [x] Viết **2 trigger**
- [x] Chuẩn bị **test case** + dữ liệu minh họa

---

### ✅ 2.3 Thủ tục Hiển thị (1 điểm) - Viết 2 thủ tục

#### Thủ tục #1: Truy vấn đơn giản

- [x] Kết nối **≥ 2 bảng**
- [x] Có **WHERE + ORDER BY**
- [x] Tham số đầu vào = giá trị WHERE
- [x] Ví dụ: `"Lấy danh sách nhân viên theo phòng ban, sắp xếp theo tên"`

#### Thủ tục #2: Truy vấn phức tạp

- [x] Kết nối **≥ 2 bảng**
- [x] Có **AGGREGATE FUNCTION** (SUM, COUNT, AVG, v.v.)
- [x] Có **GROUP BY + HAVING + WHERE + ORDER BY**
- [x] Ví dụ: `"Lấy danh sách sản phẩm có tổng bán > 100 cái, sắp xếp theo doanh thu"`

#### Yêu cầu

- [x] **≥ 1 thủ tục** liên quan đến bảng ở 2.1
- [x] Chuẩn bị **test case** gọi thủ tục

---

### ✅ 2.4 Hàm (1 điểm) - Viết 2 hàm

Hàm #1 & #2 phải có:

- [x] **IF hoặc LOOP** (tính toán logic)
- [x] **CON TRỎ** (cursor)
- [x] **Truy vấn dữ liệu** (SELECT, lấy dữ từ DB)
- [x] **Kiểm tra tham số đầu vào** (validate input)
- [x] **Tính toán** dựa trên dữ liệu lấy được
- [x] Chuẩn bị **test case** + dữ liệu minh họa

**Ví dụ**: Hàm tính tổng hóa đơn của 1 khách hàng dùng loop + cursor

---

## 💻 PHẦN 3: ỨNG DỤNG (3 điểm) - Web/Mobile/Desktop

### ✅ 3.1 Giao diện THÊM/SỬA/XÓA (1 điểm)

- [x] Gọi **thủ tục ở 2.1**
- [x] **Validate dữ liệu** nhập (kiểm tra format, giá trị)
- [x] Xuất **thông báo lỗi cụ thể**
- [x] Có nút: **Thêm, Sửa, Xóa**
- [x] Giao diện **dễ nhìn, hợp lý**

### ✅ 3.2 Giao diện Danh sách (1 điểm) - Liên quan bảng ở 2.1

- [x] Gọi **thủ tục ở 2.3**
- [x] **Tìm kiếm + Filter** dữ liệu
- [x] **Sắp xếp** (Sort)
- [x] Từ danh sách có thể: **Thêm mới** (gọi 3.1), **Sửa, Xóa**
- [x] **Validate dữ liệu** nhập vào
- [x] **Xử lý lỗi logic** khi cập nhật/xóa

### ✅ 3.3 Giao diện Hàm/Thủ tục khác (1 điểm)

- [x] Gọi **≥ 1 thủ tục ở 2.3** (khác 3.2) **HOẶC hàm ở 2.4**
- [x] **Validate dữ liệu** đầu vào
- [x] **Hiển thị kết quả** hợp lý
- [x] Có thể dùng chung giao diện 3.2 nếu cùng bảng

---

## ⚠️ YÊU CẦU QUAN TRỌNG

| Yêu cầu | Lưu ý |
|---------|--------|
| **Mỗi thành viên** | Phải viết **≥ 1 câu trong phần 2** (trigger/function/procedure) hoặc **KHÔNG CÓ ĐIỂM** |
| **Ứng dụng** | **PHẢI kết nối DB thực** - Nếu không sẽ **KHÔNG CÓ ĐIỂM PHẦN 3** |
| **Trigger/Hàm/Thủ tục** | **Không được giống nhau** (khác bảng hoặc khác logic) |
| **Dữ liệu** | **Phải đủ + có ý nghĩa**, đừng random |
| **Thành viên** | **Phải hiểu được tất cả code** (kể cả phần không mình viết) |

---

## 📅 HẠN NỘP

| Lớp | Báo cáo sơ bộ | Báo cáo hoàn chỉnh |
|-----|--------------|------------------|
| **Tuần chẵn** | Buổi 5 | **23/11/2025** |
| **Tuần lẻ** | Buổi 6 | **7/12/2025** |

---

## 🚀 BƯỚC ĐẦU TIÊN

1. **Lấy design từ BTL1** → Xác định bảng, ràng buộc
2. **Viết SQL tạo bảng** → Test
3. **Nhập 5+ dữ liệu mẫu** → Lưu ý có ý nghĩa
4. **Chia công việc**: Mỗi người viết **≥ 1 trigger/function/procedure**
5. **Code ứng dụng** → Test kết nối DB → Viết giao diện
6. **Chuẩn bị demo** + test case

---

## 📊 TÓML CHECKLIST

### Phần 1 ✅
- [x] Bảng (PK, FK, CHECK)
- [x] Dữ liệu mẫu (5+ rows/bảng)

### Phần 2 ✅
- [x] 2.1: 3 thủ tục (INSERT/UPDATE/DELETE)
- [x] 2.2: 2 trigger (kiểm tra + tính toán)
- [x] 2.3: 2 thủ tục (đơn giản + phức tạp)
- [x] 2.4: 2 hàm (IF/LOOP + cursor)

### Phần 3 ✅
- [x] 3.1: Giao diện THÊM/SỬA/XÓA
- [x] 3.2: Giao diện danh sách (tìm/filter/sắp xếp)
- [x] 3.3: Giao diện hàm/thủ tục khác

---

**💡 Lưu ý**: Đảm bảo **mỗi thành viên** trong nhóm viết code, không ai "đi trên vai" người khác!

---


Dưới đây là công thức 4 bước để bạn tự tay "chế tác" ra một bộ dữ liệu hoàn hảo:

### BƯỚC 1: Lập "Ma trận kịch bản" cho từng Bảng (Entity)
Thay vì chèn bừa, bạn hãy gạch đầu dòng các trường hợp (kể cả những ca "oái oăm" nhất) có thể xảy ra ở từng bảng:

**1. Bảng Khách hàng (CUSTOMER):**
* **Trường hợp 1 (Happy path):** Khách mua thường xuyên, điểm tích lũy đều.
* **Trường hợp 2 (Khách mới):** Vừa tạo tài khoản hôm nay, điểm tích lũy = 0, chưa mua đơn nào.
* **Trường hợp 3 (Cá mập - VVIP):** Điểm siêu cao (VD: 50,000 điểm), đã ghé rạp > 10 lần.
* **Trường hợp 4 (Khách ngủ đông):** Tài khoản tạo 2 năm trước nhưng 1 năm nay không mua gì (Test tỷ lệ giữ chân).

**2. Bảng Đơn hàng (ORDER) & Thanh toán:**
* **Đơn bình thường:** Mua vé + bắp nước, thanh toán tiền mặt/Momo bình thường.
* **Đơn 0 đồng:** Áp mã khuyến mãi xịn hoặc dùng điểm đổi vé -> Tổng tiền > 0 nhưng Số tiền cuối = 0.
* **Đơn bị hủy (Edge case):** Khách book xong không thanh toán, trạng thái "ĐÃ HỦY". (Giúp test xem biểu đồ doanh thu có lỡ cộng nhầm đơn bị hủy không).
* **Đơn giá trị khủng:** Ai đó bao nguyên rạp, số tiền lên tới hàng chục triệu (Test xem biểu đồ có bị vỡ form không).

**3. Bảng Suất chiếu (SHOWTIME) & Tỷ lệ lấp đầy:**
* **Suất chiếu 100% (Sold out):** Không còn ghế trống.
* **Suất chiếu 0%:** Ế chỏng chơ, không ai mua (Tỷ lệ lấp đầy 0%).
* **Suất chiếu "đang hot":** Lấp đầy khoảng 60-70%.
* **Suất chiếu Tương lai:** Ngày chiếu là tuần sau (Test xem bảng "Phim sắp chiếu" có bắt được không).

---

### BƯỚC 2: Rải đều trên "Trục Thời Gian" (Cực kỳ quan trọng)
Biểu đồ của bạn (Dashboard) phụ thuộc 100% vào yếu tố thời gian. Đừng bao giờ dồn dữ liệu vào 1 tháng. Khung thời gian chuẩn cho một bộ Golden Data nên trải dài ít nhất **1.5 năm**:

* **Dữ liệu nền (Historical):** Rải đơn hàng thưa thớt ở 12 tháng trước (Giúp biểu đồ đường/cột 12 tháng lên hình có sóng nhấp nhô).
* **Dữ liệu hiện tại (Current Month):** Bơm dữ liệu dày đặc vào tháng hiện tại. Các đơn hàng diễn ra trong ngày hôm qua, hôm nay.
* **Dữ liệu tương lai (Future):** Phải có khoảng 10-20 suất chiếu được lên lịch cho tháng sau, kèm theo vài vé đã được đặt trước.

---

### BƯỚC 3: Test các "Giá trị biên" và "Ràng buộc" (Edge Cases)
Đây là lúc bạn cố tình chèn data "khó đỡ" để xem hệ thống có sập không:
* **Tuổi của khách:** Phim dán nhãn `T18` nhưng thử chèn một Order cho khách có năm sinh `2015` xem Logic cơ sở dữ liệu có chặn lại không.
* **Mã Khuyến Mãi hết hạn:** Cố tình tạo một hóa đơn dùng mã `P007` (Đã hết hạn vào tháng trước) xem được không.
* **Trùng giờ chiếu:** Tạo 2 suất chiếu cùng 1 phòng, cùng 1 khoảng thời gian xem DB có báo lỗi không.
* **Ghế hỏng/Bảo trì:** Chèn 1 vài ghế có trạng thái "KHÔNG THỂ CHỌN" để test tổng số ghế bán được.

---

### BƯỚC 4: Cách viết code SQL "Sạch" để tạo data này
Thay vì tổ chức file `.sql` theo kiểu *Bảng nào chèn bảng đó* (Ví dụ: Chèn 1 cục CUSTOMER, rồi chèn 1 cục ORDER), **hãy tổ chức file SQL của bạn theo TỪNG KỊCH BẢN (Scenarios).**

Ví dụ về cách viết file `test_data.sql`:

```sql
/* =========================================================
   KỊCH BẢN 1: KHÁCH VVIP ĐI XEM PHIM NGÀY VALENTINE (QUÁ KHỨ)
   - Khách: Nguyễn Văn A (VIP)
   - Đơn: Bao trọn phòng VIP, Mua 10 Combo bắp nước
========================================================= */
-- 1. Insert Khách
INSERT INTO CUSTOMER (...) VALUES ('C001', 'Nguyễn Văn A', ...);
-- 2. Insert Suất chiếu (Ngày 14/02/2025)
INSERT INTO SHOWTIME (...) VALUES ('ST001', '2025-02-14', ...);
-- 3. Insert Order & Thanh toán
INSERT INTO [ORDER] (...) VALUES ('O001', 'C001', 5000000, ...);
INSERT INTO [TRANSACTION] (...) VALUES ('T001', 'CREDIT_CARD', 5000000, ...);
-- 4. Insert Order Detail & Ticket
INSERT INTO ORDER_DETAIL (...) VALUES ...;

/* =========================================================
   KỊCH BẢN 2: KHÁCH MỚI MUA VÉ TRỰC TUYẾN RỒI HỦY (EDGE CASE)
   - Khách: Lê Thị B (Mới)
   - Đơn: Đặt vé nhưng không thanh toán -> Hủy
========================================================= */
-- 1. Insert Khách
INSERT INTO CUSTOMER (...) VALUES ('C002', 'Lê Thị B', ...);
-- 2. Insert Order (Trạng thái ĐÃ HỦY)
INSERT INTO [ORDER] (...) VALUES ('O002', 'C002', 200000, 'ĐÃ HỦY', ...);
-- LƯU Ý: Không có lệnh insert vào bảng TRANSACTION vì khách chưa trả tiền!
```

**Tóm lại:**
Khi bảo vệ đồ án, việc bạn trình bày được rằng: *"Em không dùng tool sinh dữ liệu ngẫu nhiên (như Mockaroo/Faker). Bộ dữ liệu của em được thiết kế dựa trên Ma Trận Kiểm Thử gồm 15 kịch bản bao phủ từ Happy Path đến Edge Cases..."* sẽ khiến giảng viên đánh giá tư duy làm phần mềm của bạn ở mức Xuất sắc (Cấp độ QA/BA chuyên nghiệp) chứ không chỉ đơn thuần là code chạy được.