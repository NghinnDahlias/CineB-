CREATE OR ALTER PROCEDURE sp_TraCuuLichSuKhachHang
    @MaSoKhachHang NCHAR(8),
    @TuNgay DATE = NULL,
    @DenNgay DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- CTE 1: Gom nhóm thông tin vé xem phim theo từng đơn hàng
    WITH VeChiTiet AS (
        SELECT 
            OD.[MÃ ĐƠN HÀNG],
            STRING_AGG(TRIM(M.[TÊN PHIM]) + N' - ' + TRIM(S.[TÊN GHẾ]) + N' (' + TRIM(S.[LOẠI GHẾ]) + N')', N', ') AS ThongTinVe
        FROM [ORDER_DETAIL] OD
        JOIN [TICKET_MOVIE] TM ON OD.[MÃ SẢN PHẨM] = TM.[MÃ SẢN PHẨM]
        JOIN [SHOWTIME] ST ON TM.[MÃ SỐ SUẤT CHIẾU] = ST.[MÃ SỐ SUẤT CHIẾU]
        JOIN [MOVIE] M ON ST.[MÃ PHIM] = M.[MÃ PHIM]
        JOIN [SEAT] S ON TM.[MÃ SỐ RẠP] = S.[MÃ SỐ RẠP] AND TM.[MÃ PHÒNG] = S.[MÃ PHÒNG] AND TM.[MÃ SỐ GHẾ] = S.[MÃ SỐ GHẾ]
        GROUP BY OD.[MÃ ĐƠN HÀNG]
    ),
    -- CTE 2: Gom nhóm thông tin F&B (Combo) theo từng đơn hàng
    FnBChiTiet AS (
        SELECT 
            OD.[MÃ ĐƠN HÀNG],
            STRING_AGG(CAST(OD.[SỐ LƯỢNG SẢN PHẨM] AS VARCHAR) + 'x ' + TRIM(F.[TÊN SẢN PHẨM]), N', ') AS ThongTinFNB
        FROM [ORDER_DETAIL] OD
        JOIN [FNB] F ON OD.[MÃ SẢN PHẨM] = F.[MÃ SẢN PHẨM]
        GROUP BY OD.[MÃ ĐƠN HÀNG]
    )
    
    -- Truy vấn chính: Kết hợp Đơn hàng với Vé và F&B
    SELECT 
        O.[MÃ ĐƠN HÀNG] AS [Mã Đơn],
        O.[NGÀY TẠO] AS [Ngày Giao Dịch],
        ISNULL(V.ThongTinVe, N'Không có vé') AS [Chi Tiết Phim & Ghế],
        ISNULL(F.ThongTinFNB, N'Không mua Combo') AS [Chi Tiết Combo (F&B)],
        O.[TỔNG TIỀN] AS [Tổng Tiền],
        O.[SỐ TIỀN GIẢM] AS [Khuyến Mãi],
        O.[SỐ TIỀN CUỐI] AS [Thành Tiền],
        O.[TRẠNG THÁI] AS [Trạng Thái]
    FROM [ORDER] O
    LEFT JOIN VeChiTiet V ON O.[MÃ ĐƠN HÀNG] = V.[MÃ ĐƠN HÀNG]
    LEFT JOIN FnBChiTiet F ON O.[MÃ ĐƠN HÀNG] = F.[MÃ ĐƠN HÀNG]
    WHERE O.[MÃ SỐ KHÁCH HÀNG] = @MaSoKhachHang
      AND (@TuNgay IS NULL OR O.[NGÀY TẠO] >= @TuNgay)
      AND (@DenNgay IS NULL OR O.[NGÀY TẠO] <= @DenNgay)
    ORDER BY O.[NGÀY TẠO] DESC;
END
GO


CREATE OR ALTER PROCEDURE sp_ThongKeTopPhim
    @Thang INT,
    @Nam INT,
    @TopN INT = 5,
    @DoanhThuToiThieu NUMERIC(18,0) = 0
