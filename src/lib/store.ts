// Client-side state + localStorage for HisabGuru
export type TxType = "expense" | "income" | "transfer";
export type Source = "manual" | "sms" | "mail";
export type Account = "Cash" | "bKash" | "Nagad" | "Bank" | "Rocket";

// Define category icons mapping
export const CATEGORY_ICONS: Record<string, string> = {
  // Default expense categories
  "Food & Dining": "🍽️",
  "Transport": "🚗",
  "Education": "📚",
  "Entertainment": "🎮",
  "Shopping": "🛍️",
  "Health": "🏥",
  "Bills & Utilities": "💡",
  "Groceries": "🛒",
  "Personal Care": "💇",
  "Other": "📦",
  
  // Default income categories
  "Allowance": "💰",
  "Pocket Money": "💵",
  "Salary": "💼",
  "Freelance": "💻",
  "Gift": "🎁",
  
  // Default transfer categories
  "Savings": "🐷",
  "Investment": "📈",
  "Loan": "📝",
};

export const CATEGORIES = {
  expense: ["Food & Dining", "Transport", "Education", "Entertainment", "Shopping", "Health", "Bills & Utilities", "Groceries", "Personal Care", "Other"],
  income: ["Allowance", "Pocket Money", "Salary", "Freelance", "Gift", "Other"],
  transfer: ["Savings", "Investment", "Loan", "Other"],
};

export type CustomCategories = {
  expense: string[];
  income: string[];
  transfer: string[];
};

// Category icon management
export type CategoryIcons = Record<string, string>;

// Get category icons from localStorage
export function getCategoryIcons(): CategoryIcons {
  if (typeof window === "undefined") return {};
  
  const icons = localStorage.getItem("hisabguru_category_icons");
  return icons ? JSON.parse(icons) : {};
}

// Save category icon
export function saveCategoryIcon(categoryName: string, icon: string) {
  if (typeof window === "undefined") return;
  
  const icons = getCategoryIcons();
  icons[categoryName] = icon;
  localStorage.setItem("hisabguru_category_icons", JSON.stringify(icons));
}

// Get icon for a category
export function getCategoryIcon(categoryName: string): string {
  const icons = getCategoryIcons();
  return icons[categoryName] || CATEGORY_ICONS[categoryName] || "🏷️"; // Default icon
}

// Get all categories (default + custom)
export function getAllCategories(): typeof CATEGORIES & { custom: CustomCategories } {
  if (typeof window === "undefined") return { ...CATEGORIES, custom: { expense: [], income: [], transfer: [] } };
  
  const customCats = localStorage.getItem("hisabguru_custom_categories");
  if (!customCats) return { ...CATEGORIES, custom: { expense: [], income: [], transfer: [] } };
  
  const custom: CustomCategories = JSON.parse(customCats);
  return {
    expense: [...CATEGORIES.expense, ...custom.expense],
    income: [...CATEGORIES.income, ...custom.income],
    transfer: [...CATEGORIES.transfer, ...custom.transfer],
    custom
  };
}

// Add a custom category
export function addCustomCategory(type: TxType, categoryName: string) {
  if (typeof window === "undefined") return;
  
  const trimmedName = categoryName.trim();
  if (!trimmedName) return;
  
  const allCats = getAllCategories();
  
  // Check if category already exists (case-insensitive)
  const existsInDefault = CATEGORIES[type].some(cat => cat.toLowerCase() === trimmedName.toLowerCase());
  const existsInCustom = allCats.custom[type].some(cat => cat.toLowerCase() === trimmedName.toLowerCase());
  
  if (existsInDefault || existsInCustom) {
    return false; // Already exists
  }
  
  // Add to custom categories
  const custom = allCats.custom;
  custom[type].push(trimmedName);
  
  // Set default icon for new custom category
  saveCategoryIcon(trimmedName, "🏷️");
  
  localStorage.setItem("hisabguru_custom_categories", JSON.stringify(custom));
  return true;
}

