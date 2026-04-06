import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Dashboard
export const getDashboard = () => api.get('/user/dashboard');
export const getTransactions = (limit = 50) => api.get(`/user/transactions?limit=${limit}`);
export const getLoans = () => api.get('/user/loans');
export const getEMISchedule = (loanId) => api.get(`/user/emi-schedule/${loanId}`);

// Loan
export const applyLoan = (loanData) => {
  // Handle FormData - don't set Content-Type, let browser set it with boundary
  if (loanData instanceof FormData) {
    return api.post('/loan/apply', loanData);
  }
  // Handle JSON
  return api.post('/loan/apply', loanData, {
    headers: { 'Content-Type': 'application/json' }
  });
};
export const getLoanStatus = (loanId) => api.get(`/loan/status/${loanId}`);

// Chat
export const sendChatMessage = (message, loanId = null) => 
  api.post('/chat/message', { message, loan_id: loanId });
export const getChatHistory = (limit = 50) => api.get(`/chat/history?limit=${limit}`);
export const negotiateLoan = (loanId, terms) => 
  api.post('/chat/negotiate', { loan_id: loanId, ...terms });

export default api;