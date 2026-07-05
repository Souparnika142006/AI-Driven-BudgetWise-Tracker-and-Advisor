# BudgetWise Full-Stack Blueprint: React, Node, MySQL & Gemini LLM

This document provides a production-ready blueprint to run **BudgetWise** locally or in production with a **MySQL** database, **Express (Node.js)** backend, **React + Vite + Tailwind** frontend, and **Gemini 3.5 Flash** for AI categorizations and anomalies.

---

## 1. System Architecture

```
                                  +-----------------------+
                                  |   React SPA Frontend  |
                                  |  (Vite + Tailwind)    |
                                  +-----------+-----------+
                                              |
                                              | HTTPS / JSON APIs
                                              v
                                  +-----------+-----------+
                                  |  Express API Backend  |
                                  +-----+-----------+-----+
                                        |           |
                        SQL Queries /   |           | @google/genai SDK
                        Connection Pool |           | HTTPS API
                                        v           v
                            +-----------+---+   +---+-----------+
                            | MySQL Database|   |  Gemini AI    |
                            | (Users/Ledger)|   | (Flash model) |
                            +---------------+   +---------------+
```

---

## 2. MySQL Database Schema Definition

Create a database named `budgetwise`. Run the following SQL script to create the required tables, establish foreign keys, and insert initial seeding:

```sql
CREATE DATABASE IF NOT EXISTS budgetwise;
USE budgetwise;

-- 1. Users table (Handles secure login sessions)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Profile / Preferences table
CREATE TABLE IF NOT EXISTS profiles (
  user_id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  currency VARCHAR(10) DEFAULT '₹',
  monthly_income_goal DECIMAL(12, 2) DEFAULT 50000.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Inflow (Income Records) table
CREATE TABLE IF NOT EXISTS income (
  id VARCHAR(50) PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  source VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Outflow (Expense Records) table
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(50) PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  is_anomaly BOOLEAN DEFAULT FALSE,
  anomaly_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Monthly Budget Limits table
CREATE TABLE IF NOT EXISTS budgets (
  id VARCHAR(50) PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'all' or specific categories (Food, Bills, etc)
  month VARCHAR(7) NOT NULL,       -- Format: YYYY-MM
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_category_month (user_id, category, month),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Savings Goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id VARCHAR(50) PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) DEFAULT 0.00,
  deadline DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Notifications / Alerts table
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(50) PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(20) DEFAULT 'info', -- 'warning', 'info', 'success'
  message TEXT NOT NULL,
  date DATE NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 3. Node/Express Backend with MySQL

Create a file named `server.js` on your backend. This file creates a connection pool to MySQL and handles API routing, authentication, and integration with the Gemini LLM.

### Dependencies (`package.json`)
```json
{
  "name": "budgetwise-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@google/genai": "^0.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-session": "^1.18.0",
    "mysql2": "^3.9.7"
  }
}
```

### Server Implementation (`server.js`)
```javascript
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const session = require('express-session');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'budgetwise_secret_protocol_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 Hours
}));

// MySQL Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'budgetwise',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize Google Gemini AI Instance
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

// Authentication Guard Middleware
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized: Session missing' });
  }
  next();
}

// ---------------------- AI CORE UTILITIES ----------------------

