-- CASE 1: INSERT CHECK LỖI CÁC INPUT
EXEC dbo.sp_ThemOrder N'C9999999'; -- TEST MÃ KHÁCH HÀNG KHÔNG TỒN TẠI
-- CASE 2: INSERT THÀNH CÔNG (CŨNG NHƯ XÓA ĐƠN HÀNG ĐANG CHỜ KHÁC)
EXEC dbo.sp_ThemOrder N'C0000010';
SELECT * FROM dbo.[ORDER];
SELECT * FROM dbo.CUSTOMER;
-- CASE 3: UPDATE CHECK MÃ ĐƠN KHÔNG TỒN TẠI
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O99999', -- TEST MÃ ĐƠN HÀNG KHÔNG TỒN TẠI
    @TrangThai   = N'ĐÃ THANH TOÁN',
    @MaKhuyenMai = N'P010';
-- CASE 4: UPDATE CHECK LỖI CÁC INPUT KHÔNG TỒN TẠI
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O00006',
    @TrangThai   = N'ĐÃ BỎ', -- TEST TRẠNG THÁI KHÔNG TỒN TẠI
    @MaKhuyenMai  = N'P099'; -- TEST MÃ KHUYẾN MÃI KHÔNG TỒN TẠI
-- CASE 5: UPDATE CHECK LỖI ĐƠN HÀNG ĐÃ THANH TOÁN
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O00011',
    @TrangThai   = N'ĐANG CHỜ', -- TEST THAY ĐỔI TRẠNG THÁI TỪ ĐÃ THANH TOÁN SANG ĐANG CHỜ
    @MaKhuyenMai  = N'P010';
-- CASE 6: UPDATE CHECK LỖI ĐƠN HÀNG ĐÃ HỦY
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O00012',
    @TrangThai   = N'ĐANG CHỜ', -- TEST THAY ĐỔI TRẠNG THÁI TỪ ĐÃ HỦY SANG ĐANG CHỜ
    @MaKhuyenMai  = N'P010';
-- CASE 7: UPDATE CHECK LỖI MÃ KHUYẾN MÃI KHÔNG PHÙ HỢP
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O00006',
    @TrangThai   = N'ĐANG CHỜ',
    @MaKhuyenMai  = N'P008'; -- TEST MÃ KHUYẾN MÃI KHÔNG HOẠT ĐỘNG
-- CASE 8: UPDATE THẢNH CÔNG MÃ KHUYẾN MÃI GIÁ TRỊ
EXEC dbo.sp_CapNhatOrder 
    @MaDonHang   = N'O00006',
    @TrangThai   = N'ĐANG CHỜ',
    @MaKhuyenMai  = N'P010'; -- THAY ĐỔI MÃ KHUYẾN MÃI
SELECT * FROM dbo.[ORDER];
-- CASE 9: UPDATE THẢNH CÔNG MÃ KHUYÊN MÃI PHẦN TRĂM
EXEC dbo.sp_CapNhatOrder 
    @MaDonHang   = N'O00006',
    @TrangThai   = N'ĐANG CHỜ',
    @MaKhuyenMai  = N'P011'; -- THAY ĐỔI MÃ KHUYẾN MÃI
SELECT * FROM dbo.[ORDER];
-- CASE 10: UPDATE CHECK LỖI MÃ KHUYẾN MÃI KHÔNG PHÙ HỢP VỚI HẠNG THÀNH VIÊN CỦA KHÁCH HÀNG (MEMBER)
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O00006',
    @TrangThai   = N'ĐANG CHỜ',
    @MaKhuyenMai  = N'P002'; -- TEST MÃ KHUYẾN MÃI KHÔNG DÙNG ĐƯỢC Ở HẠNG THÀNH VIÊN CỦA KHÁCH HÀNG
-- CASE 11: UPDATE CHECK LỖI MÃ KHUYẾN MÃI ĐÃ ĐƯỢC SỬ DỤNG
EXEC dbo.sp_CapNhatOrder 
    @MaDonHang   = N'O00013',
    @TrangThai   = N'ĐÃ THANH TOÁN',
    @MaKhuyenMai  = N'P011'; -- DÙNG MÃ KHUYẾN MÃI
EXEC dbo.sp_ThemOrder N'C0000010';
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O00014',
    @TrangThai   = N'ĐANG CHỜ',
    @MaKhuyenMai  = N'P011'; -- TEST MÃ KHUYẾN MÃI ĐÃ ĐƯỢC DÙNG
-- CASE 12: UPDATE CHECK LỖI MÃ KHUYẾN MÃI SINH NHẬT P001
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O00014',
    @TrangThai   = N'ĐANG CHỜ',
    @MaKhuyenMai  = N'P001'; -- TEST MÃ KHUYẾN MÃI P001 CHỈ DÙNG ĐƯỢC TRONG THÁNG SINH NHẬT CỦA KHÁCH HÀNG
-- CASE 13: UPDATE CHECK LỖI MÃ KHUYẾN MÃI VIP
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O00003',
    @TrangThai   = N'ĐANG CHỜ',
    @MaKhuyenMai  = N'P002'; -- TEST MÃ KHUYẾN MÃI VIP HẠN DÙNG 2 THÁNG
-- CASE 14: UPDATE CHECK LỖI MÃ KHUYẾN MÃI VVIP
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O00003',
    @TrangThai   = N'ĐANG CHỜ',
    @MaKhuyenMai  = N'P004'; -- TEST MÃ KHUYẾN MÃI VVIP HẠN DÙNG 3 THÁNG
-- CASE 15: UPDATE THÀNH CÔNG KHI KHÔNG DÙNG MÃ KHUYẾN MÃI
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O00006',
    @TrangThai   = N'ĐANG CHỜ',
    @MaKhuyenMai  = NULL; -- KHÔNG DÙNG MÃ KHUYẾN MÃI
SELECT * FROM dbo.[ORDER];
-- CASE 16: DELETE CHECK MÃ ĐƠN HÀNG KHÔNG TỒN TẠI
EXEC dbo.sp_XoaOrder N'O99999';
-- CASE 17: DELETE CHECK TRẠNG THÁI ĐÃ THANH TOÁN
EXEC dbo.sp_XoaOrder N'O00011';
-- CASE 18: DELETE CHECK TRẠNG THÁI ĐÃ HỦY
EXEC dbo.sp_XoaOrder N'O00012';
-- CASE 19: DELETE CHECK ĐƠN HÀNG ĐANG CHỜ TỐI ĐA 5 PHÚT
EXEC dbo.sp_XoaOrder N'O00014';
-- CASE 20: DELETE THÀNH CÔNG ĐƠN HÀNG ĐANG CHỜ LỚN HƠN 5 PHÚT
EXEC dbo.sp_XoaOrder N'O00006';
SELECT * FROM dbo.[ORDER];
SELECT * FROM dbo.[ORDER_DETAIL];
SELECT * FROM dbo.[TRANSACTION];