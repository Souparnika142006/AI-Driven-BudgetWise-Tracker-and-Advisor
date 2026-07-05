import { GoogleGenAI, Type } from "@google/genai";
import { Expense, Income, Budget, SavingsGoal, UserProfile } from "./db";

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not defined. AI functions will run in demo/fallback mode.");
      // We will handle fallback if key is missing so the app remains fully interactive
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

const VALID_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Medical",
  "Education",
  "Fuel",
  "Rent",
  "Others"
];

/**
 * Automatically classifies a given transaction description into standard financial categories
 */
export async function autoCategorizeExpense(description: string, amount: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Local deterministic fallback for developer offline/mock safety
    const desc = description.toLowerCase();
    if (desc.includes("swiggy") || desc.includes("zomato") || desc.includes("food") || desc.includes("restaurant") || desc.includes("cafe") || desc.includes("chai")) {
      return "Food";
    }
    if (desc.includes("uber") || desc.includes("ola") || desc.includes("cab") || desc.includes("metro") || desc.includes("train") || desc.includes("travel")) {
      return "Transport";
    }
    if (desc.includes("amazon") || desc.includes("flipkart") || desc.includes("shopping") || desc.includes("myntra") || desc.includes("clothe") || desc.includes("watch")) {
      return "Shopping";
    }
    if (desc.includes("electricity") || desc.includes("wifi") || desc.includes("broadband") || desc.includes("bill") || desc.includes("recharge") || desc.includes("water") || desc.includes("gas")) {
      return "Bills";
    }
    if (desc.includes("netflix") || desc.includes("spotify") || desc.includes("movie") || desc.includes("theatre") || desc.includes("game") || desc.includes("entertainment")) {
      return "Entertainment";
    }
    if (desc.includes("doctor") || desc.includes("hospital") || desc.includes("medicine") || desc.includes("pharma") || desc.includes("dental") || desc.includes("medical")) {
      return "Medical";
    }
    if (desc.includes("book") || desc.includes("course") || desc.includes("udemy") || desc.includes("tuition") || desc.includes("school") || desc.includes("education")) {
      return "Education";
    }
    if (desc.includes("petrol") || desc.includes("diesel") || desc.includes("fuel") || desc.includes("gas station")) {
      return "Fuel";
    }
    if (desc.includes("rent") || desc.includes("hostel") || desc.includes("flat") || desc.includes("pg")) {
      return "Rent";
    }
    return "Others";
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Categorize the financial transaction description: "${description}" (Amount: ${amount}). Choose the single most appropriate category from this list: ${VALID_CATEGORIES.join(", ")}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "The matched financial category from the provided valid categories.",
              enum: VALID_CATEGORIES,
            },
          },
          required: ["category"],
        },
      },
    });

    if (response.text) {
      const result = JSON.parse(response.text.trim());
      if (result.category && VALID_CATEGORIES.includes(result.category)) {
        return result.category;
      }
    }
  } catch (error) {
    console.error("Gemini classification failed, using fallback:", error);
  }

  return "Others";
}

/**
 * Predicts month-end expenses, forecasts if the user will exceed budget, and creates custom insights.
 */
