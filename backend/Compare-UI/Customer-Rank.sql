SELECT 
    c.[MÃ SỐ KHÁCH HÀNG],
    c.[HỌ VÀ TÊN ĐỆM] + ' ' + c.[TÊN] AS [Tên Khách Hàng],
    COUNT(o.[MÃ ĐƠN HÀNG]) AS [Tổng lượt mua (Lượt ghé)],
    MAX(o.[NGÀY TẠO]) AS [Ngày mua gần nhất]
FROM CUSTOMER c
LEFT JOIN dbo.[ORDER] o 
    ON c.[MÃ SỐ KHÁCH HÀNG] = o.[MÃ SỐ KHÁCH HÀNG] 
    AND o.[TRẠNG THÁI] = N'ĐÃ THANH TOÁN'
GROUP BY c.[MÃ SỐ KHÁCH HÀNG], c.[HỌ VÀ TÊN ĐỆM], c.[TÊN]
ORDER BY [Tổng lượt mua (Lượt ghé)] DESC;