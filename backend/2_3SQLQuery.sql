-- Demo 1: Tìm theo họ tên (có kết quả)
EXEC dbo.sp_TimKiemKhachHang @TuKhoa = N'Nguyễn';
-- Kết quả: C0000001 Nguyễn Văn Nam, C0000011 Ngô Đức Anh (họ "Ngô" không ra, nhưng C0000001 ra)

-- Demo 2: Tìm theo tên
EXEC dbo.sp_TimKiemKhachHang @TuKhoa = N'Lan';
-- Kết quả: C0000004 Phạm Ngọc Lan

-- Demo 3: Tìm theo số điện thoại
EXEC dbo.sp_TimKiemKhachHang @TuKhoa = N'0909000015';
-- Kết quả: C0000005 Võ Minh Tuấn

-- Demo 4: Không có kết quả
EXEC dbo.sp_TimKiemKhachHang @TuKhoa = N'zzzzz';
-- Kết quả: rỗng

-- Demo 1: KH có đơn ĐÃ THANH TOÁN, có cả vé lẫn F&B
-- C0000001 -> O00001 (ĐÃ THANH TOÁN, có TK+F001)
EXEC dbo.sp_TraCuuLichSuKhachHang 
    @MaSoKhachHang = N'C0000001';

-- Demo 2: KH có nhiều đơn, lọc theo khoảng ngày
-- C0000005 -> O00005 (ĐÃ THANH TOÁN)
EXEC dbo.sp_TraCuuLichSuKhachHang 
    @MaSoKhachHang = N'C0000005',
    @TuNgay = '2026-03-01',
    @DenNgay = '2026-03-31';

-- Demo 3: KH có đơn ĐÃ HỦY (để thấy cả trạng thái khác nhau)
-- C0000004 -> O00004 (ĐÃ HỦY)
EXEC dbo.sp_TraCuuLichSuKhachHang 
    @MaSoKhachHang = N'C0000004';

-- Demo 4: KH có đơn ĐANG CHỜ
-- C0000003 -> O00003 (ĐANG CHỜ)
EXEC dbo.sp_TraCuuLichSuKhachHang 
    @MaSoKhachHang = N'C0000003';

-- Demo 5: Lọc ngày không có kết quả (để thấy tính linh hoạt tham số)
EXEC dbo.sp_TraCuuLichSuKhachHang 
    @MaSoKhachHang = N'C0000001',
    @TuNgay = '2026-02-01',
    @DenNgay = '2026-03-30';
-- Kết quả: rỗng (vì O00001 ngày 2026-03-01)

-- Demo 1: Top 5 phim tháng 4/2026 (có dữ liệu thực)
EXEC dbo.sp_ThongKeTopPhim 
    @Thang = 4, 
    @Nam = 2026, 
    @TopN = 5, 
    @DoanhThuToiThieu = 0;
-- Kết quả: các phim như MV0001(Avengers), MV0006(John Wick 4),
--          MV0008(Spider-Man), MV0009(Train to Busan), MV0005(Parasite)...

-- Demo 2: Lọc doanh thu tối thiểu để thu hẹp kết quả
EXEC dbo.sp_ThongKeTopPhim 
    @Thang = 4, 
    @Nam = 2026, 
    @TopN = 3, 
    @DoanhThuToiThieu = 500000;

-- Demo 3: Chỉ lấy Top 1 phim cao nhất
EXEC dbo.sp_ThongKeTopPhim 
    @Thang = 4, 
    @Nam = 2026, 
    @TopN = 1, 
    @DoanhThuToiThieu = 0;

-- Demo 4: Tháng không có dữ liệu (để thấy kết quả rỗng)
EXEC dbo.sp_ThongKeTopPhim 
    @Thang = 3, 
    @Nam = 2026, 
    @TopN = 5, 
    @DoanhThuToiThieu = 0;
-- Kết quả: rỗng (SHOWTIME không có ngày chiếu tháng 3)