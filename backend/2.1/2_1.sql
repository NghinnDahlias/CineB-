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

    -- Nếu khách hàng đã có đơn hàng đang chờ, xóa đơn hàng đó trước khi tạo đơn mới
    DELETE FROM dbo.[ORDER] 
    WHERE [MÃ SỐ KHÁCH HÀNG] = @MaKhachHang AND [TRẠNG THÁI] = N'ĐANG CHỜ';

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
    @MaDonHang [nvarchar](6), @TrangThai [nvarchar](15), @MaKhuyenMai [nvarchar](4)
AS
BEGIN
    DECLARE @ErrorMsg NVARCHAR(MAX) = N'', @TrangThaiCu NVARCHAR(15), @OldKhuyenMai NVARCHAR(4), 
            @MaHangThanhVien NVARCHAR(10), @MaKhachHang NVARCHAR(8),
            @NgaySinh DATE, @NgayHieuLucHang DATE;
    -- check order id
    IF NOT EXISTS (SELECT 1 FROM dbo.[ORDER] WHERE [MÃ ĐƠN HÀNG] = @MaDonHang)
    BEGIN
        RAISERROR(N'Mã Đơn hàng không tồn tại.', 16, 1);
        RETURN;
    END
    SELECT 
        @TrangThaiCu = O.[TRẠNG THÁI], 
        @OldKhuyenMai = O.[MÃ KHUYẾN MÃI],
        @MaHangThanhVien = C.[MÃ HẠNG THÀNH VIÊN],
        @MaKhachHang = O.[MÃ SỐ KHÁCH HÀNG],
        @NgaySinh = C.[NGÀY SINH],
        @NgayHieuLucHang = C.[NGÀY HIỆU LỰC HẠNG]
    FROM dbo.[ORDER] O
    JOIN dbo.CUSTOMER C ON O.[MÃ SỐ KHÁCH HÀNG] = C.[MÃ SỐ KHÁCH HÀNG]
    WHERE O.[MÃ ĐƠN HÀNG] = @MaDonHang;

    -- check trạng thái
        -- chỉ trạng thái đang chờ -> đã thanh toán
        -- chỉ trạng thái đang chờ -> đã hủy 
        -- chỉ trạng thái đang chờ -> đang chờ
    IF @TrangThaiCu = N'ĐÃ THANH TOÁN'
    BEGIN
        RAISERROR(N'Không thể cập nhật đơn hàng đã thanh toán.', 16, 1);
        RETURN;    
    END;
    ELSE IF @TrangThaiCu = N'ĐÃ HỦY'
    BEGIN
        RAISERROR(N'Không thể cập nhật đơn hàng đã hủy.', 16, 1);
        RETURN;    
    END;
    -- trạng thái không hợp lệ
    IF @TrangThai NOT IN (N'ĐÃ THANH TOÁN', N'ĐÃ HỦY', N'ĐANG CHỜ')
            SET @ErrorMsg += N'Trạng thái không hợp lệ; ';           
    -- check promotion id
    IF @MaKhuyenMai IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.PROMOTION WHERE [MÃ KHUYẾN MÃI] = @MaKhuyenMai)
            SET @ErrorMsg += N'Mã Khuyến mãi không tồn tại; ';
    ELSE IF @MaKhuyenMai IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.PROMOTION 
            WHERE [MÃ KHUYẾN MÃI] = @MaKhuyenMai AND [TRẠNG THÁI] = N'HOẠT ĐỘNG')
            SET @ErrorMsg += N'Mã Khuyến mãi không hoạt động; ';
    ELSE IF @MaKhuyenMai IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.HƯỞNG 
            WHERE [MÃ KHUYẾN MÃI] = @MaKhuyenMai AND [MÃ HẠNG THÀNH VIÊN] = @MaHangThanhVien)
            SET @ErrorMsg += N'Mã khuyến mãi này không áp dụng ở hạng thành viên này; ';
    -- check mã khuyến mãi đã được khách này dùng cho đơn đã thanh toán chưa
    ELSE IF @MaKhuyenMai IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.[ORDER] 
            WHERE [MÃ KHUYẾN MÃI] = @MaKhuyenMai 
              AND [MÃ SỐ KHÁCH HÀNG] = @MaKhachHang 
              AND [TRẠNG THÁI] = N'ĐÃ THANH TOÁN'
              AND [MÃ ĐƠN HÀNG] <> @MaDonHang)
            SET @ErrorMsg += N'Mã khuyến mãi này đã được sử dụng cho đơn hàng khác; ';
    -- Ràng buộc nâng cao cho các mã cụ thể
    -- P001: Tháng sinh
    IF @MaKhuyenMai = N'P001' AND MONTH(@NgaySinh) <> MONTH(GETDATE())
            SET @ErrorMsg += N'Mã P001 chỉ áp dụng trong tháng sinh của khách hàng; ';
    -- P002, P003: Hạn 2 tháng từ ngày hiệu lực hạng (VIP, VVIP)
    ELSE IF (@MaKhuyenMai = N'P002' OR @MaKhuyenMai = N'P003') 
            AND GETDATE() > DATEADD(MONTH, 2, @NgayHieuLucHang)
            AND @MaHangThanhVien <> N'ML1'
            SET @ErrorMsg += N'Mã ' + @MaKhuyenMai + N' đã hết hạn (sau 2 tháng hiệu lực hạng); ';
    -- P004, P005, P006: Hạn 3 tháng từ ngày hiệu lực hạng (VVIP)
    ELSE IF (@MaKhuyenMai = N'P004' OR @MaKhuyenMai = N'P005' OR @MaKhuyenMai = N'P006') 
            AND GETDATE() > DATEADD(MONTH, 3, @NgayHieuLucHang)
            AND @MaHangThanhVien = N'ML3'
            SET @ErrorMsg += N'Mã ' + @MaKhuyenMai + N' đã hết hạn (sau 3 tháng hiệu lực hạng); ';

    -- trả lỗi
    IF @ErrorMsg <> N''
    BEGIN
        RAISERROR(@ErrorMsg, 16, 1);
        RETURN;
    END

    UPDATE dbo.[ORDER]
    SET 
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