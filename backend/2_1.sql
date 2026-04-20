CREATE OR ALTER PROCEDURE dbo.sp_ThemOrder
    @MaKhachHang [nvarchar](8),
    @TongTien     [numeric](18,0),
    @SoTienGiam   [numeric](18,0)
AS
BEGIN
    DECLARE @ErrorMsg [nvarchar](MAX) = N'';
    -- check customer id
    IF NOT EXISTS (SELECT 1 FROM dbo.CUSTOMER WHERE [MÃ SỐ KHÁCH HÀNG] = @MaKhachHang)
        SET @ErrorMsg += N'Mã Khách hàng không tồn tại; ';
    -- check total price
    IF @TongTien < 0
        SET @ErrorMsg += N'Tổng tiền không hợp lệ; ';
    -- check discount
    IF @SoTienGiam < 0
        SET @ErrorMsg += N'Số tiền giảm không hợp lệ; ';
    -- trả lỗi
    IF @ErrorMsg <> N''
    BEGIN
        RAISERROR(@ErrorMsg, 16, 1);
        RETURN;
    END

    DECLARE @MaMoi INT;
    DECLARE @MaDonHang [nvarchar](6);
    -- tự sinh mã đơn hàng
    SELECT @MaMoi = ISNULL(MAX(TRY_CAST(SUBSTRING([MÃ ĐƠN HÀNG], 2, 5) AS INT)), 0) + 1
    FROM dbo.[ORDER];
    SET @MaDonHang = N'O' + RIGHT(N'00000' + CAST(@MaMoi AS NVARCHAR(5)), 5);
    -- tự sinh ngày tạo
    DECLARE @NgayTao DATETIME = GETDATE();
    -- thêm order, mặc định đơn hàng mới có trạng thái đang chờ
    INSERT INTO dbo.[ORDER] ([MÃ ĐƠN HÀNG], [MÃ SỐ KHÁCH HÀNG], [TỔNG TIỀN], [SỐ TIỀN GIẢM], [NGÀY TẠO], [TRẠNG THÁI])
    VALUES (@MaDonHang, @MaKhachHang, @TongTien, @SoTienGiam, @NgayTao, N'ĐANG CHỜ');
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CapNhatOrder
    @MaDonHang [nvarchar](6),
    @TongTien [numeric](18,0) = NULL,
    @SoTienGiam [numeric](18,0) = NULL,
    @TrangThai [nvarchar](15) = NULL
AS
BEGIN
    DECLARE @ErrorMsg    NVARCHAR(MAX) = N'';
    DECLARE @TrangThaiCu NVARCHAR(15);
    DECLARE @OldTong     NUMERIC(18, 0);
    DECLARE @OldGiam     NUMERIC(18, 0);
    -- check order id
    IF NOT EXISTS (SELECT 1 FROM dbo.[ORDER] WHERE [MÃ ĐƠN HÀNG] = @MaDonHang)
    BEGIN
        RAISERROR(N'Mã Đơn hàng không tồn tại.', 16, 1);
        RETURN;
    END
    -- NULL = giữ nguyên; chỉ kiểm tra âm khi có truyền giá trị
    IF @TongTien IS NOT NULL AND @TongTien < 0
        SET @ErrorMsg += N'Tổng tiền không hợp lệ; ';
    IF @SoTienGiam IS NOT NULL AND @SoTienGiam < 0
        SET @ErrorMsg += N'Số tiền giảm không hợp lệ; ';

    SELECT
        @TrangThaiCu = [TRẠNG THÁI],
        @OldTong     = [TỔNG TIỀN],
        @OldGiam     = [SỐ TIỀN GIẢM]
    FROM dbo.[ORDER]
    WHERE [MÃ ĐƠN HÀNG] = @MaDonHang;
    -- check trạng thái
    IF @TrangThai IS NOT NULL
    BEGIN
        -- chỉ trạng thái đang chờ -> đã thanh toán
        -- chỉ trạng thái đang chờ -> đã hủy
        IF  (@TrangThaiCu = N'ĐÃ THANH TOÁN' AND @TrangThai IN (N'ĐÃ HỦY', N'ĐANG CHỜ'))
         OR (@TrangThaiCu = N'ĐÃ HỦY' AND @TrangThai IN (N'ĐÃ THANH TOÁN', N'ĐANG CHỜ'))
            SET @ErrorMsg += N'Không hợp lệ khi đổi trạng thái; ';
    END

    -- trả lỗi
    IF @ErrorMsg <> N''
    BEGIN
        RAISERROR(@ErrorMsg, 16, 1);
        RETURN;
    END
    -- cập nhật cái cũ nếu có thay đổi
    IF @TongTien IS NOT NULL AND @OldTong <> @TongTien
    BEGIN
        UPDATE dbo.[ORDER]
        SET [TỔNG TIỀN] = @TongTien
        WHERE [MÃ ĐƠN HÀNG] = @MaDonHang;
    END

    IF @SoTienGiam IS NOT NULL AND @OldGiam <> @SoTienGiam
    BEGIN
        UPDATE dbo.[ORDER]
        SET [SỐ TIỀN GIẢM] = @SoTienGiam
        WHERE [MÃ ĐƠN HÀNG] = @MaDonHang;
    END

    IF @TrangThai IS NOT NULL AND @TrangThaiCu <> @TrangThai
    BEGIN
        UPDATE dbo.[ORDER]
        SET [TRẠNG THÁI] = @TrangThai
        WHERE [MÃ ĐƠN HÀNG] = @MaDonHang;
    END
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_XoaOrder
    @MaDonHang [nvarchar](6)
AS
BEGIN
    -- check order id
    IF NOT EXISTS (SELECT 1 FROM dbo.[ORDER] WHERE [MÃ ĐƠN HÀNG] = @MaDonHang)
    BEGIN
        RAISERROR (N'Mã Đơn hàng không tồn tại.', 16, 1);
        RETURN;
    END

    DECLARE @TrangThai [nvarchar](15);
    SELECT @TrangThai = [TRẠNG THÁI]
    FROM dbo.[ORDER]
    WHERE [MÃ ĐƠN HÀNG] = @MaDonHang;
    -- check trạng thái
    IF @TrangThai = N'ĐÃ THANH TOÁN'
    BEGIN
        RAISERROR (N'Không được xóa đơn đã thanh toán.', 16, 1);
        RETURN;
    END
    -- xóa chi tiết đơn hàng
    DELETE FROM dbo.[ORDER_DETAIL]
    WHERE [MÃ ĐƠN HÀNG] = @MaDonHang;
    -- xóa giao dịch
    DELETE FROM dbo.[TRANSACTION]
    WHERE [MÃ ĐƠN HÀNG] = @MaDonHang;
    -- xóa đơn hàng
    DELETE FROM dbo.[ORDER]
    WHERE [MÃ ĐƠN HÀNG] = @MaDonHang;
END;
GO
