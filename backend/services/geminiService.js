const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return;
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-flash-latest" });
  }

  async extractExpenseFromImage(imageBuffer) {
    return this.retryWithBackoff(async () => {
      if (!this.model) {
        throw new Error('Gemini model not initialized');
      }

      const prompt = `
        Analyze this payment screenshot or SMS and extract expense information.
        Return ONLY a valid JSON object with these exact fields:
        {
          "title": "expense description",
          "amount": 100,
          "category": "Food",
          "date": "2024-01-03",
          "merchant": "store name",
          "confidence": 0.8
        }

        Rules:
        - amount must be a number (not string)
        - category must be one of: Food, Travel, Rent, Entertainment, Healthcare, Shopping, Utilities, Other
        - date format: YYYY-MM-DD
        - confidence: 0.1 to 1.0
        - If unclear, use reasonable defaults
      `;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log('Gemini AI Response:', text);

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Return default data if no JSON found
        return {
          title: 'Payment',
          amount: 0,
          category: 'Other',
          date: new Date().toISOString().split('T')[0],
          merchant: 'Unknown',
          confidence: 0.3
        };
      }

      const expenseData = JSON.parse(jsonMatch[0]);

      // Validate and set defaults
      return {
        title: expenseData.title || 'Payment',
        amount: Number(expenseData.amount) || 0,
        category: expenseData.category || 'Other',
        date: expenseData.date || new Date().toISOString().split('T')[0],
        merchant: expenseData.merchant || 'Unknown',
        confidence: Number(expenseData.confidence) || 0.5
      };
    }).catch(error => {
      console.error('Gemini AI Error after retries:', error);
      // Return fallback data instead of throwing
      return {
        title: 'Payment from Image',
        amount: 0,
        category: 'Other',
        date: new Date().toISOString().split('T')[0],
        merchant: 'Unknown',
        confidence: 0.2
      };
    });
  }

  async categorizeExpense(title, merchant) {
    try {
      if (!this.model) return 'Other';

      const prompt = `Categorize this expense: "${title}" from "${merchant}". Return only one word from: Food, Travel, Rent, Entertainment, Healthcare, Shopping, Utilities, Other`;

      const result = await this.model.generateContent(prompt);
      const category = (await result.response.text()).trim();

      const validCategories = ['Food', 'Travel', 'Rent', 'Entertainment', 'Healthcare', 'Shopping', 'Utilities', 'Other'];
      return validCategories.includes(category) ? category : 'Other';
    } catch (error) {
      return 'Other';
    }
  }

  async generateBudgetAdvice(expenses, budgets) {
    try {
      if (!this.model) return 'Unable to generate advice';

      const prompt = `Based on expenses: ${JSON.stringify(expenses.slice(0, 10))} and budgets: ${JSON.stringify(budgets)}, give 3 short financial tips in JSON format: {"tips": ["tip1", "tip2", "tip3"]}`;

      const result = await this.model.generateContent(prompt);
      const text = await result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const advice = JSON.parse(jsonMatch[0]);
        return advice.tips || ['Track your spending regularly', 'Set realistic budgets', 'Review expenses monthly'];
      }
      return ['Track your spending regularly', 'Set realistic budgets', 'Review expenses monthly'];
    } catch (error) {
      return ['Track your spending regularly', 'Set realistic budgets', 'Review expenses monthly'];
    }
  }

  async predictNextMonthSpending(expenses) {
    try {
      if (!this.model) return { prediction: 0, confidence: 0 };

      const prompt = `Based on these expenses: ${JSON.stringify(expenses.slice(0, 20))}, predict next month's total spending. Return JSON: {"prediction": number, "confidence": 0.1-1.0}`;

      const result = await this.model.generateContent(prompt);
      const text = await result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          prediction: Number(data.prediction) || 0,
          confidence: Number(data.confidence) || 0.5
        };
      }
      return { prediction: 0, confidence: 0 };
    } catch (error) {
      return { prediction: 0, confidence: 0 };
    }
  }

  async generateExpenseNote(title, amount, category) {
    try {
      if (!this.model) return '';

      const prompt = `Generate a brief, helpful note for this expense: "${title}" - ₹${amount} in ${category} category. Return only the note text, max 50 words.`;

      const result = await this.model.generateContent(prompt);
      const note = (await result.response.text()).trim();

      return note || `${category} expense of ₹${amount}`;
    } catch (error) {
      return `${category} expense of ₹${amount}`;
    }
  }

  async parseVoiceExpense(voiceText) {
    try {
      if (!this.model) return null;

      const prompt = `Parse this voice input into expense data: "${voiceText}"
Return ONLY valid JSON:
{
  "title": "expense description",
  "amount": 100,
  "category": "Food",
  "date": "2024-01-03",
  "confidence": 0.8
}

Rules:
- Extract amount as number
- Category: Food, Travel, Rent, Entertainment, Healthcare, Shopping, Utilities, Other
- Use today's date if not specified
- confidence 0.1-1.0 based on clarity`;

      const result = await this.model.generateContent(prompt);
      const text = await result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          title: data.title || 'Voice Expense',
          amount: Number(data.amount) || 0,
          category: data.category || 'Other',
          date: data.date || new Date().toISOString().split('T')[0],
          confidence: Number(data.confidence) || 0.5
        };
      }
      return null;
    } catch (error) {
      console.error('Voice parsing error:', error);
      return null;
    }
  }

  async parseNaturalLanguageQuery(query) {
    try {
      if (!this.model) return null;

      const prompt = `Parse this natural language expense query into search filters: "${query}"
Return ONLY valid JSON:
{
  "category": "Food",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "minAmount": 100,
  "maxAmount": 1000,
  "search": "keyword",
  "sortBy": "date",
  "sortOrder": "desc"
}

Rules:
- category: Food, Travel, Rent, Entertainment, Healthcare, Shopping, Utilities, Other (or null)
- dates in YYYY-MM-DD format (or null)
- amounts as numbers (or null)
- search for keywords in title/notes (or null)
- sortBy: date, amount, category (default: date)
- sortOrder: asc, desc (default: desc)
- Only include fields that are mentioned in the query`;

      const result = await this.model.generateContent(prompt);
      const text = await result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const filters = JSON.parse(jsonMatch[0]);
        // Clean up null values
        Object.keys(filters).forEach(key => {
          if (filters[key] === null || filters[key] === 'null') {
            delete filters[key];
          }
        });
        return filters;
      }
      return {};
    } catch (error) {
      console.error('Natural language parsing error:', error);
      return {};
    }
  }
  async chatWithFinancialAdvisor(message, context = {}) {
    try {
      if (!this.model) return { text: "I'm currently offline. Please check your API key.", action: null };

      const { recentExpenses = [], totalIncome = 0, netBalance = 0, budgets = [] } = context;

      const prompt = `
        You are a smart and helpful financial advisor for a personal expense tracker app.

        User Context:
        - Total Income: ₹${totalIncome}
        - Net Balance: ₹${netBalance}
        - Recent Expenses: ${JSON.stringify(recentExpenses.slice(0, 5))}
        - Budgets: ${JSON.stringify(budgets)}

        User Message: "${message}"

        Goal: Answer the user's question or assist with financial tasks. Be concise, friendly, and encouraging.

        Capabilities:
        1. Answer questions about their spending (using provided context).
        2. Detect if the user wants to ADD an expense (e.g., "I spent A on B").

        Output Format:
        Return ONLY valid JSON:
        {
          "text": "Your helpful response to the user here.",
          "action": null | "ADD_EXPENSE",
          "data": null | { "title": "Coffee", "amount": 50, "category": "Food" }
        }

        Rules:
        - If the user says "add expense" or similar, set action to "ADD_EXPENSE" and extract data.
        - If data is missing for adding expense (like amount), ask for it in "text" and set action to null.
        - Currency is INR (₹).
      `;

      const result = await this.model.generateContent(prompt);
      const text = await result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { text: text || "I didn't understand that.", action: null };

    } catch (error) {
      console.error('Chat error:', error);
      if (error.status === 429) {
        return { text: "I've temporary reached the limit for AI responses. Google limits the free AI quota to prevent abuse. Please try again in a few minutes or tomorrow.", action: null };
      }
      return { text: "Sorry, I'm having trouble processing that right now.", action: null };
    }
  }

  // NEW: Smart expense auto-complete suggestions
  async suggestExpenseCompletion(partialInput, userExpenses = []) {
    try {
      if (!this.model) return [];

      // Find similar expenses from history
      const recentExpenses = userExpenses.slice(0, 20).map(e => ({
        title: e.title,
        amount: e.amount,
        category: e.category,
        merchant: e.merchant || 'Unknown'
      }));

      const prompt = `
        User is typing: "${partialInput}"
        
        Recent expenses history: ${JSON.stringify(recentExpenses)}
        
        Suggest 3 most likely expense completions based on:
        1. User's typing
        2. Their expense history
        3. Common patterns
        
        Return ONLY valid JSON array:
        [
          {
            "title": "Coffee at Starbucks",
            "amount": 250,
            "category": "Food",
            "confidence": 0.9
          }
        ]
        
        Rules:
        - Max 3 suggestions
        - Order by confidence (highest first)
        - Include realistic amounts based on history
        - Category: Food, Travel, Rent, Entertainment, Healthcare, Shopping, Utilities, Other
      `;

      const result = await this.model.generateContent(prompt);
      const text = await result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return suggestions.slice(0, 3);
      }
      return [];
    } catch (error) {
      console.error('Suggestion error:', error);
      return [];
    }
  }

  // NEW: Generate smart budget suggestions
  async generateSmartBudgets(expenses, timeframe = 3) {
    try {
      if (!this.model) return {};

      const prompt = `
        Analyze these expenses from the last ${timeframe} months:
        ${JSON.stringify(expenses.slice(0, 50))}
        
        Generate smart budget suggestions for each category.
        
        Return ONLY valid JSON:
        {
          "Food": 5000,
          "Travel": 2000,
          "Entertainment": 1500,
          "Shopping": 3000,
          "Utilities": 2500,
          "Healthcare": 1000,
          "Rent": 15000,
          "Other": 2000
        }
        
        Rules:
        - Calculate average spending per category
        - Add 10-15% buffer for flexibility
        - Round to nearest 100
        - Only include categories with expenses
        - Amounts in INR
      `;

      const result = await this.model.generateContent(prompt);
      const text = await result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      console.error('Budget generation error:', error);
      return {};
    }
  }

  // NEW: Predict bill amount from history
  async predictBillAmount(billHistory, billTitle) {
    try {
      if (!this.model || !billHistory || billHistory.length === 0) {
        return { prediction: 0, confidence: 0, trend: 'stable' };
      }

      const prompt = `
        Bill: "${billTitle}"
        Payment history: ${JSON.stringify(billHistory)}
        
        Predict the next bill amount and detect trends.
        
        Return ONLY valid JSON:
        {
          "prediction": 1250,
          "confidence": 0.85,
          "trend": "increasing",
          "reasoning": "Average is ₹1200, recent trend shows 5% increase"
        }
        
        Rules:
        - prediction: predicted amount (number)
        - confidence: 0.1 to 1.0
        - trend: "increasing", "decreasing", or "stable"
        - reasoning: brief explanation (max 50 words)
      `;

      const result = await this.model.generateContent(prompt);
      const text = await result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          prediction: Number(data.prediction) || 0,
          confidence: Number(data.confidence) || 0.5,
          trend: data.trend || 'stable',
          reasoning: data.reasoning || ''
        };
      }
      return { prediction: 0, confidence: 0, trend: 'stable' };
    } catch (error) {
      console.error('Bill prediction error:', error);
      return { prediction: 0, confidence: 0, trend: 'stable' };
    }
  }

  // NEW: Smart goal contribution suggestions
  async suggestGoalContribution(goal, userIncome, userExpenses) {
    try {
      if (!this.model) return { amount: 0, frequency: 'monthly', reasoning: '' };

      const avgMonthlyExpense = userExpenses.reduce((sum, e) => sum + e.amount, 0) / 3;
      const disposableIncome = userIncome - avgMonthlyExpense;

      const prompt = `
        Goal: "${goal.title}"
        Target: ₹${goal.targetAmount}
        Current: ₹${goal.currentAmount}
        Remaining: ₹${goal.remainingAmount}
        Target Date: ${goal.targetDate || 'Not set'}
        
        User's monthly disposable income: ₹${disposableIncome}
        
        Suggest optimal contribution amount and frequency.
        
        Return ONLY valid JSON:
        {
          "amount": 5000,
          "frequency": "monthly",
          "reasoning": "Save ₹5000 monthly to reach goal in 6 months"
        }
        
        Rules:
        - amount: realistic based on disposable income
        - frequency: "weekly", "monthly", or "one-time"
        - reasoning: brief explanation (max 50 words)
        - Don't exceed 30% of disposable income
      `;

      const result = await this.model.generateContent(prompt);
      const text = await result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          amount: Number(data.amount) || 0,
          frequency: data.frequency || 'monthly',
          reasoning: data.reasoning || ''
        };
      }
      return { amount: 0, frequency: 'monthly', reasoning: '' };
    } catch (error) {
      console.error('Goal suggestion error:', error);
      return { amount: 0, frequency: 'monthly', reasoning: '' };
    }
  }

  // NEW: Calculate overall financial health score
  async calculateFinancialHealth(context) {
    try {
      if (!this.model) return { score: 70, status: 'Good', insights: [] };

      const { totalIncome, totalExpenses, savingsRate, budgetAdherence, goalsProgress } = context;

      const prompt = `
        Analyze this user's financial profile and return a health score (0-100).
        
        Profile:
        - Monthly Income: ₹${totalIncome}
        - Monthly Expenses: ₹${totalExpenses}
        - Savings Rate: ${savingsRate}%
        - Budget Adherence: ${budgetAdherence}% (percentage of budgets not exceeded)
        - Goals Progress: ${goalsProgress}% (average progress across all goals)
        
        Return ONLY valid JSON:
        {
          "score": 85,
          "status": "Excellent",
          "insights": [
            "Great savings rate this month!",
            "You are adhering to 90% of your budgets.",
            "Consider increasing goal contributions."
          ],
          "color": "#10B981" 
        }
        
        Rules:
        - score: 0 to 100
        - status: "Excellent", "Good", "Fair", "Needs Attention"
        - insights: 3 short, actionable bullets
        - color: Hex code based on status (Green/Emerald for Excellent, Yellow/Amber for Fair, Red/Rose for Needs Attention)
      `;

      const result = await this.model.generateContent(prompt);
      const text = await result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { score: 70, status: 'Good', insights: ['Keep tracking your expenses!'] };
    } catch (error) {
      console.error('Health calculation error:', error);
      return { score: 70, status: 'Good', insights: ['Service temporarily unavailable'] };
    }
  }

  // NEW: Detect spending anomalies
  async detectSpendingAnomalies(recentExpenses, historicalAverages) {
    try {
      if (!this.model) return [];

      const prompt = `
        Compare these recent expenses against historical averages and detect anomalies (unusual spikes).
        
        Recent Expenses: ${JSON.stringify(recentExpenses)}
        Historical Category Averages: ${JSON.stringify(historicalAverages)}
        
        Return ONLY valid JSON array of anomalies:
        [
          {
            "category": "Food",
            "amount": 2500,
            "average": 1200,
            "severity": "high",
            "reason": "Spent 108% more than usual on Food this week."
          }
        ]
        
        Rules:
        - Only report significant anomalies (>30% above average)
        - max 3 anomalies
        - severity: "low", "medium", "high"
      `;

      const result = await this.model.generateContent(prompt);
      const text = await result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]).slice(0, 3);
      }
      return [];
    } catch (error) {
      console.error('Anomaly detection error:', error);
      return [];
    }
  }

  // NEW: Generate predictive alerts and smart notifications
  async generatePredictiveAlerts(context) {
    try {
      if (!this.model) return { alerts: [], predictions: {} };

      const { expenses, budgets, goals, currentDate } = context;
      
      // Calculate spending patterns
      const categorySpending = {};
      expenses.forEach(expense => {
        categorySpending[expense.category] = (categorySpending[expense.category] || 0) + expense.amount;
      });

      const prompt = `
        Analyze spending patterns and generate predictive alerts for this user.
        
        Current Data:
        - Expenses (last 30 days): ${JSON.stringify(expenses.slice(0, 20))}
        - Active Budgets: ${JSON.stringify(budgets)}
        - Goals: ${JSON.stringify(goals)}
        - Current Date: ${currentDate.toISOString()}
        - Category Spending: ${JSON.stringify(categorySpending)}
        
        Generate smart alerts and predictions. Return ONLY valid JSON:
        {
          "alerts": [
            {
              "id": "alert_1",
              "type": "budget_overflow",
              "priority": "high",
              "title": "Budget Alert",
              "message": "You're likely to exceed your Food budget by ₹500 this month",
              "suggestion": "Consider cooking at home more often to save ₹200/week",
              "confidence": 0.85,
              "timeframe": "Next 7 days",
              "showToast": true
            }
          ],
          "predictions": {
            "Food": {
              "amount": 4500,
              "trend": "increasing",
              "confidence": 0.8
            }
          }
        }
        
        Alert Types:
        - budget_overflow: Budget likely to be exceeded
        - spending_spike: Unusual spending increase detected
        - goal_risk: Financial goal at risk
        - smart_tip: Proactive saving suggestion
        
        Rules:
        - Max 5 alerts, prioritize by importance
        - Only high-confidence predictions (>70%)
        - Actionable suggestions for each alert
        - Predict next 30-day spending by category
        - Consider seasonal patterns and trends
      `;

      const result = await this.model.generateContent(prompt);
      const text = await result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        
        // Add unique IDs and timestamps
        data.alerts = (data.alerts || []).map((alert, index) => ({
          ...alert,
          id: alert.id || `alert_${Date.now()}_${index}`,
          timestamp: new Date().toISOString()
        }));

        return data;
      }
      
      return { alerts: [], predictions: {} };
    } catch (error) {
      console.error('Predictive alerts generation error:', error);
      return { alerts: [], predictions: {} };
    }
  }

  // NEW: Advanced receipt scanning with multi-language support
  async extractAdvancedReceiptData(imageBuffer) {
    const startTime = Date.now();
    
    return this.retryWithBackoff(async () => {
      if (!this.model) {
        throw new Error('Gemini model not initialized');
      }

      const prompt = `
        Analyze this receipt/bill image in ANY language (English, Hindi, Tamil, Telugu, Bengali, etc.) and extract detailed information.
        
        Return ONLY a valid JSON object:
        {
          "data": {
            "title": "extracted item/service name",
            "amount": 150.50,
            "category": "Food",
            "date": "2024-01-15",
            "merchant": "store/restaurant name",
            "items": [
              {"name": "Coffee", "price": 80, "qty": 1},
              {"name": "Sandwich", "price": 70.50, "qty": 1}
            ],
            "paymentMethod": "Card/Cash/UPI",
            "taxAmount": 15.50,
            "discountAmount": 0
          },
          "confidence": 0.95,
          "detectedLanguage": "English",
          "processingTime": 1200
        }
        
        Rules:
        - Extract ALL text regardless of language
        - Identify total amount, individual items, merchant name
        - Category: Food, Travel, Rent, Entertainment, Healthcare, Shopping, Utilities, Other
        - Date format: YYYY-MM-DD (use today if not found)
        - Confidence based on text clarity and completeness
        - Handle multiple currencies (₹, $, etc.)
        - Extract GST/tax information if present
      `;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          data: {
            title: 'Receipt Item',
            amount: 0,
            category: 'Other',
            date: new Date().toISOString().split('T')[0],
            merchant: 'Unknown',
            items: [],
            paymentMethod: 'Unknown',
            taxAmount: 0,
            discountAmount: 0
          },
          confidence: 0.3,
          detectedLanguage: 'Unknown',
          processingTime: Date.now() - startTime
        };
      }

      const extractedData = JSON.parse(jsonMatch[0]);
      extractedData.processingTime = Date.now() - startTime;
      
      return extractedData;
    }).catch(error => {
      console.error('Advanced receipt scan error:', error);
      return {
        data: {
          title: 'Receipt Processing Failed',
          amount: 0,
          category: 'Other',
          date: new Date().toISOString().split('T')[0],
          merchant: 'Unknown',
          items: [],
          paymentMethod: 'Unknown',
          taxAmount: 0,
          discountAmount: 0
        },
        confidence: 0.1,
        detectedLanguage: 'Unknown',
        processingTime: Date.now() - startTime
      };
    });
  }

  // Retry helper method
  async retryWithBackoff(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
}

module.exports = new GeminiService();