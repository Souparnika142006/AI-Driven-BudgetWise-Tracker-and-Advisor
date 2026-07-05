import { useState } from "react";
import { Income, Expense, VALID_CATEGORIES } from "../types";
import { Search, Filter, Trash2, Calendar, Tag, DollarSign, Edit } from "lucide-react";

interface TransactionHistoryProps {
  income: Income[];
  expenses: Expense[];
  onDeleteIncome: (id: string) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onUpdateExpenseCategory: (id: string, category: string) => Promise<void>;
  currency: string;
  activeMonth?: string;
}

export default function TransactionHistory({
  income,
  expenses,
  onDeleteIncome,
  onDeleteExpense,
  onUpdateExpenseCategory,
  currency,
  activeMonth,
}: TransactionHistoryProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "expenses" | "incomes">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAllMonths, setShowAllMonths] = useState(false);
  
  // Track which expense is being edited for category correction
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Combine transactions for uniform listing
  const combinedList = [
    ...income.map((i) => ({
      id: i.id,
      type: "income",
      amount: i.amount,
      category: "Income",
      date: i.date,
      description: i.description,
      isAnomaly: false,
    })),
    ...expenses.map((e) => ({
      id: e.id,
      type: "expense",
      amount: e.amount,
      category: e.category,
      date: e.date,
      description: e.description,
      isAnomaly: e.isAnomaly,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // Filter list
  const filteredList = combinedList.filter((t) => {
    const matchesMonth = showAllMonths || !activeMonth || t.date.startsWith(activeMonth);
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      filterType === "all" ||
      (filterType === "expenses" && t.type === "expense") ||
      (filterType === "incomes" && t.type === "income");
    const matchesCategory =
      categoryFilter === "all" || t.category === categoryFilter;

    return matchesMonth && matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="bg-white rounded-none border border-[#1A1A1A]/10 p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.03)] space-y-6 text-[#1A1A1A]">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#1A1A1A]/10">
        <div className="space-y-1">
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">LEDGER LOGS</span>
          <h3 className="font-serif italic text-xl">Transaction History</h3>
          <p className="text-xs text-[#1A1A1A]/60 font-serif italic">
            Full history of cash flows. View, filter, and adjust AI classification logs below.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex bg-[#1A1A1A]/5 p-1 rounded-none text-[10px] font-bold uppercase tracking-wider">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-none cursor-pointer transition-all ${
              filterType === "all" ? "bg-[#1A1A1A] text-white" : "text-[#1A1A1A]/50 hover:text-[#1A1A1A]"
            }`}
          >
            All Logs
          </button>
          <button
            onClick={() => setFilterType("expenses")}
            className={`px-3 py-1.5 rounded-none cursor-pointer transition-all ${
              filterType === "expenses" ? "bg-red-950 text-white" : "text-[#1A1A1A]/50 hover:text-red-950"
            }`}
          >
            Outflows
          </button>
          <button
            onClick={() => setFilterType("incomes")}
            className={`px-3 py-1.5 rounded-none cursor-pointer transition-all ${
              filterType === "incomes" ? "bg-green-950 text-white" : "text-[#1A1A1A]/50 hover:text-green-950"
            }`}
          >
            Inflows
          </button>
        </div>
      </div>

      {/* Inputs Search & Category Dropdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
        {/* Search */}
        <div className="relative md:col-span-5">
          <Search className="w-3.5 h-3.5 text-[#1A1A1A]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
          />
        </div>

        {/* Category select filter */}
        <div className="relative md:col-span-3">
          <Filter className="w-3 h-3 text-[#1A1A1A]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-2.5 bg-white border border-[#1A1A1A]/20 text-xs font-bold text-[#1A1A1A]/70 focus:outline-none cursor-pointer"
          >
            <option value="all">All Brackets</option>
            {VALID_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Show All Months Checkbox */}
        <div className="md:col-span-4 flex items-center justify-end">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 hover:text-[#1A1A1A] bg-[#1A1A1A]/5 px-3 py-2.5 border border-[#1A1A1A]/10 w-full md:w-auto justify-center md:justify-start">
            <input
              type="checkbox"
              id="show-all-months-checkbox"
              checked={showAllMonths}
              onChange={(e) => setShowAllMonths(e.target.checked)}
              className="w-4 h-4 rounded-none border-[#1A1A1A]/20 accent-[#1A1A1A] cursor-pointer"
            />
            <span>Show All Months</span>
          </label>
        </div>
      </div>

      {/* Transaction Records List */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#1A1A1A]/15 text-left text-[#1A1A1A]/50">
              <th className="py-3 px-2 text-[9px] font-bold uppercase tracking-[0.18em]">Date</th>
              <th className="py-3 px-2 text-[9px] font-bold uppercase tracking-[0.18em]">Description</th>
              <th className="py-3 px-2 text-[9px] font-bold uppercase tracking-[0.18em]">Category</th>
              <th className="py-3 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-right">Amount</th>
              <th className="py-3 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A1A]/10 font-sans">
            {filteredList.map((t) => (
              <tr key={t.id} className="hover:bg-[#F0EEE6]/40 transition-colors group">
                {/* Date */}
                <td className="py-4 px-2 text-xs font-mono font-semibold text-[#1A1A1A]/60">
                  {t.date}
                </td>

                {/* Description */}
                <td className="py-4 px-2">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#1A1A1A] break-all">{t.description}</p>
                    {t.isAnomaly && (
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-red-200">
                        🚨 Outlier Spike
                      </span>
                    )}
                  </div>
                </td>

                {/* Category + Category Modification */}
                <td className="py-4 px-2">
                  {editingExpenseId === t.id ? (
                    <select
                      value={t.category}
                      onChange={async (e) => {
                        const newCat = e.target.value;
                        await onUpdateExpenseCategory(t.id, newCat);
                        setEditingExpenseId(null);
                      }}
                      onBlur={() => setEditingExpenseId(null)}
                      autoFocus
                      className="px-2 py-1 bg-white border border-[#1A1A1A] text-xs font-semibold focus:outline-none cursor-pointer rounded-none"
                    >
                      {VALID_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 border rounded-none ${
                          t.type === "income"
                            ? "bg-green-50 text-green-800 border-green-200"
                            : t.isAnomaly
                            ? "bg-red-50 text-red-800 border-red-200"
                            : "bg-[#1A1A1A]/5 text-[#1A1A1A] border-[#1A1A1A]/10"
                        }`}
                      >
                        {t.category}
                      </span>
                      {t.type === "expense" && (
                        <button
                          onClick={() => setEditingExpenseId(t.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#1A1A1A]/50 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5 transition-all cursor-pointer"
                          title="Correct Category Classification"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </td>

                {/* Amount */}
                <td className="py-4 px-2 text-right">
                  <span
                    className={`text-xs font-mono font-bold ${
                      t.type === "income" ? "text-green-800" : "text-[#1A1A1A]"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {currency}
                    {t.amount.toLocaleString()}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-4 px-2 text-right">
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this record?")) {
                        if (t.type === "income") {
                          onDeleteIncome(t.id);
                        } else {
                          onDeleteExpense(t.id);
                        }
                      }
                    }}
                    className="p-1.5 text-[#1A1A1A]/40 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-none transition-colors cursor-pointer"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {filteredList.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[#1A1A1A]/50 text-xs font-serif italic">
                  No recorded transactions found matching current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
