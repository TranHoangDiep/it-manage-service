import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:5001/api',
});

// Add token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth Service
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(res => res.data),
  register: (data) => api.post('/auth/register', data).then(res => res.data),
  getMe: () => api.get('/auth/me').then(res => res.data),
  changePassword: (data) => api.post('/auth/change-password', data).then(res => res.data),
};

// User Management Service (Leader only)
export const userService = {
  getAll: () => api.get('/users').then(res => res.data),
  getById: (id) => api.get(`/users/${id}`).then(res => res.data),
  update: (id, data) => api.put(`/users/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/users/${id}`).then(res => res.data),
};

export const itsmService = {
  getSummary: () => api.get('/report/summary').then(res => res.data),
  getCustomers: (period = '30d') => api.get(`/report/customers?period=${period}`).then(res => res.data),
  getCustomerDetail: (id) => api.get(`/report/customers/${id}`).then(res => res.data),
  getCustomerTickets: (id) => api.get(`/report/customers/${id}/tickets`).then(res => res.data),
  getCustomerPerformance: (id, period = '30d') => api.get(`/report/customers/${id}/performance?period=${period}`).then(res => res.data),
  getEngineers: () => api.get('/report/engineers').then(res => res.data),
  getEngineerDetail: (id) => api.get(`/report/engineers/${id}`).then(res => res.data),
  getEngineerTickets: (id) => api.get(`/report/engineers/${id}/tickets`).then(res => res.data),
  getEngineerPerformance: (id, period = '30d') => api.get(`/report/engineers/${id}/performance?period=${period}`).then(res => res.data),
  getTicketDetail: (id) => api.get(`/report/tickets/${id}`).then(res => res.data),
};

export const memberService = {
  getAll: () => api.get('/members').then(res => res.data),
  getById: (id) => api.get(`/members/${id}`).then(res => res.data),
  create: (data) => api.post('/members', data).then(res => res.data),
  update: (id, data) => api.put(`/members/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/members/${id}`).then(res => res.data),
  import: (data) => api.post('/members/import', data).then(res => res.data),
};

export const projectService = {
  getAll: () => api.get('/projects').then(res => res.data),
  getById: (id) => api.get(`/projects/${id}`).then(res => res.data),
  create: (data) => api.post('/projects', data).then(res => res.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/projects/${id}`).then(res => res.data),
  addMember: (projectId, data) => api.post(`/projects/${projectId}/members`, data).then(res => res.data),
  removeMember: (projectId, memberId) => api.delete(`/projects/${projectId}/members/${memberId}`).then(res => res.data),
};

export const customerContactService = {
  getAll: () => api.get('/customer-contacts').then(res => res.data),
  getById: (id) => api.get(`/customer-contacts/${id}`).then(res => res.data),
  create: (data) => api.post('/customer-contacts', data).then(res => res.data),
  update: (id, data) => api.put(`/customer-contacts/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/customer-contacts/${id}`).then(res => res.data),
  addContact: (customerId, data) => api.post(`/customer-contacts/${customerId}/contacts`, data).then(res => res.data),
  removeContact: (customerId, contactId) => api.delete(`/customer-contacts/${customerId}/contacts/${contactId}`).then(res => res.data),
};

export const alarmService = {
  getAll: () => api.get('/alarms').then(res => res.data),
  getById: (id) => api.get(`/alarms/${id}`).then(res => res.data),
  create: (data) => api.post('/alarms', data).then(res => res.data),
  update: (id, data) => api.put(`/alarms/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/alarms/${id}`).then(res => res.data),
};

export const cmdbService = {
  getAll: () => api.get('/cmdb').then(res => res.data),
  getById: (id) => api.get(`/cmdb/${id}`).then(res => res.data),
  create: (data) => api.post('/cmdb', data).then(res => res.data),
  update: (id, data) => api.put(`/cmdb/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/cmdb/${id}`).then(res => res.data),
};
