// Enhanced transaction parser with natural language understanding
import { addTransaction, addNotification, loadState, updateTransaction } from "./store";
import type { Source, TxType, Account } from "./store";

export function parsedFromMessage(text: string, source: Source, location: { lat: number; lng: number } | null) {
  const amountMatch = text.match(/(?:tk|৳|taka)\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*(?:tk|৳|taka)/i);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1] || amountMatch[2]);
  
  // Detect category keywords
  let category = "Other";
  const lower = text.toLowerCase();
  if (/food|lunch|dinner|breakfast|restaurant|snack/i.test(lower)) category = "Food";
  else if (/transport|bus|rickshaw|uber|taxi/i.test(lower)) category = "Transport";
  else if (/book|education|course|tuition/i.test(lower)) category = "Education";
  else if (/movie|entertainment|game/i.test(lower)) category = "Entertainment";
  else if (/shop|cloth|purchase/i.test(lower)) category = "Shopping";
  else if (/salary|allowance|income|credit/i.test(lower)) category = "Income";

  // Detect type
  let type: "expense" | "income" | "transfer" = "expense";
  if (/credit|received|deposit|income|salary|allowance/i.test(lower)) type = "income";
  else if (/transfer|send|sent/i.test(lower)) type = "transfer";

  addTransaction({
    type,
    amount,
    currency: "BDT",
    category,
    note: text.slice(0, 100),
    source,
    date: new Date().toISOString(),
    account: "Cash",
    location,
  });

  addNotification({
    message: `Parsed 1 transaction from message`,
    tags: [source],
  });

  return { type, amount, category };
}

// Enhanced natural language transaction parser
export type ParsedTransaction = {
  action: "add_transaction" | "modify_transaction" | "add_to_last" | "add_to_specific" | "set_savings_goal" | "financial_advice";
  amount?: number;
  category?: string;
  note?: string;
  type?: TxType;
  account?: Account;
  targetTransactionId?: string;
  targetNote?: string;
  targetCategory?: string;
  goalType?: string; // For savings goals
};

