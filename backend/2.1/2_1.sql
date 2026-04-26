CREATE OR ALTER PROCEDURE dbo.sp_ThemOrder
    @MaKhachHang [nvarchar](8)
AS
BEGIN
    -- check customer id
    IF NOT EXISTS (SELECT 1 FROM dbo.CUSTOMER WHERE [MÃ SỐ KHÁCH HÀNG] = @MaKhachHang)
    BEGIN
        RAISERROR(N'Mã Khách hàng không tồn tại.', 16, 1);
        RETURN;
    END
    -- tự sinh mã đơn hàng, ngày tạo
    DECLARE @MaMoi INT, @MaDonHang [nvarchar](6), @NgayTao DATETIME = GETDATE();
    SELECT @MaMoi = ISNULL(MAX(TRY_CAST(SUBSTRING([MÃ ĐƠN HÀNG], 2, 5) AS INT)), 0) + 1 FROM dbo.[ORDER];
    SET @MaDonHang = N'O' + RIGHT(N'00000' + CAST(@MaMoi AS NVARCHAR(5)), 5);
    -- thêm order, mặc định đơn hàng mới có trạng thái đang chờ, không có khuyến mãi, tổng tiền 0
    INSERT INTO dbo.[ORDER] ([MÃ ĐƠN HÀNG], [MÃ SỐ KHÁCH HÀNG], [TỔNG TIỀN], [SỐ TIỀN GIẢM], [NGÀY TẠO], [TRẠNG THÁI], [MÃ KHUYẾN MÃI])
    VALUES (@MaDonHang, @MaKhachHang, 0, 0, @NgayTao, N'ĐANG CHỜ', NULL);
END;
GO

CREATE OR ALTER PROCEDURE dbo.sp_CapNhatOrder
    @MaDonHang [nvarchar](6), @TrangThai [nvarchar](15) = NULL, @MaKhuyenMai [nvarchar](4) = NULL