// Delete a custom category
export function deleteCustomCategory(type: TxType, categoryName: string) {
  if (typeof window === "undefined") return;
  
  const allCats = getAllCategories();
  const custom = allCats.custom;
  
  custom[type] = custom[type].filter(cat => cat !== categoryName);
  
  // Remove icon for deleted category
  const icons = getCategoryIcons();
  delete icons[categoryName];
  localStorage.setItem("hisabguru_category_icons", JSON.stringify(icons));
  
  localStorage.setItem("hisabguru_custom_categories", JSON.stringify(custom));
}

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  currency: "BDT";
  category: string;
  note?: string;
  source: Source;
  date: string;
  account: Account;
  location?: { lat: number; lng: number } | null;
};

export type Notification = {
  id: string;
  message: string;
  timestamp: string;
  tags: string[];
  type?: "phishing" | "promo" | "normal" | "alert";
  confidence?: number;
  details?: string;
};

export type Memory = {
  id: string;
  text: string;
  timestamp: string;
};

export type State = {
  transactions: Transaction[];
  notifications: Notification[];
  memories: Memory[];
};

export type AccountBalance = {
  id: string;
  name: string;
  balance: number;
  type: "cash" | "mobile" | "bank" | "custom";
  icon: string;
};

const DEFAULT_ACCOUNTS = [
  { id: "cash", name: "Cash", type: "cash" as const, icon: "💵" },
  { id: "bkash", name: "bKash", type: "mobile" as const, icon: "📱" },
  { id: "nagad", name: "Nagad", type: "mobile" as const, icon: "📲" },
  { id: "bank", name: "Bank", type: "bank" as const, icon: "🏦" },
  { id: "rocket", name: "Rocket", type: "mobile" as const, icon: "🚀" },
];

function getState(): State {
  if (typeof window === "undefined") return { transactions: [], notifications: [], memories: [] };
  const raw = localStorage.getItem("hisabguru_state");
  if (!raw) return { transactions: [], notifications: [], memories: [] };
  return JSON.parse(raw);
}

function setState(s: State) {
  if (typeof window === "undefined") return;
  localStorage.setItem("hisabguru_state", JSON.stringify(s));
}

