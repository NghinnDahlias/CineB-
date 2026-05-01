-- Test Case 1: Phòng chiếu hợp lệ, có suất chiếu và có dữ liệu ghế trong tháng (Tháng 4/2026)
-- RAP001 - P01 có suất chiếu ST001, ST002 trong tháng 4/2026. Có một số ghế mang trạng thái 'ĐÃ CHỌN'.
SELECT 
    'TC1: Phong co du lieu thang 4/2026' AS [Tên Test Case], 
    'RAP001, P01, Thang 4, Nam 2026' AS [Input],
    dbo.fn_PhanTichHieuSuatPhong('RAP001', 'P01', 4, 2026) AS [Kết Quả Thực Tế];
-- Test Case 2: Phòng chiếu hợp lệ nhưng KHÔNG CÓ suất chiếu nào trong tháng được chọn
-- Tháng 1/2026 không có lịch chiếu nào cho RAP001 - P01 trong DB.
SELECT 
    'TC2: Phong khong co suat chieu' AS [Tên Test Case], 
    'RAP001, P01, Thang 1, Nam 2026' AS [Input],
    dbo.fn_PhanTichHieuSuatPhong('RAP001', 'P01', 1, 2026) AS [Kết Quả Thực Tế];
-- Test Case 3: Mã Rạp / Mã Phòng KHÔNG TỒN TẠI
-- Nhập mã rạp và mã phòng ảo.
SELECT 
    'TC3: Rap/Phong khong ton tai' AS [Tên Test Case], 
    'RAP999, P99, Thang 4, Nam 2026' AS [Input],
    dbo.fn_PhanTichHieuSuatPhong('RAP999', 'P99', 4, 2026) AS [Kết Quả Thực Tế];

-- Test Case 4: Nhập THÁNG không hợp lệ (nhỏ hơn 1 hoặc lớn hơn 12)
SELECT 
    'TC4: Thang khong hop le' AS [Tên Test Case], 
    'RAP001, P01, Thang 15, Nam 2026' AS [Input],
    dbo.fn_PhanTichHieuSuatPhong('RAP001', 'P01', 15, 2026) AS [Kết Quả Thực Tế];

-- Test Case 5: Nhập NĂM không hợp lệ (< 1900)
SELECT 
    'TC5: Nam khong hop le' AS [Tên Test Case], 
    'RAP001, P01, Thang 4, Nam 1899' AS [Input],
    dbo.fn_PhanTichHieuSuatPhong('RAP001', 'P01', 4, 1899) AS [Kết Quả Thực Tế];
GO