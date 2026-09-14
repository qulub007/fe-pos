import api from "./axios";

export const getTransactions = (params?: {
  page?: number;
  search?: string;
  limit?: number;
}) => api.get("/transactions", { params });

export const getTransaction = (id: number) => api.get(`/transactions/${id}`);

export const createTransaction = (payload: {
    customer_id: number,
    items: {product_id: number, quantity:number}[]
    send_notification?: boolean
}) => api.post('/transactions', payload)
