
-- Test Case 1: Khách hàng hợp lệ, có nhiều đơn hàng ĐÃ THANH TOÁN
-- Khách hàng C0000001 có nhiều đơn hàng trong DB (O00001, O00013, O00020, O00021, O00022, O00023).
SELECT 
    'TC1: Khach hang co mua hang' AS [Tên Test Case], 
    'C0000001' AS [Input],
    dbo.fn_TinhDiemVaHangKhachHang('C0000001') AS [Kết Quả Thực Tế];

-- Test Case 2: Khách hàng hợp lệ, nhưng đơn hàng bị HỦY (không có điểm)
--  Khách hàng C0000004 có 2 đơn hàng O00004 và 000016, nhưng trạng thái 000004 là 'ĐÃ HỦY'.
SELECT 
    'TC2: Khach hang don bi huy' AS [Tên Test Case], 
    'C0000004' AS [Input],
    dbo.fn_TinhDiemVaHangKhachHang('C0000004') AS [Kết Quả Thực Tế];
-- Test Case 3: Khách hàng hợp lệ, chưa từng mua hàng
-- Khách hàng C0000020 chưa có mã đơn hàng nào trong bảng ORDER.
SELECT 
    'TC3: Khach hang chua mua hang' AS [Tên Test Case], 
    'C0000020' AS [Input],
    dbo.fn_TinhDiemVaHangKhachHang('C0000020') AS [Kết Quả Thực Tế];

-- Test Case 4: Khách hàng KHÔNG TỒN TẠI
-- Nhập một mã khách hàng không có trong bảng CUSTOMER.
SELECT 
    'TC4: Khach hang khong ton tai' AS [Tên Test Case], 
    'C9999999' AS [Input],
    dbo.fn_TinhDiemVaHangKhachHang('C9999999') AS [Kết Quả Thực Tế];