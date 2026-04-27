USE CineB;
GO
 
ALTER FUNCTION dbo.fn_TinhDiemVaHangKhachHang (@MaKH NCHAR(8))
RETURNS NVARCHAR(100)
AS
BEGIN
    -- 1. Kiểm tra tham số đầu vào
    IF NOT EXISTS (SELECT 1 FROM CUSTOMER WHERE [MÃ SỐ KHÁCH HÀNG] = @MaKH)
    BEGIN
        RETURN N'LỖI: Mã khách hàng không tồn tại trong hệ thống!';
    END
 
    -- Khởi tạo biến
    DECLARE @TongDiem   NUMERIC(18,2) = 0;  -- Để lưu 2 chữ số thập phân
    DECLARE @MaHang     NCHAR(5)      = 'ML1  '; -- Mặc định là MEMBER
    DECLARE @TenHang    NCHAR(10);
    DECLARE @SoTienCuoi NUMERIC(18,0);
    DECLARE @DiemCong   NUMERIC(18,2);
 
    -- 2. Con trỏ lấy danh sách đơn hàng đã thanh toán theo thứ tự thời gian
    DECLARE cur_Orders CURSOR FOR
    SELECT [SỐ TIỀN CUỐI]
    FROM [ORDER]
    WHERE [MÃ SỐ KHÁCH HÀNG] = @MaKH
      AND [TRẠNG THÁI] = N'ĐÃ THANH TOÁN  '
    ORDER BY [NGÀY TẠO] ASC;
 
    OPEN cur_Orders;
    FETCH NEXT FROM cur_Orders INTO @SoTienCuoi;
 
    -- 3. Vòng lặp tính toán
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @DiemCong = ROUND(@SoTienCuoi * 0.01, 2);

        SET @TongDiem = @TongDiem + @DiemCong;

        -- Xét thăng hạng ngay sau khi cộng điểm
        IF @TongDiem >= 50000
            SET @MaHang = 'ML3  '; -- VVIP
        ELSE IF @TongDiem >= 20000
            SET @MaHang = 'ML2  '; -- VIP
        ELSE
            SET @MaHang = 'ML1  '; -- MEMBER 
 
        FETCH NEXT FROM cur_Orders INTO @SoTienCuoi;
    END
 
    CLOSE cur_Orders;
    DEALLOCATE cur_Orders;
 
    -- 4. Lấy tên hạng cuối cùng
    SELECT @TenHang = [TÊN HẠNG]
    FROM MEMBERSHIP_LEVEL
    WHERE [MÃ HẠNG THÀNH VIÊN] = @MaHang;
 
    -- Trả về chuỗi kết quả
    RETURN N'Tổng điểm: ' + CAST(@TongDiem AS NVARCHAR(20))
         + N' | Hạng hiện tại: ' + RTRIM(@TenHang);
END
GO
 
ALTER FUNCTION dbo.fn_PhanTichHieuSuatPhong
(
    @MaRap  NCHAR(6),
    @MaPhong NCHAR(3),
    @Thang  INT,
    @Nam    INT
)
RETURNS NVARCHAR(150)
AS
BEGIN
    -- 1. Kiểm tra tham số đầu vào
    IF NOT EXISTS (
        SELECT 1 FROM ROOM
        WHERE [MÃ SỐ RẠP] = @MaRap
          AND [MÃ PHÒNG]  = @MaPhong
    )
        RETURN N'LỖI: Rạp hoặc Phòng chiếu không tồn tại!';
 
    IF @Thang < 1 OR @Thang > 12
        RETURN N'LỖI: Tháng nhập vào không hợp lệ (1-12)!';
 
    IF @Nam < 1900 OR @Nam > 9999
        RETURN N'LỖI: Năm nhập vào không hợp lệ!';
 
    DECLARE @MaSuatChieu  NCHAR(7);
    DECLARE @TongGhe      INT;
    DECLARE @GheDaDat     INT;
    DECLARE @TyLeLapDay   FLOAT;
    DECLARE @TongTyLe     FLOAT = 0;
    DECLARE @SoSuatChieu  INT   = 0;
    DECLARE @KetQua       NVARCHAR(150);
 
    -- 2. Con trỏ lấy các suất chiếu đã/đang hoạt động trong tháng 
    DECLARE cur_Showtimes CURSOR FOR
    SELECT [MÃ SỐ SUẤT CHIẾU]
    FROM SHOWTIME
    WHERE [MÃ SỐ RẠP] = @MaRap
      AND [MÃ PHÒNG]  = @MaPhong
      AND MONTH([NGÀY CHIẾU]) = @Thang
      AND YEAR([NGÀY CHIẾU])  = @Nam
      AND RTRIM([TRẠNG THÁI]) != N'NHÁP'; 
 
    OPEN cur_Showtimes;
    FETCH NEXT FROM cur_Showtimes INTO @MaSuatChieu;
 
    -- 3. Vòng lặp tính tỷ lệ lấp đầy từng suất chiếu
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SELECT
            @TongGhe  = COUNT([MÃ SỐ GHẾ]),
            @GheDaDat = SUM(
                CASE WHEN RTRIM([TRẠNG THÁI GHẾ]) = N'ĐÃ CHỌN' THEN 1 ELSE 0 END
            )
        FROM SEAT_SHOWTIME
        WHERE [MÃ SỐ SUẤT CHIẾU] = @MaSuatChieu;
 
        -- Tránh chia cho 0
        IF @TongGhe > 0
        BEGIN
            SET @TyLeLapDay  = CAST(@GheDaDat AS FLOAT) / @TongGhe;
            SET @TongTyLe    = @TongTyLe + @TyLeLapDay;
            SET @SoSuatChieu = @SoSuatChieu + 1;
        END
 
        FETCH NEXT FROM cur_Showtimes INTO @MaSuatChieu;
    END
 
    CLOSE cur_Showtimes;
    DEALLOCATE cur_Showtimes;
 
    -- 4. Phân loại hiệu suất
    IF @SoSuatChieu = 0
        RETURN N'Không có suất chiếu nào được ghi nhận trong tháng này.';
 
    DECLARE @TrungBinh FLOAT = (@TongTyLe / @SoSuatChieu) * 100;
 
    -- Ngưỡng phân loại (tự đặt, cần xác nhận lại với yêu cầu đề bài nếu cần)
    IF @TrungBinh >= 70.0
        SET @KetQua = N'TỐT - Hiệu suất cao (Lấp đầy trung bình: '
                    + CAST(CAST(@TrungBinh AS DECIMAL(5,2)) AS NVARCHAR) + '%)';
    ELSE IF @TrungBinh >= 40.0
        SET @KetQua = N'KHÁ - Ổn định (Lấp đầy trung bình: '
                    + CAST(CAST(@TrungBinh AS DECIMAL(5,2)) AS NVARCHAR) + '%)';
    ELSE
        SET @KetQua = N'KÉM - Cần xem xét bảo trì/hủy lịch (Lấp đầy trung bình: '
                    + CAST(CAST(@TrungBinh AS DECIMAL(5,2)) AS NVARCHAR) + '%)';
 
    RETURN @KetQua;
END
GO