import React, { useState } from "react";
import { VALID_CATEGORIES } from "../types";
import { PlusCircle, Wallet, ArrowDownCircle, ArrowUpCircle, Brain, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TransactionFormProps {
  onAddIncome: (amount: number, source: string, date: string, description: string) => Promise<void>;
  onAddExpense: (
    amount: number,
    description: string,
    date: string,
    category: string
  ) => Promise<{ success: boolean; usedAICategorization: boolean; detectedAnomaly: boolean }>;
  currency: string;
}

export default function TransactionForm({
  onAddIncome,
  onAddExpense,
  currency,
}: TransactionFormProps) {
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("auto"); // Default is auto!
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !description || !date) {
      alert("Please fill out all fields with valid values.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      if (activeTab === "income") {
        await onAddIncome(Number(amount), description, date, description);
        setSuccessMessage(`Successfully added ${currency}${amount} to your Income!`);
        setAmount("");
        setDescription("");
      } else {
        const result = await onAddExpense(
          Number(amount),
          description,
          date,
          category // can be "auto" or manual category
        );

        if (result.success) {
          let msg = `Successfully added expense of ${currency}${amount}.`;
          if (result.usedAICategorization) {
            msg += ` AI classified this under appropriate categories.`;
          }
          if (result.detectedAnomaly) {
            msg += ` ⚠️ Unusual spending spike flagged by AI! Check alerts.`;
          }
          setSuccessMessage(msg);
          setAmount("");
          setDescription("");
        }
      }
    } catch (err: any) {
      alert("Failed to save transaction: " + err.message);
    } finally {
      setIsSubmitting(false);
      // clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  return (
    <div className="bg-white rounded-none shadow-[4px_4px_0px_0px_rgba(26,26,26,0.03)] border border-[#1A1A1A]/10 p-6 space-y-6">
      <div className="border-b border-[#1A1A1A]/10 pb-3 flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Post Entry</span>
          <h3 className="font-serif italic text-lg text-[#1A1A1A]">Record Transaction</h3>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex bg-[#1A1A1A]/5 p-1 rounded-none">
        <button
          onClick={() => {
            setActiveTab("expense");
            setSuccessMessage(null);
          }}
          className={`flex-1 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "expense"
              ? "bg-[#1A1A1A] text-white"
              : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
          }`}
        >
          Expense Entry
        </button>
        <button
          onClick={() => {
            setActiveTab("income");
            setSuccessMessage(null);
          }}
          className={`flex-1 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === "income"
              ? "bg-[#1A1A1A] text-white"
              : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
          }`}
        >
          Income Entry
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-[#1A1A1A]">
        {/* Amount Input */}
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
            Amount ({currency})
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40 font-semibold font-mono text-xs">
              {currency}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              min="0.01"
              step="any"
              className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs font-mono font-semibold focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>
        </div>

        {/* Description / Title */}
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              activeTab === "expense"
                ? "e.g. Swiggy Lunch, Uber Taxi..."
                : "e.g. Monthly Salary, Freelance project..."
            }
            required
            className="w-full px-4 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs font-semibold placeholder-[#1A1A1A]/30 focus:outline-none focus:border-[#1A1A1A]"
          />
        </div>

        {/* Expense-only AI Categorization Toggle */}
        {activeTab === "expense" && (
          <div className="space-y-2 pt-1">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 flex items-center justify-between">
              <span>Category Selection</span>
              <span className="text-[9px] text-indigo-600 flex items-center gap-1 font-semibold">
                <Brain className="w-2.5 h-2.5" /> AI Engine Active
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory("auto")}
                className={`py-2 px-2.5 rounded-none border text-[10px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  category === "auto"
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                    : "bg-white border-[#1A1A1A]/20 text-[#1A1A1A]/60 hover:border-[#1A1A1A]"
                }`}
              >
                <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />
                AI Auto-Classify
              </button>
              <div className="relative">
                <select
                  value={category === "auto" ? "" : category}
                  onChange={(e) => setCategory(e.target.value || "auto")}
                  className={`w-full py-2 px-2.5 bg-white border text-[10px] font-bold uppercase tracking-wide rounded-none focus:outline-none cursor-pointer ${
                    category !== "auto"
                      ? "border-indigo-300 text-indigo-700"
                      : "border-[#1A1A1A]/20 text-[#1A1A1A]/40"
                  }`}
                >
                  <option value="">-- Manual Category --</option>
                  {VALID_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {category === "auto" && (
              <p className="text-[11px] font-serif italic text-indigo-950 bg-indigo-50/50 p-2.5 border border-indigo-100 flex gap-1.5 items-start">
                <Brain className="w-3.5 h-3.5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <span>
                  BudgetWise AI automatically scans the description and maps it into standard budget categories at record time.
                </span>
              </p>
            )}
          </div>
        )}

        {/* Date Selector */}
        <div>
          <label className="block text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
            Transaction Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs font-semibold focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 rounded-none font-bold text-[10px] uppercase tracking-widest text-white shadow-[2px_2px_0px_0px_rgba(26,26,26,0.15)] flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-y-[1px] active:shadow-none ${
            isSubmitting
              ? "bg-slate-400 cursor-not-allowed"
              : activeTab === "expense"
              ? "bg-[#1A1A1A] hover:bg-[#2A2A2A]"
              : "bg-green-800 hover:bg-green-900"
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          {isSubmitting
            ? "Processing..."
            : activeTab === "expense"
            ? "Record Outflow"
            : "Record Inflow"}
        </button>

        {/* Success Feedback Alert */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`p-3 rounded-none border text-[11px] font-serif italic text-center ${
                activeTab === "expense"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-green-50 border-green-200 text-green-800"
              }`}
            >
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
