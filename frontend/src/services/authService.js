import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
});

// Retry configuration
const retryConfig = {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000, // exponential backoff
  retryCondition: (error) => {
    return (
      axios.isAxiosError(error) &&
      (!error.response || error.response.status >= 500) &&
      error.code !== 'ECONNABORTED' // Don't retry on timeout
    );
  },
};

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Don't retry if no config or retry condition not met
    if (!config || !retryConfig.retryCondition(error)) {
      handleErrorDisplay(error);
      return Promise.reject(error);
    }

    // Initialize retry count
    if (!config._retryCount) {
      config._retryCount = 0;
    }

    // Retry if under limit
    if (config._retryCount < retryConfig.retries) {
      config._retryCount += 1;

      const delay = retryConfig.retryDelay(config._retryCount);
      const toastId = `retry-${config.url}-${Date.now()}`;

      toast.loading(`Retrying request... (${config._retryCount}/${retryConfig.retries})`, {
        id: toastId,
      });

      return new Promise((resolve, reject) => {
        setTimeout(async () => {
          toast.dismiss(toastId);
          try {
            const response = await api(config);
            resolve(response);
          } catch (retryError) {
            reject(retryError);
          }
        }, delay);
      });
    }

    // Max retries reached, show error
    handleErrorDisplay(error);
    return Promise.reject(error);
  }
);

// Helper function to display errors
function handleErrorDisplay(error) {
  if (!navigator.onLine) {
    toast.error('No internet connection. Please check your network and try again.', {
      duration: 5000
    });
  } else if (error.code === 'ECONNABORTED') {
    toast.error('Request timed out. Please try again.', {
      duration: 4000
    });
  } else if (error.response) {
    const status = error.response.status;
    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
      toast.error('Session expired. Please login again.');
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.', {
        duration: 4000
      });
    } else {
      toast.error(error.response.data?.message || 'An error occurred', {
        duration: 4000
      });
    }
  } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
    toast.error('Cannot connect to server. Please ensure the backend is running.', {
      duration: 5000
    });
  } else {
    toast.error('Network error. Please check your connection and try again.', {
      duration: 5000
    });
  }
}

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

export const expenseService = {
  getExpenses: (params) => api.get('/expenses', { params }),
  createExpense: (expense) => {
    // Check if expense is FormData, if so let browser set content-type
    if (expense instanceof FormData) {
      return api.post('/expenses', expense, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post('/expenses', expense);
  },
  updateExpense: (id, expense) => api.put(`/expenses/${id}`, expense),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  getAnalytics: () => api.get('/expenses/analytics'),
};

export const budgetService = {
  getBudgets: () => api.get('/budgets'),
  createBudget: (budget) => api.post('/budgets', budget),
  updateBudget: (id, budget) => api.put(`/budgets/${id}`, budget),
  deleteBudget: (id) => api.delete(`/budgets/${id}`),
};

export const exportService = {
  downloadData: () => api.get('/export', { responseType: 'blob' }),
};

export const ocrService = {
  extractFromImage: (formData) => api.post('/ocr/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  createExpenseFromImage: (formData) => api.post('/ocr/create-expense', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const chatService = {
  sendMessage: (message) => api.post('/ai/chat', { message }),
};

export const incomeService = {
  getIncomes: (params) => api.get('/incomes', { params }),
  createIncome: (income) => api.post('/incomes', income),
  deleteIncome: (id) => api.delete(`/incomes/${id}`),
};

export const testService = {
  seedData: () => api.post('/test/seed'),
  clearData: () => api.post('/test/clear'),
};

export const billService = {
  getBills: (params) => api.get('/bills', { params }),
  createBill: (bill) => api.post('/bills', bill),
  updateBill: (id, bill) => api.put(`/bills/${id}`, bill),
  deleteBill: (id) => api.delete(`/bills/${id}`),
  markAsPaid: (id, data) => api.patch(`/bills/${id}/pay`, data),
  getUpcomingBills: () => api.get('/bills/upcoming'),
  getBillHistory: (id) => api.get(`/bills/${id}/history`)
};

export const aiService = {
  getAdvice: () => api.get('/ai/advice'),
  getPrediction: () => api.get('/ai/prediction'),
  categorize: (title, merchant) => api.post('/ai/categorize', { title, merchant }),
  generateNote: (data) => api.post('/ai/generate-note', data),
  parseVoice: (text) => api.post('/ai/parse-voice', { text }),
  getSmartSuggestions: (partialInput) => api.post('/ai/smart-suggestions', { partialInput }),
  getSmartBudgets: () => api.post('/ai/smart-budgets'),
  predictBill: (data) => api.post('/ai/predict-bill', data),
  chat: (message) => api.post('/ai/chat', { message })
};

export const goalService = {
  getGoals: (params) => api.get('/goals', { params }),
  createGoal: (goal) => api.post('/goals', goal),
  updateGoal: (id, goal) => api.put(`/goals/${id}`, goal),
  deleteGoal: (id) => api.delete(`/goals/${id}`),
  addContribution: (id, data) => api.post(`/goals/${id}/contribute`, data),
  getGoalProgress: (id) => api.get(`/goals/${id}/progress`),
  completeGoal: (id) => api.patch(`/goals/${id}/complete`),
  getGoalStats: () => api.get('/goals/stats/summary')
};

export const advancedService = {
  getInsights: () => api.get('/advanced/insights'),
  getRollovers: () => api.get('/advanced/rollovers'),
};

export default api;