// Account Balance Management
export function getAccounts(): AccountBalance[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("hisabguru_accounts");
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

export function initializeAccounts() {
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem("hisabguru_accounts");
  if (!stored) {
    const accounts: AccountBalance[] = DEFAULT_ACCOUNTS.map(acc => ({
      ...acc,
      balance: 0
    }));
    localStorage.setItem("hisabguru_accounts", JSON.stringify(accounts));
  }
}

export function updateAccountBalance(accountName: Account, txType: TxType, amount: number) {
  if (typeof window === "undefined") return;
  
  const accounts = getAccounts();
  const accountMap: Record<Account, string> = {
    "Cash": "cash",
    "bKash": "bkash",
    "Nagad": "nagad",
    "Bank": "bank",
    "Rocket": "rocket"
  };
  
  const accountId = accountMap[accountName];
  const accountIndex = accounts.findIndex(acc => acc.id === accountId);
  
  if (accountIndex !== -1) {
    if (txType === "income") {
      accounts[accountIndex].balance += amount;
    } else if (txType === "expense") {
      accounts[accountIndex].balance -= amount;
    }
    // For transfer, we don't change balance (it's a movement between accounts)
    localStorage.setItem("hisabguru_accounts", JSON.stringify(accounts));
  }
}

export function recalculateAllAccountBalances() {
  if (typeof window === "undefined") return;
  
  // Reset all account balances to 0
  const accounts = getAccounts();
  accounts.forEach(acc => acc.balance = 0);
  
  // Recalculate from all transactions
  const state = getState();
  state.transactions.forEach(tx => {
    const accountMap: Record<Account, string> = {
      "Cash": "cash",
      "bKash": "bkash",
      "Nagad": "nagad",
      "Bank": "bank",
      "Rocket": "rocket"
    };
    
    const accountId = accountMap[tx.account];
    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
    
    if (accountIndex !== -1) {
      if (tx.type === "income") {
        accounts[accountIndex].balance += tx.amount;
      } else if (tx.type === "expense") {
        accounts[accountIndex].balance -= tx.amount;
      }
    }
  });
  
  localStorage.setItem("hisabguru_accounts", JSON.stringify(accounts));
}

export function loadState(): State {
  const s = getState();
  
  // Force data refresh if version mismatch
  if (typeof window !== 'undefined') {
    const dataVersion = localStorage.getItem('hisabguru_data_version');
    if (dataVersion !== 'v2.0') {
      localStorage.removeItem('hisabguru_state');
      localStorage.removeItem('hisabguru_accounts');
      localStorage.setItem('hisabguru_data_version', 'v2.0');
      initializeAccounts();
      seedSampleData();
      recalculateAllAccountBalances();
      return getState();
    }
  }
  
  // Initialize accounts if not exists
  if (typeof window !== 'undefined') {
    const accounts = getAccounts();
    if (accounts.length === 0) {
      initializeAccounts();
      recalculateAllAccountBalances();
    }
  }
  
  if (s.transactions.length === 0) {
    seedSampleData();
    recalculateAllAccountBalances();
    return getState();
  }
  if (s.notifications.length === 0) {
    seedSecurityNotifications();
    return getState();
  }
  return s;
}

export function addTransaction(tx: Omit<Transaction, "id">) {
  const s = getState();
  s.transactions.push({ ...tx, id: Math.random().toString(36).substr(2, 9) });
  s.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  setState(s);
  
  // Update account balance
  updateAccountBalance(tx.account, tx.type, tx.amount);
}

export function deleteTransaction(id: string) {
  const s = getState();
  const transaction = s.transactions.find(t => t.id === id);
  if (transaction) {
    // Reverse the account balance change
    const reverseType = transaction.type === "income" ? "expense" : transaction.type === "expense" ? "income" : "transfer";
    updateAccountBalance(transaction.account, reverseType, transaction.amount);
  }
  s.transactions = s.transactions.filter(t => t.id !== id);
  setState(s);
}

export function updateTransaction(id: string, updates: Partial<Omit<Transaction, "id">>) {
  const s = getState();
  const index = s.transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    s.transactions[index] = { ...s.transactions[index], ...updates };
    s.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  setState(s);
}

export function addNotification(notif: Omit<Notification, "id" | "timestamp">) {
  const s = getState();
  s.notifications.push({ ...notif, id: Math.random().toString(36), timestamp: new Date().toISOString() });
  setState(s);
}

export function addMemory(text: string) {
  const s = getState();
  s.memories.push({ id: Math.random().toString(36), text, timestamp: new Date().toISOString() });
  setState(s);
}

export function updateMemory(id: string, text: string) {
  const s = getState();
  const index = s.memories.findIndex(m => m.id === id);
  if (index !== -1) {
    s.memories[index] = { ...s.memories[index], text, timestamp: new Date().toISOString() };
  }
  setState(s);
}

export function deleteMemory(id: string) {
  const s = getState();
  s.memories = s.memories.filter(m => m.id !== id);
  setState(s);
}

export function getTransactionsByDateRange(startDate: Date, endDate: Date) {
  const txs = loadState().transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= startDate && d <= endDate;
  });
  
  // Group by date
  const grouped = new Map<string, Transaction[]>();
  txs.forEach((tx) => {
    const dateKey = new Date(tx.date).toISOString().split('T')[0];
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(tx);
  });
  
  return Array.from(grouped.entries()).sort((a, b) => b[0].localeCompare(a[0]));
}

export function getMonthRange(monthOffset: number): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + monthOffset;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return { start, end };
}

export function getSummary(monthOffset: number) {
  const { start, end } = getMonthRange(monthOffset);
  const txs = loadState().transactions.filter((t) => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  });
  const income = txs.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, balance: income - expense };
}

