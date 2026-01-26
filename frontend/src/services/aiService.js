import api from './authService';

export const aiService = {
  getFinancialAdvice: () => api.get('/ai/advice'),
  getSpendingPrediction: () => api.get('/ai/prediction'),
  categorizeExpense: (title, merchant) => api.post('/ai/categorize', { title, merchant }),
  generateNote: (title, amount, category) => api.post('/ai/generate-note', { title, amount, category }),
  parseVoice: (voiceText) => api.post('/ai/parse-voice', { voiceText }),
  parseQuery: (query) => api.post('/ai/parse-query', { query })
};