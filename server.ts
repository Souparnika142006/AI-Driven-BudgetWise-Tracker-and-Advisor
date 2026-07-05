import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { 
  getDB, 
  saveDB, 
  getMultiUserDB,
  saveMultiUserDB,
  Income, 
  Expense, 
  Budget, 
  SavingsGoal, 
  Notification, 
  UserProfile,
  DBState
} from "./server/db";

import { 
  autoCategorizeExpense, 
  getBudgetPredictionAndForecast, 
  getSmartSavingRecommendations, 
  detectSpendingAnomaly 
} from "./server/gemini";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing and static files middlewares
  app.use(express.json());

  // ==================== REST API ENDPOINTS ====================

  // 1. Sign Up / Register
  app.post("/api/auth/register", (req, res) => {
    try {
      const { username, password, fullName } = req.body;
      if (!username || !password || !fullName) {
        return res.status(400).json({ error: "Missing required fields: username, password, and fullName are required." });
      }

      const trimmedUsername = username.trim().toLowerCase();
      const multiDB = getMultiUserDB();

      if (multiDB.users[trimmedUsername]) {
        return res.status(400).json({ error: "Username is already taken. Please choose another one." });
      }

      // Initialize default state for new user
      const defaultState: DBState = {
        profile: {
          name: fullName,
          currency: "₹",
          monthlyIncomeGoal: 50000,
        },
        income: [],
        expenses: [],
        budgets: [
          { id: `b-init-${Date.now()}`, amount: 30000, category: "all", month: new Date().toISOString().substring(0, 7) }
        ],
        savingsGoals: [],
        notifications: [
          { id: `n-init-${Date.now()}`, type: "info", message: `Welcome ${fullName}! Your new financial workspace is fully operational.`, date: new Date().toISOString(), read: false }
        ]
      };

      multiDB.users[trimmedUsername] = {
        username: trimmedUsername,
        passwordHash: password,
        fullName,
        dbState: defaultState
      };

      saveMultiUserDB(multiDB);
      res.json({ success: true, username: trimmedUsername, fullName });
    } catch (err: any) {
      res.status(500).json({ error: "Registration failed", message: err.message });
    }
  });

  // 2. Sign In / Login
  app.post("/api/auth/login", (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
      }

      const trimmedUsername = username.trim().toLowerCase();
      const multiDB = getMultiUserDB();
      const user = multiDB.users[trimmedUsername];

      if (!user || user.passwordHash !== password) {
        return res.status(401).json({ error: "Invalid username or password." });
      }

      res.json({ 
        success: true, 
        username: trimmedUsername, 
        fullName: user.fullName,
        profile: user.dbState.profile
      });
    } catch (err: any) {
      res.status(500).json({ error: "Authentication failed", message: err.message });
    }
  });

  // Secure all other /api endpoints with User Scope
  app.use("/api", (req: any, res: any, next: any) => {
    if (req.path === "/auth/login" || req.path === "/auth/register") {
      return next();
    }

    const authHeader = req.headers["x-user-id"] || req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized: Missing credentials in X-User-ID or Authorization header." });
    }

    const username = String(authHeader).replace("Bearer ", "").trim().toLowerCase();
    const multiDB = getMultiUserDB();
    const user = multiDB.users[username];

    if (!user) {
      return res.status(401).json({ error: `Unauthorized: User "${username}" not found.` });
    }

    req.username = username;
    req.userDB = user.dbState;
    req.saveUserDB = (updatedState: DBState) => {
      user.dbState = updatedState;
      saveMultiUserDB(multiDB);
    };

    next();
  });

  // 1. Fetch Full Database State
  app.get("/api/db", (req: any, res) => {
    try {
      const db = req.userDB;
      res.json(db);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load database", message: err.message });
    }
  });

  // 2. Update User Profile
  app.put("/api/profile", (req: any, res) => {
    try {
      const { name, currency, monthlyIncomeGoal } = req.body;
      const db = req.userDB;
      
      db.profile = {
        name: name || db.profile.name,
        currency: currency || db.profile.currency,
        monthlyIncomeGoal: Number(monthlyIncomeGoal) || db.profile.monthlyIncomeGoal
      };
      
      req.saveUserDB(db);
      res.json({ success: true, profile: db.profile });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update profile", message: err.message });
    }
  });

  // 3. Add Income
  app.post("/api/income", (req: any, res) => {
    try {
      const { amount, source, date, description } = req.body;
      if (!amount || !source || !date) {
        return res.status(400).json({ error: "Missing required fields: amount, source, and date are required." });
      }

      const db = req.userDB;
      const newIncome: Income = {
        id: `inc-${Date.now()}`,
        amount: Number(amount),
        source,
        date,
        description: description || ""
      };

      db.income.unshift(newIncome);

      // Create Success Notification
      const newNotification: Notification = {
        id: `n-${Date.now()}`,
        type: "success",
        message: `Added Income: ${db.profile.currency}${amount} from ${source}.`,
        date: new Date().toISOString(),
        read: false
      };
      db.notifications.unshift(newNotification);

      req.saveUserDB(db);
      res.json({ success: true, item: newIncome, db });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to add income", message: err.message });
    }
  });

  // 4. Delete Income
  app.delete("/api/income/:id", (req: any, res) => {
    try {
      const { id } = req.params;
      const db = req.userDB;
      
      const index = db.income.findIndex((item: any) => item.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Income record not found." });
      }

      db.income.splice(index, 1);
      req.saveUserDB(db);
      res.json({ success: true, db });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete income", message: err.message });
    }
  });

  // 5. Add Expense (Includes AI Categorization and Anomaly Detection!)
  app.post("/api/expense", async (req: any, res) => {
    try {
      const { amount, description, date, category: userCategory } = req.body;
      if (!amount || !date || !description) {
        return res.status(400).json({ error: "Missing required fields: amount, date, and description are required." });
      }

      const db = req.userDB;
      const amtVal = Number(amount);

      // A. AI Auto-categorization if category is empty or set to "auto"
      let finalCategory = userCategory;
      let usedAICategorization = false;

      if (!finalCategory || finalCategory.toLowerCase() === "auto") {
        finalCategory = await autoCategorizeExpense(description, amtVal);
        usedAICategorization = true;
      }

      // B. AI Anomaly Detection
      const anomalyAnalysis = await detectSpendingAnomaly(
        amtVal,
        finalCategory,
        description,
        db.expenses,
        db.profile.currency
      );

      const newExpense: Expense = {
        id: `exp-${Date.now()}`,
        amount: amtVal,
        category: finalCategory,
        date,
        description,
        isAnomaly: anomalyAnalysis.isAnomaly,
        anomalyReason: anomalyAnalysis.warningMessage
      };

      db.expenses.unshift(newExpense);

      // C. Trigger Notification if Anomaly Detected or Category Warning
      if (anomalyAnalysis.isAnomaly && anomalyAnalysis.warningMessage) {
        const newNotification: Notification = {
          id: `n-${Date.now()}`,
          type: "warning",
          message: anomalyAnalysis.warningMessage,
          date: new Date().toISOString(),
          read: false
        };
        db.notifications.unshift(newNotification);
      }

      // Optional budget limit warning check
      const monthlyBudget = db.budgets.find((b: any) => b.category === "all")?.amount || 30000;
      const currentMonth = date.substring(0, 7);
      const totalMonthSpent = db.expenses
        .filter((e: any) => e.date.startsWith(currentMonth))
        .reduce((sum: number, e: any) => sum + e.amount, 0);

      if (totalMonthSpent > monthlyBudget) {
        const warningNotification: Notification = {
          id: `n-budget-${Date.now()}`,
          type: "warning",
          message: `🚨 Budget Alert: Your total spent this month (${db.profile.currency}${totalMonthSpent}) has exceeded your overall budget limit of ${db.profile.currency}${monthlyBudget}!`,
          date: new Date().toISOString(),
          read: false
        };
        db.notifications.unshift(warningNotification);
      }

      req.saveUserDB(db);
      res.json({ 
        success: true, 
        item: newExpense, 
        usedAICategorization,
        detectedAnomaly: anomalyAnalysis.isAnomaly,
        db 
      });
    } catch (err: any) {
      console.error("Error adding expense:", err);
      res.status(500).json({ error: "Failed to add expense", message: err.message });
    }
  });

  // 6. Delete Expense
  app.delete("/api/expense/:id", (req: any, res) => {
    try {
      const { id } = req.params;
      const db = req.userDB;
      
      const index = db.expenses.findIndex((item: any) => item.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Expense record not found." });
      }

      db.expenses.splice(index, 1);
      req.saveUserDB(db);
      res.json({ success: true, db });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete expense", message: err.message });
    }
  });

  // 7. Update Expense Category / Fields (Allows user correction)
  app.put("/api/expense/:id", (req: any, res) => {
    try {
      const { id } = req.params;
      const { amount, description, category, date } = req.body;
      const db = req.userDB;

      const item = db.expenses.find((e: any) => e.id === id);
      if (!item) {
        return res.status(404).json({ error: "Expense record not found" });
      }

      if (amount !== undefined) item.amount = Number(amount);
      if (description !== undefined) item.description = description;
      if (category !== undefined) item.category = category;
      if (date !== undefined) item.date = date;

      // Recalculate anomaly if fields changed
      item.isAnomaly = false;
      delete item.anomalyReason;

      req.saveUserDB(db);
      res.json({ success: true, item, db });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update expense", message: err.message });
    }
  });

  // 8. Set / Update Budget
  app.post("/api/budget", (req: any, res) => {
    try {
      const { amount, category, month } = req.body;
      if (!amount || !category || !month) {
        return res.status(400).json({ error: "Missing budget inputs" });
      }

      const db = req.userDB;
      const existingBudget = db.budgets.find((b: any) => b.category === category && b.month === month);

      if (existingBudget) {
        existingBudget.amount = Number(amount);
      } else {
        db.budgets.push({
          id: `b-${Date.now()}`,
          amount: Number(amount),
          category,
          month
        });
      }

      req.saveUserDB(db);
      res.json({ success: true, db });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to save budget limit", message: err.message });
    }
  });

  // 9. Delete Category Budget
  app.delete("/api/budget/:id", (req: any, res) => {
    try {
      const { id } = req.params;
      const db = req.userDB;
      const index = db.budgets.findIndex((b: any) => b.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Budget not found" });
      }
      db.budgets.splice(index, 1);
      req.saveUserDB(db);
      res.json({ success: true, db });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete budget limit", message: err.message });
    }
  });

  // 10. Add Savings Goal
  app.post("/api/savings-goals", (req: any, res) => {
    try {
      const { title, targetAmount, currentAmount, deadline } = req.body;
      if (!title || !targetAmount || !deadline) {
        return res.status(400).json({ error: "Missing required goal fields" });
      }

      const db = req.userDB;
      const newGoal: SavingsGoal = {
        id: `g-${Date.now()}`,
        title,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount) || 0,
        deadline
      };

      db.savingsGoals.push(newGoal);
      req.saveUserDB(db);
      res.json({ success: true, item: newGoal, db });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to add goal", message: err.message });
    }
  });

  // 11. Update Savings Goal (Add funds or modify goal)
  app.put("/api/savings-goals/:id", (req: any, res) => {
    try {
      const { id } = req.params;
      const { currentAmount, targetAmount, title, deadline } = req.body;
      const db = req.userDB;

      const goal = db.savingsGoals.find((g: any) => g.id === id);
      if (!goal) {
        return res.status(404).json({ error: "Savings goal not found" });
      }

      if (currentAmount !== undefined) goal.currentAmount = Number(currentAmount);
      if (targetAmount !== undefined) goal.targetAmount = Number(targetAmount);
      if (title !== undefined) goal.title = title;
      if (deadline !== undefined) goal.deadline = deadline;

      // Celebrate if completed
      if (goal.currentAmount >= goal.targetAmount) {
        const celebration: Notification = {
          id: `n-goal-${Date.now()}`,
          type: "success",
          message: `🎉 Goal Achieved! Fantastic job, you have fully saved ${db.profile.currency}${goal.targetAmount} for your "${goal.title}" goal!`,
          date: new Date().toISOString(),
          read: false
        };
        db.notifications.unshift(celebration);
      }

      req.saveUserDB(db);
      res.json({ success: true, item: goal, db });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update savings goal", message: err.message });
    }
  });

  // 12. Delete Savings Goal
  app.delete("/api/savings-goals/:id", (req: any, res) => {
    try {
      const { id } = req.params;
      const db = req.userDB;
      const index = db.savingsGoals.findIndex((g: any) => g.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Goal not found" });
      }
      db.savingsGoals.splice(index, 1);
      req.saveUserDB(db);
      res.json({ success: true, db });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete savings goal", message: err.message });
    }
  });

  // 13. Clear All Notifications
  app.post("/api/notifications/clear", (req: any, res) => {
    try {
      const db = req.userDB;
      db.notifications.forEach((n: any) => n.read = true);
      req.saveUserDB(db);
      res.json({ success: true, db });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to clear notifications", message: err.message });
    }
  });

  // 14. Clear All Notifications
  app.post("/api/notifications/delete", (req: any, res) => {
    try {
      const db = req.userDB;
      db.notifications = [];
      req.saveUserDB(db);
      res.json({ success: true, db });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to delete notifications", message: err.message });
    }
  });

  // 15. AI Forecast Endpoint (Real-time Gemini Insight generation)
  app.get("/api/ai/forecast", async (req: any, res) => {
    try {
      const db = req.userDB;
      const forecast = await getBudgetPredictionAndForecast(
        db.expenses,
        db.budgets,
        db.profile
      );
      res.json(forecast);
    } catch (err: any) {
      res.status(500).json({ error: "AI Forecasting failed", message: err.message });
    }
  });

  // 16. AI Smart Recommendations Endpoint
  app.get("/api/ai/recommendations", async (req: any, res) => {
    try {
      const db = req.userDB;
      const recommendations = await getSmartSavingRecommendations(
        db.expenses,
        db.budgets,
        db.savingsGoals,
        db.profile
      );
      res.json({ recommendations });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch AI recommendations", message: err.message });
    }
  });

  // 17. Manual AI Categorization Test Helper
  app.post("/api/ai/categorize", async (req: any, res) => {
    try {
      const { description, amount } = req.body;
      if (!description) {
        return res.status(400).json({ error: "Description is required" });
      }
      const category = await autoCategorizeExpense(description, Number(amount) || 100);
      res.json({ category });
    } catch (err: any) {
      res.status(500).json({ error: "AI Categorization failed", message: err.message });
    }
  });


  // ==================== VITE MIDDLEWARE SETUP ====================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BudgetWise Backend] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical server bootstrap failure:", error);
});
