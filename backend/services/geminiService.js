const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not found in environment variables");
      return;
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-flash-latest",
    });
  }

  getTodayDateString() {
    return new Date().toISOString().split("T")[0];
  }

  extractFirstJsonObject(text = "") {
    if (!text || typeof text !== "string") return null;

    const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const source = fencedMatch ? fencedMatch[1] : text;

    const firstBrace = source.indexOf("{");
    if (firstBrace === -1) return null;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = firstBrace; i < source.length; i++) {
      const ch = source[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === "\\") {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === "{") depth += 1;
      if (ch === "}") depth -= 1;

      if (depth === 0) {
        return source.slice(firstBrace, i + 1);
      }
    }

    return null;
  }

  parseFirstJsonObject(text = "") {
    const jsonText = this.extractFirstJsonObject(text);
    if (!jsonText) return null;

    try {
      return JSON.parse(jsonText);
    } catch (error) {
      return null;
    }
  }

  normalizeAmount(value, fallback = 0) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Number(value.toFixed(2)));
    }

    if (typeof value !== "string") return fallback;

    const cleaned = value
      .replace(/[,\s]/g, "")
      .replace(/[₹$€£]/g, "")
      .replace(/(?:INR|RS\.?)/gi, "")
      .replace(/[^\d.-]/g, "");

    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, Number(parsed.toFixed(2)));
  }

  normalizeDate(value, fallback) {
    const safeFallback = fallback || this.getTodayDateString();
    if (!value) return safeFallback;

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().split("T")[0];
    }

    const text = String(value).trim();
    if (!text) return safeFallback;

    const parsedDate = new Date(text);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split("T")[0];
    }

    const dateMatch = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
    if (dateMatch) {
      let day = Number(dateMatch[1]);
      let month = Number(dateMatch[2]);
      let year = Number(dateMatch[3]);

      if (year < 100) year += 2000;

      if (month > 12 && day <= 12) {
        const temp = day;
        day = month;
        month = temp;
      }

      const normalizedDate = new Date(year, month - 1, day);
      if (!Number.isNaN(normalizedDate.getTime())) {
        return normalizedDate.toISOString().split("T")[0];
      }
    }

    return safeFallback;
  }

  normalizeCategory(value, fallback = "Other") {
    const validCategories = [
      "Food",
      "Travel",
      "Rent",
      "Entertainment",
      "Healthcare",
      "Shopping",
      "Utilities",
      "Other",
    ];

    if (!value) return fallback;

    const normalized = String(value).trim().toLowerCase();
    if (!normalized) return fallback;

    const exact = validCategories.find(
      (category) => category.toLowerCase() === normalized,
    );
    if (exact) return exact;

    const categoryMap = {
      food: [
        "restaurant",
        "cafe",
        "coffee",
        "meal",
        "dining",
        "grocery",
        "groceries",
        "swiggy",
        "zomato",
      ],
      travel: [
        "uber",
        "ola",
        "taxi",
        "bus",
        "train",
        "flight",
        "fuel",
        "petrol",
        "diesel",
        "transport",
      ],
      rent: ["rent", "lease", "landlord"],
      entertainment: [
        "movie",
        "netflix",
        "prime",
        "spotify",
        "game",
        "gaming",
        "concert",
      ],
      healthcare: [
        "hospital",
        "pharmacy",
        "medicine",
        "medical",
        "clinic",
        "doctor",
      ],
      shopping: ["amazon", "flipkart", "mall", "store", "purchase", "shopping"],
      utilities: [
        "electricity",
        "water",
        "gas",
        "internet",
        "wifi",
        "phone",
        "mobile",
        "utility",
        "bill",
      ],
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some((keyword) => normalized.includes(keyword))) {
        return category.charAt(0).toUpperCase() + category.slice(1);
      }
    }

    return fallback;
  }

  normalizeConfidence(value, fallback = 0.5) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(1, Math.max(0.1, Number(numeric.toFixed(2))));
  }

  inferCategoryFromText(text = "") {
    return this.normalizeCategory(text, "Other");
  }

  parseExpenseFromMessage(message = "") {
    if (!message || typeof message !== "string") return null;

    const normalized = message.trim();
    if (!normalized) return null;

    const amountMatch = normalized.match(
      /(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]+(?:\.[0-9]{1,2})?)/i,
    );
    if (!amountMatch?.[0]) return null;

    const amount = this.normalizeAmount(amountMatch[0], 0);
    if (!amount || amount <= 0) return null;

    let title = "Expense";
    const titlePatterns = [
      /(?:spent|paid|pay|add(?:ed)?\s+expense\s*(?:for|of|on)?|expense\s*(?:for|of|on)?)\s*(?:₹|rs\.?|inr)?\s*[0-9,]+(?:\.[0-9]{1,2})?\s*(?:for|on|at)?\s*([a-zA-Z][a-zA-Z0-9\s&'\-]{2,60})/i,
      /(?:for|on|at)\s+([a-zA-Z][a-zA-Z0-9\s&'\-]{2,60})/i,
    ];

    for (const pattern of titlePatterns) {
      const match = normalized.match(pattern);
      if (match?.[1]) {
        title = match[1].trim().replace(/\s{2,}/g, " ");
        break;
      }
    }

    if (
      /\b(coffee|tea|lunch|dinner|breakfast|meal|food|grocery|groceries)\b/i.test(
        normalized,
      )
    ) {
      title = title === "Expense" ? "Food Expense" : title;
    }

    const category = this.inferCategoryFromText(`${normalized} ${title}`);

    return {
      title,
      amount,
      category,
      date: this.getTodayDateString(),
    };
  }

  createLocalChatFallback(message, context = {}, reason = "offline") {
    const text = String(message || "").trim();
    const lower = text.toLowerCase();
    const parsedExpense = this.parseExpenseFromMessage(text);

    if (parsedExpense) {
      const prefix =
        reason === "quota"
          ? "AI quota is currently busy, but I can still help."
          : "AI is temporarily unavailable, but I can still help.";

      return {
        text: `${prefix} I detected an expense: ${parsedExpense.title} for ₹${parsedExpense.amount}. Confirm below to add it.`,
        action: "ADD_EXPENSE",
        data: parsedExpense,
      };
    }

    const recentExpenses = Array.isArray(context.recentExpenses)
      ? context.recentExpenses
      : [];
    const recentTotal = recentExpenses.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0,
    );

    if (/\b(hi|hello|hey|hii)\b/i.test(lower)) {
      return {
        text: "Hi! I am ready. You can type things like: 'I spent 250 on lunch' or ask 'show my recent spending'.",
        action: null,
        data: null,
      };
    }

    if (/\b(recent|spending|summary|total)\b/i.test(lower)) {
      return {
        text: `From your recent records, I can see about ₹${recentTotal.toFixed(2)} spent across ${recentExpenses.length} expenses. You can also say: 'Add expense 1200 for groceries'.`,
        action: null,
        data: null,
      };
    }

    return {
      text: "I can still help in offline mode. Try: 'I spent 500 on fuel' or 'Add expense 300 for dinner'.",
      action: null,
      data: null,
    };
  }

  normalizeChatResponse(response, originalMessage = "") {
    if (!response || typeof response !== "object") {
      return this.createLocalChatFallback(originalMessage, {}, "offline");
    }

    const normalized = {
      text: String(response.text || "I can help you manage expenses.").trim(),
      action: response.action || null,
      data: response.data || null,
    };

    if (normalized.action === "ADD_EXPENSE") {
      const parsedData = this.parseExpenseFromMessage(originalMessage) || {};
      const merged = {
        title: String(
          normalized.data?.title || parsedData.title || "Expense",
        ).trim(),
        amount: this.normalizeAmount(
          normalized.data?.amount ?? parsedData.amount ?? 0,
          0,
        ),
        category: this.inferCategoryFromText(
          `${normalized.data?.category || ""} ${normalized.data?.title || ""} ${originalMessage}`,
        ),
        date: this.normalizeDate(
          normalized.data?.date || parsedData.date || this.getTodayDateString(),
          this.getTodayDateString(),
        ),
      };

      if (!merged.amount || merged.amount <= 0) {
        normalized.action = null;
        normalized.data = null;
        normalized.text =
          "I can add this expense, but I need a valid amount. Example: I spent 350 on lunch.";
        return normalized;
      }

      normalized.data = merged;
    }

    return normalized;
  }

  extractLikelyAmountFromText(text = "") {
    if (!text || typeof text !== "string") return 0;

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const candidates = [];
    const amountRegex =
      /(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{2,3})+|[0-9]{1,8})(?:\.[0-9]{1,2})?/gi;

    for (const line of lines) {
      let match;
      while ((match = amountRegex.exec(line)) !== null) {
        const parsed = this.normalizeAmount(match[0], 0);
        if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100000000)
          continue;

        const lineLower = line.toLowerCase();
        const hasPriorityWord =
          /(grand total|total|amount paid|paid|debited|credited|transaction|sent|received)/i.test(
            lineLower,
          );
        const hasCurrency = /(₹|rs\.?|inr)/i.test(match[0]);
        const looksLikeYear = parsed >= 1900 && parsed <= 2100;

        let score = 0;
        if (hasPriorityWord) score += 3;
        if (hasCurrency) score += 2;
        if (parsed >= 100) score += 1;
        if (looksLikeYear && !hasCurrency && !hasPriorityWord) score -= 3;

        candidates.push({ value: parsed, score });
      }
    }

    if (candidates.length === 0) return 0;

    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.value - a.value;
    });

    return Number(candidates[0].value.toFixed(2));
  }

  extractDateFromText(text = "") {
    if (!text || typeof text !== "string") return this.getTodayDateString();

    const datePatterns = [
      /\b(\d{4}-\d{2}-\d{2})\b/,
      /\b(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})\b/,
      /\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{2,4})\b/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        return this.normalizeDate(match[1], this.getTodayDateString());
      }
    }

    return this.getTodayDateString();
  }

  extractMerchantFromText(text = "") {
    if (!text || typeof text !== "string") return "Unknown";

    const patterns = [
      /paid\s+to\s+([A-Za-z][A-Za-z .&'\-]{2,50})/i,
      /to\s+([A-Za-z][A-Za-z .&'\-]{2,50})/i,
      /merchant\s*[:\-]\s*([A-Za-z][A-Za-z .&'\-]{2,50})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        return match[1].trim().replace(/\s{2,}/g, " ");
      }
    }

    return "Unknown";
  }

  async performLocalOcrFallback(imageBuffer) {
    const fallbackDate = this.getTodayDateString();

    try {
      let recognize;
      try {
        ({ recognize } = require("tesseract.js"));
      } catch (importError) {
        return {
          title: "Receipt Expense",
          amount: 0,
          category: "Other",
          date: fallbackDate,
          merchant: "Unknown",
          confidence: 0.2,
        };
      }

      const result = await recognize(imageBuffer, "eng", {
        logger: () => {},
      });

      const ocrText = result?.data?.text || "";
      const amount = this.extractLikelyAmountFromText(ocrText);
      const merchant = this.extractMerchantFromText(ocrText);
      const date = this.extractDateFromText(ocrText);
      const category = this.normalizeCategory(
        `${merchant} ${ocrText.slice(0, 300)}`,
        "Other",
      );

      return {
        title:
          merchant !== "Unknown" ? `Payment to ${merchant}` : "Receipt Expense",
        amount,
        category,
        date,
        merchant,
        confidence: amount > 0 ? 0.55 : 0.25,
      };
    } catch (error) {
      console.error("Local OCR fallback error:", error);
      return {
        title: "Receipt Expense",
        amount: 0,
        category: "Other",
        date: fallbackDate,
        merchant: "Unknown",
        confidence: 0.2,
      };
    }
  }

  async extractExpenseFromImage(imageBuffer) {
    return this.retryWithBackoff(async () => {
      if (!this.model) {
        throw new Error("Gemini model not initialized");
      }

      const today = this.getTodayDateString();

      const prompt = `
        Analyze this receipt, invoice, bill, or payment screenshot and extract the main expense details.
        Return ONLY a valid JSON object with these exact fields:
        {
          "title": "short expense description",
          "amount": 100,
          "category": "Food",
          "date": "2024-01-03",
          "merchant": "store name",
          "confidence": 0.8
        }

        Rules:
        - amount must be the FINAL payable amount (Grand Total/Total/Paid), not line-item subtotal
        - amount must be a number (not string), no currency symbol
        - category must be one of: Food, Travel, Rent, Entertainment, Healthcare, Shopping, Utilities, Other
        - date format: YYYY-MM-DD
        - title should be concise and user-friendly (e.g. "Lunch", "Grocery Purchase", "Cab Ride")
        - merchant should be business/shop/service name only
        - if uncertain, choose the most likely value and reduce confidence
        - confidence: 0.1 to 1.0
        - if a field is missing, use:
          - title: "Receipt Expense"
          - amount: 0
          - category: "Other"
          - date: "${today}"
          - merchant: "Unknown"
      `;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: "image/jpeg",
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log("Gemini AI Response:", text);

      const expenseData = this.parseFirstJsonObject(text);
      if (!expenseData) {
        return {
          title: "Receipt Expense",
          amount: 0,
          category: "Other",
          date: today,
          merchant: "Unknown",
          confidence: 0.3,
        };
      }

      const title = String(expenseData.title || "").trim() || "Receipt Expense";
      const merchant = String(expenseData.merchant || "").trim() || "Unknown";
      const amount =
        this.normalizeAmount(expenseData.amount, 0) ||
        this.extractLikelyAmountFromText(text);

      // Validate and set defaults
      return {
        title,
        amount,
        category: this.normalizeCategory(expenseData.category, "Other"),
        date: this.normalizeDate(expenseData.date, today),
        merchant,
        confidence: this.normalizeConfidence(
          expenseData.confidence,
          amount > 0 ? 0.6 : 0.5,
        ),
      };
    }).catch(async (error) => {
      console.error("Gemini AI Error after retries:", error);

      // If Gemini fails (key/rate-limit/network), fallback to local OCR extraction.
      return this.performLocalOcrFallback(imageBuffer);
    });
  }

  async categorizeExpense(title, merchant) {
    try {
      if (!this.model) return "Other";

      const prompt = `Categorize this expense: "${title}" from "${merchant}". Return only one word from: Food, Travel, Rent, Entertainment, Healthcare, Shopping, Utilities, Other`;

      const result = await this.model.generateContent(prompt);
      const category = (await result.response.text()).trim();

      const validCategories = [
        "Food",
        "Travel",
        "Rent",
        "Entertainment",
        "Healthcare",
        "Shopping",
        "Utilities",
        "Other",
      ];
      return validCategories.includes(category) ? category : "Other";
    } catch (error) {
      return "Other";
    }
  }

  async generateBudgetAdvice(expenses, budgets) {
    try {
      if (!this.model) return "Unable to generate advice";

      const prompt = `Based on expenses: ${JSON.stringify(expenses.slice(0, 10))} and budgets: ${JSON.stringify(budgets)}, give 3 short financial tips in JSON format: {"tips": ["tip1", "tip2", "tip3"]}`;

      const result = await this.model.generateContent(prompt);
      const text = await result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const advice = JSON.parse(jsonMatch[0]);
        return (
          advice.tips || [
            "Track your spending regularly",
            "Set realistic budgets",
            "Review expenses monthly",
          ]
        );
      }
      return [
        "Track your spending regularly",
        "Set realistic budgets",
        "Review expenses monthly",
      ];
    } catch (error) {
      return [
        "Track your spending regularly",
        "Set realistic budgets",
        "Review expenses monthly",
      ];
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
          confidence: Number(data.confidence) || 0.5,
        };
      }
      return { prediction: 0, confidence: 0 };
    } catch (error) {
      return { prediction: 0, confidence: 0 };
    }
  }

  async generateExpenseNote(title, amount, category) {
    try {
      if (!this.model) return "";

      const prompt = `Generate a brief, helpful note for this expense: "${title}" - ₹${amount} in ${category} category. Return only the note text, max 50 words.`;

      const result = await this.model.generateContent(prompt);
      const note = (await result.response.text()).trim();

      return note || `${category} expense of ₹${amount}`;
    } catch (error) {
      return `${category} expense of ₹${amount}`;
    }
  }

  async parseVoiceExpense(voiceText) {
    const fallbackDate = this.getTodayDateString();
    const localParsed = this.parseExpenseFromMessage(voiceText);

    try {
      if (!voiceText || typeof voiceText !== "string" || !voiceText.trim()) {
        return null;
      }

      if (!this.model) {
        if (!localParsed) return null;
        return {
          ...localParsed,
          confidence: 0.6,
        };
      }

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
      const parsed = this.parseFirstJsonObject(text);

      if (parsed) {
        const normalized = {
          title: String(
            parsed.title || localParsed?.title || "Voice Expense",
          ).trim(),
          amount: this.normalizeAmount(parsed.amount, localParsed?.amount || 0),
          category: this.normalizeCategory(
            parsed.category || localParsed?.category || "Other",
            "Other",
          ),
          date: this.normalizeDate(
            parsed.date || localParsed?.date || fallbackDate,
            fallbackDate,
          ),
          confidence: this.normalizeConfidence(
            parsed.confidence,
            localParsed ? 0.7 : 0.5,
          ),
        };

        if (normalized.amount > 0) {
          return normalized;
        }
      }

      if (localParsed) {
        return {
          ...localParsed,
          confidence: 0.6,
        };
      }

      return null;
    } catch (error) {
      console.error("Voice parsing error:", error);

      if (localParsed) {
        return {
          ...localParsed,
          confidence: 0.55,
        };
      }

      return null;
    }
  }

  async parseNaturalLanguageQuery(query) {
    const fallbackFilters = this.parseLocalNaturalLanguageQuery(query);

    try {
      if (!this.model) return fallbackFilters;

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
      const parsed = this.parseFirstJsonObject(text);

      if (parsed) {
        const normalized = this.normalizeQueryFilters(parsed);
        if (Object.keys(normalized).length > 0) {
          return {
            ...fallbackFilters,
            ...normalized,
          };
        }
      }

      return fallbackFilters;
    } catch (error) {
      console.error("Natural language parsing error:", error);
      return fallbackFilters;
    }
  }

  normalizeQueryFilters(filters = {}) {
    const normalized = {};

    if (filters.category) {
      normalized.category = this.normalizeCategory(filters.category, null);
      if (!normalized.category) {
        delete normalized.category;
      }
    }

    if (filters.startDate) {
      normalized.startDate = this.normalizeDate(filters.startDate, null);
    }
    if (filters.endDate) {
      normalized.endDate = this.normalizeDate(filters.endDate, null);
    }

    if (filters.minAmount !== undefined) {
      const minAmount = this.normalizeAmount(filters.minAmount, NaN);
      if (Number.isFinite(minAmount) && minAmount > 0)
        normalized.minAmount = minAmount;
    }
    if (filters.maxAmount !== undefined) {
      const maxAmount = this.normalizeAmount(filters.maxAmount, NaN);
      if (Number.isFinite(maxAmount) && maxAmount > 0)
        normalized.maxAmount = maxAmount;
    }

    if (filters.search) {
      const search = String(filters.search).trim();
      if (search) normalized.search = search;
    }

    if (
      filters.sortBy &&
      ["date", "amount", "category"].includes(
        String(filters.sortBy).toLowerCase(),
      )
    ) {
      normalized.sortBy = String(filters.sortBy).toLowerCase();
    }

    if (
      filters.sortOrder &&
      ["asc", "desc"].includes(String(filters.sortOrder).toLowerCase())
    ) {
      normalized.sortOrder = String(filters.sortOrder).toLowerCase();
    }

    Object.keys(normalized).forEach((key) => {
      if (
        normalized[key] === null ||
        normalized[key] === "null" ||
        normalized[key] === ""
      ) {
        delete normalized[key];
      }
    });

    return normalized;
  }

  parseLocalNaturalLanguageQuery(query = "") {
    if (!query || typeof query !== "string") return {};

    const text = query.trim();
    if (!text) return {};

    const lower = text.toLowerCase();
    const filters = {};
    const today = new Date();

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    // Category detection
    const detectedCategory = this.normalizeCategory(text, null);
    if (detectedCategory) {
      filters.category = detectedCategory;
    }

    // Relative date ranges
    if (/\b(today)\b/i.test(lower)) {
      filters.startDate = this.normalizeDate(
        startOfToday,
        this.getTodayDateString(),
      );
      filters.endDate = this.normalizeDate(
        endOfToday,
        this.getTodayDateString(),
      );
    } else if (/\b(yesterday)\b/i.test(lower)) {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      filters.startDate = this.normalizeDate(y, this.getTodayDateString());
      filters.endDate = this.normalizeDate(y, this.getTodayDateString());
    } else if (/\bthis week\b/i.test(lower)) {
      const start = new Date(today);
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(today.getDate() - diff);
      filters.startDate = this.normalizeDate(start, this.getTodayDateString());
      filters.endDate = this.getTodayDateString();
    } else if (/\blast week\b/i.test(lower)) {
      const end = new Date(today);
      const day = end.getDay();
      const diff = day === 0 ? 6 : day - 1;
      end.setDate(today.getDate() - diff - 1);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      filters.startDate = this.normalizeDate(start, this.getTodayDateString());
      filters.endDate = this.normalizeDate(end, this.getTodayDateString());
    } else if (/\bthis month\b/i.test(lower)) {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      filters.startDate = this.normalizeDate(start, this.getTodayDateString());
      filters.endDate = this.getTodayDateString();
    } else if (/\blast month\b/i.test(lower)) {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      filters.startDate = this.normalizeDate(start, this.getTodayDateString());
      filters.endDate = this.normalizeDate(end, this.getTodayDateString());
    }

    // Explicit date range: from X to Y / between X and Y
    const rangeMatch = text.match(
      /(?:from|between)\s+([^,]+?)\s+(?:to|and)\s+([^,]+)/i,
    );
    if (rangeMatch?.[1] && rangeMatch?.[2]) {
      filters.startDate = this.normalizeDate(
        rangeMatch[1].trim(),
        filters.startDate || this.getTodayDateString(),
      );
      filters.endDate = this.normalizeDate(
        rangeMatch[2].trim(),
        filters.endDate || this.getTodayDateString(),
      );
    }

    // Amount extraction
    const betweenAmount = lower.match(
      /\bbetween\s+([0-9,]+(?:\.[0-9]{1,2})?)\s+(?:and|to)\s+([0-9,]+(?:\.[0-9]{1,2})?)\b/i,
    );
    if (betweenAmount) {
      filters.minAmount = this.normalizeAmount(betweenAmount[1], 0);
      filters.maxAmount = this.normalizeAmount(betweenAmount[2], 0);
    } else {
      const minMatch = lower.match(
        /(?:above|over|more than|greater than|at least)\s+([0-9,]+(?:\.[0-9]{1,2})?)/i,
      );
      const maxMatch = lower.match(
        /(?:below|under|less than|at most|maximum|max)\s+([0-9,]+(?:\.[0-9]{1,2})?)/i,
      );

      if (minMatch) filters.minAmount = this.normalizeAmount(minMatch[1], 0);
      if (maxMatch) filters.maxAmount = this.normalizeAmount(maxMatch[1], 0);
    }

    // Sort preferences
    if (/\b(sort|sorted|order|ordered)\b/i.test(lower)) {
      if (/\bamount\b/i.test(lower)) filters.sortBy = "amount";
      else if (/\bcategory\b/i.test(lower)) filters.sortBy = "category";
      else filters.sortBy = "date";

      if (/\b(asc|ascending|lowest|smallest|oldest)\b/i.test(lower)) {
        filters.sortOrder = "asc";
      } else {
        filters.sortOrder = "desc";
      }
    }

    // Lightweight keyword search fallback
    const hasFilterIntent =
      /\b(expense|expenses|show|find|list|get|spent|spending)\b/i.test(lower);
    const searchable = text
      .replace(
        /\b(show|find|list|get|my|me|expenses?|spent|spending|this|last|month|week|today|yesterday|over|under|above|below|between|and|from|to|sorted|sort|by|amount|date|category)\b/gi,
        " ",
      )
      .replace(/\s+/g, " ")
      .trim();

    if (!filters.search && searchable.length >= 3 && hasFilterIntent) {
      filters.search = searchable;
    }

    return this.normalizeQueryFilters(filters);
  }
  async chatWithFinancialAdvisor(message, context = {}) {
    try {
      if (!this.model) {
        return this.createLocalChatFallback(message, context, "offline");
      }

      const {
        recentExpenses = [],
        totalIncome = 0,
        netBalance = 0,
        budgets = [],
      } = context;

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
      const parsed = this.parseFirstJsonObject(text);

      if (parsed) {
        return this.normalizeChatResponse(parsed, message);
      }

      return this.createLocalChatFallback(message, context, "offline");
    } catch (error) {
      console.error("Chat error:", error);
      if (error.status === 429) {
        return this.createLocalChatFallback(message, context, "quota");
      }
      return this.createLocalChatFallback(message, context, "offline");
    }
  }

  // NEW: Smart expense auto-complete suggestions
  async suggestExpenseCompletion(partialInput, userExpenses = []) {
    try {
      if (!this.model) return [];

      // Find similar expenses from history
      const recentExpenses = userExpenses.slice(0, 20).map((e) => ({
        title: e.title,
        amount: e.amount,
        category: e.category,
        merchant: e.merchant || "Unknown",
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
      console.error("Suggestion error:", error);
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
      console.error("Budget generation error:", error);
      return {};
    }
  }

  // NEW: Predict bill amount from history
  async predictBillAmount(billHistory, billTitle) {
    try {
      if (!this.model || !billHistory || billHistory.length === 0) {
        return { prediction: 0, confidence: 0, trend: "stable" };
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
          trend: data.trend || "stable",
          reasoning: data.reasoning || "",
        };
      }
      return { prediction: 0, confidence: 0, trend: "stable" };
    } catch (error) {
      console.error("Bill prediction error:", error);
      return { prediction: 0, confidence: 0, trend: "stable" };
    }
  }

  // NEW: Smart goal contribution suggestions
  async suggestGoalContribution(goal, userIncome, userExpenses) {
    try {
      if (!this.model)
        return { amount: 0, frequency: "monthly", reasoning: "" };

      const avgMonthlyExpense =
        userExpenses.reduce((sum, e) => sum + e.amount, 0) / 3;
      const disposableIncome = userIncome - avgMonthlyExpense;

      const prompt = `
        Goal: "${goal.title}"
        Target: ₹${goal.targetAmount}
        Current: ₹${goal.currentAmount}
        Remaining: ₹${goal.remainingAmount}
        Target Date: ${goal.targetDate || "Not set"}
        
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
          frequency: data.frequency || "monthly",
          reasoning: data.reasoning || "",
        };
      }
      return { amount: 0, frequency: "monthly", reasoning: "" };
    } catch (error) {
      console.error("Goal suggestion error:", error);
      return { amount: 0, frequency: "monthly", reasoning: "" };
    }
  }

  // NEW: Calculate overall financial health score
  async calculateFinancialHealth(context) {
    try {
      if (!this.model) return { score: 70, status: "Good", insights: [] };

      const {
        totalIncome,
        totalExpenses,
        savingsRate,
        budgetAdherence,
        goalsProgress,
      } = context;

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
      return {
        score: 70,
        status: "Good",
        insights: ["Keep tracking your expenses!"],
      };
    } catch (error) {
      console.error("Health calculation error:", error);
      return {
        score: 70,
        status: "Good",
        insights: ["Service temporarily unavailable"],
      };
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
      console.error("Anomaly detection error:", error);
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
      expenses.forEach((expense) => {
        categorySpending[expense.category] =
          (categorySpending[expense.category] || 0) + expense.amount;
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
          timestamp: new Date().toISOString(),
        }));

        return data;
      }

      return { alerts: [], predictions: {} };
    } catch (error) {
      console.error("Predictive alerts generation error:", error);
      return { alerts: [], predictions: {} };
    }
  }

  // NEW: Advanced receipt scanning with multi-language support
  async extractAdvancedReceiptData(imageBuffer) {
    const startTime = Date.now();
    const today = this.getTodayDateString();

    return this.retryWithBackoff(async () => {
      if (!this.model) {
        throw new Error("Gemini model not initialized");
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
          data: imageBuffer.toString("base64"),
          mimeType: "image/jpeg",
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      const extractedData = this.parseFirstJsonObject(text);
      if (!extractedData) {
        return {
          data: {
            title: "Receipt Item",
            amount: 0,
            category: "Other",
            date: today,
            merchant: "Unknown",
            items: [],
            paymentMethod: "Unknown",
            taxAmount: 0,
            discountAmount: 0,
          },
          confidence: 0.3,
          detectedLanguage: "Unknown",
          processingTime: Date.now() - startTime,
        };
      }

      const normalizedData = extractedData.data || extractedData;
      const safeData = {
        title: String(normalizedData.title || "").trim() || "Receipt Item",
        amount: this.normalizeAmount(normalizedData.amount, 0),
        category: this.normalizeCategory(normalizedData.category, "Other"),
        date: this.normalizeDate(normalizedData.date, today),
        merchant: String(normalizedData.merchant || "").trim() || "Unknown",
        items: Array.isArray(normalizedData.items) ? normalizedData.items : [],
        paymentMethod:
          String(normalizedData.paymentMethod || "").trim() || "Unknown",
        taxAmount: this.normalizeAmount(normalizedData.taxAmount, 0),
        discountAmount: this.normalizeAmount(normalizedData.discountAmount, 0),
      };

      const normalizedResult = extractedData.data
        ? { ...extractedData, data: safeData }
        : {
            data: safeData,
            confidence: extractedData.confidence,
            detectedLanguage: extractedData.detectedLanguage,
          };

      normalizedResult.confidence = this.normalizeConfidence(
        normalizedResult.confidence,
        0.5,
      );
      normalizedResult.detectedLanguage =
        normalizedResult.detectedLanguage || "Unknown";
      normalizedResult.processingTime = Date.now() - startTime;

      return normalizedResult;
    }).catch((error) => {
      console.error("Advanced receipt scan error:", error);
      return {
        data: {
          title: "Receipt Processing Failed",
          amount: 0,
          category: "Other",
          date: today,
          merchant: "Unknown",
          items: [],
          paymentMethod: "Unknown",
          taxAmount: 0,
          discountAmount: 0,
        },
        confidence: 0.1,
        detectedLanguage: "Unknown",
        processingTime: Date.now() - startTime,
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
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000),
        );
      }
    }
  }
}

module.exports = new GeminiService();
