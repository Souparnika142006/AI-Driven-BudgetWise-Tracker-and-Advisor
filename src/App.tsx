import React, { useEffect, useState } from "react";
import { DBState, Income, Expense, Budget, SavingsGoal, Notification, UserProfile } from "./types";
import BudgetOverview from "./components/BudgetOverview";
import TransactionForm from "./components/TransactionForm";
import TransactionHistory from "./components/TransactionHistory";
import BudgetPlanner from "./components/BudgetPlanner";
import SavingsGoalsTracker from "./components/SavingsGoalsTracker";
import ReportDashboard from "./components/ReportDashboard";
import AISuggestions from "./components/AISuggestions";
import NotificationCenter from "./components/NotificationCenter";
import LoginScreen from "./components/LoginScreen";
import { 
  Sparkles, 
  Brain, 
  Wallet, 
  Target, 
  Sliders, 
  PieChart as PieIcon, 
  User, 
  Menu, 
  X, 
  LogOut, 
  ChevronRight, 
  RefreshCw, 
  HelpCircle,
  PiggyBank,
  Calendar
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<{ username: string; fullName: string } | null>(() => {
    const cached = localStorage.getItem("budgetwise_user");
    return cached ? JSON.parse(cached) : null;
  });

  const [dbState, setDbState] = useState<DBState | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "budget" | "goals" | "analytics" | "ai">("overview");
  
  // Selected Month/Year active context (defaults to system time e.g., 2026-07)
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedMonth, setSelectedMonth] = useState<string>("07");

  // Profile editing modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileCurrency, setProfileCurrency] = useState("₹");
  const [profileGoal, setProfileGoal] = useState("");

  const [loading, setLoading] = useState(false);

  // Authenticated fetch helper
  const userFetch = async (url: string, options: RequestInit = {}) => {
    if (!user) {
      throw new Error("No authenticated user context found.");
    }
    const headers = {
      ...(options.headers || {}),
      "X-User-ID": user.username,
      "Authorization": `Bearer ${user.username}`,
    };
    return fetch(url, { ...options, headers });
  };

  // 1. Fetch DB State on load
  const fetchDB = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await userFetch("/api/db");
      if (!res.ok) throw new Error("Failed to load records from database.");
      const data: DBState = await res.json();
      setDbState(data);
      
      // Initialize profile form
      setProfileName(data.profile.name);
      setProfileCurrency(data.profile.currency);
      setProfileGoal(data.profile.monthlyIncomeGoal.toString());
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDB();
    } else {
      setDbState(null);
    }
  }, [user]);

  // Auth Action Handlers
  const handleLoginSuccess = (username: string, fullName: string) => {
    const session = { username, fullName };
    localStorage.setItem("budgetwise_user", JSON.stringify(session));
    setUser(session);
  };

  const handleLogout = () => {
    localStorage.removeItem("budgetwise_user");
    setUser(null);
    setDbState(null);
  };

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading && !dbState) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex flex-col items-center justify-center space-y-4">
        <Sparkles className="w-12 h-12 text-[#1A1A1A] animate-spin" />
        <p className="text-sm font-semibold font-serif italic text-slate-700">Loading BudgetWise Workspace...</p>
        <p className="text-xs text-slate-400 font-mono">Restoring ledger database and establishing user session link.</p>
      </div>
    );
  }

  // Fallback if dbState is not yet loaded
  if (!dbState) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex flex-col items-center justify-center space-y-4">
        <Sparkles className="w-12 h-12 text-[#1A1A1A] animate-spin" />
        <p className="text-sm font-semibold font-serif italic text-slate-700">Connecting Database...</p>
      </div>
    );
  }

  const { profile, income, expenses, budgets, savingsGoals, notifications } = dbState;
  const currency = profile.currency;
  const activeMonthYearStr = `${selectedYear}-${selectedMonth}`;

  // Filtered lists based on active Month and Year Context!
  const filteredIncome = income.filter(item => item.date.startsWith(activeMonthYearStr));
  const filteredExpenses = expenses.filter(item => item.date.startsWith(activeMonthYearStr));
  const filteredBudgets = budgets.filter(item => item.month === activeMonthYearStr);

  // ==================== DATABASE MUTATION ACTIONS ====================

  // Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await userFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          currency: profileCurrency,
          monthlyIncomeGoal: Number(profileGoal),
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile changes.");
      
      // Reload db
      await fetchDB();
      setShowProfileModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Add Income
  const handleAddIncome = async (amount: number, source: string, date: string, description: string) => {
    const res = await userFetch("/api/income", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, source, date, description }),
    });
    if (!res.ok) throw new Error("Inflow addition failed.");
    await fetchDB();
  };

  // Delete Income
  const handleDeleteIncome = async (id: string) => {
    const res = await userFetch(`/api/income/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Deletion failed.");
    await fetchDB();
  };

  // Add Expense
  const handleAddExpense = async (amount: number, description: string, date: string, category: string) => {
    const res = await userFetch("/api/expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, description, date, category }),
    });
    if (!res.ok) throw new Error("Outflow addition failed.");
    const data = await res.json();
    await fetchDB();
    return {
      success: data.success,
      usedAICategorization: data.usedAICategorization,
      detectedAnomaly: data.detectedAnomaly,
    };
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    const res = await userFetch(`/api/expense/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Deletion failed.");
    await fetchDB();
  };

  // Correct AI Categorization (User feedback loop!)
  const handleUpdateExpenseCategory = async (id: string, category: string) => {
    const res = await userFetch(`/api/expense/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category }),
    });
    if (!res.ok) throw new Error("Correction failed.");
    await fetchDB();
  };

  // Set Category/All Budget Limits
  const handleSetBudget = async (amount: number, category: string, month: string) => {
    const res = await userFetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, category, month }),
    });
    if (!res.ok) throw new Error("Budget limit update failed.");
    await fetchDB();
  };

  // Delete Budget Limit
  const handleDeleteBudget = async (id: string) => {
    const res = await userFetch(`/api/budget/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Deletion failed.");
    await fetchDB();
  };

  // Add Savings Goal
  const handleAddGoal = async (title: string, targetAmount: number, currentAmount: number, deadline: string) => {
    const res = await userFetch("/api/savings-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, targetAmount, currentAmount, deadline }),
    });
    if (!res.ok) throw new Error("Saving goal setup failed.");
    await fetchDB();
  };

  // Update Savings Goal (Fuel Goal)
  const handleUpdateGoal = async (id: string, currentAmount: number) => {
    const res = await userFetch(`/api/savings-goals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAmount }),
    });
    if (!res.ok) throw new Error("Goal update failed.");
    await fetchDB();
  };

  // Delete Savings Goal
  const handleDeleteGoal = async (id: string) => {
    const res = await userFetch(`/api/savings-goals/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Deletion failed.");
    await fetchDB();
  };

  // Clear Alerts
  const handleClearNotifications = async () => {
    const res = await userFetch("/api/notifications/clear", { method: "POST" });
    if (!res.ok) throw new Error("Failed to clear notifications");
    await fetchDB();
  };

  const handleDeleteNotifications = async () => {
    const res = await userFetch("/api/notifications/delete", { method: "POST" });
    if (!res.ok) throw new Error("Failed to clear history");
    await fetchDB();
  };

  // ==================== AI ENDPOINT DISPATCHERS ====================

  const handleFetchForecast = async () => {
    const res = await userFetch("/api/ai/forecast");
    if (!res.ok) throw new Error("Forecasting failed.");
    return await res.json();
  };

  const handleFetchRecommendations = async () => {
    const res = await userFetch("/api/ai/recommendations");
    if (!res.ok) throw new Error("Suggestions fetch failed.");
    const data = await res.json();
    return data.recommendations;
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#1A1A1A] antialiased font-sans flex flex-col selection:bg-[#1A1A1A]/10">
           {/* 1. Main Header / Editorial Header */}
      <header className="sticky top-0 bg-[#F8F7F3] border-b border-[#1A1A1A]/10 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          
          {/* Logo / Editorial Brand */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/50">Financial Intelligence Platform</span>
            <h1 className="text-4xl font-serif italic tracking-tight leading-none mt-1 text-[#1A1A1A]">BudgetWise</h1>
          </div>

          {/* Right Header Navigation / Status bar */}
          <div className="flex items-center gap-4 self-end sm:self-auto">
            
            {/* Active Month/Year Context Selector Dropdown */}
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 mb-1">Active Ledger Context</span>
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-[#1A1A1A]/10 text-xs">
                <Calendar className="w-3.5 h-3.5 text-[#1A1A1A]/60" />
                <div className="flex items-center gap-1">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent font-mono font-bold text-[#1A1A1A] text-[11px] focus:outline-none cursor-pointer uppercase border-none py-0 pl-0 pr-1 text-center"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="01">Jan</option>
                    <option value="02">Feb</option>
                    <option value="03">Mar</option>
                    <option value="04">Apr</option>
                    <option value="05">May</option>
                    <option value="06">Jun</option>
                    <option value="07">Jul</option>
                    <option value="08">Aug</option>
                    <option value="09">Sep</option>
                    <option value="10">Oct</option>
                    <option value="11">Nov</option>
                    <option value="12">Dec</option>
                  </select>
                  <span className="text-[#1A1A1A]/20">/</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="bg-transparent font-mono font-bold text-[#1A1A1A] text-[11px] focus:outline-none cursor-pointer border-none py-0 pl-1 pr-1 text-center"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI Warning Bell notifications */}
            <NotificationCenter 
              notifications={notifications}
              onClearAll={handleClearNotifications}
              onDeleteAll={handleDeleteNotifications}
              currency={currency}
            />

            {/* Profile Toggle */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 pl-3 pr-4 py-2 bg-white hover:bg-[#F0EEE6] border border-[#1A1A1A]/10 rounded-none transition-all duration-150 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] cursor-pointer shadow-[2px_2px_0px_0px_rgba(26,26,26,0.1)] active:translate-y-[1px]"
              title="Edit User Profile"
            >
              <div className="w-5 h-5 bg-[#1A1A1A] text-white rounded-none flex items-center justify-center font-mono text-[10px]">
                {profile.name ? profile.name[0] : user.username[0].toUpperCase()}
              </div>
              <span>{profile.name || user.fullName}</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2.5 bg-white hover:bg-rose-50 hover:text-rose-700 border border-[#1A1A1A]/10 rounded-none transition-all duration-150 text-[#1A1A1A]/60 cursor-pointer shadow-[2px_2px_0px_0px_rgba(26,26,26,0.1)] active:translate-y-[1px]"
              title="End Secure Session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Secondary Tab Bar Navigation / Editorial Tab Rail */}
      <nav className="bg-[#F8F7F3] border-b border-[#1A1A1A]/10 sticky top-[88px] z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex gap-1 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "overview"
                ? "border-[#1A1A1A] text-[#1A1A1A]"
                : "border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab("budget")}
            className={`py-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "budget"
                ? "border-[#1A1A1A] text-[#1A1A1A]"
                : "border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
            }`}
          >
            Budget Limits
          </button>

          <button
            onClick={() => setActiveTab("goals")}
            className={`py-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "goals"
                ? "border-[#1A1A1A] text-[#1A1A1A]"
                : "border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
            }`}
          >
            Savings Goals
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`py-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "analytics"
                ? "border-[#1A1A1A] text-[#1A1A1A]"
                : "border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
            }`}
          >
            Analytics Report
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`py-4 px-4 text-[10px] font-bold uppercase tracking-[0.2em] border-b-2 cursor-pointer whitespace-nowrap transition-all ${
              activeTab === "ai"
                ? "border-b-2 border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-indigo-600/70 hover:text-indigo-600"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              AI Advisor
            </span>
          </button>
        </div>
      </nav>

      {/* 3. Primary Dashboard Viewport */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {activeTab === "overview" && (
          <div className="space-y-8">
            
            {/* KPI overview banner card */}
            <BudgetOverview 
              allIncome={income}
              income={filteredIncome} 
              expenses={filteredExpenses} 
              budgets={filteredBudgets} 
              currency={currency} 
              activeMonth={activeMonthYearStr}
              monthlyIncomeGoal={profile.monthlyIncomeGoal}
            />

            {/* Middle Workspace: Double Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form Input */}
              <div className="lg:col-span-4 h-fit sticky top-48">
                <TransactionForm 
                  onAddIncome={handleAddIncome}
                  onAddExpense={handleAddExpense}
                  currency={currency}
                />
              </div>

              {/* Transaction Logs list */}
              <div className="lg:col-span-8">
                <TransactionHistory 
                  income={income}
                  expenses={expenses}
                  onDeleteIncome={handleDeleteIncome}
                  onDeleteExpense={handleDeleteExpense}
                  onUpdateExpenseCategory={handleUpdateExpenseCategory}
                  currency={currency}
                  activeMonth={activeMonthYearStr}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "budget" && (
          <BudgetPlanner 
            budgets={budgets}
            onSetBudget={handleSetBudget}
            onDeleteBudget={handleDeleteBudget}
            currency={currency}
            activeMonth={activeMonthYearStr}
          />
        )}

        {activeTab === "goals" && (
          <SavingsGoalsTracker 
            goals={savingsGoals}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            currency={currency}
          />
        )}

        {activeTab === "analytics" && (
          <ReportDashboard 
            income={filteredIncome}
            expenses={filteredExpenses}
            budgets={filteredBudgets}
            currency={currency}
            activeMonth={activeMonthYearStr}
          />
        )}

        {activeTab === "ai" && (
          <AISuggestions 
            expenses={filteredExpenses}
            currency={currency}
            onFetchForecast={handleFetchForecast}
            onFetchRecommendations={handleFetchRecommendations}
          />
        )}

      </main>

      {/* Bottom Micro-Bar / Editorial Footer */}
      <footer className="bg-[#1A1A1A] text-white flex flex-col md:flex-row items-center justify-between px-10 py-8 text-[9px] uppercase tracking-[0.3em] gap-4 mt-20">
        <div className="flex space-x-8">
          <span>Analytics Engine 2.1</span>
          <span className="opacity-50">Operational</span>
        </div>
        <div className="flex space-x-8 text-center md:text-right">
          <span className="opacity-50">Secure Auth (JWT)</span>
          <span>BudgetWise Protocol &copy; 2026</span>
        </div>
      </footer>

      {/* User profile settings customizer modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#F8F7F3] border border-[#1A1A1A] max-w-md w-full p-8 shadow-2xl space-y-6 text-[#1A1A1A]">
            <div className="flex justify-between items-end pb-3 border-b border-[#1A1A1A]/10">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Configuration</span>
                <h3 className="font-serif italic text-2xl">Profile Settings</h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1 text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5 rounded-none cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-[#1A1A1A]/20 text-xs font-semibold text-[#1A1A1A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
                    Currency Symbol
                  </label>
                  <select
                    value={profileCurrency}
                    onChange={(e) => setProfileCurrency(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#1A1A1A]/20 text-xs font-bold text-[#1A1A1A] focus:outline-none cursor-pointer"
                  >
                    <option value="₹">₹ (INR)</option>
                    <option value="$">$ (USD)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="£">£ (GBP)</option>
                    <option value="¥">¥ (JPY)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
                    Monthly Salary Goal
                  </label>
                  <input
                    type="number"
                    value={profileGoal}
                    onChange={(e) => setProfileGoal(e.target.value)}
                    required
                    min="1"
                    className="w-full px-4 py-3 bg-white border border-[#1A1A1A]/20 text-xs font-semibold text-[#1A1A1A] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-[10px] font-bold uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Apply Profile Settings
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