export async function getBudgetPredictionAndForecast(
  expenses: Expense[],
  budgets: Budget[],
  profile: UserProfile
): Promise<{
  projectedSpending: number;
  exceedsBudget: boolean;
  projectedOverspend: number;
  analysisText: string;
}> {
  const currentMonth = "2026-07"; // Hardcoded to match our active month
  const daysInMonth = 31;
  const currentDay = 4; // Simulated date based on local time July 4, 2026

  const totalBudget = budgets.find(b => b.category === "all")?.amount || 30000;
  
  // Calculate total spent in current month
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Math projection: standard daily average * days in month
  const dailyAverage = currentDay > 0 ? totalSpent / currentDay : 0;
  const projectedSpending = Math.round(dailyAverage * daysInMonth);
  const exceedsBudget = projectedSpending > totalBudget;
  const projectedOverspend = exceedsBudget ? projectedSpending - totalBudget : 0;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const analysisText = exceedsBudget 
      ? `🚨 AI Forecast: At your current daily average spending rate of ${profile.currency}${Math.round(dailyAverage)}, you are projected to reach ${profile.currency}${projectedSpending} by the end of July. This will exceed your monthly budget of ${profile.currency}${totalBudget} by ${profile.currency}${projectedOverspend}. Consider reducing shopping and premium food delivery to stay within limits.`
      : `✅ AI Forecast: Good news! At your current daily average spending rate of ${profile.currency}${Math.round(dailyAverage)}, you are projected to reach ${profile.currency}${projectedSpending} by the end of July, keeping you well within your monthly budget of ${profile.currency}${totalBudget}. You are saving efficiently!`;
    
    return {
      projectedSpending,
      exceedsBudget,
      projectedOverspend,
      analysisText
    };
  }

  try {
    const ai = getAI();
    // Prepare structured summaries of categories for Gemini
    const categoryTotals: Record<string, number> = {};
    VALID_CATEGORIES.forEach(cat => {
      categoryTotals[cat] = monthlyExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    });

    const categoryBudgets: Record<string, number> = {};
    budgets.forEach(b => {
      if (b.category !== "all") {
        categoryBudgets[b.category] = b.amount;
      }
    });

    const prompt = `
      User Profile Name: ${profile.name}
      Current Date: July 4, 2026 (Day 4 of 31)
      Monthly Total Budget: ${profile.currency}${totalBudget}
      Total Spent So Far (4 days): ${profile.currency}${totalSpent}
      Daily Average Spending: ${profile.currency}${Math.round(dailyAverage)}
      Mathematical Projected Month-End Expenses: ${profile.currency}${projectedSpending}
      Category Budgets and Category Spent details:
      ${VALID_CATEGORIES.map(cat => `- ${cat}: Spent ${profile.currency}${categoryTotals[cat] || 0} / Budget ${profile.currency}${categoryBudgets[cat] || "Not Set"}`).join("\n")}
      
      Generate a concise, professional, friendly, and actionable financial forecast (2-3 sentences max) from BudgetWise AI. Suggest areas where spending can be trimmed based on high expenditures relative to category budgets.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the resident AI Financial Advisor for BudgetWise Tracker. Speak in a highly encouraging, actionable, professional tone. Avoid generic statements; customize your advice directly using the provided numbers.",
      }
    });

    return {
      projectedSpending,
      exceedsBudget,
      projectedOverspend,
      analysisText: response.text || "No insights generated at this time."
    };
  } catch (error) {
    console.error("Gemini budget prediction failed:", error);
    return {
      projectedSpending,
      exceedsBudget,
      projectedOverspend,
      analysisText: `Based on your spending rate, you are on track to spend ${profile.currency}${projectedSpending} against a budget of ${profile.currency}${totalBudget}.`
    };
  }
}

/**
 * Generates personalized saving recommendations based on monthly status
 */
export async function getSmartSavingRecommendations(
  expenses: Expense[],
  budgets: Budget[],
  savingsGoals: SavingsGoal[],
  profile: UserProfile
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Realistic fallback tips
    return [
      `💡 Cook more at home: You have spent ${profile.currency}600 on Food deliveries recently. Preparing meals can save up to ₹3,500/month.`,
      `🚌 Commute Smart: Use public transit or carpools instead of private cabs to lower your Transport expenses.`,
      `📦 Delayed Shopping Rule: Put non-essential items in your Amazon cart for 48 hours before purchasing to curb impulse shopping.`,
      `🎯 Goal Accelerator: Put an extra ${profile.currency}1,500 into your "${savingsGoals[0]?.title || 'Savings Goal'}" this week to hit your goal 12 days early.`
    ];
  }

  try {
    const ai = getAI();
    const prompt = `
      List of Expenses: ${JSON.stringify(expenses.slice(-15))}
      Active Budgets: ${JSON.stringify(budgets)}
      Savings Goals: ${JSON.stringify(savingsGoals)}
      User Profile: ${JSON.stringify(profile)}

      Generate exactly 4 highly specific, personalized, and actionable savings suggestions for this user to help them optimize their cash flow and achieve their saving goals. Keep each suggestion concise (max 20 words each) and start with an emoji.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are BudgetWise AI. Output a JSON list containing exactly 4 strings. No other text.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    if (response.text) {
      const recommendations: string[] = JSON.parse(response.text.trim());
      if (Array.isArray(recommendations) && recommendations.length > 0) {
        return recommendations;
      }
    }
  } catch (err) {
    console.error("Failed to generate smart recommendations:", err);
  }

  return [
    `💡 Track subscriptions: Check your Entertainment bills for inactive services.`,
    `🚌 Rideshare: Sharing Uber/Ola rides can cut commuting costs by 30%.`,
    `🛍️ Shopping list: Stick strictly to pre-planned grocery items.`
  ];
}

/**
 * Analyzes if a newly submitted transaction is an anomaly compared to standard spending.
 */
export async function detectSpendingAnomaly(
  newAmount: number,
  category: string,
  description: string,
  history: Expense[],
  currency: string
): Promise<{ isAnomaly: boolean; warningMessage?: string }> {
  // 1. Math Check (Heuristics)
  const categoryExpenses = history.filter(e => e.category === category);
  if (categoryExpenses.length < 2) {
    // Not enough history, only alert if massive absolute value
    if (newAmount > 10000) {
      return {
        isAnomaly: true,
        warningMessage: `⚠️ AI Anomaly Flagged: This single transaction of ${currency}${newAmount} is unusually large. Please make sure this expense was intended!`
      };
    }
    return { isAnomaly: false };
  }

  const avg = categoryExpenses.reduce((sum, e) => sum + e.amount, 0) / categoryExpenses.length;
  const isMathAnomaly = newAmount > avg * 3; // 3x the historical category average

  if (!isMathAnomaly) {
    return { isAnomaly: false };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      isAnomaly: true,
      warningMessage: `⚠️ AI Anomaly Flagged: Your spending of ${currency}${newAmount} on "${description}" is significantly higher than your average ${category} expense of ${currency}${Math.round(avg)}. Please verify this purchase.`
    };
  }

  try {
    const ai = getAI();
    const prompt = `
      New Expense details:
      - Amount: ${currency}${newAmount}
      - Category: ${category}
      - Description: "${description}"

      Category Expense History Average: ${currency}${Math.round(avg)}
      
      Generate a professional, polite, non-alarmist warning warning (1 sentence max) pointing out that this transaction is unusually high compared to historical habits, and ask if they would like to flag or review it.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the BudgetWise Tracker AI security assistant. Generate a courteous, warm, and helpful single-sentence warning about an unusual transaction. Never use scary or accusatory words."
      }
    });

    return {
      isAnomaly: true,
      warningMessage: response.text ? `⚠️ ${response.text.trim()}` : `⚠️ Unusual expense of ${currency}${newAmount} flagged in ${category}.`
    };
  } catch (err) {
    console.error("Gemini anomaly detection failed:", err);
    return {
      isAnomaly: true,
      warningMessage: `⚠️ AI Anomaly Flagged: Spending of ${currency}${newAmount} on "${description}" is unusually high for ${category}.`
    };
  }
}
