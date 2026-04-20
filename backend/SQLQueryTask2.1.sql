-- CASE 1: INSERT CHECK LỖI CÁC INPUT
EXEC dbo.sp_ThemOrder
    @MaKhachHang = N'C9999999', -- TEST MÃ KHÁCH HÀNG KHÔNG TỒN TẠI
    @TongTien    = -500000, -- TEST TỔNG TIỀN ÂM
    @SoTienGiam  = -600000; -- TEST SỐ TIỀN GIẢM ÂM
-- CASE 2: INSERT THÀNH CÔNG, KIỂM TRA TÍNH TỰ ÉP SỐ TIỀN CUỐI < 0 THÀNH 0
EXEC dbo.sp_ThemOrder
    @MaKhachHang = N'C0000001',
    @TongTien    = 500000,
    @SoTienGiam  = 600000;
SELECT * FROM dbo.[ORDER];
SELECT * FROM dbo.CUSTOMER;
-- CASE 3: UPDATE CHECK MÃ ĐƠN KHÔNG TỒN TẠI
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O99999', -- TEST MÃ ĐƠN HÀNG KHÔNG TỒN TẠI
    @TongTien    = 2100000,
    @SoTienGiam  = 50000,
    @TrangThai   = N'ĐÃ THANH TOÁN';
-- CASE 4: UPDATE CHECK LỖI CÁC INPUT
EXEC dbo.sp_CapNhatOrder
    @MaDonHang   = N'O00012',
    @TongTien    = -2100000, -- TEST TỔNG TIỀN ÂM
    @SoTienGiam  = -50000, -- TEST SỐ TIỀN GIẢM ÂM
    @TrangThai   = N'ĐÃ THANH TOÁN'; -- TEST ĐÃ HỦY THÌ KO CHUYỂN SANG ĐÃ THANH TOÁN ĐƯỢC
-- CASE 5: UPDATE THẢNH CÔNG CẢ CÁC THAM SỐ NULL VÀ KO THAY ĐỔI VALUE
EXEC dbo.sp_CapNhatOrder 
    -- KO TRUYỀN VALUE CHO SỐ TIỀN GIẢM, MẶC ĐỊNH LÀ NULL (TỨC KHÔNG THAY ĐỔI SỐ TIỀN CUỐI BAN ĐẦU)
    @MaDonHang   = N'O00013',
    @TongTien    = 770000, -- VẪN GIỮ GIÁ TRỊ TỔNG TIỀN
    @TrangThai   = N'ĐÃ HỦY'; -- THAY ĐỔI TRẠNG THÁI TỪ ĐANG CHỜ SANG ĐÃ HỦY
SELECT * FROM dbo.[ORDER];
-- CASE 6: DELETE CHECK MÃ ĐƠN HÀNG KHÔNG TỒN TẠI
EXEC dbo.sp_XoaOrder N'O99999';
-- CASE 7: DELETE CHECK TRẠNG THÁI ĐÃ THANH TOÁN
EXEC dbo.sp_XoaOrder N'O00011';
-- CASE 8: DELETE THÀNH CÔNG ITEM KHÔNG LIÊN KẾT KHÓA NGOẠI VỚI ORDER_DETAIL VÀ TRANSACTION
EXEC dbo.sp_XoaOrder N'O00013';
SELECT * FROM dbo.[ORDER];
-- CASE 9: DELETE THÀNH CÔNG ITEM CÓ LIÊN KẾT KHÓA NGOẠI VỚI ORDER_DETAIL VÀ TRANSACTION
EXEC dbo.sp_XoaOrder N'O00012';
SELECT * FROM dbo.[ORDER];
SELECT * FROM dbo.[ORDER_DETAIL];
SELECT * FROM dbo.[TRANSACTION];