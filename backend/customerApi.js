/**
 * backend/customerApi.js
 * API để lấy danh sách khách hàng cho dropdown autocomplete
 */

const express = require("express");
const { poolPromise } = require("./db.js");
const sql = require("mssql");

const router = express.Router();

/**
 * GET /api/customers
 * Lấy danh sách khách hàng (cho dropdown autocomplete)
 * 
 */
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const searchTerm = (req.query.search || "").trim();
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);

    let query = `
      SELECT TOP ${limit}
        [MÃ SỐ KHÁCH HÀNG] AS id,
        [MÃ SỐ KHÁCH HÀNG] AS code,
        ([HỌ VÀ TÊN ĐỆM] + ' ' + [TÊN]) AS name,
        [SỐ ĐIỆN THOẠI] AS phone,
        [EMAIL] AS email
      FROM CUSTOMER
    `;

    // Nếu có search, thêm WHERE clause
    if (searchTerm) {
      // Tìm theo mã hoặc tên
      query += `
        WHERE 
          [MÃ SỐ KHÁCH HÀNG] LIKE @search 
          OR ([HỌ VÀ TÊN ĐỆM] + ' ' + [TÊN]) LIKE @search
      `;
    }

    query += ` ORDER BY [MÃ SỐ KHÁCH HÀNG] ASC`;

    const request = pool.request();
    if (searchTerm) {
      request.input("search", sql.NVarChar, `%${searchTerm}%`);
    }

    const result = await request.query(query);

    res.json({
      ok: true,
      data: result.recordset.map(row => ({
        id: row.id.trim(),
        code: row.code.trim(),
        name: row.name ? row.name.trim() : "",
        phone: row.phone ? row.phone.trim() : "",
        email: row.email ? row.email.trim() : "",
        label: `${row.code.trim()} | ${row.name ? row.name.trim() : ""}` // "KH000001 | Nguyễn Văn A"
      }))
    });
  } catch (err) {
    console.error("❌ GET /api/customers error:", err);
    res.status(500).json({ 
      ok: false, 
      error: err.message || "Lỗi lấy danh sách khách hàng" 
    });
  }
});

/**
 * GET /api/customers/:id
 * Lấy chi tiết 1 khách hàng
 */
router.get("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const customerId = String(req.params.id || "").trim();

    if (!customerId) {
      return res.status(400).json({ 
        ok: false, 
        error: "Mã khách hàng là bắt buộc" 
      });
    }

    const result = await pool.request()
      .input("CustomerId", sql.NVarChar(8), customerId)
      .query(`
        SELECT
          [MÃ SỐ KHÁCH HÀNG] AS id,
          ([HỌ VÀ TÊN ĐỆM] + ' ' + [TÊN]) AS name, 
          [SỐ ĐIỆN THOẠI] AS phone,                
          [EMAIL] AS email
        FROM CUSTOMER
        WHERE [MÃ SỐ KHÁCH HÀNG] = @CustomerId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: "Khách hàng không tồn tại" 
      });
    }

    const row = result.recordset[0];
    res.json({
      ok: true,
      data: {
        id: row.id.trim(),
        name: row.name ? row.name.trim() : "",
        phone: row.phone ? row.phone.trim() : "",
        email: row.email ? row.email.trim() : ""
      }
    });
  } catch (err) {
    console.error("❌ GET /api/customers/:id error:", err);
    res.status(500).json({ 
      ok: false, 
      error: err.message || "Lỗi lấy chi tiết khách hàng" 
    });
  }
});

module.exports = router;
