export interface Income {
  id: string;
  amount: number;
  source: string;
  date: string;
  description: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  isAnomaly: boolean;
  anomalyReason?: string;
}

export interface Budget {
  id: string;
  amount: number;
  category: string;
  month: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export interface Notification {
  id: string;
  type: "warning" | "info" | "success";
  message: string;
  date: string;
  read: boolean;
}

export interface UserProfile {
  name: string;
  currency: string;
  monthlyIncomeGoal: number;
}

export interface DBState {
  profile: UserProfile;
  income: Income[];
  expenses: Expense[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  notifications: Notification[];
}

export interface AIForecast {
  projectedSpending: number;
  exceedsBudget: boolean;
  projectedOverspend: number;
  analysisText: string;
}

export const VALID_CATEGORIES = [
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