function seedSampleData() {
  const s: State = { transactions: [], notifications: [], memories: [] };
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  // === SEED MEMORIES FOR CONTEXT ===
  s.memories.push(
    {
      id: Math.random().toString(36),
      text: "User is a university student studying Computer Science, lives with family in Dhaka",
      timestamp: new Date(currentYear, currentMonth - 3, 1).toISOString()
    },
    {
      id: Math.random().toString(36),
      text: "Monthly budget goal: Save at least ৳1,500 each month for a new laptop",
      timestamp: new Date(currentYear, currentMonth - 2, 15).toISOString()
    },
    {
      id: Math.random().toString(36),
      text: "Prefers using bKash for online payments and food delivery, Cash for daily transport",
      timestamp: new Date(currentYear, currentMonth - 2, 20).toISOString()
    },
    {
      id: Math.random().toString(36),
      text: "Birthday in December - planning to celebrate with friends, budgeting ৳2,000 for the event",
      timestamp: new Date(currentYear, currentMonth - 1, 10).toISOString()
    },
    {
      id: Math.random().toString(36),
      text: "Started a part-time freelance project - expecting ৳8,000 income this month",
      timestamp: new Date(currentYear, currentMonth, 1).toISOString()
    }
  );

  // === MONTH -2: Complete financial picture ===
  const month2 = getMonthRange(-2);
  const m2Start = new Date(month2.start);
  
  // Income - Month -2
  s.transactions.push(
    {
      id: Math.random().toString(36),
      type: "income",
      amount: 8000,
      currency: "BDT",
      category: "Allowance",
      note: "Monthly allowance from family",
      source: "manual",
      date: new Date(m2Start.getFullYear(), m2Start.getMonth(), 1).toISOString(),
      account: "Cash",
      location: null,
    },
    {
      id: Math.random().toString(36),
      type: "income",
      amount: 5000,
      currency: "BDT",
      category: "Freelance",
      note: "Web design project payment",
      source: "manual",
      date: new Date(m2Start.getFullYear(), m2Start.getMonth(), 5).toISOString(),
      account: "bKash",
      location: null,
    },
    {
      id: Math.random().toString(36),
      type: "income",
      amount: 1500,
      currency: "BDT",
      category: "Pocket Money",
      note: "Weekly pocket money",
      source: "manual",
      date: new Date(m2Start.getFullYear(), m2Start.getMonth(), 8).toISOString(),
      account: "Cash",
      location: null,
    },
    {
      id: Math.random().toString(36),
      type: "income",
      amount: 1500,
      currency: "BDT",
      category: "Pocket Money",
      note: "Weekly pocket money",
      source: "manual",
      date: new Date(m2Start.getFullYear(), m2Start.getMonth(), 15).toISOString(),
      account: "Cash",
      location: null,
    },
    {
      id: Math.random().toString(36),
      type: "income",
      amount: 1500,
      currency: "BDT",
      category: "Pocket Money",
      note: "Weekly pocket money",
      source: "manual",
      date: new Date(m2Start.getFullYear(), m2Start.getMonth(), 22).toISOString(),
      account: "Cash",
      location: null,
    }
  );

  // Expenses - Month -2 (Diverse categories)
  const m2Expenses = [
    { day: 2, amount: 250, category: "Food & Dining", note: "Breakfast at Star Kabab", account: "Cash", source: "manual" },
    { day: 2, amount: 180, category: "Transport", note: "Pathao bike ride to campus", account: "bKash", source: "sms" },
    { day: 3, amount: 450, category: "Food & Dining", note: "Lunch with classmates", account: "bKash", source: "sms" },
    { day: 4, amount: 1200, category: "Education", note: "Programming course subscription", account: "bKash", source: "mail" },
    { day: 5, amount: 60, category: "Transport", note: "Bus fare", account: "Cash", source: "manual" },
    { day: 6, amount: 350, category: "Food & Dining", note: "Foodpanda dinner order", account: "Nagad", source: "sms" },
    { day: 7, amount: 800, category: "Education", note: "Textbooks from Nilkhet", account: "Cash", source: "manual" },
    { day: 8, amount: 150, category: "Bills & Utilities", note: "Mobile recharge GP", account: "bKash", source: "sms" },
    { day: 9, amount: 200, category: "Food & Dining", note: "Coffee at Gloria Jean's", account: "Cash", source: "manual" },
    { day: 10, amount: 550, category: "Shopping", note: "Daraz order - headphones", account: "bKash", source: "mail" },
    { day: 11, amount: 80, category: "Transport", note: "Rickshaw fare", account: "Cash", source: "manual" },
    { day: 12, amount: 320, category: "Food & Dining", note: "Team lunch at Kacchi Bhai", account: "bKash", source: "sms" },
    { day: 13, amount: 250, category: "Groceries", note: "Snacks and drinks", account: "Cash", source: "manual" },
    { day: 14, amount: 600, category: "Entertainment", note: "Movie at Star Cineplex", account: "Nagad", source: "sms" },
    { day: 15, amount: 200, category: "Transport", note: "Uber to friend's place", account: "bKash", source: "sms" },
    { day: 16, amount: 120, category: "Personal Care", note: "Haircut at salon", account: "Cash", source: "manual" },
    { day: 17, amount: 400, category: "Food & Dining", note: "Dinner at Chillox", account: "Nagad", source: "sms" },
    { day: 18, amount: 150, category: "Health", note: "Pharmacy - vitamins", account: "Cash", source: "manual" },
    { day: 19, amount: 500, category: "Bills & Utilities", note: "Internet bill payment", account: "bKash", source: "sms" },
    { day: 20, amount: 280, category: "Food & Dining", note: "Pizza from Domino's", account: "bKash", source: "sms" },
    { day: 22, amount: 750, category: "Shopping", note: "New shirt from Aarong", account: "bKash", source: "sms" },
    { day: 24, amount: 95, category: "Transport", note: "Bus fare", account: "Cash", source: "manual" },
    { day: 25, amount: 380, category: "Food & Dining", note: "Friends' birthday treat", account: "Cash", source: "manual" },
    { day: 27, amount: 200, category: "Bills & Utilities", note: "Mobile recharge", account: "bKash", source: "sms" },
    { day: 28, amount: 450, category: "Entertainment", note: "Gaming zone with friends", account: "Nagad", source: "sms" },
  ];

  m2Expenses.forEach((e) => {
    s.transactions.push({
      id: Math.random().toString(36),
      type: "expense",
      amount: e.amount,
      currency: "BDT",
      category: e.category,
      note: e.note,
      source: e.source as Source,
      date: new Date(m2Start.getFullYear(), m2Start.getMonth(), e.day).toISOString(),
      account: e.account as Account,
      location: null,
    });
  });

  // Savings transfer - Month -2
  s.transactions.push({
    id: Math.random().toString(36),
    type: "transfer",
    amount: 2000,
    currency: "BDT",
    category: "Savings",
    note: "Monthly savings to bank",
    source: "manual",
    date: new Date(m2Start.getFullYear(), m2Start.getMonth(), 29).toISOString(),
    account: "Bank",
    location: null,
  });

  // === MONTH -1: Complete financial picture ===
  const month1 = getMonthRange(-1);
  const m1Start = new Date(month1.start);
  
  // Income - Month -1
  s.transactions.push(
    {
      id: Math.random().toString(36),
      type: "income",
      amount: 8000,
      currency: "BDT",
      category: "Allowance",
      note: "Monthly allowance from family",
      source: "manual",
      date: new Date(m1Start.getFullYear(), m1Start.getMonth(), 1).toISOString(),
      account: "Cash",
      location: null,
    },
    {
      id: Math.random().toString(36),
      type: "income",
      amount: 6500,
      currency: "BDT",
      category: "Freelance",
      note: "Mobile app UI design",
      source: "manual",
      date: new Date(m1Start.getFullYear(), m1Start.getMonth(), 10).toISOString(),
      account: "bKash",
      location: null,
    },
    {
      id: Math.random().toString(36),
      type: "income",
      amount: 2000,
      currency: "BDT",
      category: "Gift",
      note: "Eid gift from relatives",
      source: "manual",
      date: new Date(m1Start.getFullYear(), m1Start.getMonth(), 12).toISOString(),
      account: "Cash",
      location: null,
    },
    {
      id: Math.random().toString(36),
      type: "income",
      amount: 1500,
      currency: "BDT",
      category: "Pocket Money",
      note: "Weekly pocket money",
      source: "manual",
      date: new Date(m1Start.getFullYear(), m1Start.getMonth(), 8).toISOString(),
      account: "Cash",
      location: null,
    },
    {
      id: Math.random().toString(36),
      type: "income",
      amount: 1500,
      currency: "BDT",
      category: "Pocket Money",
      note: "Weekly pocket money",
      source: "manual",
      date: new Date(m1Start.getFullYear(), m1Start.getMonth(), 15).toISOString(),
      account: "Cash",
      location: null,
    },
    {
      id: Math.random().toString(36),
      type: "income",
      amount: 1500,
      currency: "BDT",
      category: "Pocket Money",
      note: "Weekly pocket money",
      source: "manual",
      date: new Date(m1Start.getFullYear(), m1Start.getMonth(), 22).toISOString(),
      account: "Cash",
      location: null,
    }
  );

  // Expenses - Month -1
  const m1Expenses = [
    { day: 1, amount: 300, category: "Food & Dining", note: "Breakfast at The Daily Star Cafe", account: "Cash", source: "manual" },
    { day: 2, amount: 150, category: "Transport", note: "Pathao to university", account: "bKash", source: "sms" },
    { day: 3, amount: 520, category: "Food & Dining", note: "Lunch buffet at Hotel Sarina", account: "Nagad", source: "sms" },
    { day: 4, amount: 1500, category: "Education", note: "Semester project materials", account: "Bank", source: "mail" },
    { day: 5, amount: 75, category: "Transport", note: "Bus fare for the week", account: "Cash", source: "manual" },
    { day: 6, amount: 420, category: "Food & Dining", note: "Shohoz Food delivery", account: "bKash", source: "sms" },
    { day: 7, amount: 250, category: "Personal Care", note: "Skincare products", account: "Cash", source: "manual" },
    { day: 8, amount: 180, category: "Bills & Utilities", note: "Mobile data pack", account: "bKash", source: "sms" },
    { day: 9, amount: 350, category: "Food & Dining", note: "Burger King with friends", account: "Cash", source: "manual" },
    { day: 10, amount: 850, category: "Shopping", note: "New backpack from Bata", account: "bKash", source: "sms" },
    { day: 11, amount: 200, category: "Transport", note: "Uber to shopping mall", account: "bKash", source: "sms" },
    { day: 12, amount: 480, category: "Entertainment", note: "Bowling at Bashundhara City", account: "Nagad", source: "sms" },
    { day: 13, amount: 320, category: "Food & Dining", note: "Dinner at Thai restaurant", account: "bKash", source: "sms" },
    { day: 14, amount: 150, category: "Groceries", note: "Snacks from Shwapno", account: "Cash", source: "manual" },
    { day: 15, amount: 700, category: "Entertainment", note: "Concert tickets", account: "bKash", source: "mail" },
    { day: 17, amount: 280, category: "Food & Dining", note: "Coffee and cake", account: "Cash", source: "manual" },
    { day: 18, amount: 95, category: "Transport", note: "Rickshaw rides", account: "Cash", source: "manual" },
    { day: 19, amount: 400, category: "Health", note: "Doctor consultation", account: "bKash", source: "sms" },
    { day: 20, amount: 550, category: "Shopping", note: "Stationary from New Market", account: "Cash", source: "manual" },
    { day: 21, amount: 380, category: "Food & Dining", note: "Pizza delivery", account: "Nagad", source: "sms" },
    { day: 22, amount: 200, category: "Bills & Utilities", note: "Electricity bill share", account: "bKash", source: "sms" },
    { day: 23, amount: 650, category: "Entertainment", note: "Gaming subscription", account: "bKash", source: "mail" },
    { day: 24, amount: 120, category: "Transport", note: "Bus fare", account: "Cash", source: "manual" },
    { day: 25, amount: 500, category: "Food & Dining", note: "Group dinner treat", account: "Cash", source: "manual" },
    { day: 26, amount: 300, category: "Personal Care", note: "Salon visit", account: "Cash", source: "manual" },
    { day: 27, amount: 220, category: "Groceries", note: "Weekly groceries", account: "bKash", source: "sms" },
    { day: 28, amount: 180, category: "Bills & Utilities", note: "Mobile recharge", account: "bKash", source: "sms" },
  ];

  m1Expenses.forEach((e) => {
    s.transactions.push({
      id: Math.random().toString(36),
      type: "expense",
      amount: e.amount,
      currency: "BDT",
      category: e.category,
      note: e.note,
      source: e.source as Source,
      date: new Date(m1Start.getFullYear(), m1Start.getMonth(), e.day).toISOString(),
      account: e.account as Account,
      location: null,
    });
  });

  // Savings transfer - Month -1
  s.transactions.push({
    id: Math.random().toString(36),
    type: "transfer",
    amount: 2500,
    currency: "BDT",
    category: "Savings",
    note: "Laptop fund savings",
    source: "manual",
    date: new Date(m1Start.getFullYear(), m1Start.getMonth(), 29).toISOString(),
    account: "Bank",
    location: null,
  });

  // === CURRENT MONTH: Up to today ===
  // Income - Current month
  s.transactions.push(
    {
      id: Math.random().toString(36),
      type: "income",
      amount: 8000,
      currency: "BDT",
      category: "Allowance",
      note: "Monthly allowance from family",
      source: "manual",
      date: new Date(currentYear, currentMonth, 1).toISOString(),
      account: "Cash",
      location: null,
    },
    {
      id: Math.random().toString(36),
      type: "income",
      amount: 8500,
      currency: "BDT",
      category: "Freelance",
      note: "E-commerce website project",
      source: "manual",
      date: new Date(currentYear, currentMonth, 3).toISOString(),
      account: "bKash",
      location: null,
    },
    {
      id: Math.random().toString(36),
      type: "income",
      amount: 1500,
      currency: "BDT",
      category: "Pocket Money",
      note: "Weekly pocket money",
      source: "manual",
      date: new Date(currentYear, currentMonth, 8).toISOString(),
      account: "Cash",
      location: null,
    }
  );

  // Add second week pocket money if applicable
  if (currentDay >= 15) {
    s.transactions.push({
      id: Math.random().toString(36),
      type: "income",
      amount: 1500,
      currency: "BDT",
      category: "Pocket Money",
      note: "Weekly pocket money",
      source: "manual",
      date: new Date(currentYear, currentMonth, 15).toISOString(),
      account: "Cash",
      location: null,
    });
  }

  // Add third week pocket money if applicable
  if (currentDay >= 22) {
    s.transactions.push({
      id: Math.random().toString(36),
      type: "income",
      amount: 1500,
      currency: "BDT",
      category: "Pocket Money",
      note: "Weekly pocket money",
      source: "manual",
      date: new Date(currentYear, currentMonth, 22).toISOString(),
      account: "Cash",
      location: null,
    });
  }

  // Current month expenses (up to today)
  const currentExpenses = [
    { day: 1, amount: 280, category: "Food & Dining", note: "Breakfast at North End Coffee", account: "Cash", source: "manual" },
    { day: 2, amount: 200, category: "Transport", note: "Pathao bike to campus", account: "bKash", source: "sms" },
    { day: 2, amount: 450, category: "Food & Dining", note: "Lunch at Takeout", account: "bKash", source: "sms" },
    { day: 3, amount: 750, category: "Shopping", note: "Daraz flash sale - smartwatch", account: "Nagad", source: "mail" },
    { day: 4, amount: 85, category: "Transport", note: "Bus fare", account: "Cash", source: "manual" },
    { day: 4, amount: 200, category: "Bills & Utilities", note: "GP Flexiplan recharge", account: "bKash", source: "sms" },
    { day: 5, amount: 180, category: "Food & Dining", note: "Starbucks coffee", account: "Cash", source: "manual" },
    { day: 5, amount: 1200, category: "Education", note: "Online course - JavaScript", account: "Bank", source: "mail" },
    { day: 6, amount: 120, category: "Transport", note: "Rickshaw rides", account: "Cash", source: "manual" },
    { day: 6, amount: 380, category: "Food & Dining", note: "Foodpanda order - Chinese", account: "Rocket", source: "sms" },
    { day: 7, amount: 550, category: "Entertainment", note: "Movie tickets - Avatar", account: "bKash", source: "sms" },
    { day: 8, amount: 300, category: "Food & Dining", note: "Lunch with project team", account: "Cash", source: "manual" },
    { day: 9, amount: 250, category: "Groceries", note: "Snacks from Agora", account: "Cash", source: "manual" },
  ];

  currentExpenses.forEach((e) => {
    if (e.day <= currentDay) {
      s.transactions.push({
        id: Math.random().toString(36),
        type: "expense",
        amount: e.amount,
        currency: "BDT",
        category: e.category,
        note: e.note,
        source: e.source as Source,
        date: new Date(currentYear, currentMonth, e.day).toISOString(),
        account: e.account as Account,
        location: null,
      });
    }
  });

  setState(s);
  
  // Seed security notifications
  seedSecurityNotifications();
}

