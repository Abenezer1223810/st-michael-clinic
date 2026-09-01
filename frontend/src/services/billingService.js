import api from './client';

export const billingService = {
  async listInvoices(params = {}) {
    const res = await api.get('/billing/invoices', { params });
    return res.data?.invoices || [];
  },

  async getInvoice(id) {
    const res = await api.get(`/billing/invoices/${id}`);
    return res.data;
  },

  async getVisitInvoice(visitId) {
    const res = await api.get(`/billing/visit/${visitId}`);
    return res.data;
  },

  async receivePayment(invoiceId, { amount, paymentMethod, notes }) {
    const res = await api.post(`/billing/invoices/${invoiceId}/payments`, {
      amount,
      paymentMethod,
      notes,
    });
    return res.data;
  },

  async verifyPayment(invoiceId, { notes } = {}) {
    const res = await api.post(`/billing/invoices/${invoiceId}/verify`, { notes });
    return res.data;
  },

  async cancelPayment(paymentId, { reason }) {
    const res = await api.post(`/billing/payments/${paymentId}/cancel`, { reason });
    return res.data;
  },
};

export default billingService;