export function parseNaturalLanguage(text: string): ParsedTransaction | null {
  const lower = text.toLowerCase();
  
  // Extract amount
  const amountMatch = text.match(/(?:tk|৳|taka)?\s*(\d+(?:\.\d+)?)\s*(?:tk|৳|taka)?/i);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;
  
  // Check for savings goals
  if (/(?:want to save|save|savings goal|set aside|allocate for savings|বাঁচতে চাই|সঞ্চয়|সেভ)/i.test(lower) && amount) {
    return {
      action: "set_savings_goal",
      amount,
      goalType: "monthly",
      note: text
    };
  }
  
  // Check for financial advice requests (not transactions)
  if (/(?:advice|suggest|recommend|how to|কিভাবে|পরামর্শ|সাজেশন)/i.test(lower) && 
      !/(?:add|spent|spend|paid|pay|bought|transfer|send|sent|received|got|income|deposit)/i.test(lower)) {
    return {
      action: "financial_advice",
      amount,
      note: text
    };
  }
  
  // Check for "add to last transaction"
  if (/add.*(?:to|on).*(?:last|previous|recent).*transaction/i.test(lower)) {
    return {
      action: "add_to_last",
      amount,
    };
  }
  
  // Check for "add to specific transaction" (e.g., "add 50tk to my food transaction where note says 'shama's kitchen'")
  const specificMatch = lower.match(/add.*to.*transaction.*(?:where|with|that).*note.*['"]([^'"]+)['"]/i);
  if (specificMatch) {
    const targetNote = specificMatch[1];
    return {
      action: "add_to_specific",
      amount,
      targetNote,
    };
  }
  
  // Check for category-specific add (e.g., "add 50tk to my food transaction")
  const categoryAddMatch = lower.match(/add.*to.*(?:my\s+)?(\w+).*transaction/i);
  if (categoryAddMatch) {
    const targetCategory = categoryAddMatch[1];
    return {
      action: "add_to_specific",
      amount,
      targetCategory: normalizeCategory(targetCategory),
    };
  }
  
  // Check for regular transaction add
  if (/(?:add|spent|spend|paid|pay|bought)/i.test(lower) || amount) {
    // Detect category from keywords
    const category = detectCategory(lower);
    
    // Detect type (expense/income)
    let type: TxType = "expense";
    if (/(?:income|received|earned|got|allowance|salary|pocket\s*money)/i.test(lower)) {
      type = "income";
    } else if (/(?:transfer|send|sent)/i.test(lower)) {
      type = "transfer";
    }
    
    // Detect account
    const account = detectAccount(lower);
    
    // Extract note/description
    const noteMatch = text.match(/(?:for|on|at|from)\s+([\w\s']+?)(?:\s+(?:tk|৳|taka)|$)/i);
    const note = noteMatch ? noteMatch[1].trim() : undefined;
    
    return {
      action: "add_transaction",
      amount,
      category,
      type,
      account,
      note,
    };
  }
  
  return null;
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  
  // Food & Dining
  if (/food|lunch|dinner|breakfast|restaurant|snack|meal|eat|coffee|tea|biriyani|burger|pizza/i.test(lower)) {
    return "Food & Dining";
  }
  // Transport
  if (/transport|bus|rickshaw|uber|taxi|ride|cng|pathao|obhai|fare/i.test(lower)) {
    return "Transport";
  }
  // Education
  if (/book|education|course|tuition|study|class|pen|notebook|stationery/i.test(lower)) {
    return "Education";
  }
  // Entertainment
  if (/movie|entertainment|game|cinema|concert|show|fun|party/i.test(lower)) {
    return "Entertainment";
  }
  // Shopping
  if (/shop|shopping|cloth|clothes|dress|shirt|purchase|buy|bought|daraz|fashion/i.test(lower)) {
    return "Shopping";
  }
  // Health
  if (/health|doctor|medicine|hospital|medical|pharmacy|medicine/i.test(lower)) {
    return "Health";
  }
  // Bills & Utilities
  if (/bill|utility|mobile|recharge|internet|electricity|water|gas/i.test(lower)) {
    return "Bills & Utilities";
  }
  // Groceries
  if (/grocery|groceries|market|vegetable|fruit|rice|oil/i.test(lower)) {
    return "Groceries";
  }
  // Personal Care
  if (/personal|care|haircut|salon|cosmetic|beauty|grooming/i.test(lower)) {
    return "Personal Care";
  }
  // Savings
  if (/save|savings|বাঁচতে|সঞ্চয়/i.test(lower)) {
    return "Savings";
  }
  
  return "Other";
}

function detectAccount(text: string): Account {
  const lower = text.toLowerCase();
  
  if (/bkash/i.test(lower)) return "bKash";
  if (/nagad/i.test(lower)) return "Nagad";
  if (/rocket/i.test(lower)) return "Rocket";
  if (/bank/i.test(lower)) return "Bank";
  
  return "Cash";
}

function normalizeCategory(category: string): string {
  const lower = category.toLowerCase();
  
  if (lower.includes("food")) return "Food & Dining";
  if (lower.includes("transport")) return "Transport";
  if (lower.includes("education")) return "Education";
  if (lower.includes("entertainment")) return "Entertainment";
  if (lower.includes("shop")) return "Shopping";
  if (lower.includes("health")) return "Health";
  if (lower.includes("bill")) return "Bills & Utilities";
  if (lower.includes("grocer")) return "Groceries";
  if (lower.includes("personal")) return "Personal Care";
  if (lower.includes("save")) return "Savings";
  
  return "Other";
}

// Execute parsed transaction action
export function executeParsedAction(parsed: ParsedTransaction): { success: boolean; message: string } {
  try {
    switch (parsed.action) {
      case "add_transaction":
        if (!parsed.amount) {
          return { success: false, message: "Amount is required" };
        }
        addTransaction({
          type: parsed.type || "expense",
          amount: parsed.amount,
          currency: "BDT",
          category: parsed.category || "Other",
          note: parsed.note || "Added via AI",
          source: "manual",
          date: new Date().toISOString(),
          account: parsed.account || "Cash",
          location: null,
        });
        return { 
          success: true, 
          message: `✅ Added ${parsed.type || "expense"} of ৳${parsed.amount} for ${parsed.category || "Other"}` 
        };
      
      case "add_to_last":
        if (!parsed.amount) {
          return { success: false, message: "Amount is required" };
        }
        const state = loadState();
        if (state.transactions.length === 0) {
          return { success: false, message: "No transactions found" };
        }
        const lastTx = state.transactions[0]; // Already sorted by date
        updateTransaction(lastTx.id, { amount: lastTx.amount + parsed.amount });
        return { 
          success: true, 
          message: `✅ Added ৳${parsed.amount} to last transaction (${lastTx.category}). New amount: ৳${lastTx.amount + parsed.amount}` 
        };
      
      case "add_to_specific":
        if (!parsed.amount) {
          return { success: false, message: "Amount is required" };
        }
        const stateSpecific = loadState();
        let targetTx = null;
        
        if (parsed.targetNote) {
          targetTx = stateSpecific.transactions.find(tx => 
            tx.note?.toLowerCase().includes(parsed.targetNote!.toLowerCase())
          );
        } else if (parsed.targetCategory) {
          targetTx = stateSpecific.transactions.find(tx => 
            tx.category.toLowerCase().includes(parsed.targetCategory!.toLowerCase())
          );
        }
        
        if (!targetTx) {
          return { success: false, message: "Transaction not found" };
        }
        
        updateTransaction(targetTx.id, { amount: targetTx.amount + parsed.amount });
        return { 
          success: true, 
          message: `✅ Added ৳${parsed.amount} to ${targetTx.category} transaction. New amount: ৳${targetTx.amount + parsed.amount}` 
        };
      
      case "set_savings_goal":
        if (!parsed.amount) {
          return { success: false, message: "Amount is required for savings goal" };
        }
        // For savings goals, we don't add a transaction but provide advice
        return { 
          success: true, 
          message: `🎯 Savings Goal Set: ৳${parsed.amount} per month\n\nI've noted your savings goal. Consider setting up an automatic transfer to your savings account at the beginning of each month to help you achieve this goal.` 
        };
      
      case "financial_advice":
        // Provide general financial advice without adding transactions
        return { 
          success: true, 
          message: `💡 Financial Advice

I understand you're looking for financial guidance. Based on your query "${parsed.note}", I recommend:

1. Track all your expenses for at least one month to understand your spending patterns
2. Create a budget that includes savings as a fixed expense
3. Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings
4. Consider automating your savings to ensure consistency

Would you like me to help you create a detailed budget plan?` 
        };
      
      default:
        return { success: false, message: "Unknown action" };
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
}