function seedSecurityNotifications() {
  const s = getState();
  const now = new Date();
  
  const sampleNotifications = [
    {
      message: "Critical phishing attempt blocked",
      type: "phishing" as const,
      confidence: 96,
      details: "Fake bKash message claiming account suspension. Requested immediate PIN verification via link. Official bKash NEVER requests PINs through SMS. Link leads to phishing site mimicking bKash login.",
      tags: ["sms", "blocked", "critical"],
      hoursAgo: 2
    },
    {
      message: "Lottery scam detected and blocked",
      type: "phishing" as const,
      confidence: 94,
      details: "SMS claiming you won ৳50,000 lottery from 'Bangladesh National Lottery Board'. Requests ৳1,500 processing fee to claim prize. Government does not run lottery programs.",
      tags: ["sms", "scam", "blocked"],
      hoursAgo: 4
    },
    {
      message: "Investment fraud warning",
      type: "phishing" as const,
      confidence: 92,
      details: "Telegram message promising 300% returns in 7 days through crypto investment. Requires ৳10,000 minimum deposit. Classic Ponzi scheme pattern detected with fake testimonials.",
      tags: ["telegram", "investment-scam"],
      hoursAgo: 6
    },
    {
      message: "Promotional message verified safe",
      type: "promo" as const,
      confidence: 98,
      details: "Legitimate Grameenphone offer for 5GB data at ৳49. Sent from official GP number 121. No suspicious links or personal data requests.",
      tags: ["sms", "promo", "safe"],
      hoursAgo: 8
    },
    {
      message: "Bank verification scam blocked",
      type: "phishing" as const,
      confidence: 95,
      details: "Fake Dutch-Bangla Bank message requesting KYC update through external link. Contains spelling errors. Official DBBL uses in-app notifications for KYC. Reported to Bangladesh Bank.",
      tags: ["sms", "banking", "blocked"],
      hoursAgo: 12
    },
    {
      message: "Job offer scam detected",
      type: "phishing" as const,
      confidence: 89,
      details: "Email claiming data entry job paying ৳15,000/month from home. Requires ৳2,500 training fee. Company name doesn't exist in RJSC registry. Common employment scam pattern.",
      tags: ["mail", "job-scam", "high-risk"],
      hoursAgo: 18
    },
    {
      message: "Safe personal message",
      type: "normal" as const,
      confidence: 99,
      details: "Message from family member in your contacts. No links, no financial requests, normal conversation pattern. Verified sender.",
      tags: ["sms", "personal", "safe"],
      hoursAgo: 24
    },
    {
      message: "Nagad impersonation blocked",
      type: "phishing" as const,
      confidence: 97,
      details: "Fraudulent message claiming Nagad account will be blocked unless you click link to verify identity. Uses unofficial sender number. Official Nagad only sends from 16167.",
      tags: ["sms", "mobile-banking", "blocked"],
      hoursAgo: 30
    },
    {
      message: "Suspicious parcel delivery scam",
      type: "phishing" as const,
      confidence: 91,
      details: "SMS about undelivered parcel requiring customs fee payment. You haven't ordered anything recently. Link leads to fake payment gateway designed to steal card details.",
      tags: ["sms", "delivery-scam"],
      hoursAgo: 36
    },
    {
      message: "Educational promotion verified",
      type: "promo" as const,
      confidence: 96,
      details: "Programming.com.bd course discount offer. Legitimate educational platform registered in Bangladesh. Offer verified on official website.",
      tags: ["mail", "education", "safe"],
      hoursAgo: 48
    },
    {
      message: "Romance scam pattern identified",
      type: "phishing" as const,
      confidence: 88,
      details: "Facebook message from unknown profile claiming to be abroad, requesting money for emergency. Profile created 2 weeks ago with stolen photos. Classic romance scam tactic.",
      tags: ["social-media", "romance-scam"],
      hoursAgo: 60
    },
    {
      message: "Tax refund scam blocked",
      type: "phishing" as const,
      confidence: 93,
      details: "Email claiming ৳8,500 tax refund from NBR. Links to fake government website requesting bank details. NBR does not process refunds via email.",
      tags: ["mail", "government-impersonation", "blocked"],
      hoursAgo: 72
    }
  ];

  sampleNotifications.forEach(notif => {
    const timestamp = new Date(now.getTime() - notif.hoursAgo * 60 * 60 * 1000);
    s.notifications.push({
      id: Math.random().toString(36),
      message: notif.message,
      timestamp: timestamp.toISOString(),
      tags: notif.tags,
      type: notif.type,
      confidence: notif.confidence,
      details: notif.details
    });
  });

  setState(s);
}