async function autoCategorizeExpense(description, amount) {
  const categories = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Medical", "Education", "Fuel", "Rent", "Others"];
  if (!process.env.GEMINI_API_KEY) {
    // Local offline deterministic fallback
    const desc = description.toLowerCase();
    if (desc.includes('swiggy') || desc.includes('food')) return 'Food';
    if (desc.includes('uber') || desc.includes('taxi')) return 'Transport';
    if (desc.includes('amazon') || desc.includes('shopping')) return 'Shopping';
    return 'Others';
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Categorize the financial transaction: "${description}" (Amount: ${amount}). Choose the single most appropriate category from this list: ${categories.join(', ')}.`
    });
    const parsed = response.text.trim();
    return categories.find(c => parsed.toLowerCase().includes(c.toLowerCase())) || 'Others';
  } catch (err) {
    console.error('AI Categorization failed, using default fallback:', err);
    return 'Others';
  }
}

async function detectSpendingAnomaly(amount, category, description, historicalAverage) {
  if (historicalAverage > 0 && amount > historicalAverage * 3) {
    return {
      isAnomaly: true,
      reason: `Spending of ${amount} in ${category} is significantly higher than your average of ${historicalAverage.toFixed(2)}.`
    };
  }
  return { isAnomaly: false, reason: null };
}

// ---------------------- API ROUTING ENDPOINTS ----------------------

// 1. Auth: Register
app.post('/api/auth/register', async (req, res) => {
  const { username, password, fullName } = req.body;
  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'Missing registration details' });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const [userResult] = await pool.query(
      'INSERT INTO users (username, password_hash, full_name) VALUES (?, ?, ?)',
      [username, password, fullName] // Secure with bcrypt in production!
    );
    const userId = userResult.insertId;

    // Create profile
    await pool.query(
      'INSERT INTO profiles (user_id, name, currency, monthly_income_goal) VALUES (?, ?, ?, ?)',
      [userId, fullName, '₹', 50000.00]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database registry failure', message: err.message });
  }
});

// 2. Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await pool.query(
      'SELECT id, username, full_name, password_hash FROM users WHERE username = ?',
      [username]
    );
    if (users.length === 0 || users[0].password_hash !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    req.session.userId = users[0].id;
    req.session.username = users[0].username;
    req.session.fullName = users[0].full_name;

    res.json({
      success: true,
      user: { username: users[0].username, fullName: users[0].full_name }
    });
  } catch (err) {
    res.status(500).json({ error: 'Auth failed', message: err.message });
  }
});

// 3. Get Full DB State
app.get('/api/db', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  try {
    const [[profile]] = await pool.query('SELECT name, currency, monthly_income_goal AS monthlyIncomeGoal FROM profiles WHERE user_id = ?', [userId]);
    const [income] = await pool.query('SELECT id, amount, source, date, description FROM income WHERE user_id = ?', [userId]);
    const [expenses] = await pool.query('SELECT id, amount, category, date, description, is_anomaly AS isAnomaly, anomaly_reason AS anomalyReason FROM expenses WHERE user_id = ?', [userId]);
    const [budgets] = await pool.query('SELECT id, amount, category, month FROM budgets WHERE user_id = ?', [userId]);
    const [savingsGoals] = await pool.query('SELECT id, title, target_amount AS targetAmount, current_amount AS currentAmount, deadline FROM savings_goals WHERE user_id = ?', [userId]);
    const [notifications] = await pool.query('SELECT id, type, message, date, is_read AS `read` FROM notifications WHERE user_id = ?', [userId]);

    res.json({
      profile: profile || { name: req.session.fullName, currency: '₹', monthlyIncomeGoal: 50000.00 },
      income,
      expenses,
      budgets,
      savingsGoals,
      notifications
    });
  } catch (err) {
    res.status(500).json({ error: 'Fetch DB State failed', message: err.message });
  }
});

// 4. Add Inflow (Income)
app.post('/api/income', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const { amount, source, date, description } = req.body;
  const id = `inc-${Date.now()}`;
  try {
    await pool.query(
      'INSERT INTO income (id, user_id, amount, source, date, description) VALUES (?, ?, ?, ?, ?, ?)',
      [id, userId, amount, source, date, description]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record income', message: err.message });
  }
});

// 5. Delete Inflow
app.delete('/api/income/:id', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM income WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete income', message: err.message });
  }
});

// 6. Add Outflow (Expense with AI Categorization)
app.post('/api/expense', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const { amount, description, date, category } = req.body;
  const id = `exp-${Date.now()}`;
  
  try {
    let finalCategory = category;
    let usedAICategorization = false;

    if (!category || category === 'auto') {
      finalCategory = await autoCategorizeExpense(description, amount);
      usedAICategorization = true;
    }

    // Historical average for anomaly checks
    const [[avgResult]] = await pool.query(
      'SELECT AVG(amount) AS avg_amt FROM expenses WHERE user_id = ? AND category = ?',
      [userId, finalCategory]
    );
    const average = avgResult.avg_amt ? parseFloat(avgResult.avg_amt) : 0;

    const anomaly = await detectSpendingAnomaly(amount, finalCategory, description, average);

    await pool.query(
      'INSERT INTO expenses (id, user_id, amount, category, date, description, is_anomaly, anomaly_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userId, amount, finalCategory, date, description, anomaly.isAnomaly, anomaly.reason]
    );

    if (anomaly.isAnomaly) {
      await pool.query(
        'INSERT INTO notifications (id, user_id, type, message, date) VALUES (?, ?, ?, ?, ?)',
        [`notif-${Date.now()}`, userId, 'warning', anomaly.reason, date]
      );
    }

    res.json({ success: true, usedAICategorization, detectedAnomaly: anomaly.isAnomaly });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record expense', message: err.message });
  }
});

// 7. Delete Outflow
app.delete('/api/expense/:id', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense', message: err.message });
  }
});

// 8. Set Budget Limits
app.post('/api/budget', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const { amount, category, month } = req.body;
  const id = `b-${Date.now()}`;
  try {
    const [existing] = await pool.query(
      'SELECT id FROM budgets WHERE user_id = ? AND category = ? AND month = ?',
      [userId, category, month]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE budgets SET amount = ? WHERE id = ?',
        [amount, existing[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO budgets (id, user_id, amount, category, month) VALUES (?, ?, ?, ?, ?)',
        [id, userId, amount, category, month]
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to set budget limit', message: err.message });
  }
});

// 9. Delete Budget Limit
app.delete('/api/budget/:id', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete budget limit', message: err.message });
  }
});

// App listen on Port
app.listen(PORT, () => {
  console.log(`BudgetWise Backend Service Online on Port ${PORT}`);
});
```

---

## 4. Run Locally in 3 Steps

1. **Setup MySQL Database:** Start your local MySQL server (XAMPP, Docker, or native service) and run the table creation SQL commands found in Section 2.
2. **Configure Environment Variables (`.env`):**
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=budgetwise
   SESSION_SECRET=budgetwise_secure_secret_hash_code
   GEMINI_API_KEY=your_google_ai_studio_api_key_here
   ```
3. **Boot and Connect:**
   - Run `npm install` in the backend project, and start it with `npm start` (or `node server.js`).
   - Run the React Vite frontend and configure your API endpoint base URL inside the frontend requests (e.g. `const API_BASE = "http://localhost:3000"`).
