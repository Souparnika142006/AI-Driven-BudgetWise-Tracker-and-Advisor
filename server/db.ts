import fs from "fs";
import path from "path";

export interface Income {
  id: string;
  amount: number;
  source: string;
  date: string; // YYYY-MM-DD
  description: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description: string;
  isAnomaly: boolean;
  anomalyReason?: string;
}

export interface Budget {
  id: string;
  amount: number;
  category: string; // "all" or specific category
  month: string; // YYYY-MM
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
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
  currency: string; // e.g. "₹" or "$"
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

export interface UserAccount {
  username: string;
  passwordHash: string; // Plain-text or simple hashing for demonstration/placement
  fullName: string;
  dbState: DBState;
}

export interface MultiUserDB {
  users: Record<string, UserAccount>;
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

const initialData: DBState = {
  profile: {
    name: "Sourav Biswas",
    currency: "₹",
    monthlyIncomeGoal: 50000,
  },
  income: [
    { id: "inc-1", amount: 45000, source: "Salary", date: "2026-07-01", description: "Monthly Tech Job Salary" },
    { id: "inc-2", amount: 8500, source: "Freelance", date: "2026-07-03", description: "Website design contract" }
  ],
  expenses: [
    { id: "exp-1", amount: 450, category: "Food", date: "2026-07-01", description: "Swiggy lunch delivery", isAnomaly: false },
    { id: "exp-2", amount: 1200, category: "Transport", date: "2026-07-01", description: "Uber ride to office", isAnomaly: false },
    { id: "exp-3", amount: 2500, category: "Shopping", date: "2026-07-02", description: "Amazon mechanical keyboard", isAnomaly: false },
    { id: "exp-4", amount: 799, category: "Entertainment", date: "2026-07-02", description: "Netflix monthly subscription", isAnomaly: false },
    { id: "exp-5", amount: 3500, category: "Bills", date: "2026-07-03", description: "Electricity & broadband", isAnomaly: false },
    { id: "exp-6", amount: 150, category: "Food", date: "2026-07-03", description: "Chai and snacks with friends", isAnomaly: false },
    { id: "exp-7", amount: 18000, category: "Shopping", date: "2026-07-04", description: "Unusual luxury watch purchase", isAnomaly: true, anomalyReason: "This purchase of ₹18,000 is 7x higher than your average shopping expense of ₹2,500. Please confirm if this is expected." }
  ],
  budgets: [
    { id: "b-1", amount: 35000, category: "all", month: "2026-07" },
    { id: "b-2", amount: 5000, category: "Food", month: "2026-07" },
    { id: "b-3", amount: 4000, category: "Transport", month: "2026-07" },
    { id: "b-4", amount: 6000, category: "Shopping", month: "2026-07" },
    { id: "b-5", amount: 5000, category: "Bills", month: "2026-07" }
  ],
  savingsGoals: [
    { id: "g-1", title: "Buy Developer Laptop", targetAmount: 85000, currentAmount: 35000, deadline: "2026-12-31" },
    { id: "g-2", title: "Emergency Fund", targetAmount: 50000, currentAmount: 15000, deadline: "2026-10-15" }
  ],
  notifications: [
    { id: "n-1", type: "warning", message: "AI Warning: You have spent ₹18,000 on Shopping today, which triggers an anomaly detection alert.", date: "2026-07-04T12:00:00Z", read: false },
    { id: "n-2", type: "info", message: "Savings Tip: Set aside ₹8,000 more this month to stay on track for your Developer Laptop goal.", date: "2026-07-03T10:30:00Z", read: true }
  ]
};

export function getMultiUserDB(): MultiUserDB {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const defaultMultiDB: MultiUserDB = {
    users: {
      "soubisouma": {
        username: "soubisouma",
        passwordHash: "password123",
        fullName: "Sourav Biswas",
        dbState: initialData
      }
    }
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultMultiDB, null, 2), "utf8");
    return defaultMultiDB;
  }

  try {
    const content = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(content);
    
    // Check if it's the old single-user schema
    if (parsed && !parsed.users) {
      console.log("[Migration] Converting single-user schema to multi-user database...");
      const migrated: MultiUserDB = {
        users: {
          "soubisouma": {
            username: "soubisouma",
            passwordHash: "password123",
            fullName: parsed.profile?.name || "Sourav Biswas",
            dbState: parsed as DBState
          }
        }
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(migrated, null, 2), "utf8");
      return migrated;
    }
    
    return parsed as MultiUserDB;
  } catch (err) {
    console.error("Error reading database file, resetting to initial multi-user data", err);
    return defaultMultiDB;
  }
}

export function saveMultiUserDB(state: MultiUserDB): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf8");
}

// Retain legacy functions for absolute safety, mapping them to the first user
export function getDB(): DBState {
  const multi = getMultiUserDB();
  const firstUser = Object.keys(multi.users)[0] || "soubisouma";
  return multi.users[firstUser].dbState;
}

export function saveDB(state: DBState): void {
  const multi = getMultiUserDB();
  const firstUser = Object.keys(multi.users)[0] || "soubisouma";
  multi.users[firstUser].dbState = state;
  saveMultiUserDB(multi);
}

