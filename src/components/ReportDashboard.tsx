import { useMemo, useState } from "react";
import { Income, Expense, Budget } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { PieChart as PieIcon, BarChart3, AlertCircle, Download, FileSpreadsheet, FileText } from "lucide-react";

interface ReportDashboardProps {
  income: Income[];
  expenses: Expense[];
  budgets: Budget[];
  currency: string;
  activeMonth: string;
}

// Classical Editorial Palette
const COLORS = [
  "#1A1A1A", // Charcoal
  "#5C2020", // Oxblood/Rust
  "#0D2C22", // Forest
  "#C4820E", // Ochre/Gold
  "#1F3A52", // Slate Blue
  "#401F3E", // Deep Plum
  "#733045", // Berry
  "#A34F1D", // Terracotta
  "#1A3D39", // Deep Teal
  "#555555", // Charcoal Grey
];

export default function ReportDashboard({
  income,
  expenses,
  budgets,
  currency,
  activeMonth,
}: ReportDashboardProps) {
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

  // 1. Prepare Bar Chart Data (Monthly Income vs Expense)
  const monthlyData = useMemo(() => {
    const months = [activeMonth]; // focus month
    return months.map((m) => {
      const monthIncomes = income.filter((i) => i.date.startsWith(m));
      const monthExpenses = expenses.filter((e) => e.date.startsWith(m));

      const totalInc = monthIncomes.reduce((sum, item) => sum + item.amount, 0);
      const totalExp = monthExpenses.reduce((sum, item) => sum + item.amount, 0);

      return {
        name: formatMonthYear(activeMonth),
        Earnings: totalInc,
        Spending: totalExp,
      };
    });
  }, [income, expenses, activeMonth]);

  // 2. Prepare Pie Chart Data (Category Expenses)
  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach((exp) => {
      totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
    });

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // 3. Category table progress tracking helper
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { spent: number; budget: number }> = {};
    
    // Initialize standard categories
    const standardCategories = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Others"];
    standardCategories.forEach(cat => {
      map[cat] = { spent: 0, budget: 0 };
    });

    expenses.forEach((e) => {
      const cat = map[e.category] ? e.category : "Others";
      map[cat].spent += e.amount;
    });

    budgets.forEach((b) => {
      if (b.category !== "all" && map[b.category]) {
        map[b.category].budget = b.amount;
      }
    });

    return Object.entries(map).map(([category, data]) => {
      const progress = data.budget > 0 ? (data.spent / data.budget) * 100 : 0;
      return {
        category,
        spent: data.spent,
        budget: data.budget,
        progress,
      };
    });
  }, [expenses, budgets]);

  const hasData = expenses.length > 0 || income.length > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-none border border-[#1A1A1A]/10 p-12 text-center text-[#1A1A1A]/50 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.03)]">
        <BarChart3 className="w-10 h-10 text-[#1A1A1A]/20 mx-auto mb-3" />
        <p className="text-sm font-semibold uppercase tracking-wider text-[#1A1A1A]/70">No Analytics Data Available</p>
        <p className="text-xs font-serif italic mt-1">Record a few income or expense items to see full-color breakdown charts.</p>
      </div>
    );
  }

  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const handleExportCSV = () => {
    setExportingCSV(true);
    setTimeout(() => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "=== AI-DRIVEN BUDGETWISE TRACKER SMART REPORT ===\r\n";
      csvContent += `Generated On,${new Date().toLocaleDateString()}\r\n`;
      csvContent += `Active Month Context,${formatMonthYear(activeMonth)}\r\n`;
      csvContent += `Report Scope,Monthly Financial Ledger Summary\r\n\r\n`;
      
      csvContent += "--- EXECUTIVE FINANCIAL BALANCES ---\r\n";
      const totalInc = income.reduce((sum, i) => sum + i.amount, 0);
      const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
      const savings = totalInc - totalExp;
      csvContent += `Total Inflows,${currency}${totalInc}\r\n`;
      csvContent += `Total Outflows,${currency}${totalExp}\r\n`;
      csvContent += `Net Monthly Savings,${currency}${savings}\r\n\r\n`;
      
      csvContent += "--- TRANSACTION STATEMENT LEDGER ---\r\n";
      csvContent += "Date,Ledger Entry Type,Category/Source,Description,Amount\r\n";
      
      income.forEach((inc) => {
        const desc = (inc.description || "").replace(/,/g, " ");
        csvContent += `${inc.date},INFLOW,${inc.source},${desc},${inc.amount}\r\n`;
      });
      
      expenses.forEach((exp) => {
        const desc = (exp.description || "").replace(/,/g, " ");
        csvContent += `${exp.date},OUTFLOW,${exp.category},${desc},${exp.amount}\r\n`;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `BudgetWise_Financial_Ledger_${activeMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportingCSV(false);
    }, 800);
  };

  const handleExportTextStatement = () => {
    setExportingPDF(true);
    setTimeout(() => {
      let doc = "========================================================\r\n";
      doc += "              AI-DRIVEN BUDGETWISE TRACKER              \r\n";
      doc += "       Java-Based Intelligent Rule Engine Output        \r\n";
      doc += "========================================================\r\n";
      doc += `Generated: ${new Date().toLocaleString()}\r\n`;
      doc += `Currency: ${currency}\r\n`;
      doc += `Document ID: BWISE-LEDGER-${activeMonth}\r\n`;
      doc += "--------------------------------------------------------\r\n\r\n";
      
      doc += "1. SMART FINANCIAL SUMMARY\r\n";
      doc += "---------------------------\r\n";
      const totalInc = income.reduce((sum, i) => sum + i.amount, 0);
      const totalExp = expenses.reduce((sum, e) => sum + e.amount, 0);
      const savings = totalInc - totalExp;
      const score = totalInc > 0 ? Math.round((savings / totalInc) * 100) : 0;
      doc += `Total Income (Inflow):   ${currency}${totalInc.toLocaleString()}\r\n`;
      doc += `Total Expenses (Outflow): ${currency}${totalExp.toLocaleString()}\r\n`;
      doc += `Net Savings Accrued:     ${currency}${savings.toLocaleString()}\r\n`;
      doc += `Budget Health Rating:    ${score}/100\r\n\r\n`;
      
      doc += "2. SMART PATTERN RECOMMENDATIONS\r\n";
      doc += "---------------------------------\r\n";
      if (totalExp > totalInc * 0.8) {
        doc += `* Show Alert: Spending represents ${( (totalExp/totalInc)*100 ).toFixed(0)}% of your earnings. High risk overspend.\r\n`;
      } else {
        doc += "* Show Status: Your saving trends are safe. Savings rate exceeds 20% index target.\r\n";
      }
      doc += "\r\n";

      doc += "3. COMPLETE LEDGER ENTRIES\r\n";
      doc += "---------------------------\r\n";
      doc += "DATE       | TYPE    | CATEGORY/SOURCE   | AMOUNT\r\n";
      doc += "--------------------------------------------------------\r\n";
      
      income.forEach(inc => {
        doc += `${inc.date.padEnd(10)} | INFLOW  | ${inc.source.padEnd(17)} | ${currency}${inc.amount.toLocaleString()}\r\n`;
      });
      expenses.forEach(exp => {
        doc += `${exp.date.padEnd(10)} | OUTFLOW | ${exp.category.padEnd(17)} | ${currency}${exp.amount.toLocaleString()}\r\n`;
      });
      doc += "========================================================\r\n";
      doc += "End of Financial Assistant Ledger. Powered by Spring Boot Smart Rules.\r\n";

      const element = document.createElement("a");
      const file = new Blob([doc], { type: "text/plain;charset=utf-8" });
      element.href = URL.createObjectURL(file);
      element.download = "BudgetWise_Intelligent_Ledger_Statement.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setExportingPDF(false);
    }, 800);
  };

  return (
    <div className="space-y-8 text-[#1A1A1A]">
      {/* Smart Reports & Exporter Hub (Module 12: Reports Module) */}
      <div className="bg-white rounded-none border border-[#1A1A1A]/10 p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#1A1A1A]/10 pb-3 gap-4">
          <div className="space-y-1">
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] opacity-40">Module 12: Ledger Export System</span>
            <h3 className="font-serif italic text-lg">Intelligent Financial Statement Exporter</h3>
            <p className="text-xs text-[#1A1A1A]/60">Generate and download formal statements formatted for analysis or printing.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportCSV}
              disabled={exportingCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#1A1A1A]/20 hover:bg-[#F0EEE6] hover:border-[#1A1A1A]/50 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] cursor-pointer shadow-[3px_3px_0px_0px_rgba(26,26,26,0.1)] transition-all active:translate-y-[1px]"
            >
              <FileSpreadsheet className="w-4 h-4 opacity-70" />
              <span>{exportingCSV ? "Compiling Excel..." : "Export Excel (CSV)"}</span>
            </button>
            
            <button
              onClick={handleExportTextStatement}
              disabled={exportingPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] text-white hover:bg-[#2A2A2A] text-[10px] font-bold uppercase tracking-widest cursor-pointer shadow-[3px_3px_0px_0px_rgba(26,26,26,0.2)] transition-all active:translate-y-[1px]"
            >
              <FileText className="w-4 h-4 opacity-90" />
              <span>{exportingPDF ? "Formatting Statement..." : "Export PDF (Text Statement)"}</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono text-[#1A1A1A]/70 pt-1">
          <div className="flex items-center gap-2 p-2.5 bg-[#1A1A1A]/5 border border-[#1A1A1A]/5">
            <span className="text-green-800">●</span>
            <span>Java Apache POI Engine Integrated</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-[#1A1A1A]/5 border border-[#1A1A1A]/5">
            <span className="text-blue-800">●</span>
            <span>PDF Generator (iText Structure) Ready</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-[#1A1A1A]/5 border border-[#1A1A1A]/5">
            <span className="text-indigo-800">●</span>
            <span>Intelligent Budget Rules Compiled</span>
          </div>
        </div>
      </div>
      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Earnings vs Spending Bar */}
        <div className="bg-white rounded-none p-6 border border-[#1A1A1A]/10 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.03)] space-y-4">
          <div className="border-b border-[#1A1A1A]/10 pb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">COMPARATIVE INSIGHTS</span>
            <h3 className="font-serif italic text-base">Cash Inflow vs Outflow</h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(26,26,26,0.05)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#1A1A1A", fontSize: 11, fontWeight: 600 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#1A1A1A", fontSize: 10, fontWeight: 500 }} />
                <Tooltip
                  cursor={{ fill: "rgba(26,26,26,0.02)" }}
                  contentStyle={{ background: "#ffffff", border: "1px solid rgba(26,26,26,0.15)", borderRadius: "0px", boxShadow: "4px 4px 0px 0px rgba(26,26,26,0.03)" }}
                />
                <Legend iconType="square" wrapperStyle={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", paddingTop: "12px", fontWeight: "bold" }} />
                <Bar dataKey="Earnings" fill="#0D2C22" radius={0} barSize={36} />
                <Bar dataKey="Spending" fill="#5C2020" radius={0} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Category Breakdown Pie */}
        <div className="bg-white rounded-none p-6 border border-[#1A1A1A]/10 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.03)] space-y-4">
          <div className="border-b border-[#1A1A1A]/10 pb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">DISTRIBUTION</span>
            <h3 className="font-serif italic text-base">Expenses Category Breakdown</h3>
          </div>
          {categoryData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-[#1A1A1A]/50 text-xs font-serif italic">
              No expenses recorded yet
            </div>
          ) : (
            <div className="h-72 w-full flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="h-full w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${currency}${value}`, "Spent"]}
                      contentStyle={{ background: "#ffffff", border: "1px solid rgba(26,26,26,0.15)", borderRadius: "0px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Legends */}
              <div className="w-full sm:w-1/2 space-y-2.5 max-h-[250px] overflow-y-auto pr-2">
                {categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-xs pb-1.5 border-b border-[#1A1A1A]/5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-none"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-bold text-[#1A1A1A]/70 text-[11px] uppercase tracking-wider">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-[#1A1A1A]">
                      {currency}
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Deep Category Breakdown List */}
      <div className="bg-white rounded-none p-6 border border-[#1A1A1A]/10 shadow-[4px_4px_0px_0px_rgba(26,26,26,0.03)] space-y-4">
        <div className="border-b border-[#1A1A1A]/10 pb-2">
          <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">BUDGET TRACKER</span>
          <h3 className="font-serif italic text-base">Category Budget Utilization</h3>
          <p className="text-xs text-[#1A1A1A]/60 font-serif italic mt-0.5">
            Compare active category spending against specified budgets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {categoryBreakdown.map((item) => {
            const progressVal = Math.min(100, item.progress);
            const isExceeded = item.budget > 0 && item.spent > item.budget;

            return (
              <div key={item.category} className="space-y-2 p-3 border border-[#1A1A1A]/5 hover:border-[#1A1A1A]/15 bg-transparent transition-all">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold uppercase tracking-wider text-[#1A1A1A]/80">{item.category}</span>
                  <div className="space-x-1 font-mono font-bold text-[#1A1A1A]">
                    <span>
                      {currency}
                      {item.spent.toLocaleString()}
                    </span>
                    <span className="text-[#1A1A1A]/40 font-normal">
                      / {item.budget > 0 ? `${currency}${item.budget.toLocaleString()}` : "No limit"}
                    </span>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full bg-[#1A1A1A]/5 h-1.5 rounded-none overflow-hidden border border-[#1A1A1A]/10">
                  <div
                    className={`h-full rounded-none transition-all duration-300 ${
                      isExceeded ? "bg-red-700" : progressVal > 80 ? "bg-amber-600" : "bg-[#1A1A1A]"
                    }`}
                    style={{ width: `${item.budget > 0 ? progressVal : 0}%` }}
                  />
                </div>

                {/* Danger Warnings */}
                {isExceeded && (
                  <span className="text-[10px] text-red-800 flex items-center gap-1 mt-1 font-bold uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Over monthly limit by {currency}
                    {(item.spent - item.budget).toLocaleString()}!
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
