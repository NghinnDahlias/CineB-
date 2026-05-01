import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

function normalizeOrder(row) {
  return {
    id: row.orderId,
    customerId: String(row.customerId || '').trim(),
    customerName: String(row.customerName || '').trim(),
    totalAmount: Number(row.totalAmount || 0),
    discountAmount: Number(row.discountAmount || 0),
    finalAmount: Number(row.finalAmount || 0),
    createdAt: row.createdAt,
    status: String(row.status || '').trim(),
    promoCode: row.promoCode ? String(row.promoCode).trim() : '',
  };
}

export const orderService = {
  async list() {
    const res = await axios.get(`${BASE_URL}/api/orders`);
    return Array.isArray(res.data) ? res.data.map(normalizeOrder) : [];
  },

  async create(customerId) {
    await axios.post(`${BASE_URL}/api/orders`, { customerId });
  },

  async update(orderId, payload) {
    await axios.patch(`${BASE_URL}/api/orders/${orderId}`, payload);
  },

  async remove(orderId) {
    await axios.delete(`${BASE_URL}/api/orders/${orderId}`);
  },
};