AS
BEGIN
    SET NOCOUNT ON;

    WITH TongGhe AS (
        SELECT 
            ST.[MÃ PHIM],
            COUNT(SST.[MÃ SEAT_SHOWTIME]) AS TongSoGheCungCap
        FROM [SHOWTIME] ST
        JOIN [SEAT_SHOWTIME] SST ON ST.[MÃ SỐ SUẤT CHIẾU] = SST.[MÃ SỐ SUẤT CHIẾU]
        WHERE MONTH(ST.[NGÀY CHIẾU]) = @Thang AND YEAR(ST.[NGÀY CHIẾU]) = @Nam
        GROUP BY ST.[MÃ PHIM]
    ),
   
    VeBanRa AS (
        SELECT 
            ST.[MÃ PHIM],
            COUNT(TM.[MÃ SẢN PHẨM]) AS SoVeBanRa,
            SUM(P.[GIÁ VÉ]) AS DoanhThuVe
        FROM [SHOWTIME] ST
        JOIN [TICKET_MOVIE] TM ON ST.[MÃ SỐ SUẤT CHIẾU] = TM.[MÃ SỐ SUẤT CHIẾU]
        JOIN [ORDER_DETAIL] OD ON TM.[MÃ SẢN PHẨM] = OD.[MÃ SẢN PHẨM]
        JOIN [ORDER] O ON OD.[MÃ ĐƠN HÀNG] = O.[MÃ ĐƠN HÀNG]
        JOIN [ROOM] R ON TM.[MÃ SỐ RẠP] = R.[MÃ SỐ RẠP] AND TM.[MÃ PHÒNG] = R.[MÃ PHÒNG]
        JOIN [SEAT] S ON TM.[MÃ SỐ RẠP] = S.[MÃ SỐ RẠP] AND TM.[MÃ PHÒNG] = S.[MÃ PHÒNG] AND TM.[MÃ SỐ GHẾ] = S.[MÃ SỐ GHẾ]
        JOIN [PRICE] P ON R.[LOẠI PHÒNG] = P.[LOẠI PHÒNG] AND S.[LOẠI GHẾ] = P.[LOẠI GHẾ]
        WHERE O.[TRẠNG THÁI] = N'ĐÃ THANH TOÁN'
          AND MONTH(ST.[NGÀY CHIẾU]) = @Thang AND YEAR(ST.[NGÀY CHIẾU]) = @Nam
        GROUP BY ST.[MÃ PHIM]
        -- Thêm vào CTE VeBanRa
        HAVING SUM(P.[GIÁ VÉ]) >= @DoanhThuToiThieu
    ),
   
    OrderMovie AS (
        SELECT DISTINCT O.[MÃ ĐƠN HÀNG], ST.[MÃ PHIM]
        FROM [ORDER] O
        JOIN [ORDER_DETAIL] OD ON O.[MÃ ĐƠN HÀNG] = OD.[MÃ ĐƠN HÀNG]
        JOIN [TICKET_MOVIE] TM ON OD.[MÃ SẢN PHẨM] = TM.[MÃ SẢN PHẨM]
        JOIN [SHOWTIME] ST ON TM.[MÃ SỐ SUẤT CHIẾU] = ST.[MÃ SỐ SUẤT CHIẾU]
        WHERE MONTH(ST.[NGÀY CHIẾU]) = @Thang AND YEAR(ST.[NGÀY CHIẾU]) = @Nam
          AND O.[TRẠNG THÁI] = N'ĐÃ THANH TOÁN'
    ),
    
    DoanhThuFNB AS (
        SELECT 
            OM.[MÃ PHIM],
            SUM(F.[GIÁ CẢ] * OD.[SỐ LƯỢNG SẢN PHẨM]) AS DoanhThuFNB
        FROM OrderMovie OM
        JOIN [ORDER_DETAIL] OD ON OM.[MÃ ĐƠN HÀNG] = OD.[MÃ ĐƠN HÀNG]
        JOIN [FNB] F ON OD.[MÃ SẢN PHẨM] = F.[MÃ SẢN PHẨM]
        GROUP BY OM.[MÃ PHIM]
    )
    
   
    SELECT TOP (@TopN)
        M.[MÃ PHIM] AS [Mã Phim],
        TRIM(M.[TÊN PHIM]) AS [Tên Phim],
        ISNULL(VB.SoVeBanRa, 0) AS [Số Vé Bán Ra],
        CAST(ISNULL(VB.SoVeBanRa * 100.0 / NULLIF(TG.TongSoGheCungCap, 0), 0) AS DECIMAL(5,2)) AS [Tỷ Lệ Lấp Đầy (%)],
        ISNULL(VB.DoanhThuVe, 0) AS [Doanh Thu Vé],
        ISNULL(DF.DoanhThuFNB, 0) AS [Doanh Thu Combo],
        (ISNULL(VB.DoanhThuVe, 0) + ISNULL(DF.DoanhThuFNB, 0)) AS [Tổng Doanh Thu]
    FROM [MOVIE] M
    JOIN TongGhe TG ON M.[MÃ PHIM] = TG.[MÃ PHIM]
    LEFT JOIN VeBanRa VB ON M.[MÃ PHIM] = VB.[MÃ PHIM]
    LEFT JOIN DoanhThuFNB DF ON M.[MÃ PHIM] = DF.[MÃ PHIM]
    ORDER BY [Tổng Doanh Thu] DESC, [Tỷ Lệ Lấp Đầy (%)] DESC;
END
GO