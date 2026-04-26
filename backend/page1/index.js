/**
 * Page 1 backend — ORDER + procedures 2.1 (sp_ThemOrder, sp_CapNhatOrder, sp_XoaOrder).
 *
 * Cách mở rộng: tạo backend/page2/ với *Routes.js + *Service.js, mount trong server.js.
 * Tránh sửa ./page1 nếu không làm phần đơn hàng.
 */
const orderRoutes = require("./orderRoutes.js");

module.exports = {
  orderRoutes
};
