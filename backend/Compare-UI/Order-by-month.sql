USE [CineB]
GO

SELECT 
    MONTH([NGÀY TẠO]) AS [Tháng], 
    YEAR([NGÀY TẠO]) AS [Năm], 
    COUNT([MÃ ĐƠN HÀNG]) AS [Số đơn hàng],
    SUM([SỐ TIỀN CUỐI]) AS [Tổng doanh thu]
FROM dbo.[ORDER]
WHERE [TRẠNG THÁI] = N'ĐÃ THANH TOÁN'
GROUP BY YEAR([NGÀY TẠO]), MONTH([NGÀY TẠO])
ORDER BY [Năm] DESC, [Tháng] DESC;