AS
BEGIN
    DECLARE @ErrorMsg NVARCHAR(MAX) = N'', @TrangThaiCu NVARCHAR(15), @OldKhuyenMai NVARCHAR(4);
    -- check order id
    IF NOT EXISTS (SELECT 1 FROM dbo.[ORDER] WHERE [MÃ ĐƠN HÀNG] = @MaDonHang)
    BEGIN
        RAISERROR(N'Mã Đơn hàng không tồn tại.', 16, 1);
        RETURN;
    END
    SELECT @TrangThaiCu = [TRẠNG THÁI], @OldKhuyenMai = [MÃ KHUYẾN MÃI]
    FROM dbo.[ORDER] WHERE [MÃ ĐƠN HÀNG] = @MaDonHang;
    -- check trạng thái
    IF @TrangThai IS NOT NULL
    BEGIN
        -- trạng thái không hợp lệ
        IF @TrangThai NOT IN (N'ĐÃ THANH TOÁN', N'ĐÃ HỦY', N'ĐANG CHỜ')
            SET @ErrorMsg += N'Trạng thái không hợp lệ; ';
        -- chỉ trạng thái đang chờ -> đã thanh toán
        -- chỉ trạng thái đang chờ -> đã hủy            
        ELSE IF (@TrangThaiCu = N'ĐÃ THANH TOÁN' AND @TrangThai IN (N'ĐÃ HỦY', N'ĐANG CHỜ'))
         OR (@TrangThaiCu = N'ĐÃ HỦY' AND @TrangThai IN (N'ĐÃ THANH TOÁN', N'ĐANG CHỜ'))
            SET @ErrorMsg += N'Không hợp lệ khi đổi trạng thái; ';
    END
    -- check promotion id
    IF @MaKhuyenMai IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.PROMOTION WHERE [MÃ KHUYẾN MÃI] = @MaKhuyenMai)
            SET @ErrorMsg += N'Mã Khuyến mãi không tồn tại; ';
    ELSE IF @MaKhuyenMai IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.PROMOTION 
            WHERE [MÃ KHUYẾN MÃI] = @MaKhuyenMai AND [TRẠNG THÁI] = N'HOẠT ĐỘNG')
            SET @ErrorMsg += N'Mã Khuyến mãi không hoạt động; ';

    -- trả lỗi
    IF @ErrorMsg <> N''
    BEGIN
        RAISERROR(@ErrorMsg, 16, 1);
        RETURN;
    END
    -- tính tổng tiền với các order detail và fnb
    DECLARE @TongTien NUMERIC(18, 0);
    -- SUM không có dòng nào trả về NULL -> phải gán 0 để khớp cột NOT NULL
    SELECT @TongTien = COALESCE(SUM(od.[SỐ LƯỢNG SẢN PHẨM] * f.[GIÁ CẢ]), 0)
    FROM dbo.ORDER_DETAIL od
    JOIN dbo.FNB f 
        ON od.[MÃ SẢN PHẨM] = f.[MÃ SẢN PHẨM]
    WHERE 
        od.[MÃ ĐƠN HÀNG] = @MaDonHang AND f.[TRẠNG THÁI] = N'ĐANG BÁN'
    -- check trạng thái
    IF @TrangThai IS NULL
        SET @TrangThai = @TrangThaiCu;
    -- check mã khuyến mãi
    IF @MaKhuyenMai IS NULL
        SET @MaKhuyenMai = @OldKhuyenMai;
    -- tính số tiền giảm
    DECLARE @SoTienGiam NUMERIC(18, 0), @PhanTramGiam NUMERIC(5, 2), @GiamToiDa NUMERIC(6, 0);
    SELECT @PhanTramGiam = [PHẦN TRĂM GIẢM], @GiamToiDa = [GIÁ TRỊ GIẢM TỐI ĐA]
    FROM dbo.PROMOTION WHERE [MÃ KHUYẾN MÃI] = @MaKhuyenMai;
    -- nếu khuyến mãi là giá trị cố định
    SET @SoTienGiam = @GiamToiDa
    -- nếu khuyến mãi là phần trăm
    IF @PhanTramGiam IS NOT NULL
    BEGIN
        SET @SoTienGiam = @TongTien * @PhanTramGiam / 100;
        IF @SoTienGiam > @GiamToiDa
            SET @SoTienGiam = @GiamToiDa;
    END
    SET @SoTienGiam = ISNULL(@SoTienGiam, 0);

    UPDATE dbo.[ORDER]
    SET 
        [TỔNG TIỀN] = @TongTien, [SỐ TIỀN GIẢM] = @SoTienGiam,
        [TRẠNG THÁI] = @TrangThai, [MÃ KHUYẾN MÃI] = @MaKhuyenMai
    WHERE [MÃ ĐƠN HÀNG] = @MaDonHang;
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
    FROM dbo.[ORDER] WHERE [MÃ ĐƠN HÀNG] = @MaDonHang;
    -- check trạng thái
    IF @TrangThai = N'ĐÃ THANH TOÁN'
    BEGIN
        RAISERROR (N'Không được xóa đơn đã thanh toán.', 16, 1);
        RETURN;
    END
    ELSE IF @TrangThai = N'ĐÃ HỦY'
    BEGIN
        RAISERROR (N'Không được xóa đơn đã hủy.', 16, 1);
        RETURN;
    END
    ELSE
    BEGIN 
        DECLARE @NgayTao DATETIME;
        SELECT @NgayTao = [NGÀY TẠO]
        FROM dbo.[ORDER] WHERE [MÃ ĐƠN HÀNG] = @MaDonHang;
        IF DATEDIFF(SECOND, @NgayTao, GETDATE()) <= 300
        BEGIN
            RAISERROR (N'Không được xóa đơn chưa thanh toán khi chưa quá 5 phút.', 16, 1);
            RETURN;
        END
    END
    -- khi lố thời gian 5 phút chọn ghế mà chưa thanh toán
    -- -> giải phóng ghế đã chọn -> xóa đơn hàng
    DELETE FROM dbo.[ORDER]
    WHERE [MÃ ĐƠN HÀNG] = @MaDonHang;
END;
GO
