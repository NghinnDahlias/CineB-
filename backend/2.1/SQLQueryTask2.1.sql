-- CASE 1: INSERT CHECK LỖI CÁC INPUT
EXEC dbo.sp_ThemOrder N'C9999999'; -- TEST MÃ KHÁCH HÀNG KHÔNG TỒN TẠI
-- CASE 2: INSERT THÀNH CÔNG
EXEC dbo.sp_ThemOrder N'C0000001';
SELECT * FROM dbo.[ORDER];
SELECT * FROM dbo.CUSTOMER;
-- CASE 3: UPDATE CHECK MÃ ĐƠN KHÔNG TỒN TẠI
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O99999', -- TEST MÃ ĐƠN HÀNG KHÔNG TỒN TẠI
    @TrangThai   = N'ĐÃ THANH TOÁN',
    @MaKhuyenMai = N'P010';
-- CASE 4: UPDATE CHECK LỖI CÁC INPUT KHÔNG TỒN TẠI
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O00012',
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
    @MaDonHang   = N'O00010',
    @TrangThai   = N'ĐANG CHỜ',
    @MaKhuyenMai  = N'P008'; -- TEST MÃ KHUYẾN MÃI KHÔNG HOẠT ĐỘNG
-- CASE 8: UPDATE THẢNH CÔNG MÃ KHUYẾN MÃI GIÁ TRỊ
EXEC dbo.sp_CapNhatOrder 
    -- KHÔNG TRUYỀN VALUE CHO TRẠNG THÁI, MẶC ĐỊNH LÀ NULL (TỨC KHÔNG THAY ĐỔI TRẠNG THÁI BAN ĐẦU)
    @MaDonHang   = N'O00010',
    @MaKhuyenMai  = N'P010'; -- THAY ĐỔI MÃ KHUYẾN MÃI
SELECT * FROM dbo.[ORDER];
-- CASE 9: UPDATE THẢNH CÔNG MÃ KHUYÊN MÃI PHẦN TRĂM
EXEC dbo.sp_CapNhatOrder 
    @MaDonHang   = N'O00010',
    @MaKhuyenMai  = N'P011'; -- THAY ĐỔI MÃ KHUYẾN MÃI
SELECT * FROM dbo.[ORDER];
-- CASE 10: DELETE CHECK MÃ ĐƠN HÀNG KHÔNG TỒN TẠI
EXEC dbo.sp_XoaOrder N'O99999';
-- CASE 11: DELETE CHECK TRẠNG THÁI ĐÃ THANH TOÁN
EXEC dbo.sp_XoaOrder N'O00011';
-- CASE 12: DELETE CHECK TRẠNG THÁI ĐÃ HỦY
EXEC dbo.sp_XoaOrder N'O00012';
-- CASE 13: DELETE CHECK ĐƠN HÀNG ĐANG CHỜ TỐI ĐA 5 PHÚT
EXEC dbo.sp_XoaOrder N'O00013';
-- CASE 14: DELETE THÀNH CÔNG ĐƠN HÀNG ĐANG CHỜ LỚN HƠN 5 PHÚT
EXEC dbo.sp_XoaOrder N'O00010';
SELECT * FROM dbo.[ORDER];
SELECT * FROM dbo.[ORDER_DETAIL];
SELECT * FROM dbo.[TRANSACTION];