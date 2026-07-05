import React, { useState } from "react";
import { Budget, VALID_CATEGORIES } from "../types";
import { Sliders, Plus, Trash2, CheckCircle } from "lucide-react";

interface BudgetPlannerProps {
  budgets: Budget[];
  onSetBudget: (amount: number, category: string, month: string) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
  currency: string;
  activeMonth: string;
}

export default function BudgetPlanner({
  budgets,
  onSetBudget,
  onDeleteBudget,
  currency,
  activeMonth,
}: BudgetPlannerProps) {
  const [category, setCategory] = useState("all");
  const [amount, setAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showAllMonths, setShowAllMonths] = useState(false);

  const formatMonthYear = (monthStr: string) => {
    if (!monthStr || monthStr.length !== 7) return monthStr;
    const [year, month] = monthStr.split("-");
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthIdx = parseInt(month, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${monthNames[monthIdx]} ${year}`;
    }
    return monthStr;
  };

  const displayedBudgets = showAllMonths
    ? budgets
    : budgets.filter((b) => b.month === activeMonth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setIsSaving(true);
    setMsg(null);
    try {
      await onSetBudget(Number(amount), category, activeMonth);
      setAmount("");
      setMsg("Budget limit updated successfully!");
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert("Failed to save budget: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 text-[#1A1A1A]">
      <div className="border-b border-[#1A1A1A]/10 pb-4">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 block">PLANNING</span>
        <h2 className="text-2xl font-serif italic text-[#1A1A1A] mt-1">Budget Limit Planner</h2>
        <p className="text-xs text-[#1A1A1A]/60 font-serif italic mt-0.5">
          Establish limits to prevent overspending and fuel your goals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form setup */}
        <div className="lg:col-span-4 bg-white rounded-none border border-[#1A1A1A]/10 p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.03)] h-fit space-y-5">
          <div className="border-b border-[#1A1A1A]/10 pb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Entry</span>
            <h3 className="font-serif italic text-base">Set Budget Bracket</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
                Target Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs font-bold text-[#1A1A1A]/80 focus:outline-none cursor-pointer"
              >
                <option value="all">Overall Monthly Budget</option>
                {VALID_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} Limit
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 mb-2">
                Limit Amount ({currency})
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                required
                min="1"
                className="w-full px-4 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs font-semibold focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(26,26,26,0.15)] flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-[1px] active:shadow-none transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              {isSaving ? "Saving..." : "Establish Limit"}
            </button>

            {msg && (
              <p className="text-[11px] font-serif italic text-green-800 bg-green-50 p-2.5 border border-green-200 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-700" />
                {msg}
              </p>
            )}
          </form>
        </div>

        {/* List of active limits */}
        <div className="lg:col-span-8 bg-white rounded-none border border-[#1A1A1A]/10 p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.03)] space-y-4">
          <div className="border-b border-[#1A1A1A]/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">ACTIVE BUDGET LIMITS</span>
              <h3 className="font-serif italic text-base">
                {showAllMonths ? "All Budget Limits" : `Active Budgets for ${formatMonthYear(activeMonth)}`}
              </h3>
            </div>
            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => setShowAllMonths(!showAllMonths)}
              className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 border border-[#1A1A1A]/20 hover:border-[#1A1A1A] hover:bg-[#1A1A1A]/5 transition-all cursor-pointer rounded-none"
            >
              {showAllMonths ? "Show This Month Only" : "Show All Months"}
            </button>
          </div>
          
          <div className="divide-y divide-[#1A1A1A]/10 max-h-[400px] overflow-y-auto pr-2">
            {displayedBudgets.map((b) => (
              <div key={b.id} className="py-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#1A1A1A] text-xs uppercase tracking-wider">
                    {b.category === "all" ? "Overall Month Limit" : `${b.category} Budget`}
                  </h4>
                  <p className="text-[11px] text-[#1A1A1A]/50 font-serif italic">Month: {formatMonthYear(b.month)}</p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-[#1A1A1A] text-xs">
                    {currency}
                    {b.amount.toLocaleString()}
                  </span>
                  {/* Delete button */}
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this budget limit?")) {
                        onDeleteBudget(b.id);
                      }
                    }}
                    className="p-1.5 bg-transparent hover:bg-red-50 text-[#1A1A1A]/40 hover:text-red-700 border border-[#1A1A1A]/10 hover:border-red-200 rounded-none transition-colors cursor-pointer"
                    title="Remove Limit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {displayedBudgets.length === 0 && (
              <div className="py-12 text-center text-[#1A1A1A]/50 text-xs font-serif italic">
                No active budget limits configured yet. Set limits using the entry form.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
